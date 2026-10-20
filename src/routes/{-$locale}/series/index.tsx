import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { SeriesIndexCard } from '@/features/series/components/SeriesIndexCard'
import { seriesRows } from '@/features/series/data'
import { listSeries } from '@/features/series/select'

const rootRoute = getRouteApi('__root__')

/**
 * The index of every product line we track versions for. Each card is one
 * line; the numbers on it are resolved from the registries at render time.
 */
export const Route = createFileRoute('/{-$locale}/series/')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    const series = listSeries().map((entry) => ({ series: entry, rows: seriesRows(entry) }))
    return { origin, loggedIn: !!user, series }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/series',
      title: dict.series.indexTitle,
      description: dict.series.indexMetaDescription,
    })
    return { meta, links }
  },
  component: SeriesIndexPage,
})

function SeriesIndexPage() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn, series } = Route.useLoaderData()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <div className="mx-auto max-w-5xl space-y-8 px-5 py-12 md:px-7 md:py-16">
        <header>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-fg-3">
            {t('series.indexKicker')}
          </p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-foreground md:text-[36px]">
            {t('series.indexTitle')}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-fg-2">
            {t('series.indexIntro')}
          </p>
        </header>

        {series.length === 0 ? (
          <p className="text-[14px] text-fg-3">{t('series.empty')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {series.map((entry) => (
              <SeriesIndexCard key={entry.series.slug} series={entry.series} rows={entry.rows} />
            ))}
          </div>
        )}
      </div>
      <Footer theme={theme} />
    </div>
  )
}
