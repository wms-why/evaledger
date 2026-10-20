import { test, expect } from 'vitest'
import { buildDraftMarkdown, buildFactsPayload, buildFrontmatter, renderFrontmatter } from '../draft.ts'
import type { ReleaseFacts } from '../types.ts'

const FACTS: ReleaseFacts = {
  vendor: 'openai',
  slug: 'gpt-6-astra',
  sourceUrl: 'https://platform.openai.com/docs/pricing',
  sourceTitle: 'OpenAI — API pricing',
  pageTitle: 'Pricing | OpenAI Platform',
  publishedAt: '2026-09-26',
  headings: ['Models', 'Audio'],
  bodyText: 'GPT-6 astra costs $10 / $50 per 1M tokens.\n\nContext window: 400,000.',
  charCount: 73,
  truncated: false,
  scrapedAt: '2026-10-19T12:00:00.000Z',
}

/** The template part of the draft — everything before the scraped appendix. */
function templateOf(markdown: string): string {
  return markdown.split('## Source text')[0] ?? ''
}

test('buildFrontmatter leaves every human-only field empty', () => {
  const fm = buildFrontmatter(FACTS, '2026-10-19')
  expect(fm.title).toBe('')
  expect(fm.description).toBe('')
  expect(fm.releasedAt).toBe('')
  expect(fm.modelId).toBe('')
  expect(fm.modelSlug).toBe('')
  expect(fm.compareModelIds).toEqual([])
  expect(fm.compareSlugs).toEqual([])
  expect(fm.published).toBe(false)
})

test('buildFrontmatter only fills the fields the scraper actually knows', () => {
  const fm = buildFrontmatter(FACTS, '2026-10-19')
  expect(fm.date).toBe('2026-10-19')
  expect(fm.checkedAt).toBe('2026-10-19')
  expect(fm.vendor).toBe('openai')
  expect(fm.sourceUrl).toBe('https://platform.openai.com/docs/pricing')
  expect(fm.sourceTitle).toBe('OpenAI — API pricing')
})

test('renderFrontmatter emits the schema fields with empty placeholders', () => {
  const yaml = renderFrontmatter(buildFrontmatter(FACTS, '2026-10-19'))
  expect(yaml).toContain("modelId: ''")
  expect(yaml).toContain("modelSlug: ''")
  expect(yaml).toContain("releasedAt: ''")
  expect(yaml).toContain('compareModelIds: []')
  expect(yaml).toContain('compareSlugs: []')
  expect(yaml).toContain('published: false')
  expect(yaml).toContain("sourceUrl: 'https://platform.openai.com/docs/pricing'")
  expect(yaml.startsWith('---\n')).toBe(true)
})

test('the draft template carries the six contract sections and no prices', () => {
  const markdown = buildDraftMarkdown(FACTS, '2026-10-19')
  const template = templateOf(markdown)
  for (const heading of [
    '## TL;DR',
    '## What shipped',
    '## What it costs',
    '## How it scores',
    '## Should you switch?',
    '## Where to go next',
  ]) {
    expect(template).toContain(heading)
  }
  // The template must not carry a single price — those come from REGISTRY at
  // render time and are written by hand.
  expect(template).not.toMatch(/\$\s?\d/)
  // ... and it must not name a model id either.
  expect(template).not.toContain('gpt-6-astra')
})

test('the draft appends the scraped source text as reference material', () => {
  const markdown = buildDraftMarkdown(FACTS, '2026-10-19')
  expect(markdown).toContain('## Source text (auto-extracted — reference only)')
  expect(markdown).toContain('小标题：')
  expect(markdown).toContain('- Models')
  expect(markdown).toContain(FACTS.bodyText)
  // The raw text is fenced so MDX never parses it as JSX.
  expect(markdown).toContain('```\n' + FACTS.bodyText + '\n```')
})

test('the facts payload carries the extracted facts', () => {
  const payload = JSON.parse(buildFactsPayload(FACTS)) as Record<string, unknown>
  expect(payload.sourceTitle).toBe('OpenAI — API pricing')
  expect(payload.pageTitle).toBe('Pricing | OpenAI Platform')
  expect(payload.publishedAt).toBe('2026-09-26')
  expect(payload.headings).toEqual(['Models', 'Audio'])
  expect(payload.bodyText).toBe(FACTS.bodyText)
  expect(payload.slug).toBe('gpt-6-astra')
})
