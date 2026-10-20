/**
 * The registry of release sources.
 *
 * One entry per vendor, one file per vendor — same layout as
 * `scripts/prices/sources/`. The order mirrors the first batch of articles in
 * `src/features/releases/README.md` §5.
 */
import type { Browser } from '@playwright/test'
import { anthropicSource, scrapeAnthropic } from './sources/anthropic.ts'
import { deepseekSource, scrapeDeepSeek } from './sources/deepseek.ts'
import { googleSource, scrapeGoogle } from './sources/google.ts'
import { grokSource, scrapeGrok } from './sources/grok.ts'
import { minimaxSource, scrapeMiniMax } from './sources/minimax.ts'
import { openaiSource, scrapeOpenAI } from './sources/openai.ts'
import type { ReleaseSource, SourceResult, VendorId } from './types.ts'

export const RELEASE_SOURCES: ReleaseSource[] = [
  openaiSource,
  anthropicSource,
  googleSource,
  grokSource,
  deepseekSource,
  minimaxSource,
]

/** All vendor ids, in registry order. */
export const VENDOR_IDS: VendorId[] = RELEASE_SOURCES.map((s) => s.vendor)

/** Vendor id → scraper, the same shape as `scripts/prices/fetch.ts`. */
export const RELEASE_SCRAPERS: Record<
  VendorId,
  (browser: Browser) => Promise<SourceResult>
> = {
  openai: scrapeOpenAI,
  anthropic: scrapeAnthropic,
  google: scrapeGoogle,
  grok: scrapeGrok,
  deepseek: scrapeDeepSeek,
  minimax: scrapeMiniMax,
}

/** Find a source by vendor id. */
export function findSource(vendor: string): ReleaseSource | undefined {
  return RELEASE_SOURCES.find((s) => s.vendor === vendor)
}
