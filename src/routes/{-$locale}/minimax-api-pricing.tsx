import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead, jsonLd } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { dictionaries, translate, type Locale } from '@/features/i18n/locale'
import { VendorLandingPage } from '@/features/landing/VendorLandingPage'
import { vendorFaq } from '@/features/landing/vendor-faq'
import { REGISTRY } from '@/features/calculator/model-prices'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/minimax-api-pricing')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const dict = dictionaries[locale]
    const title = translate(dict, 'landing.vendor.minimax.h1')
    const description = translate(dict, 'landing.vendor.minimax.metaDescription', {
      date: REGISTRY.fetchedAt,
    })
    const url = `${origin}${locale === 'en' ? '' : '/' + locale}/minimax-api-pricing`

    const app = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: title,
      url,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', category: 'Free' },
    }
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: vendorFaq('minimax', locale, (key, params) => translate(dict, key, params)).map(
        (entry) => ({
          '@type': 'Question',
          name: translate(dict, entry.qKey),
          acceptedAnswer: { '@type': 'Answer', text: translate(dict, entry.aKey, entry.params) },
        }),
      ),
    }

    const { meta, links, scripts } = localeHead({
      origin,
      locale,
      path: '/minimax-api-pricing',
      title: `${title} — ${dict.common.appName}`,
      description,
      scripts: [jsonLd(app), jsonLd(faq)],
    })
    return { meta, links, scripts }
  },
  component: MinimaxPricingPage,
})

function MinimaxPricingPage() {
  const { theme } = rootRoute.useLoaderData()
  const { loggedIn } = Route.useLoaderData()
  return <VendorLandingPage vendor="minimax" loggedIn={loggedIn} theme={theme} />
}
