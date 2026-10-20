import { useTranslation } from '@/features/i18n/provider'
import { formatPrice } from '@/features/leaderboard/components/PriceCell'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SeriesChange, SeriesStep } from '../data'

/**
 * "What changed at each step" — one card per version bump, oldest → newest.
 *
 * Only changes we can prove from the registries are listed. A benchmark only
 * one of the two versions reports is not a difference we can show, so it does
 * not appear: the block says what moved, not what might have.
 */
export function SeriesChanges({ steps }: { steps: SeriesStep[] }) {
  const { t } = useTranslation()

  if (steps.length === 0) {
    return (
      <p className="rounded-[12px] border border-border bg-soft px-4 py-3 text-[14px] text-fg-2">
        {t('series.changeNoChange')}
      </p>
    )
  }

  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li
          key={`${step.from.key}-${step.to.key}`}
          className="rounded-[12px] border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[14px]">
            <span className="font-medium text-foreground">{step.from.displayName}</span>
            <span className="text-fg-3">→</span>
            <span className="font-medium text-foreground">{step.to.displayName}</span>
          </div>
          {step.changes.length === 0 ? (
            <p className="mt-2 text-[13px] text-fg-3">{t('series.changeNoChange')}</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {step.changes.map((change, index) => (
                <li key={`${change.kind}-${change.slot ?? change.benchmarkId ?? index}`}>
                  <ChangeLine change={change} />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  )
}

function ChangeLine({ change }: { change: SeriesChange }) {
  const { t } = useTranslation()

  if (change.kind === 'price' && change.slot) {
    const pct = Math.abs(Math.round((change.ratio ?? 0) * 100))
    const { direction } = change
    const slot = t(`series.col${cap(change.slot)}`)
    return (
      <span className="flex items-center gap-2 text-[13px] text-fg-2">
        <DeltaIcon direction={direction} />
        <span>
          {direction === 'same'
            ? t('series.changePriceSame', {
                slot,
                from: formatPrice(change.from),
                to: formatPrice(change.to),
              })
            : t('series.changePrice', {
                slot,
                direction: t(`series.change${cap(direction)}`),
                pct,
                from: formatPrice(change.from),
                to: formatPrice(change.to),
              })}
        </span>
      </span>
    )
  }

  if (change.kind === 'context') {
    const { direction } = change
    return (
      <span className="flex items-center gap-2 text-[13px] text-fg-2">
        <DeltaIcon direction={direction} />
        <span>
          {t('series.changeContext', {
            direction: t(`series.change${cap(direction)}`),
            from: `${(change.from / 1000).toLocaleString()}K`,
            to: `${(change.to / 1000).toLocaleString()}K`,
          })}
        </span>
      </span>
    )
  }

  const { direction } = change
  return (
    <span className="flex items-center gap-2 text-[13px] text-fg-2">
      <DeltaIcon direction={direction} />
      <span>
        {t('series.changeScore', {
          benchmark: change.benchmarkName ?? change.benchmarkId ?? '',
          direction: t(`series.change${cap(direction)}`),
          points: Math.abs(Math.round(change.delta ?? 0)),
          from: `${change.from}${change.unit === 'percent' ? '%' : ''}`,
          to: `${change.to}${change.unit === 'percent' ? '%' : ''}`,
        })}
        {change.note ? (
          // The caveat the source printed with the score travels with it.
          <span className="text-fg-3"> — {change.note}</span>
        ) : null}
      </span>
    </span>
  )
}

function DeltaIcon({ direction }: { direction: 'up' | 'down' | 'same' }) {
  if (direction === 'up') return <ArrowUp size={14} strokeWidth={2} aria-hidden className="text-emerald-600 dark:text-emerald-400" />
  if (direction === 'down') return <ArrowDown size={14} strokeWidth={2} aria-hidden className="text-fg-3" />
  return <Minus size={14} strokeWidth={2} aria-hidden className={cn('text-fg-3')} />
}

function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
