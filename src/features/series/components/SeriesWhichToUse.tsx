import { useTranslation } from '@/features/i18n/provider'
import type { SeriesRow } from '../data'
import { SERIES_TIER_ORDER } from '../series'
import type { SeriesTier } from '../types'

/**
 * "Which version should I use?" — one line per tier of the line.
 *
 * The pick is the newest member of that tier that is still sold. Nothing here
 * is editorial: it falls out of the registry's own statuses.
 */
export function SeriesWhichToUse({ rows }: { rows: SeriesRow[] }) {
  const { t } = useTranslation()

  const picks = SERIES_TIER_ORDER.map((tier) => {
    const row = rows.find((candidate) => candidate.tier === tier && candidate.status === 'active')
    return { tier, row }
  }).filter((pick): pick is { tier: SeriesTier; row: SeriesRow } => Boolean(pick.row))

  if (picks.length === 0) return null

  return (
    <section className="rounded-[14px] border border-border bg-card p-5">
      <h3 className="text-[15px] font-semibold text-foreground">{t('series.whichTitle')}</h3>
      <ul className="mt-3 space-y-2">
        {picks.map((pick) => (
          <li key={pick.tier} className="flex gap-2 text-[14px] leading-relaxed text-fg-2">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              {t(`series.which${pick.tier.charAt(0).toUpperCase()}${pick.tier.slice(1)}`, {
                model: pick.row.displayName,
              })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
