import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/features/theme/theme-toggle'
import { LangSwitch } from '@/features/i18n/lang-switch'

const X_URL = 'https://x.com/Yaomker'

/**
 * The site footer.
 *
 * The footer is the one place every visitor reaches, so it is the cheapest
 * internal-link surface on the site: the four calculator landings that used
 * to be two clicks deep — and the vendor landings that were three — are one
 * click from anywhere, including the home page.
 *
 * Every anchor names its destination ("DeepSeek API Pricing", not "Open"),
 * and every path is canonical.
 */
export function Footer({ theme }: { theme: 'light' | 'dark' }) {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-bg-alt py-10">
      <div className="mx-auto max-w-7xl px-5 md:px-7">
      <div className="grid gap-7 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-[1.6fr_repeat(5,1fr)]">
        {/* Brand */}
        <div className="sm:col-span-2 md:col-span-3 xl:col-span-1">
          <Logo />
          <p className="mt-3.5 max-w-[22em] text-[13.5px] leading-relaxed text-fg-3">
            {t('marketing.footerTagline')}
          </p>
        </div>

        {/* Pricing & Calculators — the calculator landings, one click deep */}
        <FooterCol title={t('site.footer.pricingTitle')}>
          <Link className="foot-link" to="/{-$locale}/token-cost-calculator">{t('site.pricing.token')}</Link>
          <Link className="foot-link" to="/{-$locale}/claude-token-cost-calculator">{t('site.pricing.claude')}</Link>
          <Link className="foot-link" to="/{-$locale}/chatgpt-api-pricing">{t('site.pricing.chatgpt')}</Link>
          <Link className="foot-link" to="/{-$locale}/deepseek-api-pricing">{t('site.pricing.deepseek')}</Link>
          <Link className="foot-link" to="/{-$locale}/openrouter-pricing-calculator">{t('site.pricing.openrouter')}</Link>
          <Link className="foot-link" to="/{-$locale}/gemini-api-pricing">{t('site.pricing.gemini')}</Link>
          <Link className="foot-link" to="/{-$locale}/grok-api-pricing">{t('site.pricing.grok')}</Link>
          <Link className="foot-link" to="/{-$locale}/minimax-api-pricing">{t('site.pricing.minimax')}</Link>
          <Link className="foot-link" to="/{-$locale}/kimi-api-pricing">{t('site.pricing.kimi')}</Link>
        </FooterCol>

        {/* Best Models & Benchmarks — where a reader picks a model */}
        <FooterCol title={t('site.footer.bestTitle')}>
          <Link className="foot-link" to="/{-$locale}/best">{t('site.footer.bestModels')}</Link>
          <Link className="foot-link" to="/{-$locale}/best/$category" params={{ category: 'for-coding' }}>
            {t('site.footer.bestCoding')}
          </Link>
          <Link className="foot-link" to="/{-$locale}/leaderboard/$track" params={{ track: 'coding' }}>
            {t('site.footer.boardCoding')}
          </Link>
          <Link className="foot-link" to="/{-$locale}/leaderboard/$track" params={{ track: 'agent' }}>
            {t('site.footer.boardAgent')}
          </Link>
          <Link className="foot-link" to="/{-$locale}/leaderboard/$track" params={{ track: 'reasoning' }}>
            {t('site.footer.boardReasoning')}
          </Link>
          <Link className="foot-link" to="/{-$locale}/benchmarks">{t('site.footer.benchmarks')}</Link>
          <Link className="foot-link" to="/{-$locale}/compare">{t('site.footer.compare')}</Link>
        </FooterCol>

        {/* Product */}
        <FooterCol title={t('marketing.footerProduct')}>
          <Link className="foot-link" to="/{-$locale}">{t('site.nav.board')}</Link>
          <Link className="foot-link" to="/{-$locale}/compare">{t('site.nav.compare')}</Link>
          <Link className="foot-link" to="/{-$locale}/token-cost-calculator">{t('marketing.footerProductToken')}</Link>
        </FooterCol>

        {/* Resources */}
        <FooterCol title={t('marketing.footerResources')}>
          <a className="foot-link" href={X_URL} target="_blank" rel="noreferrer">{t('marketing.footerTwitter')}</a>
          <Link className="foot-link" to="/{-$locale}/releases">{t('site.nav.releases')}</Link>
          <Link className="foot-link" to="/{-$locale}/series">{t('site.nav.series')}</Link>
          <Link className="foot-link" to="/{-$locale}/methodology">{t('site.nav.methodology')}</Link>
          <Link className="foot-link" to="/{-$locale}/data-quality">{t('site.nav.dataQuality')}</Link>
          <Link className="foot-link" to="/{-$locale}/leaderboard-history">{t('leaderboard.navHistory')}</Link>
          <Link className="foot-link" to="/{-$locale}/changelog">{t('site.nav.changelog')}</Link>
        </FooterCol>

        {/* Legal */}
        <FooterCol title={t('marketing.footerLegal')}>
          <Link className="foot-link" to="/{-$locale}/terms">{t('marketing.footerTerms')}</Link>
          <Link className="foot-link" to="/{-$locale}/privacy">{t('marketing.footerPrivacy')}</Link>
          {/* The sponsor page is linked from nowhere else: without this it is
              a sitemap-only orphan, and the dictionary already carries the
              label (`sponsor.footerSponsor`) that was written for this slot. */}
          <Link className="foot-link" to="/{-$locale}/sponsor">{t('sponsor.footerSponsor')}</Link>
          <a className="foot-link" href="mailto:hello@evaledger.com">{t('marketing.footerContact')}</a>
        </FooterCol>
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
        <p className="text-[13px] text-fg-3">
          &copy; {year} {t('common.appName')}. {t('marketing.footerRights')}
        </p>
        <div className="flex items-center gap-1">
          <ThemeToggle theme={theme} />
          <LangSwitch />
        </div>
      </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-3">{title}</h4>
      <div className="flex flex-col gap-0.5 [&_.foot-link]:py-2 md:[&_.foot-link]:py-1 [&_.foot-link]:text-sm [&_.foot-link]:text-fg-2 [&_.foot-link:hover]:text-foreground [&_.foot-link]:transition-colors">
        {children}
      </div>
    </div>
  )
}
