import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { isIndexableTrack } from '@/features/seo/indexability'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, translate, type Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { TrackBoard } from '@/features/leaderboard/components/TrackBoard'
import { findTrack } from '@/features/leaderboard/scoring'

const rootRoute = getRouteApi('__root__')

/**
 * One capability board — `/leaderboard/coding`, `/leaderboard/agent`, …
 *
 * A board is a ranking with a published formula: the benchmarks it scores
 * on, their weights, and the field best each one is normalized against.
 */
export const Route = createFileRoute('/{-$locale}/leaderboard/$track/')({
  loader: async ({ params }) => {
    const track = findTrack(params.track)
    if (!track) throw notFound()
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user, track }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const track = loaderData?.track
    const label = track ? translate(dict, track.labelKey) : params.track
    const { meta, links } = localeHead({
      origin,
      locale,
      path: `/leaderboard/${params.track}`,
      title: `${label} — ${dict.common.appName}`,
      description: track
        ? translate(dict, 'leaderboard.track.metaDescription', { track: label })
        : dict.marketing.brandMetaDescription,
      // A board nobody qualifies for yet stays reachable, but it must not
      // compete for the index budget.
      indexable: isIndexableTrack(params.track),
    })
    return { meta, links }
  },
  component: TrackPage,
})

function TrackPage() {
  const { theme } = rootRoute.useLoaderData()
  const { track, loggedIn } = Route.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <main className="mx-auto max-w-5xl px-5 py-12 md:px-7 md:py-16">
        <TrackBoard track={track} />
      </main>
      <Footer theme={theme} />
    </div>
  )
}
