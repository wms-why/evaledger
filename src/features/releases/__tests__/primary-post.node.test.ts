import { describe, expect, it } from 'vitest'
import { pickPrimaryRelease } from '../primary-post'
import type { ReleaseMeta } from '../types'

/**
 * A model can carry more than one post. These tests pin which one a model
 * page or a series page features — the launch analysis, not the newest piece
 * that happens to mention the same weights.
 */

/** A minimal post, with the fields the picker reads. */
const post = (over: Partial<ReleaseMeta> & { slug: string }): ReleaseMeta => ({
  path: `releases/${over.slug}.md`,
  title: over.slug,
  date: '2026-10-20',
  checkedAt: '2026-10-20',
  vendor: 'deepseek',
  modelId: 'deepseek-flash',
  compareModelIds: [],
  compareSlugs: [],
  sourceUrl: 'https://example.com',
  sourceTitle: 'x',
  ...over,
})

describe('pickPrimaryRelease', () => {
  it('prefers the launch post over a later piece on the same model', () => {
    // The DeepSeek line carries two posts against the same checkpoint: the
    // 1017 launch analysis, and the DeepInfer infrastructure piece published
    // later. `deepseek-v4.1-flash-1017` shipped on 2026-10-17, so the post
    // carrying that date is the launch analysis.
    const launch = post({
      slug: 'launch',
      modelSlug: 'deepseek-v4.1-flash-1017',
      releasedAt: '2026-10-17',
    })
    const later = post({
      slug: 'infrastructure',
      modelSlug: 'deepseek-v4.1-flash-1017',
      releasedAt: '2026-10-20',
    })
    expect(pickPrimaryRelease([launch, later])?.slug).toBe('launch')
    // …and the answer must not depend on arrival order.
    expect(pickPrimaryRelease([later, launch])?.slug).toBe('launch')
  })

  it('keeps the launch post even when both posts name the model directly', () => {
    // The real shape: both posts carry `modelId: deepseek-flash`, so "whose
    // modelId matches" cannot break the tie. Only the launch day can.
    const launch = post({
      slug: 'launch',
      modelSlug: 'deepseek-v4.1-flash-1017',
      releasedAt: '2026-10-17',
    })
    const later = post({
      slug: 'infrastructure',
      modelSlug: 'deepseek-v4.1-flash-1017',
      releasedAt: '2026-10-20',
    })
    expect(pickPrimaryRelease([later, launch])?.slug).toBe('launch')
  })

  it('falls back to the first post when none carries the launch day', () => {
    const a = post({ slug: 'a', modelSlug: 'deepseek-v4.1-flash-1017', releasedAt: '2026-09-01' })
    const b = post({ slug: 'b', modelSlug: 'deepseek-v4.1-flash-1017', releasedAt: '2026-09-02' })
    expect(pickPrimaryRelease([a, b])?.slug).toBe('a')
    expect(pickPrimaryRelease([])).toBeUndefined()
  })

  it('treats a post with no leaderboard row as a launch post', () => {
    // A post whose model has no score row cannot be dated against a release
    // day, so it keeps its place rather than being displaced by a sibling.
    const pending = post({ slug: 'pending', releasedAt: undefined })
    const later = post({ slug: 'later', releasedAt: '2026-10-20' })
    expect(pickPrimaryRelease([pending, later])?.slug).toBe('pending')
  })
})
