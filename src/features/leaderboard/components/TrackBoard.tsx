import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useTranslation } from '@/features/i18n/provider'
import { Badge } from '@/components/ui/badge'
import { BENCHMARKS, benchmarkVersionSuffix } from '../benchmarks'
import { bestCategoryForTrack, bestCategoryLabel } from '../board-links'
import { findPrice } from '../leaderboard'
import { LEADERBOARD } from '../models'
import { sourceInfo } from '../sources'
import {
  fieldBestDetail,
  rankTrack,
  type ScoreTrack,
  type TrackEntry,
} from '../scoring'
import { PriceCell } from './PriceCell'
import { ScoreProvenance } from './ScoreProvenance'

/**
 * One capability board — the page that makes the arithmetic visible.
 *
 * A board is not just a ranking: it states which benchmarks count, what
 * weight each carries, what the score is normalized against, and which
 * models were left unranked because they were never measured on all of
 * them. A reader can check every number and see exactly why a model sits
 * where it does.
 */
export function TrackBoard({ track }: { track: ScoreTrack }) {
  const { t } = useTranslation()
  const { ranked, incomplete } = rankTrack(track)
  const label = t(track.labelKey)
  // The board's `/best/` twin — only when the category registry has one.
  const bestCategory = bestCategoryForTrack(track.slug)

  return (
    <div className="space-y-10">
      <header>
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {t('leaderboard.track.nav')}
        </p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] md:text-[42px]">
          {t('leaderboard.track.title', { track: label })}
        </h1>
        <p className="mt-3 max-w-[720px] text-[16px] leading-relaxed text-fg-2">
          {t(track.scopeKey)}
        </p>
        <p className="mt-3 max-w-[720px] text-[14px] leading-relaxed text-fg-3">
          {t('leaderboard.track.intro')}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
          {bestCategory ? (
            <Link
              to="/{-$locale}/best/$category"
              params={{ category: bestCategory }}
              className="font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              {bestCategoryLabel(t, bestCategory)} →
            </Link>
          ) : null}
          <Link
            to="/{-$locale}/benchmarks"
            className="font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {t('linking.benchmark.hubLink')} →
          </Link>
        </div>
      </header>

      <FormulaPanel track={track} />

      <section>
        <h2 className="text-[18px] font-semibold">
          {t('leaderboard.track.rankTitle', { n: ranked.length })}
        </h2>
        {ranked.length === 0 ? (
          <p className="mt-3 rounded-[12px] border border-dashed border-border bg-bg-alt px-4 py-6 text-center text-[14px] text-fg-3">
            {t('leaderboard.track.noRankedModels')}
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-[14px] border border-border bg-card">
            <table className="w-full min-w-[680px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
                  <th className="px-3 py-2 font-medium">{t('leaderboard.colRank')}</th>
                  <th className="px-3 py-2 font-medium">{t('leaderboard.colModel')}</th>
                  {track.core.map((core) => {
                    const benchmark = BENCHMARKS.find((b) => b.id === core.id)
                    return (
                      <th key={core.id} className="px-3 py-2 text-right font-medium">
                        <Link
                          to="/{-$locale}/benchmarks/$slug"
                          params={{ slug: core.id }}
                          className="hover:text-foreground"
                        >
                          {benchmark?.name ?? core.id}
                        </Link>
                      </th>
                    )
                  })}
                  <th className="px-3 py-2 text-right font-medium">
                    {t('leaderboard.track.composite')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('leaderboard.colPrice')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((entry, index) => (
                  <RankedRow key={entry.model.id} entry={entry} rank={index + 1} track={track} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {incomplete.length > 0 && (
        <section>
          <h2 className="text-[18px] font-semibold">{t('leaderboard.track.notRanked')}</h2>
          <p className="mt-2 max-w-[720px] text-[14px] leading-relaxed text-fg-2">
            {t('leaderboard.track.untestedHint')}
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {incomplete.map((entry) => (
              <li
                key={entry.model.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-border bg-bg-alt/40 px-4 py-3"
              >
                <Link
                  to="/{-$locale}/models/$slug"
                  params={{ slug: entry.model.id }}
                  className="text-[14px] font-medium hover:text-primary"
                >
                  {entry.model.displayName}
                </Link>
                <span className="text-[12px] text-fg-3">
                  {sentenceWithBenchmarkLinks(t, entry.score.missing)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-[18px] font-semibold">{t('leaderboard.track.sourceTitle')}</h2>
        <p className="mt-2 max-w-[720px] text-[14px] leading-relaxed text-fg-2">
          {t('leaderboard.track.sourceNote')}
        </p>
        <SourceLegend />
      </section>
    </div>
  )
}

/** One ranked row: the raw score on each core benchmark, then the composite. */
function RankedRow({
  entry,
  rank,
  track,
}: {
  entry: TrackEntry
  rank: number
  track: ScoreTrack
}) {
  const { t } = useTranslation()
  const { model, score } = entry

  return (
    <tr className="border-b border-border/60 last:border-0 hover:bg-bg-alt">
      <td className="px-3 py-2.5 tabular-nums text-fg-3">{rank}</td>
      <td className="px-3 py-2.5">
        <Link
          to="/{-$locale}/models/$slug"
          params={{ slug: model.id }}
          className="font-medium text-foreground hover:text-primary"
        >
          {model.displayName}
        </Link>
      </td>
      {track.core.map((core) => {
        const raw = model.scores.find((s) => s.benchmark === core.id)
        return (
          <td key={core.id} className="px-3 py-2.5 text-right tabular-nums text-fg-2">
            {raw ? (
              <ScoreProvenance score={raw}>{formatRaw(raw.score, raw.unit)}</ScoreProvenance>
            ) : (
              <span className="text-fg-3">{t('leaderboard.track.untested')}</span>
            )}
          </td>
        )
      })}
      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-foreground">
        {score.composite != null ? score.composite.toFixed(1) : '—'}
      </td>
      <td className="px-3 py-2.5 text-right">
        <PriceCell priceId={model.priceId} view="column" />
      </td>
    </tr>
  )
}

/**
 * The formula panel — the core of the trust story.
 *
 * It prints the exact arithmetic: which benchmarks count, what weight each
 * carries, and the field best each one is normalized against. A reader can
 * recompute the composite by hand and get the same number.
 */
function FormulaPanel({ track }: { track: ScoreTrack }) {
  const { t } = useTranslation()

  return (
    <section className="rounded-[14px] border border-border bg-bg-alt/40 p-5">
      <h2 className="text-[16px] font-semibold">{t('leaderboard.track.formulaTitle')}</h2>
      <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
        {t(track.formulaKey)}
      </p>

      <div className="mt-4 overflow-hidden rounded-[12px] border border-border bg-card">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
              <th className="px-4 py-2.5 font-medium">{t('leaderboard.methodology.benchmark')}</th>
              <th className="px-4 py-2.5 text-right font-medium">
                {t('leaderboard.methodology.weight')}
              </th>
              <th className="px-4 py-2.5 text-right font-medium">
                {t('leaderboard.methodology.best')}
              </th>
              <th className="px-4 py-2.5 font-medium">{t('leaderboard.methodology.source')}</th>
            </tr>
          </thead>
          <tbody>
            {track.core.map((core) => {
              const benchmark = BENCHMARKS.find((b) => b.id === core.id)
              const versionSuffix = benchmark ? benchmarkVersionSuffix(benchmark) : null
              const best = fieldBestDetail(core.id)
              return (
                <tr key={core.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5">
                    <Link
                      to="/{-$locale}/benchmarks/$slug"
                      params={{ slug: core.id }}
                      className="text-foreground hover:text-primary"
                    >
                      {benchmark?.name ?? core.id}
                    </Link>
                    {versionSuffix && (
                      <span className="ml-2 text-[11px] text-fg-3">
                        {t('leaderboard.track.version')} {versionSuffix}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                    {core.weight}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                    {best ? (
                      <span title={best.modelName}>
                        {best.best.toFixed(1)}
                        {best.modelName && (
                          <span className="ml-1 text-[11px] text-fg-3">
                            {t('leaderboard.track.fieldBestHeldBy', { model: best.modelName })}
                          </span>
                        )}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-fg-3">{benchmark?.description}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 max-w-[760px] text-[13px] leading-relaxed text-fg-3">
        {t('leaderboard.track.normalizationNote')}
      </p>

      {track.context.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] font-medium text-fg-2">
            {t('leaderboard.track.contextTitle')}
          </p>
          <p className="mt-1 text-[13px] text-fg-3">{t('leaderboard.track.contextNote')}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {track.context.map((id) => (
              <li key={id}>
                <Badge variant="free">
                  <Link
                    to="/{-$locale}/benchmarks/$slug"
                    params={{ slug: id }}
                    className="hover:text-primary"
                  >
                    {BENCHMARKS.find((b) => b.id === id)?.name ?? id}
                  </Link>
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/**
 * Where the scores come from, grouped by who measured them.
 *
 * A vendor-reported score and an independent evaluation are not the same
 * measurement, so the site says which is which rather than presenting them
 * as interchangeable.
 */
function SourceLegend() {
  const { t } = useTranslation()

  const kinds = [
    { kind: 'vendor' as const, labelKey: 'leaderboard.track.sourceVendor' },
    { kind: 'third-party' as const, labelKey: 'leaderboard.track.sourceThirdParty' },
    { kind: 'reference-table' as const, labelKey: 'leaderboard.track.sourceReference' },
  ]

  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-3">
      {kinds.map(({ kind, labelKey }) => {
        const count = LEADERBOARD.models.reduce((sum, model) => {
          return (
            sum +
            model.scores.filter((score) => {
              const info = sourceInfo(score.sourceUrl)
              return info?.kind === kind
            }).length
          )
        }, 0)
        return (
          <li key={kind} className="rounded-[12px] border border-border bg-card px-4 py-3">
            <p className="text-[13px] font-medium">{t(labelKey)}</p>
            <p className="mt-1 text-[20px] font-semibold tabular-nums text-foreground">{count}</p>
            <p className="text-[12px] text-fg-3">{t('leaderboard.track.sourceNote')}</p>
          </li>
        )
      })}
    </ul>
  )
}

/** A raw score in the benchmark's own unit. */
function formatRaw(score: number, unit: string): string {
  if (unit === 'rating' || unit === 'elo') return String(Math.round(score))
  return `${score}%`
}

/**
 * A sentinel that cannot occur in a dictionary string, used to put the
 * benchmark names back into a translated sentence as links.
 */
const LINK_SENTINEL = '\u0001'

/**
 * The reason a model is not ranked, with every benchmark it is missing linked
 * to that benchmark's own page.
 *
 * The dictionary templates the sentence around a `{benchmarks}` placeholder,
 * so the names are put back as links by splitting the translated string on a
 * sentinel: the sentence keeps its grammar in every language, and every
 * benchmark name it names becomes a link instead of dead text.
 */
function sentenceWithBenchmarkLinks(
  t: (key: string, params?: Record<string, string | number>) => string,
  missingIds: string[],
): ReactNode {
  const parts = t('leaderboard.track.notRankedReason', {
    benchmarks: LINK_SENTINEL,
  }).split(LINK_SENTINEL)
  const before = parts[0] ?? ''
  const after = parts.slice(1).join('')

  return (
    <>
      {before}
      {missingIds.map((id, index) => (
        <span key={id}>
          {index > 0 ? ', ' : ''}
          <Link
            to="/{-$locale}/benchmarks/$slug"
            params={{ slug: id }}
            className="hover:text-primary"
          >
            {BENCHMARKS.find((b) => b.id === id)?.name ?? id}
          </Link>
        </span>
      ))}
      {after}
    </>
  )
}

/** The price a model is sold at, if it has one. */
export function modelPrice(modelId: string) {
  const model = LEADERBOARD.models.find((m) => m.id === modelId)
  return model?.priceId ? findPrice(model) : undefined
}
