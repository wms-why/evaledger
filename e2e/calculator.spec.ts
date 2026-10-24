import { expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t, type Locale } from './helpers/i18n'
import { localePath } from './helpers/routes'
import { calculateCost } from '@/features/calculator/cost'
import { REGISTRY } from '@/features/calculator/model-prices'
import { providerLabel } from '@/features/calculator/provider-label'
import { localeTag } from '@/features/i18n/locale'
import type { Locator, Page } from '@playwright/test'

/**
 * The token calculator and the five per-provider pricing landings.
 *
 * The point of this spec is that the numbers on the page are the numbers in
 * the registry: every expected figure is derived from `REGISTRY` with the
 * app's own `calculateCost()`, so a price change in the registry moves the
 * expectation with it instead of quietly rotting the test.
 *
 * Every interactive assertion runs inside `expect.poll`: the dev server
 * streams the page before React has attached its handlers, and it reloads the
 * page whenever a source file changes — so the spec re-types the workload
 * and looks again until the page agrees with the registry.
 */

/** The workload the specs type in: 1,000 requests × (100 in + 50 out). */
const REQUESTS = 1_000
const INPUT_PER_REQUEST = 100
const OUTPUT_PER_REQUEST = 50
const TOTAL_INPUT = REQUESTS * INPUT_PER_REQUEST
// 150,000 tokens of context — under every long-context threshold in the
// registry (the lowest is 200,000), so a card quotes the plain per-1M price
// of its model and the registry's number can be compared to it one for one.

/** The models the results grid renders (the active ones). */
const ACTIVE = REGISTRY.models.filter((m) => m.status === 'active')
const activeIdsOf = (provider: string) =>
  ACTIVE.filter((m) => m.provider === provider).map((m) => m.id)
const displayNameOf = (modelId: string) =>
  REGISTRY.models.find((m) => m.id === modelId)?.displayName ?? modelId

/** The three sliders of the usage form. */
const SLIDERS = [
  ['calculator.monthlyLabel', REQUESTS],
  ['calculator.inputTokensLabel', INPUT_PER_REQUEST],
  ['calculator.outputTokensLabel', OUTPUT_PER_REQUEST],
] as const

// ───────────────────────── local helpers ─────────────────────────

/**
 * What the registry says a model costs for the workload above.
 *
 * The formatter is the app's own (`ModelCard.tsx`); it is not exported, so
 * the copy lives here — it lets the spec print a registry number exactly the
 * way the card prints it.
 */
function registryTotal(modelId: string, locale: Locale): string {
  const n = calculateCost(modelId, TOTAL_INPUT, REQUESTS * OUTPUT_PER_REQUEST).totalCost
  const usd =
    n === 0
      ? '0'
      : n < 0.01
        ? n.toFixed(4)
        : n < 1
          ? n.toFixed(3)
          : n < 100
            ? n.toFixed(2)
            : n.toLocaleString(localeTag(locale), { maximumFractionDigits: 0 })
  return `$${usd}`
}

/** The per-1M prices the card of a model must print. */
function expectedPrices(modelId: string, locale: Locale): string {
  const model = REGISTRY.models.find((m) => m.id === modelId)
  if (!model) throw new Error(`Unknown model id: ${modelId}`)
  const tokens = `${TOTAL_INPUT.toLocaleString(localeTag(locale))} ${t(locale, 'calculator.tokensUnit')}`
  return (
    `$${model.inputPricePer1M.toFixed(2)} / 1M${tokens}` +
    `|$${model.outputPricePer1M.toFixed(2)} / 1M`
  )
}

/** The card of one model inside the results grid. */
function cardOf(page: Page, displayName: string): Locator {
  return page.getByRole('article').filter({
    has: page.getByRole('heading', { name: displayName, exact: true }),
  })
}

/** The headline monthly total a card prints (its first stand-alone `$…`). */
async function headlineTotal(card: Locator): Promise<string> {
  const lines = (await card.innerText()).split('\n').map((line) => line.trim())
  return lines.find((line) => /^\$[\d.,]+$/.test(line)) ?? ''
}

/** The per-1M prices a card prints right now. */
async function cardPrices(card: Locator): Promise<string> {
  // The card's list holds: input cost, output cost, input $/1M, output $/1M,
  // context window.
  const input = (await card.getByRole('definition').nth(2).textContent()) ?? ''
  const output = (await card.getByRole('definition').nth(3).textContent()) ?? ''
  return `${input}|${output}`
}

/** The chip that narrows the grid to one provider. */
function providerChip(page: Page, provider: string, locale: Locale): Locator {
  return page.getByRole('button', {
    name: providerLabel((key) => t(locale, key), provider),
    exact: true,
  })
}

/**
 * Wait until the tab strip reacts — i.e. until React is live.
 *
 * The dev server streams the markup before React has attached its handlers.
 * A value typed into a slider before that is swallowed — and worse, it
 * poisons React's value tracker, so the change event never fires afterwards.
 * `aria-selected` is a React-owned attribute, so clicking the tabs is the
 * cheapest honest signal that the page is live.
 */
async function waitForLive(page: Page, locale: Locale): Promise<void> {
  const paste = page.getByRole('tab', { name: t(locale, 'calculator.tabPaste') })
  const manual = page.getByRole('tab', { name: t(locale, 'calculator.tabManual') })
  await expect
    .poll(
      async () => {
        await paste.click({ timeout: 3_000 }).catch(() => undefined)
        if ((await paste.getAttribute('aria-selected')) !== 'true') return false
        await manual.click({ timeout: 3_000 }).catch(() => undefined)
        return (await manual.getAttribute('aria-selected')) === 'true'
      },
      { message: 'the calculator should become interactive', timeout: 30_000 },
    )
    .toBe(true)
}

/** Type the workload into the calculator form. False while the page is not live. */
async function typeWorkload(page: Page, locale: Locale): Promise<boolean> {
  try {
    await waitForLive(page, locale)
    for (const [key, value] of SLIDERS) {
      await page.getByRole('slider', { name: t(locale, key) }).fill(String(value))
    }
  } catch {
    return false
  }
  return true
}

/** The two instruments every spec ends with: no uncaught errors, no console noise. */
function expectClean(pageErrors: string[], consoleErrors: string[]): void {
  expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([])
  const noise = realConsoleErrors(consoleErrors)
  expect(noise, `console errors: ${noise.join(' | ')}`).toEqual([])
}

// ───────────────────────── the calculator and its landings ─────────────────────────

/** One page: its path, its headline and the models its price table must quote. */
interface Landing {
  path: string
  h1Key: string
  /** Provider chip to press; the grid then shows that provider only. */
  provider?: string
  /** Model ids whose prices the landing's table must quote. */
  models: string[]
  /** The landing also carries the OpenRouter markup badge. */
  markup?: boolean
}

const LANDINGS: Landing[] = [
  { path: '/token-cost-calculator', h1Key: 'calculator.h1Token', models: ACTIVE.map((m) => m.id) },
  { path: '/claude-token-cost-calculator', h1Key: 'calculator.h1Claude', provider: 'anthropic', models: activeIdsOf('anthropic') },
  { path: '/chatgpt-api-pricing', h1Key: 'calculator.h1Chatgpt', provider: 'openai', models: activeIdsOf('openai') },
  { path: '/deepseek-api-pricing', h1Key: 'calculator.h1Deepseek', provider: 'deepseek', models: activeIdsOf('deepseek') },
  { path: '/openrouter-pricing-calculator', h1Key: 'calculator.h1Openrouter', models: ['gpt-6-sol', 'claude-haiku-4.5'], markup: true },
  // The four vendor pages generated from the price registry. Each one is
  // pre-filtered to its own provider, so the grid shows that vendor's models
  // first — the reader who searched "Gemini API pricing" must not land on an
  // all-providers table whose first row is some other vendor's model.
  { path: '/gemini-api-pricing', h1Key: 'landing.vendor.gemini.h1', provider: 'google', models: activeIdsOf('google') },
  { path: '/grok-api-pricing', h1Key: 'landing.vendor.grok.h1', provider: 'grok', models: activeIdsOf('grok') },
  { path: '/minimax-api-pricing', h1Key: 'landing.vendor.minimax.h1', provider: 'minimax', models: activeIdsOf('minimax') },
  { path: '/kimi-api-pricing', h1Key: 'landing.vendor.kimi.h1', provider: 'kimi', models: activeIdsOf('kimi') },
]

/** Check one page in one language: headline, price table, provider prices. */
async function expectLanding(page: Page, landing: Landing, locale: Locale): Promise<void> {
  await visit(page, localePath(landing.path, locale))

  // A vendor landing is pre-filtered to its own provider, so its grid carries
  // that vendor's model count — not the whole registry's. That is the point
  // of the page: the reader who searched "Gemini API pricing" must land on
  // Gemini's prices, not on an all-providers table.
  const shown = landing.provider
    ? ACTIVE.filter((m) => m.provider === landing.provider).length
    : ACTIVE.length

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(t(locale, landing.h1Key))
  await expect(
    page.getByRole('heading', {
      name: t(locale, 'calculator.resultsTitle', { n: shown }),
    }),
  ).toBeVisible()

  const expected = {
    cards: shown,
    models: Object.fromEntries(
      landing.models.map((id) => [displayNameOf(id), expectedPrices(id, locale)]),
    ),
  }

  await expect
    .poll(
      async () => {
        if (!(await typeWorkload(page, locale))) return { cards: -1, models: {} }
        if (landing.provider) await providerChip(page, landing.provider, locale).click()
        const models: Record<string, string> = {}
        for (const id of landing.models) {
          models[displayNameOf(id)] = await cardPrices(cardOf(page, displayNameOf(id)))
        }
        return { cards: await page.getByRole('article').count(), models }
      },
      { message: `${landing.path} (${locale}) should quote the registry`, timeout: 40_000 },
    )
    .toEqual(expected)

  // The card carries the copy of its own language, and only that.
  const card = cardOf(page, displayNameOf(landing.models[0]!))
  await expect(card).toContainText(t(locale, 'calculator.perMonth'))
  await expect(card).not.toContainText(t(locale === 'en' ? 'zh' : 'en', 'calculator.perMonth'))

  if (landing.markup) {
    const badge = t(locale, 'calculator.openrouterCurrentMarkup', {
      multiplier: REGISTRY.openRouterMarkup.toFixed(2),
      pct: Math.round((REGISTRY.openRouterMarkup - 1) * 100),
    })
    await expect(page.getByText(badge, { exact: true })).toBeVisible()
  }
}

// ───────────────────────── the specs ─────────────────────────

test('the calculator renders and quotes the registry for a typed workload', async ({
  page,
  consoleErrors,
  pageErrors,
}) => {
  await visit(page, '/token-cost-calculator')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    t('en', 'calculator.h1Token'),
  )
  await expect(
    page.getByRole('heading', {
      name: t('en', 'calculator.resultsTitle', { n: ACTIVE.length }),
    }),
  ).toBeVisible()

  await expect
    .poll(
      async () => {
        if (!(await typeWorkload(page, 'en'))) return {}
        const haiku = cardOf(page, displayNameOf('claude-haiku-4.5'))
        const sol = cardOf(page, displayNameOf('gpt-6-sol'))
        return {
          haiku: { total: await headlineTotal(haiku), prices: await cardPrices(haiku) },
          sol: { total: await headlineTotal(sol), prices: await cardPrices(sol) },
        }
      },
      { message: 'the calculator should quote the registry', timeout: 40_000 },
    )
    .toEqual({
      haiku: { total: '$0.350', prices: expectedPrices('claude-haiku-4.5', 'en') },
      sol: { total: '$0.700', prices: expectedPrices('gpt-6-sol', 'en') },
    })

  // The figures are spelled out too, so a change in the formula shows up.
  expect(registryTotal('claude-haiku-4.5', 'en')).toBe('$0.350')
  expect(registryTotal('gpt-6-sol', 'en')).toBe('$0.700')

  expectClean(pageErrors, consoleErrors)
})

test('selecting a model changes the total', async ({
  page,
  consoleErrors,
  pageErrors,
}) => {
  await visit(page, '/token-cost-calculator')

  await expect
    .poll(
      async () => {
        if (!(await typeWorkload(page, 'en'))) return {}
        await page
          .getByRole('button', { name: t('en', 'calculator.filterAll'), exact: true })
          .click()
        const before = await headlineTotal(cardOf(page, displayNameOf('gpt-6-sol')))
        // Re-select another model: the grid follows the new selection.
        await providerChip(page, 'anthropic', 'en').click()
        return {
          before,
          after: await headlineTotal(cardOf(page, displayNameOf('claude-haiku-4.5'))),
          cards: await page.getByRole('article').count(),
          pressed: await providerChip(page, 'anthropic', 'en').getAttribute('aria-pressed'),
        }
      },
      { message: 'switching the model should change the total', timeout: 40_000 },
    )
    .toEqual({ before: '$0.700', after: '$0.350', cards: 4, pressed: 'true' })

  // The ?model= deep link selects a model and narrows the grid to its provider.
  await visit(page, '/token-cost-calculator?model=claude-opus-5.5')

  await expect
    .poll(
      async () => {
        if (!(await typeWorkload(page, 'en'))) return {}
        const opus = cardOf(page, displayNameOf('claude-opus-5.5'))
        return {
          opus: { total: await headlineTotal(opus), prices: await cardPrices(opus) },
          cards: await page.getByRole('article').count(),
          pressed: await providerChip(page, 'anthropic', 'en').getAttribute('aria-pressed'),
        }
      },
      { message: 'the deep link should select Opus 5.5', timeout: 40_000 },
    )
    .toEqual({
      opus: { total: '$1.40', prices: expectedPrices('claude-opus-5.5', 'en') },
      cards: activeIdsOf('anthropic').length,
      pressed: 'true',
    })

  expect(registryTotal('claude-opus-5.5', 'en')).toBe('$1.40')

  expectClean(pageErrors, consoleErrors)
})

for (const landing of LANDINGS) {
  for (const locale of ['en', 'zh'] as const) {
    test(`landing ${landing.path} renders its headline and its price table (${locale})`, async ({
      page,
      consoleErrors,
      pageErrors,
    }) => {
      await expectLanding(page, landing, locale)
      expectClean(pageErrors, consoleErrors)
    })
  }
}
