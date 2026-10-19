import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { BENCHMARKS } from '../benchmarks'
import { COMPARE_PAIR_ENTRIES, formatScore, scoreOf } from '../leaderboard'
import { findLeaderboardModel } from '../models'
import type { LeaderboardModel } from '../types'
import { PriceCell } from './PriceCell'

const VENDOR_LABEL_KEY: Record<LeaderboardModel['vendor'], string> = {
  claude: 'leaderboard.vendorClaude',
  openai: 'leaderboard.vendorOpenai',
  google: 'leaderboard.vendorGoogle',
  grok: 'leaderboard.vendorGrok',
  deepseek: 'leaderboard.vendorDeepseek',
  glm: 'leaderboard.vendorGlm',
  kimi: 'leaderboard.vendorKimi',
}

export function ModelProfile({ model }: { model: LeaderboardModel }) {
  const { t } = useTranslation()
  const scored = BENCHMARKS.filter((bm) => scoreOf(model, bm.id))
  const related = COMPARE_PAIR_ENTRIES.filter((p) => p.a === model.id || p.b === model.id).slice(0, 6)

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-fg-3">
            <span>{t(VENDOR_LABEL_KEY[model.vendor])}</span>
            <span>·</span>
            <span>{model.kind}</span>
            <span>·</span>
            <span>{model.version}</span>
          </div>
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">{model.displayName}</h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-fg-3">
            {model.releaseDate && <span>{t('leaderboard.model.released')}: {model.releaseDate}</span>}
            {model.updatedAt && <span>{t('leaderboard.model.updated')}: {model.updatedAt.slice(0, 10)}</span>}
          </div>
        </div>
        <PriceCell priceId={model.priceId} view="calculator" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="text-[18px] font-semibold">{t('leaderboard.model.scores')}</h2>
          {scored.length === 0 ? (
            <p className="mt-3 text-[14px] text-fg-3">{t('leaderboard.model.noScores')}</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-[12px] border border-border">
              <table className="w-full border-collapse text-[13px]">
                <tbody>
                  {scored.map((bm) => {
                    const s = scoreOf(model, bm.id)!
                    return (
                      <tr key={bm.id} className="border-border even:bg-bg-alt/40 [&:not(:first-child)]:border-t">
                        <td className="px-4 py-2.5">
                          <Link to="/{-$locale}/benchmarks/$slug" params={{ slug: bm.id }} className="text-fg-2 hover:text-primary">
                            {bm.name}
                          </Link>
                          {s.note && <span className="ml-2 text-[11px] text-fg-3">({s.note})</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                          {formatScore(s.score, s.unit)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section>
            <h2 className="text-[18px] font-semibold">{t('leaderboard.model.pricing')}</h2>
            <div className="mt-3 rounded-[12px] border border-border bg-card p-4">
              <PriceCell priceId={model.priceId} view="card" />
              <Link
                to="/{-$locale}/token-calculator"
                search={{ model: model.priceId }}
                className="mt-3 inline-block text-[13px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                {t('leaderboard.model.runUsage')} →
              </Link>
            </div>
          </section>

          {related.length > 0 && (
            <section>
              <h2 className="text-[18px] font-semibold">{t('leaderboard.model.related')}</h2>
              <div className="mt-3 flex flex-col gap-1.5">
                {related.map((p) => {
                  const ma = findLeaderboardModel(p.a)
                  const mb = findLeaderboardModel(p.b)
                  return (
                    <Link
                      key={p.slug}
                      to="/{-$locale}/compare/$pair"
                      params={{ pair: p.slug }}
                      className="text-[13px] text-fg-2 hover:text-primary"
                    >
                      {ma?.displayName ?? p.a} vs {mb?.displayName ?? p.b}
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
