import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { en } from '@/features/i18n/dictionaries/en'
import { zh } from '@/features/i18n/dictionaries/zh'
import { REGISTRY } from '@/features/calculator/model-prices'
import { formatMoney } from '@/features/calculator/format'

/**
 * The copy-vs-registry contract for the pages whose prose states a number.
 *
 * The second-round audit found the calculator landings making claims the
 * registry contradicts — "GPT-6 astra is the most expensive active model"
 * (GPT-5.6 cyber is), "Gemini 3.1 Flash-Lite is the cheapest Gemini tier"
 * (2.5 Flash-Lite is), "8–20× cheaper" where the real output ratio is 100×,
 * and a "2.3×" that was the input ratio quoted as an output ratio. The
 * numbers themselves move when the registry moves; the *rules* below are
 * what must not regress.
 */
const price = (id: string) => {
  const model = REGISTRY.models.find((entry) => entry.id === id)
  expect(model, `the registry should carry ${id}`).toBeTruthy()
  return model!
}

/** Every rendered copy array on the calculator landing pages. */
function renderedCopy(): { key: string; lines: string[] }[] {
  const groups: { key: string; lines: readonly string[] }[] = [
    { key: 'en.calculator.tldrItems', lines: en.calculator.tldrItems },
    { key: 'en.calculator.tips', lines: en.calculator.tips },
    { key: 'en.calculator.chatgptTldrItems', lines: en.calculator.chatgptTldrItems },
    { key: 'en.calculator.chatgptTips', lines: en.calculator.chatgptTips },
    { key: 'en.calculator.deepseekTldrItems', lines: en.calculator.deepseekTldrItems },
    { key: 'zh.calculator.tldrItems', lines: zh.calculator.tldrItems },
    { key: 'zh.calculator.tips', lines: zh.calculator.tips },
    { key: 'zh.calculator.chatgptTldrItems', lines: zh.calculator.chatgptTldrItems },
    { key: 'zh.calculator.chatgptTips', lines: zh.calculator.chatgptTips },
    { key: 'zh.calculator.deepseekTldrItems', lines: zh.calculator.deepseekTldrItems },
  ]
  return groups.map((group) => ({ key: group.key, lines: [...group.lines] }))
}

describe('calculator copy vs the price registry', () => {
  it('does not repeat the false superlatives the audit removed', () => {
    const all = renderedCopy()
      .flatMap((group) => group.lines)
      .join('\n')
    for (const claim of [
      'most expensive active model',
      'cheapest active model',
      'cheapest Gemini tier in the registry',
      'GPT-5 cached input drops',
      'GPT-6 astra 最贵',
      'GPT-6 luna 最便宜',
      '注册表里最便宜的 Gemini 档位',
      'GPT-5 缓存输入降至',
    ]) {
      expect(all, `the copy still claims "${claim}"`).not.toContain(claim)
    }
  })

  it('states output ratios the registry actually produces', () => {
    const astra = price('gpt-6-astra')
    const luna = price('gpt-6-luna')
    const fable = price('claude-fable-5.1')
    const haiku = price('claude-haiku-4.5')
    const sonnet45 = price('claude-sonnet-4.5')
    const deepseekPro = price('deepseek-v4-pro')

    // "GPT-6 luna ... 100× below GPT-6 astra on output"
    expect(astra.outputPricePer1M / luna.outputPricePer1M).toBe(100)
    // "Claude Haiku 4.5 ... about 10× less than Claude Fable 5.1"
    expect(fable.outputPricePer1M / haiku.outputPricePer1M).toBe(10)
    // "V4-Pro ... ~3.8× cheaper than Claude Sonnet 4.5 on output"
    expect(sonnet45.outputPricePer1M / deepseekPro.outputPricePer1M).toBeCloseTo(3.79, 1)

    // "GPT-6 astra cached input ... a 90% discount vs the standard rate"
    expect(
      Math.round((1 - astra.cachedInputPricePer1M! / astra.inputPricePer1M) * 100),
    ).toBe(90)
  })

  it('does not call a Flash-Lite model the cheapest Gemini tier', () => {
    // The claim is false by construction: 2.5 Flash-Lite is cheaper than
    // 3.1 Flash-Lite, and both are active Gemini rows.
    const blended = (id: string) => {
      const model = price(id)
      return (model.inputPricePer1M + model.outputPricePer1M) / 2
    }
    expect(blended('gemini-2.5-flash-lite')).toBeLessThan(blended('gemini-3.1-flash-lite'))
    expect(en.landing.vendor.gemini.faq3A).toContain('low-cost Gemini tier')
    expect(en.landing.vendor.gemini.tldrItems.join(' ')).not.toContain('cheapest Gemini tier')
  })

  it('spells one blended rate one way everywhere', () => {
    // MiniMax M3.1 Flash blends to 0.375; the copy spelled it "$0.38" while
    // the model-page tile printed the raw "$0.375". One formatter now owns it.
    expect(formatMoney(0.375)).toBe('$0.38')
    const profile = readFileSync(
      new URL('../../leaderboard/components/ModelProfile.tsx', import.meta.url),
      'utf8',
    )
    expect(profile).not.toContain('`$${verdict.blended}`')
    expect(profile).toContain('formatMoney(verdict.blended)')
  })
})
