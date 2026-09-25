import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'

/**
 * Page-specific block for /openrouter-pricing-calculator. Explains the
 * OpenRouter markup and when going direct to the provider is cheaper.
 */
export function OpenRouterSection() {
  const { t } = useTranslation()
  const markupPct = Math.round((REGISTRY.openRouterMarkup - 1) * 100)
  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-7">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[14px] border border-border bg-card p-6">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px]">
              {t('calculator.openrouterMarkupTitle')}
            </h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-fg-2">
              {t('calculator.openrouterMarkupBody')}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-bg-alt px-3 py-1.5 text-[12px] tabular-nums text-fg-2">
              Current average markup: <strong className="text-foreground">×{REGISTRY.openRouterMarkup.toFixed(2)}</strong>
              <span className="text-fg-3">({markupPct}%)</span>
            </p>
          </div>
          <div className="rounded-[14px] border border-border bg-card p-6">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px]">
              {t('calculator.openrouterBreakEvenTitle')}
            </h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-fg-2">
              {t('calculator.openrouterBreakEvenBody')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}