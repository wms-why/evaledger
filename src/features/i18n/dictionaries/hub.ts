/**
 * i18n for the two hub pages — `/benchmarks` (the benchmark directory) and
 * `/best` (the "best model for X" directory).
 *
 * The Lead wires this module into `en.ts` / `zh.ts`:
 *
 *   import { hub } from './hub'
 *   // en.ts
 *   hub: hub.en,
 *   // zh.ts
 *   hub: hub.zh,
 *
 * `en` and `zh` carry identical key sets — `zh` is typed `typeof en`, so a
 * missing Chinese key is a compile error rather than a silent fallback to the
 * raw key.
 *
 * The Chinese copy is a native rewrite, not a translation: it uses the words a
 * developer actually types into a search box (大模型基准测试、编程大模型排行榜、
 * 最便宜的 LLM API 价格), not the English title run through a translator.
 */

/**
 * The locale of this dictionary.
 *
 * Declared here rather than imported from `@/features/i18n/locale`, because
 * that module imports the dictionaries back — a type-only import would be
 * erased, but keeping this module standalone keeps the cycle impossible.
 */
export type HubLocale = 'en' | 'zh'

const en = {
  benchmarks: {
    kicker: 'Benchmark directory',
    title: 'LLM Benchmarks — Every Benchmark We Track',
    metaDescription:
      'Browse every LLM benchmark we track — GPQA Diamond, HLE, Terminal-Bench, SWE-bench Pro, DeepSWE and more — with the models that have been scored on each one.',
    intro:
      'Every benchmark has its own page: what it measures, which models have been scored on it, and where every number came from. Pick a benchmark to open its leaderboard.',
    count: '{count} benchmarks tracked',
    categoriesTitle: 'Browse by category',
    categories: {
      reasoning: 'Reasoning',
      knowledge: 'Knowledge',
      coding: 'Coding',
      agentic: 'Agentic work',
      math: 'Mathematics',
      security: 'Security',
      vision: 'Vision',
    },
    /** The suffix of the per-benchmark history link: "GPQA Diamond score history". */
    historyLabel: 'score history',
    faqTitle: 'Frequently asked questions',
    faq1Q: 'What is an LLM benchmark?',
    faq1A:
      "A benchmark is a fixed set of tasks with a known scoring rule. GPQA Diamond asks graduate-level science questions; SWE-bench Pro asks a model to fix real issues in a real repository. Every benchmark here has its own page, listing the models that have been scored on it.",
    faq2Q: 'Which benchmark should I use to choose a model?',
    faq2A:
      "It depends on the job. Coding work is measured by SWE-bench Pro, DeepSWE and NL2Repo-Bench; long-horizon agent work by Terminal-Bench and Agents' Last Exam; frontier knowledge by GPQA Diamond and HLE. Each benchmark page lists exactly who was measured on it.",
    faq3Q: 'Where do the scores come from?',
    faq3A:
      'Every score is read from a named primary source and carries the source and the date it was observed. Nothing is interpolated: a model that was not measured on a benchmark does not appear on that benchmark’s page.',
    faq4Q: 'Why do some benchmarks have several versions?',
    faq4A:
      'A new task set is a new number. Terminal-Bench 2.1 and 4.0, OSWorld-2.0 and V2.1, and DeepSWE v1.1 are separate benchmarks on separate pages, because a score on one version says nothing about the other.',
    boardLink: 'Full model leaderboard',
    methodologyLink: 'Scoring methodology',
  },

  best: {
    kicker: 'Best models',
    title: 'Best LLMs — Every “Best Model for X” Ranking',
    metaDescription:
      'Every best-model ranking we publish in one place: best LLMs for coding, for AI agents, for reasoning, the cheapest LLM APIs per million tokens, long-context models, prompt-caching discounts, plus Chinese and open-weight models.',
    intro:
      'Each page answers one question — “which model is best for this?” — and ranks the models on the benchmarks that actually measure that job, next to what they cost.',
    count: '{count} rankings',
    groups: {
      capability: 'By capability',
      cost: 'Cost & specs',
      vendor: 'By vendor or region',
    },
    /**
     * The link text of each “best model for X” page, keyed by the category
     * slug in `BEST_CATEGORIES`. The text names the destination.
     */
    categories: {
      'chinese-model': 'Best Chinese LLMs',
      'open-source': 'Best open-weight LLMs',
      'for-coding': 'Best LLMs for Coding',
      'for-agents': 'Best LLMs for AI Agents & Tool Use',
      'for-reasoning': 'Best LLMs for Reasoning',
      'cheapest-llms': 'Cheapest LLM APIs per Million Tokens',
      '1m-context-window': 'Best Long-Context LLMs (1M+ Tokens)',
      'prompt-caching': 'Best LLMs for Prompt Caching Discounts',
    },
    /** One line per category: what the page is for. */
    descriptions: {
      'chinese-model':
        'DeepSeek, GLM and Kimi ranked on reasoning, agentic coding and automation benchmarks.',
      'open-source':
        'Models you can self-host or route through any provider, ranked on coding and automation.',
      'for-coding':
        'Ranked on real repository bug fixes, program synthesis and command-line agent tasks.',
      'for-agents':
        'Ranked on terminal tasks, long-horizon agent work and multi-step automation.',
      'for-reasoning':
        'Ranked on graduate-level science questions, frontier knowledge and competition mathematics.',
      'cheapest-llms':
        'Input and output price per million tokens for every model we track, so the same workload can be compared directly.',
      '1m-context-window':
        'The models that take a million tokens of context — the ones built for whole codebases and long documents.',
      'prompt-caching':
        'The models that cost least when you send the same prompt over and over.',
    },
    /**
     * How each page ranks its rows — a score board and a price table are not
     * the same thing, and the reader deserves to know which one they are
     * looking at before they read the first row.
     */
    rankLabels: {
      score: 'Ranked by benchmark score',
      price: 'Ranked by price',
      context: 'Ranked by context window',
      cache: 'Ranked by cache discount',
    },
    faqTitle: 'Frequently asked questions',
    faq1Q: 'What does a “best model for X” page actually rank?',
    faq1A:
      'It ranks models on the benchmarks that measure that specific job, and only models measured on every one of them are ranked — the same coverage rule the main leaderboard uses.',
    faq2Q: 'Which page should I start from?',
    faq2A:
      'Start from the job: coding, agent tool use, reasoning. If your constraint is money or context length rather than capability, read the cost and specs pages instead.',
    faq3Q: 'How is this different from the main leaderboard?',
    faq3A:
      'The main board is one composite over the core benchmarks; each best-model page is a different subset with its own weights. A model can lead one and sit outside the other — that is the point of splitting them.',
    boardLink: 'Full model leaderboard',
    benchmarksLink: 'Benchmark directory',
  },
}

const zh: typeof en = {
  benchmarks: {
    kicker: '基准测试目录',
    title: '大模型基准测试大全 — 我们收录的每一个基准',
    metaDescription:
      '收录 GPQA Diamond、HLE、Terminal-Bench、SWE-bench Pro、DeepSWE 等全部大模型基准测试，每个基准都列出参与打分的模型与数据来源。',
    intro:
      '每个基准都有独立页面：它到底考什么、哪些模型测过、每个数字出自哪里。点开任意一个基准，直接看该基准的排行榜。',
    count: '共收录 {count} 个基准测试',
    categoriesTitle: '按类别浏览',
    categories: {
      reasoning: '推理能力',
      knowledge: '知识与学术',
      coding: '编程与代码',
      agentic: '智能体与工具调用',
      math: '数学',
      security: '安全',
      vision: '视觉与多模态',
    },
    historyLabel: '得分历史',
    faqTitle: '常见问题',
    faq1Q: '什么是大模型基准测试（benchmark）？',
    faq1A:
      '基准测试就是一套固定题目加一套固定评分规则。GPQA Diamond 考研究生级学科问答，SWE-bench Pro 考模型在真实仓库里修 issue。每个基准都有独立页面，列出所有参与打分的模型。',
    faq2Q: '选模型到底该看哪个基准？',
    faq2A:
      '看你打算让模型干什么活。写代码看 SWE-bench Pro、DeepSWE、NL2Repo-Bench；跑长链路智能体任务看 Terminal-Bench 和 Agents’ Last Exam；前沿知识看 GPQA Diamond 和 HLE。',
    faq3Q: '这些分数是从哪里来的？',
    faq3A:
      '每个分数都来自具名的一手来源，并记录来源和观测时间。不做插值：某个模型没在这个基准上测过，它就不会出现在这个基准的榜单里。',
    faq4Q: '为什么同一个基准会有好几个版本？',
    faq4A:
      '换了题集就是另一个数字。Terminal-Bench 2.1 和 4.0、OSWorld-2.0 和 V2.1、DeepSWE v1.1 各自独立成页——旧版本的分数说明不了新版本。',
    boardLink: '完整模型榜单',
    methodologyLink: '分数是怎么算出来的',
  },

  best: {
    kicker: '最佳大模型',
    title: '各类最佳大模型榜单 — 一次看全',
    metaDescription:
      '编程大模型排行榜、AI 智能体大模型排行、推理模型排行、最便宜的 LLM API 价格、百万 Token 长上下文模型、Prompt 缓存折扣最优模型，以及国产和开源模型榜单——全部在一页。',
    intro:
      '每个榜单只回答一个问题——「这个活儿该用哪个模型」——并且只用真正衡量这件事的基准来排名，旁边就是价格。',
    count: '共 {count} 个榜单',
    groups: {
      capability: '按能力场景',
      cost: '按价格与规格',
      vendor: '按厂商与地区',
    },
    categories: {
      'chinese-model': '最佳国产大模型',
      'open-source': '最佳开源权重模型',
      'for-coding': '编程大模型排行榜',
      'for-agents': 'AI 智能体与工具调用大模型排行',
      'for-reasoning': '推理能力最强的大模型',
      'cheapest-llms': '最便宜的 LLM API 价格对比',
      '1m-context-window': '百万 Token 长上下文大模型',
      'prompt-caching': 'Prompt 缓存折扣最优的大模型',
    },
    descriptions: {
      'chinese-model': 'DeepSeek、GLM、Kimi 在推理、智能体编程和自动化基准上的排名。',
      'open-source': '能自己部署、或者能经任意服务商调用的模型，编程与自动化基准排名。',
      'for-coding': '真实仓库改 bug、程序合成、命令行智能体任务上的排名。',
      'for-agents': '终端任务、长链路智能体任务和多步自动化上的排名。',
      'for-reasoning': '研究生级学科问答、前沿知识和竞赛数学上的排名。',
      'cheapest-llms': '每个模型每百万 Token 的输入 + 输出价格，方便按同一份用量横向比价。',
      '1m-context-window': '能吃下百万 Token 上下文的模型——适合整个代码库和超长文档的那种。',
      'prompt-caching': '同一个提示词反复调用时，缓存输入最便宜的模型。',
    },
    rankLabels: {
      score: '按基准分数排名',
      price: '按价格排名',
      context: '按上下文窗口排名',
      cache: '按缓存折扣排名',
    },
    faqTitle: '常见问题',
    faq1Q: '「某个场景最好的大模型」榜单是怎么排的？',
    faq1A:
      '每个榜单只用衡量该场景的那几项基准来排名，而且必须全部测过才进榜——和主榜单用的是同一套覆盖规则。',
    faq2Q: '我该从哪个榜单开始看？',
    faq2A:
      '看你打算让模型干什么：写代码、调用工具做智能体任务，还是复杂推理。如果你的约束是钱和上下文长度，而不是能力上限，那就先看价格与规格那几页。',
    faq3Q: '这些榜单和主榜单有什么区别？',
    faq3A:
      '主榜单是用核心基准合成的一个总分；每个专项榜单是不同的子集、不同的权重。某个模型在一个榜上第一、在另一个榜上进不了榜，都是正常的——拆开看才有意义。',
    boardLink: '完整模型榜单',
    benchmarksLink: '基准测试目录',
  },
}

export const hub = { en, zh }

/**
 * Read a string out of the hub dictionary, with `{var}` interpolation.
 *
 * The pages resolve their copy through `t('hub.…')`, which only works once
 * the Lead wires this module into `en.ts` / `zh.ts` — before that, `t()`
 * returns the raw key. This helper reads the module directly, so a page can
 * fall back to it and still show real copy.
 *
 * Returns `undefined` when the key does not exist, so a caller can tell
 * "missing" from "empty".
 */
export function hubText(
  locale: HubLocale,
  key: string,
  params?: Record<string, string | number>,
): string | undefined {
  const path = key.startsWith('hub.') ? key.slice('hub.'.length) : key
  const value = path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, hub[locale])
  if (typeof value !== 'string') return undefined
  if (!params) return value
  return value.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  )
}
