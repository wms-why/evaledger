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
import { OpenRouterSection } from '@/features/calculator/components/OpenRouterSection'
import { Tips } from '@/features/calculator/components/Tips'
import { RelatedCalculators } from '@/features/calculator/components/RelatedCalculators'
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
    const titleByLocale: Record<Locale, string> = {
      en: 'OpenRouter Pricing Calculator — What Your Tokens Actually Cost After Markup',
      zh: 'OpenRouter 价格计算器 — 看清你的 token 在加价后实际多少钱',
    }
    const descByLocale: Record<Locale, string> = {
      en: 'See what OpenRouter really charges after the markup — and when going direct to OpenAI, Claude, Gemini, or DeepSeek is cheaper. Updated ' + REGISTRY.fetchedAt + '.',
      zh: '看清 OpenRouter 加价后实际收多少——以及什么时候直连 OpenAI、Claude、Gemini 或 DeepSeek 反而更划算。更新于 ' + REGISTRY.fetchedAt + '。',
    }
    const title = titleByLocale[locale]
    const description = descByLocale[locale]
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
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        dict.calculator.openrouterFaq1Q, dict.calculator.openrouterFaq1A,
        dict.calculator.openrouterFaq2Q, dict.calculator.openrouterFaq2A,
        dict.calculator.openrouterFaq3Q, dict.calculator.openrouterFaq3A,
        dict.calculator.openrouterFaq4Q, dict.calculator.openrouterFaq4A,
        dict.calculator.openrouterFaq5Q, dict.calculator.openrouterFaq5A,
        dict.calculator.openrouterFaq6Q, dict.calculator.openrouterFaq6A,
        dict.calculator.openrouterFaq7Q, dict.calculator.openrouterFaq7A,
        dict.calculator.openrouterFaq8Q, dict.calculator.openrouterFaq8A,
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
        faqs={[
          { qKey: 'calculator.openrouterFaq1Q', aKey: 'calculator.openrouterFaq1A' },
          { qKey: 'calculator.openrouterFaq2Q', aKey: 'calculator.openrouterFaq2A' },
          { qKey: 'calculator.openrouterFaq3Q', aKey: 'calculator.openrouterFaq3A' },
          { qKey: 'calculator.openrouterFaq4Q', aKey: 'calculator.openrouterFaq4A' },
          { qKey: 'calculator.openrouterFaq5Q', aKey: 'calculator.openrouterFaq5A' },
          { qKey: 'calculator.openrouterFaq6Q', aKey: 'calculator.openrouterFaq6A' },
          { qKey: 'calculator.openrouterFaq7Q', aKey: 'calculator.openrouterFaq7A' },
          { qKey: 'calculator.openrouterFaq8Q', aKey: 'calculator.openrouterFaq8A' },
        ]}
      />
      <RelatedCalculators exclude="openrouter" />
      <Footer theme={theme} />
    </div>
  )
}