import { useTranslation } from '@/features/i18n/provider'
import { BENCHMARKS } from '../benchmarks'
import { formatScore, scoreOf } from '../leaderboard'
import type { LeaderboardModel } from '../types'
import { buildSummary } from './CompareResult'

export interface CompareHeroProps {
  a: LeaderboardModel
  b: LeaderboardModel
}

/**
 * Technical comparison first screen: benchmark scores lead. Used for
 * flagship-vs-flagship pairs (claude vs gpt, gemini vs grok, …).
 */
export function CompareHeroTech({ a, b }: CompareHeroProps) {
  const { t } = useTranslation()
  const shared = BENCHMARKS.filter((bm) => scoreOf(a, bm.id) && scoreOf(b, bm.id)).slice(0, 6)

  return (
    <section className="border-b border-border bg-bg-alt/40 py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-5 md:px-7">
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {t('leaderboard.compare.techKicker')}
        </p>
        <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.02em] md:text-[44px]">
          {a.displayName} <span className="text-fg-3">{t('leaderboard.compare.vs')}</span> {b.displayName}
        </h1>
        <p className="mt-4 max-w-[640px] text-[16px] text-fg-2">{buildSummary(a, b)}</p>

        <div className="mt-8 space-y-3">
          {shared.map((bm) => {
            const sa = scoreOf(a, bm.id)!
            const sb = scoreOf(b, bm.id)!
            const max = Math.max(sa.score, sb.score) || 1
            const aLeads = sa.score >= sb.score
            return (
              <div key={bm.id} className="rounded-[10px] border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between text-[12px] text-fg-3">
                  <span>{bm.name}</span>
                  <span className="tabular-nums">
                    {formatScore(sa.score, sa.unit)} · {formatScore(sb.score, sb.unit)}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {[sa, sb].map((s, i) => (
                    <div key={i} className="h-1.5 w-full rounded-full bg-bg-alt">
                      <div
                        className={i === 0 ? 'h-full rounded-full bg-primary' : 'h-full rounded-full bg-fg-3'}
                        style={{ width: `${(s.score / max) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 text-[11px] text-fg-3">
                  {aLeads ? t('leaderboard.compare.leads', { model: a.displayName }) : t('leaderboard.compare.leads', { model: b.displayName })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
