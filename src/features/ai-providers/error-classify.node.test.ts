/**
 * Tests for the error taxonomy helper. Adapters pre-classify via
 * `AdapterError.kind`; this function is the safety net that recovers a
 * `FailureKind` from anything else that slipped through. The four branches:
 *
 *   1. `.kind` present and valid → trust it.
 *   2. `TypeError` (network-layer throw) → 'network'.
 *   3. Anything else → 'transient' (default — better to fallback than short-circuit).
 *   4. `.kind` present but malformed → also 'transient' (don't trust garbage).
 */
import { describe, it, expect } from 'vitest'
import { classifyAdapterError } from './error-classify'

describe('classifyAdapterError', () => {
  it('trusts a valid `.kind` property on plain objects', () => {
    expect(classifyAdapterError({ kind: 'fatal' })).toBe('fatal')
    expect(classifyAdapterError({ kind: 'transient' })).toBe('transient')
    expect(classifyAdapterError({ kind: 'out-of-funds' })).toBe('out-of-funds')
    expect(classifyAdapterError({ kind: 'network' })).toBe('network')
  })

  it('treats plain TypeError as network', () => {
    expect(classifyAdapterError(new TypeError('fetch failed'))).toBe('network')
  })

  it('falls back to transient for unknown error shapes', () => {
    expect(classifyAdapterError(new Error('boom'))).toBe('transient')
    expect(classifyAdapterError('string error')).toBe('transient')
    expect(classifyAdapterError(null)).toBe('transient')
    expect(classifyAdapterError(undefined)).toBe('transient')
  })

  it('rejects a malformed `.kind` value rather than trusting it', () => {
    // Anything not in the union → treat as the 'transient' default.
    expect(classifyAdapterError({ kind: 'unknown' })).toBe('transient')
    expect(classifyAdapterError({ kind: 42 })).toBe('transient')
    expect(classifyAdapterError({ kind: null })).toBe('transient')
  })
})
