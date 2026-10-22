/**
 * Post-login return path.
 *
 * `?next=` is attacker-controlled — it arrives straight from a URL — and it
 * becomes the OAuth `callbackURL`. Only a same-origin absolute path is ever
 * accepted: `//evil.com` and `/\evil.com` are protocol-relative URLs the
 * browser would happily leave the site for, and a backslash or control
 * character can be normalized into one. Anything else falls back to the
 * caller's default (`/app`).
 */
export function safeNextPath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const next = value.trim()
  if (!next.startsWith('/') || next.startsWith('//')) return undefined
  if (next.length > 512) return undefined
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return undefined
  // An encoded slash/backslash decodes into a path separator after the
  // router's own parsing; reject it before that can happen.
  const path = next.split(/[?#]/, 1)[0]
  if (/%2f|%5c/i.test(path)) return undefined
  return next
}
