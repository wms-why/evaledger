# Cross-page data-consistency audit — second-round SEO regression pass

**Date:** 2026-10-24 · **Baseline:** git HEAD `6dd36ab` ("增强seo"), which is the
revision deployed to `https://evaledger.com/` (checked live during this pass) ·
**Mode:** read-only, no source edits; the only write is this file.

**Method.** Truth values were **executed** out of the TypeScript registries
(`REGISTRY`, `LEADERBOARD`, `BENCHMARKS`, `TRACKS`/`rankTrack`/`fieldBestDetail`,
`BEST_CATEGORIES`/`categoryRows`, `COMPARE_PAIRS`, `SERIES`, the release data
builders and `priceDetail()`), bundled with esbuild and dumped to JSON
(`/tmp/probe*.mjs`). The rendered site was then crawled with `curl`/`urllib`:
every URL in `/sitemap-full.xml` (262), all 38 benchmark detail pages en+zh, and
the 13 versioned benchmark-history pages en+zh — **all 200**, 342 HTML documents
in total. Values were extracted from the SSR HTML and compared to the executed
registry output. Copy claims were checked as arithmetic against registry values
on the same day (`REGISTRY.fetchedAt = 2026-10-24`, the registry snapshot day).

**Severity.** P0 = reader/crawler sees broken text · P1 = page competes with a
sibling or carries a headline claim the data does not support · P2 = visible
claim contradicted by the site's own data · P3 = latent / display-level.

---

## 1. Benchmark name + version duplication (known lead — evidence)

`BENCHMARKS` carries both a `name` that **already ends in its version** and a
separate `version` field for 13 benchmarks
(`src/features/leaderboard/benchmarks.ts:55,94,110,118,126,134,150,160,169,226,235,260,296`).
Four components printed the version unconditionally next to the name, so the
version appears twice. In the current HEAD, the render sites are:

| Render site (HEAD) | What it prints | Pages it appears on | SSR? |
| --- | --- | --- | --- |
| `src/features/leaderboard/components/Methodology.tsx:116-120` | `{name}` then bare `{version}` | `/methodology`, `/zh/methodology` | **yes** |
| `src/features/leaderboard/components/TrackBoard.tsx:249-253` | `{name}` then `Version {version}` | `/leaderboard/coding`, `/leaderboard/agent` (+zh) | **yes** |
| `src/features/leaderboard/components/ModelProfile.tsx:62-66` | `{name}` then `Version {version}` | every model page with a versioned score | **yes** |
| `src/features/leaderboard/components/ScoreProvenance.tsx:43-47` | `{name}` then `Version {version}` inside the popover | model/board/compare score cells when opened | no (client-only) |

Label strings: `leaderboard.track.version` = `Version` (`en.ts:338`) /
`版本` (`zh.ts:312`). Verified live examples:

```
/methodology        Benchmark | Weight | Best recorded
                    DeepSWE v1.1 1.1        2   77.9
                    Terminal-Bench 4.0 4.0  2   66.4
/leaderboard/coding DeepSWE v1.1 | Version 1.1 | 2 | 77.9 | held by Gemini 4 Argon
/leaderboard/agent  Terminal-Bench 4.0 | Version 4.0 | 2 | 66.4
/models/deepseek-v4.1-flash-1017
                    Apex Bench v1.1 | Version 1.1 | 72.1%
                    Terminal-Bench 4.0 | Version 4.0 | 42.3%
                    DeepSWE v1.1 | Version 1.1 | 77%
```

### 1.1 Every live URL exhibiting server-rendered duplication (HEAD)

| Page family | URLs (en and `/zh/…` twin, both verified) | Duplicated benchmarks |
| --- | --- | --- |
| `/methodology` | `/methodology`, `/zh/methodology` | DeepSWE v1.1 1.1; Terminal-Bench 4.0 4.0 |
| `/leaderboard/coding` | + zh twin | DeepSWE v1.1 Version 1.1 |
| `/leaderboard/agent` | + zh twin | Terminal-Bench 4.0 Version 4.0 |
| `/models/claude-fable-5.1` | + zh | GDPVal-AA v2.1; Terminal-Bench 4.0; Terminal-Bench Science 0.1; SWE-Marathon v1.1; OSWorld V2.1; OfficeQA Pro v2 (6) |
| `/models/kimi-k3.1-pro` | + zh | same six as claude-fable-5.1 |
| `/models/claude-opus-5` | + zh | Terminal-Bench 2.1, 3.0, 4.0; DeepSWE v1.1 |
| `/models/deepseek-v4.1-flash` | + zh | Terminal-Bench 2.1, 3.0, 4.0; DeepSWE v1.1 |
| `/models/deepseek-v4-pro` | + zh | Terminal-Bench 2.1, 3.0, 4.0; DeepSWE v1.1 |
| `/models/deepseek-v4-flash-0731` | + zh | Terminal-Bench 2.1, 3.0, 4.0; DeepSWE v1.1 |
| `/models/gpt-5.6-sol` | + zh | Terminal-Bench 2.1, 3.0, 4.0; DeepSWE v1.1 |
| `/models/glm-5.3` | + zh | Terminal-Bench 2.1, 3.0, 4.0; DeepSWE v1.1 |
| `/models/kimi-k3` | + zh | Terminal-Bench 2.1, 3.0, 4.0; DeepSWE v1.1 |
| `/models/minimax-m3` | + zh | Terminal-Bench 2.1 |
| `/models/gemini-4-argon` | + zh | Terminal-Bench 4.0; FrontierSWE v2; DeepSWE v1.1; OSWorld-2.0; CWE-bench v1 |
| `/models/deepseek-v4.1-flash-1017` | + zh | Apex Bench v1.1; Terminal-Bench 4.0; DeepSWE v1.1 |
| `/models/grok-4.7` | + zh | Terminal-Bench 4.0; DeepSWE v1.1 |
| `/models/step-5-preview` | + zh | Terminal-Bench 4.0; DeepSWE v1.1 |
| `/models/minimax-m3.1-flash` | + zh | DeepSWE v1.1 |
| `/models/claude-opus-5.5` | + zh | Terminal-Bench 4.0 |
| `/models/gpt-6-astra` | + zh | Terminal-Bench 2.1; Terminal-Bench 4.0 |

**Total server-rendered URLs: 40** (2 methodology + 4 leaderboard + 34 model).

### 1.2 Clean — no server-rendered duplication (verified)

* `/leaderboard/general`, `/leaderboard/reasoning` (+zh) — their core sets
  (GPQA Diamond, HLE, MathArena Apex) carry no `version`.
* `/models/gemini-3.1-pro` (+zh) — no versioned benchmark score.
* `/compare` + all 32 `/compare/<pair>` (+zh) — benchmark names are printed
  without a version label (`CompareResult.tsx:272-278`).
* `/best` + all 9 `/best/<category>` (+zh) — `BestCategoryPage.tsx:315`.
* `/benchmarks` hub, all 38 `/benchmarks/<slug>` (+zh), all 38
  `/benchmarks/<slug>/history` — name only (`BenchmarkDetail.tsx:30`,
  `BenchmarkHubPage.tsx:126`, `BenchmarkTimeline.tsx`).
* `/releases` + all 11 posts (+zh) — `ReleaseFactSheet.tsx:132` prints
  `benchmarkName` only; `releases/data.ts:151` resolves the registry `name`.
* `/`, `/zh`, `/series/*`, `/data-quality`, `/changelog` — no occurrence in SSR.

### 1.3 Client-only occurrence (not in SSR HTML)

`ScoreProvenance` wraps every score cell on model pages, `/leaderboard/*`
ranked tables and the home board. Its popover content contains the same
`name + Version + version` stutter, but Radix renders it only on interaction,
so it is **not** in the served HTML. Reproduced as source, not as crawl output.
(On the home board only GPQA/HLE are shown, neither versioned.)

**Status:** not fixed in HEAD (production still shows it). Lead's working-tree
`benchmarkVersionSuffix()` helper + four call-site changes cover exactly these
four render sites; if it lands, this whole section closes. No other
version-render site exists — a full `\.version` scan of `src/**` found no fifth.

---

## 2. Page-visible numbers that contradict the registry (new findings)

All are **rendered copy**, in both locales, on live pages. Price/score tables
themselves were consistent (see §4); these are hard-coded prose claims.

| # | Sev | Page(s) | Claim observed live | Expected from source | Evidence |
| --- | --- | --- | --- | --- | --- |
| 1 | P2 | `/chatgpt-api-pricing`, `/zh/…` | "GPT-6 astra is the most expensive active model at $10 input / $50 output per 1M tokens" | `gpt-5.6-cyber` = $12.50/$75 (blended $43.75) is **on the same page's table**; `claude-fable-5.1` ties at $10/$50 (blended $30 vs astra $30) | `en.ts:1208`, `zh.ts:1153` |
| 2 | P2 | `/gemini-api-pricing`, `/zh/…` | "Gemini 3.1 Flash-Lite is … the cheapest Gemini tier in the registry" (FAQ) and "Flash-Lite is the cheapest Gemini tier in the registry" (takeaway) | `gemini-2.5-flash-lite` $0.10/$0.40, blended $0.25 — cheaper than 3.1 Flash-Lite $0.25/$1.50, blended $0.875; the 2.5 row is listed **on the same page** at $0.10/$0.40 | `landing.ts:69`, `landing.ts:88`; zh `landing.ts:335,354` |
| 3 | P2 | `/chatgpt-api-pricing`, `/zh/…` | tip: "Use GPT-5 nano or GPT-6 luna … output is roughly 8–20× cheaper than the flagship" | output ratios: luna $0.50 vs GPT-6 astra $50 = **100×**; GPT-5 nano $0.40 vs $50 = **125×**; only vs GPT-6 sol ($10) are they 20×/25×. The page's own flagship (astra) makes both ≈100× | `en.ts:1212`, `zh.ts:1157` |
| 4 | P2 | `/claude-token-cost-calculator`, `/openrouter-pricing-calculator` (+zh) | tip: "Haiku 4.5 / GPT-5 nano cost roughly 5–10× less than the flagship" | Haiku $1/$5 vs Fable 5.1 $10/$50 = 10× ✓, but **GPT-5 nano is `status:'delisted'`** and its output ($0.40) is 125× below GPT-6 astra ($50). Same comparison is stated as "8–20×" on `/chatgpt-api-pricing` → **cross-page contradiction** | `en.ts:1089`, `zh.ts:1032` (legacy `calculator.tips`, still rendered by `<Tips />` default) |
| 5 | P2/P3 | `/token-cost-calculator`, `/zh/…` | tip: "Claude Haiku 4.5 and GPT-6 luna cost roughly 10× less than the flagship" | Haiku vs Fable 5.1 = 10× ✓; luna vs GPT-6 astra = **100×** (vs GPT-6 sol, 20×) | `calc.ts:61`, `calc.ts:301` |
| 6 | P2 | `/deepseek-api-pricing`, `/zh/…` | takeaway: "V4-Pro is $1.32 / $3.96 — comparable to Claude Sonnet 4.5 on benchmarks, ~2.3× cheaper on output" | Output ratio to Sonnet 4.5 ($15) = **3.79×**; to Sonnet 5 ($10) = 2.53×. **2.3× is the input ratio** (3 ÷ 1.32 = 2.27) | `en.ts:1191`, `zh.ts:1137` |
| 7 | P3 | `/chatgpt-api-pricing` (+zh) | first takeaway leads with "GPT-5 cached input drops to $0.125/M" | GPT-5 is `status:'delisted'` and is not among the 5 active cards on that page; the same page's FAQ says "The GPT-5 family is now delisted" — an internal contradiction | `en.ts:1207`, `zh.ts:1151` |
| 8 | P3 | `/claude-token-cost-calculator`, `/openrouter-pricing-calculator` (+zh) | takeaway: "Anthropic prompt caching drops repeat-input cost by ~90%; OpenAI cached input drops it by ~90% on GPT-5" | GPT-5 is delisted (same class as #7); the Anthropic figure is 90% only for Sonnet 5/Haiku 4.5 — Opus 5.5 is 95%, Fable 5.1 is 97.5% | `en.ts:1062`, `zh.ts` legacy `calculator.tldrItems` |
| 9 | P3 (display only) | `/minimax-api-pricing` (+zh) | "MiniMax M3.1 Flash is $0.38 per 1M blended" | `(0.15+0.60)/2 = 0.375`; `/models/minimax-m3.1-flash` tile and `/best/cheapest-llms` render **$0.375** — two roundings of one value | computed `{blended}` param in `copy.ts` vs raw tile in `ModelProfile.tsx:167` |

No duplicate/sibling-page contradiction was found between a model page and its
release page, series page, compare page or best-page row: the registry-derived
tables agree everywhere (§4).

---

## 3. Dates and source claims

| Check | Result |
| --- | --- |
| Model page "Last verified" vs `REGISTRY.models[].lastVerified` | **18/18 models × 2 locales exact.** |
| Model page "Updated" vs `LEADERBOARD.models[].updatedAt` (date part) | exact 18/18 (e.g. 1017 = 2026-10-20). |
| Model page "Released" vs `LEADERBOARD.releaseDate` | exact where both exist; `grok-4.7` has no `releaseDate` (see below). |
| Home "Updated: 2026-10-24", calculator/provider "Last updated/verified 2026-10-24" | = `REGISTRY.fetchedAt` 2026-10-24 (today); every card's date equals that row's `lastVerified`. No stale-but-claimed-fresh label found. |
| Release "Prices checked" = frontmatter `checkedAt`; `dataCheckedAt` ≥ registry `lastVerified` | 11/11 posts en+zh pass (e.g. 1017 checkedAt 2026-10-20, dataCheckedAt 2026-10-24). |
| `/releases/grok-4-7` displays "Released 2026-09-21" | The model record does **not** carry that date: `LEADERBOARD.models` grok-4.7 (`models.ts:744-757`) has no `releaseDate`, and `REGISTRY.models` grok row has no `introduced` — so `/models/grok-4.7` omits "Released" while the release page and the releases index state 2026-09-21. **P3 data gap** (article ⇄ model record out of lockstep). |
| Home release teaser date vs `/releases` "Released" | Home renders `entry.date` (article publish date) unlabelled: DeepInfer "2026-10-23", Step 5 Preview "2026-10-23". `/releases` renders `entry.releasedAt` for the same cards: **2026-10-20** and **2026-09-20**. Same article, two different unlabelled dates on two pages. **P3.** |
| Source links | Every model page "Price source" href equals `REGISTRY.models[].sourceUrl` (18/18 ×2). Benchmark-page provenance URLs are inside the JS-gated `ScoreProvenance` popover, so they are absent from SSR HTML (already recorded as a known remaining issue in `seo-implementation-report.md`; unchanged, not a new regression). |
| `/api/prices.json` | 45 models = `REGISTRY.models.length`; `meta.modelCount` 45; `meta.fetchedAt` 2026-10-24. |

---

## 4. Verified consistent (no mismatch found)

These families were checked value-by-value against executed registries; each
returned **zero** mismatches.

| Surface | What was compared | Coverage |
| --- | --- | --- |
| Model pages | h1, title, meta description (registry price + context + fetchedAt), released/updated dates, every benchmark score + ordering, input/output/cached in force, lastVerified, source URL, blended price, price rank N-of-M, best-board composite, verdict paragraph numbers | 18 models × en+zh |
| Leaderboard pages | core weights, field best + holder name, per-model raw scores, composite, rank order, ranked/untracked partition and missing-benchmark names, source-legend counts | 4 tracks × en+zh |
| Benchmark pages | h1/name, description, unit formatting (`%` vs rating vs absolute), score rows + descending order, "Where … counts" board/category links | 38 × en+zh |
| Best-model pages | row order, composite, blended/input/output/cached, context window, cache-discount %, caption date/threshold | 9 × en+zh |
| Compare pages | dimension scores (each model's own, never borrowed), blended price, full price, context window, "leads on N of M", "~X% cheaper", monthly cost (10,000 × 4,000 in + 1,000 out) | 32 pairs × en+zh |
| Calculator + 8 provider landings | 25 active cards: monthly/annual cost, $/1M rates, context, lastVerified; provider pages' FAQ arithmetic (13.3×/16.7× DeepSeek, 8.3× Flash vs sol, 5×/100× GPT-6 family, 90%/95%/97.5% cache, 50% off-peak, 50% batch, 75% Grok cache, 90% MiniMax cache, $2/$4 Kimi cache writes); Claude break-even 2.86M/1.43M (Pro) and 28.6M/14.3M (Max) at Sonnet 5 $2/$10; OpenRouter 1.05× every line | en+zh |
| Release posts | subject price rows, benchmark rows present for all subject scores, published/released/checked dates, sample cost (1M in + 500K out), price ratios (×0.5, ×0.67, ×8.33, ×16.67, ×100) | 11 × en+zh |
| Home | 18 LLMs in meta description, "10 ranked / 8 not ranked", board table scores+composites, price teasers, per-model "N benchmarks tracked" | en+zh |
| Methodology | 4 boards' weights and field bests, per-track tables, board↔best links | en+zh |

**en/zh factual divergence:** none found in any rendered data table — both
locales print the same numbers and benchmark names (they are registry-derived).
The hard-coded copy defects in §2 exist identically in both locales (e.g.
`2.3×` → `2.3 倍`, `8–20×` → `8–20 倍`); there is no locale where a number
differs, only the two locales both repeating the same wrong claim.

---

## 5. Cannot verify

1. **Index state.** Whether Google/Bing indexed these pages, and what they
   snippet, needs Search Console — no access in this environment.
2. **Post-hydration DOM.** The duplication inside `ScoreProvenance` popovers
   (and any client-computed values) was established from source; no Playwright
   run was made (forbidden without an explicit request), so it is not a crawl
   observation.
3. **Deployment of the in-flight fix.** Production matches HEAD `6dd36ab`;
   the working tree contains uncommitted fixes by other sessions
   (`benchmarkVersionSuffix`, sitemap curation, `/en` redirect). This report
   describes HEAD/production only; it does not certify the uncommitted tree.
4. **Vendor pages/values themselves.** Prices were compared to the registry,
   not re-fetched from each vendor's page; whether the registry is *currently*
   correct against the vendor is the price-refresh workflow's job.
5. **Copy outside the crawled set.** `/terms`, `/privacy`, `/sponsor`,
   `/waitlist`, `/changelog`, `/data-quality` were crawled but not audited for
   numeral/factual claims; `/admin/*` and authenticated pages are out of scope.
6. **Google Ads/keyword or ranking effect** of any of this — not measurable here.
