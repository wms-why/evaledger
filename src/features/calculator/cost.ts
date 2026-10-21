import type { CostBreakdown, ModelPrice, PriceWindow } from './types'
import { REGISTRY } from './model-prices'

/**
 * Compute USD cost for a single model at a given input/output token count.
 *
 * Rules applied (in order):
 *  1. Dated price band — if the model carries `priceWindows`, the band whose
 *     [from, until] range contains "now" supplies the base prices (and the
 *     cache-hit rate, when the band states one). A model without windows is
 *     flat-rate. The legacy `promo` field still applies on top of it.
 *  2. Long-context — pick the highest-threshold tier the context of ONE
 *     request crosses (see `requestContextTokens`); multiply base prices by
 *     the tier's multipliers. If the request is under all thresholds, skip.
 *  3. Standard — base prices used as-is.
 *
 * Cache reads are NOT auto-applied: the user has to opt in via the form
 * (`useCachedInput` boolean). Cache writes likewise require `cacheWriteHits`
 * to be set. DeepSeek peak/off-peak: pass `peakHour: boolean` to switch
 * (default `true` = peak).
 *
 * OpenRouter pricing: caller should pass a `modelOverride` produced from
 * `applyOpenRouterMarkup()` rather than mutating the registry.
 */
/**
 * The workload every cost sample on the site quotes: 1M input + 500K output
 * tokens per month. It lives here — in the pricing domain — so the release
 * posts and the series ladders quote the same workload.
 */
export const SAMPLE_INPUT_TOKENS = 1_000_000
export const SAMPLE_OUTPUT_TOKENS = 500_000

export interface CalculateOptions {
  /** Use cached input price (e.g. prompt caching hit). Off by default. */
  useCachedInput?: boolean
  /** Tokens written to cache (Anthropic-style); adds to input cost. */
  cacheWriteHits?: number
  /** Which Anthropic cache write tier to use when `cacheWriteHits > 0`. */
  cacheWriteWindow?: '5min' | '1hr'
  /** DeepSeek peak vs off-peak. Default `true` (peak). */
  peakHour?: boolean
  /** Pass an overridden model (e.g. with OpenRouter markup baked in). */
  modelOverride?: ModelPrice
  /** "as of" date for promo evaluation — defaults to `new Date()`. Allows deterministic tests. */
  now?: Date
  /**
   * The context length of ONE request, in tokens — the only thing the
   * long-context price band is about ("prompts over 200K tokens").
   *
   * A caller that prices a **monthly total** must pass the per-request
   * context here: a 2,400-token request billed a million times a month is
   * still a 2,400-token request, and pricing the aggregate at the
   * long-context rate over-quotes the flagship models by up to 75%.
   *
   * Defaults to the token counts passed in, which is right for a caller that
   * prices a single request.
   */
  requestContextTokens?: number
}

const DAY_MS = 86_400_000

/** Start of an ISO day, in UTC. */
function startOfDay(iso: string): number {
  const parsed = Date.parse(`${iso}T00:00:00.000Z`)
  return Number.isFinite(parsed) ? parsed : Date.parse(iso)
}

/** Last millisecond of an ISO day, in UTC — a band ending that day covers all of it. */
function endOfDay(iso: string): number {
  const parsed = Date.parse(`${iso}T00:00:00.000Z`)
  return Number.isFinite(parsed) ? parsed + DAY_MS - 1 : Date.parse(iso)
}

/**
 * The UTC start of an ISO day, as a `Date`.
 *
 * The band resolver works at day granularity (UTC), so every "as of" date the
 * site states — the registry snapshot, a band's `from` / `until`, a legacy
 * promo's end date — is turned into the first millisecond of that day here.
 * One conversion, one meaning: a date-only string and a `Date` never stand
 * for different days.
 */
export function utcDay(iso: string): Date {
  return new Date(startOfDay(iso))
}

/**
 * The dated rate band that is in force on `now`.
 *
 * A band covers `[from, until]` inclusive, at day granularity (UTC): a band
 * with `until: '2026-11-21'` covers the whole of 2026-11-21. When two bands
 * overlap, the one that started most recently wins. Returns `undefined` for
 * a flat-rate model (no windows) and for a date that falls outside every
 * band — the caller then falls back to the model's base price.
 */
export function resolvePriceWindow(
  model: ModelPrice,
  now: Date = new Date(),
): PriceWindow | undefined {
  const windows = model.priceWindows
  if (!windows || windows.length === 0) return undefined
  const nowMs = now.getTime()
  let best: PriceWindow | undefined
  for (const band of windows) {
    const from = startOfDay(band.from)
    if (nowMs < from) continue
    if (band.until !== undefined && nowMs > endOfDay(band.until)) continue
    if (!best || startOfDay(band.from) > startOfDay(best.from)) best = band
  }
  return best
}

/**
 * The band that has not started yet — the next rate change, if the model's
 * timeline has one. `undefined` when the model is flat-rate or its last band
 * is already in force.
 */
export function nextPriceWindow(
  model: ModelPrice,
  now: Date = new Date(),
): PriceWindow | undefined {
  const windows = model.priceWindows
  if (!windows || windows.length === 0) return undefined
  const nowMs = now.getTime()
  let next: PriceWindow | undefined
  for (const band of windows) {
    const from = startOfDay(band.from)
    if (from <= nowMs) continue
    if (!next || from < startOfDay(next.from)) next = band
  }
  return next
}

/**
 * The `appliedRule` string for a dated band: the band's label plus the
 * boundary it ends on ("Promotional rate (until 2026-11-21)"), or the label
 * alone for a band that never ends ("Standard rate"). The shape is what
 * `pricing-rule.ts` localizes.
 */
export function priceWindowRule(band: PriceWindow): string {
  if (band.until) return `${band.label} (until ${band.until})`
  return band.label
}

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  options: CalculateOptions = {},
): CostBreakdown {
  const base = options.modelOverride ?? REGISTRY.models.find((m) => m.id === modelId)
  if (!base) throw new Error(`Unknown model: ${modelId}`)
  const model = base
  const now = options.now ?? new Date()
  // The long-context band is a property of ONE request, not of the monthly
  // total: `requestContextTokens` carries it when the caller prices a total.
  const requestContext = options.requestContextTokens ?? inputTokens + outputTokens

  // 1. Pick the effective base price (dated band > legacy promo > standard).
  let inputPrice = model.inputPricePer1M
  let outputPrice = model.outputPricePer1M
  let cachedPrice = model.cachedInputPricePer1M
  let cachedInputMultiplier = 1
  let appliedRule = 'standard'

  // A dated band is the model's price TIMELINE: the promotional band is in
  // force until it expires, then the standard band takes over. Outside every
  // band (before the first one, or after a gap) the base price stands.
  const band = resolvePriceWindow(model, now)
  if (band) {
    inputPrice = band.inputPricePer1M
    outputPrice = band.outputPricePer1M
    if (band.cachedInputPricePer1M !== undefined) cachedPrice = band.cachedInputPricePer1M
    appliedRule = priceWindowRule(band)
  }

  // The legacy `promo` field is an explicit per-row override; it still wins
  // over the band it sits on (no row carries both today).
  if (model.promo && now <= new Date(model.promo.untilDate)) {
    inputPrice = model.promo.inputPricePer1M
    outputPrice = model.promo.outputPricePer1M
    cachedPrice = model.cachedInputPricePer1M
    appliedRule = `promo (until ${model.promo.untilDate})`
  }

  // 2. Long-context surcharge.
  if (model.longContext && model.longContext.length > 0) {
    const sorted = [...model.longContext].sort((a, b) => a.threshold - b.threshold)
    // Pick the highest-threshold tier the request context crosses. Manual
    // reverse-find to keep the target lib es2022 (no Array.findLast).
    let tier: (typeof sorted)[number] | undefined
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (requestContext >= sorted[i]!.threshold) {
        tier = sorted[i]
        break
      }
    }
    if (tier) {
      inputPrice = inputPrice * tier.inputMultiplier
      outputPrice = outputPrice * tier.outputMultiplier
      cachedInputMultiplier = tier.inputMultiplier
      // The band the price came from stays visible: "Promotional rate (until
      // 2026-11-21) + long-context ≥272,000 (×2 / ×1.5)".
      const longContextRule = `long-context ≥${tier.threshold.toLocaleString()} (×${tier.inputMultiplier} / ×${tier.outputMultiplier})`
      appliedRule = appliedRule === 'standard' ? longContextRule : `${appliedRule} + ${longContextRule}`
    }
  }

  // 3. DeepSeek peak/off-peak. The period price REPLACES the base price
  //    (it is a schedule, not a multiplier), so it also replaces the rule.
  if (model.peakOffPeak) {
    const isPeak = options.peakHour !== false
    const tier = isPeak ? model.peakOffPeak.peak : model.peakOffPeak.offPeak
    inputPrice = tier.inputPricePer1M
    outputPrice = tier.outputPricePer1M
    appliedRule = isPeak ? 'peak hours' : 'off-peak hours'
  }

  // 4. Cached input replaces input rate (still subject to long-context / promo).
  //    A peak/off-peak tier may carry its own cache-hit rate; when it does not,
  //    fall back to the model's top-level rate, which is the peak rate.
  //    Providers price the long-context step on the cache rate too (OpenAI is
  //    explicit: "2x input and cache rates"), so the input multiplier applies
  //    to the cached rate as well.
  if (options.useCachedInput && cachedPrice !== undefined) {
    const tierCachePrice = model.peakOffPeak
      ? (options.peakHour !== false
          ? model.peakOffPeak.peak.cachedInputPricePer1M
          : model.peakOffPeak.offPeak.cachedInputPricePer1M)
      : undefined
    inputPrice = (tierCachePrice ?? cachedPrice) * cachedInputMultiplier
    appliedRule = appliedRule === 'standard' ? 'cached input' : `${appliedRule} + cached input`
  }

  // 5. Cache writes add a one-line cost item (Anthropic-style).
  let cacheWriteCost = 0
  let inputCost = (inputTokens / 1_000_000) * inputPrice
  const outputCost = (outputTokens / 1_000_000) * outputPrice

  if (options.cacheWriteHits && model.cacheWrite && model.cacheWrite.length > 0) {
    const window = options.cacheWriteWindow ?? '5min'
    const tier = model.cacheWrite.find((t) => t.window === window) ?? model.cacheWrite[0]
    cacheWriteCost = (options.cacheWriteHits / 1_000_000) * tier.pricePer1M
    appliedRule =
      appliedRule === 'standard' ? `cache write (${tier.window})` : `${appliedRule} + cache write (${tier.window})`
  }

  inputCost += cacheWriteCost
  const totalCost = inputCost + outputCost

  return {
    modelId: model.id,
    inputTokens,
    outputTokens,
    effectiveInputPricePer1M: round4(inputPrice),
    effectiveOutputPricePer1M: round4(outputPrice),
    inputCost: round4(inputCost),
    outputCost: round4(outputCost),
    totalCost: round4(totalCost),
    annualisedCost: round4(totalCost * 12),
    appliedRule,
  }
}

/**
 * Compute costs for every model in the registry in a single pass.
 * Used by the result grid on the calculator page.
 */
export function calculateAll(
  inputTokens: number,
  outputTokens: number,
  options: CalculateOptions = {},
): CostBreakdown[] {
  return REGISTRY.models
    .filter((m) => m.status === 'active')
    .map((m) => calculateCost(m.id, inputTokens, outputTokens, options))
}

/**
 * Apply OpenRouter's average markup to a model — used when the user asks
 * "what would this cost via OpenRouter instead of direct?". We do NOT mutate
 * the registry; instead we return a clone with bumped prices.
 *
 * The clone is an AGGREGATOR quote: the router sells one price — the rate in
 * force today (the dated band the vendor's timeline is on), marked up. The
 * official bands and tiers therefore do not travel with the clone: keeping
 * them would make the quote fall back to an un-marked-up band.
 */
export function applyOpenRouterMarkup(
  modelId: string,
  markup?: number,
  now: Date = new Date(),
): ModelPrice | null {
  const base = REGISTRY.models.find((m) => m.id === modelId)
  if (!base) return null
  const factor = markup ?? REGISTRY.openRouterMarkup
  const band = resolvePriceWindow(base, now)
  const input = band?.inputPricePer1M ?? base.inputPricePer1M
  const output = band?.outputPricePer1M ?? base.outputPricePer1M
  const cached = band?.cachedInputPricePer1M ?? base.cachedInputPricePer1M
  return {
    ...base,
    id: `${base.id}-via-openrouter`,
    provider: 'openrouter',
    channel: 'aggregator',
    displayName: `${base.displayName} (via OpenRouter)`,
    inputPricePer1M: round4(input * factor),
    outputPricePer1M: round4(output * factor),
    cachedInputPricePer1M:
      cached !== undefined ? round4(cached * factor) : undefined,
    priceWindows: undefined,
    tiers: undefined,
    note: `OpenRouter markup ×${factor.toFixed(2)} applied to ${base.displayName}.`,
  }
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000
}