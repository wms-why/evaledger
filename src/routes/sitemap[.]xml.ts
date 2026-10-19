import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { buildSitemap } from '@/features/seo/seo'
import { BENCHMARKS } from '@/features/leaderboard/benchmarks'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { BEST_CATEGORIES, COMPARE_PAIR_ENTRIES } from '@/features/leaderboard/leaderboard'

function leaderboardPaths(): string[] {
  return [
    ...LEADERBOARD.models.map((m) => `/models/${m.id}`),
    ...BENCHMARKS.flatMap((b) => [`/benchmarks/${b.id}`, `/benchmarks/${b.id}/history`]),
    ...COMPARE_PAIR_ENTRIES.map((p) => `/compare/${p.slug}`),
    ...BEST_CATEGORIES.map((c) => `/best/${c.slug}`),
  ]
}

const handler = () =>
  new Response(buildSitemap(new URL(env.BETTER_AUTH_URL).origin, [], leaderboardPaths()), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })

export const Route = createFileRoute('/sitemap.xml')({
  server: { handlers: { GET: handler } },
})
