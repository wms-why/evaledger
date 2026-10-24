---
title: "Kimi K3.1 Pro：比 K3 还便宜，Terminal-Bench 4.0 逼近 Opus 5.5"
description: "月之暗面在 2026-10-24 发布 Kimi K3.1 Pro：3 万亿参数、100 万 token 上下文，输入 ¥13、输出 ¥68、缓存命中 ¥1.3（每百万 token），比同门 K3 还便宜；Terminal-Bench 4.0 拿到 65.7，离 Claude Opus 5.5 的 66.4 只差一个点。十三项跑分全部出自厂商自己那张表，该怎么读、该不该换，一次说清。"
date: "2026-10-24"
checkedAt: "2026-10-24"
dataCheckedAt: "2026-10-24"
releasedAt: "2026-10-24"
vendor: kimi
modelId: kimi-k3.1-pro
modelSlug: kimi-k3.1-pro
compareModelIds:
  - kimi-k3
  - kimi-k3.1-pro-highspeed
  - gpt-6-astra
  - claude-opus-5.5
  - deepseek-flash
  - minimax-m3.1-flash
compareSlugs:
  - kimi-k3
  - gpt-6-astra
  - claude-opus-5.5
  - claude-fable-5.1
  - deepseek-v4.1-flash-1017
  - glm-5.3
videoSrc: "/media/kimi-k3-1-teaser.mp4"
videoPoster: "/media/kimi-k3-1-teaser.jpg"
videoCaption: "发布前一天月之暗面放出的预热视频，24 秒。Kimi Code 启动横幅上写着 model: kimi k3.1，提示词要它做一个程序化 Three.js 场景，随后是它渲染出来的结果。没有配文、没有日期、没有规格。"
sourceUrl: "https://mp.weixin.qq.com/s/Q6Z-skAUH_na9g37VWbHew"
sourceTitle: "月之暗面 Kimi —— Kimi K3.1 Pro 发布公告（2026-10-24）"
published: true
---

## 一句话结论

- **Kimi K3.1 Pro 已经上线，而且比同门的 K3 更便宜。** 2026-10-24 月之暗面发布它：每百万 token 输入 ¥13、输出 ¥68、缓存命中 ¥1.3，上下文 100 万 token。而仍在售的 K3 是输入 ¥20、输出 ¥100——新旗舰在两个计价维度上都便宜三分之一，不是加价升级。
- **分数出自厂商自己那张表，而且刚好卡在最能说明问题的地方。** Terminal-Bench 4.0 拿到 65.7，Claude Opus 5.5 是 66.4，GPT-6 Astra 是 58.2；Agents' Last Exam 43.2，是那一行里的最高分；带工具的 HLE 79.8，Opus 5.5 是 67.7；经济价值那一项（GDPVal-AA）1846.0，略低于该行的最高分。
- **但这是厂商表、厂商跑分，而且暂时进不了我们的排名榜。** 月之暗面所有模型都跑在最高思考档；而我们榜单需要的几个基准——GPQA Diamond、不带工具的 HLE、DeepSWE、AutomationBench——在另一张我们读不到的表里，所以站内榜单上这个模型只会被标成「未测」，而不是拿它恰好有的那几项去凑一个平均分。

## 发布了什么

- **K3.1 系列的第一款模型，也是月之暗面至今最强的一款。** Kimi K3.1 Pro 于 2026-10-24 发布，是 Kimi K3 的后训练版本，后训练算力大幅增加，参数规模在 3 万亿这一档，上下文 100 万 token。
- **还有一个高速版，价格翻倍。** Kimi K3.1 Pro Highspeed 是同等智能、输出速度快约 2~3 倍的版本，输入 ¥26、输出 ¥136（每百万 token）。
- **全线同步可用。** kimi.com、Kimi App（iOS / Android / 鸿蒙）、Kimi Work 桌面端（3.1.0 及以上）、Kimi Code（在模型切换里选 K3.1 Pro），以及 Kimi API 的 `kimi-k3.1-pro` 和 `kimi-k3.1-pro-highspeed`。
- **完整权重将在 11 月 4 日前放出。** 月之暗面说会在那之前开源全部权重，并说这次是否开源是它权衡之后的一个明确决定。
- **网络安全能力是被主动削弱的，而且厂商自己说清楚了。** 月之暗面在中期训练语料和强化学习环境组合里都剔除了网络攻防相关数据。在他们自研的 xdev-bench-hard 上，最终版能解出的题目少于「不剔除」时同一条流水线会解出的题目，官方也明说这一版仍落后于已公开至少三个月的闭源前沿模型。这是披露，不是成绩——这个集合我们没有收录，所以这里不引用任何数字。
- **事实准确性是这次专门做的优化。** 在 Kimi 自己的幻觉压力测试上，逐条事实陈述的错误率相对 K3 大幅下降，含至少一处事实错误的回答比例只有前代的一小部分。具体数字属于厂商内部测试，这里只说方向，不报数。

## 成本

- **价目表很短。** 每百万 token 输入 ¥13、输出 ¥68、缓存命中 ¥1.3；缓存写入按 TTL 单独计费，5 分钟档 ¥13、1 小时档 ¥26——和 Anthropic 那种「写入另算」的形状一样，不像 DeepSeek 把写入价并进了缓存未命中价。
- **对同门 K3：便宜三分之一。** 输入 ¥13 对 ¥20，输出 ¥68 对 ¥100，缓存读单价从 ¥2 降到 ¥1.3。
- **对闭源前沿：便宜 2 倍到 5 倍。** Claude Opus 5.5 是 $4 / $20，GPT-6 Astra 是 $10 / $50——K3.1 Pro 是前者的一半、后者的五分之一，而它的 Terminal-Bench 只比 Opus 5.5 低了一个零点几分。
- **对便宜那一档，它不便宜。** DeepSeek V4.1-Flash 是 $0.30 / $1.20，MiniMax M3.1 Flash 是 $0.15 / $0.60。K3.1 Pro 是这个价位的几倍；它买的是接近前沿的智能体能力，不是单位成本的性价比。
- **上下文和 K3 系列其它型号一样是 100 万 token**，所以 100 万 token 的提示词是一次性上下文任务，而不是切块重来。
- **预算里要单独算缓存写入。** 5 分钟档写入价和输入价一样，1 小时档是它的两倍。

## 跑分

- **上面那张表里的每一个数字都出自月之暗面。** 发布公告里能落到我们基准表上的有十三行，每一行都带着它的跑分环境：编程那几行用 Claude Code，Agents' Last Exam 用 Kimi Code，OSWorld 用 Kimi Agent harness，Frontier Finance 用官方的 finance agent v2 harness，多模态那几行是五轮取平均。
- **对手那一列也是月之暗面测的，有三种例外。** Terminal-Bench 4.0、Terminal-Bench Science 和 SWE-Marathon 引自公开榜单和各厂商自己的博客；GDPVal-AA 和 GDP.pdf 引自 Artificial Analysis。表里其余的数字，都是月之暗面在自己的机器上跑出来的。
- **先看最该看的三行。** Terminal-Bench 4.0 的 65.7，对面是 Opus 5.5 的 66.4 和 Astra 的 58.2；Agents' Last Exam 的 43.2，是那一行的最高分；带工具的 HLE 79.8，对面 67.7。经济价值那一项（GDPVal-AA）是 1846.0，略低于该行最高分。
- **落后的地方也得读，而且要看差距有多大。** Fable 5.1 在 OSWorld V2.1 上领先（80.7 对 79.6），Terminal-Bench Science 领先（40.0 对 38.1），Frontier Finance 也领先（60.8 对 58.6）。差距都在一到两点之间，谈不上碾压，但这三行确实是 Fable 领先。一张只印自己赢的表是营销表，这张不是。
- **它暂时进不了排名榜，而且我们不会绕过这个事实。** 站内榜单只给「某条赛道核心基准全部测过」的模型排名次。我们手上没有 Kimi K3.1 Pro 在 GPQA Diamond、不带工具的 HLE、MathArena Apex、DeepSWE、AutomationBench 上的分数——月之暗面的脚注说明它确实跑了这几项，但数字在另一张我们读不到的表里，所以我们一个都不发布。它只出现在「未测」名单里，缺哪一行会逐条写出来——不会拿它有的那几项去平均。
- **有一行我们故意不收。** Kimi Code Bench 3.0 是月之暗面自己的内部长程编程基准。只有一家厂商的数字、没有公开榜单的基准，不该在站内占一行，所以这个数字不在上面的表里；厂商的声明留在厂商的公告里。

## 该不该换

- **如果你今天在用 Kimi K3，换。** 两者都公布的每一行上，K3.1 Pro 都更高——Terminal-Bench 4.0 是 65.7 对 K3 的 12.6，带工具的 HLE 是 79.8 对 59.8，Agents' Last Exam 是 43.2 对 27.6——而输入输出还便宜三分之一。继续留在 K3 的理由只剩两个：把 checkpoint 钉死了，或者流程已经跑通——这两条都不足以让你为一个更慢的模型多付钱。
- **要的是延迟不是吞吐，就上高速版。** ¥26 / ¥136（每百万 token）买的是约 2~3 倍的输出速度，适合交互式场景。如果账单大头在输出，标准版晚一点给同样的答案，反而更便宜。
- **你在用闭源旗舰，值得用自己的提示集做一次 A/B。** GPT-6 Astra 的 $10 / $50 和 Claude Opus 5.5 的 $4 / $20，正是 Kimi K3.1 Pro 要往下压的那两档价格，而 Terminal-Bench 那一行是我们手上最接近同口径的比较——但那是月之暗面的测量结果，搬生产流量之前，先跑一遍自己的回归集。
- **你在用便宜那一档，这是升质量不是省钱。** 从 DeepSeek V4.1-Flash（$0.30 / $1.20）换到 Kimi K3.1 Pro，账单要翻好几倍；换它的理由是智能体那几行，不是发票。
- **要自部署的，权重 11 月 4 日前到位，但有一个前提。** 开源版就是剔除了网络攻防数据之后的同一个模型，而月之暗面说开源权重里的攻防能力会逐步放开。对自部署团队来说，这是多一个同样权重的镜像；对防守方来说，这项能力终于可以被拆开看。
- **这张价目表上最大的杠杆是缓存写入。** 5 分钟档写入 ¥13，和输入同价——重复读一个大前缀的负载，写一次付一次，之后的读只付 ¥1.3。

## 延伸阅读

- **模型页** — 我们收录的每一项跑分及其出处：[/models/kimi-k3.1-pro](/zh/models/kimi-k3.1-pro)
- **K3 这条线，并排看** — K3.1 Pro、高速版与 K3：[/series/kimi-k3](/zh/series/kimi-k3)
- **和最接近的对手正面比** — [/compare?a=kimi-k3.1-pro&b=claude-opus-5.5](/zh/compare?a=kimi-k3.1-pro&b=claude-opus-5.5)
- **算我自己的用量** — [/token-calculator](/zh/token-calculator)
- **本文的数据出处** — 月之暗面官方发布公告，核对于 2026-10-24；价格取自 Kimi API 开放平台定价页，同日核对。英文原文见 [kimi.com 的发布说明](https://kimi.com/blog/kimi-k3-1-pro)。
