/**
 * Selector — picks an AI provider per `runAI()` call and falls back through
 * the priority list within the same request.
 *
 * Algorithm:
 *   1. Load enabled rows ordered by `(priority, id)`.
 *   2. For each row in order:
 *      a. Build an `AdapterCtx` via `resolveCtx(row, ...)` — returns
 *         `undefined` when the worker's matching secret is unset
 *         (console.warn, then skip).
 *      b. Check KV health snapshot via `isReachable(...)` — if recently
 *         marked unreachable / out-of-funds, skip (falls open on null /
 *         stale so a KV outage never bricks us).
 *      c. Run the adapter; on success, write `status='ok'` to KV and return
 *         the text. On failure: classify, write the snapshot, and either
 *         continue (transient / out-of-funds / network) or break
 *         (fatal — bad schema won't fix itself on the next provider).
 *   3. If every row failed, throw `AIRuntimeError` with a per-row summary.
 *
 * The callers (`src/features/books/ai/*`) see no behavior change beyond the
 * import path; the contract is `runAI(messages, opts) → { text, raw }` plus
 * `runAIString(prompt, opts) → string`.
 */
import { eq } from 'drizzle-orm'
import { env } from '@/lib/env'
import { createDb } from '@/db/client'
import { aiProvider } from './ai-providers.schema'
import type { AIProvider } from './ai-providers.schema'
import { buildAdapter, resolveCtx } from './providers'
import type { AdapterError as AdapterErrorType } from './providers'
import { isReachable, recordSuccess as recordHealthSuccess, recordFailure as recordHealthFailure } from './health'
import { recordLastError } from './ai-providers.server'
import { classifyAdapterError } from './error-classify'
import {
  AIRuntimeError,
  type ChatMessage,
  type RunOptions,
  type RunResult,
} from './ai-providers.shared'

/** Selector's per-call "is this provider fresh enough to try?" window.
 *  Older snapshots are treated as advisory only. */
const HEALTH_STALE_MS = 30_000

/** Per-row token cap clamp: if a row sets `maxTokensCap`, cap the call. */
function clampMaxTokens(requested: number, row: AIProvider): number {
  if (row.maxTokensCap != null) return Math.min(requested, row.maxTokensCap)
  return requested
}

async function loadRows(): Promise<AIProvider[]> {
  const { asc } = await import('drizzle-orm')
  return createDb(env.DB)
    .select()
    .from(aiProvider)
    .where(eq(aiProvider.enabled, true))
    .orderBy(asc(aiProvider.priority), asc(aiProvider.id))
}

/**
 * Sequence through the provider rows, calling each healthy / funded one in
 * turn. Returns the first success; throws `AIRuntimeError` with a per-row
 * summary if every attempt fails.
 */
export async function runAI(messages: ChatMessage[], opts: RunOptions = {}): Promise<RunResult> {
  if (messages.length === 0) throw new AIRuntimeError('runAI called with no messages')
  const requested = opts.maxTokens ?? 4096

  const rows = await loadRows()
  if (!rows.length) {
    throw new AIRuntimeError('No AI providers configured. Ask an admin to enable one.')
  }

  const failures: Array<{ id: string; kind: string; msg: string }> = []
  let lastErr: unknown = null

  for (const row of rows) {
    const ctx = await resolveCtx(row, { signal: opts.signal })
    if (!ctx) {
      console.warn(`[ai-providers] skipping ${row.id} (${row.kind}): no matching API key secret`)
      continue
    }
    if (!(await isReachable(env.CACHE, row.id, { staleMs: HEALTH_STALE_MS }))) {
      continue
    }
    const adapter = buildAdapter(row)
    const cap = clampMaxTokens(requested, row)
    const started = Date.now()
    try {
      const r = await adapter.run(messages, { ...opts, maxTokens: cap }, ctx)
      await recordHealthSuccess(env.CACHE, row.id, Date.now() - started)
      return { text: r.text.trim(), raw: r.raw }
    } catch (err) {
      const { AdapterError } = await import('./providers/types')
      const kind = classifyAdapterError(err)
      const msg = err instanceof Error ? err.message : String(err)
      lastErr = err
      failures.push({ id: row.id, kind, msg })
      // Coalesced D1 write — selector survives death-spiral volume.
      try {
        await recordLastError(createDb(env.DB), row.id, msg, Date.now())
      } catch {
        // D1 write errors must not prevent the next provider attempt.
      }
      await recordHealthFailure(env.CACHE, row.id, kind as AdapterErrorType['kind'], msg)
      // `fatal` short-circuits — bad schema won't fix itself on a different
      // provider; better to surface immediately than burn budget on retries.
      if (kind === 'fatal') break
      void AdapterError // satisfy the unused-import linter in some setups
    }
  }

  const summary = failures.map((f) => `${f.id}:${f.kind}:${f.msg}`).join(' | ')
  throw new AIRuntimeError(
    `All AI providers failed (${failures.length} attempt${failures.length === 1 ? '' : 's'}): ${summary}`,
    lastErr ?? undefined,
  )
}

/** Single-string user prompt — kept for parity with the legacy wrapper. */
export async function runAIString(prompt: string, opts: RunOptions = {}): Promise<string> {
  const r = await runAI([{ role: 'user', content: prompt }], opts)
  return r.text
}
