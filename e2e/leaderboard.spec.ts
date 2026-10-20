import { columnIndex, expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import {
  BENCHMARK_SHORT,
  CORE_BENCHMARK_IDS,
  formatScore,
  leaderboardRows,
  scoreOf,
  sortRows,
} from '@/features/leaderboard/leaderboard'
import { formatPrice } from '@/features/leaderboard/components/PriceCell'
import type { Locator, Page } from '@playwright/test'

/**
 * The landing leaderboard table and the history archive.
 *
 * Every number on the table is read from the registries at render time, so the
 * spec reads the same registries and compares — a price that drifts from
 * `REGISTRY` or a score that drifts from `LEADERBOARD` fails here.
 */

/** The landing table — the one with a "Model" column header. */
function boardTable(page: Page): Locator {
  return page.getByRole('table').filter({
    has: page.getByRole('columnheader', { name: t('en', 'leaderboard.colModel'), exact: true }),
  })
}

/**
 * Index of a column, by its visible heading.
 *
 * `textContent` (not `innerText`) — the headers are uppercased by CSS, and
 * only the source text matches the dictionary.
 */
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

test.describe('landing leaderboard table', () => {
  test('lists every model in the leaderboard registry, once', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/')

    const table = boardTable(page)
    // One header row plus one row per model.
    await expect(table.getByRole('row')).toHaveCount(LEADERBOARD.models.length + 1)
    // A handful of rows, by name — including a checkpoint and a model with no
    // price row at all.
    for (const name of ['GPT-6 Astra', 'Claude Opus 5.5', 'Kimi K3', 'DeepSeek V4.1-Flash 1017']) {
      await expect(table.getByRole('link', { name, exact: true })).toHaveCount(1)
    }

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('every row shows the registry price, average and benchmark scores', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/')

    const table = boardTable(page)
    // The table opens sorted by average, descending.
    const rows = sortRows(leaderboardRows(), 'average', 'desc')
    const avgColumn = await columnIndex(table, t('en', 'leaderboard.colAverage'))
    const priceColumn = await columnIndex(table, t('en', 'leaderboard.colPrice'))
    const scoreColumns = await Promise.all(
      CORE_BENCHMARK_IDS.map((id) => columnIndex(table, BENCHMARK_SHORT[id])),
    )

    for (const [index, row] of rows.entries()) {
      const cells = table.getByRole('row').nth(index + 1).getByRole('cell')
      await expect(cells.nth(1)).toContainText(row.model.displayName)
      await expect(cells.nth(avgColumn)).toHaveText(
        row.average != null ? row.average.toFixed(1) : '—',
      )
      await expect(cells.nth(priceColumn)).toHaveText(
        row.blendedPricePer1M != null ? formatPrice(row.blendedPricePer1M) : '—',
      )
      for (const [column, benchmarkId] of CORE_BENCHMARK_IDS.entries()) {
        const score = scoreOf(row.model, benchmarkId)
        await expect(cells.nth(scoreColumns[column])).toHaveText(
          score ? formatScore(score.score, score.unit) : '—',
        )
      }
    }

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('clicking a column header reorders the rows', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/')
    await waitForHydration(page)

    const table = boardTable(page)
    const rows = leaderboardRows()
    const firstRow = table.getByRole('row').nth(1).getByRole('link').first()
    const header = (name: string) =>
      table.getByRole('columnheader', { name, exact: true }).getByRole('button')

    // Default sort: average, descending.
    await expect(firstRow).toHaveText(sortRows(rows, 'average', 'desc')[0].model.displayName)

    // Clicking a new column sorts by it, descending first.
    await header(t('en', 'leaderboard.colModel')).click()
    await expect(firstRow).toHaveText(sortRows(rows, 'model', 'desc')[0].model.displayName)

    // Clicking the same column again flips the direction.
    await header(t('en', 'leaderboard.colModel')).click()
    await expect(firstRow).toHaveText(sortRows(rows, 'model', 'asc')[0].model.displayName)

    // A benchmark column sorts by that benchmark, and the new first row holds
    // the highest score for it.
    const benchmarkId = 'hle'
    const column = await columnIndex(table, 'HLE')
    await header('HLE').click()
    await expect(firstRow).toHaveText(sortRows(rows, benchmarkId, 'desc')[0].model.displayName)

    const best = rows
      .map((row) => scoreOf(row.model, benchmarkId))
      .filter((score) => !!score)
      .sort((a, b) => b!.score - a!.score)[0]!
    await expect(table.getByRole('row').nth(1).getByRole('cell').nth(column)).toHaveText(
      formatScore(best.score, best.unit),
    )

    // Sorting never adds or drops a row.
    await expect(table.getByRole('row')).toHaveCount(rows.length + 1)

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })
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

    for (const benchmarkId of CORE_BENCHMARK_IDS) {
      const benchmark = BENCHMARKS.find((entry) => entry.id === benchmarkId)!
      const top = leaderboardRows()
        .map((row) => ({ row, score: scoreOf(row.model, benchmarkId) }))
        .filter((entry) => !!entry.score)
        .sort((a, b) => b.score!.score - a.score!.score)
        .slice(0, 3)

      // The card holds the benchmark link and its top-three list.
      const card = page
        .getByRole('list')
        .locator('xpath=..')
        .filter({ has: page.getByRole('link', { name: benchmark.name, exact: true }) })
      await expect(card).toHaveCount(1)

      const items = card.getByRole('listitem')
      await expect(items).toHaveCount(top.length)
      for (const [index, entry] of top.entries()) {
        await expect(items.nth(index)).toContainText(entry.row.model.displayName)
        await expect(items.nth(index)).toContainText(
          formatScore(entry.score!.score, entry.score!.unit),
        )
      }
    }

    // Overwritten scores: either the empty notice or one entry per snapshot.
    const overwritten = LEADERBOARD.history.filter((entry) => entry.supersededAt)
    if (overwritten.length === 0) {
      await expect(
        page.getByText(t('en', 'leaderboard.history.overwrittenEmpty'), { exact: true }),
      ).toBeVisible()
    } else {
      await expect(page.getByText(overwritten[0].modelId, { exact: false }).first()).toBeVisible()
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
