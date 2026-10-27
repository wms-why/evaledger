import { readFile } from 'node:fs/promises'
import { test, expect } from 'vitest'
import {
  RELEASE_SCRAPERS,
  RELEASE_SOURCES,
  VENDOR_IDS,
  findSource,
  findSourceBySlug,
} from '../sources.ts'

/** The release contract — the source list must stay in sync with it. */
const CONTRACT_URL = new URL('../../../src/features/releases/README.md', import.meta.url)

test('the registry covers the six vendors of the first batch', () => {
  expect(VENDOR_IDS).toEqual(['openai', 'anthropic', 'google', 'grok', 'deepseek', 'minimax'])
  expect(RELEASE_SOURCES).toHaveLength(7)
})

test('every source has a unique slug and a complete selector set', () => {
  const slugs = new Set<string>()
  for (const source of RELEASE_SOURCES) {
    expect(slugs.has(source.slug)).toBe(false)
    slugs.add(source.slug)

    expect(source.url).toMatch(/^https:\/\//)
    expect(source.knownTitle.length).toBeGreaterThan(0)
    expect(source.selectors.title.length).toBeGreaterThan(0)
    expect(source.selectors.date.length).toBeGreaterThan(0)
    expect(source.selectors.content.length).toBeGreaterThan(0)
    expect(source.selectors.heading.length).toBeGreaterThan(0)
    // The content list must end with a catch-all so a failure can still be
    // reported with something to show.
    expect(source.selectors.content[source.selectors.content.length - 1]).toBe('body')
  }
})

test('every source url and title comes from the release contract', async () => {
  const contract = await readFile(CONTRACT_URL, 'utf8')
  for (const source of RELEASE_SOURCES) {
    expect(contract, `${source.vendor} url is not in the contract`).toContain(source.url)
    expect(contract, `${source.vendor} title is not in the contract`).toContain(
      source.knownTitle,
    )
  }
})

test('findSource resolves a vendor id', () => {
  expect(findSource('deepseek')?.slug).toBe('deepseek-v4-1-flash')
  expect(findSource('nope')).toBeUndefined()
})

test('findSourceBySlug resolves a source', () => {
  expect(findSourceBySlug('gpt-6-1-terra')?.vendor).toBe('openai')
  expect(findSourceBySlug('nope')).toBeUndefined()
})

test('a vendor may have several sources', () => {
  const openai = RELEASE_SOURCES.filter((s) => s.vendor === 'openai')
  expect(openai.map((s) => s.slug)).toEqual(['gpt-6-astra', 'gpt-6-1-terra'])
})

test('every source has a scraper, keyed by slug', () => {
  for (const source of RELEASE_SOURCES) {
    expect(typeof RELEASE_SCRAPERS[source.slug], `${source.slug} has no scraper`).toBe(
      'function',
    )
  }
})
