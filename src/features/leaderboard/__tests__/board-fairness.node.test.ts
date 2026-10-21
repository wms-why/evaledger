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
  it('rank a category only over models measured on every benchmark of it', () => {
    for (const category of BEST_CATEGORIES) {
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
    for (const category of BEST_CATEGORIES) {
      const rows = categoryRows(category)
      for (let i = 1; i < rows.length; i++) {
        expect((rows[i - 1]!.composite as number) >= (rows[i]!.composite as number)).toBe(true)
      }
    }
  })
})
