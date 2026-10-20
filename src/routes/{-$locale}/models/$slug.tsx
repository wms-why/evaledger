import { Link, createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { ModelProfile } from '@/features/leaderboard/components/ModelProfile'
import { findLeaderboardModel } from '@/features/leaderboard/models'
import { getReleases } from '@/features/releases/releases.fns'
import { seriesForPriceId, seriesForScoreId } from '@/features/series/select'

const rootRoute = getRouteApi('__root__')

/** Release posts — used to cross-link a model page with its launch analysis. */
export const Route = createFileRoute('/{-$locale}/models/$slug')({
  loader: async ({ params }) => {
    const model = findLeaderboardModel(params.slug)
    if (!model) throw notFound()
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const [origin, user, entries] = await Promise.all([
      getOrigin(),
      getOptionalUser(),
      getReleases({ data: locale }),
    ])
    const relatedRelease = entries.find((e) => e.modelSlug === model.id)
    // The line this model belongs to, matched on the score row first and on
    // the price row second (a member can have one without the other).
    const series =
      seriesForScoreId(model.id) ?? (model.priceId ? seriesForPriceId(model.priceId) : undefined)
    return { origin, loggedIn: !!user, model, relatedRelease, series }
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
  const { loggedIn, model, relatedRelease, series } = Route.useLoaderData()
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <div className="mx-auto max-w-5xl px-5 py-12 md:px-7 md:py-16">
        <ModelProfile model={model} />
        {series && (
          // The version line this model belongs to: a model page answers
          // "how good is this model", the series page answers "is the newer
          // version worth switching to" — the question a model page alone
          // cannot answer.
          <aside className="mt-10 rounded-[12px] border border-border bg-bg-alt/40 p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-fg-3">
              {t('series.modelLink')}
            </p>
            <p className="mt-2 text-[15px] font-medium">
              <Link
                to="/{-$locale}/series/$slug"
                params={{ slug: series.slug }}
                className="hover:text-primary"
              >
                {series.name}
              </Link>
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-2">
              {t('series.versionCount', { n: series.members.length })}
            </p>
          </aside>
        )}
        {relatedRelease && (
          <aside className="mt-10 rounded-[12px] border border-border bg-bg-alt/40 p-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-fg-3">
              {relatedRelease.releasedAt ? relatedRelease.releasedAt : relatedRelease.date}
            </p>
            <p className="mt-2 text-[15px] font-medium">
              <Link
                to="/{-$locale}/releases/$slug"
                params={{ slug: relatedRelease.slug }}
                className="hover:text-primary"
              >
                {relatedRelease.title}
              </Link>
            </p>
            {relatedRelease.description && (
              <p className="mt-1 text-[13px] leading-relaxed text-fg-2">
                {relatedRelease.description}
              </p>
            )}
          </aside>
        )}
      </div>
      <Footer theme={theme} />
    </div>
  )
}
