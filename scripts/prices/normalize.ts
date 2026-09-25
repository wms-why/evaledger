/**
 * Joins a list of `ScrapedModel` rows with the hand-maintained display-name →
 * REGISTRY id map. Pure function — no IO, easy to unit-test.
 *
 * `cacheWrite[]` / `longContext[]` / `peakOffPeak` / `promo` / `status` are
 * intentionally NOT extracted by the scrapers: provider pages don't surface
 * them in a stable way. Those stay human-only in REGISTRY.
 */
import { resolveModelId } from './mapping.ts'
import type { NormalizedModel, ScrapedModel } from './types.ts'

export function normalize(rows: ScrapedModel[]): NormalizedModel[] {
  return rows.map((row) => ({
    provider: row.provider,
    scrapedName: row.scrapedName,
    modelId: resolveModelId(row.scrapedName),
    inputPricePer1M: row.inputPricePer1M,
    outputPricePer1M: row.outputPricePer1M,
    cachedInputPricePer1M: row.cachedInputPricePer1M,
    contextWindow: row.contextWindow,
    raw: row.raw,
  }))
}

/**
 * Coerce a possibly-noisy string from a pricing table cell into a number.
 * Handles "$1.25", "1.25", "$0.05 / 1M", and trims whitespace. Returns null
 * when no parseable number is present so downstream code stays null-safe.
 */
export function parsePrice(input: string | null | undefined): number | null {
  if (!input) return null
  const match = input.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const n = Number(match[0])
  return Number.isFinite(n) ? n : null
}

/**
 * Coerce a context-window cell like "400K", "128,000", "1M" into a token count.
 * Returns null when the cell doesn't look like a window size.
 */
export function parseContextWindow(input: string | null | undefined): number | null {
  if (!input) return null
  const cleaned = input.replace(/,/g, '').trim().toUpperCase()
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*([KM]?)$/)
  if (!match) return null
  const n = Number(match[1])
  if (!Number.isFinite(n)) return null
  const suffix = match[2]
  if (suffix === 'K') return Math.round(n * 1_000)
  if (suffix === 'M') return Math.round(n * 1_000_000)
  return Math.round(n)
}
