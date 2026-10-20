import { expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'
import type { Locator, Page } from '@playwright/test'
import { SERIES } from '@/features/series/series'
import { pairVerdict, seriesRows } from '@/features/series/data'
import { findSeries, seriesPairs } from '@/features/series/select'
import { formatPrice } from '@/features/leaderboard/components/PriceCell'

/**
 * The version-series surface: `/series` (every line), `/series/$slug` (one
 * line, newest version first) and `/series/$slug/$pair` (two versions of the
 * same line, head to head).
 *
 * The expected numbers come from the same registries the page reads, so a
 * price that moves without the page moving shows up here.
 */

/** The line the detail tests use — the longest one in the registry. */
const SERIES_SLUG = 'claude-opus'

/** The version ladder — the table whose first column is the version. */
function ladder(page: Page, locale: 'en' | 'zh' = 'en'): Locator {
  return page
    .getByRole('columnheader', { name: t(locale, 'series.colVersion'), exact: true })
    .locator('xpath=ancestor::table')
}

/** The text of every row of a table, one string per row. */
async function rowTexts(table: Locator): Promise<string[]> {
  return read(async () =>
    (await table.locator('tbody tr').allTextContents()).map((text) =>
      text.replace(/\s+/g, ' ').trim(),
    ),
  )
}

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

test.describe('the series index', () => {
  test('lists every series in the registry', async ({ page, consoleErrors, pageErrors }) => {
    const response = await visit(page, '/series')
    expect(response?.status()).toBe(200)

    const cards = page.getByRole('heading', { level: 3 })
    await expect(cards).toHaveCount(SERIES.length)

    for (const series of [SERIES[0], SERIES[3], SERIES[SERIES.length - 1]]) {
      const heading = page.getByRole('heading', { name: series.name, level: 3, exact: true })
      await expect(heading).toBeVisible()
      // The card wraps the heading: the link is the card itself.
      const card = page.getByRole('link').filter({ has: heading })
      await expect(card).toHaveAttribute('href', `/series/${series.slug}`)
    }

    expect(pageErrors).toEqual([])
    expect(ownErrors(consoleErrors)).toEqual([])
  })
})

test.describe('one product line', () => {
  test('lists the versions newest-first with the registry prices', async ({ page, consoleErrors, pageErrors }) => {
    const series = findSeries(SERIES_SLUG)!
    const rows = seriesRows(series)

    const response = await visit(page, `/series/${SERIES_SLUG}`)
    expect(response?.status()).toBe(200)

    const table = ladder(page)
    await expect(table.locator('tbody tr')).toHaveCount(series.members.length)

    const texts = await rowTexts(table)
    // Newest first: the registry order is the order the page must print.
    for (const [index, row] of rows.entries()) {
      expect(texts[index], `${series.slug} row ${index}`).toContain(row.displayName)
      expect(texts[index], `${series.slug} row ${index}`).toContain(row.version)
      if (row.inputPricePer1M != null) {
        expect(texts[index]).toContain(formatPrice(row.inputPricePer1M))
      }
      if (row.outputPricePer1M != null) {
        expect(texts[index]).toContain(formatPrice(row.outputPricePer1M))
      }
    }

    expect(pageErrors).toEqual([])
    expect(ownErrors(consoleErrors)).toEqual([])
  })

  test('links to every pair of versions', async ({ page, consoleErrors, pageErrors }) => {
    const series = findSeries(SERIES_SLUG)!
    const pairs = seriesPairs(series)
    const rows = seriesRows(series)

    await visit(page, `/series/${SERIES_SLUG}`)

    const links = page.getByRole('link', { name: / vs / })
    await expect(links).toHaveCount(pairs.length)

    for (const pair of pairs) {
      const a = rows.find((row) => row.key === pair.a.key)!
      const b = rows.find((row) => row.key === pair.b.key)!
      await expect(
        page.getByRole('link', { name: `${a.displayName} vs ${b.displayName}`, exact: true }),
      ).toHaveAttribute('href', `/series/${SERIES_SLUG}/${pair.slug}`)
    }

    expect(pageErrors).toEqual([])
    expect(ownErrors(consoleErrors)).toEqual([])
  })
})

test.describe('two versions of one line', () => {
  test('shows both versions, the score delta and the verdict', async ({ page, consoleErrors, pageErrors }) => {
    const series = findSeries(SERIES_SLUG)!
    const rows = seriesRows(series)
    const pair = seriesPairs(series)[0]
    const a = rows.find((row) => row.key === pair.a.key)!
    const b = rows.find((row) => row.key === pair.b.key)!

    const response = await visit(page, `/series/${SERIES_SLUG}/${pair.slug}`)
    expect(response?.status()).toBe(200)

    await expect(
      page.getByRole('heading', { level: 1, name: t('en', 'series.pairTitle', { a: a.displayName, b: b.displayName }) }),
    ).toBeVisible()

    // The ladder holds exactly the two versions, newest first.
    const table = ladder(page)
    await expect(table.locator('tbody tr')).toHaveCount(2)
    const texts = await rowTexts(table)
    expect(texts[0]).toContain(a.displayName)
    expect(texts[1]).toContain(b.displayName)

    // The verdict names the two versions and the score difference.
    const verdict = pairVerdict(a, b)
    const meaningful = verdict.scoreDeltas.filter((delta) => delta.delta !== 0)
    expect(meaningful.length, 'the two versions should share a score').toBeGreaterThan(0)
    const top = [...meaningful].sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))[0]
    const sentence = t(
      'en',
      top.delta > 0 ? 'series.verdictScoreHigher' : 'series.verdictScoreLower',
      {
        newer: verdict.newer.displayName,
        older: verdict.older.displayName,
        points: Math.abs(Math.round(top.delta)),
        benchmark: top.benchmarkName,
      },
    )
    await expect(page.getByText(sentence)).toBeVisible()
    await expect(
      page.getByRole('heading', { name: t('en', 'series.verdictTitle') }),
    ).toBeVisible()

    expect(pageErrors).toEqual([])
    expect(ownErrors(consoleErrors)).toEqual([])
  })

  test('a pair from another line is a 404', async ({ page, consoleErrors, pageErrors }) => {
    // `gpt-6-astra` is not a version of the Claude Opus line.
    const response = await visit(page, `/series/${SERIES_SLUG}/opus-5.5-vs-gpt-6-astra`)
    expect(response?.status()).toBe(404)

    // The document itself answers 404, so the browser logs the failed
    // resource — that is the expected outcome here, not a page defect.
    const noise = ownErrors(consoleErrors).filter((error) => !/status of 404/.test(error))
    expect(pageErrors).toEqual([])
    expect(noise).toEqual([])
  })
})
