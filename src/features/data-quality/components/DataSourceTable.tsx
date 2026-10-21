import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/features/i18n/provider'
import type { DataSourceRow, SourceKind } from '../types'

/**
 * The page-level index of where every score was read from.
 *
 * One row per distinct source page a leaderboard score cites, grouped by who
 * measured it — a vendor's own harness and an independent evaluation are not
 * the same measurement. The counts behind it are the summary tiles'
 * vendor/third-party/reference buckets; this table names the pages those
 * tiles stand on.
 */
const KIND_LABEL_KEY: Record<SourceKind, string> = {
  vendor: 'dataQuality.summary.vendorReportedScores',
  'third-party': 'dataQuality.summary.thirdPartyScores',
  'reference-table': 'dataQuality.summary.referenceTableScores',
}

export function DataSourceTable({ rows }: { rows: DataSourceRow[] }) {
  const { t } = useTranslation()
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
            <th className="px-4 py-2.5 font-medium">{t('leaderboard.methodology.source')}</th>
            <th className="px-4 py-2.5 font-medium">{t('dataQuality.sources.colKind')}</th>
            <th className="px-4 py-2.5 text-right font-medium">
              {t('dataQuality.sources.colScores')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.url} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-2.5">
                <a
                  href={row.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-foreground underline decoration-dotted underline-offset-2 hover:text-primary"
                >
                  {row.name}
                </a>
              </td>
              <td className="px-4 py-2.5">
                <Badge variant="free">{t(KIND_LABEL_KEY[row.kind])}</Badge>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-fg-3">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
