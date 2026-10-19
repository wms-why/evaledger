import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/features/theme/theme-toggle'
import { LangSwitch } from '@/features/i18n/lang-switch'
import { useTranslation } from '@/features/i18n/provider'

/** Sticky marketing header. Links + CTA collapse into a hamburger menu on mobile. */
export function SiteNav({ theme }: { theme: 'light' | 'dark'; loggedIn: boolean }) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)

  const navLinks = (
    <>
      <Link
        to="/{-$locale}"
        className="rounded-md px-3 py-2 text-[14px] font-normal text-fg-2 transition-colors hover:text-foreground"
      >
        {t('leaderboard.navBoard')}
      </Link>
      <Link
        to="/{-$locale}/compare"
        className="rounded-md px-3 py-2 text-[14px] font-normal text-fg-2 transition-colors hover:text-foreground"
      >
        {t('leaderboard.navCompare')}
      </Link>
      <Link
        to="/{-$locale}/token-calculator"
        className="rounded-md px-3 py-2 text-[14px] font-normal text-fg-2 transition-colors hover:text-foreground"
      >
        {t('leaderboard.navCalculator')}
      </Link>
      <Link
        to="/{-$locale}/changelog"
        className="rounded-md px-3 py-2 text-[14px] font-normal text-fg-2 transition-colors hover:text-foreground"
      >
        {t('marketing.navChangelog')}
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <nav className="flex h-14 items-center gap-3 px-5 md:px-7">
        <Logo />
        <div className="flex-1" />

        {/* desktop */}
        <div className="hidden items-center gap-1 md:flex">{navLinks}</div>
        <div className="flex items-center gap-1">
          <ThemeToggle theme={theme} />
          <LangSwitch />
        </div>
        <div className="hidden md:block" />

        {/* mobile hamburger */}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-2 hover:bg-bg-alt hover:text-foreground md:hidden"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-border px-5 py-3 md:hidden" onClick={() => setOpen(false)}>
          {navLinks}
        </div>
      )}
    </header>
  )
}