import { describe, expect, it } from 'vitest'
import { calculateCost } from '@/features/calculator/cost'
import { findModel, REGISTRY } from '@/features/calculator/model-prices'
import {
  MODEL_NOTES_ZH,
  PRICE_TIER_LABELS_ZH,
  PRICE_TIER_NOTES_ZH,
  PRICE_WINDOW_LABELS_ZH,
  priceTierLabel,
  priceTierNote,
} from '@/features/calculator/model-notes'
import { priceDetail, registrySnapshotDate } from '@/features/calculator/pricing-detail'
import { renderRuleKey } from '@/features/calculator/pricing-rule'
import { blendedPricePer1M } from '@/features/leaderboard/leaderboard'

/**
 * A fake translator: it records the dictionary key and the params, so a test
 * can assert WHICH i18n key a rule shape asks for without depending on the
 * copy in the dictionaries (the lead owns those).
 */
function fakeT() {
  const calls: { key: string; params?: Record<string, string | number> }[] = []
  const t = (key: string, params?: Record<string, string | number>) => {
    calls.push({ key, params })
    return params ? `${key}[${JSON.stringify(params)}]` : key
  }
  return { t, calls }
}

const day = (iso: string) => new Date(`${iso}T12:00:00Z`)

describe('priceDetail — dated price windows', () => {
  it('resolves the base price before the first band starts', () => {
    // GPT-5.6 sol's timeline starts 2026-10-01. Before that there is no band,
    // so the base price stands — and no promo is running.
    const detail = priceDetail(findModel('gpt-5.6-sol')!, day('2026-09-30'))
    expect(detail.input).toBe(4)
    expect(detail.output).toBe(20)
    expect(detail.cached).toBe(0.4)
    expect(detail.promoActive).toBeUndefined()
    expect(detail.nextChange).toBeDefined()
    expect(detail.nextChange!.from).toBe('2026-10-01')
  })

  it('resolves the promotional band while it is open', () => {
    const detail = priceDetail(findModel('gpt-5.6-sol')!, day('2026-10-21'))
    expect(detail.input).toBe(4)
    expect(detail.output).toBe(20)
    expect(detail.cached).toBe(0.4)
    expect(detail.promoActive).toBe(true)
    // The next band is the rate the promo reverts to.
    expect(detail.nextChange).toBeDefined()
    expect(detail.nextChange!.from).toBe('2026-11-22')
    expect(detail.nextChange!.inputPricePer1M).toBe(5)
    expect(detail.nextChange!.outputPricePer1M).toBe(30)
  })

  it('resolves the standard band after the promotional one ends', () => {
    const detail = priceDetail(findModel('gpt-5.6-sol')!, day('2026-12-01'))
    expect(detail.input).toBe(5)
    expect(detail.output).toBe(30)
    expect(detail.promoActive).toBeUndefined()
    // No band starts in the future — the timeline is over.
    expect(detail.nextChange).toBeUndefined()
  })

  it('treats the last day of a band as still inside it', () => {
    const onLastDay = priceDetail(findModel('gpt-5.6-sol')!, day('2026-11-21'))
    expect(onLastDay.input).toBe(4)
    expect(onLastDay.promoActive).toBe(true)

    const onFirstDay = priceDetail(findModel('gpt-5.6-sol')!, day('2026-11-22'))
    expect(onFirstDay.input).toBe(5)
    expect(onFirstDay.promoActive).toBeUndefined()
  })

  it('follows the Gemini 4 Argon timeline (introductory → standard)', () => {
    const argon = findModel('gemini-4-argon')!
    const before = priceDetail(argon, day('2026-10-12'))
    expect(before.input).toBe(2)
    expect(before.promoActive).toBeUndefined()

    const intro = priceDetail(argon, day('2026-11-30'))
    expect(intro.input).toBe(2)
    expect(intro.output).toBe(10)
    expect(intro.cached).toBe(0.1)
    expect(intro.promoActive).toBe(true)
    expect(intro.nextChange!.from).toBe('2026-12-01')

    const standard = priceDetail(argon, day('2026-12-01'))
    expect(standard.input).toBe(4)
    expect(standard.output).toBe(20)
    expect(standard.cached).toBe(0.2)
    expect(standard.promoActive).toBeUndefined()
    expect(standard.nextChange).toBeUndefined()
  })

  it('follows the Gemini 3.8 Flash timeline (introductory → standard)', () => {
    const flash = findModel('gemini-3.8-flash')!
    const intro = priceDetail(flash, day('2026-12-31'))
    expect(intro.input).toBe(0.75)
    expect(intro.output).toBe(3.75)
    expect(intro.cached).toBe(0.075)
    expect(intro.promoActive).toBe(true)
    expect(intro.nextChange!.from).toBe('2027-01-01')

    const standard = priceDetail(flash, day('2027-01-01'))
    expect(standard.input).toBe(1.5)
    expect(standard.output).toBe(7.5)
    expect(standard.cached).toBe(0.15)
    expect(standard.promoActive).toBeUndefined()
    expect(standard.nextChange).toBeUndefined()
  })

  it('reports no windows and no promo for a flat-rate model', () => {
    const detail = priceDetail(findModel('gpt-6-astra')!, day('2026-10-21'))
    expect(detail.windows).toEqual([])
    expect(detail.tiers).toEqual([])
    expect(detail.promoActive).toBeUndefined()
    expect(detail.nextChange).toBeUndefined()
    expect(detail.input).toBe(10)
    expect(detail.output).toBe(50)
  })

  it('exposes the band in force with its own start and end date', () => {
    const promo = priceDetail(findModel('gpt-5.6-sol')!, day('2026-10-21'))
    expect(promo.currentWindow).toBeDefined()
    expect(promo.currentWindow!.from).toBe('2026-10-01')
    expect(promo.currentWindow!.until).toBe('2026-11-21')
    expect(promo.currentWindow!.label).toBe('Promotional rate')
    // The band in force is the one the numbers come from.
    expect(promo.input).toBe(promo.currentWindow!.inputPricePer1M)
    expect(promo.output).toBe(promo.currentWindow!.outputPricePer1M)

    const standard = priceDetail(findModel('gpt-5.6-sol')!, day('2026-12-01'))
    expect(standard.currentWindow!.from).toBe('2026-11-22')
    expect(standard.currentWindow!.until).toBeUndefined()

    // Outside every band there is no band — the base price stands.
    expect(priceDetail(findModel('gpt-5.6-sol')!, day('2026-09-30')).currentWindow).toBeUndefined()
    expect(priceDetail(findModel('gpt-6-astra')!, day('2026-10-21')).currentWindow).toBeUndefined()
  })

  it('names the day a temporary rate ends', () => {
    const promo = priceDetail(findModel('gpt-5.6-sol')!, day('2026-10-21'))
    expect(promo.promoUntil).toBe('2026-11-21')
    // A long-term rate carries no expiry.
    const standard = priceDetail(findModel('gpt-5.6-sol')!, day('2026-12-01'))
    expect(standard.promoUntil).toBeUndefined()
  })

  it('resolves against the registry snapshot when no date is given', () => {
    const snapshot = registrySnapshotDate()
    expect(snapshot.toISOString().slice(0, 10)).toBe(REGISTRY.fetchedAt)
    const detail = priceDetail(findModel('gpt-5.6-sol')!)
    expect(detail.input).toBe(priceDetail(findModel('gpt-5.6-sol')!, snapshot).input)
    expect(detail.currentWindow?.from).toBe(
      priceDetail(findModel('gpt-5.6-sol')!, snapshot).currentWindow?.from,
    )
  })
})

describe('priceDetail — next change and promo state', () => {
  it('reports a next change only for a band that has not started yet', () => {
    const argon = findModel('gemini-4-argon')!
    // Inside the introductory band the standard band is still ahead.
    expect(priceDetail(argon, day('2026-10-20')).nextChange?.from).toBe('2026-12-01')
    // Once the standard band is in force there is nothing after it.
    expect(priceDetail(argon, day('2026-12-15')).nextChange).toBeUndefined()
  })

  it('marks a promo active only while the promo band is open', () => {
    const sol = findModel('gpt-5.6-sol')!
    expect(priceDetail(sol, day('2026-10-01')).promoActive).toBe(true)
    expect(priceDetail(sol, day('2026-11-21')).promoActive).toBe(true)
    expect(priceDetail(sol, day('2026-11-22')).promoActive).toBeUndefined()
    expect(priceDetail(sol, day('2027-01-01')).promoActive).toBeUndefined()
  })

  it('carries the source and verification stamp of the row', () => {
    const detail = priceDetail(findModel('gemini-4-argon')!, day('2026-10-21'))
    expect(detail.modelId).toBe('gemini-4-argon')
    expect(detail.provider).toBe('google')
    expect(detail.sourceUrl).toBe('https://ai.google.dev/gemini-api/docs/pricing')
    expect(detail.lastVerified).toBe('2026-10-20')
    expect(detail.note).toContain('Introductory pricing')
  })
})

describe('priceDetail — tiers', () => {
  it('carries the service tiers a model documents', () => {
    const argon = priceDetail(findModel('gemini-4-argon')!, day('2026-11-01'))
    expect(argon.tiers.map((t) => t.kind)).toEqual(['batch', 'flex', 'priority'])
    expect(argon.tiers.find((t) => t.kind === 'batch')!.multiplier).toBe(0.5)
    expect(argon.tiers.find((t) => t.kind === 'flex')!.multiplier).toBe(0.5)
    expect(argon.tiers.find((t) => t.kind === 'priority')!.multiplier).toBe(1.8)

    const m3 = priceDetail(findModel('minimax-m3')!, day('2026-10-21'))
    const priority = m3.tiers.find((t) => t.kind === 'priority')!
    expect(priority.inputPricePer1M).toBe(0.45)
    expect(priority.outputPricePer1M).toBe(1.8)
    expect(priority.cachedInputPricePer1M).toBe(0.09)
    expect(priority.multiplier).toBe(1.5)
    const longContext = m3.tiers.find((t) => t.kind === 'long-context')!
    expect(longContext.cachedInputPricePer1M).toBe(0.12)
    expect(longContext.note).toContain('$0.12')
  })

  it('has no tiers for a model whose note documents none', () => {
    expect(priceDetail(findModel('gpt-6-astra')!, day('2026-10-21')).tiers).toEqual([])
  })
})

describe('priceDetail — channel', () => {
  it('marks every registry row as an official vendor price', () => {
    for (const model of REGISTRY.models) {
      expect(model.channel, `${model.id} has no channel`).toBe('official')
      expect(priceDetail(model, day('2026-10-21')).channel).toBe('official')
    }
  })

  it('keeps the OpenRouter clone an aggregator quote', () => {
    const clone = findModel('gpt-5.6-sol')!
    expect(clone.channel).toBe('official')
  })
})

describe('calculateCost — dated windows', () => {
  it('charges the rate of the band that is open', () => {
    const promo = calculateCost('gpt-5.6-sol', 1_000_000, 1_000_000, {
      now: day('2026-10-21'),
      requestContextTokens: 1_000,
    })
    expect(promo.effectiveInputPricePer1M).toBe(4)
    expect(promo.effectiveOutputPricePer1M).toBe(20)
    // The rule names the band AND the date it ends on.
    expect(promo.appliedRule).toBe('Promotional rate (until 2026-11-21)')

    const standard = calculateCost('gpt-5.6-sol', 1_000_000, 1_000_000, {
      now: day('2026-12-01'),
      requestContextTokens: 1_000,
    })
    expect(standard.effectiveInputPricePer1M).toBe(5)
    expect(standard.effectiveOutputPricePer1M).toBe(30)
    expect(standard.appliedRule).toBe('Standard rate')
  })

  it('keeps the band visible when a long-context tier applies on top of it', () => {
    const r = calculateCost('gpt-5.6-sol', 300_000, 10_000, { now: day('2026-10-21') })
    expect(r.appliedRule).toContain('Promotional rate (until 2026-11-21)')
    expect(r.appliedRule).toContain('long-context')
    // $4 × 2 = $8 per 1M input.
    expect(r.effectiveInputPricePer1M).toBe(8)
  })

  it('bills the cached rate of the band that is open', () => {
    const promo = calculateCost('gemini-4-argon', 1_000_000, 0, {
      useCachedInput: true,
      now: day('2026-11-30'),
    })
    expect(promo.effectiveInputPricePer1M).toBe(0.1)

    const standard = calculateCost('gemini-4-argon', 1_000_000, 0, {
      useCachedInput: true,
      now: day('2026-12-01'),
    })
    expect(standard.effectiveInputPricePer1M).toBe(0.2)
  })

  it('agrees with priceDetail on every dated model', () => {
    const dated = ['gpt-5.6-sol', 'gemini-4-argon', 'gemini-3.8-flash']
    const dates = ['2026-09-30', '2026-10-21', '2026-11-21', '2026-11-22', '2026-12-01', '2027-02-01']
    for (const id of dated) {
      const model = findModel(id)!
      for (const date of dates) {
        const detail = priceDetail(model, day(date))
        const cost = calculateCost(id, 1_000_000, 1_000_000, {
          now: day(date),
          requestContextTokens: 1_000,
        })
        expect(cost.effectiveInputPricePer1M, `${id} @ ${date}`).toBe(detail.input)
        expect(cost.effectiveOutputPricePer1M, `${id} @ ${date}`).toBe(detail.output)
      }
    }
  })
})

describe('pricing-rule — window shapes', () => {
  it('translates a band that ends on a date via calculator.ruleWindowUntil', () => {
    const { t, calls } = fakeT()
    const rendered = renderRuleKey('Promotional rate (until 2026-11-21)', t, 'en')
    expect(calls[0]!.key).toBe('calculator.ruleWindowUntil')
    expect(calls[0]!.params).toEqual({ label: 'Promotional rate', date: '2026-11-21' })
    expect(rendered).toContain('calculator.ruleWindowUntil')
  })

  it('translates a band that never ends via calculator.ruleWindow', () => {
    const { t, calls } = fakeT()
    renderRuleKey('Standard rate', t, 'en')
    expect(calls[0]!.key).toBe('calculator.ruleWindow')
    expect(calls[0]!.params).toEqual({ label: 'Standard rate' })
  })

  it('localizes the band label for Chinese readers', () => {
    const { t, calls } = fakeT()
    renderRuleKey('Promotional rate (until 2026-11-21)', t, 'zh')
    expect(calls[0]!.params!.label).toBe('促销价')
  })

  it('keeps the legacy promo and standard rules working', () => {
    const { t, calls } = fakeT()
    renderRuleKey('promo (until 2026-12-31)', t, 'en')
    expect(calls[0]!.key).toBe('calculator.rulePromo')
    expect(calls[0]!.params).toEqual({ date: '2026-12-31' })

    const second = fakeT()
    renderRuleKey('standard', second.t, 'en')
    expect(second.calls[0]!.key).toBe('calculator.ruleStandard')
  })

  it('translates a band combined with another rule part by part', () => {
    const { t, calls } = fakeT()
    renderRuleKey('Promotional rate (until 2026-11-21) + cached input', t, 'en')
    expect(calls.map((c) => c.key)).toEqual([
      'calculator.ruleWindowUntil',
      'calculator.cachedInputLabel',
    ])
  })
})

describe('registry — new structure', () => {
  it('gives every dated band a label, and a Chinese name for it', () => {
    for (const model of REGISTRY.models) {
      for (const band of model.priceWindows ?? []) {
        expect(band.label, `${model.id} has an unlabelled band`).toBeTruthy()
        expect(band.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        if (band.until) expect(band.until).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(
          PRICE_WINDOW_LABELS_ZH[band.label],
          `${model.id} band "${band.label}" has no Chinese name`,
        ).toBeTruthy()
      }
    }
  })

  it('never changes the price a band quotes', () => {
    // Every band of a dated model repeats a rate the note already states —
    // the base rate of the band in force today, and the rate after it.
    const sol = findModel('gpt-5.6-sol')!
    expect(sol.priceWindows![0]!.inputPricePer1M).toBe(sol.inputPricePer1M)
    expect(sol.priceWindows![0]!.outputPricePer1M).toBe(sol.outputPricePer1M)
    expect(sol.priceWindows![0]!.cachedInputPricePer1M).toBe(sol.cachedInputPricePer1M)
  })

  it('keeps the Chinese overlay of the notes in sync with the registry', () => {
    // The bands above were read out of the notes; the notes are still there.
    expect(MODEL_NOTES_ZH['gpt-5.6-sol']).toContain('2026-11-21')
    expect(MODEL_NOTES_ZH['gemini-4-argon']).toContain('2026-11-30')
    expect(MODEL_NOTES_ZH['gemini-3.8-flash']).toContain('2026-12-31')
  })
})

describe('blendedPricePer1M — the rate in force, not the base rate', () => {
  it('blends the band in force', () => {
    const sol = findModel('gpt-5.6-sol')!
    // The registry's BASE rate of GPT-5.6 sol IS the promotional band —
    // quoting it after 2026-11-21 would pass a promotion off as the
    // long-term price.
    expect(sol.inputPricePer1M).toBe(4)
    expect(sol.outputPricePer1M).toBe(20)
    expect(blendedPricePer1M(sol, day('2026-10-21'))).toBe((4 + 20) / 2)
    // After the promo the standard band is the rate in force.
    expect(blendedPricePer1M(sol, day('2026-11-22'))).toBe((5 + 30) / 2)

    const argon = findModel('gemini-4-argon')!
    expect(blendedPricePer1M(argon, day('2026-11-30'))).toBe((2 + 10) / 2)
    expect(blendedPricePer1M(argon, day('2026-12-01'))).toBe((4 + 20) / 2)

    const flash = findModel('gemini-3.8-flash')!
    expect(blendedPricePer1M(flash, day('2026-12-31'))).toBe((0.75 + 3.75) / 2)
    expect(blendedPricePer1M(flash, day('2027-01-01'))).toBe((1.5 + 7.5) / 2)
  })

  it('is undefined without a price row', () => {
    expect(blendedPricePer1M(undefined)).toBeUndefined()
  })

  it('equals what the calculator charges for the same model on the same date', () => {
    // THE invariant: the board and the calculator quote one number by
    // construction, not by convention.
    const dates = ['2026-09-30', '2026-10-20', '2026-11-21', '2026-11-22', '2026-12-01', '2027-02-01']
    for (const model of REGISTRY.models) {
      for (const date of dates) {
        const now = day(date)
        const cost = calculateCost(model.id, 1_000_000, 1_000_000, {
          now,
          requestContextTokens: 1000,
        })
        const blended = blendedPricePer1M(model, now)!
        expect(blended, `${model.id} @ ${date}`).toBe(
          (cost.effectiveInputPricePer1M + cost.effectiveOutputPricePer1M) / 2,
        )
      }
    }
  })

  it('defaults to the registry snapshot, so a render is deterministic', () => {
    const sol = findModel('gpt-5.6-sol')!
    expect(blendedPricePer1M(sol)).toBe(blendedPricePer1M(sol, registrySnapshotDate()))
    // … and the snapshot is a day inside the promotional band.
    expect(registrySnapshotDate().toISOString().slice(0, 10)).toBe(REGISTRY.fetchedAt)
  })
})

describe('service tiers — the Chinese overlay', () => {
  it('gives every tier label and note a Chinese name', () => {
    for (const model of REGISTRY.models) {
      for (const tier of model.tiers ?? []) {
        expect(
          PRICE_TIER_LABELS_ZH[tier.label],
          `${model.id} tier "${tier.label}" has no Chinese name`,
        ).toBeTruthy()
        if (tier.note) {
          expect(
            PRICE_TIER_NOTES_ZH[tier.note],
            `${model.id} tier "${tier.label}" has no Chinese note`,
          ).toBeTruthy()
        }
      }
    }
  })

  it('has no stale overlay entries', () => {
    const labels = new Set<string>()
    const notes = new Set<string>()
    for (const model of REGISTRY.models) {
      for (const tier of model.tiers ?? []) {
        labels.add(tier.label)
        if (tier.note) notes.add(tier.note)
      }
    }
    expect(Object.keys(PRICE_TIER_LABELS_ZH).filter((key) => !labels.has(key))).toEqual([])
    expect(Object.keys(PRICE_TIER_NOTES_ZH).filter((key) => !notes.has(key))).toEqual([])
  })

  it('keeps every figure of an English note in the Chinese one', () => {
    const TOKENS = /\$[\d]+(?:\.\d+)?|\d{4}-\d{2}-\d{2}|\d+(?:\.\d+)?×|\d+k\b/g
    for (const note of Object.keys(PRICE_TIER_NOTES_ZH)) {
      const zh = PRICE_TIER_NOTES_ZH[note]!
      for (const token of note.match(TOKENS) ?? []) {
        expect(zh, `"${note}" is missing ${token}`).toContain(token)
      }
    }
  })

  it('translates the tier label and note for zh, and leaves en untouched', () => {
    expect(priceTierLabel('Batch', 'en')).toBe('Batch')
    expect(priceTierLabel('Batch', 'zh')).toBe('批处理')
    expect(priceTierNote('Runs at half the standard rate.', 'en')).toBe(
      'Runs at half the standard rate.',
    )
    expect(priceTierNote('Runs at half the standard rate.', 'zh')).toBe('按标准价的一半计费。')
    // An unknown label falls back to the registry's English wording.
    expect(priceTierLabel('Whatever', 'zh')).toBe('Whatever')
  })
})
