/**
 * OpenAI pricing page scraper.
 *
 * Source: https://platform.openai.com/docs/pricing
 *
 * The pricing page renders one `<table>` per price band. Each table has a
 * 2-row header (top: a band caption like "Prompt caching"; below: the column
 * names) and one data row per model.
 *
 * The columns are matched **by header name**, not by fixed offsets: the page
 * has shipped several layouts (`Model / Input / Output / Cached input /
 * 30m write / 12h write` for the GPT-6 tables, `Model / Input / Output /
 * Cached input` for the rest, `Model / Modality / Input / Output / …` for the
 * realtime and image tables), and a positional reader silently reads the
 * wrong column — which then lands in a published price. A table without a
 * `Model` column or without any price column is not a price table and is
 * skipped.
 */
import type { Browser } from '@playwright/test'
import { dumpFailureArtifacts, newPage } from '../browser.ts'
import { parsePrice } from '../normalize.ts'
import type { ProviderResult, ScrapedModel } from '../types.ts'

const URL = 'https://platform.openai.com/docs/pricing'

export async function scrapeOpenAI(browser: Browser): Promise<ProviderResult> {
  const { context, page } = await newPage(browser)
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    const rows = await extractRows(page)
    return {
      provider: 'openai',
      url: URL,
      ok: true,
      scrapedAt: new Date().toISOString(),
      models: rows,
    }
  } catch (err) {
    await dumpFailureArtifacts(page, 'openai')
    return {
      provider: 'openai',
      url: URL,
      ok: false,
      scrapedAt: new Date().toISOString(),
      models: [],
      error: String(err),
    }
  } finally {
    await context.close()
  }
}

/** Column indexes of one table, resolved from its header row. */
interface Columns {
  model: number
  input: number
  output: number
  cachedInput: number
}

/** The resolved columns of a table plus the row the header sits on. */
interface ResolvedTable {
  columns: Columns
  headerIndex: number
}

async function extractRows(page: import('@playwright/test').Page): Promise<ScrapedModel[]> {
  const raw = await page.$$eval('table', (tables) =>
    tables.map((t) => {
      const rows = Array.from(t.querySelectorAll('tr')).map((r) =>
        Array.from(r.querySelectorAll('th,td')).map((c) => (c.textContent ?? '').trim()),
      )
      return rows
    }),
  )
  const out: ScrapedModel[] = []
  for (const table of raw) {
    const resolved = resolveColumns(table)
    if (!resolved) continue
    const { columns, headerIndex } = resolved
    for (const cells of table.slice(headerIndex + 1)) {
      if (!cells || cells.length <= columns.model) continue
      const scrapedName = cells[columns.model]
      if (!scrapedName) continue
      out.push({
        provider: 'openai',
        scrapedName,
        inputPricePer1M: priceAt(cells, columns.input),
        outputPricePer1M: priceAt(cells, columns.output),
        cachedInputPricePer1M: priceAt(cells, columns.cachedInput),
        contextWindow: null,
        raw: { row: cells },
      })
    }
  }
  return out
}

/**
 * Resolve the column indexes of a table from its header row.
 *
 * The header row is the first row that names a `Model` column — the table
 * may have a caption row above it. Returns null when the table is not a
 * price table (no `Model` column, or no input/output column at all).
 */
function resolveColumns(table: string[][]): ResolvedTable | null {
  const headerIndex = table.findIndex((row) => row.some((cell) => /^model$/i.test(cell)))
  if (headerIndex < 0) return null
  const header = table[headerIndex]!

  const model = header.findIndex((cell) => /^model$/i.test(cell))
  const input = header.findIndex((cell) => /^input$/i.test(cell))
  const output = header.findIndex((cell) => /^output\b/i.test(cell))
  const cachedInput = header.findIndex((cell) => /^cached input$/i.test(cell))

  // A table with no price column (e.g. "Model / Price per minute") is not
  // a per-token price table — skip it rather than mislabel a price.
  if (input < 0 && output < 0) return null

  return { columns: { model, input, output, cachedInput }, headerIndex }
}

/** Read one cell as a price; a missing column yields null. */
function priceAt(cells: string[], index: number): number | null {
  if (index < 0 || index >= cells.length) return null
  return parsePrice(cells[index])
}

