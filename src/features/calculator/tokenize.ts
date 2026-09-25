/**
 * Token counting for the calculator.
 *
 * Strategy:
 *  - OpenAI-family (gpt-5 / gpt-4 / o-series): real `gpt-tokenizer` (cl100k_base
 *    for older families, o200k_base for gpt-5 family).
 *  - All others (Anthropic / Google / DeepSeek / Grok / OpenRouter): character
 *    approximation. Anthropic and Google publish ~3.5–4 chars-per-token
 *    averages; we use a CJK-aware heuristic so the result is closer to truth
 *    than the naive 4-chars-per-token fallback used by every other calculator.
 *
 * The approximation is clearly labelled on the UI ("approximate, exact via
 * provider's tokenizer"). Real tokenization is only available for OpenAI;
 * getting Anthropic / Google to spec would require shipping their WASM
 * tokenizers (megabytes) which we accept on the follow-up.
 */

export type TokenizerFamily =
  | 'gpt-5'        // o200k_base
  | 'gpt-4'        // cl100k_base
  | 'o-series'     // cl100k_base (o1 / o3 / o4)
  | 'claude-opus'  // approximation
  | 'claude-sonnet'
  | 'claude-haiku'
  | 'gemini-2.5'   // approximation
  | 'grok-4'       // approximation
  | 'deepseek-v3'  // approximation
  | 'deepseek-r1'

export interface TokenCount {
  /** Token count (real for OpenAI-family, approximate otherwise). */
  tokens: number
  characters: number
  /** Whitespace-split word count (informational). */
  words: number
  /** Which tokenizer family produced this result. */
  family: TokenizerFamily
  /** True if the result is from a real tokenizer (OpenAI). False = approximate. */
  exact: boolean
}

/**
 * Lazy loader — never bundle gpt-tokenizer in the SSR/Worker bundle; only
 * pull it on the client when actually needed.
 *
 * Returns `null` if gpt-tokenizer is unavailable (e.g. server-side).
 */
type Encoder = (text: string) => number[]
let _encoderCache: Partial<Record<'cl100k_base' | 'o200k_base', Encoder>> = {}

async function loadEncoder(rank: 'cl100k_base' | 'o200k_base'): Promise<Encoder | null> {
  if (typeof window === 'undefined') return null
  if (_encoderCache[rank]) return _encoderCache[rank]!
  try {
    // Dynamic import keeps gpt-tokenizer out of the SSR/Workers bundle.
    const { encode } = await import('gpt-tokenizer/encoding/' + rank)
    _encoderCache[rank] = encode
    return encode
  } catch {
    return null
  }
}

function rankForFamily(family: TokenizerFamily): 'cl100k_base' | 'o200k_base' | null {
  if (family === 'gpt-5') return 'o200k_base'
  if (family === 'gpt-4' || family === 'o-series') return 'cl100k_base'
  return null
}

function countChars(text: string): number {
  // Use Unicode codepoint count, not UTF-16 code units — closer to what
  // providers actually bill on for non-ASCII content.
  let n = 0
  for (const _ of text) n += 1
  return n
}

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/**
 * Approximate token count for non-OpenAI families.
 *
 * Heuristic:
 *  - Each CJK character ≈ 1 token (Anthropic / Gemini both cluster to this).
 *  - Each non-CJK ASCII char ≈ 0.25 tokens (i.e. ~4 chars/token, the
 *    industry average for English).
 *  - Whitespace runs of > 1 char get a small discount.
 */
function approximateTokens(text: string): number {
  let tokens = 0
  let run = 0
  for (const ch of text) {
    const cp = ch.codePointAt(0)!
    const isCjk =
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0x3040 && cp <= 0x30ff) ||
      (cp >= 0xac00 && cp <= 0xd7af)
    if (isCjk) {
      if (run > 0) tokens += Math.max(1, Math.round(run / 4))
      run = 0
      tokens += 1
    } else if (/\s/.test(ch)) {
      run += 1
    } else {
      if (run > 0) tokens += Math.max(1, Math.round(run / 4))
      run = 0
      tokens += 0.25
    }
  }
  if (run > 0) tokens += Math.max(1, Math.round(run / 4))
  return Math.max(1, Math.round(tokens))
}

/**
 * Count tokens for `text` using the tokenizer matching `family`.
 *
 * Returns an approximate count if the requested tokenizer is unavailable
 * (SSR, OpenAI-family before gpt-tokenizer loads, or any non-OpenAI family).
 * The `exact` flag on the result tells the UI which path produced it.
 */
export async function countTokens(text: string, family: TokenizerFamily): Promise<TokenCount> {
  const characters = countChars(text)
  const words = countWords(text)

  const rank = rankForFamily(family)
  if (rank) {
    const encoder = await loadEncoder(rank)
    if (encoder) {
      const ids = encoder(text)
      return { tokens: ids.length, characters, words, family, exact: true }
    }
  }

  return { tokens: approximateTokens(text), characters, words, family, exact: false }
}

/**
 * Synchronous version — uses approximation only. Suitable for SSR / tests.
 */
export function countTokensSync(text: string, family: TokenizerFamily): TokenCount {
  const characters = countChars(text)
  const words = countWords(text)
  return { tokens: approximateTokens(text), characters, words, family, exact: false }
}