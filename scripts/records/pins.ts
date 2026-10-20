/**
 * `pnpm records:pins` — print the record ledger as it currently stands.
 *
 * The ledger (`src/features/records/ledger.ts`) pins what we published: a
 * record's scores, its caveats, its identity, and — for retired records — its
 * historical price line. This script reads the live registries and prints the
 * ledger entries that match them, so adding a record (a new checkpoint) or
 * logging a correction is a copy-paste job instead of a typing job.
 *
 * It never writes anything. The ledger is a curated file: a human decides
 * which record this is, what it supersedes, and when it retired.
 *
 * Usage:
 *   pnpm records:pins             # every record
 *   pnpm records:pins deepseek    # only records whose label / id matches
 */

import { REGISTRY } from '../../src/features/calculator/model-prices.ts'
import { LEADERBOARD } from '../../src/features/leaderboard/models.ts'
import type { RecordEntry } from '../../src/features/records/types.ts'

const filter = process.argv[2]?.toLowerCase() ?? ''

function matches(entry: RecordEntry): boolean {
  if (!filter) return true
  return (
    entry.label.toLowerCase().includes(filter) ||
    (entry.priceId ?? '').toLowerCase().includes(filter) ||
    (entry.scoreId ?? '').toLowerCase().includes(filter)
  )
}

function quote(value: string): string {
  return `'${value.replace(/'/g, "\\'")}'`
}

const entries: RecordEntry[] = []
const claimedPriceIds = new Set<string>()

// One entry per leaderboard row — a record's score side, with its price row.
// The pin shape lives in `src/features/records/pins.ts`; it is recomputed
// here (rather than imported) because that module uses the `@/` alias, which
// plain node does not resolve. The guard test
// (`src/features/records/__tests__/records.node.test.ts`) is the source of
// truth — a stale paste here fails the build.
for (const model of LEADERBOARD.models) {
  const live = { scores: {} as Record<string, number>, notes: {} as Record<string, string> }
  for (const s of model.scores) {
    live.scores[s.benchmark] = s.score
    if (s.note) live.notes[s.benchmark] = s.note
  }
  const entry: RecordEntry = {
    label: model.displayName,
    scoreId: model.id,
    sourceUrl: model.scores[0]?.sourceUrl ?? '',
    introduced: model.releaseDate,
    scores: live.scores,
    notes: live.notes,
    identity: { displayName: model.displayName, version: model.version },
  }
  if (model.priceId) {
    entry.priceId = model.priceId
    claimedPriceIds.add(model.priceId)
    const price = REGISTRY.models.find((m) => m.id === model.priceId)
    if (price) {
      entry.sourceUrl = price.sourceUrl
      entry.priceIdentity = { displayName: price.displayName }
      // A retired record's price line is a historical fact — pin it.
      if (price.status !== 'active') {
        entry.prices = {
          input: price.inputPricePer1M,
          output: price.outputPricePer1M,
          context: price.contextWindow,
          ...(price.cachedInputPricePer1M != null
            ? { cached: price.cachedInputPricePer1M }
            : {}),
        }
      }
    }
  }
  entries.push(entry)
}

// Price rows that have no leaderboard row of their own.
for (const model of REGISTRY.models) {
  if (claimedPriceIds.has(model.id)) continue
  const entry: RecordEntry = {
    label: model.displayName,
    priceId: model.id,
    sourceUrl: model.sourceUrl,
    priceIdentity: { displayName: model.displayName },
  }
  if (model.status !== 'active') {
    entry.prices = {
      input: model.inputPricePer1M,
      output: model.outputPricePer1M,
      context: model.contextWindow,
      ...(model.cachedInputPricePer1M != null ? { cached: model.cachedInputPricePer1M } : {}),
    }
  }
  entries.push(entry)
}

const out: string[] = []
for (const entry of entries) {
  if (!matches(entry)) continue
  const lines: string[] = []
  lines.push('  {')
  lines.push(`    label: ${quote(entry.label)},`)
  if (entry.priceId) lines.push(`    priceId: ${quote(entry.priceId)},`)
  if (entry.scoreId) lines.push(`    scoreId: ${quote(entry.scoreId)},`)
  if (entry.introduced) lines.push(`    introduced: ${quote(entry.introduced)},`)
  lines.push(`    sourceUrl: ${quote(entry.sourceUrl)},`)
  if (entry.priceIdentity) {
    lines.push(`    priceIdentity: { displayName: ${quote(entry.priceIdentity.displayName)} },`)
  }
  if (entry.identity) {
    lines.push(
      `    identity: { displayName: ${quote(entry.identity.displayName)}, version: ${quote(entry.identity.version ?? '')} },`,
    )
  }
  if (entry.scores && Object.keys(entry.scores).length > 0) {
    lines.push('    scores: {')
    for (const [key, value] of Object.entries(entry.scores)) {
      lines.push(`      ${quote(key)}: ${value},`)
    }
    lines.push('    },')
  }
  if (entry.notes && Object.keys(entry.notes).length > 0) {
    lines.push('    notes: {')
    for (const [key, value] of Object.entries(entry.notes)) {
      lines.push(`      ${quote(key)}: ${quote(value)},`)
    }
    lines.push('    },')
  }
  if (entry.prices) {
    const parts = [
      `input: ${entry.prices.input}`,
      `output: ${entry.prices.output}`,
      ...(entry.prices.cached != null ? [`cached: ${entry.prices.cached}`] : []),
      `context: ${entry.prices.context}`,
    ]
    lines.push(`    prices: { ${parts.join(', ')} },`)
  }
  lines.push('  },')
  out.push(lines.join('\n'))
}

console.log(out.join('\n'))
console.log(`\n// ${entries.length} records (${out.length} shown)`)
console.log('// Price pins for retired records are added by hand:')
console.log("//   prices: { input: 0.3, output: 1.2, cached: 0.006, context: 1000000 },")
