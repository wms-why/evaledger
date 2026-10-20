# Model Releases — 系列契约

`/releases` 是站点的第三个系列（第一个 = 榜单，第二个 = 对比/计算器）。
定位：**模型发布 → 成本与换型决策**。不是新闻聚合，不是洗稿。

## 0. 铁律

1. **文章里不写死价格与跑分。** 数字一律由页面在渲染时从
   `src/features/calculator/model-prices.ts`（REGISTRY）和
   `src/features/leaderboard/models.ts`（LEADERBOARD）实时取。
   MDX 正文只写判断、叙事和「该不该换」的结论，不手写价格表 / 跑分表。
   正文里**允许**出现主角模型的价格（TL;DR 通常会写一次），
   但必须是 REGISTRY 里的原始单价，或由它直接算出的倍数 / 百分比 ——
   CI 里有测试盯着（见 §6）。
2. **不编造。** 仓库里没有的跑分、发布日期、厂商公告标题，一律不写。
   `releasedAt` 只有在仓库里能查到时才填（当前只有 DeepSeek 与 MiniMax 两条）。
3. **不跟现有页面抢词。** `/deepseek-api-pricing` 这类定价长尾页是 canonical，
   本系列只占「发布 / 新模型 / 值得换吗」这类词，并在文末链回去。
4. **出处必须带。** 每篇 frontmatter 记 `sourceUrl` + `sourceTitle`，
   页面底部渲染 Source 区块，JSON-LD 用 `isBasedOn`。
5. **中英双份，且是原生重写。** 不是互译。英文版面向海外开发者，
   中文版面向中文读者，例子、取舍建议、措辞都要各自成立。
   文件命名：`<slug>.md`（en）+ `<slug>.zh.md`（zh）。

## 1. Collection

`source.config.ts` 新增：

```ts
export const releases = defineCollections({
  type: 'doc',
  dir: 'src/content/releases',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.string(),              // 本文发布日（ISO）
    checkedAt: z.string(),         // 最后一次核对官方来源的日期（ISO）
    dataCheckedAt: z.string(),     // 最后一次把结论和站内数据对上的日期（ISO）
    releasedAt: z.string().optional(), // 模型发布日（ISO）——查不到就别填
    vendor: z.enum(['openai', 'anthropic', 'google', 'grok', 'deepseek', 'minimax']),
    modelId: z.string(),           // REGISTRY.id ——主角模型
    modelSlug: z.string().optional(),  // LEADERBOARD.id ——填了才有跑分表
    compareModelIds: z.array(z.string()).default([]), // REGISTRY.id[] ——价格对比行
    compareSlugs: z.array(z.string()).default([]),    // LEADERBOARD.id[] ——跑分对比行
    sourceUrl: z.string(),
    sourceTitle: z.string(),
    published: z.boolean().default(true),
  }),
})
```

## 2. 路由

| URL | 说明 |
| --- | --- |
| `/{-locale}/releases` | 列表页：按 `date` 倒序，卡片显示厂商 / 主角模型 / 一句话结论 / 价格 / 跑分有无 |
| `/{-locale}/releases/$slug` | 详情页：`$slug` 不带 locale 后缀，`/releases/x` = en，`/zh/releases/x` = zh |

slug = 文件名去掉 `.md` / `.zh.md`。中英共用同一个 slug。

## 3. 详情页版式（路由渲染，MDX 只放正文）

```
[SiteNav]
[Header]  kicker「Model release · 厂商」/ H1 / 发布日 / 一句话 description
[Fact sheet]  ← 实时数据，本系列的价值核心
    · 价格表：主角行高亮 + compareModelIds 各行（状态徽章：active / legacy）
    · 「你的用量要多少钱」：1M input + 500K output 的月度估算（实时算）
    · 跑分表：有 modelSlug 才有；没有就渲染诚实的空状态
    · context window / cached input 单价 / 各自 sourceUrl + lastVerified
[MDX 正文]  ← 纯散文
[CTA]  → /compare?a=<主角>&b=<对手>  /token-calculator
[Source]  sourceUrl + sourceTitle + checkedAt
[Footer]
```

## 4. 正文模板（MDX，6 段）

1. `## TL;DR`（中文版 `## 一句话结论`）——3 条要点，第一条给结论。
2. `## What shipped`（`## 发布了什么`）——事实清单，每条可溯源。
3. `## What it costs`（`## 成本`）——讲清价格结构（输入/输出/缓存/上下文），
   不要重复整张表，指向表格即可。
4. `## How it scores`（`## 跑分`）——解释这张表该怎么读，别只念数字。
5. `## Should you switch?`（`## 该不该换`）——分场景给建议。
6. `## Where to go next`（`## 延伸阅读`）——链到站内对比页/计算器/模型页。

正文里出现的金额，**只能**是主角模型或对比模型在 REGISTRY 里的原始单价，
以及由这些单价直接算出的倍数/百分比。禁止出现注册表里没有的数字。

## 5. 首期 6 篇（6 家主力各 1 篇）

| slug | 厂商 | 主角 | modelId | modelSlug | releasedAt |
| --- | --- | --- | --- | --- | --- |
| `gpt-6-astra` | OpenAI | GPT-6 astra | `gpt-6-astra` | — | — |
| `claude-opus-5-5` | Anthropic | Claude Opus 5.5 | `claude-opus-5.5` | — | — |
| `gemini-3-1-pro` | Google | Gemini 3.1 Pro | `gemini-3.1-pro-preview` | `gemini-3.1-pro` | — |
| `grok-4-7` | xAI | Grok 4.7 | `grok-4.7` | `grok-4.7` | — |
| `deepseek-v4-1-flash` | DeepSeek | DeepSeek V4.1-Flash | `deepseek-flash` | `deepseek-v4.1-flash` | `2026-09-10` |
| `minimax-m3-1-flash` | MiniMax | MiniMax M3.1 Flash | `minimax-m3.1-flash` | `minimax-m3.1-flash` | `2026-10-19` |

`gpt-6-astra` 与 `claude-opus-5-5` **故意不给** `modelSlug`：
榜单里没有这两个 SKU 的可溯源跑分，就不编。正文里要写明「还没有核验过的跑分」。

### 6.1 每篇的事实清单（写正文时直接用，不要自己算）

> 所有价格单位 USD / 1M tokens。`cached` = 缓存读价。

#### `gpt-6-astra`（OpenAI）
- 主角：$10 / $50，cached $1.00，ctx 400,000，source `https://platform.openai.com/docs/pricing`，lastVerified 2026-09-26
- 对比行：
  - `gpt-6-sol` $2 / $10（active）→ astra 是它的 5×
  - `gpt-5.6-cyber` $12.5 / $75（active）→ astra 输入便宜 20%、输出便宜 33%
  - `gpt-5.6-sol` $4 / $20（active）→ astra 是它的 2.5×
  - `gpt-5` $1.25 / $10（delisted，note: Replaced by GPT-6 series）→ astra 是 8× 输入、5× 输出
  - `gpt-6-luna` $0.10 / $0.50（active）→ astra 是 100×
- 缓存折扣：$1.00 = 输入价的 10%（省 90%）
- 跑分：**无**（榜单没有 GPT-6 astra 的可溯源分数）
- 结论方向：astra 比同门的 cyber 便宜，但比 sol/luna 贵一大截；同门三档 $10/$50、$2/$10、$0.10/$0.50 正好是 5× 递减
- source：OpenAI 官方定价页 `https://platform.openai.com/docs/pricing`，title「OpenAI — API pricing」

#### `claude-opus-5-5`（Anthropic）
- 主角：`claude-opus-5.5` $4 / $20，cached $0.20，cacheWrite 5min $5.00，ctx 200,000，source `https://claude.com/pricing#api`，lastVerified 2026-09-26
- 对比行：
  - `claude-opus-5` $5 / $25（delisted，note: Listed in Anthropic's Legacy models section; superseded by Opus 5.5）→ **比它便宜 20%**
  - `claude-sonnet-5` $2 / $10（active）→ 主角是它的 2×
  - `claude-haiku-4.5` $1 / $5（active）→ 主角是它的 4×
- 缓存折扣：$0.20 = 输入价的 5%（省 95%）；旧 Opus 5 的缓存**读**价是 $0.50 = 其 $5 输入价的 10%。
  注意：`claude-opus-5` 在 REGISTRY 里**没有** cacheWrite 字段，别把 $5 缓存写入价挂到它名下
  （$5.00 的 5 分钟写入价属于 Opus 5.5 自己）。
- 跑分：**无**（榜单的 `claude-opus-5` 是上一代 SKU 的分数，不挪用到 5.5）
- 结论方向：Anthropic 把旗舰降价 20%，同时把缓存折扣从 90% 加到 95%
- source：`https://claude.com/pricing#api`，title「Anthropic — Claude API pricing」

#### `gemini-3-1-pro`（Google）
- 主角：`gemini-3.1-pro-preview` $2 / $12（displayName: Gemini 3.1 Pro Preview），ctx 1,000,000，source `https://ai.google.dev/gemini-api/docs/pricing`，lastVerified 2026-09-26
- 对比行：
  - `gemini-3.8-flash` $0.75 / $3.75（active）→ 主角输入 2.67×、输出 3.2×
  - `gemini-3.1-flash-lite` $0.25 / $1.50（active）→ 8×
  - `gemini-2.5-pro` $1.25 / $10（active）→ 输入 1.6×、输出 1.2×
- 上下文：1,000,000 —— OpenAI/Anthropic 的 200K–400K 的 2.5–5 倍
- 跑分（`gemini-3.1-pro`，来自 Google model card / benchleader）：
  gpqa-diamond 94.3、hle 44.4（note: no tools, full set (text + multimodal)）、
  hle-tools 51.4（note: search (blocklist) + code）、matharena-apex 60.9、automation-bench 35.4
- 跑分对比行：`gpt-5.6-sol`、`claude-opus-5`、`deepseek-v4.1-flash`
- source：`https://ai.google.dev/gemini-api/docs/pricing`，title「Google — Gemini API pricing」

#### `grok-4-7`（xAI）
- 主角：`grok-4.7` $2 / $6，ctx 500,000，source `https://docs.x.ai/docs/models`，lastVerified 2026-09-26
- 对比行：
  - `grok-4` $3 / $15（delisted，note: Replaced by Grok 4.7）→ 输入便宜 33%、输出便宜 60%
  - 上下文 256,000 → 500,000
- 跑分（`grok-4.7`）：terminal-bench-4.0 38.0、deepswe-v1.1 71.0（note: listed as "DeepSWE"）
- 跑分对比行：`gpt-5.6-sol`、`claude-opus-5`、`gemini-3.1-pro`
- 结论方向：输出只要 $6 —— 比 GPT-5.6 sol 的 $20 便宜 70%，比 Claude Opus 5 的 $25 便宜 76%
- source：`https://docs.x.ai/docs/models`，title「xAI — Models & pricing」

#### `deepseek-v4-1-flash`（DeepSeek）
- 主角：`deepseek-flash` $0.30 / $1.20（peak），cached $0.006，ctx 1,000,000，
  off-peak $0.15 / $0.60（peak 的一半），
  off-peakNote: Mon–Fri (excl. Chinese holidays). Peak 01:00–04:00 & 06:00–10:00 UTC; off-peak = all other times.
  source `https://api-docs.deepseek.com/quick_start/pricing`，lastVerified 2026-10-19
- releasedAt 2026-09-10
- 对比行：`deepseek-v4-pro` $1.32 / $3.96（peak，off-peak $0.66 / $1.98）→ 主角便宜 4.4×（输入）/ 3.3×（输出）
- 缓存折扣：$0.006 = 输入价的 2%（省 98%）
- 跑分（`deepseek-v4.1-flash`，19 项）：gpqa-diamond 90.9、hle 36.8（note: 39.1 on text-only subset）、
  codeforces 3471（rating）、matharena-apex 65.6、terminal-bench-2.1 90.6、terminal-bench-3.0 30.0、
  terminal-bench-4.0 31.2、deepswe-v1.1 74.2、programbench 20.3、nl2repo-bench 65.4、cybergym 88.1、
  sec-bench-pro 62.8、exploitgym 15.3、hle-tools 63.9、automation-bench 54.8、agents-last-exam 31.8、
  chartography-tools 78.9、babyvision-tools 89.6、zerobench-main-tools 49.0
- 跑分对比行：`gpt-5.6-sol`、`claude-opus-5`、`gemini-3.1-pro`、`kimi-k3`、`glm-5.3`
- 结论方向：注册表里最便宜的 active 模型之一；同门 V4-Pro 是它的 3–4 倍
- source：DeepSeek V4.1 Flash 发布公告 `https://mp.weixin.qq.com/s/qg0NU3NNUbp1co2PdkAPAg`，
  title「DeepSeek V4.1 Flash 发布公告」

#### `minimax-m3-1-flash`（MiniMax）
- 主角：`minimax-m3.1-flash` $0.15 / $0.60，cached $0.015，ctx 1,000,000，
  note: Released 2026-10-19; $0.15 / $0.60 / $0.015 (¥1 / ¥4 / ¥0.1). Flat rate — no long-context tier,
  and unlike M3 it does not accept service_tier=priority.
  source `https://platform.minimax.io/docs/pricing/overview`，lastVerified 2026-10-19
- releasedAt 2026-10-19
- 对比行：`minimax-m3` $0.30 / $1.20（active）→ **正好便宜一半**
- 缓存折扣：$0.015 = 输入价的 10%（省 90%）
- 上下文：1,000,000 总量（input + output 合计）
- 跑分（`minimax-m3.1-flash`，**4 项**）：deepswe-v1.1 73.7、cybergym 82.0、agents-last-exam 29.6、
  bankertoolbench 76.2（也是官方发布稿出处）。前 3 项在对比模型里有对应行，bankertoolbench 没有 →
  它会出现在自己的表里，但不会成为对比行。
- 跑分对比行：`gpt-5.6-sol`、`deepseek-v4.1-flash`、`claude-opus-5`
- 结论方向：**榜上有可溯源跑分的模型里最便宜的**（不是「注册表里最便宜的 active 模型」——
  GPT-6 luna $0.10 / $0.50 更便宜，但它一条可溯源分数都没有）；比 Claude Opus 5 便宜 33×（输入）/ 42×（输出）
- source：MiniMax M3.1 Flash 官方发布 `https://www.minimax.cn/blog/minimax-m31f`，
  title「MiniMax M3.1 Flash 官方发布」

## 6. 校验（必须有测试）

`src/features/releases/__tests__/`：

- `select.node.test.ts` —— locale 过滤、published 过滤、倒序、slug 提取。
- `format.node.test.ts` —— 价格格式化（`$0.30` 而不是 `$0.300`）。
- `integrity.node.test.ts` —— 「三者一体」的机器检查，见下。

### 6.1 `integrity.node.test.ts` 检查什么

1. frontmatter 必填字段齐全（`title` / `date` / `checkedAt` / `dataCheckedAt` /
   `vendor` / `modelId` / `sourceUrl` / `sourceTitle`）；
2. `modelId` / `compareModelIds` 都能在 REGISTRY 找到；
   `modelSlug` / `compareSlugs` 都能在 LEADERBOARD 找到；
3. en 与 zh 两种文件一一对应（slug 集合相同）；
4. **文章里引用的每个价格，必须是「本文依赖的模型」当前的价格**；
   每个分数（以及两个分数之差）必须来自本文依赖的模型；
   —— 表格更新了而正文没跟上，这里会红；
5. **文章不能比它引用的数据旧**：依赖模型的价格 `lastVerified` 或分数
   `observedAt` 晚于本文的 `dataCheckedAt` 时报错；
6. 榜单上每个模型都要有发布页，没有的必须写进测试里的 `POST_EXEMPTIONS`
   （这张豁免表要随着文章增加而变短）。

> 豁免规则、¥ 折算、版本号（`Opus 5.5`、`Terminal-Bench 2.1`）这些噪声，
> 护栏里都做了处理：版本号从模型名 / 基准名反推，新增模型自动生效。

### 6.2 `dataCheckedAt` 是什么

`checkedAt` = 最后一次核对**官方来源**的日期；
`dataCheckedAt` = 最后一次把本文的结论和**站内数据**（REGISTRY / LEADERBOARD）
对上的日期。

改价或改分之后，受影响的文章要重读一遍，结论没变就把 `dataCheckedAt` 推到
今天；结论变了，正文里的数字一起改。两者都做，才算「三者一体」。

## 7. 抓取脚本（Phase 4）

`scripts/releases/` —— 参照 `scripts/prices/`：

- `sources.ts` —— 每个厂商的公告页 URL + 标题/日期/正文选择器。
- `fetch.ts` —— Playwright 抓取，**只产出草稿**：
  - `data/release-drafts/<slug>.md` —— 带 frontmatter 骨架的 MDX 草稿
  - `data/release-drafts/<slug>.json` —— 抽取到的事实（标题/日期/小标题/正文纯文本）
- **绝不自动写入 `src/content/releases/`**，绝不自动填价格和结论。
  脚本只负责省掉「复制粘贴官方公告」这一步；判断和数字仍然人工过一遍。
- `README.md` —— 工作流说明。
- `pnpm releases:fetch` —— 跑一次。

## 8. SEO

- 列表页 / 详情页都进 `sitemap.xml`。
- 详情页 JSON-LD：`BlogPosting`（`datePublished` = `date`，
  `isBasedOn` = `sourceUrl`，`about` = 主角模型）。
- 详情页 canonical 用 `localeHead({ path: '/releases/<slug>' })`。
- 详情页 → 榜单 / 对比 / 计算器的内链；模型页 → 相关发布（Phase 3）。
- RSS：`/feed.xml` 把中英两版各发一条 `<item>`，用 `dc:language` 区分；
  `<head>` 里有 `<link rel="alternate" type="application/rss+xml">`。

### 8.1 JSON-LD 的坑（已修）

`head()` 只认 `meta` 和 `links`，**`scripts[]` 会被直接忽略**。
JSON-LD 必须走 `meta`：TanStack Router 会把带 `script:ld+json` 键的 meta
渲染成 `<script type="application/ld+json">`。

```ts
// ✅ 现在这样写
const { meta, links } = localeHead({ ..., scripts: [jsonLd(obj)] })
return { meta, links }
// localeHead 内部把 scripts 拼进 meta

// ❌ 以前这样写 —— scripts 数组根本不会渲染
return { meta, links, scripts }
```

注意：router 是把 JSON 当**脚本原文**输出的，所以 JSON-LD 的字符串里
不能出现 `<`、`>`、`&`。
