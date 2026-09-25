/**
 * Tests for the shared types and `AIRuntimeError` class. The shape is a
 * public contract that the 3 existing call sites depend on — any drift here
 * shows up as a compile error in `src/features/books/ai/`, but a regression
 * on `AIRuntimeError` identity would surface only at runtime. So we lock
 * the basics: name, instanceof, message, and that `cause` survives the round
 * trip.
 */
import { describe, it, expect } from 'vitest'
import { AIRuntimeError } from './ai-providers.shared'

describe('AIRuntimeError', () => {
  it('preserves message, sets name and is an Error subclass', () => {
    const e = new AIRuntimeError('boom')
    expect(e).toBeInstanceOf(Error)
    expect(e).toBeInstanceOf(AIRuntimeError)
    expect(e.name).toBe('AIRuntimeError')
    expect(e.message).toBe('boom')
  })

  it('accepts an optional cause and exposes it', () => {
    const root = new Error('root cause')
    const e = new AIRuntimeError('wrapper', root)
    expect(e.cause).toBe(root)
  })

  it('stacks work (stack trace starts with AIRuntimeError)', () => {
    const e = new AIRuntimeError('x')
    expect(typeof e.stack).toBe('string')
    expect(e.stack).toContain('AIRuntimeError')
  })
})
