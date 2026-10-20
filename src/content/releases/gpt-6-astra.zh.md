---
title: "GPT-6 astra 发布：$10 / $50 的旗舰，和 GPT-6 家族里 100 倍的价差"
description: "GPT-6 astra 的输入是 $10 / 1M、输出 $50 / 1M，是 GPT-6 sol 的 5 倍、GPT-6 luna 的 100 倍，但比 GPT-5.6 cyber 便宜。四项可溯源跑分、1,050,000 token 上下文，超过 272K 输入后进入长上下文价。"
date: "2026-10-19"
checkedAt: "2026-10-20"
dataCheckedAt: "2026-10-20"
releasedAt: "2026-09-03"
vendor: openai
modelId: gpt-6-astra
modelSlug: gpt-6-astra
compareModelIds:
  - gpt-6-sol
  - gpt-6-luna
  - gpt-5.6-sol
  - gpt-5.6-cyber
  - gpt-5
compareSlugs:
  - gpt-5.6-sol
sourceUrl: "https://platform.openai.com/docs/pricing"
sourceTitle: "OpenAI — API pricing"
published: true
---

## 一句话结论

- **GPT-6 astra 的定价是每 1M token 输入 $10、输出 $50**：GPT-6 sol 的 5 倍、GPT-6 luna 的 100 倍，但比 GPT-5.6 cyber 的 $12.5 / $75 输入便宜 20%、输出便宜 33%。
- **这一轮真正值得看的不是 astra 这一档，而是家族内部的价差。** 同一代三档是 $10 / $50、$2 / $10、$0.10 / $0.50，正好每档 5 倍递减。一个家族里 100 倍的价格跨度，等于把「用哪一档」变成一个必须回答的工程问题。
- **四项可溯源跑分，每一项都带着档位。** GPQA Diamond 96.0、HLE 54.7、Terminal-Bench 2.1 89.9、Terminal-Bench 4.0 57.9。第一项和最后一项是 OpenAI 报的「任意 effort 下的最高值」；中间两项是 Artificial Analysis 在 max / high 档跑的。把它们当成同一张表之前，先看每条备注。

## 发布了什么

- **GPT-6 家族多了一个最高档。** GPT-6 astra：输入 $10 / 1M、输出 $50 / 1M，缓存读 $1.00，5 分钟缓存写入 $12.50，上下文 1,050,000 token，注册表状态 active。OpenAI 的发布材料把日期标在 2026-09-03。
- **同门还有两档。** GPT-6 sol 是 $2 / $10，GPT-6 luna 是 $0.10 / $0.50，上下文同样 1,050,000 token，两款都是 active。
- **上一代还在表里，其中一个已经退役。** GPT-5.6 sol（$4 / $20）和 GPT-5.6 cyber（$12.5 / $75）仍然 active；GPT-5（$1.25 / $10）标成了 delisted，备注写着「Replaced by GPT-6 series」——留着它，是为了让老的价格搜索还能落到一个真实的数字上。
- **窗口和 Claude 同档，不是它的一半。** astra 是 1,050,000 token，和 Claude 5.5 家族、Gemini 3.1 Pro 的 1M 档基本齐平；OpenAI 自己的 GPT-5.6 cyber 才是 400,000 的例外。

## 成本

- **把这一代当成阶梯，不要当成三个并列的模型。** astra $10 / $50，sol $2 / $10，luna $0.10 / $0.50，每往下挪一档就是 5 倍。档位选错，账单差 5 倍，不是差几毛钱。
- **真正可能救你账单的，是缓存那一行。** astra 的缓存读是 $1.00，等于输入价的 10%，省 90%。如果你每个请求都要重发同一份 system prompt、同一批 PDF、同一段代码上下文，这一行的节省比换档更实在。
- **长提示词要加价，而且规则是公开的。** 输入超过 272,000 token 后，标准价变成输入 $20、输出 $75——输入 2 倍、输出 1.5 倍。计算器已经把这一档算进去了。GPT-6 全系和 GPT-5.6 sol 都是同一形状：30 万 token 的请求，不会按首页那个单价结账。
- **和上一代比，astra 一边是降价，一边是涨价。** 对 GPT-5.6 cyber（$12.5 / $75），astra 输入便宜 20%、输出便宜 33%，这是纯粹的成本下降；对 GPT-5.6 sol（$4 / $20），astra 是 2.5 倍预算——往旗舰那一档走，就是要加钱。
- **已经退役的 GPT-5（$1.25 / $10）只能当历史坐标。** astra 是它输入的 8 倍、输出的 5 倍，但它已经 delisted，不是迁移目标。

## 跑分

- **四行、三套 harness、一个模型。** GPQA Diamond 96.0 和 Terminal-Bench 4.0 57.9 是 OpenAI 报的任意 effort 最高值；HLE 54.7 和 Terminal-Bench 2.1 89.9 是 Artificial Analysis 的 max / high 档结果。Terminal-Bench 4.0 这一行还有 Anthropic 的竞品表交叉印证——那张表同样给 astra 打了 57.9（high 档）。
- **「最高值」不等于默认档。** GPQA 的 96.0 是拉满 effort 的成绩，不是 medium 默认档。如果你在给默认部署做预算，同一张表里更低 effort 的行才是参照；我们把档位写进每条 score，就是为了这个区别不被抹掉。
- **覆盖很薄，而且我们直说。** 四项，比 GPT-5.6 sol 或 Claude Opus 5 的十几行少得多，也没有 DeepSWE、ProgramBench、NL2Repo。空着的格子是缺数据，不是成绩差。
- **这四行能支撑什么：** 在 GPQA 上 96.0 对 94.1、在 Terminal-Bench 4.0 上 57.9 对 39.9（同一张 OpenAI 表），对 GPT-5.6 sol 是明确的代际提升。它们支撑不了「长程软件工程更强」这种结论，因为这张卡上没有测这个。

## 该不该换

- **你刚从 GPT-5.6 cyber 迁过来：这一波最值得换。** cyber 是 $12.5 / $75，astra 是 $10 / $50，输入降 20%、输出降 33%，窗口大 2.6 倍，同时还换到了新一代。价格和能力同时变好的发布不多，这次算一个。
- **你从 GPT-5.6 sol 过来的：先把 sol 当默认。** astra 是 sol 的 2.5 倍价钱（$4 到 $10 输入，$20 到 $50 输出）。日常客服、摘要、分类这类活儿 sol 够用，astra 是留给「答错要赔钱」那部分流量的。
- **你还在用已经退役的 GPT-5：** 别拿 $1.25 / $10 当基准线，它已经 delisted。现价里最接近的一档是 sol 的 $2 / $10：输入是 GPT-5 的 1.6 倍，输出价格一样，比直接跳到 astra 平缓得多。
- **输入占大头的负载，先看缓存再看档位。** astra 缓存读 $1.00（输入价的 10%），同门最便宜的 luna 输入只有 $0.10。档位决定这一次请求的输入价，缓存决定的是后面每一次。
- **什么情况下我们会说「换」**：你自己的流量评测显示，这个差距值得付 sol 的 5 倍价钱。分数卡已经有了；缺的证据是你的，不是厂商的。

## 延伸阅读

- **先算自己的账** — 把真实的输入/输出比例代进去：[/token-calculator](/zh/token-calculator)
- **两个模型并排看** — 跑分差、上下文、月度成本：[/compare](/zh/compare)
- **astra 模型页，四项跑分都在** — [/models/gpt-6-astra](/zh/models/gpt-6-astra)
- **上一代，用来看价差** — [/models/gpt-5.6-sol](/zh/models/gpt-5.6-sol)
- **OpenAI 全线的价格** — [/chatgpt-api-pricing](/zh/chatgpt-api-pricing)
- **本文的数据出处** — OpenAI 官方定价页，价格最后核对于 2026-10-20。
