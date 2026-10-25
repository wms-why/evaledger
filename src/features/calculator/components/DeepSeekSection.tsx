import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'
import { deepseekCacheBody } from '@/features/calculator/copy'

/**
 * Page-specific block for /deepseek-api-pricing. Explains the off-peak
 * schedule and the cache-hit discount — the two DeepSeek-specific cost
 * levers that the shared Tips / PricingTLDR blocks only summarize.
 */
export function DeepSeekSection() {
  const { t } = useTranslation()
  // Pull the live V4 numbers from REGISTRY so the copy can never drift from
  // the source data — these are the only per-model numbers shown verbatim.
  const flash = REGISTRY.models.find((m) => m.id === 'deepseek-flash')
  const pro = REGISTRY.models.find((m) => m.id === 'deepseek-v4-pro')

  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-7">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[14px] border border-border bg-card p-6">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px]">
              {t('calculator.deepseekOffPeakTitle')}
            </h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-fg-2">
              {t('calculator.deepseekOffPeakBody')}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-bg-alt px-3 py-1.5 text-[12px] tabular-nums text-fg-2">
              {t('calculator.deepseekOffPeakBadge')}
            </p>
          </div>
          <div className="rounded-[14px] border border-border bg-card p-6">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px]">
              {t('calculator.deepseekCacheTitle')}
            </h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-fg-2">
              {deepseekCacheBody(t)}
            </p>
            {flash && pro && (
              <ul className="mt-4 space-y-1.5 text-[12px] tabular-nums text-fg-2">
                <li>
                  <span className="font-medium text-fg-1">
                    {flash.displayName}:
                  </span>{' '}
                  {flash.cachedInputPricePer1M != null
                    ? `$${flash.cachedInputPricePer1M.toFixed(3)}/M`
                    : '—'}
                  {flash.inputPricePer1M != null && flash.cachedInputPricePer1M != null && (
                    <>
                      {' '}
                      <span className="text-fg-3">
                        ({Math.round((1 - flash.cachedInputPricePer1M / flash.inputPricePer1M) * 100)}%
                        off)
                      </span>
                    </>
                  )}
                </li>
                <li>
                  <span className="font-medium text-fg-1">{pro.displayName}:</span>{' '}
                  {pro.cachedInputPricePer1M != null
                    ? `$${pro.cachedInputPricePer1M.toFixed(3)}/M`
                    : '—'}
                  {pro.inputPricePer1M != null && pro.cachedInputPricePer1M != null && (
                    <>
                      {' '}
                      <span className="text-fg-3">
                        ({Math.round((1 - pro.cachedInputPricePer1M / pro.inputPricePer1M) * 100)}%
                        off)
                      </span>
                    </>
                  )}
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}