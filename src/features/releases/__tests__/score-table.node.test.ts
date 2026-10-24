import { describe, expect, it } from 'vitest'
import { releaseScoreTable } from '../data'
import type { ReleaseMeta, ReleaseVendor } from '../types'

/**
 * The score table carries two independent markers, and the contract is that
 * they never collapse into one:
 *
 *  - the **subject column** says "this is the model the post is about";
 *  - the **best cell** says "this model won this row".
 *
 * A table that bolded the subject in every row would claim a victory the
 * subject did not win. A table that only marked the winner would lose track
 * of which column the post is about. These tests hold both apart.
 */

function meta(
  modelSlug: string,
  compareSlugs: string[] = [],
  vendor: ReleaseVendor = 'openai',
): ReleaseMeta {
  return {
    path: `${modelSlug}.mdx`,
    slug: modelSlug,
    title: modelSlug,
    date: '2026-10-01',
    checkedAt: '2026-10-01',
    vendor,
    modelId: modelSlug,
    modelSlug,
    compareModelIds: [],
    compareSlugs,
    sourceUrl: 'https://example.com/pricing',
    sourceTitle: 'example',
  }
}

describe('releaseScoreTable', () => {
  it('marks exactly one column as the subject — the model the post is about', () => {
    const table = releaseScoreTable(
      meta('gemini-3.1-pro', ['gpt-6-astra', 'claude-opus-5'], 'google'),
    )
    expect(table).not.toBeNull()

    const subjects = table!.columns.filter((column) => column.isSubject)
    expect(subjects).toHaveLength(1)
    expect(subjects[0].modelSlug).toBe('gemini-3.1-pro')

    // Every row carries the marker on the subject's cell too, so the column
    // reads as one block rather than as a per-cell accident.
    for (const row of table!.rows) {
      expect(row.cells.filter((cell) => cell.isSubject)).toHaveLength(1)
    }
  })

  it('marks the row winner even when the winner is a competitor', () => {
    const table = releaseScoreTable(
      meta('gemini-3.1-pro', ['gpt-6-astra', 'claude-opus-5'], 'google'),
    )!

    // GPQA Diamond: Gemini 94.3, GPT-6 astra 96.0 — the competitor wins.
    const gpqa = table.rows.find((row) => row.benchmark === 'gpqa-diamond')!
    const best = gpqa.cells.filter((cell) => cell.isBest)
    expect(best).toHaveLength(1)
    expect(best[0].modelSlug).toBe('gpt-6-astra')
    expect(best[0].isSubject).toBe(false)
  })

  it('marks the subject as the winner when it wins the row', () => {
    const table = releaseScoreTable(meta('gpt-6-astra', ['gpt-5.6-sol']))!

    expect(table.rows.length).toBeGreaterThan(0)
    for (const row of table.rows) {
      const best = row.cells.filter((cell) => cell.isBest)
      expect(best).toHaveLength(1)
      expect(best[0].modelSlug).toBe('gpt-6-astra')
      expect(best[0].isSubject).toBe(true)
    }
  })

  it('never marks a cell that is not the maximum of its row', () => {
    const tables = [
      releaseScoreTable(meta('gpt-6-astra', ['gpt-5.6-sol']))!,
      releaseScoreTable(
        meta('gemini-3.1-pro', ['gpt-5.6-sol', 'gpt-6-astra', 'claude-opus-5', 'deepseek-v4.1-flash'], 'google'),
      )!,
      releaseScoreTable(meta('claude-opus-5.5', ['claude-opus-5'], 'anthropic'))!,
    ]

    for (const table of tables) {
      for (const row of table.rows) {
        const scored = row.cells.filter((cell) => cell.score != null && cell.unit === row.unit)
        const max = Math.max(...scored.map((cell) => cell.score as number))
        for (const cell of row.cells) {
          if (!cell.isBest) continue
          expect(cell.score).toBe(max)
          expect(cell.unit).toBe(row.unit)
        }
      }
    }
  })

  it('leaves a row unmarked when nobody wins it outright', () => {
    // A tie has no single leader, so neither model is dressed up as the
    // winner — the same rule the compare matrix uses.
    const table = releaseScoreTable(meta('gpt-6-astra', ['gpt-5.6-sol']))!
    for (const row of table.rows) {
      const scored = row.cells.filter((cell) => cell.score != null)
      const max = Math.max(...scored.map((cell) => cell.score as number))
      const tied = scored.filter((cell) => cell.score === max).length > 1
      expect(row.cells.some((cell) => cell.isBest)).toBe(!tied)
    }
  })
})
