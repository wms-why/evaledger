import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { cn } from '@/lib/utils'
import { BENCHMARKS } from '../benchmarks'
import {
  computeCustomRanking,
  DEFAULT_CUSTOM_PRICE_WEIGHT,
  DEFAULT_CUSTOM_WEIGHTS,
  PRICE_AXIS,
  type CustomUnrankedRow,
  type CustomWeights,
} from '../custom-weights'
import { formatScore } from '../leaderboard'
import { LEADERBOARD } from '../models'
import {
  rankTrack,
  scoreAgainstCore,
  TRACKS,
  TRACK_IDS,
  type ScoreTrack,
  type TrackSlug,
} from '../scoring'
import { VENDOR_LABEL_KEY } from '../vendors'
import { PriceCell } from './PriceCell'
import { ScoreProvenance } from './ScoreProvenance'

/** The translator the i18n provider hands out. */
type Translate = (key: string, params?: Record<string, string | number>) => string

/**
 * The leaderboard board.
 *
 * The old table averaged each model's score over whatever benchmarks it
 * happened to have, so a model measured on three easy tests could outrank
 * one measured on seven hard ones — the denominators were different and
 * nobody could tell. This board fixes that three ways:
 *
 *  1. **A track selector.** Each board scores on its own benchmarks, with
 *     its own weights, and the composite is only published for a model
 *     measured on all of them. The rest are marked "not tested" and sit
 *     below the ranking — never averaged over a partial set, never zero.
 *  2. **Per-benchmark normalization.** A raw 90% on one test and a raw 90%
 *     on another are not the same achievement, so each score is shown
 *     against the best result anyone has published on that benchmark.
 *  3. **Custom weights.** A user who cares about coding and price can
 *     weight those two and re-rank the board themselves.
 */
export function LeaderboardBoard() {
  const [track, setTrack] = useState<TrackSlug>('general')
  const [custom, setCustom] = useState(false)

  const current = TRACKS[track]

  return (
    <div className="space-y-4">
      <BoardSelector
        track={track}
        onTrack={(next) => {
          setTrack(next)
          setCustom(false)
        }}
        custom={custom}
        onCustom={() => setCustom((v) => !v)}
      />

      {custom ? (
        <CustomWeightsBoard />
      ) : (
        <TrackTable track={current} />
      )}
    </div>
  )
}

/** The board switcher: the four capability boards, plus custom weights. */
function BoardSelector({
  track,
  onTrack,
  custom,
  onCustom,
}: {
  track: TrackSlug
  onTrack: (slug: TrackSlug) => void
  custom: boolean
  onCustom: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12px] uppercase tracking-wide text-fg-3">
        {t('leaderboard.track.pick')}
      </span>
      {TRACK_IDS.map((slug) => {
        const active = !custom && track === slug
        return (
          <button
            key={slug}
            type="button"
            onClick={() => onTrack(slug)}
            aria-pressed={active}
            className={cn(
              'rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-soft text-primary'
                : 'bg-bg-alt text-fg-2 hover:bg-bg-inset hover:text-foreground',
            )}
          >
            {t(TRACKS[slug].labelKey)}
          </button>
        )
      })}
      <button
        type="button"
        onClick={onCustom}
        aria-pressed={custom}
        className={cn(
          'rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
          custom
            ? 'bg-soft text-primary'
            : 'bg-bg-alt text-fg-2 hover:bg-bg-inset hover:text-foreground',
        )}
      >
        {t('leaderboard.custom.title')}
      </button>
    </div>
  )
}

/** The ranked board of one track. */
function TrackTable({ track }: { track: ScoreTrack }) {
  const { t } = useTranslation()
  const { ranked, incomplete } = useMemo(() => rankTrack(track), [track])

  return (
    <div className="space-y-3">
      <p className="max-w-[760px] text-[13px] leading-relaxed text-fg-3">
        {t(track.formulaKey)}{' '}
        <Link
          to="/{-$locale}/leaderboard/$track"
          params={{ track: track.slug }}
          className="text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {t('leaderboard.track.compareAll')} →
        </Link>
      </p>

      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full min-w-[720px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide">
              <th className="px-3 py-2 font-medium text-fg-3">{t('leaderboard.colRank')}</th>
              <th className="px-3 py-2 font-medium text-fg-3">{t('leaderboard.colModel')}</th>
              {track.core.map((core) => (
                <th key={core.id} className="px-3 py-2 text-right font-medium text-fg-3">
                  {BENCHMARKS.find((b) => b.id === core.id)?.name ?? core.id}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium text-fg-3">
                {t('leaderboard.track.composite')}
              </th>
              <th className="px-3 py-2 text-right font-medium text-fg-3">
                {t('leaderboard.colPrice')}
              </th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((entry, index) => (
              <RankedRow key={entry.model.id} entry={entry} rank={index + 1} track={track} />
            ))}
            {incomplete.map((entry) => (
              <UnrankedRow key={entry.model.id} entry={entry} track={track} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] text-fg-3">
        {t('leaderboard.track.rankedModels', { n: ranked.length })} ·{' '}
        {t('leaderboard.track.unrankedModels', { n: incomplete.length })}
      </p>
    </div>
  )
}

/** A ranked model: its raw score on each core benchmark, then the composite. */
function RankedRow({
  entry,
  rank,
  track,
}: {
  entry: { model: (typeof LEADERBOARD.models)[number]; score: ReturnType<typeof scoreAgainstCore> }
  rank: number
  track: ScoreTrack
}) {
  const { t } = useTranslation()
  const { model, score } = entry

  return (
    <tr className="border-b border-border/60 last:border-0 hover:bg-bg-alt">
      <td className="px-3 py-2.5 tabular-nums text-fg-3">{rank}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-2 shrink-0 rounded-full"
            style={{ background: VENDOR_DOT[model.vendor] }}
            aria-hidden
          />
          <Link
            to="/{-$locale}/models/$slug"
            params={{ slug: model.id }}
            className="font-medium text-foreground hover:text-primary"
          >
            {model.displayName}
          </Link>
          <span className="text-[11px] text-fg-3">{t(VENDOR_LABEL_KEY[model.vendor])}</span>
        </div>
      </td>
      {track.core.map((core) => {
        const raw = model.scores.find((s) => s.benchmark === core.id)
        return (
          <td key={core.id} className="px-3 py-2.5 text-right tabular-nums text-fg-2">
            {raw ? (
              <ScoreProvenance score={raw}>{formatScore(raw.score, raw.unit)}</ScoreProvenance>
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
 * A model that was not measured on every core benchmark.
 *
 * It stays visible — dropping it would hide a model the user is looking for
 * — but it carries no composite, because a partial average is not
 * comparable. The missing benchmarks are named.
 */
function UnrankedRow({
  entry,
  track,
}: {
  entry: { model: (typeof LEADERBOARD.models)[number]; score: ReturnType<typeof scoreAgainstCore> }
  track: ScoreTrack
}) {
  const { t } = useTranslation()
  const { model, score } = entry

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-3 py-2.5 text-fg-3">—</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-2 shrink-0 rounded-full opacity-40"
            style={{ background: VENDOR_DOT[model.vendor] }}
            aria-hidden
          />
          <Link
            to="/{-$locale}/models/$slug"
            params={{ slug: model.id }}
            className="text-fg-2 hover:text-primary"
          >
            {model.displayName}
          </Link>
          <span
            className="text-[11px] text-fg-3"
            title={t('leaderboard.track.untestedHint')}
          >
            {t('leaderboard.track.untested')}
          </span>
        </div>
      </td>
      {track.core.map((core) => {
        const raw = model.scores.find((s) => s.benchmark === core.id)
        return (
          <td key={core.id} className="px-3 py-2.5 text-right tabular-nums text-fg-3">
            {raw ? (
              <span className="text-fg-2">{formatScore(raw.score, raw.unit)}</span>
            ) : (
              <span className="text-fg-3">—</span>
            )}
          </td>
        )
      })}
      <td
        className="px-3 py-2.5 text-right text-fg-3"
        title={t('leaderboard.track.notRankedReason', {
          benchmarks: score.missing
            .map((id) => BENCHMARKS.find((b) => b.id === id)?.name ?? id)
            .join(', '),
        })}
      >
        {t('leaderboard.track.untested')}
      </td>
      <td className="px-3 py-2.5 text-right">
        <PriceCell priceId={model.priceId} view="column" />
      </td>
    </tr>
  )
}

/**
 * The custom-weight board.
 *
 * The user says what matters — how much coding versus price, say — and the
 * board re-ranks itself. A model that was not measured on every weighted
 * board cannot be scored on it, so it is **not ranked**: it is listed
 * separately, with the boards it is missing named, exactly like a "not
 * tested" model on a capability board.
 *
 * Every ranked model is divided by the SAME denominator — the total weight
 * of the active axes — so no model is ever averaged over a smaller set of
 * boards than its neighbour. The arithmetic lives in `../custom-weights`,
 * which is pure and pinned by the node test pool.
 */
function CustomWeightsBoard() {
  const { t } = useTranslation()
  const [weights, setWeights] = useState<CustomWeights>(DEFAULT_CUSTOM_WEIGHTS)
  const [priceWeight, setPriceWeight] = useState(DEFAULT_CUSTOM_PRICE_WEIGHT)

  const ranking = useMemo(
    () => computeCustomRanking(weights, priceWeight),
    [weights, priceWeight],
  )

  const setWeight = (slug: TrackSlug, value: number) =>
    setWeights((prev) => ({ ...prev, [slug]: value }))

  return (
    <div className="space-y-4">
      <p className="max-w-[760px] text-[13px] leading-relaxed text-fg-2">
        {t('leaderboard.custom.intro')}
      </p>

      <div className="grid gap-3 rounded-[14px] border border-border bg-bg-alt/40 p-4 sm:grid-cols-2 lg:grid-cols-5">
        {TRACK_IDS.map((slug) => (
          <label key={slug} className="block">
            <span className="flex items-baseline justify-between text-[12px] text-fg-2">
              {t(TRACKS[slug].labelKey)}
              <span className="tabular-nums text-fg-3">{weights[slug]}</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={weights[slug]}
              onChange={(e) => setWeight(slug, Number(e.target.value))}
              className="mt-1 w-full accent-[var(--primary)]"
              aria-label={t(TRACKS[slug].labelKey)}
            />
          </label>
        ))}
        <label className="block">
          <span className="flex items-baseline justify-between text-[12px] text-fg-2">
            {t('leaderboard.custom.price')}
            <span className="tabular-nums text-fg-3">{priceWeight}</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={priceWeight}
            onChange={(e) => setPriceWeight(Number(e.target.value))}
            className="mt-1 w-full accent-[var(--primary)]"
            aria-label={t('leaderboard.custom.price')}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
              <th className="px-3 py-2 font-medium">{t('leaderboard.colRank')}</th>
              <th className="px-3 py-2 font-medium">{t('leaderboard.colModel')}</th>
              <th className="px-3 py-2 text-right font-medium">
                {t('leaderboard.custom.score')}
              </th>
              <th className="px-3 py-2 text-right font-medium">{t('leaderboard.colPrice')}</th>
            </tr>
          </thead>
          <tbody>
            {ranking.ranked.map((row, index) => (
              <tr
                key={row.model.id}
                className="border-b border-border/60 last:border-0 hover:bg-bg-alt"
              >
                <td className="px-3 py-2.5 tabular-nums text-fg-3">{index + 1}</td>
                <td className="px-3 py-2.5">
                  <Link
                    to="/{-$locale}/models/$slug"
                    params={{ slug: row.model.id }}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {row.model.displayName}
                  </Link>
                </td>
                <td
                  className="px-3 py-2.5 text-right font-semibold tabular-nums text-foreground"
                  title={breakdown(t, row)}
                >
                  {row.score.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <PriceCell priceId={row.model.priceId} view="column" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ranking.unranked.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[14px] font-semibold">{t('leaderboard.custom.notRanked')}</h3>
          <p className="max-w-[760px] text-[12px] leading-relaxed text-fg-3">
            {t('leaderboard.track.untestedHint')}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ranking.unranked.map((row) => (
              <li
                key={row.model.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-border bg-bg-alt/40 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/{-$locale}/models/$slug"
                    params={{ slug: row.model.id }}
                    className="text-[14px] font-medium hover:text-primary"
                  >
                    {row.model.displayName}
                  </Link>
                  <span
                    className="text-[11px] text-fg-3"
                    title={t('leaderboard.track.untestedHint')}
                  >
                    {t('leaderboard.track.untested')}
                  </span>
                </div>
                <span className="text-[12px] text-fg-3">{missingReason(t, row)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[12px] text-fg-3">
        {t('leaderboard.track.rankedModels', { n: ranking.ranked.length })} ·{' '}
        {t('leaderboard.track.unrankedModels', { n: ranking.unranked.length })}
      </p>

      <p className="text-[12px] text-fg-3">
        {t('leaderboard.custom.note')}{' '}
        <Link
          to="/{-$locale}/methodology"
          className="text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {t('leaderboard.methodology.title')} →
        </Link>
      </p>
    </div>
  )
}

/**
 * The per-axis breakdown of a score, as the score cell's tooltip.
 *
 * Every ranked row is the SAME arithmetic — each axis value times its
 * weight, over one shared denominator — so the breakdown is what lets a
 * reader check the number instead of taking it on trust.
 */
function breakdown(
  t: Translate,
  row: { parts: readonly { axis: string; weight: number; value: number }[] },
): string {
  return row.parts
    .map((part) => {
      const label =
        part.axis === PRICE_AXIS
          ? t('leaderboard.custom.priceAxis')
          : t(TRACKS[part.axis as TrackSlug].labelKey)
      return `${label} ${part.value.toFixed(1)} × ${part.weight}`
    })
    .join(' · ')
}

/**
 * Why a model is not ranked: the boards it was never measured on, named.
 *
 * A price is not a score, so a model missing only the price axis says so
 * instead of borrowing the benchmark wording.
 */
function missingReason(t: Translate, row: CustomUnrankedRow): string {
  const tracks = row.missing.filter((axis) => axis !== PRICE_AXIS) as TrackSlug[]
  const reasons: string[] = []

  if (tracks.length === 1) {
    reasons.push(
      t('leaderboard.track.notRankedReasonOne', {
        benchmark: t(TRACKS[tracks[0]!].labelKey),
      }),
    )
  } else if (tracks.length > 1) {
    reasons.push(
      t('leaderboard.track.notRankedReason', {
        benchmarks: tracks.map((slug) => t(TRACKS[slug].labelKey)).join(', '),
      }),
    )
  }

  if (row.missing.includes(PRICE_AXIS)) {
    reasons.push(t('leaderboard.custom.noPrice'))
  }

  return reasons.join(' · ')
}

/** The vendor dot colors, matching the old table. */
const VENDOR_DOT: Record<string, string> = {
  claude: '#D97757',
  openai: '#10A37F',
  google: '#4285F4',
  grok: '#111111',
  deepseek: '#4D6BFE',
  minimax: '#E5484D',
  stepfun: '#1B3ED2',
  glm: '#3B4CCA',
  kimi: '#7C3AED',
}
