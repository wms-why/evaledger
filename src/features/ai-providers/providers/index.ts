/**
 * Provider factory + `resolveCtx` (api key → ctx resolution).
 *
 *   `buildAdapter(row)` returns a fresh adapter instance for the row's kind.
 *   `resolveCtx(row, signal)` looks up the matching worker secret and bundles
 *   it with baseUrl / model / injectable fetch.
 *
 * Resolution rules:
 *   - mmx       → env.MMX_API_KEY        (default base https://api.minimaxi.com)
 *   - deepseek  → env.DEEPSEEK_API_KEY   (default base https://api.deepseek.com)
 *   - replicate → env.REPLICATE_API_TOKEN(default base https://api.replicate.com)
 *
 * Missing secret → `undefined` (selector skips + console.warn).
 *
 * Env is read lazily so this module is importable from node tests
 * (where `cloudflare:workers` doesn't resolve). Tests inject the env
 * directly via the `env` parameter when they need provider resolution.
 */
import type { AIProvider } from '../ai-providers.schema'
import type { ProviderAdapter, AdapterCtx } from './types'
import { MmxAdapter, MMX_DEFAULT_BASE_URL } from './mmx'
import { DeepSeekAdapter, DEEPSEEK_DEFAULT_BASE_URL } from './deepseek'
import { ReplicateAdapter, REPLICATE_DEFAULT_BASE_URL } from './replicate'

const FACTORIES: Record<string, () => ProviderAdapter> = {
  mmx: () => new MmxAdapter(),
  deepseek: () => new DeepSeekAdapter(),
  replicate: () => new ReplicateAdapter(),
}

export function buildAdapter(row: AIProvider): ProviderAdapter {
  const factory = FACTORIES[row.kind]
  if (!factory) throw new Error(`Unknown provider kind: ${row.kind}`)
  return factory()
}

export interface ResolveEnv {
  MMX_API_KEY?: string
  DEEPSEEK_API_KEY?: string
  REPLICATE_API_TOKEN?: string
}

/** `fetch`-shaped function. Production uses the global; tests inject a stub. */
type FetchFn = typeof globalThis.fetch

/**
 * Build an `AdapterCtx` from a row. Returns `undefined` when the matching
 * secret is unset (selector treats this as "skip this row").
 *
 * Pass `env` from tests; pass nothing in production (lazily imports
 * `@/lib/env` to read `cloudflare:workers` env).
 *
 * `signal` is forwarded so `AbortSignal.timeout(30_000)` callers can cancel.
 */
export async function resolveCtx(
  row: AIProvider,
  options: { signal?: AbortSignal; env?: ResolveEnv; fetch?: FetchFn } = {},
): Promise<AdapterCtx | undefined> {
  let env: ResolveEnv | undefined = options.env
  if (!env) {
    const { env: live } = await import('@/lib/env')
    env = live as unknown as ResolveEnv
  }

  let apiKey: string | undefined
  let defaultBaseUrl: string
  switch (row.kind) {
    case 'mmx':
      apiKey = env.MMX_API_KEY
      defaultBaseUrl = MMX_DEFAULT_BASE_URL
      break
    case 'deepseek':
      apiKey = env.DEEPSEEK_API_KEY
      defaultBaseUrl = DEEPSEEK_DEFAULT_BASE_URL
      break
    case 'replicate':
      apiKey = env.REPLICATE_API_TOKEN
      defaultBaseUrl = REPLICATE_DEFAULT_BASE_URL
      break
    default:
      return undefined
  }

  if (!apiKey) return undefined
  const baseUrl = row.baseUrlOverride ?? defaultBaseUrl
  return {
    apiKey,
    baseUrl,
    model: row.model,
    fetch: options.fetch ?? fetch,
    signal: options.signal,
  }
}

export { MmxAdapter } from './mmx'
export { DeepSeekAdapter } from './deepseek'
export { ReplicateAdapter } from './replicate'
export { MMX_DEFAULT_BASE_URL, DEEPSEEK_DEFAULT_BASE_URL, REPLICATE_DEFAULT_BASE_URL }
export type { ProviderAdapter, AdapterCtx, AdapterRunResult, BalanceSnapshot, FetchFn } from './types'
export { AdapterError } from './types'
export type { FailureKind } from '../ai-providers.shared'
