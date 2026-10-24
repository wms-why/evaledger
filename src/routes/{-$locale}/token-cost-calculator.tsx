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
import { Tips } from '@/features/calculator/components/Tips'
import { RelatedCalculators } from '@/features/calculator/components/RelatedCalculators'
import { tokenFaq } from '@/features/calculator/copy'
import { stripModelMarkers } from '@/features/calculator/model-links'
import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/token-cost-calculator')({
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
    const title = dict.home.calculatorTitle
    const description = translate(dict, 'marketing.calculatorMetaDescription', {
      date: REGISTRY.fetchedAt,
    })
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
    // The FAQPage JSON-LD carries exactly the pairs the page renders, in the
    // same order, so the structured data and the visible copy can never
    // disagree. The answers are stripped of their model markers — schema.org
    // takes plain text, and a `[[model:…]]` marker in a rich result is a bug.
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: tokenFaq((key, params) => translate(dict, key, params)).map((entry) => ({
        '@type': 'Question',
        name: entry.q,
        acceptedAnswer: { '@type': 'Answer', text: stripModelMarkers(entry.a) },
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
  const { t } = useTranslation()
  const { loggedIn } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  // The shareable per-model deep link (`?model=<registry-id>`), preserved
  // across the 301 from `/token-calculator`. It selects that model and
  // narrows the grid to its provider — the same link the model pages, the
  // price cells and the release pages build.
  const { model } = Route.useSearch()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <CalculatorHero
        h1Key="calculator.h1Token"
        subtitleKey="calculator.subtitleToken"
        fetchedAt={REGISTRY.fetchedAt}
      />
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-7">
        <Calculator initialModelId={model} />
      </div>
      <PricingTLDR itemsKey="calc.tldrItems" />
      <Tips itemsKey="calc.tips" />
      <FAQ
        id="faq"
        kickerKey="calculator.kicker"
        titleKey="calculator.faqTitle"
        faqs={tokenFaq(t).map((entry) => ({
          // `copy.ts` hands back the translated sentences (its numbers are
          // interpolated from the price registry), so they are passed as
          // `translated` rather than run through `t()` a second time.
          qKey: entry.q,
          aKey: entry.a,
          translated: true,
          linkModels: true,
        }))}
      />
      <RelatedCalculators exclude="token" />
      <Footer theme={theme} />
    </div>
  )
}