import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { BENCHMARKS } from '../benchmarks'
import { availableScoreIds, MIN_COMPARE_MODELS } from '../compare-selection'
import { COMPARE_PAIR_ENTRIES, POPULAR_COMPARE_ENTRIES } from '../leaderboard'
import { TRACK_IDS } from '../scoring'
import { BOARD_LABEL_KEY } from '../board-links'
import { findLeaderboardModel } from '../models'
import type { LeaderboardModel } from '../types'
import { CompareResult } from './CompareResult'
import { CompareScoreSelector } from './CompareScoreSelector'
import { CompareSelector } from './CompareSelector'
import { CostQuickCalc } from './CostQuickCalc'

export function PopularComparisons({ exclude }: { exclude?: string }) {
  const { t } = useTranslation()
  const pairs = POPULAR_COMPARE_ENTRIES.filter((p) => p.slug !== exclude).slice(0, 12)
  return (
    <section>
      <h3 className="text-[15px] font-semibold text-foreground">{t('leaderboard.compare.popularTitle')}</h3>
      <div className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {pairs.map((p) => {
          const a = findLeaderboardModel(p.a)
          const b = findLeaderboardModel(p.b)
          if (!a || !b) return null
          return (
            <Link
              key={p.slug}
              to="/{-$locale}/compare/$pair"
              params={{ pair: p.slug }}
              className="truncate text-[13px] text-fg-2 hover:text-primary"
            >
              {a.displayName} vs {b.displayName}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/**
 * The directory of every published head-to-head.
 *
 * `PopularComparisons` shows a hand-picked twelve, which is right for a
 * "most compared" strip and wrong for a directory: the other twenty
 * comparison pages were reachable only from the model pages that mention
 * them. This lists them all, and each anchor names the two models it
 * compares.
 */
export function AllComparisons() {
  const { t } = useTranslation()
  return (
    <section className="border-t border-border pt-8">
      <h3 className="text-[15px] font-semibold text-foreground">
        {t('linking.compare.allTitle')}
      </h3>
      <p className="mt-1 max-w-[720px] text-[13px] leading-relaxed text-fg-3">
        {t('linking.compare.allNote')}
      </p>
      <div className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {COMPARE_PAIR_ENTRIES.map((p) => {
          const a = findLeaderboardModel(p.a)
          const b = findLeaderboardModel(p.b)
          if (!a || !b) return null
          return (
            <Link
              key={p.slug}
              to="/{-$locale}/compare/$pair"
              params={{ pair: p.slug }}
              className="truncate text-[13px] text-fg-2 hover:text-primary"
            >
              {a.displayName} vs {b.displayName}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/**
 * The capability boards, as a way out of the comparison tool.
 *
 * The tool compares models the reader already has in mind; the boards
 * answer the question that comes first — "which models are best at this?".
 */
export function CompareBoards() {
  const { t } = useTranslation()
  return (
    <section className="border-t border-border pt-8">
      <h3 className="text-[15px] font-semibold text-foreground">
        {t('linking.compare.boardsTitle')}
      </h3>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
        {TRACK_IDS.map((slug) => (
          <Link
            key={slug}
            to="/{-$locale}/leaderboard/$track"
            params={{ track: slug }}
            className="text-fg-2 hover:text-primary"
          >
            {t(BOARD_LABEL_KEY[slug])}
          </Link>
        ))}
        <Link to="/{-$locale}/benchmarks" className="text-fg-2 hover:text-primary">
          {t('linking.compare.benchmarksHub')}
        </Link>
      </div>
    </section>
  )
}

/** Interactive /compare body: selectors + result + cost calculator + links. */
export function CompareTool({
  models,
  scoreIds,
  onChange,
  onScoresChange,
}: {
  models: LeaderboardModel[]
  scoreIds: string[]
  onChange: (ids: string[]) => void
  onScoresChange: (ids: string[]) => void
}) {
  if (models.length < MIN_COMPARE_MODELS) return null

  const availableScores = availableScoreIds(models)
  const benchmarks = BENCHMARKS.filter((benchmark) => availableScores.includes(benchmark.id))

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <CompareSelector models={models} onChange={onChange} />
        <CompareScoreSelector
          benchmarks={benchmarks}
          selectedIds={scoreIds}
          onChange={onScoresChange}
        />
      </div>
      <CompareResult
        models={models}
        scoreIds={scoreIds}
        onRemoveScore={(id) => onScoresChange(scoreIds.filter((value) => value !== id))}
        onShowAllScores={() => onScoresChange(availableScores)}
      />
      <CostQuickCalc models={models} />
      <PopularComparisons />
    </div>
  )
}
