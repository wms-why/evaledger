---
title: "GPT-6.1 Terra 发布：$1 / $5 的定价，和我们收录的最高 Agents' Last Exam 分数"
description: "GPT-6.1 Terra 是每 1M token 输入 $1、输出 $5，比 GPT-6 sol 便宜一半、比 astra 便宜 10 倍，1,050,000 token 上下文，两项可溯源跑分。"
date: "2026-10-27"
checkedAt: "2026-10-27"
dataCheckedAt: "2026-10-27"
releasedAt: "2026-10-26"
vendor: openai
modelId: gpt-6.1-terra
modelSlug: gpt-6.1-terra
compareModelIds:
  - gpt-6-astra
  - gpt-6-sol
  - gpt-6-luna
  - claude-opus-5.5
  - gpt-5.6-sol
compareSlugs:
  - gpt-6-astra
  - claude-opus-5.5
  - gpt-5.6-sol
sourceUrl: "https://openai.com/zh-Hans-CN/index/introducing-gpt-6-1-terra/"
sourceTitle: "OpenAI — 推出 GPT-6.1 Terra"
published: true
---

## 一句话结论

- **GPT-6.1 Terra 的定价是每 1M token 输入 $1、输出 $5，缓存读 $0.05。** 这是 GPT-6 sol（$2 / $10）的一半、GPT-6 astra（$10 / $50）的十分之一、Claude Opus 5.5（$4 / $20）的四分之一，而上下文窗口和 GPT-6 全系一样是 1,050,000 token。
- **真正的主角是价格，跑分卡要连着备注一起看。** 我们为 Terra 收录了两个数字，都出自 OpenAI 自己的发布材料：Terminal-Bench 4.0 50.3、Agents' Last Exam 60.0。前者是 max 推理档的厂商自测分，后者是 OpenAI 那张「成本对分数」散点图上的一个点——图里对手的分数也是 OpenAI 自己测的。
- **它是 6.1 这一代里便宜的那一档，不是旗舰。** OpenAI 把 GPT-6.1 Sol 和 GPT-6 Astra 放在它之上，并且直说了：最难的编程任务，Sol 和 Astra 仍然是更好的选择。

## 发布了什么

- **多了一个 API 模型名稳定的 SKU：`gpt-6.1-terra`。** 每 1M token 输入 $1、输出 $5，缓存读 $0.05，上下文 1,050,000 token，单次输出上限 128,000 token。Plus、Pro、Enterprise 和 Edu 用户可以在 ChatGPT 工作和 Codex 里直接用，开发者也可以走 API。
- **窗口沿用 GPT-6 那一套，不是新开的。** 1,050,000 token，和 astra、sol、luna 同一个池子；Claude Opus 5.5 是 1,000,000。
- **长上下文的坎是公开的，而且和 GPT-6 全系同形。** 输入超过 272,000 token 之后，整个请求按输入 2 倍、输出 1.5 倍计费，计算器里已经算进了这一档。
- **知识截止 2026 年 6 月，推理档位从 `none` 一路到 `max`**，默认是 `medium`；工具调用要走 Responses API。
- **OpenAI 说 Terra 达到了准备框架（Preparedness Framework）网络安全方向的「严重」阈值**，保留的是给 GPT-6 Astra 做的防护；还说它更愿意守在任务范围内，也更愿意向用户说明自己的局限。
- **它在 2026-10-26 上线。** 公告页只标了年份，但 OpenAI 自己的开发者更新里有一条写着「Released GPT-6.1 Terra」、并列出 Responses 与 Chat Completions 两个端点的记录。本文日期是第二天——我们核对价格的那一天。

## 成本

- **真正容易被忽略的是缓存那一行：$0.05，是输入价的 5%。** 相当于 95% 的折扣，GPT-6 家族里其他型号的缓存读都只打一折（省 90%），Terra 是这一家里最深的。如果你的账单里有一份反复重发的 system prompt，这一行的节省比换档更实在。
- **把这一代当成阶梯看。** astra $10 / $50，sol $2 / $10，Terra $1 / $5，luna $0.10 / $0.50。Terra 是 sol 的一半、astra 的十分之一，是 luna 的十倍；从 sol 挪到 Terra，是这条线上最便宜的一次升级。
- **272,000 token 那道坎作用于整个请求，不是只对超出的部分。** 30 万 token 的请求不会按首页那个单价结账，长上下文档和短请求要分开做预算。
- **批处理与 Flex 是标准价的一半，Fast 模式是标准价的两倍，**部分地区的处理还要加 10%。计算器算的是标准价，而交互流量就是按标准价结的。
- **缓存写入是单独一行，我们没有建模。** 写入缓存的价格高于未命中输入价，12 小时保留更长、也更贵。如果你的负载要把提示词写回缓存，这一行请照模型卡的价格算，不要照我们的表算。
- **价格里没有促销档。** 这一行既没有入门价，也没有约定好的涨价时间——今天的价格就是价格，没有到期日要盯着。

## 跑分

- **两个数字，都是 OpenAI 自己测的。** Terminal-Bench 4.0 的 50.3 出自发布正文，max 推理档；Agents' Last Exam 的 60.0 出自 OpenAI 那张成本对分数的图，而图里每个点都标着 effort 档位和每题成本。
- **Terminal-Bench 这一行是整篇公告里最干净的一条论断：** 50.3 对 OpenAI 公布的 GPT-5.6 Terra 的 21.5——同一项基准上，超过上一代两倍。
- **图里的那条阶梯更有意思。** Terra 在 Low 档 55.9、Medium 57.6、High 57.2、Xhigh 58.5、Max 60.0；同一张图上 max 档的其他模型是 Claude Opus 5.5 63.2、GPT-6 Astra 59.3、GPT-6.1 Sol 58.6、GPT-6 Luna 50.9、GPT-5.6 Terra 50.7。
- **这张图真正证明的是成本，不是排名。** Medium 档上 Terra 比 GPT-5.6 Terra 高 15 个点，成本大约只有三分之一；max 档上它的每 token 价格是 Claude Opus 5.5 的四分之一，每题成本大约是九分之一，换来的是少 3.2 个点。这正是这次发布在卖的交易：少几个分，换一小部分账单。
- **这一列要连着 harness 备注读，不能当成一张同口径的表。** 图是 OpenAI 用自己的 harness 测的，标题写的是 Agents' Last Exam v1，而这一列里其他行来自 v1.1 任务集；图里对手的分数也是 OpenAI 替别家测的。
- **60.0 现在是我们收录的 Agents' Last Exam 最高分，**所以榜单上其他模型的归一化分数都改用更高的分母来算——模型没变，尺子变了。
- **覆盖很薄，我们直说。** 两项基准，和那些十几行的完整卡片比差得远；没有 GPQA Diamond、没有 HLE、没有 DeepSWE、没有 AutomationBench。所以 Terra 在榜单上只列出、不排名，并标出缺的是哪一项。
- **公告里还有两项结果我们故意没收。** OpenAI 说 Terra 在 Medium 档超过了 GPT-5.6 Terra 在 OSWorld 2.1 上的最好成绩，Terminal-Bench Science 0.1 也以更低的成本超过 GPT-6.1 Sol——但两项都没有给出绝对分数；MMMU-Pro 同理。只有相对结论、没有绝对数字的，不进表。

## 该不该换

- **你刚从 GPT-6 astra 迁过来：这是两端各便宜 10 倍。** astra 是 $10 / $50，Terra 是 $1 / $5，上下文窗口一样是 1,050,000，缓存折扣还更深。代价是跑分覆盖：astra 有 GPQA Diamond 和 HLE，Terra 两项都没有。
- **你从 GPT-6 sol 过来的：这是最容易的一次。** sol 是 $2 / $10，自己没有跑分行；Terra 是它的一半，而且带着两项可溯源分数。如果你的活儿是文档、表单、发票和代码审阅，而不是前沿知识题，那它既更便宜，也带着可引用的分数，而 sol 一条都没有。
- **你从 Claude Opus 5.5 过来的：** Terra 两端都是四分之一——$1 / $5 对 $4 / $20——窗口略大（1,050,000 对 1,000,000），缓存折扣同样是 95%。代价在分数上：Terminal-Bench 4.0 是 66.4 对 50.3，Agents' Last Exam 是 63.2 对 60.0，也就是说这几个点你要付四倍的钱。
- **你从 GPT-5.6 sol 过来的：** sol 现在是促销价 $4 / $20，到 2026-11-21 为止，2026-11-22 起回到 $5 / $30。Terra 是前者的四分之一、后者的五分之一。顺带说明：OpenAI 自己的「代际提升」比较对象是 GPT-5.6 **Terra**，那是另一个 SKU，我们没有给它定价，所以这里能拿来比的只是一个同门，而不是它的前代。
- **不要因为「内部错误率」这条论断就迁移。** OpenAI 说在自家那套「由易诱发错误的提示词构成的内部基准测试」上，幻觉与事实错误率大幅下降，并说 Terra 更守得住任务范围、更愿意承认自身局限。这个基准是私有的、没有公开榜单，也不是我们的任何一行：单一厂商的私有分数，够格成为你去做一轮评测的理由，不够格成为搬生产流量的理由。
- **把 effort 档位钉死。** API 默认是 `medium`，而 OpenAI 公布的是拉满档的成绩，图上还给了完整阶梯。默认档的请求，不是被测量的那个东西。
- **长提示词单独做预算。** 输入超过 272,000 token 之后，输入价翻倍、输出价多一半，而且作用在整个请求上。

## 延伸阅读

- **Terra 模型页，我们收录的两项跑分都在** — [/models/gpt-6.1-terra](/zh/models/gpt-6.1-terra)
- **和贵十倍的旗舰并排比** — [/compare?a=gpt-6.1-terra&b=gpt-6-astra](/zh/compare?a=gpt-6.1-terra&b=gpt-6-astra)
- **它所在的产品线，从新到旧** — [/series/gpt-6](/zh/series/gpt-6)
- **先算自己的账** — [Token 成本计算器](/zh/token-cost-calculator)
- **模型卡——窗口、输出上限、effort 档位与缓存写入价** — https://developers.openai.com/api/docs/models/gpt-6.1-terra
- **给出发布日期的那条更新记录** — https://developers.openai.com/changelog
- **本文的数据出处** — OpenAI 官方发布公告，价格最后核对于 2026-10-27。
