/**
 * Vendor facts the calculator copy states that are NOT registry prices.
 *
 * Everything here is a product fact from the vendor's own documentation —
 * a subscription price, an API discount program, a cache window. They are
 * kept in one module, with their source, for one reason: the copy rules say
 * "the dictionary holds the words, the code holds the numbers", and that must
 * hold for a number even when the price registry cannot answer it. A figure
 * typed into a sentence has no source; a figure in this file does.
 *
 * A registry PRICE never lives here — it is resolved from REGISTRY through
 * `priceDetail()` (see `faq-examples.ts` / `copy.ts`).
 */

/** OpenAI's Batch API: half price on both input and output, 24-hour SLA. */
export const OPENAI_BATCH = {
  /** The discount, as a whole percentage: 50. */
  discountPct: 50,
  /** The completion SLA, in hours. */
  slaHours: 24,
  sourceUrl: 'https://platform.openai.com/docs/guides/batch',
} as const

/** Anthropic's consumer subscriptions (the consumer tier, not the API). */
export const ANTHROPIC_SUBSCRIPTIONS = {
  proMonthlyUsd: 20,
  maxMonthlyUsd: 200,
  sourceUrl: 'https://claude.com/pricing',
} as const

/** OpenAI's consumer subscription — the "Plus does not include API" point. */
export const OPENAI_PLUS_MONTHLY_USD = 20

/** OpenAI prompt-cache details that are not a price. */
export const OPENAI_CACHE = {
  /** The prefix length below which OpenAI does not cache. */
  minPrefixTokens: 1024,
  minWindowMinutes: 5,
  maxWindowMinutes: 10,
  sourceUrl: 'https://platform.openai.com/docs/guides/prompt-caching',
} as const
