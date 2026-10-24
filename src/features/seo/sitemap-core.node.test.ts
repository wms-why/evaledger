import { expect, test } from 'vitest'
import { CORE_PATHS, CORE_ZH_PATHS } from '@/features/seo/sitemap-core'
import { coreSitemapPaths } from '@/features/seo/sitemap-paths'
import { isIndexablePath } from '@/features/seo/indexability'
import { buildSitemap } from '@/features/seo/seo'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { COMPARE_PAIR_ENTRIES } from '@/features/leaderboard/leaderboard'
import { SERIES } from '@/features/series/series'
import { allSeriesPairs } from '@/features/series/select'
import { publicRoutePaths, releasePostPaths } from './__tests__/route-files'

/** The origin the guard tests build URLs against. */
const origin = 'https://app.example.com'

/**
 * The core sitemap is the site's bid for the index, so it is guarded hard:
 *
 *   - every path in it must be a page the site actually serves,
 *   - every path in it must clear its indexability floor (a thin page has no
 *     business in the list the site asks to be judged by),
 *   - and the list must stay SHORT — the whole point of the split is that
 *     this list does not dilute the site's first impressions.
 */

/** Every path the site serves, by family. */
function livePaths(): Set<string> {
  const paths = new Set(publicRoutePaths())
  for (const model of LEADERBOARD.models) paths.add(`/models/${model.id}`)
  for (const benchmark of BENCHMARKS) {
    paths.add(`/benchmarks/${benchmark.id}`)
    paths.add(`/benchmarks/${benchmark.id}/history`)
  }
  for (const pair of COMPARE_PAIR_ENTRIES) paths.add(`/compare/${pair.slug}`)
  for (const series of SERIES) paths.add(`/series/${series.slug}`)
  for (const pair of allSeriesPairs()) paths.add(`/series/${pair.seriesSlug}/${pair.pairSlug}`)
  for (const post of releasePostPaths()) paths.add(post)
  return paths
}

test('every core path is a page the site serves', () => {
  const live = livePaths()
  for (const path of [...CORE_PATHS, ...CORE_ZH_PATHS]) {
    expect([...live], `${path} is in the core sitemap but has no page`).toContain(path)
  }
})

test('every core path clears its indexability floor', () => {
  for (const path of [...CORE_PATHS, ...CORE_ZH_PATHS]) {
    expect(isIndexablePath(path), `${path} is in the core sitemap but is thin`).toBe(true)
  }
})

test('the core list stays short — that is the point of the split', () => {
  // The full sitemap is ~250 URLs; the core is the short list a crawler
  // meets first. If this number grows, the list has stopped being a
  // curation and has become a dump.
  //
  // The list grew by exactly the four new per-provider pricing landings
  // (Gemini, Grok, MiniMax, Kimi): a pricing page carries the vendor name
  // people actually type, so it is the one long-tail family that earns a
  // place in the core bid for the index.
  expect(CORE_PATHS.length).toBeLessThanOrEqual(26)
  expect(CORE_ZH_PATHS.length).toBeLessThanOrEqual(12)
})

test('the core list publishes every page exactly once', () => {
  // The English list and the Chinese list name the same pages on purpose —
  // each page contributes its own URL, so the sitemap must not repeat one.
  const { en, zh } = coreSitemapPaths()
  const xml = buildSitemap(origin, { en, zh })
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
  expect(locs.length, 'the core sitemap must list every page once').toBe(en.length + zh.length)
  expect(new Set(locs).size, 'the core sitemap repeats a URL').toBe(locs.length)
})

test('the Chinese core pages are the ones the product is written for', () => {
  // The Chinese mirror of the long tail (benchmarks, series, release posts)
  // stays out of the core list: the site's target market is English.
  for (const path of CORE_ZH_PATHS) {
    expect(
      path === '/' || path.startsWith('/token-cost-calculator') || path.endsWith('-calculator') || path.endsWith('-pricing'),
      `${path} is an odd member of the Chinese core list`,
    ).toBe(true)
  }
})
