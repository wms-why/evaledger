import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { Methodology } from '@/features/leaderboard/components/Methodology'

const rootRoute = getRouteApi('__root__')

/**
 * `/methodology` — how every score on this site is computed.
 *
 * The trust story lives here: the formula, the weights, the field best each
 * benchmark is normalized against, and where every score was read from.
 */
export const Route = createFileRoute('/{-$locale}/methodology')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/methodology',
      title: `${dict.leaderboard.methodology.title} — ${dict.common.appName}`,
      description: dict.leaderboard.methodology.metaDescription,
    })
    return { meta, links }
  },
  component: MethodologyPage,
})

function MethodologyPage() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn } = Route.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <main className="mx-auto max-w-4xl px-5 py-12 md:px-7 md:py-16">
        <Methodology />
      </main>
      <Footer theme={theme} />
    </div>
  )
}
