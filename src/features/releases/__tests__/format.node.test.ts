import { describe, expect, it } from 'vitest'
import { formatReleasePrice } from '../format'

describe('formatReleasePrice', () => {
  it('keeps two decimals for dollar-and-above prices', () => {
    expect(formatReleasePrice(10)).toBe('$10.00')
    expect(formatReleasePrice(50)).toBe('$50.00')
    expect(formatReleasePrice(1)).toBe('$1.00')
  })

  it('drops trailing zeros below a dollar', () => {
    expect(formatReleasePrice(0.3)).toBe('$0.30')
    expect(formatReleasePrice(0.044)).toBe('$0.044')
    expect(formatReleasePrice(0.075)).toBe('$0.075')
  })

  it('keeps four significant decimals for sub-cent rates', () => {
    expect(formatReleasePrice(0.006)).toBe('$0.006')
    expect(formatReleasePrice(0.015)).toBe('$0.015')
  })

  it('rounds big numbers to whole dollars', () => {
    expect(formatReleasePrice(150)).toBe('$150')
  })
})
