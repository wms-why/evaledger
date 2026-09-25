import { useTranslation } from '@/features/i18n/provider'
import { Sparkles } from 'lucide-react'

/**
 * 3-5 bullet "quick takeaways" strip. Designed to be quoted verbatim by
 * Google for the featured-snippet position — keep each item a complete
 * sentence that answers one specific question.
 */
export function PricingTLDR() {
  const { t } = useTranslation()
  const items = t('calculator.tldrItems') as unknown as string[]
  const title = t('calculator.tldrTitle')

  // translate() always returns a string; for arrays we hand-flatten via key
  // lookups since the dict has `tldrItems: string[]`. Falling back to the
  // raw string is safe.
  const list = Array.isArray(items)
    ? items
    : (t('calculator.tldrItems') as string).split('|')

  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-5 md:px-7">
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-fg-3">
          <Sparkles size={12} aria-hidden="true" /> {title}
        </span>
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {list.map((line, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-[12px] border border-border bg-card p-4 text-[14px] leading-relaxed text-fg-2"
            >
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-soft text-[11px] font-semibold tabular-nums text-primary">
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}