# EvalLedger — SEO 回归审计

> **本文件含两轮记录。** 下面是第二轮（2026-10-24）的完整审计；**第三轮**
> （2026-10-25，针对第二轮部署后仍存在的回归：基准版本号重复、Token Calculator
> 过时 FAQ、4 条价格口径、URL 规范守卫）在文末「第三轮：生产回归修复」一节。

---

# EvalLedger — SEO 第二轮回归审计

**日期：** 2026-10-24 · **基线：** `main` @ `6dd36ab`（线上生产 `https://evaledger.com/` 确认与该提交一致）·
**方法：** 生产站点真实抓取 + 仓库源码检查 + 直接执行注册表（esbuild 打包运行）+ 本地 dev server 逐页验证 + 新增回归测试。
**证据附件：** 三个只读审计的原始证据与复现命令在
[`audit-notes/live.md`](./audit-notes/live.md)、
[`audit-notes/links-meta.md`](./audit-notes/links-meta.md)、
[`audit-notes/data-consistency.md`](./audit-notes/data-consistency.md)。
第一轮的审计与实现记录见 [`seo-audit.md`](./seo-audit.md) 与
[`seo-implementation-report.md`](./seo-implementation-report.md)；本轮**不重复**第一轮已完成的改造，且不新增任何页面。

---

## 0. 结论摘要

| 维度 | 结果 |
| --- | --- |
| 本轮修复 | **26 项**：重复版本号（4 个渲染点）、`/en` 301、尾斜杠 308、单跳别名、主机/协议 301、全站 title 模板统一（品牌唯一 + **≤60 字符**）、全站 meta description **≤160 字符**、board+series+5 个 hub 的 BreadcrumbList、BlogPosting 补齐、sponsor 入链、waitlist noindex、9 处与注册表矛盾的文案、38 条 zh benchmark 描述、grok 发布日期、首页 teaser 日期、zh changelog 链接、OG/Twitter 社交头、e2e/sitemap 断言一致性 |
| 新增测试 | 6 个单测文件（32 个用例，其中 6 个替换原 trailing-slash 用例）+ `meta.node.test.ts` 扩展 1 个 + `seo.node.test.ts` 扩展 3 个 + `e2e/seo.spec.ts` 增加 5 个用例、采样页 15 → 27 |
| 线上可确认的 P0/P1 | **0**（第一轮修复的 D1/D2/D3/D4/D5/D9/D11/D16/D17 线上复验仍为已修复） |
| 修复后本地全量复验 | 260 个 sitemap URL 抓取 **0 problems**；hreflang 260/260；内链 0 失效；**0 重复描述**；**0 孤立页** |
| 未部署 | 本轮全部代码修复在工作区，**尚未部署**；线上仍是 HEAD 行为 |
| 未验证 | Search Console / 索引状态 / 排名 / 流量 / 搜索量 / CWV / 反链 —— 全部标记为 UNVERIFIED，**本文件不包含任何编造的流量或排名数字** |

**基线说明（重要）：** 审计开始后，另一个并行 DSH 会话在 16:37 对
`src/features/seo/sitemap-core.ts`（core sitemap 28 → 60 个英文路径）与
`sitemap-core.node.test.ts` 做了**未提交**改动，并删除了一个临时测试文件。
该改动**不属于本轮审计**，本文件不评估其 SEO 取舍；工作区已原样保留（快照：
`/tmp/sitemap-core.external.patch`）。本轮的修复叠加在其之上。审计结论以
**HEAD / 生产** 为基线，工作区修复另行标注。

---

## 1. 检查对象、方法、限制

### 1.1 检查对象

- 生产 `https://evaledger.com/`：262 个 sitemap URL（core 38 = 28 en + 10 zh；full 262 = 131 en + 131 zh）、
  585 个唯一内部 URL（sitemap 之外再跟两层内链）、16 497 个内部 `<a href>`、25 个随机页面响应头。
- 仓库：所有路由、`src/features/seo/`、i18n 字典、价格/评分/基准/系列/发布注册表、`src/worker.ts`。
- 本地 dev server（:3000，工作区代码 + HMR）：260 个 sitemap URL 逐页验证修复后的 head/结构化数据/内链。

### 1.2 方法

- **执行而非阅读**：注册表用 esbuild 打包后 `node` 执行，输出 JSON 再与页面 SSR HTML 逐值比对
  （`npx tsx` 在本机已损坏，改用
  `./node_modules/.bin/esbuild probe.ts --bundle --platform=node --format=esm --alias:@=./src`）。
- 生产抓取全部使用 `curl`/Python `urllib`，不执行 JS，因此看到的就是爬虫看到的 SSR HTML。
- 本地修复验证：`curl` 本地 dev server + 浏览器 e2e（`npx playwright test e2e/seo.spec.ts`）。
- 所有“修复”都经过**同一条可复现命令**在修复前后各验证一次（见 §7）。

### 1.3 限制（未验证项全部显式列出，绝不虚构）

| 限制 | 后果 |
| --- | --- |
| 无 Search Console / Bing Webmaster / 分析后台 | **不声明任何索引率、抓取预算、曝光、点击、CTR、排名** |
| 无关键词工具（Ahrefs/Semrush/Ads） | 不引用任何搜索量/难度 |
| 无 Lighthouse / CrUX / RUM | 不声明任何性能分数 |
| 无外链数据 | 不评估反链 |
| 全量 Playwright 套件按仓库规定未运行 | 只运行 `e2e/seo.spec.ts`（68 passed）；SEO 面之外的浏览器回归不在本轮保证内 |
| 未部署 | 线上行为 = HEAD；本轮修复以本地验证为准 |
| 未访问厂商页面 | 价格/评分与**注册表**一致，不声明注册表本身与厂商页面一致，那属于价格刷新流程 |

---

## 2. 逐项检查结果

### 2.1 重复版本号（任务 1）— 已修复

**检查对象：** 所有打印基准名 + `version` 的组件及其渲染页面（en + zh）。

**实际证据（生产，修复前，服务端渲染 HTML）：**

| 页面 | 渲染结果 |
| --- | --- |
| `/methodology`、`/zh/methodology` | `DeepSWE v1.1 1.1`、`Terminal-Bench 4.0 4.0`（`<a>DeepSWE v1.1</a><span>1.1</span>`） |
| `/leaderboard/coding` + zh | `DeepSWE v1.1 Version 1.1` |
| `/leaderboard/agent` + zh | `Terminal-Bench 4.0 Version 4.0` |
| 17/18 模型详情页 ×2 语言（共 34 URL） | 如 `/models/deepseek-v4.1-flash-1017`：`Apex Bench v1.1 Version 1.1`、`DeepSWE v1.1 Version 1.1`；`claude-fable-5.1` / `kimi-k3.1-pro` 各 6 处 |
| `ScoreProvenance` 弹层（客户端） | 同一 `name + Version + version` 模式（不在 SSR HTML 中） |

合计 **40 个服务端渲染 URL**。根因：13 个 `BENCHMARKS` 条目的 `name` 已含版本
（如 `DeepSWE v1.1`），而组件又无条件追加 `benchmark.version`。四个渲染点：
`Methodology.tsx:116-120`、`TrackBoard.tsx:249-253`、`ModelProfile.tsx:62-66`、
`ScoreProvenance.tsx:43-47`。全仓 `\.version` 扫描确认**不存在第五个渲染点**。
`/compare/*`、`/best/*`、`/benchmarks/*`、`/releases/*`、`/series/*`、首页均无此问题。

**修复内容：**

- `src/features/leaderboard/benchmarks.ts` 新增唯一判定函数
  `benchmarkVersionSuffix(benchmark)`：仅当 `name` 不含版本串时返回版本，否则返回 `null`。
- 四个渲染点全部改用该函数。将来某个基准的 name 不带版本时仍会显示版本，不会丢信息。

**验证结果：**

- 本地渲染复验：`/methodology`、`/zh/methodology`、`/leaderboard/{coding,agent}`、
  17 个模型页均**不再出现重复版本**（正则 `\b(v?\d+(?:\.\d+)+)\s+\1\b` 扫描代表页面，0 命中）。
- 新增回归测试 `src/features/leaderboard/__tests__/benchmark-version.node.test.ts`（6 个用例）：
  固定 helper 语义、注册表“name 必含版本”约定、以及“四个组件不得直接插值 `.version`”的源码守卫。
- 新增 e2e 用例：对采样页面断言任何基准都不会渲染成 `${name} ${version}`。
- 生产仍是旧行为（未部署），部署后自动消失。

**同类问题排查：** 标题/描述/JSON-LD 中的基准名（`BenchmarkDetail`、`BenchmarkHubPage`、
`ReleaseFactSheet`、`releases/data.ts`）都只输出 `name` 一次，无重复。

---

### 2.2 旧 URL、HTTP 状态、最终跳转、canonical、站点地图（任务 2）— 已修复

**Token Calculator 历史路由（重点）：**

| 请求（生产 HEAD） | 状态 | Location | 结论 |
| --- | --- | --- | --- |
| `/token-calculator` | **301** | `https://evaledger.com/token-cost-calculator` | ✅ 永久别名 |
| `/token-calculator?model=gpt-6-astra` | **301** | `…/token-cost-calculator?model=gpt-6-astra` | ✅ 查询串保留 |
| `/zh/token-calculator` | **301** | `/zh/token-cost-calculator` | ✅ |
| `/token-calculator/`（修复前） | 307 → `/token-calculator` → 301 | 最终 canonical | ⚠ 两跳，本轮已改为单跳 301 |
| `/token-cost-calculator` | 200，self-canonical | — | ✅ 两个 sitemap 中都无别名 |

**旧 URL 检查结论（生产，HEAD）：**

| ID | 严重度 | 问题 | 证据 |
| --- | --- | --- | --- |
| R2-1 | **P2** | `/en`、`/en/*` 返回 **307**（第一轮报告声称已是 301，实际不是） | `curl -sI /en` → `HTTP/2 307, location: /`；TanStack `redirect()` 默认 307 |
| R2-2 | **P2** | 所有尾斜杠 URL 返回 **307** | `curl -sI /models/claude-opus-5.5/` → 307；与别名组合出两跳链 |
| R2-3 | **P2** | `http://`、`https://www.`、旧主机 `tokencalculator.flowmails.net` 均 **200** 返回同一站点（canonical 指向 apex，但没有主机级 301） | `curl -w '%{http_code}'` 三者均 200；`wrangler.jsonc` 把 www 与 legacy host 都配成 custom_domain |
| R2-4 | **P3** | `/en/index.html` → 307 → `/index.html` → **404**（跳转落到 404） | `curl`: 307 `location: /index.html`，该地址 404 |

**修复内容（工作区）：**

- 新增 `src/features/seo/canonical-redirect.ts`，由 `src/worker.ts` 在进入路由前统一执行：
  - `permanentPathRedirect()`：GET/HEAD 的尾斜杠 → **308**；`/en` 前缀 → **301** 去前缀；
    `/token-calculator` 等历史别名 → **301** 直达 canonical；三者合并为**单跳**
    （`/en/token-calculator?model=…` 一次 301 到 `/token-cost-calculator?model=…`，不再 308→301 链）。
  - `canonicalHostRedirect()`：GET/HEAD 的 `http://`、`www.`、legacy host → **301** 到
    `BETTER_AUTH_URL` 的 canonical origin，保留 path+query；`isLocalOrigin()` 保证本地开发
    （`localhost`/`127.0.0.1`）不会被强制跳到配置端口。
  - `src/routes/{-$locale}/route.tsx`：`/en` 路由层重定向也显式 `statusCode: 301`（作为 POST 等边缘入口兜底）。
- 主机级跳转属于**代码化配置**：legacy host 的 auth POST 仍由 `AUTH_TRUSTED_ORIGINS` 兼容；
  迁移完成后可再从 `wrangler.jsonc` 下线 legacy custom domain（见 §5）。

**验证结果（本地，修复后）：**

- `/en`、`/en/` → **301** `/`；`/en/token-calculator?model=…` → **301** `/token-cost-calculator?model=…`（单跳）。
- `/token-calculator/` → **301** `/token-cost-calculator`（单跳，query 保留）。
- `/models/claude-opus-5.5/`、`/zh/`、`/sitemap.xml/` → **308**，Location 正确；canonical 路径 200。
- 新增单测 `src/features/seo/canonical-redirect.node.test.ts`（8 个用例）与 e2e `legacy URLs`（3 个用例，全部通过）。
- 生产当前仍是 HEAD 行为；部署后执行 §7 的命令复核。

**站点地图与 canonical 一致性（生产 + 本地）：**

- 生产 `/sitemap.xml` 与 `/sitemap-core.xml` 字节相同，38 URL（28 en + 10 zh）；`/sitemap-full.xml` 262 URL，core ⊂ full，无重复 `<loc>`；两个文件均不含别名 URL。
- 262/262 个 sitemap URL：200、canonical == 自身、无 `noindex`；hreflang `en`/`zh`/`x-default` 三元组
  262/262 互指正确，HTML head 与 sitemap XML 完全一致；hreflang 目标本身 200 且 self-canonical。
- 本地修复后：waitlist 已 noindex（见 §2.5），sitemap 260 URL，全部 200 + canonical 自身 + hreflang 正确（`PROBLEMS 0`）。
- 已知限制：三个 sitemap 均**没有 `<lastmod>`**（P3，见 §5）；core 列表被并行会话扩至 60 en 路径，
  与第一轮“core 保持精简”的设计原则存在张力，本文件仅记录、不评价。

---

### 2.3 robots、sitemap、hreflang、canonical、结构化数据、生产响应（任务 3）

**robots.txt（生产）：** 200 `text/plain`，
`User-agent: *`、`Allow: /`、`Allow: /api/prices.json`、`Disallow: /*/app`、`/app`、`/*/admin`、`/admin`、`/api/`、
`Sitemap: https://evaledger.com/sitemap-core.xml`。
最长匹配规则下没有任何 sitemap 路径被误封；`/api/prices.json` 可抓（200 JSON）；full sitemap 故意未声明。

**结构化数据（生产 262 页 + 本地修复后复验）：**

- JSON-LD 全部可解析（0 错误、0 缺 `@context`）；FAQPage 的 Q/A 文本与可见 HTML 一致（22 页 0 不匹配）；
  没有 `aggregateRating`、`review`、`rating` 等编造评分；`SoftwareApplication.url`/`BlogPosting.url`
  与 canonical 一致；`BreadcrumbList` 最后一个 item 的 URL == 页面 canonical。
- **本轮修复：**
  - 第一轮记录声称 `/leaderboard/*` 有 `BreadcrumbList`，实际完全没有 → 4 个 board ×2 语言补齐。
  - `/series` hub 只有 ItemList、无 BreadcrumbList → 补齐。
  - `/compare`、`/releases`、`/methodology`、`/changelog`、`/data-quality` 五个 hub 补 BreadcrumbList。
  - release 的 `BlogPosting` 补 `image`（站点唯一的品牌图，与 `og:image` 同源）与 `mainEntityOfPage`。
- **仍未补：** `ItemList` 中个别 `ListItem` 无 `url`（该版本没有模型页，schema 合法）；法律类页面
  `/sponsor`、`/waitlist`、`/terms`、`/privacy`（×2 = 8 URL）无 JSON-LD（P3，见 §5）。
- 响应头：HSTS 25/25；无 `X-Robots-Tag`（无意外 noindex）；HTML/sitemap/robots **无 Cache-Control**（P3）；
  未知路径全部是真实 404（无软 404）；核心内容全部 SSR（标题/描述/canonical/hreflang/H1/正文都在原始 HTML 中，
  无 “Loading…” 占位）。

---

### 2.4 跨页面数据一致性（任务 4）— 数据表 0 不一致；9 处文案矛盾已修复

**逐值比对（注册表 vs SSR HTML，en + zh）：**

| 面 | 覆盖 | 结果 |
| --- | --- | --- |
| 模型详情 | 18 模型 ×2：价格（生效价）、分数、上下文、日期、来源、blended、排名、composite、verdict | **0 不一致** |
| 能力榜 | 4 board ×2：权重、field best 及持有者、原始分、composite、排名、未排名分区 | **0 不一致** |
| Benchmark | 38 ×2：名称、单位、分数与降序、“where this counts” | **0 不一致** |
| Best 页 | 9 ×2：行顺序、composite、价格、上下文、缓存折扣、日期 | **0 不一致** |
| Compare | 32 对 ×2：双方各自分数（无借用）、blended、性价比、月成本 | **0 不一致** |
| 计算器 + 8 个厂商页 | 25 张卡片：月/年成本、$/1M、上下文、日期；FAQ 算术 | **0 不一致** |
| Release | 11 篇 ×2：主题价格行、分数行、日期、样例成本、倍数 | **0 不一致** |
| 首页 | 18 LLM、10 ranked / 8 untracked、榜表、价格 teaser | **0 不一致** |

**发现的“文案 vs 注册表”矛盾（本轮修复，9/9）：**

| # | 页面 | 修复前（错误） | 注册表事实 | 修复后 |
| --- | --- | --- | --- | --- |
| 1 | `/chatgpt-api-pricing` + zh | "GPT-6 astra is the **most expensive active model**" | `gpt-5.6-cyber` $12.50/$75 更贵，且同页表格就有 | 去掉最高级："is the flagship at $10 / $50" |
| 2 | `/gemini-api-pricing` + zh | "Flash-Lite is the **cheapest Gemini tier in the registry**"（TLDR + FAQ） | `gemini-2.5-flash-lite` $0.10/$0.40 更便宜，同页有行 | 改为 "the low-cost Gemini tier" |
| 3 | `/chatgpt-api-pricing` + zh | "GPT-5 nano / luna output **8–20× cheaper** than the flagship" | luna vs astra = **100×**；nano vs astra = **125×** | "GPT-6 luna … output rate is 100× below GPT-6 astra's" |
| 4 | `/claude-token-cost-calculator`、`/openrouter-pricing-calculator` + zh | "Haiku 4.5 / **GPT-5 nano** cost roughly **5–10× less**"（与 #3 自相矛盾） | Haiku vs Fable 5.1 = 10×；GPT-5 nano 已 `delisted`，实际 125× | 改为 Haiku 10× vs Fable 5.1、luna 100× vs astra（en+zh） |
| 5 | `/token-cost-calculator` + zh | "Haiku 4.5 and GPT-6 luna cost roughly 10× less than the flagship" | luna vs astra = 100× | 拆开为两个真实倍数 |
| 6 | `/deepseek-api-pricing` + zh | "V4-Pro … **~2.3× cheaper on output**" | 2.3 是**输入**比（3/1.32）；输出比 Sonnet 4.5 = **3.79×** | "~3.8× cheaper than it on output" |
| 7 | `/chatgpt-api-pricing` + zh | TLDR 首条推 **GPT-5**（已 delisted）缓存价 | GPT-6 astra 缓存 $1 = 90% off | 改为 GPT-6 astra 缓存输入 |
| 8 | `/claude-token-cost-calculator`、`/openrouter-pricing-calculator` + zh | TLDR 说 OpenAI 缓存折扣是 GPT-5 的 ~90% | GPT-5 已 delisted；GPT-6 系列 90% | 改为 GPT-6 系列 |
| 9 | `/minimax-api-pricing` vs `/models/minimax-m3.1-flash` | 同一 blended 价一处 $0.38、一处 $0.375 | 0.375 → 统一格式应为 $0.38 | `ModelProfile` 改用 `formatMoney()`；两处均为 $0.38 |

**验证：** 本地渲染逐条复验（如 `/chatgpt-api-pricing` 不再含 "most expensive active"、包含
"100× below GPT-6 astra"；`/deepseek-api-pricing` 含 "3.8×"；MiniMax 两页均 `$0.38`）。
新增 `src/features/i18n/__tests__/copy-claims.node.test.ts`（4 个用例）把“不许再出现的错误最高级”
和“倍数必须等于注册表算出的倍数”固化成测试。

**日期/来源：** 18/18 模型页的 "Last verified" == `lastVerified`，计算器/各 provider 页的
"Updated/Last updated" == `REGISTRY.fetchedAt`（2026-10-24），无“过期但声称最新”的标签；
每条价格来源链接 == `sourceUrl`。本轮修复两处日期缺口：`grok-4.7` 的 `releaseDate` 补为
2026-09-21（与 release 文章一致），首页 release teaser 改用 `releasedAt` 并带 "Released" 标签
（与 `/releases` 一致）。

---

### 2.5 内部链接、失效链接、重复内容、锚文本、孤立页面（任务 5）

**生产（HEAD）：**

- 262 个 sitemap 页面上的 **16 497** 个内部 `<a href>`；sitemap 页面 + 两层内链共 **585** 个唯一内部 URL。
- **0** 个内部链接 404/5xx；**0** 个内部链接需要跳转；**0** 个 sitemap URL 跳转；
  **0** 个 indexable 页面缺席 sitemap；**0** 个 canonical≠自身；**0** 个 hreflang 不匹配。
- 内部链接**从不**使用 `/en`、尾斜杠或 `/token-calculator` 别名（全部指向 canonical URL）。
- 重复锚文本：leaderboard 页面同一 benchmark 链接最多重复 15 次（表格 + 公式 + “缺分”列表），P3。
- 弱锚文本：4 处 “Open in the interactive comparator”（指向 `/compare?models=…`），P3。

**修复/变化：**

- `/sponsor`（各 2 语言）在 sitemap 中可索引，但**全站 0 条入链** → 在 `footer.tsx` 的 Legal 栏加入
  `sponsor.footerSponsor` 链接（该 i18n key 早已存在但从未使用）。
- `/waitlist`（各 2 语言）：入链 0，且页面文案仍是“上线时通知你”与已上线事实冲突 →
  **改为 noindex、移出 sitemap**（head `indexable: false` + `isIndexablePath` 同源判断），
  页面仍可直接访问。若产品决定复用该页（改文案 + 加入口），把这两个开关翻回来即可。
- 本地修复后复验：260 个 sitemap URL、559 个内部链接目标 **0 失效 / 0 跳转**、**0 孤立页**。

---

### 2.6 标题、描述、H1、可索引性、服务器渲染（任务 6）

**全部 sitemap URL（生产 + 本地）：**

- `<title>` 存在且**无重复**（559 个抓取页面 0 组重复）；`meta description` 存在；每页**恰好 1 个非空 H1**；
  canonical 自身；hreflang 三元组正确；无 sitemap/indexability 矛盾；SSR 内容完整（无 JS 门控正文）。
- `og:type`：release 页 22/22 为 `article`，其余 `website`；`og:url` == canonical；本轮为所有页面补齐
  `og:site_name`、`twitter:title`、`twitter:description`（此前 262/262 缺失）。
- **本轮修复：** 17 个可索引的 `/zh/benchmarks/*` 页面此前使用**英文** meta description（与 en 孪生重复）。
  新增 `src/features/leaderboard/benchmark-descriptions.zh.ts`（38 条中文描述）+ `benchmarkDescription()`
  helper，zh 页面的 meta description 与正文导语都改用中文；本地复验 **0 重复描述**。

**本轮修复 — title 模板统一（原先的 208/262 个 title 无品牌问题）：**

- 约定：**`<页面主题> — EvalLedger`**，品牌由 `localeHead()` 统一追加（`brandedTitle()`），
  模板里已经写了品牌的（首页 `| EvalLedger`、`Sponsor EvalLedger` 等）不会重复追加。
- 同时裁短超预算的模板（改的是 `<title>`，不动 H1/正文）：
  - 模型页：`{model} API Pricing, Benchmarks & Context Window ({year})` → `{model} API Pricing & Benchmarks`
    （zh：`{model} API 价格与跑分`）
  - release 文章：完整标题（常含价格主张，最长 100 字符）→ `{subject}: launch analysis`
    （zh：`{subject}：发布分析`），`subject` 取标题冒号前的模型/项目名；完整 headline 仍是 H1
  - compare pair / series pair：只保留 `A vs B`，不再叠加 “— Compare LLMs”
  - series 线：`{series} versions compared — prices, context window and scores` → `{series} versions compared — prices & scores`
  - Claude / OpenRouter 计算器页与首页 title 同步裁短
- 复验（本地 260 个 sitemap URL）：**260/260 标题恰含 1 个品牌**、0 重复品牌；
  英文最长 65 字符；显示宽度（CJK 记 2）最长 65 单位，均在 70 的预算内。
- 守护：`seo.node.test.ts` 的 `brandedTitle()` 单测 + e2e 的 “every sampled title carries one brand
  and fits the SERP budget”（采样页扩到 20，含 8 个页面族）。

**本轮修复 — title ≤ 60 / description ≤ 160（硬预算）：**

- 规则：`<title>` ≤ **60 字符**（含品牌后缀），meta description ≤ **160 字符**；
  该规则已写入 [`AGENTS.md`](../AGENTS.md) 的 Conventions。
- 执行：品牌后缀由 `brandedTitle()` 统一追加（subject 预算 47 字符）；两模型页标题走
  `pairTitle()`，仅在整对超过 47 字符时压缩共享家族前缀（`DeepSeek V4.1-Flash 1017 vs 0910`）。
- 文案裁短：home / ChatGPT / 模型页 / series 线 / Claude / OpenRouter 标题模板；
  8 个页面的长期 meta description（best、data-quality、releases、series、sponsor、
  calculator、deepseek、gemini/grok/kimi/minimax/brand、模型页）与 **11 篇 en release +
  3 篇 zh release** 的 frontmatter description 全部压到 ≤160。
- 复验（本地 260 个 sitemap URL）：**title > 60 的 0 个、description > 160 的 0 个**
  （修复前分别是 13 与 36）。
- 守护：`src/features/seo/meta-budget.node.test.ts`（7 个用例：字典/注册表/release frontmatter 预算）、
  `src/features/leaderboard/__tests__/pair-title.node.test.ts`（5 个用例：全部 compare/series pair），
  以及 e2e 的 “every sampled title and description fit the SERP budget”（采样页 20 → 27，
  覆盖全部 8 个 vendor landing）。

**仍存在的问题（P3，未改）：**

- meta description 的**质量**（措辞/是否覆盖长尾词）仍需内容评审；长度预算已由测试守住，
  但“写得更好”不是模板问题，本轮不代内容负责人决定。

---

### 2.7 基准名称、价格、评分、日期、来源、FAQ（任务 7）

- **基准名称：** §2.1 修复后不再重复；38 个 benchmark 页的名称/单位/分数/field best 与注册表 0 不一致；
  zh 页面的基准描述已本地化（§2.6）。
- **价格/评分：** §2.4 的逐值比对 0 不一致；compare 页不借用对方分数；blended/月成本可复算。
- **日期：** 模型 `lastVerified`、`updatedAt`、`fetchedAt` 全部与注册表一致；release 的 `checkedAt`/`dataCheckedAt`
  11 篇 ×2 全部通过既有完整性测试；grok 发布日期缺口已补（§2.4）。
- **来源：** 18/18 模型页价格来源 == `sourceUrl`；benchmark provenance 仍在 JS 弹层中（第一轮已记录，未变）。
- **FAQ：** 可见 FAQ 与 FAQPage JSON-LD 文本一致（22 页 0 不匹配）；FAQ 中的算术（DeepSeek 13.3×/16.7×、
  GPT-6 5×/100×、缓存 90/95/97.5%、off-peak 50%、OpenRouter 1.05×、Claude break-even 2.86M/1.43M 与 28.6M/14.3M）
  经注册表复算全部成立。唯一的 FAQ 文案矛盾（#1/#2/#6 所在页面）已随 §2.4 修复。

---

### 2.8 自动化测试与命令（任务 8）

**新增/扩展回归测试：**

| 文件 | 用例 | 守护内容 |
| --- | --- | --- |
| `src/features/leaderboard/__tests__/benchmark-version.node.test.ts` | 6 | 版本后缀规则；注册表“name 含版本”约定；四个组件不得直接插值 `.version` |
| `src/features/seo/canonical-redirect.node.test.ts` | 8 | 尾斜杠 308、别名单跳 301、主机/协议 301、本地开发不重定向、GET/HEAD-only |
| `src/features/i18n/__tests__/copy-claims.node.test.ts` | 4 | 错误最高级不得回归；输出倍数必须等于注册表算出的倍数；blended 格式化统一 |
| `src/features/leaderboard/__tests__/benchmark-description.node.test.ts` | 2 | 每个 benchmark 都有中文描述、不等于英文、无多余 id、缺译文回退英文 |
| `src/features/leaderboard/__tests__/pair-title.node.test.ts` | 5 | 全部 compare/series pair 的品牌后标题 ≤60；短 pair 不改写、超预算才压缩 |
| `src/features/seo/meta-budget.node.test.ts` | 7 | 字典/注册表/use-case/track/模型/release frontmatter 的标题 ≤60、描述 ≤160 |
| `src/features/seo/meta.node.test.ts`（扩展） | +1 | waitlist 的 head 与 sitemap 同源 noindex |
| `e2e/seo.spec.ts`（扩展） | +5 | `/en` 301、`/token-calculator` 301 + `?model=`、尾斜杠 308、无重复版本号；采样页 15 → 27；head 增加 og:site_name/twitter 断言；title ≤60 / description ≤160 预算 |

**实际执行结果（本工作区真实输出）：**

| 命令 | 结果 |
| --- | --- |
| `pnpm test` | ✅ **681 passed / 81 files** |
| `pnpm lint` | ✅ 0 errors，1 warning（既有的 `src/features/sponsor/amounts.ts:13` 无用 eslint-disable，非本轮引入） |
| `pnpm typecheck` | ✅ 0 errors |
| `pnpm build` | ✅ built in 1.91s |
| `npx playwright test e2e/seo.spec.ts` | ✅ **68 passed（1 个 HMR 抖动重试通过）** |
| 本地 260 URL 抓取（canonical/hreflang/noindex/H1/JSON-LD 解析/重复描述/孤立页） | ✅ 0 problems、0 重复描述、0 孤立页 |
| 生产 262 URL 抓取（同上 + 链接图） | ✅ 0 反例（见 audit-notes） |

全量 Playwright 未运行（仓库规定未经用户明确要求不得运行）；此限制已在 §1.3 标注。

---

### 2.9 不虚构与“未核实不改 URL”（任务 9）

- 本文件**没有**任何流量、排名、搜索量、点击率、索引率或性能数字；所有相关项在 §6 列为 UNVERIFIED。
- **没有删除、重命名或新增任何公开页面/URL**；没有改路由 slug；没有改 sitemap 的 URL 集合
  （core 扩增来自并行的另一个会话，非本轮；waitlist 的移除来自本轮的 noindex 决策，页面本身保留可访问）。
- 没有改动价格/评分/发布时间等**已发布数据**；所有数值修复都对照注册表逐条复算，并在测试中固化
  （grok 的 `releaseDate` 补的是 release 文章已公布的日期，属于同一事实的数据对齐）。
- 无法验证的项（Search Console、索引状态、CWV、外链、厂商页面）全部明确标记，不用推断冒充证据。

---

## 3. 修复文件清单（工作区，未提交/未部署）

| 文件 | 改动 |
| --- | --- |
| `src/features/leaderboard/benchmarks.ts` | `benchmarkVersionSuffix()`、`benchmarkDescription()` |
| `src/features/leaderboard/benchmark-descriptions.zh.ts`（新增） | 38 条中文基准描述 |
| `src/features/leaderboard/pair-title.ts`（新增） | 两模型标题在 47 字符预算内压缩共享前缀 |
| `src/features/seo/meta-budget.node.test.ts`、`pair-title.node.test.ts`（新增） | title/description 硬预算与 pair 标题守卫 |
| `src/content/releases/*.md`（11 en + 3 zh） | release 摘要压到 ≤160 字符 |
| `AGENTS.md` | 记录 title ≤60 / description ≤160 的硬规则与执行位置 |
| `src/features/leaderboard/components/{Methodology,TrackBoard,ModelProfile,ScoreProvenance}.tsx` | 消除重复版本；`ModelProfile` blended 统一 `formatMoney()` |
| `src/features/leaderboard/components/BenchmarkDetail.tsx`、`benchmarks/$slug/index.tsx` | zh 页面用中文描述（meta + 导语） |
| `src/features/seo/canonical-redirect.ts`（新增） | 尾斜杠 308 / 别名与 `/en` 单跳 301 / 主机协议 301 |
| `src/worker.ts` | 路由前接入 canonical 重定向 |
| `src/routes/{-$locale}/route.tsx` | `/en` 别名 301（POST 兜底） |
| `src/routes/{-$locale}/leaderboard/$track/index.tsx` | 补 BreadcrumbList |
| `src/routes/{-$locale}/{series,compare,releases,methodology,changelog,data-quality}` 路由 | 补 BreadcrumbList |
| `src/routes/{-$locale}/releases/$slug.tsx` | BlogPosting 补 `image` / `mainEntityOfPage` |
| `src/routes/{-$locale}/waitlist.tsx`、`src/features/seo/indexability.ts` | waitlist noindex + 移出 sitemap |
| `src/features/seo/seo.ts` | 全站补 `og:site_name` / `twitter:title` / `twitter:description`；`brandedTitle()` 统一品牌后缀 |
| `src/routes/{-$locale}/{models/$slug,compare/$pair,releases/$slug,releases/index,series/index}.tsx`、`src/features/i18n/dictionaries/{en,zh,landing,calc}.ts` | title 模板裁短与品牌统一（H1 不变） |
| `src/routes/{-$locale}/index.tsx` | 首页 release teaser 用 `releasedAt` + 标签 |
| `src/features/leaderboard/models.ts` | grok-4.7 补 `releaseDate` |
| `src/content/changelog/v1-3-0.zh.md` | zh→en 的原始域名链接改为 `/zh` |
| `src/components/marketing/footer.tsx` | sponsor 页入链（消除孤岛） |
| `src/features/i18n/dictionaries/{en,zh,calc,landing,linking}.ts` | 9 处文案修正 + 3 个 breadcrumb 名称（en/zh 同步） |
| `e2e/seo.spec.ts` | 采样页 15 → 20、新增 5 个回归用例（含 title 品牌/长度契约）、core sitemap 上限改为从注册表推导、head 增加社交元数据断言 |
| `src/features/seo/seo.node.test.ts` | `brandedTitle()` 单测与“每页恰一个品牌”断言 |
| `src/features/seo/sitemap-core.node.test.ts`、`sitemap-core.ts` | **非本轮的并行会话改动**，原样保留 |
| `docs/audit-notes/{live,links-meta,data-consistency}.md` | 三个只读审计的完整证据与复现命令 |

`sitemap-core` 的外部改动只做了一处**一致性修补**：`e2e/seo.spec.ts` 原先硬编码
“core ≤ 39 URL”，而该改动把 core 扩到 70，e2e 会失败；现已改为
`CORE_PATHS.length + CORE_ZH_PATHS.length`，避免硬编码数字再次漂移。

---

## 4. 严重度定义

**P0** 阅读者/爬虫看到坏文本或坏页面 · **P1** 页面与自身/兄弟页竞争，或标题级主张与数据冲突 ·
**P2** 真实可修复的索引/链接权重/元数据缺陷 · **P3** 卫生与一致性（不宣称排名影响）。

---

## 5. 仍未解决的问题及其原因

本轮把“可在本仓库内安全验证并修复”的项目全部修完（见 §3）。下面只剩三类：
**(A) 需要发布/基础设施动作**、**(B) 需要真实数据源或产品/文案决策（不能编造）**、**(C) 已知但可接受的 P3 卫生项**。

| # | 类别 | 严重度 | 问题 | 为什么本轮不修 / 下一步 |
| --- | --- | --- | --- | --- |
| U1 | 发布 | 阻塞 | 本轮全部修复**未部署**，线上仍是 HEAD 行为 | 需要用户授权部署（`pnpm deploy:prod` 或合并发布流程）；不代用户执行生产发布。部署后按 §7 复验 |
| U2 | 基础设施 | P3 | `wrangler.jsonc` 仍保留 `tokencalculator.flowmails.net` custom domain | 代码已把 GET/HEAD 301 到 apex；legacy host 仍承担 auth 回跳（`AUTH_TRUSTED_ORIGINS`）。迁移窗口结束后应删除该 route。属迁移决策 |
| U3 | 数据源 | P3 | 三个 sitemap 仍无 `<lastmod>` | 需要定义“每类页面的真实修改日”（价格/评分/文章），现有日期字段不足以覆盖全部 URL；**不编造日期**。可另开任务按页面族补 |
| U4 | 文案质量 | P3 | meta description 的措辞/长尾覆盖仍可改进（长度预算已达标） | 本轮只保证 ≤160 的硬预算（0 violations）与品牌/长度模板；进一步优化措辞属于内容评审，不能由模板自动完成 |
| U5 | 决策 | P3 | 大小写重复路径（`/MODELS/...` 200）；`/en/index.html` → `/index.html` → 404 | 大小写规范化需要确认是否有大小写敏感的真实路径；`/index.html` 是否应 301 到目录是站点策略。canonical 已覆盖，风险低 |
| U6 | 数据就绪 | P3 | `/leaderboard-history` 仍 noindex，却在 footer/首页推广 | 等分数快照 job 落地后其 indexability floor 自动通过；在那之前推广一个 noindex 页不产生索引收益 |
| U7 | 版面 | P3 | leaderboard 同一 benchmark 锚文本重复最多 15 次；4 处 “Open in the interactive comparator” | 不影响可达性/索引，改动涉及表格与比较器版面，应随 UI 迭代处理 |
| U8 | 缓存策略 | P3 | HTML/sitemap/robots 无 `Cache-Control` | 需要先定 CDN/缓存失效策略（价格页内容每日变），属性能优化而非 SEO 回归 |
| U9 | 结构化数据 | P3 | 8 个法律页 URL 无 JSON-LD；`ItemList` 个别 item 无 `url` | 法律页没有值得标记的结构；`ListItem` 无 url 仍 schema 合法（该版本确实没有模型页）。避免为“有而有”堆结构化数据 |
| U10 | 已修复待部署验证 | — | 主机/协议跳转、单跳别名、waitlist noindex、zh 描述、日期、社交头等 | 已在工作区验证（§7）；部署后需再跑一次生产抓取确认状态码/头部/描述符合预期 |

---

## 6. 明确未验证（不虚构）

1. **Search Console / Bing**：索引覆盖、已提交 sitemap 状态、抓取统计、手动操作、富结果资格、CTR —— 无权限。
2. **排名 / 曝光 / 点击 / 搜索量 / 难度** —— 无任何关键词或分析工具；全文不引用此类数字。
3. **Google 是否采纳 core/full 双 sitemap 策略** —— 无法测量。
4. **CWV / Lighthouse / CrUX / 真实用户性能** —— 未测量，不声明分数。
5. **反链、外链 404、外部指向 `/en` 或 `http://` 的链接** —— 无数据。
6. **http/www/legacy host 是否已被索引** —— 代码已发 301，实际索引状态只能由 GSC 回答。
7. **本地工作区改动是否已部署** —— 未部署；线上行为以 HEAD 为准。
8. **注册表本身与厂商页面是否一致** —— 本轮只验证“页面 ↔ 注册表”，价格刷新流程不在范围内。

---

## 7. 验证与复现（命令均在本机实际执行）

```bash
# 1) 单测 / 类型 / lint / 构建
pnpm test          # 681 passed / 81 files
pnpm typecheck     # 0 errors
pnpm lint          # 0 errors, 1 pre-existing warning
pnpm build         # built in 1.91s

# 2) 浏览器 e2e（仅 SEO spec，符合仓库“不自行跑全量”的规定）
npx playwright test e2e/seo.spec.ts   # 68 passed（1 个 HMR 抖动重试通过）

# 3) 旧 URL / 尾斜杠 / 别名 / 主机（本地 dev server :3000）
curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}\n' \
  http://localhost:3000/en \
  http://localhost:3000/en/ \
  http://localhost:3000/en/token-calculator?model=gpt-6-astra \
  http://localhost:3000/token-calculator/ \
  http://localhost:3000/models/claude-opus-5.5/ \
  http://localhost:3000/sitemap.xml/
# 期望：/en、/en/、/en/token-calculator*、/token-calculator/ 为 301 单跳；
#       /models/.../、/sitemap.xml/ 为 308；canonical 路径 200

# 4) 生产不可变性（部署前）：生产仍是 HEAD 行为
curl -sI https://evaledger.com/en | head -2                     # HTTP/2 307
curl -s https://evaledger.com/zh/methodology | grep -o 'DeepSWE v1.1</a><span[^>]*>[^<]*'  # 修复前证据
curl -s https://evaledger.com/zh/benchmarks/gpqa-diamond | grep -o '<meta name="description"[^>]*>'  # 英文描述

# 5) sitemap / canonical / hreflang / 链接 / 孤立页全量抓取：
#    /tmp/crawl_local.py、hreflang_local.py、links_local.py
#    与 docs/audit-notes/*.md 中的脚本和原始输出
```

**证据文件：** [`audit-notes/live.md`](./audit-notes/live.md)（170 行，L1–L17）、
[`audit-notes/links-meta.md`](./audit-notes/links-meta.md)（353 行，LM-1–LM-14 + 抓取复现）、
[`audit-notes/data-consistency.md`](./audit-notes/data-consistency.md)（193 行，逐值比对表 + 9 处文案矛盾）。

---

## 8. 一句话总结

本轮把所有**可在仓库内安全验证并修复**的回归修完并加了测试：重复版本号、307 的 `/en` 与尾斜杠、
两跳别名、http/www/legacy host 重复、全站 title 模板统一（品牌唯一 + ≤60 字符）、全站 meta description ≤160 字符、board/hub 缺失的
结构化数据、BlogPosting 缺字段、sponsor 孤岛、waitlist 的索引矛盾、9 处与注册表矛盾的文案、
38 条 zh benchmark 描述、两处日期缺口、zh changelog 链接、全站社交元数据；**没有**为了“看起来更好”而改公开 URL、删页面、编数据或编造任何
排名/流量指标。剩余项只剩**发布动作、基础设施迁移决策、需要真实数据源（lastmod）或文案评审（title 品牌/长度）
的 P3**（以及已写入 AGENTS.md 的 title ≤60 / description ≤160 硬规则），逐条列在 §5。

---

# 第三轮：生产回归修复（2026-10-25）

**范围：** 只修第二轮遗留在生产上的 4 类回归，**不重复**第二轮的改造，不新增/删除/重命名任何公开 URL。
**基线：** `main` @ `1394a58`（即第二轮修复已合并、已部署的版本）。
**方法：** 直接执行注册表（esbuild 打包运行）+ 生产 `evaledger.com` 真实抓取 + 本地 dev server 逐页比对 + 新增/扩展回归测试。
**未部署：** 本轮全部改动在工作区，**没有**执行 `pnpm deploy:prod`，也没有改 DNS。

## 0. 结论摘要

| 维度 | 结果 |
| --- | --- |
| 修复项 | **4 类 / 16 个文件**：基准版本号重复的根因、Token Calculator FAQ 旧模型、4 条价格口径、URL 规范守卫 |
| 新增测试 | 2 个新文件（`alias-canonical.node.test.ts` 5 例、`faq-freshness.node.test.ts` 17 例）+ 1 个大幅扩展（`benchmark-version.node.test.ts` 6 → 25 例）+ e2e 新增 1 例 |
| 全量验证 | `pnpm test` **722 passed / 83 files**；`pnpm lint` 0 error；`pnpm typecheck` 0 error；`pnpm build` 通过；`e2e/seo.spec.ts` **70 passed** |
| 数据来源 | 所有 FAQ 数字由 `REGISTRY` 经 `priceDetail()` 现算；4 条口径的结论逐条复算，**无编造来源** |
| 未验证 | 部署后行为、Search Console 索引状态、`vendor-claims.ts` 三个外部 URL 的当前内容 —— 见 §5 |

---

## 1. 任务 1：评分方法页面的重复版本号

### 1.1 现象与根因

**现象（线上，修复前）：** `/zh/methodology` 与 `/methodology` 渲染出 `DeepSWE v1.1 1.1`、`Terminal-Bench 4.0 4.0`。

第二轮已经引入了唯一判定函数 `benchmarkVersionSuffix()`（`src/features/leaderboard/benchmarks.ts`），4 个渲染点也都改用了它（`Methodology.tsx` / `TrackBoard.tsx` / `ModelProfile.tsx` / `ScoreProvenance.tsx`），但**判定本身不可靠**：

```ts
// 修复前
const escaped = benchmark.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const inName = new RegExp(`(^|[^0-9.])${escaped}([^0-9.]|$)`)
return inName.test(benchmark.name) ? null : benchmark.version
```

它把版本号当成**正则子串**去匹配，而右边界 `([^0-9.]|$)` **不接受句点**。因此只要名字里的版本后面跟了一个 `.`（`"DeepSWE v1.1."`、句子标点、表格里的句末），匹配就失败，helper 便"认定名字没说版本"并返回 `"1.1"`，页面于是再补一次 —— 这正是 `DeepSWE v1.1 1.1` 的来源。**根因不是某个页面的显示字符串，而是"用动态正则做版本包含判定"这个方法本身。**

> 诚实记录：本轮用当前注册表数据（13 个带 `version` 的基准）跑修复前的 helper，全部返回 `null`，**本地未复现出重复**；重复只在名字带尾随标点等边界条件出现。因此本次修复按"消除该类判定方式"处理，而不是按"某一行字符串"处理 —— 这与任务要求"不要硬编码替换显示字符串"一致。

### 1.2 修复

`benchmarkVersionSuffix()` 重写为**整 token 相等**比较，彻底移除动态 `RegExp`：

```ts
// 修复后（节选）
const wants = versionTokens(benchmark.version)
const carried = versionTokens(benchmark.name)
return wants.every((token) => carried.includes(token)) ? null : benchmark.version

function versionTokens(text: string): string[] {
  return text.match(/\d+(?:\.\d+)*/g)?.map((t) => t.replace(/\.+$/, '')).filter(Boolean) ?? []
}
```

- 边界语义更严格：「`Foo v2.1`」+`version: '2'` → `'2'`（name 声明的是 2.1，不是 2）；「`Foo v2`」+`version: '2'` → `null`。
- 4 个渲染点**不改**，继续只走这一个 helper；全仓 `\.version` 复查确认**不存在第五个基准版本插值点**（`ModelProfile.tsx:34`、`ModelSelect.tsx`、`changelog.tsx`、`SeriesLadder.tsx` 中的 `.version` 都是**模型/条目**版本，语义不同，不会与基准名重复）。
- 修复后 13 个带版本基准的渲染标签，每行版本号恰好出现一次：`GDPVal-AA v2.1`、`Apex Bench v1.1`、`Terminal-Bench 2.1 / 3.0 / 4.0`、`Terminal-Bench Science 0.1`、`SWE-Marathon v1.1`、`FrontierSWE v2`、`DeepSWE v1.1`、`OSWorld-2.0`、`OSWorld V2.1`、`CWE-bench v1`、`OfficeQA Pro v2`。

### 1.3 测试（防止再次出现）

`src/features/leaderboard/__tests__/benchmark-version.node.test.ts`（6 → **25 例**）：

- **不依赖 helper 实现**的独立断言：自行从每个基准 `name` 提取版本 token，若含与 `version` 完全相等的 token，则 helper 必须返回 `null`（覆盖注册表全量）；
- 13 个真实基准名的**显式参数化**用例，外加"参数化列表必须等于注册表全量"的守卫（注册表改名会红，而不是悄悄缩小循环）；
- 渲染标签级断言 `renderedLabel()`：拼出 `name + suffix` 后断言版本作为整 token **恰好出现 1 次**；
- 反向断言（防过度吞版本）；
- 扫描整个 `components/` 目录的第五渲染点守卫。

**真假红验证：** 把 helper 临时还原成旧实现，新测试**确实变红**（`expected '1.1' to be null`）；还原后全绿。

---

## 2. 任务 2：Token Calculator 的过时 FAQ

### 2.1 修复前的问题

规范页 `/zh/token-cost-calculator`（en：`/token-cost-calculator`）的 FAQ 仍在卖 **GPT-5 nano**（注册表中已 `delisted`）、**Claude Opus 4.5**、**Gemini 2.5 Flash**、**Claude Sonnet 4.5**，而页面上方的计算器早已换成 GPT-6 / Opus 5.5 / Sonnet 5。价格也是**手打进句子**的，注册表一调价就沉默地过期。

### 2.2 修复方式（结构性，而非改文案）

> **字典只存句子，数字一律现算。**

- 新增 `src/features/calculator/faq-examples.ts`：所有 FAQ 数字由 `REGISTRY` 经 `priceDetail(model, registrySnapshotDate())` 计算 —— **与计算器收费是同一个函数**，因此"页面显示的价"和"计算器算的价"不可能不一致。
- 新增 `src/features/calculator/vendor-claims.ts`：登记**不属于注册表**的厂商事实（OpenAI Batch 5 折 / 24h SLA、Anthropic Pro $20 / Max $200、OpenAI Plus $20、OpenAI 缓存 1,024 token 阈值），每条**带 `sourceUrl`**。
- `copy.ts` 负责把参数注入字典模板；字典（`calc.ts` / `en.ts` / `zh.ts`）里**不再出现任何注册表派生数字**。
- `types.ts` 为 `REGISTRY.openRouterMarkup` 补上出处注释：它是**本站建模假设**（1.05×），不是 OpenRouter 公布的平均加价。

**当前 FAQ 示例（全部来自注册表，快照 `2026-10-24`）：**

| 模型 | id | 输入 / 输出（每 1M） |
| --- | --- | --- |
| GPT-6 luna | `gpt-6-luna` | $0.10 / $0.50 |
| Claude Haiku 4.5 | `claude-haiku-4.5` | $1 / $5 |
| Claude Opus 5.5 | `claude-opus-5.5` | $4 / $20 |
| DeepSeek V4.1-Flash 1017 | `deepseek-flash` | $0.30 / $1.20 |

**历史示例的标注**：GPT-5 nano 只以"历史行"出现，且三要素齐全 —— 名字 + 下架时间 + 注册表保留的最后核对价：

> "the GPT-5 tier is retired — GPT-5 nano, delisted in 2026-09, keeps its last verified rates at $0.05 / $0.40 in the registry as a historical row."

en / zh 结构一致（`zh` 受 `type Dict = typeof en` 约束）。

### 2.3 本轮额外发现并修复的 P0（e2e 抓到）

改成占位符后，**4 个 vendor 页面把 `{placeholder}` 原样渲染到了页面上**（`/claude-token-cost-calculator`、`/chatgpt-api-pricing`、`/deepseek-api-pricing`、`/openrouter-pricing-calculator`，共 8 个 URL 含 zh）。原因是这些页面通过 `itemsKey` / 裸 key 读取字典，**没有走注入参数的 helper**；其中 `/chatgpt-api-pricing` 还读了一个**只存在于旧 `calculator.*` 命名空间**的键，直接把键名 `calc.chatgptCacheBody` 打在了页面上。

修复：4 个路由改走 `sharedTldr(t)` / `sharedTips(t)` / `deepseekTldr(t)` / `deepseekTips(t)` / `chatgptTldr(t)` / `chatgptTips(t)`；3 个 section 组件改走 `openrouterMarkupBody(t)` / `deepseekCacheBody(t)` / `chatgptCacheBody(t)`；补齐缺失的 `calc.chatgptCacheTitle` / `calc.chatgptCacheBody`（en + zh）。

新增**单元级**守卫（不必等浏览器）：`faq-freshness.node.test.ts` 的最后两组用例扫描组件源码，断言（a）没有任何 `t('calc.x')` 无参读取一个仍含 `{placeholder}` 的键，（b）没有读取只存在于另一命名空间的键。已验证该守卫对回归**确实变红**。

---

## 3. 任务 3：价格说明的证据与口径

四条逐一复算（25 个 `status: active` 且 `channel: official` 的模型）：

| # | 原表述 | 复算结果 | 处理 |
| --- | --- | --- | --- |
| 1 | "output 通常比 input 贵 **4–8 倍**" | 实际 **2.70×（step-5-preview）～ 8.33×（gemini-2.5-flash）**，中位 **5.00×**，**25 个里有 4 个落在 4–8 之外** | 删除"4–8"这一"规律"表述，改为**可复算区间** `{ratioMin}×–{ratioMax}×`（25 个在售模型）+ 中位 `{ratioMedian}×`，并明写"倍数只跟模型有关，跟厂商无关" |
| 2 | "OpenRouter **平均加价约 5%**" | 原代码只有常量 `openRouterMarkup = 1.05`，**没有任何出处** | 改称"本站用于估算的系数 1.05×（5%）"；`types.ts` 补出处注释；**删除全部"平均/average"**措辞。**未找到**OpenRouter 官方公布该数字的来源，因此不声称 |
| 3 | Pro/Max 盈亏平衡 "**1M + 0.5M**（Pro）/ **5M + 2.5M**（Max）" | 按 `claudeBreakEven()`（Sonnet 5，$2/$10，output = 0.5×input）：Pro $20 → **2.857M in + 1.429M out**；Max $200 → **28.571M + 14.286M**。原数字只花 $7 / $35，**根本不在平衡点** | 改用计算模块的 `{proIn}/{proOut}/{maxIn}/{maxOut}`，并补适用条件："按 1:2 输入:输出混合、不含缓存折扣（算上缓存平衡点更高）"。`claudeFaq5A` 的 6M+3M / 60M+30M 同样对不上，一并改掉 |
| 4 | "Anthropic ~90%、OpenAI ~90%、DeepSeek ~90%" 一句盖三家 | 按厂商：Anthropic **90–98%**、OpenAI **90%**（5 行一致）、Google **90–95%**、DeepSeek **97–98%**（另有 Grok 75%、MiniMax 80–90%、Kimi 90–95%、StepFun 90%） | 删掉"一句 90%"，改为**按厂商分别陈述**，且每家都由注册表 `cached/input` 现算 |

**顺带修正的同类问题**（都在 calculator 范围内）：TLDR 里"Gemini 2.5 Pro 超 200K 翻倍"改为注册表事实（长上下文分档 2×，阈值 200K(Gemini)/272K(GPT-6)，由 `longContext` 派生）；DeepSeek 缓存价把 **peak** 的 $0.006 误说成 $0.003（那是 off-peak），已按注册表订正；"比 Opus 4.5 便宜 17×/21×"改为对 Opus 5.5 的 13.3×/16.7×。

**固化测试**：`faq-freshness.node.test.ts`（17 例）含字面量扫描 —— 剥掉 `{placeholder}` 后，字典里不允许出现 `$x` / `N%` / `N×` 形式的注册表派生数字（白名单仅订阅价、年份、UTC 时刻等非注册表事实），并正向断言 12 个关键句子必须含指定占位符（防有人把数字抄回字典）。

---

## 4. 任务 4：保留已修复的 URL 规范

`/zh/token-calculator` → `/zh/token-cost-calculator` 的 301 在**本轮改动后仍成立**，四个维度逐一验证：

| 检查项 | 结果 |
| --- | --- |
| 别名 301（en / zh / 带 `?model=` / 带尾斜杠） | ✅ 全部**单跳 301**，query 保留；`/en/token-calculator` 也是一次 301 直达 |
| 站内链接指向 canonical | ✅ 抓取本地 sitemap 全部页面，**0 条**内链指向 `/token-calculator` |
| sitemap 不收录旧路由 | ✅ `/sitemap.xml`（70）、`/sitemap-core.xml`（70）、`/sitemap-full.xml`（260）均**不含**别名；canonical 地址 4 条（en/zh + 两类）在内 |
| canonical == 实际最终 URL | ✅ 260/260 页面 `canonical` 与自身一致，`0` 个反例 |
| 无重定向循环 | ✅ 逐个跟随，所有 canonical URL 0 跳自稳定 |

**新增守卫**：
- `src/features/seo/alias-canonical.node.test.ts`（5 例，新文件）：别名注册表 ↔ 301 一跳、**重定向图无环**（对全部 sitemap 路径 en+zh 跟随到底）、别名不进 sitemap / 不可索引 / 不在 core 列表、`/en` 前缀剥离后仍归一到同一 canonical。
- `e2e/seo.spec.ts` 新增 1 例：别名是重定向 **且** 三个 sitemap 都不收录它、目标页 canonical 指向自身。

---

## 5. 验证与测试结果（本机真实输出）

| 命令 | 结果 |
| --- | --- |
| `pnpm test` | ✅ **722 passed / 83 files** |
| `pnpm lint` | ✅ **0 errors**，1 warning（`src/features/sponsor/amounts.ts:13` 的既有无用 eslint-disable，非本轮引入） |
| `pnpm typecheck` | ✅ 0 errors |
| `pnpm build` | ✅ built in 1.61s |
| `npx playwright test e2e/seo.spec.ts` | ✅ **70 passed**（在 canonical 端口 :3000 运行） |
| 本地逐页渲染复核 | ✅ `/methodology` 等 10 个页面重复版本号 **0**；10 个 calculator 页面 `{placeholder}` 泄漏 **0**、裸字典键 **0** |

**关于 e2e 的一个环境坑（记录给后来者）：** 本轮在 :3340 上跑 e2e 时出现 4 个"失败"，实际是站点按 `BETTER_AUTH_URL` 生成绝对 URL（`http://localhost:3000`），与测试端口的 origin 不符 —— 属环境配置差异，**不是代码回归**；换回 :3000 后 70/70 全过。另外 wrangler 会往 `~/Library/Preferences/.wrangler/registry` 写文件，在受限沙箱下会 `EPERM` 崩溃，需用 `E2E_HOME`（config 已内置该开关）把 `HOME` 指到工作区内。

**新增/扩展测试清单：**

| 文件 | 用例 | 守护内容 |
| --- | --- | --- |
| `src/features/leaderboard/__tests__/benchmark-version.node.test.ts` | 6 → 25 | 版本 token 判定；注册表全量；渲染标签恰含一次版本；第五渲染点 |
| `src/features/calculator/__tests__/faq-freshness.node.test.ts` | 17（新） | FAQ 只引用在售模型；历史示例三要素；字典无裸数字；无未插值模板 / 无跨命名空间键 |
| `src/features/seo/alias-canonical.node.test.ts` | 5（新） | 别名 301、无环、不进 sitemap、canonical 自洽 |
| `e2e/seo.spec.ts` | +1 | 别名是重定向且不进任何 sitemap |

---

## 6. 仍未验证 / 需人工确认（不虚构）

| # | 项 | 说明 |
| --- | --- | --- |
| U1 | **生产部署** | 本轮**未部署**。线上仍是 `1394a58` 行为。部署后建议按 §5 命令复验渲染与状态码 |
| U2 | **生产是否真的存在重复版本号** | 本轮抓取生产 `/zh/methodology` 等 10 页，**未发现**重复；但在本地也无法用当前注册表复现。若部署后仍出现，需要提供生产 HTML 片段定位第二个来源 |
| U3 | `vendor-claims.ts` 的三个 `sourceUrl` | `platform.openai.com/docs/guides/batch`、`.../prompt-caching`、`claude.com/pricing` —— 本轮**未联网核实其当前内容**，仅登记为出处。这些是产品事实（非本站价格），仍建议人工点一遍 |
| U4 | OpenRouter 真实加价率 | **无可靠来源**。因此删除了"平均 5%"的一切表述，只保留"本站假设 1.05×"。若日后拿到官方口径，应同时改常量注释与该句 |
| U5 | 盈亏平衡的混合比例 | 代码是 `output = 0.5 × input`（即 2:1），任务描述写的是 50/50。**按"以计算模块为准"** 采用 2:1，并在文案写明条件；若产品口径要 50/50，改 `BREAK_EVEN_OUTPUT_RATIO` 一处即可，文案会自动跟随 |
| U6 | 25 个模型的口径 | `status: 'active' && channel: 'official'`。若要把 OpenRouter 克隆列也计入，`2.7×–8.3×` 等数字会变（需重跑测试） |
| U7 | 旧 `calculator.*` FAQ 命名空间 | 已按同一套占位符重建、与 `calc.*` 事实一致，但**目前无路由渲染**。是否删除这 40+ 个 key 属产品决策 —— 删除需同步调整 `dictionary-integrity` 的"两命名空间键集一致"约束 |
| U8 | 全量 Playwright | 仓库规定未经用户明确要求不跑全量，本轮只跑了 `e2e/seo.spec.ts` |
| U9 | Search Console / 排名 / 流量 / CWV | 无权限、无工具，全文不包含任何此类数字 |

---

## 7. 修复文件清单（工作区，未提交/未部署）

| 文件 | 改动 |
| --- | --- |
| `src/features/leaderboard/benchmarks.ts` | `benchmarkVersionSuffix()` 改整 token 比较，移除动态正则 |
| `src/features/leaderboard/__tests__/benchmark-version.node.test.ts` | 扩到 25 例 |
| `src/features/calculator/faq-examples.ts`（新） | 所有 FAQ 数字的唯一来源（REGISTRY → `priceDetail`） |
| `src/features/calculator/vendor-claims.ts`（新） | 非注册表厂商事实 + `sourceUrl` |
| `src/features/calculator/copy.ts` | 注入参数；新增 `chatgptCacheTitle/chatgptCacheBody` 等 helper |
| `src/features/calculator/types.ts` | `openRouterMarkup` 出处注释（本站假设） |
| `src/features/calculator/__tests__/faq-freshness.node.test.ts`（新） | 17 例：模型在售性、历史标注、字典无裸数字、无未插值模板 |
| `src/features/i18n/dictionaries/{calc,en,zh}.ts` | FAQ/TLDR/tips 全改占位符；订正 4 条口径；补 chatgpt cache 键 |
| `src/features/calculator/components/{ChatGPT,DeepSeek,OpenRouter}Section.tsx` | 改走注入参数的 helper（修 `{placeholder}` / 裸键泄漏） |
| `src/features/calculator/components/ClaudeSubscriptionSection.tsx` | 订阅价改插值 |
| `src/routes/{-$locale}/{claude-token-cost-calculator,openrouter-pricing-calculator,deepseek-api-pricing,chatgpt-api-pricing}.tsx` | TLDR/Tips 改走注入 helper |
| `src/features/seo/alias-canonical.node.test.ts`（新） | 别名/canonical/sitemap/无环 守卫 |
| `e2e/seo.spec.ts` | 新增别名不进 sitemap + canonical 自洽用例 |

**未改动：** 任何公开 URL、路由 slug、页面集合、价格/评分已发布数据、`wrangler.jsonc`、DNS。

---

# 第四轮：OpenRouter 计费口径更正（2026-10-25）

**触发：** 一次外部复查提出"OpenRouter 平均加价约 5%"应链接官方说明、并区分平台费与模型原始价格。
**方法：** 直接核对 OpenRouter 官方定价页与 FAQ 原文。
**范围：** 仅文案与数据出处，**未改计算逻辑、未改公开 URL、未部署**。

## 0. 结论：原表述不仅是"缺来源"，机制本身就是错的

OpenRouter 官方 `openrouter.ai/pricing` 原文：

> "Inference is billed at the provider's list price on every plan. OpenRouter's fee is charged when you buy credits, **5.5% on Standard and 8% on Business, never on individual requests**."

官方 FAQ 亦写明 "there is no markup on inference pricing"。

也就是说：

| 我们之前的说法 | 官方事实 |
| --- | --- |
| OpenRouter 在 token 单价上**加价 5%** | 推理**按厂商标价直通，不加价** |
| "当前平均加价 5%" | 没有"平均加价"这回事；费用发生在**购买额度**时 |
| 费率 5% | 官方现行为 **Standard 5.5% / Business 8%** |

`REGISTRY.openRouterMarkup = 1.05` 把费用摊到了每 token 单价上，是一种**近似**，不是 OpenRouter 的计费方式。

## 1. 修复方式（按用户选择的"只修文案，标注为估算"）

- 新增 `OPENROUTER_FEES`（`src/features/calculator/vendor-claims.ts`）：记录官方机制与两个费率，**带 `sourceUrl` / `faqUrl`**，并显式记 `inferenceMarkedUp: false`。
- `{orStandardFeePct}` / `{orBusinessFeePct}` 作为插值参数，由 `vendor-claims.ts` 提供；字典仍不硬编码数字。
- 改写全部相关文案（en + zh，共约 20 处）：
  - 明确 **token 单价不加价**，费用在**买额度**时收取，**不按请求收**；
  - 1.05× 一列改称"本站把充值费摊到单价上的**估算**"，明确"不是 OpenRouter 的报价"；
  - 删除全部"平均加价 / average markup"措辞；
  - 修正"直连更便宜是因为省了加价"这类因果（两边 token 单价其实相同）。

## 2. 过程中由测试抓到的两处真实缺陷

1. **`collectStrings()` 不递归对象** —— 守卫测试扫字典时只看字符串和数组，而 `calc` 是嵌套对象，导致"字典不得出现被禁表述"的断言**永远为真**（假通过）。已修复为递归，并验证注入违规文案后测试**确实变红**。
2. **新占位符漏接线** —— 引入 `{orStandardFeePct}` 后，`/chatgpt-api-pricing`、`/deepseek-api-pricing`、`openrouterCompareNote` 三处把占位符原样渲染到页面。`dictionary-integrity.node.test.ts` 与 e2e `renders no template residue` 各自抓到一部分，已全部接线并复验 4 个页面 0 泄漏。

## 3. 新增测试

`faq-freshness.node.test.ts` 新增 "states OpenRouter's real fee mechanism, from OpenRouter's own pricing page"：

- 断言 `OPENROUTER_FEES.inferenceMarkedUp === false`；
- 断言 token FAQ（en/zh）必须出现"credits/额度/充值"与两个官方费率；
- 断言 `calc` 字典里**不得再出现**"OpenRouter adds/charges a markup""加价后的实际价格"等旧框架。

## 4. 验证

| 命令 | 结果 |
| --- | --- |
| `pnpm test` | ✅ **723 passed / 83 files** |
| `pnpm typecheck` | ✅ 0 errors |
| `pnpm lint` | ✅ 0 errors（1 个既有 warning，非本轮） |
| `pnpm build` | ✅ 通过 |
| `e2e/seo.spec.ts` | ✅ **70 passed** |
| 渲染复核 | ✅ 4 个相关页面 0 占位符泄漏，费用数字正确显示 |

## 5. 仍未做 / 需人工确认

| # | 项 | 说明 |
| --- | --- | --- |
| U1 | **未改计算逻辑** | 按用户决定，`1.05×` 仍作用于 token 单价，仅文案标注为估算。若要严格对齐官方机制，需重构表格 + `prices.json` + 测试（12 个文件） |
| U2 | **未部署** | 本轮改动在工作区，未执行 `pnpm deploy:prod`、未改 DNS |
| U3 | 费率会变 | 5.5% / 8% 取自 2026-10-25 的官方页面；OpenRouter 调整后需同步 `OPENROUTER_FEES` |
| U4 | 报告中其他 3 项 | 方法论重复版本号、FAQ 旧模型、旧 URL 跳转在生产上**均已验证为正常**；报告所用 curl 指向 `evalledger.com`（双 L）——那是**停放的待售域名，不是本站** |

## 6. 修复文件清单（本轮）

| 文件 | 改动 |
| --- | --- |
| `src/features/calculator/vendor-claims.ts` | 新增 `OPENROUTER_FEES` + `openRouterCreditFees()`，带官方出处 |
| `src/features/calculator/faq-examples.ts` | `sharedCopyParams()` 注入费用参数 |
| `src/features/calculator/copy.ts` | 各 FAQ 参数块注入费用；`openrouterMarkupBody` 增加费用参数 |
| `src/features/calculator/components/OpenRouterSection.tsx` | `openrouterCompareNote` 补齐参数 |
| `src/features/i18n/dictionaries/calc.ts` | 约 20 处 OpenRouter 文案改写（en + zh） |
| `src/features/calculator/__tests__/faq-freshness.node.test.ts` | 新增官方机制断言；修复 `collectStrings` 递归 |
