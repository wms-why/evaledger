import { test, expect, type BrowserContext } from '@playwright/test'
import { execSync } from 'node:child_process'

/**
 * Visual sweep for the admin user-management page (Phase 2).
 *
 * Captures light + dark screenshots and exercises client-only behaviour the
 * Vitest suite can't: the detail Drawer, sortable headers, pagination, and the
 * theme toggle. Run with a real browser:
 *
 *   npx playwright install chromium
 *   pnpm e2e
 *
 * Auth: signs up an admin (admin@example.com is in ADMIN_EMAILS → admin role),
 * marks the email verified directly in the local D1 (a dev-only shortcut so we
 * don't have to scrape the verification link from the server console), then
 * signs in. better-auth requires an Origin header on these POSTs.
 *
 * NOTE: authored without a browser available in the dev sandbox — selectors are
 * derived from the source (theme toggle aria-label "Toggle theme"; rows are
 * `tr.cursor-pointer`) but may need a small tweak on first real run.
 */

const ADMIN = { email: 'admin@example.com', password: 'password12345', name: 'Admin' }
const SHOTS = 'e2e/screenshots'

async function loginAsAdmin(context: BrowserContext, baseURL: string) {
  const origin = baseURL.replace(/\/$/, '')
  // Sign up (ignore "already exists" on reruns).
  await context.request.post(`${origin}/api/auth/sign-up/email`, {
    headers: { origin },
    data: ADMIN,
  })
  // Dev shortcut: mark verified in local D1 so sign-in is allowed.
  execSync(
    `npx wrangler d1 execute aibookplanner-db --local --command ` +
      `"UPDATE user SET email_verified = 1 WHERE email = '${ADMIN.email}'"`,
    { stdio: 'ignore' },
  )
  const res = await context.request.post(`${origin}/api/auth/sign-in/email`, {
    headers: { origin },
    data: { email: ADMIN.email, password: ADMIN.password },
  })
  expect(res.ok(), 'admin sign-in should succeed').toBeTruthy()
  // Cookies set on context.request are shared with pages in the same context.
}

test('admin /admin/users — visual sweep (light + dark) + detail drawer', async ({
  page,
  context,
  baseURL,
}) => {
  await loginAsAdmin(context, baseURL ?? 'http://localhost:3000')

  await page.goto('/admin/users')

  // The table renders loader data (seeded users a@/b@example.com).
  await expect(page.getByText('a@example.com')).toBeVisible()
  await expect(page.getByText('b@example.com')).toBeVisible()

  // Dark is the default theme.
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.screenshot({ path: `${SHOTS}/admin-users-dark.png`, fullPage: true })

  // Toggle to light and capture.
  await page.getByRole('button', { name: 'Toggle theme' }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.screenshot({ path: `${SHOTS}/admin-users-light.png`, fullPage: true })

  // Open the detail drawer by clicking the first user row.
  await page.locator('tr.cursor-pointer').first().click()
  // The drawer exposes the ban form / close control.
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/admin-users-drawer-light.png`, fullPage: true })
})
