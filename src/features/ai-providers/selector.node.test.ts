/**
 * Selector tests — orchestrates D1 rows + KV health + provider call sites.
 *
 * Strategy: `vi.mock` the `@/lib/env`, `@/db/client`, and `./providers`
 * modules so the selector reaches our stub `loadRows` / `kv` /
 * `buildAdapter` without touching the real `cloudflare:workers` env (which
 * doesn't resolve in the node pool).
 *
 * Coverage:
 *   - empty rows → AIRuntimeError "No AI providers configured"
 *   - first row marked unreachable → falls through to second
 *   - fatal error → short-circuits the rest
 *   - transient / out-of-funds / TypeError → continues
 *   - all rows fail → aggregated error message lists every failure
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// All shared state lives in `vi.hoisted` so the vi.mock factories (which
// vitest hoists to the top of the file) can reference them without a
// "Cannot access X before initialization" ReferenceError.
const fx = vi.hoisted(() => {
  const kvStore = new Map<string, string>()
  const stubKV = {
    async get(key: string) {
      return kvStore.get(key) ?? null
    },
    async put(key: string, body: string) {
      kvStore.set(key, body)
    },
  }
  const fakeRows: Array<{
    id: string
    kind: 'mmx' | 'deepseek' | 'replicate'
    label: string
    model: string
    enabled: boolean
    priority: number
    baseUrlOverride: string | null
    maxTokensCap: number | null
  }> = []
  return { kvStore, stubKV, fakeRows }
})

vi.mock('@/lib/env', () => ({
  env: {
    CACHE: fx.stubKV,
    MMX_API_KEY: 'mmx-secret',
    DEEPSEEK_API_KEY: 'ds-secret',
    REPLICATE_API_TOKEN: 'rp-secret',
  },
}))

vi.mock('@/db/client', () => ({
  createDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => fx.fakeRows,
        }),
      }),
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  }),
}))

vi.mock('./providers', async () => {
  const { AdapterError } = await import('./providers/types')
  return {
    buildAdapter: (row: { id: string; kind: 'mmx' | 'deepseek' | 'replicate' }) => {
      const cfg = adapters.get(row.id)
      return {
        kind: row.kind,
        run: async () => {
          if (!cfg) throw new Error(`no mock for ${row.id}`)
          if (cfg.throw) {
            throw new AdapterError(cfg.throw.message ?? 'test', cfg.throw.kind, cfg.throw.status)
          }
          return { text: cfg.runResult?.text ?? 'ok', raw: cfg }
        },
        checkHealth: async () => ({ ok: true }),
        checkBalance: async () => ({ ok: true }),
      }
    },
    resolveCtx: async (row: { kind: 'mmx' | 'deepseek' | 'replicate' }) => ({
      apiKey: 'mock-key',
      baseUrl: 'https://mock',
      model: 'mock-model',
      fetch: ((_input: unknown) => Promise.resolve(new Response())) as unknown as typeof globalThis.fetch,
      kind: row.kind,
    }),
  }
})

// Local mutable registry of canned adapter behaviors. Read inside the
// mocked `buildAdapter` closure.
import { runAI, runAIString, AIRuntimeError } from './index'

const adapters = new Map<
  string,
  {
    runResult?: { text: string }
    throw?: { kind: 'fatal' | 'transient' | 'out-of-funds' | 'network'; status?: number; message?: string }
  }
>()

beforeEach(() => {
  fx.kvStore.clear()
  fx.fakeRows.length = 0
  adapters.clear()
})

function row(over: {
  id: string
  kind: 'mmx' | 'deepseek' | 'replicate'
  priority?: number
  enabled?: boolean
  maxTokensCap?: number | null
}) {
  return {
    id: over.id,
    kind: over.kind,
    label: 'L',
    model: 'm',
    baseUrlOverride: null,
    enabled: over.enabled ?? true,
    priority: over.priority ?? 10,
    maxTokensCap: over.maxTokensCap ?? null,
  }
}

describe('runAI selector', () => {
  it('throws AIRuntimeError when no providers are configured', async () => {
    await expect(runAI([{ role: 'user', content: 'x' }])).rejects.toMatchObject({
      name: 'AIRuntimeError',
      message: expect.stringContaining('No AI providers configured'),
    })
  })

  it('throws AIRuntimeError on empty messages', async () => {
    await expect(runAI([])).rejects.toBeInstanceOf(AIRuntimeError)
  })

  it('returns text from the first successful row and writes health=ok', async () => {
    fx.fakeRows.push(row({ id: 'p1', kind: 'deepseek', priority: 10 }) as never)
    adapters.set('p1', { runResult: { text: 'first' } })
    const r = await runAI([{ role: 'user', content: 'x' }])
    expect(r.text).toBe('first')
    const stored = fx.kvStore.get('ai:health:p1')
    expect(JSON.parse(stored!).status).toBe('ok')
  })

  it('falls through to the second row when the first is marked unreachable', async () => {
    fx.fakeRows.push(row({ id: 'p1', kind: 'deepseek', priority: 10 }) as never)
    fx.fakeRows.push(row({ id: 'p2', kind: 'mmx', priority: 20 }) as never)
    fx.kvStore.set('ai:health:p1', JSON.stringify({ status: 'unreachable', recordedAt: Date.now() }))
    adapters.set('p2', { runResult: { text: 'second' } })
    const r = await runAI([{ role: 'user', content: 'x' }])
    expect(r.text).toBe('second')
  })

  it('falls through to the next row on transient failure', async () => {
    fx.fakeRows.push(row({ id: 'p1', kind: 'deepseek', priority: 10 }) as never)
    fx.fakeRows.push(row({ id: 'p2', kind: 'mmx', priority: 20 }) as never)
    adapters.set('p1', { throw: { kind: 'transient', message: '429 too many' } })
    adapters.set('p2', { runResult: { text: 'fallback' } })
    const r = await runAI([{ role: 'user', content: 'x' }])
    expect(r.text).toBe('fallback')
    const stored = JSON.parse(fx.kvStore.get('ai:health:p1')!)
    expect(stored.status).toBe('unreachable')
    expect(stored.detail).toContain('429')
  })

  it('does NOT short-circuit on out-of-funds (provider self-heals)', async () => {
    fx.fakeRows.push(row({ id: 'p1', kind: 'deepseek', priority: 10 }) as never)
    fx.fakeRows.push(row({ id: 'p2', kind: 'mmx', priority: 20 }) as never)
    adapters.set('p1', { throw: { kind: 'out-of-funds', status: 402, message: 'insufficient balance' } })
    adapters.set('p2', { runResult: { text: 'still works' } })
    const r = await runAI([{ role: 'user', content: 'x' }])
    expect(r.text).toBe('still works')
    const stored = JSON.parse(fx.kvStore.get('ai:health:p1')!)
    expect(stored.status).toBe('out-of-funds')
  })

  it('short-circuits on fatal and aggregates the message', async () => {
    fx.fakeRows.push(row({ id: 'p1', kind: 'deepseek', priority: 10 }) as never)
    fx.fakeRows.push(row({ id: 'p2', kind: 'mmx', priority: 20 }) as never)
    adapters.set('p1', { throw: { kind: 'fatal', status: 400, message: 'bad schema' } })
    adapters.set('p2', { runResult: { text: 'should not run' } })
    await expect(runAI([{ role: 'user', content: 'x' }])).rejects.toMatchObject({
      name: 'AIRuntimeError',
      message: expect.stringContaining('p1'),
    })
  })

  it('aggregates all failures when every row errors', async () => {
    fx.fakeRows.push(row({ id: 'p1', kind: 'deepseek', priority: 10 }) as never)
    fx.fakeRows.push(row({ id: 'p2', kind: 'mmx', priority: 20 }) as never)
    adapters.set('p1', { throw: { kind: 'transient', message: 'fail-A' } })
    adapters.set('p2', { throw: { kind: 'transient', message: 'fail-B' } })
    await expect(runAI([{ role: 'user', content: 'x' }])).rejects.toMatchObject({
      message: expect.stringMatching(/p1:transient:fail-A.*p2:transient:fail-B/),
    })
  })

  it('treats a TypeError (network) as transient and continues', async () => {
    fx.fakeRows.push(row({ id: 'p1', kind: 'deepseek', priority: 10 }) as never)
    fx.fakeRows.push(row({ id: 'p2', kind: 'mmx', priority: 20 }) as never)
    adapters.set('p1', { throw: { kind: 'network', message: 'fetch failed' } })
    adapters.set('p2', { runResult: { text: 'recovered' } })
    const r = await runAI([{ role: 'user', content: 'x' }])
    expect(r.text).toBe('recovered')
  })

  it('runAIString wraps the prompt as a single user message', async () => {
    fx.fakeRows.push(row({ id: 'p1', kind: 'deepseek', priority: 10 }) as never)
    adapters.set('p1', { runResult: { text: 'pong' } })
    expect(await runAIString('ping')).toBe('pong')
  })
})
