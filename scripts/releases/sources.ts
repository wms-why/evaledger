/**
 * The registry of release sources.
 *
 * One file per vendor, same layout as `scripts/prices/sources/`. The order
 * mirrors the first batch of articles in `src/features/releases/README.md` §5.
 *
 * A vendor may publish **several** pages worth scraping (OpenAI has both a
 * pricing page and an announcement page), so the registry is keyed by
 * *slug*, not by vendor: `RELEASE_SCRAPERS` is keyed by slug and every
 * source carries its own unique slug. The vendor id stays on the source
 * itself — that is what the article frontmatter and the draft layout use.
 */
import type { Browser } from '@playwright/test'
import { anthropicSource, scrapeAnthropic } from './sources/anthropic.ts'
import { deepseekSource, scrapeDeepSeek } from './sources/deepseek.ts'
import { googleSource, scrapeGoogle } from './sources/google.ts'
import { grokSource, scrapeGrok } from './sources/grok.ts'
import { minimaxSource, scrapeMiniMax } from './sources/minimax.ts'
import {
  openaiSource,
  openaiTerraSource,
  scrapeOpenAI,
  scrapeOpenAITerra,
} from './sources/openai.ts'
import type { ReleaseSource, SourceResult, VendorId } from './types.ts'

/** A scraper for one source. */
export type ReleaseScraper = (browser: Browser) => Promise<SourceResult>

export const RELEASE_SOURCES: ReleaseSource[] = [
  openaiSource,
  openaiTerraSource,
  anthropicSource,
  googleSource,
  grokSource,
  deepseekSource,
  minimaxSource,
]

/**
 * All vendor ids, in registry order — one entry per vendor, even when a
 * vendor has more than one source.
 */
export const VENDOR_IDS: VendorId[] = [...new Set(RELEASE_SOURCES.map((s) => s.vendor))]

/**
 * Slug → scraper, the same shape as `scripts/prices/fetch.ts`.
 *
 * Keyed by slug (not by vendor) so two sources of the same vendor can
 * coexist — `openai` has both a pricing page and an announcement page.
 */
export const RELEASE_SCRAPERS: Record<string, ReleaseScraper> = {
  'gpt-6-astra': scrapeOpenAI,
  'gpt-6-1-terra': scrapeOpenAITerra,
  'claude-opus-5-5': scrapeAnthropic,
  'gemini-3-1-pro': scrapeGoogle,
  'grok-4-7': scrapeGrok,
  'deepseek-v4-1-flash': scrapeDeepSeek,
  'minimax-m3-1-flash': scrapeMiniMax,
}

/** Find a source by vendor id (the first source of that vendor). */
export function findSource(vendor: string): ReleaseSource | undefined {
  return RELEASE_SOURCES.find((s) => s.vendor === vendor)
}

/** Find a source by slug — the unique id of a single source. */
export function findSourceBySlug(slug: string): ReleaseSource | undefined {
  return RELEASE_SOURCES.find((s) => s.slug === slug)
}
