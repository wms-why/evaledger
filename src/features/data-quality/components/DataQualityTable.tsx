import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/features/i18n/provider'
import { TRACKS } from '@/features/leaderboard/scoring'
import { sourceInfo } from '@/features/leaderboard/sources'
import { VENDOR_LABEL_KEY } from '@/features/leaderboard/vendors'
import type { Channel, Freshness, ModelQuality, QualityChange, SourceKind } from '../types'

/**
 * The per-model data-quality table.
 *
 * One row per model: how fresh its price is and where that price came from
 * (the vendor's own list or a router's quote), when its scores were measured
 * and which pages they were read from, what changed against the previous
 * version of its line, and which benchmark tracks it covers completely.
 */

const FRESHNESS_VARIANT: Record<Freshness, 'ok' | 'warn' | 'free'> = {
  fresh: 'ok',
  stale: 'warn',
  unknown: 'free',
}

const FRESHNESS_KEY: Record<Freshness, string> = {
  fresh: 'dataQuality.fresh',
  stale: 'dataQuality.stale',
  unknown: 'dataQuality.unknown',
}

const FRESHNESS_HINT_KEY: Record<Freshness, string> = {
  fresh: 'dataQuality.freshHint',
  stale: 'dataQuality.staleHint',
  unknown: 'dataQuality.unknownHint',
}

/**
 * The score verdict uses its own words: a price is *verified* against a
 * page, a score is *measured* by a harness. Same three verdicts, one
 * vocabulary per side of the table.
 */
const SCORE_FRESHNESS_KEY: Record<Freshness, string> = {
  fresh: 'dataQuality.scoreFresh',
  stale: 'dataQuality.scoreStale',
  unknown: 'dataQuality.scoreUnknown',
}

const SCORE_FRESHNESS_HINT_KEY: Record<Freshness, string> = {
  fresh: 'dataQuality.scoreFreshHint',
  stale: 'dataQuality.scoreStaleHint',
  unknown: 'dataQuality.scoreUnknownHint',
}

/** Where a price came from — the vendor's own list or a router's quote. */
const CHANNEL_KEY: Record<Channel, string> = {
  official: 'leaderboard.price.channelOfficial',
  aggregator: 'leaderboard.price.channelAggregator',
}

/**
 * The source-kind taxonomy, labelled with the words the summary tiles use —
 * one vocabulary for the whole page.
 */
const KIND_LABEL_KEY: Record<SourceKind, string> = {
  vendor: 'dataQuality.summary.vendorReportedScores',
  'third-party': 'dataQuality.summary.thirdPartyScores',
  'reference-table': 'dataQuality.summary.referenceTableScores',
}

const KIND_ORDER: SourceKind[] = ['vendor', 'third-party', 'reference-table']

function changeKey(change: QualityChange): string {
  if (change.field === 'price') {
    if (change.direction === 'up') return 'dataQuality.changes.priceUp'
    if (change.direction === 'down') return 'dataQuality.changes.priceDown'
    return 'dataQuality.changes.same'
  }
  if (change.direction === 'up') return 'dataQuality.changes.scoreUp'
  if (change.direction === 'down') return 'dataQuality.changes.scoreDown'
  return 'dataQuality.changes.same'
}

function ChangeIcon({ direction }: { direction: QualityChange['direction'] }) {
  if (direction === 'up') return <ArrowUp size={12} />
  if (direction === 'down') return <ArrowDown size={12} />
  return <Minus size={12} />
}

function PriceCell({ model }: { model: ModelQuality }) {
  const { t } = useTranslation()
  if (!model.price) {
    return <span className="text-fg-3">—</span>
  }
  const price = model.price
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge
        variant={FRESHNESS_VARIANT[price.freshness]}
        title={t(FRESHNESS_HINT_KEY[price.freshness])}
      >
        {t(FRESHNESS_KEY[price.freshness])}
      </Badge>
      {/* Where the number comes from: the vendor's own price list or a
          router's quote. A reader must never mistake one for the other. */}
      <Badge variant="free" title={t('leaderboard.price.channel')}>
        {t(CHANNEL_KEY[price.channel])}
      </Badge>
      <span className="text-[11px] tabular-nums text-fg-3">{price.lastVerified}</span>
      <a
        href={price.sourceUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="max-w-[22ch] truncate text-[11px] text-fg-3 underline decoration-dotted underline-offset-2 hover:text-primary"
      >
        {price.sourceUrl}
      </a>
    </div>
  )
}

/** The date part of an observation timestamp (`2026-10-19T21:26+08:00`). */
function observedDate(value: string | undefined): string | undefined {
  return value ? value.slice(0, 10) : undefined
}

function ScoresCell({ model }: { model: ModelQuality }) {
  const { t } = useTranslation()
  const scores = model.scores
  const oldest = observedDate(scores.oldestObservedAt)
  const latest = observedDate(scores.latestObservedAt)
  // One date when every score was measured on the same day, a range when the
  // set was assembled over several.
  const measured =
    oldest && latest ? (oldest === latest ? oldest : `${oldest} → ${latest}`) : (oldest ?? latest)
  return (
    <div className="flex flex-col items-start gap-1">
      {/* The column heading already says "Scores" — the number is the
          coverage, the badges below are where each score came from. */}
      <span className="text-[12px] tabular-nums text-fg-2">{scores.benchmarkCount}</span>
      <div className="flex flex-wrap gap-1">
        {KIND_ORDER.filter((kind) => scores.byKind[kind] > 0).map((kind) => (
          <Badge key={kind} variant="free">
            {t(KIND_LABEL_KEY[kind])} {scores.byKind[kind]}
          </Badge>
        ))}
      </div>
      {/* When the scores were measured — the last time we checked the source. */}
      <Badge
        variant={FRESHNESS_VARIANT[scores.freshness]}
        title={t(SCORE_FRESHNESS_HINT_KEY[scores.freshness])}
      >
        {t(SCORE_FRESHNESS_KEY[scores.freshness])}
      </Badge>
      {measured && (
        <span className="text-[11px] tabular-nums text-fg-3">
          {t('leaderboard.track.observedAt')} {measured}
        </span>
      )}
      {/* The pages the scores were read from — the price side links to its
          source too, so the two sides of the table are symmetric. */}
      <ul className="flex flex-col gap-0.5">
        {scores.sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              title={source.url}
              className="block max-w-[26ch] truncate text-[11px] text-fg-3 underline decoration-dotted underline-offset-2 hover:text-primary"
            >
              {sourceInfo(source.url)?.name ?? source.url} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChangesCell({ model }: { model: ModelQuality }) {
  const { t } = useTranslation()
  if (model.changes.length === 0) {
    return <span className="text-[12px] text-fg-3">{t('dataQuality.changes.none')}</span>
  }
  return (
    <ul className="flex flex-col gap-1">
      {model.changes.map((change, i) => (
        <li key={`${change.field}-${change.label}-${i}`} className="text-[12px] text-fg-2">
          <span className="inline-flex items-center gap-1">
            <ChangeIcon direction={change.direction} />
            <span className="font-medium text-foreground">{change.label}</span>
          </span>
          <span className="mx-1.5 text-fg-3">—</span>
          <span>{t(changeKey(change))}</span>
          <span className="ml-1.5 tabular-nums">{change.detail}</span>
        </li>
      ))}
    </ul>
  )
}

/** The track's own label, when the scoring registry knows one. */
function trackLabel(trackId: string): string {
  const registry = TRACKS as unknown as Record<string, { labelKey?: string } | undefined>
  return registry[trackId]?.labelKey ?? trackId
}

function TracksCell({ model }: { model: ModelQuality }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-start gap-1">
      {model.completeTracks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] text-fg-3">{t('dataQuality.tracks.complete')}</span>
          {model.completeTracks.map((track) => (
            <Badge key={track} variant="ok">
              {t(trackLabel(track))}
            </Badge>
          ))}
        </div>
      )}
      {model.missingTracks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] text-fg-3">{t('dataQuality.tracks.missing')}</span>
          {model.missingTracks.map((track) => (
            <Badge key={track} variant="free">
              {t(trackLabel(track))}
            </Badge>
          ))}
        </div>
      )}
      {model.completeTracks.length === 0 && model.missingTracks.length === 0 && (
        <span className="text-fg-3">—</span>
      )}
    </div>
  )
}

export function DataQualityTable({ rows }: { rows: ModelQuality[] }) {
  const { t } = useTranslation()
  return (
    <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
      <table className="w-full min-w-205 border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
            <th className="px-3 py-2 font-medium">{t('dataQuality.col.model')}</th>
            <th className="px-3 py-2 font-medium">{t('dataQuality.col.price')}</th>
            <th className="px-3 py-2 font-medium">{t('dataQuality.col.scores')}</th>
            <th className="px-3 py-2 font-medium">{t('dataQuality.col.changes')}</th>
            <th className="px-3 py-2 font-medium">{t('dataQuality.col.tracks')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((model) => (
            <tr key={model.modelId} className="border-b border-border/60 last:border-0 hover:bg-bg-alt">
              <td className="px-3 py-2.5 align-top">
                <Link
                  to="/{-$locale}/models/$slug"
                  params={{ slug: model.modelId }}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {model.displayName}
                </Link>
                <div className="text-[11px] text-fg-3">{t(VENDOR_LABEL_KEY[model.vendor])}</div>
              </td>
              <td className="px-3 py-2.5 align-top">
                <PriceCell model={model} />
              </td>
              <td className="px-3 py-2.5 align-top">
                <ScoresCell model={model} />
              </td>
              <td className="px-3 py-2.5 align-top">
                <ChangesCell model={model} />
              </td>
              <td className="px-3 py-2.5 align-top">
                <TracksCell model={model} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
