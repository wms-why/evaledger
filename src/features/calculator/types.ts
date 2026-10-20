/**
 * Domain types for the token cost calculator.
 *
 * Conventions:
 * - All prices are USD per 1M tokens (the standard LLM pricing unit).
 * - Context windows and token counts are plain integers.
 * - Source URL is REQUIRED for every model so prices can be re-verified.
 * - `lastVerified` is REQUIRED: never ship a price without an ISO date.
 */

export type Provider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'minimax'
  | 'grok'
  | 'openrouter'

export type ModelStatus = 'active' | 'delisted' | 'retired'

/** Anthropic-style cache write tier (5-min vs 1-hour refresh window). */
export interface CacheWriteTier {
  /** Cache write TTL window. */
  window: '5min' | '1hr'
  /** USD per 1M tokens written into the cache. */
  pricePer1M: number
}

/** Long-context pricing tier (Gemini >200K, OpenAI >272K, etc.). */
export interface LongContextTier {
  /** Inclusive token threshold above which this tier applies. */
  threshold: number
  /** Multiplier on `inputPricePer1M` (e.g. 2 = double price above threshold). */
  inputMultiplier: number
  /** Multiplier on `outputPricePer1M`. */
  outputMultiplier: number
}

/** One period's rates within a peak/off-peak schedule. */
export interface PeakOffPeakPrices {
  inputPricePer1M: number
  outputPricePer1M: number
  /**
   * Cache-hit rate for THIS period. Omitted when it is the same as the
   * model's top-level `cachedInputPricePer1M` — which is the peak rate, so
   * the peak period never needs to repeat it.
   */
  cachedInputPricePer1M?: number
}

/** DeepSeek-style peak/off-peak pricing. */
export interface PeakOffPeakTier {
  peak: PeakOffPeakPrices
  offPeak: PeakOffPeakPrices
  /** Human-readable description of when off-peak applies (e.g. "16:30–00:30 UTC, daily"). */
  offPeakNote: string
}

/**
 * What the top-level `inputPricePer1M` / `outputPricePer1M` represent.
 *
 * - `peak` (default for DeepSeek): the top-level price is the peak-hours rate;
 *   callers wanting off-peak must consult `peakOffPeak.offPeak`.
 * - `standard`: the top-level price is flat (no peak/off-peak distinction),
 *   which is the case for every non-DeepSeek provider. Field is left undefined
 *   for those to keep the schema sparse.
 *
 * Exists so the JSON API at `/api/prices.json` is unambiguous: an AI agent
 * reading `inputPricePer1M` without checking this field will mis-quote DeepSeek
 * rates by up to 2× when the user is asking about an off-peak workload.
 */
export type PricingPeriod = 'peak' | 'standard'

/** Promotional pricing — explicitly time-bounded so we never silently apply an old promo. */
export interface PromoPricing {
  /** ISO date the promo ends (inclusive). */
  untilDate: string
  inputPricePer1M: number
  outputPricePer1M: number
  /** Human-readable note (e.g. "Intro pricing, reverts to standard on 2027-01-01"). */
  note: string
}

export interface ModelPrice {
  /** Stable id used in URLs/JSON; never rename without a redirect. */
  id: string
  provider: Provider
  displayName: string
  /** Family used for tokenizer selection (e.g. 'gpt-5' → o200k_base). */
  family: string
  status: ModelStatus
  /** Maximum context window in tokens. */
  contextWindow: number
  /** USD per 1M input tokens (uncached). */
  inputPricePer1M: number
  /** USD per 1M output tokens. */
  outputPricePer1M: number
  /** USD per 1M cached input tokens, if the provider offers cache reads. */
  cachedInputPricePer1M?: number
  /** Anthropic-style cache write pricing tiers (rare; do not confuse with cached reads). */
  cacheWrite?: CacheWriteTier[]
  /** Long-context surcharge tiers, applied in order of `threshold` ascending. */
  longContext?: LongContextTier[]
  /** DeepSeek-style peak/off-peak scheduling. */
  peakOffPeak?: PeakOffPeakTier
  /**
   * What the top-level `inputPricePer1M` / `outputPricePer1M` represent.
   * Set to `'peak'` for DeepSeek entries so the JSON API is unambiguous.
   * Omitted for flat-rate providers.
   */
  pricingPeriod?: PricingPeriod
  /** Time-bounded promo — replaces input/output if `Date.now() <= promo.untilDate`. */
  promo?: PromoPricing
  /** Canonical URL of the official pricing page this entry was sourced from. */
  sourceUrl: string
  /** ISO date this entry was last verified against `sourceUrl`. */
  lastVerified: string
  /** Short note shown on the model card if non-empty. */
  note?: string
}

/** Top-level registry shipped to the client + API. */
export interface ModelRegistry {
  /**
   * Semver of the REGISTRY contents. Bumped by hand when the registry changes
   * (new active model added, status flipped, prices re-verified, etc.). The
   * `pnpm prices:fetch` script reads this and warns at the end if it drifts
   * from the script's own version — the two should move together in the same
   * commit.
   */
  registryVersion: string
  /** ISO date the registry was last assembled. */
  fetchedAt: string
  /** Source attribution shown to humans. */
  sourceNote: string
  /** Average markup factor applied by OpenRouter over the official price of each model. */
  openRouterMarkup: number
  models: ModelPrice[]
}

/** Cost breakdown returned by `calculateCost()` for a single model. */
export interface CostBreakdown {
  modelId: string
  inputTokens: number
  outputTokens: number
  /** Effective input $/1M used (after multipliers / promo). */
  effectiveInputPricePer1M: number
  /** Effective output $/1M used. */
  effectiveOutputPricePer1M: number
  /** USD cost for the input portion. */
  inputCost: number
  /** USD cost for the output portion. */
  outputCost: number
  /** inputCost + outputCost. */
  totalCost: number
  /** Annualised monthly cost × 12 — useful for "what's this over a year?" framing. */
  annualisedCost: number
  /** Pricing rule actually applied (e.g. 'standard', 'promo (until 2026-12-31)', 'long-context >200K'). */
  appliedRule: string
}