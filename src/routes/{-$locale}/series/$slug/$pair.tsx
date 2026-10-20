import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { isIndexableSeriesPair } from '@/features/seo/indexability'
import { jsonLd, localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { SeriesCostCalc } from '@/features/series/components/SeriesCostCalc'
import { SeriesLadder } from '@/features/series/components/SeriesLadder'
import { SeriesPairVerdict } from '@/features/series/components/SeriesVerdict'
import { SeriesScoreMatrix } from '@/features/series/components/SeriesScoreMatrix'
import { seriesRows, seriesScoreModels } from '@/features/series/data'
import { findSeries, findSeriesPair, pairSlug } from '@/features/series/select'

/**
 * Two versions of ONE line, head to head — `/series/claude-opus/opus-5.5-vs-opus-5`.
 *
 * The pair must belong to the line: comparing a version of one line with a
 * version of another is what `/compare/$pair` is for.
 */
export const Route = createFileRoute('/{-$locale}/series/$slug/$pair')({
  loader: async ({ params }) => {
    const series = findSeries(params.slug)
    if (!series) throw notFound()
    const pair = findSeriesPair(series, params.pair)
    if (!pair) throw notFound()
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    const rows = seriesRows(series)
    const a = rows.find((row) => row.key === pair[0].key)
    const b = rows.find((row) => row.key === pair[1].key)
    if (!a || !b) throw notFound()
    // The canonical slug is the newer-first one, whatever word order the
    // visitor typed — otherwise both orders would self-canonicalize.
    const canonicalSlug = pairSlug(pair[0].key, pair[1].key)
    const scoreModels = seriesScoreModels(series).filter(
      (model) => model.id === a.scoreId || model.id === b.scoreId,
    )
    return { origin, loggedIn: !!user, series, a, b, scoreModels, canonicalSlug }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const a = loaderData?.a
    const b = loaderData?.b
    const title = a && b ? dict.series.pairTitle.replace('{a}', a.displayName).replace('{b}', b.displayName) : dict.series.pageMetaTitle
    const description =
      a && b
        ? dict.series.pairMetaDescription
            .replace('{a}', a.displayName)
            .replace('{b}', b.displayName)
        : dict.series.pageMetaDescription
    const path = `/series/${params.slug}/${loaderData?.canonicalSlug ?? params.pair}`
    const { meta, links } = localeHead({
      origin,
      locale,
      path,
      title,
      description,
      // Only compare what both versions report: a pair with an unscored side
      // renders an honest empty state. Slug-only, so both languages agree.
      indexable: isIndexableSeriesPair(params.slug, params.pair),
      scripts: [
        jsonLd({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: dict.series.jsonLdName.replace('{series}', loaderData?.series.name ?? ''),
          description,
          itemListElement: [a, b]
            .filter(Boolean)
            .map((row, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: row!.displayName,
              url: row!.scoreId ? `${origin}/models/${row!.scoreId}` : undefined,
            })),
        }),
      ],
    })
    return { meta, links }
  },
  component: SeriesPairPage,
})

function SeriesPairPage() {
  const { series, a, b, scoreModels } = Route.useLoaderData()
  const { t } = useTranslation()

  return (
    <div className="space-y-10">
      <header>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-fg-3">
          {t('series.indexKicker')}
        </p>
        <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-foreground md:text-[36px]">
          {t('series.pairTitle', { a: a.displayName, b: b.displayName })}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-fg-2">
          {t('series.pairMetaDescription', { a: a.displayName, b: b.displayName })}
        </p>
      </header>

      <SeriesPairVerdict a={a} b={b} />

      <section className="space-y-3">
        <div>
          <h2 className="text-[17px] font-semibold text-foreground">
            {t('series.pairLadderTitle')}
          </h2>
          <p className="mt-1 text-[13px] text-fg-3">{t('series.ladderSubtitle')}</p>
        </div>
        <SeriesLadder rows={[a, b]} />
        <p className="text-[12px] leading-relaxed text-fg-3">{t('series.ladderNote')}</p>
      </section>

      <SeriesScoreMatrix models={scoreModels} />

      <SeriesCostCalc rows={[a, b]} />

      <p className="text-[13px]">
        <Link
          to="/{-$locale}/series/$slug"
          params={{ slug: series.slug }}
          className="text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {t('series.siblingsTitle', { series: series.name })}
        </Link>
        {' · '}
        <Link
          to="/{-$locale}/series"
          className="text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {t('series.backToIndex')}
        </Link>
      </p>
    </div>
  )
}
