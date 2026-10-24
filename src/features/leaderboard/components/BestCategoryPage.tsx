import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { REGISTRY } from '@/features/calculator/model-prices'
import { priceDetail } from '@/features/calculator/pricing-detail'
import { categoryRows, getBenchmark, type BestCategory } from '../leaderboard'
import { trackForBestCategory } from '../board-links'
import { TRACKS } from '../scoring'
import { PriceCell } from './PriceCell'

/**
 * A "best model for X" page.
 *
 * Four kinds of page live behind one route, and the difference is which
 * number the ranking sorts by:
 *
 *  - **score** (`for-coding`, `for-agents`, `for-reasoning`, …) — the
 *    coverage gate applies: a model is ranked only if it was measured on
 *    every benchmark of the category, exactly as on the board. The page shows
 *    the composite.
 *  - **price** (`cheapest-llms`) — sorted by blended price, cheapest first.
 *    Not a board: a price is not a score, so there is no gate to pass.
 *  - **context** (`1m-context-window`) — sorted by context window, largest
 *    first, and only the models that actually reach the threshold.
 *  - **cache** (`prompt-caching`) — sorted by the discount the cached-input
 *    rate gives. A model that publishes no cached rate is **not** listed:
 *    there is no honest discount to show against a rate that does not exist.
 *
 * Every column is resolved from the price registry at render time, so the
 * page can never disagree with the calculator or with the board.
 */
export function BestCategoryPage({ category }: { category: BestCategory }) {
  const { t } = useTranslation()
  const rows = categoryRows(category)
  const kind = category.kind ?? 'score'
  // The capability board this page is the twin of, when there is one.
  const track = trackForBestCategory(category.slug)
  // The benchmarks a model must be measured on to be listed at all — set on
  // an attribute-ranked page that also answers "can it do the job?".
  const gate = category.gateBenchmarkIds ?? []

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {t('leaderboard.best.kicker')}
        </p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] md:text-[42px]">
          {t(`leaderboard.best.${category.slug}.title`)}
        </h1>
        <p className="mt-3 max-w-[680px] text-[16px] text-fg-2">
          {t(`leaderboard.best.${category.slug}.intro`)}
        </p>
      </div>

      {kind === 'score' && (
        <div className="overflow-hidden rounded-[14px] border border-border bg-card">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colRank')}</th>
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colModel')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('leaderboard.track.composite')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('leaderboard.colPrice')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.model.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5 tabular-nums text-fg-3">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <Link
                      to="/{-$locale}/models/$slug"
                      params={{ slug: r.model.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {r.model.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                    {r.composite != null ? r.composite.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <PriceCell priceId={r.model.priceId} view="column" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {kind === 'price' && (
        <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colRank')}</th>
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colModel')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.best.colBlended')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.common.colInput')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.common.colOutput')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.common.colCached')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                // The rate IN FORCE, not the registry's base rate: a
                // promotional band must not be quoted as the standing price.
                // Same resolution the calculator charges with.
                const detail = r.price ? priceDetail(r.price) : undefined
                return (
                  <tr key={r.model.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 tabular-nums text-fg-3">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <Link
                        to="/{-$locale}/models/$slug"
                        params={{ slug: r.model.id }}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {r.model.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                      {r.blendedPricePer1M != null ? `$${r.blendedPricePer1M}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                      {detail ? `$${detail.input}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                      {detail ? `$${detail.output}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                      {detail?.cached != null ? `$${detail.cached}` : t('landing.best.noCachedRate')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {kind === 'context' && (
        <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colRank')}</th>
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colModel')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.common.colContext')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.best.colBlended')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.common.colCached')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.model.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5 tabular-nums text-fg-3">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <Link
                      to="/{-$locale}/models/$slug"
                      params={{ slug: r.model.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {r.model.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                    {r.contextWindow != null
                      ? `${r.contextWindow.toLocaleString('en-US')}`
                      : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                    {r.blendedPricePer1M != null ? `$${r.blendedPricePer1M}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                    {r.price?.cachedInputPricePer1M != null
                      ? `$${r.price.cachedInputPricePer1M}`
                      : t('landing.best.noCachedRate')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {kind === 'cache' && (
        <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-fg-3">
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colRank')}</th>
                <th className="px-4 py-2.5 font-medium">{t('leaderboard.colModel')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.common.colInput')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.best.colCached')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('landing.best.colDiscount')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.model.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5 tabular-nums text-fg-3">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <Link
                      to="/{-$locale}/models/$slug"
                      params={{ slug: r.model.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {r.model.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                    {r.price != null ? `$${r.price.inputPricePer1M}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-fg-2">
                    {r.cachedInputPricePer1M != null ? `$${r.cachedInputPricePer1M}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-foreground">
                    {r.cacheDiscountPct != null ? `${r.cacheDiscountPct}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(kind === 'score' || gate.length > 0) && (
        <p className="text-[12px] text-fg-3">
          {t('leaderboard.best.scoredOn')}:{' '}
          <BenchmarkLinks ids={kind === 'score' ? category.benchmarkIds : gate} /> ·{' '}
          {track ? (
            <Link
              to="/{-$locale}/leaderboard/$track"
              params={{ track }}
              className="underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              {/* The TRACK's own label ("Coding"), not the board link's
                  ("Best coding LLMs") — "See the full Coding leaderboard"
                  reads as a sentence, the other does not. */}
              {t('linking.board.full', { track: t(TRACKS[track].labelKey) })}
            </Link>
          ) : (
            <Link
              to="/{-$locale}"
              className="underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              {t('leaderboard.best.fullBoard')}
            </Link>
          )}{' '}
          ·{' '}
          <Link
            to="/{-$locale}/best"
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {t('linking.breadcrumb.best')}
          </Link>
        </p>
      )}

      {kind !== 'score' && (
        <p className="text-[12px] text-fg-3">
          {t(
            `landing.best.caption${kind === 'price' ? 'Price' : kind === 'context' ? 'Context' : 'Cache'}`,
            // The caption states WHEN the rate is the one in force and HOW BIG
            // the context threshold is — both are facts, not copy, so they
            // come from the registry and the category, never from a literal.
            kind === 'price'
              ? { date: REGISTRY.fetchedAt.slice(0, 10) }
              : kind === 'context'
                ? { threshold: (category.minContext ?? 1_000_000).toLocaleString('en-US') }
                : {},
          )}{' '}
          ·{' '}
          <Link
            to="/{-$locale}"
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {t('leaderboard.best.fullBoard')}
          </Link>{' '}
          ·{' '}
          <Link
            to="/{-$locale}/best"
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {t('linking.breadcrumb.best')}
          </Link>
        </p>
      )}
    </div>
  )
}

/**
 * The benchmarks a category ranks on, each one a link to its own page.
 *
 * A benchmark name in a table is a link everywhere else on the site — the
 * board, the comparison matrix, the model page, the `/best` hub — so the
 * category page is the one place that must not leave the name as plain text.
 */
function BenchmarkLinks({ ids }: { ids: string[] }) {
  return (
    <>
      {ids.map((id, index) => {
        const benchmark = getBenchmark(id)
        return (
          <span key={id}>
            {index > 0 && ' · '}
            <Link
              to="/{-$locale}/benchmarks/$slug"
              params={{ slug: id }}
              className="underline decoration-dotted underline-offset-2 hover:text-foreground"
            >
              {benchmark?.name ?? id}
            </Link>
          </span>
        )
      })}
    </>
  )
}
