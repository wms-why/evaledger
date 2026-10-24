---
title: "Gemini 3.1 Pro Preview：$2 / $12 到 200K，超过后 $4 / $18"
description: "Google 的 Gemini 3.1 Pro Preview 每 1M token 输入 $2、输出 $12（不超过 200,000 token），超过后 $4 / $18，上下文 1,000,000 token。5 项可溯源跑分，外加旧页面漏掉的长上下文档位。"
date: "2026-10-19"
checkedAt: "2026-10-20"
dataCheckedAt: "2026-10-21"
vendor: google
modelId: gemini-3.1-pro-preview
modelSlug: gemini-3.1-pro
compareModelIds:
  - gemini-3.8-flash
  - gemini-3.1-flash-lite
  - gemini-2.5-pro
compareSlugs:
  - gpt-5.6-sol
  - gpt-6-astra
  - claude-opus-5
  - deepseek-v4.1-flash
sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing"
sourceTitle: "Google — Gemini API pricing"
published: true
---

## 一句话结论

- **Gemini 3.1 Pro Preview 在 200,000 token 以内是每 1M 输入 $2、输出 $12，超过后 $4 / $18，上下文 1,000,000 token。** 长上下文档位就印在 Google 自己的价格行里——这个页面之前说「没有档位」，那是错的。
- **窗口不再是差异点。** 1M token 已经和 Claude Opus 5.5、GPT-6 Astra（1,050,000）同档，OpenAI 和 Anthropic 的旗舰不再是 200K–400K 的模型。剩下的差异是价格：$2 / $12 只有 GPT-6 astra 的 $10 / $50、GPT-5.6 sol 的 $4 / $20 的几分之一——而 sol 的这 $4 / $20 是促销价，到 2026-11-21 为止，之后是 $5 / $30。
- **5 项可溯源跑分，但其中一项不再是榜首。** GPQA Diamond 94.3、HLE 44.4、带工具的 HLE 51.4、MathArena Apex 60.9、Automation-Bench 35.4。GPT-6 Astra 现在报 96.0，所以 94.3 是紧随其后的第二，而不是第一。

## 发布了什么

- **Google 新的 Pro 档 SKU。** Gemini 3.1 Pro Preview：输入 $2 / 1M、输出 $12 / 1M，上下文 1,000,000 token，active。定价页上的名字带 “Preview”，我们照原样写。
- **长上下文档位是真的，而且两头都涨。** Google 的行写得很清楚：输入「$4.00, prompts > 200k tokens」，输出「$18.00, prompts > 200k」。缓存读在阈值之上也会翻倍。计算器已经算进了输入、输出和缓存读三档。
- **Flash 档一高一低地夹着它。** Gemini 3.8 Flash $0.75 / $3.75（引入价，到 2026-12-31；2027-01-01 起是 $1.50 / $7.50），Gemini 3.1 Flash-Lite $0.25 / $1.50，都是 active，上下文也都是 1,000,000。计算器保持今天的价；注册表里存的是整条价格带，所以到期日在模型页上看得见，而不是埋在一句备注里。
- **上一代 Pro 还在，而且也在同一个阈值跳档。** Gemini 2.5 Pro 是 $1.25 / $10，超过 200,000 token 后同样变成输入 2 倍、输出 1.5 倍。我们列的是标准档，不是长上下文档。

## 成本

- **先看价格，不要再看窗口。** 1,000,000 token 和 Claude Opus 5.5、Sonnet 5（1M）、GPT-6 Astra（1,050,000）在同一档；它仍然是 GPT-5.6 cyber 400,000 的 2.5 倍，但 cyber 是上一代的例外，不代表 OpenAI 全线。
- **和自家 Flash 档比，阶梯很陡。** 在 Flash 3.8 的引入价期内（到 2026-12-31），比 Flash 3.8 贵 2.67 倍输入、3.2 倍输出；比 Flash-Lite 贵 8 倍。所以「要不要上 Pro」本质上就是「这批流量值不值 3 倍」。
- **和 2.5 Pro 的对比要分输入和输出看。** 输入贵 1.6 倍，输出只贵 1.2 倍——输出占比高的业务，升级成本只有 20%，不是 60%。
- **长上下文档改变了比较，但没有改变排名。** 超过 200,000 token 后，3.1 Pro 收 $4 / $18，2.5 Pro 也按自己的基数跳同样的倍率。两边都跳，所以 3.1 Pro 在任何长度上都还是老模型的 1.6 倍 / 1.2 倍。旧页面说「超过 200K 老模型更贵」，那是假设只有一边有档位，结论是错的。
- **缓存那一格不再是空的。** Google 列的是 $0.20 / 1M（不超过 200,000 token），超过后翻倍。第一档内的缓存读是新鲜输入的 10%，省 90%，和 Flash 档同形。
- **窗口填满时价格会变。** 250,000 token 的请求按 $4 / $18 结账，不是 $2 / $12。提示词长期贴着阈值的话，要把这一跳显式算进去；计算器会算，算出来的月账单和首页单价不是一回事。

## 跑分

- **5 项跑分，出处还不一样。** GPQA Diamond 94.3 和 HLE 44.4 来自 Google 的 model card；带工具的 HLE 51.4 也来自 model card；MathArena Apex 60.9 和 Automation-Bench 35.4 来自公开的榜单聚合站。来源不同、harness 不同——所以下面的限定条件比数字本身更重要。
- **限定条件必须带着看。** HLE 44.4 是「不给工具」的完整集成绩（文本 + 多模态），不是只跑文本子集；51.4 是同一个 benchmark 打开工具后的另一次运行（带 blocklist 的搜索 + 代码）。所以 44.4 和 51.4 之间不是「涨了 7 分」，而是换了一套配置。
- **覆盖面才是重点，别去算平均分。** 5 项是相当薄的一张卡：比 Grok 4.7 的 2 项多，比 DeepSeek V4.1-Flash 的 19 项少得多，而且里面没有任何 terminal-bench 或 DeepSWE。表上那些空格是「没测」，不是「没得分」。
- **GPQA 的领先没了，替代结论很窄。** GPT-6 Astra 在同一个 benchmark 上报 96.0，所以 94.3 是榜上第二，只比 GPT-5.6 sol 的 94.1、Claude Opus 5 的 93.4 高零点几分。把它读成「知识类 benchmark 上大家挤在一起」，而不是「Gemini 赢了」或「Gemini 输了」。

## 该不该换

- **提示词长的场景，理由不再是窗口，而是价格。** Gemini 3.1 Pro 和 Claude 5.5 家族、GPT-6 系列同处 1M 档，单价却只有它们的几分之一。代价是 200K 那一跳：超过后输入翻倍、输出涨 50%。报节省之前先把档位算进去。
- **你在用 Gemini 2.5 Pro，而且提示词经常超过 200,000 token：** 新模型在单价上仍然更贵，因为两边都按同样的倍率跳档。换的理由是能力和 1M 窗口，不是「长上下文更便宜」。
- **你在用 Gemini 2.5 Pro，但输出占比高：** 输出只贵 1.2 倍（20%），这个升级的决策重点就落在「输出质量值不值 20%」，而不是「预算够不够」。
- **你在用 Flash 3.8：** 升级意味着输入 2.67 倍、输出 3.2 倍——这是引入价的倍数，成立到 2026-12-31；2027-01-01 起 Flash 翻倍到 $1.50 / $7.50，差距就变成输入 $2 对 $1.50、输出 $12 对 $7.50。只挑 Flash 不够用的那部分流量上 Pro，其余留在 Flash——家族内部的档位就是 5 倍一级的阶梯，混用比全量升级合理。
- **你买的是预览版。** SKU 名字里就写着 Preview，实际含义是：模型 id、价格、行为都可能变。代码里把模型 id 写死，做预算之前再来核一次价格。
- **别把 GPQA 那一行读成能力领先，正反都不行。** 5 项跑分、零个 agentic 编程项，诚实的总结是：能看到的部分很强，看不到的部分完全没测。

## 延伸阅读

- **模型页（我们有的全部跑分）** — [/models/gemini-3.1-pro](/zh/models/gemini-3.1-pro)
- **和 OpenAI 旗舰并排比** — [/compare?a=gemini-3.1-pro&b=gpt-5.6-sol](/zh/compare?a=gemini-3.1-pro&b=gpt-5.6-sol)
- **抢走 GPQA 榜首的 GPT-6 旗舰** — [/models/gpt-6-astra](/zh/models/gpt-6-astra)
- **算你自己的账** — [Token 成本计算器](/zh/token-cost-calculator)
- **GPQA 和 HLE 到底测什么** — [/benchmarks/gpqa-diamond](/zh/benchmarks/gpqa-diamond)、[/benchmarks/hle](/zh/benchmarks/hle)
- **本文的数据出处** — Google Gemini API 定价页，价格最后核对于 2026-10-20。
