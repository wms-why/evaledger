import type { ModelRegistry } from './types'

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
  fetchedAt: '2026-09-23',
  sourceNote:
    'Prices sourced from each provider\'s official pricing page. Verify before relying on for billing.',
  openRouterMarkup: 1.05,

  models: [
    // ───────────────────────── OpenAI ─────────────────────────
    {
      id: 'gpt-5',
      provider: 'openai',
      displayName: 'GPT-5',
      family: 'gpt-5',
      status: 'active',
      contextWindow: 400_000,
      inputPricePer1M: 1.25,
      outputPricePer1M: 10.0,
      cachedInputPricePer1M: 0.125,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-23',
    },
    {
      id: 'gpt-5-mini',
      provider: 'openai',
      displayName: 'GPT-5 mini',
      family: 'gpt-5',
      status: 'active',
      contextWindow: 400_000,
      inputPricePer1M: 0.25,
      outputPricePer1M: 2.0,
      cachedInputPricePer1M: 0.025,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-23',
    },
    {
      id: 'gpt-5-nano',
      provider: 'openai',
      displayName: 'GPT-5 nano',
      family: 'gpt-5',
      status: 'active',
      contextWindow: 400_000,
      inputPricePer1M: 0.05,
      outputPricePer1M: 0.4,
      cachedInputPricePer1M: 0.005,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-23',
    },
    {
      id: 'gpt-4.1',
      provider: 'openai',
      displayName: 'GPT-4.1',
      family: 'gpt-4',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 2.0,
      outputPricePer1M: 8.0,
      cachedInputPricePer1M: 0.5,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-23',
    },
    {
      id: 'gpt-4.1-mini',
      provider: 'openai',
      displayName: 'GPT-4.1 mini',
      family: 'gpt-4',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 0.4,
      outputPricePer1M: 1.6,
      cachedInputPricePer1M: 0.1,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-23',
    },
    {
      id: 'o3',
      provider: 'openai',
      displayName: 'o3',
      family: 'o-series',
      status: 'active',
      contextWindow: 200_000,
      inputPricePer1M: 10.0,
      outputPricePer1M: 40.0,
      cachedInputPricePer1M: 2.5,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-23',
    },
    {
      id: 'o3-mini',
      provider: 'openai',
      displayName: 'o3-mini',
      family: 'o-series',
      status: 'active',
      contextWindow: 200_000,
      inputPricePer1M: 1.1,
      outputPricePer1M: 4.4,
      cachedInputPricePer1M: 0.275,
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-09-23',
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
      lastVerified: '2026-09-23',
      note: 'Discontinued; kept for long-tail search.',
    },

    // ───────────────────────── Anthropic ─────────────────────────
    {
      id: 'claude-opus-4.5',
      provider: 'anthropic',
      displayName: 'Claude Opus 4.5',
      family: 'claude-opus',
      status: 'active',
      contextWindow: 200_000,
      inputPricePer1M: 5.0,
      outputPricePer1M: 25.0,
      cachedInputPricePer1M: 0.5,
      cacheWrite: [
        { window: '5min', pricePer1M: 6.25 },
        { window: '1hr', pricePer1M: 10.0 },
      ],
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-09-23',
    },
    {
      id: 'claude-sonnet-4.5',
      provider: 'anthropic',
      displayName: 'Claude Sonnet 4.5',
      family: 'claude-sonnet',
      status: 'active',
      contextWindow: 200_000,
      inputPricePer1M: 3.0,
      outputPricePer1M: 15.0,
      cachedInputPricePer1M: 0.3,
      cacheWrite: [
        { window: '5min', pricePer1M: 3.75 },
        { window: '1hr', pricePer1M: 6.0 },
      ],
      sourceUrl: 'https://claude.com/pricing#api',
      lastVerified: '2026-09-23',
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
      lastVerified: '2026-09-23',
    },

    // ───────────────────────── Google ─────────────────────────
    {
      id: 'gemini-2.5-pro',
      provider: 'google',
      displayName: 'Gemini 2.5 Pro',
      family: 'gemini-2.5',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 1.25,
      outputPricePer1M: 10.0,
      cachedInputPricePer1M: 0.31,
      longContext: [
        { threshold: 200_000, inputMultiplier: 2, outputMultiplier: 1.5 },
      ],
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      lastVerified: '2026-09-23',
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
      cachedInputPricePer1M: 0.075,
      longContext: [
        { threshold: 200_000, inputMultiplier: 2, outputMultiplier: 1.5 },
      ],
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      lastVerified: '2026-09-23',
    },

    // ───────────────────────── DeepSeek ─────────────────────────
    {
      id: 'deepseek-chat',
      provider: 'deepseek',
      displayName: 'DeepSeek V3.2',
      family: 'deepseek-v3',
      status: 'active',
      contextWindow: 128_000,
      inputPricePer1M: 0.28,
      outputPricePer1M: 0.42,
      cachedInputPricePer1M: 0.028,
      peakOffPeak: {
        peak: { inputPricePer1M: 0.28, outputPricePer1M: 0.42 },
        offPeak: { inputPricePer1M: 0.028, outputPricePer1M: 0.042 },
        offPeakNote: '16:30–00:30 UTC, daily',
      },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
      lastVerified: '2026-09-23',
    },
    {
      id: 'deepseek-reasoner',
      provider: 'deepseek',
      displayName: 'DeepSeek R1',
      family: 'deepseek-r1',
      status: 'active',
      contextWindow: 128_000,
      inputPricePer1M: 0.55,
      outputPricePer1M: 2.19,
      cachedInputPricePer1M: 0.14,
      peakOffPeak: {
        peak: { inputPricePer1M: 0.55, outputPricePer1M: 2.19 },
        offPeak: { inputPricePer1M: 0.14, outputPricePer1M: 0.55 },
        offPeakNote: '16:30–00:30 UTC, daily',
      },
      sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
      lastVerified: '2026-09-23',
    },

    // ───────────────────────── Grok ─────────────────────────
    {
      id: 'grok-4',
      provider: 'grok',
      displayName: 'Grok 4',
      family: 'grok-4',
      status: 'active',
      contextWindow: 256_000,
      inputPricePer1M: 3.0,
      outputPricePer1M: 15.0,
      cachedInputPricePer1M: 0.75,
      sourceUrl: 'https://docs.x.ai/docs/models',
      lastVerified: '2026-09-23',
    },
  ],
}

/** Lookup helper — returns the canonical entry for an id, or undefined. */
export function findModel(id: string) {
  return REGISTRY.models.find((m) => m.id === id)
}

/** All distinct provider names present in the registry, sorted. */
export function distinctProviders(): string[] {
  return [...new Set(REGISTRY.models.map((m) => m.provider))].sort()
}