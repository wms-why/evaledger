import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright — end-to-end coverage for the **public** site.
 *
 * Scope: every user-facing page (landing, calculators, leaderboard, compare,
 * models, benchmarks, best-of, releases, series, legal, changelog, auth
 * screens) plus the machine-readable endpoints (sitemap / robots / feed /
 * price API). The admin console is deliberately out of scope — this project
 * ships no back office.
 *
 * These tests are NOT part of `pnpm test` (Vitest). Vitest owns the pure
 * logic and the D1-level behaviour; Playwright owns "does the page a visitor
 * actually lands on render, and does it render the right numbers".
 *
 *   npx playwright install chromium   # one-time browser download
 *   pnpm e2e                          # run everything in ./e2e
 *
 * The `webServer` below migrates the local D1 and boots `pnpm dev` before the
 * suite, and tears it down afterwards. If a dev server is already listening on
 * :3000 it is reused as-is (outside CI) — the suite then runs against whatever
 * that server has open, which is exactly what a developer wants locally.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000)
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  // Every spec drives its own browser context, so the pages are independent —
  // they can run in parallel.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // A dev server that re-bundles mid-run can still make one page flaky; one
  // retry turns "the optimizer reloaded" into a non-event.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  // A cold dev-server compile of a release post is not instant.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalSetup: './e2e/global-setup.ts',
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Escape hatch for a machine that already has a Chromium build but cannot
    // download the one this Playwright wants (offline CI, a locked-down
    // sandbox): point it at an executable and the suite uses that.
    ...(process.env.E2E_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.E2E_CHROMIUM_PATH } }
      : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // `db:migrate:local` only (no seed): the public pages need the schema,
    // and the seed script wipes the local `user` / `feedback` tables.
    command: 'pnpm db:migrate:local && pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      // Sandboxes that forbid writes to ~/Library need HOME inside the
      // workspace — wrangler writes its worker registry there.
      ...(process.env.E2E_HOME ? { HOME: process.env.E2E_HOME } : {}),
    },
  },
})
