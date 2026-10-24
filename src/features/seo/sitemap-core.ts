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
 *
 * The list grows one launch at a time: when a collection pass adds a model
 * the site knows enough about, the model page joins the list, and so do the
 * pages that answer the questions the new model raises — is it worth
 * switching to (the series pair), and what does it cost (the release post).
 */
export const CORE_PATHS = [
  // The brand anchor: the landing page, and the calculator it sells.
  '/',
  '/token-cost-calculator',
  // The comparison entry point.
  '/compare',
  // The per-provider pricing landings — one per name people type.
  '/claude-token-cost-calculator',
  '/chatgpt-api-pricing',
  '/deepseek-api-pricing',
  '/openrouter-pricing-calculator',
  '/gemini-api-pricing',
  '/grok-api-pricing',
  '/minimax-api-pricing',
  '/kimi-api-pricing',
  // The hand-picked head-to-heads between the models with the most scores.
  '/compare/claude-opus-5.5-vs-gpt-6-astra',
  '/compare/deepseek-v4.1-flash-1017-vs-gpt-6-astra',
  '/compare/claude-opus-5-vs-gpt-5.6-sol',
  '/compare/gpt-5.6-sol-vs-kimi-k3',
  // The two frontier head-to-heads the 2026-10-24 pass opened: Gemini 4
  // Argon against the two models it displaces, and Kimi K3.1 Pro against
  // the Claude Opus 5.5 it was launched to be measured against. The slugs
  // are the canonical alphabetical form `pairSlug()` produces.
  '/compare/gemini-4-argon-vs-gpt-6-astra',
  '/compare/claude-opus-5.5-vs-gemini-4-argon',
  '/compare/claude-opus-5.5-vs-kimi-k3.1-pro',
  // The two benchmark pages that clear the floor and carry a known name.
  '/benchmarks/hle',
  '/benchmarks/gpqa-diamond',
  // The model pages of the models the site knows best — the frontier row
  // first, then the three models the calculator and the boards are built on.
  '/models/claude-opus-5.5',
  '/models/gpt-6-astra',
  '/models/kimi-k3.1-pro',
  '/models/claude-fable-5.1',
  '/models/gemini-4-argon',
  '/models/gemini-3.1-pro',
  '/models/grok-4.7',
  '/models/minimax-m3.1-flash',
  '/models/step-5-preview',
  '/models/deepseek-v4.1-flash-1017',
  '/models/gpt-5.6-sol',
  // The product lines the newest launches raise questions about: each line
  // gets its index page, and the version pair that answers "is the new one
  // worth switching to?" — but only the pairs whose BOTH sides carry a score
  // (the guard test enforces the floor, so a thin pair cannot be listed).
  '/series/kimi-k3',
  '/series/kimi-k3/k3.1-pro-vs-k3',
  '/series/gemini-3',
  '/series/claude-opus',
  '/series/claude-opus/opus-5.5-vs-opus-5',
  '/series/claude-fable',
  '/series/gpt-6',
  '/series/gpt-5',
  '/series/deepseek-v4',
  '/series/deepseek-v4/v4.1-flash-1017-vs-v4-pro',
  '/series/minimax-m3',
  '/series/minimax-m3/m3.1-flash-vs-m3',
  '/series/grok-4',
  // The launch analyses of the 2026-10-24 collection pass, one per shipped
  // model: what each one costs, and what the vendor's own numbers do and do
  // not prove. These are the pages that answer "is <model> worth switching
  // to?" for the models people are actually searching for.
  '/releases/kimi-k3-1',
  '/releases/gemini-4-argon',
  '/releases/gemini-3-1-pro',
  '/releases/grok-4-7',
  '/releases/minimax-m3-1-flash',
  '/releases/step-5-preview',
  '/releases/deepseek-v4-1-flash-1017',
  '/releases/claude-opus-5-5',
  // The pages that answer the searches the site's clusters are built around:
  //   - "LLM benchmark methodology"   → the scoring rules every board uses.
  //   - "best LLM for coding"          → the use-case ranking itself.
  //   - "best cheap model for coding"  → the same models, ordered by price.
  //   - "best LLM for agents"         → the agent board's own long-tail page.
  //   - "cheapest LLMs"               → the price ranking every model enters.
  //   - "1M context window models"    → the long-context ranking.
  //   - "prompt caching"               → the cache-discount ranking.
  // They are stable hub pages rather than one launch's long tail, so they
  // earn a place in the bid on their own account.
  '/methodology',
  '/best/for-coding',
  '/best/cheapest-coding',
  '/best/for-agents',
  '/best/for-reasoning',
  '/best/cheapest-llms',
  '/best/1m-context-window',
  '/best/prompt-caching',
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
 * the site's index budget. The Chinese twins of the newest model pages are
 * no different: they are listed in English only, and their hreflang
 * alternate carries the crawler across.
 */
export const CORE_ZH_PATHS = [
  '/',
  '/token-cost-calculator',
  '/claude-token-cost-calculator',
  '/chatgpt-api-pricing',
  '/deepseek-api-pricing',
  '/openrouter-pricing-calculator',
  '/gemini-api-pricing',
  '/grok-api-pricing',
  '/minimax-api-pricing',
  '/kimi-api-pricing',
] as const
