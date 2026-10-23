/**
 * Domain types for the "Model Releases" series.
 *
 * A release post is prose; everything numeric on the page is resolved at
 * render time from REGISTRY (prices) and LEADERBOARD (benchmark scores).
 * These types describe the *article*, never the data it points at.
 */

/**
 * Vendor slug. Mirrors `Vendor` in `@/features/leaderboard/types` so a post
 * can be joined to a leaderboard model without a translation table.
 */
export type ReleaseVendor =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'grok'
  | 'deepseek'
  | 'minimax'
  | 'stepfun'
  | 'glm'
  | 'kimi'

/** Shape of a document as it comes out of the fumadocs collection. */
export interface ReleaseRaw {
  info: { path: string }
  title: string
  description?: string
  /** Publish date of this article (ISO). */
  date: string
  /** Date the source and prices were last re-checked (ISO). */
  checkedAt: string
  /** Date the model shipped (ISO) — absent when it is not verifiable. */
  releasedAt?: string
  vendor: ReleaseVendor
  /**
   * True while the model has not been released yet — a watch post with no
   * price table and no score table. See `source.config.ts` for the contract.
   */
  pending?: boolean
  /**
   * REGISTRY.id of the model this post is about. For a pending post it is the
   * id the model will carry once it ships; the registry has no row for it yet.
   */
  modelId: string
  /** Display name of a pending post's model (the registries have no row yet). */
  modelName?: string
  /**
   * Figures the vendor has published that a pending post may quote. A pending
   * post has no registry rows, so this list is the *only* set of
   * non-registry numbers it is allowed to state.
   */
  publishedNumbers?: number[]
  /** LEADERBOARD.id of the subject model — absent when there is no score set. */
  modelSlug?: string
  /** REGISTRY.ids rendered as extra price rows. */
  compareModelIds?: string[]
  /** LEADERBOARD.ids rendered as extra score columns. */
  compareSlugs?: string[]
  sourceUrl: string
  sourceTitle: string
  /** Vendored clip rendered above the article body (site-relative path). */
  videoSrc?: string
  /** Poster frame for `videoSrc`. */
  videoPoster?: string
  /** Caption printed under the clip. */
  videoCaption?: string
  published?: boolean
}

/** A release post, flattened for the list and detail routes. */
export interface ReleaseMeta {
  /** MDX path inside the collection — the key `useContent()` expects. */
  path: string
  /** URL slug, shared by the en and the zh version of the post. */
  slug: string
  title: string
  description?: string
  date: string
  checkedAt: string
  releasedAt?: string
  vendor: ReleaseVendor
  /**
   * True while the model has not been released yet — a watch post with no
   * price table and no score table. See `source.config.ts` for the contract.
   */
  pending?: boolean
  modelId: string
  /** Display name of a pending post's model (the registries have no row yet). */
  modelName?: string
  /**
   * Figures the vendor has published that a pending post may quote. A pending
   * post has no registry rows, so this list is the *only* set of
   * non-registry numbers it is allowed to state.
   */
  publishedNumbers?: number[]
  modelSlug?: string
  compareModelIds: string[]
  compareSlugs: string[]
  sourceUrl: string
  sourceTitle: string
  /** Vendored clip rendered above the article body (site-relative path). */
  videoSrc?: string
  /** Poster frame for `videoSrc`. */
  videoPoster?: string
  /** Caption printed under the clip. */
  videoCaption?: string
}
