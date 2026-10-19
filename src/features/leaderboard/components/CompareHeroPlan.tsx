import { useTranslation } from '@/features/i18n/provider'
import { cn } from '@/lib/utils'
import { blendedPricePer1M, findPrice } from '../leaderboard'
import { formatPrice } from './PriceCell'
import type { CompareHeroProps } from './CompareHeroTech'

/**
 * Plan/pricing first screen: price and limits lead, plus a "who should pick
 * which" split. Used for the cheap-vs-dear pairs that map to buying intent.
 */
export function CompareHeroPlan({ a, b }: CompareHeroProps) {
  const { t } = useTranslation()
  const pa = findPrice(a)
  const pb = findPrice(b)
  const ba = blendedPricePer1M(pa)
  const bb = blendedPricePer1M(pb)

  const rows: Array<{ label: string; a?: string; b?: string }> = [
    { label: t('leaderboard.compare.input'), a: pa ? formatPrice(pa.inputPricePer1M) : undefined, b: pb ? formatPrice(pb.inputPricePer1M) : undefined },
    { label: t('leaderboard.compare.output'), a: pa ? formatPrice(pa.outputPricePer1M) : undefined, b: pb ? formatPrice(pb.outputPricePer1M) : undefined },
    {
      label: t('leaderboard.compare.cached'),
      a: pa?.cachedInputPricePer1M != null ? formatPrice(pa.cachedInputPricePer1M) : undefined,
      b: pb?.cachedInputPricePer1M != null ? formatPrice(pb.cachedInputPricePer1M) : undefined,
    },
    {
      label: t('leaderboard.compare.context'),
      a: pa ? `${(pa.contextWindow / 1000).toLocaleString()}K` : undefined,
      b: pb ? `${(pb.contextWindow / 1000).toLocaleString()}K` : undefined,
    },
    { label: t('leaderboard.compare.blended'), a: ba != null ? formatPrice(ba) : undefined, b: bb != null ? formatPrice(bb) : undefined },
  ]

  const cheaper = ba != null && bb != null ? (ba < bb ? a : b) : undefined

  return (
    <section className="border-b border-border py-14 md:py-20">
      <div className="mx-auto max-w-4xl px-5 md:px-7">
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {t('leaderboard.compare.planKicker')}
        </p>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.02em] md:text-[40px]">
          {a.displayName} <span className="text-fg-3">{t('leaderboard.compare.vs')}</span> {b.displayName}: {t('leaderboard.compare.whichToBuy')}
        </h1>

        <div className="mt-8 overflow-hidden rounded-[14px] border border-border bg-card">
          <table className="w-full border-collapse text-[14px]">
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label} className={cn('border-border', i > 0 && 'border-t')}>
                  <td className="px-4 py-3 text-fg-3">{r.label}</td>
                  <td className={cn('px-4 py-3 text-right tabular-nums', ba != null && bb != null && ba < bb ? 'font-semibold text-foreground' : 'text-fg-2')}>
                    {r.a ?? '—'}
                  </td>
                  <td className={cn('px-4 py-3 text-right tabular-nums', ba != null && bb != null && bb < ba ? 'font-semibold text-foreground' : 'text-fg-2')}>
                    {r.b ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-right text-[12px] text-fg-3">
          {cheaper ? t('leaderboard.compare.cheaperNote', { model: cheaper.displayName }) : ''}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[a, b].map((m, i) => (
            <div key={m.id} className="rounded-[12px] border border-border bg-bg-alt px-5 py-4">
              <div className="text-[13px] font-semibold uppercase tracking-wide text-fg-3">
                {t('leaderboard.compare.pickIf', { n: i + 1 })}
              </div>
              <div className="mt-1 text-[15px] font-medium text-foreground">{m.displayName}</div>
              <p className="mt-2 text-[13px] text-fg-2">
                {i === 0 ? t('leaderboard.compare.pickReasonA') : t('leaderboard.compare.pickReasonB')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
