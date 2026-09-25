import { test, expect } from 'vitest'
import { normalize, parsePrice, parseContextWindow } from '../normalize'
import type { ScrapedModel } from '../types'

test('normalize joins ScrapedModel rows with the mapping table', () => {
  const rows: ScrapedModel[] = [
    {
      provider: 'anthropic',
      scrapedName: 'Claude Sonnet 4.5',
      inputPricePer1M: 3.0,
      outputPricePer1M: 15.0,
      cachedInputPricePer1M: 0.3,
      contextWindow: 200_000,
      raw: { source: 'fixture' },
    },
    {
      provider: 'openai',
      scrapedName: 'GPT-99 Turbo', // intentionally unmapped
      inputPricePer1M: 1.0,
      outputPricePer1M: 2.0,
      cachedInputPricePer1M: null,
      contextWindow: null,
      raw: {},
    },
  ]
  const out = normalize(rows)
  expect(out).toHaveLength(2)
  expect(out[0]).toMatchObject({
    provider: 'anthropic',
    scrapedName: 'Claude Sonnet 4.5',
    modelId: 'claude-sonnet-4.5',
    inputPricePer1M: 3.0,
    outputPricePer1M: 15.0,
  })
  expect(out[1]).toMatchObject({
    provider: 'openai',
    scrapedName: 'GPT-99 Turbo',
    modelId: null,
  })
})

test('normalize is null-safe for every price field', () => {
  const out = normalize([
    {
      provider: 'openai',
      scrapedName: 'GPT-5',
      inputPricePer1M: null,
      outputPricePer1M: null,
      cachedInputPricePer1M: null,
      contextWindow: null,
      raw: {},
    },
  ])
  expect(out[0].inputPricePer1M).toBeNull()
  expect(out[0].outputPricePer1M).toBeNull()
  expect(out[0].cachedInputPricePer1M).toBeNull()
  expect(out[0].contextWindow).toBeNull()
})

test('normalize preserves raw for debugging when selectors drift', () => {
  const out = normalize([
    {
      provider: 'google',
      scrapedName: 'Gemini 2.5 Pro',
      inputPricePer1M: 1.25,
      outputPricePer1M: 10,
      cachedInputPricePer1M: null,
      contextWindow: 1_000_000,
      raw: { cellText: 'Gemini 2.5 Pro · $1.25 / $10.00' },
    },
  ])
  expect(out[0].raw).toEqual({ cellText: 'Gemini 2.5 Pro · $1.25 / $10.00' })
})

test('parsePrice: handles $ prefixes, suffixes, and garbage', () => {
  expect(parsePrice('$1.25')).toBe(1.25)
  expect(parsePrice('1.25')).toBe(1.25)
  expect(parsePrice('$0.05 / 1M tokens')).toBe(0.05)
  expect(parsePrice('1,250.00')).toBe(1250)
  expect(parsePrice('')).toBeNull()
  expect(parsePrice(null)).toBeNull()
  expect(parsePrice('not a number')).toBeNull()
  expect(parsePrice('-0.50')).toBe(-0.5)
})

test('parsePrice: rejects non-finite values', () => {
  expect(parsePrice('Infinity')).toBeNull()
  expect(parsePrice('NaN')).toBeNull()
})

test('parseContextWindow: handles K/M suffixes and bare numbers', () => {
  expect(parseContextWindow('400K')).toBe(400_000)
  expect(parseContextWindow('1M')).toBe(1_000_000)
  expect(parseContextWindow('128,000')).toBe(128_000)
  expect(parseContextWindow('200k')).toBe(200_000)
  expect(parseContextWindow('128000')).toBe(128_000)
  expect(parseContextWindow('  400K  ')).toBe(400_000)
})

test('parseContextWindow: returns null on garbage', () => {
  expect(parseContextWindow('')).toBeNull()
  expect(parseContextWindow(null)).toBeNull()
  expect(parseContextWindow('not a window')).toBeNull()
})
