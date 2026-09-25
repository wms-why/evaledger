/**
 * Grok (xAI) pricing page scraper.
 *
 * Source: https://docs.x.ai/docs/models
 *
 * The page is a fully client-rendered SPA — no `<table>` elements. Each
 * model is rendered as a `<div class="bg-card ... rounded-2xl">` whose
 * textContent follows this pattern:
 *
 *   "<ModelName>...<Description>...Context<N>k tokensInput$X.XX / 1M
 *    tokensOutput$Y.YY / 1M tokens"
 *
 * We target the bg-card divs, then regex-extract the model name, context
 * window, and input/output prices.
 */
import type { Browser } from '@playwright/test'
import { dumpFailureArtifacts, newPage } from '../browser.ts'
import { parseContextWindow, parsePrice } from '../normalize.ts'
import type { ProviderResult, ScrapedModel } from '../types.ts'

const URL = 'https://docs.x.ai/docs/models'

export async function scrapeGrok(browser: Browser): Promise<ProviderResult> {
  const { context, page } = await newPage(browser)
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    // SPA: wait for the bg-card containers to appear after client hydration.
    await page
      .waitForFunction(
        () => document.querySelectorAll('[class*="bg-card"][class*="rounded-2xl"]').length > 0,
        undefined,
        { timeout: 30_000 },
      )
      .catch(() => {})
    const rows = await extractRows(page)
    return {
      provider: 'grok',
      url: URL,
      ok: true,
      scrapedAt: new Date().toISOString(),
      models: rows,
    }
  } catch (err) {
    await dumpFailureArtifacts(page, 'grok')
    return {
      provider: 'grok',
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
    const cards = document.querySelectorAll('[class*="bg-card"][class*="rounded-2xl"]')
    return Array.from(cards).map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim())
  })

  const out: ScrapedModel[] = []
  const seen = new Set<string>()
  for (const text of raw) {
    const parsed = parseModelCard(text)
    if (!parsed) continue
    // Skip non-LLM cards (Voice API, Image API) — they don't have $/1M tokens pricing.
    if (parsed.input === null || parsed.output === null) continue
    if (seen.has(parsed.name)) continue
    seen.add(parsed.name)
    out.push({
      provider: 'grok',
      scrapedName: parsed.name,
      inputPricePer1M: parsed.input,
      outputPricePer1M: parsed.output,
      cachedInputPricePer1M: null,
      contextWindow: parsed.context,
      raw: { cardText: text.slice(0, 200) },
    })
  }
  return out
}

interface ParsedCard {
  name: string
  input: number | null
  output: number | null
  context: number | null
}

function parseModelCard(text: string): ParsedCard | null {
  if (!text) return null
  // Model name: "[A-Z][A-Za-z]+ \d+(\.\d+)?" at the start.
  const nameMatch = text.match(/^([A-Z][A-Za-z]+(?:\s+\d+(?:\.\d+)?)?)/)
  if (!nameMatch) return null
  const name = nameMatch[1]
  if (!name) return null

  const inputMatch = text.match(/Input\s*\$\s*([\d.]+)\s*\/\s*1M\s*tokens/i)
  const outputMatch = text.match(/Output\s*\$\s*([\d.]+)\s*\/\s*1M\s*tokens/i)
  const ctxMatch = text.match(/Context\s*([\d.,]+\s*[kKmM]?)\s*tokens?/i)

  return {
    name,
    input: inputMatch ? parsePrice(inputMatch[1]) : null,
    output: outputMatch ? parsePrice(outputMatch[1]) : null,
    context: ctxMatch ? parseContextWindow(ctxMatch[1]) : null,
  }
}

