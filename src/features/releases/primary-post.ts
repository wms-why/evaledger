import { findLeaderboardModel } from '@/features/leaderboard/models'
import type { ReleaseMeta } from './types'

/**
 * Which post a model page or a series page should feature as "the analysis of
 * this model".
 *
 * A model can carry more than one post: the launch analysis, and a later
 * piece about the infrastructure around the same weights. The DeepInfer
 * article is published against the V4.1-Flash checkpoint without being a
 * second launch of it, and the DeepSeek line therefore has two posts pointing
 * at `deepseek-v4.1-flash-1017`.
 *
 * Taking whichever post happens to come first would let a later article
 * silently displace the launch one — which is exactly what happened when that
 * piece landed: the model page and the series page both stopped linking the
 * 1017 launch analysis. So a *launch* post wins:
 *
 *  - the model shipped on `releaseDate`; a post whose own `releasedAt` is
 *    that day is the launch analysis,
 *  - anything else is a later piece that mentions the model.
 *
 * A post whose model has no leaderboard row cannot be dated this way, so it
 * counts as a launch post and keeps its place in the list order.
 */
export function isLaunchPost(entry: ReleaseMeta): boolean {
  if (!entry.modelSlug) return true
  const model = findLeaderboardModel(entry.modelSlug)
  if (!model?.releaseDate) return true
  return entry.releasedAt === model.releaseDate
}

/**
 * Pick the post to feature out of the ones that mention a model or a series,
 * preferring a launch analysis over a later piece.
 *
 * When nothing is a launch post — a model with no verifiable release day —
 * the first candidate is returned, so the caller keeps the list's own order.
 */
export function pickPrimaryRelease(candidates: ReleaseMeta[]): ReleaseMeta | undefined {
  return candidates.find(isLaunchPost) ?? candidates[0]
}
