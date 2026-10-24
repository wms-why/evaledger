---
title: "Gemini 3.1 Pro Preview: $2 / $12 up to 200K, $4 / $18 above it"
description: "Google's Gemini 3.1 Pro Preview costs $2 per 1M input and $12 per 1M output up to 200,000 tokens, $4 / $18 above that, inside a 1,000,000-token window. Five verified benchmark scores and a long-context tier the older page missed."
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

## TL;DR

- **Gemini 3.1 Pro Preview is $2 per 1M input and $12 per 1M output up to 200,000 tokens, then $4 / $18 above that, with a 1,000,000-token context window.** The long-context step is published on Google's own row — this page previously said there was no tier, and that was wrong.
- **The window is no longer the differentiator.** At 1M tokens it sits in the same band as Claude Opus 5.5 and GPT-6 Astra (1,050,000); the OpenAI and Anthropic flagships are not 200K–400K models any more. What is left is price: $2 / $12 is a fraction of GPT-6 astra's $10 / $50 and GPT-5.6 sol's $4 / $20 — the latter a promotional rate in force through 2026-11-21, when sol goes to $5 / $30.
- **Five verified scores, and one of them is no longer the board's best.** GPQA Diamond 94.3, HLE 44.4, HLE with tools 51.4, MathArena Apex 60.9 and Automation-Bench 35.4. GPT-6 Astra now reports 96.0 on GPQA, so 94.3 is a close second rather than the top row.

## What shipped

- **A new Pro-tier SKU from Google.** Gemini 3.1 Pro Preview: $2 per 1M input, $12 per 1M output, 1,000,000-token context window, active. The name on the pricing page includes "Preview", and we list it exactly as published.
- **The long-context tier exists, and it is two-sided.** Google's row reads "$4.00, prompts > 200k tokens" on input and "$18.00, prompts > 200k" on output. Cached input also doubles above the threshold. The calculator models both steps, including the doubled cached read.
- **The Flash tiers bracket it.** Gemini 3.8 Flash is $0.75 / $3.75 — an introductory rate through 2026-12-31, then $1.50 / $7.50 from 2027-01-01 — and Gemini 3.1 Flash-Lite is $0.25 / $1.50, both active, both also 1,000,000-token models. The calculator keeps today's rate; the registry carries the whole band, so the expiry is visible on the model page rather than buried in a note.
- **The previous Pro generation is still active, and it steps up at the same threshold.** Gemini 2.5 Pro at $1.25 / $10 also moves to 2× input and 1.5× output above 200,000 tokens. The price we list for each model is the standard tier, not the long-context tier.

## What it costs

- **The context window is no longer the number to look at first.** 1,000,000 tokens is the same band as Claude Opus 5.5 and Sonnet 5 (1M) and GPT-6 Astra (1,050,000). It is still 2.5× the 400,000-token window of GPT-5.6 cyber, but that is the previous-generation outlier, not the OpenAI line.
- **Against the rest of Google's own line, the ladder is steep in both directions.** Gemini 3.1 Pro Preview is 2.67× Flash 3.8 on input and 3.2× on output while Flash is on its introductory rate through 2026-12-31, and 8× Flash-Lite on both. It is also 1.6× Gemini 2.5 Pro on input but only 1.2× on output — so for output-heavy traffic, moving up from 2.5 Pro costs 20% more, not 60%.
- **The long-context tier changes the comparison, but not the ranking.** Above 200,000 tokens this model charges $4 / $18, while Gemini 2.5 Pro charges 2× its own base. Both step up by the same multipliers, so 3.1 Pro remains 1.6× / 1.2× the older model at every prompt length. The earlier version of this page claimed the older model became the more expensive one above 200K; that was wrong because it assumed only one of the two rows had a tier.
- **The cached-input cell is no longer empty.** Google lists $0.20 per 1M for prompts up to 200,000 tokens, doubling above that. A cached workload inside the first tier is priced at 10% of fresh input — a 90% discount, the same shape as the Flash tiers.
- **The published rate changes as the window fills up.** A 250,000-token request is billed at $4 / $18, not $2 / $12. If your prompts live near the threshold, model the step explicitly; the calculator does, and the result is a different monthly number from the headline rate.

## How it scores

- **Five benchmarks, each with its own provenance.** GPQA Diamond 94.3 and HLE 44.4 come from Google's model card; HLE with tools 51.4 also comes from the model card; MathArena Apex 60.9 and Automation-Bench 35.4 come from a public benchmark aggregator. Different sources, different harnesses — which is exactly why the notes below matter.
- **The notes matter more than the numbers.** HLE 44.4 is the *no-tools* run over the full set (text and multimodal) — not a smaller text-only subset. The 51.4 is a different configuration of the same benchmark: search with a blocklist, plus code. So 44.4 versus 51.4 is not a plain improvement, it is the same exam with tools switched on.
- **Read the coverage as the headline, not the average.** Five benchmarks is a thin card — more than Grok 4.7's two, far fewer than DeepSeek V4.1-Flash's nineteen — and it contains no terminal-bench or DeepSWE row, so this page cannot answer "is it a better coding agent than X". The empty cells on the table are there for that reason.
- **The GPQA lead is gone, and the replacement is narrow.** GPT-6 Astra reports 96.0 on the same benchmark, so 94.3 is second on our board, ahead of GPT-5.6 sol's 94.1 and Claude Opus 5's 93.4 by fractions of a point. Read that as "the frontier is tight on knowledge benchmarks", not as a Gemini win or loss.

## Should you switch?

- **If your prompts are long, the window is no longer the argument — the price is.** Gemini 3.1 Pro carries the same 1M-token band as the Claude 5.5 family and the GPT-6 line, at a fraction of their per-token rate. The catch is the 200K step: above it, the rate doubles on input and rises 50% on output. Model the tier before you quote a saving.
- **If you are on Gemini 2.5 Pro and your prompts pass 200,000 tokens,** the newer model is still the more expensive one per token, because both rows step up by the same multipliers. The reason to move is capability and the 1M window, not a lower long-context rate.
- **If you are on Gemini 2.5 Pro and your traffic is output-heavy,** the move is only 1.2× on output — 20% more, not 60% — so the decision hinges on output quality, not on budget.
- **If you are on Gemini 3.8 Flash,** you are looking at 2.67× on input and 3.2× on output — the introductory rate, so those multiples hold through 2026-12-31; from 2027-01-01 Flash doubles to $1.50 / $7.50 and the gap is $2 against $1.50 on input, $12 against $7.50 on output. Fine for the traffic where Flash's capability is not enough; wasteful for the rest, since the tier ladder is 5× steps.
- **You are buying a preview.** The SKU is published as "Preview", which in practice means the model id, the rate and the behaviour can all move. Pin the exact model id in your code, and re-check the price before you build a forecast on it.
- **Do not read the GPQA row as a capability lead in either direction.** With five benchmarks and no agentic-coding row, the honest summary is: strong on what we can see, unmeasured on a lot of what we cannot.

## Where to go next

- **The model page, with every score we hold** — [/models/gemini-3.1-pro](/models/gemini-3.1-pro)
- **Head to head with an OpenAI flagship** — [/compare?a=gemini-3.1-pro&b=gpt-5.6-sol](/compare?a=gemini-3.1-pro&b=gpt-5.6-sol)
- **The GPT-6 flagship that took the GPQA row** — [/models/gpt-6-astra](/models/gpt-6-astra)
- **Price your own traffic** — [Token Cost Calculator](/token-cost-calculator)
- **What GPQA and HLE actually measure** — [/benchmarks/gpqa-diamond](/benchmarks/gpqa-diamond) and [/benchmarks/hle](/benchmarks/hle)
- **Source of truth for this page** — Google's Gemini API pricing page, with prices last verified on 2026-10-20.
