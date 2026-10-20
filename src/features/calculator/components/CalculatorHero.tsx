import { useTranslation } from '@/features/i18n/provider'

interface CalculatorHeroProps {
  /** Bilingual: 'h1Token' / 'h1Openrouter' / 'h1Claude' */
  h1Key: string
  /** Bilingual subtitle key */
  subtitleKey: string
  /** ISO date for the freshness line */
  fetchedAt: string
}

/**
 * Lightweight hero for the three calculator routes. The full `marketing/hero`
 * component is too EvalLedger-specific (CalculatorPreview baked in) — this
 * one is a thin copy that just shows H1 + subtitle + freshness stamp.
 */
export function CalculatorHero({ h1Key, subtitleKey, fetchedAt }: CalculatorHeroProps) {
  const { t } = useTranslation()
  return (
    <section className="border-b border-border py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 text-center md:px-7">
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-fg-3">
          {t('calculator.kicker')}
        </span>
        <h1 className="mx-auto mt-2.5 max-w-[20em] text-[34px] font-semibold leading-[1.08] tracking-[-1.2px] sm:text-[42px]">
          {t(h1Key)}
        </h1>
        <p className="mx-auto mt-3.5 max-w-[42em] text-base leading-relaxed text-fg-2">
          {t(subtitleKey)}
        </p>
        <p className="mt-3 text-[12px] text-fg-3">
          {t('calculator.lastUpdated', { date: fetchedAt })}
        </p>
      </div>
    </section>
  )
}