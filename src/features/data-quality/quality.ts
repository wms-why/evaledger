import { REGISTRY } from '@/features/calculator/model-prices'
import { utcDay } from '@/features/calculator/cost'
import { priceDetail } from '@/features/calculator/pricing-detail'
import type { ModelPrice, Provider } from '@/features/calculator/types'
import { formatScore } from '@/features/leaderboard/leaderboard'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { TRACK_IDS, scoreTrack } from '@/features/leaderboard/scoring'
import { sourceInfo, sourceKind } from '@/features/leaderboard/sources'
import type { LeaderboardModel } from '@/features/leaderboard/types'
import { seriesRows, seriesStep } from '@/features/series/data'
import { findSeries, seriesForScoreId } from '@/features/series/select'
import type {
  Channel,
  DataQualitySummary,
  DataSourceRow,
  Freshness,
  ModelQuality,
  PriceQuality,
  QualityChange,
  ScoreQuality,
  SourceKind,
} from './types'

/**
 * The data-quality core.
 *
 * Everything here is derived from the registries we already publish — the
 * price registry, the score registry and the series registry. Nothing is
 * stored, nothing is estimated, and nothing is measured against the wall
 * clock: the price registry is a *snapshot* (`REGISTRY.fetchedAt`), so
 * freshness is measured against that snapshot. A price that was verified on
 * the day the registry was assembled is fresh; one verified a month before it
 * is stale; one with no source URL is unknown. The same rule applies to the
 * scores: they are judged by when they were observed, against the same
 * snapshot — never against the day the page happens to be viewed.
 *
 * The module is pure on purpose: no `cloudflare:workers` import, no React —
 * the node test pool can import it directly.
 */

/** How many days a price row may stay unverified before it is called stale. */
export const FRESH_WINDOW_DAYS = 14

/** Providers that sell their own models — their pricing page is first-party. */
const OFFICIAL_PROVIDERS: ReadonlySet<Provider> = new Set<Provider>([
  'openai',
  'anthropic',
  'google',
  'deepseek',
  'minimax',
  'stepfun',
  'grok',
])

/**
 * Is this price row first-party (the vendor's own billing page) or resold?
 *
 * The price registry states the channel on the row itself; the provider is
 * the fallback for a row that has not been labelled yet. Never guessed from
 * the display name.
 */
export function channelFor(price: ModelPrice): Channel {
  return price.channel ?? (OFFICIAL_PROVIDERS.has(price.provider) ? 'official' : 'aggregator')
}

/** Whole days between two ISO dates (negative when `to` is earlier). */
function daysBetween(from: string, to: string): number {
  const a = Date.parse(from)
  const b = Date.parse(to)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.NaN
  return Math.round((b - a) / 86_400_000)
}

/**
 * Freshness of one price row, measured against the registry snapshot.
 *
 * - no source URL (or no verification date) → `unknown`
 * - verified within {@link FRESH_WINDOW_DAYS} of the snapshot → `fresh`
 * - older than that → `stale`
 */
export function priceFreshness(
  lastVerified: string | undefined,
  sourceUrl: string | undefined,
  fetchedAt: string = REGISTRY.fetchedAt,
): { freshness: Freshness; ageDays: number } {
  if (!sourceUrl || !lastVerified) return { freshness: 'unknown', ageDays: Number.NaN }
  const ageDays = daysBetween(lastVerified, fetchedAt)
  if (!Number.isFinite(ageDays)) return { freshness: 'unknown', ageDays: Number.NaN }
  return { freshness: ageDays <= FRESH_WINDOW_DAYS ? 'fresh' : 'stale', ageDays }
}

/**
 * Is a promotional rate in force, and when does the rate change next?
 *
 * Measured against the registry snapshot, not the wall clock: the snapshot is
 * the moment the registry claims to be true.
 *
 * The band resolution is NOT re-implemented here — this delegates to the one
 * resolver (`priceDetail`, which resolves through `cost.ts`'s
 * `resolvePriceWindow`), so the data-quality page cannot disagree with the
 * calculator about which band is in force or when the price changes next.
 */
export function promoState(
  price: ModelPrice,
  fetchedAt: string = REGISTRY.fetchedAt,
): { active: boolean; nextChangeAt?: string } {
  const detail = priceDetail(price, utcDay(fetchedAt))
  const active = detail.promoActive === true
  // The day the rate changes: the next band's start, else the end of the
  // temporary rate in force (a legacy single-promo row has no next band).
  const nextChangeAt = detail.nextChange?.from ?? detail.promoUntil
  return nextChangeAt === undefined ? { active } : { active, nextChangeAt }
}

/**
 * Freshness of a model's score set, measured against the registry snapshot.
 *
 * The rule: a score set is fresh only when **every** measurement in it was
 * observed within {@link FRESH_WINDOW_DAYS} of the snapshot — the *oldest*
 * measurement decides. A set that mixes a fresh reading with a long-old one
 * still carries a number we have not checked recently, and a data-quality
 * page that called that "fresh" would be exactly the kind of overstatement
 * this page exists to remove.
 *
 * The reference point is the registry snapshot (`REGISTRY.fetchedAt`), never
 * the wall clock, for the same reason the price freshness uses it: the
 * snapshot is the moment the registry claims to be true. A score observed
 * long before the snapshot is older evidence than one observed at it.
 *
 * An observation made on the snapshot day has an age of 0 days — the
 * snapshot is a date, so an evening reading on that day is not "in the
 * future", it is the same day.
 */
export function scoreFreshness(
  observedAt: string | undefined,
  fetchedAt: string = REGISTRY.fetchedAt,
): { freshness: Freshness; ageDays: number } {
  if (!observedAt) return { freshness: 'unknown', ageDays: Number.NaN }
  const ageDays = Math.max(0, daysBetween(observedAt, fetchedAt))
  if (!Number.isFinite(ageDays)) return { freshness: 'unknown', ageDays: Number.NaN }
  return { freshness: ageDays <= FRESH_WINDOW_DAYS ? 'fresh' : 'stale', ageDays }
}

/** One price row, with its provenance. */
export function priceQuality(modelId: string, price: ModelPrice): PriceQuality {
  const { freshness, ageDays } = priceFreshness(price.lastVerified, price.sourceUrl)
  const promo = promoState(price)
  return {
    modelId,
    displayName: price.displayName,
    provider: price.provider,
    channel: channelFor(price),
    lastVerified: price.lastVerified,
    freshness,
    ageDays,
    sourceUrl: price.sourceUrl,
    promoActive: promo.active,
    nextChangeAt: promo.nextChangeAt,
  }
}

/** One model's score coverage, broken down by where the scores came from. */
export function scoreQuality(
  model: LeaderboardModel,
  fetchedAt: string = REGISTRY.fetchedAt,
): ScoreQuality {
  const byKind: Record<SourceKind, number> = { vendor: 0, 'third-party': 0, 'reference-table': 0 }
  const sources = new Map<string, SourceKind>()
  let oldestObservedAt: string | undefined
  let latestObservedAt: string | undefined
  for (const score of model.scores) {
    // An unknown URL is counted as third-party — the same bucket the
    // summary tiles already used — so the counts and the link list never
    // disagree about how many scores there are.
    const kind: SourceKind = sourceKind(score.sourceUrl) ?? 'third-party'
    if (score.sourceUrl) {
      if (!sources.has(score.sourceUrl)) sources.set(score.sourceUrl, kind)
    }
    byKind[kind] += 1
    if (score.observedAt) {
      const at = Date.parse(score.observedAt)
      if (Number.isFinite(at)) {
        if (oldestObservedAt == null || at < Date.parse(oldestObservedAt)) oldestObservedAt = score.observedAt
        if (latestObservedAt == null || at > Date.parse(latestObservedAt)) latestObservedAt = score.observedAt
      }
    }
  }
  // The oldest measurement decides the verdict — see {@link scoreFreshness}.
  const { freshness, ageDays } = scoreFreshness(oldestObservedAt, fetchedAt)
  return {
    modelId: model.id,
    benchmarkCount: model.scores.length,
    sourceCount: sources.size,
    byKind,
    oldestObservedAt,
    latestObservedAt,
    sources: [...sources].map(([url, kind]) => ({ url, kind })),
    freshness,
    ageDays,
  }
}

/** `$5` / `$0.40` — prices are read at a glance, so keep them short. */
function money(value: number): string {
  return `$${Number.isInteger(value) ? String(value) : value.toFixed(2)}`
}

/**
 * One row per distinct page any leaderboard score was read from, with how
 * many score entries cite it, most-cited first.
 *
 * Derived from the same score registry the per-model tables read — the
 * page-level rollup of the `sources` lists each model already carries. The
 * kind badge names the page with the same taxonomy the summary tiles group
 * by, so a reader can go from the tile counts to the pages behind them.
 */
export function scoreSources(): DataSourceRow[] {
  const rows = new Map<string, DataSourceRow>()
  for (const model of LEADERBOARD.models) {
    for (const score of model.scores) {
      if (!score.sourceUrl) continue
      const info = sourceInfo(score.sourceUrl)
      const existing = rows.get(score.sourceUrl)
      if (existing) {
        existing.count += 1
        continue
      }
      rows.set(score.sourceUrl, {
        url: score.sourceUrl,
        name: info?.name ?? score.sourceUrl,
        kind: info?.kind ?? 'reference-table',
        count: 1,
      })
    }
  }
  return [...rows.values()].sort((a, b) => b.count - a.count)
}

/** The scoring core is a sibling module; a track we cannot resolve is
 *  reported as missing rather than crashing the page. */
type TrackArg = Parameters<typeof scoreTrack>[1]

/**
 * Does the model report every core benchmark of this track?
 *
 * `scoreTrack` throws on an unknown track, so the call is guarded: a track
 * that cannot be evaluated counts as missing — an unresolved track must never
 * take the page down.
 */
function isTrackComplete(model: LeaderboardModel, trackId: string): boolean {
  try {
    return !!scoreTrack(model, trackId as TrackArg)?.complete
  } catch (err) {
    console.error('[data-quality] track lookup failed', trackId, err)
    return false
  }
}

/** Which tracks the model covers completely, and which it does not. */
export function trackCoverage(model: LeaderboardModel): {
  completeTracks: string[]
  missingTracks: string[]
} {
  const completeTracks: string[] = []
  const missingTracks: string[] = []
  for (const trackId of TRACK_IDS) {
    if (isTrackComplete(model, trackId)) completeTracks.push(trackId)
    else missingTracks.push(trackId)
  }
  return { completeTracks, missingTracks }
}

/**
 * What changed between a model and the previous version of its line.
 *
 * The comparison is mechanical: the previous member of the model's series
 * (the line is listed newest-first, so the predecessor is the *next* member)
 * and the diffs the series registry can prove — a price slot that moved, a
 * benchmark both versions report with a different number. A model that opens
 * a line has no predecessor and therefore no changes.
 */
export function changesFor(model: LeaderboardModel): QualityChange[] {
  const series = seriesForScoreId(model.id)
  if (!series) return []
  const index = series.members.findIndex((m) => m.scoreId === model.id)
  if (index < 0) return []
  const rows = seriesRowsFor(series.slug)
  const current = rows[index]
  const previous = rows[index + 1]
  if (!current || !previous) return []

  const step = seriesStep(previous, current)
  const changes: QualityChange[] = []
  for (const change of step.changes) {
    if (change.kind === 'price' && change.slot) {
      changes.push({
        field: 'price',
        label: change.slot,
        direction: change.direction,
        detail: `${money(change.from)} → ${money(change.to)}`,
      })
    } else if (change.kind === 'score' && change.benchmarkName) {
      const unit = change.unit ?? 'percent'
      changes.push({
        field: 'score',
        label: change.benchmarkName,
        direction: change.direction,
        detail: `${formatScore(change.from, unit)} → ${formatScore(change.to, unit)}`,
      })
    }
  }
  return changes
}

/** Resolved series rows, cached per line (they are pure registry reads). */
const seriesRowCache = new Map<string, ReturnType<typeof seriesRows>>()

function seriesRowsFor(slug: string): ReturnType<typeof seriesRows> {
  const cached = seriesRowCache.get(slug)
  if (cached) return cached
  const series = findSeries(slug)
  const rows = series ? seriesRows(series) : []
  seriesRowCache.set(slug, rows)
  return rows
}

/** Every leaderboard model, with its data-quality row. */
function computeModelQuality(): ModelQuality[] {
  return LEADERBOARD.models.map((model) => {
    const price = model.priceId
      ? REGISTRY.models.find((m) => m.id === model.priceId)
      : undefined
    const { completeTracks, missingTracks } = trackCoverage(model)
    return {
      modelId: model.id,
      displayName: model.displayName,
      vendor: model.vendor,
      price: price ? priceQuality(model.id, price) : undefined,
      scores: scoreQuality(model),
      changes: changesFor(model),
      completeTracks,
      missingTracks,
    }
  })
}

let cachedModels: ModelQuality[] | undefined

/**
 * One row per leaderboard model, joined to the price registry by `priceId`.
 *
 * The result is cached: the registries are static, so the page must not
 * recompute the same rows on every render.
 */
export function modelQuality(): ModelQuality[] {
  if (!cachedModels) cachedModels = computeModelQuality()
  return cachedModels
}

/** Site-wide counts behind the summary tiles. */
export function dataQualitySummary(): DataQualitySummary {
  const models = modelQuality()
  let priceRows = 0
  let freshPrices = 0
  let stalePrices = 0
  let unverifiedPrices = 0
  let scoreRows = 0
  let vendorReportedScores = 0
  let thirdPartyScores = 0
  let referenceTableScores = 0
  let freshScoreSets = 0
  let staleScoreSets = 0
  let undatedScoreSets = 0
  let completeModelCount = 0
  for (const model of models) {
    if (model.price) {
      priceRows += 1
      if (model.price.freshness === 'fresh') freshPrices += 1
      else if (model.price.freshness === 'stale') stalePrices += 1
      else unverifiedPrices += 1
    }
    scoreRows += model.scores.benchmarkCount
    vendorReportedScores += model.scores.byKind.vendor
    thirdPartyScores += model.scores.byKind['third-party']
    referenceTableScores += model.scores.byKind['reference-table']
    if (model.scores.freshness === 'fresh') freshScoreSets += 1
    else if (model.scores.freshness === 'stale') staleScoreSets += 1
    else undatedScoreSets += 1
    // "Complete" = the row can answer both questions the page asks: what does
    // it cost (a price row) and how good is it (every track covered).
    if (model.price && model.missingTracks.length === 0) completeModelCount += 1
  }
  return {
    modelCount: models.length,
    priceRows,
    freshPrices,
    stalePrices,
    unverifiedPrices,
    scoreRows,
    vendorReportedScores,
    thirdPartyScores,
    referenceTableScores,
    freshScoreSets,
    staleScoreSets,
    undatedScoreSets,
    completeModelCount,
  }
}
