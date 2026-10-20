import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, test, expect } from 'vitest'
import { assertOutputDirSafe, writeDraftFiles } from '../output.ts'

const created: string[] = []

afterEach(async () => {
  while (created.length > 0) {
    const dir = created.pop()!
    await rm(dir, { recursive: true, force: true })
  }
})

test('assertOutputDirSafe allows the default draft directory', () => {
  expect(assertOutputDirSafe('data/release-drafts')).toBe(resolve('data/release-drafts'))
  expect(assertOutputDirSafe('/tmp/somewhere-else')).toBe(resolve('/tmp/somewhere-else'))
})

test('assertOutputDirSafe refuses to write into src/content', () => {
  expect(() => assertOutputDirSafe('src/content/releases')).toThrow(/must never be written/)
  expect(() => assertOutputDirSafe('src/content')).toThrow(/must never be written/)
  expect(() => assertOutputDirSafe(resolve('src/content/releases'))).toThrow()
})

test('writeDraftFiles writes both files and never overwrites by default', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'release-drafts-'))
  created.push(dir)

  const first = await writeDraftFiles(dir, 'gpt-6-astra', '# draft\n', '{}\n', false)
  expect(first).toBe('written')
  expect(await readFile(join(dir, 'gpt-6-astra.md'), 'utf8')).toBe('# draft\n')
  expect(await readFile(join(dir, 'gpt-6-astra.json'), 'utf8')).toBe('{}\n')

  // Second run without --force: the draft is someone's half-finished work.
  const second = await writeDraftFiles(dir, 'gpt-6-astra', '# other\n', '{ }\n', false)
  expect(second).toBe('skipped')
  expect(await readFile(join(dir, 'gpt-6-astra.md'), 'utf8')).toBe('# draft\n')

  // With --force it is overwritten.
  const third = await writeDraftFiles(dir, 'gpt-6-astra', '# other\n', '{ }\n', true)
  expect(third).toBe('written')
  expect(await readFile(join(dir, 'gpt-6-astra.md'), 'utf8')).toBe('# other\n')
})
