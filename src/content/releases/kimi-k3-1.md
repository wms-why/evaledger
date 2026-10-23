---
title: "Kimi K3.1: the name is confirmed, the model is not"
description: "Moonshot's official teaser prints \"model: kimi k3.1\" in the Kimi Code banner, and an anonymous model called Kibitz is running in Arena. There is still no model card, no API id and no price — so this page carries no price table and no score table, and is rewritten the day the model ships."
date: "2026-10-23"
checkedAt: "2026-10-23"
dataCheckedAt: "2026-10-23"
vendor: kimi
pending: true
modelId: kimi-k3.1
modelName: "Kimi K3.1"
compareSlugs:
  - kimi-k3
publishedNumbers:
  - 2.8
videoSrc: "/media/kimi-k3-1-teaser.mp4"
videoPoster: "/media/kimi-k3-1-teaser.jpg"
videoCaption: "The official teaser, 24 seconds. A Kimi Code banner that reads model: kimi k3.1, the prompt asking for a procedural Three.js scene, and the render it produced. No caption, no date, no specification."
sourceUrl: "https://x.com/Kimi_Moonshot/status/2113445757185606062"
sourceTitle: "Kimi on X — the Kimi K3.1 teaser video (2026-10-23)"
published: true
---

## TL;DR

- **On 2026-10-23 Moonshot's official account posted a 24-second teaser.** It is styled like a retro computer terminal, the Kimi Code banner inside it reads `model: kimi k3.1`, and the model is writing Three.js code for a procedural 3D scene — then rendering it. The name is now confirmed by the vendor's own product surface, not by a leak.
- **The model is already being tested in the open, under a codename.** An anonymous model called `Kibitz` is running in Arena, and developers have matched its tokenizer to K3.1. That is the pattern Moonshot used for K3: anonymous arena first, teaser second, launch a few days later.
- **Nothing else is confirmed, and this page says so by omission.** There is no model card, no API model id, no price and no benchmark set. So there is no price table and no score table here, and the article is not allowed to quote a price or a score. When Moonshot ships, this page is rewritten in place with the live figures.

## What is confirmed

- **The video's contents, frame by frame.** A retro CRT terminal opens with a Kimi Code banner: working directory, `model: kimi k3.1`, and `thinking: high` in the status bar. The prompt typed into it is *"Build a complex procedural 3D scene in Three.js."* The clip then cuts to what that prompt produced — a particle nebula that resolves into a rendered architectural scene inside a Three.js preview pane, with the generated code scrolling in an editor beside it. There is no spoken or written claim anywhere in the clip: no parameter count, no context window, no date.
- **Read the banner's version line carefully.** The terminal prints a Kimi Code *client* build number right next to the model name. That number belongs to the CLI, not to K3.1 — the two sit on adjacent lines and are easy to conflate into a model version.
- **K3.1 is in Arena under the codename `Kibitz`.** The anonymous entry appeared on 2026-10-23 and developers matched its tokenizer and other fingerprints to Moonshot's next flagship. Arena is where K3 was tested before launch, and an entry there is a routine pre-launch step rather than a launch.
- **Moonshot's own API model list, checked today.** It publishes four callable models — the flagship `kimi-k3`, two coding models and one general model — and no K3.1. Kimi Code's model configuration documentation lists four model ids, none of them K3.1. A name in a teaser is not a model you can call.
- **The line it belongs to.** K3 is the current flagship: 2.8 trillion parameters, native multimodal input, a 1M-token context window, and open weights under the Kimi K3 License. K3.1 is a point release on that line.

## The timeline so far

Four signals, in order, and only the last one comes from Moonshot itself:

- **Late September** — a `kimi-k3-1` identifier is spotted on the API platform. Reported secondhand; the published model list does not carry it.
- **2026-09-23** — an internal configuration snippet circulates with a `k3d1-agent` key, pointing at an agent mode and a long-context option.
- **2026-10-21** — K3.1 appears in Kimi Code's model-switching configuration.
- **2026-10-23** — the official teaser, then the `Kibitz` entry in Arena a few hours later.

The pattern is the one K3 followed: anonymous arena appearance, then a wordless teaser, then a launch some days later. People who track this expect a launch within about a week of the Arena entry — which puts the window at the end of October. That is an expectation, not an announcement, and Moonshot has published no date. The same coverage puts K3.1 next to Zhipu's GLM-5.5 as the two flagships expected before the month is out; only one of them has a teaser.

## What people are reporting from the hands-on

- **The demos are visual, not measured.** On 2026-10-22, testers posted a pelican render and a 3D animation from what they say is K3.1. The reaction was that both look strong, with some calling the result a match for GPT-6 Astra.
- **Read that as an impression, not a score.** A pelican in a canvas and a 3D animation are the modern equivalent of the teapot test: they are easy to judge by eye and they fail in obvious ways. They say nothing about the success rate across a hundred prompts, and a posted demo is usually the best of several attempts.
- **The capability claims are still claims.** The leaks point at three improvement areas — long-horizon autonomous tasks, game and 3D code, and computer operation. The teaser shows the second one. Nothing published shows the third, and a screen-operating model would be demoed on a screen, not in a terminal.

## Where it would sit on the board

- **Cost: unanswerable today, by construction.** When Moonshot publishes the rate, this page will show it in the same table as every other model on this site — input, output and cached input per 1M tokens, read live from the vendor's own pricing page, with the monthly estimate for a 1M-in / 500K-out workload computed from that row. We will not estimate a rate that has not been published.
- **Scores: K3's numbers are the baseline, not K3.1's.** The verified figures we hold for the current flagship are HLE 43.5, GPQA-Diamond 92.9, Terminal-Bench 4.0 at 12.6 and DeepSWE v1.1 at 67.5. Those belong to K3's weights. K3.1 gets its own row when it has its own measurements — borrowing the previous checkpoint's numbers is the one mistake this site cannot make.
- **The expectation to watch, and to discount.** Community coverage expects K3.1 to enter the global top three on an aggregate index and to be the first Chinese model past a score of 50 on it, with hopes of 55 to 60. Those are hopes, not results, and they are not a benchmark we track. When a vendor table or an independent leaderboard publishes real numbers, they land in the score table above this article.
- **One thing that is already true:** K3 ships open weights. If K3.1 follows that path, the weights land on the model hub and self-hosting becomes an option — a cost question the API pricing page can never answer.

## Should you plan around it?

- **Do not wait to build.** K3 is available today, documented and measured; K3.1 is a teaser and an anonymous arena entry. Build on what is released.
- **Keep the model id in configuration.** When the API id appears, switching should be a config change, not a refactor. Keep a small regression set of your own prompts and run it on day one — a point release usually keeps the API shape, but behaviour can still shift.
- **Watch two things, not twenty.** The signal is a callable API id on the Kimi platform and a line on the pricing page. Everything else in the coverage is repetition of the same four traces.
- **The open questions are the two the demos cannot answer.** Availability — whether API capacity is there on day one, given how K3 filled the cluster and forced a pause on new subscriptions — and cost-effectiveness, which is exactly the number this page refuses to guess.

## Where to go next

- **The flagship we hold scores for** — [/models/kimi-k3](/models/kimi-k3)
- **Every model we track, ranked** — [/leaderboard](/leaderboard)
- **Price your own traffic** — [/token-calculator](/token-calculator)
- **The vendor's own model list** — [the Kimi API platform](https://platform.kimi.ai/docs/models)
- **Source of truth for this page** — the official teaser on Kimi's X account, checked on 2026-10-23. The Arena entry and the hands-on reports are collected in [this trade write-up](https://mp.weixin.qq.com/s/U1bqBvc9ne621o2SMYsO-Q) (2026-10-23), which is a secondary source and is named as one.
