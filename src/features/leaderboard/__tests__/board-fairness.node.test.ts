import { describe, expect, it } from 'vitest'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { BEST_CATEGORIES, categoryRows } from '@/features/leaderboard/leaderboard'
import {
  fieldBest,
  fieldBestDetail,
  rankTrack,
  scoreAgainstCore,
  scoreTrack,
  TRACKS,
  TRACK_IDS,
  weightedMean,
} from '@/features/leaderboard/scoring'

/**
 * The board's fairness contract.
 *
 * These tests pin the promises the leaderboard makes to a reader:
 *
 *  1. A missing benchmark is "not tested" — never zero, and never a
 *     flattering partial average that lets a thin model outrank a
 *     thoroughly-measured one.
 *  2. Every ranked model was measured on the same benchmarks, so the
 *     denominators are identical.
 *  3. The score is reproducible: the printed parts rebuild it exactly.
 */
describe('the leaderboard board', () => {
  it('never ranks a model that was not measured on every core benchmark', () => {
    for (const slug of TRACK_IDS) {
      const track = TRACKS[slug]
      const { ranked, incomplete } = rankTrack(track)

      for (const entry of ranked) {
        expect(
          entry.score.complete,
          `${entry.model.displayName} is ranked on ${slug} but is missing a core benchmark`,
        ).toBe(true)
        expect(entry.score.composite).toBeDefined()
        expect(entry.score.missing).toEqual([])
      }

      for (const entry of incomplete) {
        expect(
          entry.score.composite,
          `${entry.model.displayName} is missing a core benchmark on ${slug} but has a composite`,
        ).toBeUndefined()
        expect(entry.score.missing.length).toBeGreaterThan(0)
      }

      // The two groups partition the registry: nothing is dropped and
      // nothing is ranked twice.
      expect(ranked.length + incomplete.length).toBe(LEADERBOARD.models.length)
      const ids = new Set([...ranked, ...incomplete].map((e) => e.model.id))
      expect(ids.size).toBe(LEADERBOARD.models.length)
    }
  })

  it('gives every ranked model the same denominator', () => {
    for (const slug of TRACK_IDS) {
      const track = TRACKS[slug]
      const { ranked } = rankTrack(track)
      for (const entry of ranked) {
        // The parts are exactly the core set — no model is averaged over a
        // different set of benchmarks than its neighbour.
        expect(entry.score.parts.length).toBe(track.core.length)
        expect(entry.score.covered.slice().sort()).toEqual(
          track.core.map((c) => c.id).sort(),
        )
      }
    }
  })

  it('rebuilds the composite from the printed parts', () => {
    for (const slug of TRACK_IDS) {
      for (const entry of rankTrack(TRACKS[slug]).ranked) {
        const rebuilt = weightedMean(entry.score.parts)
        expect(rebuilt).toBeDefined()
        expect(rebuilt as number).toBeCloseTo(entry.score.composite as number, 4)
      }
    }
  })

  it('reports a missing benchmark as untested, never as zero', () => {
    // A model with no score on a core benchmark must not produce a zero for
    // it — the whole benchmark is simply absent from the score.
    const track = TRACKS.general
    const partial = LEADERBOARD.models.find((m) => {
      const score = scoreTrack(m, track)
      return !score.complete && score.covered.length > 0
    })
    expect(partial, 'the registry should hold a partially-measured model').toBeDefined()

    const score = scoreTrack(partial as (typeof LEADERBOARD.models)[number], track)
    expect(score.composite).toBeUndefined()
    expect(score.coverage).toBeGreaterThan(0)
    expect(score.coverage).toBeLessThan(1)
    expect(score.parts.length).toBe(score.covered.length)
  })

  it('scores a model only on percent benchmarks', () => {
    // codeforces is a rating, not a percentage — it must never enter a
    // composite, and the field best for it does not exist.
    expect(fieldBest('codeforces')).toBeUndefined()
    expect(fieldBestDetail('codeforces')).toBeUndefined()

    for (const slug of TRACK_IDS) {
      for (const core of TRACKS[slug].core) {
        const benchmark = BENCHMARKS.find((b) => b.id === core.id)
        expect(benchmark, `${core.id} must exist in the benchmark registry`).toBeDefined()
        expect(benchmark!.unit).toBe('percent')
      }
    }
  })

  it('normalizes against the best score anyone has published', () => {
    for (const slug of TRACK_IDS) {
      for (const core of TRACKS[slug].core) {
        const best = fieldBest(core.id)
        expect(best, `${core.id} should have a field best`).toBeDefined()

        // The holder normalizes to exactly 100, and nobody exceeds it.
        const detail = fieldBestDetail(core.id)
        expect(detail?.best).toBe(best)
        for (const model of LEADERBOARD.models) {
          const score = scoreTrack(model, TRACKS[slug])
          for (const part of score.parts) {
            if (part.benchmark !== core.id) continue
            expect(part.normalized).toBeLessThanOrEqual(100)
            expect(part.normalized).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('does not move a composite when an unrelated model is added', () => {
    // Adding a model that is not the field best on any core benchmark must
    // not change anyone's score — otherwise a leaderboard would churn every
    // time a new model lands.
    const track = TRACKS.general
    const before = rankTrack(track).ranked.map((e) => [e.model.id, e.score.composite])

    const extra = {
      ...LEADERBOARD.models[0]!,
      id: 'test-only-model',
      displayName: 'Test only model',
      scores: LEADERBOARD.models[0]!.scores.map((s) => ({ ...s, score: 1 })),
    }
    const after = rankTrack(track, [...LEADERBOARD.models, extra]).ranked
      .filter((e) => e.model.id !== extra.id)
      .map((e) => [e.model.id, e.score.composite])

    expect(after).toEqual(before)
  })
})

describe('the best-of category pages', () => {
  /**
   * Only the score-ranked categories are boards.
   *
   * The coverage gate — a model is ranked only if it was measured on every
   * benchmark of the category — exists because the ranking comes from
   * benchmark scores, and a partial set of benchmarks would give two models
   * different denominators. The attribute-ranked pages (cheapest, 1M context,
   * prompt caching) sort by a number the price registry publishes for every
   * model, so there is no denominator to equalise and no gate to pass.
   */
  const scoreCategories = BEST_CATEGORIES.filter((c) => (c.kind ?? 'score') === 'score')
  const attributeCategories = BEST_CATEGORIES.filter((c) => (c.kind ?? 'score') !== 'score')

  it('has at least one score-ranked category to guard', () => {
    expect(scoreCategories.length).toBeGreaterThan(0)
  })

  it('rank a category only over models measured on every benchmark of it', () => {
    for (const category of scoreCategories) {
      const rows = categoryRows(category)
      for (const row of rows) {
        // A ranked row has a composite, which means it was measured on all
        // of the category's benchmarks.
        expect(row.composite).toBeDefined()
        const core = category.benchmarkIds.map((id) => ({ id, weight: 1 }))
        const score = scoreAgainstCore(row.model, core)
        expect(score.complete, `${row.model.displayName} is ranked on ${category.slug} but is incomplete`).toBe(true)
      }
    }
  })

  it('keeps the categories sorted by composite, best first', () => {
    for (const category of scoreCategories) {
      const rows = categoryRows(category)
      for (let i = 1; i < rows.length; i++) {
        expect((rows[i - 1]!.composite as number) >= (rows[i]!.composite as number)).toBe(true)
      }
    }
  })

  it('gives an attribute-ranked page no composite to sort by', () => {
    for (const category of attributeCategories) {
      for (const row of categoryRows(category)) {
        expect(row.composite).toBeUndefined()
      }
    }
  })

  it('sorts the cheapest category by blended price, cheapest first', () => {
    const category = BEST_CATEGORIES.find((c) => c.kind === 'price')
    expect(category).toBeDefined()
    const rows = categoryRows(category!)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.blendedPricePer1M).toBeDefined()
    }
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1]!.blendedPricePer1M!).toBeLessThanOrEqual(rows[i]!.blendedPricePer1M!)
    }
  })

  it('lists only models that really reach the context threshold', () => {
    const category = BEST_CATEGORIES.find((c) => c.kind === 'context')
    expect(category).toBeDefined()
    const min = category!.minContext!
    const rows = categoryRows(category!)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.contextWindow!).toBeGreaterThanOrEqual(min)
      // The context window the row shows is the registry's, not a copy.
      expect(row.contextWindow).toBe(row.price?.contextWindow)
    }
  })

  it('gives a cache-ranked row a real discount, and drops models with no cache rate', () => {
    const category = BEST_CATEGORIES.find((c) => c.kind === 'cache')
    expect(category).toBeDefined()
    const rows = categoryRows(category!)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.cachedInputPricePer1M).toBeDefined()
      expect(row.cacheDiscountPct!).toBeGreaterThan(0)
    }
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1]!.cacheDiscountPct!).toBeGreaterThanOrEqual(rows[i]!.cacheDiscountPct!)
    }
  })

  /**
   * A price-ranked page that also carries a GATE.
   *
   * `/best/cheapest-coding` answers "which of the models that can actually
   * do the job costs the least?" — the intersection of the two questions
   * the coding page and the cheapest page answer separately. Its rows are
   * still sorted by price, but a model that was never measured on every
   * gate benchmark is ABSENT: it is neither listed nor ranked last.
   */
  const gatedCategories = BEST_CATEGORIES.filter((c) => (c.gateBenchmarkIds?.length ?? 0) > 0)

  it('has at least one gated category to guard', () => {
    expect(gatedCategories.length).toBeGreaterThan(0)
  })

  it('lists only models measured on every gate benchmark', () => {
    for (const category of gatedCategories) {
      const rows = categoryRows(category)
      expect(rows.length, `${category.slug} should list at least one model`).toBeGreaterThan(0)
      for (const row of rows) {
        for (const benchmarkId of category.gateBenchmarkIds!) {
          expect(
            row.model.scores.some((score) => score.benchmark === benchmarkId),
            `${row.model.displayName} is listed on ${category.slug} without a ${benchmarkId} score`,
          ).toBe(true)
        }
      }
    }
  })

  it('sorts a gated page by the attribute it ranks by, not by score', () => {
    for (const category of gatedCategories) {
      const rows = categoryRows(category)
      const values = rows.map((row) => row.blendedPricePer1M!)
      for (let i = 1; i < values.length; i++) {
        expect(values[i - 1]).toBeLessThanOrEqual(values[i])
      }
      // The page carries no composite — it sorts by price, not by score.
      for (const row of rows) {
        expect(row.composite).toBeUndefined()
      }
    }
  })
})
