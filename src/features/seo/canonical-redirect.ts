import { stripDefaultLocalePrefix } from '@/features/i18n/locale'
import { canonicalPath } from './aliases'

/**
 * Permanent canonicalisation at the Worker edge.
 *
 * Two classes of duplicate address reach the app before any route runs:
 *
 *   - a **trailing slash** (`/models/x/`) — the router would answer it with a
 *     temporary 307, leaving the slashed address in contention;
 *   - a **non-canonical path alias** (`/en/anything`, `/token-calculator`) —
 *     the page already defines the canonical URL, so the edge can send the
 *     reader there in one hop instead of chaining redirects.
 *
 * The rules are shared with the router (`canonicalPath`,
 * `stripDefaultLocalePrefix`) so the edge cannot disagree with the page head.
 * Only `GET`/`HEAD` are touched: a 308/301 on a `POST` would re-send its body
 * to another URL, and no public form posts to a non-canonical address.
 */

const CANONICAL_METHODS = new Set(['GET', 'HEAD'])

/**
 * One-hop permanent redirect to the canonical path, or `null` when the
 * request is already canonical.
 *
 * `308` is used when the only change is the trailing slash — the same
 * resource, addressed permanently (method-preserving). Any other change is a
 * move to a different address, so it is a `301`.
 */
export function permanentPathRedirect(request: Request): Response | null {
  if (!CANONICAL_METHODS.has(request.method)) return null

  const url = new URL(request.url)
  const { pathname } = url
  if (pathname === '/') return null

  const slashStripped = pathname.replace(/\/+$/, '') || '/'
  const canonical = canonicalPath(stripDefaultLocalePrefix(slashStripped))
  if (canonical === pathname) return null

  url.pathname = canonical
  const status = canonical === slashStripped ? 308 : 301
  return Response.redirect(url.toString(), status)
}

/**
 * Permanent redirect from a duplicate host or plain-HTTP origin to the one
 * canonical origin (`BETTER_AUTH_URL`), preserving path and query.
 *
 * The canonical tag already names the canonical URL, but it is a hint: this
 * is the HTTP-level signal. The caller decides whether the environment wants
 * host canonicalisation at all (local dev must not redirect `localhost:3340`
 * to the configured `localhost:3000` just because a developer changed ports).
 */
export function canonicalHostRedirect(
  request: Request,
  canonicalOrigin: string,
): Response | null {
  if (!CANONICAL_METHODS.has(request.method)) return null

  const url = new URL(request.url)
  const origin = new URL(canonicalOrigin)
  if (url.origin === origin.origin) return null

  url.protocol = origin.protocol
  url.host = origin.host
  return Response.redirect(url.toString(), 301)
}

/**
 * True when `canonicalOrigin` is a local address, so the edge must not force
 * every request onto it (a dev server on another port is not a duplicate
 * host, it is the same developer's other port).
 */
export function isLocalOrigin(canonicalOrigin: string): boolean {
  try {
    const { hostname } = new URL(canonicalOrigin)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]'
    )
  } catch {
    return true
  }
}
