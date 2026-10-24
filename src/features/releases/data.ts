import { calculateCost, SAMPLE_INPUT_TOKENS, SAMPLE_OUTPUT_TOKENS } from '@/features/calculator/cost'
import { REGISTRY } from '@/features/calculator/model-prices'
import { priceDetail } from '@/features/calculator/pricing-detail'
import type { ModelPrice, ModelStatus, Provider } from '@/features/calculator/types'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { findLeaderboardModel } from '@/features/leaderboard/models'
import type { LeaderboardModel, ScoreUnit } from '@/features/leaderboard/types'
import type { ReleaseMeta } from './types'

/**
 * The live data layer behind a release post.
 *
 * Nothing here is stored in the article: a post only carries the *keys*
 * (`modelId`, `modelSlug`, …) and every number is resolved from REGISTRY /
 * LEADERBOARD when the page renders. A price change therefore updates every
 * article that mentions it, and an article can never contradict the
 * calculator.
 */

/** One row of the price table. */
export interface ReleasePriceRow {
  id: string
  displayName: string
  provider: Provider
  status: ModelStatus
  inputPricePer1M: number
  outputPricePer1M: number
  cachedInputPricePer1M?: number
  contextWindow: number
  sourceUrl: string
  lastVerified: string
  note?: string
  /** True for the model the post is about. */
  isSubject: boolean
  /** Subject output price ÷ this row's output price. Undefined for the subject row. */
  outputRatio?: number
  /** Subject input price ÷ this row's input price. Undefined for the subject row. */
  inputRatio?: number
}

/** One cell of the score table. */
export interface ReleaseScoreCell {
  modelSlug: string
  displayName: string
  score?: number
  /** Unit the score is recorded in — never compared across units. */
  unit: ScoreUnit
  /** Caveat printed by the source — never dropped. */
  note?: string
  sourceUrl?: string
  /**
   * True for the cell that belongs to the model the post is about.
   *
   * This marks the **column**, not the value: it says "this is the model
   * this post is about", and it says nothing about how the row was won.
   */
  isSubject: boolean
  /**
   * True for the highest score of the row — and only when it is a *unique*
   * maximum.
   *
   * This marks the **value**: it says "this model won this benchmark",
   * which is a different claim from `isSubject`. The subject does not win
   * every row, and when it does not, the winner is still marked.
   */
  isBest: boolean
}

export interface ReleaseScoreRow {
  benchmark: string
  benchmarkName: string
  unit: ScoreUnit
  cells: ReleaseScoreCell[]
}

/** The score table, or `null` when the subject model has no verified scores. */
export interface ReleaseScoreTable {
  columns: { modelSlug: string; displayName: string; isSubject: boolean }[]
  rows: ReleaseScoreRow[]
}

/** Find a price entry by its REGISTRY id. */
export function findPriceModel(id: string): ModelPrice | undefined {
  return REGISTRY.models.find((m) => m.id === id)
}

/**
 * Build the price table for a post: the subject first, then every
 * `compareModelIds` entry that still exists in the registry.
 *
 * A **pending** post has no subject row — the model has not shipped, so
 * there is no price to show. The table is empty and the page says so.
 */
export function releasePriceRows(meta: ReleaseMeta): ReleasePriceRow[] {
  const subject = findPriceModel(meta.modelId)
  if (!subject) return []

  // The rate IN FORCE, not the registry's base rate. A model's base rate may
  // be a PROMOTIONAL band; quoting it here would present a temporary price as
  // the standing one. `priceDetail` resolves the dated band with the same
  // logic the calculator charges with, so the article's table and the
  // calculator can never disagree.
  const subjectDetail = priceDetail(subject)

  const toRow = (model: ModelPrice, isSubject: boolean): ReleasePriceRow => {
    const detail = isSubject ? subjectDetail : priceDetail(model)
    return {
      id: model.id,
      displayName: model.displayName,
      provider: model.provider,
      status: model.status,
      inputPricePer1M: detail.input,
      outputPricePer1M: detail.output,
      cachedInputPricePer1M: detail.cached,
      contextWindow: model.contextWindow,
      sourceUrl: model.sourceUrl,
      lastVerified: model.lastVerified,
      note: model.note,
      isSubject,
      inputRatio: isSubject
        ? undefined
        : round2(subjectDetail.input / detail.input),
      outputRatio: isSubject
        ? undefined
        : round2(subjectDetail.output / detail.output),
    }
  }

  const comparisons = meta.compareModelIds
    .map((id) => findPriceModel(id))
    .filter((m): m is ModelPrice => Boolean(m))
    .map((m) => toRow(m, false))

  return [toRow(subject, true), ...comparisons]
}

/**
 * Build the score table for a post. Returns `null` when the subject has no
 * leaderboard entry — we would rather show no table than attribute another
 * model's scores to this one.
 */
export function releaseScoreTable(meta: ReleaseMeta): ReleaseScoreTable | null {
  const subject = meta.modelSlug ? findLeaderboardModel(meta.modelSlug) : undefined
  if (!subject) return null

  const competitors = meta.compareSlugs
    .map((slug) => findLeaderboardModel(slug))
    .filter((m): m is LeaderboardModel => Boolean(m))

  const columns = [subject, ...competitors]
  const benchmarkName = (id: string) =>
    BENCHMARKS.find((b) => b.id === id)?.name ?? id

  // Rows are driven by the subject's own scores so the table always reads as
  // "how did this model do", with competitors filling in where they have a
  // figure for the same benchmark.
  const rows: ReleaseScoreRow[] = subject.scores.map((score) => {
    const cells: ReleaseScoreCell[] = columns.map((model) => {
      const hit = model.scores.find((s) => s.benchmark === score.benchmark)
      return {
        modelSlug: model.id,
        displayName: model.displayName,
        score: hit?.score,
        unit: hit?.unit ?? score.unit,
        note: hit?.note,
        sourceUrl: hit?.sourceUrl,
        isSubject: model.id === subject.id,
        isBest: false,
      }
    })
    return {
      benchmark: score.benchmark,
      benchmarkName: benchmarkName(score.benchmark),
      unit: score.unit,
      cells: markRowBest(cells, score.unit),
    }
  })

  return {
    columns: columns.map((m) => ({
      modelSlug: m.id,
      displayName: m.displayName,
      isSubject: m.id === subject.id,
    })),
    rows,
  }
}

/**
 * Mark the highest score of a row — but only a *unique* maximum.
 *
 * Two rules keep this honest, and both are the reason the winner is marked
 * separately from the subject:
 *
 *  - A tie has no single leader, so neither model is marked. The compare
 *    matrix uses the same rule; highlighting both would claim a win nobody
 *    had.
 *  - A row with fewer than two scored cells has nothing to win, so it is
 *    left unmarked. Otherwise a lone subject figure would be dressed up as
 *    a victory over nobody.
 *
 * Scores recorded in different units are never compared: a `rating` is not a
 * `percent`, and a row that mixes them has no single maximum.
 */
function markRowBest(cells: ReleaseScoreCell[], rowUnit: ScoreUnit): ReleaseScoreCell[] {
  const scored = cells.filter((cell) => cell.score != null && cell.unit === rowUnit)
  if (scored.length < 2) return cells
  const max = Math.max(...scored.map((cell) => cell.score as number))
  const leaders = scored.filter((cell) => cell.score === max)
  if (leaders.length !== 1) return cells
  const winner = leaders[0].modelSlug
  return cells.map((cell) =>
    cell.modelSlug === winner ? { ...cell, isBest: true } : cell,
  )
}


/**
 * Monthly cost of the sample workload for the subject model.
 * `peakHour` matters for DeepSeek (its headline rate is the peak rate).
 */
export function releaseCostEstimate(meta: ReleaseMeta, peakHour = true) {
  if (!findPriceModel(meta.modelId)) return undefined
  try {
    return calculateCost(meta.modelId, SAMPLE_INPUT_TOKENS, SAMPLE_OUTPUT_TOKENS, { peakHour })
  } catch {
    return undefined
  }
}

/** Off-peak variant of the estimate — only DeepSeek-style models differ. */
export function releaseOffPeakEstimate(meta: ReleaseMeta) {
  if (!findPriceModel(meta.modelId)) return undefined
  try {
    return calculateCost(meta.modelId, SAMPLE_INPUT_TOKENS, SAMPLE_OUTPUT_TOKENS, { peakHour: false })
  } catch {
    return undefined
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
