import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BEST_CATEGORIES, COMPARE_PAIR_ENTRIES } from '@/features/leaderboard/leaderboard'
import { allSeriesPairs, listSeries } from '@/features/series/select'
import { isIndexablePath } from './indexability'
import { CORE_PATHS, CORE_ZH_PATHS } from './sitemap-core'

/**
 * The sitemap's route inventory — the single source of truth for "which pages
 * does the sitemap publish".
 *
 * This module is deliberately **pure**: it imports no `cloudflare:workers` env
 * and no MDX collection, so a node test can assert the inventory against the
 * route files on disk (see `sitemap-paths.node.test.ts`). The release posts
 * are the one family that cannot be resolved here (they live in the MDX
 * collection), so the caller passes their slugs in.
 */

/**
 * The public pages that live at a fixed path.
 *
 * Every entry here is a route file under `src/routes/{-$locale}/`; the guard
 * test walks that directory and fails the build when a public page is added
 * but not listed here (and when a listed path has no route file).
 */
export const PUBLIC_PATHS = [
  '/',
  '/changelog',
  '/sponsor',
  '/waitlist',
  '/terms',
  '/privacy',
  '/token-cost-calculator',
  '/openrouter-pricing-calculator',
  '/claude-token-cost-calculator',
  '/chatgpt-api-pricing',
  '/deepseek-api-pricing',
  '/token-calculator',
  '/leaderboard-history',
  '/compare',
  '/releases',
] as const

/**
 * The model surfaces: one page per leaderboard row, per benchmark (and its
 * history), per hand-picked comparison pair, and per "best model for X" page.
 */
export function leaderboardPaths(): string[] {
  return [
    ...LEADERBOARD.models.map((m) => `/models/${m.id}`),
    ...BENCHMARKS.flatMap((b) => [`/benchmarks/${b.id}`, `/benchmarks/${b.id}/history`]),
    ...COMPARE_PAIR_ENTRIES.map((p) => `/compare/${p.slug}`),
    ...BEST_CATEGORIES.map((c) => `/best/${c.slug}`),
  ]
}

/**
 * The series surface: the index, one page per vendor product line, and one
 * page per pair of versions inside a line.
 */
export function seriesPaths(): string[] {
  return [
    '/series',
    ...listSeries().map((s) => `/series/${s.slug}`),
    ...allSeriesPairs().map((p) => `/series/${p.seriesSlug}/${p.pairSlug}`),
  ]
}

/**
 * Every path the FULL sitemap publishes.
 *
 * The fixed-path pages first, then the registry-driven families: models,
 * benchmarks, compare pairs, series lines and version pairs, release posts.
 *
 * Paths that fail their indexability floor are dropped here — a sitemap must
 * not advertise a page the site itself asks the search engines to ignore.
 */
export function sitemapPaths(releaseSlugs: string[] = []): string[] {
  return [
    ...PUBLIC_PATHS,
    ...leaderboardPaths(),
    ...releaseSlugs.map((slug) => `/releases/${slug}`),
    ...seriesPaths(),
  ].filter(isIndexablePath)
}

/**
 * The core list — the pages the site asks to be judged by.
 *
 * The English pages are listed on their own; the Chinese pages are listed
 * for the six pages whose Chinese version carries the same intent. A page
 * listed in both buckets contributes both URLs, never a duplicate.
 */
export function coreSitemapPaths(): { en: string[]; zh: string[] } {
  return { en: [...CORE_PATHS], zh: [...CORE_ZH_PATHS] }
}
