/**
 * Replicate adapter tests — covers the async prediction lifecycle:
 *
 *   1. POST /v1/predictions → create
 *   2. GET  /v1/predictions/{id} → poll
 *
 * We use the ordered `makeStubFetch` helper so that the more-specific
 * `/v1/predictions/p1` pattern wins over the bare `/v1/predictions` create
 * pattern when the same substring appears in both URLs.
 */
import { describe, it, expect } from 'vitest'
import { ReplicateAdapter } from './replicate'
import { AdapterError } from './types'
import { fakeCtx, jsonResponse, makeStubFetch } from '../test-helpers'

const BASE = 'https://api.replicate.com'
const MODEL = 'meta/meta-llama-3-70b-instruct'
const KEY = 'r8_test'

describe('ReplicateAdapter', () => {
  it('happy path: create returns starting, immediate poll succeeds', async () => {
    const fetch_ = makeStubFetch([
      ['/v1/predictions/p1', () => jsonResponse({ id: 'p1', status: 'succeeded', output: 'hello world' })],
      ['/v1/predictions', () =>
        jsonResponse({ id: 'p1', status: 'starting', urls: { get: `${BASE}/v1/predictions/p1` } })],
    ])
    const r = await new ReplicateAdapter().run(
      [{ role: 'user', content: 'hi' }],
      {},
      fakeCtx({ apiKey: KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ }),
    )
    expect(r.text).toBe('hello world')
  })

  it('create returns 422 with failed prediction → fatal', async () => {
    const fetch_ = makeStubFetch([
      ['/v1/predictions', () => jsonResponse({ detail: 'unprocessable' }, 422)],
    ])
    await expect(
      new ReplicateAdapter().run(
        [{ role: 'user', content: 'x' }],
        {},
        fakeCtx({ apiKey: KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ }),
      ),
    ).rejects.toMatchObject({ kind: 'fatal', status: 422 })
  })

  it('polled failed with insufficient credit → out-of-funds', async () => {
    const fetch_ = makeStubFetch([
      ['/v1/predictions/p3', () => jsonResponse({ id: 'p3', status: 'failed', error: 'Insufficient credit balance' })],
      ['/v1/predictions', () =>
        jsonResponse({ id: 'p3', status: 'processing', urls: { get: `${BASE}/v1/predictions/p3` } })],
    ])
    await expect(
      new ReplicateAdapter().run(
        [{ role: 'user', content: 'x' }],
        {},
        fakeCtx({ apiKey: KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ }),
      ),
    ).rejects.toMatchObject({ kind: 'out-of-funds' })
  })

  it('create 401 → fatal', async () => {
    const fetch_ = makeStubFetch([
      ['/v1/predictions', () => jsonResponse({ detail: 'unauthorized' }, 401)],
    ])
    await expect(
      new ReplicateAdapter().run(
        [{ role: 'user', content: 'x' }],
        {},
        fakeCtx({ apiKey: KEY, baseUrl: BASE, model: MODEL, fetch: fetch_ }),
      ),
    ).rejects.toMatchObject({ kind: 'fatal', status: 401 })
  })

  it('exposes AdapterError type', () => {
    const e = new AdapterError('x', 'transient', 503)
    expect(e.name).toBe('AdapterError')
  })
})
