import { BENCHMARKS } from './benchmarks'
import { LEADERBOARD } from './models'
import type { LeaderboardModel, ScoreUnit } from './types'

/**
 * The scoring core — tracks, coverage-gated composite scores.
 *
 * The problem this module exists to solve: a leaderboard that averages a
 * model over *whatever benchmarks that model happens to have* is not a
 * leaderboard. GPT-6 Astra (4 benchmarks) and Claude Opus 5 (15 benchmarks)
 * would be averaged over different denominators, and the two numbers would
 * look comparable while meaning completely different things. The product
 * owner's single biggest trust complaint, exactly.
 *
 * The fix has three parts:
 *
 *  1. **Tracks.** A named capability dimension (general / coding / agent /
 *     reasoning) with an explicit set of CORE benchmarks and an explicit set
 *     of CONTEXT benchmarks.
 *  2. **A gate.** A model receives a composite score only when it has EVERY
 *     core benchmark of the track. A missing core benchmark means
 *     "not tested" — never zero — and the model is excluded from the ranked
 *     list rather than ranked with a flattering partial average.
 *  3. **Normalization.** Raw benchmark percentages are not comparable across
 *     benchmarks (GPQA tops out near 96 %, Terminal-Bench near 40 %). Each
 *     score is normalized against the FIELD BEST — the highest percent score
 *     any model in the registry has for that benchmark — onto a 0–100 scale,
 *     and the composite is the weighted mean of the normalized core scores.
 *
 * The module is PURE on purpose: no `cloudflare:workers`, no React, no
 * `Date.now()`. Everything is a function of the registries it reads, so it
 * runs in the node test pool and the same numbers come out on the server and
 * in the browser.
 *
 * Two invariants worth stating out loud:
 *
 *  - A benchmark whose unit is not `percent` (Codeforces is a `rating`) can
 *    never enter a composite: there is no meaningful 0–100 denominator for
 *    an Elo-style rating. Such benchmarks are context only.
 *  - A benchmark nobody in the registry has a percent score for has no field
 *    best, and is therefore ineligible — it can never be part of a
 *    composite either.
 */

/** The four capability tracks the leaderboard ranks models on. */
export type TrackSlug = 'general' | 'coding' | 'agent' | 'reasoning'

/** One benchmark inside a track, with its weight. */
export interface TrackBenchmark {
  /** Benchmark id — must exist in BENCHMARKS. */
  id: string
  /** Relative weight inside the track. */
  weight: number
}

/** A capability dimension: what it measures, what it gates on, what it shows. */
export interface ScoreTrack {
  slug: TrackSlug
  /** i18n key for the track's short name (tab / column header). */
  labelKey: string
  /** i18n key for the track's scope: what it measures and what it excludes. */
  scopeKey: string
  /** i18n key for the track's formula, written out with ids and weights. */
  formulaKey: string
  /**
   * Gate: a model needs ALL of these to receive a composite score.
   * Every entry must be a `percent` benchmark that exists in BENCHMARKS.
   */
  core: TrackBenchmark[]
  /** Shown for context, never part of the composite. */
  context: string[]
}

/**
 * The track registry.
 *
 * Weights are relative, not percentages: the composite divides by the sum of
 * the weights it actually used, so a track's weights can be re-tuned without
 * touching the formula.
 *
 *  - **general** — HLE carries double weight because it is the only broad,
 *    multi-domain frontier-knowledge set in the registry; GPQA Diamond is a
 *    single (science) domain and is the narrower of the two.
 *  - **coding** — DeepSWE v1.1 carries double weight: repository-level
 *    resolution is the closest proxy in the registry for real software
 *    engineering work, while ProgramBench is the narrowest (synthesis).
 *  - **agent** — Terminal-Bench 4.0 carries double weight: it is the current
 *    task set and the only one that runs in a real shell.
 *  - **reasoning** — MathArena Apex carries double weight: hard competition
 *    mathematics isolates deduction from knowledge recall, which is what this
 *    track is for.
 */
export const TRACKS: Record<ScoreTrack['slug'], ScoreTrack> = {
  general: {
    slug: 'general',
    labelKey: 'leaderboard.tracks.general.label',
    scopeKey: 'leaderboard.tracks.general.scope',
    formulaKey: 'leaderboard.tracks.general.formula',
    core: [
      { id: 'gpqa-diamond', weight: 1 },
      { id: 'hle', weight: 2 },
    ],
    context: ['hle-tools', 'matharena-apex', 'codeforces', 'vals-index', 'graphwalks'],
  },
  coding: {
    slug: 'coding',
    labelKey: 'leaderboard.tracks.coding.label',
    scopeKey: 'leaderboard.tracks.coding.scope',
    formulaKey: 'leaderboard.tracks.coding.formula',
    core: [
      { id: 'deepswe-v1.1', weight: 2 },
      { id: 'nl2repo-bench', weight: 1 },
      { id: 'programbench', weight: 1 },
    ],
    context: [
      'swe-bench-pro',
      'frontierswe-v2',
      'terminal-bench-2.1',
      'terminal-bench-3.0',
      'terminal-bench-4.0',
    ],
  },
  agent: {
    slug: 'agent',
    labelKey: 'leaderboard.tracks.agent.label',
    scopeKey: 'leaderboard.tracks.agent.scope',
    formulaKey: 'leaderboard.tracks.agent.formula',
    core: [
      { id: 'terminal-bench-4.0', weight: 2 },
      { id: 'agents-last-exam', weight: 1 },
      { id: 'automation-bench', weight: 1 },
    ],
    context: [
      'osworld-2.0',
      'mcp-atlas',
      'browsecompc',
      'bankertoolbench',
      'chartography-tools',
      'babyvision-tools',
      'zerobench-main-tools',
    ],
  },
  reasoning: {
    slug: 'reasoning',
    labelKey: 'leaderboard.tracks.reasoning.label',
    scopeKey: 'leaderboard.tracks.reasoning.scope',
    formulaKey: 'leaderboard.tracks.reasoning.formula',
    core: [
      { id: 'gpqa-diamond', weight: 1 },
      { id: 'hle', weight: 1 },
      { id: 'matharena-apex', weight: 2 },
    ],
    context: ['graphwalks', 'codeforces', 'apex-bench-v1.1'],
  },
}

/** Track slugs, in registry order. */
export const TRACK_IDS: ScoreTrack['slug'][] = ['general', 'coding', 'agent', 'reasoning']

/** A track by slug. */
export function findTrack(slug: string): ScoreTrack | undefined {
  return TRACK_IDS.map((id) => TRACKS[id]).find((track) => track.slug === slug)
}

/** One core benchmark's contribution to a composite score. */
export interface TrackScorePart {
  /** Benchmark id (a `Benchmark.id` in benchmarks.ts). */
  benchmark: string
  /** The model's raw score on that benchmark, in the benchmark's own unit. */
  raw: number
  /**
   * The raw score normalized against the field best on a 0–100 scale:
   * `raw / fieldBest * 100`. The field best itself normalizes to 100.
   */
  normalized: number
  /** The benchmark's weight inside the track. */
  weight: number
}

/** The result of scoring one model on one track. */
export interface TrackScore {
  /**
   * Weighted mean of the normalized core scores, on a 0–100 scale.
   * `undefined` when the model is missing any core benchmark — a missing
   * benchmark is "not tested", never zero, so no composite is published.
   */
  composite?: number
  /** Fraction of the track's core benchmarks the model has (0–1). */
  coverage: number
  /** Core benchmark ids the model has a usable score for. */
  covered: string[]
  /** Core benchmark ids the model has no usable score for. */
  missing: string[]
  /** True when every core benchmark of the track is covered. */
  complete: boolean
  /** One entry per covered core benchmark, with raw, normalized and weight. */
  parts: TrackScorePart[]
  /**
   * Context benchmarks of the track, shown for information and never part of
   * the composite. Present when the score came from a track.
   */
  context?: ContextScore[]
}

/** A model together with its score on a track. */
export interface TrackEntry {
  model: LeaderboardModel
  score: TrackScore
}

/** The ranked list of a track: complete models first, incomplete ones after. */
export interface TrackRanking {
  /** Complete models, sorted by composite score (best first). */
  ranked: TrackEntry[]
  /** Models missing at least one core benchmark — excluded from the ranking. */
  incomplete: TrackEntry[]
}

/** One context benchmark's raw score for a model. */
export interface ContextScore {
  /** Benchmark id. */
  benchmark: string
  /** The model's raw score (in the benchmark's own unit). */
  raw: number
  /** The unit of the raw score. */
  unit: ScoreUnit
  /**
   * Normalized against the field best on a 0–100 scale. Only present for
   * `percent` benchmarks that have a field best.
   */
  normalized?: number
}

/** The field best of a benchmark, and the model holding it. */
export interface FieldBestDetail {
  /** The highest percent score any model in the pool has for the benchmark. */
  best: number
  /** Id of the model holding the field best. */
  modelId?: string
  /** Display name of the model holding the field best. */
  modelName?: string
}

/** Options shared by the scoring functions. */
export interface ScoreOptions {
  /**
   * Override the per-benchmark field best. Use it to pin a denominator (e.g.
   * a benchmark that no model in the registry covers yet).
   */
  fieldBest?: (benchmarkId: string) => number | undefined
  /**
   * The model pool the field best is computed from. Defaults to the whole
   * leaderboard registry.
   */
  models?: readonly LeaderboardModel[]
}

// ───────────────────────── internals ─────────────────────────

/** Decimal places kept on a normalized score. */
const SCORE_PRECISION = 4

function round4(value: number): number {
  return Math.round(value * 10 ** SCORE_PRECISION) / 10 ** SCORE_PRECISION
}

const BENCHMARK_BY_ID = new Map(BENCHMARKS.map((b) => [b.id, b] as const))

/**
 * The usable percent score of a model on a benchmark, or undefined.
 *
 * A score is usable only when the benchmark is registered as a `percent`
 * benchmark AND the score itself is a `percent` score — a rating or elo
 * number can never be normalized against a percent field best.
 */
function usablePercentScore(model: LeaderboardModel, benchmarkId: string): number | undefined {
  const benchmark = BENCHMARK_BY_ID.get(benchmarkId)
  if (!benchmark || benchmark.unit !== 'percent') return undefined
  const score = model.scores.find((s) => s.benchmark === benchmarkId)
  if (!score || score.unit !== 'percent') return undefined
  return score.score
}

/** Resolve a track argument (slug or track object) to a track. */
function resolveTrack(track: ScoreTrack | TrackSlug): ScoreTrack {
  if (typeof track !== 'string') return track
  const found = findTrack(track)
  if (!found) throw new Error(`unknown track: ${track}`)
  return found
}

/** The field-best resolver a set of options implies. */
function fieldBestResolver(opts: ScoreOptions): (benchmarkId: string) => number | undefined {
  if (opts.fieldBest) return opts.fieldBest
  const pool = opts.models ?? LEADERBOARD.models
  return (benchmarkId: string) => fieldBest(benchmarkId, pool)
}

// ───────────────────────── public API ─────────────────────────

/**
 * The field best of a benchmark: the highest percent score ANY model in the
 * registry has for it. The denominator of every normalized score.
 *
 * Returns undefined when the benchmark is not a `percent` benchmark (nothing
 * to normalize against) or when no model in the pool has a percent score for
 * it — such a benchmark is ineligible and can never enter a composite.
 */
export function fieldBest(
  benchmarkId: string,
  models: readonly LeaderboardModel[] = LEADERBOARD.models,
): number | undefined {
  const benchmark = BENCHMARK_BY_ID.get(benchmarkId)
  if (!benchmark || benchmark.unit !== 'percent') return undefined
  let best: number | undefined
  for (const model of models) {
    const score = usablePercentScore(model, benchmarkId)
    if (score === undefined) continue
    if (best === undefined || score > best) best = score
  }
  // A zero field best would make the normalization a division by zero.
  if (best === undefined || best <= 0) return undefined
  return best
}

/**
 * The field best of a benchmark AND who holds it — "normalized against the
 * field best (96.0, held by GPT-6 Astra)". The methodology page prints this
 * so a reader can check the arithmetic.
 */
export function fieldBestDetail(
  benchmarkId: string,
  models: readonly LeaderboardModel[] = LEADERBOARD.models,
): FieldBestDetail | undefined {
  const benchmark = BENCHMARK_BY_ID.get(benchmarkId)
  if (!benchmark || benchmark.unit !== 'percent') return undefined
  let best: number | undefined
  let holder: LeaderboardModel | undefined
  for (const model of models) {
    const score = usablePercentScore(model, benchmarkId)
    if (score === undefined) continue
    if (best === undefined || score > best) {
      best = score
      holder = model
    }
  }
  if (best === undefined || best <= 0) return undefined
  return { best, modelId: holder?.id, modelName: holder?.displayName }
}

/**
 * The weighted mean of a set of normalized parts.
 * Exported so the methodology page can print the exact same arithmetic the
 * score was produced with.
 */
export function weightedMean(
  parts: readonly Pick<TrackScorePart, 'normalized' | 'weight'>[],
): number | undefined {
  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0)
  if (totalWeight <= 0) return undefined
  const sum = parts.reduce((acc, part) => acc + part.normalized * part.weight, 0)
  return sum / totalWeight
}

/**
 * Score a model against an arbitrary weighted core set, using the same
 * field-best normalization and the same coverage gate as the tracks.
 *
 * The composite is published only when every core benchmark is covered
 * (`complete === true`). When it is not, `composite` stays `undefined` and
 * `missing` lists the core benchmarks that were never measured — the model
 * belongs in the "incomplete" list, not in a ranking with a flattering
 * partial average.
 *
 * `parts` carries the covered core benchmarks with their raw score, their
 * normalized value (0–100) and their weight, so the UI can show exactly how
 * the composite was built. The missing ones are in `missing`.
 */
export function scoreAgainstCore(
  model: LeaderboardModel,
  core: TrackBenchmark[],
  opts: ScoreOptions = {},
): TrackScore {
  const resolveBest = fieldBestResolver(opts)
  const parts: TrackScorePart[] = []
  const covered: string[] = []
  const missing: string[] = []

  for (const entry of core) {
    const raw = usablePercentScore(model, entry.id)
    const best = resolveBest(entry.id)
    if (raw === undefined || best === undefined || best <= 0) {
      missing.push(entry.id)
      continue
    }
    covered.push(entry.id)
    parts.push({
      benchmark: entry.id,
      raw,
      normalized: round4((raw / best) * 100),
      weight: entry.weight,
    })
  }

  const complete = missing.length === 0 && parts.length === core.length
  const composite = complete ? weightedMean(parts) : undefined

  return {
    composite,
    coverage: core.length === 0 ? 0 : covered.length / core.length,
    covered,
    missing,
    complete,
    parts,
  }
}

/**
 * Score one model on one track — the track's core set, gated and normalized
 * exactly like {@link scoreAgainstCore}, plus the track's context benchmarks.
 */
export function scoreTrack(
  model: LeaderboardModel,
  track: ScoreTrack | TrackSlug,
  opts: ScoreOptions = {},
): TrackScore {
  const resolved = resolveTrack(track)
  const score = scoreAgainstCore(model, resolved.core, opts)
  score.context = contextScores(model, resolved, opts)
  return score
}

/**
 * The context benchmarks of a track for one model — shown for information,
 * never part of the composite.
 *
 * Context scores are reported in their own unit; a `percent` context
 * benchmark is also normalized against its field best so the UI can show
 * where the model sits relative to the field.
 */
export function contextScores(
  model: LeaderboardModel,
  track: ScoreTrack | TrackSlug,
  opts: ScoreOptions = {},
): ContextScore[] {
  const resolved = resolveTrack(track)
  const resolveBest = fieldBestResolver(opts)
  const out: ContextScore[] = []
  for (const id of resolved.context) {
    const score = model.scores.find((s) => s.benchmark === id)
    if (!score) continue
    const best = score.unit === 'percent' ? resolveBest(id) : undefined
    out.push({
      benchmark: id,
      raw: score.score,
      unit: score.unit,
      normalized: best === undefined ? undefined : round4((score.score / best) * 100),
    })
  }
  return out
}

/**
 * Rank a track over a set of models.
 *
 * `ranked` holds the complete models, best composite first. `incomplete`
 * holds the models missing at least one core benchmark — they are NOT
 * ranked, because a partial average over a different denominator is exactly
 * the thing this module exists to stop publishing.
 */
export function rankTrack(
  track: ScoreTrack | TrackSlug,
  models: readonly LeaderboardModel[] = LEADERBOARD.models,
): TrackRanking {
  const resolved = resolveTrack(track)
  const ranked: TrackEntry[] = []
  const incomplete: TrackEntry[] = []

  for (const model of models) {
    const score = scoreTrack(model, resolved, { models })
    if (score.complete && score.composite !== undefined) {
      ranked.push({ model, score })
    } else {
      incomplete.push({ model, score })
    }
  }

  // Best first; ties keep the registry order (a stable sort).
  ranked.sort((a, b) => (b.score.composite as number) - (a.score.composite as number))
  // Most-covered first, so the near-misses sit at the top of the incomplete list.
  incomplete.sort((a, b) => b.score.coverage - a.score.coverage)

  return { ranked, incomplete }
}
