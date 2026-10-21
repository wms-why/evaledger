import type {
  ModelPrice,
  PriceWindow,
  PricingChannel,
  PricingTier,
  Provider,
} from './types'
import { nextPriceWindow, resolvePriceWindow, utcDay } from './cost'
import { REGISTRY } from './model-prices'

/**
 * The site's "as of" moment: the day the price registry was assembled.
 *
 * The registry is a snapshot (`REGISTRY.fetchedAt`) — the moment it claims to
 * be true — so it is the day every DISPLAYED price is resolved against. A
 * render is therefore deterministic (the same registry always produces the
 * same price) and the number on the board is the number the calculator
 * charges for that day.
 */
export function registrySnapshotDate(): Date {
  return utcDay(REGISTRY.fetchedAt)
}

/**
 * The structured breakdown of ONE model's price, resolved for a given date.
 *
 * The calculator answers "what does this call cost" with a number; this
 * answers "what am I looking at, and until when?" — the four questions a
 * price on a screen must never leave open:
 *
 *  1. Is this the input rate, the output rate or the cache rate? (the three
 *     fields are separate, never a blended average)
 *  2. Who is selling it — the vendor itself or a router? (`channel`)
 *  3. Is the rate a promotion, and does it have an end date? (`promoActive`,
 *     `promoUntil`, `currentWindow`)
 *  4. What happens next? (`nextChange`)
 */
export interface PriceDetail {
  /** Registry id of the model. */
  modelId: string
  /** Effective input $/1M on the given date (the dated band, else the base price). */
  input: number
  /** Effective output $/1M on the given date. */
  output: number
  /** Effective cached-input $/1M on the given date, when the model has one. */
  cached?: number
  /** First-party vendor (`openai`, `anthropic`, …) or router (`openrouter`). */
  provider: Provider
  /** `official` = the vendor's own price list; `aggregator` = a router's quote. */
  channel: PricingChannel
  /** Service tiers the vendor publishes next to the standard rate. */
  tiers: PricingTier[]
  /** The model's dated price timeline (empty for a flat-rate model). */
  windows: PriceWindow[]
  /**
   * The dated band in force on the given date.
   *
   * Absent for a flat-rate model and for a date that falls outside every
   * band (the base price stands then). It carries the band's own `from` /
   * `until`, so a reader can see WHICH band the number on screen belongs to
   * — a promotional rate must never be shown as if it were the long-term one.
   */
  currentWindow?: PriceWindow
  /**
   * The day the temporary rate in force ends: the current band's `until`, or
   * the legacy `promo.untilDate`. Absent while a long-term rate is in force.
   */
  promoUntil?: string
  /**
   * `true` only while a promotional band is open. The key is ABSENT when no
   * promo is running — so `detail.promoActive` is falsy either way, and
   * `detail.promoActive !== undefined` is true only while the promo runs.
   */
  promoActive?: boolean
  /** The next band, when the timeline has one that has not started yet. */
  nextChange?: PriceWindow
  /** ISO date the row was last verified against `sourceUrl`. */
  lastVerified: string
  /** Canonical URL of the official pricing page this entry was sourced from. */
  sourceUrl: string
  /** Free-text note from the registry (English source of truth). */
  note?: string
}

/**
 * Resolve the price breakdown of a model for a given date.
 *
 * Uses the same dated band resolution as `calculateCost`, so the number the
 * calculator charges and the number this breakdown shows can never disagree:
 * the band whose `[from, until]` range contains `now` wins, and a date
 * outside every band falls back to the model's base price. Give both the
 * same date and they are the same number by construction.
 *
 * `now` defaults to the registry snapshot — the day the registry claims to be
 * true — so a rendered page is deterministic and always quotes the rate that
 * is in force for that day.
 */
export function priceDetail(model: ModelPrice, now: Date = registrySnapshotDate()): PriceDetail {
  const band = resolvePriceWindow(model, now)
  const windows = model.priceWindows ?? []
  const promo = model.promo
  const legacyPromoOpen = promo !== undefined && now <= new Date(promo.untilDate)
  // A band that carries an end date is a time-boxed one (promotional /
  // introductory); the band in force right now is open until that date.
  const bandPromoOpen = band !== undefined && band.until !== undefined

  const detail: PriceDetail = {
    modelId: model.id,
    input: band?.inputPricePer1M ?? model.inputPricePer1M,
    output: band?.outputPricePer1M ?? model.outputPricePer1M,
    cached: band?.cachedInputPricePer1M ?? model.cachedInputPricePer1M,
    provider: model.provider,
    channel: model.channel ?? 'official',
    tiers: model.tiers ?? [],
    windows,
    lastVerified: model.lastVerified,
    sourceUrl: model.sourceUrl,
    note: model.note,
  }

  if (legacyPromoOpen || bandPromoOpen) detail.promoActive = true
  if (band) detail.currentWindow = band
  // The day the temporary rate ends: the legacy promo's own end date, else
  // the end of the band in force.
  if (legacyPromoOpen && promo) detail.promoUntil = promo.untilDate
  else if (bandPromoOpen && band) detail.promoUntil = band.until

  const next = nextPriceWindow(model, now)
  if (next) detail.nextChange = next

  return detail
}
