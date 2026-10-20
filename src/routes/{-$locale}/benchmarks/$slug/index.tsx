import { createFileRoute, notFound } from '@tanstack/react-router'
import { isIndexableBenchmark } from '@/features/seo/indexability'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { BenchmarkDetail } from '@/features/leaderboard/components/BenchmarkDetail'
import { getBenchmark } from '@/features/leaderboard/leaderboard'

export const Route = createFileRoute('/{-$locale}/benchmarks/$slug/')({
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
      path: `/benchmarks/${params.slug}`,
      title: `${name} — ${dict.leaderboard.benchmark.metaTitleSuffix}`,
      description: loaderData?.benchmark.description ?? dict.marketing.brandMetaDescription,
      // A benchmark nobody has scored yet stays reachable, but it must not
      // compete for the index budget. The decision comes from the slug only,
      // so the zh twin of a thin page is thin too.
      indexable: isIndexableBenchmark(params.slug),
    })
    return { meta, links }
  },
  component: BenchmarkPage,
})

function BenchmarkPage() {
  const { benchmark } = Route.useLoaderData()
  return <BenchmarkDetail benchmark={benchmark} />
}
