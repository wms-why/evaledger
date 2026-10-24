import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { dictionaries, translate, type Locale } from '@/features/i18n/locale'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BEST_CATEGORIES } from '@/features/leaderboard/leaderboard'
import { TRACKS, TRACK_IDS } from '@/features/leaderboard/scoring'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { BENCHMARK_DESCRIPTIONS_ZH } from '@/features/leaderboard/benchmark-descriptions.zh'
import { modelMeta } from '@/features/landing/data'
import { brandedTitle } from '@/features/seo/seo'

/**
 * The SERP budget every page has to fit.
 *
 * A `<title>` is cut off around 60 characters in a search result, and a meta
 * description is ignored past ~160. The site used to ship titles without the
 * brand on 208 of 262 pages, and 36 descriptions over the limit. These tests
 * hold the copy that is generated from the dictionaries/registries/content
 * files to the rule; `e2e/seo.spec.ts` holds the rendered pages to it too.
 */
const TITLE_MAX = 60
const DESCRIPTION_MAX = 160
const locales: Locale[] = ['en', 'zh']

const appName = (locale: Locale) => dictionaries[locale].common.appName

function staticTitle(key: string, locale: Locale, params?: Record<string, string | number>) {
  return brandedTitle(translate(dictionaries[locale], key, params), appName(locale))
}

describe('the SERP title budget', () => {
  it('keeps every dictionary-driven page title within 60 characters', () => {
    const keys = [
      'leaderboard.home.title',
      'home.calculatorTitle',
      'home.chatgptTitle',
      'home.deepseekTitle',
      'home.claudeTitle',
      'home.openrouterTitle',
      'leaderboard.compare.title',
      'releases.title',
      'series.indexTitle',
      'leaderboard.methodology.title',
      'dataQuality.title',
      'changelog.title',
      'sponsor.title',
      'waitlist.title',
    ]
    for (const locale of locales) {
      for (const key of keys) {
        const title = staticTitle(key, locale)
        expect(title.length, `${locale} ${key}: ${title}`).toBeLessThanOrEqual(TITLE_MAX)
      }
    }
  })

  it('keeps every model title within 60 characters', () => {
    for (const locale of locales) {
      const dict = dictionaries[locale]
      for (const model of LEADERBOARD.models) {
        const { title } = modelMeta(model, (key, params) => translate(dict, key, params))
        const branded = brandedTitle(title, appName(locale))
        expect(branded.length, `${locale} ${model.id}: ${branded}`).toBeLessThanOrEqual(TITLE_MAX)
      }
    }
  })

  it('keeps every use-case ranking title within 60 characters', () => {
    for (const locale of locales) {
      const dict = dictionaries[locale]
      for (const category of BEST_CATEGORIES) {
        const title = translate(dict, `leaderboard.best.${category.slug}.title`)
        expect(
          brandedTitle(title, appName(locale)).length,
          `${locale} ${category.slug}`,
        ).toBeLessThanOrEqual(TITLE_MAX)
      }
    }
  })
})

describe('the meta-description budget', () => {
  it('keeps dictionary-driven descriptions within 160 characters', () => {
    for (const locale of locales) {
      const dict = dictionaries[locale]
      const rendered: Record<string, string> = {
        home: translate(dict, 'leaderboard.home.metaDescription', {
          n: LEADERBOARD.models.length,
        }),
        compare: translate(dict, 'leaderboard.compare.metaDescription'),
        history: translate(dict, 'leaderboard.history.metaDescription'),
        methodology: translate(dict, 'leaderboard.methodology.metaDescription'),
        best: translate(dict, 'leaderboard.best.metaDescription'),
        releases: translate(dict, 'releases.metaDescription'),
        series: translate(dict, 'series.indexMetaDescription'),
        sponsor: translate(dict, 'sponsor.metaDescription'),
        changelog: translate(dict, 'changelog.metaDescription'),
        dataQuality: translate(dict, 'dataQuality.metaDescription'),
        brand: translate(dict, 'marketing.brandMetaDescription'),
        calculator: translate(dict, 'marketing.calculatorMetaDescription', {
          date: '2026-10-24',
        }),
        waitlist: translate(dict, 'waitlist.metaDescription'),
      }
      for (const track of TRACK_IDS) {
        rendered[`track:${track}`] = translate(dict, 'leaderboard.track.metaDescription', {
          track: translate(dict, TRACKS[track].labelKey),
        })
      }
      for (const category of BEST_CATEGORIES) {
        rendered[`best:${category.slug}`] = translate(
          dict,
          `leaderboard.best.${category.slug}.metaDescription`,
        )
      }
      for (const [key, description] of Object.entries(rendered)) {
        expect(description.length, `${locale} ${key}: ${description}`).toBeLessThanOrEqual(
          DESCRIPTION_MAX,
        )
      }
    }
  })

  it('keeps the rendered model descriptions within 160 characters', () => {
    for (const locale of locales) {
      const dict = dictionaries[locale]
      for (const model of LEADERBOARD.models) {
        const { description } = modelMeta(model, (key, params) => translate(dict, key, params))
        expect(description.length, `${locale} ${model.id}: ${description}`).toBeLessThanOrEqual(
          DESCRIPTION_MAX,
        )
      }
    }
  })

  it('keeps every benchmark description within 160 characters', () => {
    for (const benchmark of BENCHMARKS) {
      expect(
        benchmark.description.length,
        `en ${benchmark.id}: ${benchmark.description}`,
      ).toBeLessThanOrEqual(DESCRIPTION_MAX)
      const zh = BENCHMARK_DESCRIPTIONS_ZH[benchmark.id]
      expect(zh.length, `zh ${benchmark.id}: ${zh}`).toBeLessThanOrEqual(DESCRIPTION_MAX)
    }
  })

  it('keeps every release summary within 160 characters', () => {
    const dir = new URL('../../content/releases/', import.meta.url)
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
      const source = readFileSync(new URL(file, dir), 'utf8')
      const description = /^description: "(.*)"$/m.exec(source)?.[1]
      expect(description, `${file} has no description`).toBeTruthy()
      expect(description!.length, `${file}: ${description}`).toBeLessThanOrEqual(DESCRIPTION_MAX)
    }
  })
})
