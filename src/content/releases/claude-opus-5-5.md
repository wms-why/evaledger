---
title: "Claude Opus 5.5: Anthropic's flagship at $4 / $20, 20% below Opus 5"
description: "Claude Opus 5.5 costs $4 per 1M input and $20 per 1M output — 20% below the retired Claude Opus 5 — and reads cached input at 5% of the input rate. Four vendor-reported scores, a 1M-token context window, and a September 22 launch."
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

## TL;DR

- **Claude Opus 5.5 is $4 input / $20 output per 1M — 20% below the retired Claude Opus 5 ($5 / $25), 2× the price of Sonnet 5 ($2 / $10), and 4× the price of Haiku 4.5 ($1 / $5).**
- **The cache read is the bigger headline.** $0.20 is 5% of the $4 input rate — a 95% discount, up from the 90% the old Opus 5 offered on its $0.50 cache read. Writing a 5-minute cache entry costs $5.00 per 1M, which is 1.25× the input rate, the same shape Anthropic uses across the family.
- **Four verified scores, not a full card.** Humanity's Last Exam 64.4 (no tools), Terminal-Bench 4.0 66.4, HLE with tools 67.7, and Chartography with tools 89.0. All four are vendor-reported, and the Terminal-Bench figure is an xhigh-effort run; Artificial Analysis measures 59.6 for the same model in its own harness.

## What shipped

- **A new Anthropic flagship, priced lower than the one it replaces.** Claude Opus 5.5: $4 per 1M input, $20 per 1M output, cached input $0.20, 5-minute cache write $5.00, a 1,000,000-token context window, active. Anthropic launched it on 2026-09-22.
- **The context window grew with the generation.** Opus 5.5 carries 1M tokens, the same as Fable 5.1 and Sonnet 5 and double the 500K-token chat window of Fable 5. Haiku 4.5 remains the 200K-token member of the family.
- **The previous Opus generation is retired in place.** Claude Opus 5 ($5 / $25) is marked delisted with the note "Listed in Anthropic's Legacy models section; superseded by Opus 5.5". We keep the row so searches for the old price still resolve to something real.
- **The rest of the family is unchanged and still active.** Sonnet 5 at $2 / $10 and Haiku 4.5 at $1 / $5.

## What it costs

- **The cut applies to both directions of the bill.** $4 / $20 against Opus 5's $5 / $25 is 20% off input and 20% off output. This is an across-the-board reduction, not a reshuffle of the price list where one side gets cheaper and the other hides a premium.
- **The cache discount got deeper, and it compounds with the lower base.** Opus 5.5 reads cached input at $0.20, which is 5% of the $4 input rate — a 95% discount. The retired Opus 5 read cache at $0.50, which was 10% of its $5 input rate, a 90% discount. For a workload that re-sends the same long context on every turn, the cached read is now priced off a lower base *and* at a steeper discount.
- **Cache writes are a separate line, and they are not free.** A 5-minute cache write costs $5.00 per 1M, 1.25× the input rate. If your pattern is "write once, read many times", the write is the up-front cost and the $0.20 read is what makes it pay off; if you read a context only a handful of times, the write may never amortise.
- **Context is 1,000,000 tokens**, the same band as the GPT-6 line (1,050,000 tokens) and no longer a reason to rule the model out for long documents. Anthropic does not list a long-context surcharge on the Opus 5.5 row; the $4 / $20 rate is the rate at every prompt length on the published table.
- **Against the rest of the family:** 2× Sonnet 5's $2 / $10, 4× Haiku 4.5's $1 / $5. Anthropic's ladder is unchanged in shape — only the flagship rung moved down.

## How it scores

- **Four benchmarks, each with a named harness.** HLE 64.4 is the no-tools run at max effort from the Opus 5.5 system card. Terminal-Bench 4.0 66.4 and HLE with tools 67.7 are Anthropic launch-table figures; the Terminal-Bench run is xhigh effort and carries a standard error of roughly two and a half points. Chartography 89.0 is the with-tools vendor row.
- **The same benchmark has a second number, and it is lower.** Artificial Analysis measures Terminal-Bench 4.0 at 59.6 in its own harness. The gap is not a correction of the vendor figure: it is a different scaffold, a different effort setting and Anthropic's server-side safeguard routing. Read both before treating 66.4 as an apples-to-apples lead over a rival.
- **What the card does not contain:** GPQA Diamond, Terminal-Bench 2.1, DeepSWE, ProgramBench and the coding rows that make Opus 5 comparable to the other models on our board. We publish the four verified rows and leave the rest empty rather than copying Opus 5's numbers forward.
- **The honest comparison is against Opus 5, not across vendors.** On the three rows both models share in the same vendor table, Opus 5.5 is ahead: HLE 64.4 against 56.3, Terminal-Bench 4.0 66.4 against 51.8 (vendor harness), and Chartography 89.0 against 84.0.

## Should you switch?

- **On Opus 5 today? Switch.** 20% off both input and output, a deeper cache discount, a 1M-token window instead of the old ceiling, and no change required on your side beyond the model id. There is no scenario in which holding the retired SKU is the right call.
- **On Sonnet 5?** Opus 5.5 costs 2× Sonnet's $2 / $10. Take it only if your own eval shows the flagship gap matters for this task; otherwise Sonnet 5 remains the default and the price is already good.
- **On Haiku 4.5 ($1 / $5)?** Opus 5.5 is 4× the price. Haiku 4.5 is for high-volume, low-stakes traffic; Opus 5.5 is for the traffic where a wrong answer costs more than the tokens. Splitting a product between them is often the cheaper answer than moving all of it.
- **Cache-heavy workloads get the most out of this.** At 5% of the input rate, a workload that re-reads the same long context every turn pays $0.20 per 1M for those tokens — and a flagship can beat a smaller model on that line: Sonnet 5's fresh input is $2 per 1M, while Opus 5.5's cached read is $0.20, ten times less.
- **Before you move a production workload:** 20% off is a savings you can model from a spreadsheet. The part we cannot model is whether 5.5 is the right model for your task, and that is an eval question, not a price question.

## Where to go next

- **Run your own numbers** — price Opus 5.5, Sonnet 5 and Haiku 4.5 against your real mix: [/token-calculator](/token-calculator)
- **Two models, side by side** — [/compare](/compare)
- **The Opus 5.5 model page, with all four scores** — [/models/claude-opus-5.5](/models/claude-opus-5.5)
- **The previous generation, for the price delta** — [/models/claude-opus-5](/models/claude-opus-5)
- **Claude-specific cost breakdown** — [/claude-token-cost-calculator](/claude-token-cost-calculator)
- **Source of truth for this page** — Anthropic's Claude API pricing page, with prices last verified on 2026-10-20.
