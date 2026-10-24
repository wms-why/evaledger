/**
 * The site's canonical path registry.
 *
 * A URL that is **published** under two paths splits its own internal link
 * equity: half the links point at one address, half at the other, and the
 * search engine has to guess which one the site means. The fix is not to
 * delete the second address — it is a live URL and people have it in their
 * bookmarks — it is to make one address canonical and send the other to it
 * with a **301**, which is the only signal that says "this address moved
 * here and stays here".
 *
 * So the rule is:
 *
 *   - every path in `PATH_ALIASES` is a **redirect**, never a second copy of
 *     the page;
 *   - every internal link points at the canonical path;
 *   - a redirect is never listed in a sitemap (a sitemap is a list of the
 *     addresses you want indexed, and a redirect is not one of them) and
 *     never advertised as a canonical in a page head.
 *
 * The alias is a *redirect target*, not a rewrite of the site's vocabulary:
 * both slugs below describe the same product the same way, so which one wins
 * is an editorial call about which reads better in a URL bar.
 */
export const PATH_ALIASES: Record<string, string> = {
  /**
   * The calculator has lived under two names. `/token-cost-calculator` is the
   * one that says what the page is — it prices a *cost*, per token — and it is
   * the one the sitemap, the footer and the sibling calculators already point
   * at. `/token-calculator` is the shorter, older alias; it keeps working and
   * now answers with a 301.
   */
  '/token-calculator': '/token-cost-calculator',
}

/** The canonical path for an address: itself, unless it is an alias. */
export function canonicalPath(path: string): string {
  const clean = path.split('?')[0].split('#')[0] || '/'
  return PATH_ALIASES[clean] ?? clean
}

/** True when the address is an alias that redirects to a canonical path. */
export function isAliasPath(path: string): boolean {
  const clean = path.split('?')[0].split('#')[0] || '/'
  return clean in PATH_ALIASES
}
