/**
 * Hand-maintained mapping from the model name as it appears on each provider's
 * pricing page (e.g. "Opus 5.5") to the REGISTRY id (e.g.
 * `claude-opus-5.5`). Keys are the exact strings the scraper is expected to
 * extract; values MUST match an `id` in `REGISTRY.models` (enforced by the
 * mapping unit test).
 *
 * When a scraper returns a name not present here, the join falls through with
 * `modelId: null` so a human can decide what to do — no exception, no crash.
 *
 * Multiple keys may point to the same id: the provider page sometimes lists a
 * model under different display strings (e.g. legacy vs. active section).
 */
export const DISPLAY_NAME_TO_ID: Record<string, string> = {
  // ───────────────────────── OpenAI ─────────────────────────
  'gpt-6-astra': 'gpt-6-astra',
  'gpt-6-sol': 'gpt-6-sol',
  'gpt-6-luna': 'gpt-6-luna',
  'gpt-5.6-cyber': 'gpt-5.6-cyber',
  'gpt-5.6-sol': 'gpt-5.6-sol',
  'GPT-5': 'gpt-5',
  'GPT-5 mini': 'gpt-5-mini',
  'GPT-5 nano': 'gpt-5-nano',
  'GPT-4.1': 'gpt-4.1',
  'GPT-4.1 mini': 'gpt-4.1-mini',
  'o3': 'o3',
  'o3-mini': 'o3-mini',
  'o1-pro': 'o1-pro',

  // ───────────────────────── Anthropic ─────────────────────────
  // Newest flagship + legacy names (page drops the "Claude" prefix in cards).
  'Fable 5.1': 'claude-fable-5.1',
  'Opus 5.5': 'claude-opus-5.5',
  'Sonnet 5': 'claude-sonnet-5',
  'Haiku 4.5': 'claude-haiku-4.5',
  'Opus 4.5': 'claude-opus-4.5',
  'Opus 4.6': 'claude-opus-4.6',
  'Opus 4.7': 'claude-opus-4.7',
  'Opus 4.8': 'claude-opus-4.8',
  'Opus 5': 'claude-opus-5',
  'Sonnet 4.5': 'claude-sonnet-4.5',
  'Sonnet 4.6': 'claude-sonnet-4.6',
  'Fable 5': 'claude-fable-5',
  // Original REGISTRY displayNames (kept for backward compatibility).
  'Claude Opus 4.5': 'claude-opus-4.5',
  'Claude Sonnet 4.5': 'claude-sonnet-4.5',
  'Claude Haiku 4.5': 'claude-haiku-4.5',

  // ───────────────────────── Google ─────────────────────────
  'Gemini 4 Argon': 'gemini-4-argon',
  'Gemini 3.1 Pro Preview': 'gemini-3.1-pro-preview',
  'Gemini 3.8 Flash': 'gemini-3.8-flash',
  'Gemini 3.1 Flash-Lite': 'gemini-3.1-flash-lite',
  'Gemini 2.5 Flash-Lite': 'gemini-2.5-flash-lite',
  'Gemini 2.5 Pro': 'gemini-2.5-pro',
  'Gemini 2.5 Flash': 'gemini-2.5-flash',

  // ───────────────────────── DeepSeek ─────────────────────────
  'deepseek-flash': 'deepseek-flash',
  'deepseek-v4-pro': 'deepseek-v4-pro',
  'DeepSeek V3.2': 'deepseek-chat',
  'DeepSeek R1': 'deepseek-reasoner',

  // ───────────────────────── MiniMax ─────────────────────────
  // Pricing page labels; the M3 rows carry a "≤ 512k input tokens" suffix that
  // the scraper strips before the join (the >512k row is a long-context tier
  // and stays human-only).
  'MiniMax-M3.1-Flash': 'minimax-m3.1-flash',
  'MiniMax-M3': 'minimax-m3',

  // ───────────────────────── Moonshot Kimi ─────────────────────────
  // The Kimi pricing page lists the API ids themselves, so the scraped name
  // and the REGISTRY id are the same string.
  'kimi-k3.1-pro': 'kimi-k3.1-pro',
  'kimi-k3.1-pro-highspeed': 'kimi-k3.1-pro-highspeed',
  'kimi-k3': 'kimi-k3',

  // ───────────────────────── Grok ─────────────────────────
  'Grok 4.7': 'grok-4.7',
  'Grok 4': 'grok-4',
}

/** Look up the REGISTRY id for a scraped name. Returns null if unmapped. */
export function resolveModelId(scrapedName: string): string | null {
  return DISPLAY_NAME_TO_ID[scrapedName] ?? null
}