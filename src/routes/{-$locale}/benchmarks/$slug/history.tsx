import { createFileRoute, notFound } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
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
    })
    return { meta, links }
  },
  component: BenchmarkHistoryPage,
})

function BenchmarkHistoryPage() {
  const { benchmark } = Route.useLoaderData()
  return <BenchmarkTimeline benchmark={benchmark} />
}
