import { describe, expect, it } from 'vitest'
import { REGISTRY } from '@/features/calculator/model-prices'
import type { ModelPrice } from '@/features/calculator/types'
import { LEADERBOARD } from '@/features/leaderboard/models'
import type { LeaderboardModel } from '@/features/leaderboard/types'
import { LEDGER } from '@/features/records/ledger'
import { explainingChange, recordMismatches } from '@/features/records/pins'
import type { RecordEntry } from '@/features/records/types'

/**
 * The record ledger guard.
 *
 * The rule it protects: **a new iteration is a new record; a published
 * record does not change.**
 *
 * A checkpoint that only changes a suffix (DeepSeek's V4.1-Flash `-0910` →
 * `-1017`) is still a new model version: new REGISTRY row, new LEADERBOARD
 * row, new release post, new ledger entry. Old data is not edited in place —
 * it is retired, and its numbers are pinned here. The only way a pinned
 * value changes is a logged change: a recording error, or a new measurement
 * of the same weights.
 *
 * See `src/features/records/README.md` for the workflow.
 */

const priceIds = new Set(REGISTRY.models.map((m) => m.id))
const scoreIds = new Set(LEADERBOARD.models.map((m) => m.id))

function findPrice(id: string | undefined): ModelPrice | undefined {
  if (!id) return undefined
  return REGISTRY.models.find((m) => m.id === id)
}

function findScores(id: string | undefined): LeaderboardModel | undefined {
  if (!id) return undefined
  return LEADERBOARD.models.find((m) => m.id === id)
}

/** The record an entry supersedes, looked up by score id or price id. */
function supersededEntry(entry: RecordEntry): RecordEntry | undefined {
  if (!entry.supersedes) return undefined
  return LEDGER.find(
    (e) => e.scoreId === entry.supersedes || e.priceId === entry.supersedes,
  )
}

/** A record is retired once it has a retirement date or a non-active price row. */
function isRetiredRecord(entry: RecordEntry): boolean {
  if (entry.retiredAt) return true
  const price = findPrice(entry.priceId)
  return price != null && price.status !== 'active'
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

describe('record ledger', () => {
  it('registers every registry model and every leaderboard row', () => {
    const claimedPrice = new Map<string, string>()
    const claimedScore = new Map<string, string>()
    for (const entry of LEDGER) {
      if (entry.priceId) {
        expect(
          claimedPrice.has(entry.priceId),
          `the price row "${entry.priceId}" is claimed by two records: ` +
            `"${claimedPrice.get(entry.priceId)}" and "${entry.label}"`,
        ).toBe(false)
        claimedPrice.set(entry.priceId, entry.label)
      }
      if (entry.scoreId) {
        expect(
          claimedScore.has(entry.scoreId),
          `the leaderboard row "${entry.scoreId}" is claimed by two records: ` +
            `"${claimedScore.get(entry.scoreId)}" and "${entry.label}"`,
        ).toBe(false)
        claimedScore.set(entry.scoreId, entry.label)
      }
    }

    const missingPrices = REGISTRY.models
      .filter((m) => !claimedPrice.has(m.id))
      .map((m) => m.id)
    expect(
      missingPrices,
      'every price row needs a ledger entry — a new model version is a new record, not an edit of an old one',
    ).toEqual([])

    const missingScores = LEADERBOARD.models
      .filter((m) => !claimedScore.has(m.id))
      .map((m) => m.id)
    expect(
      missingScores,
      'every leaderboard row needs a ledger entry — a new model version is a new record, not an edit of an old one',
    ).toEqual([])
  })

  it('points at records that exist', () => {
    for (const entry of LEDGER) {
      if (entry.priceId) {
        expect(priceIds.has(entry.priceId), `${entry.label}: unknown priceId "${entry.priceId}"`).toBe(true)
      }
      if (entry.scoreId) {
        expect(scoreIds.has(entry.scoreId), `${entry.label}: unknown scoreId "${entry.scoreId}"`).toBe(true)
      }
      if (entry.supersedes) {
        expect(
          supersededEntry(entry),
          `${entry.label}: supersedes "${entry.supersedes}", which is not a record in the ledger`,
        ).toBeDefined()
      }
      if (entry.introduced) {
        expect(entry.introduced, `${entry.label}: introduced is not an ISO date`).toMatch(ISO_DATE)
      }
      if (entry.retiredAt) {
        expect(entry.retiredAt, `${entry.label}: retiredAt is not an ISO date`).toMatch(ISO_DATE)
        if (entry.introduced) {
          expect(
            entry.retiredAt >= entry.introduced,
            `${entry.label}: retired before it was introduced`,
          ).toBe(true)
        }
      }
    }
  })

  it('keeps every pinned value as published', () => {
    for (const entry of LEDGER) {
      const mismatches = recordMismatches(entry)
      const unexplained = mismatches.filter((m) => !explainingChange(entry, m))
      expect(
        unexplained.map((m) => `${m.field}: ${m.pinned} → ${m.live}`),
        `${entry.label} — a published record changed without a logged change. ` +
          'If this is a new model version (even one that only changes a suffix), add a NEW record: ' +
          'a new REGISTRY id, a new LEADERBOARD id, a new release post and a new ledger entry, ' +
          'and retire the old one. If it is a recording error, log it in the entry\'s `changes` ' +
          '(kind: "correction") with the reason and the source. See src/features/records/README.md.',
      ).toEqual([])
    }
  })

  it('explains every logged change', () => {
    for (const entry of LEDGER) {
      for (const change of entry.changes ?? []) {
        expect(change.date, `${entry.label}: change without a date`).toMatch(ISO_DATE)
        expect(change.reason, `${entry.label}: change without a reason`).toBeTruthy()
        expect(change.sourceUrl, `${entry.label}: change without a source`).toBeTruthy()
        expect(
          ['correction', 'remeasurement'],
          `${entry.label}: unknown change kind "${change.kind}"`,
        ).toContain(change.kind)
        if (isRetiredRecord(entry)) {
          expect(
            change.kind,
            `${entry.label} is retired — its numbers are frozen, so only a correction ` +
              '(a recording error) may change them, not a re-measurement',
          ).toBe('correction')
        }
      }
    }
  })

  it('retires the record a new version supersedes', () => {
    for (const entry of LEDGER) {
      if (!entry.supersedes) continue
      const previous = supersededEntry(entry)
      expect(previous, `${entry.label}: supersedes an unknown record`).toBeDefined()
      if (!previous) continue

      expect(
        isRetiredRecord(previous),
        `${entry.label} supersedes ${previous.label}, but ${previous.label} is not retired — ` +
          'a replaced record must be retired, never left active and rewritten',
      ).toBe(true)

      if (entry.introduced && previous.retiredAt) {
        expect(
          entry.introduced >= previous.retiredAt,
          `${entry.label} was introduced before ${previous.label} retired`,
        ).toBe(true)
      }
    }
  })

  it('never leaves a retired record with an active price row', () => {
    for (const entry of LEDGER) {
      if (!entry.retiredAt) continue
      const price = findPrice(entry.priceId)
      if (!price) continue
      expect(
        price.status,
        `${entry.label} is retired but its price row is "${price.status}" — ` +
          'a retired checkpoint must not look purchasable',
      ).not.toBe('active')
    }
  })

  it('keeps version tokens unique inside a model family', () => {
    const seen = new Map<string, string>()
    for (const entry of LEDGER) {
      const scores = findScores(entry.scoreId)
      if (!scores) continue
      const price = findPrice(entry.priceId)
      const family = price?.family ?? `vendor:${scores.vendor}`
      const key = `${family}::${scores.version}`
      expect(
        seen.has(key),
        `the version token "${scores.version}" is used by two records in the family ` +
          `"${family}": "${seen.get(key)}" and "${entry.label}". A new checkpoint needs its own ` +
          'token (e.g. v4.1-flash-1017) and its own record.',
      ).toBe(false)
      seen.set(key, entry.label)
    }
  })
})
