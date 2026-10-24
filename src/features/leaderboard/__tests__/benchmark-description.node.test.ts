import { describe, expect, it } from 'vitest'
import { BENCHMARKS, benchmarkDescription } from '@/features/leaderboard/benchmarks'
import { BENCHMARK_DESCRIPTIONS_ZH } from '@/features/leaderboard/benchmark-descriptions.zh'

/**
 * The benchmark-description locale contract.
 *
 * A Chinese benchmark page used to publish the English registry sentence as
 * its meta description — byte-identical to its hreflang twin and meaningless
 * to a Chinese reader. Every benchmark now has a hand-written Chinese
 * counterpart; these tests keep that true as benchmarks are added.
 */
const CJK = /[\u3400-\u9fff]/

describe('benchmark descriptions by locale', () => {
  it('has a Chinese description for every benchmark, and only for real ones', () => {
    const ids = new Set(BENCHMARKS.map((benchmark) => benchmark.id))

    for (const benchmark of BENCHMARKS) {
      const zh = BENCHMARK_DESCRIPTIONS_ZH[benchmark.id]
      expect(zh, `${benchmark.id} has no Chinese description`).toBeTruthy()
      expect(zh.trim().length, `${benchmark.id} Chinese description is empty`).toBeGreaterThan(0)
      expect(zh, `${benchmark.id} Chinese description is the English one`).not.toBe(
        benchmark.description,
      )
      expect(CJK.test(zh), `${benchmark.id} Chinese description has no Chinese text`).toBe(true)
      expect(
        benchmarkDescription(benchmark, 'zh'),
        `${benchmark.id} zh helper does not return the Chinese description`,
      ).toBe(zh)
      expect(
        benchmarkDescription(benchmark, 'en'),
        `${benchmark.id} en helper does not return the registry description`,
      ).toBe(benchmark.description)
    }

    for (const id of Object.keys(BENCHMARK_DESCRIPTIONS_ZH)) {
      expect(ids.has(id), `Chinese description for unknown benchmark "${id}"`).toBe(true)
    }
  })

  it('falls back to English when a new benchmark has not been translated yet', () => {
    expect(
      benchmarkDescription({ id: 'brand-new', description: 'An English sentence.' }, 'zh'),
    ).toBe('An English sentence.')
  })
})
