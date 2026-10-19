import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ExternalLink, Sparkles } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { findModel } from '@/features/calculator/model-prices'
import type { CostBreakdown } from '@/features/calculator/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface ModelCardProps {
  breakdown: CostBreakdown
  rank?: number
  /** When true (deep link `?model=`), ring the card and scroll it into view. */
  highlight?: boolean
}

/**
 * Single model result card.
 *
 * Layout: provider badge, model name, headline monthly cost, applied-rule
 * annotation, expandable breakdown. Cards link to the provider's official
 * pricing page via the `sourceUrl` on the registry entry — never to a
 * competitor or our own landing for the same number.
 */
export function ModelCard({ breakdown, rank, highlight }: ModelCardProps) {
  const { t } = useTranslation()
  const model = findModel(breakdown.modelId)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: 'center' })
  }, [highlight])

  if (!model) return null

  const monthly = breakdown.totalCost
  const yearly = breakdown.annualisedCost
  const ruleKey = renderRuleKey(breakdown.appliedRule, t)

  return (
    <article
      ref={ref}
      className={cn(
        'group flex flex-col rounded-[14px] border border-border bg-card p-5 transition-colors',
        rank === 0 && 'border-foreground/30 ring-1 ring-foreground/10',
        highlight && 'border-primary/50 ring-2 ring-primary/20',
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="free">{model.provider}</Badge>
            {rank === 0 && (
              <Badge variant="pro" dot>
                <Sparkles size={11} /> {t('calculator.cheapestBadge')}
              </Badge>
            )}
          </div>
          <h3 className="mt-2 truncate text-[17px] font-semibold tracking-[-0.3px]">
            {model.displayName}
          </h3>
        </div>
        <a
          href={model.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-fg-3 hover:text-foreground"
          aria-label={`${model.displayName} pricing source`}
        >
          <ExternalLink size={14} />
        </a>
      </header>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold tabular-nums tracking-[-0.6px]">
          ${formatUsd(monthly)}
        </span>
        <span className="text-[13px] text-fg-3">{t('calculator.perMonth')}</span>
      </div>
      <div className="mt-0.5 text-[12px] text-fg-3">
        ${formatUsd(yearly)} {t('calculator.perYear')}
      </div>

      {breakdown.appliedRule !== 'standard' && (
        <div className="mt-3">
          <Badge variant="warn">{ruleKey}</Badge>
        </div>
      )}

      {model.note && (
        <p className="mt-3 text-[12px] leading-relaxed text-fg-3">{model.note}</p>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-fg-2 hover:text-foreground"
        aria-expanded={open}
      >
        {open ? t('calculator.hideBreakdown') : t('calculator.showBreakdown')}
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-[13px]">
          <Row label={t('calculator.inputLabel')} value={`$${formatUsd(breakdown.inputCost)}`} />
          <Row
            label={t('calculator.outputLabel')}
            value={`$${formatUsd(breakdown.outputCost)}`}
            sub={`${breakdown.outputTokens.toLocaleString()} tokens`}
          />
          <Row
            label={t('calculator.inputLabel')}
            value={`$${breakdown.effectiveInputPricePer1M.toFixed(2)} / 1M`}
            sub={`${breakdown.inputTokens.toLocaleString()} tokens`}
          />
          <Row
            label={t('calculator.outputLabel')}
            value={`$${breakdown.effectiveOutputPricePer1M.toFixed(2)} / 1M`}
          />
          <Row
            label="Context"
            value={model.contextWindow.toLocaleString()}
            sub={t('calculator.lastUpdated', { date: model.lastVerified })}
          />
        </dl>
      )}
    </article>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-fg-2">{label}</dt>
      <dd className="text-right">
        <span className="tabular-nums">{value}</span>
        {sub && <span className="ml-1.5 text-[11px] text-fg-3">{sub}</span>}
      </dd>
    </div>
  )
}

/** Map an `appliedRule` string (English) to a translation key. */
function renderRuleKey(
  rule: string,
  t: (k: string, params?: Record<string, string | number>) => string,
): string {
  if (rule === 'standard') return t('calculator.ruleStandard')
  if (rule.startsWith('promo')) {
    const date = rule.match(/until (\S+)/)?.[1]
    return t('calculator.rulePromo', { date: date ?? '' })
  }
  if (rule.startsWith('long-context')) {
    const n = rule.match(/≥([\d,]+)/)?.[1]
    return t('calculator.longContextLabel', { n: n ?? '' })
  }
  if (rule.startsWith('peak')) return t('calculator.peakLabel')
  if (rule.startsWith('off-peak')) return t('calculator.offPeakLabel')
  return rule
}

/** Tiny, locale-agnostic USD formatter (UI strings are translated separately). */
function formatUsd(n: number): string {
  if (n === 0) return '0'
  if (n < 0.01) return n.toFixed(4)
  if (n < 1) return n.toFixed(3)
  if (n < 100) return n.toFixed(2)
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}