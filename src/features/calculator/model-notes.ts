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

  // ───────────────────────── Grok ─────────────────────────
  'grok-4': '已被 Grok 4.7 取代;保留用于长尾搜索。',
}

/** Suffix the OpenRouter clone appends to the id of the model it copies. */
const OPENROUTER_SUFFIX = '-via-openrouter'

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
