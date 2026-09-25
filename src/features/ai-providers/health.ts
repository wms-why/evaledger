/**
 * KV-backed health / out-of-funds snapshot for each AI provider row.
 *
 * `env.CACHE` is the single KV namespace this app already uses (see
 * `src/features/waitlist/rate-limit.ts`). We key by `ai:health:<providerId>`
 * with a 5-minute TTL, matching the existing `expirationTtl` convention.
 *
 * The snapshot is advisory — KV is eventually consistent (60s window) and
 * the selector's "fall through and try the call" path always wins. KV
 * matters only for:
 *   - Skipping a provider that we KNOW is unreachable / out-of-funds within
 *     the recent window (avoids burning 30s on a known-dead row before
 *     falling back).
 *   - The admin row's "current health" badge (cached so the UI doesn't
 *     thrash on every page load).
 *   - The D1 `lastError` / `lastErrorAt` columns hold the durable record;
 *     KV is the fast read path.
 *
 * Failure coalescing: `recordFailure(...)` skips the D1 write when
 * `lastErrorAt` is within the 30s window so death-spiral providers don't
 * hammer the database. The KV snapshot is still always updated.
 */
import type { AIProvider as _AIProvider } from './ai-providers.schema'
import type { FailureKind } from './ai-providers.shared'

export type HealthStatus = 'ok' | 'unreachable' | 'out-of-funds'

export interface HealthSnapshot {
  status: HealthStatus
  detail?: string
  balance?: { remaining: number | string; currency?: string }
  recordedAt: number // ms epoch
}

export const HEALTH_TTL_SEC = 300

/** KV key for the per-provider health snapshot. */
export function healthKey(providerId: string): string {
  return `ai:health:${providerId}`
}

/** Read the snapshot from KV. Returns `null` when missing OR malformed. */
export async function readHealth(
  kv: KVNamespace,
  providerId: string,
): Promise<HealthSnapshot | null> {
  const raw = await kv.get(healthKey(providerId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as HealthSnapshot
    if (!parsed || typeof parsed.recordedAt !== 'number' || typeof parsed.status !== 'string') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export async function writeHealth(
  kv: KVNamespace,
  providerId: string,
  snap: HealthSnapshot,
): Promise<void> {
  await kv.put(healthKey(providerId), JSON.stringify(snap), { expirationTtl: HEALTH_TTL_SEC })
}

/**
 * Returns `true` when the selector should attempt this provider — i.e. when
 * the snapshot is missing, stale, or `status === 'ok'`.
 *
 * Falls open on null / stale / parse errors: a KV outage never bricks AI.
 */
export async function isReachable(
  kv: KVNamespace,
  providerId: string,
  options: { staleMs: number; now?: () => number },
): Promise<boolean> {
  const snap = await readHealth(kv, providerId)
  if (!snap) return true
  const now = options.now?.() ?? Date.now()
  if (now - snap.recordedAt > options.staleMs) return true
  return snap.status === 'ok'
}

/** Map an `AdapterError.kind` to the `HealthStatus` we want to persist. */
function statusFor(kind: FailureKind): HealthStatus {
  if (kind === 'out-of-funds') return 'out-of-funds'
  return 'unreachable' // fatal / transient / network → "don't try yet"
}

/** 30s sliding window — within it, we skip the D1 lastError write to avoid
 *  hammering the database during a death spiral. */
export const D1_COALESCE_MS = 30_000

/** Record a successful call: clears the snapshot to `ok`. */
export async function recordSuccess(
  kv: KVNamespace,
  providerId: string,
  latencyMs: number,
  now: number = Date.now(),
): Promise<void> {
  await writeHealth(kv, providerId, {
    status: 'ok',
    detail: `${latencyMs}ms`,
    recordedAt: now,
  })
}

/** Record a failed call. Writes the KV snapshot unconditionally; the D1
 *  `lastError` write is the caller's responsibility (we don't have a `db`
 *  here, and the server-side `recordFailure` in `ai-providers.server.ts`
 *  owns the coalescing). */
export async function recordFailure(
  kv: KVNamespace,
  providerId: string,
  kind: FailureKind,
  message: string,
  now: number = Date.now(),
): Promise<void> {
  await writeHealth(kv, providerId, {
    status: statusFor(kind),
    detail: message,
    recordedAt: now,
  })
}
