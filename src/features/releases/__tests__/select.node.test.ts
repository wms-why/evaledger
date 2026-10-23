import { describe, expect, it } from 'vitest'
import {
  findReleaseBySlug,
  isZhPath,
  releaseSlugFromPath,
  selectReleases,
  sortByReleasedAt,
  uniqueReleaseSlugs,
  type ReleaseMeta,
  type ReleaseRaw,
} from '../select'

const raw: ReleaseRaw[] = [
  {
    info: { path: 'releases/deepseek-v4-1-flash.md' },
    title: 'DeepSeek V4.1-Flash',
    date: '2026-10-19',
    checkedAt: '2026-10-19',
    releasedAt: '2026-09-10',
    vendor: 'deepseek',
    modelId: 'deepseek-flash',
    modelSlug: 'deepseek-v4.1-flash',
    compareModelIds: ['deepseek-v4-pro'],
    compareSlugs: ['gpt-5.6-sol'],
    sourceUrl: 'https://example.com/post',
    sourceTitle: 'Launch post',
  },
  {
    info: { path: 'releases/gpt-6-astra.md' },
    title: 'GPT-6 astra',
    date: '2026-10-19',
    checkedAt: '2026-09-26',
    vendor: 'openai',
    modelId: 'gpt-6-astra',
    compareModelIds: [],
    compareSlugs: [],
    sourceUrl: 'https://example.com/openai',
    sourceTitle: 'Pricing',
  },
  {
    info: { path: 'releases/deepseek-v4-1-flash.zh.md' },
    title: 'DeepSeek V4.1-Flash 发布解读',
    date: '2026-10-19',
    checkedAt: '2026-10-19',
    releasedAt: '2026-09-10',
    vendor: 'deepseek',
    modelId: 'deepseek-flash',
    modelSlug: 'deepseek-v4.1-flash',
    compareModelIds: ['deepseek-v4-pro'],
    compareSlugs: ['gpt-5.6-sol'],
    sourceUrl: 'https://example.com/post',
    sourceTitle: '发布公告',
  },
  {
    info: { path: 'releases/draft.md' },
    title: 'Draft',
    date: '2026-12-01',
    checkedAt: '2026-12-01',
    vendor: 'google',
    modelId: 'gemini-3.1-pro-preview',
    sourceUrl: 'https://example.com/draft',
    sourceTitle: 'Draft',
    published: false,
  },
]

describe('releaseSlugFromPath', () => {
  it('drops the .md suffix', () => {
    expect(releaseSlugFromPath('releases/gpt-6-astra.md')).toBe('gpt-6-astra')
  })

  it('drops the .zh.md suffix but keeps the slug', () => {
    expect(releaseSlugFromPath('releases/gpt-6-astra.zh.md')).toBe('gpt-6-astra')
  })

  it('handles .mdx too', () => {
    expect(releaseSlugFromPath('releases/gpt-6-astra.zh.mdx')).toBe('gpt-6-astra')
  })
})

describe('isZhPath', () => {
  it('detects the chinese variant', () => {
    expect(isZhPath('releases/a.zh.md')).toBe(true)
    expect(isZhPath('releases/a.md')).toBe(false)
  })
})

describe('selectReleases', () => {
  it('en: only non-.zh files, drafts excluded', () => {
    const out = selectReleases(raw, 'en')
    expect(out.map((e) => e.slug)).toEqual(['deepseek-v4-1-flash', 'gpt-6-astra'])
  })

  it('zh: only .zh files', () => {
    const out = selectReleases(raw, 'zh')
    expect(out.map((e) => e.slug)).toEqual(['deepseek-v4-1-flash'])
  })

  it('sorts newest first', () => {
    const out = selectReleases(
      [
        { ...raw[0]!, date: '2026-01-01' },
        { ...raw[1]!, date: '2026-05-01' },
      ],
      'en',
    )
    expect(out.map((e) => e.title)).toEqual(['GPT-6 astra', 'DeepSeek V4.1-Flash'])
  })

  it('keeps the MDX path so useContent() can find it', () => {
    const out = selectReleases(raw, 'en')
    expect(out[0]?.path).toBe('releases/deepseek-v4-1-flash.md')
  })

  it('normalises missing compare lists to empty arrays', () => {
    const out = selectReleases(
      [
        {
          info: { path: 'releases/a.md' },
          title: 'A',
          date: '2026-01-01',
          checkedAt: '2026-01-01',
          vendor: 'openai',
          modelId: 'gpt-6-astra',
          sourceUrl: 'https://example.com',
          sourceTitle: 'x',
        },
      ],
      'en',
    )
    expect(out[0]?.compareModelIds).toEqual([])
    expect(out[0]?.compareSlugs).toEqual([])
  })
})

describe('sortByReleasedAt', () => {
  /** Turn a raw entry into the flattened shape the list route consumes. */
  const metaOf = (r: ReleaseRaw, releasedAt?: string): ReleaseMeta => {
    const locale = r.info.path.includes('.zh') ? 'zh' : 'en'
    return selectReleases([{ ...r, releasedAt }], locale)[0]!
  }

  it('orders posts by launch day, newest first', () => {
    const out = sortByReleasedAt([
      metaOf(raw[0]!, '2026-09-10'),
      metaOf(raw[1]!, '2026-09-03'),
      metaOf({ ...raw[3]!, published: true }, '2026-10-19'),
    ])
    expect(out.map((e) => e.title)).toEqual([
      'Draft',
      'DeepSeek V4.1-Flash',
      'GPT-6 astra',
    ])
  })

  it('puts posts without a release date last', () => {
    const out = sortByReleasedAt([
      metaOf(raw[1]!),
      metaOf(raw[0]!, '2026-09-10'),
    ])
    expect(out.map((e) => e.title)).toEqual(['DeepSeek V4.1-Flash', 'GPT-6 astra'])
  })

  it('does not mutate the input list', () => {
    const input = selectReleases(raw, 'en')
    const before = input.map((e) => e.slug)
    sortByReleasedAt(input)
    expect(input.map((e) => e.slug)).toEqual(before)
  })

  it('leads with a pending post, ahead of every shipped model', () => {
    const pending: ReleaseMeta = {
      ...metaOf(raw[1]!),
      slug: 'kimi-k3-1',
      title: 'Kimi K3.1',
      pending: true,
      date: '2026-10-23',
    }
    const out = sortByReleasedAt([
      metaOf(raw[0]!, '2026-09-10'),
      metaOf({ ...raw[3]!, published: true }, '2026-10-19'),
      pending,
    ])
    // A watch post has no launch day — it still leads the page, because it is
    // the newest thing the series has to say.
    expect(out[0]?.slug).toBe('kimi-k3-1')
    expect(out.slice(1).map((e) => e.slug)).toEqual(['draft', 'deepseek-v4-1-flash'])
  })

  it('orders two pending posts by publish date, newest first', () => {
    const base = metaOf(raw[1]!)
    const newer: ReleaseMeta = { ...base, slug: 'newer', pending: true, date: '2026-10-23' }
    const older: ReleaseMeta = { ...base, slug: 'older', pending: true, date: '2026-10-20' }
    const shipped = metaOf(raw[0]!, '2026-09-10')
    expect(sortByReleasedAt([older, shipped, newer]).map((e) => e.slug)).toEqual([
      'newer',
      'older',
      'deepseek-v4-1-flash',
    ])
  })
})

describe('findReleaseBySlug', () => {
  it('finds a post by its url slug', () => {
    const out = selectReleases(raw, 'en')
    expect(findReleaseBySlug(out, 'gpt-6-astra')?.title).toBe('GPT-6 astra')
    expect(findReleaseBySlug(out, 'nope')).toBeUndefined()
  })
})

describe('uniqueReleaseSlugs', () => {
  it('lists each post once across both languages', () => {
    expect(uniqueReleaseSlugs(raw)).toEqual(['deepseek-v4-1-flash', 'draft', 'gpt-6-astra'])
  })
})
