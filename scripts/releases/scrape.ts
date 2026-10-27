/**
 * Page extraction for the release scraper.
 *
 * `runSource()` is the per-vendor entry point (mirroring
 * `scripts/prices/sources/*.ts`): it opens a page, extracts the article, and
 * returns a `SourceResult` — it never throws, so one broken vendor can't take
 * the whole run down.
 *
 * Extraction is **selector driven**: every vendor file lists candidate
 * selectors and we take the first one that yields usable text. When nothing
 * matches we fail with a message that says which selectors were tried and
 * where the debug dump landed.
 */
import type { Browser, Page } from '@playwright/test'
import { dumpFailureArtifacts, newPage } from '../shared/browser.ts'
import { collapseWhitespace, normalizeBlock, parsePublishedAt } from './text.ts'
import type { ReleaseFacts, ReleaseSelectors, ReleaseSource, SourceResult } from './types.ts'

/** A content root shorter than this is treated as "selectors drifted". */
const MIN_CONTENT_CHARS = 200

/** Upper bound for a single heading we accept as a section heading. */
const MAX_HEADING_CHARS = 120

interface RawExtraction {
  /** The content selector that matched (null when nothing matched at all). */
  contentSelector: string | null
  /** The text of the matched content root. */
  contentText: string
  /** Headings found inside the content root. */
  headings: string[]
  /** The heading selector that produced `headings`. */
  headingSelector: string | null
  /** Title candidates, best first. */
  titleCandidates: string[]
  /** Date candidates, best first. */
  dateCandidates: string[]
  /** Visible text length of the whole document (for error messages). */
  visibleTextLength: number
}

/** Scrape one source; never throws. */
export async function runSource(browser: Browser, source: ReleaseSource): Promise<SourceResult> {
  const { context, page } = await newPage(browser)
  try {
    await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})

    // Wait for the *interesting* part of the DOM. `body` is always present,
    // so it must not be part of the wait set — it would resolve instantly and
    // we'd scrape a page that hasn't hydrated yet.
    const waitSelectors = source.selectors.content.filter((s) => s !== 'body')
    if (waitSelectors.length > 0) {
      await page
        .waitForSelector(waitSelectors.join(', '), { timeout: source.waitMs ?? 15_000 })
        .catch(() => {})
    }

    const extracted = await extractArticle(page, source)
    const facts: ReleaseFacts = {
      vendor: source.vendor,
      slug: source.slug,
      sourceUrl: source.url,
      sourceTitle: source.knownTitle,
      pageTitle: extracted.pageTitle,
      publishedAt: extracted.publishedAt,
      headings: dedupeHeadings(extracted.headings),
      bodyText: extracted.bodyText,
      charCount: extracted.bodyText.length,
      truncated: false,
      scrapedAt: new Date().toISOString(),
    }
    return { vendor: source.vendor, slug: source.slug, url: source.url, ok: true, facts }
  } catch (err) {
    await dumpFailureArtifacts(page, source.slug)
    return {
      vendor: source.vendor,
      slug: source.slug,
      url: source.url,
      ok: false,
      facts: null,
      error: err instanceof Error ? err.message : String(err),
    }
  } finally {
    await context.close()
  }
}

export interface ExtractedArticle {
  pageTitle: string | null
  publishedAt: string | null
  headings: string[]
  bodyText: string
}

/**
 * Pull the title / date / headings / body out of the current page.
 *
 * Throws a descriptive error when the page doesn't yield usable content —
 * the caller turns that into a failed `SourceResult`.
 */
export async function extractArticle(
  page: Page,
  source: ReleaseSource,
): Promise<ExtractedArticle> {
  const raw = await page.evaluate(extractInPage, {
    selectors: source.selectors,
    minChars: MIN_CONTENT_CHARS,
    maxHeadingChars: source.maxHeadingChars ?? MAX_HEADING_CHARS,
  })

  if (!raw.contentSelector) {
    throw new Error(
      `[${source.slug}] no content root matched — tried: ${source.selectors.content.join(' | ')} ` +
        `(page showed ${raw.visibleTextLength} visible chars). ` +
        `The page may need JS rendering, may be blocking the bot, or the layout may have changed. ` +
        `See .tmp/${source.slug}-fail.html.`,
    )
  }

  if (raw.contentText.length < MIN_CONTENT_CHARS) {
    throw new Error(
      `[${source.slug}] content root "${raw.contentSelector}" only yielded ${raw.contentText.length} chars ` +
        `(need ${MIN_CONTENT_CHARS}) — the selectors have probably drifted. ` +
        `See .tmp/${source.slug}-fail.html.`,
    )
  }

  const pageTitle = raw.titleCandidates.find((t) => t.length > 0) ?? null
  const publishedAt = raw.dateCandidates.map((d) => parsePublishedAt(d)).find((d) => d !== null) ?? null

  return {
    pageTitle,
    publishedAt,
    headings: raw.headings,
    bodyText: normalizeBlock(raw.contentText),
  }
}

/**
 * The in-page part of the extraction. Runs inside the browser, so it only
 * touches the DOM — no Playwright API here.
 */
function extractInPage(cfg: {
  selectors: ReleaseSelectors
  minChars: number
  maxHeadingChars: number
}): RawExtraction {
  const textOf = (el: Element | null): string => {
    if (!el) return ''
    const html = el as HTMLElement
    return (html.innerText || el.textContent || '').trim()
  }

  const pickContent = (): { selector: string; text: string } | null => {
    let fallback: { selector: string; text: string } | null = null
    for (const selector of cfg.selectors.content) {
      const el = document.querySelector(selector)
      if (!el) continue
      const text = textOf(el)
      if (!text) continue
      if (text.length >= cfg.minChars) return { selector, text }
      if (!fallback) fallback = { selector, text }
    }
    return fallback
  }

  const content = pickContent()
  const contentEl = content ? document.querySelector(content.selector) : null

  const headings: string[] = []
  let headingSelector: string | null = null
  const headingSelectors = [...cfg.selectors.heading, ...(cfg.selectors.headingFallback ?? [])]
  for (const selector of headingSelectors) {
    const nodes = Array.from(contentEl?.querySelectorAll(selector) ?? [])
    const texts = nodes
      .map((n) => textOf(n))
      .filter((t) => t.length > 0 && t.length <= cfg.maxHeadingChars)
    if (texts.length > 0) {
      headings.push(...texts)
      headingSelector = selector
      break
    }
  }

  const titleCandidates: string[] = []
  for (const selector of cfg.selectors.title) {
    const text = textOf(document.querySelector(selector))
    if (text) titleCandidates.push(text)
  }
  if (document.title) titleCandidates.push(document.title)

  const dateCandidates: string[] = []
  for (const selector of cfg.selectors.date) {
    const el = document.querySelector(selector)
    if (!el) continue
    const attr =
      el.getAttribute('datetime') ?? el.getAttribute('content') ?? el.getAttribute('data-date')
    if (attr) dateCandidates.push(attr)
    const text = textOf(el)
    if (text) dateCandidates.push(text)
  }

  return {
    contentSelector: content ? content.selector : null,
    contentText: content ? content.text : '',
    headings,
    headingSelector,
    titleCandidates,
    dateCandidates,
    visibleTextLength: document.body ? (document.body.innerText || '').length : 0,
  }
}

/** Collapse a heading list into unique, order-preserving entries. */
export function dedupeHeadings(headings: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const heading of headings) {
    const key = collapseWhitespace(heading).toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(collapseWhitespace(heading))
  }
  return out
}
