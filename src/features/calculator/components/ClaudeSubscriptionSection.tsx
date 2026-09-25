import { useTranslation } from '@/features/i18n/provider'
import { findModel } from '@/features/calculator/model-prices'
import { calculateCost } from '@/features/calculator/cost'

/**
 * Page-specific block for /claude-token-cost-calculator.
 *
 * Computes the breakeven point at which the Anthropic API becomes cheaper
 * than the Claude Pro / Max subscriptions. Numbers are computed live from the
 * model registry, not hardcoded — so when lastVerified gets bumped, this block
 * stays in sync.
 */
export function ClaudeSubscriptionSection() {
  const { t } = useTranslation()
  const sonnet = findModel('claude-sonnet-4.5')
  if (!sonnet) return null

  // Pro plan ($20/mo) break-even: solve $20 = (input × $3/1M) + (output × $15/1M)
  // We fix output at 0.5× input (typical Sonnet workload) and solve for input.
  const proMonthly = 20
  const maxMonthly = 200
  const inputRate = sonnet.inputPricePer1M
  const outputRate = sonnet.outputPricePer1M

  const proInputM = proMonthly / (inputRate + 0.5 * outputRate)
  const proOutputM = proInputM * 0.5
  const maxInputM = maxMonthly / (inputRate + 0.5 * outputRate)
  const maxOutputM = maxInputM * 0.5

  // Sample cost at the break-even for the table
  const sampleInputTokens = 1_000_000 // 1M
  const sampleOutputTokens = 500_000 // 500k
  const api = calculateCost('claude-sonnet-4.5', sampleInputTokens, sampleOutputTokens)

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
              Claude Pro · $20/mo
            </h3>
            <p className="mt-2 text-[13px] text-fg-3">
              Break-even: ~{formatM(proInputM)}M input + {formatM(proOutputM)}M output per month
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-fg-2">
              Below this combined usage the Pro plan is cheaper; above it the API starts winning.
            </p>
          </div>

          <div className="rounded-[14px] border border-border bg-card p-6">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px]">
              Claude Max · $200/mo
            </h3>
            <p className="mt-2 text-[13px] text-fg-3">
              Break-even: ~{formatM(maxInputM)}M input + {formatM(maxOutputM)}M output per month
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-fg-2">
              For sustained heavy usage, Max covers you up to roughly the API equivalent of $200/mo.
            </p>
          </div>
        </div>

        <p className="mt-4 text-[13px] text-fg-3">
          Sample reference: 1M input + 500K output tokens via the API costs{' '}
          <strong className="tabular-nums text-fg-2">${api.totalCost.toFixed(2)}</strong> / month
          ({api.totalCost === 0 ? 'no usage' : 'at current Sonnet 4.5 rates'}).
        </p>
      </div>
    </section>
  )
}

function formatM(n: number): string {
  if (n >= 100) return n.toFixed(0)
  if (n >= 10) return n.toFixed(1)
  return n.toFixed(2)
}