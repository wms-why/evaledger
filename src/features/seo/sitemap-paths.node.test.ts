import { expect, test } from 'vitest'
import { buildSitemap } from '@/features/seo/seo'
import { PUBLIC_PATHS, seriesPaths, sitemapPaths } from '@/features/seo/sitemap-paths'
import { isIndexablePath } from '@/features/seo/indexability'
import { localizePath } from '@/features/i18n/locale'
import { publicRoutePaths } from './__tests__/route-files'

/**
 * The sitemap's route inventory, checked against the route files on disk.
 *
 * The sitemap is the one surface that is *hand-listed*: every dynamic family
 * (models, benchmarks, compare pairs, series, release posts) is derived from
 * a registry, but the fixed-path pages are written down. A public page that
 * is added to `src/routes/{-$locale}/` and forgotten here is invisible to
 * search engines — which is exactly how `/chatgpt-api-pricing` shipped
 * without a sitemap entry while all four of its sibling pricing landings
 * were listed.
 *
 * So this test walks the route directory: a public page on disk that the
 * sitemap does not publish fails the build, and so does a published path
 * that has no route file.
 */

const origin = 'https://app.example.com'

test('every public route file is published — or deliberately not', () => {
  // A page on disk that is neither published nor noindexed is a page the
  // search engines have to find on their own. A page that is published but
  // thin is worse: it spends the site's index budget on nothing.
  const published = new Set(sitemapPaths())
  for (const path of publicRoutePaths()) {
    if (isIndexablePath(path)) {
      expect([...published], `the sitemap must publish ${path}`).toContain(path)
    } else {
      expect([...published], `${path} is thin and must stay out of the sitemap`).not.toContain(path)
    }
  }
})

test('every published fixed path has a route file behind it', () => {
  const files = new Set(publicRoutePaths())
  for (const path of PUBLIC_PATHS) {
    expect([...files], `${path} is published but has no route file`).toContain(path)
  }
})

test('the sitemap publishes every public page in both languages, once', () => {
  const xml = buildSitemap(origin, { both: sitemapPaths(['demo-post']) })
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
  expect(new Set(locs).size, 'the sitemap must not repeat a URL').toBe(locs.length)

  const expected = [...PUBLIC_PATHS, '/series', '/releases/demo-post'].filter(isIndexablePath)
  for (const path of expected) {
    expect(locs, `the sitemap must list ${path}`).toContain(`${origin}${localizePath('en', path)}`)
    expect(locs, `the sitemap must list the zh ${path}`).toContain(
      `${origin}${localizePath('zh', path)}`,
    )
  }
})

test('the per-provider pricing landings are all published', () => {
  const published = new Set([...PUBLIC_PATHS, ...seriesPaths()])
  for (const path of [
    '/token-cost-calculator',
    '/openrouter-pricing-calculator',
    '/claude-token-cost-calculator',
    '/chatgpt-api-pricing',
    '/deepseek-api-pricing',
  ]) {
    expect([...published], `${path} must be in the sitemap`).toContain(path)
  }
})

test('the full sitemap never lists a page the site asks to be ignored', () => {
  // A sitemap must not advertise a noindex page — the two documents would
  // contradict each other.
  for (const path of sitemapPaths(['demo-post'])) {
    expect(isIndexablePath(path), `${path} is thin but the sitemap lists it`).toBe(true)
  }
})
