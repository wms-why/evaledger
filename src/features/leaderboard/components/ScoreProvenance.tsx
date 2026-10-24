import { useTranslation } from '@/features/i18n/provider'
import { Link } from '@tanstack/react-router'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BENCHMARKS, benchmarkVersionSuffix } from '../benchmarks'
import { sourceInfo } from '../sources'
import type { BenchmarkScore } from '../types'

/**
 * A score with its full provenance.
 *
 * A benchmark number on its own is not evidence — a reader cannot tell
 * whether it came from the vendor's own harness, an independent evaluation,
 * or our reference table, nor when it was measured, nor under what test
 * conditions. This popover answers all of that, and it is attached to the
 * number itself so the evidence is one click away rather than on a
 * separate page.
 */
export function ScoreProvenance({
  score,
  children,
}: {
  score: BenchmarkScore
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const benchmark = BENCHMARKS.find((b) => b.id === score.benchmark)
  const versionSuffix = benchmark ? benchmarkVersionSuffix(benchmark) : null
  const source = sourceInfo(score.sourceUrl)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-help underline decoration-dotted decoration-fg-3 underline-offset-2 hover:decoration-primary"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] space-y-2.5 text-[12px] leading-relaxed">
        <div>
          <p className="font-medium text-foreground">
            {benchmark?.name ?? score.benchmark}
            {versionSuffix && (
              <span className="ml-1.5 text-fg-3">
                {t('leaderboard.track.version')} {versionSuffix}
              </span>
            )}
          </p>
        </div>

        {source && (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-fg-3">
              {t('leaderboard.track.sourceTitle')}
            </p>
            <p className="text-fg-2">
              {source.kind === 'vendor'
                ? t('leaderboard.track.sourceVendor')
                : source.kind === 'third-party'
                  ? t('leaderboard.track.sourceThirdParty')
                  : t('leaderboard.track.sourceReference')}
            </p>
            {score.sourceUrl && (
              <a
                href={score.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-fg-3 underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                {source.name} ↗
              </a>
            )}
          </div>
        )}

        {score.observedAt && (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-fg-3">
              {t('leaderboard.track.observedAt')}
            </p>
            <p className="text-fg-2">{score.observedAt.slice(0, 10)}</p>
          </div>
        )}

        {score.note && (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-fg-3">
              {t('leaderboard.track.testConfig')}
            </p>
            <p className="text-fg-2">{score.note}</p>
          </div>
        )}

        {benchmark && (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-fg-3">
              {t('leaderboard.track.sampleConditions')}
            </p>
            <p className="text-fg-2">{benchmark.description}</p>
            <Link
              to="/{-$locale}/benchmarks/$slug"
              params={{ slug: benchmark.id }}
              className="text-fg-3 underline decoration-dotted underline-offset-2 hover:text-primary"
            >
              {benchmark.name} ↗
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
