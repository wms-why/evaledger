/**
 * Landing-page copy — the four vendor pricing pages, the model profile page
 * and the attribute-ranked "best model for X" pages.
 *
 * The Lead wires this module into `en.ts` (`landing: landing.en`) and `zh.ts`
 * (`landing: landing.zh`). Until then `t('landing.…')` returns the raw key,
 * which is expected: the copy is a separate module precisely so the wiring
 * lands in one place.
 *
 * Two rules hold for every string in here:
 *
 *  1. **No number is written by hand.** A price, a score or a context window
 *     is resolved from `REGISTRY` / `LEADERBOARD` at render time and passed
 *     in as a `{placeholder}`. The sentences below are the frame; the numbers
 *     are the data. Where a sentence needs a number that only exists at
 *     render time (a cache discount, a blended rate, a rank), it carries a
 *     placeholder for it.
 *  2. **`en` and `zh` have identical key sets.** The Chinese copy is a native
 *     rewrite in the words Chinese developers actually search with
 *     (`Gemini API 价格`, `Grok API 定价`, `MiniMax M3.1 Flash 价格`,
 *     `Kimi K3.1 Pro 百万上下文定价`, `这个模型值不值`), not a translation.
 */
export const landing = {
  en: {
    common: {
      // ── The rate table (every vendor page) ──────────────────────────
      rateTableTitle: 'Rates in force',
      rateTableIntro:
        'Every rate below is the one in force on {date} — the same resolution the calculator charges with, so a promotional base rate is never quoted as the long-term price.',
      colModel: 'Model',
      colInput: 'Input /1M',
      colOutput: 'Output /1M',
      colCached: 'Cached input /1M',
      colContext: 'Context window',
      colNotes: 'Notes',
      colStatus: 'Status',
      noCachedRate: 'not published',
      active: 'Active',
      delisted: 'Retired',
      source: 'Source',
      updated: 'Prices as of {date}',
      promoNote: '{label} until {date}',
      longContextNote: 'above {threshold} tokens: input ×{inputMult}, output ×{outputMult}',
      cacheWriteNote: 'cache write {rates}',
      tierNote: '{label} ×{multiplier}',
      cacheWindow5min: '5 min',
      cacheWindow1hr: '1 h',
      noLongContext: 'no long-context band',
      // ── The FAQ block ────────────────────────────────────────────────
      faqKicker: 'frequently asked',
      faqTitle: 'Frequently asked questions',
    },

    vendor: {
      gemini: {
        h1: 'Gemini API Pricing',
        subtitle:
          'Google Gemini rates per 1M tokens — Gemini 4 Argon, Gemini 3.1 Pro, Gemini 3.8 Flash and the Flash-Lite tier — with the long-context band, the cache rate and the service tiers, priced against every other model.',
        metaDescription:
          'Gemini API pricing for Gemini 4 Argon, Gemini 3.1 Pro, Gemini 3.8 Flash and Flash-Lite — input, output and cached-input rates per 1M tokens, long-context pricing and context windows. Updated {date}.',
        tldrItems: [
          'Gemini 4 Argon is Google’s flagship reasoning model, and it is priced on an introductory rate with a published end date — the table below shows the rate actually in force.',
          'Gemini 3.1 Pro steps up above the long-context threshold, and the band is applied to a single request, never to your monthly total.',
          'Flash-Lite is the cheapest Gemini tier in the registry, and every Gemini row publishes a cached-input rate.',
          'Google publishes Batch and Flex alongside the standard rate, and Priority above it.',
          'Gemini 4 Argon has no long-context band — its price does not step up inside the window.',
        ],
        tips: [
          'Turn on the cached-input switch in the calculator to price a repeated prefix at the cache rate instead of the input rate.',
          'Move scheduled or batch work onto Batch and Flex before you move it onto a different model.',
          'Keep a single request under the long-context threshold where you can — the band is priced per request.',
          'Compare the blended rate before you switch: a cheap input rate with an expensive output rate can still be the expensive model.',
          'Watch the dated bands — a rate with an end date is a temporary rate, and the table always says which one is in force.',
        ],
        faq1Q: 'How much does Gemini 4 Argon cost per 1M tokens?',
        faq1A:
          'Gemini 4 Argon is {input} per 1M input tokens and {output} per 1M output tokens, with cached input at {cached} per 1M and a {context} context window.{promo}',
        faq2Q: 'What does Gemini 3.1 Pro cost above the long-context threshold?',
        faq2A:
          'Gemini 3.1 Pro is {input} per 1M input and {output} per 1M output up to {threshold} tokens. Above that threshold the same request is billed at {longInput} per 1M input and {longOutput} per 1M output.',
        faq3Q: 'How much do Gemini Flash-Lite tokens cost?',
        faq3A:
          'Gemini 3.1 Flash-Lite is {input} per 1M input tokens and {output} per 1M output tokens, with cached input at {cached} per 1M — the cheapest Gemini tier in the registry, on a {context} context window.',
        faq4Q: 'How much does Gemini prompt caching save?',
        faq4A:
          'A Gemini 4 Argon cache hit is {cached} per 1M tokens against {input} per 1M uncached — a {discount} discount. Gemini 4 Argon supports implicit caching only; explicit cached-content APIs are not supported for it.',
        faq5Q: 'How does Gemini pricing compare with Claude and GPT?',
        faq5A:
          'Gemini 4 Argon is {blended} per 1M blended, against {claude} for Claude Opus 5.5 and {gpt} for GPT-6 astra on the same measure. A benchmark-heavy workload and a token-heavy workload do not pick the same winner.',
      },

      grok: {
        h1: 'Grok API Pricing',
        subtitle:
          'xAI Grok rates per 1M tokens — Grok 4.7 with its long-context band and cached-input rate, plus the retired Grok 4 row — priced against every other model.',
        metaDescription:
          'Grok API pricing for Grok 4.7 — input, output and cached-input rates per 1M tokens, the long-context band above the threshold, and the context window. Updated {date}.',
        tldrItems: [
          'Grok 4.7 is the current xAI flagship in the registry, priced on a short-context rate with a long-context band on top.',
          'The long-context band applies to the whole request, so one oversized prompt is billed at the higher rate.',
          'Grok publishes a cached-input rate, so a repeated prefix is priced at the cache rate instead of the input rate.',
          'Grok 4 is retired but kept in the registry, so the old prices stay findable.',
          'Every rate below is the one in force on the snapshot date, not a promotional base rate.',
        ],
        tips: [
          'Price the repeat: the cached-input rate is the single biggest lever when the same system prompt goes out on every call.',
          'Split long documents into requests that stay under the long-context threshold where you can.',
          'Compare blended rates, not headline rates — output is usually the bigger share of a real bill.',
          'Use the calculator’s cached-input switch to see the effect on a monthly workload.',
          'Check the context window before you paste: the row that fits your document is not always the cheapest one.',
        ],
        faq1Q: 'How much does Grok 4.7 cost per 1M tokens?',
        faq1A:
          'Grok 4.7 is {input} per 1M input tokens and {output} per 1M output tokens, with cached input at {cached} per 1M and a {context} context window.',
        faq2Q: 'What does Grok prompt caching cost?',
        faq2A:
          'A Grok 4.7 cache hit is {cached} per 1M tokens against {input} per 1M uncached — a {discount} discount. A request that repeats a long prefix pays the cache rate for that prefix instead of the input rate.',
        faq3Q: 'What does Grok cost above the long-context threshold?',
        faq3A:
          'Up to {threshold} tokens, a Grok 4.7 request is billed at {input} per 1M input and {output} per 1M output. Above that threshold the same request is billed at {longInput} per 1M input and {longOutput} per 1M output.',
        faq4Q: 'How does Grok 4.7 compare with Gemini and Claude on price?',
        faq4A:
          'Grok 4.7 is {blended} per 1M blended, against {gemini} for Gemini 4 Argon and {claude} for Claude Opus 5.5 on the same measure.',
        faq5Q: 'Is Grok 4 still available?',
        faq5A:
          'Grok 4 is retired — the registry keeps its price so the old numbers stay findable, but the API now serves Grok 4.7 at {input} per 1M input and {output} per 1M output.',
      },

      minimax: {
        h1: 'MiniMax API Pricing',
        subtitle:
          'MiniMax M3.1 Flash and M3 rates per 1M tokens — a flat rate, the priority lane, the long-context doubling and the cache rate — priced against every other model.',
        metaDescription:
          'MiniMax API pricing for M3.1 Flash and M3 — input, output and cached-input rates per 1M tokens, the priority service tier and the long-context doubling. Updated {date}.',
        tldrItems: [
          'MiniMax M3.1 Flash is the cheapest active model in the registry, on a single flat rate with no long-context tier.',
          'M3 is still sold, and its standard rate is below most of the frontier on output.',
          'M3 has a long-context band that doubles every meter above its threshold; M3.1 Flash does not.',
          'M3 accepts a priority lane that costs more than the standard rate.',
          'Both MiniMax rows publish a cached-input rate, so a repeated prefix is much cheaper.',
        ],
        tips: [
          'M3.1 Flash is the default answer for volume work — flat rate, no tier surprises.',
          'If you need M3, price it at the standard rate first; the priority lane is an upgrade, not the default.',
          'Keep an eye on the long-context band on M3 — above the threshold every meter doubles.',
          'Turn on the cached-input switch: MiniMax’s cache rate is a fraction of its input rate.',
          'Check what your workload actually costs before switching — a cheap tier only wins if the output volume matches.',
        ],
        faq1Q: 'How much does MiniMax M3.1 Flash cost per 1M tokens?',
        faq1A:
          'MiniMax M3.1 Flash is {input} per 1M input tokens and {output} per 1M output tokens, with cached input at {cached} per 1M and a {context} context window. It is a flat rate: there is no long-context tier and no priority lane on this model.',
        faq2Q: 'What does MiniMax M3 cost, and what changes above the long-context threshold?',
        faq2A:
          'M3 is {input} per 1M input and {output} per 1M output up to {threshold} tokens of input; above it every meter doubles, to {longInput} per 1M input and {longOutput} per 1M output.',
        faq3Q: 'How much does MiniMax prompt caching save?',
        faq3A:
          'A MiniMax M3.1 Flash cache hit is {cached} per 1M against {input} per 1M uncached — a {discount} discount. On M3 the cache rate is {m3Cached} per 1M.',
        faq4Q: 'How does MiniMax compare with DeepSeek and Gemini on price?',
        faq4A:
          'MiniMax M3.1 Flash is {blended} per 1M blended, against {deepseek} for DeepSeek V4.1-Flash and {gemini} for Gemini 4 Argon on the same measure.',
        faq5Q: 'What is the MiniMax priority service tier?',
        faq5A:
          'M3 accepts a priority lane at {priorityInput} per 1M input and {priorityOutput} per 1M output — {multiplier} the standard rate. M3.1 Flash does not accept it.',
      },

      kimi: {
        h1: 'Kimi API Pricing',
        subtitle:
          'Moonshot Kimi rates per 1M tokens — K3.1 Pro, the Highspeed twin and the still-sold K3, with the million-token window and the separately billed cache writes.',
        metaDescription:
          'Kimi API pricing for K3.1 Pro, K3.1 Pro Highspeed and K3 — input, output and cached-input rates per 1M tokens, the million-token context window and cache-write billing. Updated {date}.',
        tldrItems: [
          'Kimi K3.1 Pro serves a million-token context window, priced with separate input, output and cached-input rates.',
          'Cache writes are billed separately from cache reads, by TTL — a five-minute write costs less than an hour-long one.',
          'The Highspeed twin costs twice as much as the standard model for the same intelligence at a faster output speed.',
          'Kimi K3 is still sold alongside K3.1 Pro, and it is the more expensive of the two.',
          'Every rate below is the one in force on the snapshot date.',
        ],
        tips: [
          'Price the cache write as well as the cache read — a long TTL write costs more than a short one.',
          'Use the standard K3.1 Pro unless you need the faster output; the twin costs twice as much.',
          'A million-token window does not make a long request cheap — the token count still drives the bill.',
          'Compare Kimi with the rest of the Chinese frontier on the blended rate, not the input rate.',
          'Run your own token counts in the calculator: the table is the list price, your workload is the bill.',
        ],
        faq1Q: 'How much does Kimi K3.1 Pro cost per 1M tokens?',
        faq1A:
          'Kimi K3.1 Pro is {input} per 1M input tokens and {output} per 1M output tokens, with cached input at {cached} per 1M and a {context} context window.{promo}',
        faq2Q: 'What does a million-token Kimi context cost?',
        faq2A:
          'The K3 series serves {context} tokens per request. Input is billed at {input} per 1M and output at {output} per 1M whatever the request size, so a full window is simply a larger multiple of the same rate.',
        faq3Q: 'How much does Kimi charge to write to the cache?',
        faq3A:
          'Cache writes are billed separately by TTL: {write5} per 1M for a five-minute write and {write1h} per 1M for a one-hour write. A cache hit is then billed at {cached} per 1M, with no second write charge.',
        faq4Q: 'Is Kimi K3.1 Pro cheaper than Claude or GPT?',
        faq4A:
          'Kimi K3.1 Pro is {blended} per 1M blended, against {claude} for Claude Opus 5.5 and {gpt} for GPT-6 astra on the same measure.',
        faq5Q: 'What is the difference between Kimi K3.1 Pro and the Highspeed twin?',
        faq5A:
          'The Highspeed twin is {highspeedInput} per 1M input and {highspeedOutput} per 1M output — twice the price of the standard model for the same intelligence at a faster output speed.',
      },
    },

    model: {
      metaTitle: '{model} API Pricing, Benchmarks & Context Window ({year})',
      metaDescription:
        '{model} API pricing per 1M tokens — {input} input, {output} output, {cached} cached input — plus its {context} context window and benchmark scores. Rates as of {date}.',
      worthItTitle: 'Is {model} worth the cost?',
      worthItIntro:
        'Computed from the registry price and the board composite, not written by hand: the numbers below are the model’s own rate and its own score.',
      alternativesTitle: '{model} vs Alternatives',
      alternativesIntro:
        'Models in the same price tier, with the head-to-head page wherever one exists.',
      compareLink: '{a} vs {b}',
      modelLink: '{model} model page',
      alternativesEmpty: 'No other model sits in the same price tier yet.',
      factsTitle: 'What you pay for',
      factsPrice: 'Blended price',
      factsInput: 'Input /1M',
      factsOutput: 'Output /1M',
      factsCached: 'Cached input /1M',
      factsContext: 'Context window',
      factsPriceRank: 'Price rank',
      factsPriceRankValue: '{rank} of {n} priced models, cheapest first',
      factsComposite: 'Board composite',
      factsCompositeValue: '{composite} on the {track} board',
      factsCompositeNone: 'No composite — the model is not ranked on any capability board',
      factsTier: 'Price tier',
      tierValue: 'value tier',
      tierMid: 'mid tier',
      tierPremium: 'premium tier',
      noCachedRate: 'No cached-input rate published for this model.',
      verdict: {
        cheapStrong:
          '{model} is one of the cheapest models we price — {blended} per 1M blended ({input} in, {output} out) — and it still scores {composite} on the {track} board, {rank} of {ranked}. That is the rare cheap-and-strong pick: the bill stays small and the capability does not.',
        cheapWeak:
          '{model} is cheap — {blended} per 1M blended ({input} in, {output} out) — but it scores {composite} on the {track} board, {rank} of {ranked}. Use it for volume work, not for the hardest tasks.',
        flagship:
          '{model} costs flagship money — {blended} per 1M blended ({input} in, {output} out) — and it earns part of it: {composite} on the {track} board, {rank} of {ranked}. If you do not need that capability, a cheaper tier does the same job.',
        overpriced:
          '{model} is priced like a flagship — {blended} per 1M blended ({input} in, {output} out) — but it does not lead the board it is scored on: {composite} on the {track} board, {rank} of {ranked}. Hard to justify at this price unless you need it specifically.',
        balanced:
          '{model} sits in the middle of the price range — {blended} per 1M blended ({input} in, {output} out) — with {composite} on the {track} board, {rank} of {ranked}. Neither the cheapest nor the strongest: the pick depends on your workload.',
        unproven:
          '{model} is {blended} per 1M blended ({input} in, {output} out) — the {tier} of the {priced} models we price — and it has no board composite, so there is no score to weigh against the price. Judge it on the vendor’s own numbers.',
      },
    },

    best: {
      // The page title and intro of every category live in the shared
      // dictionary (`leaderboard.best.<slug>.title` / `.intro`) — one place
      // for all eight categories, so a category is never named twice. What
      // lives here is what the ATTRIBUTE-ranked tables need and the
      // score-ranked ones do not: their columns and their captions.
      colBlended: 'Blended /1M',
      colCached: 'Cached input /1M',
      colDiscount: 'Discount',
      colContext: 'Context window',
      colStatus: 'Status',
      captionPrice:
        'Ranked by blended price per 1M tokens, cheapest first. Every rate is the one in force on {date}.',
      captionContext:
        'Only models whose context window reaches {threshold} tokens are listed, largest first.',
      captionCache:
        'Models with no published cached-input rate are not listed — their vendor does not publish one, and a discount against a rate that does not exist would be fiction.',
      noCachedRate: 'No published cached-input rate',
      fullBoard: 'See the full leaderboard',
    },
  },

  zh: {
    common: {
      // ── 价格表(四个厂商页共用)──────────────────────────────────────
      rateTableTitle: '当前生效价格',
      rateTableIntro:
        '下面每一行都是 {date} 当天生效的价格——和计算器计费用的是同一套解析逻辑,所以促销基准价不会被当成长期价写出来。',
      colModel: '模型',
      colInput: '输入 /1M',
      colOutput: '输出 /1M',
      colCached: '缓存输入 /1M',
      colContext: '上下文窗口',
      colNotes: '备注',
      colStatus: '状态',
      noCachedRate: '未公布',
      active: '在售',
      delisted: '已停售',
      source: '来源',
      updated: '价格截至 {date}',
      promoNote: '{label}适用至 {date}',
      longContextNote: '超过 {threshold} token:输入 ×{inputMult},输出 ×{outputMult}',
      cacheWriteNote: '缓存写入 {rates}',
      tierNote: '{label} ×{multiplier}',
      cacheWindow5min: '5 分钟',
      cacheWindow1hr: '1 小时',
      noLongContext: '没有长上下文档位',
      // ── FAQ ────────────────────────────────────────────────────────
      faqKicker: '常见问题',
      faqTitle: '常见问题解答',
    },

    vendor: {
      gemini: {
        h1: 'Gemini API 价格',
        subtitle:
          'Google Gemini 每 1M token 的价格——Gemini 4 Argon、Gemini 3.1 Pro、Gemini 3.8 Flash 以及 Flash-Lite 档位,含长上下文分段、缓存价与服务档位,并与所有其他模型横向对比。',
        metaDescription:
          'Gemini API 价格:Gemini 4 Argon、Gemini 3.1 Pro、Gemini 3.8 Flash 与 Flash-Lite 的每 1M token 输入价、输出价、缓存价、长上下文计费与上下文窗口。更新于 {date}。',
        tldrItems: [
          'Gemini 4 Argon 是 Google 的旗舰推理模型,目前执行的是有明确结束日期的入门价——下面的表格给出的是今天真正生效的价格。',
          'Gemini 3.1 Pro 超过长上下文阈值后价格上台阶,而且这个分段只作用于单次请求,不会累加到你的月度总量。',
          'Flash-Lite 是注册表里最便宜的 Gemini 档位,而且 Gemini 每一行都公布了缓存输入价。',
          'Google 在标准价之外还公布 Batch 与 Flex 两档,以及更高价的 Priority。',
          'Gemini 4 Argon 没有长上下文档位,窗口内价格不会再往上跳。',
        ],
        tips: [
          '在计算器里打开「使用缓存输入」开关,用缓存价而不是输入价来算重复前缀的成本。',
          '把定时任务、批处理先挪到 Batch 与 Flex,再考虑换模型。',
          '尽量让单次请求留在长上下文阈值以内——这个分段是按请求计费的。',
          '换模型前先看混合价:输入便宜、输出贵的模型,总价可能反而更贵。',
          '留意带日期的价格段——有结束日期的��是临时价,表格始终标明当前生效的是哪一档。',
        ],
        faq1Q: 'Gemini 4 Argon 每 1M token 多少钱?',
        faq1A:
          'Gemini 4 Argon 输入 {input} /1M,输出 {output} /1M,缓存输入 {cached} /1M,上下文窗口 {context}。{promo}',
        faq2Q: 'Gemini 3.1 Pro 超过长上下文阈值后怎么算?',
        faq2A:
          '在 {threshold} token 以内,Gemini 3.1 Pro 输入 {input} /1M、输出 {output} /1M;超过该阈值后,同一个请求按输入 {longInput} /1M、输出 {longOutput} /1M 计费。',
        faq3Q: 'Gemini Flash-Lite 的 token 多少钱?',
        faq3A:
          'Gemini 3.1 Flash-Lite 输入 {input} /1M,输出 {output} /1M,缓存输入 {cached} /1M——注册表里最便宜的 Gemini 档位,上下文窗口 {context}。',
        faq4Q: 'Gemini 的提示词缓存能省多少?',
        faq4A:
          'Gemini 4 Argon 的缓存命中价是 {cached} /1M,未命中是 {input} /1M,相当于 {discount} 的折扣。Gemini 4 Argon 只支持隐式缓存,不支持显式的 cachedContent 缓存接口。',
        faq5Q: 'Gemini 的价格和 Claude、GPT 比怎么样?',
        faq5A:
          '按混合价算,Gemini 4 Argon 是 {blended} /1M,Claude Opus 5.5 是 {claude},GPT-6 astra 是 {gpt}。跑分密集的负载和 token 密集的负载,未必会选同一个赢家。',
      },

      grok: {
        h1: 'Grok API 定价',
        subtitle:
          'xAI Grok 每 1M token 的价格——Grok 4.7 及其长上下文分段与缓存输入价,并保留已停售的 Grok 4 行,与所有其他模型横向对比。',
        metaDescription:
          'Grok API 定价:Grok 4.7 的每 1M token 输入价、输出价、缓存输入价、超过阈值后的长上下文计费与上下文窗口。更新于 {date}。',
        tldrItems: [
          'Grok 4.7 是注册表里 xAI 当前的旗舰,按短上下文价格计费,长上下文另有分段。',
          '长上下文分段作用于整个请求,所以一次超长的提示词就按更高的价计费。',
          'Grok 公布了缓存输入价,重复前缀按缓存价而不是输入价计费。',
          'Grok 4 已停售但保留在注册表里,老价格依然能被搜到。',
          '下面每一行都是快照日期当天生效的价格,不是促销基准价。',
        ],
        tips: [
          '先把重复的部分算清楚:同一套系统提示词每次都要发的时候,缓存价是最大的省钱杠杆。',
          '长文档尽量拆成不超过长上下文阈值的多次请求。',
          '比混合价,不要只比标价——真实账单里输出往往占大头。',
          '打开计算器的缓存输入开关,看看一个月度负载实际能省多少。',
          '粘贴之前先看上下文窗口:能装下你文档的那一行,不一定是便宜的那一行。',
        ],
        faq1Q: 'Grok 4.7 每 1M token 多少钱?',
        faq1A: 'Grok 4.7 输入 {input} /1M,输出 {output} /1M,缓存输入 {cached} /1M,上下文窗口 {context}。',
        faq2Q: 'Grok 的提示词缓存怎么收费?',
        faq2A:
          'Grok 4.7 的缓存命中价是 {cached} /1M,未命中是 {input} /1M,相当于 {discount} 的折扣。重复长前缀的请求,这一段按缓存价而不是输入价计费。',
        faq3Q: 'Grok 超过长上下文阈值后怎么算?',
        faq3A:
          '在 {threshold} token 以内,Grok 4.7 按输入 {input} /1M、输出 {output} /1M 计费;超过该阈值后,同一个请求按输入 {longInput} /1M、输出 {longOutput} /1M 计费。',
        faq4Q: 'Grok 4.7 和 Gemini、Claude 比价格怎么样?',
        faq4A: '按混合价算,Grok 4.7 是 {blended} /1M,Gemini 4 Argon 是 {gemini},Claude Opus 5.5 是 {claude}。',
        faq5Q: 'Grok 4 还能用吗?',
        faq5A:
          'Grok 4 已停售——注册表保留它的价格是为了让老数字仍可被搜到,API 现在提供的是 Grok 4.7,输入 {input} /1M、输出 {output} /1M。',
      },

      minimax: {
        h1: 'MiniMax API 价格',
        subtitle:
          'MiniMax M3.1 Flash 与 M3 每 1M token 的价格——统一费率、优先通道、长上下文翻倍与缓存价,并与所有其他模型横向对比。',
        metaDescription:
          'MiniMax API 价格:M3.1 Flash 与 M3 的每 1M token 输入价、输出价、缓存输入价、priority 服务档位,以及长上下文翻倍规则。更新于 {date}。',
        tldrItems: [
          'MiniMax M3.1 Flash 是注册表里最便宜的在售模型,统一费率,没有长上下文档位。',
          'M3 仍在售,而且标准价在输出上比大多数旗舰模型都低。',
          'M3 有长上下文档位,超过阈值后每一项计费都翻倍;M3.1 Flash 没有。',
          'M3 接受 priority 通道,价格高于标准价。',
          '两条 MiniMax 记录都公布了缓存输入价,重复前缀会便宜很多。',
        ],
        tips: [
          'M3.1 Flash 是高并发量场景的默认答案——统一费率,没有档位惊喜。',
          '要用 M3 的话,先按标准价算一遍;priority 通道是升级项,不是默认项。',
          '留意 M3 的长上下文档位——超过阈值后每一项计费都翻倍。',
          '打开缓存输入开关:MiniMax 的缓存价只有输入价的一个零头。',
          '换模型之前先看你的负载真实成本——便宜档位只有在输出量足够时才算便宜。',
        ],
        faq1Q: 'MiniMax M3.1 Flash 每 1M token 多少钱?',
        faq1A:
          'MiniMax M3.1 Flash 输入 {input} /1M,输出 {output} /1M,缓存输入 {cached} /1M,上下文窗口 {context}。它是统一费率:这个模型既没有长上下文档位,也不接受 priority 通道。',
        faq2Q: 'MiniMax M3 怎么收费,超过长上下文阈值会怎样?',
        faq2A:
          '输入在 {threshold} token 以内时,M3 按输入 {input} /1M、输出 {output} /1M 计费;超过之后每一项都翻倍,变成输入 {longInput} /1M、输出 {longOutput} /1M。',
        faq3Q: 'MiniMax 的提示词缓存能省多少?',
        faq3A:
          'MiniMax M3.1 Flash 的缓存命中价是 {cached} /1M,未命中是 {input} /1M,相当于 {discount} 的折扣;M3 的缓存价是 {m3Cached} /1M。',
        faq4Q: 'MiniMax 和 DeepSeek、Gemini 比价格怎么样?',
        faq4A:
          '按混合价算,MiniMax M3.1 Flash 是 {blended} /1M,DeepSeek V4.1-Flash 是 {deepseek},Gemini 4 Argon 是 {gemini}。',
        faq5Q: 'MiniMax 的 priority 服务档位是什么?',
        faq5A:
          'M3 的 priority 通道是输入 {priorityInput} /1M、输出 {priorityOutput} /1M,也就是标准价的 {multiplier}。M3.1 Flash 不接受这个通道。',
      },

      kimi: {
        h1: 'Kimi API 价格',
        subtitle:
          '月之暗面 Kimi 每 1M token 的价格——K3.1 Pro、Highspeed 双生版本以及仍在售的 K3,含百万级上下文窗口与单独计费的缓存写入。',
        metaDescription:
          'Kimi API 价格:K3.1 Pro、K3.1 Pro Highspeed 与 K3 的每 1M token 输入价、输出价、缓存输入价、百万级上下文窗口,以及缓存写入的计费方式。更新于 {date}。',
        tldrItems: [
          'Kimi K3.1 Pro 提供百万级上下文窗口,输入价、输出价与缓存价分开计算。',
          '缓存写入与缓存读取分开计费,而且按 TTL 分档——5 分钟的写入比 1 小时的写入便宜。',
          'Highspeed 双生版本价格是标准版的两倍,换来的是同样能力、更快的输出速度。',
          'Kimi K3 仍然与 K3.1 Pro 同时在售,而且比 K3.1 Pro 更贵。',
          '下面每一行都是快照日期当天生效的价格。',
        ],
        tips: [
          '缓存写入也要算钱——TTL 越长,写入单价越高。',
          '除非你确实需要更快的输出,否则用标准的 K3.1 Pro;双生版本贵一倍。',
          '百万级窗口不等于长请求便宜——账单照样由 token 数决定。',
          '和其他国产模型比的时候看混合价,不要只看输入价。',
          '用计算器跑自己的 token 数:表格是标价,你自己的负载才是账单。',
        ],
        faq1Q: 'Kimi K3.1 Pro 每 1M token 多少钱?',
        faq1A:
          'Kimi K3.1 Pro 输入 {input} /1M,输出 {output} /1M,缓存输入 {cached} /1M,上下文窗口 {context}。{promo}',
        faq2Q: 'Kimi 的百万上下文怎么收费?',
        faq2A:
          'K3 系列每次请求可以到 {context} token。无论请求多长,输入按 {input} /1M、输出按 {output} /1M 计费,所以把窗口填满,只是同一个价格的更大倍数。',
        faq3Q: 'Kimi 写缓存要收多少钱?',
        faq3A:
          '缓存写入按 TTL 单独计费:5 分钟写入 {write5} /1M,1 小时写入 {write1h} /1M。命中之后按 {cached} /1M 计费,不再收第二次写入费用。',
        faq4Q: 'Kimi K3.1 Pro 比 Claude 或 GPT 便宜吗?',
        faq4A: '按混合价算,Kimi K3.1 Pro 是 {blended} /1M,Claude Opus 5.5 是 {claude},GPT-6 astra 是 {gpt}。',
        faq5Q: 'Kimi K3.1 Pro 和 Highspeed 版本有什么区别?',
        faq5A:
          'Highspeed 版本输入 {highspeedInput} /1M、输出 {highspeedOutput} /1M——同样的智能水平、更快的输出速度,价格是标准版的两倍。',
      },
    },

    model: {
      metaTitle: '{model} API 价格、跑分与上下文窗口({year})',
      metaDescription:
        '{model} 的每 1M token API 价格——输入 {input}、输出 {output}、缓存输入 {cached},加上 {context} 的上下文窗口与基准跑分。价格截至 {date}。',
      worthItTitle: '这个模型值不值?',
      worthItIntro:
        '结论由注册表价格与榜单综合分算出来,不是手写的:下面的数字就是它自己的价格和它自己的分数。',
      alternativesTitle: '{model} 与其他模型对比',
      alternativesIntro: '同一价格档位上的其他模型,能进入正面对比页的都会给链接。',
      compareLink: '{a} 对比 {b}',
      modelLink: '{model} 模型页',
      alternativesEmpty: '暂时没有其他模型落在同一个价格档位。',
      factsTitle: '你要付的钱',
      factsPrice: '混合价',
      factsInput: '输入 /1M',
      factsOutput: '输出 /1M',
      factsCached: '缓存输入 /1M',
      factsContext: '上下文窗口',
      factsPriceRank: '价格排名',
      factsPriceRankValue: '在 {n} 个有价格的模型里排第 {rank},从便宜到贵',
      factsComposite: '榜单综合分',
      factsCompositeValue: '{track} 榜 {composite} 分',
      factsCompositeNone: '没有综合分——该模型没有在任何能力榜上被排名',
      factsTier: '价格档位',
      tierValue: '低价档',
      tierMid: '中档',
      tierPremium: '高价档',
      noCachedRate: '该模型没有公布缓存输入价。',
      verdict: {
        cheapStrong:
          '{model} 是我们收录的模型里最便宜的一档——混合价 {blended} /1M(输入 {input},输出 {output})——但它在 {track} 榜上仍然拿到 {composite} 分,{ranked} 个里排第 {rank}。这种「便宜又强」的组合很少见:账单压住了,能力没掉。',
        cheapWeak:
          '{model} 便宜——混合价 {blended} /1M(输入 {input},输出 {output})——但它在 {track} 榜上只有 {composite} 分,{ranked} 个里排第 {rank}。批量任务可以用它,最难的活别交给它。',
        flagship:
          '{model} 是旗舰价——混合价 {blended} /1M(输入 {input},输出 {output})——而且它挣回了部分溢价:{track} 榜 {composite} 分,{ranked} 个里排第 {rank}。如果你不需要这份能力,便宜一档的模型能干同样的活。',
        overpriced:
          '{model} 按旗舰定价——混合价 {blended} /1M(输入 {input},输出 {output})——但它并没有领先自己上榜的那一档:{track} 榜 {composite} 分,{ranked} 个里排第 {rank}。除非你点名要它,这个价很难说值。',
        balanced:
          '{model} 处在价格区间的中段——混合价 {blended} /1M(输入 {input},输出 {output})——{track} 榜 {composite} 分,{ranked} 个里排第 {rank}。既不是最便宜,也不是最强:选哪个取决于你的负载。',
        unproven:
          '{model} 的混合价是 {blended} /1M(输入 {input},输出 {output}),在我们收录的 {priced} 个模型里属于{tier}——而且它没有榜单综合分,没有分数可以和价格互相权衡。只能看厂商自己的数字。',
      },
    },

    best: {
      // The page title and intro of every category live in the shared
      // dictionary (`leaderboard.best.<slug>.title` / `.intro`) — one place
      // for all eight categories, so a category is never named twice. What
      // lives here is what the ATTRIBUTE-ranked tables need and the
      // score-ranked ones do not: their columns and their captions.
      colBlended: '混合价 /1M',
      colCached: '缓存输入 /1M',
      colDiscount: '折扣',
      colContext: '上下文窗口',
      colStatus: '状态',
      captionPrice: '按每 1M token 的混合价排序,从便宜到贵。每一个价格都是 {date} 当天生效的价格。',
      captionContext: '只列出上下文窗口达到 {threshold} token 的模型,按窗口从大到小排。',
      captionCache:
        '没有公布缓存输入价的模型不会出现在这里——厂商没公布这个价格,拿一个不存在的价格去算折扣就是编数字。',
      noCachedRate: '未公布缓存输入价',
      fullBoard: '看完整榜单',
    },
  },
}
