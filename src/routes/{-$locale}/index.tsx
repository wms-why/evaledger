import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router'
import { localeHead, jsonLd } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { buttonVariants } from '@/components/ui/button'
import { LeaderboardTable } from '@/features/leaderboard/components/LeaderboardTable'
import { PopularComparisons } from '@/features/leaderboard/components/CompareTool'
import { LEADERBOARD } from '@/features/leaderboard/models'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const title = dict.leaderboard.home.title
    const description = dict.leaderboard.home.metaDescription
    const url = `${origin}${locale === 'en' ? '' : '/' + locale}`

    const organization = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: dict.common.appName,
      url,
      logo: `${origin}/logo512.png`,
      description,
    }
    const website = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: title,
      url,
      description,
    }
    const { meta, links, scripts } = localeHead({
      origin,
      locale,
      path: '/',
      title,
      description,
      scripts: [jsonLd(organization), jsonLd(website)],
    })
    return { meta, links, scripts }
  },
  component: Home,
})

function Home() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn } = Route.useLoaderData()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <main className="mx-auto max-w-7xl px-5 py-10 md:px-7 md:py-14">
        <section id="leaderboard" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em] md:text-[36px]">
              {t('leaderboard.home.h1')}
            </h1>
            <span className="text-[12px] text-fg-3">
              {t('leaderboard.home.updated')}: {LEADERBOARD.fetchedAt.slice(0, 10)}
            </span>
          </div>
          <LeaderboardTable />
        </section>

        <p className="mx-auto mt-8 max-w-[720px] text-center text-[16px] text-fg-2">
          {t('leaderboard.home.positioning')}
        </p>

        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-[18px] font-semibold">{t('leaderboard.home.compareTitle')}</h2>
            <p className="mt-2 text-[14px] text-fg-2">{t('leaderboard.home.compareBody')}</p>
            <Link to="/{-$locale}/compare" className={buttonVariants({ className: 'mt-4' })}>
              {t('leaderboard.home.compareCta')}
            </Link>
          </div>
          <PopularComparisons />
        </section>

        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-[15px] font-semibold">{t('leaderboard.home.browse')}</h2>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
            <Link to="/{-$locale}/token-calculator" className="text-primary hover:text-foreground">
              {t('leaderboard.navCalculator')}
            </Link>
            <Link to="/{-$locale}/leaderboard-history" className="text-fg-2 hover:text-primary">
              {t('leaderboard.navHistory')}
            </Link>
            <Link
              to="/{-$locale}/benchmarks/$slug"
              params={{ slug: 'gpqa-diamond' }}
              className="text-fg-2 hover:text-primary"
            >
              {t('leaderboard.navBenchmarks')}
            </Link>
            <Link
              to="/{-$locale}/best/$category"
              params={{ category: 'for-coding' }}
              className="text-fg-2 hover:text-primary"
            >
              {t('leaderboard.navBest')}
            </Link>
          </div>
        </section>
      </main>
      <Footer theme={theme} />
    </div>
  )
}
