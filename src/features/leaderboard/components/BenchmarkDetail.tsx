import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import type { Benchmark } from '../benchmarks'
import { formatScore, leaderboardRows, scoreOf } from '../leaderboard'
import {
  BOARD_LABEL_KEY,
  bestCategoryLabel,
  bestCategoriesUsingBenchmark,
  boardsUsingBenchmark,
} from '../board-links'

export function BenchmarkDetail({ benchmark }: { benchmark: Benchmark }) {
  const { t } = useTranslation()
  const ranked = leaderboardRows()
    .map((r) => ({ row: r, score: scoreOf(r.model, benchmark.id) }))
    .filter((x) => x.score)
    .sort((a, b) => (b.score!.score - a.score!.score))
  // The rankings that score on this benchmark: the capability boards and the
  // "best model for X" pages. Both are resolved from the registries, so a
  // link can never point at a board or a category that does not exist.
  const boards = boardsUsingBenchmark(benchmark.id)
  const categories = bestCategoriesUsingBenchmark(benchmark.id)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {t('leaderboard.benchmark.kicker')}
        </p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">{benchmark.name}</h1>
        <p className="mt-3 max-w-[680px] text-[16px] text-fg-2">{benchmark.description}</p>
        <Link
          to="/{-$locale}/benchmarks/$slug/history"
          params={{ slug: benchmark.id }}
          className="mt-4 inline-block text-[14px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {t('leaderboard.benchmark.historyLink')} →
        </Link>
      </div>

      <section>
        <h2 className="text-[18px] font-semibold">{t('leaderboard.benchmark.scores')}</h2>
        <div className="mt-3 overflow-hidden rounded-[12px] border border-border">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colRank')}</th>
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colModel')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('leaderboard.colScore')}</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((x, i) => (
                <tr key={x.row.model.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5 tabular-nums text-fg-3">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <Link to="/{-$locale}/models/$slug" params={{ slug: x.row.model.id }} className="text-fg-2 hover:text-primary">
                      {x.row.model.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                    {formatScore(x.score!.score, x.score!.unit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/*
        Where this benchmark counts.

        One benchmark is one column of one board. The page used to end at the
        score table, so a reader who arrived at "GPQA Diamond leaderboard"
        had no way to reach the rankings that use that score — and the two
        registries that know the answer (`boardsUsingBenchmark` and
        `bestCategoriesUsingBenchmark`) were written for exactly this and
        never called.
      */}
      {boards.length > 0 || categories.length > 0 ? (
        <section>
          <h2 className="text-[18px] font-semibold">
            {t('linking.benchmark.usedOnTitle', { name: benchmark.name })}
          </h2>
          <p className="mt-1 max-w-[720px] text-[13px] leading-relaxed text-fg-3">
            {t('linking.benchmark.usedOnNote')}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
            {boards.map((slug) => (
              <Link
                key={slug}
                to="/{-$locale}/leaderboard/$track"
                params={{ track: slug }}
                className="text-fg-2 hover:text-primary"
              >
                {t(BOARD_LABEL_KEY[slug])}
              </Link>
            ))}
            {categories.map((slug) => (
              <Link
                key={slug}
                to="/{-$locale}/best/$category"
                params={{ category: slug }}
                className="text-fg-2 hover:text-primary"
              >
                {bestCategoryLabel(t, slug)}
              </Link>
            ))}
            <Link to="/{-$locale}/benchmarks" className="text-fg-2 hover:text-primary">
              {t('linking.benchmark.hubLink')}
            </Link>
            <Link to="/{-$locale}/methodology" className="text-fg-2 hover:text-primary">
              {t('leaderboard.methodology.title')}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}
