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
import { OpenRouterSection } from '@/features/calculator/components/OpenRouterSection'
import { Tips } from '@/features/calculator/components/Tips'
import { RelatedCalculators } from '@/features/calculator/components/RelatedCalculators'
import { openrouterFaq } from '@/features/calculator/copy'
import { stripModelMarkers } from '@/features/calculator/model-links'
import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/openrouter-pricing-calculator')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const title = dict.home.openrouterTitle
    const description = translate(dict, 'marketing.openrouterMetaDescription', {
      date: REGISTRY.fetchedAt,
    })
    const url = `${origin}${locale === 'en' ? '' : '/' + locale}/openrouter-pricing-calculator`

    const app = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: dict.calculator.h1Openrouter,
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
      mainEntity: openrouterFaq((key, params) => translate(dict, key, params)).map((entry) => ({
        '@type': 'Question',
        name: entry.q,
        acceptedAnswer: { '@type': 'Answer', text: stripModelMarkers(entry.a) },
      })),
    }

    const { meta, links, scripts } = localeHead({
      origin,
      locale,
      path: '/openrouter-pricing-calculator',
      title,
      description,
      scripts: [jsonLd(app), jsonLd(faq)],
    })
    return { meta, links, scripts }
  },
  component: OpenRouterCalculatorPage,
})

function OpenRouterCalculatorPage() {
  const { t } = useTranslation()
  const { loggedIn } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <CalculatorHero
        h1Key="calculator.h1Openrouter"
        subtitleKey="calculator.subtitleOpenrouter"
        fetchedAt={REGISTRY.fetchedAt}
      />
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-7">
        <Calculator />
      </div>
      <PricingTLDR />
      <OpenRouterSection />
      <Tips />
      <FAQ
        id="faq"
        kickerKey="calculator.kicker"
        titleKey="calculator.faqTitle"
        faqs={openrouterFaq(t).map((entry) => ({ qKey: entry.q, aKey: entry.a, translated: true, linkModels: true }))}
/>
      <RelatedCalculators exclude="openrouter" />
      <Footer theme={theme} />
    </div>
  )
}