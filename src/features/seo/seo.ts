import { locales, defaultLocale, localizePath, type Locale } from '@/features/i18n/locale'

const PUBLIC_PATHS = [
  '/',
  '/changelog',
  '/sponsor',
  '/waitlist',
  '/terms',
  '/privacy',
  '/token-cost-calculator',
  '/openrouter-pricing-calculator',
  '/claude-token-cost-calculator',
  '/deepseek-api-pricing',
] as const

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
    `Sitemap: ${origin}/sitemap.xml`,
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

export function buildSitemap(origin: string, singleLocalePaths: string[] = []): string {
  const bilingual = locales.flatMap((l) =>
    PUBLIC_PATHS.map(
      (p) => `<url><loc>${origin}${localizePath(l, p)}</loc>${alternates(origin, p)}</url>`,
    ),
  )
  const single = singleLocalePaths.map((p) => `<url><loc>${origin}${p}</loc></url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${[...bilingual, ...single].join('')}</urlset>`
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
}

/** JSON-LD structured-data script — returned alongside meta/links from head() so
 *  the framework can render `<script type="application/ld+json">` in <head>. */
export interface HeadScript {
  type?: string
  innerHTML: string
}

/** JSON-LD helpers — wrap objects so they can ride the HeadScript[] channel. */
export function jsonLd(obj: unknown): HeadScript {
  return { type: 'application/ld+json', innerHTML: JSON.stringify(obj) }
}

export function localeHead(input: {
  origin: string
  locale: Locale
  path: string
  title: string
  description: string
  scripts?: HeadScript[]
}): { meta: HeadMeta[]; links: HeadLink[]; scripts?: HeadScript[] } {
  const { origin, locale, path, title, description, scripts } = input
  const canonical = `${origin}${localizePath(locale, path)}`
  const links: HeadLink[] = [{ rel: 'canonical', href: canonical }]
  for (const l of locales) {
    links.push({ rel: 'alternate', hrefLang: l, href: `${origin}${localizePath(l, path)}` })
  }
  links.push({
    rel: 'alternate',
    hrefLang: 'x-default',
    href: `${origin}${localizePath(defaultLocale, path)}`,
  })
  const meta: HeadMeta[] = [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:locale', content: OG_LOCALE[locale] },
    { property: 'og:image', content: `${origin}/logo512.png` },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]
  return { meta, links, scripts }
}
