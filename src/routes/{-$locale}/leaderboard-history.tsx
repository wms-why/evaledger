import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { isIndexableLeaderboardHistory } from '@/features/seo/indexability'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { LeaderboardHistory } from '@/features/leaderboard/components/LeaderboardHistory'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/leaderboard-history')({
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
      path: '/leaderboard-history',
      title: dict.leaderboard.historyPage.title,
      description: dict.leaderboard.historyPage.metaDescription,
      // The page lists the scores that were ever overwritten. Until the
      // snapshot job lands there are none, and the page has nothing to show
      // that its parent does not.
      indexable: isIndexableLeaderboardHistory(),
    })
    return { meta, links }
  },
  component: LeaderboardHistoryPage,
})

function LeaderboardHistoryPage() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn } = Route.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <div className="mx-auto max-w-5xl px-5 py-12 md:px-7 md:py-16">
        <LeaderboardHistory />
      </div>
      <Footer theme={theme} />
    </div>
  )
}
