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
import { ClaudeSubscriptionSection } from '@/features/calculator/components/ClaudeSubscriptionSection'
import { Tips } from '@/features/calculator/components/Tips'
import { RelatedCalculators } from '@/features/calculator/components/RelatedCalculators'
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
    const titleByLocale: Record<Locale, string> = {
      en: 'Claude Token Cost Calculator — Cost per Token & Monthly Estimates',
      zh: 'Claude Token 成本计算器 — 每 token 成本与月度估算',
    }
    const descByLocale: Record<Locale, string> = {
      en: 'See what Claude Opus 4.5, Sonnet 4.5, and Haiku 4.5 cost per token — and when the Anthropic API is cheaper than Pro / Max subscriptions. Updated ' + REGISTRY.fetchedAt + '.',
      zh: '看清 Claude Opus 4.5、Sonnet 4.5、Haiku 4.5 每 token 多少钱——以及什么时候 Anthropic API 比 Pro / Max 订阅更划算。更新于 ' + REGISTRY.fetchedAt + '。',
    }
    const title = titleByLocale[locale]
    const description = descByLocale[locale]
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
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        dict.calculator.claudeFaq1Q, dict.calculator.claudeFaq1A,
        dict.calculator.claudeFaq2Q, dict.calculator.claudeFaq2A,
        dict.calculator.claudeFaq3Q, dict.calculator.claudeFaq3A,
        dict.calculator.claudeFaq4Q, dict.calculator.claudeFaq4A,
        dict.calculator.claudeFaq5Q, dict.calculator.claudeFaq5A,
        dict.calculator.claudeFaq6Q, dict.calculator.claudeFaq6A,
        dict.calculator.claudeFaq7Q, dict.calculator.claudeFaq7A,
        dict.calculator.claudeFaq8Q, dict.calculator.claudeFaq8A,
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
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-7">
        <Calculator />
      </div>
      <PricingTLDR />
      <ClaudeSubscriptionSection />
      <Tips />
      <FAQ
        id="faq"
        kickerKey="calculator.kicker"
        titleKey="calculator.faqTitle"
        faqs={[
          { qKey: 'calculator.claudeFaq1Q', aKey: 'calculator.claudeFaq1A' },
          { qKey: 'calculator.claudeFaq2Q', aKey: 'calculator.claudeFaq2A' },
          { qKey: 'calculator.claudeFaq3Q', aKey: 'calculator.claudeFaq3A' },
          { qKey: 'calculator.claudeFaq4Q', aKey: 'calculator.claudeFaq4A' },
          { qKey: 'calculator.claudeFaq5Q', aKey: 'calculator.claudeFaq5A' },
          { qKey: 'calculator.claudeFaq6Q', aKey: 'calculator.claudeFaq6A' },
          { qKey: 'calculator.claudeFaq7Q', aKey: 'calculator.claudeFaq7A' },
          { qKey: 'calculator.claudeFaq8Q', aKey: 'calculator.claudeFaq8A' },
        ]}
      />
      <RelatedCalculators exclude="claude" />
      <Footer theme={theme} />
    </div>
  )
}