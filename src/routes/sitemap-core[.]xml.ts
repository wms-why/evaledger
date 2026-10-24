import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { buildSitemap } from '@/features/seo/seo'
import { coreSitemapPaths } from '@/features/seo/sitemap-paths'

/**
 * The CORE sitemap — the short, curated list the site asks to be judged by.
 *
 * This is the only sitemap declared in `robots.txt` and the only one
 * submitted to the Search Console. It is a hand-picked list of the pages
 * that answer the searches the site is built for: the English pages, plus
 * the six Chinese pages whose Chinese version carries the same intent.
 *
 * The long tail — every benchmark, every series pair, every release post —
 * is served by `/sitemap-full.xml` and is deliberately **not** declared: a
 * declared sitemap is an invitation, and a new domain has no crawl budget to
 * spare. What sits in this list is the hand-picked few: the pages that
 * answer the searches the site is built for, including the newest launch's
 * model page, its series line and its launch analysis.
 *
 * `/sitemap.xml` serves this very same list — it is the URL that used to be
 * declared, so a crawler that already knows it stops meeting the long tail.
 */
const handler = () => {
  const origin = new URL(env.BETTER_AUTH_URL).origin
  const core = coreSitemapPaths()
  const body = buildSitemap(origin, { en: core.en, zh: core.zh })
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}

export const Route = createFileRoute('/sitemap-core.xml')({
  server: { handlers: { GET: handler } },
})
