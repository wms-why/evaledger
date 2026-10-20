import { describe, expect, it } from 'vitest'
import { REGISTRY } from '@/features/calculator/model-prices'
import type { ModelPrice } from '@/features/calculator/types'
import { findLeaderboardModel } from '@/features/leaderboard/models'
import type { LeaderboardModel } from '@/features/leaderboard/types'
import {
  compareVersions,
  seriesRow,
  seriesRows,
  seriesScoreModels,
  seriesStep,
  seriesSteps,
  seriesVerdict,
} from '@/features/series/data'
import type { SeriesRow } from '@/features/series/data'
import { FAMILY_EXCLUSIONS, SERIES } from '@/features/series/series'
import {
  allSeriesPairs,
  findSeries,
  findSeriesMember,
  findSeriesPair,
  listSeries,
  pairSlug,
  parsePairSlug,
  seriesForPriceId,
  seriesForScoreId,
  seriesPairs,
} from '@/features/series/select'
import { SERIES_TIER_ORDER } from '@/features/series/series'
import type { Series } from '@/features/series/types'

/**
 * Integrity guard for the *series* surface — one vendor product line, every
 * version of it side by side.
 *
 * A series carries only keys: a member list of REGISTRY / LEADERBOARD ids.
 * Everything a series page shows is resolved at render time, so the registry
 * and the series registry can drift apart silently. This file makes that
 * drift loud:
 *
 *  1. slugs are unique and URL-safe;
 *  2. every series has at least two members, with unique, pair-safe keys;
 *  3. every member points at a price row / a score row that exist;
 *  4. every member stays inside the family of its series;
 *  5. versions run newest-first (numeric segments never increase);
 *  6. **no version of a family is silently dropped** — every REGISTRY model
 *     of a series family is a member, and every family that is *not* a
 *     series is listed in `FAMILY_EXCLUSIONS` with a real reason;
 *  7. pair URLs round-trip and never leak across series;
 *  8. the live rows and the ladder steps agree with the registries.
 */

// ── helpers ──────────────────────────────────────────────────────────────

const PRICE_BY_ID = new Map<string, ModelPrice>(REGISTRY.models.map((m) => [m.id, m]))

/** Every REGISTRY model of one family. */
function registryFamily(family: string): ModelPrice[] {
  return REGISTRY.models.filter((m) => m.family === family)
}

/** (input + output) / 2 — the number the ladder ranks "cheapest" by. */
function blended(price: ModelPrice): number {
  return (price.inputPricePer1M + price.outputPricePer1M) / 2
}

/** A dotted numeric version as segments: "5.5" → [5, 5]. */
function versionSegments(version: string): number[] {
  return version.split('.').map((part) => {
    const value = Number(part)
    expect(Number.isFinite(value), `version "${version}" is not a dotted number`).toBe(true)
    return value
  })
}

/** Every unordered pair of a series, as `[memberA, memberB]`. */
function memberPairs(series: Series): Array<[string, string]> {
  const pairs: Array<[string, string]> = []
  for (let i = 0; i < series.members.length; i++) {
    for (let j = i + 1; j < series.members.length; j++) {
      pairs.push([series.members[i]!.key, series.members[j]!.key])
    }
  }
  return pairs
}

/**
 * The LEADERBOARD row behind a scored row.
 *
 * Every `scoreId` is checked to exist by the registry guard above, so the row
 * is always there — the assertion keeps that guarantee local to this helper.
 */
function modelOf(row: SeriesRow): LeaderboardModel {
  const model = row.scoreId ? findLeaderboardModel(row.scoreId) : undefined
  expect(model, `row "${row.key}" has no leaderboard model`).toBeDefined()
  return model as LeaderboardModel
}

const PRICE_SLOT_FIELD = {
  input: 'inputPricePer1M',
  output: 'outputPricePer1M',
  cached: 'cachedInputPricePer1M',
} as const

// ── 1–8: the registry contract ───────────────────────────────────────────

describe('series registry', () => {
  it('has unique, URL-safe slugs', () => {
    const seen = new Set<string>()
    for (const series of SERIES) {
      expect(series.slug, `slug "${series.slug}" is not URL-safe`).toMatch(/^[a-z0-9-]+$/)
      expect(seen.has(series.slug), `duplicate series slug "${series.slug}"`).toBe(false)
      seen.add(series.slug)
    }
  })

  it('gives every series at least two members', () => {
    for (const series of SERIES) {
      expect(
        series.members.length,
        `series "${series.slug}" has ${series.members.length} member(s) — a series needs at least two`,
      ).toBeGreaterThanOrEqual(2)
    }
  })

  it('keeps member keys unique inside a series and free of the pair separator', () => {
    for (const series of SERIES) {
      const seen = new Set<string>()
      for (const member of series.members) {
        expect(
          member.key.includes('-vs-'),
          `member key "${member.key}" of series "${series.slug}" contains the pair separator "-vs-"`,
        ).toBe(false)
        expect(
          seen.has(member.key),
          `duplicate member key "${member.key}" in series "${series.slug}"`,
        ).toBe(false)
        seen.add(member.key)
      }
    }
  })

  it('points every member at a price row and a score row that exist', () => {
    for (const series of SERIES) {
      for (const member of series.members) {
        if (member.priceId) {
          expect(
            PRICE_BY_ID.has(member.priceId),
            `series "${series.slug}" member "${member.key}" points at unknown REGISTRY model "${member.priceId}"`,
          ).toBe(true)
        }
        if (member.scoreId) {
          expect(
            findLeaderboardModel(member.scoreId),
            `series "${series.slug}" member "${member.key}" points at unknown LEADERBOARD model "${member.scoreId}"`,
          ).toBeDefined()
        }
      }
    }
  })

  it('keeps every member inside the family of its series', () => {
    for (const series of SERIES) {
      for (const member of series.members) {
        if (!member.priceId) continue
        const price = PRICE_BY_ID.get(member.priceId)!
        expect(
          price.family,
          `series "${series.slug}" (family "${series.family}") member "${member.key}" uses ` +
            `"${member.priceId}", whose family is "${price.family}"`,
        ).toBe(series.family)
      }
    }
  })

  it('orders equal versions by tier', () => {
    for (const series of SERIES) {
      for (let i = 1; i < series.members.length; i++) {
        const previous = series.members[i - 1]!
        const current = series.members[i]!
        if (compareVersions(current.version, previous.version) !== 0) continue
        // Same version: the tier decides — flagship first, then balanced,
        // fast, lite. Two members may share a tier (two flagships of one
        // generation); going down the ladder the tier may only move DOWN.
        expect(
          SERIES_TIER_ORDER.indexOf(current.tier),
          `series "${series.slug}" lists "${current.key}" (${current.tier}) before ` +
            `"${previous.key}" (${previous.tier}) although both are version ${current.version}`,
        ).toBeGreaterThanOrEqual(SERIES_TIER_ORDER.indexOf(previous.tier))
      }
    }
  })

  it('gives every member a dotted numeric version', () => {
    for (const series of SERIES) {
      for (const member of series.members) {
        expect(
          versionSegments(member.version),
          `series "${series.slug}" member "${member.key}" has the version "${member.version}", ` +
            `which is not a dotted number`,
        ).not.toHaveLength(0)
      }
    }
  })

  it('orders versions newest-first', () => {
    for (const series of SERIES) {
      for (let i = 1; i < series.members.length; i++) {
        const previous = series.members[i - 1]!
        const current = series.members[i]!
        expect(
          compareVersions(current.version, previous.version),
          `series "${series.slug}" is not newest-first: "${current.key}" (${current.version}) ` +
            `follows "${previous.key}" (${previous.version})`,
        ).toBeLessThanOrEqual(0)
      }
    }
  })

  it('covers every REGISTRY model of its family', () => {
    for (const series of SERIES) {
      const memberPriceIds = new Set(series.members.map((m) => m.priceId))
      for (const model of registryFamily(series.family)) {
        expect(
          memberPriceIds.has(model.id),
          `series "${series.slug}" drops "${model.id}" (family "${series.family}") — ` +
            `add it as a member or list the family in FAMILY_EXCLUSIONS`,
        ).toBe(true)
      }
    }
  })

  it('gives every excluded family a real reason and a real family of at least two models', () => {
    for (const family of Object.keys(FAMILY_EXCLUSIONS)) {
      const models = registryFamily(family)
      expect(
        models.length,
        `FAMILY_EXCLUSIONS lists "${family}", which has no REGISTRY model at all`,
      ).toBeGreaterThanOrEqual(2)
      expect(
        FAMILY_EXCLUSIONS[family],
        `FAMILY_EXCLUSIONS["${family}"] has no reason`,
      ).toBeTruthy()
    }
  })

  it('leaves no multi-model family without a series or an exclusion', () => {
    const seriesFamilies = new Set(SERIES.map((s) => s.family))
    const families = new Set(REGISTRY.models.map((m) => m.family))
    for (const family of families) {
      if (registryFamily(family).length < 2) continue
      expect(
        seriesFamilies.has(family) || family in FAMILY_EXCLUSIONS,
        `family "${family}" has ${registryFamily(family).length} REGISTRY models but is neither ` +
          `a series nor listed in FAMILY_EXCLUSIONS`,
      ).toBe(true)
    }
  })

  it('claims every family with at most one series', () => {
    const owners = new Map<string, string>()
    for (const series of SERIES) {
      const owner = owners.get(series.family)
      expect(
        owner,
        `family "${series.family}" is claimed by both "${owner}" and "${series.slug}"`,
      ).toBeUndefined()
      owners.set(series.family, series.slug)
    }
  })
})

// ── 9: pair URLs ─────────────────────────────────────────────────────────

describe('series pairs', () => {
  it('round-trips every pair slug', () => {
    for (const series of SERIES) {
      for (const [a, b] of memberPairs(series)) {
        const slug = pairSlug(a, b)
        const parsed = parsePairSlug(slug)
        expect(parsed, `pair slug "${slug}" of series "${series.slug}" does not parse`).not.toBeNull()
        expect(
          [...(parsed as [string, string])].sort(),
          `pair slug "${slug}" of series "${series.slug}" does not round-trip to its members`,
        ).toEqual([a, b].sort())
        expect(pairSlug(parsed![0], parsed![1])).toBe(slug)
      }
    }
  })

  it('resolves both word orders of a pair to the same members', () => {
    for (const series of SERIES) {
      for (const [a, b] of memberPairs(series)) {
        const forward = findSeriesPair(series, `${a}-vs-${b}`)
        const reverse = findSeriesPair(series, `${b}-vs-${a}`)
        expect(
          forward,
          `series "${series.slug}" does not resolve the pair "${a}-vs-${b}"`,
        ).toBeDefined()
        expect(
          reverse,
          `series "${series.slug}" does not resolve the pair "${b}-vs-${a}"`,
        ).toBeDefined()
        expect(
          [...forward!.map((m) => m.key)].sort(),
          `series "${series.slug}" resolves "${a}-vs-${b}" and "${b}-vs-${a}" differently`,
        ).toEqual([a, b].sort())
      }
    }
  })

  it('does not resolve a member key of another series', () => {
    for (const series of SERIES) {
      const ownKeys = new Set(series.members.map((m) => m.key))
      for (const other of SERIES) {
        if (other.slug === series.slug) continue
        for (const foreign of other.members) {
          if (ownKeys.has(foreign.key)) continue
          for (const own of series.members) {
            const slug = pairSlug(foreign.key, own.key)
            expect(
              findSeriesPair(series, slug),
              `series "${series.slug}" resolves "${slug}", which mixes the member "${foreign.key}" ` +
                `of series "${other.slug}"`,
            ).toBeUndefined()
          }
        }
      }
    }
  })

  it('lists every pair exactly once', () => {
    const listed = allSeriesPairs()
    expect(listed.length).toBe(SERIES.reduce((sum, s) => sum + memberPairs(s).length, 0))
    for (const series of SERIES) {
      const slugs = seriesPairs(series).map((p) => p.slug)
      expect(new Set(slugs).size, `series "${series.slug}" lists a pair twice`).toBe(slugs.length)
      for (const slug of slugs) {
        expect(
          listed.filter((p) => p.seriesSlug === series.slug && p.pairSlug === slug).length,
          `pair "${series.slug}/${slug}" is not listed exactly once`,
        ).toBe(1)
      }
    }
  })
})

// ── 10: the live rows ────────────────────────────────────────────────────

describe('series rows', () => {
  it('returns one row per member, in registry order', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      expect(rows.length, `series "${series.slug}" lost a row`).toBe(series.members.length)
      expect(
        rows.map((r) => r.key),
        `series "${series.slug}" rows are out of registry order`,
      ).toEqual(series.members.map((m) => m.key))
      for (const [index, row] of rows.entries()) {
        const member = series.members[index]!
        expect(row.version).toBe(member.version)
        expect(row.tier).toBe(member.tier)
        expect(row.priceId).toBe(member.priceId)
        expect(row.scoreId).toBe(member.scoreId)
      }
    }
  })

  it('flags only the first row as the newest', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      expect(rows.filter((r) => r.isNewest).map((r) => r.key)).toEqual([rows[0]!.key])
      rows.forEach((row, index) => {
        expect(row.isNewest, `row "${row.key}" of "${series.slug}" isNewest=${row.isNewest}`).toBe(
          index === 0,
        )
      })
      // The single-row resolver follows the same index rule.
      expect(seriesRow(series.members[0]!, 0).isNewest).toBe(true)
      expect(seriesRow(series.members[0]!, 3).isNewest).toBe(false)
    }
  })

  it('flags exactly the rows with the lowest blended price', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      const priced = series.members
        .map((member) => {
          const price = member.priceId ? PRICE_BY_ID.get(member.priceId) : undefined
          return price ? { key: member.key, blended: blended(price) } : undefined
        })
        .filter((entry): entry is { key: string; blended: number } => entry !== undefined)
      expect(priced.length, `series "${series.slug}" has no priced member`).toBeGreaterThan(0)
      const min = Math.min(...priced.map((entry) => entry.blended))
      const expected = priced
        .filter((entry) => entry.blended === min)
        .map((entry) => entry.key)
        .sort()
      expect(
        rows.filter((r) => r.isCheapest).map((r) => r.key).sort(),
        `series "${series.slug}" flags the wrong cheapest member(s)`,
      ).toEqual(expected)
      // The blended price on the row is the registry's own arithmetic.
      for (const row of rows) {
        if (!row.priceId) continue
        const price = PRICE_BY_ID.get(row.priceId)!
        expect(row.blendedPricePer1M).toBeCloseTo(blended(price), 10)
      }
    }
  })

  it('keeps a member without a price row as a named, price-less row', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      for (const member of series.members) {
        if (member.priceId) continue
        const row = rows.find((r) => r.key === member.key)
        expect(row, `series "${series.slug}" lost the price-less member "${member.key}"`).toBeDefined()
        const score = member.scoreId ? findLeaderboardModel(member.scoreId) : undefined
        expect(
          row!.displayName,
          `price-less member "${member.key}" of "${series.slug}" has no display name`,
        ).toBe(score?.displayName ?? member.key)
        expect(row!.inputPricePer1M).toBeUndefined()
        expect(row!.outputPricePer1M).toBeUndefined()
        expect(row!.cachedInputPricePer1M).toBeUndefined()
        expect(row!.blendedPricePer1M).toBeUndefined()
        expect(row!.contextWindow).toBeUndefined()
        expect(row!.sourceUrl).toBeUndefined()
        expect(row!.lastVerified).toBeUndefined()
        expect(row!.sampleCost).toBeUndefined()
        expect(row!.sampleCostOffPeak).toBeUndefined()
        expect(row!.appliedRule).toBeUndefined()
      }
    }
  })
})

// ── 11: the ladder ───────────────────────────────────────────────────────

describe('series steps', () => {
  it('returns one step per consecutive pair, running oldest to newest', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      const steps = seriesSteps(rows)
      expect(steps.length, `series "${series.slug}" has the wrong number of steps`).toBe(
        rows.length - 1,
      )
      expect(
        steps[0]!.to.key,
        `the first step of "${series.slug}" does not end at the newest row`,
      ).toBe(rows[0]!.key)
      expect(
        steps[steps.length - 1]!.from.key,
        `the last step of "${series.slug}" does not start at the oldest row`,
      ).toBe(rows[rows.length - 1]!.key)
      steps.forEach((step, index) => {
        expect(
          step.from.key,
          `step ${index} of "${series.slug}" does not start at the expected row`,
        ).toBe(rows[index + 1]!.key)
        expect(
          step.to.key,
          `step ${index} of "${series.slug}" does not end at the expected row`,
        ).toBe(rows[index]!.key)
        // The exported single-step helper agrees with the ladder.
        expect(step).toEqual(seriesStep(rows[index + 1]!, rows[index]!))
      })
    }
  })

  it('reports arithmetically correct changes', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      for (const step of seriesSteps(rows)) {
        for (const change of step.changes) {
          if (change.kind === 'price') {
            expect(change.slot, `a price change of "${series.slug}" has no slot`).toBeDefined()
            expect(
              change.ratio,
              `price change (${change.slot}) of "${series.slug}" has no ratio`,
            ).toBeDefined()
            expect(
              change.ratio!,
              `price change (${change.slot}) of "${series.slug}" reports ratio ${change.ratio} ` +
                `for ${change.from} → ${change.to}`,
            ).toBeCloseTo((change.to - change.from) / change.from, 10)
            const field = PRICE_SLOT_FIELD[change.slot!]
            expect(
              change.from,
              `price change (${change.slot}) of "${series.slug}" does not quote the older row`,
            ).toBe((step.from as unknown as Record<string, unknown>)[field])
            expect(
              change.to,
              `price change (${change.slot}) of "${series.slug}" does not quote the newer row`,
            ).toBe((step.to as unknown as Record<string, unknown>)[field])
          }
          if (change.kind === 'context') {
            expect(
              change.delta,
              `context change of "${series.slug}" has no delta`,
            ).toBeDefined()
            expect(
              change.delta!,
              `context change of "${series.slug}" reports delta ${change.delta} ` +
                `for ${change.from} → ${change.to}`,
            ).toBeCloseTo(change.to - change.from, 10)
            expect(change.from).toBe(step.from.contextWindow)
            expect(change.to).toBe(step.to.contextWindow)
          }
          if (change.kind === 'score') {
            expect(
              change.delta,
              `score change (${change.benchmarkId}) of "${series.slug}" has no delta`,
            ).toBeDefined()
            expect(
              change.delta!,
              `score change (${change.benchmarkId}) of "${series.slug}" reports delta ` +
                `${change.delta} for ${change.from} → ${change.to}`,
            ).toBeCloseTo(change.to - change.from, 10)
          }
          // Whatever the change carries must agree with its own from/to.
          if (change.ratio !== undefined) {
            expect(
              change.ratio,
              `change of "${series.slug}" reports ratio ${change.ratio} for ` +
                `${change.from} → ${change.to}`,
            ).toBeCloseTo((change.to - change.from) / change.from, 10)
          }
          if (change.delta !== undefined) {
            expect(
              change.delta,
              `change of "${series.slug}" reports delta ${change.delta} for ` +
                `${change.from} → ${change.to}`,
            ).toBeCloseTo(change.to - change.from, 10)
          }
        }
      }
    }
  })
})

// ── selectors ────────────────────────────────────────────────────────────

describe('series selectors', () => {
  it('finds a series by slug', () => {
    for (const series of SERIES) {
      expect(findSeries(series.slug)).toBe(series)
      expect(findSeries('no-such-series')).toBeUndefined()
    }
    expect(listSeries()).toEqual(SERIES)
  })

  it('finds the series of a price row and of a score row', () => {
    for (const series of SERIES) {
      for (const member of series.members) {
        if (member.priceId) {
          expect(seriesForPriceId(member.priceId)?.slug).toBe(series.slug)
        }
        if (member.scoreId) {
          expect(seriesForScoreId(member.scoreId)?.slug).toBe(series.slug)
        }
      }
    }
  })

  it('finds a member by its key', () => {
    for (const series of SERIES) {
      for (const member of series.members) {
        expect(findSeriesMember(series, member.key)).toBe(member)
      }
      expect(findSeriesMember(series, 'no-such-member')).toBeUndefined()
    }
  })

  it('lists the leaderboard models of a series in member order', () => {
    for (const series of SERIES) {
      const scored = series.members.filter((m) => m.scoreId)
      const models = seriesScoreModels(series)
      expect(models.length).toBe(scored.length)
      expect(models.map((m) => m.id)).toEqual(scored.map((m) => m.scoreId))
    }
  })
})

// ── the verdict ──────────────────────────────────────────────────────────

describe('series verdict', () => {
  it('reports the newest and the oldest row', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      const verdict = seriesVerdict(rows)
      expect(verdict).toBeDefined()
      expect(verdict!.newest.key).toBe(rows[0]!.key)
      expect(verdict!.oldest.key).toBe(rows[rows.length - 1]!.key)
      expect(verdict!.memberCount).toBe(rows.length)
      expect(
        verdict!.legacyCount,
        `verdict of "${series.slug}" counts the wrong number of legacy members`,
      ).toBe(rows.filter((row) => row.status !== 'active').length)
    }
  })

  it('recomputes the price and context changes of the line', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      const verdict = seriesVerdict(rows)!
      const newest = rows[0]!
      const oldest = rows[rows.length - 1]!
      // (newer − older) / older — undefined when either side has no price.
      const expectRatio = (a?: number, b?: number) =>
        a == null || b == null || b === 0 ? undefined : (a - b) / b
      const expectedInput = expectRatio(newest.inputPricePer1M, oldest.inputPricePer1M)
      if (expectedInput === undefined) {
        // The oldest member may have no price row at all (its price was
        // retired) — then there is nothing to compare and the verdict says so.
        expect(
          verdict.inputChange,
          `verdict of "${series.slug}" reports an input-price change without a price to compare`,
        ).toBeUndefined()
      } else {
        expect(
          verdict.inputChange,
          `verdict of "${series.slug}" reports the wrong input-price change`,
        ).toBeCloseTo(expectedInput, 10)
      }
      const expectedOutput = expectRatio(newest.outputPricePer1M, oldest.outputPricePer1M)
      if (expectedOutput === undefined) {
        expect(
          verdict.outputChange,
          `verdict of "${series.slug}" reports an output-price change without a price to compare`,
        ).toBeUndefined()
      } else {
        expect(
          verdict.outputChange,
          `verdict of "${series.slug}" reports the wrong output-price change`,
        ).toBeCloseTo(expectedOutput, 10)
      }
      const expectedContext =
        newest.contextWindow != null && oldest.contextWindow != null
          ? newest.contextWindow - oldest.contextWindow
          : undefined
      if (expectedContext === undefined) {
        expect(
          verdict.contextChange,
          `verdict of "${series.slug}" reports a context change without two context windows`,
        ).toBeUndefined()
      } else {
        expect(
          verdict.contextChange,
          `verdict of "${series.slug}" reports the wrong context change`,
        ).toBeCloseTo(expectedContext, 10)
      }
      for (const delta of verdict.scoreDeltas) {
        expect(
          delta.delta,
          `verdict of "${series.slug}" reports the wrong score delta for "${delta.benchmarkId}"`,
        ).toBeCloseTo(delta.to - delta.from, 10)
      }
    }
  })

  it('names the cheapest member of the line', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      const verdict = seriesVerdict(rows)!
      const priced = rows.filter((row) => row.blendedPricePer1M != null)
      expect(priced.length, `series "${series.slug}" has no priced member`).toBeGreaterThan(0)
      const min = Math.min(...priced.map((row) => row.blendedPricePer1M as number))
      expect(
        verdict.cheapest?.blendedPricePer1M,
        `verdict of "${series.slug}" names a member that is not the cheapest`,
      ).toBeCloseTo(min, 10)
      const cheapestKeys = priced
        .filter((row) => row.blendedPricePer1M === min)
        .map((row) => row.key)
      expect(
        cheapestKeys,
        `verdict of "${series.slug}" names a member that is not the cheapest`,
      ).toContain(verdict.cheapest?.key)
    }
  })

  it('names the strongest member over the benchmarks every scored member publishes', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      const verdict = seriesVerdict(rows)!
      const scored = rows.filter((row) => row.scoreId)
      // The benchmarks EVERY scored member of the line publishes — the only
      // ones a version-to-version average may be built on.
      const common = scored.length
        ? [...new Set(scored.flatMap((row) => modelOf(row).scores.map((score) => score.benchmark)))].filter(
            (id) => scored.every((row) => modelOf(row).scores.some((score) => score.benchmark === id)),
          )
        : []
      // A member that does not report the whole common set (or reports one of
      // them in another unit) cannot be averaged — it is skipped, not guessed.
      const averages = scored
        .map((row) => {
          const model = modelOf(row)
          const values = common
            .map((id) => model.scores.find((score) => score.benchmark === id))
            .filter((score): score is NonNullable<typeof score> => Boolean(score))
            .filter((score) => score.unit === 'percent')
            .map((score) => score.score)
          if (values.length !== common.length) return undefined
          return { row, average: values.reduce((sum, value) => sum + value, 0) / values.length }
        })
        .filter((entry): entry is { row: SeriesRow; average: number } => entry !== undefined)
      if (averages.length === 0) {
        // No common benchmark → the "which version is strongest" claim is
        // dropped rather than guessed.
        expect(
          verdict.best,
          `verdict of "${series.slug}" names a strongest member without a common benchmark`,
        ).toBeUndefined()
        continue
      }
      const max = Math.max(...averages.map((entry) => entry.average))
      expect(
        verdict.best?.average,
        `verdict of "${series.slug}" reports the wrong strongest-member average`,
      ).toBeCloseTo(max, 10)
      const owners = averages.filter((entry) => entry.average === max).map((entry) => entry.row.key)
      expect(
        owners,
        `verdict of "${series.slug}" names a member that does not own the strongest average`,
      ).toContain(verdict.best?.row.key)
    }
  })

  it('compares the two most recent scored members of the line', () => {
    for (const series of SERIES) {
      const rows = seriesRows(series)
      const verdict = seriesVerdict(rows)!
      const scored = rows.filter((row) => row.scoreId)
      expect(verdict.scoredCount).toBe(scored.length)
      expect(verdict.pricedCount).toBe(rows.filter((row) => row.blendedPricePer1M != null).length)
      if (scored.length < 2) {
        expect(
          verdict.scorePair,
          `verdict of "${series.slug}" pairs versions that cannot be compared`,
        ).toBeUndefined()
        expect(verdict.scoreDeltas).toEqual([])
        continue
      }
      expect(
        verdict.scorePair?.map((row) => row.key),
        `verdict of "${series.slug}" does not compare the two most recent scored members`,
      ).toEqual([scored[0]!.key, scored[1]!.key])
      for (const delta of verdict.scoreDeltas) {
        const older = findLeaderboardModel(scored[1]!.scoreId as string)!
        const newer = findLeaderboardModel(scored[0]!.scoreId as string)!
        expect(
          delta.from,
          `verdict of "${series.slug}" reports the wrong older score for "${delta.benchmarkId}"`,
        ).toBe(older.scores.find((score) => score.benchmark === delta.benchmarkId)?.score)
        expect(
          delta.to,
          `verdict of "${series.slug}" reports the wrong newer score for "${delta.benchmarkId}"`,
        ).toBe(newer.scores.find((score) => score.benchmark === delta.benchmarkId)?.score)
      }
    }
  })
})
