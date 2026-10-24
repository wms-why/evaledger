import { REGISTRY, findModel } from './model-prices'
import { priceDetail, registrySnapshotDate } from './pricing-detail'
import { applyOpenRouterMarkup } from './cost'
import { claudeBreakEven, formatBreakEvenM } from './claude-break-even'
import {
  formatCents,
  formatMoney,
  formatPct,
  formatRate,
  formatTimes,
  formatTokenAmount,
} from './format'

/**
 * The copy of the calculator landing pages, with every number resolved from
 * the price registry.
 *
 * The dictionary (`src/features/i18n/dictionaries/calc.ts`) holds the WORDS;
 * this module holds the NUMBERS and hands them to the dictionary as
 * interpolation parameters. That split is the whole point: a sentence that
 * quotes "$0.30 / $1.20" gets its numbers from `REGISTRY` at render time,
 * so it cannot drift away from the table above it — which is exactly how the
 * previous copy of these pages came to quote two different cache-hit prices
 * for the same model, and a break-even the FAQ and the card disagreed on by
 * more than 3×.
 *
 * Everything here is deterministic: prices resolve against the registry
 * snapshot day (`REGISTRY.fetchedAt`), so the server render and the client
 * render produce the same string.
 */

/** The `t()` shape the i18n provider exposes. */
export type Translate = (key: string, params?: Record<string, string | number>) => string

export interface FaqEntry {
  /** The question, already translated. */
  q: string
  /** The answer, already translated — may contain `[[model:…|…]]` markers. */
  a: string
}

interface Rates {
  input: number
  output: number
  cached?: number
}

/** The rates in force for a model on the registry snapshot day. */
function rates(modelId: string): Rates | null {
  const model = findModel(modelId)
  if (!model) return null
  const detail = priceDetail(model, registrySnapshotDate())
  return { input: detail.input, output: detail.output, cached: detail.cached }
}

/** The off-peak rates of a peak/off-peak model (DeepSeek). */
function offPeakRates(modelId: string): Rates | null {
  const period = findModel(modelId)?.peakOffPeak?.offPeak
  if (!period) return null
  return {
    input: period.inputPricePer1M,
    output: period.outputPricePer1M,
    cached: period.cachedInputPricePer1M,
  }
}

/** A cache-write rate, by window ('5min' | '1hr'). */
function cacheWriteRate(modelId: string, window: '5min' | '1hr'): number | undefined {
  const tiers = findModel(modelId)?.cacheWrite ?? []
  return (tiers.find((tier) => tier.window === window) ?? tiers[0])?.pricePer1M
}

/** How much cheaper `cheap` is than `dear`, as a multiple. */
function timesCheaper(dear: number, cheap: number): number {
  if (cheap <= 0) return 0
  return dear / cheap
}

/**
 * A model's rates, formatted for a meta description.
 *
 * A page's meta description is copy the site publishes, so a price written
 * into it is a claim that goes stale the moment the vendor changes it. This
 * resolves the numbers from the registry at render time, exactly like the
 * body of the page does, so the description can never contradict the table
 * underneath it.
 *
 * A model the registry does not carry comes back with an em-dash for every
 * rate — a visible "we have no price for this", never a fabricated zero.
 */
export function modelRateSummary(modelId: string): {
  model: string
  input: string
  output: string
  cached: string
  cachedPct: string
} {
  const model = findModel(modelId)
  if (!model) {
    return { model: modelId, input: '—', output: '—', cached: '—', cachedPct: '—' }
  }
  const detail = priceDetail(model, registrySnapshotDate())
  const saving = detail.cached != null && detail.input > 0 ? 1 - detail.cached / detail.input : 0
  return {
    model: model.displayName,
    input: formatMoney(detail.input),
    output: formatMoney(detail.output),
    cached: detail.cached != null ? formatMoney(detail.cached) : '—',
    cachedPct: formatPct(saving),
  }
}

/** The fraction of a rate saved by using the cached rate instead. */
function cacheSaving(input: number, cached: number | undefined): number {
  if (cached === undefined || input <= 0) return 0
  return 1 - cached / input
}

/** The OpenRouter markup, as the copy states it. */
export function openRouterMarkupPercent(): number {
  return Math.round((REGISTRY.openRouterMarkup - 1) * 100)
}

/** The OpenRouter markup factor, as the copy states it ("1.05"). */
export function openRouterMarkupFactor(): string {
  return REGISTRY.openRouterMarkup.toFixed(2)
}

// ───── Token Cost Calculator (the all-providers page) ─────────────────────

export function tokenFaq(t: Translate): FaqEntry[] {
  const luna = rates('gpt-6-luna')
  const haiku = rates('claude-haiku-4.5')
  const opus = rates('claude-opus-5.5')
  const flash = rates('deepseek-flash')
  const be = claudeBreakEven()
  const flashCachePct = flash ? cacheSaving(flash.input, flash.cached) : 0

  const p = {
    lunaIn: formatMoney(luna?.input ?? 0),
    lunaOut: formatMoney(luna?.output ?? 0),
    haikuIn: formatMoney(haiku?.input ?? 0),
    haikuOut: formatMoney(haiku?.output ?? 0),
    opusIn: formatMoney(opus?.input ?? 0),
    opusOut: formatMoney(opus?.output ?? 0),
    flashIn: formatMoney(flash?.input ?? 0),
    flashOut: formatMoney(flash?.output ?? 0),
    flashCachePct: formatPct(flashCachePct),
    markupPct: openRouterMarkupPercent(),
    multiplier: openRouterMarkupFactor(),
    proIn: be ? formatBreakEvenM(be.proInputM) : '0',
    proOut: be ? formatBreakEvenM(be.proOutputM) : '0',
    maxIn: be ? formatBreakEvenM(be.maxInputM) : '0',
    maxOut: be ? formatBreakEvenM(be.maxOutputM) : '0',
  }

  return [
    { q: t('calc.tokenFaq1Q'), a: t('calc.tokenFaq1A', p) },
    { q: t('calc.tokenFaq2Q'), a: t('calc.tokenFaq2A') },
    { q: t('calc.tokenFaq3Q'), a: t('calc.tokenFaq3A') },
    { q: t('calc.tokenFaq4Q'), a: t('calc.tokenFaq4A') },
    { q: t('calc.tokenFaq5Q'), a: t('calc.tokenFaq5A', p) },
    { q: t('calc.tokenFaq6Q'), a: t('calc.tokenFaq6A', p) },
    { q: t('calc.tokenFaq7Q'), a: t('calc.tokenFaq7A', p) },
    { q: t('calc.tokenFaq8Q'), a: t('calc.tokenFaq8A', { date: REGISTRY.fetchedAt }) },
  ]
}

/** The shared "quick takeaways" strip. */
export function sharedTldr(t: Translate): string[] {
  return [t('calc.tldr1'), t('calc.tldr2'), t('calc.tldr3'), t('calc.tldr4')]
}

/** The shared "how to bring the bill down" list. */
export function sharedTips(t: Translate): string[] {
  return [t('calc.tips1'), t('calc.tips2'), t('calc.tips3'), t('calc.tips4'), t('calc.tips5')]
}

// ───── Claude ──────────────────────────────────────────────────────────────

export function claudeFaq(t: Translate): FaqEntry[] {
  const sonnet = rates('claude-sonnet-5')
  const opus = rates('claude-opus-5.5')
  const haiku = rates('claude-haiku-4.5')
  const fable = rates('claude-fable-5.1')
  const be = claudeBreakEven()

  // 10,000 tokens = 0.01M; 200,000 tokens = 0.2M.
  const tenK = 0.01
  const twoHundredK = 0.2
  const sonnetCachePct = sonnet ? cacheSaving(sonnet.input, sonnet.cached) : 0

  const p = {
    sonnetIn: formatMoney(sonnet?.input ?? 0),
    sonnetOut: formatMoney(sonnet?.output ?? 0),
    sonnetCached: formatMoney(sonnet?.cached ?? 0),
    sonnetCachePct: formatPct(sonnetCachePct),
    sonnetCw: formatMoney(cacheWriteRate('claude-sonnet-5', '5min') ?? 0),
    sonnet10kIn: formatMoney((sonnet?.input ?? 0) * tenK),
    sonnet10kInCents: formatCents((sonnet?.input ?? 0) * tenK),
    sonnet10kOut: formatMoney((sonnet?.output ?? 0) * tenK),
    sonnet10kOutCents: formatCents((sonnet?.output ?? 0) * tenK),
    opus10kIn: formatMoney((opus?.input ?? 0) * tenK),
    opus10kOut: formatMoney((opus?.output ?? 0) * tenK),
    haiku10kIn: formatMoney((haiku?.input ?? 0) * tenK),
    haiku10kOut: formatMoney((haiku?.output ?? 0) * tenK),
    sonnet5In: formatTokenAmount(5 / (sonnet?.input || 1)),
    sonnet5Out: formatTokenAmount(5 / (sonnet?.output || 1)),
    haiku5In: formatTokenAmount(5 / (haiku?.input || 1)),
    haiku5Out: formatTokenAmount(5 / (haiku?.output || 1)),
    opus5In: formatTokenAmount(5 / (opus?.input || 1)),
    opus5Out: formatTokenAmount(5 / (opus?.output || 1)),
    sonnet200kIn: formatMoney((sonnet?.input ?? 0) * twoHundredK),
    opus200kIn: formatMoney((opus?.input ?? 0) * twoHundredK),
    haiku200kIn: formatMoney((haiku?.input ?? 0) * twoHundredK),
    sonnet200kOut: formatMoney((sonnet?.output ?? 0) * twoHundredK),
    opus200kOut: formatMoney((opus?.output ?? 0) * twoHundredK),
    haiku200kOut: formatMoney((haiku?.output ?? 0) * twoHundredK),
    proIn: be ? formatBreakEvenM(be.proInputM) : '0',
    proOut: be ? formatBreakEvenM(be.proOutputM) : '0',
    maxIn: be ? formatBreakEvenM(be.maxInputM) : '0',
    maxOut: be ? formatBreakEvenM(be.maxOutputM) : '0',
    haikuCw5: formatMoney(cacheWriteRate('claude-haiku-4.5', '5min') ?? 0),
    haikuCw1h: formatMoney(cacheWriteRate('claude-haiku-4.5', '1hr') ?? 0),
    haikuIn: formatMoney(haiku?.input ?? 0),
    haikuOut: formatMoney(haiku?.output ?? 0),
    opusIn: formatMoney(opus?.input ?? 0),
    opusOut: formatMoney(opus?.output ?? 0),
    fableIn: formatMoney(fable?.input ?? 0),
    fableOut: formatMoney(fable?.output ?? 0),
  }

  return [
    { q: t('calc.claudeFaq1Q'), a: t('calc.claudeFaq1A', p) },
    { q: t('calc.claudeFaq2Q'), a: t('calc.claudeFaq2A', p) },
    { q: t('calc.claudeFaq3Q'), a: t('calc.claudeFaq3A', p) },
    { q: t('calc.claudeFaq4Q'), a: t('calc.claudeFaq4A', p) },
    { q: t('calc.claudeFaq5Q'), a: t('calc.claudeFaq5A', p) },
    { q: t('calc.claudeFaq6Q'), a: t('calc.claudeFaq6A', p) },
    { q: t('calc.claudeFaq7Q'), a: t('calc.claudeFaq7A', p) },
    { q: t('calc.claudeFaq8Q'), a: t('calc.claudeFaq8A') },
  ]
}

// ───── DeepSeek ────────────────────────────────────────────────────────────

export function deepseekFaq(t: Translate): FaqEntry[] {
  const flash = rates('deepseek-flash')
  const pro = rates('deepseek-v4-pro')
  const flashOff = offPeakRates('deepseek-flash')
  const proOff = offPeakRates('deepseek-v4-pro')
  const sol = rates('gpt-6-sol')
  const sonnet = rates('claude-sonnet-5')
  const opus = rates('claude-opus-5.5')

  const p = {
    flashIn: formatMoney(flash?.input ?? 0),
    flashOut: formatMoney(flash?.output ?? 0),
    flashCachedPeak: formatMoney(flash?.cached ?? 0),
    flashCachedOff: formatMoney(flashOff?.cached ?? 0),
    flashCachePct: formatPct(cacheSaving(flash?.input ?? 0, flash?.cached)),
    flashOffIn: formatMoney(flashOff?.input ?? 0),
    flashOffOut: formatMoney(flashOff?.output ?? 0),
    proIn: formatMoney(pro?.input ?? 0),
    proOut: formatMoney(pro?.output ?? 0),
    proCachedPeak: formatMoney(pro?.cached ?? 0),
    proCachedOff: formatMoney(proOff?.cached ?? 0),
    proCachePct: formatPct(cacheSaving(pro?.input ?? 0, pro?.cached)),
    proOffIn: formatMoney(proOff?.input ?? 0),
    proOffOut: formatMoney(proOff?.output ?? 0),
    solOut: formatMoney(sol?.output ?? 0),
    flashVsSol: formatTimes(timesCheaper(sol?.output ?? 0, flash?.output ?? 0)),
    proVsSol: formatTimes(timesCheaper(sol?.output ?? 0, pro?.output ?? 0)),
    flashVsOpusIn: formatTimes(timesCheaper(opus?.input ?? 0, flash?.input ?? 0)),
    flashVsOpusOut: formatTimes(timesCheaper(opus?.output ?? 0, flash?.output ?? 0)),
    proVsSonnet: formatTimes(timesCheaper(sonnet?.output ?? 0, pro?.output ?? 0)),
    proVsOpus: formatTimes(timesCheaper(opus?.output ?? 0, pro?.output ?? 0)),
    markupPct: openRouterMarkupPercent(),
  }

  return [
    { q: t('calc.deepseekFaq1Q'), a: t('calc.deepseekFaq1A', p) },
    { q: t('calc.deepseekFaq2Q'), a: t('calc.deepseekFaq2A', p) },
    { q: t('calc.deepseekFaq3Q'), a: t('calc.deepseekFaq3A', p) },
    { q: t('calc.deepseekFaq4Q'), a: t('calc.deepseekFaq4A', p) },
    { q: t('calc.deepseekFaq5Q'), a: t('calc.deepseekFaq5A', p) },
    { q: t('calc.deepseekFaq6Q'), a: t('calc.deepseekFaq6A', p) },
    { q: t('calc.deepseekFaq7Q'), a: t('calc.deepseekFaq7A', p) },
    { q: t('calc.deepseekFaq8Q'), a: t('calc.deepseekFaq8A') },
  ]
}

export function deepseekTldr(t: Translate): string[] {
  const flash = rates('deepseek-flash')
  const pro = rates('deepseek-v4-pro')
  const flashOff = offPeakRates('deepseek-flash')
  const sol = rates('gpt-6-sol')
  const sonnet = rates('claude-sonnet-5')

  const p = {
    flashIn: formatMoney(flash?.input ?? 0),
    flashOut: formatMoney(flash?.output ?? 0),
    flashCachedPeak: formatMoney(flash?.cached ?? 0),
    flashCachedOff: formatMoney(flashOff?.cached ?? 0),
    flashCachePct: formatPct(cacheSaving(flash?.input ?? 0, flash?.cached)),
    flashVsSol: formatTimes(timesCheaper(sol?.output ?? 0, flash?.output ?? 0)),
    proIn: formatMoney(pro?.input ?? 0),
    proOut: formatMoney(pro?.output ?? 0),
    proVsSonnet: formatTimes(timesCheaper(sonnet?.output ?? 0, pro?.output ?? 0)),
  }
  return [
    t('calc.deepseekTldr1', p),
    t('calc.deepseekTldr2', p),
    t('calc.deepseekTldr3', p),
    t('calc.deepseekTldr4', p),
  ]
}

export function deepseekTips(t: Translate): string[] {
  const flash = rates('deepseek-flash')
  const pro = rates('deepseek-v4-pro')

  const p = {
    flashIn: formatMoney(flash?.input ?? 0),
    flashOut: formatMoney(flash?.output ?? 0),
    flashCachedPeak: formatMoney(flash?.cached ?? 0),
    flashCachePct: formatPct(cacheSaving(flash?.input ?? 0, flash?.cached)),
    proOut: formatMoney(pro?.output ?? 0),
    flashVsPro: formatTimes(timesCheaper(pro?.output ?? 0, flash?.output ?? 0)),
    markupPct: openRouterMarkupPercent(),
  }
  return [
    t('calc.deepseekTips1', p),
    t('calc.deepseekTips2', p),
    t('calc.deepseekTips3', p),
    t('calc.deepseekTips4', p),
    t('calc.deepseekTips5', p),
  ]
}

/** The DeepSeek cache block's body — the discount is computed, not typed. */
export function deepseekCacheBody(t: Translate): string {
  const flash = rates('deepseek-flash')
  const pro = rates('deepseek-v4-pro')
  return t('calc.deepseekCacheBody', {
    flashCachePct: formatPct(cacheSaving(flash?.input ?? 0, flash?.cached)),
    proCachePct: formatPct(cacheSaving(pro?.input ?? 0, pro?.cached)),
  })
}

// ───── ChatGPT ─────────────────────────────────────────────────────────────

export function chatgptFaq(t: Translate): FaqEntry[] {
  const astra = rates('gpt-6-astra')
  const sol = rates('gpt-6-sol')
  const luna = rates('gpt-6-luna')

  const p = {
    astraIn: formatMoney(astra?.input ?? 0),
    astraOut: formatMoney(astra?.output ?? 0),
    astraCached: formatMoney(astra?.cached ?? 0),
    solIn: formatMoney(sol?.input ?? 0),
    solOut: formatMoney(sol?.output ?? 0),
    solCached: formatMoney(sol?.cached ?? 0),
    solCachePct: formatPct(cacheSaving(sol?.input ?? 0, sol?.cached)),
    lunaIn: formatMoney(luna?.input ?? 0),
    lunaOut: formatMoney(luna?.output ?? 0),
    astra5In: formatTokenAmount(5 / (astra?.input || 1)),
    astra5Out: formatTokenAmount(5 / (astra?.output || 1)),
    sol5In: formatTokenAmount(5 / (sol?.input || 1)),
    sol5Out: formatTokenAmount(5 / (sol?.output || 1)),
    luna5In: formatTokenAmount(5 / (luna?.input || 1)),
    luna5Out: formatTokenAmount(5 / (luna?.output || 1)),
    astra200kIn: formatMoney((astra?.input ?? 0) * 0.2),
    astra200kOut: formatMoney((astra?.output ?? 0) * 0.2),
    sol200kIn: formatMoney((sol?.input ?? 0) * 0.2),
    sol200kOut: formatMoney((sol?.output ?? 0) * 0.2),
    luna200kIn: formatMoney((luna?.input ?? 0) * 0.2),
    luna200kOut: formatMoney((luna?.output ?? 0) * 0.2),
    lunaVsSol: formatTimes(timesCheaper(sol?.output ?? 0, luna?.output ?? 0)),
    markupPct: openRouterMarkupPercent(),
  }

  return [
    { q: t('calc.chatgptFaq1Q'), a: t('calc.chatgptFaq1A', p) },
    { q: t('calc.chatgptFaq2Q'), a: t('calc.chatgptFaq2A', p) },
    { q: t('calc.chatgptFaq3Q'), a: t('calc.chatgptFaq3A', p) },
    { q: t('calc.chatgptFaq4Q'), a: t('calc.chatgptFaq4A', p) },
    { q: t('calc.chatgptFaq5Q'), a: t('calc.chatgptFaq5A', p) },
    { q: t('calc.chatgptFaq6Q'), a: t('calc.chatgptFaq6A') },
    { q: t('calc.chatgptFaq7Q'), a: t('calc.chatgptFaq7A', p) },
    { q: t('calc.chatgptFaq8Q'), a: t('calc.chatgptFaq8A') },
  ]
}

export function chatgptTldr(t: Translate): string[] {
  const astra = rates('gpt-6-astra')
  const sol = rates('gpt-6-sol')
  const luna = rates('gpt-6-luna')

  const p = {
    astraIn: formatMoney(astra?.input ?? 0),
    astraOut: formatMoney(astra?.output ?? 0),
    solIn: formatMoney(sol?.input ?? 0),
    solOut: formatMoney(sol?.output ?? 0),
    solCached: formatMoney(sol?.cached ?? 0),
    solCachePct: formatPct(cacheSaving(sol?.input ?? 0, sol?.cached)),
    lunaIn: formatMoney(luna?.input ?? 0),
    lunaOut: formatMoney(luna?.output ?? 0),
  }
  return [
    t('calc.chatgptTldr1', p),
    t('calc.chatgptTldr2', p),
    t('calc.chatgptTldr3', p),
    t('calc.chatgptTldr4', p),
  ]
}

export function chatgptTips(t: Translate): string[] {
  const sol = rates('gpt-6-sol')
  const luna = rates('gpt-6-luna')

  const p = {
    solOut: formatMoney(sol?.output ?? 0),
    lunaOut: formatMoney(luna?.output ?? 0),
    lunaVsSol: formatTimes(timesCheaper(sol?.output ?? 0, luna?.output ?? 0)),
  }
  return [
    t('calc.chatgptTips1', p),
    t('calc.chatgptTips2', p),
    t('calc.chatgptTips3', p),
    t('calc.chatgptTips4', p),
    t('calc.chatgptTips5', p),
  ]
}

// ───── OpenRouter ──────────────────────────────────────────────────────────

/** One row of the direct-vs-OpenRouter table. */
export interface OpenRouterRow {
  modelId: string
  displayName: string
  provider: string
  /** The provider's own price ($/1M input). */
  directInput: number
  /** The provider's own price ($/1M output). */
  directOutput: number
  /** The price via OpenRouter ($/1M input). */
  routerInput: number
  /** The price via OpenRouter ($/1M output). */
  routerOutput: number
}

/**
 * Every active model, priced both ways.
 *
 * The direct price is `priceDetail()`'s resolution (the band in force on the
 * registry snapshot day); the OpenRouter price is `applyOpenRouterMarkup()`'s
 * — the very function the calculator uses to build its OpenRouter quote. The
 * two can therefore never disagree with the calculator.
 */
export function openRouterRows(): OpenRouterRow[] {
  const now = registrySnapshotDate()
  const rows: OpenRouterRow[] = []
  for (const model of REGISTRY.models) {
    if (model.status !== 'active') continue
    const detail = priceDetail(model, now)
    const viaRouter = applyOpenRouterMarkup(model.id, undefined, now)
    if (!viaRouter) continue
    rows.push({
      modelId: model.id,
      displayName: model.displayName,
      provider: model.provider,
      directInput: detail.input,
      directOutput: detail.output,
      routerInput: viaRouter.inputPricePer1M,
      routerOutput: viaRouter.outputPricePer1M,
    })
  }
  return rows.sort((a, b) => a.directInput - b.directInput || a.directOutput - b.directOutput)
}

export function openrouterFaq(t: Translate): FaqEntry[] {
  const astra = rates('gpt-6-astra')
  const sonnet = rates('claude-sonnet-5')
  const now = registrySnapshotDate()
  const orAstra = applyOpenRouterMarkup('gpt-6-astra', undefined, now)
  const orSonnet = applyOpenRouterMarkup('claude-sonnet-5', undefined, now)

  const p = {
    markupPct: openRouterMarkupPercent(),
    multiplier: openRouterMarkupFactor(),
    astraIn: formatMoney(astra?.input ?? 0),
    astraOut: formatMoney(astra?.output ?? 0),
    orAstraIn: formatMoney(orAstra?.inputPricePer1M ?? 0),
    orAstraOut: formatMoney(orAstra?.outputPricePer1M ?? 0),
    sonnetIn: formatMoney(sonnet?.input ?? 0),
    sonnetOut: formatMoney(sonnet?.output ?? 0),
    orSonnetIn: formatMoney(orSonnet?.inputPricePer1M ?? 0),
    orSonnetOut: formatMoney(orSonnet?.outputPricePer1M ?? 0),
  }

  return [
    { q: t('calc.openrouterFaq1Q'), a: t('calc.openrouterFaq1A', p) },
    { q: t('calc.openrouterFaq2Q'), a: t('calc.openrouterFaq2A') },
    { q: t('calc.openrouterFaq3Q'), a: t('calc.openrouterFaq3A', p) },
    { q: t('calc.openrouterFaq4Q'), a: t('calc.openrouterFaq4A') },
    { q: t('calc.openrouterFaq5Q'), a: t('calc.openrouterFaq5A') },
    { q: t('calc.openrouterFaq6Q'), a: t('calc.openrouterFaq6A', p) },
    { q: t('calc.openrouterFaq7Q'), a: t('calc.openrouterFaq7A') },
    { q: t('calc.openrouterFaq8Q'), a: t('calc.openrouterFaq8A', { date: REGISTRY.fetchedAt }) },
  ]
}

/** The OpenRouter markup block's body — the percentage is the registry's. */
export function openrouterMarkupBody(t: Translate): string {
  return t('calc.openrouterMarkupBody', {
    markupPct: openRouterMarkupPercent(),
    multiplier: openRouterMarkupFactor(),
  })
}

// ───── Results grid group labels ──────────────────────────────────────────

export function vendorGroupLabel(t: Translate, vendor: string): string {
  return t('calc.resultsVendorGroup', { vendor })
}

export function crossVendorLabel(t: Translate): string {
  return t('calc.resultsCrossVendor')
}

// ───── Re-exported formatters (the components use the same ones) ──────────

export { formatRate, formatMoney }
