import { useTranslation } from '@/features/i18n/provider'
import { formatPrice } from '@/features/leaderboard/components/PriceCell'
import type { SeriesRow, SeriesScoreDelta, SeriesVerdict } from '../data'
import { pairVerdict } from '../data'

type TFn = (key: string, params?: Record<string, string | number>) => string

/**
 * The "short version" block — what a reader should take away from the ladder
 * before they look at a single number.
 *
 * Every sentence is derived from the registries at render time. When the data
 * cannot support a sentence (no shared score, no price on either side), the
 * sentence is dropped rather than softened.
 */
/** One sentence of the verdict block. */
interface VerdictLine {
  text: string
  /** The caveat the source printed with the number, when there is one. */
  note?: string
}

/**
 * The sentences both verdict blocks share: what the newer version costs
 * against the older one, and what it scores against it.
 */
function buildVerdictLines(
  t: TFn,
  newer: SeriesRow,
  older: SeriesRow,
  outputChange: number | undefined,
  scoreDeltas: SeriesScoreDelta[],
): VerdictLine[] {
  const lines: VerdictLine[] = []

  if (outputChange != null) {
    const pct = Math.abs(Math.round(outputChange * 100))
    if (outputChange < 0) {
      lines.push({
        text: t('series.verdictCheaper', { newer: newer.displayName, pct, older: older.displayName }),
      })
    } else if (outputChange > 0) {
      lines.push({
        text: t('series.verdictPricier', { newer: newer.displayName, pct, older: older.displayName }),
      })
    } else {
      lines.push({
        text: t('series.verdictSamePrice', { a: newer.displayName, b: older.displayName }),
      })
    }
  }

  const meaningful = scoreDeltas.filter((delta) => delta.delta !== 0)
  if (meaningful.length > 0) {
    const top = [...meaningful].sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))[0]
    lines.push({
      text:
        top.delta > 0
          ? t('series.verdictScoreHigher', {
              newer: newer.displayName,
              points: Math.abs(Math.round(top.delta)),
              benchmark: top.benchmarkName,
              older: older.displayName,
            })
          : t('series.verdictScoreLower', {
              newer: newer.displayName,
              points: Math.abs(Math.round(top.delta)),
              benchmark: top.benchmarkName,
              older: older.displayName,
            }),
      note: top.note,
    })
  }

  return lines
}

function VerdictBlock({ lines }: { lines: VerdictLine[] }) {
  const { t } = useTranslation()
  if (lines.length === 0) return null
  return (
    <section className="rounded-[14px] border border-border bg-card p-5">
      <h2 className="text-[15px] font-semibold text-foreground">{t('series.verdictTitle')}</h2>
      <ul className="mt-3 space-y-2">
        {lines.map((line, index) => (
          <li key={index} className="flex gap-2 text-[14px] leading-relaxed text-fg-2">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span title={line.note}>
              {line.text}
              {line.note ? <span className="text-fg-3"> — {line.note}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SeriesVerdict({ verdict }: { verdict: SeriesVerdict }) {
  const { t } = useTranslation()
  const {
    newest,
    oldest,
    outputChange,
    scoreDeltas,
    scorePair,
    cheapest,
    best,
    legacyCount,
    memberCount,
  } = verdict

  // The score claim compares the two most recent versions we have scores for,
  // not the two ends of the line — the oldest end usually has no scores.
  const scoreNewer = scorePair?.[0]
  const scoreOlder = scorePair?.[1]

  const lines: VerdictLine[] = scoreNewer && scoreOlder
    ? buildVerdictLines(t, scoreNewer, scoreOlder, undefined, scoreDeltas)
    : []
  if (scoreNewer && scoreOlder) {
    // The price claim is about the line as a whole: newest vs oldest.
    const priceLines = buildVerdictLines(t, newest, oldest, outputChange, [])
    lines.unshift(...priceLines)
  } else if (outputChange != null) {
    lines.unshift(...buildVerdictLines(t, newest, oldest, outputChange, []))
  }

  if (cheapest && cheapest.blendedPricePer1M != null && verdict.pricedCount > 1) {
    lines.push({
      text: t('series.verdictCheapest', {
        model: cheapest.displayName,
        price: formatPrice(cheapest.blendedPricePer1M),
      }),
    })
  }

  if (best && verdict.scoredCount > 1) {
    lines.push({
      text: t('series.verdictBest', { model: best.row.displayName, avg: Math.round(best.average) }),
    })
  }

  if (legacyCount > 0) {
    lines.push({ text: t('series.verdictLegacy', { n: legacyCount, total: memberCount }) })
  }

  return <VerdictBlock lines={lines} />
}

/**
 * The pair verdict — the same shape as the line verdict, but for two
 * versions of one line.
 */
export function SeriesPairVerdict({ a, b }: { a: SeriesRow; b: SeriesRow }) {
  const { t } = useTranslation()
  const verdict = pairVerdict(a, b)
  const { newer, older, outputChange, scoreDeltas } = verdict

  const lines = buildVerdictLines(t, newer, older, outputChange, scoreDeltas)
  if (scoreDeltas.length === 0 && newer.scoreId && older.scoreId) {
    lines.push({ text: t('series.verdictNoScores') })
  }

  return <VerdictBlock lines={lines} />
}
