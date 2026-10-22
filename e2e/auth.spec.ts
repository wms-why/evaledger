import { expect, h1Of, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'
import type { Page } from '@playwright/test'

/**
 * The auth screens and the sign-in gate.
 *
 * The signed-in shell (`/app/*`) is not rendered here — it is only checked for
 * the one thing a logged-out visitor can see: the redirect to the login page.
 * The admin console is out of scope: this project ships no back office.
 */

/** The auth pages and the dictionary key that titles each one. */
const AUTH_PAGES = [
  { path: '/login', titleKey: 'auth.loginTitle' },
  { path: '/register', titleKey: 'auth.registerTitle' },
  { path: '/forgot-password', titleKey: 'auth.forgotTitle' },
  { path: '/reset-password', titleKey: 'auth.resetTitle' },
  { path: '/verify-email', titleKey: 'auth.verifyTitle' },
] as const

/** The signed-in shell — every one of these must bounce a logged-out visitor. */
const GATED_ROUTES = ['/app', '/app/account',  '/app/feedback'] as const

/** A page that threw or logged an error is broken, even when it rendered. */
function expectNoErrors(pageErrors: string[], consoleErrors: string[]): void {
  expect(pageErrors, 'the page should not throw').toEqual([])
  expect(realConsoleErrors(consoleErrors), 'the page should not log errors').toEqual([])
}

/**
 * Wait until the client app has booted.
 *
 * The dev server compiles the browser bundle on demand, so a page can still
 * be a static HTML shell when the first interaction lands: the click then
 * reaches no handler, and a filled input is wiped by the hydration that
 * follows. The client router only exists once the bundle has booted — that
 * is the point where the handlers are attached.
 */
async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => Boolean((window as { __TSR_ROUTER__?: unknown }).__TSR_ROUTER__),
    undefined,
    { timeout: 15_000 },
  )
}

test.describe('auth screens', () => {
  for (const { path, titleKey } of AUTH_PAGES) {
    test(`${path} renders its heading`, async ({ page, consoleErrors, pageErrors }) => {
      const response = await visit(page, path)
      expect(response?.status(), `${path} should answer 200`).toBe(200)
      expect(await h1Of(page)).toBe(t('en', titleKey))
      expectNoErrors(pageErrors, consoleErrors)
    })
  }

  test('/login exposes the sign-in button and the register link', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/login')
    await expect(page.getByText(t('en', 'auth.loginSub'))).toBeVisible()
    // The login page is Google-only: there is no email/password form on it.
    await expect(
      page.getByRole('button', { name: t('en', 'auth.continueWith', { provider: 'Google' }) }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: t('en', 'auth.register') })).toHaveAttribute('href', '/register')
    expectNoErrors(pageErrors, consoleErrors)
  })

  test('/register exposes the sign-up button and the login link', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/register')
    await expect(page.getByText(t('en', 'auth.registerSub'))).toBeVisible()
    await expect(
      page.getByRole('button', { name: t('en', 'auth.continueWith', { provider: 'Google' }) }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: t('en', 'auth.login') })).toHaveAttribute('href', '/login')
    expectNoErrors(pageErrors, consoleErrors)
  })

  test('/forgot-password exposes the email field and its submit button', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/forgot-password')
    await expect(page.getByText(t('en', 'auth.forgotSub'))).toBeVisible()
    await expect(page.getByLabel(t('en', 'auth.email'))).toBeVisible()
    await expect(page.getByRole('button', { name: t('en', 'auth.resetPassword') })).toBeVisible()
    expectNoErrors(pageErrors, consoleErrors)
  })

  test('/reset-password exposes the password field and its submit button', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    await visit(page, '/reset-password')
    await expect(page.getByText(t('en', 'auth.resetSub'))).toBeVisible()
    await expect(page.getByLabel(t('en', 'auth.newPassword'))).toBeVisible()
    await expect(page.getByRole('button', { name: t('en', 'auth.resetPassword') })).toBeVisible()
    expectNoErrors(pageErrors, consoleErrors)
  })

  test('/verify-email exposes the email field and its submit button', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/verify-email')
    await expect(page.getByText(t('en', 'auth.verifySub'))).toBeVisible()
    await expect(page.getByLabel(t('en', 'auth.email'))).toBeVisible()
    await expect(page.getByRole('button', { name: t('en', 'auth.resendVerification') })).toBeVisible()
    expectNoErrors(pageErrors, consoleErrors)
  })
})

test.describe('form validation', () => {
  test('a rejected submission shows an error message instead of crashing', async ({
    page,
    consoleErrors,
    pageErrors,
  }) => {
    // No reset token in the URL → the server call cannot succeed, and the
    // form must say so rather than blow up.
    await visit(page, '/reset-password')
    await waitForHydration(page)

    // A controlled input only keeps its value once React owns it — fill
    // until the value sticks, so a late hydration cannot swallow it.
    const password = page.getByLabel(t('en', 'auth.newPassword'))
    await expect(async () => {
      await password.fill('a-long-enough-password')
      await expect(password).toHaveValue('a-long-enough-password', { timeout: 1_000 })
    }).toPass({ timeout: 20_000 })

    // The click is retried until it lands: a dev-server re-bundle reloads the
    // page, and a click that lands in that window reaches no handler.
    await expect(async () => {
      await page.getByRole('button', { name: t('en', 'auth.resetPassword') }).click()
      await expect(page.getByText(t('en', 'auth.errors.invalidToken'))).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 20_000 })
    // still on the page, still readable
    expect(await h1Of(page)).toBe(t('en', 'auth.resetTitle'))
    expectNoErrors(pageErrors, consoleErrors)
  })
})

test.describe('the signed-in shell is gated', () => {
  for (const path of GATED_ROUTES) {
    test(`${path} redirects a logged-out visitor to the login page`, async ({
      page,
      consoleErrors,
      pageErrors,
    }) => {
      await visit(page, path)
      await page.waitForURL('**/login')
      expect(new URL(page.url()).pathname, `${path} should land on the login page`).toBe('/login')
      expect(await h1Of(page)).toBe(t('en', 'auth.loginTitle'))
      expectNoErrors(pageErrors, consoleErrors)
    })
  }

  test('the gate keeps the visitor in their language', async ({ page, consoleErrors, pageErrors }) => {
    await visit(page, '/zh/app')
    await page.waitForURL('**/zh/login')
    expect(new URL(page.url()).pathname).toBe('/zh/login')
    expect(await h1Of(page)).toBe(t('zh', 'auth.loginTitle'))
    expectNoErrors(pageErrors, consoleErrors)
  })
})
