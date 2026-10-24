import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { REGISTRY } from '@/features/calculator/model-prices'

/**
 * The calculator copy cannot quote a price the registry does not carry.
 *
 * `copy.ts` resolves every number it prints out of the price registry, and
 * every lookup falls back to `?? 0` — so a model that leaves the registry
 * would print a **$0.00 price** in the FAQ, the TL;DR strip and the tips,
 * and the page would say a model is free.
 *
 * Nothing in the registry's own tests catches that: the model is simply
 * gone, and every other number on the page is still correct. So the ids
 * the copy names are checked against the registry here, and the check reads
 * the SOURCE — a model added to the copy without a registry row fails the
 * build the moment the copy is written.
 */

/** The copy module. */
const COPY_PATH = fileURLToPath(new URL('../copy.ts', import.meta.url))

/** Every registry id. */
const registryIds = new Set(REGISTRY.models.map((model) => model.id))

/**
 * The model ids `copy.ts` asks the registry for.
 *
 * The three lookups are the only way the module reaches a price:
 * `rates(id)`, `offPeakRates(id)` and `cacheWriteRate(id, window)`.
 */
const LOOKUP = /\b(?:rates|offPeakRates|cacheWriteRate)\(\s*'([^']+)'/g

describe('the calculator copy', () => {
  const source = readFileSync(COPY_PATH, 'utf8')
  const ids = [...new Set([...source.matchAll(LOOKUP)].map((match) => match[1]))]

  it('names at least one model', () => {
    expect(ids.length).toBeGreaterThan(0)
  })

  it('only asks for models the registry carries', () => {
    const missing = ids.filter((id) => !registryIds.has(id))
    expect(
      missing,
      'these models are quoted by the copy but have no registry row — their ' +
        'prices would be printed as $0.00',
    ).toEqual([])
  })

  it('never has to fall back to a zero price', () => {
    // The `?? 0` fallbacks in `copy.ts` are the hazard: a model that leaves
    // the registry would print a $0.00 price. They are unreachable only as
    // long as every model the copy names is IN the registry AND publishes a
    // rate. So the check is on the resolved rate, not on the id.
    const missingRates: string[] = []
    for (const id of ids) {
      const model = REGISTRY.models.find((m) => m.id === id)
      if (!model) {
        missingRates.push(id)
        continue
      }
      if (model.inputPricePer1M == null || model.outputPricePer1M == null) {
        missingRates.push(id)
      }
    }
    expect(
      missingRates,
      'these models are quoted by the copy but publish no rate — the ' +
        '`?? 0` fallback would print $0.00 for them',
    ).toEqual([])
  })
})
