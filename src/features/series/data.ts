import { calculateCost } from '@/features/calculator/cost'
import { REGISTRY } from '@/features/calculator/model-prices'
import type { ModelPrice, ModelStatus } from '@/features/calculator/types'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { blendedPricePer1M, scoreOf } from '@/features/leaderboard/leaderboard'
import { findLeaderboardModel } from '@/features/leaderboard/models'
import type { LeaderboardModel, ScoreUnit } from '@/features/leaderboard/types'
import { SAMPLE_INPUT_TOKENS, SAMPLE_OUTPUT_TOKENS } from '@/features/calculator/cost'
import type { Series, SeriesMember, SeriesTier } from './types'

/**
 * The live data layer behind a series page.
 *
 * Nothing is stored on the page: a series carries only *keys* (a member list
 * of REGISTRY / LEADERBOARD ids) and every number below is resolved from
 * REGISTRY / LEADERBOARD when the page renders. A price change therefore
 * updates every series page that mentions it, and a series page can never
 * contradict the calculator.
 *
 * Two rules borrowed from the release series:
 *  - **No interpolation.** A missing score is missing, not an estimate.
 *  - **No borrowed scores.** A version's score row is only ever its own.
 */

/** One version of a line, resolved against the registries. */
export interface SeriesRow {
  /** Short key — the id used in pair URLs. */
  key: string
  /** Numeric generation label ("5.5", "3.1"). */
  version: string
  /** Where the member sits in the vendor's line. */
  tier: SeriesTier
  /** REGISTRY id, when the version still has a price row. */
  priceId?: string
  /** LEADERBOARD id, when the version has verifiable scores. */
  scoreId?: string
  /** Display name — the registry's, else the leaderboard's. */
  displayName: string
  /** `active` / `delisted` / `retired`. */
  status: ModelStatus
  /** USD per 1M input tokens. */
  inputPricePer1M?: number
  /** USD per 1M output tokens. */
  outputPricePer1M?: number
  /** USD per 1M cached input tokens. */
  cachedInputPricePer1M?: number
  /** (input + output) / 2 — the number the leaderboard ranks by. */
  blendedPricePer1M?: number
  /** Maximum context window in tokens. */
  contextWindow?: number
  /** Provider pricing page the price came from. */
  sourceUrl?: string
  /** ISO date the price was last verified. */
  lastVerified?: string
  /** The registry's own note (promo windows, legacy sections…). */
  note?: string
  /** ISO date the model shipped, when the leaderboard records one. */
  releasedAt?: string
  /** Cost of the sample workload at list price. */
  sampleCost?: number
  /** Cost of the sample workload at off-peak rates (DeepSeek-style lines only). */
  sampleCostOffPeak?: number
  /** The pricing rule `calculateCost` applied — `standard`, `promo`, `peak hours`… */
  appliedRule?: string
  /** True for the newest member of the line. */
  isNewest: boolean
  /** True for the cheapest member of the line (by blended price). */
  isCheapest: boolean
}

/** One mechanical change between two versions of a line. */
export interface SeriesChange {
  kind: 'price' | 'context' | 'score'
  /** Which way the number moved — derived once, here, not in every view. */
  direction: 'up' | 'down' | 'same'
  /** Which price changed (price changes only). */
  slot?: 'input' | 'output' | 'cached'
  /** Benchmark that changed (score changes only). */
  benchmarkId?: string
  /** Benchmark display name (score changes only). */
  benchmarkName?: string
  /** Caveat the source printed with the score — never dropped. */
  note?: string
  /** Signed fractional change: (newer − older) / older. Negative = cheaper. */
  ratio?: number
  /** Signed absolute change — context tokens, or score points. */
  delta?: number
  /** The older value. */
  from: number
  /** The newer value. */
  to: number
  /** Unit of the changed value (score changes only). */
  unit?: ScoreUnit
}

/** One step of the ladder: the older version and the version that replaced it. */
export interface SeriesStep {
  /** The older version. */
  from: SeriesRow
  /** The newer version. */
  to: SeriesRow
  /** Every mechanical change we can prove from the registries. */
  changes: SeriesChange[]
}

/** A score difference between two versions on one benchmark. */
export interface SeriesScoreDelta {
  benchmarkId: string
  benchmarkName: string
  unit: ScoreUnit
  /** The older version's score. */
  from: number
  /** The newer version's score. */
  to: number
  /** Signed point difference (newer − older). */
  delta: number
  /** Caveat printed by the source — never dropped. */
  note?: string
}

/** The "short version" block: what changed across the whole line. */
export interface SeriesVerdict {
  /** Newest member. */
  newest: SeriesRow
  /** Oldest member. */
  oldest: SeriesRow
  /** Signed input-price change, newest vs oldest (negative = cheaper). */
  inputChange?: number
  /** Signed output-price change, newest vs oldest (negative = cheaper). */
  outputChange?: number
  /** Context-window change in tokens, newest vs oldest. */
  contextChange?: number
  /**
   * The two most recent versions of the line that have scores — the pair the
   * score claim compares. Absent when fewer than two versions have scores.
   */
  scorePair?: [SeriesRow, SeriesRow]
  /** Benchmarks both members of `scorePair` report. */
  scoreDeltas: SeriesScoreDelta[]
  /** Cheapest member by blended price. */
  cheapest?: SeriesRow
  /** Member with the highest core-benchmark average. */
  best?: { row: SeriesRow; average: number }
  /** Members that are no longer sold. */
  legacyCount: number
  /** Members in the line. */
  memberCount: number
  /** Members of the line that still have a price row. */
  pricedCount: number
  /** Members of the line that have verifiable scores. */
  scoredCount: number
}

function priceFor(member: SeriesMember): ModelPrice | undefined {
  if (!member.priceId) return undefined
  return REGISTRY.models.find((m) => m.id === member.priceId)
}

/** Resolve one member into a live row. */
export function seriesRow(member: SeriesMember, index: number): SeriesRow {
  const price = priceFor(member)
  const score = member.scoreId ? findLeaderboardModel(member.scoreId) : undefined

  let sampleCost: number | undefined
  let sampleCostOffPeak: number | undefined
  let appliedRule: string | undefined
  if (price) {
    try {
      const peak = calculateCost(price.id, SAMPLE_INPUT_TOKENS, SAMPLE_OUTPUT_TOKENS)
      sampleCost = peak.totalCost
      appliedRule = peak.appliedRule
      if (price.peakOffPeak) {
        const off = calculateCost(price.id, SAMPLE_INPUT_TOKENS, SAMPLE_OUTPUT_TOKENS, {
          peakHour: false,
        })
        sampleCostOffPeak = off.totalCost
      }
    } catch {
      sampleCost = undefined
    }
  }

  const blended = blendedPricePer1M(price)

  const row: SeriesRow = {
    key: member.key,
    version: member.version,
    tier: member.tier,
    priceId: member.priceId,
    scoreId: member.scoreId,
    displayName: price?.displayName ?? score?.displayName ?? member.key,
    status: price?.status ?? member.status ?? 'delisted',
    inputPricePer1M: price?.inputPricePer1M,
    outputPricePer1M: price?.outputPricePer1M,
    cachedInputPricePer1M: price?.cachedInputPricePer1M,
    blendedPricePer1M: blended,
    contextWindow: price?.contextWindow,
    sourceUrl: price?.sourceUrl,
    lastVerified: price?.lastVerified,
    note: price?.note,
    releasedAt: score?.releaseDate,
    sampleCost,
    sampleCostOffPeak,
    appliedRule,
    isNewest: index === 0,
    isCheapest: false,
  }
  return row
}

/** Resolve every member of a series, newest first. */
export function seriesRows(series: Series): SeriesRow[] {
  const rows = series.members.map((member, index) => seriesRow(member, index))
  // The cheapest member is the one with the lowest blended price. Ties leave
  // every candidate flagged, so the UI does not crown an arbitrary winner.
  const blended = rows.map((row) => row.blendedPricePer1M).filter((v): v is number => v != null)
  if (blended.length > 0) {
    const min = Math.min(...blended)
    rows.forEach((row) => {
      if (row.blendedPricePer1M === min) row.isCheapest = true
    })
  }
  return rows
}

/** The leaderboard rows of a line — the models that have verifiable scores. */
export function seriesScoreModels(series: Series): LeaderboardModel[] {
  return series.members
    .map((member) => (member.scoreId ? findLeaderboardModel(member.scoreId) : undefined))
    .filter((model): model is LeaderboardModel => Boolean(model))
}

/**
 * The changes between two consecutive versions of a line, oldest → newest.
 *
 * Only mechanical facts are listed: a price that moved, a context window that
 * grew, a benchmark both versions report. A benchmark only one version
 * reports is *not* a change we can prove, so it never appears here.
 */
export function seriesStep(from: SeriesRow, to: SeriesRow): SeriesStep {
  const changes: SeriesChange[] = []

  const priceSlots: Array<'input' | 'output' | 'cached'> = ['input', 'output', 'cached']
  for (const slot of priceSlots) {
    const before =
      slot === 'input' ? from.inputPricePer1M : slot === 'output' ? from.outputPricePer1M : from.cachedInputPricePer1M
    const after =
      slot === 'input' ? to.inputPricePer1M : slot === 'output' ? to.outputPricePer1M : to.cachedInputPricePer1M
    if (before == null || after == null || before === 0) continue
    // A price that did not move is not a change — the card is about what moved.
    if (before === after) continue
    const change = (after - before) / before
    changes.push({
      kind: 'price',
      slot,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
      ratio: change,
      from: before,
      to: after,
    })
  }

  if (from.contextWindow != null && to.contextWindow != null && from.contextWindow !== to.contextWindow) {
    const delta = to.contextWindow - from.contextWindow
    changes.push({
      kind: 'context',
      direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same',
      delta,
      from: from.contextWindow,
      to: to.contextWindow,
    })
  }

  const fromModel = from.scoreId ? findLeaderboardModel(from.scoreId) : undefined
  const toModel = to.scoreId ? findLeaderboardModel(to.scoreId) : undefined
  if (fromModel && toModel) {
    for (const benchmark of BENCHMARKS) {
      const a = scoreOf(fromModel, benchmark.id)
      const b = scoreOf(toModel, benchmark.id)
      if (!a || !b) continue
      if (a.score === b.score) continue
      const delta = b.score - a.score
      changes.push({
        kind: 'score',
        direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same',
        benchmarkId: benchmark.id,
        benchmarkName: benchmark.name,
        note: b.note ?? a.note,
        delta,
        from: a.score,
        to: b.score,
        unit: a.unit,
      })
    }
  }

  return { from, to, changes }
}

/** Every step of the ladder, oldest → newest. */
export function seriesSteps(rows: SeriesRow[]): SeriesStep[] {
  const steps: SeriesStep[] = []
  for (let i = rows.length - 1; i > 0; i--) {
    steps.unshift(seriesStep(rows[i], rows[i - 1]))
  }
  return steps
}

/**
 * Compare two versions of a line — the pair page's verdict.
 *
 * `newer` is the version with the higher version number (ties keep the
 * caller's order), so every delta reads "what the newer version changed".
 */
export function pairVerdict(a: SeriesRow, b: SeriesRow): {
  newer: SeriesRow
  older: SeriesRow
  inputChange?: number
  outputChange?: number
  contextChange?: number
  scoreDeltas: SeriesScoreDelta[]
} {
  const aNewer = compareVersions(a.version, b.version) >= 0
  const newer = aNewer ? a : b
  const older = aNewer ? b : a

  const scoreDeltas: SeriesScoreDelta[] = []
  const newerModel = newer.scoreId ? findLeaderboardModel(newer.scoreId) : undefined
  const olderModel = older.scoreId ? findLeaderboardModel(older.scoreId) : undefined
  if (newerModel && olderModel) {
    for (const benchmark of BENCHMARKS) {
      const from = scoreOf(olderModel, benchmark.id)
      const to = scoreOf(newerModel, benchmark.id)
      if (!from || !to) continue
      scoreDeltas.push({
        benchmarkId: benchmark.id,
        benchmarkName: benchmark.name,
        unit: from.unit,
        from: from.score,
        to: to.score,
        delta: to.score - from.score,
        note: to.note ?? from.note,
      })
    }
  }

  return {
    newer,
    older,
    inputChange: ratio(newer.inputPricePer1M, older.inputPricePer1M),
    outputChange: ratio(newer.outputPricePer1M, older.outputPricePer1M),
    contextChange:
      newer.contextWindow != null && older.contextWindow != null
        ? newer.contextWindow - older.contextWindow
        : undefined,
    scoreDeltas,
  }
}

/** Compare two dotted version labels ("5.5" vs "5") numerically. */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const right = b.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const length = Math.max(left.length, right.length)
  for (let i = 0; i < length; i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  return 0
}

/**
 * The line-level verdict: how the newest version compares with the oldest,
 * what it costs against the cheapest option, and how many versions of the
 * line are already legacy.
 *
 * Two rules keep the score claims honest:
 *
 *  - **Only benchmarks every scored version reports.** A version with four
 *    published scores and a version with sixteen are not comparable by their
 *    own averages, so the "best version" claim is computed over the common
 *    set — and dropped when that set is empty.
 *  - **The newest pair we can actually compare.** The score claim compares
 *    the two most recent versions that have scores, not the two ends of the
 *    line (whose oldest end usually has no scores at all).
 */
/** Signed relative change: (newer − older) / older. Undefined without both ends. */
function ratio(newer: number | undefined, older: number | undefined): number | undefined {
  if (newer == null || older == null || older === 0) return undefined
  return (newer - older) / older
}

export function seriesVerdict(rows: SeriesRow[]): SeriesVerdict | undefined {
  if (rows.length === 0) return undefined
  const newest = rows[0]
  const oldest = rows[rows.length - 1]

  const scoredRows = rows.filter((row) => row.scoreId)
  const models = scoredRows.map((row) => findLeaderboardModel(row.scoreId as string))

  // Benchmarks every scored version of the line reports — the only ones a
  // version-to-version average may be built on. A benchmark that is not a
  // percentage for every one of them (a rating, an Elo) cannot be averaged
  // with percentages, so it is not part of the comparable set either.
  const commonBenchmarkIds = models.length
    ? models
        .flatMap((model) => (model ? model.scores.map((score) => score.benchmark) : []))
        .filter((id) =>
          models.every((model) => {
            const score = model?.scores.find((entry) => entry.benchmark === id)
            return score?.unit === 'percent'
          }),
        )
    : []

  const commonAverage = (row: SeriesRow): number | undefined => {
    if (commonBenchmarkIds.length === 0) return undefined
    const model = findLeaderboardModel(row.scoreId as string)
    if (!model) return undefined
    const values = commonBenchmarkIds
      .map((id) => model.scores.find((score) => score.benchmark === id))
      .filter((score): score is NonNullable<typeof score> => Boolean(score) && score!.unit === 'percent')
      .map((score) => score!.score)
    if (values.length !== commonBenchmarkIds.length) return undefined
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  // The two most recent versions of the line that have scores.
  const scorePair = scoredRows.slice(0, 2)
  const scoreDeltas: SeriesScoreDelta[] = []
  if (scorePair.length === 2) {
    const olderModel = findLeaderboardModel(scorePair[1].scoreId as string)
    const newerModel = findLeaderboardModel(scorePair[0].scoreId as string)
    if (olderModel && newerModel) {
      for (const benchmark of BENCHMARKS) {
        const a = scoreOf(olderModel, benchmark.id)
        const b = scoreOf(newerModel, benchmark.id)
        if (!a || !b) continue
        scoreDeltas.push({
          benchmarkId: benchmark.id,
          benchmarkName: benchmark.name,
          unit: a.unit,
          from: a.score,
          to: b.score,
          delta: b.score - a.score,
          note: b.note ?? a.note,
        })
      }
    }
  }

  const priced = rows.filter((row) => row.blendedPricePer1M != null)
  const cheapest = priced.length
    ? priced.reduce((min, row) =>
        (row.blendedPricePer1M as number) < (min.blendedPricePer1M as number) ? row : min,
      )
    : undefined

  const averages = scoredRows
    .map((row) => ({ row, average: commonAverage(row) }))
    .filter((entry): entry is { row: SeriesRow; average: number } => entry.average != null)
  const best = averages.length
    ? averages.reduce((max, entry) => (entry.average > max.average ? entry : max))
    : undefined

  return {
    newest,
    oldest,
    inputChange: ratio(newest.inputPricePer1M, oldest.inputPricePer1M),
    outputChange: ratio(newest.outputPricePer1M, oldest.outputPricePer1M),
    contextChange:
      newest.contextWindow != null && oldest.contextWindow != null
        ? newest.contextWindow - oldest.contextWindow
        : undefined,
    scorePair: scorePair.length === 2 ? [scorePair[0], scorePair[1]] : undefined,
    scoreDeltas,
    cheapest,
    best: best ? { row: best.row, average: best.average } : undefined,
    legacyCount: rows.filter((row) => row.status !== 'active').length,
    memberCount: rows.length,
    pricedCount: priced.length,
    scoredCount: scoredRows.length,
  }
}
