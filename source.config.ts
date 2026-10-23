import { defineCollections } from 'fumadocs-mdx/config'
import { z } from 'zod'

export const changelog = defineCollections({
  type: 'doc',
  dir: 'src/content/changelog',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.string(),
    version: z.string(),
    published: z.boolean().default(true),
  }),
})

/**
 * The "Model Releases" series: one post per model launch, rewritten as a
 * cost-and-switch analysis. See `src/features/releases/README.md` for the
 * full contract — the short version:
 *
 *  - The post body is prose only. Every number on the rendered page comes
 *    from REGISTRY / LEADERBOARD at render time, so a price change never
 *    leaves a stale figure inside an article.
 *  - `modelId` / `compareModelIds` join REGISTRY (prices).
 *  - `modelSlug` / `compareSlugs` join LEADERBOARD (benchmark scores).
 *    A post without `modelSlug` simply has no score table — we never borrow
 *    another SKU's scores.
 *  - `sourceUrl` is the official announcement the post is based on; it is
 *    rendered as an attribution block and emitted as JSON-LD `isBasedOn`.
 */
export const releases = defineCollections({
  type: 'doc',
  dir: 'src/content/releases',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    /** Publish date of this article (ISO). */
    date: z.string(),
    /** Date this article last re-checked the source and the prices (ISO). */
    checkedAt: z.string(),
    /**
     * Date this article was last verified against the live data of every
     * model it depends on (ISO). Prices and scores are three surfaces that
     * move together: when a dependency's price or score changes after this
     * date, the post is stale and the guard test fails until it is re-read
     * and this stamp is bumped.
     */
    dataCheckedAt: z.string(),
    /** Date the model itself shipped (ISO) — omit when it is not verifiable. */
    releasedAt: z.string().optional(),
    vendor: z.enum([
      'openai',
      'anthropic',
      'google',
      'grok',
      'deepseek',
      'minimax',
      'stepfun',
      'glm',
      'kimi',
    ]),
    /**
     * True while the model has NOT been released yet.
     *
     * A pending post is a *watch* post: the vendor has shown the model (a
     * teaser, a config entry, an announcement) but has published no model
     * card, no API price and no benchmark set — so there is no REGISTRY row
     * and no LEADERBOARD row to point at. The post therefore renders no
     * price table and no score table, and the guard test forbids it from
     * quoting a price or a score at all. When the model ships, flip this to
     * false, add the two registry rows and rewrite the analysis.
     */
    pending: z.boolean().default(false),
    /**
     * REGISTRY.id of the model this post is about. For a pending post this is
     * the id the model will carry once it ships — it is not in the registry
     * yet, and the guard test knows that.
     */
    modelId: z.string(),
    /**
     * Display name of a pending post's model — the registry has no row for
     * it yet, so the page cannot resolve the name from the registries.
     */
    modelName: z.string().optional(),
    /**
     * Figures the vendor has published that a pending post may quote (the
     * predecessor's parameter count, a context window, …). A pending post
     * has no registry rows, so this list is the *only* set of non-registry
     * numbers it is allowed to state.
     */
    publishedNumbers: z.array(z.number()).default([]),
    /** LEADERBOARD.id — enables the benchmark table when present. */
    modelSlug: z.string().optional(),
    /** REGISTRY.ids rendered as extra rows in the price table. */
    compareModelIds: z.array(z.string()).default([]),
    /** LEADERBOARD.ids rendered as extra columns in the score table. */
    compareSlugs: z.array(z.string()).default([]),
    /** Official announcement this post is based on. */
    sourceUrl: z.string(),
    /** Human-readable title of that announcement. */
    sourceTitle: z.string(),
    /**
     * The vendor's own clip, when the post is built around one.
     *
     * `src` / `poster` are site-relative paths under `public/` (we mirror the
     * clip rather than hot-link a CDN that can rotate its URLs). The route
     * renders a `<video controls>` element; an `.md` body cannot carry one,
     * because raw HTML in a `.md` collection is stripped.
     */
    videoSrc: z.string().optional(),
    /** Poster frame shown before playback. */
    videoPoster: z.string().optional(),
    /** Caption printed under the clip. Bilingual: one per language file. */
    videoCaption: z.string().optional(),
    published: z.boolean().default(true),
  }),
})
