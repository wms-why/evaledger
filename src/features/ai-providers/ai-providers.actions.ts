/**
 * Admin-gated server fns for the AI provider registry.
 *
 * Six fns:
 *   - `listAiProvidersFn`            — all rows for the admin UI
 *   - `upsertAiProviderFn`           — insert (id omitted) or update (id present)
 *   - `deleteAiProviderFn`           — remove a row
 *   - `setAiProviderEnabledFn`       — toggle the enabled switch
 *   - `reorderAiProviderFn`          — move a row up or down in priority
 *   - `pingAiProviderFn`             — call checkHealth + checkBalance, return snapshot
 *
 * All fns: `await assertAdmin()` first, then operate on D1 + KV. Tests run in
 * the workers pool against real D1 / KV bindings (see
 * `ai-providers.server.workers.test.ts`).
 */
import { createServerFn } from '@tanstack/react-start'
import { env } from '@/lib/env'
import { createDb } from '@/db/client'
import { assertAdmin } from '@/features/admin/assert-admin.server'
import {
  listAllByPriority,
  upsertProvider,
  setEnabled,
  deleteProvider,
  reorderByPriority,
  getProviderById,
} from './ai-providers.server'
import { buildAdapter, resolveCtx } from './providers'
import type { ProviderKind } from './ai-providers.shared'

export const listAiProvidersFn = createServerFn({ method: 'GET' }).handler(async () => {
  await assertAdmin()
  const rows = await listAllByPriority(createDb(env.DB))
  // Strip Date → serializable for the client.
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.getTime() : Number(r.createdAt),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.getTime() : Number(r.updatedAt),
    lastErrorAt: r.lastErrorAt instanceof Date ? r.lastErrorAt.getTime() : Number(r.lastErrorAt),
  }))
})

export const upsertAiProviderFn = createServerFn({ method: 'POST' })
  .validator((d: {
    id?: string
    kind: string
    label: string
    model: string
    baseUrlOverride?: string | null
    enabled?: boolean
    priority: number
    maxTokensCap?: number | null
  }) => ({
    id: typeof d.id === 'string' ? d.id : undefined,
    kind: d.kind as ProviderKind,
    label: typeof d.label === 'string' ? d.label.slice(0, 200) : '',
    model: typeof d.model === 'string' ? d.model.slice(0, 200) : '',
    baseUrlOverride: typeof d.baseUrlOverride === 'string' ? d.baseUrlOverride : null,
    enabled: typeof d.enabled === 'boolean' ? d.enabled : true,
    priority: typeof d.priority === 'number' ? Math.trunc(d.priority) : 100,
    maxTokensCap: typeof d.maxTokensCap === 'number' ? Math.trunc(d.maxTokensCap) : null,
  }))
  .handler(async ({ data }) => {
    await assertAdmin()
    const row = await upsertProvider(createDb(env.DB), data, Date.now())
    return { id: row.id }
  })

export const deleteAiProviderFn = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => ({ id: typeof d.id === 'string' ? d.id : '' }))
  .handler(async ({ data }): Promise<{ deleted: boolean }> => {
    await assertAdmin()
    return { deleted: await deleteProvider(createDb(env.DB), data.id) }
  })

export const setAiProviderEnabledFn = createServerFn({ method: 'POST' })
  .validator((d: { id: string; enabled: boolean }) => ({
    id: typeof d.id === 'string' ? d.id : '',
    enabled: d.enabled === true,
  }))
  .handler(async ({ data }): Promise<void> => {
    await assertAdmin()
    await setEnabled(createDb(env.DB), data.id, data.enabled, Date.now())
  })

export const reorderAiProviderFn = createServerFn({ method: 'POST' })
  .validator((d: { id: string; direction: 'up' | 'down' }) => ({
    id: typeof d.id === 'string' ? d.id : '',
    direction: (d.direction === 'down' ? 'down' : 'up') as 'up' | 'down',
  }))
  .handler(async ({ data }): Promise<{ swapped: boolean }> => {
    await assertAdmin()
    const row = await reorderByPriority(createDb(env.DB), data.id, data.direction, Date.now())
    return { swapped: row !== null }
  })

/** "Test connection" — runs the adapter's checkHealth + checkBalance so the
 *  admin can verify the row is wired correctly without triggering the
 *  selector. Returns a structured result regardless of outcome; UI shows the
 *  detail string verbatim. */
export const pingAiProviderFn = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => ({ id: typeof d.id === 'string' ? d.id : '' }))
  .handler(async ({ data }): Promise<{
    health: { ok: boolean; detail?: string }
    balance: { ok: boolean; remaining?: number | string; currency?: string; detail?: string }
  }> => {
    await assertAdmin()
    const row = await getProviderById(createDb(env.DB), data.id)
    if (!row) {
      return {
        health: { ok: false, detail: 'provider not found' },
        balance: { ok: false, detail: 'provider not found' },
      }
    }
    const ctx = await resolveCtx(row)
    if (!ctx) {
      return {
        health: { ok: false, detail: `no ${row.kind.toUpperCase().replace('-', '_')}_API_KEY secret` },
        balance: { ok: false, detail: 'no API key secret' },
      }
    }
    const adapter = buildAdapter(row)
    const [health, balance] = await Promise.all([adapter.checkHealth(ctx), adapter.checkBalance(ctx)])
    return { health, balance }
  })
