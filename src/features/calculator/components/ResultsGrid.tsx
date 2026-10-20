import { useMemo } from 'react'
import { useTranslation } from '@/features/i18n/provider'
import { ModelCard } from './ModelCard'
import { REGISTRY } from '@/features/calculator/model-prices'
import type { CostBreakdown } from '@/features/calculator/types'
import { cn } from '@/lib/utils'

export type SortMode = 'cheapest' | 'expensive'

interface ResultsGridProps {
  breakdowns: CostBreakdown[]
  sortBy: SortMode
  onSortChange: (s: SortMode) => void
  providerFilter: string
  onProviderFilterChange: (p: string) => void
  onCopy: () => void
  copied: boolean
  /** Model id to visually highlight and scroll into view (from `?model=`). */
  highlightId?: string
}

const PROVIDER_KEYS: Record<string, string> = {
  openai: 'calculator.providerOpenai',
  anthropic: 'calculator.providerAnthropic',
  google: 'calculator.providerGoogle',
  deepseek: 'calculator.providerDeepSeek',
  minimax: 'calculator.providerMinimax',
  grok: 'calculator.providerGrok',
  openrouter: 'calculator.providerOpenRouter',
}

function providerLabel(t: (k: string) => string, key: string): string {
  return t(PROVIDER_KEYS[key] ?? key)
}

export function ResultsGrid({
  breakdowns,
  sortBy,
  onSortChange,
  providerFilter,
  onProviderFilterChange,
  onCopy,
  copied,
  highlightId,
}: ResultsGridProps) {
  const { t } = useTranslation()

  const filtered = useMemo(() => {
    const providerById = new Map(REGISTRY.models.map((m) => [m.id, m.provider]))
    const arr = breakdowns.filter((b) =>
      providerFilter === 'all' ? true : providerById.get(b.modelId) === providerFilter,
    )
    arr.sort((a, b) =>
      sortBy === 'cheapest' ? a.totalCost - b.totalCost : b.totalCost - a.totalCost,
    )
    return arr
  }, [breakdowns, sortBy, providerFilter])

  const providers = useMemo(
    () => [...new Set(REGISTRY.models.filter((m) => m.status === 'active').map((m) => m.provider))],
    [],
  )

  return (
    <section className="rounded-[14px] border border-border bg-bg-alt p-5 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-semibold tracking-[-0.3px]">
          {t('calculator.resultsTitle', { n: filtered.length })}
        </h2>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-bg-alt"
          aria-live="polite"
        >
          {copied ? t('calculator.copied') : t('calculator.copyEstimate')}
        </button>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px]">
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {(['cheapest', 'expensive'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSortChange(s)}
              className={cn(
                'rounded px-2.5 py-1 font-medium transition-colors',
                sortBy === s ? 'bg-bg-alt text-foreground' : 'text-fg-2',
              )}
              aria-pressed={sortBy === s}
            >
              {s === 'cheapest' ? t('calculator.sortCheapest') : t('calculator.sortExpensive')}
            </button>
          ))}
        </div>

        <div className="inline-flex flex-wrap gap-1.5">
          <ProviderChip
            active={providerFilter === 'all'}
            onClick={() => onProviderFilterChange('all')}
            label={t('calculator.filterAll')}
          />
          {providers.map((p) => (
            <ProviderChip
              key={p}
              active={providerFilter === p}
              onClick={() => onProviderFilterChange(p)}
              label={providerLabel(t, p)}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((b, i) => (
          <ModelCard
            key={b.modelId}
            breakdown={b}
            rank={i === 0 && sortBy === 'cheapest' ? 0 : undefined}
            highlight={b.modelId === highlightId}
          />
        ))}
      </div>
    </section>
  )
}

function ProviderChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors',
        active
          ? 'border-foreground/30 bg-foreground/5 text-foreground'
          : 'border-border bg-card text-fg-2 hover:text-foreground',
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}