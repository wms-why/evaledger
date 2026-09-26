import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'

/**
 * Page-specific block for /chatgpt-api-pricing. Explains the Batch API
 * 50% discount and OpenAI prompt caching — the two ChatGPT-specific cost
 * levers that the shared Tips / PricingTLDR blocks only summarize.
 */
export function ChatGPTSection() {
  const { t } = useTranslation()
  // Pull the live cached-input numbers from REGISTRY so the copy can never
  // drift from the source data — the discount % is computed live.
  const cachedModels = REGISTRY.models.filter(
    (m) => m.provider === 'openai' && m.status === 'active' && m.cachedInputPricePer1M != null,
  )

  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-7">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[14px] border border-border bg-card p-6">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px]">
              {t('calculator.chatgptBatchTitle')}
            </h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-fg-2">
              {t('calculator.chatgptBatchBody')}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-bg-alt px-3 py-1.5 text-[12px] tabular-nums text-fg-2">
              {t('calculator.chatgptBatchBadge')}
            </p>
          </div>
          <div className="rounded-[14px] border border-border bg-card p-6">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px]">
              {t('calculator.chatgptCacheTitle')}
            </h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-fg-2">
              {t('calculator.chatgptCacheBody')}
            </p>
            {cachedModels.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-[12px] tabular-nums text-fg-2">
                {cachedModels.map((m) => (
                  <li key={m.id}>
                    <span className="font-medium text-fg-1">{m.displayName}:</span>{' '}
                    ${m.cachedInputPricePer1M!.toFixed(3)}/M
                    {m.inputPricePer1M != null && (
                      <>
                        {' '}
                        <span className="text-fg-3">
                          ({Math.round((1 - m.cachedInputPricePer1M! / m.inputPricePer1M) * 100)}%
                          off)
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
