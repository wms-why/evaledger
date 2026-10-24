import { createFileRoute, notFound } from '@tanstack/react-router'
import { isIndexableBenchmarkHistory } from '@/features/seo/indexability'
import { localeHead, breadcrumbLd } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, translate, type Locale } from '@/features/i18n/locale'
import { BenchmarkTimeline } from '@/features/leaderboard/components/BenchmarkTimeline'
import { getBenchmark } from '@/features/leaderboard/leaderboard'

export const Route = createFileRoute('/{-$locale}/benchmarks/$slug/history')({
  loader: async ({ params }) => {
    const benchmark = getBenchmark(params.slug)
    if (!benchmark) throw notFound()
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user, benchmark }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const name = loaderData?.benchmark.name ?? params.slug
    const { meta, links } = localeHead({
      origin,
      locale,
      path: `/benchmarks/${params.slug}/history`,
      title: `${name} ${dict.leaderboard.history.title} — ${dict.common.appName}`,
      description: dict.leaderboard.history.metaDescription,
      // With no snapshot on record this page has no series to draw — it falls
      // back to the parent page. Slug-only, so both languages agree.
      indexable: isIndexableBenchmarkHistory(params.slug),
      scripts: [
        breadcrumbLd(origin, locale, [
          { name: dict.common.appName, path: '/' },
          { name: translate(dict, 'linking.breadcrumb.benchmarks'), path: '/benchmarks' },
          { name, path: `/benchmarks/${params.slug}` },
          { name: translate(dict, 'linking.breadcrumb.history'), path: `/benchmarks/${params.slug}/history` },
        ]),
      ],
    })
    return { meta, links }
  },
  component: BenchmarkHistoryPage,
})

function BenchmarkHistoryPage() {
  const { benchmark } = Route.useLoaderData()
  return <BenchmarkTimeline benchmark={benchmark} />
}
