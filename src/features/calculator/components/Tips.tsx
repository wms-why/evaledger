import { useTranslation } from '@/features/i18n/provider'

interface TipsProps {
  /** Override the i18n key for the bullet list. Defaults to 'calculator.tips'
   *  (the shared money-saving tips used by every calculator page). */
  itemsKey?: string
}

/**
 * "How to bring the bill down" — numbered tips. Each line must contain a
 * concrete number (cache-hit %, model price, hour window) so the tip is
 * quotable on its own and useful in featured snippets.
 */
export function Tips({ itemsKey = 'calculator.tips' }: TipsProps = {}) {
  const { t, lookup } = useTranslation()
  const items: string[] = lookup<string[]>(itemsKey) ?? []

  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-7">
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-fg-3">
          {t('calculator.kicker')}
        </span>
        <h2 className="mt-2.5 max-w-[24em] text-[26px] font-semibold tracking-[-0.6px]">
          {t('calculator.tipsTitle')}
        </h2>
        <ol className="mx-auto mt-6 max-w-3xl space-y-3">
          {items.map((line, i) => (
            <li
              key={i}
              className="flex gap-4 rounded-[12px] border border-border bg-card p-4"
            >
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-soft text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <span className="text-[14px] leading-relaxed text-fg-2">{line}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}