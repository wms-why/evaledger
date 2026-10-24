import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { localeHead, breadcrumbLd } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, translate, type Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { BestCategoryPage } from '@/features/leaderboard/components/BestCategoryPage'
import { findBestCategory } from '@/features/leaderboard/leaderboard'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/best/$category')({
  loader: async ({ params }) => {
    const category = findBestCategory(params.category)
    if (!category) throw notFound()
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user, category }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const slug = params.category
    const title = translate(dict, `leaderboard.best.${slug}.title`)
    // Each category has its OWN description. One shared sentence across
    // every use-case page told a crawler that nine pages were the same page.
    const description = translate(dict, `leaderboard.best.${slug}.metaDescription`)
    const { meta, links } = localeHead({
      origin,
      locale,
      path: `/best/${slug}`,
      title: `${title} — ${dict.common.appName}`,
      description,
      scripts: [
        breadcrumbLd(origin, locale, [
          { name: dict.common.appName, path: '/' },
          { name: translate(dict, 'linking.breadcrumb.best'), path: '/best' },
          { name: title, path: `/best/${slug}` },
        ]),
      ],
    })
    return { meta, links }
  },
  component: BestPage,
})

function BestPage() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn, category } = Route.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <div className="mx-auto max-w-4xl px-5 py-12 md:px-7 md:py-16">
        <BestCategoryPage category={category} />
      </div>
      <Footer theme={theme} />
    </div>
  )
}
