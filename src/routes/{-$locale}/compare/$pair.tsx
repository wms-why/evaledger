import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { localeHead, breadcrumbLd } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, translate, type Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { CompareResult } from '@/features/leaderboard/components/CompareResult'
import { CostQuickCalc } from '@/features/leaderboard/components/CostQuickCalc'
import { PopularComparisons } from '@/features/leaderboard/components/CompareTool'
import { CompareHeroTech } from '@/features/leaderboard/components/CompareHeroTech'
import { CompareHeroPlan } from '@/features/leaderboard/components/CompareHeroPlan'
import { CompareHeroEcosystem } from '@/features/leaderboard/components/CompareHeroEcosystem'
import { findComparePair } from '@/features/leaderboard/leaderboard'
import { findLeaderboardModel } from '@/features/leaderboard/models'

const rootRoute = getRouteApi('__root__')

function heroFor(kind: 'technical' | 'plan' | 'ecosystem') {
  if (kind === 'plan') return CompareHeroPlan
  if (kind === 'ecosystem') return CompareHeroEcosystem
  return CompareHeroTech
}

export const Route = createFileRoute('/{-$locale}/compare/$pair')({
  loader: async ({ params }) => {
    const entry = findComparePair(params.pair)
    if (!entry) throw notFound()
    const a = findLeaderboardModel(entry.a)
    const b = findLeaderboardModel(entry.b)
    if (!a || !b) throw notFound()
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user, entry, a, b }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const a = loaderData?.a
    const b = loaderData?.b
    const title = a && b ? `${a.displayName} vs ${b.displayName} — ${dict.leaderboard.compare.title}` : dict.leaderboard.compare.title
    const description =
      a && b
        ? dict.leaderboard.compare.pairMetaDescription
            .replace('{a}', a.displayName)
            .replace('{b}', b.displayName)
        : dict.leaderboard.compare.metaDescription
    const path = `/compare/${loaderData?.entry.slug ?? params.pair}`
    const { meta, links } = localeHead({
      origin,
      locale,
      path,
      title,
      description,
      scripts: [
        breadcrumbLd(origin, locale, [
          { name: dict.common.appName, path: '/' },
          { name: translate(dict, 'linking.breadcrumb.compare'), path: '/compare' },
          { name: title, path },
        ]),
      ],
    })
    return { meta, links }
  },
  component: ComparePairPage,
})

function ComparePairPage() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn, entry, a, b } = Route.useLoaderData()
  const Hero = heroFor(entry.kind)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <Hero a={a} b={b} />
      <div className="mx-auto max-w-5xl space-y-10 px-5 py-12 md:px-7">
        <CompareResult models={[a, b]} />
        <CostQuickCalc models={[a, b]} />
        <PopularComparisons exclude={entry.slug} />
      </div>
      <Footer theme={theme} />
    </div>
  )
}
