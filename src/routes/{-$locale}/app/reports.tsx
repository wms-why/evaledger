import { createFileRoute } from '@tanstack/react-router'
import { requireUser } from '@/features/auth/middleware'
import { getMyDataReportsFn } from '@/features/data-quality/data-report.actions'
import { MyDataReports } from '@/features/data-quality/components/MyDataReports'
import { useTranslation } from '@/features/i18n/provider'
import { LEADERBOARD } from '@/features/leaderboard/models'
import { AppShell } from '@/components/app/app-shell'

/**
 * The reporter's own correction reports.
 *
 * `/data-quality` is where anyone can file a report; this page is where a
 * signed-in reporter can read, edit and withdraw theirs until it is triaged.
 * Model options come from the same leaderboard registry the public form reads,
 * so the two forms can never offer different models.
 */
export const Route = createFileRoute('/{-$locale}/app/reports')({
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  loader: async ({ params }) => {
    const [user, rows] = await Promise.all([
      requireUser({ data: { locale: (params as { locale?: string }).locale } }),
      getMyDataReportsFn(),
    ])
    return { user, rows }
  },
  component: ReportsPage,
})

function ReportsPage() {
  const { user, rows } = Route.useLoaderData()
  const { t } = useTranslation()
  const models = LEADERBOARD.models.map((m) => ({ id: m.id, displayName: m.displayName }))
  return (
    <AppShell user={user} active="reports" crumb={t('app.myReports.nav')}>
      <div className="mb-6">
        <h1 className="page-h">{t('app.myReports.title')}</h1>
        <p className="mt-1.5 text-[14.5px] text-fg-2">{t('app.myReports.subtitle')}</p>
      </div>
      <MyDataReports rows={rows} email={user.email} models={models} />
    </AppShell>
  )
}
