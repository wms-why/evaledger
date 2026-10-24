import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { isIndexableSeriesLine } from '@/features/seo/indexability'
import { jsonLd, localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { VENDOR_LABEL_KEY } from '@/features/leaderboard/vendors'
import { SeriesChanges } from '@/features/series/components/SeriesChanges'
import { SeriesCostCalc } from '@/features/series/components/SeriesCostCalc'
import { SeriesScoreMatrix } from '@/features/series/components/SeriesScoreMatrix'
import { SeriesVerdict } from '@/features/series/components/SeriesVerdict'
import { SeriesWhichToUse } from '@/features/series/components/SeriesWhichToUse'
import { SeriesLadder } from '@/features/series/components/SeriesLadder'
import { seriesRows, seriesScoreModels, seriesSteps, seriesVerdict } from '@/features/series/data'
import { findSeries, seriesPairs } from '@/features/series/select'
import { seriesRelease, vendorPricingPage } from '@/features/series/vendor-links'
import { getReleases } from '@/features/releases/releases.fns'

/**
 * One product line, every version of it, side by side.
 *
 * Everything on this page is resolved from REGISTRY / LEADERBOARD when it
 * renders — the route only carries the series slug. A price change updates
 * every line page that mentions it, and a line page can never contradict the
 * calculator.
 */
export const Route = createFileRoute('/{-$locale}/series/$slug/')({
  loader: async ({ params }) => {
    const series = findSeries(params.slug)
    if (!series) throw notFound()
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const rows = seriesRows(series)
    const scoreModels = seriesScoreModels(series)
    const [origin, user, releases] = await Promise.all([
      getOrigin(),
      getOptionalUser(),
      getReleases({ data: locale }),
    ])
    // The line's own launch analysis: the newest member's post when it has
    // one, matched by the model's registry / leaderboard id — never by a
    // guessed slug (see `seriesRelease`).
    const relatedRelease = seriesRelease(releases, series.members)
    // The vendor's own pricing landing — derived from the line's `vendor`.
    const pricingPage = vendorPricingPage(series.vendor)    // Pairs are resolved against the live rows so the links carry the current
    // display names, not the registry ids.
    const pairs = seriesPairs(series)
      .map((pair) => {
        const a = rows.find((row) => row.key === pair.a.key)
        const b = rows.find((row) => row.key === pair.b.key)
        return a && b ? { slug: pair.slug, a, b } : undefined
      })
      .filter((pair): pair is { slug: string; a: (typeof rows)[number]; b: (typeof rows)[number] } =>
        Boolean(pair),
      )
    return {
      origin,
      loggedIn: !!user,
      series,
      rows,
      steps: seriesSteps(rows),
      verdict: seriesVerdict(rows),
      scoreModels,
      pairs,
      relatedRelease: relatedRelease
        ? { slug: relatedRelease.slug, title: relatedRelease.title }
        : undefined,
      pricingPage: pricingPage ?? undefined,
    }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const series = loaderData?.series
    const name = series?.name ?? params.slug
    const title = dict.series.pageMetaTitle.replace('{series}', name)
    const description = dict.series.pageMetaDescription.replace('{series}', name)
    const path = `/series/${params.slug}`
    // Every member of the line is listed, even the ones with no model page
    // of their own — they are still versions of this line.
    const items = (loaderData?.rows ?? []).map((row, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: row.displayName,
      ...(row.scoreId ? { url: `${origin}/models/${row.scoreId}` } : {}),
    }))
    const { meta, links } = localeHead({
      origin,
      locale,
      path,
      title,
      description,
      // A line whose versions report no score has no ladder worth indexing —
      // but it stays reachable and linked. Slug-only, so both languages agree.
      indexable: isIndexableSeriesLine(params.slug),
      scripts: [
        jsonLd({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: dict.series.jsonLdName.replace('{series}', name),
          description,
          itemListElement: items,
        }),
      ],
    })
    return { meta, links }
  },
  component: SeriesPage,
})

function SeriesPage() {
  const { series, rows, steps, verdict, scoreModels, pairs, relatedRelease, pricingPage } =
    Route.useLoaderData()
  const { t } = useTranslation()

  return (
    <div className="space-y-10">
      <header>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-fg-3">
          {t('series.indexKicker')}
        </p>
        <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-foreground md:text-[36px]">
          {t('series.pageTitle', { series: series.name })}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-fg-2">
          {t('series.pageMetaDescription', { series: series.name })}
        </p>
      </header>

      {verdict ? <SeriesVerdict verdict={verdict} /> : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-[17px] font-semibold text-foreground">
            {t('series.ladderTitle', { series: series.name })}
          </h2>
          <p className="mt-1 text-[13px] text-fg-3">{t('series.ladderSubtitle')}</p>
        </div>
        <SeriesLadder rows={rows} />
        <p className="text-[12px] leading-relaxed text-fg-3">{t('series.ladderNote')}</p>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-[17px] font-semibold text-foreground">{t('series.changesTitle')}</h2>
          <p className="mt-1 text-[13px] text-fg-3">{t('series.changesSubtitle')}</p>
        </div>
        <SeriesChanges steps={steps} />
      </section>

      <SeriesScoreMatrix models={scoreModels} />

      <SeriesWhichToUse rows={rows} />

      <SeriesCostCalc rows={rows} />

      <section className="space-y-3">
        <h2 className="text-[17px] font-semibold text-foreground">{t('series.sourcesTitle')}</h2>
        <ul className="space-y-1.5 text-[13px] text-fg-2">
          {rows
            .filter((row) => row.sourceUrl)
            .map((row) => (
              <li key={row.key}>
                <a
                  href={row.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-dotted underline-offset-2 hover:text-foreground"
                >
                  {row.displayName}
                </a>
                <span className="text-fg-3">
                  {' — '}
                  {t('series.sourceVerified', { date: row.lastVerified ?? '' })}
                </span>
              </li>
            ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-[17px] font-semibold text-foreground">
          {t('series.pairLinksTitle', { series: series.name })}
        </h2>
        <div className="flex flex-wrap gap-2">
          {pairs.map((pair) => (
            <Link
              key={pair.slug}
              to="/{-$locale}/series/$slug/$pair"
              params={{ slug: series.slug, pair: pair.slug }}
              className="rounded-full border border-border bg-card px-3 py-1 text-[13px] text-fg-2 transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {t('series.pairTitle', { a: pair.a.displayName, b: pair.b.displayName })}
            </Link>
          ))}
        </div>
      </section>

      {relatedRelease || pricingPage ? (
        <aside className="rounded-[12px] border border-border bg-bg-alt/40 p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-fg-3">
            {t('site.series.nextTitle')}
          </p>
          <ul className="mt-3 space-y-3">
            {pricingPage ? (
              <li>
                <Link
                  to={pricingPage.to}
                  className="text-[15px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
                >
                  {t(pricingPage.labelKey)} →
                </Link>
                <p className="mt-0.5 text-[12.5px] text-fg-3">
                  {t('site.series.pricingTitle')} · {t(VENDOR_LABEL_KEY[series.vendor])}
                </p>
              </li>
            ) : null}
            {relatedRelease ? (
              <li>
                <Link
                  to="/{-$locale}/releases/$slug"
                  params={{ slug: relatedRelease.slug }}
                  className="text-[15px] font-medium underline decoration-dotted underline-offset-2 hover:text-primary"
                >
                  {relatedRelease.title} →
                </Link>
                <p className="mt-0.5 text-[12.5px] text-fg-3">{t('site.series.releaseTitle')}</p>
              </li>
            ) : null}
          </ul>
        </aside>
      ) : null}

      <p className="text-[13px]">
        <Link
          to="/{-$locale}/series"
          className="text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {t('series.backToIndex')}
        </Link>
      </p>

      {scoreModels.length > 1 ? (
        <p className="text-[13px]">
          <Link
            to="/{-$locale}/compare"
            search={{ models: scoreModels.map((model) => model.id).join(',') }}
            className="text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {t('series.interactiveCompare')}
          </Link>
        </p>
      ) : null}
    </div>
  )
}
