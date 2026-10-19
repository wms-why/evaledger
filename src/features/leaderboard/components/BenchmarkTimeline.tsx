import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import type { Benchmark } from '../benchmarks'
import { LEADERBOARD } from '../models'
import { formatScore, leaderboardRows, scoreOf } from '../leaderboard'

/**
 * Score-over-time view for one benchmark. The line chart reads
 * `LEADERBOARD.history` (empty until the snapshot job lands) and falls back to
 * a current-snapshot table so the page is never blank.
 */
export function BenchmarkTimeline({ benchmark }: { benchmark: Benchmark }) {
  const { t } = useTranslation()
  const history = LEADERBOARD.history.filter((h) => h.benchmark === benchmark.id)
  const overwritten = history.filter((h) => h.supersededAt)

  const snapshot = leaderboardRows()
    .map((r) => ({ row: r, score: scoreOf(r.model, benchmark.id) }))
    .filter((x) => x.score)
    .sort((a, b) => b.score!.score - a.score!.score)

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/{-$locale}/benchmarks/$slug"
          params={{ slug: benchmark.id }}
          className="text-[13px] text-fg-3 hover:text-foreground"
        >
          ← {benchmark.name}
        </Link>
        <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.02em] md:text-[38px]">
          {benchmark.name}: {t('leaderboard.history.title')}
        </h1>
        <p className="mt-3 max-w-[680px] text-[15px] text-fg-2">{t('leaderboard.history.intro')}</p>
      </div>

      <section>
        <h2 className="text-[18px] font-semibold">{t('leaderboard.history.timeline')}</h2>
        {history.length === 0 ? (
          <p className="mt-3 rounded-[12px] border border-dashed border-border bg-bg-alt px-4 py-6 text-center text-[14px] text-fg-3">
            {t('leaderboard.history.empty')}
          </p>
        ) : (
          <p className="mt-3 text-[14px] text-fg-2">
            {t('leaderboard.history.snapshots', { n: history.length })}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-[18px] font-semibold">{t('leaderboard.history.snapshotTable')}</h2>
        <div className="mt-3 overflow-hidden rounded-[12px] border border-border">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colRank')}</th>
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colModel')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('leaderboard.colScore')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('leaderboard.colObserved')}</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.map((x, i) => (
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
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-3">{x.score!.observedAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-[18px] font-semibold">{t('leaderboard.history.overwritten')}</h2>
        {overwritten.length === 0 ? (
          <p className="mt-3 rounded-[12px] border border-dashed border-border bg-bg-alt px-4 py-6 text-center text-[14px] text-fg-3">
            {t('leaderboard.history.overwrittenEmpty')}
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-[13px] text-fg-2">
            {overwritten.map((h, i) => (
              <li key={i}>
                {h.modelId} · {h.benchmark} · {h.score} → {t('leaderboard.history.supersededOn')} {h.supersededAt}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
