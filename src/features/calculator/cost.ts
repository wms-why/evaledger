import type { CostBreakdown, ModelPrice } from './types'
import { REGISTRY } from './model-prices'

/**
 * Compute USD cost for a single model at a given input/output token count.
 *
 * Rules applied (in order):
 *  1. Promo — if `Date.now()` is on/before `promo.untilDate`, use promo.
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

  // 1. Pick the effective base price (promo > standard).
  let inputPrice = model.inputPricePer1M
  let outputPrice = model.outputPricePer1M
  let cachedInputMultiplier = 1
  let appliedRule = 'standard'

  if (model.promo && now <= new Date(model.promo.untilDate)) {
    inputPrice = model.promo.inputPricePer1M
    outputPrice = model.promo.outputPricePer1M
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
      appliedRule = `long-context ≥${tier.threshold.toLocaleString()} (×${tier.inputMultiplier} / ×${tier.outputMultiplier})`
    }
  }

  // 3. DeepSeek peak/off-peak.
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
  if (options.useCachedInput && model.cachedInputPricePer1M !== undefined) {
    const tierCachePrice = model.peakOffPeak
      ? (options.peakHour !== false
          ? model.peakOffPeak.peak.cachedInputPricePer1M
          : model.peakOffPeak.offPeak.cachedInputPricePer1M)
      : undefined
    inputPrice = (tierCachePrice ?? model.cachedInputPricePer1M) * cachedInputMultiplier
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
 */
export function applyOpenRouterMarkup(modelId: string, markup?: number): ModelPrice | null {
  const base = REGISTRY.models.find((m) => m.id === modelId)
  if (!base) return null
  const factor = markup ?? REGISTRY.openRouterMarkup
  return {
    ...base,
    id: `${base.id}-via-openrouter`,
    provider: 'openrouter',
    displayName: `${base.displayName} (via OpenRouter)`,
    inputPricePer1M: round4(base.inputPricePer1M * factor),
    outputPricePer1M: round4(base.outputPricePer1M * factor),
    cachedInputPricePer1M:
      base.cachedInputPricePer1M !== undefined
        ? round4(base.cachedInputPricePer1M * factor)
        : undefined,
    note: `OpenRouter markup ×${factor.toFixed(2)} applied to ${base.displayName}.`,
  }
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000
}