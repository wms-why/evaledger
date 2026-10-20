import { Check } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { cn } from '@/lib/utils'
import type { Benchmark } from '../benchmarks'

/**
 * Flat multi-select for the benchmark rows of the comparison table.
 *
 * Every row available to the current model line-up is one tile: click to
 * toggle it, or use the select-all / clear actions. The selection is owned by
 * the page (and kept in the URL), so a shared link reproduces the same table.
 * The table itself mirrors this with a hover-remove control on each row.
 */
export function CompareScoreSelector({
  benchmarks,
  selectedIds,
  onChange,
}: {
  benchmarks: readonly Benchmark[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const { t } = useTranslation()
  const selected = new Set(selectedIds)
  const selectedCount = benchmarks.filter((benchmark) => selected.has(benchmark.id)).length
  const allSelected = benchmarks.length > 0 && selectedCount === benchmarks.length
  const noneSelected = selectedCount === 0

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(benchmarks.filter((benchmark) => next.has(benchmark.id)).map((benchmark) => benchmark.id))
  }

  const actionClass =
    'rounded px-1 py-0.5 text-[12px] text-fg-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-fg-2'

  return (
    <section
      aria-label={t('leaderboard.compare.scoreItems')}
      className="rounded-[14px] border border-border bg-card p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="text-[13px] font-semibold text-foreground">
            {t('leaderboard.compare.scoreItems')}
          </h3>
          <span className="text-[11px] tabular-nums text-fg-3">
            {t('leaderboard.compare.scoreCount', {
              count: selectedCount,
              total: benchmarks.length,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={allSelected}
            onClick={() => onChange(benchmarks.map((benchmark) => benchmark.id))}
            className={actionClass}
          >
            {t('leaderboard.compare.selectAllScores')}
          </button>
          <span aria-hidden className="h-3 w-px bg-border" />
          <button
            type="button"
            disabled={noneSelected}
            onClick={() => onChange([])}
            className={actionClass}
          >
            {t('leaderboard.compare.clearScores')}
          </button>
        </div>
      </div>

      <p className="mt-1 text-[12px] text-fg-3">{t('leaderboard.compare.scorePickerHint')}</p>

      <div
        role="group"
        aria-label={t('leaderboard.compare.scoreItems')}
        className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4"
      >
        {benchmarks.map((benchmark) => {
          const isSelected = selected.has(benchmark.id)
          return (
            <button
              key={benchmark.id}
              type="button"
              aria-pressed={isSelected}
              title={benchmark.description}
              onClick={() => toggle(benchmark.id)}
              className={cn(
                'flex min-w-0 items-start gap-2 rounded-[9px] border px-2 py-1.5 text-left text-[12.5px] transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                isSelected
                  ? 'border-primary/40 bg-soft font-medium text-foreground'
                  : 'border-border bg-card text-fg-2 hover:border-border-strong hover:bg-bg-alt hover:text-foreground',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'mt-px flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-strong bg-transparent',
                )}
              >
                {isSelected ? <Check size={10} strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 break-words leading-tight">{benchmark.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
