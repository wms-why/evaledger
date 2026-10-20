import { expect, h1Of, realConsoleErrors, test, titleOf, visit } from './helpers/fixtures'
import { ALL_PAGE_ROUTES, ENDPOINT_ROUTES, localePath } from './helpers/routes'

/**
 * The smoke sweep: every page of the site renders, in every locale.
 *
 * This is the spec that catches the classic "the page 404s / throws / loses
 * its headline" regressions. It is generated from the route inventory, so a
 * newly shipped model, benchmark, series or release post is covered without
 * touching this file.
 */
test.describe('every public page renders', () => {
  for (const route of ALL_PAGE_ROUTES) {
    test(`${route.group}: ${route.name} → ${route.path}`, async ({
      page,
      consoleErrors,
      pageErrors,
    }) => {
      const response = await visit(page, route.path)

      expect(response, `${route.path} should answer with a response`).not.toBeNull()
      expect(response?.status(), `${route.path} should be 200`).toBe(200)

      const h1 = await h1Of(page)
      expect(h1.length, `${route.path} should render a non-empty <h1>`).toBeGreaterThan(0)

      const title = await titleOf(page)
      expect(title.length, `${route.path} should carry a <title>`).toBeGreaterThan(0)

      expect(pageErrors, `${route.path} should not throw`).toEqual([])
      expect(realConsoleErrors(consoleErrors), `${route.path} should not log errors`).toEqual([])
    })
  }
})

/**
 * The same sweep in Chinese.
 *
 * A locale prefix is not a mirror of the English page: it runs its own
 * dictionary, its own loaders and its own set of links, so a page can be
 * green in English and 404 in Chinese.
 */
test.describe('every public page renders in Chinese', () => {
  for (const route of ALL_PAGE_ROUTES) {
    test(`${route.group}: ${route.name} → ${localePath(route.path, 'zh')}`, async ({
      page,
      consoleErrors,
      pageErrors,
    }) => {
      const path = localePath(route.path, 'zh')
      const response = await visit(page, path)

      expect(response, `${path} should answer with a response`).not.toBeNull()
      expect(response?.status(), `${path} should be 200`).toBe(200)

      const h1 = await h1Of(page)
      expect(h1.length, `${path} should render a non-empty <h1>`).toBeGreaterThan(0)

      const title = await titleOf(page)
      expect(title.length, `${path} should carry a <title>`).toBeGreaterThan(0)

      expect(pageErrors, `${path} should not throw`).toEqual([])
      expect(realConsoleErrors(consoleErrors), `${path} should not log errors`).toEqual([])
    })
  }
})

test.describe('machine-readable endpoints', () => {
  for (const route of ENDPOINT_ROUTES) {
    test(`${route.name} → ${route.path}`, async ({ page }) => {
      const response = await page.request.get(route.path)
      expect(response.status(), `${route.path} should be 200`).toBe(200)
      const body = await response.text()
      expect(body.length, `${route.path} should not be empty`).toBeGreaterThan(0)
    })
  }
})
