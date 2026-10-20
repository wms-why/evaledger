import { createFileRoute, getRouteApi, Outlet } from '@tanstack/react-router'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'

const rootRoute = getRouteApi('__root__')

/**
 * Layout for every page of one product line — the ladder page and the
 * two-version pages below it.
 */
export const Route = createFileRoute('/{-$locale}/series/$slug')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  component: SeriesLayout,
})

function SeriesLayout() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn } = Route.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <div className="mx-auto max-w-5xl px-5 py-12 md:px-7 md:py-16">
        <Outlet />
      </div>
      <Footer theme={theme} />
    </div>
  )
}
