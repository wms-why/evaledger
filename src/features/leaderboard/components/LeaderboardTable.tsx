import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { cn } from '@/lib/utils'
import { PriceCell } from './PriceCell'
import {
  BENCHMARK_SHORT,
  CORE_BENCHMARK_IDS,
  getBenchmark,
  formatScore,
  leaderboardRows,
  scoreOf,
  sortRows,
  type LeaderboardRow,
  type SortKey,
} from '../leaderboard'
import type { Vendor } from '../types'
import { VENDOR_LABEL_KEY } from '../vendors'

const VENDOR_DOT: Record<Vendor, string> = {
  claude: '#D97757',
  openai: '#10A37F',
  google: '#4285F4',
  grok: '#111111',
  deepseek: '#4D6BFE',
  minimax: '#E5484D',
  glm: '#3B4CCA',
  kimi: '#7C3AED',
}

function SortHeader({
  label,
  sortKey,
  active,
  dir,
  align = 'right',
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  active: boolean
  dir: 'asc' | 'desc'
  align?: 'left' | 'right'
  onSort: (key: SortKey) => void
  className?: string
}) {
  return (
    <th className={cn('px-3 py-2 font-medium', className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 transition-colors hover:text-foreground',
          align === 'right' && 'flex-row-reverse',
          active ? 'text-foreground' : 'text-fg-3',
        )}
      >
        {label}
        {active && (dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  )
}

export interface LeaderboardTableProps {
  rows?: LeaderboardRow[]
  limit?: number
  benchmarkIds?: readonly string[]
}

export function LeaderboardTable({
  rows,
  limit = 20,
  benchmarkIds = CORE_BENCHMARK_IDS,
}: LeaderboardTableProps) {
  const { t } = useTranslation()
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'average',
    dir: 'desc',
  })

  const allRows = useMemo(() => rows ?? leaderboardRows(), [rows])
  const sorted = useMemo(
    () => sortRows(allRows, sort.key, sort.dir).slice(0, limit),
    [allRows, sort, limit],
  )

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' },
    )
  }

  return (
    <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
      <table className="w-full min-w-[720px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide">
            <th className="px-3 py-2 font-medium text-fg-3">{t('leaderboard.colRank')}</th>
            <SortHeader
              label={t('leaderboard.colModel')}
              sortKey="model"
              active={sort.key === 'model'}
              dir={sort.dir}
              align="left"
              onSort={handleSort}
            />
            {benchmarkIds.map((id) => (
              <SortHeader
                key={id}
                label={BENCHMARK_SHORT[id] ?? getBenchmark(id)?.name ?? id}
                sortKey={id}
                active={sort.key === id}
                dir={sort.dir}
                onSort={handleSort}
              />
            ))}
            <SortHeader
              label={t('leaderboard.colAverage')}
              sortKey="average"
              active={sort.key === 'average'}
              dir={sort.dir}
              onSort={handleSort}
            />
            <SortHeader
              label={t('leaderboard.colPrice')}
              sortKey="price"
              active={sort.key === 'price'}
              dir={sort.dir}
              onSort={handleSort}
            />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.model.id} className="border-b border-border/60 last:border-0 hover:bg-bg-alt">
              <td className="px-3 py-2.5 tabular-nums text-fg-3">{i + 1}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block size-2 shrink-0 rounded-full"
                    style={{ background: VENDOR_DOT[row.model.vendor] }}
                    aria-hidden
                  />
                  <Link
                    to="/{-$locale}/models/$slug"
                    params={{ slug: row.model.id }}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {row.model.displayName}
                  </Link>
                  <span className="text-[11px] text-fg-3">{t(VENDOR_LABEL_KEY[row.model.vendor])}</span>
                </div>
              </td>
              {benchmarkIds.map((id) => {
                const s = scoreOf(row.model, id)
                return (
                  <td key={id} className="px-3 py-2.5 text-right tabular-nums text-fg-2">
                    {s ? formatScore(s.score, s.unit) : <span className="text-fg-3">—</span>}
                  </td>
                )
              })}
              <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-foreground">
                {row.average != null ? row.average.toFixed(1) : '—'}
              </td>
              <td className="px-3 py-2.5 text-right">
                <PriceCell priceId={row.model.priceId} view="column" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
