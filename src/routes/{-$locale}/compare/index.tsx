import { createFileRoute, getRouteApi, useNavigate } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { CompareTool } from '@/features/leaderboard/components/CompareTool'

const rootRoute = getRouteApi('__root__')

const DEFAULT_A = 'claude-opus-5'
const DEFAULT_B = 'gpt-5.6-sol'

export const Route = createFileRoute('/{-$locale}/compare/')({
  validateSearch: (search: Record<string, unknown>): { a?: string; b?: string } => ({
    a: typeof search.a === 'string' ? search.a : undefined,
    b: typeof search.b === 'string' ? search.b : undefined,
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
  const a = search.a ?? DEFAULT_A
  const b = search.b ?? DEFAULT_B

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <div className="mx-auto max-w-5xl px-5 py-10 md:px-7 md:py-14">
        <CompareTool
          a={a}
          b={b}
          onChange={(nextA, nextB) =>
            navigate({ to: '/{-$locale}/compare', search: { a: nextA, b: nextB }, replace: true })
          }
        />
      </div>
      <Footer theme={theme} />
    </div>
  )
}
