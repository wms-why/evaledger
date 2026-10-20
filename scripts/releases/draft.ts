/**
 * Draft builders for the release scraper — pure functions, no IO.
 *
 * The rules encoded here are the whole point of the script:
 *
 *   - The frontmatter skeleton is filled with **placeholders only**. `modelId`,
 *     `modelSlug`, `compareModelIds`, `compareSlugs`, prices and conclusions
 *     stay empty — a human fills them in.
 *   - The scraped announcement text is appended as *reference material* in a
 *     fenced code block, so it can never be mistaken for finished prose.
 *   - Nothing here knows about `src/content/releases/` — the writer in
 *     `output.ts` refuses to write there.
 */
import { buildFence, escapeMdxText } from './text.ts'
import type { ReleaseFacts, VendorId } from './types.ts'

/** The frontmatter of a release article (see releases collection schema). */
export interface DraftFrontmatter {
  title: string
  description: string
  /** 本文发布日 (ISO). */
  date: string
  /** 最后一次核对来源与价格的日期 (ISO). */
  checkedAt: string
  /** 模型发布日 (ISO) — human only. */
  releasedAt: string
  vendor: VendorId
  /** REGISTRY.id of the protagonist model — human only. */
  modelId: string
  /** LEADERBOARD.id of the protagonist model — human only. */
  modelSlug: string
  /** REGISTRY.id[] of the comparison rows — human only. */
  compareModelIds: string[]
  /** LEADERBOARD.id[] of the comparison rows — human only. */
  compareSlugs: string[]
  sourceUrl: string
  sourceTitle: string
  published: boolean
}

/**
 * Build the frontmatter skeleton.
 *
 * Only the fields the scraper actually knows are filled: `date` /
 * `checkedAt` (today), `vendor`, `sourceUrl`, `sourceTitle`. Everything the
 * script is not allowed to decide stays empty.
 */
export function buildFrontmatter(facts: ReleaseFacts, today: string): DraftFrontmatter {
  return {
    title: '',
    description: '',
    date: today,
    checkedAt: today,
    releasedAt: '',
    vendor: facts.vendor,
    modelId: '',
    modelSlug: '',
    compareModelIds: [],
    compareSlugs: [],
    sourceUrl: facts.sourceUrl,
    sourceTitle: facts.sourceTitle,
    published: false,
  }
}

/** Render the frontmatter as YAML (with TODO comments for the human). */
export function renderFrontmatter(fm: DraftFrontmatter): string {
  const lines: string[] = [
    '---',
    '# ⚠️ 自动草稿：所有 TODO 字段必须人工补齐后才能发布。',
    '# 字段含义见 src/features/releases/README.md §1，正文模板见 §4。',
    '# 价格 / 跑分 / 结论一律由人写 —— 脚本只负责抄官方公告。',
    `title: ${yamlString(fm.title)}`,
    `description: ${yamlString(fm.description)}`,
    `date: ${yamlString(fm.date)}`,
    `checkedAt: ${yamlString(fm.checkedAt)}`,
    `releasedAt: ${yamlString(fm.releasedAt)}`,
    `vendor: ${fm.vendor}`,
    '# modelId = REGISTRY.id（主角模型）；modelSlug = LEADERBOARD.id（留空则页面不渲染跑分表）',
    `modelId: ${yamlString(fm.modelId)}`,
    `modelSlug: ${yamlString(fm.modelSlug)}`,
    `compareModelIds: ${yamlList(fm.compareModelIds)}`,
    `compareSlugs: ${yamlList(fm.compareSlugs)}`,
    `sourceUrl: ${yamlString(fm.sourceUrl)}`,
    `sourceTitle: ${yamlString(fm.sourceTitle)}`,
    `published: ${fm.published}`,
    '---',
  ]
  return lines.join('\n')
}

/**
 * Render the full MDX draft: frontmatter + the §4 section template + the
 * scraped source text as an appendix.
 */
export function buildDraftMarkdown(facts: ReleaseFacts, today: string): string {
  const fm = buildFrontmatter(facts, today)
  const parts: string[] = [renderFrontmatter(fm), '', bodyTemplate(), '', sourceAppendix(facts)]
  return `${parts.join('\n')}\n`
}

/** The six-section body template from §4 of the release contract. */
export function bodyTemplate(): string {
  return `<!--
  自动草稿 —— 由 \`pnpm releases:fetch\` 生成，尚未成文。
  TODO(人工) 的段落需要按 src/features/releases/README.md §4 的模板改写；
  价格、跑分、结论全部由人写，脚本一个数字都不填。
  文末「Source text」是抓到的官方原文，仅供核对，发布前请删除。
-->

## TL;DR

<!-- TODO(人工): 3 条要点，第 1 条给结论。中文版文件用「## 一句话结论」。 -->

## What shipped

<!-- TODO(人工): 事实清单，每条可溯源。可参考文末抓到的原文。 -->

## What it costs

<!-- TODO(人工): 讲清价格结构（输入 / 输出 / 缓存 / 上下文），不要重复整张表，指向页面上的表格即可。 -->

## How it scores

<!-- TODO(人工): 解释这张表该怎么读，别只念数字。没有可溯源跑分时如实说明。 -->

## Should you switch?

<!-- TODO(人工): 分场景给建议（哪些用量该换、哪些不用换）。 -->

## Where to go next

<!-- TODO(人工): 链到站内对比页 / 计算器 / 模型页。 -->`
}

/** The auto-extracted source text, fenced so MDX never parses it. */
export function sourceAppendix(facts: ReleaseFacts): string {
  const fence = buildFence(facts.bodyText)
  const headingLines =
    facts.headings.length > 0
      ? facts.headings.map((h) => `- ${escapeMdxText(h)}`).join('\n')
      : '- （未识别到小标题）'

  return `---

## Source text (auto-extracted — reference only)

- 来源：${escapeMdxText(facts.sourceUrl)}
- 页面标题：${escapeMdxText(facts.pageTitle ?? '—')}
- 抓取到的发布日期：${facts.publishedAt ?? '—（页面上没找到，需要人工确认）'}
- 抓取时间：${facts.scrapedAt}
- 正文长度：${facts.charCount} 字符${facts.truncated ? '（已截断）' : ''}

小标题：

${headingLines}

原文纯文本：

${fence}
${facts.bodyText}
${fence}`
}

/** The JSON payload written next to the draft (`<slug>.json`). */
export function buildFactsPayload(facts: ReleaseFacts): string {
  const payload = {
    vendor: facts.vendor,
    slug: facts.slug,
    sourceUrl: facts.sourceUrl,
    sourceTitle: facts.sourceTitle,
    pageTitle: facts.pageTitle,
    publishedAt: facts.publishedAt,
    headings: facts.headings,
    bodyText: facts.bodyText,
    charCount: facts.charCount,
    truncated: facts.truncated,
    scrapedAt: facts.scrapedAt,
  }
  return `${JSON.stringify(payload, null, 2)}\n`
}

/** Quote a string as a YAML single-quoted scalar. */
function yamlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/** Render a string array as a YAML flow sequence. */
function yamlList(values: string[]): string {
  if (values.length === 0) return '[]'
  return `[${values.map((v) => yamlString(v)).join(', ')}]`
}
