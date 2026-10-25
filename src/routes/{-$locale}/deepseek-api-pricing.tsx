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
import { DeepSeekSection } from '@/features/calculator/components/DeepSeekSection'
import { Tips } from '@/features/calculator/components/Tips'
import { RelatedCalculators } from '@/features/calculator/components/RelatedCalculators'
import { deepseekFaq, modelRateSummary, deepseekTldr, deepseekTips } from '@/features/calculator/copy'
import { stripModelMarkers } from '@/features/calculator/model-links'
import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/deepseek-api-pricing')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const title = dict.home.deepseekTitle
    // The rates are the registry's, resolved at render time.
    const rates = modelRateSummary('deepseek-flash')
    const description = translate(dict, 'marketing.deepseekMetaDescription', {
      model: rates.model,
      input: rates.input,
      output: rates.output,
      date: REGISTRY.fetchedAt,
    })
    const url = `${origin}${locale === 'en' ? '' : '/' + locale}/deepseek-api-pricing`

    const app = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: dict.calculator.h1Deepseek,
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
      mainEntity: deepseekFaq((key, params) => translate(dict, key, params)).map((entry) => ({
        '@type': 'Question',
        name: entry.q,
        acceptedAnswer: { '@type': 'Answer', text: stripModelMarkers(entry.a) },
      })),
    }

    const { meta, links, scripts } = localeHead({
      origin,
      locale,
      path: '/deepseek-api-pricing',
      title,
      description,
      scripts: [jsonLd(app), jsonLd(faq)],
    })
    return { meta, links, scripts }
  },
  component: DeepSeekPricingPage,
})

function DeepSeekPricingPage() {
  const { t } = useTranslation()
  const { loggedIn } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <CalculatorHero
        h1Key="calculator.h1Deepseek"
        subtitleKey="calculator.subtitleDeepseek"
        fetchedAt={REGISTRY.fetchedAt}
      />
      {/*
        The page's own vendor first — see the note on the Claude page. The
        reader who searched "DeepSeek API pricing" came for DeepSeek's prices,
        and the grid opens on the V4.1-Flash row with V4-Pro and the
        cross-vendor rows below.
      */}
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-7">
        <Calculator initialModelId="deepseek-flash" />
      </div>
      <PricingTLDR items={deepseekTldr(t)} />
      <DeepSeekSection />
      <Tips items={deepseekTips(t)} />
      <FAQ
        id="faq"
        kickerKey="calculator.kicker"
        titleKey="calculator.faqTitle"
        faqs={deepseekFaq(t).map((entry) => ({ qKey: entry.q, aKey: entry.a, translated: true, linkModels: true }))}
/>
      <RelatedCalculators exclude="deepseek" />
      <Footer theme={theme} />
    </div>
  )
}