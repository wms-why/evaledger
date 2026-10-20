import { useMemo, useState } from 'react'
import { useTranslation } from '@/features/i18n/provider'
import { calculateCost } from '@/features/calculator/cost'
import { formatPrice } from '@/features/leaderboard/components/PriceCell'
import { cn } from '@/lib/utils'
import type { SeriesRow } from '../data'

const DEFAULTS = { calls: 10_000, inputTokens: 4_000, outputTokens: 1_000 }

/**
 * "What would my usage cost on each version of this line?"
 *
 * Unlike the compare-page calculator, this one prices REGISTRY rows rather
 * than leaderboard models — so it also covers the versions of a line that
 * have no score row (and therefore no leaderboard entry).
 */
export function SeriesCostCalc({ rows }: { rows: SeriesRow[] }) {
  const { t } = useTranslation()
  const [calls, setCalls] = useState(DEFAULTS.calls)
  const [input, setInput] = useState(DEFAULTS.inputTokens)
  const [output, setOutput] = useState(DEFAULTS.outputTokens)

  const costs = useMemo(
    () =>
      rows.map((row) => {
        if (!row.priceId) return undefined
        try {
          // Peak pricing (calculateCost's default) so the numbers match the
          // calculator page and the note below.
          return calculateCost(row.priceId, calls * input, calls * output).totalCost
        } catch {
          return undefined
        }
      }),
    [rows, calls, input, output],
  )

  const present = costs.filter((cost): cost is number => cost != null)
  const cheapest = present.length
    ? present.filter((cost) => cost === Math.min(...present)).length === 1
      ? Math.min(...present)
      : undefined
    : undefined

  const fields = [
    { label: t('series.callsPerMonth'), value: calls, set: setCalls },
    { label: t('series.inputTokens'), value: input, set: setInput },
    { label: t('series.outputTokens'), value: output, set: setOutput },
  ]

  return (
    <section className="rounded-[14px] border border-border bg-card p-5">
      <h3 className="text-[15px] font-semibold text-foreground">{t('series.costTitle')}</h3>
      <p className="mt-1 text-[13px] text-fg-3">{t('series.costSubtitle')}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {fields.map((field) => (
          <label key={field.label} className="flex flex-col gap-1 text-[12px] text-fg-2">
            {field.label}
            <input
              type="number"
              min={0}
              value={field.value}
              onChange={(event) => field.set(Math.max(0, Number(event.target.value)))}
              className="rounded-md border border-border bg-bg-alt px-3 py-2 text-[14px] tabular-nums focus:border-foreground focus:outline-none"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row, index) => {
          const cost = costs[index]
          return (
            <div
              key={row.key}
              className={cn(
                'rounded-[12px] border px-4 py-3',
                cost != null && cost === cheapest
                  ? 'border-primary/40 bg-soft'
                  : 'border-border bg-bg-alt',
              )}
            >
              <div className="text-[13px] text-fg-2">{row.displayName}</div>
              <div className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">
                {cost != null ? formatPrice(cost) : '—'}
                {cost != null && (
                  <span className="ml-1 text-[12px] font-normal text-fg-3">
                    {t('leaderboard.perMonth')}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[12px] text-fg-3">{t('series.costNote')}</p>
    </section>
  )
}
