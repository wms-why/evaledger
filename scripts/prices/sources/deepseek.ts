/**
 * DeepSeek pricing page scraper.
 *
 * Source: https://api-docs.deepseek.com/quick_start/pricing
 *
 * The pricing page renders a single `<table>` with 21 rows in this order:
 *   row 0:   MODEL header (column 0) + N model-name cells (columns 1..N)
 *   row 1..k: feature rows (BASE URL, MODEL VERSION, THINKING MODE, …)
 *   row k:   PRICING(<sup>N</sup>) spanning k+1 rows
 *   row k+1: PEAK/OFF-PEAK × INPUT/OUTPUT price cells
 *
 * We capture the **standard tier** (cache miss, peak) — REGISTRY's
 * `peakOffPeak` block stays human-only because the off-peak rules don't
 * surface on the page itself.
 */
import type { Browser } from '@playwright/test'
import { dumpFailureArtifacts, newPage } from '../browser.ts'
import { parsePrice } from '../normalize.ts'
import type { ProviderResult, ScrapedModel } from '../types.ts'

const URL = 'https://api-docs.deepseek.com/quick_start/pricing'

export async function scrapeDeepSeek(browser: Browser): Promise<ProviderResult> {
  const { context, page } = await newPage(browser)
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    const rows = await extractRows(page)
    return {
      provider: 'deepseek',
      url: URL,
      ok: true,
      scrapedAt: new Date().toISOString(),
      models: rows,
    }
  } catch (err) {
    await dumpFailureArtifacts(page, 'deepseek')
    return {
      provider: 'deepseek',
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

interface PricingCell {
  inputPeak: number | null
  inputOffPeak: number | null
  outputPeak: number | null
  outputOffPeak: number | null
}

async function extractRows(page: import('@playwright/test').Page): Promise<ScrapedModel[]> {
  const raw = await page.$$eval('table', (tables) =>
    tables.map((t) =>
      Array.from(t.querySelectorAll('tr')).map((r) =>
        Array.from(r.querySelectorAll('th,td')).map((c) => (c.textContent ?? '').trim()),
      ),
    ),
  )
  if (raw.length === 0) return []
  const table = raw[0]

  // First row: header with model names in columns 1..N.
  if (table.length < 2) return []
  const header = table[0]
  if (header.length < 2) return []
  const modelNames = header.slice(1).map((s) => s.replace(/\(\d+\)$/, '').trim())
  if (modelNames.length === 0) return []

  // Walk rows looking for the PRICING anchor, then parse the 6 sub-rows
  // (cache-hit peak/off-peak, cache-miss peak/off-peak, output peak/off-peak).
  const pricingIdx = table.findIndex((r) => /^PRICING/i.test(r[0] ?? ''))
  if (pricingIdx < 0) return []

  const pricingRows = table.slice(pricingIdx + 1, pricingIdx + 7)
  const pricing = parsePricingBlock(pricingRows, modelNames.length)

  return modelNames.map((name, i) => ({
    provider: 'deepseek',
    scrapedName: name,
    // Standard tier = cache miss + peak. Off-peak / cache-hit stay human-only.
    inputPricePer1M: pricing[i]?.inputPeak ?? null,
    outputPricePer1M: pricing[i]?.outputPeak ?? null,
    cachedInputPricePer1M: null,
    contextWindow: null,
    raw: { pricing: pricing[i] },
  }))
}

function parsePricingBlock(rows: string[][], colCount: number): PricingCell[] {
  // Initialize all columns; we'll fill as we walk.
  const out: PricingCell[] = Array.from({ length: colCount }, () => ({
    inputPeak: null,
    inputOffPeak: null,
    outputPeak: null,
    outputOffPeak: null,
  }))

  let section: 'cacheHit' | 'cacheMiss' | 'output' | null = null
  for (const row of rows) {
    const label = (row[0] ?? '').toUpperCase()
    const isOffPeak = row.some((c) => /^OFF-PEAK$/i.test(c))
    const isPeak = row.some((c) => /^PEAK$/i.test(c))

    if (/CACHE\s*HIT/i.test(label)) section = 'cacheHit'
    else if (/CACHE\s*MISS/i.test(label)) section = 'cacheMiss'
    else if (/OUTPUT/i.test(label)) section = 'output'

    if (!section) continue
    if (!isOffPeak && !isPeak) continue

    // Prices live in columns >= 1; first cell may be the period label
    // ("OFF-PEAK" / "PEAK"), subsequent cells are per-model prices.
    // We can't tell exactly which cell is the period label and which are
    // prices without per-row shape knowledge — so we collect every parseable
    // number cell and assign them in column order.
    const priceCells: number[] = []
    for (let c = 1; c < row.length; c++) {
      const n = parsePrice(row[c])
      if (n !== null) priceCells.push(n)
    }
    // The prices for this row are at the tail of priceCells in column order.
    // Period label (if present) is a non-numeric word, so by the time we
    // filter to numeric cells we have exactly N prices for N models.
    const prices = priceCells.slice(-colCount)
    for (let i = 0; i < colCount; i++) {
      const v = prices[i]
      if (v === undefined) continue
      if (section === 'cacheMiss' && isPeak) out[i].inputPeak = v
      else if (section === 'cacheMiss' && isOffPeak) out[i].inputOffPeak = v
      else if (section === 'output' && isPeak) out[i].outputPeak = v
      else if (section === 'output' && isOffPeak) out[i].outputOffPeak = v
    }
  }
  return out
}

