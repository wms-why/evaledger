import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { findSeries, findSeriesPair } from '@/features/series/select'

/**
 * Which pages this site is willing to have indexed.
 *
 * The site publishes a lot of pages and most of them are *thin*: a benchmark
 * nobody has scored yet, a version pair where only one side has a score, a
 * history page with no snapshots to show. A new domain has no crawl budget
 * to spare — Google samples a few dozen URLs, and thin pages that sit at the
 * front of the list turn into a pile of "crawled - not indexed" instead of
 * the handful of pages that actually deserve to rank.
 *
 * So each family gets an explicit floor, and a page below its floor is
 * **noindexed and kept out of the sitemap** — it stays reachable and linked
 * (the data is real, a visitor may want it), it just does not compete for
 * the site's index budget. When the data fills in, the page crosses the
 * floor on its own and comes back.
 *
 * The floors live here, in one place, so the rule is auditable and tunable.
 */

/** A benchmark page needs this many scored models to be worth indexing. */
export const MIN_BENCHMARK_SCORERS = 5

/** A model page needs at least this many scores (a model page also carries price + context). */
export const MIN_MODEL_SCORES = 1

/** A series line needs at least this many scored versions. */
export const MIN_SERIES_LINE_SCORERS = 1

/**
 * A version pair needs a score on BOTH sides.
 *
 * The series contract is explicit: only compare what both versions report,
 * never interpolate, never borrow. A pair where one side has no score
 * renders an honest empty state — honest, and empty.
 */
export const MIN_SERIES_PAIR_SCORERS = 1

/** How many models report a score for this benchmark. */
export function benchmarkScorerCount(benchmarkId: string): number {
  return LEADERBOARD.models.filter((model) =>
    model.scores.some((score) => score.benchmark === benchmarkId),
  ).length
}

/** How many scores this model reports. */
export function modelScoreCount(modelId: string): number {
  return LEADERBOARD.models.find((model) => model.id === modelId)?.scores.length ?? 0
}

/** A benchmark page: indexable once enough models report a score for it. */
export function isIndexableBenchmark(benchmarkId: string): boolean {
  return benchmarkScorerCount(benchmarkId) >= MIN_BENCHMARK_SCORERS
}

/**
 * A benchmark's history page: a time series of superseded scores.
 *
 * With no snapshot on record the page has no series to draw — it falls back
 * to the current snapshot table, which is the parent page again. It becomes
 * indexable the day the snapshot job lands.
 */
export function isIndexableBenchmarkHistory(benchmarkId: string): boolean {
  return LEADERBOARD.history.some((snapshot) => snapshot.benchmark === benchmarkId)
}

/**
 * The site-wide history page: every score that was ever overwritten.
 *
 * Same rule as the per-benchmark history — with an empty snapshot list it
 * has nothing to show but the page it already lives on.
 */
export function isIndexableLeaderboardHistory(): boolean {
  return LEADERBOARD.history.length > 0
}

/** A model page: indexable when the model reports at least one score. */
export function isIndexableModel(modelId: string): boolean {
  return modelScoreCount(modelId) >= MIN_MODEL_SCORES
}

/** A series line: indexable when at least one version of the line is scored. */
export function isIndexableSeriesLine(seriesSlug: string): boolean {
  const series = findSeries(seriesSlug)
  if (!series) return false
  return series.members.filter(
    (member) => modelScoreCount(member.scoreId ?? '') >= MIN_SERIES_LINE_SCORERS,
  ).length > 0
}

/** A version pair: indexable only when BOTH versions report a score. */
export function isIndexableSeriesPair(seriesSlug: string, pairSlug: string): boolean {
  const series = findSeries(seriesSlug)
  if (!series) return false
  const pair = findSeriesPair(series, pairSlug)
  if (!pair) return false
  const [a, b] = pair
  return (
    modelScoreCount(a.scoreId ?? '') >= MIN_SERIES_PAIR_SCORERS &&
    modelScoreCount(b.scoreId ?? '') >= MIN_SERIES_PAIR_SCORERS
  )
}

/**
 * The indexability of a path, by family.
 *
 * The sitemap and the page heads ask the same question through this one
 * function, so a page can never be noindexed and listed in a sitemap at the
 * same time.
 */
export function isIndexablePath(path: string): boolean {
  const clean = path.split('?')[0].split('#')[0].replace(/^\/(en|zh)/, '') || '/'

  let match = /^\/benchmarks\/([^/]+)\/history$/.exec(clean)
  if (match) return isIndexableBenchmarkHistory(match[1])

  match = /^\/benchmarks\/([^/]+)$/.exec(clean)
  if (match) return isIndexableBenchmark(match[1])

  match = /^\/series\/([^/]+)\/([^/]+)$/.exec(clean)
  if (match) return isIndexableSeriesPair(match[1], match[2])

  match = /^\/series\/([^/]+)$/.exec(clean)
  if (match) return isIndexableSeriesLine(match[1])

  match = /^\/models\/([^/]+)$/.exec(clean)
  if (match) return isIndexableModel(match[1])

  if (clean === '/leaderboard-history') return isIndexableLeaderboardHistory()

  return true
}

/** The benchmarks that clear their floor — the ones the sitemap may list. */
export function indexableBenchmarkIds(): string[] {
  return BENCHMARKS.filter((benchmark) => isIndexableBenchmark(benchmark.id)).map(
    (benchmark) => benchmark.id,
  )
}
