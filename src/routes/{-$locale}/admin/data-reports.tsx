import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/features/auth/auth.client'
import { AppShell } from '@/components/app/app-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/features/i18n/provider'
import { fmtDateTime } from '@/lib/format-date'
import {
  listDataReportsFn,
  setDataReportStatusFn,
} from '@/features/data-quality/data-report.actions'
import type { DataReportRow } from '@/features/data-quality/data-report.server'
import {
  DATA_REPORT_STATUSES,
  REPORT_KIND_I18N_KEY,
  type DataReportStatus,
} from '@/features/data-quality/data-report.shared'

interface DataReportSearch { page?: number; pageSize?: number }

export const Route = createFileRoute('/{-$locale}/admin/data-reports')({
  validateSearch: (s: Record<string, unknown>): DataReportSearch => {
    const out: DataReportSearch = {}
    if (typeof s.page === 'number') out.page = s.page
    if (typeof s.pageSize === 'number') out.pageSize = s.pageSize
    return out
  },
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    listDataReportsFn({ data: { page: deps.page ?? 0, pageSize: deps.pageSize ?? 20 } }),
  component: DataReportsAdmin,
})

const STATUS_VARIANT: Record<DataReportStatus, 'free' | 'ok' | 'warn'> = {
  open: 'warn',
  accepted: 'ok',
  rejected: 'free',
}

/** The localized label of a triage status. */
function statusLabel(status: DataReportStatus): string {
  const { t } = useTranslation()
  if (status === 'accepted') return t('admin.dataReportStatusAccepted')
  if (status === 'rejected') return t('admin.dataReportStatusRejected')
  return t('admin.dataReportStatusOpen')
}

function Row({ r, onSaved }: { r: DataReportRow; onSaved: () => void }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<DataReportStatus>(r.status as DataReportStatus)
  const [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    try {
      await setDataReportStatusFn({ data: { id: r.id, status } })
      toast.success(t('admin.saved'))
      onSaved()
    } finally {
      setBusy(false)
    }
  }
  const kind = REPORT_KIND_I18N_KEY[r.kind as keyof typeof REPORT_KIND_I18N_KEY]
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {kind && <span className="font-semibold">{t(kind)}</span>}
            {r.modelId && (
              <span className="text-[12px] text-fg-3">{r.modelId}</span>
            )}
            <Badge variant={STATUS_VARIANT[r.status as DataReportStatus] ?? 'free'}>
              {statusLabel(r.status as DataReportStatus)}
            </Badge>
          </div>
          <p className="mb-0 mt-1.5 max-w-[60ch] text-sm text-fg-2">{r.detail}</p>
          <div className="mt-2 text-xs text-fg-3">
            {r.email || '—'} · {fmtDateTime(r.createdAt)}
            {r.sourceUrl && (
              <>
                {' · '}
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-dotted underline-offset-2 hover:text-primary"
                >
                  {r.sourceUrl}
                </a>
              </>
            )}
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {/* Native select: the arrow is drawn by the browser and hugs the
              border — the same treatment as the feedback admin page. */}
          <div className="relative">
            <select
              aria-label={t('admin.dataReportStatus')}
              className="h-[38px] appearance-none rounded-[7px] border border-input bg-background pl-3 pr-9 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              value={status}
              onChange={(e) => setStatus(e.target.value as DataReportStatus)}
            >
              {DATA_REPORT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-3"
            />
          </div>
          <Button size="sm" disabled={busy} onClick={save}>
            {t('admin.save')}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function DataReportsAdmin() {
  const { rows, total } = Route.useLoaderData()
  const search = Route.useSearch()
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { t } = useTranslation()
  const page = search.page ?? 0
  const pageSize = search.pageSize ?? 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  function setSearch(patch: Partial<DataReportSearch>) {
    void router.navigate({ to: '/{-$locale}/admin/data-reports', search: { ...search, ...patch } })
  }
  return (
    <AppShell
      user={{
        name: session?.user?.name,
        email: session?.user?.email ?? '',
        role: session?.user?.role ?? 'admin',
        image: session?.user?.image ?? null,
      }}
      active="admin-data-reports"
      crumb={t('admin.navAdmin')}
    >
      <div className="mb-5">
        <h1 className="page-h">
          {t('admin.dataReports')} ({total})
        </h1>
        <p className="mt-1.5 text-[14.5px] text-fg-2">{t('admin.dataReportsSub')}</p>
      </div>
      <div className="grid max-w-3xl gap-3">
        {rows.map((r) => (
          <Row key={r.id} r={r} onSaved={() => void router.invalidate()} />
        ))}
      </div>
      <div className="mt-4 flex max-w-3xl items-center justify-end gap-2">
        <span className="text-sm text-fg-3">
          {t('admin.pageOf', { page: page + 1, total: totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => setSearch({ page: page - 1, pageSize })}
        >
          <ChevronLeft size={15} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page + 1 >= totalPages}
          onClick={() => setSearch({ page: page + 1, pageSize })}
        >
          <ChevronRight size={15} />
        </Button>
      </div>
    </AppShell>
  )
}
