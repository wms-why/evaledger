import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { BENCHMARKS } from '../benchmarks'
import { bestCategoryForTrack, bestCategoryLabel } from '../board-links'
import { fieldBestDetail, TRACKS, TRACK_IDS } from '../scoring'

/**
 * The methodology page — the whole of the site's arithmetic, in one place.
 *
 * This is what makes a leaderboard checkable: every board, its benchmarks,
 * their weights, and the field best each is normalized against. A reader can
 * recompute any composite by hand. Where the numbers were read from lives on
 * the data-quality page, next to the freshness of every row they cite.
 */
export function Methodology() {
  const { t } = useTranslation()

  return (
    <div className="space-y-12">
      <header>
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {t('leaderboard.methodology.title')}
        </p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] md:text-[42px]">
          {t('leaderboard.methodology.title')}
        </h1>
        <p className="mt-3 max-w-[720px] text-[16px] leading-relaxed text-fg-2">
          {t('leaderboard.methodology.intro')}
        </p>
      </header>

      <section className="rounded-[14px] border border-border bg-bg-alt/40 p-5">
        <h2 className="text-[18px] font-semibold">{t('leaderboard.methodology.why')}</h2>
        <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
          {t('leaderboard.methodology.whyBody')}
        </p>
      </section>

      <section>
        <h2 className="text-[18px] font-semibold">{t('leaderboard.methodology.boards')}</h2>
        <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
          {t('leaderboard.methodology.boardsNote')}
        </p>
        <div className="mt-4 space-y-4">
          {TRACK_IDS.map((slug) => {
            const track = TRACKS[slug]
            // The board's `/best/` twin — only when the category registry has
            // one. `general` has none and must not be given one.
            const bestCategory = bestCategoryForTrack(slug)
            return (
              <article key={slug} className="rounded-[14px] border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[16px] font-semibold">
                    <Link
                      to="/{-$locale}/leaderboard/$track"
                      params={{ track: slug }}
                      className="hover:text-primary"
                    >
                      {t(track.labelKey)}
                    </Link>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Link
                      to="/{-$locale}/leaderboard/$track"
                      params={{ track: slug }}
                      className="text-[13px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
                    >
                      {t('linking.board.full', { track: t(track.labelKey) })} →
                    </Link>
                    {bestCategory ? (
                      <Link
                        to="/{-$locale}/best/$category"
                        params={{ category: bestCategory }}
                        className="text-[13px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
                      >
                        {bestCategoryLabel(t, bestCategory)} →
                      </Link>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
                  {t(track.scopeKey)}
                </p>
                <p className="mt-2 max-w-[760px] text-[13px] leading-relaxed text-fg-3">
                  {t(track.formulaKey)}
                </p>
                <div className="mt-4 overflow-hidden rounded-[12px] border border-border">
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-bg-alt/40 text-left text-[12px] uppercase tracking-wide text-fg-3">
                        <th className="px-4 py-2 font-medium">
                          {t('leaderboard.methodology.benchmark')}
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          {t('leaderboard.methodology.weight')}
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          {t('leaderboard.methodology.best')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {track.core.map((core) => {
                        const benchmark = BENCHMARKS.find((b) => b.id === core.id)
                        const best = fieldBestDetail(core.id)
                        return (
                          <tr key={core.id} className="border-b border-border/60 last:border-0">
                            <td className="px-4 py-2">
                              <Link
                                to="/{-$locale}/benchmarks/$slug"
                                params={{ slug: core.id }}
                                className="text-foreground hover:text-primary"
                              >
                                {benchmark?.name ?? core.id}
                              </Link>
                              {benchmark?.version && (
                                <span className="ml-2 text-[11px] text-fg-3">
                                  {benchmark.version}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums text-fg-2">
                              {core.weight}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums text-fg-2">
                              {best ? best.best.toFixed(1) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-[18px] font-semibold">
          {t('leaderboard.track.normalizationTitle')}
        </h2>
        <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
          {t('leaderboard.track.normalizationNote')}
        </p>
      </section>

      <section>
        <h2 className="text-[18px] font-semibold">
          {t('leaderboard.methodology.updates')}
        </h2>
        <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
          {t('leaderboard.methodology.updatesNote')}
        </p>
        <div className="mt-3 flex flex-col items-start gap-1.5">
          <Link
            to="/{-$locale}/data-quality"
            hash="data-quality-sources"
            className="text-[14px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {t('linking.methodology.sourcesLink')} →
          </Link>
          <Link
            to="/{-$locale}/data-quality"
            className="text-[14px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {t('leaderboard.methodology.reportIssue')} →
          </Link>
        </div>
      </section>
    </div>
  )
}
