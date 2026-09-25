import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { buttonVariants } from '@/components/ui/button'

export function CTA({ loggedIn }: { loggedIn: boolean }) {
  const { t } = useTranslation()

  return (
    <section className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-5 text-center md:px-7">
        <h2 className="text-[32px] font-semibold tracking-[-0.015em] sm:text-[40px]">
          {t('marketing.ctaTitle')}
        </h2>
        <p className="mx-auto mt-4 max-w-[640px] text-[17px] text-fg-2">
          {t('marketing.ctaBody')}
        </p>
        <div className="mt-8">
          {loggedIn ? (
            <Link to="/{-$locale}/app" className={buttonVariants({ size: 'xl' })}>
              {t('marketing.ctaButton')} <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/{-$locale}/token-cost-calculator" className={buttonVariants({ size: 'xl' })}>
              {t('marketing.ctaButton')} <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}