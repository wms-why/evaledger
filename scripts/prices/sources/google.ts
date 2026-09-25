/**
 * Google (Gemini) pricing page scraper.
 *
 * Source: https://ai.google.dev/gemini-api/docs/pricing
 *
 * The page renders one `<table class="pricing-table">` per (model × tier)
 * combination, grouped under a heading like "Gemini 3.8 Flash". Tiers:
 * standard, batch, flex, priority. We capture the **standard** tier only —
 * the others are bulk-processing modes and not on REGISTRY.
 *
 * Price cells often look like "$0.75 through December 31, 2026. $1.50
 * starting January 1, 2027." — we take the **first** number mentioned (the
 * current rate); later-scheduled rate changes stay human-only.
 */
import type { Browser } from '@playwright/test'
import { dumpFailureArtifacts, newPage } from '../browser.ts'
import { parsePrice } from '../normalize.ts'
import type { ProviderResult, ScrapedModel } from '../types.ts'

const URL = 'https://ai.google.dev/gemini-api/docs/pricing'

export async function scrapeGoogle(browser: Browser): Promise<ProviderResult> {
  const { context, page } = await newPage(browser)
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    const rows = await extractRows(page)
    return {
      provider: 'google',
      url: URL,
      ok: true,
      scrapedAt: new Date().toISOString(),
      models: rows,
    }
  } catch (err) {
    await dumpFailureArtifacts(page, 'google')
    return {
      provider: 'google',
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
  const raw = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table.pricing-table'))
    const docOrder: Element[] = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
    while (walker.nextNode()) docOrder.push(walker.currentNode as Element)
    return tables.map((t) => {
      // The id lives on the table's *grandparent* (tabpanel-standard, etc.).
      const id = t.parentElement?.parentElement?.id ?? ''
      const rows = Array.from(t.querySelectorAll('tr')).map((r) =>
        Array.from(r.querySelectorAll('th,td')).map((c) =>
          (c.textContent ?? '').trim().replace(/\s+/g, ' '),
        ),
      )
      // Find the most recent preceding heading in document order.
      const tIdx = docOrder.indexOf(t)
      let heading = ''
      for (let k = tIdx - 1; k >= 0 && heading === ''; k--) {
        const el = docOrder[k]
        if (/^H[1-6]$/.test(el.tagName)) {
          const txt = (el.textContent ?? '').trim()
          if (txt) heading = txt
        }
      }
      return { id, heading, rows }
    })
  })

  const out: ScrapedModel[] = []
  for (const entry of raw) {
    if (entry.id !== 'tabpanel-standard') continue
    const modelName = entry.heading.trim()
    if (!modelName) continue
    const pricing = parseStandardTierPricing(entry.rows)
    out.push({
      provider: 'google',
      scrapedName: modelName,
      inputPricePer1M: pricing.input,
      outputPricePer1M: pricing.output,
      cachedInputPricePer1M: pricing.cached,
      contextWindow: null,
      raw: { rows: entry.rows },
    })
  }
  return out
}

interface StandardTierPricing {
  input: number | null
  output: number | null
  cached: number | null
}

/** Look up the first numeric price in a labelled row. */
function findPrice(rows: string[][], labelRe: RegExp, column = 2): number | null {
  for (const row of rows) {
    if (!row[0]) continue
    if (!labelRe.test(row[0])) continue
    const cell = row[column] ?? ''
    if (!cell) continue
    return parsePrice(cell)
  }
  return null
}

function parseStandardTierPricing(rows: string[][]): StandardTierPricing {
  return {
    input: findPrice(rows, /Input price/i),
    output: findPrice(rows, /Output price/i),
    cached: findPrice(rows, /Context caching price/i),
  }
}

