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
    /** REGISTRY.id of the model this post is about. */
    modelId: z.string(),
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
    published: z.boolean().default(true),
  }),
})
