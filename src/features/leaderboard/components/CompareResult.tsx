import { Link } from '@tanstack/react-router'
import { Minus } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { priceDetail } from '@/features/calculator/pricing-detail'
import { cn } from '@/lib/utils'
import { BENCHMARKS } from '../benchmarks'
import { blendedPricePer1M, findPrice, formatScore, scoreOf } from '../leaderboard'
import type { BenchmarkScore, LeaderboardModel } from '../types'
import { PriceCell, formatPrice } from './PriceCell'

type TFn = (key: string, params?: Record<string, string | number>) => string

function winner(a: number | undefined, b: number | undefined): 'a' | 'b' | 'tie' {
  if (a == null && b == null) return 'tie'
  if (a == null) return 'b'
  if (b == null) return 'a'
  if (a === b) return 'tie'
  return a > b ? 'a' : 'b'
}

function sentence(parts: string[], t: TFn): string {
  if (parts.length === 0) return ''
  return parts.join(t('leaderboard.compare.summarySeparator')) + t('leaderboard.compare.summaryTerminator')
}

/** Two-model verdict, unchanged from the original compare page. */
function twoModelSummary(a: LeaderboardModel, b: LeaderboardModel, t: TFn): string {
  let aWins = 0
  let bWins = 0
  for (const bm of BENCHMARKS) {
    const sa = scoreOf(a, bm.id)
    const sb = scoreOf(b, bm.id)
    if (!sa || !sb) continue
    const w = winner(sa.score, sb.score)
    if (w === 'a') aWins++
    else if (w === 'b') bWins++
  }
  const pa = blendedPricePer1M(findPrice(a))
  const pb = blendedPricePer1M(findPrice(b))
  const parts: string[] = []
  if (aWins || bWins) {
    if (aWins === bWins) {
      parts.push(
        t('leaderboard.compare.summarySplit', {
          a: a.displayName,
          b: b.displayName,
          n: aWins + bWins,
        }),
      )
    } else {
      parts.push(
        t('leaderboard.compare.summaryLeads', {
          model: (aWins > bWins ? a : b).displayName,
          wins: Math.max(aWins, bWins),
          total: aWins + bWins,
        }),
      )
    }
  }
  if (pa != null && pb != null && pa !== pb) {
    const cheaper = pa < pb ? a : b
    const cheaperVal = Math.min(pa, pb)
    const pct = Math.round(((Math.max(pa, pb) - cheaperVal) / Math.max(pa, pb)) * 100)
    parts.push(t('leaderboard.compare.summaryCheaper', { model: cheaper.displayName, pct }))
  }
  if (parts.length === 0) {
    return sentence([t('leaderboard.compare.summaryNone', { a: a.displayName, b: b.displayName })], t)
  }
  return sentence(parts, t)
}

interface WinTally {
  model: LeaderboardModel
  wins: number
}

/** Three-plus-model verdict: who wins the most shared benchmarks, who is cheapest. */
function multiModelSummary(models: LeaderboardModel[], t: TFn): string {
  let total = 0
  const wins = new Map<string, number>()
  for (const bm of BENCHMARKS) {
    const scored = models
      .map((model) => ({ model, score: scoreOf(model, bm.id) }))
      .filter((entry): entry is { model: LeaderboardModel; score: BenchmarkScore } => !!entry.score)
    if (scored.length < 2) continue
    total++
    const best = Math.max(...scored.map((entry) => entry.score.score))
    const leaders = scored.filter((entry) => entry.score.score === best)
    if (leaders.length === 1) {
      const id = leaders[0].model.id
      wins.set(id, (wins.get(id) ?? 0) + 1)
    }
  }

  const parts: string[] = []
  if (total > 0) {
    const ranked: WinTally[] = models
      .map((model) => ({ model, wins: wins.get(model.id) ?? 0 }))
      .sort((a, b) => b.wins - a.wins)
    const topWins = ranked[0].wins
    if (topWins > 0) {
      const leaders = ranked.filter((entry) => entry.wins === topWins)
      parts.push(
        leaders.length === 1
          ? t('leaderboard.compare.summaryMultiLeads', {
              model: leaders[0].model.displayName,
              wins: topWins,
              total,
              count: models.length,
            })
          : t('leaderboard.compare.summaryMultiTie', {
              models: leaders.map((entry) => entry.model.displayName).join(' · '),
              wins: topWins,
              total,
            }),
      )
    }
  }

  const priced = models
    .map((model) => ({ model, blended: blendedPricePer1M(findPrice(model)) }))
    .filter((entry): entry is { model: LeaderboardModel; blended: number } => entry.blended != null)
    .sort((a, b) => a.blended - b.blended)
  if (priced.length >= 2 && priced[0].blended !== priced[priced.length - 1].blended) {
    const cheapest = priced[0]
    const dearer = priced[priced.length - 1]
    if (priced.filter((entry) => entry.blended === cheapest.blended).length === 1) {
      parts.push(
        t('leaderboard.compare.summaryCheapest', {
          model: cheapest.model.displayName,
          price: formatPrice(cheapest.blended),
          pct: Math.round(((dearer.blended - cheapest.blended) / dearer.blended) * 100),
          dearer: dearer.model.displayName,
        }),
      )
    }
  }

  if (parts.length === 0) return sentence([t('leaderboard.compare.summaryMultiNone')], t)
  return sentence(parts, t)
}

/** One-line verdict for any number of models. */
export function buildSummary(models: LeaderboardModel[], t: TFn): string {
  if (models.length === 2) return twoModelSummary(models[0], models[1], t)
  return multiModelSummary(models, t)
}

function uniqueMax(values: Array<number | undefined>): number | undefined {
  const present = values.filter((value): value is number => value != null)
  if (present.length === 0) return undefined
  const max = Math.max(...present)
  return present.filter((value) => value === max).length === 1 ? max : undefined
}

function uniqueMin(values: Array<number | undefined>): number | undefined {
  const present = values.filter((value): value is number => value != null)
  if (present.length === 0) return undefined
  const min = Math.min(...present)
  return present.filter((value) => value === min).length === 1 ? min : undefined
}

/**
 * The comparison matrix. Accepts two models (the `/compare/[pair]` SEO pages)
 * or up to five (the interactive `/compare` page); every extra model adds one
 * column and the table scrolls horizontally when it outgrows the container.
 *
 * On the interactive page `scoreIds` filters the benchmark rows and
 * `onRemoveScore` turns each row's leading gutter into a hover-remove control.
 * Pair pages pass neither, so they keep the full, static table.
 */
export function CompareResult({
  models,
  scoreIds,
  onRemoveScore,
  onShowAllScores,
}: {
  models: LeaderboardModel[]
  scoreIds?: string[]
  onRemoveScore?: (benchmarkId: string) => void
  onShowAllScores?: () => void
}) {
  const { t } = useTranslation()
  const availableRows = BENCHMARKS.filter((bm) => models.some((model) => scoreOf(model, bm.id)))
  const rows =
    scoreIds == null
      ? availableRows
      : availableRows.filter((benchmark) => scoreIds.includes(benchmark.id))
  const interactive = !!onRemoveScore
  const leadCell = interactive ? 'pl-9 pr-3' : 'px-4'
  const prices = models.map((model) => findPrice(model))
  const blended = prices.map((price) => blendedPricePer1M(price))
  const cheapest = uniqueMin(blended)
  const bestContext = uniqueMax(prices.map((price) => price?.contextWindow))
  const minWidth = Math.max(560, 200 + models.length * 150)

  return (
    <div className="space-y-6">
      <p className="rounded-[12px] border border-border bg-soft px-4 py-3 text-[14px] text-fg-2">
        {buildSummary(models, t)}
      </p>

      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full border-collapse text-[13px]" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
              <th
                className={cn(
                  'sticky left-0 z-10 border-r border-border/60 bg-card py-2.5 font-medium',
                  leadCell,
                )}
              >
                {t('leaderboard.compare.dimension')}
              </th>
              {models.map((model) => (
                <th key={model.id} className="px-4 py-2.5 text-right font-medium">
                  <Link
                    to="/{-$locale}/models/$slug"
                    params={{ slug: model.id }}
                    className="hover:text-foreground"
                  >
                    {model.displayName}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-b border-border/60">
                <td
                  colSpan={models.length + 1}
                  className="px-4 py-6 text-center text-[13px] text-fg-3"
                >
                  {t('leaderboard.compare.noScoresSelected')}
                  {onShowAllScores ? (
                    <button
                      type="button"
                      onClick={onShowAllScores}
                      className="ml-2 text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      {t('leaderboard.compare.showAllScores')}
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : null}
            {rows.map((bm) => {
              const scores = models.map((model) => scoreOf(model, bm.id))
              const best = uniqueMax(scores.map((score) => score?.score))
              return (
                <tr
                  key={bm.id}
                  className="group border-b border-border/60 transition-colors last:border-0 hover:bg-bg-alt"
                >
                  <td
                    className={cn(
                      'sticky left-0 z-10 border-r border-border/60 bg-card py-2.5 text-fg-2 transition-colors group-hover:bg-bg-alt',
                      leadCell,
                    )}
                  >
                    {onRemoveScore ? (
                      <button
                        type="button"
                        aria-label={t('leaderboard.compare.removeScore', { benchmark: bm.name })}
                        onClick={() => onRemoveScore(bm.id)}
                        className="absolute left-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-destructive/70 opacity-0 transition-opacity duration-150 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 group-hover:opacity-100"
                      >
                        <Minus size={13} strokeWidth={2.5} aria-hidden />
                      </button>
                    ) : null}
                    {bm.name ? (
                      <Link
                        to="/{-$locale}/benchmarks/$slug"
                        params={{ slug: bm.id }}
                        className="hover:text-primary"
                      >
                        {bm.name}
                      </Link>
                    ) : null}
                  </td>
                  {scores.map((score, index) => (
                    <td
                      key={models[index].id}
                      className={cn(
                        'px-4 py-2.5 text-right tabular-nums',
                        score && best != null && score.score === best
                          ? 'font-semibold text-foreground'
                          : 'text-fg-2',
                      )}
                    >
                      {score ? formatScore(score.score, score.unit) : '—'}
                    </td>
                  ))}
                </tr>
              )
            })}

            {/* Price */}
            <tr className="border-b border-border/60 bg-bg-alt">
              <td
                className={cn(
                  'sticky left-0 z-10 border-r border-border/60 bg-bg-alt py-2.5 font-medium text-fg-2',
                  leadCell,
                )}
              >
                {t('leaderboard.compare.price')}
              </td>
              {blended.map((value, index) => (
                <td
                  key={models[index].id}
                  className={cn(
                    'px-4 py-2.5 text-right tabular-nums',
                    value != null && cheapest != null && value === cheapest
                      ? 'font-semibold text-foreground'
                      : 'text-fg-2',
                  )}
                >
                  {value != null ? `${formatPrice(value)} /1M` : '—'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border/60 bg-bg-alt">
              <td
                className={cn(
                  'sticky left-0 z-10 border-r border-border/60 bg-bg-alt py-2.5 text-fg-3',
                  leadCell,
                )}
              >
                <span className="block text-[13px]">{t('leaderboard.compare.fullPrice')}</span>
                <span className="mt-0.5 block text-[11px]">
                  {t('leaderboard.compare.input')} · {t('leaderboard.compare.output')} ·{' '}
                  {t('leaderboard.compare.cached')}
                </span>
              </td>
              {prices.map((price, index) => (
                <td
                  key={models[index].id}
                  className="whitespace-nowrap px-4 py-2.5 text-right text-[12px] tabular-nums text-fg-2"
                >
                  {price
                    ? (() => {
                        // The rate IN FORCE, not the registry's base rate — a
                        // promotional band must not be quoted as the standing
                        // price. Same resolution the calculator charges with.
                        const detail = priceDetail(price)
                        return [
                          formatPrice(detail.input),
                          formatPrice(detail.output),
                          detail.cached != null ? formatPrice(detail.cached) : '—',
                        ].join(' · ')
                      })()
                    : '—'}
                </td>
              ))}
            </tr>

            {/* Context window */}
            <tr>
              <td
                className={cn(
                  'sticky left-0 z-10 border-r border-border/60 bg-card py-2.5 text-fg-2',
                  leadCell,
                )}
              >
                {t('leaderboard.compare.context')}
              </td>
              {prices.map((price, index) => (
                <td
                  key={models[index].id}
                  className={cn(
                    'px-4 py-2.5 text-right tabular-nums',
                    price && bestContext != null && price.contextWindow === bestContext
                      ? 'font-semibold text-foreground'
                      : 'text-fg-2',
                  )}
                >
                  {price ? `${(price.contextWindow / 1000).toLocaleString()}K` : '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
        {models.map((model) => (
          <PriceCell
            key={model.id}
            priceId={model.priceId}
            view="calculator"
            label={t('leaderboard.compare.runUsageFor', { model: model.displayName })}
          />
        ))}
      </div>
    </div>
  )
}
