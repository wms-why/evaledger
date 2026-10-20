/**
 * Shared types for the local release-draft scraper (`pnpm releases:fetch`).
 *
 * The scraper is *draft-only*: it reads a vendor's official page and writes a
 * Markdown/MDX skeleton plus a JSON file of extracted facts into
 * `data/release-drafts/`. It never writes into `src/content/releases/`, never
 * fills in prices, benchmarks, or conclusions — those stay human-only.
 *
 * See `src/features/releases/README.md` (§1 schema, §5.1 sources, §7 script)
 * for the contract this script implements.
 */

/** Vendor ids — mirrors the `vendor` enum of the releases collection schema. */
export type VendorId = 'openai' | 'anthropic' | 'google' | 'grok' | 'deepseek' | 'minimax'

/**
 * Ordered CSS selector candidates for one page.
 *
 * Every list is tried in order and the first match wins, so a page redesign
 * usually only needs one new entry prepended. `content` must end with a
 * catch-all (`body`) so there is always *some* text to report in an error.
 */
export interface ReleaseSelectors {
  /** Candidates for the page / announcement title. */
  title: string[]
  /** Candidates for the publish date (text, `datetime` or `content` attribute). */
  date: string[]
  /** Candidates for the main content root. */
  content: string[]
  /** Candidates for the section headings inside the content root. */
  heading: string[]
  /**
   * Extra heading candidates, used only when `heading` matches nothing.
   * WeChat announcements, for instance, fake headings with `<strong>`.
   */
  headingFallback?: string[]
}

/** One vendor source: which page to read and how to read it. */
export interface ReleaseSource {
  /** Vendor id (also the `.tmp/<vendor>-fail.*` artifact name). */
  vendor: VendorId
  /** Draft file name without extension — also the article slug. */
  slug: string
  /** Canonical `sourceUrl` from the release contract (§5.1). */
  url: string
  /**
   * `sourceTitle` from the release contract (§5.1).
   *
   * The contract already fixes the source titles, so the draft reuses them
   * verbatim; the *live* page title is captured separately as `pageTitle` in
   * the facts JSON so a page rename is still visible.
   */
  knownTitle: string
  /** Selector candidates for this page. */
  selectors: ReleaseSelectors
  /** Human-facing caveats (blocking, JS rendering, …). Shown by `--list`. */
  notes: string[]
  /** How long to wait for the content root to appear (ms). */
  waitMs?: number
  /**
   * Longest heading we accept (characters). Defaults to 120.
   *
   * Some editors — WeChat in particular — mark *paragraphs* as headings, so
   * those pages need a tighter limit to keep the section list clean.
   */
  maxHeadingChars?: number
}

/** The facts extracted from one source page. */
export interface ReleaseFacts {
  vendor: VendorId
  slug: string
  /** The contract URL (what goes into the frontmatter `sourceUrl`). */
  sourceUrl: string
  /** The contract title (what goes into the frontmatter `sourceTitle`). */
  sourceTitle: string
  /** The live `<title>` of the page, when it could be read. */
  pageTitle: string | null
  /** Publish date as `YYYY-MM-DD`, when it could be parsed. */
  publishedAt: string | null
  /** Section headings found inside the content root. */
  headings: string[]
  /** The content root as plain text. */
  bodyText: string
  /** Length of `bodyText` in characters. */
  charCount: number
  /** True when `bodyText` was cut at the `--max-chars` limit. */
  truncated: boolean
  /** ISO timestamp the fetch finished. */
  scrapedAt: string
}

/** The result of scraping a single source. */
export interface SourceResult {
  vendor: VendorId
  slug: string
  url: string
  ok: boolean
  /** Extracted facts, or null when the scrape failed. */
  facts: ReleaseFacts | null
  /** Error string if `ok` is false. */
  error?: string
}
