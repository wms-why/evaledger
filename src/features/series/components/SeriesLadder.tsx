import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { renderRuleKey } from '@/features/calculator/pricing-rule'
import { formatPrice } from '@/features/leaderboard/components/PriceCell'
import { cn } from '@/lib/utils'
import type { SeriesRow } from '../data'

/**
 * The version ladder — every version of one line in one table, newest first.
 *
 * Prices are read live from the registry, so this table cannot go stale. A
 * version whose price row was retired shows `—` in the price columns instead
 * of borrowing another version's number.
 */
export function SeriesLadder({ rows }: { rows: SeriesRow[] }) {
  const { locale, t } = useTranslation()
  const tiers = new Set(rows.map((row) => row.tier))
  const showTier = tiers.size > 1

  return (
    <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
            <th className="px-4 py-2.5 whitespace-nowrap font-medium">{t('series.colVersion')}</th>
            {showTier ? <th className="px-4 py-2.5 whitespace-nowrap font-medium">{t('series.colTier')}</th> : null}
            <th className="px-4 py-2.5 whitespace-nowrap font-medium">{t('series.colStatus')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap font-medium">{t('series.colReleased')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap text-right font-medium">{t('series.colInput')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap text-right font-medium">{t('series.colOutput')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap text-right font-medium">{t('series.colCached')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap text-right font-medium">{t('series.colContext')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap text-right font-medium">{t('series.colBlended')}</th>
            <th className="px-4 py-2.5 whitespace-nowrap text-right font-medium">{t('series.colSampleCost')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={cn(
                'border-b border-border/60 transition-colors last:border-0 hover:bg-bg-alt',
                row.isNewest && 'bg-soft/40',
              )}
            >
              <td className="min-w-[13rem] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {row.scoreId ? (
                    <Link
                      to="/{-$locale}/models/$slug"
                      params={{ slug: row.scoreId }}
                      title={t('series.modelPage')}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {row.displayName}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{row.displayName}</span>
                  )}
                  {row.isNewest ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {t('series.latestTag')}
                    </span>
                  ) : null}
                  {row.isCheapest ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      {t('series.cheapestTag')}
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-[11px] text-fg-3">{row.version}</div>
                {row.note ? (
                  <div
                    className="mt-0.5 max-w-[22rem] text-[11px] leading-snug text-fg-3 line-clamp-2"
                    title={row.note}
                  >
                    {row.note}
                  </div>
                ) : null}
                {row.priceId ? (
                  <Link
                    to="/{-$locale}/token-calculator"
                    search={{ model: row.priceId }}
                    className="mt-1 inline-block whitespace-nowrap text-[11px] text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
                  >
                    {t('series.runUsage')}
                  </Link>
                ) : null}
              </td>
              {showTier ? (
                <td className="px-4 py-3 whitespace-nowrap text-fg-2">
                  {t(`series.tier${row.tier.charAt(0).toUpperCase()}${row.tier.slice(1)}`)}
                </td>
              ) : null}
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium',
                    row.status === 'active'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-bg-alt text-fg-3 ring-1 ring-border',
                  )}
                >
                  {t(
                    row.status === 'active'
                      ? 'series.statusActive'
                      : row.status === 'retired'
                        ? 'series.statusRetired'
                        : 'series.statusLegacy',
                  )}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums text-fg-2">
                {row.releasedAt ?? <span className="text-fg-3">—</span>}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-fg-2">
                {row.inputPricePer1M != null ? formatPrice(row.inputPricePer1M) : '—'}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-fg-2">
                {row.outputPricePer1M != null ? formatPrice(row.outputPricePer1M) : '—'}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-fg-2">
                {row.cachedInputPricePer1M != null ? formatPrice(row.cachedInputPricePer1M) : '—'}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-fg-2">
                {row.contextWindow != null ? `${(row.contextWindow / 1000).toLocaleString()}K` : '—'}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-fg-2">
                {row.blendedPricePer1M != null ? formatPrice(row.blendedPricePer1M) : '—'}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {row.sampleCost != null ? (
                  <>
                    {row.sampleCostOffPeak != null ? (
                      // Peak/off-peak lines: name the period, so the reader
                      // knows which rate the number above is.
                      <>
                        <span className="text-foreground">
                          {t('calculator.peakLabel')} {formatPrice(row.sampleCost)}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-fg-3">
                          {t('calculator.offPeakLabel')} {formatPrice(row.sampleCostOffPeak)}
                        </span>
                      </>
                    ) : (
                      <span className="text-foreground">{formatPrice(row.sampleCost)}</span>
                    )}
                    {row.appliedRule && row.appliedRule !== 'standard' && !row.sampleCostOffPeak ? (
                      <span className="mt-0.5 block text-[11px] text-fg-3">
                        {renderRuleKey(row.appliedRule, t, locale)}
                      </span>
                    ) : null}
                  </>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
