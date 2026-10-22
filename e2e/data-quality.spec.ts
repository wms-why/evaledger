import { expect, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'

/**
 * Filing a correction requires an account.
 *
 * The anonymous half of the flow is what this spec pins: the gate (not the
 * form) is rendered, the login link carries a locale-aware return path, and
 * the login page refuses to forward an off-site `next`. All of it is in the
 * server-rendered HTML, so the assertions do not depend on hydration.
 */
test.describe('data quality report gate', () => {
  for (const locale of ['en', 'zh'] as const) {
    const prefix = locale === 'zh' ? '/zh' : ''

    test(`${locale}: anonymous visitor sees the gate, not the form`, async ({ page }) => {
      await visit(page, `${prefix}/data-quality#data-quality-report`)

      await expect(
        page.getByRole('heading', { name: t(locale, 'dataQuality.report.signInTitle') }),
      ).toBeVisible()
      await expect(page.locator('#data-report-detail')).toHaveCount(0)

      const cta = page.getByRole('link', { name: t(locale, 'dataQuality.report.signInCta') })
      await expect(cta).toHaveAttribute(
        'href',
        `${prefix}/login?next=${encodeURIComponent(`${prefix}/data-quality#data-quality-report`)}`,
      )
    })
  }

  test('login forwards a same-origin next path and drops an off-site one', async ({ page }) => {
    await visit(page, '/login?next=%2Fdata-quality%23data-quality-report')
    await expect(page.getByRole('link', { name: t('en', 'auth.register') })).toHaveAttribute(
      'href',
      '/register?next=%2Fdata-quality%23data-quality-report',
    )

    await visit(page, '/login?next=//evil.example.com')
    await expect(page.getByRole('link', { name: t('en', 'auth.register') })).toHaveAttribute(
      'href',
      '/register',
    )
  })
})
