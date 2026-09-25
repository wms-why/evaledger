import { test, expect } from 'vitest'
import { computeApplyDiff, formatDiff, rewriteModelFile } from '../apply.ts'
import type { ModelRegistry } from '@/features/calculator/types'
import type { NormalizedModel } from '../types.ts'

const REGISTRY: ModelRegistry = {
  registryVersion: '0.2.0',
  fetchedAt: '2026-09-26',
  sourceNote: 'test',
  openRouterMarkup: 1.05,
  models: [
    {
      id: 'foo',
      provider: 'openai',
      displayName: 'Foo',
      family: 'foo',
      status: 'active',
      contextWindow: 100_000,
      inputPricePer1M: 1.0,
      outputPricePer1M: 2.0,
      sourceUrl: 'https://example.com',
      lastVerified: '2026-09-26',
    },
    {
      id: 'bar',
      provider: 'openai',
      displayName: 'Bar',
      family: 'bar',
      status: 'active',
      contextWindow: 100_000,
      inputPricePer1M: 0.5,
      outputPricePer1M: 1.0,
      cachedInputPricePer1M: 0.05,
      sourceUrl: 'https://example.com',
      lastVerified: '2026-09-26',
    },
  ],
}

const SCRAPED: NormalizedModel[] = [
  // foo: input changed 1.0 → 1.5, output unchanged, no cached, no context
  {
    provider: 'openai',
    scrapedName: 'Foo',
    modelId: 'foo',
    inputPricePer1M: 1.5,
    outputPricePer1M: 2.0,
    cachedInputPricePer1M: null,
    contextWindow: null,
    raw: {},
  },
  // bar: all four fields changed
  {
    provider: 'openai',
    scrapedName: 'Bar',
    modelId: 'bar',
    inputPricePer1M: 0.6,
    outputPricePer1M: 1.2,
    cachedInputPricePer1M: 0.06,
    contextWindow: 200_000,
    raw: {},
  },
  // unmapped — should be skipped
  {
    provider: 'openai',
    scrapedName: 'Baz',
    modelId: null,
    inputPricePer1M: 9.9,
    outputPricePer1M: 9.9,
    cachedInputPricePer1M: null,
    contextWindow: null,
    raw: {},
  },
]

test('computeApplyDiff: emits only fields that actually changed', () => {
  const diffs = computeApplyDiff(REGISTRY, SCRAPED)
  // foo: 1 change. bar: 4 changes. unmapped: skipped.
  expect(diffs).toHaveLength(5)
  const fooDiffs = diffs.filter((d) => d.modelId === 'foo')
  expect(fooDiffs).toHaveLength(1)
  expect(fooDiffs[0]).toMatchObject({ field: 'inputPricePer1M', before: 1.0, after: 1.5 })
})

test('computeApplyDiff: skips scraped rows where the field is null', () => {
  // Bar with cached: null should NOT overwrite Bar's existing cached price.
  const scrapedWithNulls: NormalizedModel[] = [
    {
      provider: 'openai',
      scrapedName: 'Bar',
      modelId: 'bar',
      inputPricePer1M: 0.6,
      outputPricePer1M: 1.2,
      cachedInputPricePer1M: null,
      contextWindow: 200_000,
      raw: {},
    },
  ]
  const diffs = computeApplyDiff(REGISTRY, scrapedWithNulls)
  expect(diffs.map((d) => d.field)).toEqual([
    'inputPricePer1M',
    'outputPricePer1M',
    'contextWindow',
  ])
})

test('computeApplyDiff: skips rows with modelId === null', () => {
  const diffs = computeApplyDiff(REGISTRY, SCRAPED)
  expect(diffs.some((d) => d.modelId === null)).toBe(false)
})

test('computeApplyDiff: skips when before === after', () => {
  // Same price, no diff.
  const samePrice: NormalizedModel[] = [
    {
      provider: 'openai',
      scrapedName: 'Foo',
      modelId: 'foo',
      inputPricePer1M: 1.0,
      outputPricePer1M: 2.0,
      cachedInputPricePer1M: null,
      contextWindow: null,
      raw: {},
    },
  ]
  const diffs = computeApplyDiff(REGISTRY, samePrice)
  expect(diffs).toEqual([])
})

test('computeApplyDiff: dedupes when the same model appears multiple times', () => {
  // Foo appears twice at different "tiers". First wins for each field.
  const duped: NormalizedModel[] = [
    {
      provider: 'openai',
      scrapedName: 'Foo',
      modelId: 'foo',
      inputPricePer1M: 1.5,
      outputPricePer1M: 2.0, // matches REGISTRY → no diff
      cachedInputPricePer1M: null,
      contextWindow: null,
      raw: { tier: 'standard' },
    },
    {
      provider: 'openai',
      scrapedName: 'Foo',
      modelId: 'foo',
      inputPricePer1M: 5.0,  // different from REGISTRY but already seen → dropped
      outputPricePer1M: 2.0,
      cachedInputPricePer1M: null,
      contextWindow: null,
      raw: { tier: 'batch' },
    },
  ]
  const diffs = computeApplyDiff(REGISTRY, duped)
  // Only the FIRST input value (1.5) produces a diff; the second is dropped.
  expect(diffs).toHaveLength(1)
  expect(diffs[0]).toMatchObject({ field: 'inputPricePer1M', before: 1.0, after: 1.5 })
})

test('formatDiff: prints each change on its own line', () => {
  const diffs = computeApplyDiff(REGISTRY, SCRAPED)
  const out = formatDiff(diffs)
  expect(out).toContain('Foo')
  expect(out).toContain('Bar')
  expect(out).toContain('→')
})

test('formatDiff: prints "(no changes)" for empty diff', () => {
  expect(formatDiff([])).toBe('  (no changes)')
})

const SAMPLE_SOURCE = `import type { ModelRegistry } from './types'

export const REGISTRY_VERSION = '0.2.0'

export const REGISTRY: ModelRegistry = {
  registryVersion: REGISTRY_VERSION,
  fetchedAt: '2026-09-26',
  sourceNote: 'test',
  openRouterMarkup: 1.05,
  models: [
    {
      id: 'foo',
      provider: 'openai',
      displayName: 'Foo',
      family: 'foo',
      status: 'active',
      contextWindow: 100_000,
      inputPricePer1M: 1.0,
      outputPricePer1M: 2.0,
      cachedInputPricePer1M: 0.1,
      sourceUrl: 'https://example.com',
      lastVerified: '2026-09-26',
    },
    {
      id: 'bar',
      provider: 'openai',
      displayName: 'Bar',
      family: 'bar',
      status: 'active',
      contextWindow: 100_000,
      inputPricePer1M: 0.5,
      outputPricePer1M: 1.0,
      sourceUrl: 'https://example.com',
      lastVerified: '2026-09-26',
    },
  ],
}
`

test('rewriteModelFile: applies price diffs and bumps lastVerified for changed models', () => {
  const diffs = [
    { modelId: 'foo', displayName: 'Foo', field: 'inputPricePer1M' as const, before: 1.0, after: 1.5 },
  ]
  const { fileContent, diffsApplied } = rewriteModelFile(SAMPLE_SOURCE, diffs, '2026-10-01')
  expect(diffsApplied).toBe(1)
  // The foo inputPricePer1M line was rewritten.
  expect(fileContent).toMatch(/id: 'foo'[\s\S]*?inputPricePer1M: 1\.5,/)
  // bar's inputPricePer1M (untouched) should remain 0.5.
  expect(fileContent).toMatch(/id: 'bar'[\s\S]*?inputPricePer1M: 0\.5,/)
  // foo's lastVerified was bumped; bar's lastVerified was NOT bumped (no diff for bar).
  const fooBlock = fileContent.match(/id: 'foo'[\s\S]*?\},?\s*\n\s*\{[\s\S]*?id: 'bar'/)
  expect(fooBlock?.[0]).toContain("lastVerified: '2026-10-01'")
  // Top-level fetchedAt was bumped to 2026-10-01.
  expect(fileContent).toMatch(/^\s*fetchedAt: '2026-10-01',/m)
})

test('rewriteModelFile: never touches registryVersion', () => {
  const { fileContent } = rewriteModelFile(SAMPLE_SOURCE, [], '2026-10-01')
  expect(fileContent).toContain("registryVersion: REGISTRY_VERSION,")
  // Even when there are no diffs, the REGISTRY_VERSION export line passes through.
  expect(fileContent).toContain("export const REGISTRY_VERSION = '0.2.0'")
})

test('rewriteModelFile: with empty diffs, only fetchedAt is bumped', () => {
  const { fileContent, diffsApplied } = rewriteModelFile(SAMPLE_SOURCE, [], '2026-10-01')
  expect(diffsApplied).toBe(0)
  // All per-model lastVerified lines are untouched.
  expect(fileContent.match(/lastVerified: '2026-09-26'/g)?.length).toBe(2)
})

test('rewriteModelFile: preserves comments and blank lines', () => {
  const withComments = `// header comment
export const REGISTRY_VERSION = '0.2.0'

export const REGISTRY: ModelRegistry = {
  registryVersion: REGISTRY_VERSION,
  fetchedAt: '2026-09-26',
  sourceNote: 'test',
  openRouterMarkup: 1.05,
  models: [
    {
      id: 'foo',
      provider: 'openai',
      displayName: 'Foo',
      family: 'foo',
      status: 'active',
      contextWindow: 100_000,
      inputPricePer1M: 1.0,  // current rate
      outputPricePer1M: 2.0,
      sourceUrl: 'https://example.com',
      lastVerified: '2026-09-26',
    },
  ],
}
`
  const { fileContent } = rewriteModelFile(
    withComments,
    [{ modelId: 'foo', displayName: 'Foo', field: 'inputPricePer1M', before: 1.0, after: 2.5 }],
    '2026-10-01',
  )
  expect(fileContent).toContain('// header comment')
  expect(fileContent).toContain('// current rate')
})