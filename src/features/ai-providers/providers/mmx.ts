/**
 * mmx provider adapter — Anthropic-Messages-API shape (per the mmx-cli SDK at
 * `/anthropic/v1/messages`). Differs from OpenAI-style providers in three
 * ways that callers must respect:
 *   1. Auth: `x-api-key: <secret>` header (NOT Bearer).
 *   2. `system` is a top-level field, not a `{role:'system'}` message.
 *      `splitMessages()` extracts it.
 *   3. `content` is an array of typed blocks (`text` / `thinking` / `tool_use` / …);
 *      we only consume `text` blocks.
 *
 * Tested against the convention observed in
 * `/Users/ymk/.local/share/.../mmx-cli/dist/sdk.mjs` line 689 (`chatEndpoint`)
 * and the `authStyle: 'x-api-key'` branch at line 532.
 */
import type { ProviderAdapter, AdapterCtx, AdapterRunResult, BalanceSnapshot } from './types'
import { AdapterError } from './types'
import type { ChatMessage, RunOptions, FailureKind } from '../ai-providers.shared'

const DEFAULT_BASE_URL = 'https://api.minimaxi.com' // mmx CN default
const ANTHROPIC_VERSION = '2023-06-01'
const DEFAULT_MAX_TOKENS = 4096

interface AnthropicRequest {
  model: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  system?: string
  max_tokens: number
  temperature?: number
  top_p?: number
  stop_sequences?: string[]
}

interface AnthropicResponse {
  id: string
  type: 'message'
  role: 'assistant'
  content: Array<{ type: 'text'; text: string } | { type: 'thinking'; thinking: string } | { type: 'tool_use'; id: string; name: string; input: unknown }>
  model: string
  stop_reason: string
  usage: { input_tokens: number; output_tokens: number }
}

interface AnthropicErrorBody {
  error?: { type?: string; message?: string; code?: string | number }
  base_resp?: { status_code?: number; status_msg?: string }
}

/** mmx Anthropic-Messages shape carries `system` as a top-level string, not as a message. */
function splitMessages(messages: ChatMessage[]): { system?: string; rest: AnthropicRequest['messages'] } {
  let system: string | undefined
  const rest: AnthropicRequest['messages'] = []
  for (const m of messages) {
    if (m.role === 'system' && system === undefined) {
      system = m.content
    } else if (m.role === 'user' || m.role === 'assistant') {
      rest.push({ role: m.role, content: m.content })
    }
    // Multiple or post-leading `system` messages get dropped to single system — this matches
    // Anthropic's API which only allows one. The selector/Architect call shape is
    // `[system, user]`, so this only matters for unusual caller patterns.
  }
  return { system, rest }
}

function classifyStatus(status: number): FailureKind {
  if (status === 401 || status === 403) return 'fatal'
  if (status === 402) return 'out-of-funds'
  if (status === 408 || status === 413 || status === 429) return 'transient'
  if (status >= 500 && status < 600) return 'transient'
  if (status >= 400 && status < 500) return 'fatal'
  return 'transient'
}

function extractText(resp: AnthropicResponse): string {
  return resp.content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

function parseErrorBody(raw: string): string {
  try {
    const body = JSON.parse(raw) as AnthropicErrorBody
    return body.error?.message ?? body.base_resp?.status_msg ?? raw
  } catch {
    return raw
  }
}

export class MmxAdapter implements ProviderAdapter {
  readonly kind = 'mmx' as const

  async run(messages: ChatMessage[], opts: RunOptions, ctx: AdapterCtx): Promise<AdapterRunResult> {
    const { system, rest } = splitMessages(messages)
    const body: AnthropicRequest = {
      model: ctx.model,
      messages: rest,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    }
    if (system !== undefined) body.system = system
    if (opts.temperature !== undefined) body.temperature = opts.temperature
    if (opts.stop && opts.stop.length) body.stop_sequences = opts.stop

    const res = await ctx.fetch(`${ctx.baseUrl.replace(/\/$/, '')}/anthropic/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ctx.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
      signal: ctx.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new AdapterError(`mmx HTTP ${res.status}: ${parseErrorBody(text)}`, classifyStatus(res.status), res.status)
    }
    const json = (await res.json()) as AnthropicResponse
    const text = extractText(json)
    if (!text) throw new AdapterError('mmx returned no text', 'fatal', res.status, json)
    return { text: text.trim(), raw: json }
  }

  async checkHealth(ctx: AdapterCtx): Promise<{ ok: boolean; detail?: string }> {
    try {
      // Hit /anthropic/v1/messages with empty messages — Anthropic rejects with 400 but
      // we get a real TLS + auth round-trip. Treat any response (status != 0/net error)
      // as reachable; bills aren't charged for a bad request.
      const res = await ctx.fetch(`${ctx.baseUrl.replace(/\/$/, '')}/anthropic/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ctx.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({ model: ctx.model, messages: [], max_tokens: 1 }),
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok || res.status === 400) return { ok: true }
      return { ok: false, detail: `HTTP ${res.status}` }
    } catch (err) {
      return { ok: false, detail: (err as Error).message ?? 'unknown' }
    }
  }

  async checkBalance(_ctx: AdapterCtx): Promise<BalanceSnapshot> {
    // mmx has no public HTTP balance endpoint as of the mmx-cli skill audit.
    // The CLI exposes balance via `mmx quota show`; the HTTP surface is undoc'd.
    // Stub so the admin UI's "Test connection" still renders something useful.
    return { ok: true, detail: 'not available (mmx has no HTTP balance endpoint)' }
  }
}

export const MMX_DEFAULT_BASE_URL = DEFAULT_BASE_URL
