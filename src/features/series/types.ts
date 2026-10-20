import type { ModelStatus } from '@/features/calculator/types'
import type { Vendor } from '@/features/leaderboard/types'

/**
 * Domain types for the *series* surface — one vendor product line, every
 * version of it, side by side.
 *
 * A series is the third way this site compares models:
 *
 *   - `/leaderboard`   → models across vendors, one row each
 *   - `/compare/$pair` → two hand-picked models, usually from different vendors
 *   - `/series/$slug`  → every version of ONE line, newest first
 *
 * The last one answers the question the other two cannot: *"the line just
 * shipped a new version — is the old one still worth using, and what changed?"*
 */

/**
 * Where a member sits inside its vendor's line.
 *
 * `flagship` — top of the line: the best scores, the highest price.
 * `balanced` — the middle tier.
 * `fast`     — the throughput tier.
 * `lite`     — the cheapest tier.
 *
 * A line whose members all share one tier (every Claude Opus version is
 * `flagship`) simply does not render a tier column — the data decides, not
 * the template.
 */
export type SeriesTier = 'flagship' | 'balanced' | 'fast' | 'lite'

/** One version in a series. */
export interface SeriesMember {
  /**
   * Stable short key used in pair URLs: `/series/<slug>/<a>-vs-<b>`.
   * Unique inside its series; must not contain `-vs-`.
   */
  key: string
  /**
   * The numeric generation of this member ("5.5", "3.1", "4.1"). Read as a
   * dotted number, never as a date — it is the only recency signal most
   * lines carry, so the ladder orders by it.
   */
  version: string
  /** Where the member sits in the vendor's line. */
  tier: SeriesTier
  /** REGISTRY id — the price row. Absent when the price row was retired. */
  priceId?: string
  /** LEADERBOARD id — the score row. Absent when no verifiable score exists. */
  scoreId?: string
  /**
   * Status for a member that has no price row of its own (the price was
   * retired while the score history stayed). Members with a price row always
   * take their status from REGISTRY.
   */
  status?: ModelStatus
}

/** A vendor's product line: every version of it we track, newest first. */
export interface Series {
  /** URL slug — `/series/<slug>`. */
  slug: string
  /** Product-line name, e.g. `Claude Opus`. Latin in both locales. */
  name: string
  /** REGISTRY family this line covers. Every member's price row shares it. */
  family: string
  /** Vendor that owns the line. */
  vendor: Vendor
  /** Members, newest first. */
  members: SeriesMember[]
}
