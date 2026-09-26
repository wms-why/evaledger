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
    const description = translate(dict, 'marketing.deepseekMetaDescription', {
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
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        dict.calculator.deepseekFaq1Q, dict.calculator.deepseekFaq1A,
        dict.calculator.deepseekFaq2Q, dict.calculator.deepseekFaq2A,
        dict.calculator.deepseekFaq3Q, dict.calculator.deepseekFaq3A,
        dict.calculator.deepseekFaq4Q, dict.calculator.deepseekFaq4A,
        dict.calculator.deepseekFaq5Q, dict.calculator.deepseekFaq5A,
        dict.calculator.deepseekFaq6Q, dict.calculator.deepseekFaq6A,
        dict.calculator.deepseekFaq7Q, dict.calculator.deepseekFaq7A,
        dict.calculator.deepseekFaq8Q, dict.calculator.deepseekFaq8A,
      ].reduce<{ q: string; a: string }[]>((acc, _, i, arr) => {
        if (i % 2 === 0) acc.push({ q: arr[i] as string, a: arr[i + 1] as string })
        return acc
      }, []).map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
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
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-7">
        <Calculator />
      </div>
      <PricingTLDR itemsKey="calculator.deepseekTldrItems" />
      <DeepSeekSection />
      <Tips itemsKey="calculator.deepseekTips" />
      <FAQ
        id="faq"
        kickerKey="calculator.kicker"
        titleKey="calculator.faqTitle"
        faqs={[
          { qKey: 'calculator.deepseekFaq1Q', aKey: 'calculator.deepseekFaq1A' },
          { qKey: 'calculator.deepseekFaq2Q', aKey: 'calculator.deepseekFaq2A' },
          { qKey: 'calculator.deepseekFaq3Q', aKey: 'calculator.deepseekFaq3A' },
          { qKey: 'calculator.deepseekFaq4Q', aKey: 'calculator.deepseekFaq4A' },
          { qKey: 'calculator.deepseekFaq5Q', aKey: 'calculator.deepseekFaq5A' },
          { qKey: 'calculator.deepseekFaq6Q', aKey: 'calculator.deepseekFaq6A' },
          { qKey: 'calculator.deepseekFaq7Q', aKey: 'calculator.deepseekFaq7A' },
          { qKey: 'calculator.deepseekFaq8Q', aKey: 'calculator.deepseekFaq8A' },
        ]}
      />
      <RelatedCalculators exclude="deepseek" />
      <Footer theme={theme} />
    </div>
  )
}