/**
 * Shared Chromium launcher for the price-fetch scrapers.
 *
 * Provider pricing pages sometimes serve a "please enable JavaScript" skeleton
 * that hides the actual rates, so we run a real headless browser. Headless is
 * fine here — we don't need to render visually.
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
 * running site. Writes to `.tmp/<provider>-fail.{png,html}` and never throws.
 */
export async function dumpFailureArtifacts(
  page: import('@playwright/test').Page,
  provider: string,
): Promise<void> {
  try {
    const fs = await import('node:fs/promises')
    await fs.mkdir('.tmp', { recursive: true })
    await page.screenshot({ path: `.tmp/${provider}-fail.png`, fullPage: true })
    const html = await page.content()
    await fs.writeFile(`.tmp/${provider}-fail.html`, html)
  } catch {
    // Best-effort: if the dump itself fails we don't want to mask the
    // original error, so swallow.
  }
}
