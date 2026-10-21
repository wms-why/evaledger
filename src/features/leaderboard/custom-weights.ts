import { REGISTRY } from '@/features/calculator/model-prices'
import { priceDetail, registrySnapshotDate } from '@/features/calculator/pricing-detail'
import { LEADERBOARD } from './models'
import { scoreAgainstCore, TRACKS, TRACK_IDS, type TrackSlug } from './scoring'
import type { LeaderboardModel } from './types'

/**
 * The custom-weight board's arithmetic.
 *
 * The custom board is the one place where the reader chooses the axes, so it
 * is the one place where a partial average is most tempting: drop a track
 * from the weights and every model measured on fewer tracks suddenly looks
 * better. The old implementation did exactly that — it divided by the weight
 * each model happened to supply, so a model measured on one board was ranked
 * #1 over a model measured on four, and the reader could not tell.
 *
 * The rule here is the one the fixed boards already obey:
 *
 * > **A model is ranked only if it was measured on every weighted axis, and
 * > every ranked model is divided by the SAME denominator — the total weight
 * > of the active axes.**
 *
 * A model that fails the gate is not ranked and not hidden: it is listed
 * with the axes it is missing named, exactly like a "not tested" model on a
 * capability board.
 *
 * The module is PURE — no React, no `Date.now()` — so the contract is
 * pinned by the node test pool, and the page and the test compute the same
 * numbers.
 */

/** The price axis id. A model can be missing a price just like a track. */
export const PRICE_AXIS = 'price'

/** The weight the reader gave each capability board. */
export interface CustomWeights {
  general: number
  coding: number
  agent: number
  reasoning: number
}

/**
 * The default the custom board opens with: **general 50 + coding 25 +
 * price 25**.
 *
 * Why this default:
 *
 *  - **It is honest under the gate.** The old default (25 on each of the
 *    four boards plus 25 on price) qualifies only TWO models — technically
 *    correct, but a board that shows two rows on arrival reads as broken.
 *    Measured with the strict gate, this default qualifies FOUR models:
 *    enough to be a ranking, and every row is a real measurement.
 *  - **It keeps two capability boards and the price axis in play.** A
 *    custom board that opened on one axis would not be custom. General is
 *    the broadest board, coding is the one readers actually buy on, and the
 *    price axis is what turns "best model" into "best model for me" — it
 *    carries a quarter of the weight, so it is genuinely exercised.
 *  - **It is reachable with the sliders.** The step is 5, so 50/25/25 is one
 *    drag away from the middle of the range, and the published "coding 70%
 *    + price 30%" example is one drag away too — the reader just moves the
 *    sliders.
 */
export const DEFAULT_CUSTOM_WEIGHTS: CustomWeights = {
  general: 50,
  coding: 25,
  agent: 0,
  reasoning: 0,
}

/** The default price weight that goes with {@link DEFAULT_CUSTOM_WEIGHTS}. */
export const DEFAULT_CUSTOM_PRICE_WEIGHT = 25

/** One axis' contribution to a custom score. */
export interface CustomAxisPart {
  /** The axis: a track slug, or {@link PRICE_AXIS}. */
  axis: string
  /** The weight the reader gave this axis. */
  weight: number
  /** The axis value on the shared 0–100 scale. */
  value: number
}

/** A model that passed the gate, with its score on the shared denominator. */
export interface CustomRankedRow {
  model: LeaderboardModel
  /** The weighted mean over the SHARED denominator. */
  score: number
  /** One part per active axis, in axis order. */
  parts: CustomAxisPart[]
  /**
   * The denominator this row was divided by. It is the same number for every
   * ranked row — that is the whole point.
   */
  denominator: number
}

/** A model that failed the gate: not ranked, and the axes it misses. */
export interface CustomUnrankedRow {
  model: LeaderboardModel
  /** Active axes this model has no measurement for. */
  missing: string[]
}

/** The result of ranking a set of models under a set of weights. */
export interface CustomRanking {
  /** The models that passed the gate, best first. */
  ranked: CustomRankedRow[]
  /** The models that failed the gate, closest to qualifying first. */
  unranked: CustomUnrankedRow[]
  /** The track slugs that carry a weight, in registry order. */
  activeTracks: TrackSlug[]
  /** The active axes, in axis order (tracks first, then the price axis). */
  activeAxes: string[]
  /** The one denominator every ranked row is divided by. */
  denominator: number
  /** The price weight in force (0 when the price axis is off). */
  priceWeight: number
}

/** Options for {@link computeCustomRanking}. */
export interface CustomRankingOptions {
  /**
   * The model pool to rank. Defaults to the whole leaderboard registry.
   * The field bests are computed over this pool, exactly as the capability
   * boards do.
   */
  models?: readonly LeaderboardModel[]
  /**
   * The date the price axis is resolved at. Defaults to the registry
   * snapshot date (`REGISTRY.fetchedAt`) so the board is deterministic: the
   * same published data always produces the same ranking, on the server and
   * in the browser.
   */
  now?: Date
}

/**
 * Rank models under a set of custom weights.
 *
 * The gate: a model is ranked only when it has a composite on EVERY track
 * with a weight, and — when the price axis is on — a published price. A
 * model that fails the gate carries no score at all; it is listed with the
 * axes it is missing.
 *
 * The denominator: the sum of the weights of the active axes. It is
 * computed once and used for every ranked model, so no model is ever
 * averaged over a smaller set of axes than its neighbour.
 */
export function computeCustomRanking(
  weights: CustomWeights,
  priceWeight: number,
  opts: CustomRankingOptions = {},
): CustomRanking {
  const models = opts.models ?? LEADERBOARD.models
  const now = opts.now ?? registrySnapshotDate()

  const activeTracks = TRACK_IDS.filter((slug) => (weights[slug] ?? 0) > 0)
  const priceActive = priceWeight > 0

  // THE denominator. One number, shared by every ranked model.
  const denominator =
    activeTracks.reduce((sum, slug) => sum + (weights[slug] ?? 0), 0) +
    (priceActive ? priceWeight : 0)

  const activeAxes = [...activeTracks, ...(priceActive ? [PRICE_AXIS] : [])]

  if (denominator <= 0) {
    return {
      ranked: [],
      unranked: models.map((model) => ({ model, missing: [] })),
      activeTracks,
      activeAxes,
      denominator,
      priceWeight: priceActive ? priceWeight : 0,
    }
  }

  // The price axis is anchored to the published field — the whole registry —
  // so adding a model to the pool never moves anybody else's price score.
  const priceScores = computePriceIndex(LEADERBOARD.models, now)

  const ranked: CustomRankedRow[] = []
  const unranked: CustomUnrankedRow[] = []

  for (const model of models) {
    const parts: CustomAxisPart[] = []
    const missing: string[] = []
    let sum = 0

    for (const slug of activeTracks) {
      const weight = weights[slug] ?? 0
      const score = scoreAgainstCore(model, TRACKS[slug].core, { models })
      if (score.composite === undefined) {
        // A missing board is "not tested" — never zero, never a smaller
        // denominator. The model drops out of the ranking.
        missing.push(slug)
        continue
      }
      parts.push({ axis: slug, weight, value: score.composite })
      sum += score.composite * weight
    }

    if (priceActive) {
      const price = priceScores.get(model.id)
      if (price === undefined) {
        missing.push(PRICE_AXIS)
      } else {
        parts.push({ axis: PRICE_AXIS, weight: priceWeight, value: price })
        sum += price * priceWeight
      }
    }

    if (missing.length > 0) {
      unranked.push({ model, missing })
      continue
    }

    ranked.push({ model, score: sum / denominator, parts, denominator })
  }

  // Best first; ties keep the registry order (a stable sort).
  ranked.sort((a, b) => b.score - a.score)
  // Closest to qualifying first, so the near-misses sit at the top.
  unranked.sort((a, b) => a.missing.length - b.missing.length)

  return {
    ranked,
    unranked,
    activeTracks,
    activeAxes,
    denominator,
    priceWeight: priceActive ? priceWeight : 0,
  }
}

/**
 * The price axis of the custom board, on the same 0–100 scale as the
 * capability scores.
 *
 * Cheaper is better, and LLM prices span two orders of magnitude, so the
 * scale is linear in log price: the cheapest model in the field scores 100
 * and the most expensive scores 0. A linear scale would collapse every
 * model except the cheapest into a rounding error.
 *
 * The price used is the **dated band in force**, not the registry's base
 * rate: `priceDetail()` resolves the band whose `[from, until]` range
 * contains the date and returns the effective input/output rates, so the
 * axis quotes the rate a reader would actually be charged. (A promotion
 * that has ended is not a price the board should still be scoring.)
 */
export function computePriceIndex(
  models: readonly LeaderboardModel[] = LEADERBOARD.models,
  now: Date = registrySnapshotDate(),
): Map<string, number> {
  const prices = models
    .map((model) => {
      const price = model.priceId
        ? REGISTRY.models.find((m) => m.id === model.priceId)
        : undefined
      if (!price) return undefined
      const detail = priceDetail(price, now)
      return { id: model.id, blended: (detail.input + detail.output) / 2 }
    })
    .filter((entry): entry is { id: string; blended: number } => entry !== undefined)

  if (prices.length === 0) return new Map()
  const min = Math.log(Math.min(...prices.map((p) => p.blended)))
  const max = Math.log(Math.max(...prices.map((p) => p.blended)))
  const span = max - min

  const out = new Map<string, number>()
  for (const price of prices) {
    if (span <= 0) {
      out.set(price.id, 100)
      continue
    }
    out.set(price.id, 100 * (max - Math.log(price.blended)) / span)
  }
  return out
}
