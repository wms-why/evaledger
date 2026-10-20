import { expect, h1Of, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'
import type { Locator, Page } from '@playwright/test'

/**
 * The public shell: landing page, header nav, theme toggle, language switch,
 * footer, and the three utility pages (changelog / sponsor / waitlist).
 *
 * Every string is read from the i18n dictionaries, so a copy change shows up
 * here as a failing expectation instead of a silently stale assertion.
 */

/** The header surfaces, and the path each nav link must point at. */
const NAV_TARGETS = [
  { label: t('en', 'leaderboard.navBoard'), href: '/' },
  { label: t('en', 'leaderboard.navCompare'), href: '/compare' },
  { label: t('en', 'leaderboard.navCalculator'), href: '/token-calculator' },
  { label: t('en', 'releases.nav'), href: '/releases' },
  { label: t('en', 'series.nav'), href: '/series' },
  { label: t('en', 'marketing.navChangelog'), href: '/changelog' },
] as const

/** The footer's internal links. */
const FOOTER_TARGETS = [
  { label: t('en', 'leaderboard.navBoard'), href: '/' },
  { label: t('en', 'leaderboard.navCompare'), href: '/compare' },
  { label: t('en', 'marketing.footerProductToken'), href: '/token-cost-calculator' },
  { label: t('en', 'releases.nav'), href: '/releases' },
  { label: t('en', 'marketing.footerChangelog'), href: '/changelog' },
  { label: t('en', 'marketing.footerTerms'), href: '/terms' },
  { label: t('en', 'marketing.footerPrivacy'), href: '/privacy' },
] as const

/** The "Browse" block at the bottom of the landing page. */
const BROWSE_TARGETS = [
  { label: t('en', 'leaderboard.navCalculator'), href: '/token-calculator' },
  { label: t('en', 'releases.nav'), href: '/releases' },
  { label: t('en', 'leaderboard.navHistory'), href: '/leaderboard-history' },
  { label: t('en', 'leaderboard.navBenchmarks'), href: '/benchmarks/gpqa-diamond' },
  { label: t('en', 'leaderboard.navBest'), href: '/best/for-coding' },
] as const

/** A page that threw or logged an error is broken, even when it rendered. */
function expectNoErrors(pageErrors: string[], consoleErrors: string[]): void {
  expect(pageErrors, 'the page should not throw').toEqual([])
  expect(realConsoleErrors(consoleErrors), 'the page should not log errors').toEqual([])
}

/** Every link in `scope` must point at its expected path. */
async function expectLinks(
  scope: Locator,
  targets: readonly { label: string; href: string }[],
): Promise<void> {
  for (const { label, href } of targets) {
    await expect(scope.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', href)
  }
}

/**
 * Every path must answer — a link to a 404 is still a broken link.
 *
 * A dev server under load can answer 5xx/429, so those are retried; a 404 is
 * a real answer and fails the test.
 */
async function expectLive(page: Page, paths: readonly string[]): Promise<void> {
  for (const path of paths) {
    let status = 0
    for (let attempt = 0; attempt < 3 && status !== 200; attempt++) {
      status = (await page.request.get(path)).status()
      if (status !== 200 && status !== 404) await page.waitForTimeout(250)
    }
    expect(status, `${path} should be a live route`).toBe(200)
  }
}

/**
 * Wait until the client app has booted.
 *
 * The dev server compiles the browser bundle on demand, so a page can still be
 * a static HTML shell when the first interaction lands: the click then reaches
 * no handler, and a filled input is wiped by the hydration that follows. The
 * client router only exists once the bundle has booted.
 */
async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => Boolean((window as { __TSR_ROUTER__?: unknown }).__TSR_ROUTER__),
    undefined,
    { timeout: 15_000 },
  )
}

/**
 * Click something and let the click be retried until it lands.
 *
 * The dev server re-bundles its dependencies while the suite is running, and a
 * re-bundle forces a full page reload — a click that lands in that window
 * reaches a page that is not interactive yet and is simply lost.
 */
async function clickUntil(locator: Locator, done: () => Promise<void>): Promise<void> {
  await expect(async () => {
    await locator.click()
    await done()
  }).toPass({ timeout: 20_000 })
}

test.describe('landing page', () => {
  test('renders the headline and the leaderboard table', async ({ page, consoleErrors, pageErrors }) => {
    const response = await visit(page, '/')
    expect(response?.status(), '/ should answer 200').toBe(200)

    // The landing page opens with the leaderboard headline — the marketing
    // hero copy lives on the calculator landings, not here.
    expect(await h1Of(page)).toBe(t('en', 'leaderboard.home.h1'))

    const table = page.getByRole('table')
    await expect(table).toBeVisible()
    await expect(table.getByRole('columnheader', { name: t('en', 'leaderboard.colModel') })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: t('en', 'leaderboard.colAverage') })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: t('en', 'leaderboard.colPrice') })).toBeVisible()

    // the rows carry a link to each model's own page
    const rows = table.locator('tbody tr')
    expect(await rows.count(), 'the leaderboard should list models').toBeGreaterThan(1)
    await expect(rows.first().getByRole('link').first()).toHaveAttribute('href', /^\/models\//)

    expectNoErrors(pageErrors, consoleErrors)
  })

  test('the compare, releases and browse links point at real routes', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/')
    const main = page.locator('main')

    // the compare call to action and the releases block
    await expect(main.getByRole('link', { name: t('en', 'leaderboard.home.compareCta') })).toHaveAttribute(
      'href',
      '/compare',
    )
    await expect(main.getByRole('link', { name: t('en', 'releases.backToIndex') })).toHaveAttribute(
      'href',
      '/releases',
    )

    // the browse block
    const browse = main
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: t('en', 'leaderboard.home.browse'), exact: true }) })
    await expect(browse).toHaveCount(1)
    await expectLinks(browse, BROWSE_TARGETS)
    await expectLive(page, BROWSE_TARGETS.map((target) => target.href))

    expectNoErrors(pageErrors, consoleErrors)
  })
})

test.describe('header nav', () => {
  test('every nav link points at a live route', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/')
    const header = page.locator('header')

    await expectLinks(header, NAV_TARGETS)
    await expectLive(page, NAV_TARGETS.map((target) => target.href))

    expectNoErrors(pageErrors, consoleErrors)
  })

  test('the current page is marked with aria-current', async ({ page, consoleErrors, pageErrors }) => {
    // the landing page marks the home item, the changelog marks its own
    for (const [path, current] of [
      ['/', t('en', 'leaderboard.navBoard')],
      ['/changelog', t('en', 'marketing.navChangelog')],
    ] as const) {
      await visit(page, path)
      const header = page.locator('header')
      for (const { label } of NAV_TARGETS) {
        const marked = await header.getByRole('link', { name: label, exact: true }).getAttribute('aria-current')
        if (label === current) {
          expect(marked, `${path} should mark ${label} as current`).toBe('page')
        } else {
          expect(marked, `${path} should not mark ${label} as current`).not.toBe('page')
        }
      }
    }

    expectNoErrors(pageErrors, consoleErrors)
  })

  test('the nav works in Chinese', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/zh')
    expect(await h1Of(page)).toBe(t('zh', 'leaderboard.home.h1'))

    const header = page.locator('header')
    await expectLinks(header, [
      { label: t('zh', 'leaderboard.navBoard'), href: '/zh' },
      { label: t('zh', 'leaderboard.navCompare'), href: '/zh/compare' },
      { label: t('zh', 'leaderboard.navCalculator'), href: '/zh/token-calculator' },
      { label: t('zh', 'releases.nav'), href: '/zh/releases' },
      { label: t('zh', 'series.nav'), href: '/zh/series' },
      { label: t('zh', 'marketing.navChangelog'), href: '/zh/changelog' },
    ])
    await expect(header.getByRole('link', { name: t('zh', 'leaderboard.navBoard'), exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )

    expectNoErrors(pageErrors, consoleErrors)
  })
})

test.describe('theme toggle', () => {
  // A dark-OS visitor is the "default" the app ships (the SSR fallback and
  // the boot script both resolve to dark when nothing else says otherwise).
  test.use({ colorScheme: 'dark' })

  test('flips the html class and keeps it after a reload', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/')
    await waitForHydration(page)
    const html = page.locator('html')
    await expect(html).toHaveClass(/\bdark\b/)
    await expect(html).not.toHaveClass(/\blight\b/)

    // the header and the footer each carry a toggle — the header one is first
    await clickUntil(page.getByRole('button', { name: t('en', 'common.toggleTheme') }).first(), async () => {
      await expect(html).toHaveClass(/\blight\b/, { timeout: 2_000 })
      await expect(html).not.toHaveClass(/\bdark\b/, { timeout: 2_000 })
    })

    // the choice is persisted (a cookie), so it survives a reload
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(html).toHaveClass(/\blight\b/)
    await expect(html).not.toHaveClass(/\bdark\b/)

    expectNoErrors(pageErrors, consoleErrors)
  })
})

test.describe('language switch', () => {
  test('switching to 中文 lands on the zh counterpart of the page', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/changelog')
    await waitForHydration(page)
    await clickUntil(page.getByRole('button', { name: t('en', 'common.language') }).first(), async () => {
      await page.waitForURL('**/zh/changelog', { timeout: 2_000 })
    })

    expect(new URL(page.url()).pathname).toBe('/zh/changelog')
    // the copy switches with the route
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(t('zh', 'changelog.title'))
    await expect(page.getByText(t('zh', 'changelog.subtitle'))).toBeVisible()

    expectNoErrors(pageErrors, consoleErrors)
  })
})

test.describe('footer', () => {
  test('renders and its links are real routes', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/')
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer.getByText(t('en', 'marketing.footerTagline'))).toBeVisible()

    await expectLinks(footer, FOOTER_TARGETS)
    await expectLive(page, FOOTER_TARGETS.map((target) => target.href))

    // The two off-site links stay off-site. Their brand handles are hardcoded
    // in the component (not copy), so only the shape of the URL is asserted —
    // a rebrand may change the handle, and a wrong handle is not a broken
    // route.
    const twitter = footer.getByRole('link', { name: t('en', 'marketing.footerTwitter') })
    await expect(twitter).toHaveAttribute('href', /^https:\/\/x\.com\/[A-Za-z0-9_]+$/)
    await expect(twitter).toHaveAttribute('target', '_blank')
    await expect(footer.getByRole('link', { name: t('en', 'marketing.footerContact') })).toHaveAttribute(
      'href',
      /^mailto:[^\s@]+@[^\s@]+$/,
    )

    expectNoErrors(pageErrors, consoleErrors)
  })
})

test.describe('utility pages', () => {
  test('/changelog renders its heading and at least one entry', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/changelog')
    expect(await h1Of(page)).toBe(t('en', 'changelog.title'))
    await expect(page.getByText(t('en', 'changelog.subtitle'))).toBeVisible()
    expect(await page.getByRole('heading', { level: 3 }).count(), 'the changelog should list entries').toBeGreaterThan(0)
    expectNoErrors(pageErrors, consoleErrors)
  })

  test('/sponsor renders its heading and the sponsorship form', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/sponsor')
    expect((await h1Of(page)).replace(/\s+/g, ' ')).toBe(t('en', 'sponsor.title'))
    await expect(page.getByText(t('en', 'sponsor.subtitle'))).toBeVisible()
    await expect(page.getByRole('heading', { name: t('en', 'sponsor.wallTitle') })).toBeVisible()

    // The payment form only exists when Stripe is configured; without it the
    // page degrades to a notice instead of a broken form.
    const formTitle = page.getByRole('heading', { name: t('en', 'sponsor.formTitle') })
    if ((await formTitle.count()) > 0) {
      await expect(page.getByPlaceholder(t('en', 'sponsor.githubPlaceholder'))).toBeVisible()
    } else {
      await expect(page.getByText(t('en', 'sponsor.notConfigured'))).toBeVisible()
    }

    expectNoErrors(pageErrors, consoleErrors)
  })

  test('/waitlist renders its heading and the email field', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/waitlist')
    expect(await h1Of(page)).toBe(t('en', 'waitlist.title'))
    await expect(page.getByText(t('en', 'waitlist.subtitle'))).toBeVisible()
    await expect(page.getByLabel(t('en', 'waitlist.emailLabel'))).toBeVisible()
    await expect(page.getByRole('button', { name: t('en', 'waitlist.submit') })).toBeVisible()
    expectNoErrors(pageErrors, consoleErrors)
  })
})

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the Menu button opens the nav', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/')
    await waitForHydration(page)

    // the hamburger's label is a literal in the component, not a dictionary key
    const menu = page.getByRole('button', { name: 'Menu' })
    await expect(menu).toBeVisible()
    await expect(menu).toHaveAttribute('aria-expanded', 'false')

    await clickUntil(menu, async () => {
      await expect(menu).toHaveAttribute('aria-expanded', 'true', { timeout: 2_000 })
    })

    // the mobile menu is the only block element inside the header
    const mobileNav = page.locator('header > div')
    await expect(mobileNav).toBeVisible()
    const compare = mobileNav.getByRole('link', { name: t('en', 'leaderboard.navCompare'), exact: true })
    await expect(compare).toBeVisible()
    await expect(compare).toHaveAttribute('href', '/compare')

    expectNoErrors(pageErrors, consoleErrors)
  })
})
