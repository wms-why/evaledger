import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Static mockup of the calculator's results grid — used as the hero "what you get" visual. */
function CalculatorPreview() {
  const rows = [
    { provider: 'GPT-5 nano', cost: '0.42', badge: null },
    { provider: 'Haiku 4.5', cost: '1.20', badge: null },
    { provider: 'Gemini 2.5 Flash', cost: '2.65', badge: null },
    { provider: 'Sonnet 4.5', cost: '5.40', badge: null },
    { provider: 'Opus 4.5', cost: '9.80', badge: 'cheapest' as const },
    { provider: 'GPT-5', cost: '12.30', badge: null },
  ]
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg-alt">
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.06em] text-fg-3">
              100k input · 40k output · 10k req/mo
            </div>
            <div className="mt-1 text-base font-semibold text-foreground">6 of 24 models shown</div>
          </div>
          <div className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-medium text-primary">
            Updated weekly
          </div>
        </div>

        {/* model rows */}
        <div className="overflow-hidden rounded-lg border border-border bg-bg">
          {rows.map((r, i) => (
            <div
              key={r.provider}
              className={cn(
                'flex items-center justify-between border-border px-3.5 py-2.5 text-[13px]',
                i > 0 && 'border-t',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{r.provider}</span>
                {r.badge === 'cheapest' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2 py-0.5 text-[10px] font-medium text-primary">
                    <Sparkles size={10} /> Cheapest
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold tabular-nums text-foreground">${r.cost}</span>
                <span className="text-[11px] text-fg-3">/ mo</span>
              </div>
            </div>
          ))}
        </div>

        {/* mini footer */}
        <div className="flex items-center justify-between text-[11px] text-fg-3">
          <span>Sorted by cheapest first · 24 models · 5 providers</span>
          <span>Source: provider pricing pages</span>
        </div>
      </div>
    </div>
  )
}

export function Hero({ loggedIn }: { loggedIn: boolean }) {
  const { t } = useTranslation()

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5 text-center md:px-7">
        <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.08em] text-primary">
          {t('marketing.heroEyebrow')}
        </p>
        <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[52px] md:text-[60px]">
          {t('marketing.heroTitlePre')}
          <span className="text-primary">{t('marketing.heroTitleHl')}</span>
          {t('marketing.heroTitlePost')}
        </h1>
        <p className="mx-auto mt-5 max-w-[640px] text-[17px] leading-[1.5] text-fg-2 sm:text-[19px]">
          {t('marketing.heroSubtitle')}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {loggedIn ? (
            <Link to="/{-$locale}/app" className={buttonVariants({ size: 'lg' })}>
              {t('marketing.heroCtaPrimary')} <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/{-$locale}/token-cost-calculator" className={buttonVariants({ size: 'lg' })}>
              {t('marketing.heroCtaPrimary')} <ArrowRight size={18} />
            </Link>
          )}
        </div>
        <p className="mt-3 text-[13px] text-fg-3">{t('marketing.heroSocialProof')}</p>

        {/* product mockup */}
        <div className="mt-16 md:mt-20">
          <CalculatorPreview />
        </div>
      </div>
    </section>
  )
}