import { useTranslation } from '@/features/i18n/provider'
import { calculateCost } from '@/features/calculator/cost'
import {
  CLAUDE_BREAK_EVEN_MODEL_ID,
  claudeBreakEven,
  formatBreakEvenM,
} from '@/features/calculator/claude-break-even'

/**
 * Page-specific block for /claude-token-cost-calculator.
 *
 * Computes the breakeven point at which the Anthropic API becomes cheaper
 * than the Claude Pro / Max subscriptions. Numbers come from the shared
 * `claudeBreakEven()` helper — the same one the FAQ answers use — so the card
 * here and the FAQ below can never quote different break-evens.
 */
export function ClaudeSubscriptionSection() {
  const { t } = useTranslation()
  const be = claudeBreakEven()
  if (!be) return null

  // Sample cost at the break-even for the table. The volumes are fixed; the
  // rates are the same ones the break-even solves with.
  const sampleInputTokens = 1_000_000 // 1M
  const sampleOutputTokens = 500_000 // 500k
  const api = calculateCost(CLAUDE_BREAK_EVEN_MODEL_ID, sampleInputTokens, sampleOutputTokens)

  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-7">
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-fg-3">
          {t('calculator.kicker')}
        </span>
        <h2 className="mt-2.5 max-w-[24em] text-[26px] font-semibold tracking-[-0.6px]">
          {t('calculator.claudeSubscriptionTitle')}
        </h2>
        <p className="mt-3 max-w-[42em] text-base leading-relaxed text-fg-2">
          {t('calculator.claudeSubscriptionBody')}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-[14px] border border-border bg-card p-6">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px]">
              {t('calculator.claudeProCardTitle')}
            </h3>
            <p className="mt-2 text-[13px] text-fg-3">
              {t('calculator.claudeBreakEven', {
                input: formatBreakEvenM(be.proInputM),
                output: formatBreakEvenM(be.proOutputM),
              })}
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-fg-2">
              {t('calculator.claudeProDescription')}
            </p>
          </div>

          <div className="rounded-[14px] border border-border bg-card p-6">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px]">
              {t('calculator.claudeMaxCardTitle')}
            </h3>
            <p className="mt-2 text-[13px] text-fg-3">
              {t('calculator.claudeBreakEven', {
                input: formatBreakEvenM(be.maxInputM),
                output: formatBreakEvenM(be.maxOutputM),
              })}
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-fg-2">
              {t('calculator.claudeMaxDescription')}
            </p>
          </div>
        </div>

        <p className="mt-4 text-[13px] text-fg-3">
          {t('calculator.claudeSampleReference', {
            cost: api.totalCost.toFixed(2),
            rate: api.totalCost === 0
              ? t('calculator.claudeSampleNoUsage')
              : t('calculator.claudeSampleRate'),
          })}
        </p>
      </div>
    </section>
  )
}
