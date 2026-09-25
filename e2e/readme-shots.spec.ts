import { test, expect, type BrowserContext } from '@playwright/test'
import { execSync } from 'node:child_process'

/**
 * Capture the authenticated pages used in the README "Preview" section.
 *
 * Produces dark-theme (default), 1440-wide full-page shots of the admin stats
 * dashboard, the admin user table, the app dashboard, and the Pro page. Written
 * to e2e/screenshots/readme/ (git-ignored); the good ones are copied into
 * .github/assets/ for the README.
 *
 *   npx playwright install chromium
 *   pnpm exec playwright test e2e/readme-shots.spec.ts
 *
 * Auth mirrors admin-users.spec.ts: sign up admin@example.com (in ADMIN_EMAILS
 * → admin role), mark it verified in the local D1, sign in. Then seed a lifetime
 * Pro subscription for that user so requirePlan('pro') on /app/pro passes.
 */

const ADMIN = { email: 'admin@example.com', password: 'password12345', name: 'Admin' }
const OUT = 'e2e/screenshots/readme'

function d1(command: string) {
  execSync(`npx wrangler d1 execute aibookplanner-db --local --command "${command}"`, {
    stdio: 'ignore',
  })
}

async function loginAsAdmin(context: BrowserContext, baseURL: string) {
  const origin = baseURL.replace(/\/$/, '')
  await context.request.post(`${origin}/api/auth/sign-up/email`, { headers: { origin }, data: ADMIN })
  d1(`UPDATE user SET email_verified = 1 WHERE email = '${ADMIN.email}'`)
  const res = await context.request.post(`${origin}/api/auth/sign-in/email`, {
    headers: { origin },
    data: { email: ADMIN.email, password: ADMIN.password },
  })
  expect(res.ok(), 'admin sign-in should succeed').toBeTruthy()
}

function seedLifetimePro() {
  // resolveEntitlement returns plan 'pro' for an active lifetime subscription.
  d1(
    `INSERT OR REPLACE INTO subscription ` +
      `(id, user_id, provider, customer_id, subscription_id, status, plan, price_id, ` +
      `current_period_end, cancel_at_period_end, lifetime, payment_failed_at, created_at, updated_at) ` +
      `SELECT 'sub-readme', id, 'stripe', 'cus_readme', NULL, 'active', 'pro', NULL, ` +
      `NULL, 0, 1, NULL, 0, 0 FROM user WHERE email = '${ADMIN.email}'`,
  )
}

test('README preview shots (dark, full page)', async ({ page, context, baseURL }) => {
  const base = baseURL ?? 'http://localhost:3000'
  await loginAsAdmin(context, base)
  seedLifetimePro()

  await page.setViewportSize({ width: 1440, height: 900 })

  const shots: Array<[string, string]> = [
    ['/admin', `${OUT}/admin.png`],
    ['/admin/users', `${OUT}/admin-users.png`],
    ['/app', `${OUT}/app-dashboard.png`],
    ['/app/pro', `${OUT}/app-pro.png`],
  ]

  for (const [path, file] of shots) {
    // 'networkidle' never settles under the vite dev HMR websocket — use load
    // + a fixed pause for entrance motion instead.
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: file, fullPage: true })
  }
})
