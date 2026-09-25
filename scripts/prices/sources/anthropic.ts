/**
 * Anthropic pricing page scraper.
 *
 * Source: https://claude.com/pricing#api
 *
 * The page's #api anchor lands on the API tab panel (`#pricing-plans-panel-3`).
 * Inside that panel, each model is rendered as a `<div class="*modelCard*">`
 * whose textContent follows this stable pattern:
 *
 *   "<ModelName><Description?>Prompt cachingRead$0.30 / MTokWrite$3.75 / MTok
 *    Input$3 / MTokOutput$15 / MTok"
 *
 * We extract the model name (first whitespace-delimited token) and the four
 * per-million-token prices via regex. The 5-minute TTL cache-write tier is
 * captured in `raw`; the 1-hour tier stays human-only.
 */
import type { Browser } from '@playwright/test'
import { dumpFailureArtifacts, newPage } from '../browser.ts'
import { parsePrice } from '../normalize.ts'
import type { ProviderResult, ScrapedModel } from '../types.ts'

const URL = 'https://claude.com/pricing#pricing-plans-panel-3'

export async function scrapeAnthropic(browser: Browser): Promise<ProviderResult> {
  const { context, page } = await newPage(browser)
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    // The API tab content is rendered client-side after the tab is activated;
    // wait for at least one modelCard to appear inside the panel.
    await page
      .waitForSelector('#pricing-plans-panel-3 [class*="modelCard"]', { timeout: 30_000 })
      .catch(() => {})
    const rows = await extractRows(page)
    return {
      provider: 'anthropic',
      url: URL,
      ok: true,
      scrapedAt: new Date().toISOString(),
      models: rows,
    }
  } catch (err) {
    await dumpFailureArtifacts(page, 'anthropic')
    return {
      provider: 'anthropic',
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
    const panel = document.getElementById('pricing-plans-panel-3')
    if (!panel) return []
    const cards = panel.querySelectorAll('[class*="modelCard"]')
    return Array.from(cards).map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim())
  })

  const out: ScrapedModel[] = []
  for (const text of raw) {
    const parsed = parseModelCard(text)
    if (!parsed) continue
    out.push({
      provider: 'anthropic',
      scrapedName: parsed.name,
      inputPricePer1M: parsed.input,
      outputPricePer1M: parsed.output,
      cachedInputPricePer1M: parsed.cacheRead,
      contextWindow: null,
      raw: { cacheWrite5min: parsed.cacheWrite, cardText: text.slice(0, 200) },
    })
  }
  return out
}

interface ParsedCard {
  name: string
  input: number | null
  output: number | null
  cacheRead: number | null
  cacheWrite: number | null
}

/**
 * Pull the four prices out of a modelCard text block.
 *
 * The format is "ModelName<...>Read$X / MTokWrite$Y / MTokInput$A / MTokOutput$B / MTok".
 * We rely on each price being preceded by a stable label token; this matches
 * what the page actually renders today.
 */
function parseModelCard(text: string): ParsedCard | null {
  if (!text) return null
  // The model name is the leading Capitalized-Word sequence at the start,
  // optionally followed by a space + version (e.g. "Fable 5.1", "Opus 5.5",
  // "Sonnet 5", "Haiku 4.5"). Description text starts with a lowercase or
  // generic word ("Next", "Daily", "Fastest", ...) — we stop there.
  const nameMatch = text.match(/^([A-Z][A-Za-z]*(?:\s+\d+(?:\.\d+)*)?)/)
  if (!nameMatch) return null
  const name = nameMatch[1]
  if (!name) return null

  // Each label has a single trailing dollar amount. Match the FIRST number
  // that follows each label.
  const cacheRead = firstPriceAfter(text, /Read\s*\$/i)
  const cacheWrite = firstPriceAfter(text, /Write\s*\$/i)
  const input = firstPriceAfter(text, /Input\s*\$/i)
  const output = firstPriceAfter(text, /Output\s*\$/i)

  if (input === null && output === null) return null
  return { name, input, output, cacheRead, cacheWrite }
}

function firstPriceAfter(text: string, label: RegExp): number | null {
  const m = text.match(new RegExp(`${label.source}\\s*([\\d.]+)`))
  if (!m) return null
  return parsePrice(m[1])
}

