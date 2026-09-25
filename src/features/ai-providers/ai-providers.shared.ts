/**
 * Public types and the `AIRuntimeError` class for the AI provider feature.
 *
 * These shapes are intentionally a SUPERSET of the legacy
 * `src/lib/cloudflare-ai.ts` exports — every existing caller swap is just an
 * import path change; no call-site edits required. New optional fields
 * (`model` on `RunOptions`, `ProviderKind`) are inert until later phases.
 *
 * `ProviderKind` is a closed union; adapters register themselves under exactly
 * these strings in `src/features/ai-providers/providers/`.
 */

export type ProviderKind = 'mmx' | 'deepseek' | 'replicate'

/** OpenAI-style chat message accepted by all three adapters. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface RunOptions {
  /** Sampling temperature. 0 = deterministic, 1 = creative. Default 0.7. */
  temperature?: number
  /** Hard cap on generated tokens. Default 4096. */
  maxTokens?: number
  /** Stop sequences — model halts when any appear in the output. */
  stop?: string[]
  /** Cancel an in-flight inference (e.g. user navigated away). */
  signal?: AbortSignal
  /**
   * Per-call model override. Currently IGNORED by the selector — the model is
   * taken from the chosen row's `model` column. Reserved for future
   * per-call override (see plan "Deferred to V2").
   */
  model?: string
}

export interface RunResult {
  /** Trimmed model output (most callers want this). */
  text: string
  /** Raw provider response — useful for advanced callers / future tool-use support. */
  raw: unknown
}

/**
 * Thrown by `runAI` when every candidate provider failed (or no providers are
 * configured). Carries the aggregated per-provider summary as `message` and
 * the last raw error as `cause`.
 *
 * Legacy callers do `if (err instanceof AIRuntimeError) err.message` — that
 * contract is preserved.
 */
export class AIRuntimeError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'AIRuntimeError'
  }
}

/**
 * Canonical failure taxonomy used by both adapters and the selector. Adapters
 * throw `AdapterError` carrying one of these; `classifyAdapterError` recovers
 * the same values from any error that slips through.
 *
 *   - `fatal`        — bad request schema, etc. Retry won't help; selector breaks the loop.
 *   - `transient`    — 5xx / 408 / 429. Try the next provider.
 *   - `out-of-funds` — 402 / credit-exhausted. Try the next provider (it self-heals on top-up);
 *                      selector marks the provider's health snapshot `out-of-funds` so the admin UI
 *                      reflects it. Caller retries are safe after the user recharges.
 *   - `network`      — DNS / connection refused / TLS handshake. Try the next provider.
 */
export type FailureKind = 'fatal' | 'transient' | 'out-of-funds' | 'network'
