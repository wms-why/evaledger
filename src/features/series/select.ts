import { SERIES } from './series'
import type { Series, SeriesMember } from './types'

/**
 * Selection helpers for the series registry — the same shape as
 * `leaderboard/leaderboard.ts` has for the compare pairs.
 */

/** Every series, in the order the registry lists them. */
export function listSeries(): Series[] {
  return SERIES
}

/** A series by its URL slug. */
export function findSeries(slug: string): Series | undefined {
  return SERIES.find((s) => s.slug === slug)
}

/** The series a REGISTRY id belongs to (by its price row). */
export function seriesForPriceId(priceId: string): Series | undefined {
  return SERIES.find((s) => s.members.some((m) => m.priceId === priceId))
}

/** The series a LEADERBOARD id belongs to (by its score row). */
export function seriesForScoreId(scoreId: string): Series | undefined {
  return SERIES.find((s) => s.members.some((m) => m.scoreId === scoreId))
}

/** A member of a series by its short key. */
export function findSeriesMember(series: Series, key: string): SeriesMember | undefined {
  return series.members.find((m) => m.key === key)
}

/**
 * Slug for a pair of member keys: `<a>-vs-<b>`.
 *
 * The canonical order is **newer first** — the members of a series are listed
 * newest-first, so `pairSlug(newer, older)` reads like the page does
 * ("Opus 5.5 vs Opus 5"). The reversed word order resolves to the same pair
 * (see {@link findSeriesPair}) but the canonical URL is always the
 * newer-first one.
 */
export function pairSlug(a: string, b: string): string {
  return `${a}-vs-${b}`
}

/** Split a pair slug back into its two member keys. */
export function parsePairSlug(slug: string): [string, string] | null {
  const parts = slug.split('-vs-')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  return [parts[0], parts[1]]
}

/** Every unordered pair of a series, canonicalised. */
export function seriesPairs(series: Series): Array<{ slug: string; a: SeriesMember; b: SeriesMember }> {
  const pairs: Array<{ slug: string; a: SeriesMember; b: SeriesMember }> = []
  for (let i = 0; i < series.members.length; i++) {
    for (let j = i + 1; j < series.members.length; j++) {
      const a = series.members[i]
      const b = series.members[j]
      pairs.push({ slug: pairSlug(a.key, b.key), a, b })
    }
  }
  return pairs
}

/** Lookup table for every pair of every series, keyed `<seriesSlug>/<pairSlug>`. */
const SERIES_PAIRS = new Map<string, [SeriesMember, SeriesMember]>()
for (const series of SERIES) {
  for (const pair of seriesPairs(series)) {
    SERIES_PAIRS.set(`${series.slug}/${pair.slug}`, [pair.a, pair.b])
  }
}

/**
 * Resolve a pair inside a series.
 *
 * The pair must belong to the series: a version of one line cannot be
 * compared with a version of another here — that is what `/compare/$pair` is
 * for.
 */
export function findSeriesPair(
  series: Series,
  slug: string,
): [SeriesMember, SeriesMember] | undefined {
  const direct = SERIES_PAIRS.get(`${series.slug}/${slug}`)
  if (direct) return direct
  // The reversed word order lands on the same pair — but the canonical URL
  // (and the canonical link) is always the newer-first one.
  const parsed = parsePairSlug(slug)
  if (!parsed) return undefined
  const reversed = pairSlug(parsed[1], parsed[0])
  return SERIES_PAIRS.get(`${series.slug}/${reversed}`)
}

/** Every pair URL the site publishes, for the sitemap. */
export function allSeriesPairs(): Array<{ seriesSlug: string; pairSlug: string }> {
  const out: Array<{ seriesSlug: string; pairSlug: string }> = []
  for (const series of SERIES) {
    for (const pair of seriesPairs(series)) {
      out.push({ seriesSlug: series.slug, pairSlug: pair.slug })
    }
  }
  return out
}
