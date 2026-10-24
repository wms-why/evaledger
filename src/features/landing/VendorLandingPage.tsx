import { useTranslation } from '@/features/i18n/provider'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { FAQ } from '@/components/marketing/faq'
import { Calculator } from '@/features/calculator/calculator'
import { CalculatorHero } from '@/features/calculator/components/CalculatorHero'
import { PricingTLDR } from '@/features/calculator/components/PricingTLDR'
import { Tips } from '@/features/calculator/components/Tips'
import { RelatedCalculators } from '@/features/calculator/components/RelatedCalculators'
import { REGISTRY } from '@/features/calculator/model-prices'
import { VENDOR_PAGES, vendorRows, type VendorKey, type VendorPriceRow } from './data'
import { vendorFaq } from './vendor-faq'
import { VendorRateTable } from './VendorRateTable'
export interface VendorLandingPageProps {
  vendor: VendorKey
  loggedIn: boolean
  theme: 'light' | 'dark'
}

/**
 * One vendor pricing landing page — the four pages the audit said were
 * missing entirely.
 *
 * "Gemini API pricing", "Grok API pricing", "MiniMax M3.1 Flash API price" and
 * "Kimi K3.1 Pro 1M context pricing" are searches with a real intent behind
 * them, and the registry already holds every number they need. So the page is
 * generated from the registry rather than written by hand: a rate that moves
 * moves the page with it, and the page can never quote a number the
 * calculator disagrees with.
 *
 * The structure follows the working template of the four existing provider
 * landings (`/claude-token-cost-calculator` and its siblings): hero, the
 * calculator pre-filtered to this vendor's models, the rate table, TLDR, tips,
 * FAQ, cross-links.
 */
export function VendorLandingPage({ vendor, loggedIn, theme }: VendorLandingPageProps) {
  const { t } = useTranslation()
  const config = VENDOR_PAGES[vendor]
  const prefix = `landing.vendor.${vendor}`
  const rows = vendorRows(config.provider, config.featuredModelId)
  const faqs = vendorFaq(vendor, 'en', t)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />

      <CalculatorHero
        h1Key={`${prefix}.h1`}
        subtitleKey={`${prefix}.subtitle`}
        fetchedAt={REGISTRY.fetchedAt}
      />

      {/*
        The calculator, pre-filtered to this vendor: the reader who searched
        for "Gemini API pricing" sees Gemini's own models first, with the
        cross-vendor rows kept below so the comparison is still available.
      */}
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-7">
        <Calculator initialModelId={config.featuredModelId} />
      </div>

      <VendorRateTable vendor={vendor} rows={rows} />

      <PricingTLDR itemsKey={`${prefix}.tldrItems`} />
      <Tips itemsKey={`${prefix}.tips`} />

      <FAQ
        id="faq"
        kickerKey="landing.common.faqKicker"
        titleKey="landing.common.faqTitle"
        faqs={faqs.map((entry) => ({
          qKey: entry.qKey,
          aKey: entry.aKey,
          params: entry.params,
        }))}
      />

      <RelatedCalculators exclude={vendor} />
      <Footer theme={theme} />
    </div>
  )
}

/** A re-export so the route files can name the types they hand in. */
export type { VendorKey, VendorPriceRow }
