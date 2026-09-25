import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'

export interface FAQItem {
  qKey: string
  aKey: string
}

const DEFAULT_FAQS: FAQItem[] = [
  { qKey: 'calculator.faq1Q', aKey: 'calculator.faq1A' },
  { qKey: 'calculator.faq2Q', aKey: 'calculator.faq2A' },
  { qKey: 'calculator.faq3Q', aKey: 'calculator.faq3A' },
  { qKey: 'calculator.faq4Q', aKey: 'calculator.faq4A' },
  { qKey: 'calculator.faq5Q', aKey: 'calculator.faq5A' },
  { qKey: 'calculator.faq6Q', aKey: 'calculator.faq6A' },
  { qKey: 'calculator.faq7Q', aKey: 'calculator.faq7A' },
  { qKey: 'calculator.faq8Q', aKey: 'calculator.faq8A' },
]

export function FAQ({
  id,
  faqs = DEFAULT_FAQS,
  kickerKey = 'marketing.faqKicker',
  titleKey = 'marketing.faqTitle',
}: {
  id?: string
  faqs?: FAQItem[]
  kickerKey?: string
  titleKey?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id={id} className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-7">
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-fg-3">
          {t(kickerKey)}
        </span>
        <h2 className="m-0 mt-3 max-w-[24em] text-[28px] sm:text-[36px] md:text-[40px] font-semibold tracking-[-0.015em]">
          {t(titleKey)}
        </h2>
        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
          {faqs.map(({ qKey, aKey }, i) => {
            const expanded = open === i
            return (
              <div key={qKey}>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : i)}
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[17px] font-medium transition-colors hover:bg-bg-alt"
                >
                  <span>{t(qKey)}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-fg-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {expanded && (
                  <div className="px-6 pb-5 text-[15px] leading-relaxed text-fg-2">{t(aKey)}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}