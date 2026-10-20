import { describe, expect, it } from 'vitest'
import { applyOpenRouterMarkup, calculateAll, calculateCost } from '@/features/calculator/cost'
import { findModel, REGISTRY } from '@/features/calculator/model-prices'

const NOW = new Date('2026-09-23T12:00:00Z')

describe('calculateCost', () => {
  it('returns zero cost for zero tokens', () => {
    const r = calculateCost('gpt-5', 0, 0, { now: NOW })
    expect(r.totalCost).toBe(0)
    expect(r.annualisedCost).toBe(0)
    expect(r.appliedRule).toBe('standard')
  })

  it('uses base prices for a normal call', () => {
    // 1M input + 1M output of gpt-5: $1.25 + $10 = $11.25.
    const r = calculateCost('gpt-5', 1_000_000, 1_000_000, { now: NOW })
    expect(r.inputCost).toBeCloseTo(1.25, 4)
    expect(r.outputCost).toBeCloseTo(10.0, 4)
    expect(r.totalCost).toBeCloseTo(11.25, 4)
    expect(r.annualisedCost).toBeCloseTo(11.25 * 12, 4)
    expect(r.appliedRule).toBe('standard')
  })

  it('applies cached input price when useCachedInput=true', () => {
    // gpt-5 cached: $0.125 per 1M. 1M tokens → $0.125 input + $10 output.
    const r = calculateCost('gpt-5', 1_000_000, 1_000_000, { useCachedInput: true, now: NOW })
    expect(r.effectiveInputPricePer1M).toBeCloseTo(0.125, 2)
    expect(r.totalCost).toBeCloseTo(10.125, 4)
    expect(r.appliedRule).toBe('cached input')
  })

  it('applies Anthropic cache write cost additively', () => {
    // claude-sonnet-4.5: $3/M input, $15/M output, 5min cache write $3.75/M.
    // 1M input + 500k output + 500k cache write.
    const r = calculateCost('claude-sonnet-4.5', 1_000_000, 500_000, {
      cacheWriteHits: 500_000,
      cacheWriteWindow: '5min',
      now: NOW,
    })
    // inputCost = 1M*3/1M + 500k*3.75/1M = 3 + 1.875 = 4.875
    expect(r.inputCost).toBeCloseTo(4.875, 3)
    expect(r.outputCost).toBeCloseTo(7.5, 3) // 500k*15/1M
    expect(r.totalCost).toBeCloseTo(12.375, 3)
    expect(r.appliedRule).toContain('cache write (5min)')
  })

  it('applies long-context surcharge for Gemini >200K', () => {
    // gemini-2.5-pro: $1.25 / $10, threshold 200K with 2x / 1.5x multipliers.
    // 250K input + 50K output = 300K ctx, crosses 200K.
    const r = calculateCost('gemini-2.5-pro', 250_000, 50_000, { now: NOW })
    // input=250k/1M*2.5 = 0.625 ; output=50k/1M*15 = 0.75
    expect(r.effectiveInputPricePer1M).toBeCloseTo(2.5, 2)
    expect(r.effectiveOutputPricePer1M).toBeCloseTo(15.0, 2)
    expect(r.totalCost).toBeCloseTo(1.375, 3)
    expect(r.appliedRule).toContain('long-context')
  })

  it('applies Gemini 3.1 Pro long-context pricing above 200K', () => {
    // $2 / $12 up to 200K; $4 / $18 above it.
    const under = calculateCost('gemini-3.1-pro-preview', 100_000, 50_000, { now: NOW })
    expect(under.effectiveInputPricePer1M).toBeCloseTo(2, 2)
    expect(under.effectiveOutputPricePer1M).toBeCloseTo(12, 2)

    const over = calculateCost('gemini-3.1-pro-preview', 250_000, 50_000, { now: NOW })
    expect(over.effectiveInputPricePer1M).toBeCloseTo(4, 2)
    expect(over.effectiveOutputPricePer1M).toBeCloseTo(18, 2)
    expect(over.appliedRule).toContain('long-context')

    // The cached read doubles in the long-context band too ($0.20 → $0.40).
    const cached = calculateCost('gemini-3.1-pro-preview', 250_000, 0, {
      useCachedInput: true,
      now: NOW,
    })
    expect(cached.effectiveInputPricePer1M).toBeCloseTo(0.4, 2)
  })

  it('applies OpenAI long-context pricing above 272K', () => {
    // GPT-6 astra: $10 / $50 short context; $20 / $75 above 272K input.
    const under = calculateCost('gpt-6-astra', 200_000, 50_000, { now: NOW })
    expect(under.effectiveInputPricePer1M).toBeCloseTo(10, 2)
    expect(under.effectiveOutputPricePer1M).toBeCloseTo(50, 2)

    const over = calculateCost('gpt-6-astra', 300_000, 50_000, { now: NOW })
    expect(over.effectiveInputPricePer1M).toBeCloseTo(20, 2)
    expect(over.effectiveOutputPricePer1M).toBeCloseTo(75, 2)
    expect(over.appliedRule).toContain('long-context')

    // OpenAI prices the long-context step on the cache rate too ($1 → $2).
    const cached = calculateCost('gpt-6-astra', 300_000, 0, {
      useCachedInput: true,
      now: NOW,
    })
    expect(cached.effectiveInputPricePer1M).toBeCloseTo(2, 2)
  })

  it('applies Grok 4.7 long-context pricing above 200K', () => {
    // $2 / $0.50 / $6 short context; $4 / $1 / $12 at or above 200K.
    const over = calculateCost('grok-4.7', 250_000, 50_000, { now: NOW })
    expect(over.effectiveInputPricePer1M).toBeCloseTo(4, 2)
    expect(over.effectiveOutputPricePer1M).toBeCloseTo(12, 2)
    expect(over.appliedRule).toContain('long-context')

    const cached = calculateCost('grok-4.7', 250_000, 0, { useCachedInput: true, now: NOW })
    expect(cached.effectiveInputPricePer1M).toBeCloseTo(1, 2)
  })

  it('carries the verified 1M windows for the Claude 5.x and GPT-6 models', () => {
    expect(findModel('claude-opus-5.5')?.contextWindow).toBe(1_000_000)
    expect(findModel('claude-sonnet-5')?.contextWindow).toBe(1_000_000)
    expect(findModel('gpt-6-astra')?.contextWindow).toBe(1_050_000)
    expect(findModel('gpt-5.6-cyber')?.contextWindow).toBe(400_000)
  })

  it('does NOT apply long-context when total ctx is below threshold', () => {
    const r = calculateCost('gemini-2.5-pro', 100_000, 50_000, { now: NOW })
    expect(r.effectiveInputPricePer1M).toBeCloseTo(1.25, 2)
    expect(r.appliedRule).toBe('standard')
  })

  it('applies DeepSeek peak vs off-peak', () => {
    const peak = calculateCost('deepseek-chat', 1_000_000, 1_000_000, { peakHour: true, now: NOW })
    const off = calculateCost('deepseek-chat', 1_000_000, 1_000_000, { peakHour: false, now: NOW })
    // V3.2 peak 0.28 + 0.42 = 0.70; off-peak is 50% of peak = 0.35.
    expect(peak.totalCost).toBeCloseTo(0.7, 3)
    expect(off.totalCost).toBeCloseTo(0.35, 3) // 0.14 + 0.21
    expect(peak.appliedRule).toBe('peak hours')
    expect(off.appliedRule).toBe('off-peak hours')
  })

  it('prices cached input inside the period it is billed in', () => {
    // DeepSeek publishes a cache-hit rate per period: $0.006 peak / $0.003
    // off-peak for V4.1-Flash. The off-peak tier carries its own cache rate,
    // so an off-peak cached quote is no longer billed at the peak cache rate.
    const peak = calculateCost('deepseek-flash', 1_000_000, 1_000_000, {
      peakHour: true,
      useCachedInput: true,
      now: NOW,
    })
    const off = calculateCost('deepseek-flash', 1_000_000, 1_000_000, {
      peakHour: false,
      useCachedInput: true,
      now: NOW,
    })
    expect(peak.effectiveInputPricePer1M).toBeCloseTo(0.006, 4)
    expect(off.effectiveInputPricePer1M).toBeCloseTo(0.003, 4)
    expect(peak.totalCost).toBeCloseTo(1.206, 4) // 0.006 + 1.2
    expect(off.totalCost).toBeCloseTo(0.603, 4) // 0.003 + 0.6
  })

  it('bills MiniMax M3.1 Flash at the flat published rate', () => {
    // $0.15 / $0.60 / $0.015 per 1M. 1M input + 1M output.
    const r = calculateCost('minimax-m3.1-flash', 1_000_000, 1_000_000, { now: NOW })
    expect(r.effectiveInputPricePer1M).toBeCloseTo(0.15, 4)
    expect(r.effectiveOutputPricePer1M).toBeCloseTo(0.6, 4)
    expect(r.totalCost).toBeCloseTo(0.75, 4)
    expect(r.appliedRule).toBe('standard')
  })

  it('applies the MiniMax M3 512K long-context doubling', () => {
    // MiniMax-M3 standard tier: $0.30 / $1.20, 2x above 512K of input.
    const under = calculateCost('minimax-m3', 400_000, 100_000, { now: NOW })
    expect(under.effectiveInputPricePer1M).toBeCloseTo(0.3, 4)
    expect(under.appliedRule).toBe('standard')

    const over = calculateCost('minimax-m3', 600_000, 100_000, { now: NOW })
    expect(over.effectiveInputPricePer1M).toBeCloseTo(0.6, 4)
    expect(over.effectiveOutputPricePer1M).toBeCloseTo(2.4, 4)
    expect(over.appliedRule).toContain('long-context')

    // Cached input doubles with the rest of the long-context tier ($0.06 → $0.12).
    const cached = calculateCost('minimax-m3', 600_000, 0, { useCachedInput: true, now: NOW })
    expect(cached.effectiveInputPricePer1M).toBeCloseTo(0.12, 4)
  })

  it('throws for unknown model id', () => {
    expect(() => calculateCost('totally-fake-model', 1, 1)).toThrow(/Unknown model/)
  })

  it('calculateAll skips delisted/retired models', () => {
    const all = calculateAll(1, 1, { now: NOW })
    const ids = all.map((r) => r.modelId)
    expect(ids).not.toContain('o1-pro')
    expect(ids.length).toBeGreaterThan(5)
  })

  it('applyOpenRouterMarkup scales prices by the markup factor', () => {
    const overridden = applyOpenRouterMarkup('gpt-5', 1.05)
    expect(overridden).not.toBeNull()
    expect(overridden!.inputPricePer1M).toBeCloseTo(1.25 * 1.05, 2)
    expect(overridden!.outputPricePer1M).toBeCloseTo(10.0 * 1.05, 2)
    expect(overridden!.provider).toBe('openrouter')
    expect(overridden!.id).toBe('gpt-5-via-openrouter')
  })

  it('every active model in REGISTRY has a positive, finite base price', () => {
    for (const m of REGISTRY.models) {
      if (m.status !== 'active') continue
      expect(m.inputPricePer1M).toBeGreaterThan(0)
      expect(m.outputPricePer1M).toBeGreaterThan(0)
      expect(Number.isFinite(m.inputPricePer1M)).toBe(true)
      expect(Number.isFinite(m.outputPricePer1M)).toBe(true)
      expect(m.sourceUrl).toMatch(/^https?:\/\//)
      expect(m.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('every model id is unique', () => {
    const ids = REGISTRY.models.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('findModel returns the entry or undefined', () => {
    expect(findModel('gpt-5')?.displayName).toBe('GPT-5')
    expect(findModel('nope')).toBeUndefined()
  })
})