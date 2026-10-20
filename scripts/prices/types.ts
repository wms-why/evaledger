/**
 * Shared types for the local price-fetch script (`pnpm prices:fetch`).
 *
 * These types describe the intermediate shape that each provider scraper
 * produces and that `normalize.ts` reduces into the final `data/last-fetch.json`
 * payload. They are intentionally loose — provider pages change without notice
 * and we'd rather record `raw` debugging fields than crash.
 */

export type ProviderId = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'minimax' | 'grok'

/** A row as extracted by a single provider's scraper, before normalization. */
export interface ScrapedModel {
  /** Provider id (matches `ProviderId`). */
  provider: ProviderId
  /** Model name as it appears on the provider's pricing page. */
  scrapedName: string
  /** USD per 1M input tokens. Null if the scraper could not parse it. */
  inputPricePer1M: number | null
  /** USD per 1M output tokens. Null if the scraper could not parse it. */
  outputPricePer1M: number | null
  /** USD per 1M cached input tokens, if the provider exposes it. */
  cachedInputPricePer1M: number | null
  /** Maximum context window in tokens, if exposed. */
  contextWindow: number | null
  /** Raw fields kept for debugging when selectors drift. */
  raw: Record<string, unknown>
}

/** The result of scraping a single provider's pricing page. */
export interface ProviderResult {
  provider: ProviderId
  url: string
  ok: boolean
  /** ISO timestamp the fetch finished. */
  scrapedAt: string
  /** Rows extracted before normalization. */
  models: ScrapedModel[]
  /** Error string if `ok` is false. */
  error?: string
}

/** The final JSON payload written to `data/last-fetch.json`. */
export interface FetchOutput {
  /** ISO date the fetch was run. */
  fetchedAt: string
  sources: Record<ProviderId, {
    url: string
    ok: boolean
    scrapedAt: string
    modelCount: number
    error?: string
  }>
  /** Normalized rows, joined with the hand-maintained `mapping.ts`. */
  models: NormalizedModel[]
}

/** A normalized row after joining with `mapping.ts`. */
export interface NormalizedModel {
  provider: ProviderId
  scrapedName: string
  /** Model id from REGISTRY if `scrapedName` is mapped, otherwise null. */
  modelId: string | null
  inputPricePer1M: number | null
  outputPricePer1M: number | null
  cachedInputPricePer1M: number | null
  contextWindow: number | null
  raw: Record<string, unknown>
}
