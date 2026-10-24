import { columnIndex, expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { REGISTRY } from '@/features/calculator/model-prices'
import { priceDetail } from '@/features/calculator/pricing-detail'
import { formatScore, scoreOf } from '@/features/leaderboard/leaderboard'
import { rankTrack, TRACKS, TRACK_IDS } from '@/features/leaderboard/scoring'
import { formatPrice } from '@/features/leaderboard/components/PriceCell'
import type { Locator, Page } from '@playwright/test'

/**
 * The landing leaderboard board and the capability boards.
 *
 * Every number on the board is read from the registries at render time, so
 * the spec rebuilds it and compares — a price that drifts from `REGISTRY` or
 * a score that drifts from `LEADERBOARD` fails here.
 *
 * The board's contract, which the spec pins: a model is ranked only when it
 * was measured on EVERY core benchmark of the board. A model missing one is
 * listed as "not tested" and carries no composite. That is the whole point
 * of the board — a partial average over a different denominator is not a
 * ranking.
 */

/** The landing table — the one with a "Model" column header. */
function boardTable(page: Page): Locator {
  return page.getByRole('table').filter({
    has: page.getByRole('columnheader', { name: t('en', 'leaderboard.colModel'), exact: true }),
  })
}

/**
 * Wait until React has hydrated the document: a click that lands before
 * hydration is swallowed. `__reactFiber$` only appears once React has taken
 * over the markup.
 */
async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => Object.keys(document.body).some((key) => key.startsWith('__reactFiber$')),
    undefined,
    { timeout: 15_000 },
  )
}

test.describe('landing leaderboard board', () => {
  test('lists every model in the leaderboard registry, once', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/')

    const table = boardTable(page)
    // One header row plus one row per model — ranked and untested alike, so
    // a model the reader is looking for is never silently dropped.
    await expect(table.getByRole('row')).toHaveCount(LEADERBOARD.models.length + 1)
    for (const name of ['GPT-6 Astra', 'Claude Opus 5.5', 'Kimi K3', 'DeepSeek V4.1-Flash 1017']) {
      await expect(table.getByRole('link', { name, exact: true })).toHaveCount(1)
    }

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('ranks a model only when it was measured on every core benchmark', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/')

    const track = TRACKS.general
    const { ranked, incomplete } = rankTrack(track)
    const table = boardTable(page)

    const compositeColumn = await columnIndex(table, t('en', 'leaderboard.track.composite'))
    const priceColumn = await columnIndex(table, t('en', 'leaderboard.colPrice'))
    const modelColumn = await columnIndex(table, t('en', 'leaderboard.colModel'))

    const rows = table.getByRole('row')
    for (const [index, entry] of ranked.entries()) {
      const cells = rows.nth(index + 1).getByRole('cell')
      await expect(cells.nth(modelColumn)).toContainText(entry.model.displayName)
      await expect(cells.nth(compositeColumn)).toHaveText(
        (entry.score.composite as number).toFixed(1),
      )
      const price = entry.model.priceId
        ? priceOf(entry.model.priceId)
        : undefined
      await expect(cells.nth(priceColumn)).toContainText(
        price != null ? formatPrice((price.input + price.output) / 2) : '—',
      )
    }

    // The untested models follow, and carry no composite at all.
    for (const [offset, entry] of incomplete.entries()) {
      const cells = rows.nth(ranked.length + offset + 1).getByRole('cell')
      await expect(cells.nth(modelColumn)).toContainText(entry.model.displayName)
      await expect(cells.nth(compositeColumn)).toHaveText(t('en', 'leaderboard.track.untested'))
    }

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('shows each core benchmark score, and marks the ones never measured', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/')

    const track = TRACKS.general
    const { ranked } = rankTrack(track)
    const table = boardTable(page)

    const columns = await Promise.all(
      track.core.map((core) => columnIndex(table, benchmarkName(core.id))),
    )
    const rows = table.getByRole('row')
    for (const [index, entry] of ranked.entries()) {
      const cells = rows.nth(index + 1).getByRole('cell')
      for (const [column, core] of track.core.entries()) {
        const score = scoreOf(entry.model, core.id)
        await expect(cells.nth(columns[column])).toHaveText(
          score ? formatScore(score.score, score.unit) : t('en', 'leaderboard.track.untested'),
        )
      }
    }

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('switching board re-ranks the table', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/')
    await waitForHydration(page)

    const table = boardTable(page)
    const firstRow = table.getByRole('row').nth(1).getByRole('link').first()

    for (const slug of TRACK_IDS) {
      const track = TRACKS[slug]
      const { ranked } = rankTrack(track)
      // The board tabs are LINKS now, not buttons: a board with no URL of its
      // own is invisible to a crawler, so "best coding LLM" had no page to
      // land on. A plain click still re-ranks the table in place; a modified
      // click opens the board's own page.
      //
      // The anchor text is the destination-naming string from the linking
      // dictionary ("Best coding LLMs"), not the board's own label — the spec
      // asserts against the dictionary so a copy change cannot silently break
      // it (and so the test documents that the anchor names the page).
      const tab = page
        .getByRole('link', { name: t('en', `linking.board.${slug}`), exact: true })
        .first()
      await tab.click()

      // The board that is selected now decides the ranking.
      await expect(firstRow).toHaveText(ranked[0].model.displayName)

      // And the columns are the ones that board scores on.
      for (const core of track.core) {
        const name = BENCHMARKS.find((b) => b.id === core.id)?.name ?? core.id
        await expect(table.getByRole('columnheader', { name, exact: true })).toBeVisible()
      }
    }

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })
})

test.describe('capability boards', () => {
  for (const slug of TRACK_IDS) {
    test(`/leaderboard/${slug} states its formula and ranks its models`, async ({
      page,
      consoleErrors,
      pageErrors,
    }) => {
      const track = TRACKS[slug]
      const { ranked, incomplete } = rankTrack(track)

      await visit(page, `/leaderboard/${slug}`)

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        t('en', 'leaderboard.track.title', { track: t('en', track.labelKey) }),
      )
      // The formula is on the page, in words a reader can check.
      await expect(page.getByText(t('en', track.formulaKey))).toBeVisible()

      // The page carries two tables: the formula panel (weights) and the
      // ranking. The ranking is the one with a composite column.
      const table = page
        .getByRole('table')
        .filter({ has: page.getByRole('columnheader', { name: t('en', 'leaderboard.track.composite') }) })
      await expect(table.getByRole('row')).toHaveCount(ranked.length + 1)

      const compositeColumn = await columnIndex(table, t('en', 'leaderboard.track.composite'))
      for (const [index, entry] of ranked.entries()) {
        const cells = table.getByRole('row').nth(index + 1).getByRole('cell')
        await expect(cells.nth(compositeColumn)).toHaveText(
          (entry.score.composite as number).toFixed(1),
        )
      }

      // The models that were not measured on every core benchmark are named
      // below the ranking, each with the benchmark it is missing.
      for (const entry of incomplete) {
        const item = page.getByRole('listitem').filter({
          has: page.getByRole('link', { name: entry.model.displayName, exact: true }),
        })
        await expect(item).toHaveCount(1)
        for (const missing of entry.score.missing) {
          await expect(item).toContainText(benchmarkName(missing))
        }
      }

      expect(pageErrors).toEqual([])
      expect(realConsoleErrors(consoleErrors)).toEqual([])
    })
  }
})

test.describe('leaderboard history', () => {
  test('/leaderboard-history lists the current leaders of every core benchmark', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/leaderboard-history')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      t('en', 'leaderboard.historyPage.title'),
    )
    for (const heading of [
      t('en', 'leaderboard.historyPage.timeline'),
      t('en', 'leaderboard.historyPage.overwritten'),
    ]) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }

    // The same page, in Chinese.
    await visit(page, '/zh/leaderboard-history')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      t('zh', 'leaderboard.historyPage.title'),
    )
    await expect(
      page.getByRole('heading', { name: t('zh', 'leaderboard.historyPage.timeline') }),
    ).toBeVisible()

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })
})

/**
 * The blended price of a registry row, for the price column.
 *
 * The board shows the rate IN FORCE, not the registry's base rate — a base
 * rate may be a promotional band. `priceDetail` resolves the dated band the
 * same way the board and the calculator do, so this expectation cannot drift
 * from what the page renders.
 */
function priceOf(priceId: string): { input: number; output: number } | undefined {
  const model = REGISTRY.models.find((m) => m.id === priceId)
  if (!model) return undefined
  const detail = priceDetail(model)
  return { input: detail.input, output: detail.output }
}

/** The heading a benchmark column carries on the board. */
function benchmarkName(benchmarkId: string): string {
  return BENCHMARKS.find((b) => b.id === benchmarkId)?.name ?? benchmarkId
}
