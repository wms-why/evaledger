import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'
import { priceDetail } from '@/features/calculator/pricing-detail'
import type { ModelPrice } from '@/features/calculator/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PriceBreakdown } from './PriceBreakdown'

/**
 * The one price component, rendered in three places:
 *  - `column`     → leaderboard table cell (blended $/1M)
 *  - `card`       → model profile price block (the full breakdown)
 *  - `calculator` → "run your usage through it" link
 *
 * All three read the same `REGISTRY`, so there is one source of truth. The
 * compare table reads `formatPrice` directly for its compact breakdown rows.
 *
 * The number shown is always the rate IN FORCE (the dated band the resolver
 * picks), never the registry's base rate: a base rate may be a promotional
 * band, and a board must not quote a promotion as the long-term price.
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
    // The rate IN FORCE, not the registry's base rate: the base rate may be
    // a promotional band, and quoting it as the long-term price is the bug
    // this cell used to have. `priceDetail` resolves the band exactly like
    // `calculateCost` charges it.
    const detail = priceDetail(price)
    const blended = (detail.input + detail.output) / 2
    const until = detail.promoUntil
    return (
      <span className={cn('inline-flex flex-col items-end gap-0.5', className)}>
        <span
          className="tabular-nums text-fg-2"
          title={detail.promoActive ? t('leaderboard.price.promoActive') : undefined}
        >
          {formatPrice(blended)}
        </span>
        {detail.promoActive && until && (
          <Badge variant="pro" className="px-[6px] py-0 text-[10px] leading-[1.6]">
            {t('leaderboard.price.promoActive')} ·{' '}
            {t('leaderboard.price.effectiveUntil', { date: until })}
          </Badge>
        )}
      </span>
    )
  }

  if (view === 'calculator') {
    return (
      <Link
        to="/{-$locale}/token-cost-calculator"
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
      <PriceBreakdown model={price} />
    </div>
  )
}
