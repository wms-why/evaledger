import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowUp, ArrowDown, Trash2, Plus, RefreshCw, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/features/auth/auth.client'
import { AppShell } from '@/components/app/app-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/features/i18n/provider'
import {
  listAiProvidersFn,
  upsertAiProviderFn,
  deleteAiProviderFn,
  setAiProviderEnabledFn,
  reorderAiProviderFn,
  pingAiProviderFn,
} from '@/features/admin/middleware'
import type { ProviderKind } from '@/features/ai-providers'

interface AIProviderRow {
  id: string
  kind: ProviderKind
  label: string
  model: string
  baseUrlOverride: string | null
  enabled: boolean
  priority: number
  maxTokensCap: number | null
  lastError: string | null
  lastErrorAt: number | null
  createdAt: number
  updatedAt: number
}

interface PingResult {
  health: { ok: boolean; detail?: string }
  balance: { ok: boolean; remaining?: number | string; currency?: string; detail?: string }
}

export const Route = createFileRoute('/{-$locale}/admin/ai-providers')({
  loader: () => listAiProvidersFn(),
  component: AIProvidersAdmin,
})

const KIND_LABEL: Record<ProviderKind, string> = {
  mmx: 'MiniMax',
  deepseek: 'DeepSeek',
  replicate: 'Replicate',
}

function relativeTime(ms: number | null): string {
  if (!ms) return '—'
  const diff = Date.now() - ms
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
  return `${Math.round(diff / 86_400_000)}d ago`
}

interface RowProps {
  row: AIProviderRow
  index: number
  total: number
  onMutated: () => void
}

function ProviderRow({ row, index, total, onMutated }: RowProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [ping, setPing] = useState<PingResult | null>(null)

  async function toggle() {
    setBusy(true)
    try {
      await setAiProviderEnabledFn({ data: { id: row.id, enabled: !row.enabled } })
      onMutated()
    } finally { setBusy(false) }
  }
  async function move(direction: 'up' | 'down') {
    setBusy(true)
    try {
      await reorderAiProviderFn({ data: { id: row.id, direction } })
      onMutated()
    } finally { setBusy(false) }
  }
  async function remove() {
    if (!confirm(t('admin.deleteProviderConfirm'))) return
    setBusy(true)
    try {
      await deleteAiProviderFn({ data: { id: row.id } })
      toast.success(t('admin.saved'))
      onMutated()
    } finally { setBusy(false) }
  }
  async function pingIt() {
    setBusy(true)
    try {
      const r = await pingAiProviderFn({ data: { id: row.id } })
      setPing(r as PingResult)
    } finally { setBusy(false) }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={row.enabled ? 'pro' : 'free'}>{KIND_LABEL[row.kind]}</Badge>
            <span className="font-semibold">{row.label}</span>
            <code className="text-xs text-fg-3">{row.model}</code>
            {row.baseUrlOverride && <code className="text-[11px] text-fg-3">↳ {row.baseUrlOverride}</code>}
            {row.maxTokensCap != null && (
              <Badge variant="warn">cap {row.maxTokensCap}</Badge>
            )}
          </div>
          <div className="mt-2 grid gap-1 text-xs text-fg-3">
            <div>
              <span>priority {row.priority}</span>
              {row.lastError && (
                <span className="ml-3 text-warn">⚠ {row.lastError.slice(0, 120)}{row.lastError.length > 120 ? '…' : ''} ({relativeTime(row.lastErrorAt)})</span>
              )}
            </div>
            {ping && (
              <div className="mt-1 rounded border border-input bg-bg-alt p-2 text-[11px]">
                <div className={ping.health.ok ? 'text-ok' : 'text-warn'}>
                  health: {ping.health.ok ? 'ok' : 'fail'}{ping.health.detail ? ` — ${ping.health.detail}` : ''}
                </div>
                <div className={ping.balance.ok ? 'text-ok' : 'text-warn'}>
                  balance: {ping.balance.ok ? 'ok' : 'fail'}
                  {ping.balance.remaining != null && <> · {String(ping.balance.remaining)} {ping.balance.currency ?? ''}</>}
                  {ping.balance.detail && <> · {ping.balance.detail}</>}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              checked={row.enabled}
              onChange={toggle}
              disabled={busy}
              aria-label={t('admin.providerEnabled')}
            />
          </div>
          <Button size="icon" variant="ghost" disabled={busy || index === 0} onClick={() => move('up')} aria-label={t('admin.moveUp')}>
            <ArrowUp size={15} />
          </Button>
          <Button size="icon" variant="ghost" disabled={busy || index === total - 1} onClick={() => move('down')} aria-label={t('admin.moveDown')}>
            <ArrowDown size={15} />
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={pingIt}>
            <RefreshCw size={13} className="mr-1" /> {t('admin.testConnection')}
          </Button>
          <Button size="icon" variant="ghost" disabled={busy} aria-label={t('admin.editProvider')} onClick={() => router.invalidate()}>
            <Pencil size={15} />
          </Button>
          <Button size="icon" variant="ghost" disabled={busy} onClick={remove} aria-label={t('admin.deleteProvider')}>
            <Trash2 size={15} />
          </Button>
        </div>
      </div>
    </Card>
  )
}

interface EditorProps {
  initial?: AIProviderRow | null
  onSaved: () => void
  onCancel: () => void
}

function ProviderEditor({ initial, onSaved, onCancel }: EditorProps) {
  const { t } = useTranslation()
  const isEdit = !!initial
  const [kind, setKind] = useState<ProviderKind>(initial?.kind ?? 'deepseek')
  const [label, setLabel] = useState(initial?.label ?? 'New provider')
  const [model, setModel] = useState(initial?.model ?? 'deepseek-chat')
  const [baseUrlOverride, setBaseUrlOverride] = useState(initial?.baseUrlOverride ?? '')
  const [priority, setPriority] = useState<number>(initial?.priority ?? 100)
  const [maxTokensCap, setMaxTokensCap] = useState<number | ''>(initial?.maxTokensCap ?? '')
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      await upsertAiProviderFn({
        data: {
          id: initial?.id,
          kind,
          label,
          model,
          baseUrlOverride: baseUrlOverride || null,
          enabled,
          priority,
          maxTokensCap: maxTokensCap === '' ? null : Number(maxTokensCap),
        },
      })
      toast.success(t('admin.saved'))
      onSaved()
    } finally { setBusy(false) }
  }

  return (
    <Card className="border-primary/40 p-4">
      <h2 className="mb-3 font-semibold">{isEdit ? t('admin.editProvider') : t('admin.addProvider')}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-fg-2">{t('admin.providerKind')}</span>
          <select
            className="mt-1 block h-[38px] w-full rounded-[7px] border border-input bg-background px-3 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as ProviderKind)}
            disabled={isEdit}
          >
            <option value="mmx">{t('admin.providerKindMmx')}</option>
            <option value="deepseek">{t('admin.providerKindDeepSeek')}</option>
            <option value="replicate">{t('admin.providerKindReplicate')}</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-fg-2">{t('admin.providerLabel')}</span>
          <Input className="mt-1 h-[38px]" value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-fg-2">{t('admin.providerModel')}</span>
          <Input className="mt-1 h-[38px]" value={model} onChange={(e) => setModel(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-fg-2">{t('admin.providerBaseUrl')}</span>
          <Input className="mt-1 h-[38px]" value={baseUrlOverride ?? ''} onChange={(e) => setBaseUrlOverride(e.target.value)} placeholder="(default)" />
        </label>
        <label className="block text-sm">
          <span className="text-fg-2">{t('admin.providerPriority')}</span>
          <Input type="number" className="mt-1 h-[38px]" value={priority} onChange={(e) => setPriority(parseInt(e.target.value, 10) || 100)} />
        </label>
        <label className="block text-sm">
          <span className="text-fg-2">{t('admin.providerMaxTokensCap')}</span>
          <Input type="number" className="mt-1 h-[38px]" value={maxTokensCap} onChange={(e) => setMaxTokensCap(e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="(uncapped)" />
        </label>
        <div className="flex items-end gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-primary"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            aria-label={t('admin.providerEnabled')}
          />
          <Label>{t('admin.providerEnabled')}</Label>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={onCancel}>{t('feedback.cancel')}</Button>
        <Button size="sm" disabled={busy || !label || !model} onClick={save}>{t('admin.save')}</Button>
      </div>
    </Card>
  )
}

function AIProvidersAdmin() {
  const rows = Route.useLoaderData() as AIProviderRow[]
  const { data: session } = authClient.useSession()
  const { t } = useTranslation()
  const router = useRouter()
  const [editing, setEditing] = useState<AIProviderRow | null>(null)
  const [adding, setAdding] = useState(false)
  const refresh = () => void router.invalidate()
  return (
    <AppShell
      user={{ name: session?.user?.name, email: session?.user?.email ?? '', role: session?.user?.role ?? 'admin', image: session?.user?.image ?? null }}
      active="admin-ai-providers"
      crumb={t('admin.navAdmin')}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-h">{t('admin.aiProviders')} ({rows.length})</h1>
          <p className="mt-1.5 text-[14.5px] text-fg-2">{t('admin.aiProvidersSub')}</p>
        </div>
        <Button onClick={() => setAdding(true)} size="sm">
          <Plus size={15} className="mr-1" /> {t('admin.addProvider')}
        </Button>
      </div>
      {adding && (
        <div className="mb-4">
          <ProviderEditor initial={null} onSaved={() => { setAdding(false); refresh() }} onCancel={() => setAdding(false)} />
        </div>
      )}
      {editing && (
        <div className="mb-4">
          <ProviderEditor initial={editing} onSaved={() => { setEditing(null); refresh() }} onCancel={() => setEditing(null)} />
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-fg-3">{t('admin.noProviders')}</p>
      ) : (
        <div className="grid max-w-3xl gap-3">
          {rows.map((r, i) => (
            <div key={r.id}>
              <ProviderRow row={r} index={i} total={rows.length} onMutated={refresh} />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
