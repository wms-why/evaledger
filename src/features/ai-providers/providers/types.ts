/**
 * Cross-provider adapter contract. Each `ProviderAdapter` owns one of
 * {mmx, deepseek, replicate}; the `ProviderKind` and the export name match.
 *
 * Adapters are pure: they take a fully-resolved `AdapterCtx` (api key +
 * base URL + model + injectable fetch) and produce text + raw response.
 * Health + balance probes are separate methods so the hot path doesn't
 * double-charge the billing endpoints.
 *
 * Errors thrown out of `run()` / `checkHealth()` / `checkBalance()` are
 * SHAPED `{message, kind, status?, cause?}` via `AdapterError`. The
 * selector reads `err.kind` to decide between fallback (continue) and
 * short-circuit (fatal).
 */
import type { ChatMessage, RunOptions, FailureKind, ProviderKind } from '../ai-providers.shared'

/** `fetch`-shaped function. Injected by the selector (production `fetch`)
 *  or by tests (a `vi.fn()` returning canned `Response`s). */
export type FetchFn = typeof globalThis.fetch

/** Inputs a provider needs to make a call. Built by `resolveCtx()` from a row. */
export interface AdapterCtx {
  /** Raw secret. NEVER persisted to D1; resolved from worker secrets. */
  apiKey: string
  /** Per-adapter default, or `row.baseUrlOverride` when set. */
  baseUrl: string
  /** Provider-specific model id (e.g. 'deepseek-chat', 'meta/meta-llama-3-70b-instruct'). */
  model: string
  /** Injected by `buildAdapter`; selectors pass workers' `fetch`, tests pass a stub. */
  fetch: FetchFn
  /** Forwarded from `RunOptions.signal` — the adapter wires it onto the fetch. */
  signal?: AbortSignal
}

export interface AdapterRunResult {
  /** Final assistant message text, already trimmed. */
  text: string
  /** Full provider response for callers that need usage stats / cost. */
  raw: unknown
}

/** Free-form balance view; admin UI just renders `remaining` + `currency`. */
export interface BalanceSnapshot {
  ok: boolean
  remaining?: number | string
  currency?: string
  /** If !ok, a free-form reason (status code, error message). */
  detail?: string
  raw?: unknown
}

/** Carries the canonical `FailureKind` so the selector can react without parsing strings. */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly kind: FailureKind,
    public readonly status?: number,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'AdapterError'
  }
}

export interface ProviderAdapter {
  readonly kind: ProviderKind
  /** Run a chat completion against this provider. Throws AdapterError on failure. */
  run(messages: ChatMessage[], opts: RunOptions, ctx: AdapterCtx): Promise<AdapterRunResult>
  /** Lightweight reachability probe, 5s timeout. Doesn't hit billing endpoints. */
  checkHealth(ctx: AdapterCtx): Promise<{ ok: boolean; detail?: string }>
  /** Account / balance query. Only invoked from the admin "Test connection" button. */
  checkBalance(ctx: AdapterCtx): Promise<BalanceSnapshot>
}
