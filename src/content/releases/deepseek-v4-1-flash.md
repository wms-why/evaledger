---
title: "DeepSeek V4.1-Flash 0910: $0.30 / $1.20 at peak, and a cache read at 2% of input"
description: "DeepSeek V4.1-Flash 0910 — the 2026-09-10 launch checkpoint — costs $0.30 per 1M input and $1.20 per 1M output at peak, $0.15 / $0.60 off-peak, and reads cached input at $0.006, with 19 verified benchmark scores. The API now serves the newer 1017 checkpoint, tracked separately."
date: "2026-10-19"
checkedAt: "2026-10-20"
dataCheckedAt: "2026-10-24"
releasedAt: "2026-09-10"
vendor: deepseek
modelId: deepseek-flash-0910
modelSlug: deepseek-v4.1-flash
compareModelIds:
  - deepseek-v4-pro
compareSlugs:
  - gpt-5.6-sol
  - claude-opus-5
  - gemini-3.1-pro
  - kimi-k3
  - glm-5.3
sourceUrl: "https://mp.weixin.qq.com/s/qg0NU3NNUbp1co2PdkAPAg"
sourceTitle: "DeepSeek V4.1 Flash 发布公告"
published: true
---

## TL;DR

- **DeepSeek V4.1-Flash 0910 is $0.30 per 1M input and $1.20 per 1M output at peak, and $0.15 / $0.60 off-peak — exactly half. Released on 2026-09-10.**
- **The cache read is the standout: $0.006 per 1M at peak, $0.003 off-peak — 2% of the peak input rate.** A long, repeatedly re-read context costs almost nothing to re-read.
- **One of the cheapest models we track, with the widest score coverage we publish — 19 benchmarks.** All 19 come from a single provenance lane: the launch announcement's reference table, transcribed by us. The API has since moved on to the 1017 checkpoint at the same price; that checkpoint is tracked separately, with its own table and its own post.

## What shipped

- **A new Flash SKU with a two-tier daily clock.** Peak rates are $0.30 input / $1.20 output per 1M; off-peak rates are $0.15 / $0.60, exactly half. Cached input is $0.006 at peak and $0.003 off-peak.
- **The published schedule, exactly as it stands.** Mon–Fri (excluding Chinese public holidays), peak runs 01:00–04:00 and 06:00–10:00 UTC; off-peak is all other times. Weekends and Chinese public holidays are off-peak in full.
- **A 1,000,000-token context window** with no long-context surcharge tier on file.
- **Released on 2026-09-10**, from the launch announcement. This post covers that checkpoint — the 0910 one — because the scores below belong to it.
- **A sibling that costs several times more.** DeepSeek V4-Pro is $1.32 / $3.96 at peak, and $0.66 / $1.98 off-peak. Both models are active.

## What it costs

- **The hour you call at is worth a factor of two.** Peak is $0.30 / $1.20, off-peak is $0.15 / $0.60. The published peak window is 7 hours a day (01:00–04:00 and 06:00–10:00 UTC) on weekdays only — about a fifth of the week. Everything else is half price.
- **So the schedule is part of the pricing model.** Batch jobs, nightly summarisation, evaluation sweeps and any backfill: if they run outside those two UTC windows, they run at half price. On a Chinese public holiday the whole day is off-peak.
- **The cache read at $0.006 is 2% of the peak input rate** — a 98% discount. In an agent loop that re-reads the same context every turn, this is the line that decides the bill.
- **Against the sibling model, the gap is 3–4×.** V4-Pro is $1.32 / $3.96 at peak: 4.4× the input and 3.3× the output of V4.1-Flash. Both models halve off-peak ($0.66 / $1.98 for Pro), so the ratio holds in either period.
- **There is no long-context step to plan around.** The 1,000,000-token window is billed at the same rate as a short prompt, according to the source we hold.

## How it scores

- **This table describes the 0910 checkpoint, not the weights the API serves today.** The API moved to the 1017 checkpoint on 2026-10-17, at the same price, and that checkpoint publishes its own, different score table — tracked separately here: [/releases/deepseek-v4-1-flash-1017](/releases/deepseek-v4-1-flash-1017). Two checkpoints, two tables, never merged: the launch table measured the launch weights, and reading it as the current ones is exactly how a benchmark table gets misused.
- **Nineteen verified scores — the widest coverage of any model on our board.** But they all come from one place: the reference table in the DeepSeek V4.1 Flash launch announcement, captured on 2026-10-19. That makes them internally consistent and traceable, and it makes them a vendor claim rather than an independent re-run. We print the caveat with the numbers.
- **The notes travel with the figures.** HLE reads 36.8, and the source notes 39.1 on the text-only subset — so a model that only reports the text-only variant is not on the same footing. Codeforces is a rating, not a percentage, and should not be averaged with the rest.
- **Read the spread, not an average.** The 19 rows split into two groups. Knowledge and math sit high: GPQA Diamond 90.9, a Codeforces rating of 3471, MathArena Apex 65.6. The agentic and coding rows range much more widely: terminal-bench 2.1 at 90.6, but terminal-bench 4.0 at 31.2. The same family of tasks gets harder between versions 2.1, 3.0 and 4.0, and the score follows it down — that is the shape of the card, not a weakness in one column.
- **What the comparison rows show.** Against the flagship rows on the table — GPT-5.6 sol, Claude Opus 5, Gemini 3.1 Pro — V4.1-Flash leads the terminal-bench 2.1 column, but on terminal-bench 3.0 and 4.0 it is mid-pack rather than the leader. Against the Chinese-model rows it leads on terminal-bench 2.1 and 3.0, while GLM 5.3 is ahead of it on terminal-bench 4.0. Read the empty cells as "not reported", never as zero.
- **Coverage caveat:** the reference table does not cover every benchmark we track, so a blank cell is missing data, not a bad result.

## Should you switch?

- **If you are on a frontier flagship,** the price gap is 10–20×, so the question is not "is it as good" but "does the quality gap matter on this traffic". A split usually beats a switch: keep the flagship for the calls where a wrong answer is expensive, and move the volume to V4.1-Flash.
- **If you can schedule work, schedule it off-peak.** The off-peak rate halves everything. Moving a nightly job out of the two peak UTC windows is the cheapest optimisation available here, and it needs no code change beyond when the job starts.
- **If your workload re-reads the same context,** $0.006 per 1M cached makes the repeat reads almost free next to the rest of the table. That changes the design: long, stable context becomes viable instead of a liability.
- **If you need V4-Pro's quality,** note that Pro is 4.4× the input and 3.3× the output — the price gap is the smaller half of that decision, and the score table is the larger one.
- **If you are starting a new integration,** note that the API now serves the 1017 checkpoint, not this one. Same price, better scores — read that post before you pin anything.
- **What would change our recommendation:** an independent re-run of the 19 rows. Right now they are one announcement's table, transcribed by us. That is a legitimate source, and it is not the same thing as a third-party measurement.

## Where to go next

- **The successor checkpoint** — the 1017 weights the API serves today, with their own score table and analysis: [/releases/deepseek-v4-1-flash-1017](/releases/deepseek-v4-1-flash-1017)
- **DeepSeek pricing, in full** — the canonical page for V4-Pro, V4.1-Flash, the off-peak schedule and prompt-cache pricing: [/deepseek-api-pricing](/deepseek-api-pricing)
- **The model page, with all 19 scores** — [/models/deepseek-v4.1-flash](/models/deepseek-v4.1-flash)
- **Head to head with an OpenAI flagship** — [/compare?a=deepseek-v4.1-flash&b=gpt-5.6-sol](/compare?a=deepseek-v4.1-flash&b=gpt-5.6-sol)
- **Chinese models on one board** — [/best/chinese-model](/best/chinese-model), and the coding picks in [/best/for-coding](/best/for-coding)
- **Price your own traffic** — [/token-calculator](/token-calculator)
- **Source of truth for this page** — the DeepSeek V4.1 Flash launch announcement, with prices last verified on 2026-10-20.
