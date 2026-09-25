/**
 * OpenAI pricing page scraper.
 *
 * Source: https://platform.openai.com/docs/pricing
 *
 * The pricing page currently renders one `<table>` per model family. Each
 * table has a 2-row header (top: "Short context" / "Long context"; below:
 * "Model / Input / Cached input / Cache writes / Output" twice) and one data
 * row per model. We capture the **short-context** column (cells 1–4 of each
 * data row), which is the standard tier most users see.
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
    // Need at least 2 header rows + 1 data row.
    if (table.length < 3) continue
    const headerRow = table[1] // [Model, Input, Cached input, Cache writes, Output, Input, ...]
    const modelIdx = headerRow.findIndex((c) => /^Model$/i.test(c))
    if (modelIdx < 0) continue
    const expected = modelIdx + 5 // input, cached input, cache writes, output
    for (let i = 2; i < table.length; i++) {
      const cells = table[i]
      if (!cells || cells.length < expected) continue
      const scrapedName = cells[modelIdx]
      if (!scrapedName) continue
      out.push({
        provider: 'openai',
        scrapedName,
        inputPricePer1M: parsePrice(cells[modelIdx + 1]),
        outputPricePer1M: parsePrice(cells[modelIdx + 4]),
        cachedInputPricePer1M: parsePrice(cells[modelIdx + 2]),
        contextWindow: null,
        raw: { row: cells },
      })
    }
  }
  return out
}

