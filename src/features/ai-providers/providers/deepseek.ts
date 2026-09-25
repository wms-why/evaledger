/**
 * DeepSeek provider adapter — OpenAI-compatible chat-completions.
 *
 *   POST https://api.deepseek.com/chat/completions
 *   Authorization: Bearer <key>
 *
 * Notable:
 *   - Default model is `deepseek-chat`; `deepseek-reasoner` for reasoning mode.
 *   - 402 == "Insufficient Balance" — the canonical out-of-funds signal.
 *   - Balance probe: `GET /user/balance` → `{is_available, balance_infos[]}`.
 *     `is_available = false` AND balance zero → treat as out-of-funds.
 */
import type { ProviderAdapter, AdapterCtx, AdapterRunResult, BalanceSnapshot } from './types'
import { AdapterError } from './types'
import type { ChatMessage, RunOptions, FailureKind } from '../ai-providers.shared'

const DEFAULT_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_MAX_TOKENS = 4096

interface DeepSeekRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  stop?: string[]
  stream?: false
}

interface DeepSeekResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: Array<{
    index: number
    message: { role: 'assistant'; content: string }
    finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'insufficient_system_resource'
  }>
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

interface DeepSeekBalanceResponse {
  is_available: boolean
  balance_infos: Array<{
    currency: string
    total_balance: string
    granted_balance: string
    topped_up_balance: string
  }>
}

function classifyStatus(status: number): FailureKind {
  if (status === 402) return 'out-of-funds'
  if (status === 400 || status === 401 || status === 403 || status === 404 || status === 422) return 'fatal'
  if (status === 408 || status === 413 || status === 429) return 'transient'
  if (status >= 500 && status < 600) return 'transient'
  if (status >= 400 && status < 500) return 'fatal'
  return 'transient'
}

export class DeepSeekAdapter implements ProviderAdapter {
  readonly kind = 'deepseek' as const

  async run(messages: ChatMessage[], opts: RunOptions, ctx: AdapterCtx): Promise<AdapterRunResult> {
    const body: DeepSeekRequest = {
      model: ctx.model,
      messages,
    }
    if (opts.temperature !== undefined) body.temperature = opts.temperature
    if (opts.maxTokens !== undefined) body.max_tokens = opts.maxTokens
    else body.max_tokens = DEFAULT_MAX_TOKENS
    if (opts.stop && opts.stop.length) body.stop = opts.stop
    body.stream = false

    const res = await ctx.fetch(`${ctx.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: ctx.signal,
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new AdapterError(`deepseek HTTP ${res.status}: ${errBody.slice(0, 200)}`, classifyStatus(res.status), res.status)
    }

    const json = (await res.json()) as DeepSeekResponse
    const text = json.choices?.[0]?.message?.content
    if (typeof text !== 'string' || text.length === 0) {
      throw new AdapterError('deepseek returned no text', 'fatal', res.status, json)
    }
    return { text: text.trim(), raw: json }
  }

  async checkHealth(ctx: AdapterCtx): Promise<{ ok: boolean; detail?: string }> {
    try {
      // Hit /chat/completions with 0 max_tokens to provoke a deterministic 400.
      // Treat any auth-or-network response as "reachable".
      const res = await ctx.fetch(`${ctx.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.apiKey}` },
        body: JSON.stringify({ model: ctx.model, messages: [], max_tokens: 0 }),
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok || res.status === 400) return { ok: true }
      return { ok: false, detail: `HTTP ${res.status}` }
    } catch (err) {
      return { ok: false, detail: (err as Error).message ?? 'unknown' }
    }
  }

  async checkBalance(ctx: AdapterCtx): Promise<BalanceSnapshot> {
    try {
      const res = await ctx.fetch(`${ctx.baseUrl.replace(/\/$/, '')}/user/balance`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${ctx.apiKey}` },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) {
        return { ok: false, detail: `HTTP ${res.status}` }
      }
      const json = (await res.json()) as DeepSeekBalanceResponse
      if (!json.balance_infos.length) {
        return { ok: true, detail: 'no balance info' }
      }
      const totalStr = json.balance_infos[0].total_balance
      const remaining = Number(totalStr)
      if (!json.is_available || (Number.isFinite(remaining) && remaining <= 0)) {
        return { ok: false, remaining: totalStr, detail: 'is_available=false or empty' }
      }
      return { ok: true, remaining: totalStr, currency: json.balance_infos[0].currency, raw: json }
    } catch (err) {
      return { ok: false, detail: (err as Error).message ?? 'unknown' }
    }
  }
}

export const DEEPSEEK_DEFAULT_BASE_URL = DEFAULT_BASE_URL
