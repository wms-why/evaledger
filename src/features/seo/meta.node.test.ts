import { describe, expect, it } from 'vitest'
import { dictionaries, translate } from '@/features/i18n/locale'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BEST_CATEGORIES, categoryRows } from '@/features/leaderboard/leaderboard'
import { isIndexablePath, isIndexableModel } from '@/features/seo/indexability'
import { CORE_PATHS } from '@/features/seo/sitemap-core'

/**
 * The metadata the pages publish.
 *
 * Three properties, all of which are cheap to check and expensive to get
 * wrong:
 *
 *   1. the home page's description quotes the REGISTRY's model count, not
 *      a number somebody typed (it said "9 frontier LLMs" while the board
 *      carried 18);
 *   2. every "best model for X" page carries its OWN description — one
 *      shared sentence across eight pages told a crawler they were the
 *      same page;
 *   3. a page the site asks to be ignored is ignored by its own head too —
 *      the sitemap and the page must never disagree.
 */

describe('the home page metadata', () => {
  it('quotes the model count the registry holds', () => {
    const description = translate(dictionaries.en, 'leaderboard.home.metaDescription', {
      n: LEADERBOARD.models.length,
    })
    expect(description).toContain(String(LEADERBOARD.models.length))
    expect(description).not.toContain('{n}')
    // The count is computed, not typed: the dictionary carries a placeholder.
    expect(dictionaries.en.leaderboard.home.metaDescription).toContain('{n}')
  })

  it('carries a title, a description and an H1 that are not the same string', () => {
    const dict = dictionaries.en.leaderboard.home
    const description = translate(dictionaries.en, 'leaderboard.home.metaDescription', {
      n: LEADERBOARD.models.length,
    })
    expect(dict.title.length).toBeGreaterThan(20)
    expect(description.length).toBeGreaterThan(60)
    expect(dict.h1.length).toBeGreaterThan(10)
    // The H1 must not be the bare keyword: it should say what the page does.
    expect(dict.h1).not.toBe('LLM Leaderboard')
  })

  it('names the brand in the title', () => {
    expect(dictionaries.en.leaderboard.home.title).toContain(dictionaries.en.common.appName)
    expect(dictionaries.zh.leaderboard.home.title).toContain(dictionaries.zh.common.appName)
  })
})

describe('the use-case rankings', () => {
  it('each carries its own description', () => {
    const descriptions = BEST_CATEGORIES.map((category) =>
      translate(dictionaries.en, `leaderboard.best.${category.slug}.metaDescription`),
    )
    expect(descriptions.every((d) => d.length > 60)).toBe(true)
    expect(new Set(descriptions).size, 'two categories share a description').toBe(
      descriptions.length,
    )
  })

  it('each carries its own description in Chinese too', () => {
    const descriptions = BEST_CATEGORIES.map((category) =>
      translate(dictionaries.zh, `leaderboard.best.${category.slug}.metaDescription`),
    )
    expect(new Set(descriptions).size).toBe(descriptions.length)
  })

  it('leaves no placeholder in a rendered description', () => {
    for (const category of BEST_CATEGORIES) {
      for (const locale of ['en', 'zh'] as const) {
        const description = translate(
          dictionaries[locale],
          `leaderboard.best.${category.slug}.metaDescription`,
        )
        expect(description, `${category.slug} (${locale})`).not.toMatch(/[{}]/)
      }
    }
  })
})

describe('the gated price ranking', () => {
  const category = BEST_CATEGORIES.find((c) => c.slug === 'cheapest-coding')

  it('exists and carries a gate', () => {
    expect(category).toBeDefined()
    expect(category!.gateBenchmarkIds?.length ?? 0).toBeGreaterThan(0)
  })

  it('lists only models measured on every gate benchmark', () => {
    const rows = categoryRows(category!)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      const score = row.model.scores
      for (const benchmarkId of category!.gateBenchmarkIds!) {
        expect(
          score.some((score) => score.benchmark === benchmarkId),
          `${row.model.displayName} is listed without a ${benchmarkId} score`,
        ).toBe(true)
      }
    }
  })

  it('orders them by price, cheapest first', () => {
    const rows = categoryRows(category!)
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1]!.blendedPricePer1M!).toBeLessThanOrEqual(rows[i]!.blendedPricePer1M!)
    }
  })

  it('lists the same models as the coding ranking it twins', () => {
    const coding = BEST_CATEGORIES.find((c) => c.slug === 'for-coding')!
    const coded = new Set(categoryRows(coding).map((row) => row.model.id))
    const cheap = categoryRows(category!).map((row) => row.model.id)
    // Every cheap model is a coding model; the reverse may not hold (a
    // coding-qualified model with no published price cannot be priced).
    for (const id of cheap) expect(coded.has(id)).toBe(true)
  })
})

describe('indexability', () => {
  it('agrees between the sitemap and the page heads', () => {
    // The page heads ask `isIndexableModel`; the sitemap asks
    // `isIndexablePath`. For a model page the two must be the same answer.
    for (const model of LEADERBOARD.models) {
      expect(isIndexablePath(`/models/${model.id}`)).toBe(isIndexableModel(model.id))
    }
  })

  it('keeps the stale waitlist page out of the index and the sitemap', () => {
    // Its copy is pre-launch ("we'll let you know the moment we launch") on a
    // live site, and it had zero inbound internal links. Reachable, not
    // advertised.
    expect(isIndexablePath('/waitlist')).toBe(false)
    expect(isIndexablePath('/zh/waitlist')).toBe(false)
  })

  it('keeps every core path indexable', () => {
    for (const path of CORE_PATHS) {
      expect(isIndexablePath(path), `${path} is in the core sitemap but is thin`).toBe(true)
    }
  })
})
