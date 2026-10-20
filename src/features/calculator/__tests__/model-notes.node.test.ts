import { describe, expect, it } from 'vitest'
import { MODEL_NOTES_ZH, modelNote } from '@/features/calculator/model-notes'
import { REGISTRY } from '@/features/calculator/model-prices'

describe('MODEL_NOTES_ZH', () => {
  it('translates every registry note into Chinese', () => {
    const missing = REGISTRY.models
      .filter((m) => m.note)
      .filter((m) => !MODEL_NOTES_ZH[m.id])
      .map((m) => m.id)
    expect(missing).toEqual([])
  })

  it('has no stale keys that the registry does not know', () => {
    const ids = new Set(REGISTRY.models.map((m) => m.id))
    const stale = Object.keys(MODEL_NOTES_ZH).filter((id) => !ids.has(id))
    expect(stale).toEqual([])
  })

  it('covers every model that carries a note', () => {
    const withNote = REGISTRY.models.filter((m) => m.note)
    expect(withNote.length).toBeGreaterThan(0)
    expect(Object.keys(MODEL_NOTES_ZH).length).toBe(withNote.length)
  })

  it('keeps every price figure and date from the English note', () => {
    // A translation must never round, convert or re-order a number.
    const TOKENS = /\$[\d]+(?:\.\d+)?|¥[\d]+(?:\.\d+)?|\d{4}-\d{2}-\d{2}|\d+(?:\.\d+)?×|\d+k\b/g
    for (const model of REGISTRY.models) {
      if (!model.note) continue
      const zh = MODEL_NOTES_ZH[model.id]
      for (const token of model.note.match(TOKENS) ?? []) {
        expect(zh, `${model.id} is missing ${token}`).toContain(token)
      }
    }
  })

  it('translates rather than copies the English wording', () => {
    for (const model of REGISTRY.models) {
      if (!model.note) continue
      const zh = MODEL_NOTES_ZH[model.id]
      expect(zh, `${model.id} was not translated`).not.toBe(model.note)
      expect(zh, `${model.id} is not Chinese`).toMatch(/[一-鿿]/)
    }
  })
})

describe('modelNote', () => {
  it('returns the Chinese note for the zh locale', () => {
    const model = REGISTRY.models.find((m) => m.id === 'gpt-5.6-sol')!
    expect(modelNote(model, 'zh')).toBe(MODEL_NOTES_ZH['gpt-5.6-sol'])
    expect(modelNote(model, 'zh')).not.toBe(model.note)
  })

  it('returns the registry note for the en locale', () => {
    const model = REGISTRY.models.find((m) => m.id === 'gpt-5.6-sol')!
    expect(modelNote(model, 'en')).toBe(model.note)
  })

  it('returns undefined for a model without a note', () => {
    const model = REGISTRY.models.find((m) => m.id === 'gpt-6-astra')!
    expect(model.note).toBeUndefined()
    expect(modelNote(model, 'en')).toBeUndefined()
    expect(modelNote(model, 'zh')).toBeUndefined()
  })

  it('resolves a -via-openrouter id to its base model note', () => {
    const base = REGISTRY.models.find((m) => m.id === 'gpt-5')!
    const clone = { ...base, id: `${base.id}-via-openrouter` }
    expect(modelNote(clone, 'zh')).toBe(MODEL_NOTES_ZH['gpt-5'])
    expect(modelNote(clone, 'zh')).toBe(modelNote(base, 'zh'))
  })

  it('keeps the successor name that each model actually names', () => {
    expect(modelNote(REGISTRY.models.find((m) => m.id === 'claude-opus-4.5')!, 'zh')).toContain(
      'Opus 5.5',
    )
    expect(
      modelNote(REGISTRY.models.find((m) => m.id === 'claude-sonnet-4.6')!, 'zh'),
    ).toContain('Sonnet 5')
    expect(modelNote(REGISTRY.models.find((m) => m.id === 'claude-fable-5')!, 'zh')).toContain(
      'Fable 5.1',
    )
    expect(modelNote(REGISTRY.models.find((m) => m.id === 'grok-4')!, 'zh')).toContain('Grok 4.7')
    expect(modelNote(REGISTRY.models.find((m) => m.id === 'deepseek-chat')!, 'zh')).toContain(
      'DeepSeek V4',
    )
  })
})
