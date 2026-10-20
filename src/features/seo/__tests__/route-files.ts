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
