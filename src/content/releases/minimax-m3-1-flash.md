---
title: "MiniMax M3.1 Flash: $0.15 / $0.60, released 2026-10-19"
description: "MiniMax M3.1 Flash costs $0.15 per 1M input and $0.60 per 1M output — exactly half of MiniMax M3, with a flat rate and a 1,000,000-token total window. Three comparable scores, all vendor-measured."
date: "2026-10-19"
checkedAt: "2026-10-20"
dataCheckedAt: "2026-10-20"
releasedAt: "2026-10-19"
vendor: minimax
modelId: minimax-m3.1-flash
modelSlug: minimax-m3.1-flash
compareModelIds:
  - minimax-m3
compareSlugs:
  - gpt-5.6-sol
  - deepseek-v4.1-flash
  - claude-opus-5
sourceUrl: "https://www.minimax.cn/blog/minimax-m31f"
sourceTitle: "MiniMax M3.1 Flash 官方发布"
published: true
---

## TL;DR

- **MiniMax M3.1 Flash is $0.15 per 1M input and $0.60 per 1M output, released on 2026-10-19** — the cheapest model on our board that has verified scores, and exactly half the price of MiniMax M3.
- **The rate is flat, and it comes with one operational difference.** No long-context tier, and unlike M3 it does not accept `service_tier=priority`. The published prices also appear in yuan: ¥1 / ¥4 / ¥0.1 per 1M for input / output / cached read.
- **Three comparable scores, all vendor-measured.** DeepSWE v1.1 73.7, CyberGym 82.0 and Agents' Last Exam 29.6 come from the vendor's own launch post — a legitimate source, and not an independent re-run.

## What shipped

- **A new Flash tier at half the price of its predecessor.** $0.15 input / $0.60 output per 1M, cached input $0.015, active, released 2026-10-19.
- **The rates are published in both currencies.** $0.15 / $0.60 / $0.015 in USD, and ¥1 / ¥4 / ¥0.1 per 1M for input, output and cached read in the Chinese announcement.
- **Flat pricing, and one capability M3 has that this does not.** There is no long-context tier, so the rate does not move with prompt length. But M3.1 Flash does not accept `service_tier=priority` at all, while M3 does — at 1.5× the standard rate.
- **The context window is 1,000,000 tokens in total.** MiniMax documents that as input plus output combined, which is a different thing from how most vendors quote a window, and it changes how you should size a request.
- **M3 is still on the board at $0.30 / $1.20**, twice the new price, and its rate doubles past roughly 512,000 tokens of input.
- **Cached input at $0.015** — 10% of the input rate, a 90% discount.

## What it costs

- **Half of M3, and a simpler rate to model.** $0.15 / $0.60 against M3's $0.30 / $1.20 is exactly half on both lines. M3's meters step up past roughly 512,000 tokens of input; M3.1 Flash has no long-context tier on file, so its price does not move with prompt length.
- **The trade is the priority lane.** M3 accepts `service_tier=priority` at 1.5× the standard rate; M3.1 Flash does not accept it at all. If your latency-sensitive traffic was paying that premium, this model is not a drop-in replacement — it is a cheaper standard-tier option.
- **The cache read is 10% of input.** $0.015 against a $0.15 input rate. For a workload that re-sends the same context every turn, that is a 90% discount, and it is the same shape as the discount the rest of the family offers.
- **Against the frontier, the gap is not a rounding error.** Input at $0.15 is 33× cheaper than Claude Opus 5's $5, and output at $0.60 is 42× cheaper than its $25.
- **Budget the window as a shared budget.** The 1,000,000 tokens cover input and output together, so a 600,000-token prompt leaves 400,000 tokens for the answer.

## How it scores

- **Three scores that line up with the other models on this page** — DeepSWE v1.1 at 73.7, CyberGym at 82.0 and Agents' Last Exam at 29.6 — plus a fourth, BankerToolBench, that none of the models we compare against publishes, so it never becomes a head-to-head row.
- **All of them are vendor-measured.** MiniMax publishes its own numbers, taken from its launch post. That is a named, traceable source, and the caveat travels with the scores: these were measured on the vendor's own infrastructure, not re-run by an independent leaderboard.
- **The shape of the three numbers is the interesting part.** CyberGym 82.0 is a strong security-engineering result, DeepSWE 73.7 lands close to the flagship rows on the table, and Agents' Last Exam 29.6 is in the same band as the models it is compared against. We are not going to turn three numbers into an average, and neither should you.
- **Coverage is the limit.** Two of the three are agentic or coding benchmarks. There is no reasoning, knowledge or mathematics score on file. If your product answers questions rather than changing files, this table tells you almost nothing.
- **One more thing the board cannot settle:** there is a cheaper model in our wider registry — GPT-6 luna at $0.10 / $0.50 — but it has no verified scores on our board at all. "Cheapest with evidence" is a different claim from "cheapest", and this is the former.

## Should you switch?

- **If you are on MiniMax M3, this is the easiest switch in the series.** The new model is half the price with a simpler rate, and M3 stays available if you need the priority lane or the 1.5× service tier. There is no capability evidence either way that we could use to stop you.
- **If you are on a frontier flagship and your workload is high-volume,** 33× on input and 42× on output is a big enough gap that the test is worth running. Put 5% of traffic on M3.1 Flash, keep the rest where it is, and compare on your own metrics rather than on a vendor score card.
- **If you are latency-sensitive,** M3.1 Flash does not accept `service_tier=priority`. Do not assume it can absorb a latency budget the way M3's premium lane could — for latency-critical traffic, that is a feature you give up, and it belongs in the decision.
- **If you run long prompts,** the window is 1,000,000 tokens *total*, input plus output, and there is no long-context surcharge. Size your requests against the combined budget, not against the input alone.
- **If you care about independent evidence,** the honest answer is that this model's public evidence is thin and vendor-sourced. An A/B on real traffic beats a leaderboard here — which is why we publish the scores and the caveat together.

## Where to go next

- **The model page** — every score we hold, with the vendor-measurement caveat: [/models/minimax-m3.1-flash](/models/minimax-m3.1-flash)
- **What DeepSWE measures** — [/benchmarks/deepswe-v1.1](/benchmarks/deepswe-v1.1)
- **Head to head with the other Flash tier** — [/compare?a=minimax-m3.1-flash&b=deepseek-v4.1-flash](/compare?a=minimax-m3.1-flash&b=deepseek-v4.1-flash)
- **Price your own traffic** — [Token Cost Calculator](/token-cost-calculator)
- **Source of truth for this page** — the MiniMax M3.1 Flash launch post, with prices last verified on 2026-10-20.
