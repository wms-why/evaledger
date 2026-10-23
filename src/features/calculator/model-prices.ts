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
export const REGISTRY_VERSION = '0.8.0'

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
  fetchedAt: '2026-10-23',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
      displayName: 'GPT-5.6 sol',
      family: 'gpt-5',
      status: 'active',
      contextWindow: 1_050_000,
      inputPricePer1M: 4.0,
      outputPricePer1M: 20.0,
      cachedInputPricePer1M: 0.4,
      // The note on this row documents a TIME-BOXED rate: the promo band runs
      // through 2026-11-21, the pre-promo rate ($5 / $30) is what the row
      // falls back to afterwards. Encoded here so a reader can see "this rate
      // applies until 2026-11-21" instead of parsing the prose. The second
      // band is the rate the note records — re-check it when the promo ends.
      priceWindows: [
        {
          from: '2026-10-01',
          until: '2026-11-21',
          inputPricePer1M: 4.0,
          outputPricePer1M: 20.0,
          cachedInputPricePer1M: 0.4,
          label: 'Promotional rate',
        },
        {
          from: '2026-11-22',
          inputPricePer1M: 5.0,
          outputPricePer1M: 30.0,
          label: 'Standard rate',
        },
      ],
      longContext: [{ threshold: 272_000, inputMultiplier: 2, outputMultiplier: 1.5 }],
      sourceUrl: 'https://platform.openai.com/docs/pricing',
      lastVerified: '2026-10-20',
      note: 'Promotional pricing ($4 / $20 / $0.40) is available at least through 2026-11-21; the pre-promo rate was $5 / $30. Re-check after that date.',
    },
    {
      id: 'gpt-5',
      provider: 'openai',
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      // Gemini 4 Argon — Google's flagship reasoning model. GA on 2026-10-13
      // (announcement 2026-09-29). Model id `gemini-4-argon`, one stable id,
      // no preview alias.
      //
      // The window is a SINGLE pool: 1,048,576 tokens shared across input,
      // thinking and output (there is no separate 1M-input row). Max output is
      // 65,536 per synchronous request, and up to 1,048,576 with long decode.
      //
      // Pricing (Standard tier, USD / 1M): $2 input / $10 output, cached input
      // $0.10 — introductory, through 2026-11-30. From 2026-12-01 it is
      // $4 / $20 / $0.20. Batch and Flex are half of that; Priority is 1.8×.
      //
      // NO long-context band: unlike Gemini 3.1 Pro and 2.5 Pro, Google
      // publishes no >200K row for Argon, so the price does not step up inside
      // the window. Caching is implicit-only — `cachedContents` / `caches.create`
      // are not supported, and the 95% cache-hit discount needs a prompt of at
      // least 4,096 tokens.
      id: 'gemini-4-argon',
      provider: 'google',
      channel: 'official',
      displayName: 'Gemini 4 Argon',
      family: 'gemini-4',
      status: 'active',
      contextWindow: 1_048_576,
      inputPricePer1M: 2.0,
      outputPricePer1M: 10.0,
      cachedInputPricePer1M: 0.1,
      // The note documents a dated timeline (introductory → standard) and the
      // three service tiers Google publishes next to it. Encoded here so a
      // reader sees "introductory until 2026-11-30, then $4 / $20" and "Batch
      // and Flex are half, Priority is 1.8×" instead of parsing prose.
      // The tiers are factors on the standard rate, so their absolute rate
      // follows whichever band is in force — hence no fixed numbers.
      priceWindows: [
        {
          from: '2026-10-13',
          until: '2026-11-30',
          inputPricePer1M: 2.0,
          outputPricePer1M: 10.0,
          cachedInputPricePer1M: 0.1,
          label: 'Introductory rate',
        },
        {
          from: '2026-12-01',
          inputPricePer1M: 4.0,
          outputPricePer1M: 20.0,
          cachedInputPricePer1M: 0.2,
          label: 'Standard rate',
        },
      ],
      tiers: [
        { kind: 'batch', label: 'Batch', multiplier: 0.5, note: 'Runs at half the standard rate.' },
        { kind: 'flex', label: 'Flex', multiplier: 0.5, note: 'Runs at half the standard rate.' },
        { kind: 'priority', label: 'Priority', multiplier: 1.8, note: 'Costs 1.8× the standard rate.' },
      ],
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      lastVerified: '2026-10-20',
      introduced: '2026-10-13',
      note: 'Introductory pricing: $2 / $10 / $0.10 through 2026-11-30, then $4 / $20 / $0.20 from 2026-12-01. Implicit caching only — explicit caching is not supported. Batch and Flex run at half the standard rate; Priority is 1.8×.',
    },
    {
      id: 'gemini-3.1-pro-preview',
      provider: 'google',
      channel: 'official',
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
      channel: 'official',
      displayName: 'Gemini 3.8 Flash',
      family: 'gemini-3',
      status: 'active',
      contextWindow: 1_000_000,
      inputPricePer1M: 0.75,
      outputPricePer1M: 3.75,
      cachedInputPricePer1M: 0.075,
      // The note documents a dated timeline (introductory → standard). Encoded
      // here so the rate on screen says when it changes instead of leaving
      // the reader to parse the prose.
      priceWindows: [
        {
          from: '2026-10-01',
          until: '2026-12-31',
          inputPricePer1M: 0.75,
          outputPricePer1M: 3.75,
          cachedInputPricePer1M: 0.075,
          label: 'Introductory rate',
        },
        {
          from: '2027-01-01',
          inputPricePer1M: 1.5,
          outputPricePer1M: 7.5,
          cachedInputPricePer1M: 0.15,
          label: 'Standard rate',
        },
      ],
      sourceUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
      lastVerified: '2026-10-20',
      note: 'Introductory pricing: $0.75 / $3.75 / $0.075 through 2026-12-31, then $1.50 / $7.50 / $0.15 from 2027-01-01.',
    },
    {
      id: 'gemini-3.1-flash-lite',
      provider: 'google',
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
    // ── Two checkpoints, two rows — never merged ──────────────────────
    // DeepSeek ships V4.1-Flash as rolling checkpoints under one API model
    // name (`deepseek-flash`). Two of them are on the record and they are
    // priced identically, but they are NOT the same thing:
    //   - 0910 — the launch checkpoint (2026-09-10), the one the launch
    //     announcement's 19-benchmark reference table was measured on.
    //   - 1017 — the current checkpoint (2026-10-17), served under the name
    //     `deepseek-flash`; the legacy aliases `deepseek-v4-flash` and
    //     `deepseek-v4-flash-vision-exp` are routed to it and billed at the
    //     Flash price. Its own announcement publishes a different score set.
    // A single merged row would blur "what the API serves today" with "what
    // the launch table measured" — so they stay separate rows, and the
    // 0910 row keeps the price history alive for long-tail search.
    {
      id: 'deepseek-flash',
      provider: 'deepseek',
      channel: 'official',
      displayName: 'DeepSeek V4.1-Flash 1017',
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
      introduced: '2026-10-17',
      supersedes: 'deepseek-flash-0910',
      note: 'Checkpoint DeepSeek-V4.1-Flash-1017 (released 2026-10-17), served under the API model name `deepseek-flash`; open weights on Hugging Face / ModelScope. The 2026-09-10 launch price is unchanged. The launch checkpoint is kept as its own row (deepseek-flash-0910).',
    },
    {
      id: 'deepseek-flash-0910',
      provider: 'deepseek',
      channel: 'official',
      displayName: 'DeepSeek V4.1-Flash 0910',
      family: 'deepseek-v4',
      status: 'delisted',
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
      introduced: '2026-09-10',
      retiredAt: '2026-10-17',
      note: 'Launch checkpoint of 2026-09-10 — the one the launch announcement\'s reference table was measured on. Superseded by the 1017 checkpoint on 2026-10-17; the API no longer serves it (`deepseek-flash` now routes to 1017). Rates are identical to the live checkpoint; kept for long-tail search and for the launch post\'s score table.',
    },
    {
      id: 'deepseek-v4-pro',
      provider: 'deepseek',
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
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
      channel: 'official',
      displayName: 'MiniMax M3.1 Flash',
      family: 'minimax-m3',
      status: 'active',
      // MiniMax documents 1M as TOTAL input + output, not input alone.
      contextWindow: 1_000_000,
      inputPricePer1M: 0.15,
      outputPricePer1M: 0.6,
      cachedInputPricePer1M: 0.015,
      // The note states there is no second lane for this model: flat rate, no
      // long-context tier, and no service_tier=priority (unlike M3). Recorded
      // as a `standard` tier so a reader can see that the single rate is the
      // whole rate, instead of wondering whether a tier is missing.
      tiers: [
        {
          kind: 'standard',
          label: 'Flat rate',
          inputPricePer1M: 0.15,
          outputPricePer1M: 0.6,
          cachedInputPricePer1M: 0.015,
          note: 'Flat rate — no long-context tier, and unlike M3 it does not accept service_tier=priority.',
        },
      ],
      sourceUrl: 'https://platform.minimax.io/docs/pricing/overview',
      lastVerified: '2026-10-20',
      note: 'Released 2026-10-19; $0.15 / $0.60 / $0.015 (¥1 / ¥4 / ¥0.1). Flat rate — no long-context tier, and unlike M3 it does not accept service_tier=priority.',
    },
    {
      id: 'minimax-m3',
      provider: 'minimax',
      channel: 'official',
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
      // The note names the two lanes MiniMax publishes for this model: the
      // service_tier=priority lane (1.5×, with its own absolute rates) and
      // the ≥512k doubling, whose cache-hit rate the note spells out ($0.12).
      tiers: [
        {
          kind: 'priority',
          label: 'Priority',
          inputPricePer1M: 0.45,
          outputPricePer1M: 1.8,
          cachedInputPricePer1M: 0.09,
          multiplier: 1.5,
          note: 'service_tier=priority costs 1.5× ($0.45 / $1.80 / $0.09).',
        },
        {
          kind: 'long-context',
          label: 'Long context ≥512k',
          inputPricePer1M: 0.6,
          outputPricePer1M: 2.4,
          cachedInputPricePer1M: 0.12,
          multiplier: 2,
          note: 'Above 512k of input every meter doubles; the cached-input rate doubles to $0.12.',
        },
      ],
      sourceUrl: 'https://platform.minimax.io/docs/pricing/overview',
      lastVerified: '2026-10-20',
      note: 'Released 2026-06-01. service_tier=priority costs 1.5× ($0.45 / $1.80 / $0.09). No separate cache-write charge. The cached-input rate above 512k doubles to $0.12; cost.ts applies the input multiplier to the cached rate as well.',
    },

    // ──────────────────────── 阶跃星辰 StepFun ────────────────────────
    // StepFun prices in CNY on the Chinese console and in USD on the English
    // one; the row below is the USD list. Step 5 Preview is the family's
    // first flagship — there is no earlier Step-5 row to supersede.
    // Verified 2026-10-23 against platform.stepfun.ai (English pricing page).
    {
      id: 'step-5-preview',
      provider: 'stepfun',
      channel: 'official',
      displayName: 'Step 5 Preview',
      family: 'step-5',
      status: 'active',
      // 1M input / 64k output — the window is input-only, so the context
      // column reads 1,000,000 and the output cap lives in the note.
      contextWindow: 1_000_000,
      inputPricePer1M: 1.0,
      outputPricePer1M: 2.7,
      cachedInputPricePer1M: 0.1,
      sourceUrl: 'https://platform.stepfun.ai/docs/en/guides/pricing/details',
      lastVerified: '2026-10-23',
      note: 'Preview release (2026-09-20); open weights followed on 2026-10-15. Cache-miss input includes writing to the cache; output tokens include the reasoning trace.',
    },

    // ───────────────────────── Grok ─────────────────────────
    {
      id: 'grok-4.7',
      provider: 'grok',
      channel: 'official',
      displayName: 'Grok 4.7',
      family: 'grok-4',
      status: 'active',
      contextWindow: 500_000,
      inputPricePer1M: 2.0,
      outputPricePer1M: 6.0,
      cachedInputPricePer1M: 0.5,
      // xAI's pricing table: short context $2 / $0.50 / $6; long context
      // (≥200K prompt tokens) $4 / $1 / $12 for the whole request.
      longContext: [{ threshold: 200_000, inputMultiplier: 2, outputMultiplier: 2 }],
      sourceUrl: 'https://docs.x.ai/docs/pricing',
      lastVerified: '2026-10-20',
    },
    {
      id: 'grok-4',
      provider: 'grok',
      channel: 'official',
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

/**
 * Every distinct label the dated price bands use ("Promotional rate",
 * "Introductory rate", "Standard rate").
 *
 * The labels are the registry's English source of truth; the Chinese names
 * live in `model-notes.ts`. Surfaces that have to recognise a band by its
 * label (the pricing-rule translator) read the set from here.
 */
export function priceWindowLabels(): string[] {
  const labels = new Set<string>()
  for (const model of REGISTRY.models) {
    for (const band of model.priceWindows ?? []) labels.add(band.label)
  }
  return [...labels]
}