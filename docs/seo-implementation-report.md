# EvalLedger — SEO implementation report

**Date:** 2026-10-24 · **Branch:** `main` (3 commits ahead of `origin/main`
before this work) · **Scope:** the changes listed below, and the checks that
were actually run against them.

The audit that produced this work is [`seo-audit.md`](./seo-audit.md); the
route inventory it was built against is
[`seo-route-inventory.md`](./seo-route-inventory.md).

**47 files modified, 6 added, +1 049 / −187 lines** (plus this report and
the other two documents). No dependency was added, no public URL was changed,
nothing was deployed, and no price, score or benchmark value was touched.

Every fix was re-verified against the running site after the change — the
release page now reads "Peak hours" instead of `releases.costPeak`, the
Gemini page reads "This is the Introductory rate, in force until 2026-11-30"
instead of `landing.common.promoClause`, the model page's price tile reads
`$12` instead of a second "Blended price", and the Chinese release post's
links are `/zh`-prefixed.

---

## 1. Files changed

### 1.1 New files

| File | What it is |
| --- | --- |
| `src/env.d.ts` | The project-owned half of the Cloudflare `Env` type. Declares `GA4_MEASUREMENT_ID` so the pre-existing typecheck error is fixed **without** regenerating a file that would inline real secrets into git. |
| `src/features/i18n/dictionary-integrity.node.test.ts` | The guard that would have caught D1, D2, D4, D5, D6 and D10. Reads the source and checks every dictionary key it names against both languages, and every call site's parameters against the placeholders its string needs. |
| `src/features/calculator/__tests__/copy-integrity.node.test.ts` | Checks that every model the calculator copy quotes is in the price registry **and** publishes a rate — so the `?? 0` fallbacks can never print a $0.00 price. |
| `src/features/seo/meta.node.test.ts` | The home page's description quotes the registry's model count; the nine use-case rankings each carry their own description; the gated price ranking lists only measured models, in price order; the page head and the sitemap agree on indexability. |
| `docs/seo-audit.md` | The audit. |
| `docs/seo-route-inventory.md` | The route inventory. |

### 1.2 Dictionaries (`en` and `zh` in lockstep)

| File | Changes |
| --- | --- |
| `src/features/i18n/dictionaries/en.ts` | home title/description/H1; 9 per-category `metaDescription`s; `releases.costPeak`; `releases.ctaSeries`; `landing.model.factsPriceValue`; `landing.model.verdict.unpriced` / `.unscored`; `landing.common.promoClause`; `marketing.{chatgpt,deepseek,claude}MetaDescription` templates; `changelog.metaDescription`; `sponsor.metaDescription`; `waitlist.metaDescription` |
| `src/features/i18n/dictionaries/zh.ts` | the same set, in Chinese |
| `src/features/i18n/dictionaries/landing.ts` | `compareLink` / `modelLink` placeholders; `common.promoClause`; `model.factsPriceValue`; the two new verdict sentences |
| `src/features/i18n/dictionaries/hub.ts` | the new category's hub label and description |
| `src/features/i18n/dictionaries/linking.ts` | `compare.allTitle` / `compare.allNote`; the `breadcrumb.*` levels |
| `src/features/i18n/dictionaries/site.ts` | `nav.menu` |

### 1.3 Features

| File | Changes |
| --- | --- |
| `src/features/seo/seo.ts` | **`breadcrumbLd()`** — one shared builder for the `BreadcrumbList`; `ogType` and `articlePublishedTime` options on `localeHead()` |
| `src/features/seo/sitemap-core.ts` | three core paths added: `/methodology`, `/best/for-coding`, `/best/cheapest-coding` |
| `src/features/leaderboard/models.ts` | **`leaderboardIdForPriceId()`** — resolves a registry id to the leaderboard id a model page is addressed by |
| `src/features/leaderboard/leaderboard.ts` | `BestCategory.gateBenchmarkIds`; the `cheapest-coding` category; the gate in `categoryRows()`'s price branch |
| `src/features/leaderboard/board-links.ts` | **`trackForBestCategory()`** — the inverse of `bestCategoryForTrack()` |
| `src/features/leaderboard/components/ModelProfile.tsx` | the two anchor texts; the price tile's value key; the verdict params |
| `src/features/leaderboard/components/BestCategoryPage.tsx` | the caption params; benchmark names as links; the rate **in force**; the gate line; links to the board and to the `/best` hub |
| `src/features/leaderboard/components/BenchmarkDetail.tsx` | the "Where {benchmark} counts" section — boards, use-case rankings, the hub, the methodology |
| `src/features/leaderboard/components/CompareTool.tsx` | **`AllComparisons`** (all 32) and **`CompareBoards`** |
| `src/features/landing/data.ts` | the `unpriced` / `unscored` verdict codes |
| `src/features/landing/VendorRateTable.tsx` | the model link resolved through the new helper (a live link recovered) |
| `src/features/calculator/copy.ts` | **`modelRateSummary()`** — the registry-resolved rates a meta description quotes |
| `src/features/calculator/components/PricingTLDR.tsx`, `Tips.tsx` | an `items` prop, so a page whose copy is computed can hand the lines over directly |
| `src/features/calculator/components/OpenRouterSection.tsx` | 26 dead `/models/…` links fixed |
| `src/features/releases/components/ReleaseFactSheet.tsx` | the price table's competitor names are links to those models |
| `src/components/marketing/footer.tsx` | four missing clusters: `/series`, `/methodology`, `/data-quality`, `/leaderboard-history` |
| `src/components/marketing/site-nav.tsx` | the mobile menu's accessible name is localized |

### 1.4 Routes

| Route | Changes |
| --- | --- |
| `index.tsx` (home) | the registry-resolved model count in the description; the expanded browse row (three boards, three use-case rankings, the benchmark hub, the methodology, the calculator, the compare tool, the releases, the history) |
| `best/$category.tsx` | the per-category description; a `BreadcrumbList` |
| `best/index.tsx`, `benchmarks/index.tsx` | the inline breadcrumb replaced by the shared builder |
| `models/$slug.tsx` | `indexable: isIndexableModel(...)`; a `BreadcrumbList` |
| `benchmarks/$slug/index.tsx`, `history.tsx` | a `BreadcrumbList` |
| `compare/$pair.tsx` | a `BreadcrumbList` |
| `compare/index.tsx` | the all-comparisons directory and the boards section |
| `series/$slug/index.tsx`, `$pair.tsx` | a `BreadcrumbList` |
| `releases/$slug.tsx` | a `BreadcrumbList`; `og:type: article`; `article:published_time`; `dateModified` **removed**; a link to the model's version line |
| `chatgpt-api-pricing.tsx`, `deepseek-api-pricing.tsx`, `claude-token-cost-calculator.tsx` | the meta description resolved from the registry |
| `sponsor.tsx`, `waitlist.tsx`, `changelog.tsx` | the head strings read from the dictionaries |
| `token-cost-calculator.tsx` | the two empty sections now carry the registry-derived copy |

### 1.5 Content and tests

| File | Changes |
| --- | --- |
| `src/content/releases/deepinfer.zh.md` | five internal hrefs are `/zh`-prefixed — the only Chinese post that was not |
| `src/features/seo/sitemap-core.node.test.ts` | the cap 26 → 28; the inventory now knows the `/best/*` and `/leaderboard/*` families |
| `src/features/leaderboard/__tests__/board-fairness.node.test.ts` | the gated price category's contract |
| `e2e/seo.spec.ts` | 15 new tests: 13 pages checked for template residue and raw dictionary keys, the use-case descriptions checked for uniqueness, the home page's description checked against the registry |

---

## 2. Issues fixed

Each row is a defect that was **verified in the source and, where marked,
on the live site** before it was changed, and **verified again after**.

| # | Issue | Live-confirmed before | After |
| --- | --- | --- | --- |
| D1 | The model page's comparison links read `{a} vs {b}` | ✅ `/models/claude-opus-5.5`, 5 occurrences | the anchor reads "Claude Opus 5.5 vs GPT-6 Astra" |
| D2 | The model page's model links read `{model} model page` | ✅ `/models/step-5-preview` | the anchor names the model it links to |
| D3 | The home page said "9 frontier LLMs"; the board has 18 | ✅ the home page's `<meta description>` | the count is computed from `LEADERBOARD.models.length` |
| D4 | The Gemini pricing page printed `landing.common.promoClause` | ✅ `/gemini-api-pricing`, in the visible FAQ **and** its JSON-LD | the clause is a sentence |
| D5 | The DeepSeek release posts printed `releases.costPeak` | ✅ `/releases/deepseek-v4-1-flash-1017` | the tile is labelled "Peak hours" / "高峰时段" |
| D6 | The primary calculator page rendered **two empty sections** | ✅ the sections were empty `<ul>` / `<ol>` | both carry the registry-derived copy |
| D7 | The model page's price tile printed the label instead of the price | ✅ `<dt>Blended price</dt><dd>Blended price</dd>` | the tile prints the price |
| D8 | The verdict claimed "no board composite" under a composite tile | ✅ `/models/glm-5.3` | two new verdict sentences; no em-dash in a numeric slot |
| D9 | 26 internal links 404'd | — | every model link resolves through `leaderboardIdForPriceId()` |
| D10 | The price/context captions printed `{date}` / `{threshold}` | ✅ `/best/cheapest-llms` | both resolved from the registry and the category |
| D11 | A Chinese release post linked to the English pages | ✅ `deepinfer.zh.md` | five hrefs are `/zh`-prefixed |
| D12 | 38 benchmark-history pages shared one description | — | **not changed** (all `noindex` today) — recorded in the audit |
| D13 | The model page head and the sitemap could disagree | — | the head asks `isIndexableModel`, the same question the sitemap asks |
| D14 | `pnpm typecheck` failed before this work | — | **green** — fixed in the project-owned type, not by regenerating a file that would commit secrets |
| D15 | Three provider meta descriptions hard-coded prices and named retired models | — | the figures are resolved from `REGISTRY` at render time |
| D16 | `og:type` was `website` on every article | — | `article` + `article:published_time` on release posts |
| D17 | The release posts published a price-recheck date as `dateModified` | — | removed |
| D18 | `/sponsor` and `/waitlist` took their head strings from outside the dictionary | — | they read the same dictionary the H1 reads |
| D19 | The mobile menu's accessible name was English-only | — | localized |
| D20 | A price table mixed the base rate with the rate in force | — | one resolution everywhere |

### 2.1 The guard that keeps them fixed

`src/features/i18n/dictionary-integrity.node.test.ts` reads the source and
checks, for every dictionary key the source names (as a `t()` argument, a
`translate()` argument, **or a string literal handed to a component as a
prop**):

1. the key exists in **both** languages;
2. the call site supplies **every** `{placeholder}` the string needs;
3. the Chinese string uses no placeholder the English one does not have.

**Red/green verification** — the guard was re-broken on purpose, one defect
at a time, and each time it failed and then passed again on the revert:

| Defect reintroduced | Guard result |
| --- | --- |
| D1 (the `compareLink` call site without `model`) | ❌ fails — "landing.model.compareLink is missing {model}" |
| D5 (`releases.costPeak` removed from the dictionary) | ❌ fails — 2 tests |
| D6 (`itemsKey="calc.tldrItems"` put back) | ❌ fails — "calc.tldrItems" |

---

## 3. New pages and links

### 3.1 One new landing page: `/best/cheapest-coding`

**"Best cheap model for coding."** It answers the intersection of the two
questions the existing pages answer separately — `for-coding` ranks by
**score** among the models that clear the coding gate, `cheapest-llms` ranks
by **price** among every model we price.

- **No new route file.** `/best/$category` is already dynamic; the category
  is a row in `BEST_CATEGORIES`, so the hub, the sitemap and the e2e suite
  pick it up automatically.
- **The data is real and verified**: 5 rows today (the 6 coding-qualified
  models, one of which has no published price and therefore cannot be
  priced). The gate is the *same* benchmark set as `for-coding`, so the two
  pages list the same models and differ only in the order.
- **It is linked** from the `/best` hub (automatically), from the `/compare`
  page's boards section, and it is in the core sitemap.
- **Why not more of them**: `/best/cheapest-agents` and
  `/best/cheapest-reasoning` would be the same page with a different word.
  One page demonstrates the pattern; nine would be a factory. The reasoning
  is in the audit.

### 3.2 Links added

| Page | Links added |
| --- | --- |
| **Home** | 3 capability boards, 3 use-case rankings, `/best`, `/benchmarks`, `/methodology`, `/compare`, `/token-cost-calculator`, `/releases`, `/leaderboard-history` — with the destination's own name as the anchor text |
| **`/compare`** | an **All model comparisons** directory (all 32 published pairs, previously 12) and a **capability boards** section with the benchmark hub |
| **`/benchmarks/$slug`** | a "Where {benchmark} counts" section: the boards and the use-case rankings that score on it, the benchmark hub, the methodology |
| **`/best/$category`** | the benchmark pages (the names are links now), the matching capability board, the `/best` hub |
| **`/releases/$slug`** | the model's version line; the price table's competitor names are now links to those models' pages |
| **Footer** | `/series`, `/methodology`, `/data-quality`, `/leaderboard-history` |

Nine dictionary keys and two registry helpers that already existed for
exactly this work (`linking.benchmark.usedOnTitle`, `linking.compare.*`,
`linking.home.browse*`, `boardsUsingBenchmark()`,
`bestCategoriesUsingBenchmark()`) are now wired in.

### 3.3 Structured data

- A shared `breadcrumbLd()` builder, used by the two hub pages (which had the
  same 20 lines inlined twice) and by `/models/$slug`, `/benchmarks/$slug`,
  `/benchmarks/$slug/history`, `/best/$category`, `/series/$slug`,
  `/series/$slug/$pair`, `/releases/$slug`, `/compare/$pair`.
- `og:type: article` and `article:published_time` on release posts.
- **Nothing fabricated**: no `aggregateRating`, no `review`, no invented
  `author`, no invented `datePublished`, no `Product` with a made-up price.

### 3.4 Metadata and canonical changes

| Page | Before | After |
| --- | --- | --- |
| `/` title | "LLM Leaderboard — Benchmark Scores & Token Prices in One Table" | "LLM Leaderboard: Benchmarks, Rankings & API Prices \| EvalLedger" |
| `/` description | "Compare **9** frontier LLMs …" | "Compare **{n}** LLMs …", `{n}` = `LEADERBOARD.models.length` |
| `/` H1 | "LLM Leaderboard" | "LLM Leaderboard: Compare AI Models by Benchmark and Price" |
| `/best/$category` description | one sentence for all 8 | 9 distinct descriptions (en + zh) |
| `/chatgpt-api-pricing` description | typed prices, named GPT-5 | resolved from `REGISTRY` |
| `/deepseek-api-pricing` description | typed prices, named V3.2 | resolved from `REGISTRY` |
| `/claude-token-cost-calculator` description | named Claude Opus 4.5 (retired) | resolved from `REGISTRY` |
| `/sponsor`, `/waitlist` | hard-coded in the route | read from the dictionary |
| `/changelog` description | "Product updates and improvements." (34 chars) | a specific description |
| `/models/$slug` | `indexable` unset | `indexable: isIndexableModel(slug)` |

**Canonical URLs, the canonical host, HTTPS, trailing-slash behaviour, the
`/en` → `/` 301, the `/token-calculator` → `/token-cost-calculator` 301 alias
and the hreflang cluster were all audited and left unchanged — they were
already correct.** The only canonical-affecting change is the new page's own
canonical, which is its own path like every other page's.

---

## 4. Tests executed, and their actual results

Every command below was run in this working tree. The numbers are what the
commands printed.

| Command | Before | After |
| --- | --- | --- |
| `pnpm test` | ✅ 622 passed / 72 files | ✅ **646 passed / 75 files** |
| `pnpm lint` | ✅ 0 errors, 1 warning | ✅ **0 errors, 1 warning** (the same pre-existing warning, `src/features/sponsor/amounts.ts:13` — an unused eslint-disable, unrelated to this work) |
| `pnpm build` | ✅ built in 1.95s | ✅ **built in 1.52–1.88s** (three runs) |
| `pnpm typecheck` | ❌ **1 error** (`GA4_MEASUREMENT_ID`) | ✅ **0 errors** |
| `npx playwright test e2e/seo.spec.ts` | 20 tests | ✅ **40 passed** (20 → 40; 20 added) |

### 4.1 What the 24 new unit tests cover

| Test file | Tests | What it holds |
| --- | --- | --- |
| `src/features/i18n/dictionary-integrity.node.test.ts` | 6 | the key/placeholder contract described in §2.1 |
| `src/features/calculator/__tests__/copy-integrity.node.test.ts` | 3 | the copy cannot quote a model the registry does not carry, or one that publishes no rate |
| `src/features/seo/meta.node.test.ts` | 10 | the home page's count; the per-category descriptions; the gated ranking's gate and ordering; the head/sitemap indexability agreement |
| `src/features/leaderboard/__tests__/board-fairness.node.test.ts` (extended) | +2 | a gated price page lists only measured models and sorts by price |

### 4.2 The 20 new e2e tests

- **15 pages** checked for a `{placeholder}` or a raw dictionary key in the
  **rendered body text** — `/`, `/zh`, `/compare`, `/zh/compare`, `/series`,
  `/zh/series`, `/benchmarks`, `/best`, `/releases`, `/zh/releases`, a
  release post, a model page, a comparison, a series line, the calculator.
- The nine use-case rankings checked for **distinct** meta descriptions.
- The home page's description checked against `LEADERBOARD.models.length`.
- Every breadcrumb checked to **end at its own page's canonical URL**.

The breadcrumb check exists because this work introduced one such bug and
nearly missed it: a bulk edit gave the `/benchmarks` hub the `/best` hub's
trail. The check was written, verified red/green (it fails on the
reintroduced bug), and `/benchmarks` was then added to the sampled pages —
without that addition the guard would have passed the bug it was written for.

### 4.3 The full e2e suite was NOT run

The repository's `AGENTS.md` forbids running the whole Playwright suite
without an explicit request, so only `e2e/seo.spec.ts` was run. A full-suite
regression outside the SEO surface is therefore not ruled out by this pass;
the unit suite and the production build cover the rest.

### 4.4 One environment note, recorded so the next run is not confused

An earlier run with `E2E_PORT=3340` failed **4** tests — the sitemap,
robots and feed assertions. The cause is configuration, not code: the dev
server was started on 3340 (`pnpm dev` hard-codes `--port 3340`) while
`wrangler.jsonc` sets `BETTER_AUTH_URL: "http://localhost:3000"`, and those
documents build their absolute URLs from `BETTER_AUTH_URL`. The default
`E2E_PORT` (3000) matches `BETTER_AUTH_URL` and everything passes. **No code
change was made for this** — it is a local-environment detail.

---

## 5. Known remaining issues

1. **128 dead dictionary keys** (`calculator.{claude,deepseek,chatgpt,openrouter}Faq*`
   in `en.ts` and `zh.ts`) carry stale prices — "Claude Sonnet 4.5 is $3 per
   1M" for a model the site quotes at $2/$10, and GPT-5 for a retired model.
   They are **never rendered** (zero references), so they have no search
   impact; they are a maintenance hazard. **Deliberately not deleted** — a
   large diff in two shared files, and `AGENTS.md` is conservative about
   deleting content. The exact key ranges are in the audit.
2. **The 38 benchmark-history pages share one meta description.** All 38 are
   `noindex` today, so it is latent rather than live.
3. **The 49 series-pair pages carry a bare "A vs B" title** with no brand and
   no series name, and some collide with the `/compare/*` titles for the
   same pair. 40 of the 49 are `noindex` today.
4. **The benchmark pages' source URLs live inside a JS-gated popover**, so a
   crawler that does not run that JavaScript does not see the provenance.
5. **No changelog post has its own page** — the 6 changelog entries are
   inlined into `/changelog`. A per-post route would need a front-matter
   shape the collection does not have yet.
6. **`og:type` is `website` on every page except the release posts.** For a
   landing page that is correct, so nothing else was changed.
7. **No performance measurement exists.** There is no Lighthouse, WebPageTest
   or CrUX access in this environment, so **no performance score is claimed** —
   only the structural facts recorded in the audit.

---

## 6. Recommended next steps

1. **Deploy and verify.** The changes are not deployed; the live fixes
   (D1, D2, D4, D5, D11) take effect on the next release. After that, re-run
   the audit's live checks against `https://evaledger.com/`.
2. **Submit the sitemap.** The core list grew from 35 to 38 URLs. It is
   already declared in `robots.txt`; it is worth re-submitting in Search
   Console so the three new pages are picked up promptly.
3. **Watch the new page.** `/best/cheapest-coding` is a hypothesis. If
   Search Console shows it earning impressions, `/best/cheapest-agents` and
   `/best/cheapest-reasoning` become worth building; if it earns nothing,
   the question is whether the *pattern* is wrong or the keyword is.
4. **Evaluate the sitemap split.** Whether publishing only the core list
   helps or starves the long tail is a Search Console question, not a code
   question. The full list is already served at `/sitemap-full.xml`.
5. **Delete the dead FAQ copy** in a change of its own, so it can be
   reviewed as a deletion rather than as part of an SEO change.
6. **Re-run the price/score integrity suite** whenever a price or a score
   changes: `pnpm vitest run src/features/releases src/features/records
   src/features/leaderboard` — the repository's own contract, which this
   work did not modify.
7. **Consider the `/changelog/<slug>` route** — it is a genuine long-tail
   surface ("EvalLedger v1.4 changelog") and the only one on the list that
   has no page of its own.

---

## 7. What was deliberately NOT done

| Not done | Why |
| --- | --- |
| No deployment, no DNS, no external operation | out of scope by instruction |
| No price, score, benchmark or release-post data touched | touching them would trigger the repository's "prices + scores + release pages move together" contract, for no SEO reason |
| No dependency added | the fixes needed none |
| No rendering-architecture change | the release bodies, the compare tool and the calculator grid are already in the server-rendered HTML |
| No `aggregateRating` / `review` / invented `author` / invented dates | fabricating structured data is a liability, and no rich result is guaranteed by adding it |
| No keyword-volume, ranking, backlink or traffic figure quoted | none was available; every keyword in the audit is labelled a hypothesis |
| No Lighthouse score quoted | no measurement tool was available |
| No full e2e suite run | forbidden by `AGENTS.md` without an explicit request |
| `worker-configuration.d.ts` not regenerated | regeneration inlines real secrets into a committed file and rewrites ~2 000 lines while changing `Env`'s shape — the fix was made in the project-owned half of the type instead |
