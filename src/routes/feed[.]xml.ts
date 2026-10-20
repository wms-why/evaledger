import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/lib/env'
import { selectReleases, type ReleaseRaw } from '@/features/releases/select'
import { releasePriceRows } from '@/features/releases/data'

/**
 * RSS feed for the Model Releases series.
 *
 * Both languages live in one feed, each item tagged with its language, so a
 * subscriber can follow the whole series from one URL. The links are the
 * canonical article pages — the feed is a distribution channel, not a second
 * copy of the content.
 */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function rfc822(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return new Date(0).toUTCString()
  return d.toUTCString()
}

const handler = async () => {
  const origin = new URL(env.BETTER_AUTH_URL).origin
  const { releases } = await import('collections/server')
  const raw = releases as unknown as ReleaseRaw[]

  // Both locales: an en item and a zh item for the same post are two
  // distinct articles and get their own <item>.
  const items = [...selectReleases(raw, 'en'), ...selectReleases(raw, 'zh')]
    .map((r) => {
      const zh = r.path.includes('.zh')
      const link = `${origin}${zh ? '/zh' : ''}/releases/${r.slug}`
      const price = releasePriceRows(r)[0]
      const priceLine = price
        ? `${price.displayName} — $${price.inputPricePer1M} input / $${price.outputPricePer1M} output per 1M tokens`
        : ''
      return [
        '    <item>',
        `      <title>${escapeXml(r.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${rfc822(r.releasedAt ?? r.date)}</pubDate>`,
        `      <description>${escapeXml(r.description ?? priceLine)}</description>`,
        `      <category>${escapeXml(r.vendor)}</category>`,
        `      <dc:language>${zh ? 'zh-CN' : 'en-US'}</dc:language>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>EvalLedger — Model Releases</title>
    <link>${escapeXml(`${origin}/releases`)}</link>
    <atom:link href="${escapeXml(`${origin}/feed.xml`)}" rel="self" type="application/rss+xml"/>
    <description>Every major model launch, rewritten as a cost-and-switch analysis.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`

  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}

export const Route = createFileRoute('/feed.xml')({
  server: { handlers: { GET: handler } },
})
