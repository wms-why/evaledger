import { expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import {
  ALL_PAGE_ROUTES,
  COMPARE_PAIR_ROUTES,
  MODEL_ROUTES,
  RELEASE_SLUGS,
  SERIES_ROUTES,
} from './helpers/routes'
import { REGISTRY } from '@/features/calculator/model-prices'
import { CORE_PATHS, CORE_ZH_PATHS } from '@/features/seo/sitemap-core'
import { isIndexablePath } from '@/features/seo/indexability'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BEST_CATEGORIES } from '@/features/leaderboard/leaderboard'
import type { Page } from '@playwright/test'

/**
 * The machine-readable surface and the head of every page: sitemap, robots,
 * feed, the price API, and the title / description / canonical / hreflang
 * contract the pages promise to search engines.
 */

/** One page per family — enough to cover every head shape the site has. */
const SAMPLE_PAGES = [
  '/',
  '/zh',
  '/compare',
  '/zh/compare',
  '/series',
  '/zh/series',
  // The two directory hubs — they carry a breadcrumb of their own, and a
  // breadcrumb that ends at the wrong page is invisible in a diff.
  '/benchmarks',
  '/benchmarks/hle',
  '/best',
  '/best/for-coding',
  '/methodology',
  // A capability board: its BreadcrumbList was documented in round 1 but
  // missing from the head, so the sampled set now holds it.
  '/leaderboard/coding',
  '/releases',
  '/zh/releases',
  RELEASE_SLUGS[0] ? `/releases/${RELEASE_SLUGS[0]}` : '/releases',
  MODEL_ROUTES[0]?.path ?? '/',
  COMPARE_PAIR_ROUTES[0]?.path ?? '/compare',
  // A series *line*, not the index — the index is already sampled above.
  SERIES_ROUTES.find((route) => route.path !== '/series')?.path ?? '/series',
  '/token-cost-calculator',
  '/claude-token-cost-calculator',
  '/chatgpt-api-pricing',
  '/deepseek-api-pricing',
  '/gemini-api-pricing',
  '/grok-api-pricing',
  '/minimax-api-pricing',
  '/kimi-api-pricing',
  '/openrouter-pricing-calculator',
]

/**
 * Read the DOM, tolerating a dev-server reload that lands mid-read.
 *
 * A teammate editing the app triggers an HMR reload, which destroys the
 * execution context while a locator is being read. The page comes back with
 * the same content, so the read is simply retried.
 */
async function read<T>(reader: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await reader()
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  throw lastError
}

/** Parse XML in the browser — the same parser a crawler would use. */
async function parseXml(page: Page, xml: string) {
  return read(() =>
    page.evaluate((source) => {
      const doc = new DOMParser().parseFromString(source, 'application/xml')
      return {
        error: doc.querySelector('parsererror')?.textContent ?? null,
        root: doc.documentElement.nodeName,
        locs: Array.from(doc.querySelectorAll('url > loc')).map((node) => node.textContent ?? ''),
        items: Array.from(doc.querySelectorAll('item')).map((item) => ({
          title: item.querySelector('title')?.textContent ?? '',
          link: item.querySelector('link')?.textContent ?? '',
        })),
      }
    }, xml),
  )
}

/**
 * The console errors that are the page's own fault.
 *
 * The browser asks `/api/auth/get-session` on every page (the auth client
 * hydrates its session atom), and that endpoint sits behind better-auth's
 * per-IP rate limiter — so a burst of page views from the whole e2e suite
 * (one IP) makes it answer 429. That is a server-side rate limit, not a
 * broken page, so it is filtered out here.
 */
function ownErrors(consoleErrors: string[]): string[] {
  return realConsoleErrors(consoleErrors).filter((error) => !/status of 429/.test(error))
}

test.describe('the machine-readable endpoints', () => {
  test('/sitemap.xml is valid XML and serves the core list', async ({ page }) => {
    // /sitemap.xml is the URL that used to be declared in robots.txt. It now
    // serves the CORE list — the short, curated one — so a crawler that
    // already knows the URL stops meeting the long tail.
    const response = await page.request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('xml')

    await visit(page, '/')
    const parsed = await parseXml(page, await response.text())
    expect(parsed.error, 'the sitemap must be valid XML').toBeNull()
    expect(parsed.root).toBe('urlset')

    const origin = new URL(response.url()).origin
    for (const path of CORE_PATHS) {
      expect(parsed.locs, `the core sitemap should list ${path}`).toContain(`${origin}${path}`)
    }
    for (const path of CORE_ZH_PATHS) {
      expect(parsed.locs, `the core sitemap should list the zh ${path}`).toContain(
        `${origin}/zh${path === '/' ? '' : path}`,
      )
    }
    // The core list is short relative to the full inventory — that is the
    // whole point of the split. The count is exercised against the registry
    // above (every CORE_PATHS / CORE_ZH_PATHS entry must be present); this
    // ceiling catches a duplicate or an accidental full-list paste. The
    // editorial cap itself lives in `sitemap-core.node.test.ts`.
    const coreCeiling = CORE_PATHS.length + CORE_ZH_PATHS.length
    expect(parsed.locs.length, 'the core sitemap must stay short').toBeLessThanOrEqual(coreCeiling)
  })

  test('/sitemap-core.xml is the same list as /sitemap.xml', async ({ page }) => {
    const core = await page.request.get('/sitemap-core.xml')
    expect(core.status()).toBe(200)
    const alias = await page.request.get('/sitemap.xml')
    expect(alias.status()).toBe(200)
    expect(await core.text()).toBe(await alias.text())
  })

  test('/sitemap-full.xml lists every public page of the route inventory', async ({ page }) => {
    // The inventory is the single source of truth for "which pages exist" —
    // it is derived from the same registries the pages read, so a page that
    // the site serves but the sitemap does not publish fails here.
    const response = await page.request.get('/sitemap-full.xml')
    expect(response.status()).toBe(200)
    await visit(page, '/')
    const parsed = await parseXml(page, await response.text())
    const origin = new URL(response.url()).origin

    for (const route of ALL_PAGE_ROUTES) {
      // The auth screens are `noindex` — they must stay out of the sitemap.
      if (route.group === 'auth') continue
      // A thin page is noindexed, and a sitemap must not advertise it.
      if (!isIndexablePath(route.path)) continue
      expect(parsed.locs, `the sitemap should list ${route.path}`).toContain(
        `${origin}${route.path === '/' ? '/' : route.path}`,
      )
      expect(parsed.locs, `the sitemap should list the zh ${route.path}`).toContain(
        `${origin}/zh${route.path === '/' ? '' : route.path}`,
      )
    }
  })

  test('/robots.txt is served as text and points at the core sitemap', async ({ page }) => {
    const response = await page.request.get('/robots.txt')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')

    const body = await response.text()
    expect(body).toContain('User-agent: *')
    expect(body).toContain('Allow: /api/prices.json')
    const origin = new URL(response.url()).origin
    // Only the core list is declared. The full list is served, but a declared
    // sitemap is an invitation, and the long tail is not the bid.
    expect(body).toContain(`Sitemap: ${origin}/sitemap-core.xml`)
    expect(body).not.toContain(`${origin}/sitemap-full.xml`)
  })

  test('/feed.xml is valid XML and carries the release posts', async ({ page }) => {
    const response = await page.request.get('/feed.xml')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('xml')

    await visit(page, '/')
    const parsed = await parseXml(page, await response.text())
    expect(parsed.error, 'the feed must be valid XML').toBeNull()
    expect(parsed.root).toBe('rss')

    // Both languages of every post are in the feed.
    expect(parsed.items.length).toBe(RELEASE_SLUGS.length * 2)
    const origin = new URL(response.url()).origin
    const links = parsed.items.map((item) => item.link)
    for (const slug of RELEASE_SLUGS) {
      expect(links, `the feed should carry ${slug}`).toContain(`${origin}/releases/${slug}`)
      expect(links, `the feed should carry the zh ${slug}`).toContain(
        `${origin}/zh/releases/${slug}`,
      )
    }
  })

  test('/api/prices.json returns the registry prices', async ({ page }) => {
    const response = await page.request.get('/api/prices.json')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/json')

    const body = await response.json()
    expect(body.meta.modelCount).toBe(REGISTRY.models.length)
    expect(body.meta.fetchedAt).toBe(REGISTRY.fetchedAt)
    expect(body.meta.schemaVersion).toBe(2)
    expect(body.models.length).toBe(REGISTRY.models.length)

    const known = body.models.find((model: { id: string }) => model.id === 'gpt-6-astra')
    expect(known, 'the feed should carry GPT-6 astra').toBeTruthy()
    const registry = REGISTRY.models.find((model) => model.id === known.id)!
    expect(known.inputPricePer1M).toBe(registry.inputPricePer1M)
    expect(known.outputPricePer1M).toBe(registry.outputPricePer1M)
    expect(known.contextWindow).toBe(registry.contextWindow)
  })
})

test.describe('the head of every page', () => {
  for (const path of SAMPLE_PAGES) {
    test(`${path} has a title, a description, a canonical link and hreflang alternates`, async ({ page, consoleErrors, pageErrors }) => {
      const response = await visit(page, path)
      expect(response?.status()).toBe(200)

      const title = (await read(() => page.title())).trim()
      expect(title.length, `${path} should carry a <title>`).toBeGreaterThan(0)

      const description = page.locator('meta[name="description"]')
      await expect(description).toHaveCount(1)
      const content = (await read(() => description.getAttribute('content')))?.trim() ?? ''
      expect(content.length, `${path} should carry a description`).toBeGreaterThan(0)

      const canonical = page.locator('link[rel="canonical"]')
      await expect(canonical).toHaveCount(1)
      const href = (await read(() => canonical.getAttribute('href'))) ?? ''
      expect(new URL(href).pathname, `${path} should canonicalize to itself`).toBe(path)

      await expect(page.locator('link[hreflang="en"]')).toHaveCount(1)
      await expect(page.locator('link[hreflang="zh"]')).toHaveCount(1)

      // The brand/social head a crawler and a link preview both read.
      await expect(page.locator('meta[property="og:site_name"]')).toHaveCount(1)
      await expect(page.locator('meta[name="twitter:title"]')).toHaveCount(1)
      await expect(page.locator('meta[name="twitter:description"]')).toHaveCount(1)

      expect(pageErrors).toEqual([])
      expect(ownErrors(consoleErrors)).toEqual([])
    })
  }

  test('the landing page carries the Organization and WebSite JSON-LD', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/')

    const scripts = await read(() =>
      page.locator('script[type="application/ld+json"]').allTextContents(),
    )
    expect(scripts.length, 'the landing page should carry JSON-LD').toBeGreaterThan(0)
    const payloads = scripts.map((script) => JSON.parse(script) as Record<string, unknown>)
    expect(payloads.some((payload) => payload['@type'] === 'Organization')).toBe(true)
    expect(payloads.some((payload) => payload['@type'] === 'WebSite')).toBe(true)

    expect(pageErrors).toEqual([])
    expect(ownErrors(consoleErrors)).toEqual([])
  })

  /**
   * The rendered page carries no template residue.
   *
   * `translate()` returns the KEY when a key is missing and leaves a
   * `{placeholder}` in the string when the caller did not supply it — both
   * are invisible in a diff and very visible to a reader. The site shipped
   * a model page whose comparison links read `{a} vs {b}` and a release
   * page whose cost tile read `releases.costPeak`.
   *
   * So the body text of every sampled page is checked for both shapes.
   */
  const DICTIONARY_SECTIONS = [
    'releases',
    'landing',
    'leaderboard',
    'series',
    'hub',
    'linking',
    'site',
    'calc',
    'marketing',
    'common',
    'app',
    'storage',
    'feedback',
    'sponsor',
    'waitlist',
    'changelog',
    'dataQuality',
  ]
  const RAW_KEY = new RegExp(`\\b(?:${DICTIONARY_SECTIONS.join('|')})\\.[a-zA-Z]`, 'g')

  for (const path of SAMPLE_PAGES) {
    test(`${path} renders no template residue and no raw dictionary key`, async ({ page }) => {
      await visit(page, path)
      const text = (await read(() => page.locator('body').innerText())) ?? ''

      // A `{placeholder}` in the visible text.
      const hole = text.match(/\{[A-Za-z_][\w]*\}/)
      expect(hole, `${path} renders a template placeholder: ${hole?.[0] ?? ''}`).toBeNull()

      // A dictionary key printed as text.
      const raw = text.match(RAW_KEY)
      expect(raw, `${path} renders a raw dictionary key: ${raw?.[0] ?? ''}`).toBeNull()
    })
  }

  test('the use-case rankings each carry their own description', async ({ page }) => {
    // One shared description across eight pages told a crawler they were
    // the same page.
    const seen = new Map<string, string>()
    for (const category of BEST_CATEGORIES) {
      await visit(page, `/best/${category.slug}`)
      const description =
        (await read(() => page.locator('meta[name="description"]').getAttribute('content'))) ?? ''
      expect(description.length, `/best/${category.slug} needs a description`).toBeGreaterThan(60)
      const previous = seen.get(description)
      expect(previous, `/best/${category.slug} shares a description with ${previous}`).toBeUndefined()
      seen.set(description, `/best/${category.slug}`)
    }
  })

  test('the home page description quotes the registry, not a typed count', async ({ page }) => {
    await visit(page, '/')
    const description =
      (await read(() => page.locator('meta[name="description"]').getAttribute('content'))) ?? ''
    expect(description).toContain(String(LEADERBOARD.models.length))
    expect(description).not.toContain('{n}')
  })

  test('every breadcrumb ends at the page it belongs to', async ({ page }) => {
    // A `BreadcrumbList` whose last item is not the page's own canonical
    // points the crawler at a different page. It is an easy mistake to make
    // and an invisible one in a diff, so it is checked.
    for (const path of SAMPLE_PAGES) {
      await visit(page, path)
      const canonical =
        (await read(() => page.locator('link[rel="canonical"]').getAttribute('href'))) ?? ''
      const trails = await read(() =>
        page.locator('script[type="application/ld+json"]').allTextContents(),
      )
      for (const trail of trails) {
        const payload = JSON.parse(trail) as {
          '@type'?: string
          itemListElement?: { item?: string }[]
        }
        if (payload['@type'] !== 'BreadcrumbList') continue
        const items = payload.itemListElement ?? []
        expect(items.length, `${path} has an empty breadcrumb`).toBeGreaterThan(0)
        const last = items[items.length - 1]?.item
        expect(last, `${path} has a breadcrumb but no last item`).toBeTruthy()
        expect(
          new URL(last!).pathname,
          `${path} has a breadcrumb that ends somewhere else`,
        ).toBe(new URL(canonical).pathname)
      }
    }
  })

  /**
   * The one line a search result shows. Three properties must hold on every
   * page: the brand appears exactly once (the templates used to add it
   * inconsistently — four vendor pages had it, four did not), the title fits
   * the 60-character budget, and the description fits 160.
   */
  test('every sampled title and description fit the SERP budget', async ({ page }) => {
    for (const path of SAMPLE_PAGES) {
      await visit(page, path)
      const title = (await read(() => page.title())).trim()
      const brandCount = title.match(/EvalLedger/g)?.length ?? 0
      expect(brandCount, `${path} title brand count: ${title}`).toBe(1)
      expect(title.endsWith('EvalLedger'), `${path} title must end with the brand: ${title}`).toBe(
        true,
      )
      expect(title.length, `${path} title is ${title.length} chars: ${title}`).toBeLessThanOrEqual(
        60,
      )

      const description = await read(() =>
        page.locator('meta[name="description"]').getAttribute('content'),
      )
      expect(description, `${path} has no meta description`).toBeTruthy()
      expect(
        description!.length,
        `${path} description is ${description!.length} chars`,
      ).toBeLessThanOrEqual(160)
    }
  })

  test('no sampled page prints a benchmark name twice with its version', async ({ page }) => {
    // Every versioned benchmark's display name already carries its version
    // ("DeepSWE v1.1", "Terminal-Bench 4.0"). A page that appends the
    // `version` field unconditionally reads "DeepSWE v1.1 1.1" — exactly the
    // regression this audit fixed on `/methodology` and the board tables.
    const versioned = BENCHMARKS.filter(
      (benchmark) => benchmark.version && benchmark.name.includes(benchmark.version),
    )
    expect(versioned.length, 'expected versioned benchmarks in the registry').toBeGreaterThan(0)

    for (const path of [
      ...SAMPLE_PAGES,
      '/methodology',
      '/zh/methodology',
      '/leaderboard/coding',
      '/models/claude-opus-5.5',
    ]) {
      await visit(page, path)
      const text = (await read(() => page.locator('body').innerText())) ?? ''
      for (const benchmark of versioned) {
        expect(
          text,
          `${path} prints "${benchmark.name} ${benchmark.version}"`,
        ).not.toContain(`${benchmark.name} ${benchmark.version}`)
      }
    }
  })
})

test.describe('legacy URLs', () => {
  test('/token-calculator answers with a 301 and keeps the ?model deep link', async ({ page }) => {
    // The calculator's historical address is a permanent alias. A 307 tells
    // a crawler the move is temporary, so the old URL keeps competing.
    const response = await page.request.get('/token-calculator?model=gpt-6-astra', {
      maxRedirects: 0,
    })
    expect(response.status()).toBe(301)
    const location = new URL(response.headers()['location']!, response.url())
    expect(location.pathname).toBe('/token-cost-calculator')
    expect(location.searchParams.get('model')).toBe('gpt-6-astra')
  })

  test('/en and /en/* answer with a 301 to the unprefixed canonical URL', async ({ page }) => {
    for (const [path, expected] of [
      ['/en', '/'],
      // The edge collapses the slashed alias in the same hop — no 308 → 301 chain.
      ['/en/', '/'],
      ['/en/token-cost-calculator', '/token-cost-calculator'],
      ['/en/token-calculator?model=gpt-6-astra', '/token-cost-calculator?model=gpt-6-astra'],
      ['/en/compare?x=1', '/compare?x=1'],
    ] as const) {
      const response = await page.request.get(path, { maxRedirects: 0 })
      expect(response.status(), `${path} should be a permanent redirect`).toBe(301)
      const location = new URL(response.headers()['location']!, response.url())
      expect(location.pathname + location.search).toBe(expected)
    }
  })

  test('the calculator alias is a redirect, not a second indexed copy of the page', async ({
    page,
  }) => {
    // The alias must be invisible to a crawler in three separate ways, and a
    // regression in any one of them is silent: the redirect (tested above),
    // the sitemap (a sitemap is a list of addresses to index, a redirect is
    // not one), and the <link rel="canonical"> the *canonical* page emits —
    // it must name the address the redirect lands on, never the alias.
    for (const [alias, canonical] of [
      ['/token-calculator', '/token-cost-calculator'],
      ['/zh/token-calculator', '/zh/token-cost-calculator'],
    ] as const) {
      const response = await page.request.get(alias, { maxRedirects: 0 })
      expect(response.status(), `${alias} should be a 301`).toBe(301)
      const target = new URL(response.headers()['location']!, response.url())
      expect(target.pathname).toBe(canonical)

      // The target is reachable in one hop and canonicalizes to itself.
      const landed = await visit(page, canonical)
      expect(landed?.status()).toBe(200)
      const href =
        (await read(() => page.locator('link[rel="canonical"]').getAttribute('href'))) ?? ''
      expect(new URL(href).pathname, `${canonical} must canonicalize to itself`).toBe(canonical)

      for (const sitemap of ['/sitemap.xml', '/sitemap-core.xml', '/sitemap-full.xml']) {
        const xml = await (await page.request.get(sitemap)).text()
        const paths = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
          new URL(match[1]).pathname,
        )
        expect(paths, `${sitemap} must not list the alias ${alias}`).not.toContain(alias)
        expect(paths, `${sitemap} must list the canonical ${canonical}`).toContain(canonical)
      }
    }
  })

  test('a trailing slash answers with a permanent 308 to the canonical path', async ({ page }) => {
    // A slashed alias is a path change, so the edge answers it with a 301 in
    // one hop rather than a 308 that still needs the alias redirect.
    const alias = await page.request.get('/token-calculator/?model=gpt-6-astra', {
      maxRedirects: 0,
    })
    expect(alias.status(), 'a slashed alias should be a 301').toBe(301)
    expect(new URL(alias.headers()['location']!, alias.url()).pathname).toBe(
      '/token-cost-calculator',
    )

    // Same page, two addresses: the slashed form must not answer 307 and
    // leave the duplicate address in contention.
    for (const [path, expected] of [
      ['/models/claude-opus-5.5/', '/models/claude-opus-5.5'],
      ['/zh/', '/zh'],
      ['/sitemap.xml/', '/sitemap.xml'],
    ] as const) {
      const response = await page.request.get(path, { maxRedirects: 0 })
      expect(response.status(), `${path} should be a permanent redirect`).toBe(308)
      const location = new URL(response.headers()['location']!, response.url())
      expect(location.pathname + location.search).toBe(expected)
    }
  })
})
