---
title: "Claude Opus 5.5 发布：旗舰降价 20%，缓存折扣加到 95%"
description: "Claude Opus 5.5 每 1M token 输入 $4、输出 $20，比已经退役的 Claude Opus 5 便宜 20%，缓存读只要输入价的 5%。四项官方跑分、1M token 上下文，2026-09-22 上线。"
date: "2026-10-19"
checkedAt: "2026-10-20"
dataCheckedAt: "2026-10-20"
releasedAt: "2026-09-22"
vendor: anthropic
modelId: claude-opus-5.5
modelSlug: claude-opus-5.5
compareModelIds:
  - claude-opus-5
  - claude-sonnet-5
  - claude-haiku-4.5
compareSlugs:
  - claude-opus-5
sourceUrl: "https://claude.com/pricing#api"
sourceTitle: "Anthropic — Claude API pricing"
published: true
---

## 一句话结论

- **Claude Opus 5.5 的定价是每 1M token 输入 $4、输出 $20**：比已经退役的 Claude Opus 5（$5 / $25）便宜 20%，是 Sonnet 5（$2 / $10）的 2 倍、Haiku 4.5（$1 / $5）的 4 倍。
- **比降价更值得说的是缓存。** 缓存读 $0.20，等于输入价的 5%，省 95%；上一代 Opus 5 的缓存读是 $0.50，只省 90%。写入 5 分钟缓存是 $5.00，1.25 倍输入价。
- **四项可溯源跑分，不是一张完整成绩单。** HLE（无工具）64.4、Terminal-Bench 4.0 66.4、HLE（带工具）67.7、Chartography（带工具）89.0。四项都来自 Anthropic 官方，Terminal-Bench 是 xhigh 档；Artificial Analysis 在自己的 harness 里测到 59.6。

## 发布了什么

- **Anthropic 的旗舰降价了。** Claude Opus 5.5：输入 $4 / 1M、输出 $20 / 1M，缓存读 $0.20，5 分钟缓存写入 $5.00，上下文 1,000,000 token，状态 active。Anthropic 在 2026-09-22 发布。
- **上下文跟着这一代一起涨。** Opus 5.5 是 1M token，和 Fable 5.1、Sonnet 5 同档，是 Fable 5（聊天 500K）的两倍。Haiku 4.5 仍是家族里的 200K 档。
- **上一代就地退役。** Claude Opus 5（$5 / $25）标为 delisted，备注是「Listed in Anthropic's Legacy models section; superseded by Opus 5.5」。我们保留这一行，老价格搜索才不会落到空页面。
- **家族其余两档没动。** Sonnet 5 $2 / $10，Haiku 4.5 $1 / $5。

## 成本

- **这次是全线下调，不是把便宜的一侧做大。** 输入 $5 到 $4、输出 $25 到 $20，输入输出都降 20%，没有把溢价挪到另一头藏着。
- **缓存折扣从 90% 加到 95%，而且叠在更低的基数上。** Opus 5.5 缓存读 $0.20 = 输入价 $4 的 5%；上一代 Opus 5 缓存读 $0.50 = 输入价 $5 的 10%。每轮都重发同一段长上下文的场景，这两处一起生效。
- **缓存写入是另一笔钱：$5.00 / 1M，1.25 倍输入价。** 「写一次、读很多次」才划算；只读两三次的短会话，写入成本摊不回来——这种负载按普通输入算反而更稳。
- **上下文是 1,000,000 token，不再是短板。** 和 GPT-6 系列的 1,050,000 同档。Anthropic 的 Opus 5.5 价格表没有长上下文加价，$4 / $20 就是各长度档的价。
- **价格梯度没变，变的只是旗舰那一档。** Opus 5.5 是 Sonnet 5 的 2 倍、Haiku 4.5 的 4 倍，档位之间的比例和上一代一样。
- **如果你在用 Claude 订阅额度：** API 这边一次降 20%，订阅和 API 的分界线会往前挪。具体落在哪，按你自己的用量用 [/claude-token-cost-calculator](/zh/claude-token-cost-calculator) 重算一遍就行。

## 跑分

- **四项，每项都写清楚 harness。** HLE 64.4 是 Opus 5.5 system card 里的无工具、max effort 结果；Terminal-Bench 4.0 66.4 和 HLE（带工具）67.7 来自 Anthropic 发布表，Terminal-Bench 是 xhigh 档，标准误差大约两个半点；Chartography 89.0 是官方带工具行。
- **同一个 benchmark 还有第二个数，而且更低。** Artificial Analysis 在自己的 harness 里把 Terminal-Bench 4.0 测到 59.6。这不是对 66.4 的「修正」：不同的 scaffold、不同的 effort、再加上 Anthropic 服务端的 safeguard 路由，三者叠在一起。把 66.4 当成对竞品的同条件领先之前，两个数都要看。
- **成绩单里没有什么：** GPQA Diamond、Terminal-Bench 2.1、DeepSWE、ProgramBench 这些让 Opus 5 能和榜上其他模型横向比的编码项，目前都缺。我们只发布核验过的四项，剩下的留空，而不是把 Opus 5 的分数挪过来。
- **更诚实的比较是跟 Opus 5 比，不是跨厂商比。** 在同一张官方表里两边都有的三行，Opus 5.5 都领先：HLE 64.4 对 56.3，Terminal-Bench 4.0 66.4 对 51.8（同为官方 harness），Chartography 89.0 对 84.0。

## 该不该换

- **在用 Opus 5 的：换。** 输入输出都降 20%，缓存折扣更深，上下文从旧上限升到 1M，代码里改个 model id 就行。没有理由继续挂着已经退役的 SKU。
- **在用 Sonnet 5 的：** 先别急着上。Opus 5.5 是 $2 / $10 的 2 倍。你的评测如果说不出旗舰的差距，这 2 倍就是白花。
- **在用 Haiku 4.5（$1 / $5）的：** Opus 5.5 是 4 倍。Haiku 适合量大、出错不要紧的流量（工单分类、意图识别、日志打标）；Opus 5.5 适合「答错要赔钱」的那部分。一个产品里分层用两个模型，常常比全量换模型更省钱。
- **缓存重度负载吃到的红利最大。** 缓存读 5% 的折扣意味着每轮重发同一段长上下文的场景，输入几乎可以当免费看——甚至比换小模型还划算：Sonnet 5 的正常输入是 $2 / 1M，而 Opus 5.5 的缓存读是 $0.20，差 10 倍。
- **上生产之前：** 20% 的降幅你用计算器就能算出来；算不出来的是 5.5 到底适不适合你的任务，那是评测题，不是价格题。

## 延伸阅读

- **先算自己的账** — [Token 成本计算器](/zh/token-cost-calculator)
- **两个模型并排看** — [/compare](/zh/compare)
- **Opus 5.5 模型页，四项跑分都在** — [/models/claude-opus-5.5](/zh/models/claude-opus-5.5)
- **上一代，用来看价差** — [/models/claude-opus-5](/zh/models/claude-opus-5)
- **Claude 专项成本页（含订阅 vs API 的分界线）** — [/claude-token-cost-calculator](/zh/claude-token-cost-calculator)
- **本文的数据出处** — Anthropic Claude API 定价页，价格最后核对于 2026-10-20。
