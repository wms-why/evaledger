import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { formatPrice } from '@/features/leaderboard/components/PriceCell'
import { VENDOR_LABEL_KEY } from '@/features/leaderboard/vendors'
import type { SeriesRow } from '../data'
import type { Series } from '../types'

/**
 * One line on the `/series` index: how many versions it has, what the newest
 * one costs, and what the cheapest option in the line is.
 */
export function SeriesIndexCard({ series, rows }: { series: Series; rows: SeriesRow[] }) {
  const { t } = useTranslation()
  const newest = rows[0]
  const cheapest = rows.find((row) => row.isCheapest)

  return (
    <Link
      to="/{-$locale}/series/$slug"
      params={{ slug: series.slug }}
      className="group block rounded-[14px] border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-soft/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold text-foreground">{series.name}</h3>
          <p className="mt-0.5 text-[12px] text-fg-3">
            {t(VENDOR_LABEL_KEY[series.vendor])} · {t('series.versionCount', { n: rows.length })}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-fg-3">
            {t('series.latestTag')}
          </dt>
          <dd className="mt-1 text-foreground">{newest?.displayName ?? '—'}</dd>
          <dd className="tabular-nums text-fg-2">
            {newest?.outputPricePer1M != null ? formatPrice(newest.outputPricePer1M) : '—'}
            <span className="text-[11px] text-fg-3">
              {' '}
              /1M {t('leaderboard.compare.output')}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-fg-3">
            {t('series.cheapestTag')}
          </dt>
          <dd className="mt-1 text-foreground">{cheapest?.displayName ?? '—'}</dd>
          <dd className="tabular-nums text-fg-2">
            {cheapest?.outputPricePer1M != null ? formatPrice(cheapest.outputPricePer1M) : '—'}
            <span className="text-[11px] text-fg-3">
              {' '}
              /1M {t('leaderboard.compare.output')}
            </span>
          </dd>
        </div>
      </dl>
    </Link>
  )
}
