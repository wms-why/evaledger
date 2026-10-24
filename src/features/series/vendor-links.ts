import type { Vendor } from '@/features/leaderboard/types'
import { pickPrimaryRelease } from '@/features/releases/primary-post'
import type { ReleaseMeta } from '@/features/releases/types'
import type { SeriesMember } from './types'

/** A vendor's own API pricing landing page. */
export interface VendorPricingPage {
  /** Site-relative path, without the locale prefix. */
  path: string
  /**
   * The typed `<Link to>` target, locale prefix included.
   *
   * TanStack Router's `Link` only accepts a route name from its generated
   * tree, so a `to` built by string interpolation at the call site does not
   * typecheck. It has to be a literal here — kept next to `path` so the two
   * can never drift apart.
   */
  to:
    | '/{-$locale}/token-cost-calculator'
    | '/{-$locale}/claude-token-cost-calculator'
    | '/{-$locale}/chatgpt-api-pricing'
    | '/{-$locale}/deepseek-api-pricing'
    | '/{-$locale}/openrouter-pricing-calculator'
    | '/{-$locale}/gemini-api-pricing'
    | '/{-$locale}/grok-api-pricing'
    | '/{-$locale}/minimax-api-pricing'
    | '/{-$locale}/kimi-api-pricing'
  /** i18n key of the anchor text — the page's own name. */
  labelKey: string
}

/**
 * Which pricing landing page belongs to which vendor.
 *
 * The key is the **`vendor` field of a series record**
 * (`src/features/series/series.ts`) — the same `Vendor` slug the leaderboard
 * uses — so the mapping is derived from the data, never from the series slug
 * and never hand-written per line.
 *
 * Two vendors have no pricing landing of their own (`stepfun`, `glm`), so
 * they are simply absent: a series of theirs links to nothing rather than to
 * a page that does not exist.
 */
export const VENDOR_PRICING_PAGES: Partial<Record<Vendor, VendorPricingPage>> = {
  claude: {
    path: '/claude-token-cost-calculator',
    to: '/{-$locale}/claude-token-cost-calculator',
    labelKey: 'site.pricing.claude',
  },
  openai: {
    path: '/chatgpt-api-pricing',
    to: '/{-$locale}/chatgpt-api-pricing',
    labelKey: 'site.pricing.chatgpt',
  },
  google: {
    path: '/gemini-api-pricing',
    to: '/{-$locale}/gemini-api-pricing',
    labelKey: 'site.pricing.gemini',
  },
  grok: {
    path: '/grok-api-pricing',
    to: '/{-$locale}/grok-api-pricing',
    labelKey: 'site.pricing.grok',
  },
  deepseek: {
    path: '/deepseek-api-pricing',
    to: '/{-$locale}/deepseek-api-pricing',
    labelKey: 'site.pricing.deepseek',
  },
  minimax: {
    path: '/minimax-api-pricing',
    to: '/{-$locale}/minimax-api-pricing',
    labelKey: 'site.pricing.minimax',
  },
  kimi: {
    path: '/kimi-api-pricing',
    to: '/{-$locale}/kimi-api-pricing',
    labelKey: 'site.pricing.kimi',
  },
}

/** The pricing landing page of a vendor, when it has one. */
export function vendorPricingPage(vendor: Vendor): VendorPricingPage | undefined {
  return VENDOR_PRICING_PAGES[vendor]
}

/**
 * The release analysis a series page links to.
 *
 * The line's newest member is the one the reader came for ("what did the new
 * version change?"), so its post wins; an older member's post is only used
 * when the newest one has none — and a line whose members have no post at
 * all links to nothing.
 *
 * Posts are matched by the model's **registry id** (`modelId`) and
 * **leaderboard id** (`modelSlug`) — the very keys the series members carry —
 * so a URL slug is never guessed. Within one member, the launch analysis wins
 * over a later piece about the same weights (see `pickPrimaryRelease`).
 */
export function seriesRelease(releases: ReleaseMeta[], members: SeriesMember[]): ReleaseMeta | undefined {
  for (const member of members) {
    const ids = new Set([member.priceId, member.scoreId].filter((id): id is string => Boolean(id)))
    if (ids.size === 0) continue
    const post = pickPrimaryRelease(
      releases.filter(
        (entry) => ids.has(entry.modelId) || (entry.modelSlug ? ids.has(entry.modelSlug) : false),
      ),
    )
    if (post) return post
  }
  return undefined
}
