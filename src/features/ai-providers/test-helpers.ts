/**
 * Test helpers for the AI providers feature — kept in a non-`.test` file so
 * they're importable by both `*.node.test.ts` and `*.workers.test.ts`.
 *
 * Exports:
 *   - `stubFetch(responses)`    → fetch-shaped function returning canned responses per URL.
 *   - `fakeProvider(overrides)` → minimal `AIProvider` row for tests.
 *   - `fakeCtx(overrides)`      → minimal `AdapterCtx` with the stub fetch pre-wired.
 *   - `jsonResponse(body, status)` → a `Response` with a JSON body.
 *   - `makeStubFetch(handlers)` → most-specific match wins via ordered [pattern, handler] pairs.
 */
import type { AIProvider } from './ai-providers.schema'
import type { AdapterCtx, FetchFn } from './providers/types'

/** Build a stub `fetch` from an ordered list of [URL pattern, handler] pairs.
 *  Patterns use string `.includes()`. The first matching pattern wins — place
 *  more-specific patterns before less-specific ones. */
export function makeStubFetch(
  handlers: Array<[pattern: string, handler: () => Response | Promise<Response>]>,
): FetchFn {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    for (const [pattern, handler] of handlers) {
      if (url.includes(pattern)) {
        return await handler()
      }
    }
    throw new TypeError(`makeStubFetch: no canned response for ${url}`)
  }) as unknown as FetchFn
}

/** Object-keyed stub kept for backwards-compat with simple (single-pattern) cases.
 *  Prefer `makeStubFetch` for tests with multiple URL patterns. */
export function stubFetch(
  responses: Record<string, Response | (() => Response) | (() => Promise<Response>)>,
): FetchFn {
  return makeStubFetch(
    Object.entries(responses).map(([k, v]) => [
      k,
      typeof v === 'function' ? (v as () => Response | Promise<Response>) : (() => v as Response),
    ]),
  )
}

/** Minimal valid `AIProvider` row for tests. Override any field via spread. */
export function fakeProvider(over: Partial<AIProvider> & Pick<AIProvider, 'kind' | 'label' | 'model' | 'priority'>): AIProvider {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    enabled: true,
    baseUrlOverride: null,
    maxTokensCap: null,
    lastError: null,
    lastErrorAt: null,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    ...over,
  } as AIProvider
}

/** Build an `AdapterCtx` with a stub fetch + dummy api key, override anything via spread. */
export function fakeCtx(over: Partial<AdapterCtx> & Pick<AdapterCtx, 'apiKey' | 'baseUrl' | 'model'>): AdapterCtx {
  return {
    fetch: stubFetch({}),
    ...over,
  }
}

/** Tiny helper: a `Response` with JSON body and a status. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
