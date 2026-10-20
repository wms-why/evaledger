import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { buildSitemap } from '@/features/seo/seo'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BEST_CATEGORIES, COMPARE_PAIR_ENTRIES } from '@/features/leaderboard/leaderboard'
import { uniqueReleaseSlugs, type ReleaseRaw } from '@/features/releases/select'

function leaderboardPaths(): string[] {
  return [
    ...LEADERBOARD.models.map((m) => `/models/${m.id}`),
    ...BENCHMARKS.flatMap((b) => [`/benchmarks/${b.id}`, `/benchmarks/${b.id}/history`]),
    ...COMPARE_PAIR_ENTRIES.map((p) => `/compare/${p.slug}`),
    ...BEST_CATEGORIES.map((c) => `/best/${c.slug}`),
  ]
}

/**
 * The release series is bilingual: one slug serves both `/releases/<slug>`
 * and `/zh/releases/<slug>`, so each post is listed once and the hreflang
 * alternates cover the two languages.
 */
async function releasePaths(): Promise<string[]> {
  const { releases } = await import('collections/server')
  const slugs = uniqueReleaseSlugs(releases as unknown as ReleaseRaw[])
  return slugs.map((slug) => `/releases/${slug}`)
}

const handler = async () => {
  const origin = new URL(env.BETTER_AUTH_URL).origin
  const releaseSlugs = await releasePaths()
  const body = buildSitemap(origin, [], [...leaderboardPaths(), ...releaseSlugs])
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}

export const Route = createFileRoute('/sitemap.xml')({
  server: { handlers: { GET: handler } },
})
