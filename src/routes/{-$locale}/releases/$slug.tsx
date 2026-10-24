import { Link, createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { Suspense } from 'react'
import { localeHead, jsonLd, breadcrumbLd } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { useTranslation } from '@/features/i18n/provider'
import { dictionaries, translate, type Locale } from '@/features/i18n/locale'
import { findReleaseBySlug } from '@/features/releases/select'
import { getReleases } from '@/features/releases/releases.fns'
import {
  ReleaseFactSheet,
  releaseVendorLabel,
} from '@/features/releases/components/ReleaseFactSheet'
import { findPriceModel } from '@/features/releases/data'
import { seriesForScoreId } from '@/features/series/select'
import { fmtDate } from '@/lib/format-date'
import browserCollections from 'collections/browser'

const rootRoute = getRouteApi('__root__')

const clientLoader = browserCollections.releases.createClientLoader({
  id: 'releases',
  component({ default: MDX }) {
    return <MDX />
  },
})

export const Route = createFileRoute('/{-$locale}/releases/$slug')({
  loader: async ({ params }) => {
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const [origin, user, entries] = await Promise.all([
      getOrigin(),
      getOptionalUser(),
      getReleases({ data: locale }),
    ])
    const entry = findReleaseBySlug(entries, params.slug)
    if (!entry) throw notFound()
    await clientLoader.preload(entry.path)
    const related = entries.filter((e) => e.slug !== entry.slug).slice(0, 3)
    // The version line this model belongs to: a release post answers "what
    // does this launch change", the series page answers "is the version I
    // already run worth switching to". Neither question can answer the other.
    const series = entry.modelSlug
      ? (seriesForScoreId(entry.modelSlug) ?? undefined)
      : undefined
    return { origin, loggedIn: !!user, entry, related, series }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const entry = loaderData?.entry
    const title = entry
      ? `${entry.title} — ${dict.releases.title}`
      : dict.releases.title
    const description = entry?.description ?? dict.releases.subtitle
    const path = `/releases/${params.slug}`
    const model = entry ? findPriceModel(entry.modelId) : undefined

    const scripts = entry
      ? [
          jsonLd({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: entry.title,
            description,
            datePublished: entry.date,
            // NO `dateModified`: `checkedAt` is the day the PRICES were last
            // re-verified, not the day the article was edited. Publishing it
            // as a modification date would tell a search engine the prose
            // changed every time somebody re-checked a rate.
            inLanguage: locale === 'zh' ? 'zh-CN' : 'en',
            isBasedOn: entry.sourceUrl,
            url: `${origin}${locale === 'zh' ? `/zh${path}` : path}`,
            publisher: { '@type': 'Organization', name: 'EvalLedger', url: origin },
            about: model
              ? { '@type': 'Thing', name: model.displayName, description: `LLM pricing analysis` }
              : entry.modelName
                ? { '@type': 'Thing', name: entry.modelName, description: `LLM pricing analysis` }
                : undefined,
          }),
          breadcrumbLd(origin, locale, [
            { name: dict.common.appName, path: '/' },
            { name: translate(dict, 'linking.breadcrumb.releases'), path: '/releases' },
            { name: entry.title, path },
          ]),
        ]
      : undefined

    const { meta, links } = localeHead({
      origin,
      locale,
      path,
      title,
      description,
      scripts,
      // A release post is an article, not a website — the root sets
      // `og:type: website` for the whole site, and this page says otherwise.
      ogType: 'article',
      articlePublishedTime: entry?.date,
    })
    return { meta, links, scripts }
  },
  component: ReleasePage,
})

function ReleasePage() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn, entry, related, series } = Route.useLoaderData()
  const { t } = useTranslation()

  const compareTarget = entry.modelSlug
    ? { a: entry.modelSlug, b: entry.compareSlugs[0] ?? entry.modelSlug }
    : undefined
  const price = findPriceModel(entry.modelId)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <main className="mx-auto max-w-3xl px-5 py-12 md:px-7 md:py-16">
        <Link
          to="/{-$locale}/releases"
          className="text-[13px] text-fg-3 underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          ← {t('releases.backToIndex')}
        </Link>

        <header className="mt-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-fg-3">
            {t('releases.kicker')} · {releaseVendorLabel(t, entry.vendor)}
          </p>
          <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.02em] md:text-[38px]">
            {entry.title}
          </h1>
          {entry.description && (
            <p className="mt-3 text-[15px] leading-relaxed text-fg-2">{entry.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-fg-3">
            {entry.pending && (
              <span className="font-medium text-primary">{t('releases.pendingBadge')}</span>
            )}
            <span>
              {t('releases.publishedOn')} {fmtDate(entry.date)}
            </span>
            {entry.releasedAt && (
              <span>
                {t('releases.releasedOn')} {fmtDate(entry.releasedAt)}
              </span>
            )}
            <span>
              {t('releases.checkedOn')} {fmtDate(entry.checkedAt)}
            </span>
          </div>
        </header>

        <section className="mt-10 rounded-[16px] border border-border bg-bg-alt/40 p-5 md:p-6">
          <ReleaseFactSheet meta={entry} />
        </section>

        {entry.videoSrc && (
          <figure className="mt-10">
            <video
              controls
              playsInline
              preload="metadata"
              poster={entry.videoPoster}
              className="w-full rounded-[14px] border border-border bg-black"
            >
              <source src={entry.videoSrc} type="video/mp4" />
            </video>
            {entry.videoCaption && (
              <figcaption className="mt-2 text-[12px] leading-relaxed text-fg-3">
                {entry.videoCaption}
              </figcaption>
            )}
          </figure>
        )}

        <article className="prose dark:prose-invert mt-12 max-w-none">
          <Suspense>{clientLoader.useContent(entry.path)}</Suspense>
        </article>

        <section className="mt-12 rounded-[16px] border border-border bg-card p-5 md:p-6">
          <h2 className="text-[18px] font-semibold">{t('releases.ctaTitle')}</h2>
          <p className="mt-1 text-[13px] text-fg-3">{t('releases.ctaNote')}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {compareTarget && (
              <Link
                to="/{-$locale}/compare"
                search={compareTarget}
                className="rounded-[8px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:opacity-90"
              >
                {t('releases.ctaCompare')}
              </Link>
            )}
            <Link
              to="/{-$locale}/token-cost-calculator"
              search={entry.pending ? {} : { model: entry.modelId }}
              className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-fg-2 hover:text-foreground"
            >
              {t('releases.ctaCalculator')}
            </Link>
            {entry.modelSlug && (
              <Link
                to="/{-$locale}/models/$slug"
                params={{ slug: entry.modelSlug }}
                className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-fg-2 hover:text-foreground"
              >
                {t('releases.ctaModel')}
              </Link>
            )}
            {series && (
              <Link
                to="/{-$locale}/series/$slug"
                params={{ slug: series.slug }}
                className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-fg-2 hover:text-foreground"
              >
                {t('releases.ctaSeries', { series: series.name })}
              </Link>
            )}
          </div>
        </section>

        <section className="mt-8 border-t border-border pt-6">
          <h2 className="text-[13px] font-semibold text-fg-2">{t('releases.source')}</h2>
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-[13px] text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {entry.sourceTitle}
          </a>
          <p className="mt-1 text-[12px] text-fg-3">
            {t('releases.sourceNote', { date: fmtDate(entry.checkedAt) })}
            {price ? ` · ${t('releases.sourcePrice', { name: price.displayName })}` : ''}
          </p>
        </section>

        {related.length > 0 && (
          <section className="mt-10 border-t border-border pt-6">
            <h2 className="text-[13px] font-semibold text-fg-2">{t('releases.relatedTitle')}</h2>
            <div className="mt-2 flex flex-col gap-1.5">
              {related.map((r) => (
                <Link
                  key={r.path}
                  to="/{-$locale}/releases/$slug"
                  params={{ slug: r.slug }}
                  className="text-[13px] text-fg-2 hover:text-primary"
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer theme={theme} />
    </div>
  )
}
