import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { COMPARE_PAIR_ENTRIES } from '../leaderboard'
import { findLeaderboardModel } from '../models'
import { CompareSelector } from './CompareSelector'
import { CompareResult } from './CompareResult'
import { CostQuickCalc } from './CostQuickCalc'

export function PopularComparisons({ exclude }: { exclude?: string }) {
  const { t } = useTranslation()
  const pairs = COMPARE_PAIR_ENTRIES.filter((p) => p.slug !== exclude).slice(0, 12)
  return (
    <section>
      <h3 className="text-[15px] font-semibold text-foreground">{t('leaderboard.compare.popularTitle')}</h3>
      <div className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {pairs.map((p) => {
          const a = findLeaderboardModel(p.a)
          const b = findLeaderboardModel(p.b)
          if (!a || !b) return null
          return (
            <Link
              key={p.slug}
              to="/{-$locale}/compare/$pair"
              params={{ pair: p.slug }}
              className="truncate text-[13px] text-fg-2 hover:text-primary"
            >
              {a.displayName} vs {b.displayName}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/** Interactive /compare body: selector + result + cost calculator + links. */
export function CompareTool({
  a,
  b,
  onChange,
}: {
  a: string
  b: string
  onChange: (a: string, b: string) => void
}) {
  const modelA = findLeaderboardModel(a)
  const modelB = findLeaderboardModel(b)

  if (!modelA || !modelB) return null

  return (
    <div className="space-y-8">
      <CompareSelector a={a} b={b} onChange={onChange} />
      <CompareResult a={modelA} b={modelB} />
      <CostQuickCalc a={modelA} b={modelB} />
      <PopularComparisons />
    </div>
  )
}
