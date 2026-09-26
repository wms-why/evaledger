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
import { ChatGPTSection } from '@/features/calculator/components/ChatGPTSection'
import { Tips } from '@/features/calculator/components/Tips'
import { RelatedCalculators } from '@/features/calculator/components/RelatedCalculators'
import { REGISTRY } from '@/features/calculator/model-prices'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/chatgpt-api-pricing')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const title = dict.home.chatgptTitle
    const description = translate(dict, 'marketing.chatgptMetaDescription', {
      date: REGISTRY.fetchedAt,
    })
    const url = `${origin}${locale === 'en' ? '' : '/' + locale}/chatgpt-api-pricing`

    const app = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: dict.calculator.h1Chatgpt,
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
        dict.calculator.chatgptFaq1Q, dict.calculator.chatgptFaq1A,
        dict.calculator.chatgptFaq2Q, dict.calculator.chatgptFaq2A,
        dict.calculator.chatgptFaq3Q, dict.calculator.chatgptFaq3A,
        dict.calculator.chatgptFaq4Q, dict.calculator.chatgptFaq4A,
        dict.calculator.chatgptFaq5Q, dict.calculator.chatgptFaq5A,
        dict.calculator.chatgptFaq6Q, dict.calculator.chatgptFaq6A,
        dict.calculator.chatgptFaq7Q, dict.calculator.chatgptFaq7A,
        dict.calculator.chatgptFaq8Q, dict.calculator.chatgptFaq8A,
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
      path: '/chatgpt-api-pricing',
      title,
      description,
      scripts: [jsonLd(app), jsonLd(faq)],
    })
    return { meta, links, scripts }
  },
  component: ChatGPTCalculatorPage,
})

function ChatGPTCalculatorPage() {
  const { loggedIn } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <CalculatorHero
        h1Key="calculator.h1Chatgpt"
        subtitleKey="calculator.subtitleChatgpt"
        fetchedAt={REGISTRY.fetchedAt}
      />
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-7">
        <Calculator />
      </div>
      <PricingTLDR itemsKey="calculator.chatgptTldrItems" />
      <ChatGPTSection />
      <Tips itemsKey="calculator.chatgptTips" />
      <FAQ
        id="faq"
        kickerKey="calculator.kicker"
        titleKey="calculator.faqTitle"
        faqs={[
          { qKey: 'calculator.chatgptFaq1Q', aKey: 'calculator.chatgptFaq1A' },
          { qKey: 'calculator.chatgptFaq2Q', aKey: 'calculator.chatgptFaq2A' },
          { qKey: 'calculator.chatgptFaq3Q', aKey: 'calculator.chatgptFaq3A' },
          { qKey: 'calculator.chatgptFaq4Q', aKey: 'calculator.chatgptFaq4A' },
          { qKey: 'calculator.chatgptFaq5Q', aKey: 'calculator.chatgptFaq5A' },
          { qKey: 'calculator.chatgptFaq6Q', aKey: 'calculator.chatgptFaq6A' },
          { qKey: 'calculator.chatgptFaq7Q', aKey: 'calculator.chatgptFaq7A' },
          { qKey: 'calculator.chatgptFaq8Q', aKey: 'calculator.chatgptFaq8A' },
        ]}
      />
      <RelatedCalculators exclude="chatgpt" />
      <Footer theme={theme} />
    </div>
  )
}
