import { describe, expect, it } from 'vitest'
import { pairTitle, PAIR_TITLE_BUDGET } from '@/features/leaderboard/pair-title'
import { COMPARE_PAIR_ENTRIES } from '@/features/leaderboard/leaderboard'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { SERIES } from '@/features/series/series'
import { seriesRows } from '@/features/series/data'
import { seriesPairs } from '@/features/series/select'

/**
 * Pair-page titles must fit a 60-character `<title>` including the brand.
 *
 * The brand suffix is " — EvalLedger" (13 characters), so the names get a
 * 47-character budget. Long same-family names are compressed; short pairs are
 * left exactly as the two models are named.
 */
const BRAND_SUFFIX = ' — EvalLedger'
const TITLE_BUDGET = 60

const branded = (subject: string) => `${subject}${BRAND_SUFFIX}`

describe('pair titles', () => {
  it('leaves a short pair untouched', () => {
    expect(pairTitle('Claude Opus 5', 'GPT-6 Astra', 'vs')).toBe('Claude Opus 5 vs GPT-6 Astra')
    expect(pairTitle('HLE', 'GPQA Diamond', 'vs')).toBe('HLE vs GPQA Diamond')
  })

  it('compresses the shared prefix only when the full pair breaks the budget', () => {
    const title = pairTitle(
      'DeepSeek V4.1-Flash 1017',
      'DeepSeek V4.1-Flash 0910',
      'vs',
    )
    // 50 characters unbranded is over the 47 budget, so the shared prefix is
    // dropped from the second name.
    expect(title).toBe('DeepSeek V4.1-Flash 1017 vs 0910')
    expect(title.length).toBeLessThanOrEqual(PAIR_TITLE_BUDGET)

    const different = pairTitle('DeepSeek V4.1-Flash 1017', 'DeepSeek V4-Flash 0731', 'vs')
    expect(different.length).toBeLessThanOrEqual(PAIR_TITLE_BUDGET)
    expect(different).toContain('vs V4-Flash 0731')
  })

  it('works with the Chinese connector', () => {
    const title = pairTitle('DeepSeek V4.1-Flash 1017', 'DeepSeek V4.1-Flash 0910', '对比')
    expect(title.length).toBeLessThanOrEqual(PAIR_TITLE_BUDGET)
  })

  it('keeps every compare pair inside a 60-character branded title', () => {
    for (const pair of COMPARE_PAIR_ENTRIES) {
      const a = LEADERBOARD.models.find((model) => model.id === pair.a)!
      const b = LEADERBOARD.models.find((model) => model.id === pair.b)!
      const title = branded(pairTitle(a.displayName, b.displayName, 'vs'))
      expect(title.length, title).toBeLessThanOrEqual(TITLE_BUDGET)
    }
  })

  it('keeps every series pair inside a 60-character branded title', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      for (const pair of seriesPairs(series)) {
        const a = rows.find((row) => row.key === pair.a.key)
        const b = rows.find((row) => row.key === pair.b.key)
        if (!a || !b) continue // key derivation belongs to the series guard test
        for (const connector of ['vs', '对比']) {
          const title = branded(pairTitle(a.displayName, b.displayName, connector))
          expect(
            title.length,
            `${series.slug}/${pair.slug}: ${title}`,
          ).toBeLessThanOrEqual(TITLE_BUDGET)
        }
      }
    }
  })
})
