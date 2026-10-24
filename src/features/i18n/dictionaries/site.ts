/**
 * The chrome's own copy: the header nav and the footer's link columns.
 *
 * The lead wires this module into the dictionaries (`site: site.en` /
 * `site: site.zh`); until it is wired, `t('site.…')` returns the raw key.
 *
 * ## Why the nav labels live here and not in the feature dictionaries
 *
 * The header is the one surface every page shares, and its Chinese labels
 * have to match how Chinese developers actually search: 大模型排行榜 (not
 * 排行榜), Token 价格计算器 (not Token 计算器), 评分标准 (not 方法论). Those
 * are search terms, not feature copy — so they belong to the chrome, next to
 * the footer columns that use the same wording.
 *
 * The English labels are unchanged from the strings they replace, so the
 * header keeps reading the same in English.
 *
 * `en` and `zh` carry the same key set — the type below makes that a
 * compile error, not a review comment. The Chinese is a native rewrite, not
 * a literal translation.
 */
const en = {
  /** The header nav, in order. Every label names its destination. */
  nav: {
    board: 'Leaderboard',
    compare: 'Compare',
    calculator: 'Token Calculator',
    releases: 'Model Releases',
    series: 'Version series',
    /** The scoring-rules page: how a board's composite is computed. */
    methodology: 'Methodology',
    /** Where every price and score came from, and how fresh it is. */
    dataQuality: 'Data quality',
    changelog: 'Changelog',
    /** The accessible name of the mobile menu button. */
    menu: 'Menu',
  },
  /**
   * The calculator landing pages, named after the page they point at.
   * Shared by the footer's pricing column and the series pages' vendor
   * link, so one page is never called two different things.
   */
  pricing: {
    token: 'Token Cost Calculator',
    claude: 'Claude Token Cost Calculator',
    chatgpt: 'ChatGPT API Pricing',
    deepseek: 'DeepSeek API Pricing',
    openrouter: 'OpenRouter Pricing Calculator',
    gemini: 'Gemini API Pricing',
    grok: 'Grok API Pricing',
    minimax: 'MiniMax API Pricing',
    kimi: 'Kimi API Pricing',
  },
  /** The footer's link columns. */
  footer: {
    pricingTitle: 'Pricing & Calculators',
    bestTitle: 'Best Models & Benchmarks',
    bestModels: 'Best Models',
    bestCoding: 'Best LLMs for Coding',
    boardCoding: 'Coding Leaderboard',
    boardAgent: 'Agent Leaderboard',
    boardReasoning: 'Reasoning Leaderboard',
    benchmarks: 'Benchmarks',
    compare: 'Compare LLMs',
  },
  /** The release index cards. */
  releases: {
    /**
     * The accessible description of a release card's title link — the
     * generic "Read the analysis →" is no longer a second, weaker link.
     */
    readAnalysis: 'Read the analysis',
  },
  /** The series pages' "where to go next" block. */
  series: {
    nextTitle: 'Where to go next',
    pricingTitle: 'What this line costs',
    releaseTitle: 'Latest release analysis',
  },
}

const zh: typeof en = {
  nav: {
    board: '大模型排行榜',
    compare: '模型对比',
    calculator: 'Token 价格计算器',
    releases: '新模型评测',
    series: '模型版本演进',
    methodology: '评分标准',
    dataQuality: '数据溯源',
    changelog: '更新日志',
    menu: '菜单',
  },
  pricing: {
    token: 'Token 价格计算器',
    claude: 'Claude Token 价格计算器',
    chatgpt: 'ChatGPT API 价格',
    deepseek: 'DeepSeek API 价格',
    openrouter: 'OpenRouter 价格计算器',
    gemini: 'Gemini API 价格',
    grok: 'Grok API 价格',
    minimax: 'MiniMax API 价格',
    kimi: 'Kimi API 价格',
  },
  footer: {
    pricingTitle: '价格与计算器',
    bestTitle: '最佳模型与基准',
    bestModels: '最佳模型',
    bestCoding: '最佳编程模型',
    boardCoding: '编程能力榜',
    boardAgent: '智能体能力榜',
    boardReasoning: '推理能力榜',
    benchmarks: '基准测试',
    compare: '模型对比工具',
  },
  releases: {
    readAnalysis: '阅读完整分析',
  },
  series: {
    nextTitle: '接下来看什么',
    pricingTitle: '这条产品线要花多少钱',
    releaseTitle: '最新发布解读',
  },
}

export const site = { en, zh }
