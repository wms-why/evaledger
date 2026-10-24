import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { BEST_CATEGORIES, COMPARE_PAIR_ENTRIES } from '@/features/leaderboard/leaderboard'
import { TRACK_IDS } from '@/features/leaderboard/scoring'
import { SERIES } from '@/features/series/series'
import { allSeriesPairs } from '@/features/series/select'
import type { Locale } from '@/features/i18n/locale'

/**
 * The route inventory — the single source of truth for "which pages exist".
 *
 * Every dynamic family is derived from the same registry the page reads at
 * runtime, so a newly shipped model (REGISTRY/LEADERBOARD), benchmark, series
 * or release post is covered by the suite the moment it lands, with no list to
 * keep in sync by hand.
 *
 * The admin console (`/admin/*`) is intentionally absent: this project ships
 * no back office. The signed-in app shell (`/app/*`) is covered by the auth
 * spec as a redirect, not as a rendered page.
 */

/** One page the suite visits. */
export interface RouteCase {
  /** Locale-less path, always starting with `/`. */
  path: string
  /** Human label used in the test title. */
  name: string
  /** Which family the page belongs to — drives the spec that owns it. */
  group:
    | 'static'
    | 'calculator'
    | 'compare'
    | 'leaderboard'
    | 'model'
    | 'benchmark'
    | 'best'
    | 'release'
    | 'series'
    | 'legal'
    | 'auth'
}

/** Pages that exist at a fixed path. */
export const STATIC_ROUTES: RouteCase[] = [
  { path: '/', name: 'landing / leaderboard', group: 'static' },
  { path: '/leaderboard-history', name: 'leaderboard history', group: 'static' },
  { path: '/methodology', name: 'scoring methodology', group: 'static' },
  { path: '/data-quality', name: 'data quality', group: 'static' },
  { path: '/changelog', name: 'changelog', group: 'static' },
  { path: '/sponsor', name: 'sponsor', group: 'static' },
  { path: '/waitlist', name: 'waitlist', group: 'static' },
  { path: '/privacy', name: 'privacy policy', group: 'legal' },
  { path: '/terms', name: 'terms of service', group: 'legal' },
  { path: '/login', name: 'login', group: 'auth' },
  { path: '/register', name: 'register', group: 'auth' },
  { path: '/forgot-password', name: 'forgot password', group: 'auth' },
  { path: '/reset-password', name: 'reset password', group: 'auth' },
  { path: '/verify-email', name: 'verify email', group: 'auth' },
]

/** `/leaderboard/$track` — one page per capability board. */
export const TRACK_ROUTES: RouteCase[] = TRACK_IDS.map((slug) => ({
  path: `/leaderboard/${slug}`,
  name: `leaderboard track ${slug}`,
  group: 'leaderboard' as const,
}))

/**
 * The calculator and the per-provider pricing landings.
 *
 * `/token-calculator` is deliberately NOT here: it is a 301 redirect to the
 * canonical `/token-cost-calculator`, and a redirect is not a page — listing
 * it would make the suite drive a browser at an address that no longer serves
 * content of its own.
 */
export const CALCULATOR_ROUTES: RouteCase[] = [
  { path: '/token-cost-calculator', name: 'token cost calculator landing', group: 'calculator' },
  { path: '/claude-token-cost-calculator', name: 'claude pricing landing', group: 'calculator' },
  { path: '/chatgpt-api-pricing', name: 'chatgpt pricing landing', group: 'calculator' },
  { path: '/deepseek-api-pricing', name: 'deepseek pricing landing', group: 'calculator' },
  { path: '/openrouter-pricing-calculator', name: 'openrouter pricing landing', group: 'calculator' },
  { path: '/gemini-api-pricing', name: 'gemini pricing landing', group: 'calculator' },
  { path: '/grok-api-pricing', name: 'grok pricing landing', group: 'calculator' },
  { path: '/minimax-api-pricing', name: 'minimax pricing landing', group: 'calculator' },
  { path: '/kimi-api-pricing', name: 'kimi pricing landing', group: 'calculator' },
]

/** `/models/$slug` — one page per leaderboard row. */
export const MODEL_ROUTES: RouteCase[] = LEADERBOARD.models.map((model) => ({
  path: `/models/${model.id}`,
  name: `model ${model.displayName}`,
  group: 'model' as const,
}))

/** `/benchmarks/$slug` and its history page. */
export const BENCHMARK_ROUTES: RouteCase[] = BENCHMARKS.flatMap((benchmark) => [
  {
    path: `/benchmarks/${benchmark.id}`,
    name: `benchmark ${benchmark.id}`,
    group: 'benchmark' as const,
  },
  {
    path: `/benchmarks/${benchmark.id}/history`,
    name: `benchmark history ${benchmark.id}`,
    group: 'benchmark' as const,
  },
])

/** `/best/$category` — the curated "best model for X" pages. */
export const BEST_ROUTES: RouteCase[] = BEST_CATEGORIES.map((category) => ({
  path: `/best/${category.slug}`,
  name: `best ${category.slug}`,
  group: 'best' as const,
}))

/** `/compare` — the interactive tool; `/compare/$pair` — the hand-picked pairs. */
export const COMPARE_ROUTES: RouteCase[] = [
  { path: '/compare', name: 'compare tool', group: 'compare' },
]

export const COMPARE_PAIR_ROUTES: RouteCase[] = COMPARE_PAIR_ENTRIES.map((pair) => ({
  path: `/compare/${pair.slug}`,
  name: `compare ${pair.slug}`,
  group: 'compare' as const,
}))

/** `/series` — the index of vendor lines; `/series/$slug` — one line. */
export const SERIES_ROUTES: RouteCase[] = [
  { path: '/series', name: 'series index', group: 'series' },
  ...SERIES.map((series) => ({
    path: `/series/${series.slug}`,
    name: `series ${series.name}`,
    group: 'series' as const,
  })),
]

/** `/series/$slug/$pair` — two versions of one line, head to head. */
export const SERIES_PAIR_ROUTES: RouteCase[] = allSeriesPairs().map((pair) => ({
  path: `/series/${pair.seriesSlug}/${pair.pairSlug}`,
  name: `series pair ${pair.seriesSlug}/${pair.pairSlug}`,
  group: 'series' as const,
}))

/**
 * Release posts, read from the content directory.
 *
 * The zh file of a post (`<slug>.zh.md`) shares the URL slug, so only the
 * plain `.md` files are routes. Reading the directory (rather than importing
 * the MDX collection) keeps the spec free of the fumadocs toolchain.
 */
const RELEASE_DIR = fileURLToPath(new URL('../../src/content/releases/', import.meta.url))
export const RELEASE_SLUGS: string[] = readdirSync(RELEASE_DIR)
  .filter((file) => file.endsWith('.md') && !file.endsWith('.zh.md'))
  .map((file) => file.slice(0, -'.md'.length))
  .sort()

export const RELEASE_ROUTES: RouteCase[] = [
  { path: '/releases', name: 'release index', group: 'release' },
  ...RELEASE_SLUGS.map((slug) => ({
    path: `/releases/${slug}`,
    name: `release ${slug}`,
    group: 'release' as const,
  })),
]

/** Every page that carries a locale prefix. */
export const ALL_PAGE_ROUTES: RouteCase[] = [
  ...STATIC_ROUTES,
  ...CALCULATOR_ROUTES,
  ...COMPARE_ROUTES,
  ...TRACK_ROUTES,
  ...MODEL_ROUTES,
  ...BENCHMARK_ROUTES,
  ...BEST_ROUTES,
  ...COMPARE_PAIR_ROUTES,
  ...SERIES_ROUTES,
  ...SERIES_PAIR_ROUTES,
  ...RELEASE_ROUTES,
]

/**
 * Machine-readable endpoints. These live outside the locale group — they are
 * served at the same URL no matter the language.
 */
export const ENDPOINT_ROUTES: RouteCase[] = [
  { path: '/sitemap.xml', name: 'sitemap (core)', group: 'static' },
  { path: '/sitemap-core.xml', name: 'core sitemap', group: 'static' },
  { path: '/sitemap-full.xml', name: 'full sitemap', group: 'static' },
  { path: '/robots.txt', name: 'robots', group: 'static' },
  { path: '/feed.xml', name: 'feed', group: 'static' },
  { path: '/api/prices.json', name: 'price api', group: 'static' },
]

/** `/` → `/`, `/compare` → `/zh/compare`; endpoints stay locale-less. */
export function localePath(path: string, locale: Locale): string {
  if (locale === 'en') return path
  if (!path.startsWith('/')) return path
  return path === '/' ? '/zh' : `/zh${path}`
}
