import type { Series, SeriesTier } from './types'

/** The series tiers in the order they read from top of the line to bottom. */
export const SERIES_TIER_ORDER: SeriesTier[] = ['flagship', 'balanced', 'fast', 'lite']

/**
 * The curated series registry.
 *
 * A *series* is one vendor product line — every version of it we track, newest
 * first. It is the third comparison surface on this site:
 *
 *   - `/leaderboard`   → models across vendors, one row each
 *   - `/compare/$pair` → two hand-picked models, usually from different vendors
 *   - `/series/$slug`  → every version of ONE line, side by side
 *
 * The third one answers the question the other two cannot: *"the line just
 * shipped a new version — is the old one still worth using, and what changed?"*
 *
 * ## Why this list is curated and not derived
 *
 * `REGISTRY.models[].family` is too coarse to be a series: `gpt-5` holds the
 * GPT-5 generation (5 / 5-mini / 5-nano) *and* the 5.6 generation (sol /
 * cyber), and `gemini-3` holds three tiers of one generation. Only a human
 * knows which checkpoint succeeded which and where a tier sits in the line —
 * so the membership and the order are written down here, and the guard test
 * (`__tests__/series.node.test.ts`) holds them to the registries:
 *
 *   - every member must exist in REGISTRY (price) and/or LEADERBOARD (scores);
 *   - every member's price row must carry the series' family;
 *   - versions must run newest-first (numeric segments never increase);
 *   - every REGISTRY model of a family must be listed here, or the family must
 *     be listed in {@link FAMILY_EXCLUSIONS} with a reason.
 *
 * A new version therefore costs one line here — the same "data moves as one"
 * discipline the release series already follows.
 */

/**
 * Families deliberately NOT turned into a series, with the reason.
 *
 * A family with a single member needs no explanation: it is not a series.
 * Everything listed here has two or more members and is still excluded on
 * purpose — the reason is part of the record, not a shrug.
 */
export const FAMILY_EXCLUSIONS: Record<string, string> = {
  'gpt-4':
    'The GPT-4.1 generation is fully superseded and its prices are stale; it would only be a second copy of the GPT-5 ladder.',
  'o-series':
    'The reasoning line is not one product line: o1-pro, o3 and o3-mini differ in tier and generation at once, so a single ladder would read as a version history it is not.',
}

/**
 * The series, newest member first.
 *
 * Member fields:
 *  - `key`     — short, unique inside the series, used in pair URLs.
 *  - `version` — the numeric generation ("5.5", "3.1", "4.1"). Read as a
 *                dotted number, never as a date.
 *  - `tier`    — where the member sits in the vendor's line.
 *
 * Ordering rule (the guard test enforces both halves):
 *  - **version, newest first** — compared segment by segment, numerically
 *    ("5.5" > "5" > "4.8"); equal versions are allowed (same generation,
 *    different tier);
 *  - **inside one version, by tier** — flagship → balanced → fast → lite
 *    (`SERIES_TIER_ORDER`). Two members may share a tier (two flagships of
 *    one generation); the tier may never move up the ladder.
 */
export const SERIES: Series[] = [
  {
    slug: 'claude-opus',
    name: 'Claude Opus',
    family: 'claude-opus',
    vendor: 'claude',
    members: [
      { key: 'opus-5.5', version: '5.5', tier: 'flagship', priceId: 'claude-opus-5.5', scoreId: 'claude-opus-5.5' },
      { key: 'opus-5', version: '5', tier: 'flagship', priceId: 'claude-opus-5', scoreId: 'claude-opus-5' },
      { key: 'opus-4.8', version: '4.8', tier: 'flagship', priceId: 'claude-opus-4.8' },
      { key: 'opus-4.7', version: '4.7', tier: 'flagship', priceId: 'claude-opus-4.7' },
      { key: 'opus-4.6', version: '4.6', tier: 'flagship', priceId: 'claude-opus-4.6' },
      { key: 'opus-4.5', version: '4.5', tier: 'flagship', priceId: 'claude-opus-4.5' },
    ],
  },
  {
    slug: 'claude-sonnet',
    name: 'Claude Sonnet',
    family: 'claude-sonnet',
    vendor: 'claude',
    members: [
      { key: 'sonnet-5', version: '5', tier: 'flagship', priceId: 'claude-sonnet-5' },
      { key: 'sonnet-4.6', version: '4.6', tier: 'flagship', priceId: 'claude-sonnet-4.6' },
      { key: 'sonnet-4.5', version: '4.5', tier: 'flagship', priceId: 'claude-sonnet-4.5' },
    ],
  },
  {
    slug: 'claude-fable',
    name: 'Claude Fable',
    family: 'claude-fable',
    vendor: 'claude',
    members: [
      { key: 'fable-5.1', version: '5.1', tier: 'flagship', priceId: 'claude-fable-5.1', scoreId: 'claude-fable-5.1' },
      { key: 'fable-5', version: '5', tier: 'flagship', priceId: 'claude-fable-5' },
    ],
  },
  {
    slug: 'kimi-k3',
    name: 'Kimi K3',
    family: 'kimi-k3',
    vendor: 'kimi',
    members: [
      // K3.1 Pro and its Highspeed twin are the same weights at two speeds:
      // the twin carries a price row, not a score row of its own.
      { key: 'k3.1-pro', version: '3.1', tier: 'flagship', priceId: 'kimi-k3.1-pro', scoreId: 'kimi-k3.1-pro' },
      { key: 'k3.1-pro-highspeed', version: '3.1', tier: 'fast', priceId: 'kimi-k3.1-pro-highspeed' },
      // K3 is still sold and still priced — cheaper per token is not the same
      // as better, so the line reads as two versions, not a replacement.
      { key: 'k3', version: '3', tier: 'flagship', priceId: 'kimi-k3', scoreId: 'kimi-k3' },
    ],
  },
  {
    slug: 'gpt-6',
    name: 'GPT-6',
    family: 'gpt-6',
    vendor: 'openai',
    members: [
      // GPT-6.1 Terra is the newest version of the line, and the throughput
      // tier of it: half of Sol's price per token and the tier OpenAI sold
      // the launch around — speed and cost, not the top of the line.
      { key: 'terra', version: '6.1', tier: 'fast', priceId: 'gpt-6.1-terra', scoreId: 'gpt-6.1-terra' },
      { key: 'astra', version: '6', tier: 'flagship', priceId: 'gpt-6-astra', scoreId: 'gpt-6-astra' },
      { key: 'sol', version: '6', tier: 'balanced', priceId: 'gpt-6-sol' },
      { key: 'luna', version: '6', tier: 'lite', priceId: 'gpt-6-luna' },
    ],
  },
  {
    slug: 'gpt-5',
    name: 'GPT-5',
    family: 'gpt-5',
    vendor: 'openai',
    members: [
      { key: 'gpt-5.6-cyber', version: '5.6', tier: 'flagship', priceId: 'gpt-5.6-cyber' },
      { key: 'gpt-5.6-sol', version: '5.6', tier: 'flagship', priceId: 'gpt-5.6-sol', scoreId: 'gpt-5.6-sol' },
      { key: 'gpt-5', version: '5', tier: 'flagship', priceId: 'gpt-5' },
      { key: 'gpt-5-mini', version: '5', tier: 'fast', priceId: 'gpt-5-mini' },
      { key: 'gpt-5-nano', version: '5', tier: 'lite', priceId: 'gpt-5-nano' },
    ],
  },
  {
    slug: 'gemini-3',
    name: 'Gemini 3',
    family: 'gemini-3',
    vendor: 'google',
    members: [
      { key: 'flash', version: '3.8', tier: 'fast', priceId: 'gemini-3.8-flash' },
      { key: 'pro', version: '3.1', tier: 'flagship', priceId: 'gemini-3.1-pro-preview', scoreId: 'gemini-3.1-pro' },
      { key: 'flash-lite', version: '3.1', tier: 'lite', priceId: 'gemini-3.1-flash-lite' },
    ],
  },
  {
    slug: 'gemini-2-5',
    name: 'Gemini 2.5',
    family: 'gemini-2.5',
    vendor: 'google',
    members: [
      { key: 'pro', version: '2.5', tier: 'flagship', priceId: 'gemini-2.5-pro' },
      { key: 'flash', version: '2.5', tier: 'fast', priceId: 'gemini-2.5-flash' },
      { key: 'flash-lite', version: '2.5', tier: 'lite', priceId: 'gemini-2.5-flash-lite' },
    ],
  },
  {
    slug: 'deepseek-v4',
    name: 'DeepSeek V4',
    family: 'deepseek-v4',
    vendor: 'deepseek',
    members: [
      // The 1017 checkpoint is what the API serves today; the 0910 launch
      // checkpoint is retired but keeps its price and its 19 launch scores.
      // Each member points at ITS OWN score row — the two checkpoints are
      // separate records, never one row.
      { key: 'v4.1-flash-1017', version: '4.1', tier: 'fast', priceId: 'deepseek-flash', scoreId: 'deepseek-v4.1-flash-1017' },
      { key: 'v4.1-flash-0910', version: '4.1', tier: 'fast', priceId: 'deepseek-flash-0910', scoreId: 'deepseek-v4.1-flash', status: 'delisted' },
      { key: 'v4-pro', version: '4', tier: 'flagship', priceId: 'deepseek-v4-pro', scoreId: 'deepseek-v4-pro' },
      {
        key: 'v4-flash-0731',
        version: '4',
        tier: 'fast',
        // The checkpoint kept its score history; its price row was retired.
        scoreId: 'deepseek-v4-flash-0731',
        status: 'delisted',
      },
    ],
  },
  {
    slug: 'minimax-m3',
    name: 'MiniMax M3',
    family: 'minimax-m3',
    vendor: 'minimax',
    members: [
      { key: 'm3.1-flash', version: '3.1', tier: 'fast', priceId: 'minimax-m3.1-flash', scoreId: 'minimax-m3.1-flash' },
      { key: 'm3', version: '3', tier: 'flagship', priceId: 'minimax-m3', scoreId: 'minimax-m3' },
    ],
  },
  {
    slug: 'grok-4',
    name: 'Grok 4',
    family: 'grok-4',
    vendor: 'grok',
    members: [
      { key: 'grok-4.7', version: '4.7', tier: 'flagship', priceId: 'grok-4.7', scoreId: 'grok-4.7' },
      { key: 'grok-4', version: '4', tier: 'flagship', priceId: 'grok-4' },
    ],
  },
]
