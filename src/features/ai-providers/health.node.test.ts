/**
 * Tests for the health snapshot subsystem. We use a hand-rolled KV stub
 * (object with get/put) so this can run in the node pool without miniflare.
 *
 * Branches covered:
 *   - round-trip: writeHealth then readHealth returns the same shape
 *   - malformed JSON → null (don't crash the selector)
 *   - isReachable falls open on null / stale / non-ok-when-fresh
 *   - recordSuccess writes status='ok'
 *   - recordFailure maps FailureKind → HealthStatus correctly
 *     (out-of-funds preserved; fatal/transient/network → 'unreachable')
 */
import { describe, it, expect } from 'vitest'
import {
  readHealth,
  writeHealth,
  isReachable,
  recordSuccess,
  recordFailure,
  healthKey,
  HEALTH_TTL_SEC,
  type HealthSnapshot,
} from './health'
import type { FailureKind } from './ai-providers.shared'

function makeKV() {
  const store = new Map<string, { body: string; expiresAt?: number }>()
  return {
    store,
    async get(key: string): Promise<string | null> {
      const entry = store.get(key)
      if (!entry) return null
      if (entry.expiresAt && entry.expiresAt <= Date.now()) {
        store.delete(key)
        return null
      }
      return entry.body
    },
    async put(key: string, body: string, opts?: { expirationTtl?: number }): Promise<void> {
      const entry: { body: string; expiresAt?: number } = { body }
      if (opts?.expirationTtl !== undefined) {
        entry.expiresAt = Date.now() + opts.expirationTtl * 1000
      }
      store.set(key, entry)
    },
  }
}

describe('health KV subsystem', () => {
  it('round-trips a snapshot through write → read', async () => {
    const kv = makeKV()
    const snap: HealthSnapshot = { status: 'ok', detail: '12ms', recordedAt: 1000 }
    await writeHealth(kv as unknown as KVNamespace, 'p1', snap)
    const read = await readHealth(kv as unknown as KVNamespace, 'p1')
    expect(read).toEqual(snap)
  })

  it('returns null on malformed JSON', async () => {
    const kv = makeKV()
    kv.store.set(healthKey('p2'), { body: 'not-json' })
    const read = await readHealth(kv as unknown as KVNamespace, 'p2')
    expect(read).toBeNull()
  })

  it('isReachable falls open when snapshot is missing', async () => {
    const kv = makeKV()
    expect(await isReachable(kv as unknown as KVNamespace, 'missing', { staleMs: 30_000 })).toBe(true)
  })

  it('isReachable falls open when snapshot is stale', async () => {
    const kv = makeKV()
    await writeHealth(kv as unknown as KVNamespace, 'p3', {
      status: 'unreachable',
      detail: 'old',
      recordedAt: 0, // 1970
    })
    expect(await isReachable(kv as unknown as KVNamespace, 'p3', { staleMs: 30_000 })).toBe(true)
  })

  it('isReachable returns false on a fresh out-of-funds snapshot', async () => {
    const kv = makeKV()
    const now = 1_000_000
    await writeHealth(kv as unknown as KVNamespace, 'p4', {
      status: 'out-of-funds',
      detail: 'insufficient',
      recordedAt: now,
    })
    expect(await isReachable(kv as unknown as KVNamespace, 'p4', { staleMs: 30_000, now: () => now })).toBe(false)
  })

  it('isReachable returns true on a fresh ok snapshot', async () => {
    const kv = makeKV()
    const now = 1_000_000
    await writeHealth(kv as unknown as KVNamespace, 'p5', { status: 'ok', recordedAt: now })
    expect(await isReachable(kv as unknown as KVNamespace, 'p5', { staleMs: 30_000, now: () => now })).toBe(true)
  })

  it('recordSuccess writes status=ok with the latency', async () => {
    const kv = makeKV()
    await recordSuccess(kv as unknown as KVNamespace, 'p6', 42, 100)
    const read = await readHealth(kv as unknown as KVNamespace, 'p6')
    expect(read?.status).toBe('ok')
    expect(read?.detail).toBe('42ms')
    expect(read?.recordedAt).toBe(100)
  })

  it('recordFailure maps out-of-funds → out-of-funds, others → unreachable', async () => {
    const kv = makeKV()
    await recordFailure(kv as unknown as KVNamespace, 'p7', 'out-of-funds', 'no credits', 200)
    const oof = await readHealth(kv as unknown as KVNamespace, 'p7')
    expect(oof?.status).toBe('out-of-funds')
    expect(oof?.detail).toBe('no credits')

    const cases: FailureKind[] = ['fatal', 'transient', 'network']
    for (const k of cases) {
      await recordFailure(kv as unknown as KVNamespace, 'p7', k, k, 200)
      const r = await readHealth(kv as unknown as KVNamespace, 'p7')
      expect(r?.status).toBe('unreachable')
    }
  })

  it('TTL is set on writes', async () => {
    const kv = makeKV()
    await writeHealth(kv as unknown as KVNamespace, 'p8', { status: 'ok', recordedAt: 1 })
    expect(kv.store.get(healthKey('p8'))?.expiresAt).toBeDefined()
    expect(HEALTH_TTL_SEC).toBe(300)
  })
})
