import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'

interface RelatedItem {
  /** Translation key for the title. */
  titleKey: string
  /** Translation key for the description. */
  descKey: string
  /** Route target. */
  to: string
  /**
   * Translation key of the **link text**.
   *
   * It used to be the same word on every card ("Open"), which told a crawler
   * nothing about where the link went. Each card now carries its own
   * destination-naming anchor ("Calculate OpenRouter markup →"), which is what
   * makes the cross-link worth anything.
   */
  ctaKey: string
}

interface RelatedCalculatorsProps {
  /** Exclude the current page from the list. */
  exclude?: RelatedKey
}

/** Every calculator landing, including the four vendor pricing pages. */
type RelatedKey = 'token' | 'openrouter' | 'claude' | 'deepseek' | 'chatgpt' | 'gemini' | 'grok' | 'minimax' | 'kimi'

/**
 * Internal cross-linking between the calculator URLs. Renders only the links
 * relevant to the current page so we don't link to ourselves.
 *
 * The four vendor pricing pages used to be second-level islands: nothing on
 * the home page and nothing in the footer pointed at them, so they were two
 * clicks deep and carried no internal link equity. They are listed here and in
 * the footer's Pricing & Calculators column, which puts every calculator
 * landing one click from every page.
 */
export function RelatedCalculators({ exclude }: RelatedCalculatorsProps) {
  const { t } = useTranslation()

  const all: Record<RelatedKey, RelatedItem> = {
    token: {
      titleKey: 'calculator.h1Token',
      descKey: 'calculator.subtitleToken',
      to: '/{-$locale}/token-cost-calculator',
      ctaKey: 'calc.relatedLinkToken',
    },
    openrouter: {
      titleKey: 'calculator.h1Openrouter',
      descKey: 'calculator.subtitleOpenrouter',
      to: '/{-$locale}/openrouter-pricing-calculator',
      ctaKey: 'calc.relatedLinkOpenrouter',
    },
    claude: {
      titleKey: 'calculator.h1Claude',
      descKey: 'calculator.subtitleClaude',
      to: '/{-$locale}/claude-token-cost-calculator',
      ctaKey: 'calc.relatedLinkClaude',
    },
    deepseek: {
      titleKey: 'calculator.h1Deepseek',
      descKey: 'calculator.subtitleDeepseek',
      to: '/{-$locale}/deepseek-api-pricing',
      ctaKey: 'calc.relatedLinkDeepseek',
    },
    chatgpt: {
      titleKey: 'calculator.h1Chatgpt',
      descKey: 'calculator.subtitleChatgpt',
      to: '/{-$locale}/chatgpt-api-pricing',
      ctaKey: 'calc.relatedLinkChatgpt',
    },
    gemini: {
      titleKey: 'landing.vendor.gemini.h1',
      descKey: 'landing.vendor.gemini.subtitle',
      to: '/{-$locale}/gemini-api-pricing',
      ctaKey: 'calc.relatedLinkGemini',
    },
    grok: {
      titleKey: 'landing.vendor.grok.h1',
      descKey: 'landing.vendor.grok.subtitle',
      to: '/{-$locale}/grok-api-pricing',
      ctaKey: 'calc.relatedLinkGrok',
    },
    minimax: {
      titleKey: 'landing.vendor.minimax.h1',
      descKey: 'landing.vendor.minimax.subtitle',
      to: '/{-$locale}/minimax-api-pricing',
      ctaKey: 'calc.relatedLinkMinimax',
    },
    kimi: {
      titleKey: 'landing.vendor.kimi.h1',
      descKey: 'landing.vendor.kimi.subtitle',
      to: '/{-$locale}/kimi-api-pricing',
      ctaKey: 'calc.relatedLinkKimi',
    },
  }

  const items = (Object.entries(all) as [RelatedKey, RelatedItem][])
    .filter(([k]) => k !== exclude)
    .map(([, v]) => v)

  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-7">
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-fg-3">
          {t('calculator.relatedKicker')}
        </span>
        <h2 className="mt-2.5 text-[22px] font-semibold tracking-[-0.4px]">
          {t('calculator.relatedTitle')}
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-col gap-1.5 rounded-[14px] border border-border bg-card p-5 transition-colors hover:border-foreground/30"
            >
              <h3 className="text-[16px] font-semibold tracking-[-0.3px]">
                {t(item.titleKey)}
              </h3>
              <p className="text-[13px] leading-relaxed text-fg-3">{t(item.descKey)}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-primary">
                {t(item.ctaKey)} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
