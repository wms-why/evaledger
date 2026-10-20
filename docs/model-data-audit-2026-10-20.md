# 模型价格与跑分核对报告（2026-10-20）

> 范围：`src/features/calculator/model-prices.ts` 里 20 个 active 模型的价格，`src/features/leaderboard/models.ts` 里 13 个模型 / 135 条分数，以及受影响的 6 篇 release 文章（中英各一版，共 12 个文件）。
>
> 结论先说：**基础输入/输出单价没有一条是错的；不对的是“缺的字段”和“旧的门槛”**——4 个缓存读价没录、8 个上下文窗口偏小、5 个长上下文档位没建模；跑分方面，已有 110 条参考表分数逐条对上，没有抄错，缺的是 Claude Opus 5.5 / GPT-6 Astra 两行新分，以及 DeepSeek 1017 这个新 checkpoint 还没合并。

---

## 1. 一句话结论

| 项目 | 结果 |
| --- | --- |
| 20 个 active 模型的基础 input/output 单价 | **全部与官方页一致**，没有涨价/降价漏更新 |
| 缓存读价 | **补了 4 个**：GPT-5.6 Sol、GPT-5.6 Cyber、Gemini 3.1 Pro、Gemini 3.1 Flash-Lite |
| 上下文窗口 | **改了 8 个**：4 个 OpenAI（400K → 1,050,000）、4 个 Claude（200K → 1M；其中 Opus 5 已 delisted） |
| 长上下文档位 | **补了 5 个**：GPT-6 Astra / Sol / Luna、GPT-5.6 Sol（>272K，2× / 1.5×）、Gemini 3.1 Pro（>200K，2× / 1.5×） |
| 已有跑分 | **110 条参考表分数逐条核对，全部一致**（DeepSeek 三家 + GLM + Kimi + GPT-5.6 Sol + Claude Opus 5） |
| 新增跑分 | **8 条**：Claude Opus 5.5 四项、GPT-6 Astra 四项 |
| 没合并的 | DeepSeek V4.1-Flash-1017 新 checkpoint；GPT-6.1 Sol、Sonnet 5.5、Gemini 4 Argon 等新 SKU（见 §5） |

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
| DeepSeek | V4.1-Flash（peak） | $0.30 | $1.20 | $0.006 | 1,000,000 | — | ✅（API 已是 1017） | [pricing](https://api-docs.deepseek.com/quick_start/pricing) |
| DeepSeek | V4.1-Flash（off-peak） | $0.15 | $0.60 | $0.003 | 1,000,000 | — | ✅ | [pricing](https://api-docs.deepseek.com/quick_start/pricing) |
| DeepSeek | V4-Pro（peak） | $1.32 | $3.96 | $0.044 | 1,000,000 | — | ✅ | [pricing](https://api-docs.deepseek.com/quick_start/pricing) |
| DeepSeek | V4-Pro（off-peak） | $0.66 | $1.98 | $0.022 | 1,000,000 | — | ✅ | [pricing](https://api-docs.deepseek.com/quick_start/pricing) |
| MiniMax | M3.1 Flash | $0.15 | $0.60 | $0.015 | 1,000,000 | — | ✅ | [pricing](https://platform.minimax.io/docs/pricing/overview) |
| MiniMax | M3 | $0.30 | $1.20 | $0.060 | 1,000,000 | >512K：2× / 2× | ✅ | [pricing](https://platform.minimax.io/docs/pricing/overview) |
| xAI | Grok 4.7 | $2 | $6 | — | 500,000 | — | ✅ | [docs](https://docs.x.ai/docs/models) |

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
| Claude Fable 5.1 | contextWindow | 200,000 | 1,000,000 | Anthropic model card / help center |
| Claude Opus 5.5 | contextWindow | 200,000 | 1,000,000 | Anthropic model card / help center |
| Claude Sonnet 5 | contextWindow | 200,000 | 1,000,000 | Anthropic model card / help center |
| Claude Opus 5 | contextWindow | 200,000 | 1,000,000 | Anthropic help center（delisted，仅订正窗口） |
| Gemini 3.1 Pro | cachedInputPricePer1M | 未录 | 0.20 | Google pricing「Context caching price」 |
| Gemini 3.1 Pro | longContext | 无 | >200K，2× / 1.5× | Google pricing「prompts > 200k tokens」 |
| Gemini 3.1 Flash-Lite | cachedInputPricePer1M | 未录 | 0.025 | Google pricing |
| Gemini 3.8 Flash | note | 无 | 引入价到 2026-12-31，2027-01-01 起翻倍 | Google pricing |
| DeepSeek V4.1-Flash | note | 无 | API 版本为 1017（2026-10-17） | DeepSeek pricing / 1017 公告 |

> ⚠️ **口径提醒（不改数据，但要知道）**
> - 计算器的长上下文判定用的是 **input + output 总长度**；OpenAI 的 272K 门槛官方写的是 **input tokens**。两者在“输出把总量推过线、输入没到线”的边界上会差一档。
> - 长上下文下，**缓存读价也会翻倍**（OpenAI 与 Gemini 都是）。本次已把 `cost.ts` 的 input multiplier 同样应用到 cached input，并补了 GPT-6 Astra / Gemini 3.1 Pro / MiniMax M3 三个回归断言。

---

## 3. 跑分核对

### 3.1 已有 110 条：全部对上参考表

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

**没有发现任何一条“抄错”的分数。** 你感觉不对，更可能是因为下面这些“缺行/旧 checkpoint”，而不是数字抄错。

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

---

## 4. 改了哪些文件

| 文件 | 改动 |
| --- | --- |
| `src/features/calculator/model-prices.ts` | 缓存价、上下文窗口、长上下文档位、备注；`REGISTRY_VERSION` 0.5.0；`fetchedAt` 2026-10-20 |
| `src/features/leaderboard/models.ts` | 新增 Claude Opus 5.5 / GPT-6 Astra 两行共 8 条分；`REGISTRY_VERSION` 0.5.0；`fetchedAt` 2026-10-20 |
| `src/content/releases/claude-opus-5-5.md` / `.zh.md` | 加 `modelSlug`、1M 上下文、4 项跑分、发布日期；`dataCheckedAt` 2026-10-20 |
| `src/content/releases/gpt-6-astra.md` / `.zh.md` | 加 `modelSlug`、1,050,000 上下文、长上下文价、4 项跑分；`dataCheckedAt` 2026-10-20 |
| `src/content/releases/gemini-3-1-pro.md` / `.zh.md` | 删掉“窗口是 OpenAI 2.5 倍 / 无长上下文档位”的错误结论；补 $4/$18、缓存 $0.20、GPQA 已被 GPT-6 Astra 超过 |
| `src/content/releases/deepseek-v4-1-flash.md` / `.zh.md` | 补 1017 checkpoint 说明；日期 2026-10-20 |
| `src/content/releases/grok-4-7.md` / `.zh.md` | 仅日期（价格/分数未变） |
| `src/content/releases/minimax-m3-1-flash.md` / `.zh.md` | 仅日期（价格/分数未变） |
| `src/features/calculator/cost.ts` | 长上下文时把 input multiplier 同样应用到 cached input（OpenAI / Gemini / MiniMax 都适用） |
| `src/features/calculator/__tests__/cost.node.test.ts` | 新增长上下文 / 窗口回归测试，并在 MiniMax 用例里补缓存断言 |
| `scripts/prices/version.ts` | `SCRIPT_VERSION` 0.5.0，与 REGISTRY 对齐 |

验证命令（均已通过）：

```bash
pnpm test       # 380 tests passed
pnpm typecheck  # clean
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
| DeepSeek | V4.1-Flash-1017 | 价格不变（$0.30 / $1.20 peak） | 1,000,000 | [1017 公告](https://api-docs.deepseek.com/news/news261017/) |

其中 **DeepSeek 1017 最值得优先处理**：API 从 2026-10-17 起已经服务新 checkpoint，价格页的 MODEL VERSION 写的是 `DeepSeek-V4.1-Flash-1017`；它公布了 HLE 42.6/44.0、TB4 42.3、DeepSWE 77.0、ProgramBench 29.1 等一组新分数，和榜单上的旧 checkpoint 分数不是一回事。本次只在价格条目和 release 文章里加了“这是 1017”的说明，没有把两组分数混在一起。

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
4. **DeepSeek** — [pricing](https://api-docs.deepseek.com/quick_start/pricing)。核对 peak/off-peak 四格 + MODEL VERSION `DeepSeek-V4.1-Flash-1017`；off-peak 是 peak 的一半是文档原文。
5. **MiniMax** — [pricing](https://platform.minimax.io/docs/pricing/overview)。M3.1 Flash `$0.15 / $0.60 / $0.015`；M3 `$0.30 / $1.20 / $0.06`，>512K 翻倍。
6. **xAI** — [models](https://docs.x.ai/docs/models)。Grok 4.7 `500k tokens`、`$2.00 / $6.00`。

### 跑分

7. **DeepSeek 参考表** — [news260910](https://api-docs.deepseek.com/zh-cn/news/news260910/)。这是已有 110 条分数的唯一来源；逐列对 GPQA / HLE / Codeforces / Apex / TB 2.1 / TB 3.0 / TB 4.0 / DeepSWE / ProgramBench / NL2Repo / CyberGym / SEC / ExploitGym / HLE-tools / Automation / Agents / Chartography / BabyVision / ZeroBench。
8. **Claude Opus 5.5** — [Anthropic launch](https://www.anthropic.com/news/claude-opus-5-5)。表里能直接看到 TB4 66.4、HLE-tools 67.7、Chartography 89.0；HLE 64.4 在 system card，[BenchLM](https://benchlm.ai/benchmarks/hlenotools) 有转引。
9. **GPT-6 Astra** — [Snowflake 转载的 OpenAI 表](https://www.snowflake.com/en/blog/openai-gpt-6-astra-snowflake-cortex-ai/) 核 GPQA 96.0、TB4 57.9；[OpenRouter / AA](https://openrouter.ai/openai/gpt-6-astra) 核 HLE 54.7、TB2.1 89.9。
10. **Kimi K3 / MathArena** — [matharena.ai](https://matharena.ai/models/moonshot_k3)。Apex 65.62 是 MathArena 的 Apex，不是 1017 公告里的 “Apex Bench v1.1”（那张表里是 47.8）——两个 benchmark 同名不同表，不要混。

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

*报告生成时间：2026-10-20。价格/分数以文内链接的官方页为准；有冲突时，本报告在 §3.3 标了取舍理由。*
