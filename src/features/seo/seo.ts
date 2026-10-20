import { locales, defaultLocale, localizePath, type Locale } from '@/features/i18n/locale'

// Open Graph 要求 language_TERRITORY 形态（en_US），裸语言码会被严格解析器忽略。
const OG_LOCALE: Record<Locale, string> = { en: 'en_US', zh: 'zh_CN' }

export function buildRobots(origin: string): string {
  // /api/prices.json is the machine-readable price feed advertised on every
  // page's FAQ — it MUST stay crawlable for GPTBot / ClaudeBot / PerplexityBot,
  // so we explicitly Allow it before the broader /api/ Disallow.
  // Specific Allow beats broader Disallow per the robots.txt spec.
  return [
    'User-agent: *',
    'Allow: /',
    'Allow: /api/prices.json',
    'Disallow: /*/app',
    'Disallow: /app',
    'Disallow: /*/admin',
    'Disallow: /admin',
    'Disallow: /api/',
    // The CORE sitemap only. The full sitemap is served at
    // /sitemap-full.xml, but it is deliberately not declared here: a declared
    // sitemap is an invitation, and the long tail is not what this site is
    // asking to be ranked for.
    `Sitemap: ${origin}/sitemap-core.xml`,
    '',
  ].join('\n')
}

function alternates(origin: string, path: string): string {
  const links = locales.map(
    (l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${origin}${localizePath(l, path)}"/>`,
  )
  links.push(
    `<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${localizePath(defaultLocale, path)}"/>`,
  )
  return links.join('')
}

/** One `<url>` entry, with the hreflang alternates of its page family. */
function urlEntry(origin: string, locale: Locale, path: string): string {
  return `<url><loc>${origin}${localizePath(locale, path)}</loc>${alternates(origin, path)}</url>`
}

/**
 * What a sitemap publishes.
 *
 * The three buckets are the three ways a page can be listed:
 *
 *   - `both` — the page exists in English and in Chinese; both are listed.
 *   - `en` / `zh` — only one language is listed. The page still carries its
 *     hreflang alternates, so a crawler that follows one finds the other;
 *     the list simply does not spend the site's index budget on the twin.
 */
export interface SitemapInput {
  /** Listed in both languages. */
  both?: readonly string[]
  /** Listed in English only. */
  en?: readonly string[]
  /** Listed in Chinese only. */
  zh?: readonly string[]
}

export function buildSitemap(origin: string, input: SitemapInput): string {
  const { both = [], en = [], zh = [] } = input
  const entries = [
    ...both.flatMap((path) => locales.map((locale) => urlEntry(origin, locale, path))),
    ...en.map((path) => urlEntry(origin, 'en', path)),
    ...zh.map((path) => urlEntry(origin, 'zh', path)),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`
}

export interface HeadLink {
  rel: string
  href: string
  hrefLang?: string  // React/HTML camelCase prop name (renders to the `hreflang` attribute)
}

export interface HeadMeta {
  title?: string
  name?: string
  property?: string
  content?: string
  /**
   * JSON-LD payload. TanStack Router renders a meta entry carrying this key
   * as `<script type="application/ld+json">` in <head>.
   *
   * The payload is emitted as raw script text, so strings must not contain
   * `<`, `>` or `&`.
   */
  'script:ld+json'?: unknown
}

/** @deprecated use `HeadMeta` — JSON-LD now travels through `meta`. */
export type HeadJsonLd = HeadMeta
/** @deprecated use `HeadMeta` — JSON-LD now travels through `meta`. */
export type HeadScript = HeadMeta

/** JSON-LD structured data — pass the result through `meta` (see `localeHead`). */
export function jsonLd(obj: Record<string, unknown>): HeadMeta {
  return { 'script:ld+json': obj }
}

export function localeHead(input: {
  origin: string
  locale: Locale
  path: string
  title: string
  description: string
  scripts?: HeadMeta[]
  /**
   * `false` marks the page as **noindex**: a thin page that stays reachable
   * and linked, but does not compete for the site's index budget.
   *
   * A noindex page also drops its hreflang alternates — Google ignores the
   * annotations of a page it is told not to index, and a noindex page must
   * not advertise a sibling as its translation.
   */
  indexable?: boolean
}): { meta: HeadMeta[]; links: HeadLink[]; scripts?: HeadMeta[] } {
  const { origin, locale, path, title, description, scripts, indexable = true } = input
  const canonical = `${origin}${localizePath(locale, path)}`
  const links: HeadLink[] = [{ rel: 'canonical', href: canonical }]
  if (indexable) {
    for (const l of locales) {
      links.push({ rel: 'alternate', hrefLang: l, href: `${origin}${localizePath(l, path)}` })
    }
    links.push({
      rel: 'alternate',
      hrefLang: 'x-default',
      href: `${origin}${localizePath(defaultLocale, path)}`,
    })
  }
  const meta: HeadMeta[] = [
    { title },
    { name: 'description', content: description },
    ...(indexable ? [] : [{ name: 'robots', content: 'noindex, follow' } as HeadMeta]),
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:locale', content: OG_LOCALE[locale] },
    { property: 'og:image', content: `${origin}/logo512.png` },
    { name: 'twitter:card', content: 'summary_large_image' },
    // JSON-LD rides along in `meta` — a `scripts[]` array is not rendered.
    ...(scripts ?? []),
  ]
  return { meta, links, scripts }
}
