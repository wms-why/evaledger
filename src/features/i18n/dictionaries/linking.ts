/**
 * Internal-linking copy for the leaderboard / compare / benchmark / methodology
 * surfaces.
 *
 * This module is deliberately separate from `en.ts` / `zh.ts`: the anchor text
 * of a link is part of the link's job, and it has to name the destination it
 * lands on ("Best LLMs for Coding →", not "Open"). The shared dictionaries are
 * the Lead's file; the strings that only this surface needs live here, and
 * the Lead wires them in as `linking: linking.en` / `linking: linking.zh`.
 *
 * Until that wiring lands, `t('linking.…')` returns the raw key — expected.
 * Do NOT work around it by hardcoding English strings.
 *
 * The Chinese copy uses the terms Chinese developers actually search:
 * 大模型基准测试 (LLM benchmark), 编程能力排行榜 (coding leaderboard),
 * 智能体模型排行 (agent model ranking), 推理模型排行榜 (reasoning leaderboard).
 */

const en = {
  /**
   * The four capability boards.
   *
   * The home board's tabs used to be `<button>`s that only flipped React
   * state, so a crawler saw no link and no URL for "best coding LLM". Each
   * tab is now a link to the board's own page, and the anchor text names the
   * page it lands on.
   */
  board: {
    general: 'General LLM leaderboard',
    coding: 'Best coding LLMs',
    agent: 'Best agent LLMs',
    reasoning: 'Best reasoning LLMs',
    /** The "see the full board" line under the home board's table. */
    full: 'See the full {track} leaderboard',
    /** A board link in a list of links — short, still naming the board. */
    link: '{track} leaderboard',
  },
  /**
   * The `/best/<category>` pages. The anchor text names the category page it
   * lands on, not the board it is a twin of.
   */
  best: {
    chineseModel: 'Best Chinese LLMs',
    openSource: 'Best open-weight LLMs',
    forCoding: 'Best LLMs for Coding',
    forAgents: 'Best LLMs for AI Agents',
    forReasoning: 'Best LLMs for Reasoning',
  },
  track: {
    /**
     * A model that was never measured on every core benchmark of a board.
     *
     * "Not tested" read as "no data at all", which is wrong: the model is
     * published with partial data. The label says how much data there is.
     */
    unrankedTracked: 'Not tested · {n} benchmarks tracked',
  },
  methodology: {
    /**
     * The closing link to the data-quality page. The old text ("Where the
     * numbers come from") did not name its destination.
     */
    sourcesLink: 'Audit LLM benchmark & API pricing data sources',
  },
  benchmark: {
    /** The section on a benchmark page that names the boards using it. */
    usedOnTitle: 'Where {name} counts',
    usedOnNote:
      'One benchmark is one column of one board. These are the pages that score on it.',
    /** A link to the benchmark hub. */
    hubLink: 'Browse every LLM benchmark',
  },
  home: {
    /** The CTA that opens the comparison tool. */
    compareCta: 'Compare LLMs side by side',
    /** The Browse row's link to the benchmark hub. */
    browseBenchmarks: 'All LLM benchmarks',
    /** The Browse row's link to the best-model hub. */
    browseBest: 'All best-model categories',
    /** A concrete benchmark link in the Browse row. */
    browseBenchmark: '{name} benchmark scores',
  },
  compare: {
    /** A heading, not a link. */
    boardsTitle: 'Or compare on a capability board',
    /** A link to the benchmark hub from the compare page. */
    benchmarksHub: 'Every LLM benchmark and its scores',
  },
}

/** `zh` is typed against `en`, so the two key sets can never drift apart. */
const zh: typeof en = {
  board: {
    general: '通用大模型排行榜',
    coding: '编程能力排行榜',
    agent: '智能体模型排行',
    reasoning: '推理模型排行榜',
    full: '查看完整的{track}排行榜',
    link: '{track}排行榜',
  },
  best: {
    chineseModel: '最佳国产大模型',
    openSource: '最佳开源大模型',
    forCoding: '最适合编程的大模型',
    forAgents: '最适合智能体的大模型',
    forReasoning: '最适合推理的大模型',
  },
  track: {
    unrankedTracked: '未测试 · 已收录 {n} 项基准测试',
  },
  methodology: {
    sourcesLink: '审查大模型基准测试与 API 价格数据来源',
  },
  benchmark: {
    usedOnTitle: '{name} 参与计分的位置',
    usedOnNote: '一个基准只是某一个榜单里的一列。下面这些页面会用到它。',
    hubLink: '浏览全部大模型基准测试',
  },
  home: {
    compareCta: '并排对比大模型',
    browseBenchmarks: '全部大模型基准测试',
    browseBest: '全部最佳模型分类',
    browseBenchmark: '{name} 大模型基准测试分数',
  },
  compare: {
    boardsTitle: '或按能力维度对比',
    benchmarksHub: '全部大模型基准测试及分数',
  },
}

export const linking = { en, zh }
