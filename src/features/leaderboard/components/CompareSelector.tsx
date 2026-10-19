import { ArrowLeftRight } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { LEADERBOARD } from '../models'

export function CompareSelector({
  a,
  b,
  onChange,
}: {
  a: string
  b: string
  onChange: (a: string, b: string) => void
}) {
  const { t } = useTranslation()
  const models = LEADERBOARD.models

  return (
    <div className="flex flex-col items-stretch gap-2 rounded-[14px] border border-border bg-card p-3 sm:flex-row sm:items-center">
      <select
        aria-label={t('leaderboard.compare.modelA')}
        value={a}
        onChange={(e) => onChange(e.target.value, b)}
        className="flex-1 rounded-md border border-border bg-bg-alt px-3 py-2 text-[14px] focus:border-foreground focus:outline-none"
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName}
          </option>
        ))}
      </select>

      <button
        type="button"
        aria-label={t('leaderboard.compare.swap')}
        onClick={() => onChange(b, a)}
        className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-fg-2 transition-colors hover:bg-bg-alt hover:text-foreground"
      >
        <ArrowLeftRight size={16} />
      </button>

      <select
        aria-label={t('leaderboard.compare.modelB')}
        value={b}
        onChange={(e) => onChange(a, e.target.value)}
        className="flex-1 rounded-md border border-border bg-bg-alt px-3 py-2 text-[14px] focus:border-foreground focus:outline-none"
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName}
          </option>
        ))}
      </select>
    </div>
  )
}
