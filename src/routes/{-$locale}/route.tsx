import { createFileRoute, Outlet, redirect, notFound } from '@tanstack/react-router'
import { I18nProvider } from '@/features/i18n/provider'
import { isLocale, defaultLocale, stripDefaultLocalePrefix, type Locale } from '@/features/i18n/locale'
import { ImpersonationBanner } from '@/features/admin/components/impersonation-banner'

export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: ({ params, location }) => {
    const loc = (params as { locale?: string }).locale
    if (loc === undefined) return                  // en (no prefix) — ok
    if (loc === defaultLocale) {                    // '/en/...' → strip to canonical no-prefix
      // href (not pathname) so query/hash survive — /en/sponsor?status=success 带参回跳
      // 301, not TanStack's default 307: the English prefix is a permanent
      // alias of the unprefixed URL (`/en` → `/`), exactly like
      // `/token-calculator` → `/token-cost-calculator`. A temporary redirect
      // tells a crawler to keep the alias and re-check it forever, which is
      // the duplicate-address problem the canonical prefix exists to solve.
      throw redirect({ href: stripDefaultLocalePrefix(location.href), statusCode: 301 })
    }
    if (!isLocale(loc)) throw notFound()            // unknown segment
  },
  component: LocaleLayout,
})

function LocaleLayout() {
  const { locale } = Route.useParams() as { locale?: string }
  const resolved: Locale = isLocale(locale) ? locale : defaultLocale
  return (<I18nProvider locale={resolved}><ImpersonationBanner /><Outlet /></I18nProvider>)
}
