/**
 * Google (Gemini) source for the release scraper.
 *
 * Source: https://ai.google.dev/gemini-api/docs/pricing
 *
 * Google's developer docs render the pricing tables client-side (the tab
 * panels are all in the DOM, only the active one is visible), so we take the
 * whole `main` region rather than a single tab panel.
 */
import type { Browser } from '@playwright/test'
import { runSource } from '../scrape.ts'
import type { ReleaseSource, SourceResult } from '../types.ts'

export const googleSource: ReleaseSource = {
  vendor: 'google',
  slug: 'gemini-3-1-pro',
  url: 'https://ai.google.dev/gemini-api/docs/pricing',
  knownTitle: 'Google — Gemini API pricing',
  selectors: {
    title: ['main h1', 'article h1', 'h1', 'title'],
    date: [
      'time[datetime]',
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'time',
      '.devsite-page-meta-date',
    ],
    content: ['main', 'article', '[role="main"]', '.devsite-article-body', 'body'],
    heading: ['main h2', 'main h3', 'article h2', 'article h3', 'h2', 'h3'],
  },
  notes: [
    '定价页而非发布公告 —— 抓到的正文是价格表与文档说明。',
    '价格分 tab（standard / batch / flex / priority），整页抓取会混进多种模式。',
    '页面上没有发布公告日期 —— releasedAt 只能人工填。',
  ],
}

export async function scrapeGoogle(browser: Browser): Promise<SourceResult> {
  return runSource(browser, googleSource)
}
