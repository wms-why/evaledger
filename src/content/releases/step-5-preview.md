---
title: "Step 5 Preview: StepFun's first flagship, at $1 / $2.70"
description: "StepFun's Step 5 Preview costs $1 per 1M input tokens, $0.10 per 1M cached, and $2.70 per 1M output with the reasoning trace billed as output, over a 1M-token window. On StepFun's own table it trades rows with Kimi K3 and GLM 5.3 and trails GPT-6 Astra and Claude Opus on the hardest agentic coding rows — the pitch is cost, not the top line."
date: "2026-10-23"
checkedAt: "2026-10-23"
dataCheckedAt: "2026-10-23"
releasedAt: "2026-09-20"
vendor: stepfun
modelId: step-5-preview
modelSlug: step-5-preview
compareModelIds:
  - gpt-6-astra
  - claude-opus-5.5
  - gemini-4-argon
  - deepseek-flash
compareSlugs:
  - gpt-6-astra
  - claude-opus-5
  - claude-opus-5.5
  - gemini-4-argon
sourceUrl: "https://www.stepfun.com/step-5-preview"
sourceTitle: "StepFun — Step 5 Preview: Advancing the Pareto Frontier"
published: true
---

## TL;DR

- **$1 / $2.70 per 1M tokens, $0.10 on a cache hit.** That output price is a fraction of what the western flagships charge for the same job, which is the entire argument StepFun makes: comparable intelligence, a much smaller task bill. Cost, not capability, is what this row is for.
- **The scores sit in the Chinese open-weight first tier, not at the top.** On StepFun's own table Step 5 Preview trades rows with Kimi K3 and GLM 5.3 and trails GPT-6 Astra and Claude Opus on terminal and long-horizon coding. Buy it for price and throughput, not for the tallest bar.
- **"Preview" is literal.** The id is `step-5-preview`, the weights only landed on 2026-10-15, and there is no technical report. The price, the behaviour and the availability can all move — pin the exact id and re-check the price before you put a forecast on it.

## What shipped

- **One flagship SKU, `step-5-preview`.** Live since 2026-09-20 on an OpenAI-compatible chat completions endpoint, and on OpenRouter as `stepfun/step-5-preview` at the vendor's list price. A Messages-style endpoint is documented alongside it.
- **A 600B-parameter sparse mixture of experts with 27B active per token.** A 1M-token input window, a 64k output cap, text, image and video input, and three reasoning-effort levels (low, medium, high) set per request.
- **Long-horizon work is the claim.** StepFun's launch page leads with three clocked experiments — optimising an MLA kernel on an H100 for a day, automated post-training of a smaller base model, and thousands of turns of Pokemon Red — rather than with single-question accuracy. What those measure is whether the model keeps going without falling over.
- **The weights are out, with conditions.** BF16, FP8 (gated behind approval) and NVFP4 checkpoints are on Hugging Face under StepFun's own Model License 1.0: free use and redistribution, with a commercial licence required above the traffic or revenue thresholds, or when reselling it as a hosted model.

## What it costs

- **One billing unit: tokens.** Input is split into cache miss and cache hit; output includes the reasoning trace; there is no separate long-context surcharge band. For agent workloads with a large, stable prefix, the cache-hit rate is the price you actually pay most of the time.
- **Cache writes are bundled.** StepFun counts writing new content into the cache inside the cache-miss input price, so there is no fourth fee to model the way Anthropic's cache-write tier forces you to.
- **Compare like with like.** The table above puts the models you are weighing side by side with their context windows and the date each price was verified. A flagship with a 400K window and a flagship with a 1M window are not the same product per token.
- **Output is where the bill is.** Code, long documents and agent trajectories are output-heavy. When output dominates a task, the levers are the output rate and the length of the reasoning trace, not the input rate.

## How it scores

- **There is one table, and the vendor made it.** Every Step 5 Preview score comes from StepFun's launch page. No independent harness has reproduced those rows yet, and the rival columns are StepFun's measurements of other vendors' models — quoted here as such, never as ours.
- **The effort setting is not matched.** Step 5 Preview ran at High while the rival columns ran at Max. That difference can make a row look closer, or further, than a mode-matched run would; read a one-to-two-point gap with care.
- **Only the rows with a benchmark id are listed.** SWE-Marathon, StepCodeBench, GDPval-AA, GDP.pdf and the FinStepBench suites have no equivalent in our benchmark registry, so they are absent rather than mapped onto something they are not.
- **It does not enter the ranked board yet.** Our boards only rank a model that has every core benchmark of a track. Step 5 Preview has scores on some of them, so it is listed as untested with each missing row named — never averaged over the ones it happens to have.

## Should you switch?

- **Output-heavy, long-running agents: worth a test.** In a workload that fires hundreds of tasks a day, the gap between this output rate and a flagship's compounds into the invoice. That is the strongest case for it.
- **Work that lives on the hardest benchmark rows: not yet.** On terminal and repository-level repair it is not at the top. If your task sits right at the difficulty frontier, the extra turns can eat the savings.
- **Teams that need a stable id: hold.** A preview model can change weights and price under the same name. If you adopt it, pin the id and check this page's verification date on a schedule.
- **Teams that want to self-host: the weights are there now.** The minimum deployment footprint is in the model card — but that is a fixed cost. It pays back against sustained load, not against a per-token comparison.

## Where to go next

- Run your own numbers through the calculator: fill in input, output and your cache-hit share, and read the monthly delta against another flagship.
- Use a head-to-head comparison to put Step 5 Preview next to any model on this site — prices and scores both come from the same registry this page does.
- Read the sibling launch analyses for the flagships that shipped in the same window; their price structures differ, and the difference is the decision.
