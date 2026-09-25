import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '@/features/i18n/provider'
import { Tabs } from './components/Tabs'
import { Slider } from './components/Slider'
import { ResultsGrid, type SortMode } from './components/ResultsGrid'
import {
  DEFAULT_PRESET_ID,
  OUTPUT_PRESETS,
  findPreset,
} from './pricing-tier'
import { countTokens, type TokenCount, type TokenizerFamily } from './tokenize'
import { calculateAll } from './cost'
import { REGISTRY } from './model-prices'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const TOKENIZER_FAMILIES: TokenizerFamily[] = [
  'gpt-5',
  'gpt-4',
  'o-series',
  'claude-opus',
  'claude-sonnet',
  'claude-haiku',
  'gemini-2.5',
  'grok-4',
  'deepseek-v3',
  'deepseek-r1',
]

const FAMILY_KEYS: Record<TokenizerFamily, string> = {
  'gpt-5': 'calculator.familyGpt5',
  'gpt-4': 'calculator.familyGpt4',
  'o-series': 'calculator.familyOSeries',
  'claude-opus': 'calculator.familyClaudeOpus',
  'claude-sonnet': 'calculator.familyClaudeSonnet',
  'claude-haiku': 'calculator.familyClaudeHaiku',
  'gemini-2.5': 'calculator.familyGemini25',
  'grok-4': 'calculator.familyGrok4',
  'deepseek-v3': 'calculator.familyDeepSeekV3',
  'deepseek-r1': 'calculator.familyDeepSeekR1',
}

type InputMode = 'paste' | 'manual'

export interface CalculatorProps {
  /** Optional initial state — useful for SSR-embedded shareable links. */
  initialMonthly?: number
  initialInputTokens?: number
  initialOutputTokens?: number
  initialPresetId?: string
}

/**
 * The main calculator component. Orchestrates:
 *  - Two input modes (paste text | enter monthly usage)
 *  - Real tokenization for OpenAI families, CJK-aware approximation otherwise
 *  - Live recompute of every model card on input change
 *  - Sort + provider filter on the results grid
 *  - Copy-estimate-to-clipboard for shareable results
 */
export function Calculator(props: CalculatorProps) {
  const { t } = useTranslation()
  const {
    initialMonthly = 1000,
    initialInputTokens = 2000,
    initialOutputTokens = 400,
    initialPresetId = DEFAULT_PRESET_ID,
  } = props

  // ───── State ─────
  const [mode, setMode] = useState<InputMode>('manual')
  const [text, setText] = useState('')
  const [tokenizerFamily, setTokenizerFamily] = useState<TokenizerFamily>('gpt-5')
  const [tokenCount, setTokenCount] = useState<TokenCount | null>(null)
  const [tokenizerPending, setTokenizerPending] = useState(false)

  const [monthly, setMonthly] = useState(initialMonthly)
  const [inputTokens, setInputTokens] = useState(initialInputTokens)
  const [outputTokens, setOutputTokens] = useState(initialOutputTokens)
  const [presetId, setPresetId] = useState(initialPresetId)
  const [useCached, setUseCached] = useState(false)

  const [sortBy, setSortBy] = useState<SortMode>('cheapest')
  const [providerFilter, setProviderFilter] = useState('all')
  const [copied, setCopied] = useState(false)

  // ───── Async tokenize on text change ─────
  useEffect(() => {
    if (mode !== 'paste' || text.length === 0) {
      setTokenCount(null)
      return
    }
    let cancelled = false
    setTokenizerPending(true)
    countTokens(text, tokenizerFamily).then((r) => {
      if (cancelled) return
      setTokenCount(r)
      setTokenizerPending(false)
    })
    return () => {
      cancelled = true
    }
  }, [text, tokenizerFamily, mode])

  // ───── Compute monthly token totals ─────
  const { totalInput, totalOutput, singleInput, singleOutput } = useMemo(() => {
    if (mode === 'paste' && tokenCount) {
      const single = tokenCount.tokens
      const ratio = findPreset(presetId).ratio
      const singleOut = Math.max(1, Math.round(single * ratio))
      return {
        singleInput: single,
        singleOutput: singleOut,
        totalInput: single * monthly,
        totalOutput: singleOut * monthly,
      }
    }
    return {
      singleInput: inputTokens,
      singleOutput: outputTokens,
      totalInput: inputTokens * monthly,
      totalOutput: outputTokens * monthly,
    }
  }, [mode, tokenCount, presetId, monthly, inputTokens, outputTokens])

  // ───── Compute all model breakdowns ─────
  const breakdowns = useMemo(
    () => calculateAll(totalInput, totalOutput, { useCachedInput: useCached }),
    [totalInput, totalOutput, useCached],
  )

  // ───── Copy estimate to clipboard ─────
  async function handleCopy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    const lines = breakdowns.map((b) => {
      const m = REGISTRY.models.find((x) => x.id === b.modelId)
      return `${m?.displayName ?? b.modelId}: $${b.totalCost.toFixed(4)}/mo (${b.appliedRule})`
    })
    const summary = [
      `Token Cost Calculator — ${monthly.toLocaleString()} requests/mo`,
      mode === 'paste'
        ? `${tokenCount?.tokens ?? 0} input tokens × ${findPreset(presetId).ratio} output ratio`
        : `${inputTokens} input + ${outputTokens} output tokens per request`,
      '',
      ...lines,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore — copy is best-effort
    }
  }

  // ───── Render ─────
  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border border-border bg-card p-5 md:p-6">
        <Tabs
          activeId={mode}
          onChange={(id) => setMode(id as InputMode)}
          tabs={[
            {
              id: 'paste',
              label: t('calculator.tabPaste'),
              node: (
                <PasteTextPanel
                  text={text}
                  onText={setText}
                  tokenizerFamily={tokenizerFamily}
                  onFamily={setTokenizerFamily}
                  familyLabel={(f) => t(FAMILY_KEYS[f])}
                  monthly={monthly}
                  onMonthly={setMonthly}
                  presetId={presetId}
                  onPreset={setPresetId}
                  tokenCount={tokenCount}
                  pending={tokenizerPending}
                />
              ),
            },
            {
              id: 'manual',
              label: t('calculator.tabManual'),
              node: (
                <ManualPanel
                  monthly={monthly}
                  onMonthly={setMonthly}
                  inputTokens={inputTokens}
                  onInputTokens={setInputTokens}
                  outputTokens={outputTokens}
                  onOutputTokens={setOutputTokens}
                />
              ),
            },
          ]}
        />

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-[12px]">
          <label className="inline-flex cursor-pointer items-center gap-2 text-fg-2">
            <input
              type="checkbox"
              checked={useCached}
              onChange={(e) => setUseCached(e.target.checked)}
              className="size-3.5 cursor-pointer accent-foreground"
            />
            {t('calculator.useCached')}
          </label>
          <span className="ml-auto text-fg-3">
            {monthly.toLocaleString()} × {singleInput.toLocaleString()}in + {singleOutput.toLocaleString()}out
            = <strong className="tabular-nums text-fg-2">{totalInput.toLocaleString()}</strong> input,
            <strong className="ml-1 tabular-nums text-fg-2">{totalOutput.toLocaleString()}</strong> output tokens
          </span>
        </div>
      </div>

      <ResultsGrid
        breakdowns={breakdowns}
        sortBy={sortBy}
        onSortChange={setSortBy}
        providerFilter={providerFilter}
        onProviderFilterChange={setProviderFilter}
        onCopy={handleCopy}
        copied={copied}
      />

      <p className="text-center text-[12px] text-fg-3">
        {t('calculator.freshness', { date: REGISTRY.fetchedAt })} ·{' '}
        <a
          href="/api/prices.json"
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          {t('calculator.apiLinkLabel')}
        </a>
      </p>
    </div>
  )
}

// ───── Paste-text sub-panel ─────
function PasteTextPanel({
  text,
  onText,
  tokenizerFamily,
  onFamily,
  familyLabel,
  monthly,
  onMonthly,
  presetId,
  onPreset,
  tokenCount,
  pending,
}: {
  text: string
  onText: (s: string) => void
  tokenizerFamily: TokenizerFamily
  onFamily: (f: TokenizerFamily) => void
  familyLabel: (f: TokenizerFamily) => string
  monthly: number
  onMonthly: (n: number) => void
  presetId: string
  onPreset: (id: string) => void
  tokenCount: TokenCount | null
  pending: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-fg-2">
          {t('calculator.pasteLabel')}
        </label>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => onText(e.target.value)}
          placeholder={t('calculator.pasteHint')}
          className="w-full resize-y rounded-md border border-border bg-bg-alt px-3 py-2 text-[13px] leading-relaxed focus:border-foreground focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1.5 block text-[12px] font-medium text-fg-2">
            {t('calculator.tokenizerLabel')}
          </label>
          <select
            value={tokenizerFamily}
            onChange={(e) => onFamily(e.target.value as TokenizerFamily)}
            className="w-full rounded-md border border-border bg-bg-alt px-3 py-2 text-[13px] focus:border-foreground focus:outline-none"
          >
            {TOKENIZER_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {familyLabel(f)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[180px] flex-1">
          <label className="mb-1.5 block text-[12px] font-medium text-fg-2">
            {t('calculator.outputPresetLabel')}
          </label>
          <select
            value={presetId}
            onChange={(e) => onPreset(e.target.value)}
            className="w-full rounded-md border border-border bg-bg-alt px-3 py-2 text-[13px] focus:border-foreground focus:outline-none"
          >
            {OUTPUT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({Math.round(p.ratio * 100)}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-fg-2">
          {t('calculator.monthlyLabel')}:{' '}
          <strong className="tabular-nums">{monthly.toLocaleString()}</strong>
        </label>
        <Slider
          value={monthly}
          min={1}
          max={1_000_000}
          step={1}
          ariaLabel={t('calculator.monthlyLabel')}
          formatValue={(v) => v.toLocaleString()}
          onChange={onMonthly}
        />
      </div>

      <TokenReadout tokenCount={tokenCount} pending={pending} />
    </div>
  )
}

// ───── Manual-entry sub-panel ─────
function ManualPanel({
  monthly,
  onMonthly,
  inputTokens,
  onInputTokens,
  outputTokens,
  onOutputTokens,
}: {
  monthly: number
  onMonthly: (n: number) => void
  inputTokens: number
  onInputTokens: (n: number) => void
  outputTokens: number
  onOutputTokens: (n: number) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-fg-2">
          {t('calculator.monthlyLabel')}:{' '}
          <strong className="tabular-nums">{monthly.toLocaleString()}</strong>
        </label>
        <Slider
          value={monthly}
          min={1}
          max={1_000_000}
          step={1}
          ariaLabel={t('calculator.monthlyLabel')}
          formatValue={(v) => v.toLocaleString()}
          onChange={onMonthly}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-fg-2">
          {t('calculator.inputTokensLabel')}:{' '}
          <strong className="tabular-nums">{inputTokens.toLocaleString()}</strong>
        </label>
        <Slider
          value={inputTokens}
          min={50}
          max={200_000}
          step={50}
          ariaLabel={t('calculator.inputTokensLabel')}
          formatValue={(v) => v.toLocaleString()}
          onChange={onInputTokens}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-fg-2">
          {t('calculator.outputTokensLabel')}:{' '}
          <strong className="tabular-nums">{outputTokens.toLocaleString()}</strong>
        </label>
        <Slider
          value={outputTokens}
          min={10}
          max={50_000}
          step={10}
          ariaLabel={t('calculator.outputTokensLabel')}
          formatValue={(v) => v.toLocaleString()}
          onChange={onOutputTokens}
        />
      </div>
    </div>
  )
}

// ───── Token count readout ─────
function TokenReadout({ tokenCount, pending }: { tokenCount: TokenCount | null; pending: boolean }) {
  const { t } = useTranslation()
  if (!tokenCount && !pending) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-md border border-border bg-bg-alt px-3 py-2 text-[12px]',
      )}
    >
      {pending && <Badge variant="free">{t('calculator.tokenCountLoading')}</Badge>}
      {tokenCount && (
        <>
          <span className="text-fg-2">{t('calculator.tokenCountChars', { n: tokenCount.characters.toLocaleString() })}</span>
          <span className="text-fg-2">·</span>
          <span className="text-fg-2">{t('calculator.tokenCountWords', { n: tokenCount.words.toLocaleString() })}</span>
          <span className="text-fg-2">·</span>
          <span className="font-semibold tabular-nums text-foreground">
            {t('calculator.tokenCountTokens', { n: tokenCount.tokens.toLocaleString() })}
          </span>
          <Badge variant={tokenCount.exact ? 'ok' : 'free'}>
            {tokenCount.exact ? t('calculator.tokenCountExact') : t('calculator.tokenCountApprox')}
          </Badge>
        </>
      )}
    </div>
  )
}