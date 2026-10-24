---
title: "Kimi K3.1 Pro: $2 / $10, a 1M window, and Terminal-Bench within a point of Opus 5.5"
description: "Moonshot shipped Kimi K3.1 Pro on 2026-10-24: a 3-trillion-class model with a 1,048,576-token window, $2 per 1M input tokens and $10 per 1M output tokens — cheaper than the K3 it sits next to — and 65.7 on Terminal-Bench 4.0 against Claude Opus 5.5's 66.4. Thirteen scores, one vendor table, and what it means for your bill."
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
videoCaption: "The teaser Moonshot published the day before the launch, 24 seconds: a Kimi Code banner that reads model: kimi k3.1, the prompt asking for a procedural Three.js scene, and the render it produced. No caption, no date, no specification."
sourceUrl: "https://kimi.com/blog/kimi-k3-1-pro"
sourceTitle: "Kimi — Introducing Kimi K3.1 Pro"
published: true
---

## TL;DR

- **Kimi K3.1 Pro is live, and it is cheaper than the K3 it succeeds.** Moonshot shipped it on 2026-10-24 at $2 per 1M input tokens and $10 per 1M output tokens, with a $0.20 cache-read rate and a 1,048,576-token window. The K3 it sits beside still bills $3 / $15 — so the new flagship is a third cheaper on both meters, not a premium for it.
- **The scores are Moonshot's own, and they are strong where it matters.** Terminal-Bench 4.0 at 65.7 against Claude Opus 5.5's 66.4 and GPT-6 Astra's 58.2; Agents' Last Exam at 43.2, the best number in that row of the vendor's table; HLE with tools at 79.8 against Opus 5.5's 67.7; and 1846.0 on GDPVal-AA, the economic-value row, just under the best figure in it.
- **But it is a vendor table, on a vendor harness, and it does not enter our ranked boards yet.** Moonshot measured every row at max thinking effort, and several of the benchmarks our boards need — GPQA Diamond, HLE without tools, DeepSWE, AutomationBench — sit in a table we cannot read, so on our boards this model is listed as untested rather than averaged over the rows it happens to have.

## What shipped

- **The first model of the K3.1 series, and Moonshot's strongest yet.** Kimi K3.1 Pro launched on 2026-10-24: a post-trained Kimi K3 with substantially more post-training compute, in the 3-trillion-parameter class, with a 1,048,576-token context window.
- **A Highspeed twin at twice the price.** Kimi K3.1 Pro Highspeed runs the same intelligence at roughly 2-3× the output speed, for $4 per 1M input tokens and $20 per 1M output tokens.
- **Everywhere at once.** kimi.com, the Kimi app (iOS, Android, HarmonyOS), Kimi Work (desktop 3.1.0 or later), Kimi Code (pick K3.1 Pro in the model switcher), and the Kimi API under `kimi-k3.1-pro` and `kimi-k3.1-pro-highspeed`.
- **Open weights by 4 November 2026.** Moonshot says the full weights land by then, and it says the open-weight release is a deliberate decision it can defend.
- **Cyber capability was deliberately reduced before the release.** Moonshot removed cyber-related data from both the mid-training corpus and the reinforcement-learning environment mix. On its own xdev-bench-hard set the released model solves fewer tasks than the same pipeline would have produced without that filtering, and Moonshot says the result stays behind frontier proprietary models that have been public for at least three months. That is a disclosure, not a benchmark — we do not track the set, so no number from it appears here.
- **Factual accuracy was an explicit target.** On Kimi's own hallucination stress test the claim-level error rate fell sharply against K3, and the share of answers carrying at least one factual error is a fraction of its predecessor's rate. The raw rates are Moonshot's internal numbers, so we quote the direction and not the digits.

## What it costs

- **The rate card is short.** $2.00 per 1M input tokens, $10.00 per 1M output tokens, $0.20 per 1M cached-input read. Cache writes are billed separately by TTL: $2.00 for 5 minutes, $4.00 for 1 hour — the same shape as Anthropic's cache-write pricing, and unlike DeepSeek's, where the write is folded into the cache-miss rate instead.
- **Against the K3 it replaces: a third cheaper on both meters.** $2.00 against $3.00 on input, $10.00 against $15.00 on output, and the cache read rate falls from $0.30 to $0.20.
- **Against the closed frontier: 2× to 5× cheaper.** Claude Opus 5.5 bills $4 / $20 and GPT-6 Astra $10 / $50 — so K3.1 Pro costs half of the former and a fifth of the latter, at a Terminal-Bench score a fraction of a point behind Opus 5.5 and well ahead of Astra.
- **Against the cheap end, it is not a bargain.** DeepSeek V4.1-Flash bills $0.30 / $1.20 and MiniMax M3.1 Flash $0.15 / $0.60. K3.1 Pro is several times that; what it buys is frontier-adjacent agentic quality, not value per token.
- **The window is the same 1,048,576 tokens as the rest of the K3 series**, so a 1M-token prompt is a single-context job rather than a chunked one.
- **Budget the cache write, not just the read.** A 5-minute write costs exactly what the input costs, and a 1-hour write costs twice that.

## How it scores

- **Every score in the table above is Moonshot's.** The launch announcement prints thirteen rows we can place on our registry, and each carries the harness that produced it: Claude Code on the coding rows, Kimi Code on Agents' Last Exam, the Kimi Agent harness on OSWorld, the official finance agent harness on Frontier Finance, and five-run averages on the multimodal rows.
- **The rival columns are Moonshot's measurements, not ours — with three exceptions.** Terminal-Bench 4.0, Terminal-Bench Science and SWE-Marathon quote the public leaderboards and the vendors' own blogs; GDPVal-AA and GDP.pdf cite Artificial Analysis. Everything else in that table was measured by Moonshot, on Moonshot's infrastructure.
- **Read the headline three.** Terminal-Bench 4.0 at 65.7 against Opus 5.5's 66.4 and Astra's 58.2; Agents' Last Exam at 43.2, the top of that row; HLE with tools at 79.8 against 67.7. On economic value (GDPVal-AA) the model sits at 1846.0, just under the best figure in that row.
- **Where Kimi is behind, read that too — and read the margins.** Fable 5.1 is ahead on OSWorld V2.1 (80.7 against 79.6), Terminal-Bench Science (40.0 against 38.1) and Frontier Finance (60.8 against 58.6). Those are one- and two-point gaps, not a rout, but they are the rows where Fable leads. A vendor table that printed only its own wins would be a marketing table; this one does not.
- **It does not enter the ranked boards yet, and we will not average around that.** Our boards rank a model only when it has every core benchmark of a track. We hold no score for Kimi K3.1 Pro on GPQA Diamond, HLE without tools, MathArena Apex, DeepSWE or AutomationBench: Moonshot's footnotes say the model was run on several of them, but the numbers sit in a table we cannot read, so we publish none of them. It appears in the untested list with each missing row named — never averaged over the subset it happens to have.
- **One row we deliberately do not track.** Kimi Code Bench 3.0 is Moonshot's own internal long-horizon coding benchmark. A benchmark with one vendor's numbers and no public leaderboard is not a row on this site, so its number is not in the table; the claim stays in the vendor's announcement, not on our board.

## Should you switch?

- **If you run Kimi K3 today, switch.** On every row both models publish, K3.1 Pro is ahead — Terminal-Bench 4.0 at 65.7 against K3's 12.6, HLE with tools at 79.8 against 59.8, Agents' Last Exam at 43.2 against 27.6 — and it is a third cheaper on input and output. The only reasons to stay on K3 are a pinned checkpoint or a workflow that already works; neither is a good enough reason to keep paying more for a slower model.
- **If you need latency rather than throughput, take the Highspeed twin.** $4 / $20 buys roughly 2-3× the output speed for interactive work. If your bill is dominated by output, the standard model is the cheaper way to get the same answers a little later.
- **If you are on a frontier API, this is worth an A/B on your own harness.** GPT-6 Astra at $10 / $50 and Claude Opus 5.5 at $4 / $20 are the price points Kimi K3.1 Pro undercuts, and the Terminal-Bench row is the closest thing to a like-for-like comparison we have — but it is Moonshot's measurement, so run your own regression set before you move a production workload.
- **If you are on a cheap model, this is a quality upgrade, not a saving.** Moving from DeepSeek V4.1-Flash ($0.30 / $1.20) to Kimi K3.1 Pro multiplies the bill several times over; the case for it is the agentic rows, not the invoice.
- **If you self-host, the weights land by 4 November — with one caveat.** The open release is the same model minus the cyber-related data Moonshot removed, and Moonshot says the open-weight cyber capability will be raised gradually. For self-hosting teams that means one more image with the same weights; for defenders it means the capability finally becomes inspectable.
- **Cache writes are the biggest lever on this rate card.** At $2.00 per 1M for a 5-minute write — the same rate as the input — a workload that re-reads a large prefix pays the write once and the read at $0.20 thereafter.

## Where to go next

- **The model page** — every score we hold, with its provenance: [/models/kimi-k3.1-pro](/models/kimi-k3.1-pro)
- **The K3 line, side by side** — K3.1 Pro, the Highspeed twin and K3: [/series/kimi-k3](/series/kimi-k3)
- **Head to head with the closest rival** — [/compare?a=kimi-k3.1-pro&b=claude-opus-5.5](/compare?a=kimi-k3.1-pro&b=claude-opus-5.5)
- **Price your own traffic** — [Token Cost Calculator](/token-cost-calculator)
- **Source of truth for this page** — Moonshot's launch announcement, checked on 2026-10-24; the prices come from the Kimi API pricing page, verified the same day.
