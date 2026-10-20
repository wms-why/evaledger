import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { buildSitemap } from '@/features/seo/seo'
import { sitemapPaths } from '@/features/seo/sitemap-paths'
import { uniqueReleaseSlugs, type ReleaseRaw } from '@/features/releases/select'

/**
 * The FULL sitemap — every page that clears its indexability floor, in both
 * languages.
 *
 * It is served but deliberately **not** declared anywhere (not in
 * `robots.txt`, not in the Search Console): a crawler that stumbles on it may
 * wander into the long tail, and the long tail is not what this site is
 * asking to be ranked for. The core list at `/sitemap-core.xml` is the bid.
 *
 * The release series is bilingual: one slug serves both `/releases/<slug>`
 * and `/zh/releases/<slug>`, so each post is listed once and the hreflang
 * alternates cover the two languages.
 *
 * The slugs are returned bare — `sitemapPaths()` owns the `/releases/` prefix.
 */
async function releaseSlugs(): Promise<string[]> {
  const { releases } = await import('collections/server')
  return uniqueReleaseSlugs(releases as unknown as ReleaseRaw[])
}

const handler = async () => {
  const origin = new URL(env.BETTER_AUTH_URL).origin
  const body = buildSitemap(origin, { both: sitemapPaths(await releaseSlugs()) })
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}

export const Route = createFileRoute('/sitemap-full.xml')({
  server: { handlers: { GET: handler } },
})
