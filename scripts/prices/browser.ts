/**
 * Shared Chromium launcher for the price-fetch scrapers.
 *
 * The implementation moved to `scripts/shared/browser.ts` so that
 * `scripts/releases/` can reuse the very same launcher without depending on
 * the price-scraping code. The public API of this module is unchanged:
 * `launchBrowser()`, `newPage()`, `dumpFailureArtifacts()`.
 */
export { dumpFailureArtifacts, launchBrowser, newPage } from '../shared/browser.ts'
