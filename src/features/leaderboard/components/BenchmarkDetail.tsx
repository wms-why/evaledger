import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import type { Benchmark } from '../benchmarks'
import { formatScore, leaderboardRows, scoreOf } from '../leaderboard'

export function BenchmarkDetail({ benchmark }: { benchmark: Benchmark }) {
  const { t } = useTranslation()
  const ranked = leaderboardRows()
    .map((r) => ({ row: r, score: scoreOf(r.model, benchmark.id) }))
    .filter((x) => x.score)
    .sort((a, b) => (b.score!.score - a.score!.score))

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {t('leaderboard.benchmark.kicker')}
        </p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">{benchmark.name}</h1>
        <p className="mt-3 max-w-[680px] text-[16px] text-fg-2">{benchmark.description}</p>
        <Link
          to="/{-$locale}/benchmarks/$slug/history"
          params={{ slug: benchmark.id }}
          className="mt-4 inline-block text-[14px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {t('leaderboard.benchmark.historyLink')} →
        </Link>
      </div>

      <section>
        <h2 className="text-[18px] font-semibold">{t('leaderboard.benchmark.scores')}</h2>
        <div className="mt-3 overflow-hidden rounded-[12px] border border-border">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colRank')}</th>
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colModel')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('leaderboard.colScore')}</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((x, i) => (
                <tr key={x.row.model.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5 tabular-nums text-fg-3">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <Link to="/{-$locale}/models/$slug" params={{ slug: x.row.model.id }} className="text-fg-2 hover:text-primary">
                      {x.row.model.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                    {formatScore(x.score!.score, x.score!.unit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
