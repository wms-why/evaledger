import { REGISTRY } from '@/features/calculator/model-prices'
import type { ModelPrice } from '@/features/calculator/types'
import { LEADERBOARD } from '@/features/leaderboard/models'
import type { LeaderboardModel } from '@/features/leaderboard/types'
import type { PricePin, RecordEntry } from './types'

/**
 * The live side of the record ledger: what the registries hold *right now*.
 *
 * The ledger pins what we published; this module reads what is live and
 * reports the two side by side. The guard test turns the difference into a
 * build failure unless the record's change log explains it.
 */

/** A pinned value that no longer matches the live registry. */
export interface PinMismatch {
  /** `scores.hle`, `notes.hle`, `prices.input`, `identity.version` … */
  field: string
  /** The value we published. */
  pinned: string
  /** The value the registry holds now. */
  live: string
}

const ABSENT = '(absent)'

function findPrice(id: string | undefined): ModelPrice | undefined {
  if (!id) return undefined
  return REGISTRY.models.find((m) => m.id === id)
}

function findScores(id: string | undefined): LeaderboardModel | undefined {
  if (!id) return undefined
  return LEADERBOARD.models.find((m) => m.id === id)
}

/** The price line of a registry entry, in the shape the ledger pins. */
export function livePricePin(model: ModelPrice): PricePin {
  const pin: PricePin = {
    input: model.inputPricePer1M,
    output: model.outputPricePer1M,
    context: model.contextWindow,
  }
  if (model.cachedInputPricePer1M != null) pin.cached = model.cachedInputPricePer1M
  return pin
}

/** The scores and caveats of a leaderboard row, in the shape the ledger pins. */
export function liveScorePin(model: LeaderboardModel): {
  scores: Record<string, number>
  notes: Record<string, string>
} {
  const scores: Record<string, number> = {}
  const notes: Record<string, string> = {}
  for (const s of model.scores) {
    scores[s.benchmark] = s.score
    if (s.note) notes[s.benchmark] = s.note
  }
  return { scores, notes }
}

/**
 * A record is retired once it has a `retiredAt` date — or once its price row
 * is no longer active, which is the same fact told by the registry.
 */
export function isRetired(entry: RecordEntry, price?: ModelPrice): boolean {
  if (entry.retiredAt) return true
  return price != null && price.status !== 'active'
}

function compareNumberMap(
  pinned: Record<string, number> | undefined,
  live: Record<string, number>,
  prefix: string,
): PinMismatch[] {
  const out: PinMismatch[] = []
  for (const [key, value] of Object.entries(live)) {
    const before = pinned?.[key]
    if (before === undefined) {
      out.push({ field: `${prefix}.${key}`, pinned: ABSENT, live: String(value) })
    } else if (before !== value) {
      out.push({ field: `${prefix}.${key}`, pinned: String(before), live: String(value) })
    }
  }
  for (const [key, value] of Object.entries(pinned ?? {})) {
    if (live[key] === undefined) {
      out.push({ field: `${prefix}.${key}`, pinned: String(value), live: ABSENT })
    }
  }
  return out
}

function compareStringMap(
  pinned: Record<string, string> | undefined,
  live: Record<string, string>,
  prefix: string,
): PinMismatch[] {
  const out: PinMismatch[] = []
  for (const [key, value] of Object.entries(live)) {
    const before = pinned?.[key]
    if (before === undefined) {
      out.push({ field: `${prefix}.${key}`, pinned: ABSENT, live: value })
    } else if (before !== value) {
      out.push({ field: `${prefix}.${key}`, pinned: before, live: value })
    }
  }
  for (const [key, value] of Object.entries(pinned ?? {})) {
    if (live[key] === undefined) {
      out.push({ field: `${prefix}.${key}`, pinned: value, live: ABSENT })
    }
  }
  return out
}

/**
 * Every pinned value of a record that no longer matches the registries.
 *
 * A retired record is pinned in full (scores, caveats, identity and the
 * historical price line). A live record is pinned in everything except its
 * prices: a live price moves with the vendor's billing page, and it carries
 * its own discipline (`lastVerified`, `fetchedAt`, re-read release posts).
 */
export function recordMismatches(entry: RecordEntry): PinMismatch[] {
  const out: PinMismatch[] = []

  const scores = findScores(entry.scoreId)
  if (scores) {
    const live = liveScorePin(scores)
    out.push(...compareNumberMap(entry.scores, live.scores, 'scores'))
    out.push(...compareStringMap(entry.notes, live.notes, 'notes'))
    if (entry.identity) {
      if (entry.identity.displayName !== scores.displayName) {
        out.push({
          field: 'identity.displayName',
          pinned: entry.identity.displayName,
          live: scores.displayName,
        })
      }
      if (entry.identity.version !== undefined && entry.identity.version !== scores.version) {
        out.push({
          field: 'identity.version',
          pinned: entry.identity.version,
          live: scores.version,
        })
      }
    }
  }

  const price = findPrice(entry.priceId)
  if (price) {
    if (entry.priceIdentity && entry.priceIdentity.displayName !== price.displayName) {
      out.push({
        field: 'price.displayName',
        pinned: entry.priceIdentity.displayName,
        live: price.displayName,
      })
    }
    if (isRetired(entry, price)) {
      const live = livePricePin(price)
      const pinned = entry.prices
      const slots: Array<keyof PricePin> = ['input', 'output', 'cached', 'context']
      for (const slot of slots) {
        const before = pinned?.[slot]
        const now = live[slot]
        if (now === undefined) {
          if (before !== undefined) {
            out.push({ field: `prices.${slot}`, pinned: String(before), live: ABSENT })
          }
          continue
        }
        if (before === undefined) {
          out.push({ field: `prices.${slot}`, pinned: ABSENT, live: String(now) })
        } else if (before !== now) {
          out.push({ field: `prices.${slot}`, pinned: String(before), live: String(now) })
        }
      }
    }
  }

  return out
}

/**
 * The change entry that explains a mismatch, if there is one.
 *
 * A mismatch is allowed only when the record's change log carries an entry
 * for that exact field whose `to` is the new live value — the log is the
 * review trail that says "we published this wrong" or "the source re-measured
 * it".
 */
export function explainingChange(entry: RecordEntry, mismatch: PinMismatch) {
  return (entry.changes ?? []).find(
    (c) => c.field === mismatch.field && c.to === mismatch.live,
  )
}
