/**
 * MiniMax source for the release scraper.
 *
 * Source: https://www.minimax.cn/blog/minimax-m31f
 *
 * The MiniMax blog renders client-side (the article body is injected after
 * hydration), so the scraper waits for the article container before it
 * extracts anything.
 */
import type { Browser } from '@playwright/test'
import { runSource } from '../scrape.ts'
import type { ReleaseSource, SourceResult } from '../types.ts'

export const minimaxSource: ReleaseSource = {
  vendor: 'minimax',
  slug: 'minimax-m3-1-flash',
  url: 'https://www.minimax.cn/blog/minimax-m31f',
  knownTitle: 'MiniMax M3.1 Flash 官方发布',
  selectors: {
    title: ['article h1', 'main h1', '.article-title', '[class*="article"] h1', 'h1', 'title'],
    date: [
      'time[datetime]',
      'meta[property="article:published_time"]',
      '.publish-time',
      '.article-date',
      'time',
    ],
    content: [
      'article',
      '.article-content',
      '[class*="article-content"]',
      '[class*="post-content"]',
      'main',
      'body',
    ],
    heading: ['article h2', 'article h3', '[class*="article-content"] h2', 'h2', 'h3'],
  },
  notes: [
    '博客正文是客户端渲染的 —— 水合没完成时抓到的是空壳。',
    '发布日期在 .publish-time / <time> 里，抓到后会填进 releasedAt 草稿位（仍需人工确认）。',
    '页面结构改版频率高，抓不到时看 .tmp/minimax-fail.html。',
  ],
  waitMs: 20_000,
}

export async function scrapeMiniMax(browser: Browser): Promise<SourceResult> {
  return runSource(browser, minimaxSource)
}
