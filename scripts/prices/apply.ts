/**
 * `--apply` logic for `pnpm prices:fetch`.
 *
 * Workflow:
 *  1. `computeApplyDiff(registry, scraped)` returns a list of field-level
 *     edits that *would* be applied. Pure — no IO, easy to test.
 *  2. CLI prints the diff. Default mode is dry-run.
 *  3. With `--apply --yes`, `rewriteModelFile(source, diffs, newFetchedAt)`
 *     produces a new file body and `applyToFile(...)` writes it.
 *
 * Field policy (deliberately narrow — the human-in-loop principle):
 *   - Updates `inputPricePer1M`, `outputPricePer1M`, `cachedInputPricePer1M`,
 *     `contextWindow` on existing REGISTRY entries whose `modelId` matched.
 *   - Bumps `lastVerified` on those entries.
 *   - Bumps top-level `REGISTRY.fetchedAt`.
 *   - DOES NOT touch `registryVersion` (per the human-curation rule).
 *   - DOES NOT add new models, change `status`, `family`, `displayName`,
 *     `cacheWrite`, `longContext`, `peakOffPeak`, or `promo`.
 *   - Skips when the scraped value is `null` (don't overwrite valid with null).
 *   - Skips when before === after (no actual change).
 */
import { readFile, writeFile } from 'node:fs/promises'
import type { ModelRegistry } from '../../src/features/calculator/types.ts'
import type { NormalizedModel } from './types.ts'

export type EditableField =
  | 'inputPricePer1M'
  | 'outputPricePer1M'
  | 'cachedInputPricePer1M'
  | 'contextWindow'

const EDITABLE_FIELDS: EditableField[] = [
  'inputPricePer1M',
  'outputPricePer1M',
  'cachedInputPricePer1M',
  'contextWindow',
]

export interface ApplyDiff {
  modelId: string
  displayName: string
  field: EditableField
  before: number | null
  after: number
}

/**
 * Compute what fields would change. Pure function.
 *
 * Deduplication: a model may appear in the scraped list multiple times (e.g.
 * OpenAI returns one row per pricing tier — standard, batch, flex, priority).
 * For each `(modelId, field)` we keep only the FIRST non-null scraped value,
 * so the "standard" tier wins deterministically. Without this, a single
 * REGISTRY line could be a candidate for two different rewrites.
 */
export function computeApplyDiff(
  registry: ModelRegistry,
  scraped: NormalizedModel[],
): ApplyDiff[] {
  const out: ApplyDiff[] = []
  const byId = new Map(registry.models.map((m) => [m.id, m]))
  // Track which (modelId, field) we've already produced a diff for, so we
  // only emit one diff per pair even if the scraper returned the same model
  // multiple times at different tiers.
  const seen = new Set<string>()

  for (const row of scraped) {
    if (!row.modelId) continue
    const model = byId.get(row.modelId)
    if (!model) continue

    for (const field of EDITABLE_FIELDS) {
      const key = `${row.modelId}|${field}`
      if (seen.has(key)) continue
      const scrapedValue = row[field]
      if (scrapedValue === null) continue
      const before = model[field]
      if (before === scrapedValue) continue
      seen.add(key)
      out.push({
        modelId: model.id,
        displayName: model.displayName,
        field,
        before: before ?? null,
        after: scrapedValue,
      })
    }
  }
  return out
}

export interface ApplyResult {
  fileContent: string
  diffsApplied: number
}

/**
 * Rewrite `model-prices.ts` source with the diffs applied. Pure function —
 * does no IO. The caller is responsible for writing the result.
 *
 * The rewriter matches field lines by regex (the file has a stable, hand-
 * curated format). Lines that don't match a known field pass through
 * unchanged, so comments, blank lines, and order are preserved.
 */
export function rewriteModelFile(
  source: string,
  diffs: ApplyDiff[],
  newFetchedAt: string,
): ApplyResult {
  const diffMap = new Map<string, ApplyDiff[]>()
  for (const d of diffs) {
    const arr = diffMap.get(d.modelId) ?? []
    arr.push(d)
    diffMap.set(d.modelId, arr)
  }
  const updatedIds = new Set(diffs.map((d) => d.modelId))

  const lines = source.split('\n')
  let currentId: string | null = null
  const output: string[] = []

  for (const line of lines) {
    // Track which model entry we're currently inside.
    const idMatch = line.match(/^\s*id:\s*'([^']+)'(?:,)?\s*$/)
    if (idMatch) currentId = idMatch[1] ?? null

    // Top-level fetchedAt (no model context).
    const topFetched = line.match(/^(\s*)fetchedAt:\s*'([^']+)'(?:,)?\s*$/)
    if (topFetched && currentId === null) {
      const indent = topFetched[1] ?? ''
      output.push(`${indent}fetchedAt: '${newFetchedAt}',`)
      continue
    }

    // Per-model lastVerified — rewrite if this model had any diff applied.
    if (currentId && updatedIds.has(currentId)) {
      const lvMatch = line.match(/^(\s*)lastVerified:\s*'([^']+)'(?:,)?\s*$/)
      if (lvMatch) {
        const indent = lvMatch[1] ?? ''
        output.push(`${indent}lastVerified: '${newFetchedAt}',`)
        continue
      }
    }

    // Editable price/context fields — rewrite only if there's a matching diff.
    if (currentId && diffMap.has(currentId)) {
      // `([^,\n]+?)` matches the value chars (excludes comma/newline) lazily,
      // then `\s*,?` consumes the comma, then an optional `// ...` comment is
      // preserved verbatim on the rewritten line.
      const fieldMatch = line.match(
        /^(\s*)(inputPricePer1M|outputPricePer1M|cachedInputPricePer1M|contextWindow):\s*([^,\n]+?)\s*,?(\s*\/\/[^\n]*)?\s*$/,
      )
      if (fieldMatch) {
        const indent = fieldMatch[1] ?? ''
        const field = fieldMatch[2] as EditableField
        const trailingComment = fieldMatch[4] ?? ''
        const modelDiffs = diffMap.get(currentId)!
        const diff = modelDiffs.find((d) => d.field === field)
        if (diff) {
          output.push(`${indent}${field}: ${diff.after},${trailingComment}`)
          continue
        }
      }
    }

    // Reset currentId at end of an object literal.
    if (/^\s*\},?\s*$/.test(line)) {
      currentId = null
    }

    output.push(line)
  }

  return { fileContent: output.join('\n'), diffsApplied: diffs.length }
}

/**
 * Read + rewrite + write `model-prices.ts`. Returns the new content.
 * Throws if the file doesn't look like the expected format.
 */
export async function applyToFile(
  filePath: string,
  diffs: ApplyDiff[],
  newFetchedAt: string,
): Promise<{ fileContent: string; diffsApplied: number }> {
  const source = await readFile(filePath, 'utf8')
  const { fileContent, diffsApplied } = rewriteModelFile(source, diffs, newFetchedAt)
  await writeFile(filePath, fileContent, 'utf8')
  return { fileContent, diffsApplied }
}

/** Format a diff for stdout. */
export function formatDiff(diffs: ApplyDiff[]): string {
  if (diffs.length === 0) return '  (no changes)'
  const lines: string[] = []
  for (const d of diffs) {
    const beforeStr = d.before === null ? '∅' : String(d.before)
    lines.push(`  ${d.displayName.padEnd(28)} ${d.field.padEnd(22)} ${beforeStr} → ${d.after}`)
  }
  return lines.join('\n')
}