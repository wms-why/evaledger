import { describe, expect, test } from 'vitest'
import { safeNextPath } from './redirect'

describe('safeNextPath', () => {
  test('accepts same-origin absolute paths, with query and hash', () => {
    expect(safeNextPath('/data-quality')).toBe('/data-quality')
    expect(safeNextPath('/zh/data-quality#data-quality-report')).toBe(
      '/zh/data-quality#data-quality-report',
    )
    expect(safeNextPath('/app/reports?tab=open')).toBe('/app/reports?tab=open')
    expect(safeNextPath('/')).toBe('/')
  })

  test('trims surrounding whitespace', () => {
    expect(safeNextPath('  /zh/app/reports  ')).toBe('/zh/app/reports')
  })

  test('rejects protocol-relative and absolute URLs', () => {
    expect(safeNextPath('//evil.example.com')).toBeUndefined()
    expect(safeNextPath('https://evil.example.com')).toBeUndefined()
    expect(safeNextPath('http://evil.example.com/app')).toBeUndefined()
    expect(safeNextPath('javascript:alert(1)')).toBeUndefined()
    expect(safeNextPath('data:text/html,x')).toBeUndefined()
  })

  test('rejects backslashes and control characters that browsers normalize', () => {
    expect(safeNextPath('/\\evil.example.com')).toBeUndefined()
    expect(safeNextPath('/app\\..\\..\\evil')).toBeUndefined()
    expect(safeNextPath('/app\nLocation: //evil.example.com')).toBeUndefined()
    expect(safeNextPath('/app\u0000')).toBeUndefined()
  })

  test('rejects encoded path separators', () => {
    expect(safeNextPath('/%2f%2fevil.example.com')).toBeUndefined()
    expect(safeNextPath('/app%5cevil.example.com')).toBeUndefined()
    // A query value that merely contains them is not a path separator.
    expect(safeNextPath('/app?q=%2f')).toBe('/app?q=%2f')
  })

  test('rejects non-strings and overlong values', () => {
    expect(safeNextPath(undefined)).toBeUndefined()
    expect(safeNextPath(null)).toBeUndefined()
    expect(safeNextPath(42)).toBeUndefined()
    expect(safeNextPath(`/${'a'.repeat(600)}`)).toBeUndefined()
  })
})
