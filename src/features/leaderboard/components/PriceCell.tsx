import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'
import type { ModelPrice } from '@/features/calculator/types'
import { cn } from '@/lib/utils'

/**
 * The one price component, rendered in three places:
 *  - `column`     → leaderboard table cell (blended $/1M)
 *  - `card`       → model profile price block (full breakdown + source)
 *  - `calculator` → "run your usage through it" link
 *
 * All three read the same `REGISTRY`, so there is one source of truth. The
 * compare table reads `formatPrice` directly for its compact breakdown rows.
 */
export type PriceView = 'column' | 'card' | 'calculator'

export function formatPrice(n: number): string {
  if (n >= 100) return `$${n.toFixed(0)}`
  if (n >= 1) return `$${n.toFixed(2)}`
  if (n >= 0.01) return `$${n.toFixed(3)}`
  return `$${n.toFixed(4)}`
}

function resolve(priceId?: string): ModelPrice | undefined {
  if (!priceId) return undefined
  return REGISTRY.models.find((m) => m.id === priceId)
}

export function PriceCell({
  priceId,
  view = 'column',
  className,
  label,
}: {
  priceId?: string
  view?: PriceView
  className?: string
  /** Overrides the calculator link text (e.g. "Run Claude Opus 5 usage"). */
  label?: string
}) {
  const { t } = useTranslation()
  const price = resolve(priceId)

  if (!price) {
    return <span className={cn('text-fg-3', className)}>—</span>
  }

  if (view === 'column') {
    const blended = (price.inputPricePer1M + price.outputPricePer1M) / 2
    return (
      <span className={cn('tabular-nums text-fg-2', className)}>{formatPrice(blended)}</span>
    )
  }

  if (view === 'calculator') {
    return (
      <Link
        to="/{-$locale}/token-calculator"
        search={{ model: price.id }}
        className={cn(
          'text-[13px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground',
          className,
        )}
      >
        {label ?? t('leaderboard.model.runUsage')} →
      </Link>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-4 text-[13px]">
        <span className="text-fg-3">{t('leaderboard.compare.input')}</span>
        <span className="tabular-nums text-fg-2">{formatPrice(price.inputPricePer1M)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[13px]">
        <span className="text-fg-3">{t('leaderboard.compare.output')}</span>
        <span className="tabular-nums text-fg-2">{formatPrice(price.outputPricePer1M)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[13px]">
        <span className="text-fg-3">{t('leaderboard.compare.cached')}</span>
        <span className="tabular-nums text-fg-2">
          {price.cachedInputPricePer1M != null ? formatPrice(price.cachedInputPricePer1M) : '—'}
        </span>
      </div>
      <a
        href={price.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-[12px] text-fg-3 underline decoration-dotted underline-offset-2 hover:text-foreground"
      >
        {t('leaderboard.sourceVerified', { date: price.lastVerified })}
      </a>
    </div>
  )
}
