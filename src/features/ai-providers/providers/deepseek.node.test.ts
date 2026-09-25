/**
 * DeepSeek adapter tests — happy path + status branches + balance probe.
 *
 * Contract: OpenAI-compat chat completions. 402 = out of funds (the canonical
 * signal). 401/403/400/422 = fatal. 5xx + 408/413/429 = transient.
 */
import { describe, it, expect } from 'vitest'
import { DeepSeekAdapter } from './deepseek'
import { fakeCtx, jsonResponse, stubFetch } from '../test-helpers'

const BASE = 'https://api.deepseek.com'
const MODEL = 'deepseek-chat'
const KEY = 'sk-test'

describe('DeepSeekAdapter', () => {
  it('reads content from choices[0].message.content', async () => {
    const fetch_ = stubFetch({
      '/chat/completions': () =>
        jsonResponse({
          choices: [{ index: 0, message: { role: 'assistant', content: '   hello   ' }, finish_reason: 'stop' }],
        }),
    })
    const r = await new DeepSeekAdapter().run(
      [{ role: 'user', content: 'x' }],
      { temperature: 0.3 },
      fakeCtx({ apiKey: KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ }),
    )
    expect(r.text).toBe('hello')
  })

  it('maps 402 to out-of-funds (the canonical DeepSeek signal)', async () => {
    const fetch_ = stubFetch({ '/chat/completions': () => jsonResponse({ error: { message: 'insufficient balance' } }, 402) })
    await expect(
      new DeepSeekAdapter().run([{ role: 'user', content: 'x' }], {}, fakeCtx({ apiKey: KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ })),
    ).rejects.toMatchObject({ kind: 'out-of-funds', status: 402 })
  })

  it('maps 401/400/422 to fatal', async () => {
    for (const code of [400, 401, 403, 422]) {
      const fetch_ = stubFetch({ '/chat/completions': () => jsonResponse({}, code) })
      await expect(
        new DeepSeekAdapter().run([{ role: 'user', content: 'x' }], {}, fakeCtx({ apiKey: KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ })),
      ).rejects.toMatchObject({ kind: 'fatal' })
    }
  })

  it('maps 429/500 to transient', async () => {
    for (const code of [408, 413, 429, 500, 503]) {
      const fetch_ = stubFetch({ '/chat/completions': () => jsonResponse({}, code) })
      await expect(
        new DeepSeekAdapter().run([{ role: 'user', content: 'x' }], {}, fakeCtx({ apiKey: KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ })),
      ).rejects.toMatchObject({ kind: 'transient' })
    }
  })

  it('checkBalance returns OK when balance is positive', async () => {
    const fetch_ = stubFetch({
      '/user/balance': () =>
        jsonResponse({
          is_available: true,
          balance_infos: [{ currency: 'CNY', total_balance: '10.00', granted_balance: '0', topped_up_balance: '10.00' }],
        }),
    })
    const r = await new DeepSeekAdapter().checkBalance(fakeCtx({ apiKey: KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ }))
    expect(r.ok).toBe(true)
    expect(r.remaining).toBe('10.00')
    expect(r.currency).toBe('CNY')
  })

  it('checkBalance returns not-ok when balance is zero', async () => {
    const fetch_ = stubFetch({
      '/user/balance': () =>
        jsonResponse({
          is_available: false,
          balance_infos: [{ currency: 'CNY', total_balance: '0.00', granted_balance: '0', topped_up_balance: '0' }],
        }),
    })
    const r = await new DeepSeekAdapter().checkBalance(fakeCtx({ apiKey: KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ }))
    expect(r.ok).toBe(false)
  })
})
