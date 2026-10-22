import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { getOptionalUser } from '@/features/auth/middleware'
import { DataQualitySummary } from '@/features/data-quality/components/DataQualitySummary'
import { DataQualityTable } from '@/features/data-quality/components/DataQualityTable'
import { DataReportForm } from '@/features/data-quality/components/DataReportForm'
import { DataSourceTable } from '@/features/data-quality/components/DataSourceTable'
import { dataQualitySummary, modelQuality, scoreSources } from '@/features/data-quality/quality'
import { useTranslation } from '@/features/i18n/provider'
import { dictionaries, translate, type Locale } from '@/features/i18n/locale'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/data-quality')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return {
      origin,
      // The report form needs the account email (it is the contact address);
      // an anonymous visitor sees the sign-in gate instead.
      viewer: user ? { email: user.email } : null,
      quality: modelQuality(),
      summary: dataQualitySummary(),
      sources: scoreSources(),
      models: LEADERBOARD.models.map((m) => ({ id: m.id, displayName: m.displayName })),
    }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const title = translate(dict, 'dataQuality.title')
    const description = translate(dict, 'dataQuality.metaDescription')
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/data-quality',
      title: `${title} — ${dict.common.appName}`,
      description,
    })
    return { meta, links }
  },
  component: DataQualityPage,
})

function DataQualityPage() {
  const { theme } = rootRoute.useLoaderData()
  const { viewer, quality, summary, sources, models } = Route.useLoaderData()
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={!!viewer} />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-12 md:px-7 md:py-16">
        <header>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight md:text-[32px]">
            {t('dataQuality.title')}
          </h1>
          <p className="mt-3 max-w-[70ch] text-[15px] leading-relaxed text-fg-2">
            {t('dataQuality.intro')}
          </p>
        </header>

        <DataQualitySummary summary={summary} />

        <section id="data-quality-sources" className="flex flex-col gap-3">
          <h2 className="text-[19px] font-semibold leading-tight tracking-tight">
            {t('dataQuality.sources.title')}
          </h2>
          <p className="max-w-[70ch] text-[14px] leading-relaxed text-fg-2">
            {t('dataQuality.sources.note')}
          </p>
          <DataSourceTable rows={sources} />
        </section>

        <section id="data-quality-table" className="flex flex-col gap-3">
          <DataQualityTable rows={quality} />
        </section>

        <section id="data-quality-report" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <h2 className="text-[19px] font-semibold leading-tight tracking-tight">
                {t('dataQuality.report.title')}
              </h2>
              <CardDescription>{t('dataQuality.report.intro')}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataReportForm models={models} viewer={viewer} />
              <a
                href="#data-quality-table"
                className="mt-4 inline-block text-[13px] text-primary underline-offset-4 hover:underline"
              >
                {t('dataQuality.report.back')}
              </a>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer theme={theme} />
    </div>
  )
}
