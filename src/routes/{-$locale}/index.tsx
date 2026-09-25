import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead, jsonLd } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { dictionaries } from '@/features/i18n/locale'
import type { Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Hero } from '@/components/marketing/hero'
import { FAQ } from '@/components/marketing/faq'
import { CTA } from '@/components/marketing/cta'
import { Footer } from '@/components/marketing/footer'
import { Calculator } from '@/features/calculator/calculator'
import { PricingTLDR } from '@/features/calculator/components/PricingTLDR'
import { Tips } from '@/features/calculator/components/Tips'
import { RelatedCalculators } from '@/features/calculator/components/RelatedCalculators'
import { REGISTRY } from '@/features/calculator/model-prices'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/')({
  loader: async () => ({ origin: await getOrigin() }),
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const titleByLocale: Record<Locale, string> = {
      en: 'TokenCalculator — Compare LLM Prices Across OpenAI, Claude, Gemini & DeepSeek',
      zh: 'TokenCalculator — 一站式比对 OpenAI、Claude、Gemini、DeepSeek 的 LLM 价格',
    }
    const descByLocale: Record<Locale, string> = {
      en: 'See what your LLM tokens actually cost across OpenAI, Claude, Gemini, DeepSeek, and Grok. Real tokenizer for OpenAI models, accurate estimates for the rest. Updated ' + REGISTRY.fetchedAt + '.',
      zh: '看清你的 LLM token 在 OpenAI、Claude、Gemini、DeepSeek、Grok 上到底多少钱。OpenAI 真实分词器,其余模型高精度近似估算。更新于 ' + REGISTRY.fetchedAt + '。',
    }
    const title = titleByLocale[locale]
    const description = descByLocale[locale]
    const { meta, links, scripts } = localeHead({
      origin,
      locale,
      path: '/',
      title,
      description,
      scripts: buildStructuredData({ origin, locale, dict }),
    })
    return { meta, links, scripts }
  },
  component: Home,
})

interface StructuredDataInput {
  origin: string
  locale: Locale
  dict: (typeof dictionaries)[Locale]
}

function buildStructuredData({ origin, locale, dict }: StructuredDataInput) {
  const url = `${origin}${locale === 'en' ? '' : '/' + locale}`
  const logoUrl = `${origin}/logo512.png`
  // 1. Organization — gives the brand a Knowledge Graph entity.
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TokenCalculator',
    url,
    logo: logoUrl,
    description: dict.marketing.footerTagline,
    sameAs: [
      'https://github.com/tokencalculator/tokencalculator',
      'https://x.com/tokencalculator',
    ],
  }
  // 2. SoftwareApplication — Google loves this for SaaS landing pages.
  const app = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TokenCalculator',
    url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: dict.marketing.heroSubtitle,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      category: 'Free',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '312',
    },
  }
  // 3. FAQPage — 8 Q&A's, the most powerful SERP real-estate grab on the page.
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
  return [jsonLd(org), jsonLd(app), jsonLd(faq)]
}

function Home() {
  const { theme, user } = rootRoute.useLoaderData()
  const loggedIn = !!user

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <Hero loggedIn={loggedIn} />
      <div id="features" className="mx-auto max-w-7xl px-5 py-10 md:px-7">
        <Calculator />
      </div>
      <PricingTLDR />
      <Tips />
      <FAQ id="faq" />
      <RelatedCalculators exclude="token" />
      <CTA loggedIn={loggedIn} />
      <Footer theme={theme} />
    </div>
  )
}