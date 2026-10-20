import { test, expect } from 'vitest'
import {
  buildFence,
  collapseWhitespace,
  escapeMdxText,
  normalizeBlock,
  parsePublishedAt,
  truncateText,
} from '../text.ts'

test('parsePublishedAt handles numeric date shapes', () => {
  expect(parsePublishedAt('2026-09-10')).toBe('2026-09-10')
  expect(parsePublishedAt('2026/09/10')).toBe('2026-09-10')
  expect(parsePublishedAt('2026.09.10')).toBe('2026-09-10')
  expect(parsePublishedAt('2026年9月10日')).toBe('2026-09-10')
  expect(parsePublishedAt('发布于 2026-09-10 08:30')).toBe('2026-09-10')
  expect(parsePublishedAt('2026-09-10T08:30:00Z')).toBe('2026-09-10')
})

test('parsePublishedAt handles month-name date shapes', () => {
  expect(parsePublishedAt('September 10, 2026')).toBe('2026-09-10')
  expect(parsePublishedAt('Sep 10, 2026')).toBe('2026-09-10')
  expect(parsePublishedAt('Sept. 10th, 2026')).toBe('2026-09-10')
  expect(parsePublishedAt('10 September 2026')).toBe('2026-09-10')
  expect(parsePublishedAt('10th Oct 2026')).toBe('2026-10-10')
})

test('parsePublishedAt returns null when there is no date', () => {
  expect(parsePublishedAt('')).toBeNull()
  expect(parsePublishedAt(null)).toBeNull()
  expect(parsePublishedAt(undefined)).toBeNull()
  expect(parsePublishedAt('Last updated recently')).toBeNull()
  // A "not a date" string that looks like a month must not produce garbage.
  expect(parsePublishedAt('September')).toBeNull()
})

test('parsePublishedAt rejects impossible month/day values', () => {
  expect(parsePublishedAt('2026-13-10')).toBeNull()
  expect(parsePublishedAt('2026-09-99')).toBeNull()
})

test('collapseWhitespace flattens whitespace runs', () => {
  expect(collapseWhitespace('  a \n\t b  ')).toBe('a b')
  expect(collapseWhitespace('')).toBe('')
})

test('normalizeBlock keeps paragraphs but drops blank-line runs', () => {
  expect(normalizeBlock('a\n\n\n\nb')).toBe('a\n\nb')
  expect(normalizeBlock('  a  \n  b  ')).toBe('a\nb')
  expect(normalizeBlock('\r\nhello\r\n')).toBe('hello')
})

test('truncateText cuts long bodies and reports it', () => {
  const long = 'x'.repeat(500)
  const cut = truncateText(long, 100)
  expect(cut.truncated).toBe(true)
  expect(cut.text.startsWith('x'.repeat(100))).toBe(true)
  expect(cut.text).toContain('已截断')

  const short = truncateText('hello', 100)
  expect(short.truncated).toBe(false)
  expect(short.text).toBe('hello')
})

test('buildFence is always long enough for the content', () => {
  expect(buildFence('plain text')).toBe('```')
  expect(buildFence('a ``` b')).toBe('````')
  expect(buildFence('a ````` b')).toBe('``````')
})

test('escapeMdxText escapes the characters MDX would parse', () => {
  expect(escapeMdxText('a <b> c')).toBe('a \\<b> c')
  expect(escapeMdxText('{expr}')).toBe('\\{expr\\}')
  expect(escapeMdxText('no markup')).toBe('no markup')
})
