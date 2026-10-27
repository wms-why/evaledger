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
    // 厂商自己的片子的本地镜像（放在 public/ 下）。
    // 正文是 .md，裸 HTML 会被剥掉，所以 <video> 只能走 frontmatter。
    videoSrc: z.string().optional(),      // 站内相对路径，例如 /media/x.mp4
    videoPoster: z.string().optional(),   // 封面帧
    videoCaption: z.string().optional(),  // 图注（中英各一份）
    published: z.boolean().default(true),
  }),
})
```

## 2. 路由

| URL | 说明 |
| --- | --- |
| `/{-locale}/releases` | 列表页：按 `releasedAt` 倒序（模型发布日；没有可核实发布日的排在最后），卡片显示厂商 / 主角模型 / 一句话结论 / 价格 / 跑分有无 |
| `/{-locale}/releases/$slug` | 详情页：`$slug` 不带 locale 后缀，`/releases/x` = en，`/zh/releases/x` = zh |

slug = 文件名去掉 `.md` / `.zh.md`。中英共用同一个 slug。

## 3. 详情页版式（路由渲染，MDX 只放正文）

```
[SiteNav]
[Header]  kicker「Model release · 厂商」/ H1 / 发布日 / 一句话 description
[Fact sheet]  ← 实时数据，本系列的价值核心
    · 跑分表：有 modelSlug 才有；没有就渲染诚实的空状态
      · **两个高亮必须分开**：主角列用底色 + 徽章标出（说的是「这是谁」），
        每行的最高分用加粗标出（说的是「这一行谁赢了」）。主角不是每行都赢，
        输掉的那一行加粗落在对手身上；并列第一则谁都不加粗。
    · 价格表：主角行高亮 + compareModelIds 各行（状态徽章：active / legacy）
    · 「你的用量要多少钱」：1M input + 500K output 的月度估算（实时算）
    · context window / cached input 单价 / 各自 sourceUrl + lastVerified
    · pending 文章：以上全部换成一句「还没正式上线」的说明
[Video]     ← 有 videoSrc 才渲染（controls + poster + 图注）
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

## 5. 已发篇目（6 家主力各 1 篇；DeepSeek 两个 checkpoint 两篇）

| slug | 厂商 | 主角 | modelId | modelSlug | releasedAt |
| --- | --- | --- | --- | --- | --- |
| `gpt-6-astra` | OpenAI | GPT-6 astra | `gpt-6-astra` | — | — |
| `claude-opus-5-5` | Anthropic | Claude Opus 5.5 | `claude-opus-5.5` | — | — |
| `gemini-3-1-pro` | Google | Gemini 3.1 Pro | `gemini-3.1-pro-preview` | `gemini-3.1-pro` | — |
| `gemini-4-argon` | Google | Gemini 4 Argon | `gemini-4-argon` | `gemini-4-argon` | `2026-10-13` |
| `grok-4-7` | xAI | Grok 4.7 | `grok-4.7` | `grok-4.7` | — |
| `deepseek-v4-1-flash` | DeepSeek | DeepSeek V4.1-Flash 0910 | `deepseek-flash-0910` | `deepseek-v4.1-flash` | `2026-09-10` |
| `deepseek-v4-1-flash-1017` | DeepSeek | DeepSeek V4.1-Flash 1017 | `deepseek-flash` | `deepseek-v4.1-flash-1017` | `2026-10-17` |
| `minimax-m3-1-flash` | MiniMax | MiniMax M3.1 Flash | `minimax-m3.1-flash` | `minimax-m3.1-flash` | `2026-10-19` |
| `kimi-k3-1` | Moonshot | Kimi K3.1 Pro | `kimi-k3.1-pro` | `kimi-k3.1-pro` | `2026-10-24` |
| `gpt-6-1-terra` | OpenAI | GPT-6.1 Terra | `gpt-6.1-terra` | `gpt-6.1-terra` | `2026-10-26` |

`gpt-6-astra` 与 `claude-opus-5-5` **故意不给** `modelSlug`：
榜单里没有这两个 SKU 的可溯源跑分，就不编。正文里要写明「还没有核验过的跑分」。

**同一模型线的两个 checkpoint，要两篇，不是一篇。** DeepSeek 在同一个 API 模型名
（`deepseek-flash`）下滚动更新 checkpoint：0910 首发与 1017 当前版的权重不同、
跑分不同、公告也不同，所以价格行、榜单行、发布文章各一份，两篇互链。
**不要把两套分数并到一行，也不要让一篇文章引用另一套分数。**

### 5.2 抓取中的篇目（草稿）

> 这一节登记**还没发布**的篇目：抓取脚本已经认领了它的来源，但文章本身
> 仍然只存在于 `data/release-drafts/` 里，等人来写。**发布之前，这里不写任何数字**
> —— 没有核实过的价格、跑分、上下文长度、发布日期，一律不落笔。
>
> 目前没有在抓取中的篇目（`gpt-6-1-terra` 已于 2026-10-27 发布，见上面的表）。

> 抓这一页有个坑，值得留着备忘：**不带 `Sec-CH-UA` 客户端提示的请求会被
> openai.com 返回一个 500 错误壳**（HTTP 200，`<title>` 和 `og:` 都在，只有正文没了）。
> 共享的浏览器（`scripts/shared/browser.ts`）现在会带上与 UA 一致的提示头，所以抓得到。
> 以后看到「页面 200 但正文是个 500」，先怀疑这个，别急着改选择器。
> 完整的排错阶梯见 `scripts/README.md` §3。

### 4.1 发布前观察文（`pending: true`）

厂商已经亮出名字、但还没给模型卡 / API ID / 定价 / 跑分时，写一篇
`pending: true` 的观察文 —— 这是本系列唯一的「无数据」形态，规则比正常文章更严：

- **不渲染任何表。** 页面顶部的事实表换成 `releases.pendingTitle` +
  `releases.pendingNote` 的说明块；列表页卡片只显示「尚未发布」徽章，
  不显示价格 / 跑分。
- **正文不许出现任何价格或分数。** `modelId` 还不在 REGISTRY 里，护栏给出的
  允许集合只有 `publishedNumbers` —— 正文里写一个 `$4` 或一个 `55.7` 就会红。
  厂商自己公布过、而你要引用的数字（例如前代的参数量 2.8）必须逐条列进
  `publishedNumbers`，别的一律不写。
- **`modelName` 必填。** REGISTRY 里没有这一行，页面没法从注册表取名字。
- **`releasedAt` / `modelSlug` / `compareModelIds` 必须缺省。** 没发布就没有上线日、
  没有榜单行、没有可比价的价格行；填了就说明你在编。
- **`pending` 与 REGISTRY 互斥。** 模型一旦进了注册表就算发布，护栏会要求你
  去掉 `pending` 并重写全文 —— 这是刻意设计：这篇文是「等」，不是「快照」。

**厂商的片子走 frontmatter，不走正文。** 正文是 `.md`，裸 HTML 会被剥掉，
所以 `<video>` 写进正文等于白写。把片子镜像到 `public/media/`，然后填
`videoSrc`（站内相对路径）+ `videoPoster` + `videoCaption`；护栏会检查这两个路径
确实指向 `public/` 下的文件，e2e 会检查它真的能读出元数据（`readyState > 0`）。
不要热链厂商 CDN 的地址——那些链接会轮换。

**发布当天的清单（按顺序做，缺一项护栏就会红）：**
以 Kimi K3.1 Pro（2026-10-24）为例：

1. REGISTRY 加价格行（`kimi-k3.1-pro`）→ `status: 'active'`，`lastVerified` = 当天，
   `REGISTRY.fetchedAt` = 当天；同门的其它行按「换 checkpoint」规则处置。
2. LEADERBOARD 加分数行（`kimi-k3.1-pro`）+ `priceId` 指回第 1 步；
   只登厂商表格或第三方榜单里真实存在的项，缺项就空着。
3. `src/features/records/ledger.ts` 加记录（新版本 = 新记录，`supersedes` 指向前代）；
   `pnpm records:pins` 拿模板。
4. 若这条线要做 `/series`，`src/features/series/series.ts` 加成员。
5. 删掉 `POST_EXEMPTIONS` 里的占位（如果当时加过）。
6. **改这篇文本身**：删 `pending` / `modelName` / `publishedNumbers`，
   把 `modelId` 改成注册表里的 id，填 `releasedAt` / `modelSlug` /
   `compareModelIds` / `compareSlugs`，正文从「观察」重写成「发布 + 成本 + 换型」，
   `dataCheckedAt` 推到当天。`videoSrc` 那几行可以留着。
7. `pnpm test` + `pnpm typecheck` + `pnpm build`，再单独跑
   `npx playwright test e2e/releases.spec.ts`。

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

#### `gemini-4-argon`（Google · Gemini 4 家族第一位）
- 主角：`gemini-4-argon` $2 / $10，cached $0.10，ctx 1,048,576（输入 + 思考 + 输出**共用一个池子**），
  source `https://ai.google.dev/gemini-api/docs/pricing`，lastVerified 2026-10-20
- **促销价：$2 / $10 / $0.10 适用至 2026-11-30，2026-12-01 起 $4 / $20 / $0.20**（与今天的 Claude Opus 5.5 同价）
- **没有 >200K 长上下文档位**（Gemini 3.1 Pro / 2.5 Pro 都有），且**只支持隐式缓存**——
  `cachedContents` / `caches.create` 不支持，95% 缓存折扣至少要 4,096 token 的提示词
- Batch / Flex = 标准价的一半，Priority = 1.8×
- releasedAt 2026-10-13（2026-09-29 只向 Fairwind 计划成员限量预览）
- 对比行：`gemini-3.1-pro-preview` $2 / $12、`gemini-3.8-flash` $0.75 / $3.75、
  `claude-opus-5.5` $4 / $20、`gpt-6-astra` $10 / $50、`deepseek-flash` $0.30 / $1.20
- 跑分（`gemini-4-argon`，**10 项**，全部来自 Google 官方评测方法说明
  `https://deepmind.google/models/evals-methodology/gemini-4-argon`）：
  vals-index 68.9、automation-bench 51.3、deepswe-v1.1 77.9、frontierswe-v2 55、
  terminal-bench-4.0 57.4、agents-last-exam 39.5、osworld-2.0 69.2、chartography 71.6、
  graphwalks 84.2、cwe-bench-v1 68
- 每一项的 note 都带两样东西：**harness**（哪几行是 Google 自己跑的、哪几行来自公开榜单或对手的
  system card；全部 pass@1、最高思考档，而 API 默认是 `medium`），以及 **Google 表里对手的分数**
  ——那是 Google 对别家模型的测量值，正文里必须写成「Google 的表里」，不能写成我们自己的测量
- 跑分对比行：`gpt-6-astra`、`claude-opus-5.5`、`claude-opus-5`、`deepseek-v4.1-flash-1017`、`gemini-3.1-pro`
- 结论方向：促销期内是三家里最便宜的前沿旗舰，12 月起与 Opus 5.5 同价；官方十九行表里 13 胜 1 平 5 负，
  其中 Agent 编程 2-2（赢 DeepSWE，Terminal-bench 4.0 垫底）
- source：Google 发布公告
  `https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-argon/`，
  title「Google — Gemini 4 Argon: Built to solve your hardest problems」

#### `grok-4-7`（xAI）
- 主角：`grok-4.7` $2 / $6，ctx 500,000，source `https://docs.x.ai/docs/models`，lastVerified 2026-09-26
- 对比行：
  - `grok-4` $3 / $15（delisted，note: Replaced by Grok 4.7）→ 输入便宜 33%、输出便宜 60%
  - 上下文 256,000 → 500,000
- 跑分（`grok-4.7`）：terminal-bench-4.0 38.0、deepswe-v1.1 71.0（note: listed as "DeepSWE"）
- 跑分对比行：`gpt-5.6-sol`、`claude-opus-5`、`gemini-3.1-pro`
- 结论方向：输出只要 $6 —— 比 GPT-5.6 sol 的 $20 便宜 70%，比 Claude Opus 5 的 $25 便宜 76%
- source：`https://docs.x.ai/docs/models`，title「xAI — Models & pricing」

#### `deepseek-v4-1-flash`（DeepSeek · 0910 首发 checkpoint）
- 主角：`deepseek-flash-0910` $0.30 / $1.20（peak），cached $0.006，ctx 1,000,000，
  off-peak $0.15 / $0.60（peak 的一半），
  off-peakNote: Mon–Fri (excl. Chinese holidays). Peak 01:00–04:00 & 06:00–10:00 UTC; off-peak = all other times.
  source `https://api-docs.deepseek.com/quick_start/pricing`，lastVerified 2026-10-20
- 该行 status = delisted：0910 checkpoint 已被 1017 取代，API 不再提供；价格留着给长尾搜索
- releasedAt 2026-09-10
- 对比行：`deepseek-v4-pro` $1.32 / $3.96（peak，off-peak $0.66 / $1.98）→ 主角便宜 4.4×（输入）/ 3.3×（输出）
- 缓存折扣：$0.006 = 输入价的 2%（省 98%）
- 跑分（`deepseek-v4.1-flash`，19 项）：gpqa-diamond 90.9、hle 36.8（note: 39.1 on text-only subset）、
  codeforces 3471（rating）、matharena-apex 65.6、terminal-bench-2.1 90.6、terminal-bench-3.0 30.0、
  terminal-bench-4.0 31.2、deepswe-v1.1 74.2、programbench 20.3、nl2repo-bench 65.4、cybergym 88.1、
  sec-bench-pro 62.8、exploitgym 15.3、hle-tools 63.9、automation-bench 54.8、agents-last-exam 31.8、
  chartography-tools 78.9、babyvision-tools 89.6、zerobench-main-tools 49.0
- 跑分对比行：`gpt-5.6-sol`、`claude-opus-5`、`gemini-3.1-pro`、`kimi-k3`、`glm-5.3`
- 结论方向：注册表里最便宜的模型之一；同门 V4-Pro 是它的 3–4 倍
- source：DeepSeek V4.1 Flash 发布公告 `https://mp.weixin.qq.com/s/qg0NU3NNUbp1co2PdkAPAg`，
  title「DeepSeek V4.1 Flash 发布公告」

#### `deepseek-v4-1-flash-1017`（DeepSeek · 1017 当前 checkpoint）
- 主角：`deepseek-flash` $0.30 / $1.20（peak），cached $0.006，ctx 1,000,000，
  off-peak $0.15 / $0.60、off-peak cached $0.003，
  source `https://api-docs.deepseek.com/quick_start/pricing`，lastVerified 2026-10-20
- **价格与 0910 那一行完全相同**——变的只有权重
- releasedAt 2026-10-17
- 对比行：`deepseek-v4-pro` $1.32 / $3.96（peak）→ 主角便宜 4.4×（输入）/ 3.3×（输出）
- 跑分（`deepseek-v4.1-flash-1017`，11 项，来自 1017 公告对照表）：hle 42.6（note: 44.0 on text-only subset）、
  terminal-bench-4.0 42.3（note: measured with the Claude Code framework）、
  deepswe-v1.1 77.0（note: Mini-SWE-V2 framework）、programbench 29.1、nl2repo-bench 68.2、
  automation-bench 60.5、agents-last-exam 35.4、apex-bench-v1.1 72.1
  （note: Apex Bench v1.1 — not MathArena Apex）、chartography-tools 83.0、babyvision-tools 92.5、
  zerobench-main-tools 51.0（note: Pass@5）
- 跑分对比行：`deepseek-v4.1-flash`（0910 行）、`kimi-k3`、`glm-5.3`、`gpt-5.6-sol`、`claude-opus-5`
- **不可引用**：1017 公告里的单任务成本（$0.19 / $0.47 之类）不是每 1M token 的单价；
  Search & Fetch 的按次价格（$0.75 / 千次）也不在价格表里——正文只描述，不写数字
- source：`https://api-docs.deepseek.com/news/news261017/`，
  title「DeepSeek-V4.1-Flash-1017: Wish-Driven Programming Made Real」

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

#### `kimi-k3-1`（Moonshot · Kimi K3.1 Pro）
- 主角：`kimi-k3.1-pro` $2.00 / $10.00，cached $0.20，cacheWrite 5min $2.00 / 1hr $4.00，
  ctx 1,048,576，source `https://platform.kimi.ai/docs/pricing`，lastVerified 2026-10-24
- releasedAt 2026-10-24（英文站源 `https://kimi.com/blog/kimi-k3-1-pro`，中文站源为同一篇的
  微信公告 `https://mp.weixin.qq.com/s/Q6Z-skAUH_na9g37VWbHew`）
- 对比行：
  - `kimi-k3` $3.00 / $15.00 / $0.30（active）→ **主角便宜三分之一**（两个计价维度都是）
  - `kimi-k3.1-pro-highspeed` $4.00 / $20.00 / $0.20（active）→ 高速版，智能相同、价格 2×
  - `gpt-6-astra` $10 / $50、`claude-opus-5.5` $4 / $20、`deepseek-flash` $0.30 / $1.20、
    `minimax-m3.1-flash` $0.15 / $0.60
- 缓存折扣：$0.20 = 输入价的 10%（省 90%）；**缓存写入另计**（5 分钟 $2.00、1 小时 $4.00），
  和 Anthropic 同一形状，不是 DeepSeek 那种「写入并进未命中价」
- 上下文：1,048,576 —— K3 系列统一，不是 K2 的 262,144
- 跑分（`kimi-k3.1-pro`，**13 项**，全部出自月之暗面自己的发布公告）：
  terminal-bench-4.0 65.7、terminal-bench-science-0.1 38.1、agents-last-exam 43.2、
  officeqa-pro-v2 64.4、gdpval-aa 1846.0（unit: absolute）、hle-tools 79.8、
  chartography-tools 90.2、swe-marathon 51.7、benchcad 92.7、frontier-finance 58.6、
  osworld-2.1 79.6、gdp-pdf 34.6、zerobench-main-tools 63.0
  —— 每一条 note 都带着 harness（Claude Code / Kimi Code / Kimi Agent harness / 官方 finance agent v2
  harness / 五轮取平均）与「这张表里对手的分数」的归属
- 跑分对比行：`kimi-k3`、`gpt-6-astra`、`claude-opus-5.5`、`claude-fable-5.1`、
  `deepseek-v4.1-flash-1017`、`glm-5.3`
- **不收的项**：月之暗面内部的 Kimi Code Bench 3.0 没有公开榜单，只有一家厂商的数字 →
  不进基准表，正文也不引用它的数字
- 结论方向：比同门 K3 便宜三分之一、比 Opus 5.5 便宜一半；Terminal-Bench 4.0 只落后 Opus 5.5
  一个点，但缺 GPQA Diamond / HLE（无工具）/ MathArena Apex / DeepSWE / AutomationBench，
  所以进不了排名榜 —— 只能标「未测」
- source：Kimi 官方发布公告 `https://kimi.com/blog/kimi-k3-1-pro`，
  title「Kimi — Introducing Kimi K3.1 Pro」

#### `gpt-6-1-terra`（OpenAI · GPT-6.1 Terra）

- 主角：`gpt-6.1-terra` $1 / $5，cached $0.05，ctx 1,050,000（单次输出上限 128,000），
  source `https://platform.openai.com/docs/pricing`，lastVerified 2026-10-27
- 长上下文：> 272,000 输入 token 后，**整个请求**按输入 2 倍、输出 1.5 倍计费
- 缓存写入：30 分钟 $1.25、12 小时 $2.50（长上下文调整前）—— OpenAI 的档位形状和
  Anthropic 的 5min/1hr 不同，**不进 `cacheWrite` 字段**，写进 note
- 其它通道：Batch / Flex = 标准价的一半（`tiers`），Fast 模式 = 2×，地区处理 +10%
- **releasedAt 2026-10-26**：公告页本身只渲染「2026 年」，日期来自 OpenAI 开发者更新的
  changelog（`https://developers.openai.com/changelog`）里那条写着「Released GPT-6.1
  Terra」的记录 —— 公告给不出上线日时，厂商自己的 changelog 是第二手的一手来源
- 对比行：
  - `gpt-6-astra` $10 / $50（active）→ **主角便宜 10 倍**
  - `gpt-6-sol` $2 / $10（active）→ **主角便宜一半**
  - `gpt-6-luna` $0.10 / $0.50（active）→ 主角贵 10 倍
  - `claude-opus-5.5` $4 / $20（active，ctx 1,000,000）→ **主角便宜 4 倍**
  - `gpt-5.6-sol` $4 / $20（active，促销到 2026-11-21，之后 $5 / $30）→ 便宜 4 倍 / 5 倍
- 缓存折扣：$0.05 = 输入价的 5%（省 95%），比 GPT-6 同门其它档的 90% 更深
- 跑分（`gpt-6.1-terra`，**2 项**，全部出自 OpenAI 自己的发布材料）：
  - `terminal-bench-4.0` 50.3（note：max 推理档；OpenAI 自己拿来对比的
    GPT-5.6 Terra 是 21.5）
  - `agents-last-exam` 60.0（note：OpenAI 那张「成本对分数」图的 max 档点，
    图标题写的是 **Agents' Last Exam v1**，而这一列其他行来自 v1.1 任务集；
    同图 max 档：Claude Opus 5.5 63.2、GPT-6 Astra 59.3、GPT-6.1 Sol 58.6、
    GPT-6 Luna 50.9、GPT-5.6 Terra 50.7）
  - **60.0 成为该基准的全站最高分**，于是 agent 榜这一列的归一化分母变高，
    已有模型的综合分随之下调 —— 这是「新模型成为核心基准最高分」时唯一允许的变动，
    必须在 changelog 里写明
  - 公告里的 MMMU-Pro、OSWorld 2.1、Terminal-Bench Science 0.1 都只给了相对结论、
    没有绝对分数，**不进表**；内部的错误率基准是私有基准，**正文也不引用它的数字**
- 跑分对比行：`gpt-6-astra`、`claude-opus-5.5`、`gpt-5.6-sol`
- 结论方向：比同门 sol 便宜一半、比 astra 便宜 10 倍、比 Opus 5.5 便宜 4 倍；
  覆盖只有两项，没有 GPQA / HLE / DeepSWE / AutomationBench，所以**只列出、不排名**
- series：GPT-6 产品线新增成员 `terra`（version 6.1，tier fast），
  pair URL `/series/gpt-6/terra-vs-astra`
- 发布日期出处：OpenAI 开发者更新 changelog `https://developers.openai.com/changelog`
  （2026-10-26 条目）
- source：OpenAI 发布公告 `https://openai.com/index/introducing-gpt-6-1-terra/`，
  title「OpenAI — Introducing GPT-6.1 Terra」（中文页
  `https://openai.com/zh-Hans-CN/index/introducing-gpt-6-1-terra/`，
  title「OpenAI — 推出 GPT-6.1 Terra」；抓取脚本认的是中文页）

## 6. 校验（必须有测试）

`src/features/releases/__tests__/`：

- `select.node.test.ts` —— locale 过滤、published 过滤、倒序、slug 提取。
- `format.node.test.ts` —— 价格格式化（`$0.30` 而不是 `$0.300`）。
- `score-table.node.test.ts` —— 跑分表的两个高亮互不串味：主角列恒定高亮，
  每行的加粗只落在唯一的最高分上（并列不加粗）。
- `integrity.node.test.ts` —— 「三者一体」的机器检查，见下。

### 6.1 `integrity.node.test.ts` 检查什么

1. frontmatter 必填字段齐全（`title` / `date` / `checkedAt` / `dataCheckedAt` /
   `vendor` / `modelId` / `sourceUrl` / `sourceTitle`）；
2. `modelId` / `compareModelIds` 都能在 REGISTRY 找到；
   `modelSlug` / `compareSlugs` 都能在 LEADERBOARD 找到；
   —— **`pending: true` 的文章例外**：它的 `modelId` 还不在注册表里（那正是它
   要观察的对象），护栏只要求 `modelName` 存在；
3. en 与 zh 两种文件一一对应（slug 集合相同）；
4. **文章里引用的每个价格，必须是「本文依赖的模型」当前的价格**；
   每个分数（以及两个分数之差）必须来自本文依赖的模型；
   —— 表格更新了而正文没跟上，这里会红；
   —— `pending` 文章的允许集合只有 `publishedNumbers`，正文里任何价格 / 分数都会红；
5. **文章不能比它引用的数据旧**：依赖模型的价格 `lastVerified` 或分数
   `observedAt` 晚于本文的 `dataCheckedAt` 时报错；
6. 榜单上每个模型都要有发布页，没有的必须写进测试里的 `POST_EXEMPTIONS`
   （这张豁免表要随着文章增加而变短）；
7. **`pending` 标记必须诚实**：模型已经在 REGISTRY 里却还挂着 `pending: true`
   会红；`pending` 文章带了 `releasedAt` / `modelSlug` 也会红；
   反过来，已发布文章带了 `publishedNumbers` 也会红；
8. **视频路径必须真实**：`videoSrc` / `videoPoster` 必须是站内相对路径，
   且指向 `public/` 下真实存在的文件；只有 poster 没有 src 也会红。

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
