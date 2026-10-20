import { BENCHMARKS } from './benchmarks'
import { LEADERBOARD, findLeaderboardModel } from './models'
import type { LeaderboardModel } from './types'

/**
 * How many models the `/compare` page can show at once. Two is the floor (a
 * single model is not a comparison) and five keeps the table readable on a
 * laptop without turning it into a spreadsheet.
 */
export const MIN_COMPARE_MODELS = 2
export const MAX_COMPARE_MODELS = 5

/** Default columns when the URL carries no usable selection. */
export const DEFAULT_COMPARE_IDS = ['claude-opus-5', 'gpt-5.6-sol'] as const

/**
 * Search shape of `/compare`.
 *
 * `models` is the canonical, ordered CSV (`?models=a,b,c`). `a`/`b` remain
 * supported because older links — release pages, shared comparisons — use
 * `?a=&b=`. New links always write `models`.
 *
 * `scores` selects which benchmark rows the table shows. Absent means “all
 * rows available to the current line-up”; `none` means the user hid them all.
 */
export interface CompareSearch {
  a?: string
  b?: string
  models?: string
  scores?: string
}

/** `?scores=` value for an explicitly empty score-row selection. */
export const NO_COMPARE_SCORES = 'none'

function splitIds(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

function dedupe(ids: string[]): string[] {
  return [...new Set(ids)]
}

/**
 * Resolve the ordered model ids to compare from a `/compare` search object.
 *
 * - `models` wins over legacy `a`/`b`; the order in the URL is the column order.
 * - Unknown ids are dropped, duplicates collapse to their first position.
 * - Fewer than {@link MIN_COMPARE_MODELS} valid ids are padded from the
 *   defaults (then any registry model) so the page always renders a table.
 * - More than {@link MAX_COMPARE_MODELS} ids are truncated, keeping the first.
 */
export function resolveCompareIds(search: CompareSearch): string[] {
  const requested = splitIds(search.models)
  const legacy = requested.length
    ? requested
    : [search.a, search.b].filter((id): id is string => !!id)
  const valid = dedupe(legacy).filter((id) => !!findLeaderboardModel(id))

  const ids = valid.slice(0, MAX_COMPARE_MODELS)
  if (ids.length >= MIN_COMPARE_MODELS) return ids

  const fallback = [...DEFAULT_COMPARE_IDS, ...LEADERBOARD.models.map((m) => m.id)]
  for (const id of fallback) {
    if (ids.length >= MIN_COMPARE_MODELS) break
    if (!ids.includes(id)) ids.push(id)
  }
  return ids
}

/** Canonical URL value for an ordered selection. */
export function serializeCompareIds(ids: string[]): string {
  return ids.join(',')
}

/**
 * Move one id by `delta` positions, clamped to the array. Returns the same
 * array reference when nothing moves so callers can skip a navigation.
 */
export function moveCompareId(ids: string[], id: string, delta: number): string[] {
  const from = ids.indexOf(id)
  if (from < 0) return ids
  const to = Math.min(ids.length - 1, Math.max(0, from + delta))
  if (to === from) return ids
  const next = [...ids]
  next.splice(from, 1)
  next.splice(to, 0, id)
  return next
}

/**
 * Benchmark ids at least one of `models` has a score for, in `BENCHMARKS`
 * registry order — also the row order of the comparison table.
 */
export function availableScoreIds(models: readonly LeaderboardModel[]): string[] {
  const scored = new Set(models.flatMap((model) => model.scores.map((score) => score.benchmark)))
  return BENCHMARKS.filter((benchmark) => scored.has(benchmark.id)).map(
    (benchmark) => benchmark.id,
  )
}

/**
 * Resolve the score rows to show from a `/compare` search object.
 *
 * - No `scores`: every available row (the default table).
 * - `scores=none`: no score rows; price and context stay.
 * - Explicit CSV: known, available ids in registry order. A list that matches
 *   nothing (stale shared link, renamed benchmark) falls back to all rows so
 *   the page still renders a usable table.
 */
export function resolveCompareScoreIds(search: CompareSearch, available: string[]): string[] {
  if (search.scores === NO_COMPARE_SCORES) return []
  if (!search.scores) return [...available]
  const requested = new Set(splitIds(search.scores))
  const picked = available.filter((id) => requested.has(id))
  return picked.length > 0 ? picked : [...available]
}

/**
 * URL value for a score-row selection. Returns `undefined` when every
 * available row is selected, so the canonical URL carries no `scores` param;
 * `none` for an explicitly empty selection.
 */
export function serializeCompareScores(
  ids: string[],
  available: string[],
): string | undefined {
  const picked = available.filter((id) => ids.includes(id))
  if (picked.length === available.length) return undefined
  if (picked.length === 0) return NO_COMPARE_SCORES
  return picked.join(',')
}
