import { columnIndex, expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { formatScore, scoreOf } from '@/features/leaderboard/leaderboard'

/**
 * The benchmark pages: `/benchmarks/<id>` and `/benchmarks/<id>/history`.
 *
 * The score table is built from `LEADERBOARD` at render time, so the spec
 * rebuilds the same ranking and compares cell by cell.
 */

/**
 * Index of a column, by its visible heading.
 *
 * `textContent` (not `innerText`) — the table headers are uppercased by CSS,
 * and only the source text matches the dictionary.
 */
/** The models that report a score for a benchmark, best first. */
function ranking(benchmarkId: string) {
  return LEADERBOARD.models
    .map((model) => ({ model, score: scoreOf(model, benchmarkId) }))
    .filter((entry) => !!entry.score)
    .sort((a, b) => b.score!.score - a.score!.score)
}

const SPOTLIGHT = ['gpqa-diamond', 'codeforces']

test.describe('benchmark pages', () => {
  for (const benchmarkId of SPOTLIGHT) {
    const benchmark = BENCHMARKS.find((entry) => entry.id === benchmarkId)!

    test(`/benchmarks/${benchmarkId} shows the name, the description and the scores`, async ({
      page,
      consoleErrors,
      pageErrors,
    }) => {
      await visit(page, `/benchmarks/${benchmarkId}`)

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(benchmark.name)
      await expect(page.getByText(benchmark.description, { exact: true })).toBeVisible()
      await expect(
        page.getByRole('heading', { name: t('en', 'leaderboard.benchmark.scores') }),
      ).toBeVisible()

      const ranked = ranking(benchmarkId)
      const table = page.getByRole('table')
      // A header row plus one row per model that reports the benchmark.
      await expect(table.getByRole('row')).toHaveCount(ranked.length + 1)

      const scoreColumn = await columnIndex(table, t('en', 'leaderboard.colScore'))
      for (const [index, entry] of ranked.entries()) {
        const row = table.getByRole('row').nth(index + 1)
        await expect(row.getByRole('link').first()).toHaveText(entry.model.displayName)
        await expect(row.getByRole('cell').nth(scoreColumn)).toHaveText(
          formatScore(entry.score!.score, entry.score!.unit),
        )
      }

      // The history page is one click away and exists.
      const historyLink = page.getByRole('link', {
        name: t('en', 'leaderboard.benchmark.historyLink'),
      })
      await expect(historyLink).toHaveAttribute('href', `/benchmarks/${benchmarkId}/history`)

      expect(pageErrors).toEqual([])
      expect(realConsoleErrors(consoleErrors)).toEqual([])
    })

    test(`/benchmarks/${benchmarkId}/history shows the snapshot table`, async ({
      page,
      consoleErrors,
      pageErrors,
    }) => {
      await visit(page, `/benchmarks/${benchmarkId}/history`)

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        `${benchmark.name}: ${t('en', 'leaderboard.history.title')}`,
      )
      await expect(
        page.getByRole('heading', { name: t('en', 'leaderboard.history.snapshotTable') }),
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: t('en', 'leaderboard.history.overwritten') }),
      ).toBeVisible()

      // The timeline is honest about what has been recorded.
      const snapshots = LEADERBOARD.history.filter((entry) => entry.benchmark === benchmarkId)
      if (snapshots.length === 0) {
        await expect(
          page.getByText(t('en', 'leaderboard.history.empty'), { exact: true }),
        ).toBeVisible()
      } else {
        await expect(
          page.getByText(t('en', 'leaderboard.history.snapshots', { n: snapshots.length }), {
            exact: true,
          }),
        ).toBeVisible()
      }

      // The snapshot table mirrors the current leaderboard for this benchmark.
      const ranked = ranking(benchmarkId)
      const table = page.getByRole('table')
      await expect(table.getByRole('row')).toHaveCount(ranked.length + 1)

      const scoreColumn = await columnIndex(table, t('en', 'leaderboard.colScore'))
      const observedColumn = await columnIndex(table, t('en', 'leaderboard.colObserved'))
      for (const [index, entry] of ranked.entries()) {
        const row = table.getByRole('row').nth(index + 1)
        await expect(row.getByRole('link').first()).toHaveText(entry.model.displayName)
        await expect(row.getByRole('cell').nth(scoreColumn)).toHaveText(
          formatScore(entry.score!.score, entry.score!.unit),
        )
        await expect(row.getByRole('cell').nth(observedColumn)).toHaveText(
          entry.score!.observedAt.slice(0, 10),
        )
      }

      expect(pageErrors).toEqual([])
      expect(realConsoleErrors(consoleErrors)).toEqual([])
    })
  }

  test('the benchmark page renders in Chinese', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/zh/benchmarks/gpqa-diamond')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      BENCHMARKS.find((entry) => entry.id === 'gpqa-diamond')!.name,
    )
    await expect(
      page.getByRole('heading', { name: t('zh', 'leaderboard.benchmark.scores') }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: t('zh', 'leaderboard.benchmark.historyLink') }),
    ).toHaveAttribute('href', '/zh/benchmarks/gpqa-diamond/history')

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })
})
