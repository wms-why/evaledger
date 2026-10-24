import { priceWindowLabel } from '@/features/calculator/model-notes'
import type { Locale } from '@/features/i18n/locale'
import type { ModelPrice } from '@/features/calculator/types'
import {
  blendedOf,
  cacheDiscount,
  formatContext,
  formatMoney,
  formatThreshold,
  registryRow,
  VENDOR_PAGES,
  type VendorKey,
  type VendorPriceRow,
} from './data'

/**
 * The FAQ of a vendor pricing page — the questions the page is meant to
 * answer, and the numbers behind each answer.
 *
 * The questions and the sentence frames live in the landing dictionary; the
 * NUMBERS are resolved here, out of the price registry, at render time. The
 * same builder feeds the visible FAQ and the `FAQPage` JSON-LD, so the
 * structured data and the page can never quote different prices.
 */

/** A translation function — `translate(dict, key, params)` or `t()`. */
export type TFn = (key: string, params?: Record<string, string | number>) => string

export interface FaqEntry {
  /** The dictionary key of the question. */
  qKey: string
  /** The dictionary key of the answer. */
  aKey: string
  /** The values the answer interpolates — all resolved from the registry. */
  params: Record<string, string | number>
}

/** The blended rate of a leaderboard model, as the copy spells it. */
function blendedOfLeaderboard(modelId: string): string {
  const row = registryRow(modelId)
  if (!row) return '—'
  return formatMoney(row.blended)
}

/**
 * The clause that says a rate is a temporary one, or an empty string when
 * the rate is the long-term one.
 *
 * The band label is the registry's own English text, so it goes through the
 * Chinese overlay (`priceWindowLabel`) before it reaches a Chinese reader.
 */
function promoClause(row: VendorPriceRow, locale: Locale, t: TFn): string {
  const detail = row.detail
  if (!detail.promoActive || !detail.currentWindow || !detail.promoUntil) return ''
  const label = priceWindowLabel(detail.currentWindow.label, locale)
  return ` ${t('landing.common.promoClause', { label, date: detail.promoUntil })}`
}

/**
 * The long-context clause of a model: the threshold and the rates above it.
 *
 * The threshold and the multipliers are the registry's own, and the rates
 * above the threshold are that threshold's multipliers applied to the rate
 * in force — the same arithmetic `cost.ts` charges with.
 *
 * A vendor that publishes no long-context tier gets `—` for every field, so
 * the sentence reads "—" rather than leaving a `{threshold}` hole.
 */

/** The cache-write rates of a model, by TTL. */
function cacheWriteParams(model: ModelPrice | undefined): Record<string, string | number> {
  const writes = model?.cacheWrite
  if (!writes || writes.length === 0) return { write5: '—', write1h: '—' }
  const byWindow = (window: string) => writes.find((w) => w.window === window)
  const five = byWindow('5min')
  const hour = byWindow('1hr')
  return {
    write5: five ? formatMoney(five.pricePer1M) : '—',
    write1h: hour ? formatMoney(hour.pricePer1M) : '—',
  }
}

/** The long-context clause of a model, with `—` when the vendor publishes none. */
function longContextParams(model: ModelPrice): Record<string, string | number> {
  const tier = model.longContext?.[model.longContext.length - 1]
  if (!tier) return { threshold: '—', longInput: '—', longOutput: '—' }
  const detail = registryRow(model.id)?.detail
  const input = detail?.input ?? model.inputPricePer1M
  const output = detail?.output ?? model.outputPricePer1M
  return {
    threshold: formatThreshold(tier.threshold),
    longInput: formatMoney(input * tier.inputMultiplier),
    longOutput: formatMoney(output * tier.outputMultiplier),
  }
}

/**
 * The FAQ of a vendor page: five questions, each answered with the rates
 * the registry holds for that day.
 */
export function vendorFaq(vendor: VendorKey, locale: Locale, t: TFn): FaqEntry[] {
  const config = VENDOR_PAGES[vendor]
  const prefix = `landing.vendor.${vendor}`
  const featured = registryRow(config.featuredModelId)

  /**
   * The featured model's own figures, with `—` for anything the registry
   * does not publish.
   *
   * Every key is always present: a params object built as `featured ? {…} : {}`
   * narrows to a union whose second member has no keys at all, and TypeScript
   * then refuses to hand it to `t()` — which is the right refusal, because an
   * interpolation hole is a sentence with a `{placeholder}` left in it. So the
   * shape is fixed and the values degrade.
   */
  const base: Record<string, string | number> = featured
    ? {
        input: formatMoney(featured.detail.input),
        output: formatMoney(featured.detail.output),
        cached: featured.detail.cached != null ? formatMoney(featured.detail.cached) : '—',
        context: formatContext(featured.model.contextWindow),
        blended: formatMoney(featured.blended),
        discount:
          cacheDiscount(featured.detail.cached, featured.detail.input) != null
            ? `${cacheDiscount(featured.detail.cached, featured.detail.input)}%`
            : '—',
        promo: promoClause(featured, locale, t),
      }
    : {
        input: '—',
        output: '—',
        cached: '—',
        context: '—',
        blended: '—',
        discount: '—',
        promo: '',
      }

  switch (vendor) {
    case 'gemini': {
      const pro = registryRow('gemini-3.1-pro-preview')
      const lite = registryRow('gemini-3.1-flash-lite')
      return [
        {
          qKey: `${prefix}.faq1Q`,
          aKey: `${prefix}.faq1A`,
          params: base,
        },
        {
          qKey: `${prefix}.faq2Q`,
          aKey: `${prefix}.faq2A`,
          params: pro
            ? {
                input: formatMoney(pro.detail.input),
                output: formatMoney(pro.detail.output),
                ...longContextParams(pro.model),
              }
            : { input: '—', output: '—', threshold: '—', longInput: '—', longOutput: '—' },
        },
        {
          qKey: `${prefix}.faq3Q`,
          aKey: `${prefix}.faq3A`,
          params: lite
            ? {
                input: formatMoney(lite.detail.input),
                output: formatMoney(lite.detail.output),
                cached: lite.detail.cached != null ? formatMoney(lite.detail.cached) : '—',
                context: formatContext(lite.model.contextWindow),
              }
            : { input: '—', output: '—', cached: '—', context: '—' },
        },
        {
          qKey: `${prefix}.faq4Q`,
          aKey: `${prefix}.faq4A`,
          params: base,
        },
        {
          qKey: `${prefix}.faq5Q`,
          aKey: `${prefix}.faq5A`,
          params: {
            blended: base.blended,
            claude: blendedOfLeaderboard('claude-opus-5.5'),
            gpt: blendedOfLeaderboard('gpt-6-astra'),
          },
        },
      ]
    }

    case 'grok': {
      const row = registryRow('grok-4.7')
      return [
        { qKey: `${prefix}.faq1Q`, aKey: `${prefix}.faq1A`, params: base },
        { qKey: `${prefix}.faq2Q`, aKey: `${prefix}.faq2A`, params: base },
        {
          qKey: `${prefix}.faq3Q`,
          aKey: `${prefix}.faq3A`,
          params: row
            ? {
                input: formatMoney(row.detail.input),
                output: formatMoney(row.detail.output),
                ...longContextParams(row.model),
              }
            : { input: '—', output: '—', threshold: '—', longInput: '—', longOutput: '—' },
        },
        {
          qKey: `${prefix}.faq4Q`,
          aKey: `${prefix}.faq4A`,
          params: {
            blended: base.blended,
            gemini: blendedOfLeaderboard('gemini-4-argon'),
            claude: blendedOfLeaderboard('claude-opus-5.5'),
          },
        },
        { qKey: `${prefix}.faq5Q`, aKey: `${prefix}.faq5A`, params: base },
      ]
    }

    case 'minimax': {
      const m3 = registryRow('minimax-m3')
      const priority = m3?.model.tiers?.find((tier) => tier.kind === 'priority')
      return [
        { qKey: `${prefix}.faq1Q`, aKey: `${prefix}.faq1A`, params: base },
        {
          qKey: `${prefix}.faq2Q`,
          aKey: `${prefix}.faq2A`,
          params: m3
            ? {
                input: formatMoney(m3.detail.input),
                output: formatMoney(m3.detail.output),
                ...longContextParams(m3.model),
              }
            : { input: '—', output: '—', threshold: '—', longInput: '—', longOutput: '—' },
        },
        {
          qKey: `${prefix}.faq3Q`,
          aKey: `${prefix}.faq3A`,
          params: {
            ...base,
            m3Cached: m3 && m3.detail.cached != null ? formatMoney(m3.detail.cached) : '—',
          },
        },
        {
          qKey: `${prefix}.faq4Q`,
          aKey: `${prefix}.faq4A`,
          params: {
            blended: base.blended,
            deepseek: blendedOfLeaderboard('deepseek-flash'),
            gemini: blendedOfLeaderboard('gemini-4-argon'),
          },
        },
        {
          qKey: `${prefix}.faq5Q`,
          aKey: `${prefix}.faq5A`,
          params: priority
            ? {
                priorityInput: formatMoney(priority.inputPricePer1M ?? 0),
                priorityOutput: formatMoney(priority.outputPricePer1M ?? 0),
                multiplier: `×${priority.multiplier ?? 1}`,
              }
            : { priorityInput: '—', priorityOutput: '—', multiplier: '—' },
        },
      ]
    }

    case 'kimi': {
      const highspeed = registryRow('kimi-k3.1-pro-highspeed')
      const featuredRow = registryRow('kimi-k3.1-pro')
      return [
        { qKey: `${prefix}.faq1Q`, aKey: `${prefix}.faq1A`, params: base },
        {
          qKey: `${prefix}.faq2Q`,
          aKey: `${prefix}.faq2A`,
          params: {
            context: base.context,
            input: base.input,
            output: base.output,
          },
        },
        {
          qKey: `${prefix}.faq3Q`,
          aKey: `${prefix}.faq3A`,
          params: {
            ...cacheWriteParams(featuredRow?.model),
            cached: base.cached,
          },
        },
        {
          qKey: `${prefix}.faq4Q`,
          aKey: `${prefix}.faq4A`,
          params: {
            blended: base.blended,
            claude: blendedOfLeaderboard('claude-opus-5.5'),
            gpt: blendedOfLeaderboard('gpt-6-astra'),
          },
        },
        {
          qKey: `${prefix}.faq5Q`,
          aKey: `${prefix}.faq5A`,
          params: highspeed
            ? {
                highspeedInput: formatMoney(highspeed.detail.input),
                highspeedOutput: formatMoney(highspeed.detail.output),
              }
            : { highspeedInput: '—', highspeedOutput: '—' },
        },
      ]
    }
  }
}

/** The blended rate of a leaderboard model — re-exported for the pages. */
export { blendedOf }
