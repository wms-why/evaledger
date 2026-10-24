import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { Badge } from '@/components/ui/badge'
import { BENCHMARKS, benchmarkVersionSuffix } from '../benchmarks'
import { COMPARE_PAIR_ENTRIES, formatScore, scoreOf } from '../leaderboard'
import { findLeaderboardModel } from '../models'
import { scoreTrack, TRACKS, TRACK_IDS } from '../scoring'
import { alternativeLinks, modelVerdict } from '@/features/landing/data'
import type { LeaderboardModel } from '../types'
import { VENDOR_LABEL_KEY } from '../vendors'
import { formatMoney } from '@/features/calculator/format'
import { PriceCell } from './PriceCell'
import { ScoreProvenance } from './ScoreProvenance'

export function ModelProfile({ model }: { model: LeaderboardModel }) {
  const { t } = useTranslation()
  const scored = BENCHMARKS.filter((bm) => scoreOf(model, bm.id))
  const related = COMPARE_PAIR_ENTRIES.filter((p) => p.a === model.id || p.b === model.id).slice(0, 6)

  // The two sections that turn a spec table into a search landing page.
  // Both are computed from the registries, so neither can say something the
  // tables on the same page do not support.
  const alternatives = alternativeLinks(model, 5)

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-fg-3">
            <span>{t(VENDOR_LABEL_KEY[model.vendor])}</span>
            <span>·</span>
            <span>{model.kind}</span>
            <span>·</span>
            <span>{model.version}</span>
          </div>
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">{model.displayName}</h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-fg-3">
            {model.releaseDate && <span>{t('leaderboard.model.released')}: {model.releaseDate}</span>}
            {model.updatedAt && <span>{t('leaderboard.model.updated')}: {model.updatedAt.slice(0, 10)}</span>}
          </div>
        </div>
        <PriceCell priceId={model.priceId} view="calculator" />
      </div>

      <TrackSummary model={model} />
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="text-[18px] font-semibold">{t('leaderboard.model.scores')}</h2>
          {scored.length === 0 ? (
            <p className="mt-3 text-[14px] text-fg-3">{t('leaderboard.model.noScores')}</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-[12px] border border-border">
              <table className="w-full border-collapse text-[13px]">
                <tbody>
                  {scored.map((bm) => {
                    const s = scoreOf(model, bm.id)!
                    const versionSuffix = benchmarkVersionSuffix(bm)
                    return (
                      <tr key={bm.id} className="border-border even:bg-bg-alt/40 [&:not(:first-child)]:border-t">
                        <td className="px-4 py-2.5">
                          <Link to="/{-$locale}/benchmarks/$slug" params={{ slug: bm.id }} className="text-fg-2 hover:text-primary">
                            {bm.name}
                          </Link>
                          {versionSuffix && (
                            <span className="ml-2 text-[11px] text-fg-3">
                              {t('leaderboard.track.version')} {versionSuffix}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                          <ScoreProvenance score={s}>{formatScore(s.score, s.unit)}</ScoreProvenance>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section>
            <h2 className="text-[18px] font-semibold">{t('leaderboard.model.pricing')}</h2>
            <div className="mt-3 rounded-[12px] border border-border bg-card p-4">
              <PriceCell priceId={model.priceId} view="card" />
              <Link
                to="/{-$locale}/token-cost-calculator"
                search={{ model: model.priceId }}
                className="mt-3 inline-block text-[13px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                {t('leaderboard.model.runUsage')} →
              </Link>
            </div>
          </section>

          {related.length > 0 && (
            <section>
              <h2 className="text-[18px] font-semibold">{t('leaderboard.model.related')}</h2>
              <div className="mt-3 flex flex-col gap-1.5">
                {related.map((p) => {
                  const ma = findLeaderboardModel(p.a)
                  const mb = findLeaderboardModel(p.b)
                  return (
                    <Link
                      key={p.slug}
                      to="/{-$locale}/compare/$pair"
                      params={{ pair: p.slug }}
                      className="text-[13px] text-fg-2 hover:text-primary"
                    >
                      {ma?.displayName ?? p.a} vs {mb?.displayName ?? p.b}
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/*
        The two sections that turn a spec table into a search landing page.

        "Is [model] worth the cost?" is the question the search actually asks,
        and it used to have no answer on this page at all — the page gave the
        numbers and left the reader to do the arithmetic. The verdict is
        computed (`modelVerdict`), not written: it names the model's own
        blended rate, its price rank and its best board standing, so the claim
        can never outrun the tables above it.
      */}
      <WorthItSection model={model} />

      {/*
        "[Model] vs Alternatives" — the exit link. A model page that ends
        without a next step sends the reader back to a search engine; one that
        offers the head-to-heads and the same-tier models keeps them on the
        site. Every link is checked against the published comparison registry
        first, so a URL that would 404 is never emitted.
      */}
      <AlternativesSection model={model} alternatives={alternatives} />
    </div>
  )
}

/**
 * "Is [model] worth the cost?" — a verdict computed from the model's own
 * numbers, never asserted in prose.
 *
 * The facts strip prints the model's own rates, its rank among everything we
 * price and its best board standing; the sentence below picks its wording from
 * the verdict code. Both come from `modelVerdict`, which reads the registry
 * and the leaderboard — so the page cannot claim something the tables above
 * it do not support.
 */
function WorthItSection({ model }: { model: LeaderboardModel }) {
  const { t } = useTranslation()
  const verdict = modelVerdict(model)

  const facts: { labelKey: string; valueKey: string; params: Record<string, string | number> }[] = []
  if (verdict.blended != null) {
    facts.push({
      labelKey: 'landing.model.factsPrice',
      // The VALUE tile is its own key: the label is the noun "Blended price",
      // the value is the number. One key cannot be both, and reusing the
      // label printed the label twice instead of the price.
      valueKey: 'landing.model.factsPriceValue',
      params: { blended: formatMoney(verdict.blended) },
    })
  }
  if (verdict.priceRank != null) {
    facts.push({
      labelKey: 'landing.model.factsPriceRank',
      valueKey: 'landing.model.factsPriceRankValue',
      params: { rank: verdict.priceRank, n: verdict.pricedCount },
    })
  }
  if (verdict.board) {
    facts.push({
      labelKey: 'landing.model.factsComposite',
      valueKey: 'landing.model.factsCompositeValue',
      params: {
        composite: verdict.board.composite.toFixed(1),
        track: t(TRACKS[verdict.board.slug].labelKey),
      },
    })
  } else {
    facts.push({
      labelKey: 'landing.model.factsComposite',
      valueKey: 'landing.model.factsCompositeNone',
      params: {},
    })
  }

  const summaryParams: Record<string, string | number> = {
    model: model.displayName,
    blended: verdict.blended != null ? formatMoney(verdict.blended) : '—',
    input: verdict.input != null ? `$${verdict.input}` : '—',
    output: verdict.output != null ? `$${verdict.output}` : '—',
    tier: verdict.tier ?? '—',
    priced: verdict.pricedCount,
    composite: verdict.board ? verdict.board.composite.toFixed(1) : '—',
    track: verdict.board ? t(TRACKS[verdict.board.slug].labelKey) : '—',
    rank: verdict.board?.rank ?? '—',
    ranked: verdict.board?.ranked ?? '—',
  }

  return (
    <section className="border-t border-border pt-8">
      <h2 className="text-[20px] font-semibold tracking-[-0.3px]">
        {t('landing.model.worthItTitle', { model: model.displayName })}
      </h2>
      <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
        {t('landing.model.worthItIntro', { model: model.displayName })}
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.labelKey} className="rounded-[12px] border border-border bg-card p-4">
            <dt className="text-[12px] uppercase tracking-wide text-fg-3">{t(fact.labelKey)}</dt>
            <dd className="mt-1.5 text-[15px] font-semibold tabular-nums text-foreground">
              {t(fact.valueKey, fact.params)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
        {t(`landing.model.verdict.${verdict.code}`, summaryParams)}
      </p>
    </section>
  )
}

/**
 * "[Model] vs Alternatives" — where the reader goes next.
 *
 * A published head-to-head wins over a bare model page: the pair slug is
 * resolved from `COMPARE_PAIR_ENTRIES` at render time, so the link is either
 * a real comparison or a model page that exists.
 */
function AlternativesSection({
  model,
  alternatives,
}: {
  model: LeaderboardModel
  alternatives: ReturnType<typeof alternativeLinks>
}) {
  const { t } = useTranslation()

  return (
    <section className="border-t border-border pt-8">
      <h2 className="text-[20px] font-semibold tracking-[-0.3px]">
        {t('landing.model.alternativesTitle', { model: model.displayName })}
      </h2>
      <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-fg-2">
        {t('landing.model.alternativesIntro', { model: model.displayName })}
      </p>
      {alternatives.length === 0 ? (
        <p className="mt-4 text-[14px] text-fg-3">{t('landing.model.alternativesEmpty')}</p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {alternatives.map((link) => (
            <li
              key={`${link.kind}:${link.other.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-border bg-card px-4 py-3"
            >
              <Link
                to={link.kind === 'compare' ? '/{-$locale}/compare/$pair' : '/{-$locale}/models/$slug'}
                params={
                  link.kind === 'compare'
                    ? { pair: link.to.replace('/compare/', '') }
                    : { slug: link.other.id }
                }
                className="text-[14px] font-medium text-foreground hover:text-primary"
              >
                {link.kind === 'compare'
                  ? t('landing.model.compareLink', {
                      model: model.displayName,
                      other: link.other.displayName,
                    })
                  : t('landing.model.modelLink', { other: link.other.displayName })}
              </Link>
              <span className="text-[12px] text-fg-3">{t(VENDOR_LABEL_KEY[link.other.vendor])}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * Where this model stands on each capability board.
 *
 * A model that was never measured on a board's core benchmarks has no
 * composite on it — that is stated, not hidden, and the missing benchmark
 * is named so the reader can see exactly why.
 */
function TrackSummary({ model }: { model: LeaderboardModel }) {
  const { t } = useTranslation()
  const tracks = TRACK_IDS.map((slug) => ({ slug, score: scoreTrack(model, TRACKS[slug]) }))

  return (
    <section>
      <h2 className="text-[18px] font-semibold">{t('leaderboard.track.nav')}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {tracks.map(({ slug, score }) => (
          <li
            key={slug}
            className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-border bg-card px-4 py-3"
          >
            <Link
              to="/{-$locale}/leaderboard/$track"
              params={{ track: slug }}
              className="text-[14px] font-medium text-foreground hover:text-primary"
            >
              {t(TRACKS[slug].labelKey)}
            </Link>
            {score.composite != null ? (
              <span className="tabular-nums text-[15px] font-semibold text-foreground">
                {score.composite.toFixed(1)}
              </span>
            ) : (
              <Badge
                variant="free"
                title={t('leaderboard.track.notRankedReason', {
                  benchmarks: score.missing
                    .map((id) => BENCHMARKS.find((b) => b.id === id)?.name ?? id)
                    .join(', '),
                })}
              >
                {t('leaderboard.track.untested')}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
