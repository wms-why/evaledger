import type { BenchmarkScore, LeaderboardModel, LeaderboardRegistry, ScoreUnit } from './types'

/**
 * Hand-curated leaderboard registry.
 *
 * Five provenance lanes:
 *  - The DeepSeek family, GLM 5.3 and Kimi K3 scores come from the owner's
 *    reference table (captured 2026-10-19), itself from the DeepSeek V4.1
 *    Flash launch post — hence one shared `sourceUrl`.
 *  - DeepSeek V4.1-Flash 1017 is a **separate checkpoint** with its own
 *    announcement table (2026-10-17). It is a separate row, never merged into
 *    the 0910 launch row: the two tables measure different weights, and the
 *    1017 table even re-states the 0910 checkpoint's numbers in its second
 *    column, which is why the two rows can be read side by side.
 *  - Claude Opus 5.5 and GPT-6 Astra were added on 2026-10-20 from their
 *    vendor launch tables plus Artificial Analysis. Both rows are partial and
 *    use vendor harnesses; their per-score notes name the setting.
 *  - Gemini 3.1 Pro and Grok 4.7 were read from public benchmark sites /
 *    the vendor model card; each score carries its own `sourceUrl` and a
 *    `note` when the harness differs from the reference table.
 *  - MiniMax M3.1 Flash comes from the vendor launch post (2026-10-19);
 *    its scores carry that post as `sourceUrl` and its coverage is partial.
 *  - Step 5 Preview comes from StepFun's own launch table (2026-09-20), which
 *    prints it at High effort against rivals at Max. We keep only the rows
 *    with a benchmark id here; every score's note quotes the rival columns
 *    as StepFun's measurements.
 *  - MiniMax M3 comes from the vendor's launch post and its own model-card
 *    comparison table. Scores the post states are cited to the post; the rest
 *    are cited to the model card, which is the only place MiniMax publishes
 *    them. Those are vendor-measured (MiniMax's internal harness, Claude Code
 *    scaffolding) — not an independent leaderboard.
 *  - Gemini 4 Argon comes from Google's own model card (October 2026), which
 *    prints it next to GPT-6 Astra, Claude Fable 5.1 and Claude Opus 5.5 on
 *    nineteen benchmarks. We keep the ten rows that have a place in our
 *    benchmark registry; the other nine are absent rather than interpolated.
 *    The rival numbers Google prints ride along in the notes — they are
 *    Google's measurements of other vendors' models, quoted as such.
 *  - Kimi K3.1 Pro comes from Moonshot's launch announcement (2026-10-24).
 *    Its numbers are Kimi's own, measured on Kimi's harnesses at max thinking
 *    effort; the rival columns are Moonshot's measurements of other vendors'
 *    models, except where the footnote names a public leaderboard instead.
 *    Claude Fable 5.1 is the odd one out: it has no Anthropic table behind
 *    it, and its row is the rival column of that same Kimi announcement —
 *    each note says where the figure itself comes from.
 *  - GPT-6.1 Terra comes from OpenAI's launch post (2026-10-27): the
 *    Terminal-Bench 4.0 figure in the prose, and the point in OpenAI's own
 *    cost-versus-score chart for Agents' Last Exam, which prints the effort
 *    setting and the cost per task for every model in it. Both are
 *    OpenAI's measurements in OpenAI's harness; the rival columns in that
 *    chart are OpenAI's numbers for other vendors' models.
 *
 * Never drop a caveat the source printed. Missing benchmarks are simply
 * absent — no interpolation.
 */
export const REGISTRY_VERSION = '0.9.0'

/** DeepSeek V4.1 Flash launch post (owner-supplied reference). */
const SOURCE_URL = 'https://mp.weixin.qq.com/s/qg0NU3NNUbp1co2PdkAPAg'
/**
 * DeepSeek V4.1-Flash-1017 announcement (vendor news post, 2026-10-17).
 * Its comparison table covers the 1017 checkpoint, the 0910 launch
 * checkpoint, Kimi K3, GLM 5.3, GPT-5.6-Sol and Claude Opus 5.
 */
const DEEPSEEK_FLASH_1017 = 'https://api-docs.deepseek.com/news/news261017/'
/** Gemini 3.1 Pro model card. */
const GEMINI_CARD = 'https://deepmind.google/models/model-cards/gemini-3-1-pro/'
/** benchlm compare page (Vals harness figures). */
const BENCHLM = 'https://benchlm.ai/compare/gemini-3-1-pro-vs-grok-4-7'
/** BenchLeader compare page (Artificial Analysis figures). */
const BENCHLEADER = 'https://www.benchleader.com/compare/gemini-3-1-pro-vs-grok-4-7'
/** MiniMax M3.1 Flash launch post (vendor blog, 2026-10-19). */
const MINIMAX_M31F_BLOG = 'https://www.minimax.cn/blog/minimax-m31f'
/** MiniMax M3 launch post (vendor blog, 2026-06-01). */
const MINIMAX_M3_BLOG = 'https://www.minimax.cn/blog/minimax-m3'
/** Anthropic's Opus 5.5 launch table (vendor-reported; footnotes carry the harness). */
const ANTHROPIC_OPUS_55 = 'https://www.anthropic.com/news/claude-opus-5-5'
/** BenchLM's HLE-without-tools table; cites the Opus 5.5 system card, Table 8.1.A. */
const BENCHLM_HLE = 'https://benchlm.ai/benchmarks/hlenotools'
/** Snowflake launch-partner table, sourced from OpenAI's GPT-6 Astra announcement. */
const OPENAI_GPT6_ASTRA = 'https://www.snowflake.com/en/blog/openai-gpt-6-astra-snowflake-cortex-ai/'
/** Artificial Analysis rows mirrored on OpenRouter. */
const OPENROUTER_ASTRA = 'https://openrouter.ai/openai/gpt-6-astra'
/** MiniMax M3 model card — carries the vendor's own comparison table. */
const MINIMAX_M3_CARD = 'https://huggingface.co/MiniMaxAI/MiniMax-M3'
/**
 * StepFun's Step 5 Preview launch page ("Advancing the Pareto Frontier",
 * 2026-09-20). Its 39-row table is the only place StepFun publishes scores
 * for this model, so every Step 5 Preview score is cited to it.
 */
const STEPFUN_LAUNCH = 'https://www.stepfun.com/step-5-preview'
/**
 * Google's official evaluation methodology for Gemini 4 Argon (5 pp.). It
 * carries the results table on page 5 and, more importantly, the per-row
 * footnotes: which rows Google ran itself, which come from a public
 * leaderboard, which come from a rival's own system card, and under which
 * harness. Those caveats travel with every score.
 */
const ARGON_EVALS = 'https://deepmind.google/models/evals-methodology/gemini-4-argon'
/**
 * MiniMax publishes its own numbers: measured on its internal infrastructure
 * with Claude Code as the scaffolding, not on a third-party leaderboard. The
 * caveat travels with every score it takes from the model card.
 */
const VENDOR_MEASURED = 'Vendor-measured (MiniMax internal infra, Claude Code scaffolding)'
/**
 * Kimi's K3.1 Pro launch announcement (2026-10-24). The blog carries the
 * English write-up and the footnotes; the WeChat post carries the same
 * tables. Every Kimi K3.1 Pro score below is transcribed from it.
 */
const KIMI_K31_POST = 'https://kimi.com/blog/kimi-k3-1-pro'
/**
 * OpenAI's launch post for GPT-6.1 Terra (2026-10-27). Two things are read
 * out of it: the Terminal-Bench 4.0 figure in the prose, and the
 * Agents' Last Exam chart, whose points carry the effort setting and the
 * cost per task for every model in it.
 */
const OPENAI_GPT61_TERRA = 'https://openai.com/index/introducing-gpt-6-1-terra/'

/** Timestamp of the original collection run — most scores were observed then. */
const COLLECTED_AT = '2026-10-19T21:26:00+08:00'
/** Timestamp of the 2026-10-20 audit — only the rows added/changed today use it. */
const OBSERVED_AT = '2026-10-20T15:30:00+08:00'
/** Timestamp of the 2026-10-20 late pass that added Gemini 4 Argon. */
const ARGON_OBSERVED_AT = '2026-10-20T21:20:00+08:00'
/** Timestamp of the 2026-10-23 pass that added Step 5 Preview. */
const STEP_OBSERVED_AT = '2026-10-23T10:00:00+08:00'
/** Timestamp of the 2026-10-24 pass that added Kimi K3.1 Pro. */
const KIMI_OBSERVED_AT = '2026-10-24T09:40:00+08:00'
/** Timestamp of the 2026-10-27 pass that added GPT-6.1 Terra. */
const TERRA_OBSERVED_AT = '2026-10-27T16:10:00+08:00'
/** DeepSeek V4.1 Flash pricing went live 2026-09-10; used as the ship date. */
const DEEPSEEK_FLASH_RELEASE = '2026-09-10'
/** The 1017 checkpoint shipped 2026-10-17 (vendor announcement date). */
const DEEPSEEK_FLASH_1017_RELEASE = '2026-10-17'

interface ScoreOptions {
  unit?: ScoreUnit
  source?: string
  note?: string
  observedAt?: string
}

function sc(benchmark: string, score: number, opts: ScoreOptions = {}): BenchmarkScore {
  return {
    benchmark,
    score,
    unit: opts.unit ?? 'percent',
    sourceUrl: opts.source ?? SOURCE_URL,
    observedAt: opts.observedAt ?? COLLECTED_AT,
    note: opts.note,
  }
}

const claudeOpus55: LeaderboardModel = {
  id: 'claude-opus-5.5',
  vendor: 'claude',
  kind: 'opus',
  version: 'opus-5.5',
  displayName: 'Claude Opus 5.5',
  priceId: 'claude-opus-5.5',
  releaseDate: '2026-09-22',
  updatedAt: OBSERVED_AT,
  scores: [
    sc('hle', 64.4, {
      source: BENCHLM_HLE,
      observedAt: OBSERVED_AT,
      note: 'vendor card, max effort, no tools',
    }),
    sc('terminal-bench-4.0', 66.4, {
      source: ANTHROPIC_OPUS_55,
      observedAt: OBSERVED_AT,
      note: 'vendor-reported, xhigh effort; Artificial Analysis measures 59.6 in its own harness',
    }),
    sc('hle-tools', 67.7, {
      source: ANTHROPIC_OPUS_55,
      observedAt: OBSERVED_AT,
      note: 'vendor-reported, with tools',
    }),
    sc('chartography-tools', 89.0, {
      source: ANTHROPIC_OPUS_55,
      observedAt: OBSERVED_AT,
      note: 'vendor-reported, with tools',
    }),
  ],
}

const gpt6Astra: LeaderboardModel = {
  id: 'gpt-6-astra',
  vendor: 'openai',
  kind: 'gpt',
  version: '6-astra',
  displayName: 'GPT-6 Astra',
  priceId: 'gpt-6-astra',
  releaseDate: '2026-09-03',
  updatedAt: OBSERVED_AT,
  scores: [
    sc('gpqa-diamond', 96.0, {
      source: OPENAI_GPT6_ASTRA,
      observedAt: OBSERVED_AT,
      note: 'OpenAI-reported maximum at any effort setting',
    }),
    sc('hle', 54.7, {
      source: OPENROUTER_ASTRA,
      observedAt: OBSERVED_AT,
      note: 'Artificial Analysis, max effort',
    }),
    sc('terminal-bench-2.1', 89.9, {
      source: OPENROUTER_ASTRA,
      observedAt: OBSERVED_AT,
      note: 'Artificial Analysis, high effort',
    }),
    sc('terminal-bench-4.0', 57.9, {
      source: OPENAI_GPT6_ASTRA,
      observedAt: OBSERVED_AT,
      note: 'OpenAI-reported maximum; Anthropic reports the same 57.9 at high effort',
    }),
  ],
}

/**
 * GPT-6.1 Terra — OpenAI's cost-intelligence workhorse, launched 2026-10-27.
 *
 * Both scores come from OpenAI's own launch material, and both carry the
 * setting they were measured at:
 *
 *  - **Terminal-Bench 4.0** is the figure in the launch prose, at max
 *    reasoning effort. OpenAI states it as more than double the published
 *    score of GPT-5.6 Terra, and that rival figure rides along in the note
 *    the way every vendor table's rival column does.
 *  - **Agents' Last Exam** is a point in OpenAI's own cost-versus-score
 *    chart, and the chart prints the effort setting and the cost per task
 *    for every model in it — so the note lists the whole ladder (Low
 *    55.9 → Max 60.0) and the rivals' max-effort points, because the
 *    comparison OpenAI makes in the prose is a *cost* comparison.
 *
 * The caveats that travel with the numbers:
 *  - **The chart is OpenAI's measurement, in OpenAI's harness.** The rival
 *    columns are OpenAI's numbers for other vendors' models, not an
 *    independent leaderboard's — the same rule the Gemini and Kimi rows
 *    follow.
 *  - **The chart is titled Agents' Last Exam v1**, while the other rows in
 *    this column come from the v1.1 task set. Read the column with the
 *    harness note, not as a like-for-like ranking.
 */
/**
 * The two GPT-6.1 Terra score caveats, exported so the record ledger pins the
 * very same strings instead of a hand-copied second draft. Two copies of one
 * caveat is how a caveat gets lost.
 */
export const TERRA_TERMINAL_BENCH_NOTE =
  'OpenAI launch post, max reasoning effort; the post compares it with GPT-5.6 Terra 21.5, the published figure it doubles.'
export const TERRA_AGENTS_LAST_EXAM_NOTE =
  'OpenAI launch chart, max reasoning effort, $1.01 per task; the chart is titled Agents\' Last Exam v1. Same chart at max effort: Claude Opus 5.5 63.2, GPT-6 Astra 59.3, GPT-6.1 Sol 58.6, GPT-6 Luna 50.9, GPT-5.6 Terra 50.7. Terra at lower effort: Low 55.9, Medium 57.6, High 57.2, Xhigh 58.5.'

const gpt61Terra: LeaderboardModel = {
  id: 'gpt-6.1-terra',
  vendor: 'openai',
  kind: 'gpt',
  version: '6.1-terra',
  displayName: 'GPT-6.1 Terra',
  priceId: 'gpt-6.1-terra',
  // The launch page prints only "2026"; OpenAI's developer changelog dates
  // the entry that says "Released GPT-6.1 Terra" to 2026-10-26.
  releaseDate: '2026-10-26',
  introduced: '2026-10-26',
  updatedAt: TERRA_OBSERVED_AT,
  scores: [
    sc('agents-last-exam', 60.0, {
      source: OPENAI_GPT61_TERRA,
      observedAt: TERRA_OBSERVED_AT,
      note: TERRA_AGENTS_LAST_EXAM_NOTE,
    }),
    sc('terminal-bench-4.0', 50.3, {
      source: OPENAI_GPT61_TERRA,
      observedAt: TERRA_OBSERVED_AT,
      note: TERRA_TERMINAL_BENCH_NOTE,
    }),
  ],
}

const claudeOpus5: LeaderboardModel = {
  id: 'claude-opus-5',
  vendor: 'claude',
  kind: 'opus',
  version: 'opus-5',
  displayName: 'Claude Opus 5',
  priceId: 'claude-opus-5',
  updatedAt: COLLECTED_AT,
  scores: [
    sc('gpqa-diamond', 93.4),
    sc('hle', 56.3),
    sc('terminal-bench-2.1', 89.1),
    sc('terminal-bench-3.0', 43.3),
    sc('terminal-bench-4.0', 51.8),
    sc('deepswe-v1.1', 74.0),
    sc('programbench', 37.0),
    sc('nl2repo-bench', 75.3),
    sc('exploitgym', 22.1),
    sc('hle-tools', 63.6),
    sc('automation-bench', 50.3),
    sc('agents-last-exam', 28.6),
    sc('chartography-tools', 84.0),
    sc('babyvision-tools', 94.1),
    sc('zerobench-main-tools', 52.0),
  ],
}

const gpt56Sol: LeaderboardModel = {
  id: 'gpt-5.6-sol',
  vendor: 'openai',
  kind: 'gpt',
  version: '5.6-sol',
  displayName: 'GPT 5.6-Sol',
  priceId: 'gpt-5.6-sol',
  updatedAt: COLLECTED_AT,
  scores: [
    sc('gpqa-diamond', 94.1),
    sc('hle', 44.5),
    sc('terminal-bench-2.1', 88.8),
    sc('terminal-bench-3.0', 34.4),
    sc('terminal-bench-4.0', 39.9),
    sc('deepswe-v1.1', 73.0),
    sc('programbench', 23.0),
    sc('nl2repo-bench', 56.8),
    sc('cybergym', 84.5),
    sc('sec-bench-pro', 74.3),
    sc('exploitgym', 33.7),
    sc('automation-bench', 45.8),
    sc('agents-last-exam', 26.7),
    sc('chartography-tools', 79.9),
    sc('babyvision-tools', 88.9),
    sc('zerobench-main-tools', 53.0),
  ],
}

/**
 * The launch checkpoint — the weights the 2026-09-10 reference table was
 * measured on. Kept as its own row: the API has since moved to the 1017
 * checkpoint, and merging the two score sets would make the launch table
 * look like it described today's weights.
 */
const deepseekV41Flash: LeaderboardModel = {
  id: 'deepseek-v4.1-flash',
  vendor: 'deepseek',
  kind: 'flash',
  version: 'v4.1-flash-0910',
  displayName: 'DeepSeek V4.1-Flash 0910',
  priceId: 'deepseek-flash-0910',
  releaseDate: DEEPSEEK_FLASH_RELEASE,
  introduced: DEEPSEEK_FLASH_RELEASE,
  retiredAt: DEEPSEEK_FLASH_1017_RELEASE,
  updatedAt: COLLECTED_AT,
  scores: [
    sc('gpqa-diamond', 90.9),
    sc('hle', 36.8, { note: '39.1 on text-only subset' }),
    sc('codeforces', 3471, { unit: 'rating' }),
    sc('matharena-apex', 65.6),
    sc('terminal-bench-2.1', 90.6),
    sc('terminal-bench-3.0', 30.0),
    sc('terminal-bench-4.0', 31.2),
    sc('deepswe-v1.1', 74.2),
    sc('programbench', 20.3),
    sc('nl2repo-bench', 65.4),
    sc('cybergym', 88.1),
    sc('sec-bench-pro', 62.8),
    sc('exploitgym', 15.3),
    sc('hle-tools', 63.9),
    sc('automation-bench', 54.8),
    sc('agents-last-exam', 31.8),
    sc('chartography-tools', 78.9),
    sc('babyvision-tools', 89.6),
    sc('zerobench-main-tools', 49.0),
  ],
}

/**
 * The 1017 checkpoint — the weights the API serves today under the model
 * name `deepseek-flash`. Its own announcement table (2026-10-17) covers 11
 * benchmarks and re-states the 0910 checkpoint's numbers in its second
 * column, so the two rows are directly comparable.
 */
const deepseekV41Flash1017: LeaderboardModel = {
  id: 'deepseek-v4.1-flash-1017',
  vendor: 'deepseek',
  kind: 'flash',
  version: 'v4.1-flash-1017',
  displayName: 'DeepSeek V4.1-Flash 1017',
  priceId: 'deepseek-flash',
  releaseDate: DEEPSEEK_FLASH_1017_RELEASE,
  introduced: DEEPSEEK_FLASH_1017_RELEASE,
  supersedes: 'deepseek-v4.1-flash',
  updatedAt: OBSERVED_AT,
  scores: [
    sc('hle', 42.6, {
      source: DEEPSEEK_FLASH_1017,
      observedAt: OBSERVED_AT,
      note: '44.0 on text-only subset',
    }),
    sc('terminal-bench-4.0', 42.3, {
      source: DEEPSEEK_FLASH_1017,
      observedAt: OBSERVED_AT,
      note: 'measured with the Claude Code framework',
    }),
    sc('deepswe-v1.1', 77.0, {
      source: DEEPSEEK_FLASH_1017,
      observedAt: OBSERVED_AT,
      note: 'Mini-SWE-V2 framework',
    }),
    sc('programbench', 29.1, { source: DEEPSEEK_FLASH_1017, observedAt: OBSERVED_AT }),
    sc('nl2repo-bench', 68.2, { source: DEEPSEEK_FLASH_1017, observedAt: OBSERVED_AT }),
    sc('automation-bench', 60.5, { source: DEEPSEEK_FLASH_1017, observedAt: OBSERVED_AT }),
    sc('agents-last-exam', 35.4, { source: DEEPSEEK_FLASH_1017, observedAt: OBSERVED_AT }),
    sc('apex-bench-v1.1', 72.1, {
      source: DEEPSEEK_FLASH_1017,
      observedAt: OBSERVED_AT,
      note: 'Apex Bench v1.1 — not MathArena Apex',
    }),
    sc('chartography-tools', 83.0, { source: DEEPSEEK_FLASH_1017, observedAt: OBSERVED_AT }),
    sc('babyvision-tools', 92.5, { source: DEEPSEEK_FLASH_1017, observedAt: OBSERVED_AT }),
    sc('zerobench-main-tools', 51.0, {
      source: DEEPSEEK_FLASH_1017,
      observedAt: OBSERVED_AT,
      note: 'Pass@5',
    }),
  ],
}

const deepseekV4Pro0813: LeaderboardModel = {
  id: 'deepseek-v4-pro',
  vendor: 'deepseek',
  kind: 'pro',
  version: 'v4-pro-0813',
  displayName: 'DeepSeek V4-Pro 0813',
  priceId: 'deepseek-v4-pro',
  updatedAt: COLLECTED_AT,
  scores: [
    sc('gpqa-diamond', 92.4),
    sc('hle', 42.7, { note: 'text-only subset only' }),
    sc('codeforces', 3348, { unit: 'rating' }),
    sc('matharena-apex', 65.3),
    sc('terminal-bench-2.1', 87.9),
    sc('terminal-bench-3.0', 11.8),
    sc('terminal-bench-4.0', 12.4),
    sc('deepswe-v1.1', 62.7),
    sc('programbench', 15.5),
    sc('nl2repo-bench', 61.5),
    sc('cybergym', 83.3),
    sc('sec-bench-pro', 56.4),
    sc('exploitgym', 5.4),
    sc('hle-tools', 60.0),
    sc('automation-bench', 43.2),
    sc('agents-last-exam', 25.7),
  ],
}

const deepseekV4Flash0731: LeaderboardModel = {
  id: 'deepseek-v4-flash-0731',
  vendor: 'deepseek',
  kind: 'flash',
  version: 'v4-flash-0731',
  displayName: 'DeepSeek V4-Flash 0731',
  updatedAt: COLLECTED_AT,
  scores: [
    sc('gpqa-diamond', 89.9),
    sc('hle', 37.8, { note: 'text-only subset only' }),
    sc('codeforces', 3289, { unit: 'rating' }),
    sc('matharena-apex', 58.6),
    sc('terminal-bench-2.1', 82.7),
    sc('terminal-bench-3.0', 7.6),
    sc('terminal-bench-4.0', 7.0),
    sc('deepswe-v1.1', 54.4),
    sc('nl2repo-bench', 54.2),
    sc('cybergym', 76.7),
    sc('sec-bench-pro', 30.9),
    sc('exploitgym', 1.8),
    sc('hle-tools', 51.5),
    sc('automation-bench', 37.7),
    sc('agents-last-exam', 25.2),
  ],
}

const glm53: LeaderboardModel = {
  id: 'glm-5.3',
  vendor: 'glm',
  kind: 'other',
  version: '5.3',
  displayName: 'GLM 5.3',
  updatedAt: COLLECTED_AT,
  scores: [
    sc('gpqa-diamond', 88.1),
    sc('hle', 42.0, { note: 'text-only subset only' }),
    sc('terminal-bench-2.1', 88.2),
    sc('terminal-bench-3.0', 28.3),
    sc('terminal-bench-4.0', 37.9),
    sc('deepswe-v1.1', 66.9),
    sc('programbench', 19.0),
    sc('nl2repo-bench', 58.0),
    sc('cybergym', 84.5),
    sc('exploitgym', 15.0),
    sc('hle-tools', 62.5),
    sc('automation-bench', 48.8),
    sc('agents-last-exam', 28.5),
  ],
}

const kimiK3: LeaderboardModel = {
  id: 'kimi-k3',
  vendor: 'kimi',
  kind: 'other',
  version: 'k3',
  displayName: 'Kimi K3',
  priceId: 'kimi-k3',
  updatedAt: COLLECTED_AT,
  scores: [
    sc('gpqa-diamond', 92.9),
    sc('hle', 43.5),
    sc('matharena-apex', 65.6),
    sc('terminal-bench-2.1', 88.3),
    sc('terminal-bench-3.0', 17.7),
    sc('terminal-bench-4.0', 12.6),
    sc('deepswe-v1.1', 67.5),
    sc('programbench', 17.5),
    sc('nl2repo-bench', 58.0),
    sc('cybergym', 80.0),
    sc('hle-tools', 59.8),
    sc('automation-bench', 46.7),
    sc('agents-last-exam', 27.6),
    sc('chartography-tools', 68.1),
    sc('babyvision-tools', 85.7),
    sc('zerobench-main-tools', 41.0),
  ],
}

/**
 * Kimi K3.1 Pro — Moonshot's flagship, shipped 2026-10-24.
 *
 * Every score is Moonshot's own, from the launch announcement: Kimi measured
 * the model itself (Claude Code harness on the coding rows, Kimi Code on
 * Agents' Last Exam, the Kimi Agent harness on OSWorld) and published the
 * rival columns next to it. Three things travel with every number:
 *
 *  - **The harness is Kimi's.** These are vendor-measured figures, not an
 *    independent leaderboard's, and the rival columns are Moonshot's
 *    measurements of other vendors' models except where the footnotes say
 *    otherwise (Terminal-Bench, Terminal-Bench Science and SWE-Marathon quote
 *    the public leaderboards, GDPVal-AA and GDP.pdf quote Artificial
 *    Analysis).
 *  - **Every model was run at max thinking effort.** No effort setting is
 *    matched against the rivals.
 *  - **The rows with no id in our benchmark registry are absent, not
 *    interpolated.** Kimi's own internal Kimi Code Bench 3.0 is one of them:
 *    a benchmark with a single vendor's numbers and no public leaderboard is
 *    not a row on this site.
 */
const kimiK31Pro: LeaderboardModel = {
  id: 'kimi-k3.1-pro',
  vendor: 'kimi',
  kind: 'other',
  version: 'k3.1-pro',
  displayName: 'Kimi K3.1 Pro',
  priceId: 'kimi-k3.1-pro',
  releaseDate: '2026-10-24',
  introduced: '2026-10-24',
  updatedAt: KIMI_OBSERVED_AT,
  scores: [
    sc('terminal-bench-4.0', 65.7, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table, Claude Code harness, max thinking effort. Same table: Claude Opus 5.5 66.4, GPT-6 Astra 58.2',
    }),
    sc('terminal-bench-science-0.1', 38.1, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table, Claude Code harness. Same table: Claude Fable 5.1 40.0',
    }),
    sc('agents-last-exam', 43.2, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table, Kimi Code harness on the official v1.1 dataset; runs that bypass the task requirements score zero. Same table: Claude Opus 5.5 42.6',
    }),
    sc('officeqa-pro-v2', 64.4, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table, Claude Code harness; the whole PDF corpus is given as rendered images',
    }),
    sc('gdpval-aa', 1846.0, {
      unit: 'absolute',
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table; the score is cited from Artificial Analysis. Same table: Claude Opus 5.5 1866.0',
    }),
    sc('hle-tools', 79.8, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table, full evaluation set with tools. Same table: Claude Opus 5.5 67.7',
    }),
    sc('chartography-tools', 90.2, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table, averaged over five runs. Same table: GPT-6 Astra 91.0',
    }),
    sc('swe-marathon', 51.7, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table, Claude Code harness; the rival columns come from the official SWE-Marathon leaderboard',
    }),
    sc('benchcad', 92.7, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table, with tools, Claude Code harness. Same table: Claude Opus 5.5 96.2, GPT-6 Astra 95.9',
    }),
    sc('frontier-finance', 58.6, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table, official finance agent v2 harness. Same table: Claude Fable 5.1 60.8',
    }),
    sc('osworld-2.1', 79.6, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table, Kimi Agent harness on the official OSWorld v2 repo. Same table: Claude Fable 5.1 80.7',
    }),
    sc('gdp-pdf', 34.6, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table; the PDF is processed in a sandbox with IPython and graded per rubric criterion. The GLM and DeepSeek columns are cited from Artificial Analysis',
    }),
    sc('zerobench-main-tools', 63.0, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: 'Vendor table, pass@5, averaged over five runs. Same table: Claude Opus 5.5 61.0',
    }),
  ],
}

/**
 * Claude Fable 5.1 — Anthropic's other flagship line.
 *
 * This row has no Anthropic launch table behind it: the numbers are the
 * rival columns of Moonshot's K3.1 Pro announcement, which is where the
 * model appears next to Kimi K3.1 Pro. Each note says where the figure
 * itself comes from (Anthropic's system card, a public leaderboard or
 * Artificial Analysis) — Moonshot printed them, but it did not measure all
 * of them itself.
 */
const claudeFable51: LeaderboardModel = {
  id: 'claude-fable-5.1',
  vendor: 'claude',
  kind: 'fable',
  version: 'fable-5.1',
  displayName: 'Claude Fable 5.1',
  priceId: 'claude-fable-5.1',
  updatedAt: KIMI_OBSERVED_AT,
  scores: [
    sc('terminal-bench-4.0', 57.9, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table; the value is the maximum reported in the vendor blog or the official Terminal-Bench 4.0 leaderboard",
    }),
    sc('terminal-bench-science-0.1', 40.0, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table; the value comes from the official Terminal-Bench Science leaderboard",
    }),
    sc('officeqa-pro-v2', 54.5, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table, Claude Code harness",
    }),
    sc('gdpval-aa', 1754.0, {
      unit: 'absolute',
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table; the score is cited from Artificial Analysis",
    }),
    sc('hle-tools', 65.6, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table, full evaluation set with tools",
    }),
    sc('chartography-tools', 88.4, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table, averaged over five runs",
    }),
    sc('swe-marathon', 45.6, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table; the value comes from the official SWE-Marathon leaderboard",
    }),
    sc('benchcad', 92.6, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table; the announcement takes this value from the Claude Opus 5.5 system card",
    }),
    sc('frontier-finance', 60.8, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table, official finance agent v2 harness",
    }),
    sc('osworld-2.1', 80.7, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table, evaluated in the official OSWorld v2 repo with the Kimi Agent harness",
    }),
    sc('gdp-pdf', 27.6, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table; the PDF is processed in a sandbox with IPython and graded per rubric criterion",
    }),
    sc('zerobench-main-tools', 59.0, {
      source: KIMI_K31_POST,
      observedAt: KIMI_OBSERVED_AT,
      note: "Moonshot's launch table, pass@5, averaged over five runs",
    }),
  ],
}

const gemini31Pro: LeaderboardModel = {
  id: 'gemini-3.1-pro',
  vendor: 'google',
  kind: 'pro',
  version: '3.1-pro',
  displayName: 'Gemini 3.1 Pro',
  priceId: 'gemini-3.1-pro-preview',
  updatedAt: COLLECTED_AT,
  scores: [
    sc('gpqa-diamond', 94.3, { source: GEMINI_CARD }),
    sc('hle', 44.4, { source: GEMINI_CARD, note: 'no tools, full set (text + multimodal)' }),
    sc('hle-tools', 51.4, { source: GEMINI_CARD, note: 'search (blocklist) + code' }),
    sc('matharena-apex', 60.9, { source: BENCHLEADER }),
    sc('automation-bench', 35.4, { source: BENCHLEADER }),
  ],
}

/**
 * Gemini 4 Argon — Google's flagship reasoning model, GA on 2026-10-13.
 *
 * Every score comes from Google's own evaluation methodology (October 2026),
 * which prints Argon next to GPT-6 Astra, Claude Fable 5.1 and Claude Opus
 * 5.5 on nineteen benchmarks. We track the ten rows that have a place in our
 * benchmark registry; the nine we leave out (Vibe Code Bench, PostTrainBench,
 * Terminal-Bench Science 0.1, LABBench 2, RiemannBench, Vals Finance Agent
 * v2, Harvey's Legal Agent Benchmark, LVBench, GraphWalks' short band) are
 * absent rather than interpolated.
 *
 * Two things travel with every number:
 *
 *  - **The harness.** Google ran some rows itself and took others from a
 *    public leaderboard or from a rival's own system card. The note says which.
 *    All of them are pass@1 at the highest thinking setting, while the API's
 *    own default is `medium` — these are ceilings, not defaults.
 *  - **The comparison columns.** The numbers Google prints for the rivals are
 *    Google's measurements of other vendors' models, so they are quoted as "in
 *    Google's table", never as ours.
 */
const gemini4Argon: LeaderboardModel = {
  id: 'gemini-4-argon',
  vendor: 'google',
  kind: 'pro',
  version: '4-argon',
  displayName: 'Gemini 4 Argon',
  priceId: 'gemini-4-argon',
  releaseDate: '2026-10-13',
  introduced: '2026-10-13',
  updatedAt: ARGON_OBSERVED_AT,
  scores: [
    sc('vals-index', 68.9, {
      source: ARGON_EVALS,
      observedAt: ARGON_OBSERVED_AT,
      note: 'Google model card; Vals AI index over finance, coding, legal and tax work. Same table: GPT-6 Astra 63.1, Claude Opus 5.5 67.0',
    }),
    sc('automation-bench', 51.3, {
      source: ARGON_EVALS,
      observedAt: ARGON_OBSERVED_AT,
      note: "Google model card; Zapier leaderboard, private set — not AutomationBench-AA 77.5. Same table: GPT-6 Astra 41.4, Claude Opus 5.5 42.5 (Anthropic's own post says 40.0)",
    }),
    sc('deepswe-v1.1', 77.9, {
      source: ARGON_EVALS,
      observedAt: ARGON_OBSERVED_AT,
      note: 'Google model card; Argon self-computed on a mini-swe agent harness, rivals from the leaderboard and their system cards. Same table: GPT-6 Astra 74.1, Claude Opus 5.5 74.2',
    }),
    sc('frontierswe-v2', 55.0, {
      source: ARGON_EVALS,
      observedAt: ARGON_OBSERVED_AT,
      note: 'Google model card; Proximal public leaderboard, one body for all four models. Same table: GPT-6 Astra 65.5, Claude Opus 5.5 62.3',
    }),
    sc('terminal-bench-4.0', 57.4, {
      source: ARGON_EVALS,
      observedAt: ARGON_OBSERVED_AT,
      note: "Google model card; Argon self-computed, rivals from the public leaderboard. Same table: GPT-6 Astra 58.2, Claude Opus 5.5 66.4 (Anthropic's own post says 57.9 for Astra)",
    }),
    sc('agents-last-exam', 39.5, {
      source: ARGON_EVALS,
      observedAt: ARGON_OBSERVED_AT,
      note: 'Google model card; binary pass rate, ALE-Claw harness, 5-hour window, safety filters on. Same table: GPT-6 Astra 34.2, Claude Opus 5.5 38.2',
    }),
    sc('osworld-2.0', 69.2, {
      source: ARGON_EVALS,
      observedAt: ARGON_OBSERVED_AT,
      note: 'Google model card; offline subset, partial score, best run of 3. Same table: GPT-6 Astra 72.6',
    }),
    sc('chartography', 71.6, {
      source: ARGON_EVALS,
      observedAt: ARGON_OBSERVED_AT,
      note: "Google model card; without tools, Surge leaderboard — a different configuration from the tool-assisted entry. Same table: GPT-6 Astra 71.0, Claude Opus 5.5 66.3",
    }),
    sc('graphwalks', 84.2, {
      source: ARGON_EVALS,
      observedAt: ARGON_OBSERVED_AT,
      note: 'Google model card; 256k-1M band, BFS F1; 99.7 up to 128k. Same table: GPT-6 Astra 71.8, Claude Opus 5.5 66.8',
    }),
    sc('cwe-bench-v1', 68.0, {
      source: ARGON_EVALS,
      observedAt: ARGON_OBSERVED_AT,
      note: 'Google model card; public leaderboard, pass@1 with ties broken on pass@4. Same table: GPT-6 Astra 68.0, Claude Opus 5.5 67.0',
    }),
  ],
}

const grok47: LeaderboardModel = {
  id: 'grok-4.7',
  vendor: 'grok',
  kind: 'grok',
  version: '4.7',
  displayName: 'Grok 4.7',
  priceId: 'grok-4.7',
  // xAI's pricing table dates the model to 2026-09-21 (the release page
  // already states it); the row omitted the date, so the model page had no
  // "Released" line while the release article claimed one.
  releaseDate: '2026-09-21',
  updatedAt: COLLECTED_AT,
  scores: [
    sc('terminal-bench-4.0', 38.0, { source: BENCHLM }),
    sc('deepswe-v1.1', 71.0, { source: BENCHLM, note: 'listed as "DeepSWE"' }),
  ],
}

const minimaxM31Flash: LeaderboardModel = {
  id: 'minimax-m3.1-flash',
  vendor: 'minimax',
  kind: 'flash',
  version: 'm3.1-flash',
  displayName: 'MiniMax M3.1 Flash',
  priceId: 'minimax-m3.1-flash',
  releaseDate: '2026-10-19',
  updatedAt: COLLECTED_AT,
  scores: [
    sc('deepswe-v1.1', 73.7, { source: MINIMAX_M31F_BLOG }),
    sc('cybergym', 82.0, { source: MINIMAX_M31F_BLOG }),
    sc('agents-last-exam', 29.6, { source: MINIMAX_M31F_BLOG }),
    sc('bankertoolbench', 76.2, { source: MINIMAX_M31F_BLOG }),
  ],
}

const minimaxM3: LeaderboardModel = {
  id: 'minimax-m3',
  vendor: 'minimax',
  kind: 'pro',
  version: 'm3',
  displayName: 'MiniMax M3',
  priceId: 'minimax-m3',
  releaseDate: '2026-06-01',
  updatedAt: COLLECTED_AT,
  scores: [
    sc('swe-bench-pro', 59.0, { source: MINIMAX_M3_BLOG, note: VENDOR_MEASURED }),
    sc('terminal-bench-2.1', 66.0, { source: MINIMAX_M3_BLOG, note: VENDOR_MEASURED }),
    sc('mcp-atlas', 74.2, { source: MINIMAX_M3_BLOG, note: VENDOR_MEASURED }),
    sc('nl2repo-bench', 42.1, { source: MINIMAX_M3_CARD, note: VENDOR_MEASURED }),
    sc('browsecompc', 83.5, { source: MINIMAX_M3_CARD, note: VENDOR_MEASURED }),
    sc('bankertoolbench', 76.1, { source: MINIMAX_M3_CARD, note: VENDOR_MEASURED }),
  ],
}

/**
 * Step 5 Preview — StepFun's first flagship (preview, 2026-09-20; open weights
 * 2026-10-15). The scores below are the rows of StepFun's own launch table
 * that have an id in our benchmark registry; the rest of its 39-row table
 * (SWE-Marathon, StepCodeBench, GDPval-AA, GDP.pdf, the FinStepBench suites,
 * MMMU-Pro) has no benchmark here and is absent rather than mapped onto one.
 *
 * Two things travel with every number: the effort setting is not matched
 * (Step 5 Preview ran at High, the rival columns at Max), and the rival
 * figures are StepFun's measurements of other vendors' models — quoted as
 * "in StepFun's table", never as ours.
 */
const step5Preview: LeaderboardModel = {
  id: 'step-5-preview',
  vendor: 'stepfun',
  kind: 'other',
  version: '5-preview',
  displayName: 'Step 5 Preview',
  priceId: 'step-5-preview',
  releaseDate: '2026-09-20',
  introduced: '2026-09-20',
  updatedAt: STEP_OBSERVED_AT,
  scores: [
    sc('gpqa-diamond', 93.5, {
      source: STEPFUN_LAUNCH,
      observedAt: STEP_OBSERVED_AT,
      note: "StepFun launch table, High effort (rivals at Max). Same table: GPT-6 Astra 96.1, Claude Opus 5 93.2",
    }),
    sc('hle', 46.5, {
      source: STEPFUN_LAUNCH,
      observedAt: STEP_OBSERVED_AT,
      note: "StepFun launch table, High effort; no tools. Same table: GPT-6 Astra 54.7, Claude Opus 5 54.9",
    }),
    sc('deepswe-v1.1', 67.7, {
      source: STEPFUN_LAUNCH,
      observedAt: STEP_OBSERVED_AT,
      note: "StepFun launch table, High effort (rivals at Max). Same table: GPT-6 Astra 74.1, Claude Opus 5 74.0",
    }),
    sc('terminal-bench-4.0', 33.3, {
      source: STEPFUN_LAUNCH,
      observedAt: STEP_OBSERVED_AT,
      note: 'StepFun launch table, High effort. Same table: GPT-6 Astra 57.9, Claude Opus 5 52.3',
    }),
    sc('agents-last-exam', 29.5, {
      source: STEPFUN_LAUNCH,
      observedAt: STEP_OBSERVED_AT,
      note: 'StepFun launch table, ALE-CLI row, High effort. Same table: GPT-6 Astra 33.3, Claude Opus 5 28.6',
    }),
    sc('browsecompc', 88.7, {
      source: STEPFUN_LAUNCH,
      observedAt: STEP_OBSERVED_AT,
      note: "StepFun launch table, High effort. Same table: GPT-6 Astra 91.5, Claude Opus 5 90.2",
    }),
  ],
}

export const LEADERBOARD: LeaderboardRegistry = {
  registryVersion: REGISTRY_VERSION,
  fetchedAt: TERRA_OBSERVED_AT,
  sourceNote:
    'DeepSeek / GLM / Kimi scores transcribed from the owner reference table (2026-10-19) sourced from the DeepSeek V4.1 Flash launch post. DeepSeek V4.1-Flash 1017 comes from its own announcement table (2026-10-17) and is kept as a separate row from the 0910 launch checkpoint — the two are different weights, so their scores are never merged; the 1017 table also restates the 0910 numbers in its second column, which is what makes the pair comparable. Gemini 3.1 Pro and Grok 4.7 read from public benchmark sites and the vendor model card; their coverage is partial and per-score sources differ. MiniMax M3.1 Flash scores are from the vendor launch post (2026-10-19) — its AutomationBench-AA rank is stated without a number and its OSWorld V2 result has no matching benchmark here, so that one is absent rather than interpolated. MiniMax M3 combines the vendor launch post (2026-06-01) with the M3 model card table, the only place MiniMax publishes NL2Repo, BrowseComp, MCP Atlas and BankerToolBench; those figures are vendor-measured on MiniMax infrastructure, not taken from a public leaderboard. No competitor rows were copied out of that table — its models are older revisions than the ones tracked here and its columns mix harnesses. The post also reports benchmarks with no id here (SWE-fficiency, KernelBench Hard, PostTrainBench) — those are absent, not interpolated. Claude Opus 5.5 and GPT-6 Astra were added on 2026-10-20 from their launch tables and Artificial Analysis; both rows are partial, and their scores come from vendor harnesses rather than the DeepSeek reference table, so read the per-score notes before comparing them column-to-column with the other rows. Gemini 4 Argon was added on 2026-10-20 from Google\'s own model card (October 2026) — a nineteen-row vendor comparison table, of which we track the ten rows that fit our benchmark registry. The rival numbers Google prints in that table ride along in the notes: they are Google\'s measurements of other vendors\' models, not ours. Kimi K3.1 Pro was added on 2026-10-24 from Moonshot\'s own launch announcement: the scores are Kimi\'s, measured on Kimi\'s harnesses at max thinking effort, and the rival columns are Moonshot\'s measurements of other vendors\' models unless the footnote says otherwise (Terminal-Bench, Terminal-Bench Science and SWE-Marathon quote the public leaderboards, GDPVal-AA and GDP.pdf quote Artificial Analysis). Claude Fable 5.1 has no Anthropic table behind it — its row is the rival column of that same Kimi announcement, and every note says where the figure itself comes from. GPT-6.1 Terra was added on 2026-10-27 from OpenAI\'s own launch post: the Terminal-Bench 4.0 figure in the prose and the point in OpenAI\'s cost-versus-score chart for Agents\' Last Exam, which prints the effort setting and the cost per task for every model in it. Both are OpenAI\'s measurements in OpenAI\'s harness, and the rival columns in that chart are OpenAI\'s numbers for other vendors\' models — the chart is also titled Agents\' Last Exam v1, while the other rows in that column come from the v1.1 task set, so read the column with the harness note rather than as a like-for-like ranking.',
  models: [
    claudeOpus55,
    claudeFable51,
    gpt6Astra,
    gpt61Terra,
    claudeOpus5,
    gpt56Sol,
    gemini4Argon,
    gemini31Pro,
    grok47,
    deepseekV41Flash,
    deepseekV41Flash1017,
    deepseekV4Pro0813,
    deepseekV4Flash0731,
    glm53,
    kimiK3,
    kimiK31Pro,
    minimaxM31Flash,
    minimaxM3,
    step5Preview,
  ],
  history: [],
}

export function findLeaderboardModel(id: string): LeaderboardModel | undefined {
  return LEADERBOARD.models.find((m) => m.id === id)
}

/**
 * The leaderboard row that prices a given **registry** model.
 *
 * The two registries use different id namespaces and they are not the same
 * set: `gemini-3.1-pro` is a leaderboard id whose price row is
 * `gemini-3.1-pro-preview`, and `deepseek-v4.1-flash-1017` is a leaderboard
 * id whose price row is `deepseek-flash`. A link built from a registry id
 * therefore does NOT address a model page — it 404s.
 *
 * So every link from a price row to a model page goes through here: the
 * registry id is resolved to the leaderboard id, and when the model has no
 * leaderboard row the caller renders plain text instead of a dead link.
 */
export function leaderboardIdForPriceId(priceId: string): string | undefined {
  return LEADERBOARD.models.find((m) => m.priceId === priceId)?.id
}
