import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { categoryRows, getBenchmark, type BestCategory } from '../leaderboard'
import { PriceCell } from './PriceCell'

export function BestCategoryPage({ category }: { category: BestCategory }) {
  const { t } = useTranslation()
  const rows = categoryRows(category)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {t('leaderboard.best.kicker')}
        </p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] md:text-[42px]">
          {t(`leaderboard.best.${category.slug}.title`)}
        </h1>
        <p className="mt-3 max-w-[680px] text-[16px] text-fg-2">
          {t(`leaderboard.best.${category.slug}.intro`)}
        </p>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
              <th className="px-4 py-2.5 font-medium">{t('leaderboard.colRank')}</th>
              <th className="px-4 py-2.5 font-medium">{t('leaderboard.colModel')}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t('leaderboard.colAverage')}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t('leaderboard.colPrice')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.model.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2.5 tabular-nums text-fg-3">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <Link to="/{-$locale}/models/$slug" params={{ slug: r.model.id }} className="font-medium text-foreground hover:text-primary">
                    {r.model.displayName}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                  {r.average != null ? r.average.toFixed(1) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <PriceCell priceId={r.model.priceId} view="column" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] text-fg-3">
        {t('leaderboard.best.scoredOn')}:{' '}
        {category.benchmarkIds.map((id) => getBenchmark(id)?.name ?? id).join(', ')} ·{' '}
        <Link to="/{-$locale}" className="underline decoration-dotted underline-offset-2 hover:text-foreground">
          {t('leaderboard.best.fullBoard')}
        </Link>
      </p>
    </div>
  )
}
