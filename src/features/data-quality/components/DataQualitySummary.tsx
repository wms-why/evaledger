import { Card } from '@/components/ui/card'
import { useTranslation } from '@/features/i18n/provider'
import type { DataQualitySummary as DataQualitySummaryValue } from '../types'

/**
 * The summary tiles: how much of the site is verified, and how much of it
 * came from where.
 *
 * Every tile is a count we can defend — nothing here is a percentage we
 * cannot trace back to a registry row. The price tiles count the price rows
 * of the models this page covers (the leaderboard models), not every row of
 * the registry: the labels say so, because a tile that counts more rows than
 * the page shows is a claim the reader cannot check.
 */
const TILES: Array<{ key: keyof DataQualitySummaryValue; i18n: string }> = [
  { key: 'modelCount', i18n: 'dataQuality.summary.modelCount' },
  { key: 'priceRows', i18n: 'dataQuality.summary.priceRows' },
  { key: 'freshPrices', i18n: 'dataQuality.summary.freshPrices' },
  { key: 'stalePrices', i18n: 'dataQuality.summary.stalePrices' },
  { key: 'unverifiedPrices', i18n: 'dataQuality.summary.unverifiedPrices' },
  { key: 'scoreRows', i18n: 'dataQuality.summary.scoreRows' },
  { key: 'vendorReportedScores', i18n: 'dataQuality.summary.vendorReportedScores' },
  { key: 'thirdPartyScores', i18n: 'dataQuality.summary.thirdPartyScores' },
  { key: 'referenceTableScores', i18n: 'dataQuality.summary.referenceTableScores' },
  { key: 'freshScoreSets', i18n: 'dataQuality.summary.freshScoreSets' },
  { key: 'staleScoreSets', i18n: 'dataQuality.summary.staleScoreSets' },
  { key: 'undatedScoreSets', i18n: 'dataQuality.summary.undatedScoreSets' },
  { key: 'completeModelCount', i18n: 'dataQuality.summary.completeModelCount' },
]

export function DataQualitySummary({ summary }: { summary: DataQualitySummaryValue }) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="data-quality-summary">
      <h2 id="data-quality-summary" className="mb-3 text-[15px] font-semibold text-foreground">
        {t('dataQuality.summary.title')}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TILES.map((tile) => (
          <Card key={tile.key} className="px-4 py-3">
            <div className="text-[22px] font-semibold leading-none tabular-nums text-foreground">
              {summary[tile.key]}
            </div>
            <div className="mt-1.5 text-[12px] leading-snug text-fg-3">{t(tile.i18n)}</div>
          </Card>
        ))}
      </div>
    </section>
  )
}
