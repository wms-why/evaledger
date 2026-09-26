import { createRootRoute, HeadContent, Outlet, Scripts, useParams } from '@tanstack/react-router'
import { dictionaries, isLocale, locales, defaultLocale, type Locale } from '@/features/i18n/locale'
import { getPreferences } from '@/server/preferences'
import { getOptionalUser } from '@/features/auth/middleware'
import { getAnalyticsToken } from '@/features/analytics/analytics'
import { Toaster } from '@/components/ui/sonner'
import { useResolvedTheme } from '@/features/theme/use-resolved-theme'
import appCss from '@/styles/app.css?url'

export const Route = createRootRoute({
  head: ({ params }) => {
    const raw = (params as { locale?: string }).locale
    const locale: Locale = (locales as readonly string[]).includes(raw ?? '')
      ? (raw as Locale)
      : defaultLocale
    const dict = dictionaries[locale]
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: dict.marketing.brandTitle },
        { name: 'description', content: dict.marketing.brandDescription },
        { property: 'og:title', content: dict.marketing.brandTitle },
        { property: 'og:description', content: dict.marketing.brandOgDescription },
        { property: 'og:type', content: 'website' },
      ],
      links: [
        { rel: 'stylesheet', href: appCss },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', type: 'image/png', href: '/logo192.png', sizes: '192x192' },
        { rel: 'apple-touch-icon', href: '/logo192.png' },
        { rel: 'manifest', href: '/manifest.json' },
      ],
    }
  },
  loader: async () => {
    // Never throw here: if the root loader errors, the error page replaces
    // RootComponent — i.e. the <html>/<head> shell and stylesheet — and every
    // page on the site renders as an unstyled fragment. All three values are
    // cosmetic/optional (theme cookie, header user, analytics token), so a
    // failure (e.g. a D1 blip in getOptionalUser) degrades to defaults instead.
    try {
      const { theme, themeFromCookie } = await getPreferences()
      const user = await getOptionalUser()
      const analyticsToken = await getAnalyticsToken()
      return { theme, themeFromCookie, user, analyticsToken }
    } catch {
      return { theme: 'dark' as const, themeFromCookie: false, user: null, analyticsToken: null }
    }
  },
  component: RootComponent,
})

/* Pre-paint theme resolution: cookie → respect explicit choice; cookie-less →
 * follow the OS via `prefers-color-scheme` (light or dark). Runs before first
 * paint so there is no flash. Deliberately does NOT write a cookie: visitors
 * keep following their system until they click the toggle (which does). */
const THEME_BOOT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)theme=(light|dark)/);var theme=m?m[1]:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.classList.toggle('light',theme==='light')}catch(e){}})()`

function RootComponent() {
  const { theme, analyticsToken } = Route.useLoaderData()
  const params = useParams({ strict: false }) as { locale?: string }
  // Validate before use: on 404s the optional {-$locale} param swallows the
  // first path segment, so `/no-such-page` would otherwise become lang="no-such-page".
  const lang = isLocale(params.locale) ? params.locale : defaultLocale
  const resolvedTheme = useResolvedTheme(theme)
  return (
    <html lang={lang} className={theme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
        <Toaster theme={resolvedTheme} />
        {/* Cloudflare Web Analytics — only when a beacon token is configured. */}
        {analyticsToken && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: analyticsToken })}
          />
        )}
      </body>
    </html>
  )
}
