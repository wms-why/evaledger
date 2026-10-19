import { useTranslation } from '@/features/i18n/provider'
import { cn } from '@/lib/utils'
import { blendedPricePer1M, findPrice } from '../leaderboard'
import { formatPrice } from './PriceCell'
import type { CompareHeroProps } from './CompareHeroTech'

const OPEN_WEIGHTS = new Set(['deepseek', 'glm', 'kimi'])

function mark(value: boolean): string {
  return value ? '✓' : '—'
}

/**
 * Ecosystem/capability first screen: product capability matrix leads. Used for
 * cross-vendor pairs where the choice is about ecosystem, not raw score.
 */
export function CompareHeroEcosystem({ a, b }: CompareHeroProps) {
  const { t } = useTranslation()
  const pa = findPrice(a)
  const pb = findPrice(b)
  const ba = blendedPricePer1M(pa)
  const bb = blendedPricePer1M(pb)

  const rows: Array<{ label: string; a: string; b: string; highlight?: 'a' | 'b' }> = [
    {
      label: t('leaderboard.compare.context'),
      a: pa ? `${(pa.contextWindow / 1000).toLocaleString()}K` : '—',
      b: pb ? `${(pb.contextWindow / 1000).toLocaleString()}K` : '—',
      highlight: pa && pb && pa.contextWindow !== pb.contextWindow ? (pa.contextWindow > pb.contextWindow ? 'a' : 'b') : undefined,
    },
    {
      label: t('leaderboard.compare.openWeights'),
      a: mark(OPEN_WEIGHTS.has(a.vendor)),
      b: mark(OPEN_WEIGHTS.has(b.vendor)),
    },
    {
      label: t('leaderboard.compare.coverage'),
      a: String(a.scores.length),
      b: String(b.scores.length),
      highlight: a.scores.length === b.scores.length ? undefined : a.scores.length > b.scores.length ? 'a' : 'b',
    },
    {
      label: t('leaderboard.compare.blended'),
      a: ba != null ? formatPrice(ba) : '—',
      b: bb != null ? formatPrice(bb) : '—',
      highlight: ba != null && bb != null && ba !== bb ? (ba < bb ? 'a' : 'b') : undefined,
    },
  ]

  return (
    <section className="border-b border-border bg-bg-alt/40 py-14 md:py-20">
      <div className="mx-auto max-w-4xl px-5 md:px-7">
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {t('leaderboard.compare.ecosystemKicker')}
        </p>
        <h1 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.02em] md:text-[40px]">
          {a.displayName} <span className="text-fg-3">{t('leaderboard.compare.vs')}</span> {b.displayName}: {t('leaderboard.compare.ecosystemTitle')}
        </h1>

        <div className="mt-8 grid grid-cols-[1.2fr_1fr_1fr] overflow-hidden rounded-[14px] border border-border bg-card text-[14px]">
          <div className="border-b border-border px-4 py-3 text-[12px] uppercase tracking-wide text-fg-3" />
          <div className="border-b border-l border-border px-4 py-3 font-medium text-foreground">{a.displayName}</div>
          <div className="border-b border-l border-border px-4 py-3 font-medium text-foreground">{b.displayName}</div>
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <div className="border-b border-border px-4 py-3 text-fg-3">{r.label}</div>
              <div className={cn('border-b border-l border-border px-4 py-3 text-center tabular-nums', r.highlight === 'a' ? 'font-semibold text-foreground' : 'text-fg-2')}>
                {r.a}
              </div>
              <div className={cn('border-b border-l border-border px-4 py-3 text-center tabular-nums', r.highlight === 'b' ? 'font-semibold text-foreground' : 'text-fg-2')}>
                {r.b}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 max-w-[640px] text-[14px] text-fg-2">{t('leaderboard.compare.ecosystemNote')}</p>
      </div>
    </section>
  )
}
