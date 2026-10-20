import { test as base, expect, type Locator, type Page, type Response } from '@playwright/test'

/**
 * Shared fixtures for the page suite.
 *
 * The suite's job is to catch the page a visitor lands on being broken, so
 * every spec gets the same two instruments: the browser console errors and
 * the uncaught exceptions the page raised. Both are collected for the whole
 * test and asserted at the end — a page that renders but throws is broken.
 */

/** Console noise that is not the application's fault. */
const IGNORED_CONSOLE_PATTERNS: RegExp[] = [
  // Vite's dev server serves the favicon only when it exists; a missing one
  // is not a page defect.
  /favicon/i,
  // React DevTools nag (dev build only).
  /Download the React DevTools/i,
  // The dev server's HMR socket logs a warning when it reconnects.
  /\[vite\].*(hmr|websocket)/i,
  // The session read every page load performs is rate-limited (better-auth,
  // database storage). A burst of parallel page loads answers 429 and the
  // page degrades to "logged out" — a server-side budget, not a page defect.
  /status of 429/i,
]

export interface E2EFixtures {
  /** `console.error` messages seen during the test. */
  consoleErrors: string[]
  /** Uncaught exceptions thrown by the page. */
  pageErrors: string[]
}

export const test = base.extend<E2EFixtures>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      await use(errors)
    },
    { auto: true },
  ],
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await use(errors)
    },
    { auto: true },
  ],
})

export { expect }

/** Console errors that survive the ignore list. */
export function realConsoleErrors(errors: string[]): string[] {
  return errors.filter((error) => !IGNORED_CONSOLE_PATTERNS.some((p) => p.test(error)))
}

/**
 * Navigate to a page and wait until it is interactive.
 *
 * `domcontentloaded` + a quiet network is enough: the dev server keeps an HMR
 * websocket open (which `networkidle` would wait on forever), so the wait is
 * bounded and falls back to `load` when the page never goes quiet.
 */
export async function visit(page: Page, path: string): Promise<Response | null> {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('load')
  await page.waitForTimeout(250)
  return response
}

/**
 * Wait until the client app has booted.
 *
 * The dev server compiles the browser bundle on demand, so a page can still be
 * a static HTML shell when the first interaction lands: the click then reaches
 * no handler, and a filled input is wiped by the hydration that follows. The
 * client router only exists once the bundle has booted — that is the point
 * where the handlers are attached.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      Boolean((window as { __TSR_ROUTER__?: unknown }).__TSR_ROUTER__) ||
      // React leaves its fiber on the container it hydrated.
      Object.keys(document.body ?? {}).some((key) => key.startsWith('__reactFiber$')),
    undefined,
    { timeout: 15_000 },
  )
}

/**
 * Click something and let the click be retried until it lands.
 *
 * The dev server re-bundles its dependencies while the suite is running, and a
 * re-bundle forces a full page reload — a click that lands in that window
 * reaches a page that is not interactive yet and is simply lost.
 */
export async function clickUntil(locator: Locator, done: () => Promise<void>): Promise<void> {
  await expect(async () => {
    await locator.click()
    await done()
  }).toPass({ timeout: 20_000 })
}

/**
 * The index of a table column, by its header text.
 *
 * `textContent`, never `innerText`: the headers are uppercased by CSS, and
 * Chrome applies `text-transform` to `innerText` on some tables but not on
 * others (the landing table puts its headers inside `<button>`s). Only the
 * raw text is the same everywhere.
 */
export async function columnIndex(table: Locator, heading: string): Promise<number> {
  const headings = (await table.getByRole('columnheader').allTextContents()).map((h) =>
    h.trim().toLowerCase(),
  )
  const index = headings.indexOf(heading.trim().toLowerCase())
  if (index < 0) throw new Error(`no column "${heading}" in ${JSON.stringify(headings)}`)
  return index
}

/**
 * Every path must answer — a link to a 404 is still a broken link.
 *
 * A dev server under load can answer 5xx/429, so those are retried; a 404 is
 * a real answer and fails the test.
 */
export async function expectLive(page: Page, paths: readonly string[]): Promise<void> {
  for (const path of paths) {
    let status = 0
    for (let attempt = 0; attempt < 3 && status !== 200; attempt++) {
      status = (await page.request.get(path)).status()
      if (status !== 200 && status !== 404) await page.waitForTimeout(250)
    }
    expect(status, `${path} should be a live route`).toBe(200)
  }
}

/**
 * The first `<h1>` of the page, trimmed.
 *
 * The heading is waited for: the dev server streams the SSR HTML, so the
 * document can still be filling in when `domcontentloaded` fires.
 */
export async function h1Of(page: Page): Promise<string> {
  const h1 = page.locator('h1').first()
  try {
    await h1.waitFor({ state: 'attached', timeout: 10_000 })
  } catch {
    return ''
  }
  return ((await h1.innerText()) ?? '').trim()
}

/** The document title, trimmed. Waits for the head to be parsed. */
export async function titleOf(page: Page): Promise<string> {
  await page
    .waitForFunction(() => document.title.trim().length > 0, undefined, { timeout: 10_000 })
    .catch(() => {})
  return (await page.title()).trim()
}
