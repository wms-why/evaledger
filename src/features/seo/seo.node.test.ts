import { test, expect } from 'vitest'
import { buildRobots, buildSitemap, localeHead } from '@/features/seo/seo'
import { localizePath } from '@/features/i18n/locale'

const origin = 'https://app.example.com'

test('localizePath: en no prefix, zh prefixed', () => {
  expect(localizePath('en', '/')).toBe('/')
  expect(localizePath('zh', '/')).toBe('/zh')
  expect(localizePath('en', '/sponsor')).toBe('/sponsor')
  expect(localizePath('zh', '/sponsor')).toBe('/zh/sponsor')
})

test('robots disallows app/admin/api + lists sitemap', () => {
  const r = buildRobots(origin)
  expect(r).toContain('Disallow: /*/app')
  expect(r).toContain('Disallow: /app')
  expect(r).toContain('Disallow: /*/admin')
  expect(r).toContain('Disallow: /api')
  expect(r).toContain(`Sitemap: ${origin}/sitemap.xml`)
})

test('sitemap lists both locales of public pages with hreflang', () => {
  const xml = buildSitemap(origin)
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
  expect(xml).not.toContain(`${origin}/pricing`)
  expect(xml).not.toContain(`${origin}/zh/pricing`)
})

test('sitemap does not include any docs paths', () => {
  // docs feature is gone — sitemap must not advertise docs URLs in any locale.
  const xml = buildSitemap(origin)
  expect(xml).not.toContain(`${origin}/docs`)
  expect(xml).not.toContain(`${origin}/zh/docs`)
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
