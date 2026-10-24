import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead, jsonLd, breadcrumbLd } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, translate, type Locale } from '@/features/i18n/locale'
import { hubText } from '@/features/i18n/dictionaries/hub'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import {
  BENCHMARK_HUB_FAQ_KEYS,
  BenchmarkHubPage,
} from '@/features/leaderboard/components/BenchmarkHubPage'

const rootRoute = getRouteApi('__root__')

/**
 * A `hub.*` string for the page head.
 *
 * The wired dictionary answers first; the module itself is the fallback until
 * the Lead wires `hub` into `en.ts` / `zh.ts`.
 */
function hubString(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const viaDictionary = translate(dictionaries[locale], key, params)
  if (viaDictionary !== key) return viaDictionary
  return hubText(locale, key, params) ?? key
}

/**
 * `/benchmarks` — the directory of every benchmark in the registry.
 *
 * The page used to be a dead end: the home page linked the generic word
 * "Benchmarks" straight to one benchmark. This page is the directory the
 * link deserved — every benchmark, grouped by category, each one linking to
 * its own leaderboard.
 */
export const Route = createFileRoute('/{-$locale}/benchmarks/')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const title = hubString(locale, 'hub.benchmarks.title')
    const description = hubString(locale, 'hub.benchmarks.metaDescription')

    // The same Q/A pairs the page renders, so the structured data and the
    // visible copy can never drift apart.
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: BENCHMARK_HUB_FAQ_KEYS.map(([questionKey, answerKey]) => ({
        '@type': 'Question',
        name: hubString(locale, questionKey),
        acceptedAnswer: { '@type': 'Answer', text: hubString(locale, answerKey) },
      })),
    }

    // The shared builder — the same trail every other page in the hierarchy
    // uses, so the hub's breadcrumb and a detail page's agree.
    const breadcrumbs = breadcrumbLd(origin, locale, [
      { name: dict.common.appName, path: '/' },
      { name: title, path: '/benchmarks' },
    ])

    const { meta, links, scripts } = localeHead({
      origin,
      locale,
      path: '/benchmarks',
      title: `${title} — ${dict.common.appName}`,
      description,
      scripts: [jsonLd(faq), breadcrumbs],
    })
    return { meta, links, scripts }
  },
  component: BenchmarksHub,
})

function BenchmarksHub() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn } = Route.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <main className="mx-auto max-w-4xl px-5 py-12 md:px-7 md:py-16">
        <BenchmarkHubPage />
      </main>
      <Footer theme={theme} />
    </div>
  )
}
