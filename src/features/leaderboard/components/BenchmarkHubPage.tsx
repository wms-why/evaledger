import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { hubText } from '@/features/i18n/dictionaries/hub'
import { BENCHMARKS, type BenchmarkCategory } from '../benchmarks'
import { LEADERBOARD } from '../models'

/**
 * The Q&A pairs of the `/benchmarks` hub — the same keys the route turns into
 * the FAQPage JSON-LD, so the visible copy and the structured data can never
 * drift apart.
 */
export const BENCHMARK_HUB_FAQ_KEYS = [
  ['hub.benchmarks.faq1Q', 'hub.benchmarks.faq1A'],
  ['hub.benchmarks.faq2Q', 'hub.benchmarks.faq2A'],
  ['hub.benchmarks.faq3Q', 'hub.benchmarks.faq3A'],
  ['hub.benchmarks.faq4Q', 'hub.benchmarks.faq4A'],
] as const

/**
 * The shelves the benchmarks are grouped on, in the order a reader walks
 * them. The registry stores a `category` on every benchmark; this is only the
 * order those categories are shown in.
 */
const CATEGORY_ORDER: BenchmarkCategory[] = [
  'coding',
  'agentic',
  'reasoning',
  'knowledge',
  'math',
  'security',
  'vision',
]

/**
 * The benchmarks that have at least one model score on record.
 *
 * A benchmark nobody has scored has no leaderboard to show and no history
 * table to draw, so the hub links only to the pages that have something on
 * them. Resolved from `LEADERBOARD` — never a hand-written list.
 */
const SCORED_BENCHMARKS = new Set(
  LEADERBOARD.models.flatMap((model) => model.scores.map((score) => score.benchmark)),
)

/**
 * Resolve a `hub.*` string.
 *
 * `t()` answers once the Lead wires the hub dictionary into `en.ts` / `zh.ts`;
 * until then it returns the raw key, so the module itself is the fallback.
 */
function useHubText() {
  const { locale, t } = useTranslation()
  return (key: string, params?: Record<string, string | number>): string | undefined => {
    const viaDictionary = t(key, params)
    if (viaDictionary !== key) return viaDictionary
    return hubText(locale, key, params)
  }
}

/**
 * `/benchmarks` — the directory of every benchmark in the registry.
 *
 * The registry is the whole page: the list, the grouping and the copy of each
 * benchmark come from `BENCHMARKS`, so a benchmark that lands in
 * `benchmarks.ts` appears here without anyone touching this file. The page
 * quotes no score — it links to the pages that do.
 */
export function BenchmarkHubPage() {
  const text = useHubText()

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    benchmarks: BENCHMARKS.filter((benchmark) => benchmark.category === category),
  })).filter((group) => group.benchmarks.length > 0)

  const faqs = BENCHMARK_HUB_FAQ_KEYS.map(([questionKey, answerKey]) => ({
    question: text(questionKey),
    answer: text(answerKey),
  })).filter((faq) => faq.question && faq.answer)

  return (
    <div className="space-y-12">
      <header>
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {text('hub.benchmarks.kicker')}
        </p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] md:text-[36px]">
          {text('hub.benchmarks.title')}
        </h1>
        <p className="mt-3 max-w-[720px] text-[16px] leading-relaxed text-fg-2">
          {text('hub.benchmarks.intro')}
        </p>
        <p className="mt-2 text-[13px] text-fg-3">
          {text('hub.benchmarks.count', { count: BENCHMARKS.length })}
        </p>
      </header>

      <nav aria-label={text('hub.benchmarks.categoriesTitle')} className="flex flex-wrap gap-x-5 gap-y-2">
        {groups.map((group) => (
          <a
            key={group.category}
            href={`#${group.category}`}
            className="text-[14px] text-fg-2 hover:text-primary"
          >
            {text(`hub.benchmarks.categories.${group.category}`)}
          </a>
        ))}
      </nav>

      {groups.map((group) => (
        <section key={group.category} id={group.category} className="scroll-mt-20">
          <h2 className="text-[20px] font-semibold tracking-[-0.01em]">
            {text(`hub.benchmarks.categories.${group.category}`)}
          </h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {group.benchmarks.map((benchmark) => (
              <li
                key={benchmark.id}
                className="rounded-[12px] border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <Link
                  to="/{-$locale}/benchmarks/$slug"
                  params={{ slug: benchmark.id }}
                  className="text-[15px] font-medium leading-snug hover:text-primary"
                >
                  {benchmark.name}
                </Link>
                <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">
                  {benchmark.description}
                </p>
                {SCORED_BENCHMARKS.has(benchmark.id) && (
                  <Link
                    to="/{-$locale}/benchmarks/$slug/history"
                    params={{ slug: benchmark.id }}
                    className="mt-2 inline-block text-[12px] text-primary hover:text-foreground"
                  >
                    {benchmark.name} {text('hub.benchmarks.historyLabel')}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {faqs.length > 0 && (
        <section className="border-t border-border pt-8">
          <h2 className="text-[18px] font-semibold">{text('hub.benchmarks.faqTitle')}</h2>
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
          {text('hub.benchmarks.boardLink')}
        </Link>
        <Link to="/{-$locale}/methodology" className="text-fg-2 hover:text-primary">
          {text('hub.benchmarks.methodologyLink')}
        </Link>
      </nav>
    </div>
  )
}
