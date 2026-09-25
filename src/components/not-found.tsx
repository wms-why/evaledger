/**
 * 默认 404 页（router 的 defaultNotFoundComponent）。
 * 可能渲染在 I18nProvider / locale 布局之外，故用 locale 无关的纯文案 + 普通 <a> 回首页
 * （`/` 始终解析到默认语言；用普通 anchor 避免 typed-route 约束，404 整页跳转可接受）。
 */
import { useEffect } from 'react'
import { buttonVariants } from '@/components/ui/button'
export function NotFound() {
  // document.title, not a rendered <title>: the root head() already emits one,
  // and React 19 hoisting would append a second (invalid, and browsers keep the first).
  useEffect(() => {
    document.title = 'Page not found — TokenCalculator'
  }, [])
  return (
    <main className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-xl px-5 text-center md:px-7">
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-fg-3">
          route not found
        </span>
        <div className="mt-4 text-[64px] font-semibold leading-none tracking-[-0.02em] text-primary md:text-[80px]">
          404
        </div>
        <h1 className="mt-4 text-[28px] font-semibold tracking-tight md:text-[32px]">
          Page not found
        </h1>
        <p className="mt-4 text-[17px] text-fg-2">
          This route never shipped. Check the URL or head back to safe harbor.
        </p>
        <div className="mt-8">
          <a href="/" className={buttonVariants({ size: 'lg' })}>
            Back to home
          </a>
        </div>
      </div>
    </main>
  )
}