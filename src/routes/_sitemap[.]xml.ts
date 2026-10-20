import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { buildSitemap } from '@/features/seo/seo'
import { coreSitemapPaths } from '@/features/seo/sitemap-paths'

/**
 * `/sitemap.xml` — the URL that used to be declared in `robots.txt`.
 *
 * It now serves the **core** list, byte for byte the same document as
 * `/sitemap-core.xml`: a crawler that already knows this URL keeps working
 * and stops meeting the long tail. The full list is served separately at
 * `/sitemap-full.xml` and is deliberately not declared anywhere.
 *
 * The core list is hand-picked — the English pages the site is built for,
 * plus the six Chinese pages whose Chinese version carries the same intent.
 */
const handler = () => {
  const origin = new URL(env.BETTER_AUTH_URL).origin
  const core = coreSitemapPaths()
  const body = buildSitemap(origin, { en: core.en, zh: core.zh })
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}

export const Route = createFileRoute('/_sitemap.xml')({
  server: { handlers: { GET: handler } },
})
