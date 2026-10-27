---
title: "GPT-6.1 Terra: $1 / $5 per 1M, and the best Agents' Last Exam score we hold"
description: "GPT-6.1 Terra is $1 / $5 per 1M — 2× cheaper than GPT-6 sol, 10× cheaper than astra — with a 1,050,000-token window and two verified scores."
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
sourceUrl: "https://openai.com/index/introducing-gpt-6-1-terra/"
sourceTitle: "OpenAI — Introducing GPT-6.1 Terra"
published: true
---

## TL;DR

- **GPT-6.1 Terra is $1 per 1M input and $5 per 1M output, with a $0.05 cache read.** That is half of GPT-6 sol's $2 / $10, a tenth of GPT-6 astra's $10 / $50, and a quarter of Claude Opus 5.5's $4 / $20 — with the same 1,050,000-token window as the rest of the GPT-6 line.
- **The price is the headline; the score card is what you read carefully.** We hold two numbers for Terra, both from OpenAI's own launch material: Terminal-Bench 4.0 at 50.3 and Agents' Last Exam at 60.0. The first is a vendor figure at max reasoning effort, the second a point in OpenAI's cost-versus-score chart whose rival columns are OpenAI's measurements of other vendors' models.
- **Terra is the cost tier of the 6.1 generation, not its flagship.** OpenAI keeps GPT-6.1 Sol and GPT-6 Astra above it and says so plainly: for the hardest programming tasks, Sol and Astra are still the better choice.

## What shipped

- **A new SKU with a stable API id: `gpt-6.1-terra`.** $1 input / $5 output per 1M tokens, cached input $0.05, a 1,050,000-token context window and 128,000 max output tokens. It is in ChatGPT Work and Codex for Plus, Pro, Enterprise and Edu users, and through the API.
- **The window is the GPT-6 line's, not a new one.** 1,050,000 tokens — the same pool as astra, sol and luna. Claude Opus 5.5 has 1,000,000.
- **The long-context cliff is published, and it is the GPT-6 one.** Above 272,000 input tokens the whole request is billed at 2× the input rate and 1.5× the output rate, and the calculator models that tier.
- **A June 2026 knowledge cutoff, and a reasoning dial that runs from `none` to `max`,** with `medium` as the default. Tool calling needs the Responses API.
- **OpenAI says Terra reaches the "Critical" cybersecurity threshold of its Preparedness Framework,** keeping the safeguards built for GPT-6 Astra, and that it stays inside the task and admits its own limits more often than GPT-5.6 Terra.
- **It shipped on 2026-10-26.** The announcement page is dated only to the year, but OpenAI's own developer changelog carries the entry that says "Released GPT-6.1 Terra" and lists it on the Responses and Chat Completions endpoints. This article is dated a day later, because that is the day we verified the prices.

## What it costs

- **The cache read is the quiet headline: $0.05, 5% of the input rate.** That is a 95% discount on every prompt you send again. Every other model in the GPT-6 line discounts its cache read by 90%, so Terra's is the deepest of the family — and on an invoice with a long repeated system prompt, that one line can matter more than the tier you pick.
- **Read the line as a ladder.** astra $10 / $50, sol $2 / $10, Terra $1 / $5, luna $0.10 / $0.50. Terra is half of sol, a tenth of astra and ten times luna — and the step from sol to Terra is the cheapest upgrade in the line.
- **The 272,000-token step applies to the whole request,** not to the overflow. A 300,000-token prompt is not billed at the headline rate, and a long-context workload needs a different budget than a short one.
- **Batch and Flex run at half the standard rate; Fast mode runs at twice it,** and regional processing adds 10% where it is offered. The calculator prices the standard rate, which is what interactive traffic is billed on.
- **Cache writes are a separate line, and we do not model it.** A write to the cache costs more than the uncached input rate, and a 12-hour write costs more again. If your workload writes the prompt back, price that line from the model page rather than from our table.
- **One thing the price does not buy: a discount band.** There is no introductory rate and no scheduled increase on this row — today's rate is the rate, and there is no expiry to plan around.

## How it scores

- **Two numbers, both OpenAI's, both vendor-measured.** Terminal-Bench 4.0 at 50.3 comes from the launch prose at max reasoning effort. Agents' Last Exam at 60.0 is a point in OpenAI's cost-versus-score chart, which prints the effort setting and the cost per task for every model in it.
- **The Terminal-Bench figure is the cleanest claim in the post:** 50.3 against the 21.5 that OpenAI publishes for GPT-5.6 Terra — more than double the previous generation, on the same benchmark.
- **The chart's ladder is the more interesting number.** Terra reads 55.9 at Low effort, 57.6 at Medium, 57.2 at High, 58.5 at Xhigh and 60.0 at Max. On the same chart at max effort: Claude Opus 5.5 63.2, GPT-6 Astra 59.3, GPT-6.1 Sol 58.6, GPT-6 Luna 50.9, GPT-5.6 Terra 50.7.
- **What the chart actually proves is cost, not a ranking.** At medium effort Terra is 15 points above GPT-5.6 Terra at about a third of the cost. At max effort it is a quarter of Claude Opus 5.5's price per token — about a ninth of the cost per task — for 3.2 points less. That is the trade the launch is selling: a few points of score for a fraction of the bill.
- **Read the column with the harness note, not as a table of equals.** The chart is OpenAI's measurement in OpenAI's harness, and it is titled Agents' Last Exam v1, while the other rows in this column come from the v1.1 task set. Its rival numbers are OpenAI's numbers for other vendors' models.
- **60.0 is now the highest Agents' Last Exam figure we hold,** so every other model's normalized score on the agent board is now computed against a higher denominator. The models did not change; the yardstick did.
- **Coverage is thin, and we say so rather than dress it up.** Two benchmarks is a fraction of what the fuller rows carry. There is no GPQA Diamond, no HLE, no DeepSWE, no AutomationBench — so Terra is listed on the boards and left unranked, with the missing benchmark named.
- **Two more results in the post are absent here on purpose.** OpenAI reports Terra beating GPT-5.6 Terra's best OSWorld 2.1 result at medium effort, and a Terminal-Bench Science 0.1 score that beats GPT-6.1 Sol at lower cost — but it prints no absolute number for either, and the same goes for its MMMU-Pro result. A relative claim is not a row.

## Should you switch?

- **Coming off GPT-6 astra? This is a 10× cut on both lines.** astra is $10 / $50 with a 1,050,000-token window; Terra is $1 / $5 with the same window and a deeper cache discount. What you give up is score coverage: astra carries GPQA Diamond and HLE, Terra carries neither.
- **Coming off GPT-6 sol? This is the easy one.** sol is $2 / $10 and has no score row of its own; Terra is half of that with two published scores. If your work is documents, forms, invoices and code review rather than frontier knowledge, Terra is both the cheaper of the two and the one that has published scores.
- **Coming off Claude Opus 5.5?** Terra is a quarter of the price on both lines — $1 / $5 against $4 / $20 — with a slightly larger window (1,050,000 against 1,000,000) and the same 95% cache discount. Opus 5.5 scores 66.4 on Terminal-Bench 4.0 against Terra's 50.3, and 63.2 on Agents' Last Exam against Terra's 60.0, so you are paying four times as much for those points.
- **Coming off GPT-5.6 sol?** sol is $4 / $20 on its promotional rate until 2026-11-21, and $5 / $30 from 2026-11-22. Terra is a quarter of the first and a fifth of the second. Note that OpenAI's own step-up comparison is against GPT-5.6 **Terra** — a different SKU, which we do not price — so the closest thing we hold is a sibling, not the predecessor.
- **Do not migrate on the internal error-rate claim.** OpenAI reports a large drop in hallucination and factual-error rate on an internal benchmark of error-inducing prompts, and says Terra stays in task scope and admits its own limits more often than GPT-5.6 Terra. That benchmark is private, has no public leaderboard, and is not one of our rows: a single vendor's private score is a reason to test, not a reason to move a production workload.
- **Pin the effort setting.** The API default is `medium`; the numbers OpenAI published are at max effort, and its chart shows a full ladder. A default request is not the thing that was measured.
- **Budget the long prompts separately.** Above 272,000 input tokens the rate doubles on input and goes up half again on output, for the whole request.

## Where to go next

- **The model page, with the two scores we hold** — [/models/gpt-6.1-terra](/models/gpt-6.1-terra)
- **Head to head with the flagship it costs a tenth of** — [/compare?a=gpt-6.1-terra&b=gpt-6-astra](/compare?a=gpt-6.1-terra&b=gpt-6-astra)
- **The line it belongs to, newest first** — [/series/gpt-6](/series/gpt-6)
- **Price your own traffic** — [Token Cost Calculator](/token-cost-calculator)
- **The model card — window, output ceiling, effort levels and cache-write rates** — https://developers.openai.com/api/docs/models/gpt-6.1-terra
- **The changelog entry that dates the release** — https://developers.openai.com/changelog
- **The source of this page** — OpenAI's launch post for GPT-6.1 Terra, with prices last verified on 2026-10-27.
