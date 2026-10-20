/**
 * OpenAI source for the release scraper.
 *
 * Source: https://platform.openai.com/docs/pricing
 *
 * The contract's sourceUrl for the GPT-6 astra release is OpenAI's official
 * pricing page (`src/features/releases/README.md` §5.1) — it is the page the
 * article's price table is rendered from, so it is also the page we scrape.
 *
 * Note: this is a *pricing* page, not a blog post. There is no publish date
 * and no "what shipped" prose — the scraped text is the price table, which is
 * exactly the material the "What it costs" section needs.
 */
import type { Browser } from '@playwright/test'
import { runSource } from '../scrape.ts'
import type { ReleaseSource, SourceResult } from '../types.ts'

export const openaiSource: ReleaseSource = {
  vendor: 'openai',
  slug: 'gpt-6-astra',
  url: 'https://platform.openai.com/docs/pricing',
  knownTitle: 'OpenAI — API pricing',
  selectors: {
    title: ['main h1', 'article h1', 'h1', 'title'],
    date: [
      'time[datetime]',
      'meta[property="article:published_time"]',
      'meta[name="last-modified"]',
      'time',
      '[data-testid="last-updated"]',
    ],
    content: ['main', 'article', '[role="main"]', '#content', 'body'],
    heading: ['main h2', 'main h3', 'article h2', 'article h3', 'h2', 'h3'],
  },
  notes: [
    '定价页而非发布公告 —— 抓到的正文是价格表，没有发布说明。',
    '页面是客户端渲染的，纯 HTTP 抓不到价格表（必须用 headless Chromium）。',
    '页面上没有发布日期 —— releasedAt 只能人工填。',
  ],
}

export async function scrapeOpenAI(browser: Browser): Promise<SourceResult> {
  return runSource(browser, openaiSource)
}
