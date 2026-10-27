/**
 * Source registry for every leaderboard score.
 *
 * Every score in `models.ts` carries a `sourceUrl`. This file says what each
 * of those URLs actually is, so the UI can label a number honestly instead of
 * printing a bare link:
 *
 *  - `vendor`         — the model vendor published it (launch post, model
 *                       card, evaluation methodology). Vendor numbers are
 *                       real, but they are measured in the vendor's own
 *                       harness, so they are not directly comparable with a
 *                       third party's measurement of the same benchmark.
 *  - `third-party`    — an independent harness (Artificial Analysis, a public
 *                       leaderboard, a comparison site).
 *  - `reference-table`— our own curated reference table, transcribed from a
 *                       published table.
 *
 * The URLs are duplicated here on purpose: `models.ts` keeps them as private
 * constants, and the guard test in `__tests__/scoring.node.test.ts` fails the
 * build when a score cites a URL that is not in this map — so the two can
 * never drift apart silently.
 */

/** How a score's source relates to the model vendor. */
export type SourceKind = 'vendor' | 'third-party' | 'reference-table'

/** What a source URL is. */
export interface SourceInfo {
  /** Human-facing name of the source. */
  name: string
  /** Whether the source is the vendor, an independent third party, or ours. */
  kind: SourceKind
}

/** Every source URL cited by a leaderboard score, keyed by the URL. */
export const SOURCES: Record<string, SourceInfo> = {
  // ── our reference table ────────────────────────────────────────────────
  'https://mp.weixin.qq.com/s/qg0NU3NNUbp1co2PdkAPAg': {
    name: 'DeepSeek V4.1-Flash launch post (owner reference table)',
    kind: 'reference-table',
  },

  // ── vendor sources ─────────────────────────────────────────────────────
  'https://api-docs.deepseek.com/news/news261017/': {
    name: 'DeepSeek docs — V4.1-Flash-1017 announcement',
    kind: 'vendor',
  },
  'https://deepmind.google/models/model-cards/gemini-3-1-pro/': {
    name: 'Google DeepMind — Gemini 3.1 Pro model card',
    kind: 'vendor',
  },
  'https://deepmind.google/models/evals-methodology/gemini-4-argon': {
    name: 'Google DeepMind — Gemini 4 Argon evaluation methodology',
    kind: 'vendor',
  },
  'https://www.anthropic.com/news/claude-opus-5-5': {
    name: 'Anthropic — Claude Opus 5.5 announcement',
    kind: 'vendor',
  },
  'https://openai.com/index/introducing-gpt-6-1-terra/': {
    name: 'OpenAI — Introducing GPT-6.1 Terra',
    kind: 'vendor',
  },
  'https://www.minimax.cn/blog/minimax-m31f': {
    name: 'MiniMax — M3.1 Flash launch post',
    kind: 'vendor',
  },
  'https://www.minimax.cn/blog/minimax-m3': {
    name: 'MiniMax — M3 launch post',
    kind: 'vendor',
  },
  'https://huggingface.co/MiniMaxAI/MiniMax-M3': {
    name: 'MiniMax — M3 model card',
    kind: 'vendor',
  },
  'https://www.stepfun.com/step-5-preview': {
    name: 'StepFun — Step 5 Preview: Advancing the Pareto Frontier',
    kind: 'vendor',
  },
  'https://kimi.com/blog/kimi-k3-1-pro': {
    name: 'Kimi — Introducing Kimi K3.1 Pro',
    kind: 'vendor',
  },
  'https://mp.weixin.qq.com/s/Q6Z-skAUH_na9g37VWbHew': {
    name: 'Moonshot Kimi — Kimi K3.1 Pro launch post (WeChat)',
    kind: 'vendor',
  },
  'https://www.anthropic.com/claude-opus-5-5-system-card': {
    name: 'Anthropic — Claude Opus 5.5 system card',
    kind: 'vendor',
  },
  'https://www.anthropic.com/claude-fable-5-1-mythos-5-1-system-card': {
    name: 'Anthropic — Claude Fable 5.1 system card',
    kind: 'vendor',
  },

  // ── third-party sources ────────────────────────────────────────────────
  'https://benchlm.ai/compare/gemini-3-1-pro-vs-grok-4-7': {
    name: 'BenchLM comparison',
    kind: 'third-party',
  },
  'https://benchlm.ai/benchmarks/hlenotools': {
    name: 'BenchLM — HLE without tools',
    kind: 'third-party',
  },
  'https://www.benchleader.com/compare/gemini-3-1-pro-vs-grok-4-7': {
    name: 'BenchLeader comparison (Artificial Analysis figures)',
    kind: 'third-party',
  },
  'https://www.snowflake.com/en/blog/openai-gpt-6-astra-snowflake-cortex-ai/': {
    name: 'Snowflake Cortex AI — GPT-6 Astra launch-partner table',
    kind: 'third-party',
  },
  'https://openrouter.ai/openai/gpt-6-astra': {
    name: 'OpenRouter — GPT-6 Astra (Artificial Analysis figures)',
    kind: 'third-party',
  },
}

/**
 * The source a URL belongs to, if we know it.
 * Returns undefined for an unknown or absent URL.
 */
export function sourceInfo(url: string | undefined): SourceInfo | undefined {
  if (!url) return undefined
  return SOURCES[url]
}

/** Alias of {@link sourceInfo}, for callers that read better with "find". */
export const findSource = sourceInfo

/** The kind of a source, if we know it. */
export function sourceKind(url: string | undefined): SourceKind | undefined {
  return sourceInfo(url)?.kind
}
