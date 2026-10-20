/**
 * xAI (Grok) source for the release scraper.
 *
 * Source: https://docs.x.ai/docs/models
 *
 * `docs.x.ai` is a fully client-rendered SPA — the DOM only fills in after
 * hydration, so the scraper waits for the model cards before extracting.
 */
import type { Browser } from '@playwright/test'
import { runSource } from '../scrape.ts'
import type { ReleaseSource, SourceResult } from '../types.ts'

export const grokSource: ReleaseSource = {
  vendor: 'grok',
  slug: 'grok-4-7',
  url: 'https://docs.x.ai/docs/models',
  knownTitle: 'xAI — Models & pricing',
  selectors: {
    title: ['main h1', 'h1', 'title'],
    date: [
      'time[datetime]',
      'meta[property="article:published_time"]',
      'meta[name="last-modified"]',
      'time',
    ],
    content: ['main', 'article', '[role="main"]', '[class*="bg-card"]', 'body'],
    heading: ['main h2', 'main h3', 'h2', 'h3'],
  },
  notes: [
    '纯 SPA —— DOM 只有在水合之后才有内容，等待超时会拿到空壳页面。',
    '价格表由 card 组件拼出来，不是 <table> —— 抓到的文本结构比较松散。',
    '页面上没有发布日期 —— releasedAt 只能人工填。',
  ],
  waitMs: 30_000,
}

export async function scrapeGrok(browser: Browser): Promise<SourceResult> {
  return runSource(browser, grokSource)
}
