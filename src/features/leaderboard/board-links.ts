import { BEST_CATEGORIES } from './leaderboard'
import { TRACKS, TRACK_IDS, type TrackSlug } from './scoring'

/**
 * The internal-link map between the surfaces that answer the same question.
 *
 * A capability board (`/leaderboard/coding`) and a best-model category page
 * (`/best/for-coding`) rank on the same benchmarks, but they answer
 * different searches — "how is the coding board built" versus "which LLM
 * should I use for coding". Linking one to the other is how a long-tail page
 * stops being an island.
 *
 * The mapping is checked against the registries **at render time**, so a
 * link never points at a category that does not exist: `general` has no
 * `/best/` twin and must not be given one.
 */

/** The `/best/<category>` twin of a capability board, when one exists. */
const BOARD_BEST_CATEGORY: Partial<Record<TrackSlug, string>> = {
  coding: 'for-coding',
  agent: 'for-agents',
  reasoning: 'for-reasoning',
}

/**
 * The capability board a "best model for X" page is the twin of.
 *
 * The inverse of `bestCategoryForTrack`: a board points at its `/best/`
 * twin, and the twin points back at the board. Without the second half the
 * page answered "which model is best for coding" and gave the reader no way
 * to reach the ranking that explains how the answer was computed.
 */
export function trackForBestCategory(slug: string): TrackSlug | undefined {
  for (const [track, category] of Object.entries(BOARD_BEST_CATEGORY)) {
    if (category === slug) return track as TrackSlug
  }
  return undefined
}

/**
 * The `/best/<category>` slug a board points at, or undefined.
 *
 * Returns undefined when the board has no twin (general) **or** when the
 * category registry does not carry the slug — the check is against the
 * registry rather than against this map, so a category that is never
 * published cannot be linked.
 */
export function bestCategoryForTrack(track: TrackSlug): string | undefined {
  const slug = BOARD_BEST_CATEGORY[track]
  if (!slug) return undefined
  return BEST_CATEGORIES.some((category) => category.slug === slug) ? slug : undefined
}

/**
 * The i18n key that names a best-model category page.
 *
 * The shared dictionary owns the page titles; this map holds the anchor text
 * for the links that point at those pages. A category without an entry falls
 * back to the shared dictionary's own title.
 */
export const BEST_CATEGORY_LABEL_KEY: Record<string, string> = {
  'chinese-model': 'linking.best.chineseModel',
  'open-source': 'linking.best.openSource',
  'for-coding': 'linking.best.forCoding',
  'for-agents': 'linking.best.forAgents',
  'for-reasoning': 'linking.best.forReasoning',
}

/**
 * The anchor text for a link to a best-model category page.
 *
 * Prefers this feature's own label (which names the destination) and falls
 * back to the shared dictionary's title for the page. If neither exists the
 * raw slug is used, so a link is never rendered with an empty anchor.
 */
export function bestCategoryLabel(
  t: (key: string, params?: Record<string, string | number>) => string,
  slug: string,
): string {
  const key = BEST_CATEGORY_LABEL_KEY[slug]
  if (key) return t(key)
  const shared = `leaderboard.best.${slug}.title`
  const title = t(shared)
  return title === shared ? slug : title
}

/** The i18n key for a board's own tab / link anchor text. */
export const BOARD_LABEL_KEY: Record<TrackSlug, string> = {
  general: 'linking.board.general',
  coding: 'linking.board.coding',
  agent: 'linking.board.agent',
  reasoning: 'linking.board.reasoning',
}

/** The boards that score on a benchmark — as a core weight or as context. */
export function boardsUsingBenchmark(benchmarkId: string): TrackSlug[] {
  return TRACK_IDS.filter((slug) => {
    const track = TRACKS[slug]
    return (
      track.core.some((entry) => entry.id === benchmarkId) ||
      track.context.includes(benchmarkId)
    )
  })
}

/** The best-model category pages that rank on a benchmark. */
export function bestCategoriesUsingBenchmark(benchmarkId: string): string[] {
  return BEST_CATEGORIES.filter((category) => category.benchmarkIds.includes(benchmarkId)).map(
    (category) => category.slug,
  )
}
