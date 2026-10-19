import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { ModelProfile } from '@/features/leaderboard/components/ModelProfile'
import { findLeaderboardModel } from '@/features/leaderboard/models'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/models/$slug')({
  loader: async ({ params }) => {
    const model = findLeaderboardModel(params.slug)
    if (!model) throw notFound()
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user, model }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const model = loaderData?.model
    const title = model
      ? `${model.displayName} — ${dict.leaderboard.model.metaTitleSuffix}`
      : dict.leaderboard.model.metaTitleSuffix
    const description = model
      ? dict.leaderboard.model.metaDescription.replace('{model}', model.displayName)
      : dict.marketing.brandMetaDescription
    const { meta, links } = localeHead({
      origin,
      locale,
      path: `/models/${params.slug}`,
      title,
      description,
    })
    return { meta, links }
  },
  component: ModelPage,
})

function ModelPage() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn, model } = Route.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <div className="mx-auto max-w-5xl px-5 py-12 md:px-7 md:py-16">
        <ModelProfile model={model} />
      </div>
      <Footer theme={theme} />
    </div>
  )
}
