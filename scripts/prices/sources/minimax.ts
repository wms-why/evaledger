/**
 * MiniMax pricing page scraper.
 *
 * Source: https://platform.minimax.io/docs/pricing/overview
 *
 * The LLM section (`section[data-pricing-title="LLM"]`) holds three tables:
 *   1. MiniMax-M3.1-Flash — outside the tab strip, flat rate.
 *   2. MiniMax-M3 Standard — the `standard` tab panel, two rows (≤512k input,
 *      >512k input).
 *   3. MiniMax-M3 Priority — the `priority` tab panel, the same two rows at
 *      1.5× (`service_tier: "priority"`).
 *
 * Both tab panels are in the DOM (the inactive one just carries `hidden`), so
 * we select the standard panel by `aria-labelledby` rather than by whatever
 * tab happens to be open — the page's default tab is not something a price
 * feed should depend on.
 *
 * We capture the **standard tier, ≤512k input** row. The >512k rows are a
 * `longContext` tier and `service_tier` priority pricing is not modelled in
 * REGISTRY — both stay human-only, same as the peak/off-peak split for
 * DeepSeek.
 */
import type { Browser } from '@playwright/test'
import { dumpFailureArtifacts, newPage } from '../browser.ts'
import { parsePrice } from '../normalize.ts'
import type { ProviderResult, ScrapedModel } from '../types.ts'

const URL = 'https://platform.minimax.io/docs/pricing/overview'

export async function scrapeMiniMax(browser: Browser): Promise<ProviderResult> {
  const { context, page } = await newPage(browser)
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    const rows = await extractRows(page)
    return {
      provider: 'minimax',
      url: URL,
      ok: true,
      scrapedAt: new Date().toISOString(),
      models: rows,
    }
  } catch (err) {
    await dumpFailureArtifacts(page, 'minimax')
    return {
      provider: 'minimax',
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

interface RawLlmRow {
  /** Model id as printed on the page, e.g. "MiniMax-M3". */
  model: string
  /** The "≤ 512k input tokens" qualifier under the model name, if any. */
  tierNote: string
  /** Price cells after the model cell. */
  prices: string[]
}

async function extractRows(page: import('@playwright/test').Page): Promise<ScrapedModel[]> {
  const raw = await page.$$eval('section[data-pricing-title="LLM"]', (sections) => {
    const scope = sections[0]
    if (!scope) return []
    const tables = Array.from(scope.querySelectorAll('table')).filter((t) => {
      const panel = t.closest('[role="tabpanel"]')
      // Tables outside the tab strip (M3.1 Flash) are always in scope; inside
      // the strip, only the standard panel is — priority is 1.5×.
      if (!panel) return true
      return panel.getAttribute('aria-labelledby') !== 'priority'
    })

    return tables.flatMap((table) =>
      Array.from(table.querySelectorAll('tbody tr')).map((tr) => {
        const cells = Array.from(tr.querySelectorAll('td')).map((c) => (c.textContent ?? '').trim())
        const modelCell = tr.querySelector('td')
        const strong = (modelCell?.querySelector('strong')?.textContent ?? '').trim()
        const model = strong || (cells[0] ?? '').split(/[≤>]/)[0]!.trim()
        // textContent has no whitespace around the <br>, so strip the model
        // name out of the cell to recover the tier qualifier.
        const tierNote = (cells[0] ?? '').replace(model, '').replace(/\s+/g, ' ').trim()
        return { model, tierNote, prices: cells.slice(1) }
      }),
    )
  })

  const seen = new Set<string>()
  const out: ScrapedModel[] = []
  for (const row of raw as RawLlmRow[]) {
    if (!/^MiniMax-/i.test(row.model)) continue
    // "> 512k input tokens" rows are the long-context tier — human-only.
    if (row.tierNote.startsWith('>')) continue
    if (seen.has(row.model)) continue
    seen.add(row.model)
    out.push({
      provider: 'minimax',
      scrapedName: row.model,
      inputPricePer1M: parsePrice(row.prices[0]),
      outputPricePer1M: parsePrice(row.prices[1]),
      cachedInputPricePer1M: parsePrice(row.prices[2]),
      // The page publishes no context-window column for LLMs; 1M is total
      // input + output and lives in the model docs, so we leave it human-only.
      contextWindow: null,
      raw: { tierNote: row.tierNote, prices: row.prices },
    })
  }
  return out
}
