/**
 * Anthropic source for the release scraper.
 *
 * Source: https://claude.com/pricing#api
 *
 * The `#api` anchor lands on the API tab panel of Claude's pricing page —
 * the same panel `scripts/prices/sources/anthropic.ts` scrapes for rates.
 * Here we want the prose around it (the model descriptions), not the rates.
 */
import type { Browser } from '@playwright/test'
import { runSource } from '../scrape.ts'
import type { ReleaseSource, SourceResult } from '../types.ts'

export const anthropicSource: ReleaseSource = {
  vendor: 'anthropic',
  slug: 'claude-opus-5-5',
  url: 'https://claude.com/pricing#api',
  knownTitle: 'Anthropic — Claude API pricing',
  selectors: {
    title: ['main h1', 'article h1', 'h1', 'title'],
    date: [
      'time[datetime]',
      'meta[property="article:published_time"]',
      'meta[name="last-modified"]',
      'time',
      '[class*="lastUpdated"]',
    ],
    content: ['main', '[role="main"]', 'article', '#pricing-plans-panel-3', 'body'],
    heading: ['main h2', 'main h3', 'h2', 'h3'],
  },
  notes: [
    'API 价格面板是客户端渲染的 —— 抓不到内容时看 .tmp/anthropic-fail.png。',
    '定价页不是发布公告，页面上没有发布日期 —— releasedAt 只能人工填。',
    '页面同时混着消费版订阅价格，正文里只有 API 面板的段落与本系列相关。',
  ],
}

export async function scrapeAnthropic(browser: Browser): Promise<SourceResult> {
  return runSource(browser, anthropicSource)
}
