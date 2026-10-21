import type { Provider } from '@/features/calculator/types'
import type { SourceKind } from '@/features/leaderboard/sources'
import type { Vendor } from '@/features/leaderboard/types'

/**
 * Shared types for the data-quality slice.
 *
 * The slice answers one question in public: *can you show your work?* Every
 * type here describes a fact we can point at — a price row that names its
 * source and its verification date, a score that names the page it was read
 * from, a change that is derived from two versions of the same line.
 */

/**
 * Where a score came from.
 *
 * The taxonomy lives in the leaderboard feature (`sources.ts`), next to the
 * score registry it describes — one definition, one place.
 */
export type { SourceKind }

/**
 * How recently a price row was checked against its source.
 *
 * - `fresh`   — verified within the freshness window of the registry snapshot.
 * - `stale`   — verified, but too long ago to call current.
 * - `unknown` — no source URL, so nothing was verified at all.
 */
export type Freshness = 'fresh' | 'stale' | 'unknown'

/**
 * Where a price comes from: the vendor's own billing page (`official`) or a
 * reseller that re-sells it (`aggregator`).
 */
export type Channel = 'official' | 'aggregator'

/** One price row, with its provenance. */
export interface PriceQuality {
  /** The leaderboard model id this price row belongs to. */
  modelId: string
  displayName: string
  provider: Provider
  channel: Channel
  /** ISO date the row was last checked against its source URL. */
  lastVerified: string
  freshness: Freshness
  /** Days between the registry snapshot and `lastVerified`. */
  ageDays: number
  /** The page the price was read from. */
  sourceUrl: string
  /** True while a promotional rate is the rate in force. */
  promoActive: boolean
  /** ISO date the rate changes next (a promo window closing). */
  nextChangeAt?: string
}

/** One page a model's scores were read from. */
export interface ScoreSource {
  /** The page the score was read from. */
  url: string
  /** Who published it: the vendor, an independent harness, or our table. */
  kind: SourceKind
}

/**
 * One distinct page every score in the registry was read from, with the
 * number of score entries that cite it. The page-level index that the
 * per-model `sources` lists roll up into.
 */
export interface DataSourceRow {
  /** The page the scores were read from. */
  url: string
  /** Human-facing name of the source. */
  name: string
  /** Who published it: the vendor, an independent harness, or our table. */
  kind: SourceKind
  /** How many score entries across the registry cite this page. */
  count: number
}

/** One model's score coverage, broken down by where the scores came from. */
export interface ScoreQuality {
  modelId: string
  /** How many benchmarks the model has a score for. */
  benchmarkCount: number
  /** How many distinct pages those scores were read from. */
  sourceCount: number
  /** Score counts per source kind. */
  byKind: Record<SourceKind, number>
  /** Earliest / latest observation timestamp across the model's scores. */
  oldestObservedAt?: string
  latestObservedAt?: string
  /** The distinct pages the model's scores were read from. */
  sources: ScoreSource[]
  /**
   * How fresh the score evidence is, measured against the registry snapshot.
   *
   * The verdict is decided by the *oldest* measurement in the set: a set that
   * mixes a fresh reading with a long-old one still carries a number we have
   * not checked recently, so it is not fresh.
   */
  freshness: Freshness
  /** Days between the registry snapshot and the deciding (oldest) observation. */
  ageDays: number
}

/**
 * One mechanical difference between a model and the previous version of its
 * line. Never estimated: either the registries prove it or it is not listed.
 */
export interface QualityChange {
  /** What moved — a price slot or a benchmark score. */
  field: 'price' | 'score'
  /** Which slot / which benchmark. */
  label: string
  /** Which way the number moved. */
  direction: 'up' | 'down' | 'same'
  /** The two values, rendered. */
  detail: string
}

/** Everything the public page knows about one model. */
export interface ModelQuality {
  /** The leaderboard model id — also the `/models/$slug` slug. */
  modelId: string
  displayName: string
  vendor: Vendor
  /** Absent when the model has no price row at all. */
  price?: PriceQuality
  scores: ScoreQuality
  /** What changed against the previous version of the model's line. */
  changes: QualityChange[]
  /** Tracks whose core benchmarks the model reports in full. */
  completeTracks: string[]
  /** Tracks with at least one core benchmark missing. */
  missingTracks: string[]
}

/** Site-wide counts behind the summary tiles. */
export interface DataQualitySummary {
  /** Models on the leaderboard. */
  modelCount: number
  /** Models that have a price row. */
  priceRows: number
  freshPrices: number
  stalePrices: number
  /** Price rows with no source URL — nothing was verified. */
  unverifiedPrices: number
  /** Score entries across every model. */
  scoreRows: number
  vendorReportedScores: number
  thirdPartyScores: number
  referenceTableScores: number
  /** Models whose every score was measured inside the freshness window. */
  freshScoreSets: number
  /** Models carrying at least one measurement older than the window. */
  staleScoreSets: number
  /** Models whose scores carry no usable observation date. */
  undatedScoreSets: number
  /** Models with a price row and every track complete. */
  completeModelCount: number
}
