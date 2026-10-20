import { useTranslation } from '@/features/i18n/provider'
import { CompareResult } from '@/features/leaderboard/components/CompareResult'
import type { LeaderboardModel } from '@/features/leaderboard/types'

/**
 * The benchmark block of a series page.
 *
 * It reuses the comparison matrix the `/compare` pages already ship, fed with
 * the versions of the line that have verifiable scores. A line where fewer
 * than two versions have scores renders an honest empty state instead of a
 * table with holes — and a version that has scores but no price row still
 * appears, because its score history is real.
 */
export function SeriesScoreMatrix({ models }: { models: LeaderboardModel[] }) {
  const { t } = useTranslation()

  if (models.length < 2) {
    return (
      <section className="rounded-[14px] border border-border bg-card p-5">
        <h3 className="text-[15px] font-semibold text-foreground">{t('series.scoresTitle')}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-fg-2">
          {t(models.length === 1 ? 'series.scoresSingle' : 'series.scoresEmpty')}
        </p>
      </section>
    )
  }

  const benchmarkCount = new Set(models.flatMap((model) => model.scores.map((s) => s.benchmark)))
    .size

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">{t('series.scoresTitle')}</h3>
        <p className="mt-1 text-[13px] text-fg-3">
          {t('series.scoresSubtitle')}{' '}
          <span className="text-fg-2">{t('series.scoreCount', { n: benchmarkCount })}</span>
        </p>
      </div>
      <CompareResult models={models} />
      <p className="text-[12px] text-fg-3">{t('series.scoresNote')}</p>
    </section>
  )
}
