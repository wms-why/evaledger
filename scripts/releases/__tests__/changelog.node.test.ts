import { test, expect } from 'vitest'
import {
  buildChangelogDraft,
  buildChangelogFrontmatter,
  buildChangelogPayload,
  renderChangelogFrontmatter,
} from '../changelog.ts'
import type { ReleaseFacts } from '../types.ts'

const FACTS: ReleaseFacts = {
  vendor: 'openai',
  slug: 'gpt-6-astra',
  sourceUrl: 'https://platform.openai.com/docs/pricing',
  sourceTitle: 'OpenAI — API pricing',
  pageTitle: 'Pricing | OpenAI Platform',
  publishedAt: '2026-09-26',
  headings: ['Models', 'Audio'],
  bodyText: 'GPT-6 astra costs $10 / $50 per 1M tokens.',
  charCount: 45,
  truncated: false,
  scrapedAt: '2026-10-19T12:00:00.000Z',
}

test('buildChangelogFrontmatter leaves description/version as placeholders and titles the entry by slug', () => {
  const fm = buildChangelogFrontmatter(FACTS, '2026-10-19')
  // The slug is a fact, so it names the entry — but the title is still a
  // `[draft]` placeholder, not a real title.
  expect(fm.title).toBe('[draft] gpt-6-astra')
  expect(fm.description).toBe('')
  // version is human-only — the scraper cannot decide which release train
  // this launch belongs to.
  expect(fm.version).toBe('TBD')
  // Not published until a human fills it in and moves it to
  // src/content/changelog/.
  expect(fm.published).toBe(false)
})

test('buildChangelogFrontmatter fills the date from the scrape', () => {
  const fm = buildChangelogFrontmatter(FACTS, '2026-10-19')
  expect(fm.date).toBe('2026-10-19')
})

test('renderChangelogFrontmatter emits the changelog collection schema fields', () => {
  const yaml = renderChangelogFrontmatter(buildChangelogFrontmatter(FACTS, '2026-10-19'))
  expect(yaml.startsWith('---\n')).toBe(true)
  expect(yaml).toContain("title: '[draft] gpt-6-astra'")
  expect(yaml).toContain("description: ''")
  expect(yaml).toContain("date: '2026-10-19'")
  expect(yaml).toContain("version: 'TBD'")
  expect(yaml).toContain('published: false')
  // Must stay inside the collection schema (source.config.ts) — no extra keys.
  expect(yaml).not.toContain('modelId')
  expect(yaml).not.toContain('vendor:')
})

test('the changelog draft body carries the traceable facts and no prices', () => {
  const markdown = buildChangelogDraft(FACTS, '2026-10-19')
  // The scraper's facts are present so the human can verify them.
  expect(markdown).toContain('gpt-6-astra')
  expect(markdown).toContain('https://platform.openai.com/docs/pricing')
  expect(markdown).toContain('OpenAI — API pricing')
  expect(markdown).toContain('2026-10-19T12:00:00.000Z')

  // The changelog records that a model shipped — it must NOT carry a price.
  // Prices live in REGISTRY and are resolved at render time by the release
  // article, never hand-copied into prose.
  expect(markdown).not.toMatch(/\$\s?\d/)
})

test('the changelog draft directs the human to move it, never auto-publish', () => {
  // The iron rule: the scraper emits drafts only. Published changelog content
  // is a file in git, reviewed in a diff. The draft must tell the human to
  // move it into src/content/changelog/ — and must not present itself as a
  // published entry.
  const markdown = buildChangelogDraft(FACTS, '2026-10-19')
  expect(markdown).toContain('src/content/changelog')
  // The frontmatter keeps `published: false` — it is not a live entry.
  expect(markdown).toContain('published: false')
})

test('the changelog payload marks the entry as an unpublished draft', () => {
  const payload = JSON.parse(buildChangelogPayload(FACTS, '2026-10-19')) as Record<string, unknown>
  expect(payload.kind).toBe('changelog-draft')
  expect(payload.slug).toBe('gpt-6-astra')
  expect(payload.vendor).toBe('openai')
  expect(payload.date).toBe('2026-10-19')
  expect(payload.version).toBe('TBD')
  expect(payload.published).toBe(false)
})
