import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { FAQ } from '@/components/marketing/faq'
import { Calculator } from '@/features/calculator/calculator'
import { CalculatorHero } from '@/features/calculator/components/CalculatorHero'
import { RelatedCalculators } from '@/features/calculator/components/RelatedCalculators'
import { REGISTRY } from '@/features/calculator/model-prices'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/token-calculator')({
  validateSearch: (search: Record<string, unknown>): { model?: string } => ({
    model: typeof search.model === 'string' ? search.model : undefined,
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
      path: '/token-calculator',
      title: dict.leaderboard.tokenCalculator.title,
      description: dict.leaderboard.tokenCalculator.metaDescription,
    })
    return { meta, links }
  },
  component: TokenCalculatorPage,
})

function TokenCalculatorPage() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn } = Route.useLoaderData()
  const { model } = Route.useSearch()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <CalculatorHero
        h1Key="leaderboard.tokenCalculator.h1"
        subtitleKey="leaderboard.tokenCalculator.subtitle"
        fetchedAt={REGISTRY.fetchedAt}
      />
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-7">
        <Calculator initialModelId={model} />
      </div>
      <FAQ
        id="faq"
        kickerKey="calculator.kicker"
        titleKey="calculator.faqTitle"
        faqs={[
          { qKey: 'calculator.faq1Q', aKey: 'calculator.faq1A' },
          { qKey: 'calculator.faq3Q', aKey: 'calculator.faq3A' },
          { qKey: 'calculator.faq4Q', aKey: 'calculator.faq4A' },
          { qKey: 'calculator.faq5Q', aKey: 'calculator.faq5A' },
          { qKey: 'calculator.faq8Q', aKey: 'calculator.faq8A' },
        ]}
      />
      <RelatedCalculators exclude="token" />
      <Footer theme={theme} />
    </div>
  )
}
