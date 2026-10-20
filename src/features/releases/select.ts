import type { ReleaseMeta, ReleaseRaw } from './types'

export type { ReleaseMeta, ReleaseRaw, ReleaseVendor } from './types'

/**
 * Locale convention for the collection — same rule the changelog uses:
 * the zh version of a post lives in `<slug>.zh.md` next to `<slug>.md`.
 * Both share one URL slug.
 */
const ZH_SUFFIX = '.zh'

/**
 * Extract the URL slug from an MDX path.
 * `releases/deepseek-v4-1-flash.zh.md` → `deepseek-v4-1-flash`
 * `releases/deepseek-v4-1-flash.md`    → `deepseek-v4-1-flash`
 */
export function releaseSlugFromPath(path: string): string {
  const base = path.split('/').pop() ?? path
  return base.replace(/\.zh\.mdx?$/, '').replace(/\.mdx?$/, '')
}

/** True when the MDX path holds the Chinese version of a post. */
export function isZhPath(path: string): boolean {
  return path.includes(ZH_SUFFIX)
}

/**
 * Filter a fumadocs releases collection by locale, drop unpublished entries,
 * sort newest first, and flatten to the shape the routes consume.
 */
export function selectReleases(entries: ReleaseRaw[], locale: string): ReleaseMeta[] {
  const zh = locale === 'zh'
  return entries
    .filter((e) => (zh ? isZhPath(e.info.path) : !isZhPath(e.info.path)))
    .filter((e) => e.published !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((e) => ({
      path: e.info.path,
      slug: releaseSlugFromPath(e.info.path),
      title: e.title,
      description: e.description,
      date: e.date,
      checkedAt: e.checkedAt,
      releasedAt: e.releasedAt,
      vendor: e.vendor,
      modelId: e.modelId,
      modelSlug: e.modelSlug,
      compareModelIds: e.compareModelIds ?? [],
      compareSlugs: e.compareSlugs ?? [],
      sourceUrl: e.sourceUrl,
      sourceTitle: e.sourceTitle,
    }))
}

/** Parse an ISO date into a timestamp, or `null` when it is missing/unparsable. */
function time(iso: string | undefined): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : t
}

/**
 * Sort posts by the day the model shipped, newest first.
 *
 * The list page reads as a launch timeline, not a publishing log: every post
 * carries the same publish date, so `date` cannot order them. `releasedAt` is
 * the launch day — but it is optional, and a post without a verifiable launch
 * date cannot be placed on that timeline, so it sinks to the end (still
 * newest-published first among the undated ones).
 */
export function sortByReleasedAt(entries: ReleaseMeta[]): ReleaseMeta[] {
  return [...entries].sort((a, b) => {
    const ra = time(a.releasedAt)
    const rb = time(b.releasedAt)
    if (ra !== null && rb !== null && ra !== rb) return rb - ra
    if (ra !== null && rb === null) return -1
    if (ra === null && rb !== null) return 1
    return (time(b.date) ?? 0) - (time(a.date) ?? 0)
  })
}

/** Find one post by its URL slug inside an already-selected list. */
export function findReleaseBySlug(entries: ReleaseMeta[], slug: string): ReleaseMeta | undefined {
  return entries.find((e) => e.slug === slug)
}

/**
 * Every distinct slug in the collection, regardless of locale.
 * The en and the zh file of a post share one slug, so the sitemap lists each
 * post once and lets the hreflang alternates cover both languages.
 */
export function uniqueReleaseSlugs(entries: ReleaseRaw[]): string[] {
  const slugs = new Set<string>()
  for (const e of entries) slugs.add(releaseSlugFromPath(e.info.path))
  return [...slugs].sort()
}
