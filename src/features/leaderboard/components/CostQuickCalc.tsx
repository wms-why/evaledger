import { useMemo, useState } from 'react'
import { useTranslation } from '@/features/i18n/provider'
import { calculateCost } from '@/features/calculator/cost'
import { cn } from '@/lib/utils'
import type { LeaderboardModel } from '../types'
import { formatPrice } from './PriceCell'

const DEFAULTS = { calls: 10_000, inputTokens: 4_000, outputTokens: 1_000 }

function monthlyCost(model: LeaderboardModel, calls: number, input: number, output: number) {
  if (!model.priceId) return undefined
  try {
    // Peak pricing (calculateCost default) so numbers match the calculator
    // page and the "off-peak ignored" note below.
    return calculateCost(model.priceId, calls * input, calls * output).totalCost
  } catch {
    return undefined
  }
}

/** "What would 1,000 calls a month cost?" — the compare-page calculator embed. */
export function CostQuickCalc({ a, b }: { a: LeaderboardModel; b: LeaderboardModel }) {
  const { t } = useTranslation()
  const [calls, setCalls] = useState(DEFAULTS.calls)
  const [input, setInput] = useState(DEFAULTS.inputTokens)
  const [output, setOutput] = useState(DEFAULTS.outputTokens)

  const costA = useMemo(() => monthlyCost(a, calls, input, output), [a, calls, input, output])
  const costB = useMemo(() => monthlyCost(b, calls, input, output), [b, calls, input, output])

  const cheapest = costA != null && costB != null ? (costA < costB ? 'a' : 'b') : undefined

  const fields: Array<{ label: string; value: number; set: (n: number) => void }> = [
    { label: t('leaderboard.compare.callsPerMonth'), value: calls, set: setCalls },
    { label: t('leaderboard.compare.inputTokens'), value: input, set: setInput },
    { label: t('leaderboard.compare.outputTokens'), value: output, set: setOutput },
  ]

  return (
    <section className="rounded-[14px] border border-border bg-card p-5">
      <h3 className="text-[15px] font-semibold text-foreground">{t('leaderboard.compare.costTitle')}</h3>
      <p className="mt-1 text-[13px] text-fg-3">{t('leaderboard.compare.costSubtitle')}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {fields.map((f) => (
          <label key={f.label} className="flex flex-col gap-1 text-[12px] text-fg-2">
            {f.label}
            <input
              type="number"
              min={0}
              value={f.value}
              onChange={(e) => f.set(Math.max(0, Number(e.target.value)))}
              className="rounded-md border border-border bg-bg-alt px-3 py-2 text-[14px] tabular-nums focus:border-foreground focus:outline-none"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {([
          [a, costA, 'a'],
          [b, costB, 'b'],
        ] as const).map(([model, cost, side]) => (
          <div
            key={model.id}
            className={cn(
              'rounded-[12px] border px-4 py-3',
              cheapest === side ? 'border-primary/40 bg-soft' : 'border-border bg-bg-alt',
            )}
          >
            <div className="text-[13px] text-fg-2">{model.displayName}</div>
            <div className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">
              {cost != null ? formatPrice(cost) : '—'}
              <span className="ml-1 text-[12px] font-normal text-fg-3">{t('leaderboard.perMonth')}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-fg-3">{t('leaderboard.compare.costNote')}</p>
    </section>
  )
}
