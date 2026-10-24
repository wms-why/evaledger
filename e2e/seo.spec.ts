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
  '/releases',
  '/zh/releases',
  RELEASE_SLUGS[0] ? `/releases/${RELEASE_SLUGS[0]}` : '/releases',
  MODEL_ROUTES[0]?.path ?? '/',
  COMPARE_PAIR_ROUTES[0]?.path ?? '/compare',
  // A series *line*, not the index — the index is already sampled above.
  SERIES_ROUTES.find((route) => route.path !== '/series')?.path ?? '/series',
  '/token-cost-calculator',
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
    // The core list is short — that is the whole point of the split. It grew
    // by exactly the four new per-provider pricing landings (Gemini, Grok,
    // MiniMax, Kimi): a pricing page carries the vendor name people actually
    // type, so it is the one long-tail family that earns a place here. The
    // node-side caps live in `sitemap-core.node.test.ts` (26 en / 12 zh).
    expect(parsed.locs.length, 'the core sitemap must stay short').toBeLessThanOrEqual(37)
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
})
