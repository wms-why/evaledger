import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'
import { priceDetail, registrySnapshotDate } from '@/features/calculator/pricing-detail'
import { applyOpenRouterMarkup } from '@/features/calculator/cost'

/**
 * Page-specific block for /openrouter-pricing-calculator.
 *
 * The page's title promises "What Your Tokens Actually Cost After Markup", so
 * it has to show the two numbers side by side — the provider's own price and
 * the OpenRouter price after the markup — and the difference between them.
 * Prose about a markup factor is not the same claim as the price it produces.
 *
 * Both columns come from the same functions the calculator uses
 * (`priceDetail` for the direct rate, `applyOpenRouterMarkup` for the routed
 * one), so the table can never disagree with the calculator above it. The
 * markup factor itself is the registry's (`REGISTRY.openRouterMarkup`), never
 * typed here.
 */
export function OpenRouterSection() {
  const { t } = useTranslation()
  const markupPct = Math.round((REGISTRY.openRouterMarkup - 1) * 100)
  const now = registrySnapshotDate()

  const rows = REGISTRY.models
    .filter((model) => model.status === 'active')
    .map((model) => {
      const direct = priceDetail(model, now)
      const routed = applyOpenRouterMarkup(model.id, undefined, now)
      if (!routed) return null
      return {
        id: model.id,
        displayName: model.displayName,
        directInput: direct.input,
        directOutput: direct.output,
        routerInput: routed.inputPricePer1M,
        routerOutput: routed.outputPricePer1M,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.routerInput - b.routerInput || a.routerOutput - b.routerOutput)

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
              {t('calculator.openrouterCurrentMarkup', {
                multiplier: REGISTRY.openRouterMarkup.toFixed(2),
                pct: markupPct,
              })}
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

        <h3 className="mt-10 text-[18px] font-semibold tracking-[-0.3px]">
          {t('calc.openrouterCompareTitle')}
        </h3>
        <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
          {t('calc.openrouterCompareSubtitle', {
            markupPct,
            multiplier: REGISTRY.openRouterMarkup.toFixed(2),
          })}
        </p>

        {rows.length === 0 ? (
          <p className="mt-4 text-[14px] text-fg-3">{t('calc.openrouterCompareEmpty')}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[14px] border border-border bg-card">
            <table className="w-full min-w-[820px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
                  <th className="px-4 py-2.5 font-medium">
                    {t('calc.openrouterCompareColModel')}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {t('calc.openrouterCompareColDirect')}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {t('calc.openrouterCompareColRouter')}
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    {t('calc.openrouterCompareColDiff')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      <Link
                        to="/{-$locale}/models/$slug"
                        params={{ slug: row.id }}
                        className="hover:text-primary"
                      >
                        {row.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                      ${row.directInput} / ${row.directOutput}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums text-primary">
                      ${row.routerInput} / ${row.routerOutput}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg-3">
                      +{markupPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-[12px] text-fg-3">
          {t('calc.openrouterCompareNote', {
            multiplier: REGISTRY.openRouterMarkup.toFixed(2),
            markupPct,
          })}
        </p>
      </div>
    </section>
  )
}
