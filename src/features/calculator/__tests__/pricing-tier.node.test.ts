import { describe, expect, it } from 'vitest'
import { DEFAULT_PRESET_ID, OUTPUT_PRESETS, findPreset } from '@/features/calculator/pricing-tier'

describe('OUTPUT_PRESETS', () => {
  it('exposes the 5 standard use-case buckets', () => {
    expect(OUTPUT_PRESETS.map((p) => p.id)).toEqual([
      'classification',
      'rag',
      'chat',
      'full',
      'long',
    ])
  })

  it('ratios are non-decreasing and bounded', () => {
    const ratios = OUTPUT_PRESETS.map((p) => p.ratio)
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i]).toBeGreaterThanOrEqual(ratios[i - 1])
    }
    expect(Math.min(...ratios)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...ratios)).toBeLessThanOrEqual(10)
  })

  it('every preset has bilingual labels + descriptions', () => {
    for (const p of OUTPUT_PRESETS) {
      expect(p.label.length).toBeGreaterThan(0)
      expect(p.labelZh.length).toBeGreaterThan(0)
      expect(p.description.length).toBeGreaterThan(0)
      expect(p.descriptionZh.length).toBeGreaterThan(0)
    }
  })

  it('DEFAULT_PRESET_ID resolves to a real preset', () => {
    expect(findPreset(DEFAULT_PRESET_ID).id).toBe(DEFAULT_PRESET_ID)
  })

  it('findPreset falls back to the second preset when id is unknown', () => {
    expect(findPreset('nonexistent').id).toBe('rag')
  })
})