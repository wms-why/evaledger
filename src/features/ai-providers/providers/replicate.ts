/**
 * Replicate provider adapter — async predictions model.
 *
 *   POST /v1/predictions      → {id, status:'starting'|'processing', ...}
 *   GET  /v1/predictions/{id} → poll until status ∈ {succeeded, failed, canceled}
 *
 * LLM invocation shape: `{version, input:{prompt, system_prompt, max_tokens,
 * temperature, top_p}}`. Output for `meta/meta-llama-3-70b-instruct` (and
 * most text-tuned Replicate models) is a single string.
 *
 * Out-of-funds detection: prediction status `'failed'` AND `error` text
 * contains "credit" / "billing" / "insufficient" — Replicate returns 200
 * with a failed prediction rather than a 402.
 *
 * Streaming via `urls.stream` is out of scope for V1 (deferred).
 */
import type { ProviderAdapter, AdapterCtx, AdapterRunResult, BalanceSnapshot } from './types'
import { AdapterError } from './types'
import type { ChatMessage, RunOptions, FailureKind } from '../ai-providers.shared'

const DEFAULT_BASE_URL = 'https://api.replicate.com'
const MAX_POLL_ATTEMPTS = 60 // 60 × 5s backoff = 5 min hard ceiling

interface ReplicateRequest {
  version: string
  input: {
    prompt: string
    system_prompt?: string
    max_tokens?: number
    temperature?: number
    top_p?: number
  }
}

type Status = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'

interface ReplicatePrediction {
  id: string
  status: Status
  output?: string | Array<unknown> | null
  error?: string | null
  urls?: { get?: string; stream?: string }
  metrics?: { predict_time?: number }
}

function extractOutput(pred: ReplicatePrediction): string {
  if (pred.output == null) return ''
  if (typeof pred.output === 'string') return pred.output
  if (Array.isArray(pred.output)) return pred.output.filter((s) => typeof s === 'string').join('')
  return ''
}

function isOutOfFunds(pred: ReplicatePrediction): boolean {
  if (pred.status !== 'failed') return false
  const err = (pred.error ?? '').toLowerCase()
  return err.includes('credit') || err.includes('billing') || err.includes('insufficient')
}

function classifyPrediction(pred: ReplicatePrediction): FailureKind {
  if (pred.status === 'succeeded') return 'transient' // not used; we return text first
  if (pred.status === 'canceled') return 'fatal'
  if (isOutOfFunds(pred)) return 'out-of-funds'
  // 'failed' for other reasons: schema / missing version / input validation → fatal
  return 'fatal'
}

/** Replicate concatenates messages into a single prompt. `system` becomes a
 *  separate `system_prompt` input; `user`/`assistant` round-trip into the prompt. */
function toReplicateInput(messages: ChatMessage[]): ReplicateRequest['input'] {
  let system: string | undefined
  const turns: string[] = []
  for (const m of messages) {
    if (m.role === 'system' && system === undefined) {
      system = m.content
    } else if (m.role === 'user') {
      turns.push(m.content)
    }
    // Replicate text models' "prompt" is a single string; we just send the latest user turn.
    // For multi-turn models the caller's input format would differ — V1 keeps it simple.
  }
  const out: ReplicateRequest['input'] = { prompt: turns.join('\n\n') }
  if (system) out.system_prompt = system
  return out
}

/** Builds the create-prediction body. Replicate accepts the model as
 *  `version` in one of three forms — `<owner>/<name>:<hash>`, `<owner>/<name>`
 *  (latest), or a bare hash. We send the row's model verbatim. The admin is
 *  responsible for picking the right shape; admin UI documents this. */
function buildRequestBody(model: string, input: ReplicateRequest['input']): ReplicateRequest {
  return { version: model, input }
}

/** Exponential backoff with a 5s ceiling. Resets to 1s after a successful poll. */
async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    if (signal) {
      const onAbort = () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) }
      if (signal.aborted) onAbort()
      else signal.addEventListener('abort', onAbort, { once: true })
    }
  })
}

export class ReplicateAdapter implements ProviderAdapter {
  readonly kind = 'replicate' as const

  async run(messages: ChatMessage[], opts: RunOptions, ctx: AdapterCtx): Promise<AdapterRunResult> {
    const input = toReplicateInput(messages)
    if (opts.maxTokens !== undefined) input.max_tokens = opts.maxTokens
    if (opts.temperature !== undefined) input.temperature = opts.temperature
    const requestBody = buildRequestBody(ctx.model, input)

    // 1. Create prediction.
    const createRes = await ctx.fetch(`${ctx.baseUrl.replace(/\/$/, '')}/v1/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: ctx.signal,
    })
    if (!createRes.ok) {
      const detail = await createRes.text().catch(() => '')
      const status = createRes.status
      let kind: FailureKind = 'transient'
      if (status === 401 || status === 403 || status === 404 || status === 422) kind = 'fatal'
      else if (status === 402) kind = 'out-of-funds'
      else if (status >= 500) kind = 'transient'
      throw new AdapterError(`replicate HTTP ${status}: ${detail.slice(0, 200)}`, kind, status)
    }
    const prediction = (await createRes.json()) as ReplicatePrediction
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new AdapterError(`replicate prediction ${prediction.status}: ${prediction.error ?? ''}`, classifyPrediction(prediction), 200, prediction)
    }

    // 2. Poll until terminal.
    let delay = 1000
    const getUrl = prediction.urls?.get ?? `${ctx.baseUrl.replace(/\/$/, '')}/v1/predictions/${prediction.id}`
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      if (ctx.signal?.aborted) throw new AdapterError('replicate polling aborted', 'network', undefined, ctx.signal)
      const pollRes = await ctx.fetch(getUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${ctx.apiKey}` },
        signal: ctx.signal,
      })
      if (!pollRes.ok) {
        const detail = await pollRes.text().catch(() => '')
        let kind: FailureKind = 'transient'
        if (pollRes.status === 401 || pollRes.status === 403 || pollRes.status === 404) kind = 'fatal'
        else if (pollRes.status === 402) kind = 'out-of-funds'
        else if (pollRes.status >= 500) kind = 'transient'
        throw new AdapterError(`replicate poll HTTP ${pollRes.status}: ${detail.slice(0, 200)}`, kind, pollRes.status)
      }
      const polled = (await pollRes.json()) as ReplicatePrediction
      if (polled.status === 'succeeded' || polled.status === 'failed' || polled.status === 'canceled') {
        if (polled.status !== 'succeeded') {
          throw new AdapterError(`replicate prediction ${polled.status}: ${polled.error ?? ''}`, classifyPrediction(polled), 200, polled)
        }
        const text = extractOutput(polled)
        if (!text) throw new AdapterError('replicate returned no text', 'fatal', 200, polled)
        return { text: text.trim(), raw: polled }
      }
      // Still starting/processing — back off.
      await sleep(delay, ctx.signal)
      delay = Math.min(delay * 2, 5000)
    }
    throw new AdapterError(`replicate polling exceeded ${MAX_POLL_ATTEMPTS} attempts`, 'transient', 200, prediction)
  }

  async checkHealth(ctx: AdapterCtx): Promise<{ ok: boolean; detail?: string }> {
    try {
      const res = await ctx.fetch(`${ctx.baseUrl.replace(/\/$/, '')}/v1/account`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${ctx.apiKey}` },
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) return { ok: true }
      return { ok: false, detail: `HTTP ${res.status}` }
    } catch (err) {
      return { ok: false, detail: (err as Error).message ?? 'unknown' }
    }
  }

  async checkBalance(ctx: AdapterCtx): Promise<BalanceSnapshot> {
    // Replicate's /v1/account doesn't expose credit balance in the public HTTP API.
    // The dashboard does — so V1 just confirms the account endpoint is reachable.
    try {
      const res = await ctx.fetch(`${ctx.baseUrl.replace(/\/$/, '')}/v1/account`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${ctx.apiKey}` },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` }
      const json = (await res.json()) as Record<string, unknown>
      // Defensive: some accounts surface `credit_balance_cents` in custom builds.
      const cb = json.credit_balance_cents ?? json.credit_balance
      if (typeof cb === 'number' && cb <= 0) return { ok: false, remaining: cb, detail: 'no credit' }
      return { ok: true, detail: typeof cb === 'number' ? `~${cb} cents` : 'see dashboard', raw: json }
    } catch (err) {
      return { ok: false, detail: (err as Error).message ?? 'unknown' }
    }
  }
}

export const REPLICATE_DEFAULT_BASE_URL = DEFAULT_BASE_URL
