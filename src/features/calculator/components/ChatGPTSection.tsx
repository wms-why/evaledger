import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'
import { priceDetail } from '@/features/calculator/pricing-detail'
import { chatgptCacheBody, chatgptCacheTitle } from '@/features/calculator/copy'

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
              {chatgptCacheTitle(t)}
            </h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-fg-2">
              {chatgptCacheBody(t)}
            </p>
            {cachedModels.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-[12px] tabular-nums text-fg-2">
                {cachedModels.map((m) => {
                  // The rate IN FORCE, not the registry's base rate: a base
                  // rate may be a promotional band, and the discount is a
                  // ratio of two prices the reader is actually charged. Both
                  // sides come from the same resolution, so the percentage
                  // cannot mix a promo rate with a standard one.
                  const detail = priceDetail(m)
                  if (detail.cached == null) return null
                  return (
                    <li key={m.id}>
                      <span className="font-medium text-fg-1">{m.displayName}:</span>{' '}
                      ${detail.cached.toFixed(3)}/M
                      {detail.input != null && (
                        <>
                          {' '}
                          <span className="text-fg-3">
                            ({Math.round((1 - detail.cached / detail.input) * 100)}%
                            off)
                          </span>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
