import { REGISTRY, findModel } from './model-prices'
import { priceDetail, registrySnapshotDate } from './pricing-detail'
import { formatMoney, formatPct } from './format'
import { openRouterCreditFees } from './vendor-claims'

/**
 * The worked examples the calculator FAQs quote, derived from the registry.
 *
 * A FAQ answer that names a model and a price is a published claim. The
 * previous copy of these pages typed both by hand, so the token-cost page's
 * FAQ was still selling `GPT-5 nano` (delisted), `Claude Opus 4.5` (delisted)
 * and `Gemini 2.5 Flash` months after the calculator above it had moved on.
 *
 * The fix is structural, not editorial: every number the FAQ prints is
 * computed here from `REGISTRY` through the same functions the calculator
 * charges from (`priceDetail` resolves the rate band in force on the registry
 * snapshot day), and every model name is resolved from the registry row, not
 * typed into the sentence. The dictionary keeps the WORDS with `{…}`
 * placeholders; this module fills them. When a price moves, the FAQ moves in
 * the same commit — there is no second copy of the number to forget.
 *
 * The model **ids** named here are the only editorial choice left. Two rules:
 *
 *  - an id must be an ACTIVE registry row (a delisted model is a historical
 *    example, which the FAQ marks as such and this module never quotes as a
 *    current price — see `historicalModelExample()`);
 *  - the chosen rows must span the vendors the FAQ claims to compare, so the
 *    answer keeps illustrating "it depends on the model".
 *
 * `__tests__/faq-freshness.node.test.ts` enforces both.
 */

/** The four models the token-cost FAQ prices out, one per vendor family. */
export const TOKEN_FAQ_EXAMPLE_IDS = [
  'gpt-6-luna',
  'claude-haiku-4.5',
  'claude-opus-5.5',
  'deepseek-flash',
] as const

/**
 * A retired model the copy is allowed to mention **as history**.
 *
 * The rule the test enforces: a delisted model may appear in the copy only
 * when the sentence marks it as a past example, prints the registry rates it
 * carried, and states the date those rates were last verified. Anything else
 * is an unmarked stale price.
 */
export const HISTORICAL_EXAMPLE_IDS = ['gpt-5-nano'] as const

export type HistoricalExampleId = (typeof HISTORICAL_EXAMPLE_IDS)[number]

interface Rates {
  input: number
  output: number
  cached?: number
}

/** The rates in force for a model on the registry snapshot day. */
export function snapshotRates(modelId: string): Rates | null {
  const model = findModel(modelId)
  if (!model) return null
  const detail = priceDetail(model, registrySnapshotDate())
  return { input: detail.input, output: detail.output, cached: detail.cached }
}

/**
 * The name the registry carries for a model, as the copy prints it.
 *
 * The registry's Anthropic rows are named `Opus 5.5` / `Sonnet 5` (the family
 * is a column there); a cross-vendor sentence cannot say "Opus 5.5" next to
 * "GPT-6 luna" — it reads as a different product. The `Claude ` prefix is
 * added from the row's `provider`, so the name still comes from the registry
 * rather than being typed into the sentence.
 */
export function exampleModelName(modelId: string): string {
  const model = findModel(modelId)
  if (!model) return modelId
  if (model.provider === 'anthropic' && !/^claude\b/i.test(model.displayName)) {
    return `Claude ${model.displayName}`
  }
  return model.displayName
}

/** `$2 / $10` — the standard rate pair the copy quotes. */
function ratePair(rates: Rates | null): string {
  return `${formatMoney(rates?.input ?? 0)} / ${formatMoney(rates?.output ?? 0)}`
}

/**
 * The worked examples for the token-cost page's "how much does 1M tokens
 * cost" answer: one model id, display name and rate pair per row, in registry
 * terms, so the sentence and the table above it cannot disagree.
 */
export interface TokenFaqExample {
  modelId: string
  name: string
  /** `$2 / $10` — input / output per 1M tokens. */
  rates: string
}

export function tokenFaqExamples(): TokenFaqExample[] {
  return TOKEN_FAQ_EXAMPLE_IDS.map((modelId) => ({
    modelId,
    name: exampleModelName(modelId),
    rates: ratePair(snapshotRates(modelId)),
  }))
}

/**
 * A retired model, quoted only as history.
 *
 * Returns the registry rates it carried and the date they were verified, so
 * the sentence can say "retired in 2026-10 at $0.05 / $0.40" without a human
 * retyping either number.
 */
export function historicalModelExample(modelId: HistoricalExampleId): {
  modelId: string
  name: string
  rates: string
  input: string
  output: string
  /** The registry's verification date for this row (`YYYY-MM`). */
  asOf: string
} {
  const model = findModel(modelId)
  const rates = snapshotRates(modelId)
  const asOf = (model?.lastVerified ?? REGISTRY.fetchedAt).slice(0, 7)
  return {
    modelId,
    name: exampleModelName(modelId),
    rates: ratePair(rates),
    input: formatMoney(rates?.input ?? 0),
    output: formatMoney(rates?.output ?? 0),
    asOf,
  }
}

/** The token-cost FAQ's parameter bag. */
export function tokenFaqParams(): Record<string, string | number> {
  const examples = tokenFaqExamples()
  const [active1, active2, active3, active4] = examples
  const history = historicalModelExample('gpt-5-nano')
  return {
    active1Name: active1.name,
    active1Rates: active1.rates,
    active2Name: active2.name,
    active2Rates: active2.rates,
    active3Name: active3.name,
    active3Rates: active3.rates,
    active4Name: active4.name,
    active4Rates: active4.rates,
    retiredName: history.name,
    retiredRates: history.rates,
    retiredIn: history.asOf,
    // The snapshot date the figures in the FAQ were read from.
    asOf: REGISTRY.fetchedAt,
  }
}

// ───── Cross-provider claims the FAQ makes about the whole registry ───────

/** The models a claim is computed over: every active, priced, official row. */
function activeOfficialModels() {
  return REGISTRY.models.filter(
    (model) =>
      model.status === 'active' &&
      model.channel === 'official' &&
      model.inputPricePer1M > 0 &&
      model.outputPricePer1M > 0,
  )
}

export interface OutputRatioRange {
  /** The smallest output/input multiple in the active registry. */
  min: number
  /** The largest output/input multiple in the active registry. */
  max: number
  /** The model id that carries each end of the range. */
  minModelId: string
  /** The model id that carries the top of the range. */
  maxModelId: string
  /** How many active models the range is computed over. */
  count: number
  /** The median multiple — the line a "typically N×" sentence may quote. */
  median: number
  /** How CLOSE the whole field is to one multiple: the most common ratio. */
  mode: number
  /** How many active models carry that most common ratio. */
  modeCount: number
  /** The two ends as the copy writes them ("2.7", "8.3"). */
  minText: string
  maxText: string
  medianText: string
  modeText: string
}

/**
 * The output/input price multiple across the registry.
 *
 * The old answer said "typically 4× to 8×" — a rule of thumb copied from the
 * GPT-4/o-series era that the registry does not support (it is neither the
 * range nor the median of the models it sells). The range is computed, and
 * the copy states it as "in our registry, from x to y", with the count.
 *
 * The range is over MODELS, not vendors: it is a fact about the price table,
 * and `count` says over what.
 */
export function outputRatioRange(): OutputRatioRange {
  const rows = activeOfficialModels()
    .map((model) => ({
      id: model.id,
      ratio: model.outputPricePer1M / model.inputPricePer1M,
    }))
    .sort((a, b) => a.ratio - b.ratio)
  const min = rows[0]
  const max = rows[rows.length - 1]
  const ratios = rows.map((row) => row.ratio)
  const sorted = [...ratios].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  // The most common ratio, rounded to one decimal — "most models bill output
  // at N× input" is a claim the copy makes, so N comes from here.
  const buckets = new Map<number, number>()
  for (const ratio of ratios) {
    const key = Math.round(ratio * 10) / 10
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  const [mode, modeCount] = [...buckets.entries()].sort(
    (a, b) => b[1] - a[1] || a[0] - b[0],
  )[0]
  return {
    min: min.ratio,
    max: max.ratio,
    minModelId: min.id,
    maxModelId: max.id,
    count: rows.length,
    median,
    mode,
    modeCount,
    minText: formatTimes(min.ratio),
    maxText: formatTimes(max.ratio),
    medianText: formatTimes(median),
    modeText: formatTimes(mode),
  }
}

/** `4` — the range's low end, as the copy writes a multiple. */
export function formatTimes(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/**
 * The cached-input discount, per vendor, as the registry actually records it.
 *
 * The old copy said "Anthropic ~90%, OpenAI ~90%, DeepSeek ~90%" — one number
 * for three vendors whose price sheets disagree (and one of them, Anthropic,
 * is 75–97.5% depending on the model). So this returns a row per vendor with
 * the real range over that vendor's active models; the copy prints the range
 * and names the vendors, and "~90% for everyone" cannot come back without
 * failing `faq-freshness.node.test.ts`.
 */
export interface CacheDiscountRow {
  provider: string
  /** The cheapest discount (0–1) recorded for this vendor's active models. */
  min: number
  /** The biggest discount (0–1) recorded for this vendor's active models. */
  max: number
  /** How many active models of this vendor publish a cached rate. */
  count: number
}

export function cacheDiscountsByProvider(): CacheDiscountRow[] {
  const byProvider = new Map<string, number[]>()
  for (const model of activeOfficialModels()) {
    const cached = model.cachedInputPricePer1M
    if (cached == null || cached <= 0) continue
    const saving = 1 - cached / model.inputPricePer1M
    const list = byProvider.get(model.provider) ?? []
    list.push(saving)
    byProvider.set(model.provider, list)
  }
  return [...byProvider.entries()]
    .map(([provider, savings]) => ({
      provider,
      min: Math.min(...savings),
      max: Math.max(...savings),
      count: savings.length,
    }))
    .sort((a, b) => a.provider.localeCompare(b.provider))
}

/**
 * One vendor's cache row, rendered for a sentence: `90–99% off`.
 *
 * A vendor whose models all publish the same discount gets one number rather
 * than a pointless range.
 */
export function cacheDiscountText(row: CacheDiscountRow): string {
  const min = formatPct(row.min)
  const max = formatPct(row.max)
  return min === max ? `${min}%` : `${min}–${max}%`
}

/** The cache-discount rows the FAQ quotes, by provider id. */
export function cacheDiscountFor(provider: string): CacheDiscountRow | undefined {
  return cacheDiscountsByProvider().find((row) => row.provider === provider)
}

/** A vendor's cache discount as a sentence fragment, or `null` if it has none. */
export function cacheDiscountPhrase(provider: string): string | null {
  const row = cacheDiscountFor(provider)
  return row ? cacheDiscountText(row) : null
}

/**
 * The long-context multiplier as the registry contracts it.
 *
 * The old TL;DR said "Gemini 2.5 Pro doubles its input price above 200K" and
 * stopped there — it is not the only model with a long-context band (every
 * Gemini 2.5/3.1 row and the GPT-6 line have one), so the copy names the
 * threshold and the multiplier the registry records, not one model's anecdote.
 */
export interface LongContextExample {
  modelId: string
  name: string
  /** Input tokens above which the band starts. */
  threshold: number
  inputMultiplier: number
  outputMultiplier: number
}

/** Every active model that carries a long-context band, cheapest first. */
export function longContextExamples(): LongContextExample[] {
  return activeOfficialModels()
    .filter((model) => (model.longContext?.length ?? 0) > 0)
    .map((model) => {
      const band = model.longContext![0]
      return {
        modelId: model.id,
        name: model.displayName,
        threshold: band.threshold,
        inputMultiplier: band.inputMultiplier,
        outputMultiplier: band.outputMultiplier,
      }
    })
    .sort((a, b) => a.threshold - b.threshold)
}

/**
 * The DeepSeek off-peak discount, as the registry records it.
 *
 * Computed from `peakOffPeak.peak` vs `.offPeak` rather than typed: the
 * registry's own schedule note is the source, and if a vendor changes the
 * split the sentence follows.
 */
export function deepseekOffPeakDiscount(): number {
  const model = findModel('deepseek-flash')
  const peak = model?.peakOffPeak?.peak
  const offPeak = model?.peakOffPeak?.offPeak
  if (!peak || !offPeak || peak.inputPricePer1M <= 0) return 0
  return 1 - offPeak.inputPricePer1M / peak.inputPricePer1M
}

// ───── The shared TL;DR / tips strip ─────────────────────────────────────

/**
 * The parameter bag for the shared "quick takeaways" and "money-saving tips"
 * lists (`calc.tldr1…4`, `calc.tips1…5`).
 *
 * Those two arrays are on every calculator page, so they used to be the least
 * supervised copy on the site: "4–8×", "~90%", "Gemini 2.5 Pro doubles its
 * input price" — three claims, none of which the registry supports, typed
 * once and never revisited. Every number they *do* state is now resolved
 * here, and `faq-freshness.node.test.ts` scans the dictionary strings for a
 * raw figure so a number cannot be typed back in.
 */
export function sharedCopyParams(): Record<string, string | number> {
  const ratio = outputRatioRange()
  const band = longContextExamples()[0]
  const discounts = cacheDiscountsByProvider()
  const minDiscount = Math.min(...discounts.map((row) => row.min))
  const maxDiscount = Math.max(...discounts.map((row) => row.max))

  return {
    ratioMin: ratio.minText,
    ratioMax: ratio.maxText,
    ratioMedian: ratio.medianText,
    ratioCount: ratio.count,
    offPeakPct: formatPct(deepseekOffPeakDiscount()),
    bandThresholdK: Math.round(band.threshold / 1000),
    bandInputMultiplier: formatTimes(band.inputMultiplier),
    cacheMinPct: formatPct(minDiscount),
    cacheMaxPct: formatPct(maxDiscount),
    anthropicCache: cacheDiscountPhrase('anthropic') ?? '—',
    openaiCache: cacheDiscountPhrase('openai') ?? '—',
    googleCache: cacheDiscountPhrase('google') ?? '—',
    deepseekCache: cacheDiscountPhrase('deepseek') ?? '—',
    // OpenRouter's own fee schedule, from `vendor-claims.ts` (not the
    // registry): the platform fee is charged on credit purchases, never on
    // inference. The copy needs these to explain what the 1.05× column is
    // and is not.
    orStandardFeePct: openRouterCreditFees().standard,
    orBusinessFeePct: openRouterCreditFees().business,
  }
}
