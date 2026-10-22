import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useTurnstile } from '@/features/auth/components/turnstile'
import { useTranslation } from '@/features/i18n/provider'
import { submitDataReportFn } from '../data-report.actions'
import { DATA_REPORT_KINDS, OPEN_REPORT_LIMIT, REPORT_KIND_I18N_KEY, type DataReportKind } from '../data-report.shared'

/**
 * The public correction form.
 *
 * No account needed: a reader who spots a stale price should be able to say
 * so in ten seconds. Everything but the "what is wrong" field is optional,
 * and the bot dampers live on the server.
 */

export interface DataReportModelOption {
  id: string
  displayName: string
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

export function DataReportForm({
  models,
  turnstileSiteKey,
}: {
  models: DataReportModelOption[]
  turnstileSiteKey: string | null
}) {
  const { t } = useTranslation()
  const { token, widget, reset } = useTurnstile(turnstileSiteKey)
  const [modelId, setModelId] = useState('')
  const [kind, setKind] = useState<DataReportKind>('stale-price')
  const [detail, setDetail] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      const { status } = await submitDataReportFn({
        data: { modelId, kind, detail, sourceUrl, email, turnstileToken: token ?? '' },
      })
      if (status === 'submitted') {
        setMessage({ kind: 'ok', text: t('dataQuality.report.success') })
        setDetail('')
        setSourceUrl('')
      } else if (status === 'rate-limited') {
        setMessage({ kind: 'err', text: t('dataQuality.report.rateLimited') })
      } else if (status === 'limit') {
        setMessage({
          kind: 'err',
          text: t('dataQuality.report.limit', { n: OPEN_REPORT_LIMIT }),
        })
      } else {
        setMessage({ kind: 'err', text: t('dataQuality.report.error') })
      }
      // Any failure burns the Turnstile token (siteverify accepts it once), so
      // a retry needs a fresh one — otherwise the retry always fails.
      if (status !== 'submitted') reset()
    } catch {
      setMessage({ kind: 'err', text: t('dataQuality.report.error') })
      reset()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="data-report-model">{t('dataQuality.report.model')}</Label>
        <SelectShell>
          <select
            id="data-report-model"
            className={selectClass}
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
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
            value={kind}
            onChange={(e) => setKind(e.target.value as DataReportKind)}
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
          value={detail}
          placeholder={t('dataQuality.report.detailPlaceholder')}
          onChange={(e) => setDetail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="data-report-source">{t('dataQuality.report.sourceUrl')}</Label>
        <Input
          id="data-report-source"
          type="url"
          value={sourceUrl}
          placeholder="https://"
          onChange={(e) => setSourceUrl(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="data-report-email">{t('dataQuality.report.email')}</Label>
        <Input
          id="data-report-email"
          type="email"
          value={email}
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-[12px] text-fg-3">{t('dataQuality.report.emailOptional')}</p>
      </div>

      {widget}

      {message && (
        <p className={message.kind === 'ok' ? 'text-sm text-success' : 'text-sm text-destructive'}>
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={busy} className="self-start">
        {busy ? t('dataQuality.report.submitting') : t('dataQuality.report.submit')}
      </Button>
    </form>
  )
}
