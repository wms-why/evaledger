import { describe, expect, it } from 'vitest'
import { findBenchmark } from '@/features/leaderboard/benchmarks'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { SOURCES, findSource } from '@/features/leaderboard/sources'
import {
  TRACKS,
  TRACK_IDS,
  contextScores,
  fieldBest,
  fieldBestDetail,
  findTrack,
  rankTrack,
  scoreAgainstCore,
  scoreTrack,
  weightedMean,
} from '@/features/leaderboard/scoring'
import type { TrackBenchmark } from '@/features/leaderboard/scoring'
import type { BenchmarkScore, LeaderboardModel } from '@/features/leaderboard/types'

/**
 * Guard for the scoring core.
 *
 * The whole point of this module is that two models with the same composite
 * were measured the same way. These tests make that property mechanical:
 *
 *  1. a model missing a core benchmark has NO composite and is excluded from
 *     the ranking — "not tested" is never rendered as zero;
 *  2. a complete model's composite IS the weighted mean of its parts;
 *  3. normalization divides by the FIELD BEST, not by 100;
 *  4. a non-`percent` benchmark can never enter a composite;
 *  5. every track's core ids exist in the benchmark registry;
 *  6. every registry model lands in exactly one of ranked / incomplete;
 *  7. **the denominator is pinned** — adding a model to the registry does not
 *     move anyone's composite unless that model becomes the field best on a
 *     core benchmark.
 */

// ── helpers ──────────────────────────────────────────────────────────────

function score(benchmark: string, value: number, unit: BenchmarkScore['unit'] = 'percent') {
  return { benchmark, score: value, unit, observedAt: '2026-10-20T00:00:00+08:00' }
}

function model(id: string, scores: BenchmarkScore[]): LeaderboardModel {
  return {
    id,
    vendor: 'openai',
    kind: 'gpt',
    version: id,
    displayName: id,
    scores,
  }
}

const byId = (entries: { model: LeaderboardModel }[]) => entries.map((e) => e.model.id)

// ── the tracks ───────────────────────────────────────────────────────────

describe('TRACKS', () => {
  it('declares the four tracks in a stable order', () => {
    expect(TRACK_IDS).toEqual(['general', 'coding', 'agent', 'reasoning'])
    expect(Object.keys(TRACKS)).toEqual(TRACK_IDS)
  })

  it('every core benchmark id exists in BENCHMARKS', () => {
    for (const slug of TRACK_IDS) {
      for (const core of TRACKS[slug].core) {
        expect(findBenchmark(core.id), `${slug} → ${core.id}`).toBeDefined()
      }
    }
  })

  it('every context benchmark id exists in BENCHMARKS', () => {
    for (const slug of TRACK_IDS) {
      for (const id of TRACKS[slug].context) {
        expect(findBenchmark(id), `${slug} → ${id}`).toBeDefined()
      }
    }
  })

  it('no core benchmark is a non-percent benchmark — a rating has no 0-100 denominator', () => {
    for (const slug of TRACK_IDS) {
      for (const core of TRACKS[slug].core) {
        expect(findBenchmark(core.id)?.unit, `${slug} → ${core.id}`).toBe('percent')
      }
    }
  })

  it('every core weight is positive and every track has at least one core benchmark', () => {
    for (const slug of TRACK_IDS) {
      expect(TRACKS[slug].core.length).toBeGreaterThan(0)
      for (const core of TRACKS[slug].core) {
        expect(core.weight, `${slug} → ${core.id}`).toBeGreaterThan(0)
      }
    }
  })

  it('a benchmark is never both core and context of the same track', () => {
    for (const slug of TRACK_IDS) {
      const coreIds = TRACKS[slug].core.map((c) => c.id)
      for (const id of TRACKS[slug].context) {
        expect(coreIds).not.toContain(id)
      }
    }
  })

  it('findTrack resolves a slug and returns undefined for an unknown one', () => {
    expect(findTrack('general')?.slug).toBe('general')
    expect(findTrack('nope')).toBeUndefined()
  })
})

// ── the coverage gate ────────────────────────────────────────────────────

describe('scoreTrack — the coverage gate', () => {
  it('a model missing a core benchmark gets NO composite', () => {
    // Claude Opus 5.5 has HLE but no GPQA Diamond.
    const opus = LEADERBOARD.models.find((m) => m.id === 'claude-opus-5.5')!
    const score = scoreTrack(opus, 'general')

    expect(score.complete).toBe(false)
    expect(score.composite).toBeUndefined()
    expect(score.missing).toEqual(['gpqa-diamond'])
    expect(score.covered).toEqual(['hle'])
    expect(score.coverage).toBe(0.5)
  })

  it('a model missing a core benchmark lands in `incomplete`, not in the ranking', () => {
    const ranking = rankTrack('general', LEADERBOARD.models)

    expect(byId(ranking.ranked)).not.toContain('claude-opus-5.5')
    expect(byId(ranking.incomplete)).toContain('claude-opus-5.5')

    const entry = ranking.incomplete.find((e) => e.model.id === 'claude-opus-5.5')!
    expect(entry.score.composite).toBeUndefined()
    expect(entry.score.missing).toEqual(['gpqa-diamond'])
  })

  it('a complete model gets a composite that is the weighted mean of its parts', () => {
    const opus = LEADERBOARD.models.find((m) => m.id === 'claude-opus-5')!
    const score = scoreTrack(opus, 'general')

    expect(score.complete).toBe(true)
    expect(score.missing).toEqual([])
    expect(score.composite).toBeDefined()

    // Weighted mean of the normalized parts, computed by hand.
    const totalWeight = score.parts.reduce((sum, p) => sum + p.weight, 0)
    const expected =
      score.parts.reduce((sum, p) => sum + p.normalized * p.weight, 0) / totalWeight
    expect(score.composite).toBeCloseTo(expected, 10)
    expect(score.composite).toBeCloseTo(weightedMean(score.parts) as number, 10)
  })

  it('parts carry one entry per covered core benchmark, and none for the missing ones', () => {
    const opus = LEADERBOARD.models.find((m) => m.id === 'claude-opus-5')!
    const score = scoreTrack(opus, 'general')

    expect(score.parts.map((p) => p.benchmark)).toEqual(['gpqa-diamond', 'hle'])
    for (const part of score.parts) {
      expect(part.weight).toBeGreaterThan(0)
      expect(part.normalized).toBeGreaterThan(0)
      expect(part.normalized).toBeLessThanOrEqual(100)
    }
  })

  it('coverage is the fraction of core benchmarks covered, on a 0-1 scale', () => {
    for (const slug of TRACK_IDS) {
      for (const entry of rankTrack(slug, LEADERBOARD.models).ranked) {
        expect(entry.score.coverage).toBe(1)
        expect(entry.score.coverage).toBeLessThanOrEqual(1)
      }
    }
    const opus55 = LEADERBOARD.models.find((m) => m.id === 'claude-opus-5.5')!
    expect(scoreTrack(opus55, 'coding').coverage).toBe(0)
  })
})

// ── normalization ────────────────────────────────────────────────────────

describe('normalization', () => {
  it('divides by the field best, not by 100', () => {
    const best = fieldBest('gpqa-diamond')!
    expect(best).toBe(96) // GPT-6 Astra

    const opus = LEADERBOARD.models.find((m) => m.id === 'claude-opus-5')!
    const score = scoreTrack(opus, 'general')
    const gpqa = score.parts.find((p) => p.benchmark === 'gpqa-diamond')!

    expect(gpqa.raw).toBe(93.4)
    expect(gpqa.normalized).toBeCloseTo((93.4 / best) * 100, 4)
  })

  it('the field-best holder normalizes to exactly 100', () => {
    const astra = LEADERBOARD.models.find((m) => m.id === 'gpt-6-astra')!
    const score = scoreTrack(astra, 'general')
    const gpqa = score.parts.find((p) => p.benchmark === 'gpqa-diamond')!

    expect(gpqa.raw).toBe(96)
    expect(gpqa.normalized).toBe(100)
  })

  it('fieldBest reports the highest percent score any model has', () => {
    expect(fieldBest('gpqa-diamond')).toBe(96)
    expect(fieldBest('hle')).toBe(64.4)
    expect(fieldBest('terminal-bench-4.0')).toBe(66.4)
  })

  it('fieldBestDetail names the model holding the field best', () => {
    const detail = fieldBestDetail('gpqa-diamond')!
    expect(detail.best).toBe(96)
    expect(detail.modelId).toBe('gpt-6-astra')
    expect(detail.modelName).toBe('GPT-6 Astra')
  })

  it('a benchmark with no percent score in the pool has no field best', () => {
    // BrowseComp is carried by exactly one model in the registry.
    const pool = LEADERBOARD.models.filter((m) => m.id !== 'minimax-m3' && m.id !== 'step-5-preview')
    expect(fieldBest('browsecompc', pool)).toBeUndefined()
    expect(fieldBestDetail('browsecompc', pool)).toBeUndefined()
    expect(fieldBest('browsecompc')).toBe(88.7)
  })
})

// ── the denominator is pinned ────────────────────────────────────────────

describe('field-best semantics', () => {
  it('adding a DIFFERENT model to the registry does not move anyone’s composite', () => {
    const pool = LEADERBOARD.models
    const opus = pool.find((m) => m.id === 'claude-opus-5')!
    const before = scoreTrack(opus, 'general', { models: pool }).composite

    // A new model that is worse than the field best on every core benchmark.
    const alsoRan = model('also-ran', [score('gpqa-diamond', 10), score('hle', 10)])
    const after = scoreTrack(opus, 'general', { models: [...pool, alsoRan] }).composite

    expect(after).toBe(before)
  })

  it('a new model that becomes the field best on a CORE benchmark DOES move the composite', () => {
    const pool = LEADERBOARD.models
    const opus = pool.find((m) => m.id === 'claude-opus-5')!
    const before = scoreTrack(opus, 'general', { models: pool }).composite

    // A new model that takes the GPQA crown: the denominator moved.
    const king = model('king', [score('gpqa-diamond', 99), score('hle', 10)])
    const after = scoreTrack(opus, 'general', { models: [...pool, king] }).composite

    expect(after).not.toBe(before)
  })

  it('a new model that only wins a CONTEXT benchmark does NOT move the composite', () => {
    const pool = LEADERBOARD.models
    const opus = pool.find((m) => m.id === 'claude-opus-5')!
    const before = scoreTrack(opus, 'general', { models: pool }).composite

    // `hle-tools` is context for the general track — it must stay out of the
    // denominator as well as out of the composite.
    const king = model('king', [score('hle-tools', 999), score('gpqa-diamond', 10), score('hle', 10)])
    const after = scoreTrack(opus, 'general', { models: [...pool, king] }).composite

    expect(after).toBe(before)
  })

  it('an explicit fieldBest override pins the denominator', () => {
    const opus = LEADERBOARD.models.find((m) => m.id === 'claude-opus-5')!
    const score = scoreTrack(opus, 'general', { fieldBest: () => 100 })
    const gpqa = score.parts.find((p) => p.benchmark === 'gpqa-diamond')!

    expect(gpqa.normalized).toBe(93.4)
  })
})

// ── units ────────────────────────────────────────────────────────────────

describe('benchmark units', () => {
  it('a rating benchmark has no field best and can never enter a composite', () => {
    expect(findBenchmark('codeforces')?.unit).toBe('rating')
    expect(fieldBest('codeforces')).toBeUndefined()
    expect(fieldBestDetail('codeforces')).toBeUndefined()

    const core: TrackBenchmark[] = [{ id: 'codeforces', weight: 1 }]
    const deepseek = LEADERBOARD.models.find((m) => m.id === 'deepseek-v4.1-flash')!
    const score = scoreAgainstCore(deepseek, core)

    expect(score.complete).toBe(false)
    expect(score.composite).toBeUndefined()
    expect(score.missing).toEqual(['codeforces'])
    expect(score.parts).toEqual([])
  })

  it('no track has a rating benchmark in its core set', () => {
    for (const slug of TRACK_IDS) {
      for (const core of TRACKS[slug].core) {
        expect(findBenchmark(core.id)?.unit).toBe('percent')
      }
    }
  })

  it('a rating score is reported in context in its own unit, never normalized', () => {
    const deepseek = LEADERBOARD.models.find((m) => m.id === 'deepseek-v4.1-flash')!
    const context = contextScores(deepseek, 'general')
    const codeforces = context.find((c) => c.benchmark === 'codeforces')!

    expect(codeforces.unit).toBe('rating')
    expect(codeforces.raw).toBe(3471)
    expect(codeforces.normalized).toBeUndefined()
  })
})

// ── registry coverage ────────────────────────────────────────────────────

describe('rankTrack', () => {
  it('every registry model lands in exactly one of ranked / incomplete, for every track', () => {
    for (const slug of TRACK_IDS) {
      const ranking = rankTrack(slug, LEADERBOARD.models)
      const ranked = byId(ranking.ranked)
      const incomplete = byId(ranking.incomplete)

      expect(new Set([...ranked, ...incomplete]).size).toBe(LEADERBOARD.models.length)
      expect(ranked.length + incomplete.length).toBe(LEADERBOARD.models.length)
      expect(ranked.filter((id) => incomplete.includes(id))).toEqual([])
      expect(incomplete.filter((id) => ranked.includes(id))).toEqual([])
      expect([...ranked, ...incomplete].sort()).toEqual(
        LEADERBOARD.models.map((m) => m.id).sort(),
      )
    }
  })

  it('ranks complete models by composite score, best first', () => {
    for (const slug of TRACK_IDS) {
      const { ranked } = rankTrack(slug, LEADERBOARD.models)
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1].score.composite!).toBeGreaterThanOrEqual(
          ranked[i].score.composite!,
        )
      }
    }
  })

  it('every ranked model has a composite and every incomplete model has none', () => {
    for (const slug of TRACK_IDS) {
      const { ranked, incomplete } = rankTrack(slug, LEADERBOARD.models)
      for (const entry of ranked) {
        expect(entry.score.complete).toBe(true)
        expect(entry.score.composite).toBeDefined()
        expect(entry.score.missing).toEqual([])
      }
      for (const entry of incomplete) {
        expect(entry.score.complete).toBe(false)
        expect(entry.score.composite).toBeUndefined()
        expect(entry.score.missing.length).toBeGreaterThan(0)
      }
    }
  })

  it('a track with no complete model ranks nobody rather than ranking a partial average', () => {
    const one = model('lonely', [score('gpqa-diamond', 90)])
    const ranking = rankTrack('general', [one])

    expect(ranking.ranked).toEqual([])
    expect(ranking.incomplete).toHaveLength(1)
    expect(ranking.incomplete[0].score.composite).toBeUndefined()
  })
})

// ── sources ──────────────────────────────────────────────────────────────

describe('sources', () => {
  it('every source url cited by a score is registered', () => {
    const missing: string[] = []
    for (const model of LEADERBOARD.models) {
      for (const s of model.scores) {
        if (!s.sourceUrl || !SOURCES[s.sourceUrl]) missing.push(`${model.id} → ${s.sourceUrl}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('findSource resolves a url and returns undefined for an unknown one', () => {
    expect(findSource('https://www.anthropic.com/news/claude-opus-5-5')?.kind).toBe('vendor')
    expect(findSource('https://example.com/nope')).toBeUndefined()
    expect(findSource(undefined)).toBeUndefined()
  })
})
