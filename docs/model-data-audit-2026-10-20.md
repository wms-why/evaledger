# 模型价格与跑分核对报告（2026-10-20）

> 范围：`src/features/calculator/model-prices.ts` 里 20 个 active 模型的价格，`src/features/leaderboard/models.ts` 里 14 个模型 / 146 条分数，以及受影响的 6 篇 release 文章（中英各一版，共 12 个文件）。
>
> 结论先说：**基础输入/输出单价没有一条是错的；不对的是“缺的字段”和“旧的门槛”**——5 个缓存读价没录、8 个上下文窗口偏小、6 个长上下文档位没建模；跑分方面，已有 110 条参考表分数逐条对上，没有抄错，缺的是 Claude Opus 5.5 / GPT-6 Astra 两行新分。DeepSeek 1017 这个新 checkpoint 已按「不融合」的原则单独入库（见 §5.5）：价格、跑分、发布文章各一份，不和 0910 那版混。

---

## 1. 一句话结论

| 项目 | 结果 |
| --- | --- |
| 20 个 active 模型的基础 input/output 单价 | **全部与官方页一致**，没有涨价/降价漏更新 |
| 缓存读价 | **补了 5 个**：GPT-5.6 Sol、GPT-5.6 Cyber、Gemini 3.1 Pro、Gemini 3.1 Flash-Lite、Grok 4.7 |
| 上下文窗口 | **改了 8 个**：4 个 OpenAI（400K → 1,050,000）、4 个 Claude（200K → 1M；其中 Opus 5 已 delisted） |
| 长上下文档位 | **补了 6 个**：GPT-6 Astra / Sol / Luna、GPT-5.6 Sol（>272K，2× / 1.5×）、Gemini 3.1 Pro（>200K，2× / 1.5×）、Grok 4.7（≥200K，2× / 2×） |
| 已有跑分 | **110 条参考表分数逐条核对，全部一致**（DeepSeek 三家 + GLM + Kimi + GPT-5.6 Sol + Claude Opus 5） |
| 新增跑分 | **8 条**：Claude Opus 5.5 四项、GPT-6 Astra 四项 |
| 单独入库（不融合） | **DeepSeek V4.1-Flash-1017 checkpoint**：单独的价格行、单独的榜单行（11 条）、单独的中英发布文章；0910 那版原样保留（见 §5.5） |
| 仍未入库 | GPT-6.1 Sol、Sonnet 5.5、Gemini 4 Argon 等新 SKU（见 §5） |

---

## 2. 价格核对表（active 模型）

所有价格单位：USD / 1M tokens。✅ = 与官方页一致；🛠 = 本次修正/补录。

| 厂商 | 模型 | 输入 | 输出 | 缓存读 | 上下文 | 长上下文 | 结果 | 官方来源 |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| OpenAI | GPT-6 astra | $10 | $50 | $1.00 | 1,050,000 | >272K：2× / 1.5× | 🛠 窗口 + 档位 | [pricing](https://platform.openai.com/docs/pricing) · [model](https://developers.openai.com/api/docs/models/gpt-6-astra) |
| OpenAI | GPT-6 sol | $2 | $10 | $0.20 | 1,050,000 | >272K：2× / 1.5× | 🛠 窗口 + 档位 | [pricing](https://platform.openai.com/docs/pricing) · [model](https://developers.openai.com/api/docs/models/gpt-6-sol) |
| OpenAI | GPT-6 luna | $0.10 | $0.50 | $0.01 | 1,050,000 | >272K：2× / 1.5× | 🛠 窗口 + 档位 | [pricing](https://platform.openai.com/docs/pricing) · [model](https://developers.openai.com/api/docs/models/gpt-6-luna) |
| OpenAI | GPT-5.6 cyber | $12.50 | $75 | $1.25 | 400,000 | — | 🛠 补缓存价 | [pricing](https://platform.openai.com/docs/pricing) · [model](https://developers.openai.com/api/docs/models/gpt-5.6-cyber) |
| OpenAI | GPT-5.6 sol | $4 | $20 | $0.40 | 1,050,000 | >272K：2× / 1.5× | 🛠 缓存 + 窗口 + 档位 | [pricing](https://platform.openai.com/docs/pricing) · [model](https://developers.openai.com/api/docs/models/gpt-5.6-sol) |
| Anthropic | Fable 5.1 | $10 | $50 | $0.25 | 1,000,000 | — | 🛠 窗口 | [pricing](https://claude.com/pricing#api) |
| Anthropic | Opus 5.5 | $4 | $20 | $0.20 | 1,000,000 | — | 🛠 窗口 | [pricing](https://claude.com/pricing#api) · [launch](https://www.anthropic.com/news/claude-opus-5-5) |
| Anthropic | Sonnet 5 | $2 | $10 | $0.20 | 1,000,000 | — | 🛠 窗口 | [pricing](https://claude.com/pricing#api) |
| Anthropic | Haiku 4.5 | $1 | $5 | $0.10 | 200,000 | — | ✅ | [pricing](https://claude.com/pricing#api) |
| Google | Gemini 3.1 Pro Preview | $2 | $12 | $0.20 | 1,000,000 | >200K：2× / 1.5× | 🛠 缓存 + 档位 | [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Google | Gemini 3.8 Flash | $0.75 | $3.75 | $0.075 | 1,000,000 | — | ✅（引入价，见备注） | [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Google | Gemini 3.1 Flash-Lite | $0.25 | $1.50 | $0.025 | 1,000,000 | — | 🛠 补缓存价 | [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Google | Gemini 2.5 Pro | $1.25 | $10 | $0.125 | 1,000,000 | >200K：2× / 1.5× | ✅ | [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Google | Gemini 2.5 Flash-Lite | $0.10 | $0.40 | $0.010 | 1,000,000 | — | ✅ | [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Google | Gemini 2.5 Flash | $0.30 | $2.50 | $0.030 | 1,000,000 | >200K：2× / 1.5× | ✅ | [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| DeepSeek | V4.1-Flash 1017（peak） | $0.30 | $1.20 | $0.006 | 1,000,000 | — | ✅（当前在售 checkpoint） | [pricing](https://api-docs.deepseek.com/quick_start/pricing) |
| DeepSeek | V4.1-Flash 1017（off-peak） | $0.15 | $0.60 | $0.003 | 1,000,000 | — | ✅ | [pricing](https://api-docs.deepseek.com/quick_start/pricing) |
| DeepSeek | V4.1-Flash 0910（首发 checkpoint，已退役，同价） | $0.30 | $1.20 | $0.006 | 1,000,000 | — | 🛠 独立成行（见 §5.5） | [pricing](https://api-docs.deepseek.com/quick_start/pricing) |
| DeepSeek | V4-Pro（peak） | $1.32 | $3.96 | $0.044 | 1,000,000 | — | ✅ | [pricing](https://api-docs.deepseek.com/quick_start/pricing) |
| DeepSeek | V4-Pro（off-peak） | $0.66 | $1.98 | $0.022 | 1,000,000 | — | ✅ | [pricing](https://api-docs.deepseek.com/quick_start/pricing) |
| MiniMax | M3.1 Flash | $0.15 | $0.60 | $0.015 | 1,000,000 | — | ✅ | [pricing](https://platform.minimax.io/docs/pricing/overview) |
| MiniMax | M3 | $0.30 | $1.20 | $0.060 | 1,000,000 | >512K：2× / 2× | ✅ | [pricing](https://platform.minimax.io/docs/pricing/overview) |
| xAI | Grok 4.7 | $2 | $6 | $0.50 | 500,000 | ≥200K：2× / 2× | 🛠 补缓存价 + 档位 | [pricing](https://docs.x.ai/docs/pricing) |

### 2.1 本次价格/参数修正明细

| 模型 | 字段 | 修改前 | 修改后 | 依据 |
| --- | --- | ---: | ---: | --- |
| GPT-6 astra | contextWindow | 400,000 | 1,050,000 | OpenAI model page / pricing page |
| GPT-6 astra | longContext | 无 | >272K，2× / 1.5× | OpenAI pricing 的 Long context 列 |
| GPT-6 sol | contextWindow | 400,000 | 1,050,000 | 同上 |
| GPT-6 sol | longContext | 无 | >272K，2× / 1.5× | 同上 |
| GPT-6 luna | contextWindow | 400,000 | 1,050,000 | 同上 |
| GPT-6 luna | longContext | 无 | >272K，2× / 1.5× | 同上 |
| GPT-5.6 sol | cachedInputPricePer1M | 未录 | 0.40 | OpenAI pricing 的 Cached input 列 |
| GPT-5.6 sol | contextWindow | 400,000 | 1,050,000 | OpenAI model page |
| GPT-5.6 sol | longContext | 无 | >272K，2× / 1.5× | OpenAI pricing 的 Long context 列 |
| GPT-5.6 cyber | cachedInputPricePer1M | 未录 | 1.25 | OpenAI pricing |
| GPT-5.6 sol | note | 无 | 促销价到至少 2026-11-21；此前价 $5 / $30 | OpenAI pricing 页脚注 + OrcaRouter |
| Claude Fable 5.1 | contextWindow | 200,000 | 1,000,000 | Anthropic model card / help center |
| Claude Opus 5.5 | contextWindow | 200,000 | 1,000,000 | Anthropic model card / help center |
| Claude Sonnet 5 | contextWindow | 200,000 | 1,000,000 | Anthropic model card / help center |
| Claude Opus 5 | contextWindow | 200,000 | 1,000,000 | Anthropic help center（delisted，仅订正窗口） |
| Gemini 3.1 Pro | cachedInputPricePer1M | 未录 | 0.20 | Google pricing「Context caching price」 |
| Gemini 3.1 Pro | longContext | 无 | >200K，2× / 1.5× | Google pricing「prompts > 200k tokens」 |
| Gemini 3.1 Flash-Lite | cachedInputPricePer1M | 未录 | 0.025 | Google pricing |
| Gemini 3.8 Flash | note | 无 | 引入价到 2026-12-31，2027-01-01 起翻倍 | Google pricing |
| Grok 4.7 | cachedInputPricePer1M | 未录 | 0.50 | xAI pricing「Cached」列 |
| Grok 4.7 | longContext | 无 | ≥200K，2× / 2× | xAI pricing「Long context ≥ 200k」 |
| DeepSeek V4.1-Flash 1017 | displayName / note | 无（与 0910 混在一行） | displayName「DeepSeek V4.1-Flash 1017」+ note 写明当前 checkpoint、API 模型名、开源地址 | DeepSeek pricing / 1017 公告 |
| DeepSeek V4.1-Flash 0910 | 新增独立行 | 无 | displayName「DeepSeek V4.1-Flash 0910」，status delisted，同价 | 同上 |

> ⚠️ **口径提醒（不改数据，但要知道）**
> - 计算器的长上下文判定用的是 **input + output 总长度**；OpenAI 的 272K、Gemini 的 200K、Grok 的 200K、MiniMax 的 512K 门槛，官方写的都是 **input / prompt tokens**。两者在“输出把总量推过线、输入没到线”的边界上会差一档；本次没有改判定逻辑。
> - 长上下文下，**缓存读价也会翻倍**（OpenAI、Gemini、Grok 都是）。本次已把 `cost.ts` 的 input multiplier 同样应用到 cached input，并补了四个回归断言（GPT-6 Astra / Gemini 3.1 Pro / Grok 4.7 / MiniMax M3）。
> - Claude 4.x / Fable 5 的上下文按 chat / Claude Code / API 三种口径不一致（500K / 1M / 200K 都可能出现）。本次只订正 active 5.x 与 Opus 5；旧行保留原值，没有把某个 surface 的数字当成 API 唯一口径。
> - **价格冲突（未改）**：Google Cloud 的 Sonnet 5 页面写「$2 / $10 是 2026-08-31 前的发布价，之后 $3 / $15」，但 Anthropic 当前定价页仍列 $2 / $10。本次以 Anthropic 官方页为准保留 $2 / $10；如果官方页跳价，需要同步。

---

## 3. 跑分核对

### 3.1 已有跑分：110 条参考表分数全部对上

参考表是 DeepSeek V4.1-Flash 发布公告里的 7 列对比表（[中文原文](https://api-docs.deepseek.com/zh-cn/news/news260910/)），覆盖 DeepSeek V4.1-Flash / V4-Pro 0813 / V4-Flash 0731、GLM 5.3、Kimi K3、GPT-5.6 Sol、Claude Opus 5。

| 模型 | 分数条数 | 来源 | 核对结果 |
| --- | ---: | --- | --- |
| DeepSeek V4.1-Flash | 19 | 发布公告参考表 | ✅ 逐条一致 |
| DeepSeek V4-Pro 0813 | 16 | 同上 | ✅ 逐条一致 |
| DeepSeek V4-Flash 0731 | 15 | 同上 | ✅ 逐条一致 |
| GLM 5.3 | 13 | 同上 | ✅ 逐条一致 |
| Kimi K3 | 16 | 同上 | ✅ 逐条一致 |
| GPT-5.6 Sol | 16 | 同上 | ✅ 逐条一致 |
| Claude Opus 5 | 15 | 同上 | ✅ 逐条一致 |
| Gemini 3.1 Pro | 5 | Google model card + 聚合站 | ✅ 与现有来源一致 |
| Grok 4.7 | 2 | BenchLM / 厂商 | ✅ 与现有来源一致 |
| MiniMax M3.1 Flash | 4 | 厂商发布稿 | ✅ 与现有来源一致 |
| MiniMax M3 | 6 | 厂商发布稿 + model card | ✅ 与现有来源一致 |

**没有发现任何一条“抄错”的分数。** 表中另有 4 行（Gemini 3.1 Pro / Grok 4.7 / MiniMax M3.1 Flash / MiniMax M3）不在 DeepSeek 那张参考表里，按各自来源复核后数值未改。你感觉不对，更可能是因为下面这些“缺行/旧 checkpoint”，而不是数字抄错。

### 3.2 新增 8 条

#### Claude Opus 5.5（4 条，partial）

| Benchmark | 分数 | 口径 / 备注 | 来源 |
| --- | ---: | --- | --- |
| HLE（无工具） | 64.4 | max effort，system card 口径 | [BenchLM HLE](https://benchlm.ai/benchmarks/hlenotools) |
| Terminal-Bench 4.0 | 66.4 | Anthropic 官方，xhigh effort；AA 在同 harness 下是 59.6 | [Anthropic launch](https://www.anthropic.com/news/claude-opus-5-5) |
| HLE（带工具） | 67.7 | Anthropic 官方 | 同上 |
| Chartography（带工具） | 89.0 | Anthropic 官方 | 同上 |

> 没加 GPQA Diamond：公开来源互相冲突（87.5 / 94.2 / 96 都出现过），宁可空着。没加 AutomationBench 40.0：和参考表里 Opus 5 的 50.3 不是同一套 harness，放进同一列会误导。

#### GPT-6 Astra（4 条，partial）

| Benchmark | 分数 | 口径 / 备注 | 来源 |
| --- | ---: | --- | --- |
| GPQA Diamond | 96.0 | OpenAI 报的「任意 effort 最高值」 | [Snowflake 转载 OpenAI 表](https://www.snowflake.com/en/blog/openai-gpt-6-astra-snowflake-cortex-ai/) |
| HLE（无工具） | 54.7 | Artificial Analysis，max effort | [OpenRouter / AA](https://openrouter.ai/openai/gpt-6-astra) |
| Terminal-Bench 2.1 | 89.9 | Artificial Analysis，high effort | 同上 |
| Terminal-Bench 4.0 | 57.9 | OpenAI 最高值；Anthropic 竞品表同样给 57.9（high） | [Snowflake](https://www.snowflake.com/en/blog/openai-gpt-6-astra-snowflake-cortex-ai/) |

> 没加 AutomationBench 41.4 / Agents' Last Exam 59.3：参考表里 GPT-5.6 Sol 的对应值是 45.8 / 26.7，和 OpenAI 自己表的 18.1 / 53.6 完全不是一个量级。混在同一列比“缺数据”更糟。

### 3.3 排名口径提醒（本次未改排序逻辑）

首页 `Avg` 列是「已有 core benchmark 的算术平均」，不要求六项全覆盖。新增的两行覆盖很薄：

- **GPT-6 Astra** 只有 GPQA / HLE / TB2.1 三项 core，Avg 80.2，暂列第一；
- **Claude Opus 5.5** 只有 HLE 一项 core，Avg 64.4，排第十。

这是覆盖度差异，不是能力结论。是否给 `Avg` 加一个最低覆盖门槛（例如 4/6 才参与排序），是产品决策；本次只改数据，没有动排序逻辑。你手动核验时可以顺手看一眼这个口径是否要改。

### 3.4 有冲突、本次没改的分数

| 模型 / benchmark | 当前值 | 另一个来源 | 处理 |
| --- | ---: | ---: | --- |
| GPT-5.6 Sol / CyberGym | 84.5 | 83.6（[OrcaRouter](https://www.orcarouter.ai/blog/glm-5-3-vs-gpt-5-6-sol)） | 保留 84.5：这一行的引用口径就是 DeepSeek 参考表 |
| GPT-5.6 Sol / Terminal-Bench 4.0 | 39.9 | 37.3（Anthropic 竞品表） | 保留 39.9，理由同上 |
| Gemini 3.1 Pro / HLE | 44.4 | 45.4（BenchLM） | 保留 44.4：引用的是 Google model card |
| Claude Opus 5 / GPQA | 93.4 | 93.2（AA） | 保留 93.4：引用的是参考表 |
| Claude Opus 5.5 / GPQA | 未录 | 87.5 / 94.2 / 96 | 不录：三个来源互相打架，且没有说明 harness |
| GPT-6 Astra / AutomationBench、Agents' Last Exam | 未录 | 41.4 / 59.3 | 不录：与参考表同名列不可比 |

### 3.5 DeepSeek V4.1-Flash 1017：11 条新分数（单独一行，不与 0910 融合）

来源是 1017 公告里的对照表（[英文页](https://api-docs.deepseek.com/news/news261017/) / [中文页](https://api-docs.deepseek.com/zh-cn/news/news261017)，图片表格 en / cn 两版数值一致）。
这张表有 6 个模型列（1017 checkpoint、0910 checkpoint、Kimi K3、GLM 5.3、GPT-5.6-Sol、Claude Opus 5），11 行 benchmark。

| Benchmark | 1017（新入库） | 0910（既有） | 备注 |
| --- | ---: | ---: | --- |
| HLE（无工具） | 42.6 / 44.0* | 36.8 / 39.1* | * = 纯文本子集 |
| Terminal-Bench 4.0 | 42.3 | 31.2 | Claude Code 框架下测得 |
| DeepSWE v1.1 | 77.0 | 74.2 | Mini-SWE-V2 框架下测得 |
| ProgramBench | 29.1 | 20.3 | |
| NL2Repo-Bench | 68.2 | 65.4 | |
| Automation-Bench | 60.5 | 54.8 | |
| Agents' Last Exam | 35.4 | 31.8 | |
| Apex Bench v1.1 | 72.1 | 64.6 | 见下方说明 |
| Chartography（带工具） | 83.0 | 78.9 | |
| BabyVision（带工具） | 92.5 | 89.6 | |
| ZeroBench-main（带工具） | 51.0 | 49.0 | Pass@5 |

**交叉核对结果：这 10 个共有列，我们手里的 0910 数字与厂商这次重述的完全一致**（36.8/39.1、31.2、74.2、20.3、65.4、54.8、31.8、78.9、89.6、49.0）——这是两套独立转录（0910 公告对照表 vs 1017 公告对照表）互相对上的结果，也顺带证明 0910 那 19 条没有被抄错。

**唯一对不上的是 Apex Bench v1.1 这一列**，原因不是抄错，而是**同名不同表**：我们给 0910 行记的是 **MathArena Apex**（65.6，来源 matharena.ai），而这张表里的 **Apex Bench v1.1** 是 DeepSeek 自己发布的评测列（0910 checkpoint 是 64.6，Kimi K3 是 47.8）。两者不能互换，所以：

- 新增 benchmark id `apex-bench-v1.1`（name「Apex Bench v1.1」），与 `matharena-apex` 分开；
- 只给 1017 行记 72.1；0910 行的 64.6 **不补**——那一行的跑分只来自它自己的发布公告，保持「一行一个出处」；
- 文章里也不许把 64.6 当成 0910 行的成绩引用。

**另外两点事实**（进文章，不进价格表）：

- 1017 公告的性能–费用图显示，同一个 DeepSWE v1.1 成绩下，1017 的**每次任务成本只有 0910 的一小部分**（图上 1017 max 档约 $0.19/任务、0910 max 档约 $0.47/任务——**这是「每次任务」的成本，不是每 1M token 的单价，所以不进价格表，文章里也不引用**，只描述「同样成绩、更低的单任务成本」）。
- 1017 公告同时开放了 DeepSeek 自研的 Search / Fetch API，按每千次调用计费，API 用户通过服务端工具调用在 2026-10-31 16:00 UTC（北京时间 11 月 1 日 00:00）之前免费——同样**不引用具体金额**。

---

## 4. 改了哪些文件

| 文件 | 改动 |
| --- | --- |
| `src/features/calculator/model-prices.ts` | 缓存价、上下文窗口、长上下文档位、备注；**DeepSeek V4.1-Flash 拆成 1017 / 0910 两行**；`REGISTRY_VERSION` 0.6.0；`fetchedAt` 2026-10-20 |
| `src/features/leaderboard/models.ts` | 新增 Claude Opus 5.5 / GPT-6 Astra 两行共 8 条分；**新增 `deepseek-v4.1-flash-1017` 一行 11 条分，0910 行改名并改指 0910 价格行**；`REGISTRY_VERSION` 0.6.0；`fetchedAt` 2026-10-20 |
| `src/features/leaderboard/benchmarks.ts` | **新增 `apex-bench-v1.1`**（与 `matharena-apex` 分开） |
| `src/features/leaderboard/leaderboard.ts` | `BENCHMARK_SHORT` 加 `apex-bench-v1.1` |
| `src/features/calculator/model-notes.ts` | 两个 DeepSeek checkpoint 的中文备注 |
| `src/features/calculator/__tests__/model-notes.node.test.ts` | 备注条数 24 → 25 |
| `src/content/releases/claude-opus-5-5.md` / `.zh.md` | 加 `modelSlug`、1M 上下文、4 项跑分、发布日期；`dataCheckedAt` 2026-10-20 |
| `src/content/releases/gpt-6-astra.md` / `.zh.md` | 加 `modelSlug`、1,050,000 上下文、长上下文价、4 项跑分；`dataCheckedAt` 2026-10-20 |
| `src/content/releases/gemini-3-1-pro.md` / `.zh.md` | 删掉“窗口是 OpenAI 2.5 倍 / 无长上下文档位”的错误结论；补 $4/$18、缓存 $0.20、GPQA 已被 GPT-6 Astra 超过 |
| `src/content/releases/deepseek-v4-1-flash.md` / `.zh.md` | **改指 0910 价格行**；正文说明这张表说的是 0910 checkpoint，并链到 1017 那篇 |
| `src/content/releases/deepseek-v4-1-flash-1017.md` / `.zh.md` | **新增**：1017 checkpoint 的发布分析（11 项跑分、同价、单独成篇） |
| `src/content/releases/grok-4-7.md` / `.zh.md` | 补缓存 $0.50、200K 长上下文档位、发布日期；`sourceUrl` 改为 pricing |
| `src/content/releases/minimax-m3-1-flash.md` / `.zh.md` | 仅日期（价格/分数未变） |
| `src/features/calculator/cost.ts` | 长上下文时把 input multiplier 同样应用到 cached input（OpenAI / Gemini / Grok / MiniMax 都适用） |
| `src/features/calculator/__tests__/cost.node.test.ts` | 新增长上下文 / 窗口回归测试，并在 MiniMax 用例里补缓存断言 |
| `src/features/releases/README.md` | 系列契约加第 7 篇（1017 checkpoint）与两个 checkpoint 的分工说明 |
| `src/features/records/`（新） | **记录台账**：把「我们发布过什么」钉住——分数、备注、身份（退役记录还钉价格线）；新增 checkpoint 必须是新记录，旧记录只能退役不能改写；改值必须走 `changes` 日志（`correction` = 抄错了 / `remeasurement` = 厂商重测） |
| `src/features/records/__tests__/records.node.test.ts` | 护栏：每个价格行 / 榜单行都要有台账条目；pin 住的值不得静默改动；被取代的记录必须退役；同一 family 内版本 token 不能重复 |
| `scripts/records/pins.ts` | `pnpm records:pins`——打印与注册表对齐的台账（只读，不写文件） |
| `src/features/releases/__tests__/integrity.node.test.ts` | 护栏漏了「非高峰缓存读价」这个合法价格（$0.003 写不出来），补进 allowed 集合 |
| `src/features/series/series.ts` | DeepSeek V4 系列的两个 checkpoint 成员各自指向自己的跑分行（`v4.1-flash-1017` → `deepseek-v4.1-flash-1017`，`v4.1-flash-0910` → `deepseek-v4.1-flash`） |
| `AGENTS.md` | 「三者一体」表加一行：checkpoint 发布 = 独立记录，不合并 |
| `scripts/prices/version.ts` | `SCRIPT_VERSION` 0.6.0，与 REGISTRY 对齐 |

验证命令（均已通过）：

```bash
pnpm test       # 394 tests passed
pnpm typecheck  # 本次改动的文件无类型错误
```

---

## 5. 发现了、但本次没入库的新东西

按仓库规则（`AGENTS.md`：prices + scores + release pages 必须一起动），新增一个模型要同时加 REGISTRY 行、LEADERBOARD 行、en/zh 两篇 release。这一轮先把“已记录模型”订正完，下面这些留给下一轮：

| 厂商 | 新 SKU | 价格 | 上下文 | 来源 |
| --- | --- | --- | ---: | --- |
| OpenAI | GPT-6.1 Sol | $2 / $10，缓存 $0.10，写入 $2.50；>272K：$4 / $15 | 1,050,000 | [pricing](https://platform.openai.com/docs/pricing) |
| Anthropic | Claude Sonnet 5.5 | $2 / $10，缓存读 $0.10，写入 $2.50 | 1,000,000 | [pricing](https://claude.com/pricing#api) · [context](https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans) |
| Google | Gemini 4 Argon | $2 / $10，缓存 $0.10 | 未核 | [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Google | Gemini 3.6 Flash | $0.75 / $3.75（2026-12-31 前），缓存 $0.075 | 未核 | 同上 |
| Google | Gemini 3.5 Flash-Lite | $0.30 / $2.50，缓存 $0.03 | 未核 | 同上 |
| Google | Gemini Omni Flash | $1.50 / $9.00 | 未核 | 同上 |

> **DeepSeek V4.1-Flash-1017 已经不在这一栏里了**——它在本轮单独入库，见 §5.5。

---

## 5.5 DeepSeek V4.1-Flash 1017：两个 checkpoint，各记各的

**为什么必须拆开。** DeepSeek 的 V4.1-Flash 是在同一个 API 模型名（`deepseek-flash`）下滚动更新的 checkpoint。0910 和 1017 **不是同一个模型**：权重不同、跑分不同、发布公告不同。如果把两套分数并到一行，读者会把「发布公告测出来的成绩」当成「今天 API 里的权重」，这正是跑分表最常见的误用。

**这一轮做了什么（三张表各自补齐）**：

| 面 | 0910（首发） | 1017（当前在售） |
| --- | --- | --- |
| 价格 `REGISTRY` | `deepseek-flash-0910`（delisted，同价 $0.30 / $1.20 peak，$0.15 / $0.60 off-peak，缓存 $0.006 / $0.003，ctx 1,000,000） | `deepseek-flash`（active，同价同窗口） |
| 跑分 `LEADERBOARD` | `deepseek-v4.1-flash`（displayName「DeepSeek V4.1-Flash 0910」，19 项，来自 0910 发布公告对照表） | `deepseek-v4.1-flash-1017`（displayName「DeepSeek V4.1-Flash 1017」，11 项，来自 1017 公告对照表） |
| 文章 `src/content/releases` | `deepseek-v4-1-flash`（中英各一篇） | `deepseek-v4-1-flash-1017`（中英各一篇，**新增**） |

**几条口径**：

- **价格没变，所以两行的单价一模一样**——但它们是两条独立的行，价格行的 `id` 也分开（`deepseek-flash` = 现在在售的 1017，`deepseek-flash-0910` = 已退役的 0910）。合并成一行，等于让「历史 checkpoint」和「在售 checkpoint」共用一条状态，退役这件事就看不出来了。
- **0910 那 19 条分数一条没动**，仍然只来自它自己的发布公告对照表（保持「一行一个出处」）。1017 公告里顺带重述的 0910 数字，和我们手里的 10 个共有列逐条一致（见 §3.5），当作**交叉验证**记在报告里，不写回 0910 行。
- **0910 行因此不再是「active 模型」**：它现在标 `delisted`，但价格仍在（长尾搜索要留住），和 `deepseek-chat`、`grok-4` 这些退役行的处理方式一致。
- **Apex Bench v1.1 与 MathArena Apex 分开**：新增 benchmark id `apex-bench-v1.1`，只给 1017 行记 72.1；0910 行的 64.6 不补（它的数学列是 MathArena Apex 65.6，两者同名不同表）。
- **两篇文章互链**：0910 那篇明确写「这张表说的是 0910 checkpoint」，1017 那篇明确写「这是今天 API 服务的权重」，并各自链到模型页与对方。

**没做（有意）**：没有把 1017 的分数和 0910 的分数求平均，也没有在任一篇文章里用另一套分数做比较。两套分数只能各自跟同一张表里的其他模型比。

**这条规矩现在有机器护栏了**（`src/features/records/`）：新增「记录台账」这一面，把「我们发布过什么」钉住——

- 每个价格行、每个榜单行都必须在台账里有一条记录 → **新版本必须是新记录**；
- 台账里 pin 住的值（分数、备注、身份 displayName/version；退役记录还 pin 价格线）**不得静默改动**，要改只能走 `changes` 日志：`correction`（我们抄错了）或 `remeasurement`（厂商对同一批权重重测），都要写日期、理由、来源；退役记录只接受 `correction`；
- 取代别人的记录必须把被取代的退役（`retiredAt` + 价格行非 active）；
- **同一 family 内版本 token 不能重复** → 抓「版本号没变、只改后缀，却把旧行改掉了」这种操作。

在售记录的价格**不 pin**：价格是厂商计费页的事实，它有自己的一套纪律（`lastVerified` / `fetchedAt` / 重读文章）；退役记录的价格线是历史事实，所以 pin 住。

---

## 6. 手动核验清单（按这个顺序点）

### 价格 / 上下文

1. **OpenAI** — [pricing](https://platform.openai.com/docs/pricing)。要点：
   - 页面顶部有 `Standard / Batch / Flex / Fast / Ultrafast` 五个 tab，**只看 Standard**；Batch/Flex 是 5 折，Fast 是 2 倍，Ultrafast 是 6 倍。
   - 每张表有 `Short context / Long context` 两列；Long context 列就是 >272K 的价。
   - 逐个点开 [astra](https://developers.openai.com/api/docs/models/gpt-6-astra)、[sol](https://developers.openai.com/api/docs/models/gpt-6-sol)、[luna](https://developers.openai.com/api/docs/models/gpt-6-luna)、[5.6 sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol)、[5.6 cyber](https://developers.openai.com/api/docs/models/gpt-5.6-cyber) 的 model page，核 `Context window`：前四个 1,050,000，cyber 400,000。
2. **Anthropic** — [pricing](https://claude.com/pricing#api)，点 API tab。核对四张卡：Fable 5.1 `$10/$50/$0.25/$12.50`、Opus 5.5 `$4/$20/$0.20/$5.00`、Sonnet 5 `$2/$10/$0.20/$2.50`、Haiku 4.5 `$1/$5/$0.10/$1.25`。上下文看 [help center](https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans)：Fable 5.1 / Opus 5.5 / Sonnet 5 / Opus 5 都是 1M，Haiku 4.5 是 200K。
3. **Google** — [pricing](https://ai.google.dev/gemini-api/docs/pricing)。重点看三行：
   - Gemini 3.1 Pro Preview：`$2.00, prompts <= 200k` / `$4.00, prompts > 200k`，输出 `$12.00` / `$18.00`，缓存 `$0.20` / `$0.40`。
   - Gemini 3.8 Flash：`$0.75 / $3.75 / $0.075 through December 31, 2026`，2027-01-01 起翻倍。
   - Gemini 3.1 Flash-Lite：`$0.25 / $1.50 / $0.025`。
4. **DeepSeek** — [pricing](https://api-docs.deepseek.com/quick_start/pricing)。核对 peak/off-peak 四格 + MODEL VERSION `DeepSeek-V4.1-Flash-1017`；off-peak 是 peak 的一半是文档原文。MODEL VERSION 现在写的是 1017——那就是 API 今天在服务的 checkpoint；0910 首发 checkpoint 价格一模一样，站内以独立条目 `deepseek-flash-0910` 保留。
5. **MiniMax** — [pricing](https://platform.minimax.io/docs/pricing/overview)。M3.1 Flash `$0.15 / $0.60 / $0.015`；M3 `$0.30 / $1.20 / $0.06`，>512K 翻倍。
6. **xAI** — [pricing](https://docs.x.ai/docs/pricing)。Grok 4.7 `500k` 上下文；短上下文 `$2.00 / $0.50 / $6.00`；长上下文（≥200K）`$4.00 / $12.00`，缓存读也翻倍。

### 跑分

7. **DeepSeek 参考表** — [news260910](https://api-docs.deepseek.com/zh-cn/news/news260910/)。这是已有 110 条分数的唯一来源；逐列对 GPQA / HLE / Codeforces / Apex / TB 2.1 / TB 3.0 / TB 4.0 / DeepSWE / ProgramBench / NL2Repo / CyberGym / SEC / ExploitGym / HLE-tools / Automation / Agents / Chartography / BabyVision / ZeroBench。
8. **Claude Opus 5.5** — [Anthropic launch](https://www.anthropic.com/news/claude-opus-5-5)。表里能直接看到 TB4 66.4、HLE-tools 67.7、Chartography 89.0；HLE 64.4 在 system card，[BenchLM](https://benchlm.ai/benchmarks/hlenotools) 有转引。
9. **GPT-6 Astra** — [Snowflake 转载的 OpenAI 表](https://www.snowflake.com/en/blog/openai-gpt-6-astra-snowflake-cortex-ai/) 核 GPQA 96.0、TB4 57.9；[OpenRouter / AA](https://openrouter.ai/openai/gpt-6-astra) 核 HLE 54.7、TB2.1 89.9。
10. **Kimi K3 / MathArena** — [matharena.ai](https://matharena.ai/models/moonshot_k3)。Apex 65.62 是 MathArena 的 Apex，不是 1017 公告里的 “Apex Bench v1.1”（那张表里是 47.8）——两个 benchmark 同名不同表，不要混。现在 1017 公告那一列以独立 benchmark id `apex-bench-v1.1` 入库（1017 = 72.1），0910 行不补 64.6。

---

## 7. 复现与注意事项

```bash
# 1) 拉最新价格（会写 data/last-fetch.json，本地忽略）
pnpm prices:fetch

# 2) 只看 apply diff，不写入
pnpm prices:fetch -- --apply

# 3) 跑 release 三表一致性 + 成本回归
pnpm test -- src/features/releases/__tests__/integrity.node.test.ts
pnpm test -- src/features/calculator/__tests__/cost.node.test.ts

# 4) 类型检查
pnpm typecheck
```

> ⚠️ **不要直接 `pnpm prices:fetch -- --apply --yes`。** OpenAI 的 pricing 页现在把 Standard / Batch / Flex / Fast / Ultrafast 五个 tab 都渲染成 `<table>`，scraper 按 DOM 顺序取，可能先读到 Batch（5 折）而不是 Standard。本次 dry-run 就出现过 `GPT-6 astra 10 → 5` 的假 diff；真实 Standard 价是 $10 / $50。Anthropic 页面偶尔还会 0 models（本次有一次），也要以人工打开页面为准。

---

*报告生成时间：2026-10-20。价格/分数以文内链接的官方页为准；有冲突时，本报告在 §3.4 标了取舍理由。*
