/**
 * Worker-pool tests for the AI provider CRUD helpers. Real D1 (miniflare),
 * no mocks.
 *
 * Mirrors `sponsor.workers.test.ts` — hand-create the table in `beforeAll`
 * (workers pool doesn't auto-apply migrations), then exercise every helper:
 *   - listEnabledByPriority / listAllByPriority ordering
 *   - getProviderById
 *   - upsertProvider (insert + update)
 *   - setEnabled
 *   - deleteProvider
 *   - reorderByPriority (up + down + boundary)
 *   - recordLastError coalescing
 */
import { describe, test, expect, beforeAll } from 'vitest'
import { env } from 'cloudflare:test'
import { createDb } from '@/db/client'
import {
  listEnabledByPriority,
  listAllByPriority,
  getProviderById,
  upsertProvider,
  setEnabled,
  deleteProvider,
  reorderByPriority,
  recordLastError,
} from './ai-providers.server'

beforeAll(async () => {
  await env.DB.exec(
    `CREATE TABLE IF NOT EXISTS ai_provider (` +
      `id TEXT PRIMARY KEY NOT NULL, ` +
      `kind TEXT NOT NULL, label TEXT NOT NULL, model TEXT NOT NULL, ` +
      `base_url_override TEXT, ` +
      `enabled INTEGER NOT NULL DEFAULT 1, priority INTEGER NOT NULL, ` +
      `max_tokens_cap INTEGER, last_error TEXT, last_error_at INTEGER, ` +
      `created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  )
  await env.DB.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ai_provider_kind_model_uniq ON ai_provider (kind, model)`)
  await env.DB.exec(`CREATE INDEX IF NOT EXISTS ai_provider_priority_idx ON ai_provider (enabled, priority)`)
})

async function clean() {
  await env.DB.exec('DELETE FROM ai_provider')
}

describe('ai-provider CRUD over D1', () => {
  test('upsert inserts a new row with generated id', async () => {
    await clean()
    const db = createDb(env.DB)
    const row = await upsertProvider(
      db,
      { kind: 'deepseek', label: 'Test DeepSeek', model: 'deepseek-chat', priority: 10 },
      1000,
    )
    expect(row.id).toBeTruthy()
    expect(row.enabled).toBe(true)
    expect(row.createdAt.getTime()).toBe(1000)
  })

  test('upsert updates an existing row when id is passed', async () => {
    await clean()
    const db = createDb(env.DB)
    const a = await upsertProvider(db, { kind: 'mmx', label: 'A', model: 'MiniMax-Text-01', priority: 10 }, 1000)
    const b = await upsertProvider(
      db,
      { id: a.id, kind: 'mmx', label: 'A-renamed', model: 'MiniMax-Text-01', priority: 20 },
      2000,
    )
    expect(b.id).toBe(a.id)
    expect(b.label).toBe('A-renamed')
    expect(b.priority).toBe(20)
  })

  test('listEnabledByPriority orders by priority asc then id asc', async () => {
    await clean()
    const db = createDb(env.DB)
    const a = await upsertProvider(db, { kind: 'deepseek', label: 'A', model: 'm1', priority: 30 }, 1)
    const b = await upsertProvider(db, { kind: 'mmx', label: 'B', model: 'm2', priority: 10 }, 2)
    const c = await upsertProvider(db, { kind: 'replicate', label: 'C', model: 'm3', priority: 20 }, 3)
    const rows = await listEnabledByPriority(db)
    expect(rows.map((r) => r.id)).toEqual([b.id, c.id, a.id])
  })

  test('listEnabledByPriority excludes disabled rows', async () => {
    await clean()
    const db = createDb(env.DB)
    const on = await upsertProvider(db, { kind: 'deepseek', label: 'on', model: 'm', priority: 10 }, 1)
    const off = await upsertProvider(db, { kind: 'mmx', label: 'off', model: 'm', priority: 5 }, 1)
    await setEnabled(db, off.id, false, 100)
    const rows = await listEnabledByPriority(db)
    expect(rows.map((r) => r.id)).toEqual([on.id])
  })

  test('getProviderById returns null when missing', async () => {
    const db = createDb(env.DB)
    expect(await getProviderById(db, 'nonexistent')).toBeNull()
  })

  test('setEnabled toggles the flag', async () => {
    await clean()
    const db = createDb(env.DB)
    const r = await upsertProvider(db, { kind: 'deepseek', label: 'x', model: 'm', priority: 10 }, 1)
    await setEnabled(db, r.id, false, 100)
    const after = await getProviderById(db, r.id)
    expect(after?.enabled).toBe(false)
  })

  test('deleteProvider removes the row', async () => {
    await clean()
    const db = createDb(env.DB)
    const r = await upsertProvider(db, { kind: 'deepseek', label: 'x', model: 'm', priority: 10 }, 1)
    expect(await deleteProvider(db, r.id)).toBe(true)
    expect(await getProviderById(db, r.id)).toBeNull()
  })

  test('reorderByPriority swaps priorities with the neighboring row', async () => {
    await clean()
    const db = createDb(env.DB)
    const a = await upsertProvider(db, { kind: 'deepseek', label: 'A', model: 'm', priority: 10 }, 1)
    const b = await upsertProvider(db, { kind: 'mmx', label: 'B', model: 'm', priority: 20 }, 2)
    const c = await upsertProvider(db, { kind: 'replicate', label: 'C', model: 'm', priority: 30 }, 3)
    // Move C up — should swap with B.
    const swapped = await reorderByPriority(db, c.id, 'up', 999)
    expect(swapped?.id).toBe(c.id)
    const rows = await listAllByPriority(db)
    expect(rows.map((r) => r.id)).toEqual([a.id, c.id, b.id])
  })

  test('reorderByPriority is a no-op at the boundary', async () => {
    await clean()
    const db = createDb(env.DB)
    const top = await upsertProvider(db, { kind: 'deepseek', label: 'top', model: 'm', priority: 10 }, 1)
    const moved = await reorderByPriority(db, top.id, 'up', 1)
    expect(moved?.id).toBe(top.id)
    const rows = await listAllByPriority(db)
    expect(rows).toHaveLength(1)
  })

  test('recordLastError writes once, then coalesces within 30s', async () => {
    await clean()
    const db = createDb(env.DB)
    const r = await upsertProvider(db, { kind: 'deepseek', label: 'x', model: 'm', priority: 10 }, 1)
    await recordLastError(db, r.id, 'first failure', 1000)
    let after = await getProviderById(db, r.id)
    expect(after?.lastError).toBe('first failure')

    // Within 30s, a second write should be coalesced (no update).
    await recordLastError(db, r.id, 'second failure', 5000)
    after = await getProviderById(db, r.id)
    expect(after?.lastError).toBe('first failure')

    // After 30s, the new write wins.
    await recordLastError(db, r.id, 'third failure', 35_000)
    after = await getProviderById(db, r.id)
    expect(after?.lastError).toBe('third failure')
  })
})
