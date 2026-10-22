import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/features/i18n/provider'
import { localizePath } from '@/features/i18n/locale'
import { submitMyDataReportFn } from '../data-report.actions'
import {
  DATA_REPORT_KINDS,
  DETAIL_MAX,
  OPEN_REPORT_LIMIT,
  REPORT_KIND_I18N_KEY,
  SOURCE_URL_MAX,
  isDataReportKind,
  type DataReportKind,
} from '../data-report.shared'

/**
 * The public correction form.
 *
 * Filing requires an account: the report belongs to the reader, so they can
 * edit or withdraw it until triage, and we can tell them when the problem is
 * fixed. Anonymous visitors therefore see a short explanation and a link to
 * `/login?next=…` — never a fillable form that would be thrown away by the
 * OAuth round trip.
 *
 * The form keeps the draft in sessionStorage across that round trip (and
 * across an expired session), and posts to the same server function the
 * dashboard uses. There is no anonymous submit endpoint.
 */

export interface DataReportModelOption {
  id: string
  displayName: string
}

/** The signed-in visitor: the account email is the contact address. */
export interface DataReportViewer {
  email: string
}

interface Draft {
  modelId: string
  kind: DataReportKind
  detail: string
  sourceUrl: string
}

const EMPTY: Draft = { modelId: '', kind: 'stale-price', detail: '', sourceUrl: '' }

const DRAFT_KEY = 'evaledger:data-report:draft'

/** Session-scoped draft: OAuth is a full-page trip, but the browser keeps it. */
function readDraft(): Draft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Draft>
    return {
      modelId: typeof parsed.modelId === 'string' ? parsed.modelId : '',
      kind: isDataReportKind(parsed.kind) ? parsed.kind : 'stale-price',
      detail: typeof parsed.detail === 'string' ? parsed.detail.slice(0, DETAIL_MAX) : '',
      sourceUrl:
        typeof parsed.sourceUrl === 'string' ? parsed.sourceUrl.slice(0, SOURCE_URL_MAX) : '',
    }
  } catch {
    return null
  }
}

function writeDraft(draft: Draft): void {
  if (typeof window === 'undefined') return
  try {
    const empty = !draft.modelId && !draft.detail && !draft.sourceUrl
    if (empty) window.sessionStorage.removeItem(DRAFT_KEY)
    else window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Storage is a convenience, not a guarantee (private mode can throw).
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

/**
 * The anonymous state: say why an account is needed before asking for one, and
 * name the three things the form will ask for so nobody logs in blind.
 */
function SignInGate({ next }: { next: string }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-[10px] border border-border bg-bg-alt/60 p-5">
      <div className="flex items-center gap-2">
        <LockKeyhole size={16} className="text-fg-3" aria-hidden="true" />
        <h3 className="m-0 text-[15px] font-semibold">{t('dataQuality.report.signInTitle')}</h3>
      </div>
      <p className="mb-0 mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-fg-2">
        {t('dataQuality.report.signInBody')}
      </p>
      <ul className="mb-0 mt-3 flex list-disc flex-col gap-1 pl-5 text-[13px] leading-relaxed text-fg-2">
        <li>{t('dataQuality.report.signInPointModel')}</li>
        <li>{t('dataQuality.report.signInPointDetail')}</li>
        <li>{t('dataQuality.report.signInPointSource')}</li>
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button asChild>
          <Link to="/{-$locale}/login" search={{ next }}>
            {t('dataQuality.report.signInCta')}
          </Link>
        </Button>
        <span className="text-[12.5px] text-fg-3">{t('dataQuality.report.signInNote')}</span>
      </div>
    </div>
  )
}

export function DataReportForm({
  models,
  viewer,
}: {
  models: DataReportModelOption[]
  viewer: DataReportViewer | null
}) {
  const { t, locale } = useTranslation()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [restored, setRestored] = useState(false)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'err' | 'auth'; text: string } | null>(null)

  // Restore after mount (not during render) so SSR and hydration agree, then
  // mirror every edit back to sessionStorage.
  useEffect(() => {
    const saved = readDraft()
    if (saved) setDraft(saved)
    setRestored(true)
  }, [])

  useEffect(() => {
    if (restored) writeDraft(draft)
  }, [restored, draft])

  const next = `${localizePath(locale, '/data-quality')}#data-quality-report`

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      const { status } = await submitMyDataReportFn({ data: draft })
      if (status === 'submitted') {
        setDone(true)
        setDraft(EMPTY)
        return
      }
      if (status === 'auth') {
        // Session expired mid-form: keep the draft, send the reader to login.
        setMessage({ kind: 'auth', text: t('dataQuality.report.authExpired') })
      } else if (status === 'rate-limited') {
        setMessage({ kind: 'err', text: t('dataQuality.report.rateLimited') })
      } else if (status === 'limit') {
        setMessage({ kind: 'err', text: t('dataQuality.report.limit', { n: OPEN_REPORT_LIMIT }) })
      } else if (status === 'invalid') {
        setMessage({ kind: 'err', text: t('dataQuality.report.invalid') })
      } else {
        setMessage({ kind: 'err', text: t('dataQuality.report.error') })
      }
    } catch {
      setMessage({ kind: 'err', text: t('dataQuality.report.error') })
    } finally {
      setBusy(false)
    }
  }

  if (!viewer) return <SignInGate next={next} />

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <p className="m-0 text-sm text-success">{t('dataQuality.report.success')}</p>
        <p className="m-0 max-w-[62ch] text-[13px] leading-relaxed text-fg-3">
          {t('dataQuality.report.successHint')}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button
            type="button"
            onClick={() => {
              setDone(false)
              setMessage(null)
            }}
          >
            {t('dataQuality.report.fileAnother')}
          </Button>
          <Link
            to="/{-$locale}/app/reports"
            className="text-[13px] text-primary underline-offset-4 hover:underline"
          >
            {t('dataQuality.report.myReports')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="data-report-model">{t('dataQuality.report.model')}</Label>
        <SelectShell>
          <select
            id="data-report-model"
            className={selectClass}
            value={draft.modelId}
            onChange={(e) => setDraft((d) => ({ ...d, modelId: e.target.value }))}
          >
            <option value="">—</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>
        </SelectShell>
        <p className="text-[12px] text-fg-3">{t('dataQuality.report.modelOptional')}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="data-report-kind">{t('dataQuality.report.kind')}</Label>
        <SelectShell>
          <select
            id="data-report-kind"
            className={selectClass}
            value={draft.kind}
            onChange={(e) =>
              setDraft((d) => ({ ...d, kind: e.target.value as DataReportKind }))
            }
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
        <Label htmlFor="data-report-detail">{t('dataQuality.report.detail')}</Label>
        <Textarea
          id="data-report-detail"
          required
          maxLength={DETAIL_MAX}
          value={draft.detail}
          placeholder={t('dataQuality.report.detailPlaceholder')}
          onChange={(e) => setDraft((d) => ({ ...d, detail: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="data-report-source">{t('dataQuality.report.sourceUrl')}</Label>
        <Input
          id="data-report-source"
          type="url"
          maxLength={SOURCE_URL_MAX}
          value={draft.sourceUrl}
          placeholder="https://"
          onChange={(e) => setDraft((d) => ({ ...d, sourceUrl: e.target.value }))}
        />
      </div>

      {message &&
        (message.kind === 'auth' ? (
          <p className="m-0 rounded-[8px] border border-border bg-bg-alt/60 px-3 py-2 text-sm text-fg-2">
            {message.text}{' '}
            <Link
              to="/{-$locale}/login"
              search={{ next }}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('auth.login')}
            </Link>
          </p>
        ) : (
          <p className="m-0 text-sm text-destructive">{message.text}</p>
        ))}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" disabled={busy}>
          {busy ? t('dataQuality.report.submitting') : t('dataQuality.report.submit')}
        </Button>
        <span className="text-[12px] text-fg-3">
          {t('dataQuality.report.filedFrom', { email: viewer.email })}
          {' · '}
          <Link
            to="/{-$locale}/app/reports"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t('dataQuality.report.myReports')}
          </Link>
        </span>
      </div>
    </form>
  )
}
