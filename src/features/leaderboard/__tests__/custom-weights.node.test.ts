import { describe, expect, it } from 'vitest'
import {
  computeCustomRanking,
  computePriceIndex,
  DEFAULT_CUSTOM_PRICE_WEIGHT,
  DEFAULT_CUSTOM_WEIGHTS,
  PRICE_AXIS,
  type CustomWeights,
} from '@/features/leaderboard/custom-weights'
import { LEADERBOARD } from '@/features/leaderboard/models'
import {
  rankTrack,
  scoreAgainstCore,
  TRACKS,
  TRACK_IDS,
  type TrackSlug,
} from '@/features/leaderboard/scoring'
import type { LeaderboardModel } from '@/features/leaderboard/types'

/**
 * The custom-weight board's contract.
 *
 * The custom board is where the reader picks the axes, so it is where a
 * partial average is most tempting. These tests pin the same promise the
 * fixed boards make:
 *
 *  1. A model is ranked only if it was measured on EVERY weighted axis.
 *  2. Every ranked model is divided by the SAME denominator.
 *  3. A model that fails the gate is not ranked — it is listed, with the
 *     axes it is missing named.
 *  4. Adding a model never moves anybody else's score.
 */

const NO_TRACKS: CustomWeights = { general: 0, coding: 0, agent: 0, reasoning: 0 }

/** A copy of a model with one track's benchmarks removed from its scores. */
function withoutTrack(model: LeaderboardModel, track: TrackSlug): LeaderboardModel {
  const ids = new Set(TRACKS[track].core.map((core) => core.id))
  return {
    ...model,
    id: `test-only-${model.id}-without-${track}`,
    scores: model.scores.filter((score) => !ids.has(score.benchmark)),
  }
}

/** A model that is measured on the general board and on the coding board. */
function aFullyMeasuredModel(): LeaderboardModel {
  const model = LEADERBOARD.models.find(
    (m) =>
      scoreAgainstCore(m, TRACKS.general.core).complete &&
      scoreAgainstCore(m, TRACKS.coding.core).complete,
  )
  if (!model) throw new Error('the registry should hold a model measured on general + coding')
  return model
}

describe('the custom-weight board', () => {
  it('ranks a model only if it was measured on every weighted board', () => {
    const weights: CustomWeights = { general: 50, coding: 30, agent: 20, reasoning: 0 }
    const ranking = computeCustomRanking(weights, 0)

    expect(ranking.ranked.length).toBeGreaterThan(0)
    for (const row of ranking.ranked) {
      for (const slug of ranking.activeTracks) {
        const score = scoreAgainstCore(row.model, TRACKS[slug].core)
        expect(
          score.complete,
          `${row.model.displayName} is ranked but is missing a core benchmark of ${slug}`,
        ).toBe(true)
        expect(score.missing).toEqual([])
        expect(score.composite).toBeDefined()
      }
    }
  })

  it('gives every ranked model the same denominator', () => {
    const ranking = computeCustomRanking(DEFAULT_CUSTOM_WEIGHTS, DEFAULT_CUSTOM_PRICE_WEIGHT)

    // One denominator for the whole board: the total weight of the active
    // axes. Never a per-model divisor.
    const expected =
      DEFAULT_CUSTOM_WEIGHTS.general +
      DEFAULT_CUSTOM_WEIGHTS.coding +
      DEFAULT_CUSTOM_WEIGHTS.agent +
      DEFAULT_CUSTOM_WEIGHTS.reasoning +
      DEFAULT_CUSTOM_PRICE_WEIGHT
    expect(ranking.denominator).toBe(expected)
    expect(new Set(ranking.ranked.map((row) => row.denominator)).size).toBe(1)
    for (const row of ranking.ranked) {
      expect(row.denominator).toBe(ranking.denominator)
      // The score is exactly the weighted sum over that shared denominator.
      const sum = row.parts.reduce((acc, part) => acc + part.value * part.weight, 0)
      expect(row.score).toBeCloseTo(sum / row.denominator, 10)
    }
  })

  it('ranks a single weighted board exactly as that board ranks it', () => {
    for (const slug of TRACK_IDS) {
      const weights: CustomWeights = { general: 0, coding: 0, agent: 0, reasoning: 0 }
      weights[slug] = 100

      const custom = computeCustomRanking(weights, 0)
      const board = rankTrack(TRACKS[slug])

      // Same models, same order, same numbers: weighting one board must
      // reproduce that board, not a parallel ranking of its own.
      expect(custom.ranked.map((row) => row.model.id)).toEqual(
        board.ranked.map((entry) => entry.model.id),
      )
      for (const row of custom.ranked) {
        const entry = board.ranked.find((e) => e.model.id === row.model.id)
        expect(row.score).toBeCloseTo(entry?.score.composite as number, 6)
      }
    }
  })

  it('does not rank a model that is missing a weighted board, and names that board', () => {
    const full = aFullyMeasuredModel()
    const thin = withoutTrack(full, 'coding')
    const models = [full, thin]
    const ranking = computeCustomRanking(
      { general: 50, coding: 50, agent: 0, reasoning: 0 },
      0,
      { models },
    )

    expect(ranking.ranked.map((row) => row.model.id)).toEqual([full.id])

    const unranked = ranking.unranked.find((row) => row.model.id === thin.id)
    expect(unranked).toBeDefined()
    // The missing board is named, and the model carries no score at all.
    expect(unranked!.missing).toContain('coding')
    expect(unranked!.missing.length).toBeGreaterThan(0)
  })

  it('does not move anyone else’s score when a model that is missing a board is added', () => {
    const weights: CustomWeights = { general: 50, coding: 50, agent: 0, reasoning: 0 }
    const full = aFullyMeasuredModel()
    const thin = withoutTrack(full, 'coding')

    const before = computeCustomRanking(weights, 0)
    const after = computeCustomRanking(weights, 0, { models: [...LEADERBOARD.models, thin] })

    const beforeScores = new Map(before.ranked.map((row) => [row.model.id, row.score]))
    expect(after.ranked.length).toBe(before.ranked.length)
    for (const row of after.ranked) {
      expect(row.score, `${row.model.displayName} moved when a thin model was added`).toBe(
        beforeScores.get(row.model.id),
      )
    }

    // The newcomer is listed, not ranked.
    expect(after.ranked.find((row) => row.model.id === thin.id)).toBeUndefined()
    expect(after.unranked.find((row) => row.model.id === thin.id)?.missing).toContain('coding')
  })

  it('does not rank a model with no price while the price axis is on', () => {
    const ranking = computeCustomRanking(
      { ...NO_TRACKS, general: 50 },
      DEFAULT_CUSTOM_PRICE_WEIGHT,
    )

    const withoutPrice = ranking.unranked.filter((row) => row.missing.includes(PRICE_AXIS))
    expect(
      withoutPrice.length,
      'the registry should hold a model with no published price',
    ).toBeGreaterThan(0)
    for (const row of withoutPrice) {
      expect(ranking.ranked.find((ranked) => ranked.model.id === row.model.id)).toBeUndefined()
    }

    // The price axis is only the reason those models are out: with the price
    // weight at zero, the ones that are measured on general come back.
    const withoutPriceAxis = computeCustomRanking({ ...NO_TRACKS, general: 50 }, 0)
    for (const row of withoutPrice) {
      const back = withoutPriceAxis.ranked.find((ranked) => ranked.model.id === row.model.id)
      if (back) {
        expect(withoutPriceAxis.unranked.find((r) => r.model.id === row.model.id)).toBeUndefined()
      }
    }

    // And the price axis really is in play: every ranked row carries a price part.
    for (const row of ranking.ranked) {
      const part = row.parts.find((p) => p.axis === PRICE_AXIS)
      expect(part, `${row.model.displayName} is ranked without a price part`).toBeDefined()
      expect(part!.value).toBeGreaterThanOrEqual(0)
      expect(part!.value).toBeLessThanOrEqual(100)
    }
  })

  it('never lets a thinly-measured model outrank a fully-measured one', () => {
    // The regression this gate exists for: under the old rule (a per-model
    // divisor) GPT-6 Astra came FIRST on 50 of 125 weight, ahead of models
    // measured on everything.
    const oldDefault: CustomWeights = { general: 25, coding: 25, agent: 25, reasoning: 25 }
    const ranking = computeCustomRanking(oldDefault, 25)

    const astra = ranking.ranked.find((row) => row.model.id === 'gpt-6-astra')
    expect(astra, 'GPT-6 Astra must not be ranked on a board it was not measured on').toBeUndefined()

    const unranked = ranking.unranked.find((row) => row.model.id === 'gpt-6-astra')
    expect(unranked).toBeDefined()
    expect(unranked!.missing).toEqual(['coding', 'agent', 'reasoning'])

    // And the property itself: no unranked model carries a score, so none of
    // them can sit above a ranked one.
    for (const row of ranking.unranked) {
      expect(ranking.ranked.find((ranked) => ranked.model.id === row.model.id)).toBeUndefined()
    }
  })

  it('opens with a default that ranks a useful number of models and keeps the price axis', () => {
    const ranking = computeCustomRanking(DEFAULT_CUSTOM_WEIGHTS, DEFAULT_CUSTOM_PRICE_WEIGHT)

    // A ranking, not a handful of rows — and not the whole registry either.
    expect(ranking.ranked.length).toBeGreaterThanOrEqual(4)
    expect(ranking.ranked.length).toBeLessThan(LEADERBOARD.models.length)

    // The price axis is in play: it carries a real share of the weight.
    expect(ranking.priceWeight).toBe(DEFAULT_CUSTOM_PRICE_WEIGHT)
    expect(ranking.priceWeight).toBeGreaterThan(0)
    expect(ranking.activeAxes).toContain(PRICE_AXIS)
    expect(ranking.activeAxes).toContain('general')
    // And a capability board is in play, so the board is a blend and not
    // just a price list.
    expect(ranking.activeTracks.length).toBeGreaterThan(0)
  })

  it('prices the axis logarithmically, cheapest = 100, most expensive = 0', () => {
    const index = computePriceIndex()
    expect(index.size).toBeGreaterThan(0)

    const values = [...index.values()]
    expect(Math.max(...values)).toBeCloseTo(100, 6)
    expect(Math.min(...values)).toBeCloseTo(0, 6)
  })

  it('prices the axis on the dated band, not on the registry base rate', () => {
    // gpt-5.6-sol has a promotional band ($4 / $20) and a standard band
    // ($5 / $30) from 2026-11-22. The axis must follow the band in force.
    const duringPromo = computePriceIndex(LEADERBOARD.models, new Date('2026-10-20'))
    const afterPromo = computePriceIndex(LEADERBOARD.models, new Date('2026-12-01'))

    const promo = duringPromo.get('gpt-5.6-sol')
    const standard = afterPromo.get('gpt-5.6-sol')
    expect(promo).toBeDefined()
    expect(standard).toBeDefined()
    // A higher real rate is a more expensive model, so it scores LOWER.
    expect(standard!).toBeLessThan(promo!)
  })
})
