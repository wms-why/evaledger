/**
 * DeepSeek source for the release scraper.
 *
 * Source: https://mp.weixin.qq.com/s/qg0NU3NNUbp1co2PdkAPAg
 *
 * The DeepSeek V4.1 Flash announcement lives on a WeChat (mp.weixin.qq.com)
 * article, so this source has two quirks the generic extractor has to know
 * about:
 *
 *   1. WeChat serves its own markup — the body lives in `#js_content`, the
 *      title in `#activity-name`, the publish time in `#publish_time`.
 *   2. WeChat fakes headings with `<strong>` instead of `<h2>`, so the
 *      `headingFallback` selector list covers that.
 *
 * WeChat also blocks suspicious traffic: an automated request can come back
 * as an "环境异常" verification page. When that happens the scrape fails with
 * the usual message and the debug dump lands in `.tmp/deepseek-fail.*`.
 */
import type { Browser } from '@playwright/test'
import { runSource } from '../scrape.ts'
import type { ReleaseSource, SourceResult } from '../types.ts'

export const deepseekSource: ReleaseSource = {
  vendor: 'deepseek',
  slug: 'deepseek-v4-1-flash',
  url: 'https://mp.weixin.qq.com/s/qg0NU3NNUbp1co2PdkAPAg',
  knownTitle: 'DeepSeek V4.1 Flash 发布公告',
  selectors: {
    title: ['#activity-name', '.rich_media_title', 'h1', 'title'],
    date: [
      '#publish_time',
      'em#publish_time',
      '.rich_media_meta_text',
      'meta[property="og:release_date"]',
      'time[datetime]',
    ],
    content: ['#js_content', '.rich_media_content', '#img-content', 'article', 'main', 'body'],
    heading: ['#js_content h1, #js_content h2', 'h1, h2'],
    headingFallback: ['#js_content p > strong'],
  },
  notes: [
    '微信文章页对自动化访问敏感 —— 可能返回「环境异常」验证页而不是正文。',
    '微信编辑器把段落也标成 h1/h2 —— 所以这里用 maxHeadingChars: 30 把长段落滤掉。',
    '发布日期在 #publish_time 里，是中文时间戳（2026年9月10日 08:30 这种）。',
    '拿不到正文时先看 .tmp/deepseek-fail.png，必要时手动复制原文。',
  ],
  // WeChat marks paragraphs as headings too — keep only the short ones.
  maxHeadingChars: 30,
}

export async function scrapeDeepSeek(browser: Browser): Promise<SourceResult> {
  return runSource(browser, deepseekSource)
}
