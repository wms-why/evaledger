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
}

interface RelatedCalculatorsProps {
  /** Exclude the current page from the list. */
  exclude?: 'token' | 'openrouter' | 'claude'
}

/**
 * Internal cross-linking between the three calculator URLs. Renders only
 * the links relevant to the current page so we don't link to ourselves.
 */
export function RelatedCalculators({ exclude }: RelatedCalculatorsProps) {
  const { t } = useTranslation()

  const all: Record<'token' | 'openrouter' | 'claude', RelatedItem> = {
    token: {
      titleKey: 'calculator.h1Token',
      descKey: 'calculator.subtitleToken',
      to: '/{-$locale}/token-cost-calculator',
    },
    openrouter: {
      titleKey: 'calculator.h1Openrouter',
      descKey: 'calculator.subtitleOpenrouter',
      to: '/{-$locale}/openrouter-pricing-calculator',
    },
    claude: {
      titleKey: 'calculator.h1Claude',
      descKey: 'calculator.subtitleClaude',
      to: '/{-$locale}/claude-token-cost-calculator',
    },
  }

  const items = (Object.entries(all) as ['token' | 'openrouter' | 'claude', RelatedItem][])
    .filter(([k]) => k !== exclude)
    .map(([, v]) => v)

  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-7">
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-fg-3">More calculators</span>
        <h2 className="mt-2.5 text-[22px] font-semibold tracking-[-0.4px]">
          Pick the right page for your use case
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
                Open <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}