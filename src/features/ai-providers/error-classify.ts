/**
 * Pure error-classification helper — no D1, no KV, no fetch. Used by the
 * selector's catch block to recover the canonical `FailureKind` from any
 * error that escaped an adapter's pre-classified `AdapterError`. All adapters
 * SHOULD throw `AdapterError` already carrying `.kind`, so this is a
 * safety net for edge cases (e.g. a JSON.parse failure that bubbles out
 * before the adapter can wrap it).
 *
 * Tiered classification:
 *   1. `err.kind` in object form → trust it (adapter pre-classified).
 *   2. `err instanceof TypeError` → 'network' (fetch throws TypeError on
 *      DNS / connection refused / TLS handshake).
 *   3. Everything else → 'transient' (encourages fallback rather than a
 *      brittle short-circuit on an unrecognized shape).
 */
import type { FailureKind } from './ai-providers.shared'

export function classifyAdapterError(err: unknown): FailureKind {
  if (err && typeof err === 'object' && 'kind' in err) {
    const kind = (err as { kind: FailureKind }).kind
    if (kind === 'fatal' || kind === 'transient' || kind === 'out-of-funds' || kind === 'network') {
      return kind
    }
  }
  if (err instanceof TypeError) return 'network'
  return 'transient'
}
