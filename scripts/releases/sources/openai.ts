/**
 * OpenAI sources for the release scraper.
 *
 * Two sources live in this file because OpenAI publishes more than one kind
 * of page worth scraping:
 *
 *   - `openaiSource` — the API **pricing** page (the price table the
 *     article's "What it costs" section is rendered from).
 *   - `openaiTerraSource` — the **announcement** of GPT-6.1 Terra (the
 *     "what shipped" prose).
 *
 * Both are keyed by slug, so several sources can share one vendor id.
 */
import type { Browser } from '@playwright/test'
import { runSource } from '../scrape.ts'
import type { ReleaseSource, SourceResult } from '../types.ts'

/**
 * OpenAI API pricing page.
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

/**
 * OpenAI's announcement of GPT-6.1 Terra.
 *
 * Source: https://openai.com/zh-Hans-CN/index/introducing-gpt-6-1-terra/
 *
 * This is the *announcement* (the "what shipped" prose), not the pricing
 * page `openaiSource` points at. It is the Chinese locale of OpenAI's index
 * page, so the scraped text is Chinese — the article's English version is a
 * separate human-written file (`<slug>.md` + `<slug>.zh.md`), not a second
 * scrape.
 */
export const openaiTerraSource: ReleaseSource = {
  vendor: 'openai',
  slug: 'gpt-6-1-terra',
  url: 'https://openai.com/zh-Hans-CN/index/introducing-gpt-6-1-terra/',
  knownTitle: 'OpenAI — 推出 GPT-6.1 Terra',
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
    '官方发布公告（中文本地化版），不是定价页。',
    '页面是客户端渲染的，纯 HTTP 抓不到正文（必须用 headless Chromium）。',
    '页面上没有发布日期（只有年份），releasedAt 只能人工填。',
    '不带 Sec-CH-UA 客户端提示的请求会拿到一个 500 错误壳（HTTP 200 但正文没了）；scripts/shared/browser.ts 已修，抓不到正文时先怀疑提示头，别急着改选择器。',
  ],
}

export async function scrapeOpenAITerra(browser: Browser): Promise<SourceResult> {
  return runSource(browser, openaiTerraSource)
}
