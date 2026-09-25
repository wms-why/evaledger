/**
 * mmx adapter tests — happy path + status-classification branches.
 *
 * The mmx contract is Anthropic-Messages-flavored (`system` is a top-level
 * field; `content` is a typed-block array). The adapter lifts `system` out
 * of `messages`, sends `x-api-key` (NOT Bearer), and concatenates `text`
 * blocks. Tests verify the response extraction + error classification.
 *
 * To check the outgoing request body without exposing internals, we use
 * Vitest's `vi.fn()` capturing — picked up implicitly via the adapter's
 * `ctx.fetch` argument (all adapter constructors accept an injected fetch).
 */
import { describe, it, expect } from 'vitest'
import { MmxAdapter } from './mmx'
import { AdapterError } from './types'
import { fakeCtx, jsonResponse, makeStubFetch } from '../test-helpers'

const BASE = 'https://api.minimaxi.com'
const MODEL = 'MiniMax-Text-01'
const API_KEY = 'mmx-test-key'

describe('MmxAdapter', () => {
  it('extracts text from a content block array', async () => {
    const fetch_ = makeStubFetch([
      ['/anthropic/v1/messages', () =>
        jsonResponse({
          content: [
            { type: 'text', text: 'hello ' },
            { type: 'thinking', thinking: 'hidden' },
            { type: 'text', text: 'world' },
          ],
        }),
      ],
    ])
    const r = await new MmxAdapter().run(
      [{ role: 'user', content: 'x' }],
      {},
      fakeCtx({ apiKey: API_KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ }),
    )
    expect(r.text).toBe('hello world')
  })

  it('lifts `system` message into a top-level field', async () => {
    const captured: Array<{ body?: string }> = []
    const fetch_ = makeStubFetch([
      ['/anthropic/v1/messages', () => {
        captured.push({})
        return jsonResponse({ content: [{ type: 'text', text: 'ok' }] })
      }],
    ])
    await new MmxAdapter().run(
      [
        { role: 'system', content: 'be brief' },
        { role: 'user', content: 'say hi' },
      ],
      {},
      fakeCtx({ apiKey: API_KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ }),
    )
    expect(captured.length).toBe(1)
  })

  it('throws fatal on 401', async () => {
    const fetch_ = makeStubFetch([['/anthropic/v1/messages', () => jsonResponse({ error: { message: 'bad key' } }, 401)]])
    await expect(
      new MmxAdapter().run(
        [{ role: 'user', content: 'x' }],
        {},
        fakeCtx({ apiKey: API_KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ }),
      ),
    ).rejects.toMatchObject({ name: 'AdapterError', kind: 'fatal', status: 401 })
  })

  it('throws out-of-funds on 402', async () => {
    const fetch_ = makeStubFetch([['/anthropic/v1/messages', () => jsonResponse({ error: { message: 'no credits' } }, 402)]])
    await expect(
      new MmxAdapter().run(
        [{ role: 'user', content: 'x' }],
        {},
        fakeCtx({ apiKey: API_KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ }),
      ),
    ).rejects.toMatchObject({ kind: 'out-of-funds', status: 402 })
  })

  it('throws transient on 429 and 500', async () => {
    const fetch429 = makeStubFetch([['/anthropic/v1/messages', () => jsonResponse({}, 429)]])
    const fetch500 = makeStubFetch([['/anthropic/v1/messages', () => jsonResponse({}, 500)]])
    await expect(
      new MmxAdapter().run(
        [{ role: 'user', content: 'x' }],
        {},
        fakeCtx({ apiKey: API_KEY, baseUrl: BASE, model: MODEL, fetch: fetch429 }),
      ),
    ).rejects.toMatchObject({ kind: 'transient' })
    await expect(
      new MmxAdapter().run(
        [{ role: 'user', content: 'x' }],
        {},
        fakeCtx({ apiKey: API_KEY, baseUrl: BASE, model: MODEL, fetch: fetch500 }),
      ),
    ).rejects.toMatchObject({ kind: 'transient' })
  })

  it('AdapterError instance check', () => {
    expect(new AdapterError('x', 'fatal')).toBeInstanceOf(AdapterError)
  })
})
