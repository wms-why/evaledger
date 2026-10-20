import { expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'
import type { Locator, Page } from '@playwright/test'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { COMPARE_PAIR_ENTRIES, formatScore, scoreOf } from '@/features/leaderboard/leaderboard'
import { findLeaderboardModel } from '@/features/leaderboard/models'

/**
 * The comparison surface: `/compare` (the interactive tool) and
 * `/compare/$pair` (the hand-picked pairs). Names, scores and prices are read
 * from the registries the page itself reads, so a price that moves shows up
 * here as a failing expectation instead of as a stale table.
 */

/** The line-up `/compare` starts with; a third model proves it is not a pair. */
const DEFAULT_IDS = ['claude-opus-5', 'gpt-5.6-sol']
const THIRD_ID = 'gemini-3.1-pro'

/** Display name of a leaderboard row — the name the page prints. */
function nameOf(id: string): string {
  const model = findLeaderboardModel(id)
  if (!model) throw new Error(`unknown leaderboard model: ${id}`)
  return model.displayName
}

/** Read the DOM, tolerating a dev-server reload that lands mid-read. */
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

/** The comparison matrix — the table whose first column is the dimension. */
function matrix(page: Page, locale: 'en' | 'zh' = 'en'): Locator {
  return page
    .getByRole('columnheader', { name: t(locale, 'leaderboard.compare.dimension'), exact: true })
    .locator('xpath=ancestor::table')
}

/** The column headers of the comparison matrix, dimension column included. */
async function matrixHeaders(page: Page, locale: 'en' | 'zh' = 'en'): Promise<string[]> {
  return read(async () =>
    (await matrix(page, locale).getByRole('columnheader').allTextContents()).map((t) => t.trim()),
  )
}

/** The cells of the matrix row whose first cell is `dimension`. */
async function rowCells(table: Locator, dimension: string): Promise<string[]> {
  return read(async () => {
    for (const row of await table.locator('tbody tr').all()) {
      const cells = (await row.locator('td').allTextContents()).map((text) => text.trim())
      if (cells[0] === dimension) return cells
    }
    return []
  })
}

/**
 * Wait until React has hydrated the page: the server-rendered markup is there
 * long before the event handlers are, so a click in between hits dead markup
 * and the popover never opens. React attaches its root fiber to the container
 * when it hydrates — that is the signal we wait for.
 */
async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => Object.keys(document.body).some((key) => key.startsWith('__reactFiber$')),
    undefined,
    { timeout: 20_000 },
  )
}

/** Add a model to the line-up through the picker. */
async function addModel(page: Page, id: string): Promise<void> {
  await page.getByRole('button', { name: t('en', 'leaderboard.compare.addModel') }).click({
    timeout: 8_000,
  })
  const search = page.getByRole('combobox')
  await search.waitFor({ state: 'visible', timeout: 8_000 })
  await search.fill(id)
  const option = page.getByRole('option')
  await expect(option).toHaveCount(1, { timeout: 8_000 })
  await option.click({ timeout: 8_000 })
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

test.describe('the interactive comparison tool', () => {
  test('renders the tool with the default line-up', async ({ page, consoleErrors, pageErrors }) => {
    const response = await visit(page, '/compare')
    expect(response?.status()).toBe(200)

    const selected = page.getByRole('region', { name: t('en', 'leaderboard.compare.selectedModels') })
    await expect(selected).toBeVisible()
    await expect(page.getByRole('heading', { name: t('en', 'leaderboard.compare.costTitle') })).toBeVisible()

    expect(await matrixHeaders(page)).toEqual([
      t('en', 'leaderboard.compare.dimension'),
      nameOf(DEFAULT_IDS[0]),
      nameOf(DEFAULT_IDS[1]),
    ])

    expect(pageErrors).toEqual([])
    expect(ownErrors(consoleErrors)).toEqual([])
  })

  test('picking a model updates the comparison', async ({ page, consoleErrors, pageErrors }) => {
    // The dev server occasionally reloads the page mid-flow, so the whole
    // flow is retried from a clean page.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await visit(page, '/compare')
      await waitForHydration(page)
      try {
        // Add a third model through the picker…
        await addModel(page, THIRD_ID)
        // …and drop one of the defaults: the line-up is now the two we picked.
        const remove = page.getByRole('button', { name: t('en', 'leaderboard.compare.removeModel', { model: nameOf(DEFAULT_IDS[0]) }) })
        await remove.click({ timeout: 8_000 })
        break
      } catch {
        // Try again from a clean page.
      }
    }

    expect(await matrixHeaders(page)).toEqual([
      t('en', 'leaderboard.compare.dimension'),
      nameOf(DEFAULT_IDS[1]),
      nameOf(THIRD_ID),
    ])
    expect(new URL(page.url()).searchParams.get('models')).toBe(`${DEFAULT_IDS[1]},${THIRD_ID}`)

    expect(pageErrors).toEqual([])
    expect(ownErrors(consoleErrors)).toEqual([])
  })

  test('the models query param carries more than two models', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, `/compare?models=${DEFAULT_IDS[0]},${DEFAULT_IDS[1]},${THIRD_ID}`)

    expect(await matrixHeaders(page)).toEqual([
      t('en', 'leaderboard.compare.dimension'),
      nameOf(DEFAULT_IDS[0]),
      nameOf(DEFAULT_IDS[1]),
      nameOf(THIRD_ID),
    ])
    const removeThird = page.getByRole('button', { name: t('en', 'leaderboard.compare.removeModel', { model: nameOf(THIRD_ID) }) })
    await expect(removeThird).toBeVisible()
    await expect(page.getByText(t('en', 'leaderboard.compare.modelCount', { count: 3, max: 5 }))).toBeVisible()

    expect(pageErrors).toEqual([])
    expect(ownErrors(consoleErrors)).toEqual([])
  })
})

/** One representative pair per hero kind — the two shapes the pairs come in. */
const REPRESENTATIVE_PAIRS = (['technical', 'plan'] as const).map((kind) => {
  const entry = COMPARE_PAIR_ENTRIES.find((pair) => pair.kind === kind)
  if (!entry) throw new Error(`no compare pair of kind ${kind}`)
  return entry
})

test.describe('the hand-picked compare pairs', () => {
  for (const pair of REPRESENTATIVE_PAIRS) {
    test(`${pair.slug} shows both models, their scores and the cost calculator`, async ({ page, consoleErrors, pageErrors }) => {
      const response = await visit(page, `/compare/${pair.slug}`)
      expect(response?.status()).toBe(200)

      const a = findLeaderboardModel(pair.a)!
      const b = findLeaderboardModel(pair.b)!
      const headers = await matrixHeaders(page)
      expect(headers, `${pair.slug} should list both models`).toContain(a.displayName)
      expect(headers, `${pair.slug} should list both models`).toContain(b.displayName)

      // A benchmark both models report shows one score per model.
      const shared = BENCHMARKS.find((bm) => scoreOf(a, bm.id) && scoreOf(b, bm.id))
      expect(shared, `${pair.slug} should share a benchmark`).toBeTruthy()
      const cells = await rowCells(matrix(page), shared!.name)
      const sa = scoreOf(a, shared!.id)!
      const sb = scoreOf(b, shared!.id)!
      expect(cells[0]).toBe(shared!.name)
      expect(cells[1]).toBe(formatScore(sa.score, sa.unit))
      expect(cells[2]).toBe(formatScore(sb.score, sb.unit))

      // The cost quick-calc prices both models.
      const cost = page
        .getByRole('heading', { name: t('en', 'leaderboard.compare.costTitle') })
        .locator('xpath=ancestor::section[1]')
      await expect(cost).toContainText(a.displayName)
      await expect(cost).toContainText(b.displayName)

      expect(pageErrors).toEqual([])
      expect(ownErrors(consoleErrors)).toEqual([])
    })
  }

  test('the Chinese version of a pair renders the same two models', async ({ page, consoleErrors, pageErrors }) => {
    const pair = REPRESENTATIVE_PAIRS[0]
    const response = await visit(page, `/zh/compare/${pair.slug}`)
    expect(response?.status()).toBe(200)

    const headers = await matrixHeaders(page, 'zh')
    expect(headers).toContain(nameOf(pair.a))
    expect(headers).toContain(nameOf(pair.b))
    await expect(page.getByRole('heading', { name: t('zh', 'leaderboard.compare.costTitle') })).toBeVisible()

    expect(pageErrors).toEqual([])
    expect(ownErrors(consoleErrors)).toEqual([])
  })
})
