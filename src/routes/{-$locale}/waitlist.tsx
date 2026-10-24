import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser, getTurnstileSiteKey } from '@/features/auth/middleware'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { useTranslation } from '@/features/i18n/provider'
import { WaitlistForm } from '@/features/waitlist/components/waitlist-form'
import { dictionaries, type Locale } from '@/features/i18n/locale'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/waitlist')({
  loader: async () => {
    const [origin, user, turnstileSiteKey] = await Promise.all([
      getOrigin(),
      getOptionalUser(),
      getTurnstileSiteKey(),
    ])
    return { origin, loggedIn: !!user, turnstileSiteKey }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    // The head reads the SAME dictionary the page's H1 reads — the local
    // variable used to be named `dict` while holding a bare string, so the
    // <title> and the <h1> came from two different sources.
    const dict = dictionaries[locale]
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/waitlist',
      title: `${dict.waitlist.title} — ${dict.common.appName}`,
      description: dict.waitlist.metaDescription,
      // The copy still says "we'll let you know the moment we launch" on a
      // site that has launched. An indexable page that contradicts itself is
      // worse than an unindexed one, and the sitemap must not advertise it
      // either; a product decision (repurpose or link it) can flip this.
      indexable: false,
    })
    return { meta, links }
  },
  component: WaitlistPage,
})

function WaitlistPage() {
  const { loggedIn, turnstileSiteKey } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <main className="mx-auto flex max-w-md flex-col px-4 py-20">
        <Card>
          <CardHeader>
            {/* The page's one heading is an <h1> — a card title is an <h3>,
                and the page needs a real top-level heading for its outline. */}
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {t('waitlist.title')}
            </h1>
            <CardDescription>{t('waitlist.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <WaitlistForm turnstileSiteKey={turnstileSiteKey} source="waitlist" />
          </CardContent>
        </Card>
      </main>
      <Footer theme={theme} />
    </div>
  )
}
