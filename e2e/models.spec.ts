import { expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { formatScore } from '@/features/leaderboard/leaderboard'
import { formatPrice } from '@/features/leaderboard/components/PriceCell'
import { REGISTRY } from '@/features/calculator/model-prices'
import type { Locator, Page } from '@playwright/test'

/**
 * The per-model page: `/models/<id>`.
 *
 * The page resolves everything from the two registries — the price from
 * `REGISTRY`, the scores from `LEADERBOARD` — so the spec reads the same
 * registries and compares.
 */

/** The label/value pair of the pricing card ("Input" → "$10.00"). */
function priceRow(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).locator('..')
}

/** The pricing card of the model page. */
function pricingCard(page: Page): Locator {
  return page.getByRole('heading', { name: t('en', 'leaderboard.model.pricing') }).locator('..')
}

const REPRESENTATIVE = ['gpt-6-astra', 'claude-opus-5.5', 'deepseek-v4.1-flash']

test.describe('model pages', () => {
  for (const modelId of REPRESENTATIVE) {
    const model = LEADERBOARD.models.find((entry) => entry.id === modelId)!
    const price = REGISTRY.models.find((entry) => entry.id === model.priceId)!

    test(`/models/${modelId} shows the registry price and the leaderboard scores`, async ({
      page,
      consoleErrors,
      pageErrors,
    }) => {
      await visit(page, `/models/${modelId}`)

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(model.displayName)

      // The price card shows the registry price for this model.
      await expect(priceRow(page, t('en', 'leaderboard.compare.input'))).toContainText(
        formatPrice(price.inputPricePer1M),
      )
      await expect(priceRow(page, t('en', 'leaderboard.compare.output'))).toContainText(
        formatPrice(price.outputPricePer1M),
      )
      if (price.cachedInputPricePer1M != null) {
        await expect(priceRow(page, t('en', 'leaderboard.compare.cached'))).toContainText(
          formatPrice(price.cachedInputPricePer1M),
        )
      }

      // The score table shows every score the leaderboard holds for it.
      const table = page.getByRole('table')
      await expect(table.getByRole('row')).toHaveCount(model.scores.length)
      for (const score of model.scores) {
        const benchmark = BENCHMARKS.find((entry) => entry.id === score.benchmark)!
        const row = table.getByRole('row').filter({
          has: page.getByRole('link', { name: benchmark.name, exact: true }),
        })
        await expect(row).toHaveCount(1)
        await expect(row.getByRole('cell').nth(1)).toHaveText(
          formatScore(score.score, score.unit),
        )
      }

      expect(pageErrors).toEqual([])
      expect(realConsoleErrors(consoleErrors)).toEqual([])
    })
  }

  test('a model with no price row renders an honest empty state', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    const model = LEADERBOARD.models.find((entry) => entry.id === 'glm-5.3')!
    expect(model.priceId, 'GLM 5.3 is the model without a price row').toBeUndefined()

    await visit(page, '/models/glm-5.3')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(model.displayName)

    // No invented price: no input/output rows, just a placeholder.
    const card = pricingCard(page)
    await expect(card.getByText(t('en', 'leaderboard.compare.input'), { exact: true })).toHaveCount(0)
    await expect(card.getByText(t('en', 'leaderboard.compare.output'), { exact: true })).toHaveCount(0)
    await expect(card.getByText('—', { exact: true })).toBeVisible()

    // The usage link does not point at a model the calculator does not know.
    const usage = card.getByRole('link', { name: t('en', 'leaderboard.model.runUsage') })
    await expect(usage).not.toHaveAttribute('href', /model=/)

    // The scores are still there — only the price is missing.
    const table = page.getByRole('table')
    await expect(table.getByRole('row')).toHaveCount(model.scores.length)

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('the model page cross-links to its series and its release post', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/models/gpt-6-astra')

    const asides = page.getByRole('complementary')

    // The series link — labelled with the series kicker.
    const seriesAside = asides.filter({ hasText: t('en', 'series.modelLink') })
    await expect(seriesAside).toHaveCount(1)
    const seriesLink = seriesAside.getByRole('link')
    await expect(seriesLink).toHaveAttribute('href', '/series/gpt-6')

    // The release post link.
    const releaseLink = asides.locator('a[href^="/releases/"]')
    await expect(releaseLink).toHaveAttribute('href', '/releases/gpt-6-astra')

    // Both destinations exist.
    for (const href of ['/series/gpt-6', '/releases/gpt-6-astra']) {
      const response = await page.request.get(href)
      expect(response.status(), `${href} should resolve`).toBe(200)
    }

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('a model with neither a series nor a release post links to neither', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/models/glm-5.3')

    await expect(page.getByRole('complementary')).toHaveCount(0)
    await expect(page.locator('a[href^="/releases/"]')).toHaveCount(0)
    await expect(page.locator('a[href^="/series/"]')).toHaveCount(0)

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('the model page renders in Chinese', async ({ page, consoleErrors, pageErrors }) => {
    const model = LEADERBOARD.models.find((entry) => entry.id === 'gpt-6-astra')!
    await visit(page, '/zh/models/gpt-6-astra')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(model.displayName)
    await expect(
      page.getByRole('heading', { name: t('zh', 'leaderboard.model.pricing') }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: t('zh', 'leaderboard.model.scores') }),
    ).toBeVisible()

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })
})
