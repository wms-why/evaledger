/**
 * The core sitemap — the short list the site asks to be judged by.
 *
 * The full sitemap is large on purpose: it publishes every page that clears
 * its indexability floor. But a *new* domain has no crawl budget to spare,
 * and a long list of pages dilutes the signal Google gets in its first
 * visits: it samples a few dozen URLs, and the ones it happens to pick set
 * the tone for the rest of the crawl.
 *
 * So the site publishes two lists:
 *
 *   - **core** — this file. A short, hand-picked list of the pages that
 *     answer the searches the site is built for. It is the only sitemap
 *     declared in `robots.txt` and the only one submitted to the Search
 *     Console. When a page earns its place here, it stays here.
 *   - **full** — every page that clears its indexability floor, generated
 *     from the same registries the pages read. It exists, it is served, and
 *     it is deliberately **not** declared: a crawler that finds it may
 *     wander into the long tail, and the long tail is not what we are
 *     asking to be ranked for.
 *
 * The list is curated, not derived — "which page answers which search" is an
 * editorial call. The guard test (`sitemap-core.node.test.ts`) holds it to
 * the data: every path here must exist, and every path here must clear its
 * indexability floor.
 */

/**
 * The core pages, in both languages.
 *
 * Each entry is a page that answers a search the site is built for. The
 * per-provider pricing landings are the long-tail entries — they carry the
 * product names people actually type.
 */
export const CORE_PATHS = [
  // The brand anchor: the landing page, and the calculator it sells.
  '/',
  '/token-calculator',
  // The comparison entry point.
  '/compare',
  // The per-provider pricing landings — one per name people type.
  '/claude-token-cost-calculator',
  '/chatgpt-api-pricing',
  '/deepseek-api-pricing',
  '/openrouter-pricing-calculator',
  // The hand-picked head-to-heads between the models with the most scores.
  '/compare/claude-opus-5-vs-gpt-5.6-sol',
  '/compare/deepseek-v4.1-flash-vs-gpt-5.6-sol',
  '/compare/claude-opus-5-vs-deepseek-v4.1-flash',
  '/compare/gpt-5.6-sol-vs-kimi-k3',
  // The two benchmark pages that clear the floor and carry a known name.
  '/benchmarks/hle',
  '/benchmarks/gpqa-diamond',
  // The model pages of the three models the site knows best.
  '/models/claude-opus-5.5',
  '/models/gpt-5.6-sol',
  '/models/deepseek-v4.1-flash-1017',
] as const

/**
 * The Chinese pages that earn a place in the core list.
 *
 * The site is built for the English-speaking market; the Chinese pages
 * exist because the product is written and maintained in both languages, not
 * because Chinese is the target market. So only the pages a Chinese
 * speaker would actually land on are listed — the landing page, the
 * calculator, and the per-provider pricing landings. The Chinese mirror of
 * the long tail (benchmarks, series, release posts) stays out of the core
 * list; it remains reachable, linked and indexable, it just does not ask for
 * the site's index budget.
 */
export const CORE_ZH_PATHS = [
  '/',
  '/token-calculator',
  '/claude-token-cost-calculator',
  '/chatgpt-api-pricing',
  '/deepseek-api-pricing',
  '/openrouter-pricing-calculator',
] as const
