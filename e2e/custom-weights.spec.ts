import { clickUntil, expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { rankTrack, TRACKS, TRACK_IDS } from '@/features/leaderboard/scoring'

/**
 * The custom-weight board.
 *
 * The point of the custom board is that a user can say what matters to
 * them — coding and price, say — and get a ranking that reflects it. The
 * rules it must not break:
 *
 *  - a model that was never measured on a weighted board cannot be scored
 *    on it, so it drops out of the ranking rather than being averaged over
 *    the benchmarks it happens to have;
 *  - the ranking is by the custom score, and the custom score is the
 *    weighted blend of the board scores and the price axis.
 */

/**
 * Open the custom board.
 *
 * The dev server compiles the route on demand, so the first visit can be a
 * static shell whose click reaches no handler — the click is retried until
 * the custom table is actually there.
 */
async function openCustomBoard(page: Parameters<typeof visit>[0]) {
  const table = page.getByRole('table').filter({
    has: page.getByRole('columnheader', { name: t('en', 'leaderboard.custom.score') }),
  })
  await clickUntil(page.getByRole('button', { name: t('en', 'leaderboard.custom.title') }), async () => {
    await expect(table).toBeVisible()
  })
  return table
}

/** Set a range input's value the way a user would, so React sees it. */
async function setSlider(page: Parameters<typeof visit>[0], name: string, value: number) {
  const slider = page.getByRole('slider', { name })
  await slider.evaluate((el, v) => {
    const input = el as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set
    setter?.call(input, String(v))
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}
test.describe('the custom-weight board', () => {
  test('re-ranks by the weights the user sets', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/')

    const table = await openCustomBoard(page)

    // Every row has a score and a model link.
    const rows = table.locator('tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(1)
    await expect(rows.first().getByRole('link').first()).toHaveAttribute('href', /^\/models\//)

    // The default weights are general 50 + coding 25 + price 25, so the
    // ranking starts as the blend of those axes — which is a ranking, so it is
    // ordered.
    const cells = await rows.evaluateAll((trs) =>
      trs.map((tr) => {
        const tds = tr.querySelectorAll('td')
        // The score cell is the third column: rank, model, score, price.
        return tds[2]?.textContent?.trim() ?? ''
      }),
    )
    const numbers = cells
      .map((s) => Number.parseFloat(s))
      .filter((n) => Number.isFinite(n))
    expect(numbers.length).toBe(count)
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i - 1]).toBeGreaterThanOrEqual(numbers[i])
    }

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('weighting a single board ranks that board', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/')
    const table = await openCustomBoard(page)

    // Push every board except coding to zero. The ranking must then be the
    // coding board's ranking, because coding is the only board that counts.
    for (const slug of TRACK_IDS) {
      if (slug === 'coding') continue
      await setSlider(page, t('en', TRACKS[slug].labelKey), 0)
    }
    await setSlider(page, t('en', 'leaderboard.custom.price'), 0)

    // Only the models measured on every coding core benchmark can score.
    const { ranked } = rankTrack(TRACKS.coding)
    await expect(table.locator('tbody tr')).toHaveCount(ranked.length)

    // And the order is the coding board's order.
    const names = await table
      .getByRole('link')
      .evaluateAll((links) => links.map((l) => l.textContent?.trim() ?? ''))
    expect(names.slice(0, ranked.length)).toEqual(
      ranked.map((entry) => entry.model.displayName),
    )

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })

  test('a model missing one of two weighted boards is not ranked', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    // The regression this pins: with TWO axes carrying weight, a model that
    // is missing one of them used to be ranked anyway — over a smaller
    // denominator than its neighbours — and could win outright. The old spec
    // never caught it because it only ever weighted a single board, where the
    // broken code happens to behave correctly.
    await visit(page, '/')
    const table = await openCustomBoard(page)

    // Weight exactly two boards: general and agent. The price axis is off so
    // the gate is purely about the two capability boards.
    for (const slug of TRACK_IDS) {
      if (slug === 'general' || slug === 'agent') continue
      await setSlider(page, t('en', TRACKS[slug].labelKey), 0)
    }
    await setSlider(page, t('en', 'leaderboard.custom.price'), 0)
    await setSlider(page, t('en', TRACKS.general.labelKey), 50)
    await setSlider(page, t('en', TRACKS.agent.labelKey), 50)

    // The qualifying set is the INTERSECTION of the two boards' ranked sets.
    const general = new Set(
      rankTrack(TRACKS.general).ranked.map((entry) => entry.model.id),
    )
    const agent = new Set(
      rankTrack(TRACKS.agent).ranked.map((entry) => entry.model.id),
    )
    const expected = [...general].filter((id) => agent.has(id))
    expect(expected.length).toBeGreaterThan(0)
    // The intersection must be strictly smaller than either board alone —
    // otherwise this test cannot tell the gate from "no gate at all".
    expect(expected.length).toBeLessThan(general.size)

    await expect(table.locator('tbody tr')).toHaveCount(expected.length)

    // A model that is complete on general but missing agent must NOT be
    // ranked — it is listed separately, with the board it is missing named.
    const partial = [...general].filter((id) => !agent.has(id))
    expect(partial.length).toBeGreaterThan(0)

    const rankedNames = new Set(
      await table
        .getByRole('link')
        .evaluateAll((links) => links.map((l) => l.textContent?.trim() ?? '')),
    )
    for (const id of partial) {
      const name = LEADERBOARD.models.find((m) => m.id === id)?.displayName
      expect(name).toBeDefined()
      expect(rankedNames.has(name as string)).toBe(false)
    }

    // And the unranked section names the board the model is missing: a model
    // that has general but not agent is listed as missing the agent board.
    const unrankedSection = page
      .getByRole('heading', { name: t('en', 'leaderboard.custom.notRanked') })
      .locator('..')
    const unrankedText = await unrankedSection.innerText()
    for (const id of partial) {
      const name = LEADERBOARD.models.find((m) => m.id === id)?.displayName
      expect(unrankedText).toContain(name as string)
    }
    expect(unrankedText).toContain(t('en', TRACKS.agent.labelKey))

    expect(pageErrors).toEqual([])
    expect(realConsoleErrors(consoleErrors)).toEqual([])
  })
})
