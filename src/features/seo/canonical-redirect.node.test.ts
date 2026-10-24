import { describe, expect, it } from 'vitest'
import {
  canonicalHostRedirect,
  isLocalOrigin,
  permanentPathRedirect,
} from '@/features/seo/canonical-redirect'

/**
 * Edge canonicalisation contract.
 *
 * The site has one canonical address per page. These tests pin the signals
 * that produce it before the router runs: a trailing slash is a permanent
 * (method-preserving) 308, a locale/alias rewrite is a 301, and a duplicate
 * host or plain-HTTP origin is a 301 to the one canonical origin. A wrong
 * status here is invisible in a screenshot and very visible to a crawler.
 */
const req = (path: string, method = 'GET', host = 'https://evaledger.com') =>
  new Request(`${host}${path}`, { method })

function location(response: Response): string {
  const value = response.headers.get('location')
  expect(value, 'a redirect must carry Location').toBeTruthy()
  const url = new URL(value!)
  return url.origin === 'https://evaledger.com' ? url.pathname + url.search : url.toString()
}

describe('permanentPathRedirect', () => {
  it('308s a trailing slash to the same resource', () => {
    const response = permanentPathRedirect(req('/models/claude-opus-5.5/'))
    expect(response?.status).toBe(308)
    expect(location(response!)).toBe('/models/claude-opus-5.5')
    expect(permanentPathRedirect(req('/zh/'))?.status).toBe(308)
    expect(location(permanentPathRedirect(req('/sitemap.xml/'))!)).toBe('/sitemap.xml')
  })

  it('301s the /en locale alias in one hop, preserving the query', () => {
    const response = permanentPathRedirect(req('/en/token-cost-calculator?model=gpt-6-astra'))
    expect(response?.status).toBe(301)
    expect(location(response!)).toBe('/token-cost-calculator?model=gpt-6-astra')

    // The slashed form collapses in one hop too — no 308 → 301 chain.
    const slashed = permanentPathRedirect(req('/en/'))
    expect(slashed?.status).toBe(301)
    expect(location(slashed!)).toBe('/')
  })

  it('301s the historical calculator alias straight to the canonical URL', () => {
    const response = permanentPathRedirect(req('/token-calculator/?model=gpt-6-astra'))
    expect(response?.status).toBe(301)
    expect(location(response!)).toBe('/token-cost-calculator?model=gpt-6-astra')
  })

  it('leaves canonical paths and non-GET/HEAD requests alone', () => {
    expect(permanentPathRedirect(req('/'))).toBeNull()
    expect(permanentPathRedirect(req('/models/claude-opus-5.5'))).toBeNull()
    expect(permanentPathRedirect(req('/zh/methodology'))).toBeNull()
    expect(permanentPathRedirect(req('/sponsor/', 'POST'))).toBeNull()
  })
})

describe('canonicalHostRedirect', () => {
  const canonical = 'https://evaledger.com'

  it('301s plain HTTP to HTTPS, keeping path and query', () => {
    const response = canonicalHostRedirect(req('/models/x?model=y', 'GET', 'http://evaledger.com'), canonical)
    expect(response?.status).toBe(301)
    expect(response?.headers.get('location')).toBe('https://evaledger.com/models/x?model=y')
  })

  it('301s www to the apex host', () => {
    const response = canonicalHostRedirect(req('/compare?x=1', 'GET', 'https://www.evaledger.com'), canonical)
    expect(response?.status).toBe(301)
    expect(response?.headers.get('location')).toBe('https://evaledger.com/compare?x=1')
  })

  it('leaves the canonical origin and non-GET/HEAD requests alone', () => {
    expect(canonicalHostRedirect(req('/'), canonical)).toBeNull()
    expect(canonicalHostRedirect(req('/sponsor', 'POST', 'https://www.evaledger.com'), canonical)).toBeNull()
  })

  it('never forces local development onto the configured local port', () => {
    expect(isLocalOrigin('http://localhost:3000')).toBe(true)
    expect(isLocalOrigin('http://127.0.0.1:3000')).toBe(true)
    expect(isLocalOrigin('https://evaledger.com')).toBe(false)
    expect(isLocalOrigin('not a url')).toBe(true)
  })
})
