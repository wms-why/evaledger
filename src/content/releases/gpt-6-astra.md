---
title: "GPT-6 astra: $10 / $50 per 1M, and the 100× spread inside the GPT-6 family"
description: "GPT-6 astra costs $10 / $50 per 1M — 5× GPT-6 sol, 100× GPT-6 luna. Four verified scores, a 1,050,000-token window and the family's 100× price spread."
date: "2026-10-19"
checkedAt: "2026-10-20"
dataCheckedAt: "2026-10-21"
releasedAt: "2026-09-03"
vendor: openai
modelId: gpt-6-astra
modelSlug: gpt-6-astra
compareModelIds:
  - gpt-6-sol
  - gpt-6-luna
  - gpt-5.6-sol
  - gpt-5.6-cyber
  - gpt-5
compareSlugs:
  - gpt-5.6-sol
sourceUrl: "https://platform.openai.com/docs/pricing"
sourceTitle: "OpenAI — API pricing"
published: true
---

## TL;DR

- **GPT-6 astra is a $10 input / $50 output per 1M flagship.** Five times GPT-6 sol's price, a hundred times GPT-6 luna's, and still 20% cheaper on input and 33% cheaper on output than GPT-5.6 cyber at $12.5 / $75.
- **The interesting number in this launch is the spread, not the price.** OpenAI's GPT-6 line now runs $10 / $50, $2 / $10 and $0.10 / $0.50 — a clean 5× step down each tier. A 100× range inside one family is a pricing decision, and it means most workloads should not sit on the top tier by default.
- **Four verified scores, and they come with a setting.** GPQA Diamond 96.0, HLE 54.7, Terminal-Bench 2.1 89.9 and Terminal-Bench 4.0 57.9. The first and last are OpenAI-reported maxima; the two middle rows are Artificial Analysis runs at max and high effort. Read the notes before treating them as one table.

## What shipped

- **A new top-tier SKU in the GPT-6 line.** GPT-6 astra is $10 per 1M input tokens and $50 per 1M output tokens, with cached input at $1.00, a 5-minute cache write at $12.50, and a 1,050,000-token context window. It is listed as active; OpenAI's launch material dates it to 2026-09-03.
- **Two cheaper siblings ship with it.** GPT-6 sol is $2 / $10 and GPT-6 luna is $0.10 / $0.50, both with the same 1,050,000-token window, both active.
- **The previous generation is still on the board, and part of it is retired.** GPT-5.6 sol ($4 / $20 — a promotional rate that runs through 2026-11-21 and becomes $5 / $30 from 2026-11-22) and GPT-5.6 cyber ($12.5 / $75) are active. GPT-5 ($1.25 / $10) is marked delisted with the note "Replaced by GPT-6 series" — we keep it in the table so that old price searches still land on a real number instead of a dead end.
- **The window is the same size as Claude's, not half of it.** At 1,050,000 tokens, astra matches the 1M-token Claude 5.5 family and Gemini 3.1 Pro. OpenAI's older GPT-5.6 cyber is the 400,000-token outlier.

## What it costs

- **Read the family as a ladder, not as a list.** astra is $10 / $50, sol is $2 / $10, luna is $0.10 / $0.50 — each step is exactly 5× down. The tier you pick is a real cost lever, not a rounding difference.
- **The cache line changes the shape of the bill.** astra's cached input at $1.00 is 10% of the $10 input rate, a 90% discount. If you re-send the same system prompt or the same document on every request, that one line can be worth more than any tier switch you make.
- **Long prompts cost more, and the step is published.** Above 272,000 input tokens the standard rate becomes $20 input and $75 output — 2× input and 1.5× output. The calculator models that tier. The same shape applies across the GPT-6 line and to GPT-5.6 sol — where the step applies to whichever dated rate is in force — so a 300,000-token request is not priced at the headline rate on any of them.
- **Against the previous generation, astra is a cut in one direction and a jump in the other.** Against GPT-5.6 cyber ($12.5 / $75), astra is 20% cheaper on input and 33% cheaper on output. Against GPT-5.6 sol ($4 / $20 — promotional through 2026-11-21), astra costs 2.5× — moving up a generation inside the GPT-6 line is a 2.5× budget increase for that window. From 2026-11-22 sol returns to $5 / $30, and the same comparison is 2× on input and $50 against $30 on output.
- **The retired GPT-5 is a historical reference, not a migration target.** astra is 8× GPT-5's $1.25 input rate and 5× its $10 output rate, but GPT-5 is delisted.

## How it scores

- **Four rows, three harnesses, one model.** GPQA Diamond 96.0 and Terminal-Bench 4.0 57.9 are OpenAI-reported maxima at any effort setting. HLE 54.7 and Terminal-Bench 2.1 89.9 are Artificial Analysis runs at max and high effort respectively. The Terminal-Bench 4.0 row is corroborated by Anthropic's competitor table, which also prints 57.9 for astra at high effort.
- **The vendor maximum is not the default setting.** A 96.0 on GPQA Diamond is a best-of-effort number, not a medium-effort one. If you are budgeting a default deployment, the lower-effort rows in the same table are the ones to look at; we record the setting with every score so the distinction survives.
- **Coverage is thin, and we say so.** Four benchmarks is less than the ten-plus rows carried by GPT-5.6 sol or Claude Opus 5, and it has no DeepSWE, ProgramBench or NL2Repo row. The empty cells are missing data, not bad results.
- **What the rows do support:** a clear step up from GPT-5.6 sol on GPQA (96.0 against 94.1) and Terminal-Bench 4.0 (57.9 against 39.9 in the same OpenAI table). They do not support a claim about long-horizon software work, because nothing on this card measures it.

## Should you switch?

- **Coming off GPT-5.6 cyber? This is the cleanest switch in the lineup.** cyber charges $12.5 / $75; astra charges $10 / $50. You take 20% off the input line, 33% off the output line, a 2.6× larger window, and move to a newer generation at the same time. Launches that do both are rare.
- **Coming off GPT-5.6 sol? Stay on sol until astra earns it.** astra is 2.5× GPT-5.6 sol's price ($4 to $10 on input, $20 to $50 on output) while GPT-5.6 sol sits on its promotional rate: $4 / $20 runs through 2026-11-21, and from 2026-11-22 sol is $5 / $30, making astra's premium 2× on input. GPT-6 sol at $2 / $10 is the same family's 5×-cheaper tier. Either sol is the sensible default for anything routine.
- **Still on the retired GPT-5?** Do not use its $1.25 / $10 as the bar — it is delisted. The nearest live price in the family is sol at $2 / $10: 1.6× GPT-5's input rate, the same output rate. That is a far smaller step than going straight to astra.
- **If input dominates your bill, the family spread matters more than the model name.** The cheapest active tier, luna, is $0.10 / $0.50. It now has no published scores either, but the ceiling on what a workload can cost is set by the tier you choose, and you choose it in the model id.
- **What would make us say "switch":** an eval on your own traffic showing the gap is worth paying 5 times sol's rate. The score card now exists; the missing evidence is yours, not the vendor's.

## Where to go next

- **Run your own numbers** — the token calculator prices every model in this family against your real input/output mix: [Token Cost Calculator](/token-cost-calculator)
- **Put two models side by side** — benchmark deltas, context window and a monthly estimate: [/compare](/compare)
- **The astra model page, with all four scores** — [/models/gpt-6-astra](/models/gpt-6-astra)
- **The previous generation, for the price delta** — [/models/gpt-5.6-sol](/models/gpt-5.6-sol)
- **The rest of OpenAI's line** — [/chatgpt-api-pricing](/chatgpt-api-pricing)
- **Source of truth for this page** — OpenAI's API pricing page, with prices last verified on 2026-10-20.
