---
title: "Gemini 4 Argon：$2 / $10 每 1M 到 11 月 30 日，之后 $4 / $20"
description: "Google 的 Gemini 4 Argon 在 2026-11-30 前每 1M token 输入 $2、输出 $10，之后 $4 / $20，等于 Claude Opus 5.5 今天价。1,048,576 token 统一窗口，十项跑分已核验。"
date: "2026-10-20"
checkedAt: "2026-10-20"
dataCheckedAt: "2026-10-21"
releasedAt: "2026-10-13"
vendor: google
modelId: gemini-4-argon
modelSlug: gemini-4-argon
compareModelIds:
  - gemini-3.1-pro-preview
  - gemini-3.8-flash
  - claude-opus-5.5
  - gpt-6-astra
  - deepseek-flash
compareSlugs:
  - gpt-6-astra
  - claude-opus-5.5
  - claude-opus-5
  - deepseek-v4.1-flash-1017
  - gemini-3.1-pro
sourceUrl: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-argon/"
sourceTitle: "Google — Gemini 4 Argon: Built to solve your hardest problems"
published: true
---

## 一句话结论

- **Gemini 4 Argon 在 2026-11-30 之前每 1M token 输入 $2、输出 $10，之后是 $4 / $20。** 缓存读现在是 $0.10，之后 $0.20。第二个价格不是微调——它正好等于今天 Claude Opus 5.5 的价。所以「要不要换」这件事，促销期就是全部答案：到 2026-11-30 为止，Argon 是三家前沿旗舰里最便宜的一家；12 月起，它和 Anthropic 的旗舰同价。
- **窗口是一个池子，而且价格不随提示词长度跳档。** 1,048,576 token 由输入、思考、输出共享，而且完全没有 >200K 这一档。Gemini 3.1 Pro 和 2.5 Pro 在超过 200,000 token 之后输入价都要翻倍;Argon 官方压根没给这一行——所以 900,000 token 的提示词和 100 token 的提示词，单价完全一样。
- **Google 自己那张表：13 胜、1 平、5 负。** 赢的是 DeepSWE v1.1 77.9 和 Vals Index 68.9,输的是 Terminal-bench 4.0 57.4 和 FrontierSWE v2 55.0。先看 harness 备注再看排名——五场败仗里有三场,Argon 的分数是 Google 自己跑的，对手的分数却是从别处取的。

## 发布了什么

- **一个新的旗舰 SKU，只有一个稳定 id。** `gemini-4-argon`,2026-10-13 正式可用;此前 2026-09-29 只向 Fairwind 安全计划成员开放了限量预览。只存在于付费 API 档——Google 没有为它开免费档——另外还有 AI Studio、Gemini for business 和 Gemini App。
- **输出上限是长任务用户最该看的那个数。** 一次同步请求最多返回 65,536 个输出 token;开启 long decode 之后可以拉满到 1,048,576 token 的整个池子减去提示词已经占掉的部分。
- **Google 承诺了 Gemini 4 家族的其他成员，但只发布了 Argon。** 发布稿的结尾就是在预告「the rest of the Gemini 4 family」。Argon 是这条线的第一个成员，也是今天唯一能调用的那个。
- **思考强度是一个需要你自己拧的旋钮。** API 默认是 `medium`，另有 `low` 和 `high`。Google 的评测表在两边都用了最高档——也就是说，公布的数字是上限，不是默认请求能拿到的结果。
- **缓存只支持隐式。** Argon 不支持 `cachedContents` 和 `caches.create`;95% 的缓存命中折扣自动生效，但提示词至少要 4,096 token。

## 成本

- **今天，Argon 是三家前沿旗舰里最便宜的。** $2 / $10（引入价，到 2026-11-30），对面是 Claude Opus 5.5 的 $4 / $20 和 GPT-6 Astra 的 $10 / $50——输入输出都比 Astra 便宜 5 倍，比 Opus 5.5 便宜一半。2026-12-01 起这个优势就没了：$4 / $20 是 Astra 的一半，也正好等于 Opus 5.5 的价。
- **和 Google 自家的上一代 Pro 比，结论有点别扭。** Gemini 3.1 Pro Preview 是 $2 / $12，也就是说按今天的引入价，Argon 输入价一样、输出便宜 $2。但 Argon 没有 >200K 加价档，窗口是 1,048,576;Pro 是 1,000,000，而且超过 200,000 token 输入价要翻倍。
- **缓存读到 2026-11-30 是 $0.10，之后 $0.20——两种情况下都是输入价的 5%。** 就是 Google 宣传的那个 95% 折扣。如果你的流量里提示词大量重复，这一个格子比输入输出价更值得盯。
- **然后是那道坎。** 2026-12-01 起变成输入 $4、输出 $20、缓存 $0.20。这三个数正好是 Opus 5.5 今天的价，一分不差——这也是衡量促销最省事的办法:到了 12 月，你对 Anthropic 一点都省不下来。
- **Batch 和 Flex 是标准价的一半;Priority 是 1.8 倍。** 计算器算的是标准档，那也是交互式流量实际被计费的档位。
- **思考 token 按输出计费。** Google 把这一行写成「including thinking tokens」，所以一个偏推理的提示词要付两次钱：一次是你要的 token，一次是模型自己想出来的 token。

## 跑分

- **十九项里 13 胜、1 平、5 负**——对比的是 Google 实测的三家对手里最强的那个。胜出的包括 Vals Index（68.9，对手是 Astra 的 63.1 和 Opus 5.5 的 67.0）、AutomationBench（51.3 对 41.4 和 42.5）、DeepSWE v1.1（77.9 对 74.1 和 74.2）、GraphWalks 的 256k-1M 区间（84.2 对 71.8 和 66.8）以及 Agent's Last Exam（39.5 对 34.2 和 38.2）。CWE-bench v1 以 68.0 打平。输的五项是 FrontierSWE v2（55.0 对 65.5 和 62.3）、Terminal-bench 4.0（57.4 对 58.2 和 66.4）、PostTrainBench、Terminal-Bench Science 和 OSWorld-2.0（69.2 对 72.6）。
- **Agent 编程这一栏是 2 比 2。** Argon 赢了 DeepSWE 和 Vibe Code Bench，却在 FrontierSWE v2 和 Terminal-bench 4.0 上四家垫底。如果你的场景是「对着真实仓库跑长时自主编程」，这张表给不了你答案。
- **先看 harness，再看分数。** Google 的评测方法说明里写着：Argon 的每个数字都是 pass@1、最高思考档，而对手的分数要么来自厂商自报，要么来自某个公开榜单。五场败仗里有三场，Google 只自己跑了 Argon，对手的分数是从别处取的。而在一整行由同一家机构评分的项目上——FrontierSWE v2 就是这样——Argon 是真的垫底。
- **Google 和 Anthropic 在同一行上给出了不同的数。** Terminal-bench 4.0，Google 的表把 GPT-6 Astra 写成 58.2，而 OpenAI 自己报的是 57.9;AutomationBench，Google 把 Opus 5.5 写成 42.5，Anthropic 自己的发布稿说的是 40.0。这不是四舍五入的误差——这是两家厂商用不同方式测同一个 benchmark。这也是「任何一列都别当真相看」的最强理由。
- **数字本身里埋着两个坑。** AutomationBench 的 51.3 用的是 Zapier 的私有集——它不是 AutomationBench-AA 的 77.5，这两个数绝对不能混。Chartography 的 71.6 是不给工具的那一版：我们登记的带工具版本是另一种配置，Opus 5.5 在那里是 89.0，而 Google 这里的无工具成绩是 66.3。
- **DeepSWE 那一行混了三套 harness。** Argon 的 77.9 是用 mini-swe agent 自己算的;Astra 的 74.1 来自公开榜单，Claude 的数字来自它们各自的 system card。它仍然是最好看的编程战果，但并不是一次对一次的对跑。

## 该不该换

- **如果你现在跑在 Gemini 上，这次换模型很轻松，理由是价格结构，不是智能。** Gemini 3.1 Pro Preview 是 $2 / $12，超过 200,000 token 要跳档;Argon 按今天的引入价是 $2 / $10，不跳档，窗口 1,048,576。长上下文的流量获益最大:Pro 那一跳是输入价 2 倍、输出价 1.5 倍，而 Argon 的价不随提示词长度跳档。
- **如果你跑在 Claude Opus 5.5 上，决定权在促销期。** 到 2026-11-30 为止，输入输出都只要一半。2026-12-01 起就完全同价了，那时候换过去的理由会变成 1,048,576 token 的窗口、更长的输出上限和跑分卡——而不是账单。
- **如果你跑在 GPT-6 Astra 上，价格是 5 倍优势（到 2026-11-30；2026-12-01 起是 2.5 倍），跑分则是好坏参半。** Argon 在 DeepSWE、AutomationBench、Vals Index 和长上下文检索上领先，在 Terminal-bench 4.0、FrontierSWE v2 和 OSWorld-2.0 上落后。在五分之一的价钱上（促销期内），跑分只要「接近」就够用了。
- **如果你跑在 DeepSeek V4.1-Flash 上，这不是省钱动作。** 在 Argon 的引入价期内，DeepSeek 的输入便宜 6.67 倍、输出便宜 8.33 倍（2026-12-01 起变成 13.33 倍和 16.67 倍），而且 AutomationBench 是 60.5 对 51.3（两个数来自两套不同的测量口径——DeepSeek 的公告表和 Zapier 的公开榜单，所以这个差距只能当方向看）。Argon 赢的是 DeepSWE 77.9 对 77.0。这是「每块钱买到多少能力」的论证，不是「省多少钱」的论证。
- **别拿 $2 / $10 做十二个月的预算。** 这个模型往后余生公布的费率是 $4 / $20（2026-12-01 起）。按标准价建模，把促销当成一个有到期日的折扣。
- **给思考 token 留出预算。** 输出里含思考，所以一个想得更多的 agent 和一个不想的不是同一个工作量——换成 Priority 档，这个账要再算一遍。
- **把模型 id 和思考强度都写死。** `gemini-4-argon` 是稳定 id，但默认档是 `medium`，而 Google 自己的数字是在 `high` 下跑出来的。想复现某个 benchmark，就不是复现默认配置。

## 延伸阅读

- **模型页（我们有的全部跑分）** — [/models/gemini-4-argon](/zh/models/gemini-4-argon)
- **和它在 DeepSWE 上赢的那家旗舰并排比** — [/compare?a=gemini-4-argon&b=gpt-6-astra](/zh/compare?a=gemini-4-argon&b=gpt-6-astra)
- **Google 的评测方法——上面每个分数和每条备注的出处** — https://deepmind.google/models/evals-methodology/gemini-4-argon
- **模型卡** — https://deepmind.google/models/model-cards/gemini-4-argon/
- **API 定价页** — https://ai.google.dev/gemini-api/docs/pricing
- **算你自己的账** — [Token 成本计算器](/zh/token-cost-calculator)
