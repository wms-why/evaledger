import { test, expect } from 'vitest'
import { buildRobots, buildSitemap, localeHead } from '@/features/seo/seo'
import { PUBLIC_PATHS } from '@/features/seo/sitemap-paths'
import { localizePath } from '@/features/i18n/locale'

const origin = 'https://app.example.com'

test('localizePath: en no prefix, zh prefixed', () => {
  expect(localizePath('en', '/')).toBe('/')
  expect(localizePath('zh', '/')).toBe('/zh')
  expect(localizePath('en', '/sponsor')).toBe('/sponsor')
  expect(localizePath('zh', '/sponsor')).toBe('/zh/sponsor')
})

test('robots disallows app/admin/api + allows prices.json + lists the core sitemap', () => {
  const r = buildRobots(origin)
  expect(r).toContain('Disallow: /*/app')
  expect(r).toContain('Disallow: /app')
  expect(r).toContain('Disallow: /*/admin')
  expect(r).toContain('Disallow: /api/')
  // /api/prices.json is the agent-facing price feed — must remain crawlable
  // so GPTBot / ClaudeBot / PerplexityBot can ingest it.
  expect(r).toContain('Allow: /api/prices.json')
  // Only the CORE sitemap is declared. The full one is served, but a
  // declared sitemap is an invitation, and the long tail is not the bid.
  expect(r).toContain(`Sitemap: ${origin}/sitemap-core.xml`)
  expect(r).not.toContain(`${origin}/sitemap-full.xml`)
})

test('sitemap lists both locales of public pages with hreflang', () => {
  const xml = buildSitemap(origin, { both: PUBLIC_PATHS })
  expect(xml).toContain('<urlset')
  expect(xml).toContain(`<loc>${origin}/</loc>`)
  expect(xml).toContain(`<loc>${origin}/zh</loc>`)
  expect(xml).toContain(`<loc>${origin}/waitlist</loc>`)
  expect(xml).toContain(`<loc>${origin}/zh/waitlist</loc>`)
  expect(xml).toContain('hreflang="en"')
  expect(xml).toContain('hreflang="zh"')
  expect(xml).toContain('hreflang="x-default"')
  expect(xml).toContain(`<loc>${origin}/changelog</loc>`)
  expect(xml).toContain(`<loc>${origin}/zh/changelog</loc>`)
  expect(xml).toContain(`<loc>${origin}/sponsor</loc>`)
  expect(xml).toContain(`<loc>${origin}/zh/sponsor</loc>`)
  // DeepSeek long-tail page — must be in the sitemap for indexing.
  expect(xml).toContain(`<loc>${origin}/deepseek-api-pricing</loc>`)
  expect(xml).toContain(`<loc>${origin}/zh/deepseek-api-pricing</loc>`)
  expect(xml).not.toContain(`${origin}/pricing`)
  expect(xml).not.toContain(`${origin}/zh/pricing`)
})

test('sitemap does not include any docs paths', () => {
  // docs feature is gone — sitemap must not advertise docs URLs in any locale.
  const xml = buildSitemap(origin, { both: PUBLIC_PATHS })
  expect(xml).not.toContain(`${origin}/docs`)
  expect(xml).not.toContain(`${origin}/zh/docs`)
})

test('a one-language list carries the page but only that language', () => {
  // The core list lists the English page and, for the pages whose Chinese
  // version earns its place, the Chinese one. A page listed in the `en`
  // bucket must not also produce a Chinese <loc>.
  const xml = buildSitemap(origin, { en: ['/token-calculator'], zh: ['/token-calculator'] })
  expect(xml).toContain(`<loc>${origin}/token-calculator</loc>`)
  expect(xml).toContain(`<loc>${origin}/zh/token-calculator</loc>`)
  // The alternates still point at the twin — a crawler that follows one URL
  // finds the other.
  expect(xml).toContain(`hreflang="zh" href="${origin}/zh/token-calculator"`)
  expect(xml).toContain(`hreflang="x-default" href="${origin}/token-calculator"`)
})

test('localeHead: canonical + hreflang alternates + og', () => {
  const head = localeHead({ origin, locale: 'zh', path: '/', title: 'T', description: 'D' })
  expect(head.links.find((l) => l.rel === 'canonical')?.href).toBe(`${origin}/zh`)
  expect(head.links.some((l) => l.rel === 'alternate' && l.hrefLang === 'en' && l.href === `${origin}/`)).toBe(true)
  expect(head.links.some((l) => l.rel === 'alternate' && l.hrefLang === 'zh' && l.href === `${origin}/zh`)).toBe(true)
  expect(head.links.some((l) => l.hrefLang === 'x-default')).toBe(true)
  expect(head.meta.some((m) => m.title === 'T')).toBe(true)
  expect(head.meta.some((m) => m.property === 'og:url' && m.content === `${origin}/zh`)).toBe(true)
})

test('localeHead: a noindex page drops its alternates and says noindex', () => {
  const head = localeHead({
    origin,
    locale: 'en',
    path: '/benchmarks/thin',
    title: 'T',
    description: 'D',
    indexable: false,
  })
  expect(head.meta.some((m) => m.name === 'robots' && m.content === 'noindex, follow')).toBe(true)
  // A noindex page must not advertise a sibling as its translation.
  expect(head.links.some((l) => l.rel === 'alternate')).toBe(false)
  expect(head.links.find((l) => l.rel === 'canonical')?.href).toBe(`${origin}/benchmarks/thin`)
})
