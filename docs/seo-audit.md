# EvalLedger — full-site SEO audit

**Date:** 2026-10-24 · **Scope:** `https://evaledger.com/` and the repository at
`src/` · **Method:** source inspection, execution of the site's own registries
and head builders, a live crawl of the production site, and three
independent read-only audits of the code.

This document is the **audit**. What was changed, and the checks that were
run, are in [`seo-implementation-report.md`](./seo-implementation-report.md).
The route-by-route inventory is in
[`seo-route-inventory.md`](./seo-route-inventory.md).

---

## 1. Scope and limitations

### What was inspected

- Every route file under `src/routes/{-$locale}/`, plus `src/routes/__root.tsx`,
  the sitemap/robots/feed endpoints and the price API.
- The SEO module (`src/features/seo/`), the i18n dictionaries
  (`src/features/i18n/dictionaries/`), the leaderboard/scoring registries, the
  price registry, the series and release data.
- **The live site.** `https://evaledger.com/` was fetched and its HTML
  inspected for every defect below. Findings marked *live-confirmed* were
  reproduced against the production site, not merely inferred from the code.

### What was NOT available

| Limitation | Consequence |
| --- | --- |
| No Google Search Console, Bing Webmaster or analytics access | **No claim is made about actual rankings, impressions, click-through rate, crawl budget or index coverage.** Those need data this environment does not have. |
| No keyword-volume, difficulty or SERP data (Ahrefs / Semrush / Google Ads) | Every keyword in this document is a **hypothesis about user intent**, never a measured volume. No volume, difficulty or traffic figure is quoted anywhere. |
| No Lighthouse / WebPageTest / CrUX access | **No performance score is claimed.** Section 7 states what was verified structurally instead. |
| No backlink data | No statement is made about the site's link profile. |
| The e2e suite was **not** run in full (the repository forbids it without an explicit request); only `e2e/seo.spec.ts` was run. | Full-suite regressions outside the SEO surface would not be caught by this pass. The unit suite and the production build cover the rest. |
| `worker-configuration.d.ts` cannot be regenerated safely | See §2, D14 — the generated file's regeneration path inlines real secrets, so the fix was made in the project-owned half of the type. |

### The one number this document refuses to invent

The site's "9 frontier LLMs" claim (D3) was checked against the registry: the
leaderboard carries **18** models and the price registry **45** rows. Every
other quantity quoted below is likewise read out of the registries, not
asserted.

---

## 2. Verified technical SEO issues

Severity: **P0** = a reader (or a crawler) sees broken text; **P1** = a page
competes with itself or with a sibling; **P2** = a latent contradiction that
will bite on the next data change; **P3** = a missed opportunity.

### D1 — the model page's comparison links read `{a} vs {b}`

**P0 · live-confirmed.** `src/features/leaderboard/components/ModelProfile.tsx:270`
calls `t('landing.model.compareLink', { other: link.other.displayName })`, but
the dictionary string is `'{a} vs {b}'`
(`src/features/i18n/dictionaries/landing.ts:214`). `translate()` only replaces
a placeholder whose name is in the params object, so the braces survive.

```
https://evaledger.com/models/claude-opus-5.5
  <a href="/compare/claude-opus-5.5-vs-gemini-4-argon">{a} vs {b}</a>
  (5 occurrences)
```

This is the **primary internal-link anchor text of every model page** — the
one signal the site has for "this model is compared with that one". It was
meaningless to a reader and to a crawler. Affected: 18 model pages × 2
languages.

### D2 — the model page's model links read `{model} model page`

**P0 · live-confirmed.** The same call site, one line down: the string is
`'{model} model page'` and the params are `{ other }`. Live on
`/models/step-5-preview`, `/models/kimi-k3.1-pro`, `/models/minimax-m3` and
`/models/deepseek-v4-pro`.

### D3 — the home page says "9 frontier LLMs" while the board carries 18

**P1 · live-confirmed.** `src/features/i18n/dictionaries/en.ts:48` and
`zh.ts:49` hard-code the count. `LEADERBOARD.models.length === 18`. The
number was also a *claim* ("frontier") that the data does not support — the
board includes retired checkpoints.

### D4 — the Gemini pricing page prints the key `landing.common.promoClause`

**P0 · live-confirmed.** `src/features/landing/vendor-faq.ts:56` calls a key
that exists in neither dictionary. `translate()` returns the key itself, so
the literal string lands in the visible FAQ **and in the page's `FAQPage`
JSON-LD `acceptedAnswer.text`**. Live on `https://evaledger.com/gemini-api-pricing`
(2 occurrences), because Gemini 4 Argon — the page's featured model — has an
open promotional band.

### D5 — the DeepSeek release posts print the key `releases.costPeak`

**P0 · live-confirmed.** `src/features/releases/components/ReleaseFactSheet.tsx:240`
calls `t('releases.costPeak')`; no such key exists (`costOffPeak` does). Live
on `https://evaledger.com/releases/deepseek-v4-1-flash-1017`, where the
off-peak rate differs from the peak rate.

### D6 — the primary calculator page renders two EMPTY content sections

**P0 · live-confirmed.** `src/routes/{-$locale}/token-cost-calculator.tsx:97`
passed `itemsKey="calc.tldrItems"` and `itemsKey="calc.tips"` to
`<PricingTLDR>` / `<Tips>`. Neither key exists — `calc.ts` holds
`calc.tldr1…4` and `calc.tips1…5`, and the arrays live under the *legacy*
`calculator.` namespace. `lookup<string[]>(itemsKey) ?? []` returned `[]`, so
the "Quick takeaways" list and the "How to bring the bill down" list were
**rendered as empty `<ul>` / `<ol>` elements** on the site's primary
calculator page. The populating helpers (`copy.ts` `sharedTldr()` /
`sharedTips()`) existed and were never called.

This defect is invisible to a `t()`-based audit — the key was never passed
to `t()`, it was passed to a component as a prop.

### D7 — the model page's price tile printed the LABEL instead of the PRICE

**P0.** `ModelProfile.tsx` pushed `{ labelKey: 'landing.model.factsPrice',
valueKey: 'landing.model.factsPrice', params: { blended } }`. The string
`'Blended price'` has no `{blended}` placeholder, so the tile rendered
`<dt>Blended price</dt><dd>Blended price</dd>` and the price was never
printed — on 32 pages.

### D8 — the verdict contradicted the tile above it

**P1.** `src/features/landing/data.ts` computed the verdict from the **price**
row: a model with a board composite but no published price fell into the
`unproven` branch, whose sentence says *"it has no board composite, so there
is no score to weigh against the price"* — printed directly under a tile
reading *"75.0 on the Coding board"*. Affected: `glm-5.3`,
`deepseek-v4-flash-0731` (the two leaderboard models with no price row). The
same sentence also printed an em-dash in every numeric slot
("is — per 1M blended (— in, — out)"), i.e. a missing value rendered where a
number belongs.

### D9 — 26 internal links 404

**P0.** `src/features/calculator/components/OpenRouterSection.tsx:107` built
model links from the **registry** id (`row.id`), but `/models/$slug` resolves
by the **leaderboard** id. The two namespaces differ for 13 models
(`gemini-3.1-pro-preview` vs `gemini-3.1-pro`, `deepseek-flash` vs
`deepseek-v4.1-flash-1017`, …), so 13 links per locale were dead — 26 dead
links on `/openrouter-pricing-calculator` and its Chinese twin.

The same lookup bug cost a **live** link in `VendorRateTable.tsx:58`:
"Gemini 3.1 Pro Preview" rendered as plain text although
`/models/gemini-3.1-pro` exists and returns 200.

### D10 — the use-case rankings' captions printed `{date}` and `{threshold}`

**P0.** `BestCategoryPage.tsx:231` called a **dynamically built** key
(`landing.best.caption${kind}`) with no params at all. `captionPrice` needs
`{date}` and `captionContext` needs `{threshold}`, so `/best/cheapest-llms`
and `/best/1m-context-window` printed the braces — and the `{date}` is the
page's freshness claim.

### D11 — a Chinese release post linked to the English pages

**P1.** `src/content/releases/deepinfer.zh.md:109-113` was the only Chinese
post whose five internal hrefs were **not** `/zh`-prefixed, so a Chinese
reader was dropped onto the English pages. (All 48 other Chinese post links
are correct.)

### D12 — the benchmark history pages share one meta description

**P2.** `benchmarks/$slug/history.tsx:27` uses
`dict.leaderboard.history.metaDescription` for all 38 pages. All 38 are
currently `noindex` (the snapshot job has not landed), so the impact is
latent — it becomes a real duplicate the moment the data arrives.

### D13 — the model page head and the sitemap could disagree

**P2.** `models/$slug.tsx` never consulted `isIndexableModel`, so a model
that lost its scores would stay `index, follow` with its hreflang cluster
while `isIndexablePath()` dropped it from the sitemap — the one-directional
version of the invariant `src/features/seo/indexability.ts` documents.

### D14 — `pnpm typecheck` failed before this work started

**P2.** `src/features/analytics/analytics.ts(28,31): TS2339: Property
'GA4_MEASUREMENT_ID' does not exist on type 'Env'` — the committed
`worker-configuration.d.ts` predates the variable. The repository's own
plan (`docs/seo-internal-linking-plan.md` §7) had already flagged it as
"outside this task's scope".

**The obvious fix is unsafe.** `pnpm cf-typegen` regenerates the file from
`wrangler.jsonc` and, with `strict-vars` on, **inlines the config's literal
values** — the real `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET` and
`ADMIN_EMAILS` — into a committed file, and rewrites ~2 000 lines of
generated code while changing `Env`'s shape (`env.BETTER_AUTH_URL` would
become `"" | undefined`, breaking `new URL(env.BETTER_AUTH_URL)` in five
places).

### D15 — the vendor meta descriptions hard-code prices and retired models

**P2.** `marketing.chatgptMetaDescription` ("GPT-6 astra at $10 input / $50
output per 1M, GPT-5 cached input at $0.125/M"), `deepseekMetaDescription`
(V4-Pro $1.32/$3.96, V4.1-Flash $0.30/$1.20, "plus V3.2") and
`claudeMetaDescription` ("Claude Opus 4.5, Sonnet 4.5, Haiku 4.5") were
typed by hand. GPT-5, V3.2 and Opus 4.5 are all `status: 'delisted'` in the
registry. The figures happen to match today; nothing would tell the two
apart when they stop matching.

### D16 — `og:type` was `website` on every article

**P2.** `__root.tsx` declares `og:type: website` site-wide and no child
overrode it, so the 22 release-post URLs announced themselves as websites
rather than articles.

### D17 — the release posts published a `dateModified` that is not one

**P2.** `releases/$slug.tsx` set `dateModified: entry.checkedAt`. `checkedAt`
is the day the **prices** were re-verified, not the day the article was
edited — so the structured data claimed a content change every time somebody
re-checked a rate.

### D18 — two pages took their head strings from outside the dictionary

**P3.** `/sponsor` and `/waitlist` hard-coded their title and description
inside the route file while the page's H1 read `dict.sponsor.title` /
`dict.waitlist.title` — two sources for one string, agreeing only by
coincidence. `/changelog` used the 34-character `subtitle` as its meta
description.

### D19 — the mobile menu button had an English-only accessible name

**P3.** `site-nav.tsx` hard-coded `aria-label="Menu"`.

### D20 — a price table mixed the base rate with the rate in force

**P3 (latent).** `BestCategoryPage.tsx` printed `r.price.inputPricePer1M`
(the registry's base rate) next to a cached rate resolved through
`priceDetail()` (the rate in force). There is **no divergence today**, but
the first promotional band would make `/best/cheapest-llms` contradict the
calculator and the board.

---

## 3. Content and search-intent issues

### 3.1 One shared meta description across eight use-case pages

`/best/$category` used `dict.leaderboard.best.metaDescription` for every
category — eight pages, one sentence. Two competing per-category sets already
existed in the dictionaries (`leaderboard.best.<slug>.intro` and
`hub.best.descriptions.<slug>`) and neither was used for the description.
The description is the line that has to say what *this* page answers; one
shared sentence says nothing.

### 3.2 The home page's title carried no brand and its description carried a wrong number

The title was "LLM Leaderboard — Benchmark Scores & Token Prices in One Table"
with no brand, while the sibling provider pages ended in "— EvalLedger". The
description claimed nine frontier models.

### 3.3 Two per-provider meta descriptions named retired models as current

See D15. "comparison to GPT-5", "plus V3.2", "Claude Opus 4.5" — all
`status: 'delisted'`.

### 3.4 Dead FAQ copy carrying stale prices

`src/features/i18n/dictionaries/{en,zh}.ts` hold a **legacy** set of
per-vendor FAQ strings under `calculator.{claude,deepseek,chatgpt,openrouter}Faq*`
— 128 keys, **zero references**. They are superseded by the fully
parameterized `calc.*` set that the pages actually render. The dead copy
still says "Claude Sonnet 4.5 is $3 per 1M input and $15 per 1M output"
while the site quotes Sonnet 5 at $2/$10, and "GPT-5 cached input at
$0.125/M" for a retired model.

**Impact on search: none** — the strings are never rendered. **Impact on
maintenance: real** — a translator or a developer reading the dictionary
sees prices that contradict the site. Left in place (see §8).

### 3.5 The FAQ that *is* rendered is sound

`calc.*Faq*` and the vendor FAQ are fully parameterized and every figure is
resolved from `REGISTRY` at render time. The prices they quote
(Sonnet 4.5 $3/$15, GPT-5 $1.25/$10, GPT-6 astra $10/$50) all match the
registry today. No change was needed here.

---

## 4. Internal-linking weaknesses

### 4.1 Nine dictionary keys and two helpers existed and were never used

The repository had already written the copy and the tools for the links the
site was missing — and nothing called them:

| Unused | What it was written for |
| --- | --- |
| `linking.benchmark.usedOnTitle`, `linking.benchmark.usedOnNote` | the benchmark page's "where this benchmark counts" section |
| `linking.compare.boardsTitle`, `linking.compare.benchmarksHub` | the compare page's way out to the boards |
| `linking.home.browseBenchmarks`, `linking.home.browseBest`, `linking.home.browseBenchmark`, `linking.home.compareCta` | the home page's browse row |
| `linking.board.link` | a short board link |
| `boardsUsingBenchmark()` (`board-links.ts:81`) | benchmark → capability board |
| `bestCategoriesUsingBenchmark()` (`board-links.ts:92`) | benchmark → use-case ranking |

The wiring was missing; the spec was not.

### 4.2 The home page did not link the use-case rankings or the methodology

The home page's browse row linked the calculator, the releases, the history,
the benchmark hub and the `/best` hub — but **not** `/best/for-coding`, not
`/best/for-agents`, not `/best/for-reasoning`, and not `/methodology`. The
only `/methodology` link on the home page sat inside `CustomWeightsBoard`,
which renders only after the reader clicks "Custom weights" — so the page a
crawler fetched did not contain it.

The `/best/*` pages were unreachable from the home page for the same reason:
`LeaderboardBoard`'s board→category link only exists for the **current**
track, and the default track is `general`, which has no `/best` twin.

### 4.3 The compare directory showed 12 of 32 published comparisons

`PopularComparisons` capped at 12, and `/compare` had no other list. The other
20 comparison pages were reachable only from the model pages that happen to
mention them.

### 4.4 Four child pages had no path back to their hub

| Child | Missing link |
| --- | --- |
| `/best/$category` | → `/best` |
| `/benchmarks/$slug` | → `/benchmarks` |
| `/leaderboard/$track` | → `/` |
| `/models/$slug` | → `/` |

### 4.5 The benchmark page never named the rankings that use it

A reader who searched "GPQA Diamond leaderboard" landed on a score table with
no way to reach the coding board or the reasoning ranking — both of which
score on GPQA Diamond.

### 4.6 The footer's Resource column was missing four clusters

`/series`, `/methodology`, `/data-quality` and `/leaderboard-history` were
not in the footer. `/leaderboard-history` had **one** inbound link on the
entire site (the home page's browse row); `/series` had two, both "back to
index" links from its own children.

### 4.7 The release page's price table listed competitor names as plain text

`ReleaseFactSheet.tsx` printed the competing models' names as `<span>`s —
the reader had no way to reach the model a row was about.

### 4.8 Anchor-text quality

No "Read more", "Learn more", "Click here" or bare "Open" anchor exists in
any rendered link. The remaining weak anchors:

- "Run your usage →" (`PriceCell.tsx`, `ModelProfile.tsx`) — names the
  action, not the destination.
- "Score history →" (`BenchmarkDetail.tsx`) — names the artifact.
- "Price source →" (`PriceBreakdown.tsx`) — does not name the vendor.
- "Not tested · {n} benchmarks tracked →" (`LeaderboardBoard.tsx`) — a second
  link to the model page, three lines below the model-name link to the same
  URL.

### 4.9 The release bodies use raw paths as link labels

40 internal links in the release posts read `[/models/claude-opus-5.5](/models/claude-opus-5.5)`.
The **bold lead-in** names the destination ("The Opus 5.5 model page, with
all four scores"), so the label is not the only signal — this is the house
style of the release series, not a defect. It was left alone.

---

## 5. Prioritized recommendations

### Shipped in this pass

| # | Recommendation | Defect |
| --- | --- | --- |
| 1 | Give the i18n layer a **mechanical contract test**: every dictionary key the source names must exist in both languages, and every call site must supply every `{placeholder}` its string needs. | D1, D2, D4, D5, D6, D10 |
| 2 | Fix the six broken keys / parameter mismatches they expose. | D1, D2, D4, D5, D6, D10 |
| 3 | Compute the home page's model count from the registry; name the brand in the title; make the H1 say what the page does. | D3, §3.2 |
| 4 | Give every use-case ranking its own meta description. | §3.1, D12 |
| 5 | Resolve the provider meta descriptions from the registry instead of typing prices. | D15 |
| 6 | Resolve model links through a `leaderboardIdForPriceId()` helper so the two id namespaces cannot be mixed again. | D9 |
| 7 | Give the verdict a sentence for "has a score but no price", and stop printing em-dashes in numeric slots. | D8 |
| 8 | Wire the nine unused `linking.*` keys and the two unused helpers into the pages they were written for. | §4.1–4.5 |
| 9 | Add the missing footer columns and the home page's cluster links. | §4.2, §4.6 |
| 10 | List every published comparison on `/compare`; give the benchmark page its "where this counts" section; give the use-case page a link to its board and to its hub. | §4.3–4.5 |
| 11 | Add `BreadcrumbList` to the deep page families through one shared builder; set `og:type: article` on release posts; drop the misleading `dateModified`. | D16, D17, §7.1 |
| 12 | Add one justified landing page: `/best/cheapest-coding`. | §6.1 |
| 13 | Make the page head and the sitemap agree on indexability. | D13 |
| 14 | Fix the Chinese release post's locale prefixes. | D11 |
| 15 | Use the rate in force everywhere a rate is printed. | D20 |
| 16 | Move the sponsor/waitlist/changelog head strings into the dictionaries. | D18 |
| 17 | Localize the mobile menu's accessible name. | D19 |
| 18 | Fix the pre-existing typecheck failure without regenerating a file that would commit secrets. | D14 |

### Recommended next, not in this pass

| # | Recommendation | Why not now |
| --- | --- | --- |
| 19 | Delete the 128 dead `calculator.*Faq*` dictionary keys. | Zero references and zero SEO impact; it is a large diff in two shared files, and `AGENTS.md` is conservative about deleting content. The stale prices are a maintenance hazard, not a ranking one. |
| 20 | Publish one page per changelog entry (`/changelog/$slug`). | The changelog is a real long-tail surface ("EvalLedger v1.4 changelog"), but a per-post route needs a front-matter shape the collection does not have yet. |
| 21 | Give the series-pair pages a title that names the series and the brand. | 49 pages, 40 of them `noindex` today. It is a real near-duplicate-title problem, but it touches the series' published contract. |
| 22 | Replace the `.replace('{a}', …)` idiom with `translate()` in the compare-pair and series-pair heads. | Works today only because each placeholder occurs once; a low-risk cleanup with no behaviour change. |
| 23 | Give `/benchmarks/$slug` a per-benchmark meta description. | All 38 pages are `noindex` until the snapshot job lands; the shared description is a latent duplicate, not a live one. |
| 24 | Move the benchmark-page source URLs out of the JS-gated `ScoreProvenance` popover into the served HTML. | The provenance is real but currently invisible to a crawler that does not run the popover's JavaScript. |

---

## 6. New pages: what was created and what was not

### 6.1 Created — `/best/cheapest-coding`

**"Best cheap model for coding."** It answers a question the site had no page
for: `for-coding` ranks by **score** among the models that clear the coding
gate, and `cheapest-llms` ranks by **price** among **every** model we price.
Neither answers "which of the models that can actually do the job costs the
least?".

It clears all six of the task's own conditions:

1. **Distinct need** — the intersection of two existing pages' questions.
2. **Enough data** — 5 rows today (6 coding-qualified models, one of which
   has no published price and therefore cannot be priced). Verified against
   the live registries.
3. **Unique value** — the same models as `/best/for-coding`, ordered by
   price, with the gate stated on the page.
4. **No duplicate** — neither existing page answers it.
5. **Linkable** — linked from `/best` (it appears in the hub automatically),
   from `/compare` (the boards section), and from the sitemap.
6. **Maintainable** — it is a row in `BEST_CATEGORIES`; a price change moves
   it with the rest of the site.

It needs **no new route file**: `/best/$category` is already dynamic, and
the hub, the sitemap and the e2e suite all derive from the registry.

### 6.2 Deliberately not created

| Candidate | Why not |
| --- | --- |
| `/best/cheapest-agents`, `/best/cheapest-reasoning` | The same shape as `cheapest-coding` with a different word — keyword-permutation pages. One page demonstrates the pattern; nine would be a factory. |
| `/stepfun-api-pricing`, `/glm-api-pricing` | StepFun has **1** registry row and Zhipu/GLM has **0** — a vendor landing page with one price row is thin, and one with none is impossible. |
| A benchmark page for every benchmark | All 38 already have one. |
| A comparison page for every model pair | 32 published pairs already cover the pairs the registry says are interesting; a 153-page matrix of every combination would be thin pages. |

---

## 7. Structured data

### 7.1 What was added

- **A shared `breadcrumbLd()` builder** (`src/features/seo/seo.ts`), used by
  the two hub pages (which had the same 20 lines inlined twice) and by the
  deep page families: `/models/$slug`, `/benchmarks/$slug`,
  `/benchmarks/$slug/history`, `/best/$category`, `/series/$slug`,
  `/series/$slug/$pair`, `/releases/$slug`, `/compare/$pair`.
- `og:type: article` + `article:published_time` on release posts.
- `dateModified` **removed** from the release posts' `BlogPosting`.

### 7.2 What was deliberately NOT added

No `aggregateRating`, no `review`, no `reviewRating`, no invented `author`,
no invented `datePublished`, no `Product` with a made-up price, no
`Dataset` where the page is not a dataset. Structured data on a page that
does not deserve it is a liability, and the task's instruction not to assume
that adding it guarantees a rich result is correct: **the only honest
measurement of a rich result is Search Console, and this environment has
none.**

### 7.3 The state of the JSON-LD, before and after

| Page | Before | After |
| --- | --- | --- |
| `/` | Organization, WebSite | unchanged |
| calculator + vendor pages | SoftwareApplication, FAQPage | unchanged (the FAQPage's text is now correct — D4) |
| `/benchmarks`, `/best` | FAQPage, BreadcrumbList | FAQPage, BreadcrumbList (shared builder) |
| `/leaderboard/$track` | none | BreadcrumbList |
| `/models/$slug` | none | BreadcrumbList |
| `/best/$category` | none | BreadcrumbList |
| `/compare`, `/compare/$pair` | none | BreadcrumbList (pair pages) |
| `/benchmarks/$slug` | none | BreadcrumbList |
| `/series`, `/series/$slug` | ItemList (lines) | ItemList + BreadcrumbList |
| `/series/$slug/$pair` | ItemList | ItemList + BreadcrumbList |
| `/releases/$slug` | BlogPosting | BlogPosting + BreadcrumbList, `og:type: article` |

---

## 8. Findings that need Search Console or external data to verify

None of these are claims; they are the questions this environment could not
answer.

1. **Does the core sitemap's curation actually help?** The site publishes
   38 URLs in the core list and ~250 in the full list. Only Search Console
   can say whether the split improves the crawl budget, or whether the long
   tail is being starved.
2. **Are the eight use-case pages actually indexed?** `isIndexablePath()`
   says they are eligible; the index is a separate question.
3. **Does the home page's new title and H1 improve click-through?** Needs
   Search Console impressions and CTR, before and after.
4. **What is the real search volume for "best cheap model for coding"?**
   The page was built because the intent is distinct and the data exists —
   not because a volume figure was found. A keyword tool would tell us
   whether it is worth a second page (`cheapest-agents`).
5. **Are the release posts' `og:type: article` / `datePublished` change
   producing article rich results?** Needs Search Console.
6. **Is the site fast enough?** No Lighthouse, WebPageTest or CrUX data was
   available. Structurally, the release bodies are in the server-rendered
   HTML (the client loader preloads them), the comparison tool and the
   calculator grid are server-rendered, and no public page is gated behind a
   spinner — but **no performance number is claimed**.
7. **Are there broken links from outside?** No backlink or crawl data was
   available. The 26 dead links this audit found (D9) were found in the
   site's own code, not by crawling its inbound links.
8. **Is the site in the model's favour for the 22 release posts?** Unknown
   without a rank tracker.

---

## 9. Intent map

The keyword map below is a **hypothesis about user intent**, not measured
demand. It is the map the implementation was built against.

| Cluster | Primary intent (hypothesis) | Pages that own it |
| --- | --- | --- |
| General leaderboard | "LLM leaderboard", "AI model benchmark leaderboard", "LLM leaderboard with API pricing" | `/`, `/leaderboard/$track` |
| Model comparison | "Claude vs GPT", "Gemini vs Claude API pricing", "LLM price performance comparison" | `/compare`, `/compare/$pair` (32) |
| API pricing & cost | "LLM token cost calculator", "AI API cost calculator", "cost per million tokens", "cached input token pricing" | `/token-cost-calculator` + 8 vendor landings |
| Model detail | "[model] API pricing", "[model] benchmark", "is [model] worth upgrading" | `/models/$slug` (18), `/series/$slug`, `/series/$slug/$pair` |
| Use-case rankings | "best LLM for coding", "best cheap model for coding", "best LLM for reasoning", "best AI model for terminal agents" | `/best/$category` (9) |
| Benchmarks & methodology | "[benchmark] leaderboard", "LLM benchmark methodology", "AI model benchmark history" | `/benchmarks/$slug` (38), `/methodology`, `/leaderboard-history` |
| Releases | "[new model] vs [previous]", "is [version] worth upgrading" | `/releases` (11 posts) |

---

## 10. How this audit was produced

- **Source inspection** of every route, dictionary, registry and component.
- **Execution**, not reading: the registries, the head builders, the scoring
  core and the sitemap generators were bundled with esbuild and run, so the
  titles, descriptions, counts and indexability decisions quoted here are the
  values the site actually produces.
- **A live crawl** of `https://evaledger.com/` — every defect marked
  *live-confirmed* was fetched and the raw HTML inspected.
- **Three independent read-only audits** of the codebase (metadata and
  heads; rendering defects, including a runtime crawl of 475 pages; internal
  linking), whose findings were independently re-verified against the source
  and the live site before anything was changed. Where an audit's claim did
  not reproduce, it was not acted on.
- **A mechanical contract test** (`src/features/i18n/dictionary-integrity.node.test.ts`)
  now guards the class of defect that caused D1, D2, D4, D5, D6 and D10, so
  the next one fails the build instead of shipping.
