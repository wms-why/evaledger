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
  /** Caveat printed by the source — never dropped. */
  note?: string
  sourceUrl?: string
}

export interface ReleaseScoreRow {
  benchmark: string
  benchmarkName: string
  unit: ScoreUnit
  cells: ReleaseScoreCell[]
}

/** The score table, or `null` when the subject model has no verified scores. */
export interface ReleaseScoreTable {
  columns: { modelSlug: string; displayName: string }[]
  rows: ReleaseScoreRow[]
}

/** Find a price entry by its REGISTRY id. */
export function findPriceModel(id: string): ModelPrice | undefined {
  return REGISTRY.models.find((m) => m.id === id)
}

/**
 * Build the price table for a post: the subject first, then every
 * `compareModelIds` entry that still exists in the registry.
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
  const rows: ReleaseScoreRow[] = subject.scores.map((score) => ({
    benchmark: score.benchmark,
    benchmarkName: benchmarkName(score.benchmark),
    unit: score.unit,
    cells: columns.map((model) => {
      const hit = model.scores.find((s) => s.benchmark === score.benchmark)
      return {
        modelSlug: model.id,
        displayName: model.displayName,
        score: hit?.score,
        note: hit?.note,
        sourceUrl: hit?.sourceUrl,
      }
    }),
  }))

  return {
    columns: columns.map((m) => ({ modelSlug: m.id, displayName: m.displayName })),
    rows,
  }
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
