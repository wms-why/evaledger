---
title: "Gemini 4 Argon: $2 / $10 per 1M until November 30, then $4 / $20"
description: "Google's Gemini 4 Argon costs $2 per 1M input and $10 per 1M output until 2026-11-30, then $4 / $20 — exactly what Claude Opus 5.5 costs today. A 1,048,576-token window with no long-context step, and ten verified scores out of Google's own nineteen-row evaluation table."
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

## TL;DR

- **Gemini 4 Argon is $2 per 1M input and $10 per 1M output until 2026-11-30, then $4 / $20.** The cached read is $0.10 today and $0.20 after. The second price is not a small adjustment — it is exactly what Claude Opus 5.5 costs right now. So the promotion is the switch decision: until 2026-11-30, Argon is the cheapest of the three frontier flagships, and from December it is a price-for-price twin of Anthropic's.
- **The window is one pool, and the price does not step with the prompt length.** 1,048,576 tokens shared across input, thinking and output, with no >200K tier at all. Gemini 3.1 Pro and Gemini 2.5 Pro both double their input rate above 200,000 tokens; Argon publishes no such row, so a 900,000-token prompt costs the same per token as a 100-token one.
- **Google's own table reads 13 wins, 1 tie, 5 losses.** DeepSWE v1.1 77.9 and the Vals Index 68.9 are the wins; Terminal-bench 4.0 57.4 and FrontierSWE v2 55.0 are the losses. Read the harness notes before the ranking — three of the five losses sit in rows where Google ran Argon itself and took the rivals from somewhere else.

## What shipped

- **A new flagship SKU with one stable id.** `gemini-4-argon`, generally available on 2026-10-13 after a limited preview that opened to Fairwind security defenders on 2026-09-29. Paid API tier only — Google publishes no free tier for it — plus AI Studio, Gemini for business and the Gemini app.
- **The output ceiling is the headline for anyone running long jobs.** One synchronous request returns up to 65,536 output tokens, and long decode stretches that to the full 1,048,576-token pool minus whatever the prompt already used.
- **Google promised the rest of Gemini 4 and shipped only Argon.** The launch post ends by promising the rest of the family. Argon is the first member of a line, and today the only one you can call.
- **Thinking is a dial you have to turn.** The API default is `medium`, with `low` and `high` available. Google's benchmark table used the highest setting on both sides, so the published numbers are ceilings, not what a default request returns.
- **Caching is implicit only.** `cachedContents` and `caches.create` are not supported on Argon; the 95% cache-hit discount applies automatically to prompts of at least 4,096 tokens.

## What it costs

- **Today, Argon is the cheapest of the three frontier flagships.** $2 / $10 — an introductory rate that runs until 2026-11-30 — against Claude Opus 5.5's $4 / $20 and GPT-6 Astra's $10 / $50: 5× cheaper than Astra on both lines, half of Opus 5.5 on both. From 2026-12-01 that edge is gone — $4 / $20 is half of Astra and exactly Opus 5.5's rate.
- **Google's own previous Pro is the awkward comparison.** Gemini 3.1 Pro Preview is $2 / $12, so on today's introductory rate Argon matches its input price and gives up $2 on output. But Argon has no >200K step and a 1,048,576-token pool, against Pro's 1,000,000 and a doubled rate above 200,000 tokens.
- **The cached read is $0.10 until 2026-11-30, then $0.20 — 5% of the input rate either way.** Same 95% discount Google advertises, and the number that matters if your traffic repeats prompts.
- **Then the cliff.** On 2026-12-01 the rate becomes $4 input, $20 output, $0.20 cached. Those are Opus 5.5's current numbers to the cent, which is a useful way to hold the promotion: in December you are not saving 50% against Anthropic, you are saving nothing.
- **Batch and Flex run at half the standard rate; Priority runs at 1.8×.** The calculator prices the standard tier, which is what interactive traffic is billed on.
- **Thinking tokens are billed as output.** Google prices that line "including thinking tokens", so a reasoning-heavy prompt pays twice — once for the tokens you asked for, once for the ones the model thought with.

## How it scores

- **Thirteen wins, one tie, five losses, out of nineteen** — counted against the best of the three rivals Google measured. Wins on the Vals Index (68.9, against 63.1 for Astra and 67.0 for Opus 5.5), AutomationBench (51.3 against 41.4 and 42.5), DeepSWE v1.1 (77.9 against 74.1 and 74.2), GraphWalks in the 256k-1M band (84.2 against 71.8 and 66.8) and the Agent's Last Exam (39.5 against 34.2 and 38.2). A tie on CWE-bench v1 at 68.0. Losses on FrontierSWE v2 (55.0 against 65.5 and 62.3), Terminal-bench 4.0 (57.4 against 58.2 and 66.4), PostTrainBench, Terminal-Bench Science, and OSWorld-2.0 (69.2 against 72.6).
- **Agentic coding splits 2-2.** Argon wins DeepSWE and Vibe Code Bench and finishes last of four on FrontierSWE v2 and Terminal-bench 4.0. If your workload is "long autonomous coding runs against a real repository", this table does not hand you an answer.
- **Read the harness, not the score.** Google's methodology says every Argon number is pass@1 at the highest thinking setting, and that the rival figures are either the providers' own numbers or a public leaderboard's. Three of Argon's five losses sit in rows where Google ran Argon itself and took the rivals from elsewhere. Where one body scored everyone — FrontierSWE v2 is such a row — Argon is genuinely last.
- **Google and Anthropic disagree about the same rows.** On Terminal-bench 4.0 Google's table puts GPT-6 Astra at 58.2 while OpenAI's own number is 57.9; on AutomationBench Google puts Opus 5.5 at 42.5 while Anthropic's own post says 40.0. That is not a rounding artefact — it is two vendors measuring the same benchmark differently, and it is the strongest reason not to treat any single column as truth.
- **Two traps live inside the numbers.** AutomationBench 51.3 is Zapier's private set — it is not AutomationBench-AA 77.5, and the two must never be compared. And Chartography 71.6 is the run without tools: our tool-assisted entry is a different configuration, where Opus 5.5 scores 89.0 against Google's 66.3 here.
- **The DeepSWE row mixes three harnesses.** Argon's 77.9 is self-computed on a mini-swe agent; Astra's 74.1 comes from the public leaderboard and the Claude numbers from their system cards. It is still the headline coding win, but it is not a like-for-like run.

## Should you switch?

- **If you run on Gemini today, the switch is easy and the reason is price structure, not intelligence.** Gemini 3.1 Pro Preview is $2 / $12 with a rate that steps above 200,000 tokens; Argon is $2 / $10 on today's introductory rate with no step and a 1,048,576-token pool. Long-context traffic gets the bigger win: Pro's step costs twice the input rate and 1.5× the output rate, and Argon's rate does not step with the prompt length.
- **If you run on Claude Opus 5.5, the promotion decides.** Until 2026-11-30 you pay half on both input and output. From 2026-12-01 you pay the same as Opus 5.5, and the reason to move becomes the 1,048,576-token pool, the longer output ceiling and the benchmark card — not the invoice.
- **If you run on GPT-6 Astra, you get 5× on price through 2026-11-30 and a mixed card.** Argon leads on DeepSWE, AutomationBench, the Vals Index and long-context retrieval; it trails on Terminal-bench 4.0, FrontierSWE v2 and OSWorld-2.0. At a fifth of the price the card only has to be close — and from 2026-12-01 the price gap narrows to 2.5×.
- **If you run on DeepSeek V4.1-Flash, Argon is not a budget move.** DeepSeek is still 6.67× cheaper on input and 8.33× cheaper on output while Argon is on its introductory rate — from 2026-12-01 those become 13.33× and 16.67× — and it wins AutomationBench 60.5 to 51.3 — two different measurement sets, DeepSeek's announcement table and Zapier's public leaderboard, so read that gap as directional. Argon wins DeepSWE 77.9 to 77.0. That is a quality-per-dollar argument, not a savings argument.
- **Do not build a twelve-month forecast on $2 / $10.** The published rate for the rest of the launch's life is $4 / $20, from 2026-12-01. Model the standard rate and treat the promotion as a discount with an expiry date.
- **Budget for the thinking tokens.** Output includes thinking, so an agent that thinks more is not the same workload as one that does not — and Priority changes that arithmetic again.
- **Pin the model id and the thinking level.** `gemini-4-argon` is a stable id, but the default is `medium` and Google's own numbers were produced at `high`. If you are reproducing a benchmark, you are not reproducing the default.

## Where to go next

- **The model page, with every score we hold** — [/models/gemini-4-argon](/models/gemini-4-argon)
- **Head to head with the flagship it beats on DeepSWE** — [/compare?a=gemini-4-argon&b=gpt-6-astra](/compare?a=gemini-4-argon&b=gpt-6-astra)
- **Google's evaluation methodology — the source of every score and caveat above** — https://deepmind.google/models/evals-methodology/gemini-4-argon
- **The model card** — https://deepmind.google/models/model-cards/gemini-4-argon/
- **The API pricing page** — https://ai.google.dev/gemini-api/docs/pricing
- **Price your own traffic** — [/token-calculator](/token-calculator)
