import { test, expect } from 'vitest'
import { DISPLAY_NAME_TO_ID, resolveModelId } from '../mapping'
import { REGISTRY } from '@/features/calculator/model-prices'

test('every DISPLAY_NAME_TO_ID value is a real REGISTRY id', () => {
  // Catch typos / renames: if you add a mapping for "Foo Bar 9", there
  // must already be an entry in REGISTRY with id="foo-bar-9".
  const knownIds = new Set(REGISTRY.models.map((m) => m.id))
  for (const [scrapedName, modelId] of Object.entries(DISPLAY_NAME_TO_ID)) {
    expect(scrapedName, `scrapedName should be non-empty`).toBeTruthy()
    expect(modelId, `modelId for "${scrapedName}" should be non-empty`).toBeTruthy()
    expect(
      knownIds.has(modelId),
      `Mapping "${scrapedName}" → "${modelId}" but REGISTRY has no such id`,
    ).toBe(true)
  }
})

test('resolveModelId returns null for unmapped names', () => {
  expect(resolveModelId('Definitly Not Real 9.9')).toBeNull()
  expect(resolveModelId('')).toBeNull()
})

test('resolveModelId matches every mapped entry', () => {
  for (const [scrapedName, modelId] of Object.entries(DISPLAY_NAME_TO_ID)) {
    expect(resolveModelId(scrapedName)).toBe(modelId)
  }
})
