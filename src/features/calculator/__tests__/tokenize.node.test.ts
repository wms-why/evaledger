import { describe, expect, it } from 'vitest'
import { countTokensSync } from '@/features/calculator/tokenize'

describe('countTokensSync', () => {
  it('returns the correct char/word counts for English text', () => {
    const r = countTokensSync('hello world', 'claude-sonnet')
    expect(r.characters).toBe(11)
    expect(r.words).toBe(2)
    // ~4 chars/token for English → ceil(11/4) = 3, but we have minimum 1.
    expect(r.tokens).toBeGreaterThanOrEqual(2)
    expect(r.exact).toBe(false)
  })

  it('counts CJK characters roughly 1-per-token', () => {
    const r = countTokensSync('你好世界', 'claude-sonnet')
    expect(r.tokens).toBe(4)
  })

  it('mixes English + CJK sensibly', () => {
    const r = countTokensSync('Hello 你好 world 世界', 'claude-sonnet')
    // 4 CJK + 5 ASCII (≈ 1.25 tokens) + spaces (1) ≈ 6-7
    expect(r.tokens).toBeGreaterThanOrEqual(5)
    expect(r.tokens).toBeLessThanOrEqual(12)
  })

  it('empty string still returns a sane shape', () => {
    const r = countTokensSync('', 'gpt-5')
    expect(r.characters).toBe(0)
    expect(r.words).toBe(0)
    expect(r.tokens).toBe(1) // minimum 1
    expect(r.family).toBe('gpt-5')
    expect(r.exact).toBe(false) // sync path is always approximate
  })

  it('marks the family on the result', () => {
    expect(countTokensSync('x', 'gemini-2.5').family).toBe('gemini-2.5')
    expect(countTokensSync('x', 'grok-4').family).toBe('grok-4')
  })
})