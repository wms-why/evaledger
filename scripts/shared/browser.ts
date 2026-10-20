/**
 * Shared Chromium launcher for the local scrapers.
 *
 * Both `scripts/prices/` (price fetch) and `scripts/releases/` (release
 * announcement drafts) need a real browser: provider pages and vendor blogs
 * often serve a "please enable JavaScript" skeleton that hides the actual
 * content, so we run a real headless browser. Headless is fine here — we
 * don't need to render visually.
 *
 * The implementation lives here (rather than inside `scripts/prices/`) so
 * that the two scrapers share one launcher without either depending on the
 * other's domain code.
 *
 * Usage:
 *   const browser = await launchBrowser()
 *   try { ...scrape... } finally { await browser.close() }
 */
import { chromium, type Browser } from '@playwright/test'

/** Standard desktop UA + viewport so pages serve their full desktop layout. */
const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })
}

/** Open a fresh page with consistent UA + viewport settings. */
export async function newPage(browser: Browser) {
  const context = await browser.newContext({
    userAgent: DEFAULT_UA,
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  })
  const page = await context.newPage()
  return { context, page }
}

/**
 * Dump screenshot + HTML for a failed page so a human can diff against the
 * running site. Writes to `.tmp/<label>-fail.{png,html}` and never throws.
 */
export async function dumpFailureArtifacts(
  page: import('@playwright/test').Page,
  label: string,
): Promise<void> {
  try {
    const fs = await import('node:fs/promises')
    await fs.mkdir('.tmp', { recursive: true })
    await page.screenshot({ path: `.tmp/${label}-fail.png`, fullPage: true })
    const html = await page.content()
    await fs.writeFile(`.tmp/${label}-fail.html`, html)
  } catch {
    // Best-effort: if the dump itself fails we don't want to mask the
    // original error, so swallow.
  }
}
