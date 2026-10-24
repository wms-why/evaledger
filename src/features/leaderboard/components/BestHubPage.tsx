import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { hubText } from '@/features/i18n/dictionaries/hub'
import { BEST_CATEGORIES, getBenchmark } from '../leaderboard'

/**
 * The Q&A pairs of the `/best` hub — the same keys the route turns into the
 * FAQPage JSON-LD, so the visible copy and the structured data can never
 * drift apart.
 */
export const BEST_HUB_FAQ_KEYS = [
  ['hub.best.faq1Q', 'hub.best.faq1A'],
  ['hub.best.faq2Q', 'hub.best.faq2A'],
  ['hub.best.faq3Q', 'hub.best.faq3A'],
] as const

/** The three shelves the rankings are grouped on. */
type HubGroup = 'capability' | 'cost' | 'vendor'

const GROUP_ORDER: HubGroup[] = ['capability', 'cost', 'vendor']

/**
 * The shelf a category sits on.
 *
 * The known slugs are listed explicitly; anything added to `BEST_CATEGORIES`
 * later is filed by shape — a `for-*` slug is a capability use case, a
 * cost/spec slug is a cost shelf, and everything else is a vendor or region
 * set. The grouping never decides *whether* a category is listed: the
 * registry does that.
 */
const KNOWN_GROUP: Record<string, HubGroup> = {
  'for-coding': 'capability',
  'for-agents': 'capability',
  'for-reasoning': 'capability',
  'cheapest-llms': 'cost',
  '1m-context-window': 'cost',
  'prompt-caching': 'cost',
  'chinese-model': 'vendor',
  'open-source': 'vendor',
}

const COST_HINTS = ['cheapest', 'cost', 'price', 'context-window', 'caching']

function groupOf(slug: string): HubGroup {
  const known = KNOWN_GROUP[slug]
  if (known) return known
  if (slug.startsWith('for-')) return 'capability'
  if (COST_HINTS.some((hint) => slug.includes(hint))) return 'cost'
  return 'vendor'
}

/**
 * `/best` — the directory of every "best model for X" page.
 *
 * The list comes from `BEST_CATEGORIES`, so a category the Lead adds to the
 * registry appears here on the next build — nothing is written down twice.
 * The page ranks nothing itself: it links to the pages that do.
 */
export function BestHubPage() {
  const { locale, t } = useTranslation()

  /**
   * Resolve a `hub.*` string.
   *
   * `t()` answers once the Lead wires the hub dictionary into `en.ts` /
   * `zh.ts`; until then it returns the raw key, so the module itself is the
   * fallback.
   */
  const text = (key: string, params?: Record<string, string | number>): string | undefined => {
    const viaDictionary = t(key, params)
    if (viaDictionary !== key) return viaDictionary
    return hubText(locale, key, params)
  }

  /**
   * The link text of a category: the hub dictionary names the destination,
   * and the category page's own title is the fallback.
   */
  const categoryTitle = (slug: string): string => {
    const fromHub = text(`hub.best.categories.${slug}`)
    if (fromHub) return fromHub
    const pageTitleKey = `leaderboard.best.${slug}.title`
    const fromPage = t(pageTitleKey)
    return fromPage !== pageTitleKey ? fromPage : slug
  }

  const groups = GROUP_ORDER.map((group) => ({
    group,
    categories: BEST_CATEGORIES.filter((category) => groupOf(category.slug) === group),
  })).filter((entry) => entry.categories.length > 0)

  const faqs = BEST_HUB_FAQ_KEYS.map(([questionKey, answerKey]) => ({
    question: text(questionKey),
    answer: text(answerKey),
  })).filter((faq) => faq.question && faq.answer)

  return (
    <div className="space-y-12">
      <header>
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {text('hub.best.kicker')}
        </p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] md:text-[36px]">
          {text('hub.best.title')}
        </h1>
        <p className="mt-3 max-w-[720px] text-[16px] leading-relaxed text-fg-2">
          {text('hub.best.intro')}
        </p>
        <p className="mt-2 text-[13px] text-fg-3">
          {text('hub.best.count', { count: BEST_CATEGORIES.length })}
        </p>
      </header>

      {groups.map((entry) => (
        <section key={entry.group} id={entry.group} className="scroll-mt-20">
          <h2 className="text-[20px] font-semibold tracking-[-0.01em]">
            {text(`hub.best.groups.${entry.group}`)}
          </h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {entry.categories.map((category) => {
              const scoredOn = category.benchmarkIds
                .map((id) => getBenchmark(id))
                .filter((benchmark) => benchmark !== undefined)
              // A score board and a price table are not the same thing: the
              // registry says which one this page is.
              const rankLabel = text(`hub.best.rankLabels.${category.kind ?? 'score'}`)
              return (
                <li
                  key={category.slug}
                  className="rounded-[12px] border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <Link
                    to="/{-$locale}/best/$category"
                    params={{ category: category.slug }}
                    className="text-[15px] font-medium leading-snug hover:text-primary"
                  >
                    {categoryTitle(category.slug)}
                  </Link>
                  {rankLabel && (
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">
                      {rankLabel}
                    </p>
                  )}
                  {text(`hub.best.descriptions.${category.slug}`) && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">
                      {text(`hub.best.descriptions.${category.slug}`)}
                    </p>
                  )}
                  {scoredOn.length > 0 && (
                    <p className="mt-2 text-[12px] leading-relaxed text-fg-3">
                      {t('leaderboard.best.scoredOn')}:{' '}
                      {scoredOn.map((benchmark, index) => (
                        <span key={benchmark.id}>
                          {index > 0 && ' · '}
                          <Link
                            to="/{-$locale}/benchmarks/$slug"
                            params={{ slug: benchmark.id }}
                            className="hover:text-primary"
                          >
                            {benchmark.name}
                          </Link>
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {faqs.length > 0 && (
        <section className="border-t border-border pt-8">
          <h2 className="text-[18px] font-semibold">{text('hub.best.faqTitle')}</h2>
          <dl className="mt-4 max-w-[760px] space-y-5">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="text-[15px] font-medium leading-snug">{faq.question}</dt>
                <dd className="mt-1.5 text-[14px] leading-relaxed text-fg-2">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <nav className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-[14px]">
        <Link to="/{-$locale}" className="text-primary hover:text-foreground">
          {text('hub.best.boardLink')}
        </Link>
        <Link to="/{-$locale}/benchmarks" className="text-fg-2 hover:text-primary">
          {text('hub.best.benchmarksLink')}
        </Link>
      </nav>
    </div>
  )
}
