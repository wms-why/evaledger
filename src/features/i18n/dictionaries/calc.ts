/**
 * Calculator landing-page copy (the `calc` slice).
 *
 * This module lives OUTSIDE `en.ts` / `zh.ts` on purpose: those two files are
 * the Lead's, and the calculator pages need copy that is derived from the
 * price registry rather than hand-typed. The Lead wires this module in as
 * `calc: calc.en` / `calc: calc.zh`; until then `t('calc.…')` returns the raw
 * key, which is expected.
 *
 * Two rules govern every string here:
 *
 *  1. **The dictionary holds the WORDS, the code holds the NUMBERS.** Every
 *     price, rate, percentage and break-even figure is a `{placeholder}`
 *     filled in at render time from `REGISTRY` (see `src/features/calculator/
 *     copy.ts`). A number typed into a sentence here would be stale the day
 *     the registry moves — which is exactly how the previous copy of these
 *     pages ended up quoting two different cache-hit prices for the same
 *     model.
 *
 *  2. **A model name is a link when the model is on the leaderboard.** Use
 *     the marker `[[model:<registry-id>|<label>]]` — the renderer resolves
 *     the registry id to its `/models/<leaderboard-id>` page and falls back to
 *     plain text when the model has no leaderboard row. Never hand-write a
 *     `/models/…` URL here.
 *
 * `en` and `zh` MUST have identical key sets. The Chinese copy is a native
 * rewrite using the terms Chinese developers actually search (Claude API 价格,
 * DeepSeek API 定价, 缓存命中价格, 盈亏平衡), not a literal translation.
 */
export const calc = {
  en: {
    // ───── Page titles / subtitles ─────
    tokenTitle: 'Token Cost Calculator — Compare Every LLM API Price',
    tokenSubtitle:
      'Compare prices across OpenAI, Claude, Gemini, DeepSeek, MiniMax, Grok and Kimi. Real tokenizer for OpenAI, accurate estimates for the rest.',
    openrouterTitle: 'OpenRouter Pricing Calculator — What Your Tokens Actually Cost After Markup',
    openrouterSubtitle:
      'Every model priced twice — the provider’s direct API price, and what OpenRouter charges after its markup — with the difference in dollars.',
    claudeTitle: 'Claude Token Cost Calculator — Cost per Token & Monthly Estimates',
    claudeSubtitle:
      'Cost per token and monthly estimates for Claude Opus 5.5, Sonnet 5 and Haiku 4.5 — with the Anthropic API.',
    deepseekTitle: 'DeepSeek API Pricing — V4-Pro & V4.1-Flash Per-Token Rates',
    deepseekSubtitle:
      'V4-Pro and V4.1-Flash per-token rates, peak and off-peak hours, and prompt-cache savings — compared to Claude, GPT and Gemini.',
    chatgptTitle: 'ChatGPT API Pricing — GPT-6 & GPT-5.6 Cost per Token',
    chatgptSubtitle:
      'GPT-6 and GPT-5.6 per-token rates, Batch API 50% off, and prompt-cache savings — compared to Claude, Gemini and DeepSeek.',

    // ───── Shared quick takeaways (token / Claude / OpenRouter pages) ─────
    tldr1:
      'Output tokens usually cost 4–8× more than input — keeping replies short is the highest-leverage cost saver.',
    tldr2:
      'Anthropic prompt caching drops repeat-input cost by ~90%; OpenAI cached input drops it by ~90% on the GPT-6 line.',
    tldr3:
      'DeepSeek off-peak hours are ~50% cheaper than peak — schedule batch jobs accordingly.',
    tldr4:
      'Gemini 2.5 Pro doubles its input price above 200K context — large-context calls cost roughly twice as much.',

    // ───── Shared money-saving tips (token / Claude / OpenRouter pages) ─────
    tips1:
      'Use a smaller model for routing / classification — Claude Haiku 4.5 and GPT-6 luna cost roughly 10× less than the flagship.',
    tips2:
      'Cache repeat prefixes (system prompts, tool schemas) — Anthropic cached input drops the rate by ~90%.',
    tips3:
      'Set max_tokens explicitly — output is the expensive side; capping it prevents runaway replies.',
    tips4:
      'Batch non-urgent jobs into DeepSeek off-peak hours for ~50% cheaper inference.',
    tips5:
      'Trim long context — Gemini 2.5 Pro doubles its input rate above 200K; chunk documents that don’t need the rest.',

    // ───── Claude page ─────
    claudeSampleRate: 'at current {model} rates',

    // ───── DeepSeek page ─────
    deepseekTldr1:
      'DeepSeek V4.1-Flash is {flashIn} input / {flashOut} output per 1M tokens at peak — about {flashVsSol}× cheaper than GPT-6 sol on output.',
    deepseekTldr2:
      'V4-Pro is {proIn} / {proOut} per 1M — comparable to Claude Sonnet 5 on reasoning work, about {proVsSonnet}× cheaper on output.',
    deepseekTldr3:
      'Off-peak (Mon–Fri outside 01:00–04:00 & 06:00–10:00 UTC, plus all weekends & Chinese holidays) is 50% of peak — schedule batch jobs accordingly.',
    deepseekTldr4:
      'Cache hits drop V4.1-Flash input from {flashIn}/M to {flashCachedPeak}/M at peak ({flashCachedOff}/M off-peak) — {flashCachePct}% off.',
    deepseekTips1:
      'Use V4.1-Flash for routing / classification — output is {flashOut}/M vs {proOut}/M on V4-Pro, about {flashVsPro}× cheaper.',
    deepseekTips2:
      'Cache repeat prefixes — V4.1-Flash cache hit is {flashCachedPeak}/M at peak, a {flashCachePct}% drop from {flashIn}/M. The single biggest cost saver for repeat-prompt workloads.',
    deepseekTips3:
      'Batch non-urgent jobs into off-peak hours (Mon–Fri outside 01:00–04:00 and 06:00–10:00 UTC) for ~50% cheaper inference.',
    deepseekTips4:
      'Set max_tokens explicitly — output is the expensive side; capping it prevents runaway replies.',
    deepseekTips5:
      'Going direct to DeepSeek’s API beats OpenRouter by {markupPct}%. OpenRouter wins on automatic fallback + a single invoice.',
    deepseekCacheBody:
      'DeepSeek cache hits are aggressive — V4.1-Flash drops cached input by {flashCachePct}% from the standard rate, V4-Pro by {proCachePct}%. For any workload with a repeated prefix (system prompt, tool definitions, document context) caching the prefix is the single highest-leverage cost saving.',

    // ───── ChatGPT page ─────
    chatgptTldr1:
      'GPT-6 sol cached input drops to {solCached}/M — a {solCachePct}% discount vs the {solIn}/M standard rate.',
    chatgptTldr2:
      'The Batch API runs at 50% off with a 24-hour SLA — ideal for evals, bulk summarization, and dataset generation.',
    chatgptTldr3:
      'GPT-6 astra is the priciest of the GPT-6 line at {astraIn} input / {astraOut} output per 1M tokens.',
    chatgptTldr4:
      'GPT-6 luna is the cheapest of the GPT-6 line at {lunaIn} input / {lunaOut} output per 1M tokens.',
    chatgptTips1:
      'Use GPT-6 luna for routing / classification — its output is {lunaOut}/M against {solOut}/M on GPT-6 sol, about {lunaVsSol}× cheaper.',
    chatgptTips2:
      'Enable cached input — OpenAI auto-caches prefix repeats for ~90% off the standard input rate.',
    chatgptTips3:
      'Route non-urgent jobs through the Batch API for 50% off (24-hour SLA, no queue rate-limits).',
    chatgptTips4:
      'Set max_tokens explicitly — output is the expensive side; capping it prevents runaway replies.',
    chatgptTips5:
      'ChatGPT Plus ($20/mo) does NOT replace API access — high-volume workloads still need the API.',

    // ───── OpenRouter page ─────
    openrouterMarkupBody:
      'OpenRouter charges a small markup on top of each provider’s official API price. The current average is {markupPct}%, but the exact markup varies per model and per credit package. For most single-model workloads the overhead is small; it gets painful when you pay per request with many small models, or when you don’t need OpenRouter’s fallback / multi-model routing at all.',
    openrouterCompareTitle: 'Direct vs OpenRouter — every model priced both ways',
    openrouterCompareSubtitle:
      'The same token, priced by the provider and by OpenRouter. The gap between the two columns is the markup: {markupPct}% on every line below.',
    openrouterCompareColModel: 'Model',
    openrouterCompareColDirect: 'Direct API',
    openrouterCompareColRouter: 'Via OpenRouter',
    openrouterCompareColDiff: 'Markup',
    openrouterCompareNote:
      'Prices are USD per 1M tokens, resolved from the same registry the calculator charges from. The OpenRouter column applies the current {multiplier}× average markup ({markupPct}%).',
    openrouterCompareEmpty: 'No active models to compare.',

    // ───── Results grid group headings ─────
    resultsVendorGroup: '{vendor} API prices',
    resultsCrossVendor: 'Cross-vendor comparison',

    // ───── Related-calculator link anchors (must name the destination) ─────
    relatedLinkToken: 'Compare every LLM price →',
    relatedLinkOpenrouter: 'Calculate OpenRouter markup →',
    relatedLinkClaude: 'Calculate Claude API cost →',
    relatedLinkDeepseek: 'View DeepSeek API pricing →',
    relatedLinkChatgpt: 'View ChatGPT API pricing →',
    relatedLinkGemini: 'View Gemini API pricing →',
    relatedLinkGrok: 'View Grok API pricing →',
    relatedLinkMinimax: 'View MiniMax API pricing →',
    relatedLinkKimi: 'View Kimi API pricing →',

    // ───── Token Cost Calculator FAQ ─────
    tokenFaq1Q: 'How much does 1 million tokens cost?',
    tokenFaq1A:
      'It depends entirely on the model. GPT-6 luna is {lunaIn} input / {lunaOut} output per 1M tokens; Claude Haiku 4.5 is {haikuIn} / {haikuOut}; Claude Opus 5.5 is {opusIn} / {opusOut}; DeepSeek V4.1-Flash is {flashIn} / {flashOut}. Use the calculator above to compare every major model at your exact usage.',
    tokenFaq2Q: 'Why is output more expensive than input?',
    tokenFaq2A:
      'Every LLM provider charges more per output token than per input token — typically 4× to 8× more. Output tokens are billed higher because generation is the compute-heavy step (autoregressive decoding), while input is a single forward pass.',
    tokenFaq3Q: 'How do I count tokens?',
    tokenFaq3A:
      'For OpenAI models, the calculator uses the real tokenizer (o200k_base for the GPT-5 and GPT-6 families, cl100k_base for older families). For Anthropic, Google, DeepSeek, MiniMax, Grok and Kimi, it uses a CJK-aware character approximation — accurate to within ~10% for English, ~5% for Chinese.',
    tokenFaq4Q: 'How accurate is this calculator?',
    tokenFaq4A:
      'Token counts are exact for OpenAI-family models and approximate for everyone else. Prices are sourced from each provider’s official pricing page and re-verified regularly, but providers change prices without notice — always check the source link on each model card before relying on a number for billing.',
    tokenFaq5Q: 'What is prompt caching?',
    tokenFaq5A:
      'Prompt caching lets you reuse a previously-seen prefix (system prompt, tool definitions, large document) across requests at a fraction of the normal input cost. Anthropic charges ~90% less for cached reads; OpenAI charges ~90% less on the GPT-6 line; DeepSeek charges {flashCachePct}% less for peak cache hits. The biggest single cost saver for repeat-prompt workloads.',
    tokenFaq6Q: 'Does OpenRouter add a markup?',
    tokenFaq6A:
      'Yes — OpenRouter charges a small markup (currently {markupPct}% on average, {multiplier}× every price) on top of each provider’s official API price. For most single-model workloads the overhead is negligible; OpenRouter wins when you need automatic fallback across providers or a single bill for many models.',
    tokenFaq7Q: 'Is the Claude subscription cheaper than the API?',
    tokenFaq7A:
      'Up to a point, yes. Claude Pro ($20/mo) and Max ($200/mo) include generous usage caps. Beyond roughly {proIn}M input + {proOut}M output tokens per month (Pro) or roughly {maxIn}M input + {maxOut}M output tokens per month (Max), the API starts winning on pure cost. Use the calculator above to find your break-even point.',
    tokenFaq8Q: 'How often are prices updated?',
    tokenFaq8A:
      'Prices are re-verified against each provider’s official pricing page regularly. The "Updated {date}" stamp at the top of the page reflects the last verification. A machine-readable version is available at /api/prices.json — same data, designed for AI agents and programmatic access.',

    // ───── Claude FAQ ─────
    claudeFaq1Q: 'How much does Claude Sonnet 5 cost per million tokens?',
    claudeFaq1A:
      'Claude Sonnet 5 is {sonnetIn} per 1M input tokens and {sonnetOut} per 1M output tokens via the Anthropic API. With prompt caching, cached reads drop to {sonnetCached} per 1M ({sonnetCachePct}% off). The 5-minute cache write is {sonnetCw} per 1M.',
    claudeFaq2Q: 'How much do 10,000 tokens cost in Claude?',
    claudeFaq2A:
      '10,000 input tokens on Claude Sonnet 5 cost {sonnet10kIn} ({sonnet10kInCents} cents). 10,000 output tokens cost {sonnet10kOut} ({sonnet10kOutCents} cents). On Opus 5.5 the same is {opus10kIn} input and {opus10kOut} output; on Haiku 4.5 it’s {haiku10kIn} input and {haiku10kOut} output.',
    claudeFaq3Q: 'How many tokens does $5 get you in Claude?',
    claudeFaq3A:
      '$5 buys you roughly {sonnet5In} input tokens on Claude Sonnet 5 (or {sonnet5Out} output tokens). On Haiku 4.5 the same $5 buys {haiku5In} input / {haiku5Out} output tokens. On Opus 5.5 it’s {opus5In} input / {opus5Out} output tokens.',
    claudeFaq4Q: 'How much is 200,000 tokens in Claude?',
    claudeFaq4A:
      '200,000 input tokens on Claude Sonnet 5 cost {sonnet200kIn}; on Opus 5.5 it’s {opus200kIn}; on Haiku 4.5 it’s {haiku200kIn}. The same 200K output tokens cost {sonnet200kOut} on Sonnet 5, {opus200kOut} on Opus 5.5, and {haiku200kOut} on Haiku 4.5.',
    claudeFaq5Q: 'Is Claude Pro or Max cheaper than the API?',
    claudeFaq5A:
      'Up to a point, yes. Claude Pro ($20/mo) is cheaper than the API below roughly {proIn}M input + {proOut}M output tokens per month (Claude Sonnet 5 rates). Max ($200/mo) covers up to roughly {maxIn}M input + {maxOut}M output. Beyond those thresholds, the API wins on pure cost.',
    claudeFaq6Q: 'How does Claude prompt caching work?',
    claudeFaq6A:
      'Anthropic caches prompt prefixes for 5 minutes or 1 hour. A cached read costs {sonnetCachePct}% less than fresh input ({sonnetCached} per 1M on Sonnet 5). Cache writes carry a premium: {sonnetCw} per 1M for the 5-minute window on Sonnet 5, {haikuCw5} (5-minute) and {haikuCw1h} (1-hour) per 1M on Haiku 4.5. Caching is the single biggest cost saver for repeat-system-prompt workloads.',
    claudeFaq7Q: 'Which Claude model is cheapest?',
    claudeFaq7A:
      'Claude Haiku 4.5 is the cheapest at {haikuIn} / {haikuOut} per 1M tokens. Sonnet 5 ({sonnetIn} / {sonnetOut}) is the mid-tier and the sweet spot for most production work. Opus 5.5 ({opusIn} / {opusOut}) is the flagship, and Fable 5.1 ({fableIn} / {fableOut}) sits at the top of the line.',
    claudeFaq8Q: 'How accurate is this calculator?',
    claudeFaq8A:
      'Token counts are approximated (the Claude tokenizer is not bundled with this tool — counts use a CJK-aware character heuristic, accurate to within ~10% for English, ~5% for Chinese). Prices are sourced from claude.com/pricing and re-verified regularly. Always check the source link on each card before relying on a number for billing.',

    // ───── DeepSeek FAQ ─────
    deepseekFaq1Q: 'How much does the DeepSeek API cost?',
    deepseekFaq1A:
      'At peak, DeepSeek V4-Pro is {proIn} per 1M input tokens / {proOut} per 1M output tokens. DeepSeek V4.1-Flash is {flashIn} / {flashOut}. Off-peak, both are billed at half the peak rate. New accounts get a small free credit to start; top-up minimums start at $5. Numbers above are re-verified against api-docs.deepseek.com/quick_start/pricing.',
    deepseekFaq2Q: 'When is DeepSeek off-peak?',
    deepseekFaq2A:
      'Off-peak runs Monday through Friday outside the peak windows (UTC 01:00–04:00 and 06:00–10:00) and all day on weekends and Chinese public holidays. During off-peak, input and output are billed at 50% of the peak rate — V4.1-Flash drops to {flashOffIn} / {flashOffOut} per 1M and V4-Pro to {proOffIn} / {proOffOut}. The schedule is published at api-docs.deepseek.com.',
    deepseekFaq3Q: 'Is DeepSeek cheaper than GPT-6?',
    deepseekFaq3A:
      'Yes — at peak, DeepSeek V4.1-Flash output is {flashOut} per 1M tokens versus GPT-6 sol at {solOut} (about {flashVsSol}× cheaper on output). V4-Pro output at {proOut} is about {proVsSol}× cheaper than GPT-6 sol. For high-volume workloads the difference dominates every other cost lever.',
    deepseekFaq4Q: 'What is DeepSeek V4.1-Flash?',
    deepseekFaq4A:
      'V4.1-Flash is the fast non-reasoning model in the V4 family: a 1M context window, {flashIn} / {flashOut} per 1M at peak, with a {flashCachedPeak} cache-hit price on input ({flashCachedOff} off-peak). Its input is about {flashVsOpusIn}× cheaper than Claude Opus 5.5 and its output about {flashVsOpusOut}× cheaper.',
    deepseekFaq5Q: 'What is DeepSeek V4-Pro?',
    deepseekFaq5A:
      'V4-Pro is the flagship reasoning model: a 1M context window, {proIn} / {proOut} per 1M at peak, with a {proCachedPeak} cache-hit price ({proCachedOff} off-peak). Its output is about {proVsSonnet}× cheaper than Claude Sonnet 5 and {proVsOpus}× cheaper than Opus 5.5 — flagship-tier reasoning at a small-model price.',
    deepseekFaq6Q: 'Does DeepSeek have prompt caching?',
    deepseekFaq6A:
      'Yes. V4.1-Flash cache hits are {flashCachedPeak} per 1M input tokens at peak — a {flashCachePct}% drop from {flashIn}/M standard ({flashCachedOff}/M off-peak). V4-Pro cache hits are {proCachedPeak} per 1M, a {proCachePct}% drop from {proIn}/M ({proCachedOff}/M off-peak). For repeat-prefix workloads (system prompts, tool schemas, large document context) caching is the single biggest cost lever.',
    deepseekFaq7Q: 'Is the DeepSeek API the same as OpenRouter?',
    deepseekFaq7A:
      'No — going direct to api-docs.deepseek.com bills at the official rate; OpenRouter adds a markup ({markupPct}%) for routing, billing, and automatic fallback. For single-model high-volume workloads direct is cheaper; OpenRouter wins when you need fallback across providers or a single invoice for many models.',
    deepseekFaq8Q: 'How do I get a DeepSeek API key?',
    deepseekFaq8A:
      'Sign up at platform.deepseek.com, complete the minimum top-up (currently $5), and generate a key from the API Keys page in the console. The calculator above always shows the current per-million rates, and /api/prices.json exposes the same numbers in a machine-readable form for AI agents.',

    // ───── ChatGPT FAQ ─────
    chatgptFaq1Q: 'How much does the ChatGPT API cost per million tokens?',
    chatgptFaq1A:
      'GPT-6 astra is {astraIn} input / {astraOut} output per 1M; GPT-6 sol is {solIn} / {solOut}; GPT-6 luna is {lunaIn} / {lunaOut}. Cached input is {solCached}/M on GPT-6 sol and {astraCached}/M on GPT-6 astra. The GPT-5 family is now delisted — the GPT-6 line replaced it. Use the calculator above to compare every active model at your exact usage.',
    chatgptFaq2Q: 'How many tokens does $5 get you in ChatGPT?',
    chatgptFaq2A:
      '$5 buys you roughly {astra5In} input tokens on GPT-6 astra (or {astra5Out} output). On GPT-6 sol the same $5 buys {sol5In} input / {sol5Out} output. On GPT-6 luna it’s {luna5In} input / {luna5Out} output.',
    chatgptFaq3Q: 'How much is 200,000 tokens in ChatGPT?',
    chatgptFaq3A:
      '200,000 input tokens on GPT-6 astra cost {astra200kIn}; on GPT-6 sol {sol200kIn}; on GPT-6 luna {luna200kIn}. The same 200K output tokens cost {astra200kOut} on astra, {sol200kOut} on sol, {luna200kOut} on luna.',
    chatgptFaq4Q: 'Should I use GPT-6 sol or GPT-6 luna?',
    chatgptFaq4A:
      'GPT-6 sol ({solIn} input / {solOut} output per 1M) is the balanced default for production work where answer quality matters. GPT-6 luna ({lunaIn} / {lunaOut}) is for high-volume routing and classification — its output is about {lunaVsSol}× cheaper. Most production stacks use luna for routing and reserve sol for the harder prompts.',
    chatgptFaq5Q: 'How does ChatGPT prompt caching work?',
    chatgptFaq5A:
      'OpenAI automatically caches prompt prefixes of 1,024 tokens or more for 5–10 minutes. Cached reads bill at roughly 10% of the standard input rate — {solCached}/M on GPT-6 sol vs {solIn}/M standard, {astraCached}/M on GPT-6 astra vs {astraIn}/M. The single biggest cost saver for repeat-prefix workloads.',
    chatgptFaq6Q: 'Who should use the OpenAI Batch API?',
    chatgptFaq6A:
      'The Batch API is for non-urgent jobs that can wait up to 24 hours — evals, bulk summarization, dataset generation, embedding backfills. Both input and output bill at 50% of standard rates; you submit a JSONL file of requests and poll for completion. Latency-sensitive workloads should use the real-time API.',
    chatgptFaq7Q: 'Is OpenRouter cheaper than going direct to OpenAI?',
    chatgptFaq7A:
      'For most single-model, high-volume workloads, going direct to platform.openai.com is slightly cheaper — you skip the OpenRouter markup ({markupPct}%). OpenRouter wins when you need automatic fallback across providers, a single bill for many models, or access to models not available in your home region.',
    chatgptFaq8Q: 'How accurate is this calculator?',
    chatgptFaq8A:
      'Token counts are exact for ChatGPT models (the calculator uses OpenAI’s o200k_base tokenizer for the GPT-5 and GPT-6 families, cl100k_base for older families). Prices are sourced from platform.openai.com/docs/pricing and re-verified regularly. Always check the source link on each card before relying on a number for billing.',

    // ───── OpenRouter FAQ ─────
    openrouterFaq1Q: 'What does OpenRouter actually charge?',
    openrouterFaq1A:
      'OpenRouter charges the provider’s official API price plus a markup ({markupPct}% on average right now — {multiplier}× on every price in the table above) for the routing, billing, and fallback service. The exact markup varies per model — check the model’s card on OpenRouter for the current number.',
    openrouterFaq2Q: 'Is OpenRouter more expensive than going direct?',
    openrouterFaq2A:
      'For most single-model, high-volume workloads, going direct to the official provider is slightly cheaper because you skip the markup. OpenRouter wins when you need automatic fallback across providers, a single bill for many models, or access to models not available in your home region.',
    openrouterFaq3Q: 'How much does 1 million tokens cost on OpenRouter?',
    openrouterFaq3A:
      'It depends on which model you route to. On GPT-6 astra the official price is {astraIn} / {astraOut} per 1M tokens and OpenRouter bills {orAstraIn} / {orAstraOut}. On Claude Sonnet 5 it is {sonnetIn} / {sonnetOut} direct and {orSonnetIn} / {orSonnetOut} via OpenRouter. The table above prices every model both ways.',
    openrouterFaq4Q: 'Does OpenRouter charge per request?',
    openrouterFaq4A:
      'No per-request fee — just the per-token markup on top of the underlying model price. The total is the same shape as a direct API call; the only difference is the small multiplier.',
    openrouterFaq5Q: 'Can I use my own provider API key with OpenRouter?',
    openrouterFaq5A:
      'Yes — OpenRouter lets you bring your own keys (BYOK) for some providers. When you do, you pay the provider’s official rate with no OpenRouter markup. When you don’t, OpenRouter bills you for both the tokens and the markup.',
    openrouterFaq6Q: 'How accurate is this calculator?',
    openrouterFaq6A:
      'The base model prices come from each provider’s official pricing page; the OpenRouter column multiplies those by the current average markup factor ({multiplier}×, about {markupPct}%). Re-check the model’s source link before relying on a number for billing.',
    openrouterFaq7Q: 'Which models are available on OpenRouter?',
    openrouterFaq7A:
      'OpenRouter aggregates most major models — the GPT-6 family, Claude Opus 5.5 / Sonnet 5 / Haiku 4.5, Gemini 4 Argon and the Gemini 3.x line, DeepSeek V4-Pro and V4.1-Flash, Grok 4.7, Kimi K3.1 Pro, MiniMax M3.1 Flash and many open-source models. Check the live catalog at openrouter.ai/models for the current count (it changes weekly).',
    openrouterFaq8Q: 'How often are these OpenRouter prices updated?',
    openrouterFaq8A:
      'Whenever the underlying provider changes its price, the OpenRouter markup-adjusted column above updates on the same cadence. The "Updated {date}" stamp and /api/prices.json both reflect the latest verification.',
  },

  zh: {
    // ───── 页面标题 / 副标题 ─────
    tokenTitle: 'Token 成本计算器 — 一站比对所有 LLM API 价格',
    tokenSubtitle:
      '横向比对 OpenAI、Claude、Gemini、DeepSeek、MiniMax、Grok、Kimi 的价格。OpenAI 系列用真实 tokenizer，其余模型用高精度的近似估算。',
    openrouterTitle: 'OpenRouter 价格计算器 — 看清你的 token 在加价后实际多少钱',
    openrouterSubtitle:
      '每个模型同时给出两个价：厂商官方 API 的原始价格，以及 OpenRouter 加价后的实际价格——并把差额算给你看。',
    claudeTitle: 'Claude Token 成本计算器 — 每 token 成本与月度估算',
    claudeSubtitle:
      'Claude Opus 5.5、Sonnet 5、Haiku 4.5 的每 token 成本与月度账单估算——直接对接 Anthropic 官方 API 价格。',
    deepseekTitle: 'DeepSeek API 定价 — V4-Pro 与 V4.1-Flash 每百万 token 单价',
    deepseekSubtitle:
      'V4-Pro 与 V4.1-Flash 的每 token 单价、峰值与非峰值时段、提示缓存能省多少钱——并与 Claude、GPT、Gemini 横向对比。',
    chatgptTitle: 'ChatGPT API 价格 — GPT-6 与 GPT-5.6 每 token 成本',
    chatgptSubtitle:
      'GPT-6 与 GPT-5.6 的每 token 单价、Batch API 五折，以及提示缓存能省多少——并与 Claude、Gemini、DeepSeek 对比。',

    // ───── 通用速览（token / Claude / OpenRouter 页共用） ─────
    tldr1: '输出 token 通常比输入贵 4–8 倍——把回复压短，是成本优化里收益最高的一招。',
    tldr2: 'Anthropic 提示缓存能让重复输入的成本下降约 90%；OpenAI 在 GPT-6 系列上也有约 90% 的缓存折扣。',
    tldr3: 'DeepSeek 的非峰值时段比峰值便宜约 50%——把批处理任务排进去。',
    tldr4: 'Gemini 2.5 Pro 的上下文超过 200K 后输入价翻倍——长上下文调用差不多要多付一倍。',

    // ───── 通用省钱建议（token / Claude / OpenRouter 页共用） ─────
    tips1: '路由、分类这类活用小模型——Claude Haiku 4.5 和 GPT-6 luna 比旗舰便宜约 10 倍。',
    tips2: '缓存重复前缀（系统提示词、工具 schema）——Anthropic 的缓存输入价能降约 90%。',
    tips3: '显式设置 max_tokens——输出是贵的那一侧，限制它可以防止回复失控。',
    tips4: '非紧急任务排进 DeepSeek 的非峰值时段，推理成本直接砍半。',
    tips5: '裁剪上下文——Gemini 2.5 Pro 超过 200K 输入价翻倍，用不到的段落就别喂进去。',

    // ───── Claude 页 ─────
    claudeSampleRate: '按当前 {model} 的价格计算',

    // ───── DeepSeek 页 ─────
    deepseekTldr1:
      'DeepSeek V4.1-Flash 峰值时段每 1M token 输入 {flashIn}、输出 {flashOut}——输出比 GPT-6 sol 便宜约 {flashVsSol} 倍。',
    deepseekTldr2:
      'V4-Pro 每 1M token 输入 {proIn}、输出 {proOut}——推理能力对标 Claude Sonnet 5，输出还便宜约 {proVsSonnet} 倍。',
    deepseekTldr3:
      '非峰值时段（工作日 01:00–04:00 与 06:00–10:00 UTC 之外，以及周末与中国法定假日全天）按峰值的 50% 计费——批处理尽量排进去。',
    deepseekTldr4:
      '命中缓存后，V4.1-Flash 输入从 {flashIn}/M 降到 {flashCachedPeak}/M（非峰值 {flashCachedOff}/M）——便宜 {flashCachePct}%。',
    deepseekTips1:
      '路由、分类用 V4.1-Flash——输出只要 {flashOut}/M，V4-Pro 是 {proOut}/M，便宜约 {flashVsPro} 倍。',
    deepseekTips2:
      '把重复前缀缓存起来——V4.1-Flash 峰值时段命中缓存只要 {flashCachedPeak}/M，比 {flashIn}/M 便宜 {flashCachePct}%，这是重复提示词场景最大的省钱杠杆。',
    deepseekTips3: '非紧急任务排进非峰值时段（工作日 01:00–04:00 与 06:00–10:00 UTC 之外），推理成本便宜约 50%。',
    deepseekTips4: '显式设置 max_tokens——输出是贵的那一侧，限制它可以防止回复失控。',
    deepseekTips5: '直连 DeepSeek 官方 API 比走 OpenRouter 便宜 {markupPct}%；要的是自动故障切换和一张账单，才值得付这层加价。',
    deepseekCacheBody:
      'DeepSeek 的缓存命中价相当激进——V4.1-Flash 的缓存输入比标准价低 {flashCachePct}%，V4-Pro 低 {proCachePct}%。只要工作负载里有重复前缀（系统提示词、工具定义、文档上下文），把前缀缓存下来就是收益最高的省钱动作。',

    // ───── ChatGPT 页 ─────
    chatgptTldr1: 'GPT-6 sol 的缓存输入只要 {solCached}/M——比 {solIn}/M 的标准价便宜 {solCachePct}%。',
    chatgptTldr2: 'Batch API 五折、24 小时 SLA——跑评测、批量摘要、造数据集最合适。',
    chatgptTldr3: 'GPT-6 astra 是 GPT-6 系列里最贵的，每 1M token 输入 {astraIn}、输出 {astraOut}。',
    chatgptTldr4: 'GPT-6 luna 是 GPT-6 系列里最便宜的，每 1M token 输入 {lunaIn}、输出 {lunaOut}。',
    chatgptTips1:
      '路由、分类用 GPT-6 luna——输出只要 {lunaOut}/M，GPT-6 sol 是 {solOut}/M，便宜约 {lunaVsSol} 倍。',
    chatgptTips2: '打开缓存输入——OpenAI 会自动缓存重复前缀，比标准输入价便宜约 90%。',
    chatgptTips3: '非紧急任务走 Batch API，五折且 24 小时 SLA、队列没有速率限制。',
    chatgptTips4: '显式设置 max_tokens——输出是贵的那一侧，限制它可以防止回复失控。',
    chatgptTips5: 'ChatGPT Plus（20 美元/月）并不等于 API 权限——高并发场景还是得用 API。',

    // ───── OpenRouter 页 ─────
    openrouterMarkupBody:
      'OpenRouter 会在各厂商官方 API 价格之上再加一层加价。当前平均加价约 {markupPct}%，但每个模型、每种充值档位的实际加价并不一样。对单一模型的工作负载来说这点开销不算大；真正肉疼的是你要为大量小模型逐次请求付费，或者你根本用不上 OpenRouter 的故障切换与多模型路由。',
    openrouterCompareTitle: '直连官方 vs OpenRouter——每个模型两种价格并排看',
    openrouterCompareSubtitle:
      '同样一份 token，厂商官方一个价，OpenRouter 另一个价。两列之间的差额就是加价：下面每一行都是 {markupPct}%。',
    openrouterCompareColModel: '模型',
    openrouterCompareColDirect: '官方 API 直连价',
    openrouterCompareColRouter: 'OpenRouter 转售价',
    openrouterCompareColDiff: '加价',
    openrouterCompareNote:
      '价格单位为美元 / 每百万 token，与计算器使用的是同一份价格表。OpenRouter 一列按当前 {multiplier}× 平均加价（{markupPct}%）换算。',
    openrouterCompareEmpty: '暂时没有可对比的在售模型。',

    // ───── 结果区分组标题 ─────
    resultsVendorGroup: '{vendor} API 价格',
    resultsCrossVendor: '跨厂商对比',

    // ───── 相关计算器链接文案（必须点明目的地） ─────
    relatedLinkToken: '比对所有 LLM 价格 →',
    relatedLinkOpenrouter: '算清 OpenRouter 加价 →',
    relatedLinkClaude: '计算 Claude API 成本 →',
    relatedLinkDeepseek: '查看 DeepSeek API 定价 →',
    relatedLinkChatgpt: '查看 ChatGPT API 定价 →',
    relatedLinkGemini: '查看 Gemini API 定价 →',
    relatedLinkGrok: '查看 Grok API 定价 →',
    relatedLinkMinimax: '查看 MiniMax API 定价 →',
    relatedLinkKimi: '查看 Kimi API 定价 →',

    // ───── Token 成本计算器 FAQ ─────
    tokenFaq1Q: '100 万 token 要多少钱？',
    tokenFaq1A:
      '完全取决于模型。GPT-6 luna 每 1M token 输入 {lunaIn}、输出 {lunaOut}；Claude Haiku 4.5 是 {haikuIn} / {haikuOut}；Claude Opus 5.5 是 {opusIn} / {opusOut}；DeepSeek V4.1-Flash 是 {flashIn} / {flashOut}。用上面的计算器按你的真实用量横向对比。',
    tokenFaq2Q: '为什么输出 token 比输入贵？',
    tokenFaq2A:
      '所有厂商的输出 token 单价都高于输入，通常是 4～8 倍。原因是生成才是算力大头（自回归解码逐 token 往外吐），而输入只是一次前向计算。',
    tokenFaq3Q: 'token 到底怎么算？',
    tokenFaq3A:
      'OpenAI 系列用的是真实 tokenizer（GPT-5 与 GPT-6 家族用 o200k_base，更老的系列用 cl100k_base）。Anthropic、Google、DeepSeek、MiniMax、Grok、Kimi 用的是兼顾中英文的字符近似估算——英文误差约 10% 以内，中文约 5% 以内。',
    tokenFaq4Q: '这个计算器准不准？',
    tokenFaq4A:
      'OpenAI 家族的 token 数是精确值，其余模型是估算值。价格全部来自各家官方定价页并定期复核，但厂商可能不打招呼就调价——要拿去结算，请先点开每张卡片上的来源链接核对。',
    tokenFaq5Q: '什么是提示缓存（prompt caching）？',
    tokenFaq5A:
      '提示缓存让你把之前出现过的前缀（系统提示词、工具定义、长文档）重复利用，成本只要正常输入的一小部分。Anthropic 缓存读取便宜约 90%；OpenAI 在 GPT-6 系列上便宜约 90%；DeepSeek 峰值时段命中缓存便宜 {flashCachePct}%。重复提示词的工作负载，这是最大的单点省钱手段。',
    tokenFaq6Q: 'OpenRouter 会加价吗？',
    tokenFaq6A:
      '会——OpenRouter 在各家官方 API 价格之上加一层小加价（当前平均 {markupPct}%，也就是 {multiplier}×）。对单一模型的工作负载这点开销可以忽略；需要跨厂商自动故障切换、或者想把很多模型合并成一张账单时，OpenRouter 才划算。',
    tokenFaq7Q: 'Claude 订阅比 API 更便宜吗？',
    tokenFaq7A:
      '在一定范围内是的。Claude Pro（20 美元/月）和 Max（200 美元/月）都有相当慷慨的额度。超过大约 {proIn}M 输入 + {proOut}M 输出 token 每月（Pro）、或 {maxIn}M 输入 + {maxOut}M 输出每月（Max）之后，纯成本上就是 API 更便宜。用上面的计算器找到你的盈亏平衡点。',
    tokenFaq8Q: '价格多久更新一次？',
    tokenFaq8A:
      '价格会定期回到各家官方定价页复核。页面顶部的“更新于 {date}”就是最后一次复核的日期。同一份数据也有机器可读的版本：/api/prices.json，方便 AI agent 和程序化调用。',

    // ───── Claude FAQ ─────
    claudeFaq1Q: 'Claude Sonnet 5 每百万 token 多少钱？',
    claudeFaq1A:
      '走 Anthropic 官方 API，Claude Sonnet 5 每 1M token 输入 {sonnetIn}、输出 {sonnetOut}。开启提示缓存后，缓存命中价降到每 1M {sonnetCached}（便宜 {sonnetCachePct}%）。5 分钟缓存写入价是每 1M {sonnetCw}。',
    claudeFaq2Q: 'Claude 里 1 万 token 要多少钱？',
    claudeFaq2A:
      'Claude Sonnet 5 的 1 万输入 token 约 {sonnet10kIn}（{sonnet10kInCents} 美分），1 万输出 token 约 {sonnet10kOut}（{sonnet10kOutCents} 美分）。换成 Opus 5.5 分别是 {opus10kIn} 输入、{opus10kOut} 输出；Haiku 4.5 则是 {haiku10kIn} 输入、{haiku10kOut} 输出。',
    claudeFaq3Q: '5 美元在 Claude 里能买多少 token？',
    claudeFaq3A:
      'Claude Sonnet 5 上 5 美元大约能买 {sonnet5In} 输入 token（或者 {sonnet5Out} 输出 token）。Haiku 4.5 上同样的 5 美元能买 {haiku5In} 输入 / {haiku5Out} 输出。Opus 5.5 上则是 {opus5In} 输入 / {opus5Out} 输出。',
    claudeFaq4Q: 'Claude 里 20 万 token 要多少钱？',
    claudeFaq4A:
      '20 万输入 token 在 Claude Sonnet 5 上是 {sonnet200kIn}；Opus 5.5 是 {opus200kIn}；Haiku 4.5 是 {haiku200kIn}。同样 20 万输出 token 则是 Sonnet 5 {sonnet200kOut}、Opus 5.5 {opus200kOut}、Haiku 4.5 {haiku200kOut}。',
    claudeFaq5Q: 'Claude Pro、Max 订阅比 API 便宜吗？',
    claudeFaq5A:
      '在一定范围内是的。Claude Pro（20 美元/月）在每月大约 {proIn}M 输入 + {proOut}M 输出 token 以内（按 Claude Sonnet 5 价格算）比 API 便宜；Max（200 美元/月）能覆盖到大约 {maxIn}M 输入 + {maxOut}M 输出。超过这些线，纯成本上就是 API 更划算。',
    claudeFaq6Q: 'Claude 的提示缓存是怎么工作的？',
    claudeFaq6A:
      'Anthropic 会缓存提示词前缀，保存 5 分钟或 1 小时。命中缓存的读取比全新输入便宜 {sonnetCachePct}%（Sonnet 5 上是每 1M {sonnetCached}）。缓存写入要加价：Sonnet 5 的 5 分钟窗口每 1M {sonnetCw}；Haiku 4.5 的 5 分钟窗口 {haikuCw5}、1 小时窗口 {haikuCw1h}。系统提示词重复出现的场景，缓存是最大的省钱杠杆。',
    claudeFaq7Q: '哪个 Claude 模型最便宜？',
    claudeFaq7A:
      'Claude Haiku 4.5 最便宜，每 1M token {haikuIn} / {haikuOut}。Sonnet 5（{sonnetIn} / {sonnetOut}）是中间档，也是绝大多数生产任务的性价比之选。Opus 5.5（{opusIn} / {opusOut}）是旗舰，Fable 5.1（{fableIn} / {fableOut}）则站在这条产品线最顶端。',
    claudeFaq8Q: '这个计算器准不准？',
    claudeFaq8A:
      'token 数是估算值（工具没有内置 Claude tokenizer，用的是兼顾中英文的字符启发式估算，英文误差约 10% 以内、中文约 5% 以内）。价格来自 claude.com/pricing 并定期复核。要拿去结算，请先核对每张卡片上的来源链接。',

    // ───── DeepSeek FAQ ─────
    deepseekFaq1Q: 'DeepSeek API 到底多少钱？',
    deepseekFaq1A:
      '峰值时段，DeepSeek V4-Pro 每 1M token 输入 {proIn}、输出 {proOut}；DeepSeek V4.1-Flash 是 {flashIn} / {flashOut}。非峰值时段两者都按峰值的一半计费。新账号一般会送一点试用额度，最低充值门槛是 5 美元。以上数字都复核自 api-docs.deepseek.com/quick_start/pricing。',
    deepseekFaq2Q: 'DeepSeek 什么时候是非峰值时段？',
    deepseekFaq2A:
      '工作日避开峰值窗口（UTC 01:00–04:00 与 06:00–10:00）算非峰值，周末和中国法定假日全天都是非峰值。非峰值时段输入和输出都按峰值的 50% 计费——V4.1-Flash 降到每 1M {flashOffIn} / {flashOffOut}，V4-Pro 降到 {proOffIn} / {proOffOut}。时段表公布在 api-docs.deepseek.com。',
    deepseekFaq3Q: 'DeepSeek 比 GPT-6 便宜吗？',
    deepseekFaq3A:
      '便宜。峰值时段 DeepSeek V4.1-Flash 输出只要 {flashOut} / 1M token，而 GPT-6 sol 是 {solOut}（输出便宜约 {flashVsSol} 倍）；V4-Pro 输出 {proOut}，也比 GPT-6 sol 便宜约 {proVsSol} 倍。高并发场景下，这个差距会盖过其他所有成本因素。',
    deepseekFaq4Q: 'DeepSeek V4.1-Flash 是什么？',
    deepseekFaq4A:
      'V4.1-Flash 是 V4 家族里偏速度、非推理的那一款：100 万 token 上下文，峰值时段每 1M token 输入 {flashIn}、输出 {flashOut}，缓存命中价 {flashCachedPeak}（非峰值 {flashCachedOff}）。它的输入比 Claude Opus 5.5 便宜约 {flashVsOpusIn} 倍，输出便宜约 {flashVsOpusOut} 倍。',
    deepseekFaq5Q: 'DeepSeek V4-Pro 是什么？',
    deepseekFaq5A:
      'V4-Pro 是旗舰推理模型：100 万 token 上下文，峰值时段每 1M token 输入 {proIn}、输出 {proOut}，缓存命中价 {proCachedPeak}（非峰值 {proCachedOff}）。输出比 Claude Sonnet 5 便宜约 {proVsSonnet} 倍、比 Opus 5.5 便宜约 {proVsOpus} 倍——用小模型的钱拿旗舰级推理。',
    deepseekFaq6Q: 'DeepSeek 支持提示缓存吗？',
    deepseekFaq6A:
      '支持。V4.1-Flash 峰值时段缓存命中价是每 1M {flashCachedPeak}——比 {flashIn}/M 的标准价便宜 {flashCachePct}%（非峰值 {flashCachedOff}/M）。V4-Pro 缓存命中价每 1M {proCachedPeak}，比 {proIn}/M 便宜 {proCachePct}%（非峰值 {proCachedOff}/M）。系统提示词、工具 schema、长文档这类重复前缀，缓存是最大的成本杠杆。',
    deepseekFaq7Q: 'DeepSeek 官方 API 和 OpenRouter 是一回事吗？',
    deepseekFaq7A:
      '不是。直连 api-docs.deepseek.com 按官方价计费；OpenRouter 会额外加 {markupPct}% 的加价，换来路由、统一账单和自动故障切换。单一模型、高并发的场景直连更便宜；需要跨厂商兜底或只想要一张发票时，OpenRouter 才划算。',
    deepseekFaq8Q: '怎么申请 DeepSeek API key？',
    deepseekFaq8A:
      '在 platform.deepseek.com 注册，完成最低充值（目前 5 美元），然后在控制台的 API Keys 页面生成密钥。上面的计算器始终显示当前每百万 token 单价，/api/prices.json 则把同一份数据以机器可读的形式提供给 AI agent。',

    // ───── ChatGPT FAQ ─────
    chatgptFaq1Q: 'ChatGPT API 每百万 token 多少钱？',
    chatgptFaq1A:
      'GPT-6 astra 每 1M token 输入 {astraIn}、输出 {astraOut}；GPT-6 sol 是 {solIn} / {solOut}；GPT-6 luna 是 {lunaIn} / {lunaOut}。缓存输入在 GPT-6 sol 上是 {solCached}/M，在 GPT-6 astra 上是 {astraCached}/M。GPT-5 系列现已下架，接替它的是 GPT-6 系列。用上面的计算器按你的真实用量对比所有在售模型。',
    chatgptFaq2Q: 'ChatGPT 里 5 美元能买多少 token？',
    chatgptFaq2A:
      'GPT-6 astra 上 5 美元大约能买 {astra5In} 输入 token（或者 {astra5Out} 输出）；GPT-6 sol 上是 {sol5In} 输入 / {sol5Out} 输出；GPT-6 luna 上则是 {luna5In} 输入 / {luna5Out} 输出。',
    chatgptFaq3Q: 'ChatGPT 里 20 万 token 要多少钱？',
    chatgptFaq3A:
      '20 万输入 token 在 GPT-6 astra 上是 {astra200kIn}，GPT-6 sol 是 {sol200kIn}，GPT-6 luna 是 {luna200kIn}。同样 20 万输出 token 则是 astra {astra200kOut}、sol {sol200kOut}、luna {luna200kOut}。',
    chatgptFaq4Q: 'GPT-6 sol 和 GPT-6 luna 该怎么选？',
    chatgptFaq4A:
      'GPT-6 sol（输入 {solIn} / 输出 {solOut} 每 1M）是质量优先的生产默认选择。GPT-6 luna（{lunaIn} / {lunaOut}）适合高并发的路由和分类——输出便宜约 {lunaVsSol} 倍。常见做法是 luna 负责路由，难的 prompt 留给 sol。',
    chatgptFaq5Q: 'ChatGPT 的提示缓存是怎么工作的？',
    chatgptFaq5A:
      'OpenAI 会自动缓存 1,024 token 以上的提示词前缀，保存 5–10 分钟。命中缓存的读取大约按标准输入价的 10% 计费——GPT-6 sol 是 {solCached}/M 对 {solIn}/M 标准价，GPT-6 astra 是 {astraCached}/M 对 {astraIn}/M。重复前缀的工作负载，这是最大的单点省钱手段。',
    chatgptFaq6Q: '谁该用 OpenAI 的 Batch API？',
    chatgptFaq6A:
      'Batch API 适合可以等 24 小时的非紧急任务——跑评测、批量摘要、造数据集、批量补 embedding。输入和输出都按标准价的 50% 计费；你提交一个 JSONL 请求文件，再轮询结果。对延迟敏感的业务，还是走实时 API。',
    chatgptFaq7Q: '走 OpenRouter 比直连 OpenAI 便宜吗？',
    chatgptFaq7A:
      '对单一模型、高并发的场景，直连 platform.openai.com 略便宜——省掉 OpenRouter 的 {markupPct}% 加价。需要跨厂商自动故障切换、很多模型合并成一张账单、或者要访问你所在区域没有的模型时，OpenRouter 才划算。',
    chatgptFaq8Q: '这个计算器准不准？',
    chatgptFaq8A:
      'ChatGPT 系列的 token 数是精确值（GPT-5 与 GPT-6 家族用 OpenAI 的 o200k_base tokenizer，更老的系列用 cl100k_base）。价格来自 platform.openai.com/docs/pricing 并定期复核。要拿去结算，请先核对每张卡片上的来源链接。',

    // ───── OpenRouter FAQ ─────
    openrouterFaq1Q: 'OpenRouter 到底收多少钱？',
    openrouterFaq1A:
      'OpenRouter 按各厂商官方 API 价格再加一层加价（当前平均 {markupPct}%，也就是上面表格里每一行的 {multiplier}×），换来路由、统一账单和故障切换。每个模型的实际加价并不完全一样，以 OpenRouter 上该模型的实时报价为准。',
    openrouterFaq2Q: '走 OpenRouter 比直连更贵吗？',
    openrouterFaq2A:
      '对单一模型、高并发的场景，直连官方 API 略便宜，因为省掉了加价。需要跨厂商自动故障切换、很多模型合并成一张账单、或者要访问你所在区域没有的模型时，OpenRouter 才划算。',
    openrouterFaq3Q: '1 百万 token 在 OpenRouter 上多少钱？',
    openrouterFaq3A:
      '取决于你路由到哪个模型。GPT-6 astra 官方价是每 1M {astraIn} / {astraOut}，OpenRouter 收 {orAstraIn} / {orAstraOut}。Claude Sonnet 5 官方是 {sonnetIn} / {sonnetOut}，走 OpenRouter 是 {orSonnetIn} / {orSonnetOut}。上面的表格把每个模型的两种价格都列了出来。',
    openrouterFaq4Q: 'OpenRouter 按请求收费吗？',
    openrouterFaq4A:
      '没有按请求收费——只是在底层模型价格上乘一个加价系数。整体账单的形状和直连 API 完全一样，唯一的差别就是那个系数。',
    openrouterFaq5Q: '可以用自己的厂商 API key 接 OpenRouter 吗？',
    openrouterFaq5A:
      '可以——部分厂商支持自带 key（BYOK）。这样你按官方价付费，没有 OpenRouter 加价；不带 key 时，OpenRouter 会把 token 费用和加价一起收。',
    openrouterFaq6Q: '这个计算器准不准？',
    openrouterFaq6A:
      '基础价格来自各厂商官方定价页；OpenRouter 那一列乘的是当前平均加价系数（{multiplier}×，约 {markupPct}%）。要拿去结算，请先核对模型的来源链接。',
    openrouterFaq7Q: 'OpenRouter 上有哪些模型？',
    openrouterFaq7A:
      'OpenRouter 聚合了大部分主流模型——GPT-6 系列、Claude Opus 5.5 / Sonnet 5 / Haiku 4.5、Gemini 4 Argon 与 Gemini 3.x 系列、DeepSeek V4-Pro 与 V4.1-Flash、Grok 4.7、Kimi K3.1 Pro、MiniMax M3.1 Flash，以及大量开源模型。具体数量每周都在变，以 openrouter.ai/models 的实时目录为准。',
    openrouterFaq8Q: 'OpenRouter 的价格多久更新一次？',
    openrouterFaq8A:
      '只要底层厂商调了价，上面的 OpenRouter 加价列就会同步更新。页面顶部的“更新于 {date}”和 /api/prices.json 都对应最新一次复核。',
  },
} as const
