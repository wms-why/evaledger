import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import type { LegalDoc } from '@/features/i18n/dictionaries/legal'

/** Shared shell for the legal pages (/terms, /privacy). */
export function LegalPage({
  theme,
  loggedIn,
  doc,
}: {
  theme: 'light' | 'dark'
  loggedIn: boolean
  doc: LegalDoc
}) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <main className="mx-auto max-w-[680px] px-5 md:px-7 py-20 md:py-28">
        <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
          <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-fg-3">
            {t('common.appName')}
          </span>
          <h1 className="m-0 mt-3 text-[28px] sm:text-[36px] md:text-[40px] font-semibold tracking-[-0.015em]">
            {doc.title}
          </h1>
          <p className="mt-2 text-sm text-fg-3">{doc.updated}</p>
          <div className="mt-8 text-[17px] leading-[1.5] text-fg-2">
            <p className="leading-relaxed">{doc.intro}</p>
            {doc.sections.map((section) => (
              <section key={section.heading} className="mt-10">
                <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
                {section.body.map((p) => (
                  <p key={p} className="mt-3 leading-relaxed text-fg-2">
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-fg-2 marker:text-fg-3">
                    {section.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
        <p className="mt-8">
          <Link to="/{-$locale}" className="font-medium text-primary hover:underline">
            ← {t('common.appName')}
          </Link>
        </p>
      </main>
      <Footer theme={theme} />
    </div>
  )
}