import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { REGISTRY, findModel } from '@/features/calculator/model-prices'
import { priceDetail, registrySnapshotDate } from '@/features/calculator/pricing-detail'
import { formatMoney, formatPct } from '@/features/calculator/format'
import { tokenFaq, claudeFaq, chatgptFaq, openrouterFaq } from '@/features/calculator/copy'
import { dictionaries, translate, type Locale } from '@/features/i18n/locale'
import {
  HISTORICAL_EXAMPLE_IDS,
  TOKEN_FAQ_EXAMPLE_IDS,
  cacheDiscountText,
  cacheDiscountsByProvider,
  outputRatioRange,
  snapshotRates,
} from '@/features/calculator/faq-examples'

/**
 * The FAQ-vs-registry contract for the calculator landing pages.
 *
 * The first-round audit found the token-cost FAQ still selling `GPT-5 nano`,
 * `Claude Opus 4.5`, `Gemini 2.5 Flash` and `Claude Sonnet 4.5` — three
 * delisted / superseded models — while the calculator above it priced the
 * current ones. The numbers were also hand-typed, so nothing failed when the
 * registry moved past them.
 *
 * The fix is structural (every figure is a placeholder filled by
 * `faq-examples.ts` from REGISTRY), and these tests are the lock:
 *
 *  1. a model named in the FAQ must be an ACTIVE registry row —
 *  2. unless it is the one whitelisted HISTORICAL example, in which case the
 *     sentence must mark it as retired, print its registry rates, and date
 *     them — and
 *  3. every cross-provider claim in the FAQ (the output/input spread, the
 *     cache discounts) must equal what the registry computes, so
 *     "typically 4–8×" or "~90% for every vendor" cannot come back.
 */

const copySource = readFileSync(fileURLToPath(new URL('../copy.ts', import.meta.url)), 'utf8')

const t = (dict: (typeof dictionaries)[Locale], key: string, params?: Record<string, string | number>) =>
  translate(dict, key, params)

/** The FAQ the token-cost page renders, in both languages. */
function tokenFaqText(locale: Locale): string {
  return tokenFaq((key, params) => t(dictionaries[locale], key, params))
    .map((entry) => `${entry.q}\n${entry.a}`)
    .join('\n\n')
}

/** Every FAQ the calculator pages render, in both languages. */
function allFaqText(locale: Locale): string {
  const tr = (key: string, params?: Record<string, string | number>) =>
    t(dictionaries[locale], key, params)
  return [
    ...tokenFaq(tr),
    ...claudeFaq(tr),
    ...chatgptFaq(tr),
    ...openrouterFaq(tr),
  ]
    .map((entry) => `${entry.q}\n${entry.a}`)
    .join('\n\n')
}

/** Every registry display name, longest first (so "GPT-6 astra" wins over "GPT-6"). */
const MODELS_BY_NAME_LENGTH = REGISTRY.models
  .map((model) => ({
    id: model.id,
    status: model.status,
    displayName: model.displayName,
    // The copy may write the Anthropic names with the brand prefix.
    aliases: [model.displayName, `Claude ${model.displayName}`].filter(
      (name, index, all) => all.indexOf(name) === index,
    ),
  }))
  .flatMap((row) => row.aliases.map((name) => ({ ...row, name })))
  .sort((a, b) => b.name.length - a.name.length)

/**
 * The model names a piece of copy mentions.
 *
 * Every registry name is tried, longest first. A name only counts when it is
 * not the prefix of a LONGER registry name: "GPT-5 nano" is a mention of the
 * delisted nano; "GPT-5" inside it is not a separate mention of the delisted
 * GPT-5 — the longer row is what the sentence is about.
 */
function mentionedModels(text: string): { id: string; name: string; status: string }[] {
  const found = new Map<string, { id: string; name: string; status: string }>()
  const longerNames = MODELS_BY_NAME_LENGTH.map((row) => row.name)
  let rest = text
  for (const row of MODELS_BY_NAME_LENGTH) {
    if (!rest.includes(row.name)) continue
    if (longerNames.some((other) => other !== row.name && other.startsWith(`${row.name} `) && text.includes(other))) {
      continue
    }
    // A longer alias may already have consumed this span; only record the
    // model once and blank the span so "GPT-6" cannot match inside "GPT-6 sol".
    if (found.has(row.id)) continue
    found.set(row.id, { id: row.id, name: row.name, status: row.status })
    rest = rest.split(row.name).join(' '.repeat(row.name.length))
  }
  return [...found.values()]
}

describe('the token-cost FAQ quotes the registry', () => {
  it('names only active models, plus the whitelisted history', () => {
    const allowed = new Set<string>(HISTORICAL_EXAMPLE_IDS)
    for (const locale of ['en', 'zh'] as Locale[]) {
      const stale = mentionedModels(tokenFaqText(locale)).filter(
        (model) => model.status !== 'active' && !allowed.has(model.id),
      )
      expect(
        stale,
        `${locale}: the token-cost FAQ names models that are no longer active — a ` +
          'retired model may only appear as the marked historical example',
      ).toEqual([])
    }
  })

  it('keeps the historical example whitelist honest', () => {
    // The whitelist may only hold rows the registry actually retired: if a
    // model came back to life, quoting it "as history" is the new bug.
    for (const id of HISTORICAL_EXAMPLE_IDS) {
      const model = findModel(id)
      expect(model, `the historical example ${id} is not in the registry`).toBeTruthy()
      expect(model!.status, `${id} is active — it is not a historical example`).not.toBe('active')
    }
  })

  it('marks every retired model it mentions as history, with its registry rates and date', () => {
    // The synthetic copy the historical example fills has the shape
    // "<name> (retired <YYYY-MM> … $x / $y)". Both halves are asserted: the
    // model must be flagged as retired AND the figures must be its own.
    for (const locale of ['en', 'zh'] as Locale[]) {
      const text = tokenFaqText(locale)
      for (const model of mentionedModels(text)) {
        if (model.status === 'active') continue
        const row = findModel(model.id)!
        const rates = snapshotRates(model.id)!
        const pair = `${formatMoney(rates.input)} / ${formatMoney(rates.output)}`
        const asOf = (row.lastVerified ?? REGISTRY.fetchedAt).slice(0, 7)
        expect(text, `${locale}: the retired ${model.name} is quoted without its price`).toContain(pair)
        expect(text, `${locale}: the retired ${model.name} is quoted without a date`).toContain(asOf)
        expect(
          /retired|delisted|停售|已下线/i.test(text),
          `${locale}: a retired model is named without the word that marks it as history`,
        ).toBe(true)
      }
    }
  })

  it('prices every example the FAQ quotes out of the registry', () => {
    for (const id of TOKEN_FAQ_EXAMPLE_IDS) {
      const model = findModel(id)
      expect(model, `the FAQ example ${id} has no registry row`).toBeTruthy()
      expect(model!.status, `the FAQ example ${id} is not active`).toBe('active')
      const detail = priceDetail(model!, registrySnapshotDate())
      const pair = `${formatMoney(detail.input)} / ${formatMoney(detail.output)}`
      // The rendered answer must carry that exact pair — a number typed into
      // the sentence instead of interpolated would fail here the day the
      // registry moves.
      expect(tokenFaqText('en'), `the EN FAQ does not quote ${id} at its registry rate`).toContain(pair)
      expect(tokenFaqText('zh'), `the ZH FAQ does not quote ${id} at its registry rate`).toContain(pair)
    }
  })

  it('leaves no unsubstituted placeholder in either language', () => {
    for (const locale of ['en', 'zh'] as Locale[]) {
      expect(tokenFaqText(locale), `${locale}: a {placeholder} was not filled`).not.toMatch(/\{[a-zA-Z]+\}/)
    }
  })
})

describe('the FAQ’s cross-provider claims are recomputable', () => {
  it('states the output/input spread the registry actually produces', () => {
    const range = outputRatioRange()
    // Range AND endpoints: the claim is "from x to y over N models", so a
    // lazy "3× to 8×" would drift the moment an endpoint model is repriced.
    const lo = Number.isInteger(range.min) ? String(range.min) : range.min.toFixed(1)
    const hi = Number.isInteger(range.max) ? String(range.max) : range.max.toFixed(1)
    for (const locale of ['en', 'zh'] as Locale[]) {
      const text = tokenFaqText(locale)
      expect(text, `${locale}: the FAQ does not state the ${lo}× end of the spread`).toContain(`${lo}`)
      expect(text, `${locale}: the FAQ does not state the ${hi}× end of the spread`).toContain(`${hi}`)
      expect(text, `${locale}: the FAQ does not say how many models the spread is over`).toContain(
        String(range.count),
      )
    }
  })

  it('does not restore the "typically 4-8×" rule of thumb', () => {
    for (const locale of ['en', 'zh'] as Locale[]) {
      const text = tokenFaqText(locale)
      expect(text).not.toMatch(/4[×x]\s*(to|–|-|～|~)\s*8/iu)
      expect(text).not.toMatch(/4–8|4～8/)
    }
  })

  it('quotes each vendor’s own cached-read discount', () => {
    const rows = cacheDiscountsByProvider()
    const byProvider = new Map(rows.map((row) => [row.provider, cacheDiscountText(row)]))
    for (const provider of ['anthropic', 'openai', 'google', 'deepseek']) {
      const text = byProvider.get(provider)
      expect(text, `the registry publishes no cached rate for ${provider}`).toBeTruthy()
      for (const locale of ['en', 'zh'] as Locale[]) {
        expect(tokenFaqText(locale), `${locale}: the FAQ does not quote ${provider}'s ${text}`).toContain(
          text!,
        )
      }
    }
    // The old one-size-fits-all line: "~90%" for every vendor at once.
    expect(tokenFaqText('en')).not.toContain('~90% less for cached reads; OpenAI')
  })

  it('computes the discount from the registry rather than trusting the copy', () => {
    const anthropic = cacheDiscountsByProvider().find((row) => row.provider === 'anthropic')!
    // Recompute one row by hand from the raw registry fields.
    const savings = REGISTRY.models
      .filter(
        (model) =>
          model.provider === 'anthropic' &&
          model.status === 'active' &&
          model.channel === 'official' &&
          model.cachedInputPricePer1M != null,
      )
      .map((model) => 1 - model.cachedInputPricePer1M! / model.inputPricePer1M)
    expect(anthropic.count).toBe(savings.length)
    expect(formatPct(anthropic.min)).toBe(String(Math.round(Math.min(...savings) * 100)))
    expect(formatPct(anthropic.max)).toBe(String(Math.round(Math.max(...savings) * 100)))
  })

  it('never calls the OpenRouter multiplier an average OpenRouter publishes', () => {
    // The 1.05× factor is OUR assumption (REGISTRY.openRouterMarkup). The
    // copy may quote it; it may not attribute it to OpenRouter as a fact.
    for (const locale of ['en', 'zh'] as Locale[]) {
      const text = tokenFaqText(locale)
      // Naming what it is NOT is fine ("not an average published by
      // OpenRouter"); ATTRIBUTING an average to OpenRouter is not.
      expect(text).not.toMatch(/average markup[^.]*OpenRouter charges|OpenRouter[^.]*average markup of/u)
      expect(text).not.toMatch(/OpenRouter[^。]*平均加价[^。]*。\s*[^。]*[。]?$|平均加价(?!”)/u)
      expect(text).toMatch(/assumption|假设/u)
      expect(text).toContain(REGISTRY.openRouterMarkup.toFixed(2))
    }
    // The token FAQ must interpolate the factor, never type it: the
    // dictionary template keeps `{multiplier}` and the number comes from
    // `REGISTRY.openRouterMarkup` via `copy.ts`.
    const template = t(dictionaries.en, 'calc.tokenFaq6A', {})
    expect(template).toContain('{multiplier}')
    expect(template).not.toMatch(/1\.05/)
    const zhTemplate = t(dictionaries.zh, 'calc.tokenFaq6A', {})
    expect(zhTemplate).toContain('{multiplier}')
    expect(zhTemplate).not.toMatch(/1\.05/)
  })
})

describe('the shared copy cannot smuggle a stale model back in', () => {
  it('names no model outside the registry in any calculator FAQ', () => {
    const known = new Set(
      MODELS_BY_NAME_LENGTH.flatMap((row) => [row.name.toLowerCase(), `claude ${row.name.toLowerCase()}`]),
    )
    // Model-shaped names. A name is legal when it is a
    // registry name (with or without the "Claude " brand prefix) or when a
    // registry name merely EXTENDS it ("DeepSeek V4.1-Flash" abbreviates
    // "DeepSeek V4.1-Flash 1017"), never when it is unknown to the registry.
    const modelShape =
      /(GPT-\d[\w.]*(?: [a-z]+)?|Claude [A-Z][\w.]*(?: \d[\w.]*)?|Gemini [\d.]+ [\w-]+|DeepSeek [A-Z][\w.-]*|Grok \d[\w.]*)/g
    // Prose that talks about a model FAMILY, a LINE or a PLAN is not quoting a
    // registry row — "the GPT-5 and GPT-6 families", "the GPT-6 line",
    // "Claude Pro". Those spans are dropped before the scan, so "the GPT-5
    // family is now delisted" stays legal while a bare "GPT-5 costs $1.25"
    // does not.
    const prose = [
      /the [A-Za-z0-9.-]+(?: and [A-Za-z0-9.-]+)? (?:families|family|line)/gi,
      /Claude (?:Pro|Max)/g,
    ]
    for (const locale of ['en', 'zh'] as Locale[]) {
      let text = allFaqText(locale)
      for (const pattern of prose) text = text.replace(pattern, ' ')
      const unknown = [...new Set((text.match(modelShape) ?? []).map((name) => name.trim()))].filter(
        (name) => {
          const lower = name.toLowerCase()
          if (known.has(lower)) return false
          // Only an abbreviation of a real row is allowed — and it must keep
          // its version digits, so a stripped-down "DeepSeek Flash" is not.
          return !/\d/.test(name) || ![...known].some((candidate) => candidate.startsWith(`${lower} `))
        },
      )
      expect(unknown, `${locale}: these model names are not in the registry`).toEqual([])
    }
  })

  it('keeps the copy module free of literal prices', () => {
    // `copy.ts` may only print a price it read from the registry. A dollar
    // amount typed into a sentence or a template is the bug this whole file
    // exists to prevent. Comments are stripped first (they may *mention* a
    // price to explain why it is not there), so only code is scanned.
    const code = copySource
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    const literals = [...code.matchAll(/\$\d+(?:\.\d+)?/g)].map((match) => match[0])
    expect(literals, 'copy.ts hard-codes a dollar amount').toEqual([])
  })
})

// ───── The dictionary itself may not carry a registry-derived figure ──────

/**
 * The literal scan.
 *
 * Interpolating the numbers into a template only helps if the DICTIONARY
 * stops carrying its own copy of them. The failure mode that produced the
 * stale FAQ was exactly this: someone re-computed a price, found the template
 * awkward, and typed the number next to it. `faq-examples.ts` then moves on
 * the next price change and the sentence does not — and every check above
 * still passes, because each one looks at the RENDERED string.
 *
 * So this test reads `en.ts` / `zh.ts` as text. In the calculator copy the
 * only numbers allowed are ones that are NOT derived from the registry:
 *
 *  - a subscription price (`$20/mo`, `$200/mo`) — Anthropic's consumer plan
 *    prices, which live in `claude-break-even.ts`, not REGISTRY, and are
 *    pinned there for the break-even arithmetic;
 *  - a calendar year / date (`2026-09`, `2026`) — a historical fact, not a
 *    price;
 *  - a time-of-day / clock window (`01:00–04:00 UTC`) and the 24-hour Batch
 *    SLA — claims about DeepSeek's and OpenAI's schedules, from those
 *    vendors' published docs, not from the price registry;
 *  - a token-quantity the sentence defines itself (`1M tokens`, `200,000
 *    tokens`, `10,000 tokens`, `1,024`-token cache floor) — the QUESTION, not
 *    a stored fact;
 *  - placeholders (`{ratioMin}`) — the whole point.
 *
 * Everything else — a `$` rate, an `N×` multiple, an `N%` discount, a
 * `200K`/`272K` context threshold — has to come through a placeholder.
 */

/** Every key whose rendered string is registry-derived calculator copy. */
const SCANNED_EN_KEYS = [
  // the v1 `calculator` namespace: shared strip, tips and the 5 FAQ groups
  'tldrItems', 'tips', 'faq1A', 'faq2A', 'faq5A', 'faq6A', 'faq7A',
  'openrouterFaq1A', 'openrouterFaq3A', 'openrouterFaq6A', 'openrouterFaq7A',
  'claudeFaq1A', 'claudeFaq2A', 'claudeFaq3A', 'claudeFaq4A', 'claudeFaq5A',
  'claudeFaq6A', 'claudeFaq7A',
  'deepseekFaq1A', 'deepseekFaq2A', 'deepseekFaq3A', 'deepseekFaq4A',
  'deepseekFaq5A', 'deepseekFaq6A', 'deepseekFaq7A', 'deepseekTldrItems',
  'deepseekTips', 'deepseekCacheBody',
  'chatgptFaq1A', 'chatgptFaq2A', 'chatgptFaq3A', 'chatgptFaq4A',
  'chatgptFaq5A', 'chatgptFaq7A', 'chatgptTldrItems', 'chatgptTips', 'chatgptCacheBody',
  'openrouterMarkupBody', 'openrouterCurrentMarkup', 'claudeBreakEvenBody',
] as const

/** The `calc` namespace (the copy the calculator pages actually render). */
const SCANNED_CALC_KEYS = [
  'tldr1', 'tldr2', 'tldr3', 'tldr4',
  'tips1', 'tips2', 'tips3', 'tips4', 'tips5',
  'tokenFaq1A', 'tokenFaq2A', 'tokenFaq5A', 'tokenFaq6A', 'tokenFaq7A', 'tokenFaq8A',
  'claudeFaq1A', 'claudeFaq2A', 'claudeFaq3A', 'claudeFaq4A', 'claudeFaq5A',
  'claudeFaq6A', 'claudeFaq7A',
  'deepseekFaq1A', 'deepseekFaq2A', 'deepseekFaq3A', 'deepseekFaq4A',
  'deepseekFaq5A', 'deepseekFaq6A', 'deepseekFaq7A', 'deepseekTldr1',
  'deepseekTldr2', 'deepseekTldr3', 'deepseekTldr4', 'deepseekTips1',
  'deepseekTips2', 'deepseekTips3', 'deepseekTips5', 'deepseekCacheBody',
  'chatgptFaq1A', 'chatgptFaq2A', 'chatgptFaq3A', 'chatgptFaq4A',
  'chatgptFaq5A', 'chatgptFaq7A', 'chatgptTldr1', 'chatgptTldr4', 'chatgptTips1',
  'chatgptTips2', 'chatgptCacheBody',
  'openrouterFaq1A', 'openrouterFaq3A', 'openrouterFaq6A', 'openrouterFaq7A',
  'openrouterMarkupBody', 'openrouterCompareNote', 'openrouterCompareSubtitle',
] as const

/**
 * The numbers a CALCULATOR sentence may state in its own words.
 *
 * Each entry is a claim the price registry does not hold — a subscription
 * price, a date, a vendor's clock schedule, or the token quantity the
 * question itself is about. Anything else has to be a `{placeholder}`.
 */
const ALLOWED_LITERALS: { pattern: RegExp; why: string }[] = [
  { pattern: /^\$20$/, why: 'Claude Pro price (claude-break-even.ts, not REGISTRY)' },
  { pattern: /^\$200$/, why: 'Claude Max price (claude-break-even.ts, not REGISTRY)' },
  { pattern: /^\$5$/, why: 'the "how many tokens does $5 buy" question itself' },
  { pattern: /^\$50$/, why: 'the $50/mo plan tier named in a question' },
  { pattern: /^20\d\d$/, why: 'a calendar year' },
  { pattern: /^20\d\d$/, why: 'a calendar year' },
  { pattern: /^(0?[0-9]|1[0-9]|2[0-3])$/, why: 'an hour inside a UTC peak/off-peak window' },
  { pattern: /^\d{1,3}$/, why: 'a clock/UTC offset' },
  { pattern: /^(24|5|10|1)$/, why: 'SLA hours / cache window minutes, from the vendor docs' },
  { pattern: /^(1|2|5|10|50|100|200|1000)$/, why: 'a token-quantity the question defines' },
  { pattern: /^1,?024$/, why: 'OpenAI cache floor from the vendor docs' },
  { pattern: /^\d{1,3},\d{3}$/, why: 'a token quantity the question asks about (10,000 / 200,000)' },
  { pattern: /^(10|200|1000)$/, why: 'thousand/million token quantity the question defines' },
  { pattern: /^0\.\d+$/, why: 'none — decimal rates must be placeholders' },
]

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out)
  return out
}

/** Every figure a piece of copy states in its own words. */
function bareFigures(text: string): string[] {
  const stripped = text.replace(/\{[a-zA-Z]+\}/g, ' ')
  const figures = new Set<string>()
  // Dollar amounts, percentages, multiples, and bare K/M token thresholds.
  for (const match of stripped.matchAll(/\$\d[\d,.]*/g)) figures.add(match[0])
  for (const match of stripped.matchAll(/\d[\d,.]*\s*%/g)) figures.add(match[0].replace(/\s*%$/, ''))
  for (const match of stripped.matchAll(/\d[\d,.]*\s*×/g)) figures.add(match[0].replace(/\s*×$/, ''))
  return [...figures]
}

describe('the dictionary carries no registry figure of its own', () => {
  const scanned = (): { key: string; text: string }[] => {
    const rows: { key: string; text: string }[] = []
    for (const locale of ['en', 'zh'] as Locale[]) {
      const dict = dictionaries[locale] as unknown as Record<string, Record<string, unknown>>
      for (const key of SCANNED_EN_KEYS) {
        for (const text of collectStrings(dict.calculator?.[key])) rows.push({ key: `${locale}.calculator.${key}`, text })
      }
      for (const key of SCANNED_CALC_KEYS) {
        for (const text of collectStrings(dict.calc?.[key])) rows.push({ key: `${locale}.calc.${key}`, text })
      }
    }
    return rows
  }

  it('scans a meaningful slice of the copy', () => {
    // A renamed namespace would silently empty this test.
    expect(scanned().length).toBeGreaterThan(80)
  })

  it('states no dollar rate, percentage or multiple outside a placeholder', () => {
    const violations: string[] = []
    for (const { key, text } of scanned()) {
      for (const figure of bareFigures(text)) {
        const allowed = ALLOWED_LITERALS.some(
          (entry) => entry.pattern.test(figure) && !entry.why.startsWith('none'),
        )
        if (!allowed) violations.push(`${key}: "${figure}" in ${text.slice(0, 80)}…`)
      }
    }
    expect(
      violations,
      'these figures are registry-derived and belong in a {placeholder} filled by ' +
        'faq-examples.ts — a bare number here goes stale on the next price change',
    ).toEqual([])
  })

  it('keeps every derived figure behind a placeholder', () => {
    // Positive side of the same contract: the sentences that talk about the
    // whole registry must interpolate, not assert.
    const required: [string, string][] = [
      ['en.calc.tokenFaq2A', '{ratioMin}'],
      ['zh.calc.tokenFaq2A', '{ratioMin}'],
      ['en.calc.tokenFaq5A', '{anthropicCache}'],
      ['zh.calc.tokenFaq5A', '{anthropicCache}'],
      ['en.calc.tokenFaq1A', '{retiredRates}'],
      ['zh.calc.tokenFaq1A', '{retiredRates}'],
      ['en.calc.tokenFaq7A', '{proIn}'],
      ['zh.calc.tokenFaq7A', '{proIn}'],
      ['en.calc.tldr1', '{ratioMin}'],
      ['zh.calc.tldr1', '{ratioMin}'],
      ['en.calc.tldr2', '{cacheMinPct}'],
      ['zh.calc.tldr2', '{cacheMinPct}'],
    ]
    for (const [path, placeholder] of required) {
      const [locale, ns, key] = path.split('.') as [Locale, 'calc', string]
      const dict = dictionaries[locale] as unknown as Record<string, Record<string, unknown>>
      const value = dict[ns]?.[key]
      const text = collectStrings(value).join(' ')
      expect(text, `${path} must interpolate ${placeholder}`).toContain(placeholder)
    }
  })
})

/**
 * A key read from the `calculator.*` namespace may not be interpolated.
 *
 * Moving the copy to placeholders created a second failure mode that no
 * amount of registry-checking catches: a component that reads a string with
 * `{holes}` in it **without passing the parameters** prints the raw template,
 * and one that reads a key that only exists in the *other* namespace prints
 * the key itself (`calc.chatgptCacheBody` on `/chatgpt-api-pricing`). Both
 * are visible text on a live page.
 *
 * `e2e/seo.spec.ts` already renders the pages and looks for `{hole}` and raw
 * keys; this test catches the same defect at unit speed, straight from the
 * source, so the failure lands before a browser is ever booted.
 */
describe('no component renders an uninterpolated template', () => {
  const COMPONENT_DIR = fileURLToPath(new URL('../components/', import.meta.url))
  const COPY_TS = fileURLToPath(new URL('../copy.ts', import.meta.url))

  /** Every `calc.*` value that still contains a `{placeholder}`. */
  function placeholderKeys(ns: Record<string, unknown>): Set<string> {
    const keys = new Set<string>()
    for (const [key, value] of Object.entries(ns)) {
      if (collectStrings(value).some((text) => /\{[A-Za-z_][\w]*\}/.test(text))) keys.add(key)
    }
    return keys
  }

  /** The `calc.*` keys a file reads through `t('calc.<key>')` with no params. */
  function readsWithoutParams(source: string): string[] {
    const bare: string[] = []
    for (const match of source.matchAll(/\bt\(\s*'calc\.([A-Za-z0-9_]+)'\s*\)/g)) {
      bare.push(match[1])
    }
    return bare
  }

  it('never renders a key that still carries a placeholder, bare', () => {
    const withHoles = new Set<string>()
    for (const locale of ['en', 'zh'] as const) {
      const dict = dictionaries[locale] as unknown as Record<string, Record<string, unknown>>
      for (const key of placeholderKeys(dict.calc ?? {})) withHoles.add(key)
    }
    expect(withHoles.size, 'the calculator copy should use placeholders').toBeGreaterThan(10)

    const files: string[] = []
    for (const entry of readdirSync(COMPONENT_DIR)) {
      if (entry.endsWith('.tsx') || entry.endsWith('.ts')) files.push(`${COMPONENT_DIR}${entry}`)
    }
    files.push(COPY_TS)

    const offenders: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const key of readsWithoutParams(source)) {
        if (withHoles.has(key)) offenders.push(`${file.split('/').slice(-1)[0]} → calc.${key}`)
      }
    }
    expect(
      offenders,
      'these call sites print the {placeholder} literally — pass the params (or call the copy.ts helper)',
    ).toEqual([])
  })

  it('never reads a `calc.*` key that only exists in the `calculator.*` namespace', () => {
    const files: string[] = [COPY_TS]
    for (const entry of readdirSync(COMPONENT_DIR)) {
      if (entry.endsWith('.tsx') || entry.endsWith('.ts')) files.push(`${COMPONENT_DIR}${entry}`)
    }
    const missing: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(/\bt\(\s*'calc\.([A-Za-z0-9_]+)'/g)) {
        const key = match[1]
        for (const locale of ['en', 'zh'] as const) {
          const dict = dictionaries[locale] as unknown as Record<string, Record<string, unknown>>
          if (!(key in (dict.calc ?? {}))) {
            missing.push(`${file.split('/').slice(-1)[0]} → ${locale}.calc.${key}`)
          }
        }
      }
    }
    expect(missing, 'a missing `calc.*` key renders the key text, not a sentence').toEqual([])
  })
})
