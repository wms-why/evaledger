import type { Locale } from '@/features/i18n/locale'
import type { ModelPrice } from '@/features/calculator/types'

/**
 * Chinese model notes, keyed by registry model id.
 *
 * The English note stays in the price registry (`src/features/calculator/model-prices.ts`)
 * — it is the source of truth that the release pages and the releases integrity
 * test read. This module is only the Chinese overlay, so a note never has to
 * live in two places: English in the registry, Chinese here.
 *
 * Rules for this file:
 *  - One entry per registry model that carries an English `note`. The guard test
 *    (`__tests__/model-notes.node.test.ts`) fails when one is missing or stale.
 *  - Every price figure, date, product name and symbol is copied verbatim from
 *    the English note — never rounded, converted or re-ordered.
 *  - Model and product names stay in their original Latin form (GPT-6,
 *    Opus 5.5, Anthropic, DeepSeek V4, MiniMax M3.1 Flash, Grok 4.7, ...).
 *  - Punctuation matches `src/features/i18n/dictionaries/zh.ts`: half-width
 *    `,` `;` `:` `()` between clauses, full-width `。` `、` for sentences and
 *    lists, `——` for the em dash.
 */
export const MODEL_NOTES_ZH: Record<string, string> = {
  // ───────────────────────── OpenAI ─────────────────────────
  'gpt-6.1-terra':
    '知识截止 2026 年 6 月,单次输出上限 128,000 token。缓存写入按保留时长计费:30 分钟 $1.25,12 小时 $2.50(长上下文调整前)。批处理与 Flex 为标准价的一半,Fast 模式为 2×,部分地区处理加价 10%。',
  'gpt-5.6-sol':
    '促销价 ($4 / $20 / $0.40) 至少可用到 2026-11-21;促销前价格是 $5 / $30。该日期之后需要重新核对。',
  'gpt-5': '已被 GPT-6 系列取代;保留用于长尾搜索。',
  'gpt-5-mini': '已被 GPT-6 系列取代;保留用于长尾搜索。',
  'gpt-5-nano': '已被 GPT-6 系列取代;保留用于长尾搜索。',
  'gpt-4.1': '已被 GPT-6 系列取代;保留用于长尾搜索。',
  'gpt-4.1-mini': '已被 GPT-6 系列取代;保留用于长尾搜索。',
  o3: '已被 GPT-6 系列取代;保留用于长尾搜索。',
  'o3-mini': '已被 GPT-6 系列取代;保留用于长尾搜索。',
  'o1-pro': '已停售;保留用于长尾搜索。',

  // ───────────────────────── Anthropic ─────────────────────────
  'claude-opus-4.5': '列在 Anthropic 的 Legacy models 板块;已被 Opus 5.5 取代。',
  'claude-sonnet-4.5': '列在 Anthropic 的 Legacy models 板块;已被 Sonnet 5 取代。',
  'claude-sonnet-4.6': '列在 Anthropic 的 Legacy models 板块;已被 Sonnet 5 取代。',
  'claude-fable-5': '列在 Anthropic 的 Legacy models 板块;已被 Fable 5.1 取代。',
  'claude-opus-5': '列在 Anthropic 的 Legacy models 板块;已被 Opus 5.5 取代。',
  'claude-opus-4.6': '列在 Anthropic 的 Legacy models 板块;已被 Opus 5.5 取代。',
  'claude-opus-4.7': '列在 Anthropic 的 Legacy models 板块;已被 Opus 5.5 取代。',
  'claude-opus-4.8': '列在 Anthropic 的 Legacy models 板块;已被 Opus 5.5 取代。',

  // ───────────────────────── Google ─────────────────────────
  'gemini-4-argon':
    '入门价: $2 / $10 / $0.10 适用至 2026-11-30,自 2026-12-01 起为 $4 / $20 / $0.20。仅支持隐式缓存,不支持显式缓存。批处理与 Flex 为标准价的一半,优先是 1.8×。',
  'gemini-3.8-flash':
    '入门价: $0.75 / $3.75 / $0.075 适用至 2026-12-31,自 2027-01-01 起为 $1.50 / $7.50 / $0.15。',

  // ───────────────────────── DeepSeek ─────────────────────────
  'deepseek-flash':
    '当前 checkpoint 为 DeepSeek-V4.1-Flash-1017(2026-10-17 发布),以 API 模型名 `deepseek-flash` 提供服务;开源权重发布在 Hugging Face / ModelScope。2026-09-10 的首发价格未变。首发 checkpoint 单独保留为一行(deepseek-flash-0910)。',
  'deepseek-flash-0910':
    '2026-09-10 的首发 checkpoint——发布公告里的对照表测的就是它。2026-10-17 被 1017 checkpoint 取代,API 已不再提供它(`deepseek-flash` 现在路由到 1017)。费率与在售 checkpoint 完全一致;保留用于长尾搜索,以及发布文章里的跑分表。',
  'deepseek-chat': '已被 DeepSeek V4 系列取代;保留用于长尾搜索。',
  'deepseek-reasoner': '已被 DeepSeek V4 系列取代;保留用于长尾搜索。',

  // ───────────────────────── MiniMax ─────────────────────────
  'minimax-m3.1-flash':
    '2026-10-19 发布;$0.15 / $0.60 / $0.015(¥1 / ¥4 / ¥0.1)。统一费率——没有长上下文档位,而且与 M3 不同,它不接受 service_tier=priority。',
  'minimax-m3':
    '2026-06-01 发布。service_tier=priority 的价格为 1.5×($0.45 / $1.80 / $0.09)。没有单独的缓存写入费用。超过 512k 时缓存输入价翻倍到 $0.12;cost.ts 会把输入乘数同时套用到缓存价上。',

  // ───────────────────────── 阶跃星辰 StepFun ─────────────────────────
  'step-5-preview':
    'Preview 版,2026-09-20 发布;权重于 2026-10-15 放出。缓存未命中的输入价已包含写入缓存;输出 token 包含思考链。',

  // ───────────────────────── Moonshot Kimi ─────────────────────────
  'kimi-k3.1-pro':
    '2026-10-24 发布;$2.00 / $10.00 / $0.20(¥13 / ¥68 / ¥1.30)每 1M token。缓存写入按 TTL 单独计费:5 分钟 $2.00,1 小时 $4.00。高速版价格翻倍,输出速度快 2× 到 3×。',
  'kimi-k3.1-pro-highspeed':
    '2026-10-24 发布;$4.00 / $20.00 / $0.20(¥26 / ¥136 / ¥1.30)每 1M token。智能与 Kimi K3.1 Pro 相同,输出速度快 2× 到 3×,价格是 2×。',
  'kimi-k3':
    '仍在售,而且比 Kimi K3.1 Pro 贵:$3.00 / $15.00 / $0.30(¥20 / ¥100 / ¥2.00)每 1M token。缓存写入按 TTL 单独计费:5 分钟 $3.00,1 小时 $6.00。',

  // ───────────────────────── Grok ─────────────────────────
  'grok-4': '已被 Grok 4.7 取代;保留用于长尾搜索。',
}

/**
 * Chinese names of the dated price bands, keyed by their English label.
 *
 * The English label lives in the price registry (`model-prices.ts`) — it is
 * the source of truth, the same way the English note is. This module is the
 * Chinese overlay, so a band name never has to live in two places.
 */
export const PRICE_WINDOW_LABELS_ZH: Record<string, string> = {
  'Promotional rate': '促销价',
  'Introductory rate': '入门价',
  'Standard rate': '标准价',
}

/**
 * Chinese names of the service tiers a vendor publishes next to the standard
 * rate, keyed by their English label.
 *
 * The English label lives in the price registry (`model-prices.ts`) — same
 * rule as the band names above: English is the source of truth, this file is
 * the Chinese overlay. Every tier in the registry carries a label, so the
 * label — not the tier's `kind` — is what a reader sees; without this
 * overlay the Chinese pages would print English tier names.
 *
 * `Flex` keeps its Latin form: it is the name of Google's product lane, the
 * same way the dictionary keeps `leaderboard.price.tierFlex` untranslated.
 */
export const PRICE_TIER_LABELS_ZH: Record<string, string> = {
  'Batch': '批处理',
  'Flex': 'Flex',
  'Priority': '优先',
  'Flat rate': '统一费率',
  'Long context ≥512k': '长上下文 ≥512k',
}

/**
 * Chinese notes of the service tiers, keyed by their English note.
 *
 * Same overlay rule as `MODEL_NOTES_ZH`: every price figure, multiplier and
 * product name is copied verbatim from the English note — never rounded,
 * converted or re-ordered.
 */
export const PRICE_TIER_NOTES_ZH: Record<string, string> = {
  'Runs at half the standard rate.': '按标准价的一半计费。',
  'Costs 1.8× the standard rate.': '为标准价的 1.8×。',
  'Flat rate — no long-context tier, and unlike M3 it does not accept service_tier=priority.':
    '统一费率——没有长上下文档位,而且与 M3 不同,它不接受 service_tier=priority。',
  'service_tier=priority costs 1.5× ($0.45 / $1.80 / $0.09).':
    'service_tier=priority 的价格为 1.5×($0.45 / $1.80 / $0.09)。',
  'Above 512k of input every meter doubles; the cached-input rate doubles to $0.12.':
    '输入超过 512k 时每个计费项都翻倍;缓存输入价翻倍到 $0.12。',
}

/** Suffix the OpenRouter clone appends to the id of the model it copies. */
const OPENROUTER_SUFFIX = '-via-openrouter'

/**
 * Localized name of a dated price band; falls back to the English label.
 *
 * Used by the pricing-rule translator, so a rule like
 * `Promotional rate (until 2026-11-21)` reads `促销价（至 2026-11-21）` on the
 * Chinese pages (`calculator.ruleWindowUntil`).
 */
export function priceWindowLabel(label: string, locale: string): string {
  if (locale !== 'zh') return label
  return PRICE_WINDOW_LABELS_ZH[label] ?? label
}

/**
 * Localized name of a service tier; falls back to the registry's English
 * label.
 *
 * Mirrors `priceWindowLabel`: the tier's label is what the vendor
 * published, so it is translated through the overlay rather than re-invented
 * from the tier's `kind`.
 */
export function priceTierLabel(label: string, locale: string): string {
  if (locale !== 'zh') return label
  return PRICE_TIER_LABELS_ZH[label] ?? label
}

/**
 * Localized note of a service tier; falls back to the registry's English
 * note. Same overlay rule as `priceTierLabel`.
 */
export function priceTierNote(note: string, locale: string): string {
  if (locale !== 'zh') return note
  return PRICE_TIER_NOTES_ZH[note] ?? note
}

/** Look a Chinese note up without widening the type to `string`. */
function zhNote(id: string): string | undefined {
  const note: string | undefined = MODEL_NOTES_ZH[id]
  return note
}

/**
 * Localized note for a model; falls back to the registry's English note.
 *
 * - `en` returns the registry note untouched.
 * - `zh` returns the Chinese note for the model id. The OpenRouter variant
 *   clones a model and rewrites its id (`<id>-via-openrouter`), so a miss on
 *   the exact id retries with the base id before giving up.
 */
export function modelNote(
  model: Pick<ModelPrice, 'id' | 'note'>,
  locale: Locale,
): string | undefined {
  if (locale === 'zh') {
    const exact = zhNote(model.id)
    if (exact !== undefined) return exact

    const baseId = model.id.endsWith(OPENROUTER_SUFFIX)
      ? model.id.slice(0, -OPENROUTER_SUFFIX.length)
      : model.id
    if (baseId !== model.id) {
      const base = zhNote(baseId)
      if (base !== undefined) return base
    }
  }
  return model.note
}
