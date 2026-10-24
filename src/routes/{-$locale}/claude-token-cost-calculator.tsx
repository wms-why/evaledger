import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead, jsonLd } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, translate, type Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { FAQ } from '@/components/marketing/faq'
import { Calculator } from '@/features/calculator/calculator'
import { CalculatorHero } from '@/features/calculator/components/CalculatorHero'
import { PricingTLDR } from '@/features/calculator/components/PricingTLDR'
import { ClaudeSubscriptionSection } from '@/features/calculator/components/ClaudeSubscriptionSection'
import { Tips } from '@/features/calculator/components/Tips'
import { RelatedCalculators } from '@/features/calculator/components/RelatedCalculators'
import { claudeFaq, modelRateSummary } from '@/features/calculator/copy'
import { stripModelMarkers } from '@/features/calculator/model-links'
import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/claude-token-cost-calculator')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const title = dict.home.claudeTitle
    // The rates are the registry's, resolved at render time.
    const rates = modelRateSummary('claude-opus-5.5')
    const description = translate(dict, 'marketing.claudeMetaDescription', {
      model: rates.model,
      date: REGISTRY.fetchedAt,
    })
    const url = `${origin}${locale === 'en' ? '' : '/' + locale}/claude-token-cost-calculator`

    const app = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: dict.calculator.h1Claude,
      url,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', category: 'Free' },
    }
    // The FAQPage JSON-LD carries exactly the pairs the page renders, in
    // the same order, so the structured data and the visible copy can never
    // disagree. The answers are stripped of their model markers — schema.org
    // takes plain text, and a `[[model:…]]` marker in a rich result is a bug.
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: claudeFaq((key, params) => translate(dict, key, params)).map((entry) => ({
        '@type': 'Question',
        name: entry.q,
        acceptedAnswer: { '@type': 'Answer', text: stripModelMarkers(entry.a) },
      })),
    }

    const { meta, links, scripts } = localeHead({
      origin,
      locale,
      path: '/claude-token-cost-calculator',
      title,
      description,
      scripts: [jsonLd(app), jsonLd(faq)],
    })
    return { meta, links, scripts }
  },
  component: ClaudeCalculatorPage,
})

function ClaudeCalculatorPage() {
  const { t } = useTranslation()
  const { loggedIn } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <CalculatorHero
        h1Key="calculator.h1Claude"
        subtitleKey="calculator.subtitleClaude"
        fetchedAt={REGISTRY.fetchedAt}
      />
      {/*
        The page's own vendor first.

        A visitor who searched "Claude token cost calculator" came for Claude's
        prices, and the grid used to open on whichever model happened to be
        cheapest across every provider — so the first thing they saw was some
        other vendor's model. `initialModelId` derives the provider filter from
        the model, so the grid opens on Anthropic; the cross-vendor rows stay
        below, reachable with the "All providers" chip.
      */}
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-7">
        <Calculator initialModelId="claude-opus-5.5" />
      </div>
      <PricingTLDR />
      <ClaudeSubscriptionSection />
      <Tips />
      <FAQ
        id="faq"
        kickerKey="calculator.kicker"
        titleKey="calculator.faqTitle"
        faqs={claudeFaq(t).map((entry) => ({ qKey: entry.q, aKey: entry.a, translated: true, linkModels: true }))}
/>
      <RelatedCalculators exclude="claude" />
      <Footer theme={theme} />
    </div>
  )
}