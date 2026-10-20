---
title: "Grok 4.7 发布：$2 / $6，输出比旗舰便宜 70%，上下文翻倍到 50 万"
description: "Grok 4.7 每 1M token 输入 $2、输出 $6，上下文 500,000 token。输出比 GPT-5.6 sol 便宜 70%、比 Claude Opus 5 便宜 76%，旧款 Grok 4 同时退役。我们只核验到 2 项跑分，是本系列最薄的一张卡。"
date: "2026-10-19"
checkedAt: "2026-10-20"
dataCheckedAt: "2026-10-20"
vendor: grok
modelId: grok-4.7
modelSlug: grok-4.7
compareModelIds:
  - grok-4
compareSlugs:
  - gpt-5.6-sol
  - claude-opus-5
  - gemini-3.1-pro
sourceUrl: "https://docs.x.ai/docs/models"
sourceTitle: "xAI — Models & pricing"
published: true
---

## 一句话结论

- **Grok 4.7 是每 1M token 输入 $2、输出 $6，上下文 500,000 token。** 输出 $6 比 GPT-5.6 sol 的 $20 便宜 70%，比 Claude Opus 5 的 $25 便宜 76%。
- **窗口几乎翻倍，旧款直接退役。** Grok 4 是 256,000 token，Grok 4.7 是 500,000；同时 Grok 4 已被标成 delisted，备注是「Replaced by Grok 4.7」。这不是二选一，是升级。
- **我们只核验到 2 项跑分，是本系列最薄的一张卡。** Terminal-Bench 4.0 38.0、DeepSWE v1.1 71.0（来源里写作「DeepSWE」），推理、知识、数学一项都没有。

## 发布了什么

- **新一代 Grok，更便宜。** Grok 4.7：输入 $2 / 1M、输出 $6 / 1M，上下文 500,000 token，active。
- **Grok 4 退役但保留。** 原来是 $3 / $15，现在标为 delisted，备注「Replaced by Grok 4.7」；这一行留着，老价格搜索还能落到一个真实的数字。
- **窗口几乎翻倍。** 从 256,000 到 500,000 token。处理长文档时，你大约可以少设计一半的切块逻辑，而单价还更低。
- **发布日期我们查不到。** 我们核对的来源是 xAI 的模型文档，里面没有 4.7 的上线日期，所以「发布于」是空的。
- **4.7 的缓存读价我们没有核实到**，所以那一格是空的。已退役的 Grok 4 反而有缓存价，但我们不会把它挪到新模型上。

## 成本

- **这个模型真正在拼的是输出。** 每 1M 输出 $6，对 GPT-5.6 sol 的 $20 便宜 70%，对 Claude Opus 5 的 $25 便宜 76%。输入 $2 是 GPT-5.6 sol 的 $4 的一半、比 Claude Opus 5 的 $5 低 60%。
- **和自己上一代比，输出降得更狠。** Grok 4 是 $3 / $15，4.7 是 $2 / $6：输入降 33%，输出降 60%。换代不是一次平价重构。
- **1:3 的价型要留意。** 输入 $2、输出 $6。内容生成、长文输出、Agent 多轮循环，产生的 token 比读进去的多得多，所以「输出降 60%」才是你真正拿到的那部分便宜。
- **长文档场景还要看窗口。** 500,000 token，我们手上没有超额档位信息，提示词再长也是同一个价。

## 跑分

- **只有 2 项，就是全部。** Terminal-Bench 4.0 38.0、DeepSWE v1.1 71.0——后者在我们引用的来源里写作「DeepSWE」。
- **这两行只能当「相邻」看，不能当排名看。** 同一张表上不同模型覆盖的 benchmark 不一样，共同的地基很窄：一个终端 Agent 列，一个仓库工程列。我们不会把两个分数平均成一个总分。
- **表能告诉你的：** 在这两列上，4.7 和它对比的那几行旗舰处在同一档区间，而价格是零头。这句话只关于这两个 benchmark。
- **表不能告诉你的：** 推理、知识、数学一律没有数据。如果你的产品依赖推理型 benchmark，这张表帮不上忙。

## 该不该换

- **原来就在用 Grok 4：换。** 旧款已经 delisted，新款输入降 33%、输出降 60%，窗口从 256,000 涨到 500,000。继续挂着旧 SKU 没有任何理由。
- **你在用 GPT-5.6 sol 或 Claude Opus 5，而且账单主要来自输出：** $6 的输出价意味着你少付 70%–76%，值得试。挑输出最多的那部分流量先跑（长文生成、Agent 循环、批量任务），用真实数据比质量。
- **输入占大头的场景**（比如长文档 RAG），理由是窗口不是价格：切块更少、检索层的妥协更少，而上一代窗口只有一半。
- **需要推理或知识能力，就别根据这张表换。** 4.7 在这两类 benchmark 上没有可比的分数，而同一张表里的其他模型有。
- **决定之前：** 2–2.5 倍的价差值得做 A/B，缺一项跑分值得继续测。两个都做，比只看其中一个结论更靠谱。

## 延伸阅读

- **模型页** — [/models/grok-4.7](/zh/models/grok-4.7)
- **DeepSWE 到底测什么** — [/benchmarks/deepswe-v1.1](/zh/benchmarks/deepswe-v1.1)、[/benchmarks/terminal-bench-4.0](/zh/benchmarks/terminal-bench-4.0)
- **和 Gemini 3.1 Pro 并排比** — [/compare?a=grok-4.7&b=gemini-3.1-pro](/zh/compare?a=grok-4.7&b=gemini-3.1-pro)
- **算你自己的账** — [/token-calculator](/zh/token-calculator)
- **本文的数据出处** — xAI 官方模型与定价文档，价格最后核对于 2026-10-20。
