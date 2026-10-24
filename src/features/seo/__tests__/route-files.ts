import { readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * The route files on disk, read by the SEO guard tests.
 *
 * The sitemap's fixed-path pages are written down by hand (see
 * `sitemap-paths.ts`), so the tests need the *other* side of that contract:
 * the list of pages the site actually serves. Reading the route directory
 * keeps the two from drifting — a landing page that is added but not
 * published fails the build instead of quietly disappearing from the index.
 */

/** The locale group — every public page lives under it. */
export const LOCALE_ROUTE_DIR = fileURLToPath(new URL('../../../routes/{-$locale}/', import.meta.url))

/** Route groups the sitemap must not publish (noindex / robots-disallowed). */
export const PRIVATE_GROUPS = ['(auth)', 'app', 'admin']

/** The release posts — one Markdown file per post, one per language. */
export const RELEASE_DIR = fileURLToPath(new URL('../../../content/releases/', import.meta.url))

/**
 * The release posts on disk, as sitemap paths.
 *
 * The posts live in the MDX collection, which a pure node test cannot read —
 * so the slugs are read from the directory instead, the same way the e2e
 * route inventory does. The zh file of a post (`<slug>.zh.md`) shares its
 * URL slug, so it contributes the same path once.
 */
export function releasePostPaths(): string[] {
  const slugs = new Set<string>()
  for (const entry of readdirSync(RELEASE_DIR)) {
    if (!entry.endsWith('.md')) continue
    slugs.add(entry.replace(/\.zh\.md$/, '').replace(/\.md$/, ''))
  }
  return [...slugs].sort().map((slug) => `/releases/${slug}`)
}

/**
 * The public pages that live at a fixed path, derived from the route files.
 *
 * Dynamic segments (`$slug`, `$pair`, `$category`) are skipped — those
 * families are covered by the registries the sitemap reads.
 */
export function publicRoutePaths(): string[] {
  const paths: string[] = []
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir)) {
      const full = `${dir}/${entry}`
      if (statSync(full).isDirectory()) {
        // A dynamic segment (`$slug`) — that family is covered by a registry.
        if (entry.includes('$')) continue
        if (!PRIVATE_GROUPS.includes(entry)) walk(full, `${prefix}/${entry}`)
        continue
      }
      if (!entry.endsWith('.tsx')) continue
      // `route.tsx` is the layout of a group, not a page.
      if (entry === 'route.tsx') continue
      const name = entry.slice(0, -'.tsx'.length)
      if (name.includes('$')) continue
      paths.push(name === 'index' ? prefix || '/' : `${prefix}/${name}`)
    }
  }
  walk(LOCALE_ROUTE_DIR, '')
  return paths.sort()
}
