import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { findLeaderboardModel } from '@/features/leaderboard/models'
import { priceWindowLabel } from '@/features/calculator/model-notes'
import { REGISTRY } from '@/features/calculator/model-prices'
import { formatContext, formatThreshold, type VendorPriceRow } from './data'
import type { VendorKey } from './data'

/**
 * The rate table of a vendor pricing page.
 *
 * Every cell is resolved from the price registry: the input, output and cached
 * rates are `priceDetail()`'s resolution of the dated band in force on the
 * registry snapshot day — the very same resolution `calculateCost` charges
 * with. A promotional rate is therefore never printed as if it were the
 * long-term one, and the page cannot disagree with the calculator above it.
 *
 * The model name links to `/models/<slug>` when the model has a leaderboard
 * row (a price row with no scores has no model page, so its name stays plain
 * text rather than linking to a 404).
 */
export function VendorRateTable({
  vendor: _vendor,
  rows,
}: {
  vendor: VendorKey
  rows: VendorPriceRow[]
}) {
  const { t } = useTranslation()
  const date = REGISTRY.fetchedAt.slice(0, 10)

  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-7">
        <h2 className="text-[22px] font-semibold tracking-[-0.4px]">
          {t('landing.common.rateTableTitle')}
        </h2>
        <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
          {t('landing.common.rateTableIntro', { date })}
        </p>

        <div className="mt-5 overflow-x-auto rounded-[14px] border border-border bg-card">
          <table className="w-full min-w-[860px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
                <th className="px-4 py-2.5 font-medium">{t('landing.common.colModel')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.common.colInput')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.common.colOutput')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.common.colCached')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.common.colContext')}</th>
                <th className="px-4 py-2.5 font-medium">{t('landing.common.colNotes')}</th>
                <th className="px-4 py-2.5 font-medium">{t('landing.common.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { model, detail } = row
                const leaderboardId = findLeaderboardModel(model.id)?.id
                const notes = notesFor(row, t)

                return (
                  <tr key={model.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {leaderboardId ? (
                        <Link
                          to="/{-$locale}/models/$slug"
                          params={{ slug: leaderboardId }}
                          className="hover:text-primary"
                        >
                          {model.displayName}
                        </Link>
                      ) : (
                        model.displayName
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                      ${detail.input}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                      ${detail.output}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                      {detail.cached != null ? `$${detail.cached}` : t('landing.common.noCachedRate')}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                      {formatContext(model.contextWindow)}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-fg-3">{notes}</td>
                    <td className="px-4 py-2.5 text-[12px] text-fg-3">
                      {model.status === 'active'
                        ? t('landing.common.active')
                        : t('landing.common.delisted')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[12px] text-fg-3">{t('landing.common.updated', { date })}</p>
      </div>
    </section>
  )
}

/** A translation function, as the i18n provider hands it out. */
type Translate = (key: string, params?: Record<string, string | number>) => string

/**
 * The notes column: the promo band in force, the long-context band, the
 * cache-write rates and the published service tiers — every one of them read
 * off the row, never typed.
 */
function notesFor(row: VendorPriceRow, t: Translate): string {
  const { model, detail } = row
  const parts: string[] = []

  if (detail.promoActive && detail.currentWindow && detail.promoUntil) {
    parts.push(
      t('landing.common.promoNote', {
        label: priceWindowLabel(detail.currentWindow.label, 'en'),
        date: detail.promoUntil,
      }),
    )
  }

  const longContext = model.longContext?.[model.longContext.length - 1]
  if (longContext) {
    parts.push(
      t('landing.common.longContextNote', {
        threshold: formatThreshold(longContext.threshold),
        inputMult: longContext.inputMultiplier,
        outputMult: longContext.outputMultiplier,
      }),
    )
  } else {
    parts.push(t('landing.common.noLongContext'))
  }

  const writes = model.cacheWrite ?? []
  if (writes.length > 0) {
    const rates = writes
      .map(
        (w) =>
          `${t(
            w.window === '5min'
              ? 'landing.common.cacheWindow5min'
              : 'landing.common.cacheWindow1hr',
          )} $${w.pricePer1M}`,
      )
      .join(', ')
    parts.push(t('landing.common.cacheWriteNote', { rates }))
  }

  for (const tier of detail.tiers) {
    if (tier.multiplier == null && tier.inputPricePer1M == null) continue
    parts.push(
      t('landing.common.tierNote', {
        label: tier.label,
        multiplier: tier.multiplier ?? (tier.inputPricePer1M != null ? `$${tier.inputPricePer1M}` : ''),
      }),
    )
  }

  return parts.join(' · ')
}
