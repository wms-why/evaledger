import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { formatScore } from '@/features/leaderboard/leaderboard'
import { cn } from '@/lib/utils'
import {
  releaseCostEstimate,
  releaseOffPeakEstimate,
  releasePriceRows,
  releaseScoreTable,
  type ReleasePriceRow,
} from '../data'
import type { ReleaseMeta, ReleaseVendor } from '../types'
import { formatReleasePrice } from '@/features/releases/format'

const VENDOR_LABEL_KEY: Record<ReleaseVendor, string> = {
  openai: 'leaderboard.vendorOpenai',
  anthropic: 'leaderboard.vendorClaude',
  google: 'leaderboard.vendorGoogle',
  grok: 'leaderboard.vendorGrok',
  deepseek: 'leaderboard.vendorDeepseek',
  minimax: 'leaderboard.vendorMinimax',
  glm: 'leaderboard.vendorGlm',
  kimi: 'leaderboard.vendorKimi',
}

export function releaseVendorLabel(t: (key: string) => string, vendor: ReleaseVendor): string {
  return t(VENDOR_LABEL_KEY[vendor])
}

const STATUS_LABEL_KEY: Record<ReleasePriceRow['status'], string> = {
  active: 'releases.statusActive',
  delisted: 'releases.statusLegacy',
  retired: 'releases.statusRetired',
}

/** 400_000 → "400K", 1_000_000 → "1M". */
export function formatContext(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `${Number.isInteger(m) ? m : m.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}M`
  }
  return `${Math.round(n / 1000)}K`
}

/** Subject price ÷ comparison price — "×2.5" reads better than "2.5×". */
function formatRatio(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const rounded = Math.round(n * 100) / 100
  return `×${rounded}`
}

/**
 * The live fact sheet of a release post.
 *
 * Every figure here is resolved from REGISTRY / LEADERBOARD at render time.
 * The article body never restates a number, so the two can never disagree.
 */
export function ReleaseFactSheet({ meta }: { meta: ReleaseMeta }) {
  const { t } = useTranslation()
  const priceRows = releasePriceRows(meta)
  const scoreTable = releaseScoreTable(meta)
  const estimate = releaseCostEstimate(meta)
  const offPeak = releaseOffPeakEstimate(meta)
  const offPeakDiffers = estimate && offPeak && estimate.totalCost !== offPeak.totalCost

  if (priceRows.length === 0) return null

  return (
    <div className="space-y-8">
      {/* ── Price table ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-[18px] font-semibold">{t('releases.priceTitle')}</h2>
        <p className="mt-1 text-[13px] text-fg-3">{t('releases.priceNote')}</p>
        <div className="mt-3 overflow-x-auto rounded-[12px] border border-border">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-border border-b text-left text-[12px] text-fg-3">
                <th className="px-4 py-2.5 font-medium">{t('releases.colModel')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('releases.colInput')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('releases.colOutput')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('releases.colCached')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('releases.colContext')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('releases.colVs')}</th>
              </tr>
            </thead>
            <tbody>
              {priceRows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-border even:bg-bg-alt/40 [&:not(:first-child)]:border-t',
                    row.isSubject && 'bg-primary/5 font-medium',
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span className="text-foreground">{row.displayName}</span>
                    {row.status !== 'active' && (
                      <span className="ml-2 text-[11px] text-fg-3">
                        ({t(STATUS_LABEL_KEY[row.status])})
                      </span>
                    )}
                    {row.note && <p className="mt-0.5 max-w-[32ch] text-[11px] text-fg-3">{row.note}</p>}
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-block text-[11px] text-fg-3 underline decoration-dotted underline-offset-2 hover:text-foreground"
                    >
                      {t('leaderboard.sourceVerified', { date: row.lastVerified })}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                    {formatReleasePrice(row.inputPricePer1M)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                    {formatReleasePrice(row.outputPricePer1M)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                    {row.cachedInputPricePer1M != null ? formatReleasePrice(row.cachedInputPricePer1M) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                    {formatContext(row.contextWindow)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-3">
                    {row.outputRatio != null ? formatRatio(row.outputRatio) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Your usage ──────────────────────────────────────────────── */}
      {estimate && (
        <section>
          <h2 className="text-[18px] font-semibold">{t('releases.costTitle')}</h2>
          <p className="mt-1 text-[13px] text-fg-3">{t('releases.costNote')}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[12px] border border-border bg-card p-4">
              <p className="text-[12px] text-fg-3">
                {offPeakDiffers ? t('releases.costPeak') : t('releases.costTitle')}
              </p>
              <p className="mt-1 text-[24px] font-semibold tabular-nums">
                ${estimate.totalCost.toFixed(2)}
                <span className="ml-1 text-[13px] font-normal text-fg-3">{t('calculator.perMonth')}</span>
              </p>
              <p className="mt-1 text-[12px] text-fg-3">
                {t('releases.costBreakdown', {
                  input: `$${estimate.inputCost.toFixed(2)}`,
                  output: `$${estimate.outputCost.toFixed(2)}`,
                })}
              </p>
            </div>
            {offPeakDiffers && offPeak && (
              <div className="rounded-[12px] border border-border bg-card p-4">
                <p className="text-[12px] text-fg-3">{t('releases.costOffPeak')}</p>
                <p className="mt-1 text-[24px] font-semibold tabular-nums">
                  ${offPeak.totalCost.toFixed(2)}
                  <span className="ml-1 text-[13px] font-normal text-fg-3">
                    {t('calculator.perMonth')}
                  </span>
                </p>
                <p className="mt-1 text-[12px] text-fg-3">{t('releases.costOffPeakNote')}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Score table ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-[18px] font-semibold">{t('releases.scoreTitle')}</h2>
        {!scoreTable ? (
          <p className="mt-3 text-[14px] text-fg-3">{t('releases.scoreEmpty')}</p>
        ) : (
          <>
            <p className="mt-1 text-[13px] text-fg-3">{t('releases.scoreNote')}</p>
            <div className="mt-3 overflow-x-auto rounded-[12px] border border-border">
              <table className="w-full min-w-[560px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-border border-b text-left text-[12px] text-fg-3">
                    <th className="px-4 py-2.5 font-medium">{t('releases.colBenchmark')}</th>
                    {scoreTable.columns.map((c) => (
                      <th key={c.modelSlug} className="px-4 py-2.5 text-right font-medium">
                        {c.displayName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scoreTable.rows.map((row) => (
                    <tr
                      key={row.benchmark}
                      className="border-border even:bg-bg-alt/40 [&:not(:first-child)]:border-t"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          to="/{-$locale}/benchmarks/$slug"
                          params={{ slug: row.benchmark }}
                          className="text-fg-2 hover:text-primary"
                        >
                          {row.benchmarkName}
                        </Link>
                        {row.cells[0]?.note && (
                          <span className="ml-2 text-[11px] text-fg-3">({row.cells[0].note})</span>
                        )}
                      </td>
                      {row.cells.map((cell) => (
                        <td
                          key={cell.modelSlug}
                          className={cn(
                            'px-4 py-2.5 text-right tabular-nums',
                            cell.score == null
                              ? 'text-fg-3'
                              : cell.modelSlug === scoreTable.columns[0]?.modelSlug
                                ? 'font-medium text-foreground'
                                : 'text-fg-2',
                          )}
                        >
                          {cell.score == null ? '—' : formatScore(cell.score, row.unit)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
