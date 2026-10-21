import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { Badge } from '@/components/ui/badge'
import { BENCHMARKS } from '../benchmarks'
import { LEADERBOARD } from '../models'
import { sourceInfo } from '../sources'
import { fieldBestDetail, TRACKS, TRACK_IDS } from '../scoring'

/**
 * The methodology page — the whole of the site's arithmetic, in one place.
 *
 * This is what makes a leaderboard checkable: every board, its benchmarks,
 * their weights, the field best each is normalized against, and where the
 * scores came from. A reader can recompute any composite by hand.
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
            return (
              <article key={slug} className="rounded-[14px] border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[16px] font-semibold">{t(track.labelKey)}</h3>
                  <Link
                    to="/{-$locale}/leaderboard/$track"
                    params={{ track: slug }}
                    className="text-[13px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
                  >
                    {t('leaderboard.track.compareAll')} →
                  </Link>
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
                              {benchmark?.name ?? core.id}
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
          {t('leaderboard.methodology.sources')}
        </h2>
        <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
          {t('leaderboard.methodology.sourcesNote')}
        </p>
        <div className="mt-4 overflow-hidden rounded-[14px] border border-border bg-card">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
                <th className="px-4 py-2.5 font-medium">
                  {t('leaderboard.methodology.source')}
                </th>
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.track.sourceTitle')}</th>
                <th className="px-4 py-2.5 text-right font-medium">
                  {t('leaderboard.colObserved')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sourceRows().map((row) => (
                <tr key={row.url} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground underline decoration-dotted underline-offset-2 hover:text-primary"
                    >
                      {row.name}
                    </a>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="free">
                      {row.kind === 'vendor'
                        ? t('leaderboard.track.sourceVendor')
                        : row.kind === 'third-party'
                          ? t('leaderboard.track.sourceThirdParty')
                          : t('leaderboard.track.sourceReference')}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-3">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-[18px] font-semibold">
          {t('leaderboard.methodology.updates')}
        </h2>
        <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
          {t('leaderboard.methodology.updatesNote')}
        </p>
        <Link
          to="/{-$locale}/data-quality"
          className="mt-3 inline-block text-[14px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {t('leaderboard.methodology.reportIssue')} →
        </Link>
      </section>
    </div>
  )
}

/** One row per distinct source URL, with how many scores cite it. */
function sourceRows() {
  const counts = new Map<string, { name: string; kind: string; count: number }>()
  for (const model of LEADERBOARD.models) {
    for (const score of model.scores) {
      const url = score.sourceUrl
      if (!url) continue
      const info = sourceInfo(url)
      const existing = counts.get(url)
      if (existing) {
        existing.count += 1
        continue
      }
      counts.set(url, { name: info?.name ?? url, kind: info?.kind ?? 'reference-table', count: 1 })
    }
  }
  return [...counts.entries()]
    .map(([url, row]) => ({ url, ...row }))
    .sort((a, b) => b.count - a.count)
}
