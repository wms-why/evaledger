import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead, jsonLd } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, type Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { FAQ } from '@/components/marketing/faq'
import { Calculator } from '@/features/calculator/calculator'
import { CalculatorHero } from '@/features/calculator/components/CalculatorHero'
import { PricingTLDR } from '@/features/calculator/components/PricingTLDR'
import { Tips } from '@/features/calculator/components/Tips'
import { RelatedCalculators } from '@/features/calculator/components/RelatedCalculators'
import { REGISTRY } from '@/features/calculator/model-prices'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/token-cost-calculator')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const titleByLocale: Record<Locale, string> = {
      en: 'Token Cost Calculator — Compare Prices Across OpenAI, Claude, Gemini & DeepSeek',
      zh: 'Token 成本计算器 — 比对 OpenAI、Claude、Gemini 与 DeepSeek',
    }
    const descByLocale: Record<Locale, string> = {
      en: 'See what your LLM tokens actually cost across OpenAI, Claude, Gemini, DeepSeek, and Grok. Real tokenizer for OpenAI models, accurate estimates for the rest. Updated ' + REGISTRY.fetchedAt + '.',
      zh: '看清你的 LLM token 在 OpenAI、Claude、Gemini、DeepSeek、Grok 上到底多少钱。OpenAI 真实分词器,其余模型高精度近似估算。更新于 ' + REGISTRY.fetchedAt + '。',
    }
    const title = titleByLocale[locale]
    const description = descByLocale[locale]
    const url = `${origin}${locale === 'en' ? '' : '/' + locale}/token-cost-calculator`

    const app = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: dict.calculator.h1Token,
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
        dict.calculator.faq1Q, dict.calculator.faq1A,
        dict.calculator.faq2Q, dict.calculator.faq2A,
        dict.calculator.faq3Q, dict.calculator.faq3A,
        dict.calculator.faq4Q, dict.calculator.faq4A,
        dict.calculator.faq5Q, dict.calculator.faq5A,
        dict.calculator.faq6Q, dict.calculator.faq6A,
        dict.calculator.faq7Q, dict.calculator.faq7A,
        dict.calculator.faq8Q, dict.calculator.faq8A,
      ].reduce<{ q: string; a: string }[]>((acc, _, i, arr) => {
        if (i % 2 === 0) acc.push({ q: arr[i] as string, a: arr[i + 1] as string })
        return acc
      }, []).map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    }
    // App is keyed on the calculator URL (not the brand), since this page is
    // the "product" — the brand sits on the home route as Organization.
    const { meta, links, scripts } = localeHead({
      origin,
      locale,
      path: '/token-cost-calculator',
      title,
      description,
      scripts: [jsonLd(app), jsonLd(faq)],
    })
    return { meta, links, scripts }
  },
  component: TokenCostCalculatorPage,
})

function TokenCostCalculatorPage() {
  const { loggedIn } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <CalculatorHero
        h1Key="calculator.h1Token"
        subtitleKey="calculator.subtitleToken"
        fetchedAt={REGISTRY.fetchedAt}
      />
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-7">
        <Calculator />
      </div>
      <PricingTLDR />
      <Tips />
      <FAQ
        id="faq"
        kickerKey="calculator.kicker"
        titleKey="calculator.faqTitle"
        faqs={[
          { qKey: 'calculator.faq1Q', aKey: 'calculator.faq1A' },
          { qKey: 'calculator.faq2Q', aKey: 'calculator.faq2A' },
          { qKey: 'calculator.faq3Q', aKey: 'calculator.faq3A' },
          { qKey: 'calculator.faq4Q', aKey: 'calculator.faq4A' },
          { qKey: 'calculator.faq5Q', aKey: 'calculator.faq5A' },
          { qKey: 'calculator.faq6Q', aKey: 'calculator.faq6A' },
          { qKey: 'calculator.faq7Q', aKey: 'calculator.faq7A' },
          { qKey: 'calculator.faq8Q', aKey: 'calculator.faq8A' },
        ]}
      />
      <RelatedCalculators exclude="token" />
      <Footer theme={theme} />
    </div>
  )
}