import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { buildSitemap } from '@/features/seo/seo'

const handler = () =>
  new Response(buildSitemap(new URL(env.BETTER_AUTH_URL).origin), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })

export const Route = createFileRoute('/sitemap.xml')({
  server: { handlers: { GET: handler } },
})
