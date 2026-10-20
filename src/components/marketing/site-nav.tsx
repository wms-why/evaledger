import * as React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/features/theme/theme-toggle'
import { LangSwitch } from '@/features/i18n/lang-switch'
import { useTranslation } from '@/features/i18n/provider'
import { locales } from '@/features/i18n/locale'

const LOCALE_PREFIX = new RegExp(`^/(?:${locales.join('|')})(?=/|$)`)
const LOCALE_SEGMENT = '/{-$locale}'

/**
 * Header links. `also` lists locale-less paths that belong to the same surface
 * but live on their own SEO URL (e.g. the calculator's per-provider landings),
 * so the current item still lights up there.
 */
const NAV_ITEMS = [
  { to: '/{-$locale}', labelKey: 'leaderboard.navBoard', also: ['/leaderboard-history'] },
  { to: '/{-$locale}/compare', labelKey: 'leaderboard.navCompare', also: [] },
  {
    to: '/{-$locale}/token-calculator',
    labelKey: 'leaderboard.navCalculator',
    also: [
      '/token-cost-calculator',
      '/claude-token-cost-calculator',
      '/chatgpt-api-pricing',
      '/deepseek-api-pricing',
      '/openrouter-pricing-calculator',
    ],
  },
  { to: '/{-$locale}/releases', labelKey: 'releases.nav', also: [] },
  { to: '/{-$locale}/changelog', labelKey: 'marketing.navChangelog', also: [] },
] as const

const LINK_CLASS = 'rounded-md px-3 py-2 text-[14px] font-normal transition-colors'
const IDLE_CLASS = 'text-fg-2 hover:text-foreground'
const ACTIVE_CLASS = 'bg-soft font-medium text-primary'

/** `/zh/compare/foo` → `/compare/foo`；去掉尾斜杠，首页归一为 `/`。 */
function localeFreePath(pathname: string): string {
  const stripped = pathname.replace(LOCALE_PREFIX, '').replace(/\/+$/, '')
  return stripped === '' ? '/' : stripped
}

/** 目标路径本身 + 其子路径；`/` 只匹配首页，避免所有页都选中它。 */
function matchesPath(path: string, target: string): boolean {
  return target === '/' ? path === '/' : path === target || path.startsWith(`${target}/`)
}

/** 当前路径是否命中某个导航项（含同属一个产品的别名路径）。 */
export function isNavItemActive(pathname: string, to: string, also: readonly string[] = []): boolean {
  const path = localeFreePath(pathname)
  const target = to.replace(LOCALE_SEGMENT, '') || '/'
  return matchesPath(path, target) || also.some((alias) => matchesPath(path, alias))
}

/** Sticky marketing header. Links + CTA collapse into a hamburger menu on mobile. */
export function SiteNav({ theme }: { theme: 'light' | 'dark'; loggedIn: boolean }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [open, setOpen] = React.useState(false)

  const navLinks = (
    <>
      {NAV_ITEMS.map(({ to, labelKey, also }) => {
        const active = isNavItemActive(pathname, to, also)
        return (
          <Link
            key={to}
            to={to}
            // 选中态由上面的 isNavItemActive 统一算（要覆盖别名路径），所以：
            // - activeProps={{}} 阻止 Link 追加默认的 `active` class；
            // - 首页要 exact，否则 /zh 会被 Link 当成所有中文页的父路径。
            activeProps={{}}
            activeOptions={to === LOCALE_SEGMENT ? { exact: true } : undefined}
            aria-current={active ? 'page' : undefined}
            className={`${LINK_CLASS} ${active ? ACTIVE_CLASS : IDLE_CLASS}`}
          >
            {t(labelKey)}
          </Link>
        )
      })}
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
