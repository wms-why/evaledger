---
title: "Grok 4.7: $2 / $6, a 500,000-token window, and the thinnest score card we publish"
description: "Grok 4.7 costs $2 per 1M input and $6 per 1M output — output is 70% cheaper than GPT-5.6 sol and 76% cheaper than Claude Opus 5 — and the context window went from 256,000 to 500,000 tokens. Two verified benchmark scores."
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

## TL;DR

- **Grok 4.7 is $2 per 1M input and $6 per 1M output, with a 500,000-token context window.** Output at $6 is 70% cheaper than GPT-5.6 sol's $20 and 76% cheaper than Claude Opus 5's $25.
- **The window nearly doubled and the old model is retired.** Grok 4 sat at 256,000 tokens; Grok 4.7 sits at 500,000, and Grok 4 is now delisted with the note "Replaced by Grok 4.7". This is an upgrade, not a choice.
- **We have two verified scores for it — the thinnest card in this series.** Terminal-Bench 4.0 at 38.0 and DeepSWE v1.1 at 71.0, which the source lists as "DeepSWE". No reasoning, knowledge or math score on file.

## What shipped

- **A new Grok generation at lower prices.** Grok 4.7: $2 per 1M input, $6 per 1M output, 500,000-token context window, active.
- **Grok 4 is retired but not forgotten.** It was $3 / $15 and is now marked delisted with the note "Replaced by Grok 4.7"; the row stays so that old price searches still resolve.
- **The window nearly doubled.** 256,000 tokens on Grok 4, 500,000 on Grok 4.7. On a long-document workload that is roughly half as many chunks to design around, at a lower per-token price.
- **No release date on file.** xAI's model documentation is the source we check, and it does not give us a launch date for 4.7, so the "released" line is empty.
- **No cached-input rate on file for 4.7.** That cell is blank in the table on purpose. The retired Grok 4 row does carry a cached rate; we do not roll it forward to a newer model.

## What it costs

- **Output is where this model is priced to compete.** $6 per 1M output against GPT-5.6 sol's $20 is 70% less, and against Claude Opus 5's $25 is 76% less. Input at $2 is half of GPT-5.6 sol's $4 and 60% below Claude Opus 5's $5.
- **The cut against its own predecessor is deeper on output.** Grok 4 was $3 / $15; Grok 4.7 is $2 / $6 — 33% less on input and 60% less on output. The generation change is not a price-neutral refactor.
- **The price shape is 3:1 from input to output.** $2 in, $6 out. Agentic loops, long generations and any workload that produces rather than consumes tokens pay the higher number, so the 60% output cut is where the saving actually lands.
- **The context window is a cost decision too.** 500,000 tokens without a surcharge tier on file means a long prompt is billed at the same rate as a short one.

## How it scores

- **Two benchmarks. That is the whole card.** Terminal-Bench 4.0 at 38.0 and DeepSWE v1.1 at 71.0 — the second one is published under the name "DeepSWE" in the source we cite.
- **Read the two rows as adjacent, not as a ranking.** The comparison rows on the table cover different benchmarks, so the common ground is thin: one agentic-terminal column and one repository-engineering column. We do not average two scores into a headline number.
- **What the table can tell you:** on the two columns every model reports, Grok 4.7 sits in the same band as the flagship rows it is compared against, at a fraction of the price. That is a statement about those two benchmarks, not about the model.
- **What it cannot tell you:** anything about reasoning, knowledge or mathematics, because no such score is on file. If your product depends on a reasoning benchmark, this table is not going to settle it.

## Should you switch?

- **If you were on Grok 4: switch.** The old model is delisted, the new one is 33% cheaper on input and 60% cheaper on output, and the window went from 256,000 to 500,000 tokens. There is no scenario where holding the old SKU is the right call.
- **If you are on GPT-5.6 sol or Claude Opus 5 and your bill is output-driven,** the arithmetic favours a trial: at $6 output you are paying 70% to 76% less for the tokens you generate. Start with the workloads that produce the most — long generations, agentic loops, batch processing — and measure quality on real traffic.
- **If your workload is input-heavy** — RAG over long documents, say — the 500,000-token window is the reason to look, not the price: fewer chunks, fewer retrieval compromises, and the retired model's window was half the size.
- **If you need reasoning or knowledge capability, do not switch on this table.** We have no comparable scores for Grok 4.7 on those, and the models in the same rows do.
- **Before you commit:** a 2–2.5× price difference is a good reason to A/B. A missing benchmark is a reason to keep measuring. Run both at once for a week and let your own evals decide.

## Where to go next

- **The model page** — every score we hold for Grok 4.7: [/models/grok-4.7](/models/grok-4.7)
- **What DeepSWE measures** — [/benchmarks/deepswe-v1.1](/benchmarks/deepswe-v1.1), and [/benchmarks/terminal-bench-4.0](/benchmarks/terminal-bench-4.0)
- **Head to head with Gemini 3.1 Pro** — [/compare?a=grok-4.7&b=gemini-3.1-pro](/compare?a=grok-4.7&b=gemini-3.1-pro)
- **Price your own traffic** — [/token-calculator](/token-calculator)
- **Source of truth for this page** — xAI's models and pricing documentation, with prices last verified on 2026-10-20.
