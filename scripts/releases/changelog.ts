/**
 * Changelog draft generation for the release scraper.
 *
 * The site's `/changelog` page is a fumadocs collection under
 * `src/content/changelog/` — one file per shipped change, with a
 * `title / description / date / version / published` frontmatter. It is
 * **published site content**, so it lives in git and is reviewed in a diff.
 *
 * The same iron rule that governs release drafts applies here: the scraper
 * never writes into `src/content/`. What it *can* do — and what the release
 * workflow now requires — is emit a **changelog draft** alongside the
 * release draft, so that every time new model information is scraped there
 * is a starting point for the changelog entry that must accompany it.
 *
 * The draft is deliberately skeletal:
 *   - `version` stays a `TBD` placeholder — the human decides which release
 *     train this change belongs to.
 *   - `published` stays `false` — it is not a published entry until a human
 *     fills it in and moves it to `src/content/changelog/`.
 *   - `title` / `description` are TODO placeholders.
 *   - The body lists the traceable facts the scraper actually extracted
 *     (vendor, slug, source URL, scraped date) and stops there. No prices,
 *     no benchmarks, no conclusions.
 */
import { escapeMdxText } from './text.ts'
import type { ReleaseFacts } from './types.ts'

/** The changelog collection frontmatter (see `source.config.ts`). */
export interface ChangelogFrontmatter {
  title: string
  description: string
  /** ISO date the entry describes — today for a scraped model launch. */
  date: string
  /** Release-train version tag — human-only, `TBD` in the draft. */
  version: string
  published: boolean
}

/**
 * Build the changelog draft frontmatter.
 *
 * Only `date` (today) and a title placeholder carrying the slug are filled
 * from the scrape — the slug is a fact, not a conclusion, so it names the
 * entry without answering "what does it mean for the product".
 * `description` / `version` stay as TODO placeholders: the changelog is
 * prose about a shipped change, and the scraper only knows that *something*
 * appeared, not what it means for the product.
 */
export function buildChangelogFrontmatter(facts: ReleaseFacts, today: string): ChangelogFrontmatter {
  return {
    title: `[draft] ${facts.slug}`,
    description: '',
    date: today,
    version: 'TBD',
    published: false,
  }
}

/** Render the changelog frontmatter as YAML. */
export function renderChangelogFrontmatter(fm: ChangelogFrontmatter): string {
  const lines: string[] = [
    '---',
    '# ⚠️ changelog 自动草稿：新增大模型信息时抓取脚本生成，须人工补齐后才能发布。',
    '# 字段含义见 src/content/changelog/（collection schema 在 source.config.ts）。',
    '# 版本号 version 由人定（TBD 占位）；published 默认 false，补全后再翻 true。',
    `title: ${yamlString(fm.title)}`,
    `description: ${yamlString(fm.description)}`,
    `date: ${yamlString(fm.date)}`,
    `version: ${yamlString(fm.version)}`,
    `published: ${fm.published}`,
    '---',
  ]
  return lines.join('\n')
}

/**
 * Build the changelog draft markdown: frontmatter + the traceable facts the
 * scraper knows + a TODO body section.
 */
export function buildChangelogDraft(facts: ReleaseFacts, today: string): string {
  const fm = buildChangelogFrontmatter(facts, today)
  const parts: string[] = [
    renderChangelogFrontmatter(fm),
    '',
    body(facts),
  ]
  return `${parts.join('\n')}\n`
}

/**
 * The changelog draft body.
 *
 * It carries only facts the scraper actually extracted — vendor, slug, the
 * official source, the scraped date, the page title — and a TODO section for
 * the human to expand. It never carries a price or a benchmark number: the
 * changelog records that a model shipped, not what it costs (the cost lives
 * in REGISTRY, which the release article resolves at render time).
 */
function body(facts: ReleaseFacts): string {
  const factsList = [
    `- vendor: ${facts.vendor}`,
    `- slug: ${facts.slug}`,
    `- sourceUrl: ${facts.sourceUrl}`,
    `- sourceTitle: ${facts.sourceTitle}`,
    `- pageTitle: ${facts.pageTitle ?? '—'}`,
    `- scrapedAt: ${facts.scrapedAt}`,
    `- publishedAt: ${facts.publishedAt ?? '—（页面上没找到，需要人工确认）'}`,
  ].join('\n')

  return `<!--
  changelog 草稿 —— 由 \`pnpm releases:fetch\` 生成，尚未成文。
  TODO(人工):
   - 把 title 写成面向读者的一句话（这 model 上线意味着什么）。
   - 把 description 写成摘要。
   - 把 version 从 TBD 改成本次发布所属的版本号。
   - 正文里补「新增了什么 / 影响哪些页面 / 数据来源」。
   - 核对正文引用的每个价格 / 跑分确实来自 REGISTRY / LEADERBOARD。
   - 补完后把文件移到 src/content/changelog/ 并把 published 改成 true。
  抓取到的事实（仅供参考，发布前核对）：

${factsList}
-->

## Added

<!-- TODO(人工): 这条 changelog 记录的是「新模型上线」。写清楚是哪个模型、
     哪个厂商、上线日期，以及读者需要知道什么。价格与跑分一律引用
     REGISTRY / LEADERBOARD 的现值，不要手写。 -->

- **${escapeMdxText(facts.slug)}** —— ${escapeMdxText(facts.vendor)}（${facts.publishedAt ?? 'release date unknown'}）

## Details

<!-- TODO(人工): 补一条「这次抓取确认了哪些事实」的说明，以及它对站点
     价格 / 榜单 / 发布文章的影响。如果只是价格刷新，写「价格已核对」。 -->

## Source

- ${escapeMdxText(facts.sourceUrl)} — ${escapeMdxText(facts.sourceTitle)}
- 抓取时间：${facts.scrapedAt}`
}

/**
 * Build a compact machine-readable payload for the changelog draft, written
 * next to it as `<slug>.changelog.json`. Lets a future tool diff "which
 * changelog drafts exist vs. which have been published" without parsing MDX.
 */
export function buildChangelogPayload(facts: ReleaseFacts, today: string): string {
  const payload = {
    kind: 'changelog-draft',
    slug: facts.slug,
    vendor: facts.vendor,
    sourceUrl: facts.sourceUrl,
    sourceTitle: facts.sourceTitle,
    pageTitle: facts.pageTitle,
    publishedAt: facts.publishedAt,
    scrapedAt: facts.scrapedAt,
    date: today,
    version: 'TBD',
    published: false,
  }
  return `${JSON.stringify(payload, null, 2)}\n`
}

/** Quote a string as a YAML single-quoted scalar. */
function yamlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}
