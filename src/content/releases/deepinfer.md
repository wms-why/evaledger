---
title: "DeepInfer: DeepSeek open-sourced the engine behind V4.1-Flash"
description: "DeepSeek open-sourced DeepInfer on 2026-10-20 under Apache-2.0: the engine behind V4.1-Flash, with a deployment walkthrough and framework comparison."
date: "2026-10-23"
checkedAt: "2026-10-23"
dataCheckedAt: "2026-10-24"
releasedAt: "2026-10-20"
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
sourceUrl: "https://github.com/deepseek-ai/DeepInfer"
sourceTitle: "deepseek-ai/DeepInfer — High-performance, large-scale inference framework for DeepSeek models"
published: true
---

## TL;DR

- **This is a release of the serving stack, not of the model.** On 2026-10-20 DeepSeek published DeepInfer, the inference framework behind its V4.1-Flash service, under Apache-2.0. The model, its price and its scores did not move. What became public is the engineering that makes $0.30 / $1.20 per 1M tokens possible at all.
- **The boundary matters more than the feature list.** DeepInfer ships the engine. It does not ship a KV cache cluster, prefill/decode disaggregation, or load balancing across replicas — the three pieces that turn an engine into a service. Self-hosting V4.1-Flash after this release still means building those yourself.
- **The gate is hardware, and it is narrow: NVIDIA SM100 or Huawei Ascend 950.** If your cluster is anything else, this release changes nothing about what you can run. It also does not change your API bill by a cent.

## What shipped

- **A serving framework, not a model.** `deepseek-ai/DeepInfer`, Apache-2.0, published on 2026-10-20. It is the framework DeepSeek runs in production behind V4.1-Flash, released as an offline inference engine.
- **Exactly one model.** DeepSeek-V4.1-Flash, defaulting to the 1017 checkpoint on Hugging Face. Not a general-purpose engine that happens to run DeepSeek models — an engine built for one architecture.
- **Two accelerator families.** NVIDIA SM100 GPUs and Huawei Ascend 950 NPUs, with CUDA 13 and CANN 9.2 respectively. That is the entire supported list.
- **The features that actually decide throughput are all here.** Fused kernels (FlashMLA, DeepGEMM, DeepEP, TileKernels, DeepSelect and custom TileLang kernels), expert parallelism with an expert-parallel load balancer, DSpark speculative decoding with confidence-scheduled verification, SWA bounded replay to cut decoder prefill work, a zero-overhead asynchronous batch scheduler, batch-invariant inference, deterministic sampling, and structured outputs compiled to a grammar automaton.
- **It stands on the stack it now competes with.** DeepInfer's own README says it was built primarily on vLLM, with additional inspiration from SGLang and TensorRT-LLM. That is the honest provenance, and it sets the comparison: this is a fork lineage tuned to one model, released into an ecosystem of general engines.
- **What is not in the box, in DeepSeek's own words:** a KV cache system, vision-encoder/prefill/decode disaggregation, and load balancing across data-parallel replicas for prefill and decode. The framework's `LLMEngine` docstring is equally direct — the release does not include an online-serving wrapper.
- **A companion codec.** `deepseek-recipe`, open-sourced the same day, converts between the Chat Completions, Responses and Messages APIs and DeepSeek's token sequences, with the same encoding logic the official API uses. It is what makes a third-party deployment behave like the official one.
- **The line continues.** DeepSeek says inference code for future models, and subsequent performance work, will land in this repository.

## What it costs

- **The license is free and the model's price is untouched.** DeepInfer is Apache-2.0. V4.1-Flash still bills $0.30 per 1M input and $1.20 per 1M output at peak, $0.15 / $0.60 off-peak, and $0.006 for a cached input read — $0.003 off-peak — with a 1,000,000-token window and no long-context tier to plan around.
- **So if you call the API, this release does not change your bill.** Not the rate, not the endpoint, not the checkpoint. The 1017 weights were already what the API serves, and the framework that serves them was already running. You now know what it is.
- **The cost it does explain is the one inside the price.** DeepSeek reports a single cluster serving 155 trillion tokens a day through this framework. That number — not the weights alone — is what sits under a rate 13× to 21× below GPT-5.6 sol and Claude Opus 5. Reading this release as a bill change is the wrong read; reading it as the cost structure behind a bill you already pay is the right one.
- **Against DeepSeek's own Pro tier, Flash is still 4.4× on input and 3.3× on output** — $1.32 / $3.96 at peak for V4-Pro, halving off-peak exactly as Flash does. DeepInfer does not close that gap. It is the engine for the volume line, not a reason to move up or down it.
- **Against the frontier, self-hosting does not change the price of anything.** GPT-5.6 sol is $4 / $20 through 2026-11-21 and $5 / $30 after, Claude Opus 5 is $5 / $25. What DeepInfer changes is not those rates — it is whether you have a credible way to serve the cheap one on your own hardware.
- **The budget that does move is hardware plus headcount.** The framework is free; the accelerators are not, and the service layer you have to write is a project, not an afternoon. DeepSeek's own deployment notes put the smallest *efficient* unit at 64 GPUs of prefill plus 64 GPUs of decode, with a 1:1 prefill-to-decode ratio in practice. A single prefill-plus-decode pair is deployable and will not be efficient.

## How it scores

- **A framework has no benchmark scores, and this page is not going to invent any.** Our board ranks models on accuracy: GPQA, HLE, Terminal-Bench, DeepSWE, and so on. DeepInfer is not on it and never will be, because the thing DeepInfer optimises is throughput and latency, not correctness.
- **The score table above is the checkpoint's, unchanged.** It comes from the 1017 launch table and it did not move because a serving framework shipped. If you are here for "did the model get better", the answer is no: this release did not re-measure the model, and we will not pretend a numbers row moved.
- **What DeepInfer publishes instead is a Pareto chart, not a score.** Prefill throughput against latency for non-cached input, and decode output throughput against per-user speed, measured on 4 SM100 GPUs for prefill and 64 for decode, each within one scale-up domain. The sweep script is in the repository, which is more reproducible evidence than a launch table usually offers.
- **Behind those curves is a set of engineering claims the deployment notes do state:** variable-length speculative verification cuts the draft tokens verified per step by about 30% while leaving the accepted length essentially unchanged, worth roughly 4–7% more throughput at the production operating point; load balancing reaches about 80% of a perfectly balanced offline benchmark; KV cache retention is targeted past 72 hours, with a 3-day TTL for agent traffic and 7 days for chatbot traffic.
- **Treat all of it as vendor-measured on vendor hardware.** That is not a dismissal — it is the same caveat we attach to vendor benchmark tables. On a framework, the caveat bites harder, because throughput depends on cluster topology, interconnect and batch shape, and none of those travel with the number.

## Running it

- **Prerequisites, from the repository:** Linux, GCC >= 13.0, Python 3.12 in a clean environment, CUDA 13 on the NVIDIA path and CANN 9.2 on the Ascend path. There is no pip install — you build it.
- **Build and run the offline example:**

```
git clone --recurse-submodules https://github.com/deepseek-ai/DeepInfer.git
cd DeepInfer
export DEEPINFER_ACCELERATOR=nvidia   # or: ascend
./build.sh

python examples/offline_inference.py --ep 8
```

- **Point it at a local copy of the weights** instead of letting it download the default checkpoint into the Hugging Face cache:

```
export DEEPINFER_HF_MODEL_DIR=/path/to/DeepSeek-V4.1-Flash-1017
python examples/offline_inference.py --ep 2 --dp 8
```

- **The three shipped configurations map to three different bottlenecks.** `--ep 8` is the starting point for expert parallelism; `--ep 2 --dp 8` spreads requests across data-parallel replicas; `--ep 2 --cp 8` shards a long context across ranks. Prefill deployments run narrow — expert parallelism and data parallelism in the single digits — while decode runs wide, because that is where per-step memory traffic in the MoE experts dominates.
- **The feature switches are environment variables**, which is worth knowing before you plan a rollout: speculative decoding, SWA replay truncation, batch invariance and deterministic sampling are all toggled by name, and batch invariance plus deterministic sampling are NVIDIA-only.
- **What you end up with is a batch engine.** Not an endpoint. If you want an OpenAI-compatible service in front of it, the KV cache layer, the prefill/decode split and the load balancer are yours to build — DeepSeek's own notes say most of the engine functionality for disaggregation is implemented, but the components themselves are not in this release.

## Choosing an engine

- **The honest summary is that this release is for a small number of teams.** DeepInfer is the right answer only when both conditions hold: you have SM100 or Ascend 950, and you specifically want to serve V4.1-Flash. For everyone else the general engines are still the practical choice.

| Engine | What it is | Its gate | Pick it when |
| --- | --- | --- | --- |
| DeepInfer | DeepSeek's own engine, open-sourced | SM100 or Ascend 950, one model | You have the hardware and want the vendor's kernels |
| vLLM | The general-purpose baseline, OpenAI-compatible | Widest hardware support | You need many models and the least operational risk |
| SGLang | Throughput engine with a prefix-reuse cache | Mostly NVIDIA and AMD | Repeated shared prefixes dominate your traffic |
| TensorRT-LLM | NVIDIA's compiled engine | NVIDIA only, engine build step | A fixed model, a fixed cluster, throughput at any cost |
| LMDeploy | Lightweight, strong on the Qwen and InternLM families | NVIDIA and Ascend | A smaller mixed stack, often in China |
| MindIE | Huawei's own Ascend serving stack | Ascend only | You are committed to Ascend and want the vendor stack |

- **We have not benchmarked any of these engines**, and no row in that table is a measurement. It is a map of constraints — hardware first, model second, service layer third — and it is the order the decision actually wants.
- **The interesting line in the comparison is the provenance one.** DeepInfer thanks vLLM, SGLang and TensorRT-LLM because it is downstream of them. That makes the next year's question concrete: does DeepSeek's per-model optimisation produce numbers the general engines cannot reach, or does the ecosystem absorb the same ideas a quarter later, as it has every time so far? This release does not answer that. It sets up the test.

## Should you switch?

- **If you call the DeepSeek API, there is nothing to switch.** The endpoint, the price and the checkpoint are all unchanged. Read the release as documentation of the stack you are buying, and it is unusually good documentation.
- **If you are on SM100 and already self-host a DeepSeek checkpoint, this is the only engine worth benchmarking this quarter.** Build it, run the sweep script on your own shape, and compare against whatever you run today. Reproduce the curve rather than reading theirs.
- **If you are on Hopper or any other NVIDIA generation, this release does not help you.** Hopper is not on the supported list. Keep the engine you run — vLLM or SGLang will serve V4.1-Flash today, and the 1017 weights are open, so the question was never availability.
- **If you are choosing an engine for a multi-model platform, do not start here.** One model, two accelerators, no service layer. Start with the general engine that matches your hardware, and revisit DeepInfer when a second model lands in the repository.
- **If what you actually wanted was a cheaper bill, the lever is the rate card, not the framework.** Off-peak scheduling halves V4.1-Flash, and a cached input read is $0.006 against a $0.30 input rate. That is a bigger saving than any serving optimisation, and it is available on the API today without a cluster.

## Where to go next

- **The checkpoint this serves** — every score we hold for the 1017 weights: [/models/deepseek-v4.1-flash-1017](/models/deepseek-v4.1-flash-1017)
- **The model's own launch analysis** — what changed in 1017 and whether the switch is worth it: [/releases/deepseek-v4-1-flash-1017](/releases/deepseek-v4-1-flash-1017)
- **The price card in full** — peak, off-peak and cache rates, with the dated bands: [/deepseek-api-pricing](/deepseek-api-pricing)
- **Head to head against the frontier** — [/compare?a=deepseek-v4.1-flash-1017&b=gpt-5.6-sol](/compare?a=deepseek-v4.1-flash-1017&b=gpt-5.6-sol)
- **Price your own traffic** — [Token Cost Calculator](/token-cost-calculator)
- **Source of truth for this page** — the DeepInfer repository, re-checked on 2026-10-23. Prices come from the DeepSeek pricing page, verified 2026-10-20.
