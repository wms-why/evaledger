# EvalLedger — route inventory

**Date:** 2026-10-24 · **Registry at the time of the audit:** 45 price rows,
18 leaderboard models, 38 benchmarks, 32 published comparisons, 9 use-case
rankings, 4 capability boards, 11 version series, 11 release posts.

This is the **inventory the implementation was built against**. It is
organised by page family rather than listing every URL: the dynamic families
are generated from the registries, so their membership changes whenever a
model, a benchmark or a post lands — the counts and the generating registry
are what matters, and both are given.

The audit that found the problems is
[`seo-audit.md`](./seo-audit.md); what was changed is in
[`seo-implementation-report.md`](./seo-implementation-report.md).

---

## 0. How to read this

- **Intent** and **keyword cluster** are **hypotheses about user intent**,
  not measured search demand. No volume, difficulty or traffic figure is
  used anywhere.
- **Indexability** is the site's own decision
  (`src/features/seo/indexability.ts`): a page below its data floor is
  `noindex, follow` and stays out of the sitemap, but it stays reachable and
  linked.
- **Canonical** is the path the page's `<link rel="canonical">` carries. The
  canonical host is `https://evaledger.com`; the `zh` pages canonicalize to
  their `/zh/…` twin and the two are declared as hreflang alternates of each
  other, with `x-default` pointing at the English one.

---

## 1. Homepage and general leaderboard

| Path | Type | Intent (hypothesis) | Keyword cluster | Indexable |
| --- | --- | --- | --- | --- |
| `/` | static | discover, rank and compare models | LLM leaderboard · AI model benchmark leaderboard · LLM leaderboard with API pricing | yes |
| `/leaderboard/general` | dynamic (4 tracks) | how the overall leaderboard is built | LLM leaderboard | yes (10 ranked ≥ floor 3) |
| `/leaderboard/coding` | dynamic | which models are best at code | best LLM for coding | yes (7 ranked) |
| `/leaderboard/agent` | dynamic | which models are best at agent work | best LLM for coding agents · best AI model for terminal agents | yes (9 ranked) |
| `/leaderboard/reasoning` | dynamic | which models are best at reasoning | best LLM for reasoning | yes (5 ranked) |
| `/leaderboard-history` | static | how the leaderboard changed over time | AI model benchmark history | **no** — `LEADERBOARD.history` is empty |
| `/methodology` | static | how a score is computed | LLM benchmark methodology | yes |
| `/data-quality` | static | where every price and score came from | (trust / E-E-A-T, not a search cluster) | yes |

**Titles / descriptions / H1**

- `/` — title `LLM Leaderboard: Benchmarks, Rankings & API Prices | EvalLedger`;
  description quotes `LEADERBOARD.models.length` (18) at render time; H1
  `LLM Leaderboard: Compare AI Models by Benchmark and Price`; JSON-LD
  `Organization` + `WebSite`.
- `/leaderboard/$track` — title `<Track> — EvalLedger`; description is
  per-track (`leaderboard.track.metaDescription` with the track name); H1
  `<Track> leaderboard`; JSON-LD `BreadcrumbList` (added).
- `/methodology`, `/data-quality` — one title and description each; JSON-LD
  none (correct — they are prose, not entities).

**Internal links**

- `/` → the four boards, the three use-case rankings, `/best`, `/benchmarks`,
  `/methodology`, `/token-cost-calculator`, `/compare`, `/releases`,
  `/leaderboard-history`, 12 comparison pairs, 18 model pages, 3 release
  posts.
- `/leaderboard/$track` → its `/best/` twin, `/benchmarks`, its core
  benchmark pages, its models, `/methodology` (via the custom-weights board).

**Issues found → action**

| Issue | Action |
| --- | --- |
| description said "9 frontier LLMs"; the board has 18 | count computed from `LEADERBOARD` |
| title carried no brand | brand suffix added |
| H1 was the bare keyword | H1 says what the page does |
| no link to `/methodology` in the served HTML | added to the browse row |
| no link to the use-case rankings | three added to the browse row |
| browse row's anchors were generic labels | replaced with the destination's own name |
| `/leaderboard-history` had one inbound link site-wide | linked from the footer and the browse row |
| `/series`, `/methodology`, `/data-quality` absent from the footer | added |

---

## 2. Model comparison

| Path | Type | Intent | Keyword cluster | Indexable |
| --- | --- | --- | --- | --- |
| `/compare` | static | compare any models you pick | LLM price performance comparison · AI model cost comparison | yes |
| `/compare/<pair>` (32) | dynamic | two specific models, head to head | Claude vs GPT · DeepSeek vs Claude coding · Gemini vs Claude API pricing | yes |

**Generation.** `COMPARE_PAIRS` in `src/features/leaderboard/leaderboard.ts`;
the slugs are `pairSlug(a, b)` of two leaderboard ids. The reversed word
order resolves to the same page and canonicalizes to the canonical order.

**Titles / descriptions / H1.** The pair pages carry
`<A> vs <B> — Compare LLMs` and a per-pair description; both are unique
across all 32. H1 `<A> vs <B>`. JSON-LD `BreadcrumbList` (added).

**Internal links.** Each pair page → both model pages (the model names in
the table head), every benchmark it scores on, the calculator with the model
preselected, the other 31 comparisons, the boards and the benchmark hub.

**Issues found → action**

| Issue | Action |
| --- | --- |
| `/compare` listed only 12 of the 32 published comparisons | an **All model comparisons** directory now lists all 32 |
| no link from `/compare` to the capability boards or the benchmark hub | a boards section added, using the `linking.compare.*` keys that already existed |
| no calculator page links `/compare` at all | the calculator's own "related calculators" strip and the compare page's boards section close the loop |

---

## 3. API pricing and the token cost calculator

| Path | Type | Intent | Keyword cluster | Indexable |
| --- | --- | --- | --- | --- |
| `/token-cost-calculator` | static | price a workload across every model | LLM token cost calculator · AI API cost calculator · LLM API pricing comparison | yes |
| `/claude-token-cost-calculator` | static | Claude's rates | Claude token cost calculator | yes |
| `/chatgpt-api-pricing` | static | OpenAI's rates | ChatGPT API pricing | yes |
| `/deepseek-api-pricing` | static | DeepSeek's rates | DeepSeek API pricing | yes |
| `/gemini-api-pricing` | static | Google's rates | Gemini API pricing | yes |
| `/grok-api-pricing` | static | xAI's rates | Grok API pricing | yes |
| `/minimax-api-pricing` | static | MiniMax's rates | MiniMax API pricing | yes |
| `/kimi-api-pricing` | static | Moonshot's rates | Kimi API pricing | yes |
| `/openrouter-pricing-calculator` | static | what a router really charges | OpenRouter pricing calculator | yes |
| `/token-calculator` | **301 alias** | — | — | never indexed |

**Titles / descriptions / H1.** Each landing has one title, one description
and exactly one H1. JSON-LD `SoftwareApplication` + `FAQPage`, built from the
same builder the visible FAQ uses, so the two cannot disagree.

**Internal links.** Each landing → the other eight landings; the vendor
landings → every model page in their rate table; the OpenRouter page → the
models it prices; the calculator → `/api/prices.json`.

**Issues found → action**

| Issue | Action |
| --- | --- |
| `/token-cost-calculator` rendered **two empty sections** — `calc.tldrItems` and `calc.tips` do not exist | the components now take a resolved list; the page passes the registry-derived `sharedTldr()` / `sharedTips()` |
| the Gemini page printed the key `landing.common.promoClause` in the visible FAQ **and in its FAQPage JSON-LD** | the key added in both languages |
| the OpenRouter page carried **26 dead `/models/…` links** (registry ids against a leaderboard-keyed route) | every model link now resolves through `leaderboardIdForPriceId()` |
| three meta descriptions hard-coded prices and named retired models (GPT-5, V3.2, Opus 4.5) | the numbers are resolved from `REGISTRY` at render time |

---

## 4. Model detail, series and releases

| Path | Type | Intent | Keyword cluster | Indexable |
| --- | --- | --- | --- | --- |
| `/models/<slug>` (18) | dynamic | one model's price, scores and context window | [model] API pricing · [model] benchmark | yes (`MIN_MODEL_SCORES = 1`) |
| `/series` | static | every version line | model version series | yes |
| `/series/<slug>` (11) | dynamic | one line's versions, newest first | [model family] versions compared · [model family] latest version | 9 of 11 (two lines have no scored member) |
| `/series/<slug>/<pair>` (49) | dynamic | two versions of one line | [new version] vs [previous version] | 9 of 49 (both sides must have a score) |
| `/releases` | static | every launch analysis | model release analysis | yes |
| `/releases/<slug>` (11) | dynamic | one launch, rewritten as a cost-and-switch analysis | is [model version] worth upgrading | yes |

**Titles / descriptions / H1.** The model pages are the site's best
metadata: `landing.model.metaTitle` / `metaDescription` with every figure
resolved from `REGISTRY` and the year taken from the registry's own
snapshot. H1 = the model's display name. JSON-LD `BreadcrumbList` (added).

**Internal links.** A model page → its benchmark pages, its series, its
release post, its comparisons, the calculator with the model preselected,
all four boards, the external pricing source. A series page → its versions'
model pages, its pairs, its vendor's pricing page, its release post, the
calculator. A release page → its model page, the compare tool, the
calculator, its benchmark pages, its sibling posts, and (added) its series
line.

**Issues found → action**

| Issue | Action |
| --- | --- |
| the model page's comparison links read `{a} vs {b}` | the dictionary and the call site now agree; the anchor reads "Claude Opus 5.5 vs GPT-6 Astra" |
| the model page's model links read `{model} model page` | the anchor now names the model it links to |
| the model page's price tile printed the label twice and never the price | a separate value key added |
| the model page's verdict said "it has no board composite" under a tile that printed a composite | two new verdict codes (`unpriced`, `unscored`); no em-dash in a numeric slot |
| the model page's head never consulted `isIndexableModel` | it does now, so the head and the sitemap cannot disagree |
| the release posts printed the key `releases.costPeak` | the key added in both languages |
| the release posts' price table listed competitor names as plain text | they are links to those models' pages now |
| the release posts had no link to the model's version line | added to the CTA block |
| a Chinese release post linked to the English pages | the five hrefs are `/zh`-prefixed |
| `og:type` was `website` on every article | `article` + `article:published_time` on release posts |
| the release posts published a `dateModified` that is a price-recheck date | removed |
| the 49 series-pair titles are bare "A vs B" with no brand or series name | **not changed** — recorded as a known limitation in the audit |

---

## 5. Benchmarks and use-case rankings

| Path | Type | Intent | Keyword cluster | Indexable |
| --- | --- | --- | --- | --- |
| `/benchmarks` | static | the directory of every benchmark | (hub) | yes |
| `/benchmarks/<slug>` (38) | dynamic | one benchmark's leaderboard | [benchmark name] leaderboard · [benchmark name] model scores | 14 of 38 (floor: 5 scored models) |
| `/benchmarks/<slug>/history` (38) | dynamic | how a benchmark's scores changed | AI model benchmark history | 0 of 38 — no snapshot on record |
| `/best` | static | the directory of every use-case ranking | (hub) | yes |
| `/best/<category>` (9) | dynamic | which models are best at one job | best LLM for coding · best cheap model for coding · best LLM for reasoning · best LLM for coding agents | yes |
| `/methodology` | static | the published scoring rules | LLM benchmark methodology | yes |

**The nine use-case rankings**

| Slug | Kind | Ranks by | Gate |
| --- | --- | --- | --- |
| `chinese-model` | score | composite | DeepSeek/GLM/Kimi only |
| `open-source` | score | composite | the three open-weight vendors |
| `for-coding` | score | composite | DeepSWE, ProgramBench, NL2Repo, Terminal-Bench 2.1 |
| `for-agents` | score | composite | Terminal-Bench 4.0, Agents' Last Exam, AutoBench |
| `for-reasoning` | score | composite | GPQA Diamond, HLE, MathArena Apex |
| `cheapest-llms` | price | blended $/1M | none |
| `1m-context-window` | context | window size | ≥ 1M tokens |
| `prompt-caching` | cache | cache discount | a published cached rate only |
| **`cheapest-coding`** | price | blended $/1M | **the same gate as `for-coding`** |

**Titles / descriptions / H1.** Every use-case page has its own title, its
own meta description and one H1 — the descriptions were one shared sentence
before this pass. The benchmark pages use the registry's own description and
a unique title; the history pages share one description (all `noindex`
today).

**Internal links.** A benchmark page → its models, its history, **the
boards and use-case rankings that score on it**, the benchmark hub, the
methodology. A use-case page → its models, its benchmarks, **its board**,
**the `/best` hub**, the full leaderboard.

**Issues found → action**

| Issue | Action |
| --- | --- |
| all 8 use-case pages shared one meta description | 9 per-category descriptions added (en + zh) |
| the price/context captions printed `{date}` and `{threshold}` | both now resolved from the registry and the category |
| a use-case page's benchmark names were plain text | they are links now, as they are everywhere else on the site |
| a use-case page had no link to its board, nor to the `/best` hub | both added |
| a benchmark page never named the rankings that use it | a "Where {benchmark} counts" section added, using the two helpers that already existed for it |
| a benchmark page had no link back to the `/benchmarks` hub | added |
| the 38 history pages share one meta description | **not changed** — all `noindex` today; recorded as latent |

---

## 6. Static, legal and utility pages

| Path | Intent | Indexable | Notes |
| --- | --- | --- | --- |
| `/changelog` | the product's release notes | yes | meta description was 34 generic characters; now specific |
| `/sponsor` | support the project | yes | the head now reads the same dictionary the H1 reads |
| `/waitlist` | (pre-launch signup) | yes | same fix |
| `/terms`, `/privacy` | legal | yes | no structured data — correct |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | — | **no** (`noindex` + robots) | out of the sitemap |
| `/app/*` | the signed-in shell | **no** | robots-disallowed |
| `/admin/*` | the admin console | **no** | robots-disallowed |

---

## 7. Machine-readable surfaces

| Path | What it publishes | Declared in robots? |
| --- | --- | --- |
| `/robots.txt` | `User-agent: *`, `Allow: /`, `Allow: /api/prices.json`, `Disallow: /app`, `/*/app`, `/admin`, `/*/admin`, `/api/`, `Sitemap: <origin>/sitemap-core.xml` | — |
| `/sitemap.xml` | the **core** list — byte-identical to `/sitemap-core.xml` | no (it is the same document) |
| `/sitemap-core.xml` | 28 English + 10 Chinese URLs — the site's bid for the index | **yes** |
| `/sitemap-full.xml` | every page that clears its indexability floor (~250 URLs) | no — deliberately |
| `/feed.xml` | the release series, both languages, one RSS document | no (linked from the root head) |
| `/api/prices.json` | the machine-readable price feed, `modelCount` computed from `REGISTRY` | allowed explicitly |

**Why two sitemaps.** A new domain has no crawl budget to spare: a crawler
that meets a 250-URL list on its first visit samples a few dozen URLs and
forms its first impression from them. The core list is the hand-picked set
of pages that answer the searches the site is built for; the full list
exists, is served, and is not declared. **This is a deliberate editorial
decision, not an oversight** — but it is a trade-off, and the trade-off is
recorded in the audit as needing Search Console to evaluate.

**The core list grew by three in this pass** (25 → 28 English URLs):
`/methodology`, `/best/for-coding`, `/best/cheapest-coding` — the three
pages that answer the "benchmark methodology", "best LLM for coding" and
"best cheap model for coding" clusters, and that had no entry.

---

## 8. The sitemap contract, in one place

| Family | Generated from | Indexability floor |
| --- | --- | --- |
| fixed paths | `PUBLIC_PATHS` (22 entries, hand-listed) | always indexable |
| model pages | `LEADERBOARD.models` | ≥ 1 score |
| benchmark pages | `BENCHMARKS` | ≥ 5 scored models |
| benchmark history | `LEADERBOARD.history` | ≥ 1 snapshot |
| capability boards | `TRACKS` | ≥ 3 ranked models |
| comparisons | `COMPARE_PAIRS` | always indexable |
| use-case rankings | `BEST_CATEGORIES` | always indexable |
| series lines | `SERIES` | ≥ 1 scored member |
| series pairs | `allSeriesPairs()` | a score on **both** sides |
| release posts | `src/content/releases/` | always indexable |

The page heads and the sitemap ask the **same** question through
`src/features/seo/indexability.ts`, so a page can never be `noindex` and
listed in a sitemap at the same time — and, since this pass, never
indexable in one and absent from the other.
