import { formatMoney, formatPct, formatTokenAmount } from '@/features/calculator/format'
import { REGISTRY } from '@/features/calculator/model-prices'
import { priceDetail } from '@/features/calculator/pricing-detail'
import type { ModelPrice, Provider } from '@/features/calculator/types'
import { COMPARE_PAIR_ENTRIES, pairSlug } from '@/features/leaderboard/leaderboard'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { TRACK_IDS, TRACKS, rankTrack, scoreTrack, type TrackSlug } from '@/features/leaderboard/scoring'
import type { LeaderboardModel } from '@/features/leaderboard/types'

/**
 * The landing slice's pure data layer.
 *
 * Everything here resolves a number **at render time** out of the two
 * registries: `REGISTRY` (prices) and `LEADERBOARD` (scores). Nothing in
 * this file types a price, a score or a context window — the copy asks for
 * them through the helpers below, so a price change moves the page and the
 * calculator in the same commit without anybody editing prose.
 *
 * The module is pure (no React, no env, no `Date.now()`), so it runs in the
 * node test pool.
 */

// ───────────────────────── Vendor pages ─────────────────────────

/** The four vendors that get their own pricing landing page. */
export type VendorKey = 'gemini' | 'grok' | 'minimax' | 'kimi'

export interface VendorPageConfig {
  /** The provider whose registry rows the page prices. */
  provider: Provider
  /**
   * The model the page lands on — the one people search for by name, and
   * the one the calculator pre-selects. It must exist in `REGISTRY`
   * (the calculator validates it) and in `LEADERBOARD` (the model page
   * links to it).
   */
  featuredModelId: string
  /** The page's path, without the locale prefix. */
  path: string
}

export const VENDOR_PAGES: Record<VendorKey, VendorPageConfig> = {
  gemini: { provider: 'google', featuredModelId: 'gemini-4-argon', path: '/gemini-api-pricing' },
  grok: { provider: 'grok', featuredModelId: 'grok-4.7', path: '/grok-api-pricing' },
  minimax: { provider: 'minimax', featuredModelId: 'minimax-m3.1-flash', path: '/minimax-api-pricing' },
  kimi: { provider: 'kimi', featuredModelId: 'kimi-k3.1-pro', path: '/kimi-api-pricing' },
}

/** One registry row, resolved: the rate in force and the blended rate. */
export interface VendorPriceRow {
  model: ModelPrice
  detail: ReturnType<typeof priceDetail>
  /** (input + output) / 2 — the rate the board sorts by. */
  blended: number
}

/**
 * Every registry row of a vendor, with the rate IN FORCE resolved.
 *
 * `priceDetail` resolves the dated band exactly the way `calculateCost`
 * charges it, so the number this page prints is the number the calculator
 * bills — a promotional base rate is never shown as the long-term price.
 *
 * Order: the featured model first (it is what the page is about), then the
 * other active models by descending blended rate (flagship-ish first), then
 * the retired rows — kept, because a retired price is still a search entry.
 */
export function vendorRows(provider: Provider, featuredModelId?: string): VendorPriceRow[] {
  const rows = REGISTRY.models
    .filter((model) => model.provider === provider)
    .map((model) => {
      const detail = priceDetail(model)
      return { model, detail, blended: (detail.input + detail.output) / 2 }
    })
  rows.sort((a, b) => {
    if (featuredModelId) {
      if (a.model.id === featuredModelId) return -1
      if (b.model.id === featuredModelId) return 1
    }
    if (a.model.status !== b.model.status) return a.model.status === 'active' ? -1 : 1
    return b.blended - a.blended
  })
  return rows
}

/** A registry row by id. */
export function registryRow(id: string): VendorPriceRow | undefined {
  const model = REGISTRY.models.find((m) => m.id === id)
  if (!model) return undefined
  const detail = priceDetail(model)
  return { model, detail, blended: (detail.input + detail.output) / 2 }
}

// ───────────────────────── Prices across models ─────────────────────────

/** A leaderboard model joined to its price row. */
export interface PricedModel {
  model: LeaderboardModel
  price: ModelPrice
  /** The blended rate in force (input + output) / 2. */
  blended: number
}

/** Every leaderboard model that has a price row, with its blended rate. */
export function pricedModels(): PricedModel[] {
  const out: PricedModel[] = []
  for (const model of LEADERBOARD.models) {
    if (!model.priceId) continue
    const price = REGISTRY.models.find((p) => p.id === model.priceId)
    if (!price) continue
    const detail = priceDetail(price)
    out.push({ model, price, blended: (detail.input + detail.output) / 2 })
  }
  return out
}

/**
 * The price tier a model sits in: `value`, `mid` or `premium`.
 *
 * The bands are the TERTILES of the blended rates we publish, so a tier is
 * a fact about the data rather than a label somebody typed. A model with no
 * price row has no tier — it is not silently dropped, it simply is not
 * comparable on price.
 */
export type PriceTier = 'value' | 'mid' | 'premium'

export function priceTierOf(modelId: string): PriceTier | undefined {
  const priced = pricedModels().sort((a, b) => a.blended - b.blended)
  const n = priced.length
  if (n === 0) return undefined
  const entry = priced.find((p) => p.model.id === modelId)
  if (!entry) return undefined
  const p33 = priced[Math.floor(n / 3)]!.blended
  const p67 = priced[Math.min(n - 1, Math.floor((2 * n) / 3))]!.blended
  if (entry.blended <= p33) return 'value'
  if (entry.blended <= p67) return 'mid'
  return 'premium'
}

/** How many models we price, and where this one sits among them. */
export function priceRankOf(modelId: string): { rank: number; of: number } | undefined {
  const priced = pricedModels()
  const entry = priced.find((p) => p.model.id === modelId)
  if (!entry) return undefined
  const cheaper = priced.filter((p) => p.blended < entry.blended).length
  return { rank: cheaper + 1, of: priced.length }
}

// ───────────────────────── Board scores ─────────────────────────

/** Where a model stands on the board it is best at. */
export interface BoardStanding {
  slug: TrackSlug
  /** The composite (0–100) on that board. */
  composite: number
  /** Its position in that board's ranked list (1 = best). */
  rank: number
  /** How many models that board ranks. */
  ranked: number
}

/**
 * The board a model does best on, with its position on it.
 *
 * A model is only ranked on a board it was measured on EVERY core benchmark
 * of (`scoring.ts` owns that gate), so a standing here always has a real
 * denominator behind it.
 */
export function bestBoardStanding(model: LeaderboardModel): BoardStanding | undefined {
  let best: BoardStanding | undefined
  for (const slug of TRACK_IDS) {
    const track = TRACKS[slug]
    const score = scoreTrack(model, track)
    if (score.composite == null) continue
    if (best && best.composite >= score.composite) continue
    const ranking = rankTrack(track)
    const rank = ranking.ranked.findIndex((entry) => entry.model.id === model.id) + 1
    best = { slug, composite: score.composite, rank, ranked: ranking.ranked.length }
  }
  return best
}

// ───────────────────────── The "is it worth it" verdict ─────────────────────────

/** The computed verdict codes. Each one has a sentence in the dictionary. */
export type VerdictCode =
  | 'cheapStrong'
  | 'cheapWeak'
  | 'flagship'
  | 'overpriced'
  | 'balanced'
  | 'unproven'
  | 'unpriced'
  | 'unscored'

export interface ModelVerdict {
  code: VerdictCode
  /** The model's own tier, when it has a published price. */
  tier?: PriceTier
  /** Input / output / cached rates in force. */
  input?: number
  output?: number
  cached?: number
  /** (input + output) / 2. */
  blended?: number
  /** Its position in the price list, cheapest first. */
  priceRank?: number
  /** How many models we price. */
  pricedCount: number
  /** The board standing, when the model has a composite. */
  board?: BoardStanding
}

/**
 * Is this model worth its price?
 *
 * The verdict is COMPUTED, never written by hand: it compares the model's own
 * registry price (its tier among everything we price) against its own board
 * composite (its position on the board it is best at). A cheap model that
 * leads a board and a flagship that does not get different sentences — and
 * both sentences carry the numbers, so a reader can check the arithmetic.
 */
export function modelVerdict(model: LeaderboardModel): ModelVerdict {
  const priced = pricedModels()
  const entry = priced.find((p) => p.model.id === model.id)
  const board = bestBoardStanding(model)
  const tier = priceTierOf(model.id)
  const priceRank = priceRankOf(model.id)

  const detail = entry ? priceDetail(entry.price) : undefined
  const blended = entry ? entry.blended : undefined

  let code: VerdictCode = 'unproven'
  if (entry && board) {
    const topHalf = board.rank <= Math.ceil(board.ranked / 2)
    if (tier === 'value') code = topHalf ? 'cheapStrong' : 'cheapWeak'
    else if (tier === 'premium') code = topHalf ? 'flagship' : 'overpriced'
    else code = 'balanced'
  } else if (!entry && board) {
    // A score but no published price. `unproven` would claim the opposite —
    // "it has no board composite" — right under a tile that prints the
    // composite, so this case gets its own sentence.
    code = 'unpriced'
  } else if (!entry && !board) {
    // Neither a price nor a score: there is nothing to weigh.
    code = 'unscored'
  }

  return {
    code,
    tier,
    input: detail?.input,
    output: detail?.output,
    cached: detail?.cached,
    blended,
    priceRank: priceRank?.rank,
    pricedCount: priced.length,
    board,
  }
}

// ───────────────────────── Alternatives ─────────────────────────

/** One link in the "X vs Alternatives" section. */
export interface AlternativeLink {
  /** `compare` → a published head-to-head page; `model` → the model page. */
  kind: 'compare' | 'model'
  /** The route path, without the locale prefix. */
  to: string
  /** The other model. */
  other: LeaderboardModel
}

/**
 * The alternatives of a model.
 *
 * Two sources, in this order:
 *
 *  1. **The published comparisons this model appears in.** Every one of them
 *     is a real `/compare/<slug>` page — the slug is `pairSlug()` of two
 *     leaderboard ids that really are in `COMPARE_PAIR_ENTRIES`, checked at
 *     render time, so the link can never 404.
 *  2. **The models in the same price tier**, for the ones with no published
 *     comparison. They link to their own model page instead — a model page
 *     that exists is better than a comparison URL that does not.
 */
export function alternativeLinks(model: LeaderboardModel, limit = 5): AlternativeLink[] {
  const published: AlternativeLink[] = COMPARE_PAIR_ENTRIES.filter(
    (pair) => pair.a === model.id || pair.b === model.id,
  ).map((pair) => {
    const otherId = pair.a === model.id ? pair.b : pair.a
    const other = LEADERBOARD.models.find((m) => m.id === otherId)
    return {
      kind: 'compare' as const,
      to: `/compare/${pair.slug}`,
      other: other ?? ({ id: otherId, displayName: otherId } as LeaderboardModel),
    }
  })

  const tier = priceTierOf(model.id)
  const sameTier = LEADERBOARD.models.filter((other) => {
    if (other.id === model.id) return false
    if (tier) return priceTierOf(other.id) === tier
    // A model with no published price has no tier — fall back to the
    // vendor's own product line (its `kind`), which is the next honest
    // notion of "same tier".
    return other.kind === model.kind
  })
    .filter((other) => !published.some((link) => link.other.id === other.id))
    .map((other) => ({ other, blended: blendedOf(other) }))
    .sort((a, b) => a.blended - b.blended)
    .map(({ other }) => ({ kind: 'model' as const, to: `/models/${other.id}`, other }))

  return [...published, ...sameTier].slice(0, limit)
}

/** The blended rate of a leaderboard model, when it has one. */
export function blendedOf(model: LeaderboardModel): number {
  if (!model.priceId) return Number.POSITIVE_INFINITY
  const price = REGISTRY.models.find((p) => p.id === model.priceId)
  if (!price) return Number.POSITIVE_INFINITY
  const detail = priceDetail(price)
  return (detail.input + detail.output) / 2
}

/**
 * The canonical slug of a comparison between two models, when that
 * comparison is published.
 *
 * `COMPARE_PAIR_ENTRIES` is the registry of comparison pages; a pair that is
 * not in it has no page, so this returns undefined rather than a URL that
 * would 404.
 */
export function publishedPairSlug(a: string, b: string): string | undefined {
  const slug = pairSlug(a, b)
  return COMPARE_PAIR_ENTRIES.find((pair) => pair.slug === slug)?.slug
}

// ───────────────────────── Formatting ─────────────────────────

/** A rate as the copy spells it: `$2`, `$0.30`, `$0.006`. */
export { formatMoney, formatPct, formatTokenAmount }

/** A context window as the copy spells it: `1M`, `1.05M`, `500K`. */
export function formatContext(tokens: number): string {
  return formatTokenAmount(tokens / 1_000_000)
}

/** A token threshold as the copy spells it: `200K`, `1M`. */
export function formatThreshold(tokens: number): string {
  return formatTokenAmount(tokens / 1_000_000)
}

/**
 * The discount a cached-input rate gives against the uncached input rate,
 * as a whole percent (`98` for 98%).
 *
 * Returns undefined when the model publishes no cached rate — a discount
 * against a rate that does not exist would be fiction.
 */
export function cacheDiscount(cached: number | undefined, input: number | undefined): number | undefined {
  if (cached == null || input == null || input <= 0) return undefined
  return Math.round((1 - cached / input) * 100)
}

/** The site's data vintage year — the year the title carries. */
export function registryYear(): number {
  return Number.parseInt(REGISTRY.fetchedAt.slice(0, 4), 10)
}

/**
 * The title and description of a model page, in long-tail form.
 *
 * A model page's search intent is not "[model name]" — it is "[model] API
 * pricing, benchmarks and context window", which are the three things the
 * page actually carries. The old title was the model's name plus a brand
 * suffix, which matched almost nothing anyone types.
 *
 * The numbers are the model's own registry rates, so a page can never
 * advertise a price the table below it contradicts. A model with no price row
 * interpolates an em dash rather than a made-up figure.
 */
export function modelMeta(
  model: LeaderboardModel,
  t: (key: string, params?: Record<string, string | number>) => string,
): { title: string; description: string } {
  const price = model.priceId ? REGISTRY.models.find((p) => p.id === model.priceId) : undefined
  const detail = price ? priceDetail(price) : undefined

  const params: Record<string, string | number> = {
    model: model.displayName,
    year: registryYear(),
    input: detail ? formatMoney(detail.input) : '—',
    output: detail ? formatMoney(detail.output) : '—',
    cached: detail?.cached != null ? formatMoney(detail.cached) : '—',
    context: price ? formatContext(price.contextWindow) : '—',
    date: REGISTRY.fetchedAt.slice(0, 10),
  }

  return {
    title: t('landing.model.metaTitle', params),
    description: t('landing.model.metaDescription', params),
  }
}
