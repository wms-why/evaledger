import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ChevronDown, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/features/i18n/provider'
import { localizePath } from '@/features/i18n/locale'
import { fmtDateTime } from '@/lib/format-date'
import {
  deleteMyDataReportFn,
  submitMyDataReportFn,
  updateMyDataReportFn,
} from '../data-report.actions'
import type { DataReportRow } from '../data-report.server'
import {
  DATA_REPORT_KINDS,
  DETAIL_MAX,
  OPEN_REPORT_LIMIT,
  REPORT_KIND_I18N_KEY,
  SOURCE_URL_MAX,
  type DataReportKind,
  type DataReportStatus,
} from '../data-report.shared'
import type { DataReportModelOption } from './DataReportForm'

/**
 * The signed-in reporter's side of the correction intake.
 *
 * Three states of a report meet here: it is filed (create), it is still `open`
 * and therefore editable/withdrawable (update/delete), or it has been triaged
 * and is now a read-only record (no controls). The cutoff is the server's, not
 * this component's: the buttons only mirror what `updateMyDataReport` /
 * `deleteMyDataReport` will accept.
 */

interface Draft {
  modelId: string
  kind: DataReportKind
  detail: string
  sourceUrl: string
}

const EMPTY: Draft = { modelId: '', kind: 'stale-price', detail: '', sourceUrl: '' }

const STATUS_VARIANT: Record<DataReportStatus, 'free' | 'ok' | 'warn'> = {
  open: 'warn',
  accepted: 'ok',
  rejected: 'free',
}

function draftFrom(row: DataReportRow): Draft {
  return {
    modelId: row.modelId ?? '',
    kind: (row.kind as DataReportKind) ?? 'other',
    detail: row.detail,
    sourceUrl: row.sourceUrl ?? '',
  }
}

/** Native select: the arrow is drawn by the browser and hugs the border. */
function SelectShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-3"
      />
    </div>
  )
}

const selectClass =
  'h-[42px] w-full appearance-none rounded-[7px] border border-input bg-background pl-3 pr-9 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring'

function ReportFields({
  idPrefix,
  draft,
  models,
  onChange,
}: {
  idPrefix: string
  draft: Draft
  models: DataReportModelOption[]
  onChange: (patch: Partial<Draft>) => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-model`}>{t('app.myReports.model')}</Label>
        <SelectShell>
          <select
            id={`${idPrefix}-model`}
            className={selectClass}
            value={draft.modelId}
            onChange={(e) => onChange({ modelId: e.target.value })}
          >
            <option value="">—</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>
        </SelectShell>
        <p className="text-[12px] text-fg-3">{t('app.myReports.modelOptional')}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-kind`}>{t('app.myReports.kind')}</Label>
        <SelectShell>
          <select
            id={`${idPrefix}-kind`}
            className={selectClass}
            value={draft.kind}
            onChange={(e) => onChange({ kind: e.target.value as DataReportKind })}
          >
            {DATA_REPORT_KINDS.map((k) => (
              <option key={k} value={k}>
                {t(REPORT_KIND_I18N_KEY[k])}
              </option>
            ))}
          </select>
        </SelectShell>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-detail`}>{t('app.myReports.detail')}</Label>
        <Textarea
          id={`${idPrefix}-detail`}
          required
          rows={4}
          maxLength={DETAIL_MAX}
          value={draft.detail}
          placeholder={t('app.myReports.detailPlaceholder')}
          onChange={(e) => onChange({ detail: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-source`}>{t('app.myReports.sourceUrl')}</Label>
        <Input
          id={`${idPrefix}-source`}
          type="url"
          maxLength={SOURCE_URL_MAX}
          value={draft.sourceUrl}
          placeholder="https://"
          onChange={(e) => onChange({ sourceUrl: e.target.value })}
        />
      </div>
    </>
  )
}

function statusLabel(t: (key: string) => string, status: DataReportStatus): string {
  return t(`app.myReports.status.${status}`)
}

export function MyDataReports({
  rows,
  email,
  models,
}: {
  rows: DataReportRow[]
  email: string
  models: DataReportModelOption[]
}) {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const [createDraft, setCreateDraft] = useState<Draft>(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY)
  const [busy, setBusy] = useState(false)
  const openCount = rows.filter((r) => r.status === 'open').length
  const atLimit = openCount >= OPEN_REPORT_LIMIT

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const { status } = await submitMyDataReportFn({ data: createDraft })
      if (status === 'submitted') {
        toast.success(t('app.myReports.submitted'))
        setCreateDraft(EMPTY)
        void router.invalidate()
        return
      }
      if (status === 'limit') toast.error(t('app.myReports.limit', { n: OPEN_REPORT_LIMIT }))
      else if (status === 'rate-limited') toast.error(t('app.myReports.rateLimited'))
      else if (status === 'invalid') toast.error(t('app.myReports.invalid'))
      else if (status === 'auth') {
        // The loader gates this page, so this only happens when the session
        // expired mid-form. Send the reader to login and come back here.
        void router.navigate({
          to: '/{-$locale}/login',
          search: { next: localizePath(locale, '/app/reports') },
        })
      } else toast.error(t('app.myReports.error'))
    } finally {
      setBusy(false)
    }
  }

  async function save(id: string) {
    setBusy(true)
    try {
      const r = await updateMyDataReportFn({ data: { id, ...editDraft } })
      if (!r.ok) {
        toast.error(r.reason === 'locked' ? t('app.myReports.saveFailed') : t('app.myReports.invalid'))
        return
      }
      toast.success(t('app.myReports.saved'))
      setEditingId(null)
      void router.invalidate()
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t('app.myReports.deleteConfirm'))) return
    const { deleted } = await deleteMyDataReportFn({ data: { id } })
    if (deleted) {
      toast.success(t('app.myReports.deleted'))
      if (editingId === id) setEditingId(null)
      void router.invalidate()
    } else {
      toast.error(t('app.myReports.deleteFailed'))
    }
  }

  return (
    <>
      <Card className="max-w-2xl p-5">
        <h2 className="m-0 mb-4 text-[15px] font-semibold">{t('app.myReports.newTitle')}</h2>
        <form onSubmit={create} className="grid gap-3.5">
          <ReportFields
            idPrefix="report-new"
            draft={createDraft}
            models={models}
            onChange={(patch) => setCreateDraft((d) => ({ ...d, ...patch }))}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy || atLimit}>
              {busy ? t('app.myReports.submitting') : t('app.myReports.submit')}
            </Button>
            <span className="text-[12px] text-fg-3">
              {t('app.myReports.filedFrom', { email })}
            </span>
          </div>
          {atLimit && (
            <p className="m-0 text-[13px] text-fg-3">
              {t('app.myReports.limit', { n: OPEN_REPORT_LIMIT })}
            </p>
          )}
        </form>
      </Card>

      <div className="mt-8 max-w-2xl">
        <h2 className="m-0 mb-1 text-[15px] font-semibold">
          {t('app.myReports.title')} ({rows.length})
        </h2>
        <p className="m-0 mb-3 text-[13px] text-fg-3">{t('app.myReports.lockedHint')}</p>
        {rows.length === 0 && <p className="text-sm text-fg-3">{t('app.myReports.empty')}</p>}
        <div className="grid gap-3">
          {rows.map((r) => {
            const status = r.status as DataReportStatus
            const editing = editingId === r.id
            return (
              <Card key={r.id} className="p-4">
                {editing ? (
                  <form
                    className="grid gap-3.5"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void save(r.id)
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="m-0 text-[14px] font-semibold">{t('app.myReports.editTitle')}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={t('app.myReports.cancel')}
                        onClick={() => setEditingId(null)}
                      >
                        <X size={15} />
                      </Button>
                    </div>
                    <ReportFields
                      idPrefix={`report-${r.id}`}
                      draft={editDraft}
                      models={models}
                      onChange={(patch) => setEditDraft((d) => ({ ...d, ...patch }))}
                    />
                    <div className="flex items-center gap-2">
                      <Button type="submit" size="sm" disabled={busy}>
                        {t('app.myReports.save')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        {t('app.myReports.cancel')}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          {t(REPORT_KIND_I18N_KEY[r.kind as DataReportKind] ?? 'dataQuality.report.kindOther')}
                        </span>
                        {r.modelId && <span className="text-[12px] text-fg-3">{r.modelId}</span>}
                        <Badge variant={STATUS_VARIANT[status] ?? 'free'}>
                          {statusLabel(t, status)}
                        </Badge>
                      </div>
                      <p className="mb-0 mt-1.5 max-w-[60ch] text-sm text-fg-2">{r.detail}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-fg-3">
                        <span>{fmtDateTime(r.createdAt)}</span>
                        {r.sourceUrl && (
                          <>
                            <span>·</span>
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
                    {status === 'open' && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={t('app.myReports.edit')}
                          title={t('app.myReports.edit')}
                          onClick={() => {
                            setEditDraft(draftFrom(r))
                            setEditingId(r.id)
                          }}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={t('app.myReports.delete')}
                          title={t('app.myReports.delete')}
                          onClick={() => void remove(r.id)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </>
  )
}
