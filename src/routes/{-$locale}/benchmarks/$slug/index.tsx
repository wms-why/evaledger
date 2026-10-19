import { createFileRoute, notFound } from '@tanstack/react-router'
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
    })
    return { meta, links }
  },
  component: BenchmarkPage,
})

function BenchmarkPage() {
  const { benchmark } = Route.useLoaderData()
  return <BenchmarkDetail benchmark={benchmark} />
}
