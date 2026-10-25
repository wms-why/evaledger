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

/**
 * How OpenRouter actually charges — and why the site's 1.05× column is an
 * estimate rather than a quote.
 *
 * Read from OpenRouter's own pricing page and FAQ, which state plainly:
 *
 *   "Inference is billed at the provider's list price on every plan.
 *    OpenRouter's fee is charged when you buy credits, 5.5% on Standard and
 *    8% on Business, never on individual requests."
 *
 * That is a materially different shape from the one this site models. The
 * registry's `openRouterMarkup` multiplies the per-token rate, so the
 * calculator's OpenRouter column answers "what if each token cost 5% more?" —
 * a rough way to account for the platform fee, NOT what the API bills. The
 * copy must say so, and must never present the column as an OpenRouter quote
 * or the percentage as a figure OpenRouter publishes for inference.
 *
 * The inference rate itself is passed through at list price, which is also
 * why "going direct is cheaper" is only true once the credit-purchase fee is
 * large enough to matter — see `CREDIT_FEE_CAVEAT` in the copy.
 */
export const OPENROUTER_FEES = {
  /** Fee on credit purchases, Standard plan. */
  standardPct: 5.5,
  /** Fee on credit purchases, Business plan. */
  businessPct: 8,
  /** Inference itself is billed at the provider's list price on every plan. */
  inferenceMarkedUp: false,
  sourceUrl: 'https://openrouter.ai/pricing',
  faqUrl: 'https://openrouter.ai/docs/faq',
} as const

/** `5.5 / 8` — the two credit-purchase fees, as the copy writes them. */
export function openRouterCreditFees(): { standard: string; business: string } {
  return {
    standard: String(OPENROUTER_FEES.standardPct),
    business: String(OPENROUTER_FEES.businessPct),
  }
}

