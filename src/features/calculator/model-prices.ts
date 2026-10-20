import type { ModelRegistry } from './types'

/**
 * Bumped by hand whenever REGISTRY contents change materially (active model
 * added/removed, status flipped, prices re-verified). The `pnpm prices:fetch`
 * script reads this and warns at the end of every run when it drifts from the
 * script's own version (`SCRIPT_VERSION` in `scripts/prices/version.ts`).
 *
 * Rule: the two move in lockstep — bump both in the same commit, or neither.
 * The script's `--apply` flag never touches this value; only humans do.
 */
export const REGISTRY_VERSION = '0.5.0'

/**
 * Static registry of LLM pricing. Keep numbers conservative: this is a
 * marketing-grade calculator, not a billing ledger. Every entry MUST include
 * `sourceUrl` + `lastVerified` so prices can be re-checked before deployment.
 *
 * Refresh workflow:
 *  1. Open each `sourceUrl`, confirm `inputPricePer1M` / `outputPricePer1M`.
 *  2. Bump `lastVerified` to today (ISO date).
 *  3. Bump `REGISTRY.fetchedAt` so the page can render "Updated YYYY-MM-DD".
 *  4. Re-run `pnpm test && pnpm typecheck`.
 *
 * Conventions:
 *  - Prices are USD per 1M tokens (industry standard).
 *  - OpenRouter prices below are NOT explicit entries: OpenRouter markup over
 *    the underlying official price is applied at calculation time (see
 *    `REGISTRY.openRouterMarkup`). If you need to override per model, add
 *    entries with provider='openrouter'.
 *  - Status='delisted' / 'retired' models are kept so search long-tail
 *    (e.g. "claude opus 4.8 price") still finds the page with a "no longer
//    available" note — do not delete.
 */
export const REGISTRY: ModelRegistry = {
  registryVersion: REGISTRY_VERSION,
  fetchedAt: '2026-10-20',
  sourceNote:
    'Prices sourced from each provider\'s official pricing page. Verify before relying on for billing.',
  openRouterMarkup: 1.05,

  models: [
    // ───────────────────────── OpenAI ─────────────────────────
    // OpenAI's page has two context bands: "short context" / "long context".
    // The long-context column is 2× input and 1.5× output, applied above
    // 272K input tokens (see the AWS Bedrock model cards for the threshold).
    // The 1.05M window belongs to the GPT-6 line and GPT-5.6 sol; cyber keeps
    // the 400K window. Verified 2026-10-20 against platform.openai.com/docs/pricing.
    {
      id: 'gpt-6-astra',
      provider: 'openai',
      displayName: 'GPT-6 astra',
      family: 'gpt-6',
      status: 'active',
      contextWindow: 1_050_000,
      inputPricePer1M: 10.0,
      outputPricePer1M: 50.0,
      cachedInputPricePer1M: 1.0,
      longContext: [{ threshold: 272_000, inputMultiplier: 2, outputMultiplier: 1.5 }],
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-10-20',
    },
    {
      id: 'gpt-6-sol',
      provider: 'openai',
      displayName: 'GPT-6 sol',
      family: 'gpt-6',
      status: 'active',
      contextWindow: 1_050_000,
      inputPricePer1M: 2.0,
      outputPricePer1M: 10.0,
      cachedInputPricePer1M: 0.2,
      longContext: [{ threshold: 272_000, inputMultiplier: 2, outputMultiplier: 1.5 }],
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-10-20',
    },
    {
      id: 'gpt-6-luna',
      provider: 'openai',
      displayName: 'GPT-6 luna',
      family: 'gpt-6',
      status: 'active',
      contextWindow: 1_050_000,
      inputPricePer1M: 0.1,
      outputPricePer1M: 0.5,
      cachedInputPricePer1M: 0.01,
      longContext: [{ threshold: 272_000, inputMultiplier: 2, outputMultiplier: 1.5 }],
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-10-20',
    },
    {
      id: 'gpt-5.6-cyber',
      provider: 'openai',
      displayName: 'GPT-5.6 cyber',
      family: 'gpt-5',
      status: 'active',
      contextWindow: 400_000,
      inputPricePer1M: 12.5,
      outputPricePer1M: 75.0,
      cachedInputPricePer1M: 1.25,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-10-20',
    },
    {
      id: 'gpt-5.6-sol',
      provider: 'openai',
      displayName: 'GPT-5.6 sol',
      family: 'gpt-5',
      status: 'active',
      contextWindow: 1_050_000,
      inputPricePer1M: 4.0,
      outputPricePer1M: 20.0,
      cachedInputPricePer1M: 0.4,
      longContext: [{ threshold: 272_000, inputMultiplier: 2, outputMultiplier: 1.5 }],
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-10-20',
    },
    {
      id: 'gpt-5',
      provider: 'openai',
      displayName: 'GPT-5',
      family: 'gpt-5',
      status: 'delisted',
      contextWindow: 400_000,
      inputPricePer1M: 1.25,
      outputPricePer1M: 10.0,
      cachedInputPricePer1M: 0.125,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-26',
      note: 'Replaced by GPT-6 series; kept for long-tail search.',
    },
    {
      id: 'gpt-5-mini',
      provider: 'openai',
      displayName: 'GPT-5 mini',
      family: 'gpt-5',
      status: 'delisted',
      contextWindow: 400_000,
      inputPricePer1M: 0.25,
      outputPricePer1M: 2.0,
      cachedInputPricePer1M: 0.025,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-26',
      note: 'Replaced by GPT-6 series; kept for long-tail search.',
    },
    {
      id: 'gpt-5-nano',
      provider: 'openai',
      displayName: 'GPT-5 nano',
      family: 'gpt-5',
      status: 'delisted',
      contextWindow: 400_000,
      inputPricePer1M: 0.05,
      outputPricePer1M: 0.4,
      cachedInputPricePer1M: 0.005,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-26',
      note: 'Replaced by GPT-6 series; kept for long-tail search.',
    },
    {
      id: 'gpt-4.1',
      provider: 'openai',
      displayName: 'GPT-4.1',
      family: 'gpt-4',
      status: 'delisted',
      contextWindow: 1_000_000,
      inputPricePer1M: 2.0,
      outputPricePer1M: 8.0,
      cachedInputPricePer1M: 0.5,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-26',
      note: 'Replaced by GPT-6 series; kept for long-tail search.',
    },
    {
      id: 'gpt-4.1-mini',
      provider: 'openai',
      displayName: 'GPT-4.1 mini',
      family: 'gpt-4',
      status: 'delisted',
      contextWindow: 1_000_000,
      inputPricePer1M: 0.4,
      outputPricePer1M: 1.6,
      cachedInputPricePer1M: 0.1,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-26',
      note: 'Replaced by GPT-6 series; kept for long-tail search.',
    },
    {
      id: 'o3',
      provider: 'openai',
      displayName: 'o3',
      family: 'o-series',
      status: 'delisted',
      contextWindow: 200_000,
      inputPricePer1M: 10.0,
      outputPricePer1M: 40.0,
      cachedInputPricePer1M: 2.5,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-26',
      note: 'Replaced by GPT-6 series; kept for long-tail search.',
    },
    {
      id: 'o3-mini',
      provider: 'openai',
      displayName: 'o3-mini',
      family: 'o-series',
      status: 'delisted',
      contextWindow: 200_000,
      inputPricePer1M: 1.1,
      outputPricePer1M: 4.4,
      cachedInputPricePer1M: 0.275,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-26',
      note: 'Replaced by GPT-6 series; kept for long-tail search.',
    },
    {
      id: 'o1-pro',
      provider: 'openai',
      displayName: 'o1-pro',
      family: 'o-series',
      status: 'delisted',
      contextWindow: 200_000,
      inputPricePer1M: 150.0,
      outputPricePer1M: 600.0,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-26',
      note: 'Discontinued; kept for long-tail search.',
    },

    // ───────────────────────── Anthropic ─────────────────────────
    {
      id: 'claude-fable-5.1',
      provider: 'anthropic',
      displayName: 'Fable 5.1',
      family: 'claude-fable',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 10.0,
      outputPricePer1M: 50.0,
      cachedInputPricePer1M: 0.25,
      cacheWrite: [{ window: '5min', pricePer1M: 12.5 }],
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-10-20',
    },
    {
      id: 'claude-opus-5.5',
      provider: 'anthropic',
      displayName: 'Opus 5.5',
      family: 'claude-opus',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 4.0,
      outputPricePer1M: 20.0,
      cachedInputPricePer1M: 0.2,
      cacheWrite: [{ window: '5min', pricePer1M: 5.0 }],
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-10-20',
    },
    {
      id: 'claude-sonnet-5',
      provider: 'anthropic',
      displayName: 'Sonnet 5',
      family: 'claude-sonnet',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 2.0,
      outputPricePer1M: 10.0,
      cachedInputPricePer1M: 0.2,
      cacheWrite: [{ window: '5min', pricePer1M: 2.5 }],
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-10-20',
    },
    {
      id: 'claude-haiku-4.5',
      provider: 'anthropic',
      displayName: 'Claude Haiku 4.5',
      family: 'claude-haiku',
      status: 'active',
      contextWindow: 200_000,
      inputPricePer1M: 1.0,
      outputPricePer1M: 5.0,
      cachedInputPricePer1M: 0.1,
      cacheWrite: [
        { window: '5min', pricePer1M: 1.25 },
        { window: '1hr', pricePer1M: 2.0 },
      ],
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-10-20',
    },
    {
      id: 'claude-opus-4.5',
      provider: 'anthropic',
      displayName: 'Claude Opus 4.5',
      family: 'claude-opus',
      status: 'delisted',
      contextWindow: 200_000,
      inputPricePer1M: 5.0,
      outputPricePer1M: 25.0,
      cachedInputPricePer1M: 0.5,
      cacheWrite: [
        { window: '5min', pricePer1M: 6.25 },
        { window: '1hr', pricePer1M: 10.0 },
      ],
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-09-26',
      note: 'Listed in Anthropic\'s Legacy models section; superseded by Opus 5.5.',
    },
    {
      id: 'claude-sonnet-4.5',
      provider: 'anthropic',
      displayName: 'Claude Sonnet 4.5',
      family: 'claude-sonnet',
      status: 'delisted',
      contextWindow: 200_000,
      inputPricePer1M: 3.0,
      outputPricePer1M: 15.0,
      cachedInputPricePer1M: 0.3,
      cacheWrite: [
        { window: '5min', pricePer1M: 3.75 },
        { window: '1hr', pricePer1M: 6.0 },
      ],
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-09-26',
      note: 'Listed in Anthropic\'s Legacy models section; superseded by Sonnet 5.',
    },
    {
      id: 'claude-sonnet-4.6',
      provider: 'anthropic',
      displayName: 'Claude Sonnet 4.6',
      family: 'claude-sonnet',
      status: 'delisted',
      contextWindow: 200_000,
      inputPricePer1M: 3.0,
      outputPricePer1M: 15.0,
      cachedInputPricePer1M: 0.3,
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-09-26',
      note: 'Listed in Anthropic\'s Legacy models section; superseded by Sonnet 5.',
    },
    {
      id: 'claude-fable-5',
      provider: 'anthropic',
      displayName: 'Claude Fable 5',
      family: 'claude-fable',
      status: 'delisted',
      contextWindow: 200_000,
      inputPricePer1M: 10.0,
      outputPricePer1M: 50.0,
      cachedInputPricePer1M: 1.0,
      cacheWrite: [{ window: '5min', pricePer1M: 12.5 }],
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-09-26',
      note: 'Listed in Anthropic\'s Legacy models section; superseded by Fable 5.1.',
    },
    {
      id: 'claude-opus-5',
      provider: 'anthropic',
      displayName: 'Claude Opus 5',
      family: 'claude-opus',
      status: 'delisted',
      contextWindow: 1_000_000,
      inputPricePer1M: 5.0,
      outputPricePer1M: 25.0,
      cachedInputPricePer1M: 0.5,
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-10-20',
      note: 'Listed in Anthropic\'s Legacy models section; superseded by Opus 5.5.',
    },
    {
      id: 'claude-opus-4.6',
      provider: 'anthropic',
      displayName: 'Claude Opus 4.6',
      family: 'claude-opus',
      status: 'delisted',
      contextWindow: 200_000,
      inputPricePer1M: 5.0,
      outputPricePer1M: 25.0,
      cachedInputPricePer1M: 0.5,
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-09-26',
      note: 'Listed in Anthropic\'s Legacy models section; superseded by Opus 5.5.',
    },
    {
      id: 'claude-opus-4.7',
      provider: 'anthropic',
      displayName: 'Claude Opus 4.7',
      family: 'claude-opus',
      status: 'delisted',
      contextWindow: 200_000,
      inputPricePer1M: 5.0,
      outputPricePer1M: 25.0,
      cachedInputPricePer1M: 0.5,
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-09-26',
      note: 'Listed in Anthropic\'s Legacy models section; superseded by Opus 5.5.',
    },
    {
      id: 'claude-opus-4.8',
      provider: 'anthropic',
      displayName: 'Claude Opus 4.8',
      family: 'claude-opus',
      status: 'delisted',
      contextWindow: 200_000,
      inputPricePer1M: 5.0,
      outputPricePer1M: 25.0,
      cachedInputPricePer1M: 0.5,
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-09-26',
      note: 'Listed in Anthropic\'s Legacy models section; superseded by Opus 5.5.',
    },

    // ───────────────────────── Google ─────────────────────────
    {
      id: 'gemini-3.1-pro-preview',
      provider: 'google',
      displayName: 'Gemini 3.1 Pro Preview',
      family: 'gemini-3',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 2.0,
      outputPricePer1M: 12.0,
      cachedInputPricePer1M: 0.2,
      // Google's own row: "Input price $4.00, prompts > 200k tokens;
      // output $18.00, prompts > 200k". The cached read doubles too ($0.40);
      // cost.ts applies the input multiplier to the cached rate as well.
      longContext: [{ threshold: 200_000, inputMultiplier: 2, outputMultiplier: 1.5 }],
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      lastVerified: '2026-10-20',
    },
    {
      id: 'gemini-3.8-flash',
      provider: 'google',
      displayName: 'Gemini 3.8 Flash',
      family: 'gemini-3',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 0.75,
      outputPricePer1M: 3.75,
      cachedInputPricePer1M: 0.075,
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      lastVerified: '2026-10-20',
      note: 'Introductory pricing: $0.75 / $3.75 / $0.075 through 2026-12-31, then $1.50 / $7.50 / $0.15 from 2027-01-01.',
    },
    {
      id: 'gemini-3.1-flash-lite',
      provider: 'google',
      displayName: 'Gemini 3.1 Flash-Lite',
      family: 'gemini-3',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 0.25,
      outputPricePer1M: 1.5,
      cachedInputPricePer1M: 0.025,
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      lastVerified: '2026-10-20',
    },
    {
      id: 'gemini-2.5-pro',
      provider: 'google',
      displayName: 'Gemini 2.5 Pro',
      family: 'gemini-2.5',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 1.25,
      outputPricePer1M: 10.0,
      cachedInputPricePer1M: 0.125,
      longContext: [
        { threshold: 200_000, inputMultiplier: 2, outputMultiplier: 1.5 },
      ],
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      lastVerified: '2026-10-20',
    },
    {
      id: 'gemini-2.5-flash-lite',
      provider: 'google',
      displayName: 'Gemini 2.5 Flash-Lite',
      family: 'gemini-2.5',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 0.1,
      outputPricePer1M: 0.4,
      cachedInputPricePer1M: 0.01,
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      lastVerified: '2026-10-20',
    },
    {
      id: 'gemini-2.5-flash',
      provider: 'google',
      displayName: 'Gemini 2.5 Flash',
      family: 'gemini-2.5',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 0.3,
      outputPricePer1M: 2.5,
      cachedInputPricePer1M: 0.03,
      longContext: [
        { threshold: 200_000, inputMultiplier: 2, outputMultiplier: 1.5 },
      ],
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      lastVerified: '2026-10-20',
    },

    // ───────────────────────── DeepSeek ─────────────────────────
    // Off-peak schedule (verified 2026-10-19 against api-docs.deepseek.com):
    //   - Mon–Fri (excluding Chinese public holidays), peak is 01:00–04:00 and
    //     06:00–10:00 UTC; all other hours are off-peak, weekends and Chinese
    //     public holidays included in full.
    //   - "Off-peak rates are half of the peak rates" — input and output. This
    //     was previously violated by two entries (deepseek-chat at 10% of peak,
    //     deepseek-reasoner at 25%); in both, the off-peak *input* figure had
    //     been copied from the cached-input column. All four entries now follow
    //     the 50% rule.
    //   - Top-level `inputPricePer1M` / `outputPricePer1M` are PEAK rates;
    //     `pricingPeriod: 'peak'` makes that explicit for the JSON API.
    //   - `cachedInputPricePer1M` is the PEAK cache-hit rate. The off-peak tier
    //     carries its own `cachedInputPricePer1M` so a cached quote is priced
    //     within the period it is billed in. The two delisted entries have no
    //     verified off-peak cache rate, so they fall back to the peak rate —
    //     which over-quotes them off-peak rather than under-quoting.
    {
      id: 'deepseek-flash',
      provider: 'deepseek',
      displayName: 'DeepSeek V4.1-Flash',
      family: 'deepseek-v4',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 0.3,
      outputPricePer1M: 1.2,
      cachedInputPricePer1M: 0.006,
      pricingPeriod: 'peak',
      peakOffPeak: {
        peak: { inputPricePer1M: 0.3, outputPricePer1M: 1.2 },
        // Off-peak cache hit is $0.003 (half the peak $0.006).
        offPeak: {
          inputPricePer1M: 0.15,
          outputPricePer1M: 0.6,
          cachedInputPricePer1M: 0.003,
        },
        offPeakNote:
          'Mon–Fri (excl. Chinese holidays). Peak 01:00–04:00 & 06:00–10:00 UTC; off-peak = all other times.',
      },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
      lastVerified: '2026-10-20',
      note: 'API model version DeepSeek-V4.1-Flash-1017 (released 2026-10-17); the 2026-09-10 launch price is unchanged.',
    },
    {
      id: 'deepseek-v4-pro',
      provider: 'deepseek',
      displayName: 'DeepSeek V4-Pro',
      family: 'deepseek-v4',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 1.32,
      outputPricePer1M: 3.96,
      cachedInputPricePer1M: 0.044,
      pricingPeriod: 'peak',
      peakOffPeak: {
        peak: { inputPricePer1M: 1.32, outputPricePer1M: 3.96 },
        // Off-peak cache hit is $0.022 (half the peak $0.044).
        offPeak: {
          inputPricePer1M: 0.66,
          outputPricePer1M: 1.98,
          cachedInputPricePer1M: 0.022,
        },
        offPeakNote:
          'Mon–Fri (excl. Chinese holidays). Peak 01:00–04:00 & 06:00–10:00 UTC; off-peak = all other times.',
      },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
      lastVerified: '2026-10-20',
    },
    {
      id: 'deepseek-chat',
      provider: 'deepseek',
      displayName: 'DeepSeek V3.2',
      family: 'deepseek-v3',
      status: 'delisted',
      contextWindow: 128_000,
      inputPricePer1M: 0.28,
      outputPricePer1M: 0.42,
      cachedInputPricePer1M: 0.028,
      pricingPeriod: 'peak',
      peakOffPeak: {
        peak: { inputPricePer1M: 0.28, outputPricePer1M: 0.42 },
        // 50% of peak. Was 10% of peak — the input figure had been copied
        // from this entry's cachedInputPricePer1M.
        offPeak: { inputPricePer1M: 0.14, outputPricePer1M: 0.21 },
        offPeakNote:
          'Mon–Fri (excl. Chinese holidays). Peak 01:00–04:00 & 06:00–10:00 UTC; off-peak = all other times.',
      },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
      lastVerified: '2026-10-19',
      note: 'Replaced by DeepSeek V4 series; kept for long-tail search.',
    },
    {
      id: 'deepseek-reasoner',
      provider: 'deepseek',
      displayName: 'DeepSeek R1',
      family: 'deepseek-r1',
      status: 'delisted',
      contextWindow: 128_000,
      inputPricePer1M: 0.55,
      outputPricePer1M: 2.19,
      cachedInputPricePer1M: 0.14,
      pricingPeriod: 'peak',
      peakOffPeak: {
        peak: { inputPricePer1M: 0.55, outputPricePer1M: 2.19 },
        // 50% of peak. Was 25% of peak — the input figure had been copied
        // from this entry's cachedInputPricePer1M.
        offPeak: { inputPricePer1M: 0.275, outputPricePer1M: 1.095 },
        offPeakNote:
          'Mon–Fri (excl. Chinese holidays). Peak 01:00–04:00 & 06:00–10:00 UTC; off-peak = all other times.',
      },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
      lastVerified: '2026-10-19',
      note: 'Replaced by DeepSeek V4 series; kept for long-tail search.',
    },

    // ───────────────────────── MiniMax ─────────────────────────
    // Verified 2026-10-19 against platform.minimax.io/docs/pricing/overview
    // (USD) and platform.minimax.cn/docs/pricing/overview (CNY); the CN launch
    // post at minimax.cn/blog/minimax-m31f quotes ¥1 / ¥4 / ¥0.1 per 1M for
    // M3.1 Flash, which reconciles with the USD row at ¥6.667/USD (every M3
    // cell implies ¥7.00/USD, so one global FX factor does not tie the two
    // lists together — the USD numbers below are the published ones, not
    // converted). The M3 launch post (minimax.cn/blog/minimax-m3, 2026-06-01)
    // confirms the two-pricing-tiers-by-context-length structure and the
    // 1.5× service_tier=priority lane; the numbers themselves come from the
    // live pricing page, which the post only shows as a screenshot.
    // Not carried: the whole M2 line (M2.7 / M2.5 / M2.1 / M2 and their
    // -highspeed twins). MiniMax closed the series to new users on
    // 2026-10-19 and M2.7 / M2.5 retire 2026-11-18, after which M Plan
    // traffic reroutes to M3.1 Flash. The live pricing pages no longer list
    // any of them — only archived snapshots still show their rates — so this
    // registry carries MiniMax's current, callable models only.
    {
      id: 'minimax-m3.1-flash',
      provider: 'minimax',
      displayName: 'MiniMax M3.1 Flash',
      family: 'minimax-m3',
      status: 'active',
      // MiniMax documents 1M as TOTAL input + output, not input alone.
      contextWindow: 1_000_000,
      inputPricePer1M: 0.15,
      outputPricePer1M: 0.6,
      cachedInputPricePer1M: 0.015,
      sourceUrl: 'https://platform.minimax.io/docs/pricing/overview',
      lastVerified: '2026-10-20',
      note: 'Released 2026-10-19; $0.15 / $0.60 / $0.015 (¥1 / ¥4 / ¥0.1). Flat rate — no long-context tier, and unlike M3 it does not accept service_tier=priority.',
    },
    {
      id: 'minimax-m3',
      provider: 'minimax',
      displayName: 'MiniMax M3',
      family: 'minimax-m3',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 0.3,
      outputPricePer1M: 1.2,
      cachedInputPricePer1M: 0.06,
      // Standard tier, ≤512k input. Past 512k of input every meter doubles
      // ($0.60 / $2.40 / $0.12) — see the long-context table on the page.
      longContext: [{ threshold: 524_288, inputMultiplier: 2, outputMultiplier: 2 }],
      sourceUrl: 'https://platform.minimax.io/docs/pricing/overview',
      lastVerified: '2026-10-20',
      note: 'Released 2026-06-01. service_tier=priority costs 1.5× ($0.45 / $1.80 / $0.09). No separate cache-write charge. The cached-input rate above 512k doubles to $0.12; cost.ts applies the input multiplier to the cached rate as well.',
    },

    // ───────────────────────── Grok ─────────────────────────
    {
      id: 'grok-4.7',
      provider: 'grok',
      displayName: 'Grok 4.7',
      family: 'grok-4',
      status: 'active',
      contextWindow: 500_000,
      inputPricePer1M: 2.0,
      outputPricePer1M: 6.0,
      sourceUrl: 'https://docs.x.ai/docs/models',
      lastVerified: '2026-10-20',
    },
    {
      id: 'grok-4',
      provider: 'grok',
      displayName: 'Grok 4',
      family: 'grok-4',
      status: 'delisted',
      contextWindow: 256_000,
      inputPricePer1M: 3.0,
      outputPricePer1M: 15.0,
      cachedInputPricePer1M: 0.75,
      sourceUrl: 'https://docs.x.ai/docs/models',
      lastVerified: '2026-09-26',
      note: 'Replaced by Grok 4.7; kept for long-tail search.',
    },
  ],
}

/** Lookup helper — returns the canonical entry for an id, or undefined. */
export function findModel(id: string) {
  return REGISTRY.models.find((m) => m.id === id)
}