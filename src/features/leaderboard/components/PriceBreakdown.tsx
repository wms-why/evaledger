import { useTranslation } from '@/features/i18n/provider'
import type { Locale } from '@/features/i18n/locale'
import { REGISTRY } from '@/features/calculator/model-prices'
import { priceTierLabel, priceTierNote, priceWindowLabel } from '@/features/calculator/model-notes'
import { priceDetail, type PriceDetail } from '@/features/calculator/pricing-detail'
import type { ModelPrice, PricingTier } from '@/features/calculator/types'
import { providerLabel } from '@/features/calculator/provider-label'
import { cn } from '@/lib/utils'

type TFn = (key: string, params?: Record<string, string | number>) => string

/**
 * The price breakdown — every price split into its parts.
 *
 * A single "blended $/1M" number answers none of the questions a buyer
 * actually has: is this the input or the output rate, is it the vendor's
 * price or a router's, does the promotion have an end date, and when was it
 * last checked. This panel answers all four, on every surface that shows a
 * price.
 */
export function PriceBreakdown({
  model,
  detail,
  className,
}: {
  model: ModelPrice
  /** Pre-resolved detail; resolved from the registry when omitted. */
  detail?: PriceDetail
  className?: string
}) {
  const { t, locale } = useTranslation()
  const resolved = detail ?? priceDetail(model)
  const band = resolved.currentWindow

  return (
    <div className={cn('space-y-3', className)}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-3">
        <Row label={t('leaderboard.price.input')}>
          {formatUsd(resolved.input)}
        </Row>
        <Row label={t('leaderboard.price.output')}>
          {formatUsd(resolved.output)}
        </Row>
        <Row label={t('leaderboard.price.cached')}>
          {resolved.cached != null ? formatUsd(resolved.cached) : '—'}
        </Row>
        <Row label={t('leaderboard.price.provider')}>
          {providerLabel(t, resolved.provider)}
        </Row>
        <Row label={t('leaderboard.price.channel')}>
          {resolved.channel === 'official'
            ? t('leaderboard.price.channelOfficial')
            : t('leaderboard.price.channelAggregator')}
        </Row>
        <Row label={t('leaderboard.price.lastVerified')}>
          {resolved.lastVerified}
        </Row>
      </dl>

      <p className="text-[11px] text-fg-3">{t('leaderboard.price.perMillion')}</p>

      {band && (
        // The band the price on screen belongs to, with its own dates: a
        // reader must be able to tell "this rate is in force" from "this
        // rate is the long-term one".
        <p className="text-[12px] text-fg-2">
          <span className="font-medium">{priceWindowLabel(band.label, locale)}</span>
          {' · '}
          {t('leaderboard.price.effectiveFrom', { date: band.from })}
          {band.until && ` · ${t('leaderboard.price.effectiveUntil', { date: band.until })}`}
        </p>
      )}

      {resolved.promoActive && (
        <p className="rounded-[8px] border border-border bg-soft px-3 py-2 text-[12px] text-primary">
          {t('leaderboard.price.promoActive')}
          {resolved.promoUntil &&
            ` · ${t('leaderboard.price.effectiveUntil', { date: resolved.promoUntil })}`}
        </p>
      )}

      {resolved.nextChange && (
        <p className="rounded-[8px] border border-border bg-bg-alt px-3 py-2 text-[12px] text-fg-2">
          {t('leaderboard.price.nextChange')}:{' '}
          {t('leaderboard.price.changesOn', { date: resolved.nextChange.from })} —{' '}
          {formatUsd(resolved.nextChange.inputPricePer1M)} /{' '}
          {formatUsd(resolved.nextChange.outputPricePer1M)}
        </p>
      )}

      {resolved.tiers.length > 0 && (
        <div>
          <p className="text-[12px] font-medium text-fg-2">
            {t('leaderboard.price.tiers')}
          </p>
          <ul className="mt-1.5 space-y-1">
            {resolved.tiers.map((tier) => (
              <TierRow key={tier.kind} tier={tier} locale={locale} />
            ))}
          </ul>
        </div>
      )}

      <a
        href={resolved.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-block text-[12px] text-fg-3 underline decoration-dotted underline-offset-2 hover:text-foreground"
      >
        {t('leaderboard.price.source')} →
      </a>
    </div>
  )
}

/** One labeled figure. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-fg-3">{label}</dt>
      <dd className="mt-0.5 tabular-nums text-foreground">{children}</dd>
    </div>
  )
}

/** One service tier — the rate that applies when you call it that way. */
function TierRow({ tier, locale }: { tier: PricingTier; locale: Locale }) {
  const { t } = useTranslation()
  const kindLabel = tierKindLabel(tier.kind, t)
  // The registry's tier label is what the vendor published; it is translated
  // through the Chinese overlay, not re-invented from the tier's kind.
  const label = priceTierLabel(tier.label || kindLabel, locale)
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2 text-[12px]">
      <span className="text-fg-2">
        {label}
        {tier.note && (
          <span className="ml-1.5 text-fg-3">{priceTierNote(tier.note, locale)}</span>
        )}
      </span>
      {tier.inputPricePer1M != null && (
        <span className="tabular-nums text-fg-3">
          {formatUsd(tier.inputPricePer1M)}
          {tier.outputPricePer1M != null && ` / ${formatUsd(tier.outputPricePer1M)}`}
        </span>
      )}
    </li>
  )
}

/** A tier's kind, localized when the registry has no label for it. */
function tierKindLabel(kind: PricingTier['kind'], t: TFn): string {
  switch (kind) {
    case 'batch':
      return t('leaderboard.price.tierBatch')
    case 'long-context':
      return t('leaderboard.price.tierLongContext')
    case 'priority':
      return t('leaderboard.price.tierPriority')
    case 'flex':
      return t('leaderboard.price.tierFlex')
    case 'peak':
      return t('leaderboard.price.tierPeak')
    case 'off-peak':
      return t('leaderboard.price.tierOffPeak')
    default:
      return t('leaderboard.price.tierStandard')
  }
}

/** A USD figure per 1M tokens, at the precision the registry uses. */
export function formatUsd(n: number): string {
  if (n >= 100) return `$${n.toFixed(0)}`
  if (n >= 1) return `$${n.toFixed(2)}`
  if (n >= 0.01) return `$${n.toFixed(3)}`
  return `$${n.toFixed(4)}`
}

/** The breakdown for a registry id, or undefined when the model has no price. */
export function priceDetailFor(modelId?: string): PriceDetail | undefined {
  if (!modelId) return undefined
  const model = REGISTRY.models.find((m) => m.id === modelId)
  return model ? priceDetail(model) : undefined
}
