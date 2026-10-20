import { useEffect, useRef } from 'react'
import { ExternalLink, Sparkles } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { localeTag } from '@/features/i18n/locale'
import { findModel } from '@/features/calculator/model-prices'
import { modelNote } from '@/features/calculator/model-notes'
import { providerLabel } from '@/features/calculator/provider-label'
import type { CostBreakdown } from '@/features/calculator/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface ModelCardProps {
  breakdown: CostBreakdown
  rank?: number
  /** When true (deep link `?model=`), ring the card and scroll it into view. */
  highlight?: boolean
}

/** Translation function shape returned by `useTranslation()`. */
type TFn = (key: string, params?: Record<string, string | number>) => string

/**
 * Single model result card.
 *
 * Layout: provider badge, model name, headline monthly cost, applied-rule
 * annotation, and the full cost breakdown. Cards link to the provider's
 * official pricing page via the `sourceUrl` on the registry entry — never to a
 * competitor or our own landing for the same number.
 *
 * Every visible string is locale-driven: labels come from the i18n
 * dictionary, numbers are formatted with the APP locale (never the browser
 * locale), and provider names / model notes are resolved through the
 * localized helpers.
 */
export function ModelCard({ breakdown, rank, highlight }: ModelCardProps) {
  const { locale, t } = useTranslation()
  const model = findModel(breakdown.modelId)
  const ref = useRef<HTMLElement>(null)
  /** BCP-47 tag for the app locale — decides how every number renders. */
  const tag = localeTag(locale)

  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: 'center' })
  }, [highlight])

  if (!model) return null

  const monthly = breakdown.totalCost
  const yearly = breakdown.annualisedCost
  const ruleKey = renderRuleKey(breakdown.appliedRule, t, tag)
  const note = modelNote(model, locale)
  const tokensUnit = t('calculator.tokensUnit')

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
            <Badge variant="free">{providerLabel(t, model.provider)}</Badge>
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
          aria-label={t('calculator.pricingSourceLabel', { model: model.displayName })}
        >
          <ExternalLink size={14} />
        </a>
      </header>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold tabular-nums tracking-[-0.6px]">
          ${formatUsd(monthly, tag)}
        </span>
        <span className="text-[13px] text-fg-3">{t('calculator.perMonth')}</span>
      </div>
      <div className="mt-0.5 text-[12px] text-fg-3">
        ${formatUsd(yearly, tag)} {t('calculator.perYear')}
      </div>

      {breakdown.appliedRule !== 'standard' && (
        <div className="mt-3">
          <Badge variant="warn">{ruleKey}</Badge>
        </div>
      )}

      {note && (
        <p className="mt-3 text-[12px] leading-relaxed text-fg-3">{note}</p>
      )}

      <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-[13px]">
        <Row label={t('calculator.inputLabel')} value={`$${formatUsd(breakdown.inputCost, tag)}`} />
        <Row
          label={t('calculator.outputLabel')}
          value={`$${formatUsd(breakdown.outputCost, tag)}`}
          sub={`${breakdown.outputTokens.toLocaleString(tag)} ${tokensUnit}`}
        />
        <Row
          label={t('calculator.inputLabel')}
          value={`$${breakdown.effectiveInputPricePer1M.toFixed(2)} / 1M`}
          sub={`${breakdown.inputTokens.toLocaleString(tag)} ${tokensUnit}`}
        />
        <Row
          label={t('calculator.outputLabel')}
          value={`$${breakdown.effectiveOutputPricePer1M.toFixed(2)} / 1M`}
        />
        <Row
          label={t('calculator.contextLabel')}
          value={model.contextWindow.toLocaleString(tag)}
          sub={t('calculator.lastUpdated', { date: model.lastVerified })}
        />
      </dl>
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

/**
 * Map an `appliedRule` string (English, built by `cost.ts`) to a localized
 * label. Combinations such as `promo (until 2026-12-31) + cached input` are
 * split on ` + `, translated part by part, and joined back together.
 * Unrecognised rules fall back to the raw string.
 */
function renderRuleKey(rule: string, t: TFn, locale: string): string {
  if (!rule) return rule
  return rule
    .split(' + ')
    .map((part) => translateRulePart(part.trim(), t, locale))
    .join(' + ')
}

/** Translate a single rule (no ` + ` combination). */
function translateRulePart(rule: string, t: TFn, locale: string): string {
  if (rule === 'standard') return t('calculator.ruleStandard')
  if (rule.startsWith('promo')) {
    // `promo (until 2026-12-31)` — the date must not swallow the closing paren.
    const date = rule.match(/until ([^)]+)/)?.[1]
    return date ? t('calculator.rulePromo', { date }) : rule
  }
  if (rule.startsWith('long-context')) {
    const n = rule.match(/≥([\d.,\s]+)/)?.[1]
    return n ? t('calculator.longContextLabel', { n: formatThreshold(n, locale) }) : rule
  }
  if (rule.startsWith('off-peak')) return t('calculator.offPeakLabel')
  if (rule.startsWith('peak')) return t('calculator.peakLabel')
  if (rule === 'cached input') return t('calculator.cachedInputLabel')
  const cacheWrite = rule.match(/^cache write \((.+)\)$/)?.[1]
  if (cacheWrite) return t('calculator.cacheWriteLabel', { window: cacheWrite })
  return rule
}

/**
 * Re-format a long-context threshold that was stringified with the browser
 * locale (`cost.ts` builds the rule string) so the card shows the app locale.
 */
function formatThreshold(raw: string, locale: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return raw.trim()
  const n = Number(digits)
  return Number.isFinite(n) ? n.toLocaleString(locale) : raw.trim()
}

/** Tiny USD formatter; large values use the APP locale, not the browser locale. */
function formatUsd(n: number, locale: string): string {
  if (n === 0) return '0'
  if (n < 0.01) return n.toFixed(4)
  if (n < 1) return n.toFixed(3)
  if (n < 100) return n.toFixed(2)
  return n.toLocaleString(locale, { maximumFractionDigits: 0 })
}
