import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { BENCHMARKS } from '../benchmarks'
import { LEADERBOARD } from '../models'
import { CORE_BENCHMARK_IDS, leaderboardRows, scoreOf } from '../leaderboard'

/** /leaderboard-history body. */
export function LeaderboardHistory() {
  const { t } = useTranslation()
  const overwritten = LEADERBOARD.history.filter((h) => h.supersededAt)
  const benchmarks = BENCHMARKS.filter((b) => (CORE_BENCHMARK_IDS as readonly string[]).includes(b.id))

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {t('leaderboard.navHistory')}
        </p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] md:text-[42px]">
          {t('leaderboard.historyPage.title')}
        </h1>
        <p className="mt-3 max-w-[680px] text-[16px] text-fg-2">{t('leaderboard.historyPage.intro')}</p>
      </div>

      <section>
        <h2 className="text-[18px] font-semibold">{t('leaderboard.historyPage.timeline')}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {benchmarks.map((bm) => {
            const top = leaderboardRows()
              .map((r) => ({ model: r.model, score: scoreOf(r.model, bm.id) }))
              .filter((x) => x.score)
              .sort((a, b) => b.score!.score - a.score!.score)
              .slice(0, 3)
            return (
              <div key={bm.id} className="rounded-[12px] border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <Link to="/{-$locale}/benchmarks/$slug/history" params={{ slug: bm.id }} className="text-[14px] font-medium hover:text-primary">
                    {bm.name}
                  </Link>
                  <span className="text-[11px] text-fg-3">{t('leaderboard.historyPage.topNow')}</span>
                </div>
                <ol className="mt-2 space-y-1 text-[13px] text-fg-2">
                  {top.map((x, i) => (
                    <li key={x.model.id} className="flex justify-between">
                      <span>{i + 1}. {x.model.displayName}</span>
                      <span className="tabular-nums">{x.score!.score}%</span>
                    </li>
                  ))}
                </ol>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-[18px] font-semibold">{t('leaderboard.historyPage.overwritten')}</h2>
        {overwritten.length === 0 ? (
          <p className="mt-3 rounded-[12px] border border-dashed border-border bg-bg-alt px-4 py-6 text-center text-[14px] text-fg-3">
            {t('leaderboard.history.overwrittenEmpty')}
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-[13px] text-fg-2">
            {overwritten.map((h, i) => (
              <li key={i}>{h.modelId} · {h.benchmark} · {h.supersededAt}</li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[12px] text-fg-3">
        {t('leaderboard.historyPage.source')}
      </p>
    </div>
  )
}
