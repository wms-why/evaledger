---
title: "DeepSeek V4.1-Flash 1017: the same $0.30 / $1.20 price, a much better checkpoint"
description: "DeepSeek V4.1-Flash 1017 (2026-10-17) keeps the $0.30 / $1.20 peak price and the $0.006 cache read, and publishes 11 new benchmark scores. Here is what changed, what it costs, and whether you should switch."
date: "2026-10-20"
checkedAt: "2026-10-20"
dataCheckedAt: "2026-10-24"
releasedAt: "2026-10-17"
vendor: deepseek
modelId: deepseek-flash
modelSlug: deepseek-v4.1-flash-1017
compareModelIds:
  - deepseek-v4-pro
compareSlugs:
  - deepseek-v4.1-flash
  - kimi-k3
  - glm-5.3
  - gpt-5.6-sol
  - claude-opus-5
sourceUrl: "https://api-docs.deepseek.com/news/news261017/"
sourceTitle: "DeepSeek-V4.1-Flash-1017: Wish-Driven Programming Made Real"
published: true
---

## TL;DR

- **The price did not move. The checkpoint did.** DeepSeek V4.1-Flash 1017 still bills $0.30 per 1M input and $1.20 per 1M output at peak, $0.15 / $0.60 off-peak, and $0.006 for a cached input read — exactly the card the 0910 launch published. There is no budget conversation attached to this release.
- **What you get for that same price is a materially better agent.** Eleven benchmark scores, all from the 1017 announcement's own table, and that table re-states the previous checkpoint's column, so the upgrade can be read directly instead of inferred.
- **So for agent and coding traffic the switch is free; for a frontier flagship it is still not a replacement.** GPT-5.6 sol sits at $4 / $20 — a promotional rate through 2026-11-21, when it goes to $5 / $30 — and Claude Opus 5 at $5 / $25 — an order of magnitude above Flash in either period. The 1017 checkpoint closes more of the quality gap than the 0910 one did, not all of it.

## What shipped

- **A rolling checkpoint behind one API model name.** The endpoint is still `deepseek-flash`, and the legacy aliases `deepseek-v4-flash` and `deepseek-v4-flash-vision-exp` are still accepted, routed to the new checkpoint and billed at the Flash price. Nothing changes in your client. The web app and the mobile app moved too.
- **The weights are open.** Hugging Face and ModelScope both carry `deepseek-ai/DeepSeek-V4.1-Flash-1017`, so you can pull the exact checkpoint the API is serving and run it yourself.
- **Training moved to reinforcement learning with self-feedback**, aimed at end-to-end project building — game creation, 3D modelling — with fewer prompt turns. The vendor reports shorter outputs and faster task completion than the previous checkpoint, and calls it a Pareto improvement in performance and cost. Its DeepSWE v1.1 chart shows the same or a better pass rate at a fraction of the per-task cost; read that cost half as a direction, not as a line on your bill.
- **Tuned for the harnesses people actually run in:** DeepSeek Harness, Tencent CodeBuddy and WorkBuddy. DeepSeek Harness 0.2.1-rc.1 or later is recommended for the best experience with the new model.
- **The price card is untouched.** $0.30 / $1.20 at peak, $0.15 / $0.60 off-peak, cached input $0.006 at peak and $0.003 off-peak, a 1,000,000-token context window, and no long-context surcharge tier on file.
- **Side note:** the same announcement opened DeepSeek's own Search & Fetch APIs to everyone, priced per 1,000 calls, and free for API users through server-side tools until Oct 31, 2026 16:00 UTC.

## What it costs

- **The headline is that it costs what it cost last month.** Put this next to [the 0910 launch post](/releases/deepseek-v4-1-flash): the card is identical, because the checkpoint improved and the price did not. For a team that already routes agent traffic to Flash, this is a free upgrade; for a team that wanted a reason to move, the reason is now the model rather than the money.
- **The off-peak clock is still the cheapest lever you have.** Peak runs 01:00–04:00 and 06:00–10:00 UTC on weekdays only, excluding Chinese public holidays — roughly a fifth of the week at $0.30 / $1.20, and half price for everything else at $0.15 / $0.60. Batch jobs, nightly summaries and evaluation sweeps that start outside those two windows are billed at half the rate, and a Chinese public holiday is off-peak all day.
- **Cache aggressively; the read is 2% of the peak input rate.** $0.006 per 1M cached input, $0.003 off-peak, means an agent loop that re-reads the same context every turn stops paying for those turns again. In long-context workloads this is the line that decides the bill, and the new checkpoint did not make it worse.
- **Against DeepSeek's own Pro tier the gap is still about 4× on input and about 3× on output**, in either period, because both models halve off-peak. If Pro's quality is what you need, this release does not change that conversation — it only changes what you get on the cheap row.
- **Against a frontier flagship the gap is still an order of magnitude.** GPT-5.6 sol is $4 / $20 (promotional, through 2026-11-21; $5 / $30 from 2026-11-22) and Claude Opus 5 is $5 / $25, against Flash at $0.30 / $1.20 peak and $0.15 / $0.60 off-peak. The new checkpoint makes Flash a better value, but it does not turn a $0.30 line item into a $4 one.
- **There is no long-context step to plan around.** The 1,000,000-token window is billed at the same rate as a short prompt.

## How it scores

- **Eleven benchmarks, one vendor announcement.** This is the 2026-10-17 release table, transcribed by us: internally consistent and traceable, but a vendor measurement rather than an independent re-run. Read it as what DeepSeek reports for its own model, not as a leaderboard verdict.
- **The table restates the previous checkpoint in its second column,** so you can read 1017 straight against 0910 instead of stitching two tables together. Terminal-Bench 4.0 goes from 31.2 to 42.3, DeepSWE v1.1 from 74.2 to 77.0, ProgramBench from 20.3 to 29.1, NL2Repo-Bench from 65.4 to 68.2, Automation-Bench from 54.8 to 60.5, and Agents' Last Exam from 31.8 to 35.4. Those are the rows where an agent team should feel the difference.
- **Know the harness before you compare the rows.** Terminal-Bench 4.0 was measured with the Claude Code framework, DeepSWE v1.1 with Mini-SWE-V2, and ZeroBench-main is a Pass@5 number — so none of those three can be lined up against a figure produced on a different harness. HLE reads 42.6, and the source also prints 44.0 on the text-only subset, which means a model that reports only the text-only variant is not standing on the same line.
- **Do not confuse the two Apexes.** The 72.1 here is Apex Bench v1.1 — a different benchmark from MathArena Apex. Two different tests that happen to share a name.
- **The tool-use rows are where the checkpoint is strongest:** Chartography (w/tools) 83.0, BabyVision (w/tools) 92.5, ZeroBench-main (w/tools) 51.0.
- **What the comparison rows say.** On Terminal-Bench 4.0 the new checkpoint is ahead of GLM 5.3 at 37.9 and Kimi K3 at 12.6, and level with GPT-5.6 sol at 39.9 — but well behind Claude Opus 5 at 51.8. On HLE it reads 42.6 against Kimi K3's 43.5, GPT-5.6 sol's 44.5 and Claude Opus 5's 56.3. Read an empty cell as "not reported", never as zero.
- **Coverage caveat:** the 1017 table does not cover every benchmark we track — the GPQA, Codeforces, MathArena and CyberGym columns are simply absent from it. A blank cell is missing data, not a bad result.

## Should you switch?

- **If you run agents or coding traffic on Flash today, you have already switched.** The API serves the 1017 checkpoint under the same model name, so there is no migration, no new endpoint and no new price — what changes is the quality of what comes back. The work is auditing your own prompts, not your integration.
- **If you are on a frontier flagship, the price gap is still an order of magnitude.** Keep the flagship where a wrong answer is expensive, and move the volume to Flash where a retry is cheap. The 1017 checkpoint makes that split easier to defend than it was a month ago.
- **If you can schedule work, schedule it off-peak.** Halving the bill on batch and eval traffic needs nothing but a different start time.
- **If you re-read the same context, cache it.** $0.006 per 1M cached input turns long, stable context from an expensive liability into a cheap design choice.
- **If you self-host, this is the first time you can evaluate the exact weights.** The checkpoint on Hugging Face and ModelScope is the one the API is serving, so you can reproduce the numbers yourself before you move production traffic.
- **What would change this recommendation:** an independent re-run of the same eleven benchmarks by a third party, on a common harness. Right now the table is one vendor's own numbers, and the cost half of the Pareto claim comes from the same vendor's chart. If an outside harness reproduces the Terminal-Bench and DeepSWE gains, this becomes the default choice for agent traffic; if it does not, the price still stands and you should measure before you move.

## Where to go next

- **The model page** — [/models/deepseek-v4.1-flash-1017](/models/deepseek-v4.1-flash-1017)
- **The 0910 launch post** — what the API served before this checkpoint, with its 19 benchmarks: [/releases/deepseek-v4-1-flash](/releases/deepseek-v4-1-flash)
- **Head to head with GPT-5.6 sol** — [/compare?a=deepseek-v4.1-flash-1017&b=gpt-5.6-sol](/compare?a=deepseek-v4.1-flash-1017&b=gpt-5.6-sol)
- **DeepSeek pricing in full** — the off-peak schedule, cache pricing and V4-Pro: [/deepseek-api-pricing](/deepseek-api-pricing)
- **Price your own traffic** — [/token-calculator](/token-calculator)
- **Source of truth for this page** — the DeepSeek-V4.1-Flash-1017 announcement, with prices last verified on 2026-10-20.
