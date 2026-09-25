/**
 * Default error component (router's defaultErrorComponent). Catches uncaught
 * render/loader errors so they show a styled page instead of a blank screen.
 *
 * Like NotFound, this may render outside the I18nProvider / locale layout, so
 * it uses locale-agnostic copy and a plain <a>. The raw error message is shown
 * only in dev — but note TanStack Start still serializes the error's message
 * into the dehydrated router state in the HTML, so it is visible in the page
 * source even in production. Loaders must not throw errors whose messages
 * contain secrets or internals; sanitize before throwing.
 */
import { useEffect } from 'react'
import { buttonVariants } from '@/components/ui/button'
export function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  // document.title, not a rendered <title>: the root head() already emits one,
  // and React 19 hoisting would append a second (invalid, and browsers keep the first).
  useEffect(() => {
    document.title = 'Something went wrong — TokenCalculator'
  }, [])
  return (
    <main className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-xl px-5 text-center md:px-7">
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-fg-3">
          unexpected error
        </span>
        <div className="mt-4 text-[64px] font-semibold leading-none tracking-[-0.02em] text-primary md:text-[80px]">
          500
        </div>
        <h1 className="mt-4 text-[28px] font-semibold tracking-tight md:text-[32px]">
          Something went wrong
        </h1>
        <p className="mt-4 text-[17px] text-fg-2">
          An unexpected error occurred. Try again, or head back to safe harbor.
        </p>
        {import.meta.env.DEV && (
          <pre className="mx-auto mt-6 max-w-[40em] overflow-auto rounded-[10px] border border-border p-4 text-left text-[13px] text-fg-2">
            {error.message}
          </pre>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button onClick={reset} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Try again
          </button>
          <a href="/" className={buttonVariants({ size: 'lg' })}>
            Back to home
          </a>
        </div>
      </div>
    </main>
  )
}