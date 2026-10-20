import { columnIndex, expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import {
  BEST_CATEGORIES,
  categoryRows,
  findBestCategory,
} from '@/features/leaderboard/leaderboard'
import { formatPrice } from '@/features/leaderboard/components/PriceCell'

/**
 * The "best model for X" pages: `/best/<category>`.
 *
 * The ranking is computed from `LEADERBOARD` at render time, so the spec
 * rebuilds it and compares — a model that leaves (or joins) a category shows
 * up here.
 */

/**
 * Index of a column, by its visible heading.
 *
 * `textContent` (not `innerText`) — the table headers are uppercased by CSS,
 * and only the source text matches the dictionary.
 */
test.describe('best-of pages', () => {
  for (const category of BEST_CATEGORIES) {
    test(`/best/${category.slug} ranks the models of that category`, async ({
      page,
      consoleErrors,
      pageErrors,
    }) => {
      await visit(page, `/best/${category.slug}`)

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        t('en', `leaderboard.best.${category.slug}.title`),
      )
      await expect(
        page.getByText(t('en', `leaderboard.best.${category.slug}.intro`), { exact: true }),
      ).toBeVisible()

      const rows = categoryRows(category)
      const table = page.getByRole('table')
      // A header row plus one row per model in the category.
      await expect(table.getByRole('row')).toHaveCount(rows.length + 1)

      const avgColumn = await columnIndex(table, t('en', 'leaderboard.colAverage'))
      const priceColumn = await columnIndex(table, t('en', 'leaderboard.colPrice'))

      for (const [index, row] of rows.entries()) {
        const tr = table.getByRole('row').nth(index + 1)
        await expect(tr.getByRole('link').first()).toHaveText(row.model.displayName)
        await expect(tr.getByRole('link').first()).toHaveAttribute(
          'href',
          `/models/${row.model.id}`,
        )
        await expect(tr.getByRole('cell').nth(avgColumn)).toHaveText(
          row.average != null ? row.average.toFixed(1) : '—',
        )
        await expect(tr.getByRole('cell').nth(priceColumn)).toHaveText(
          row.blendedPricePer1M != null ? formatPrice(row.blendedPricePer1M) : '—',
        )
      }

      // The first row is the strongest model of the category.
      const first = rows[0]
      expect(first, `${category.slug} should rank at least one model`).toBeDefined()
      await expect(table.getByRole('row').nth(1).getByRole('link').first()).toHaveText(
        first.model.displayName,
      )

      // Every listed model belongs to the category's vendor set.
      if (category.vendors) {
        for (const row of rows) {
          expect(
            category.vendors,
            `${row.model.displayName} is not a ${category.vendors.join('/')} model`,
          ).toContain(row.model.vendor)
        }
      }

      expect(pageErrors).toEqual([])
      expect(realConsoleErrors(consoleErrors)).toEqual([])
    })
  }

  test('the best-of page names the benchmarks it scores on', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    const category = findBestCategory('for-coding')!
    await visit(page, '/best/for-coding')

    // The benchmarks the category ranks on are named at the bottom.
    const scoredOn = page.getByText(t('en', 'leaderboard.best.scoredOn'), { exact: false })
    await expect(scoredOn).toBeVisible()
    for (const benchmarkId of category.benchmarkIds) {
      const benchmark = BENCHMARKS.find((entry) => entry.id === benchmarkId)!
      await expect(scoredOn).toContainText(benchmark.name)
    }

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('a best-of page renders in Chinese', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/zh/best/for-coding')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      t('zh', 'leaderboard.best.for-coding.title'),
    )
    await expect(
      page.getByText(t('zh', 'leaderboard.best.for-coding.intro'), { exact: true }),
    ).toBeVisible()

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('an unknown best-of category is not a page', async ({ page }) => {
    // The 404 itself logs a console error, so this one test does not assert
    // on the console.
    const response = await page.goto('/best/not-a-category')
    expect(response?.status()).toBe(404)
  })
})
