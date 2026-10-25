import { expect, test } from 'vitest'
import { PATH_ALIASES, canonicalPath, isAliasPath } from '@/features/seo/aliases'
import { permanentPathRedirect } from '@/features/seo/canonical-redirect'
import { isIndexablePath } from '@/features/seo/indexability'
import { CORE_PATHS, CORE_ZH_PATHS } from '@/features/seo/sitemap-core'
import { PUBLIC_PATHS, sitemapPaths } from '@/features/seo/sitemap-paths'
import { stripDefaultLocalePrefix } from '@/features/i18n/locale'

/**
 * The calculator's address is one address.
 *
 * `/token-calculator` used to be published as a second copy of
 * `/token-cost-calculator`: the chrome linked to one here and the other
 * there, so the same labelled link resolved to two URLs and each collected
 * half the internal link equity. The fix was not to delete the old URL — it
 * is live and bookmarked — but to make it a **301** to the canonical one and
 * to stop advertising it anywhere.
 *
 * That contract has four halves, and a regression in any one of them is
 * invisible in a screenshot: the redirect exists, the sitemap does not list
 * the alias, the canonical head of the target agrees with the address the
 * redirect lands on, and the redirect graph has no cycle. This file pins all
 * four.
 */

const ALIAS = '/token-calculator'
const CANONICAL = '/token-cost-calculator'
const ORIGIN = 'https://evaledger.com'
const req = (path: string, method = 'GET') => new Request(`${ORIGIN}${path}`, { method })

/** Where a canonical address ends up once every redirect rule has run. */
function resolve(path: string, hops = 0): { path: string; hops: number } {
  if (hops > 5) throw new Error(`redirect loop at ${path}`)
  const response = permanentPathRedirect(req(path))
  if (!response) return { path, hops }
  const next = new URL(response.headers.get('location')!)
  return resolve(next.pathname + next.search, hops + 1)
}

test('the alias is registered as an alias, not as a page', () => {
  expect(PATH_ALIASES[ALIAS]).toBe(CANONICAL)
  expect(isAliasPath(ALIAS)).toBe(true)
  expect(canonicalPath(ALIAS)).toBe(CANONICAL)
  // The canonical address is not itself an alias — that is what makes the
  // redirect terminate instead of bouncing between the two.
  expect(isAliasPath(CANONICAL)).toBe(false)
  expect(canonicalPath(CANONICAL)).toBe(CANONICAL)
})

test('the alias redirects to the canonical address in one hop', () => {
  const response = permanentPathRedirect(req(ALIAS))
  expect(response?.status).toBe(301)
  const target = new URL(response!.headers.get('location')!)
  expect(target.pathname).toBe(CANONICAL)

  // The slashed form must not chain 308 → 301.
  expect(resolve(`${ALIAS}/`)).toEqual({ path: CANONICAL, hops: 1 })
  // The query string (`?model=`) is the calculator's shareable deep link.
  expect(resolve(`${ALIAS}?model=gpt-6-astra`)).toEqual({
    path: `${CANONICAL}?model=gpt-6-astra`,
    hops: 1,
  })
})

test('the redirect graph terminates: no canonical URL redirects to another', () => {
  const canonicalPaths = [...sitemapPaths(), ...PUBLIC_PATHS]
  for (const path of canonicalPaths) {
    for (const locale of ['en', 'zh']) {
      const address = locale === 'zh' ? `/zh${path === '/' ? '' : path}` : path
      const { path: final, hops } = resolve(address)
      expect(hops, `${address} must be its own final URL`).toBe(0)
      expect(final).toBe(address)
    }
  }
})

test('no alias is published as a canonical page', () => {
  const published = new Set(sitemapPaths())
  for (const alias of Object.keys(PATH_ALIASES)) {
    expect(published.has(alias), `the sitemap must not list the alias ${alias}`).toBe(false)
    expect(isIndexablePath(alias), `the alias ${alias} must not be indexable`).toBe(false)
    expect(PUBLIC_PATHS as readonly string[]).not.toContain(alias)
    expect(CORE_PATHS as readonly string[]).not.toContain(alias)
    expect(CORE_ZH_PATHS as readonly string[]).not.toContain(alias)
  }
  // The target *is* published: a redirect must land on a page the site asks
  // to be indexed, or the alias points at nothing.
  expect(published.has(CANONICAL)).toBe(true)
  expect(isIndexablePath(CANONICAL)).toBe(true)
})

test('the canonical address survives the /en prefix strip without changing', () => {
  // `/en/token-cost-calculator` and `/en/token-calculator` both normalise to
  // the *same* canonical path — the locale prefix is stripped before the
  // alias table is consulted, so the two rules cannot disagree.
  expect(canonicalPath(stripDefaultLocalePrefix('/en/token-cost-calculator'))).toBe(CANONICAL)
  expect(canonicalPath(stripDefaultLocalePrefix('/en/token-calculator'))).toBe(CANONICAL)
  const response = permanentPathRedirect(req('/en/token-calculator?model=gpt-6-astra'))
  expect(response?.status).toBe(301)
  expect(new URL(response!.headers.get('location')!).pathname).toBe(CANONICAL)
})
