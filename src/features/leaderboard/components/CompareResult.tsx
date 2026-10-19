import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { cn } from '@/lib/utils'
import { BENCHMARKS } from '../benchmarks'
import { blendedPricePer1M, findPrice, formatScore, scoreOf } from '../leaderboard'
import type { LeaderboardModel } from '../types'
import { PriceCell, formatPrice } from './PriceCell'

function winner(a: number | undefined, b: number | undefined): 'a' | 'b' | 'tie' {
  if (a == null && b == null) return 'tie'
  if (a == null) return 'b'
  if (b == null) return 'a'
  if (a === b) return 'tie'
  return a > b ? 'a' : 'b'
}

/** One-line verdict: who leads on shared benchmarks, who is cheaper. */
export function buildSummary(a: LeaderboardModel, b: LeaderboardModel): string {
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
      parts.push(`${a.displayName} and ${b.displayName} split the ${aWins + bWins} shared benchmarks`)
    } else {
      parts.push(
        aWins > bWins
          ? `${a.displayName} leads on ${aWins} of ${aWins + bWins} shared benchmarks`
          : `${b.displayName} leads on ${bWins} of ${aWins + bWins} shared benchmarks`,
      )
    }
  }
  if (pa != null && pb != null && pa !== pb) {
    const cheaper = pa < pb ? a : b
    const dearer = pa < pb ? pb : pa
    const cheaperVal = Math.min(pa, pb)
    const pct = Math.round(((dearer - cheaperVal) / dearer) * 100)
    parts.push(`${cheaper.displayName} is ~${pct}% cheaper per blended million tokens`)
  }
  if (parts.length === 0) {
    return `${a.displayName} and ${b.displayName} have no overlapping benchmarks or price difference to compare.`
  }
  return parts.join('; ') + '.'
}

export function CompareResult({ a, b }: { a: LeaderboardModel; b: LeaderboardModel }) {
  const { t } = useTranslation()
  const rows = BENCHMARKS.filter((bm) => scoreOf(a, bm.id) || scoreOf(b, bm.id))
  const priceA = findPrice(a)
  const priceB = findPrice(b)
  const blendedA = blendedPricePer1M(priceA)
  const blendedB = blendedPricePer1M(priceB)

  return (
    <div className="space-y-6">
      <p className="rounded-[12px] border border-border bg-soft px-4 py-3 text-[14px] text-fg-2">
        {buildSummary(a, b)}
      </p>

      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
              <th className="px-4 py-2.5 font-medium">{t('leaderboard.compare.dimension')}</th>
              <th className="px-4 py-2.5 font-medium">
                <Link to="/{-$locale}/models/$slug" params={{ slug: a.id }} className="hover:text-foreground">
                  {a.displayName}
                </Link>
              </th>
              <th className="px-4 py-2.5 font-medium">
                <Link to="/{-$locale}/models/$slug" params={{ slug: b.id }} className="hover:text-foreground">
                  {b.displayName}
                </Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((bm) => {
              const sa = scoreOf(a, bm.id)
              const sb = scoreOf(b, bm.id)
              const w = winner(sa?.score, sb?.score)
              return (
                <tr key={bm.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5 text-fg-2">{bm.name}</td>
                  <td className={cn('px-4 py-2.5 text-right tabular-nums', w === 'a' ? 'font-semibold text-foreground' : 'text-fg-2')}>
                    {sa ? formatScore(sa.score, sa.unit) : '—'}
                  </td>
                  <td className={cn('px-4 py-2.5 text-right tabular-nums', w === 'b' ? 'font-semibold text-foreground' : 'text-fg-2')}>
                    {sb ? formatScore(sb.score, sb.unit) : '—'}
                  </td>
                </tr>
              )
            })}

            {/* Price */}
            <tr className="border-b border-border/60 bg-bg-alt/40">
              <td className="px-4 py-2.5 font-medium text-fg-2">{t('leaderboard.compare.price')}</td>
              <td className={cn('px-4 py-2.5 text-right tabular-nums', blendedA != null && blendedB != null && blendedA < blendedB ? 'font-semibold text-foreground' : 'text-fg-2')}>
                {blendedA != null ? `${formatPrice(blendedA)} /1M` : '—'}
              </td>
              <td className={cn('px-4 py-2.5 text-right tabular-nums', blendedA != null && blendedB != null && blendedB < blendedA ? 'font-semibold text-foreground' : 'text-fg-2')}>
                {blendedB != null ? `${formatPrice(blendedB)} /1M` : '—'}
              </td>
            </tr>
            <tr className="border-b border-border/60">
              <td className="px-4 py-2.5 text-fg-3">{t('leaderboard.compare.fullPrice')}</td>
              <td className="px-4 py-2.5">
                <PriceCell priceId={a.priceId} view="compare" className="ml-auto max-w-[180px]" />
              </td>
              <td className="px-4 py-2.5">
                <PriceCell priceId={b.priceId} view="compare" className="ml-auto max-w-[180px]" />
              </td>
            </tr>

            {/* Context window */}
            <tr>
              <td className="px-4 py-2.5 text-fg-2">{t('leaderboard.compare.context')}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                {priceA ? `${(priceA.contextWindow / 1000).toLocaleString()}K` : '—'}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                {priceB ? `${(priceB.contextWindow / 1000).toLocaleString()}K` : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
        <PriceCell priceId={a.priceId} view="calculator" />
        <PriceCell priceId={b.priceId} view="calculator" />
      </div>
    </div>
  )
}
