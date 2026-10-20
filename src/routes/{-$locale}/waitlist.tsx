import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser, getTurnstileSiteKey } from '@/features/auth/middleware'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { useTranslation } from '@/features/i18n/provider'
import { WaitlistForm } from '@/features/waitlist/components/waitlist-form'
import type { Locale } from '@/features/i18n/locale'

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
    const dict = locale === 'zh' ? '加入候补名单' : 'Join the waitlist'
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/waitlist',
      title: `${dict} — EvalLedger`,
      description: locale === 'zh' ? '抢先体验 EvalLedger，第一时间获得通知。' : 'Be the first to try EvalLedger — get notified the moment we launch.',
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
