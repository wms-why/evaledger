import { createFileRoute, getRouteApi, useNavigate } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { CompareTool } from '@/features/leaderboard/components/CompareTool'
import {
  availableScoreIds,
  resolveCompareIds,
  resolveCompareScoreIds,
  serializeCompareIds,
  serializeCompareScores,
  type CompareSearch,
} from '@/features/leaderboard/compare-selection'
import { findLeaderboardModel } from '@/features/leaderboard/models'
import type { LeaderboardModel } from '@/features/leaderboard/types'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/compare/')({
  validateSearch: (search: Record<string, unknown>): CompareSearch => ({
    a: typeof search.a === 'string' ? search.a : undefined,
    b: typeof search.b === 'string' ? search.b : undefined,
    models: typeof search.models === 'string' ? search.models : undefined,
    scores: typeof search.scores === 'string' ? search.scores : undefined,
  }),
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/compare',
      title: dict.leaderboard.compare.title,
      description: dict.leaderboard.compare.metaDescription,
    })
    return { meta, links }
  },
  component: ComparePage,
})

function ComparePage() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const ids = resolveCompareIds(search)
  const models = ids
    .map((id) => findLeaderboardModel(id))
    .filter((model): model is LeaderboardModel => !!model)
  const availableScores = availableScoreIds(models)
  const scoreIds = resolveCompareScoreIds(search, availableScores)

  function navigateCompare(nextModels: string[], scores: string | undefined) {
    const nextSearch: CompareSearch = { models: serializeCompareIds(nextModels) }
    if (scores !== undefined) nextSearch.scores = scores
    navigate({
      to: '/{-$locale}/compare',
      search: nextSearch,
      replace: true,
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <div className="mx-auto max-w-5xl px-5 py-10 md:px-7 md:py-14">
        <CompareTool
          models={models}
          scoreIds={scoreIds}
          onChange={(next) => {
            // Keep the score-row choice across model changes;
            // resolveCompareScoreIds drops rows the new line-up cannot show.
            navigateCompare(next, search.scores)
          }}
          onScoresChange={(next) =>
            navigateCompare(ids, serializeCompareScores(next, availableScores))
          }
        />
      </div>
      <Footer theme={theme} />
    </div>
  )
}
