import { test, expect } from 'vitest'
import { selectChangelog, type ChangelogRaw } from './select'

const raw: ChangelogRaw[] = [
  { info: { path: 'v1-2-0.md' }, title: 'DeepSeek pricing page', date: '2026-09-26', version: 'v1.2.0' },
  { info: { path: 'v1-1-0.md' }, title: 'Update', date: '2026-06-24', version: 'v1.1.0' },
  { info: { path: 'v1-2-0.zh.md' }, title: '发布', date: '2026-09-26', version: 'v1.2.0' },
  { info: { path: 'draft.md' }, title: 'Draft', date: '2026-12-01', version: 'v9.9.9', published: false },
]

test('en: non-.zh files, newest first, drafts excluded', () => {
  expect(selectChangelog(raw, 'en').map((e) => e.version)).toEqual(['v1.2.0', 'v1.1.0'])
})

test('zh: only .zh files', () => {
  expect(selectChangelog(raw, 'zh').map((e) => e.path)).toEqual(['v1-2-0.zh.md'])
})

test('excludes published:false', () => {
  expect(selectChangelog(raw, 'en').some((e) => e.version === 'v9.9.9')).toBe(false)
})
