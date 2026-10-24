# EvalLedger — internal links, canonical targets, metadata & indexability audit (round 2)

**Date:** 2026-10-24, 16:37–16:52 (+08:00) · **Target:** `https://evaledger.com/` (production)
· **Baseline:** deployed `main` @ `6dd36ab` ("增强seo"); production was confirmed to match this
baseline for the sitemap curation (live `/sitemap-core.xml` = 38 `<loc>` = 28 en + 10 zh, exactly
`CORE_PATHS` in `6dd36ab`). The working tree contained **unrelated in-flight edits by other
sessions** (benchmark version suffix, `/en` 301, sitemap expansion, e2e caps); they are **not**
deployed and are **not** part of this audit. One of them (`/en` 301) is noted where it overlaps a
finding.

**Mode:** read-only crawl. **No app source was edited.** The only repo write from this audit is
this file. Scratch crawler/analysis scripts live under `/tmp/seo2/` (`crawl.py`, `analyze*.py`,
raw HTML, `crawl.json`).

This is the **second-round** check after the round-1 audit
([`docs/seo-audit.md`](../seo-audit.md)) and its implementation report
([`docs/seo-implementation-report.md`](../seo-implementation-report.md)). Round-1 fixes that are
verified live again are listed in §6 and are **not** re-reported as defects. Findings below are
either (a) current-state defects the round-1 record did not catch, or (b) round-1 claims that do
**not** reproduce against HEAD/production.

---

## 0. Crawl at a glance

| Metric | Value |
| --- | --- |
| Sitemap URLs fetched (`/sitemap-full.xml`) | **262** (131 en + 131 zh); `/sitemap-core.xml` = 38 (28 en + 10 zh); `/sitemap.xml` is byte-identical to the core file |
| Link targets fetched (2 levels deep from the 262 sitemap pages, + the 26 remaining distinct targets reachable from level-2 pages) | **323** distinct internal URLs |
| Unique internal URLs validated in total | **585** |
| Internal `<a href>` found on the 262 sitemap pages | **16 497** (plus 719 external) |
| Internal link targets that did **not** end in `200` | **0** |
| Internal link targets that required a redirect hop | **0** |
| Sitemap URLs that redirect or 404 | **0 / 262** |
| HTTP errors on any fetched internal page | **0** |
| Sitemap URLs marked `noindex` | **0** |
| Indexable HTML pages missing from the sitemap | **0** |
| Canonical ≠ own URL (of the 262 sitemap URLs) | **0** |
| hreflang triad mismatches (page head and sitemap, 262 URLs) | **0** |
| Pages with ≠ 1 non-empty `<h1>` | **0** |
| Duplicate `<title>` across all 559 fetched unique pages | **0** |
| Duplicate meta descriptions | 17 indexable en/zh benchmark pairs (+ known noindex families, §5.2) |
| Anchor text containing `{placeholder}` residue | **0** |
| Anchors with empty visible text and no `aria-label` | **0** |

Method: `curl`/Python (`urllib`) crawl of the two sitemaps, then every same-origin `href` found on
those pages followed two levels deep; every response was fetched **without** following redirects
first so a 3xx target could be told apart from a 200 alias. All raw HTML was parsed for
`<title>`, meta description, `robots`, canonical, hreflang, `og:*`, `<h1>`, JSON-LD and `<a>`.
External links (719) were **not** crawled (out of scope; see §8).

---

## 1. Verdict

- **No P0.** The link graph is sound: 0 broken internal links among 585 fetched URLs (including
  every historical 404 risk round 1 fixed), 0 sitemap 404s, 0 redirecting sitemap URLs, every
  canonical self-referencing, every hreflang triad correct, and **no sitemap/indexability
  contradictions in either direction**.
- **Two canonical-URL findings are regressions against the round-1 written record**: the `/en`
  alias and every trailing-slash URL answer **307** (the round-1 report says `/en` → `/` is
  `301` and trailing-slash behaviour is already correct), and `http://` / `https://www.` hosts
  serve **200** instead of redirecting to `https://evaledger.com/` (the round-1 report says the
  canonical host and HTTPS are already correct). The pages still carry correct canonical tags;
  what is missing is the **redirect** signal.
- **One new P2**: `/sponsor` and `/waitlist` (both locales) are listed in the sitemap and
  indexable but have **zero inbound internal links** — sitemap-only orphans.
- **One new P2**: the 17 indexable Chinese benchmark pages (`/zh/benchmarks/*`) publish their
  **English** meta description, identical to the English twin → 34 duplicate descriptions across
  locales that hreflang is supposed to separate.
- **P3** items: duplicate benchmark anchors on leaderboard pages (up to 15× the same URL), title
  brand inconsistency (208/262 titles have no "EvalLedger", 4 of the 8 vendor pages do and 4
  don't), missing `og:site_name`/`twitter:title`, a noindex `/leaderboard-history` promoted in
  the footer of every page, one zh page linking to the English home page with a raw-domain
  anchor, and one generic "Open in the interactive comparator" anchor.
- **Round-1 claims that do not reproduce** (record drift, not new work): `/en` 301, trailing-slash
  301, canonical-host/HTTPS redirects, and a `BreadcrumbList` on `/leaderboard/$track` (§7).

Severity definitions used here: **P0** reader/crawler gets something broken; **P1** a page competes
with a duplicate address of itself and the permanent signal is missing; **P2** a real, fixable
indexing/link-equity defect or clearly wrong metadata; **P3** hygiene/consistency, no measurable
ranking claim.

---

## 2. Findings

### 2.1 Canonical URL & redirect hygiene

| ID | Severity | URL (pattern) | Observed | Expected | Evidence |
| --- | --- | --- | --- | --- | --- |
| **LM-1** | **P1** | `/en`, `/en/*` (any English-prefixed URL, e.g. `/en/best/for-coding`) | `307` → unprefixed URL | `301` — it is a permanent alias of the canonical English URL | `curl -sI https://evaledger.com/en` → `HTTP/2 307`, `location: /`. Source: `src/routes/{-$locale}/route.tsx` calls `redirect({ href: … })` with no `statusCode`, and TanStack Router's default redirect status is 307. The round-1 report (§3.4) says "`/en` → `/` 301 … already correct"; that does not reproduce at `6dd36ab`. In-flight working-tree edit adds `statusCode: 301` (not deployed). |
| **LM-2** | **P2** | Trailing-slash URLs, e.g. `/best/`, `/models/gpt-6-astra/`, `/zh/` | `307` → slash-less canonical | `308` (permanent) — same normalisation, permanent signal | `curl -sI https://evaledger.com/best/` → `307 location: /best`; `/models/gpt-6-astra/` → `307 location: /models/gpt-6-astra`. Chains: `/en/` → `307 /en` → `307 /`; `/token-calculator/` → `307 /token-calculator` → `301 /token-cost-calculator` (3 hops total). Round-1 report: "trailing-slash behaviour … already correct". |
| **LM-3** | **P2** | `http://evaledger.com/`, `https://www.evaledger.com/`, `http://www.evaledger.com/` | `200` (same app, `<link rel="canonical" href="https://evaledger.com/">`) | `301` to `https://evaledger.com/` | `curl -s -o /dev/null -w '%{http_code} %{redirect_url}'`: all three = `200` with empty redirect. The canonical tag is the only host/protocol signal; HSTS is present on HTTPS responses (`strict-transport-security: max-age=63072000; includeSubDomains; preload`), which covers browsers but not a plain-HTTP crawler. Round-1 report: "the canonical host, HTTPS … already correct". The fix is a host/protocol redirect rule (Cloudflare zone rule or Worker middleware) — no such rule exists in the repository's current redirect surface. |

**Regression status:** these are **not** changes introduced by `6dd36ab` (the locale redirect has
never carried `statusCode`; there is no host/protocol redirect in the repo). They are round-1
record accuracy problems plus a live canonical-consolidation defect. `/en` and the trailing-slash
forms are the two canonical-URL risk areas the round-1 report said were closed.

**What is correct:** the `/token-calculator` → `/token-cost-calculator` alias is a real **301**,
preserves the query (`/token-calculator?model=gpt-6-astra` → `/token-cost-calculator?model=gpt-6-astra`),
and is listed in neither sitemap nor any canonical/hreflang. `/EN`, `/zh/en` correctly `404`.
A case variant `/Models/gpt-6-astra` serves `200` but canonicalises to `/models/gpt-6-astra` and
points hreflang/`og:url` at the lowercase URL — acceptable, no action needed.

### 2.2 Orphan pages (sitemap-listed, indexable, no inbound internal link)

| ID | Severity | URL | Observed | Expected | Evidence |
| --- | --- | --- | --- | --- | --- |
| **LM-4** | **P2** | `/sponsor`, `/zh/sponsor`, `/waitlist`, `/zh/waitlist` | in the sitemap (indexable, `200`, self-canonical, correct hreflang), but **0 inbound internal `<a>`** from any of the 559 crawled pages, including the 262 sitemap pages and the nav/footer | at least one crawlable link from a relevant page (footer "Resources" or the pricing/calculator family) | Anchor scan over every fetched page: `href="/sponsor"` and `href="/waitlist"` occur **0** times; `grep -o 'href="/sponsor"' html/*.html \| wc -l` = 0. Source grep confirms the only `/sponsor` reference in `src/` outside the route itself is a Stripe return URL (`src/features/sponsor/actions.ts:50`), not a link. These URLs are discoverable only via the sitemap (or direct/bookmark). |

Round-1 §4.6 fixed the footer cluster for `/series`, `/methodology`, `/data-quality`,
`/leaderboard-history` — sponsor/waitlist were never linked and the sitemap still promotes them.
Not a round-1 regression, but a live orphan/orphan-sitemap inconsistency.

### 2.3 Metadata: Chinese benchmark pages publish the English description

| ID | Severity | URL(s) | Observed | Expected | Evidence |
| --- | --- | --- | --- | --- | --- |
| **LM-5** | **P2** | `/zh/benchmarks/<slug>` — 17 of the 17 indexable benchmark twins (`gpqa-diamond`, `hle`, `matharena-apex`, `terminal-bench-2.1/3.0/4.0`, `deepswe-v1.1`, `programbench`, `nl2repo-bench`, `cybergym`, `exploitgym`, `hle-tools`, `automation-bench`, `agents-last-exam`, `chartography-tools`, `babyvision-tools`, `zerobench-main-tools`) | `<html lang="zh">`, zh title (`… — 榜单`) and zh hreflang, but `<meta name="description">` is the **English** sentence, byte-identical to the en twin | a Chinese description, distinct from the English one | `curl -s https://evaledger.com/zh/benchmarks/gpqa-diamond \| grep description` → `Graduate-level physics, chemistry and biology questions written to be Google-proof.`; the en page has the same string. All 38 benchmark detail pairs (incl. the 21 noindex ones) do this; 17 pairs are in the sitemap. This is the only locale-language mismatch among the 262 sitemap pages (all other zh pages have Chinese descriptions; 0 en pages have CJK). |

This is related to, but distinct from, the known round-1 item "benchmark pages share one
description" (recommendation #23: per-benchmark descriptions). The **locale defect** (Chinese page
advertising English copy + duplicating its hreflang twin) was not in the round-1 record.

### 2.4 Cross-locale discoverability (deliberate trade-off; impact unverified)

| ID | Severity | Observed | Expected / note | Evidence |
| --- | --- | --- | --- | --- |
| **LM-6** | **P3 (verify in GSC)** | **0 crawlable anchors from any English page to any `/zh/*` URL** (the language switch is a `<button aria-label="Language">` whose href is built in JS; the string `"/zh` does not occur in the raw HTML of any en page). Conversely, zh pages have 0 anchors to English pages except one content link (§2.7) and the locale-neutral `/api/prices.json`. `robots.txt` advertises only `/sitemap-core.xml` (38 locs = 28 en + 10 zh); `/sitemap-full.xml` (262) is referenced by nothing (0/559 pages), and its non-advertisement is deliberate per `src/features/seo/seo.ts` (`buildRobots` comment). | If the zh cluster is meant to be discovered, an HTML `<a>` language switch (en ↔ zh) is the missing crawl path; hreflang annotations cluster existing URLs but are not a discovery mechanism. Otherwise this is an intentional index-budget trade-off and needs no change. | Raw-HTML scan: 0/131 en pages contain `/zh`; anchors: en→zh = 0, zh→en (excl. `/api/`) = 1. |

This is **not** a broken link and **not** a sitemap contradiction (all 131 zh pages are in the full
sitemap). Whether the 121 zh URLs that are absent from the core sitemap are indexed is a
Search-Console question (§8).

### 2.5 Duplicate identical links on one page

| ID | Severity | URL | Observed | Expected | Evidence |
| --- | --- | --- | --- | --- | --- |
| **LM-7** | **P3** | `/leaderboard/general`, `/leaderboard/coding`, `/leaderboard/agent`, `/leaderboard/reasoning` (+ zh twins) | the same benchmark URL is repeated with identical anchor text many times in one document — up to **15×** (`/leaderboard/reasoning` → `/benchmarks/matharena-apex` ×15; coding → `/benchmarks/programbench` ×13, `/benchmarks/nl2repo-bench` ×11; general → GPQA ×10, HLE ×8; agent → Automation-Bench ×10) | one link per benchmark is enough for navigation; the repeats come from the score-table header + the formula table + the "missing a score for …" list | Counter over anchors in the raw HTML of `/leaderboard/reasoning`: `href="/benchmarks/matharena-apex"` ×15, all visible text `MathArena Apex`. Not broken, not a ranking claim — link-graph noise only. This predates `6dd36ab` (the pattern is in `6282c5b`). |

Nav/footer duplicates (e.g. the footer repeats `Compare`, `Token Calculator` and the logo link on
every page) are normal chrome and are **not** reported as a defect.

### 2.6 Title/meta hygiene (P3, no ranking claim)

| ID | Severity | Observation | Count / examples | Evidence |
| --- | --- | --- | --- | --- |
| **LM-8** | **P3** | Title brand inconsistency | **208 / 262** sitemap titles contain no "EvalLedger". The split inside one page family is arbitrary: `/gemini-api-pricing`, `/grok-api-pricing`, `/minimax-api-pricing`, `/kimi-api-pricing` end with `— EvalLedger`, while `/chatgpt-api-pricing` (`ChatGPT API Pricing — GPT-5/5.6/6 Cost per Token`), `/deepseek-api-pricing`, `/claude-token-cost-calculator` and `/openrouter-pricing-calculator` have no brand. Hubs `/compare` (`Compare LLMs`), `/releases` (`Model Releases`) and `/series` (`Model version series`) have no brand, while `/methodology`, `/best/*`, `/data-quality`, `/changelog`, `/sponsor`, `/waitlist`, `/terms`, `/privacy` do. | title scan per URL (see `/tmp/seo2/analyze2.py`) |
| **LM-9** | **P3** | Title/description length outliers | 21 titles > 65 chars (longest: `/releases/kimi-k3-1` = 100, `/releases/grok-4-7` = 98) and 32 titles ≤ 20 chars (`/zh/compare` = 4, `/zh/releases` = 5, `/zh/series` = 6, `/compare` = 12, `/releases` = 14). 36 descriptions > 160 chars (longest `/releases/step-5-preview` = 342) and 73 < 70 chars (the 34 benchmark detail pages are 26–83 chars). | TRUNCATION RISK ONLY — not measured SERP behaviour. |
| **LM-10** | **P3** | `og:site_name` absent on **262/262**; `twitter:title` and `twitter:description` absent on 262/262 (`twitter:card` = `summary_large_image` is present). `og:title`, `og:url`, `og:type`, `og:image`, `og:locale` are present on all 262 and `og:url` == canonical on all 262. | all 262 sitemap pages | head scan |
| **LM-11** | **P3** | Neither sitemap carries `<lastmod>` (0 occurrences; 262 `<loc>`, 786 hreflang alternates, no `changefreq`/`priority`). Optional hint only. | `/sitemap-core.xml`, `/sitemap-full.xml` | XML parse |

### 2.7 Anchor-text quality

| ID | Severity | URL | Observed | Expected | Evidence |
| --- | --- | --- | --- | --- | --- |
| **LM-12** | **P3** | `/zh/changelog` (v1.3.0 entry) | body link `<a href="https://evaledger.com">evaledger.com</a>` — a Chinese page linking to the **English** home page, labelled with the raw domain | the anchor is content-meaningful (the sentence names the domain), but a zh reader lands on the English site; either label + target the zh home or leave the domain as plain text | anchor scan; source `src/content/changelog/v1-3-0.zh.md:10` |
| **LM-13** | **P3** | `/compare` + its zh twin (compare/series-pair pages) | 4 anchors labelled **"Open in the interactive comparator"** pointing at `/compare?models=…` (2 en + 2 zh) | the destination is named by its action, not by the models it opens | anchor scan: 4 occurrences, distinct query URLs |

**Verified clean on anchors:** no "Read more" / "Learn more" / "Click here" / "here"; no empty
anchors without an accessible name; no raw-path anchor introduced by this round (the 65 raw-path
labels are the release-body house style already accepted in round-1 §4.9). The round-1 weak
anchors that were deliberately left ("Run your usage →", "Score history →", "Price source →",
"Not tested · {n} benchmarks tracked →") are still present and are **not** re-reported.

---

## 3. Orphan & weak-page list

Inbound = distinct indexable sitemap pages linking to the URL (self-links excluded).

| Inbound | URL(s) | Status |
| --- | --- | --- |
| **0** | `/sponsor`, `/zh/sponsor`, `/waitlist`, `/zh/waitlist` | **orphans** — sitemap-only (LM-4) |
| **1** | `/best/1m-context-window`, `/best/cheapest-llms`, `/best/prompt-caching` (+ zh twins) | reachable only from the `/best` hub; never from home/nav/footer |
| **1** | `/series/claude-opus/opus-5.5-vs-opus-5`, `/series/deepseek-v4/{v4-pro-vs-v4-flash-0731, v4.1-flash-0910-vs-v4-flash-0731, v4.1-flash-0910-vs-v4-pro, v4.1-flash-1017-vs-v4-flash-0731, v4.1-flash-1017-vs-v4-pro, v4.1-flash-1017-vs-v4.1-flash-0910}`, `/series/kimi-k3/k3.1-pro-vs-k3`, `/series/minimax-m3/m3.1-flash-vs-m3` (+ zh twins) | reachable only from their series-line page; no hub/footer path |
| ≥ 2 | all other 234 sitemap URLs | healthy |

Note: `/best/for-coding`, `/best/for-agents`, `/best/for-reasoning` are linked from the home page
(round-1 fix) and have ≥ 2 inbound; the three categories above are not part of the home browse row.

---

## 4. Duplicate title / description / H1 matrix

### 4.1 Titles — **no duplicates**

0 duplicate `<title>` groups across all 559 fetched unique pages (including noindex families).
Every sitemap URL has a title; none is empty. The uniqueness claim holds page-by-page, en↔zh
included (zh titles are translated).

### 4.2 Descriptions — duplicates confined to benchmark families (+ auth/noindex)

| Group | Pages | Indexable? | Assessment |
| --- | --- | --- | --- |
| en↔zh benchmark detail pairs, 38 groups | 76 URLs (`/benchmarks/<slug>` + `/zh/benchmarks/<slug>`), 38 benchmark pairs | 17 pairs are in the sitemap/indexable; 21 pairs are `noindex` | **LM-5 / known item**: zh pages carry the identical English sentence. The 17 indexable pairs are a real cross-locale duplicate; per-benchmark descriptions remain the round-1 recommendation #23. |
| benchmark history, 2 groups | 76 URLs (`…/history` en and zh each 38) | all `noindex, follow` | **known** round-1 D12 — latent only (noindex), unchanged. |
| auth pages, 2 groups | `/login` + `/register`, `/zh/login` + `/zh/register` | `noindex` | out of the index; no action. |

Within the 262 sitemap URLs: **17 duplicate-description pairs (34 URLs), all `/zh/benchmarks/*`.**

### 4.3 H1 — duplicates only across locale twins (proper nouns)

56 duplicate-H1 groups (112 URLs): 18 model pages and 38 benchmark pages, each paired en↔zh with
the same H1 because it is a vendor/product proper name (`Claude Opus 5.5`, `GPQA Diamond`, …).
hreflang separates the twins; this is not a defect. All 262 sitemap pages have **exactly one
non-empty H1** and a meaningful one; no title/H1 duplication within a locale.

---

## 5. Indexability vs sitemap

### 5.1 Invariants that hold (all 262 sitemap URLs)

| Check | Result |
| --- | --- |
| sitemap URL returns 200 (no redirect, no 404/5xx) | **262/262** |
| canonical == own URL, exactly one canonical tag | **262/262** |
| `robots` meta on a sitemap URL | **0** (all indexable; absence = index,follow) |
| hreflang triad exactly `en` + `zh` + `x-default`, self-referencing, twin URLs correct | **262/262** (page head) and **262/262** (sitemap `<xhtml:link>`) |
| every hreflang target resolves 200 and is itself canonical (no redirecting/canonicalised alternate) | **262/262** |
| indexable HTML pages **absent** from the sitemap | **0** — the only non-sitemap 200 URLs are the JSON feed `/api/prices.json`, the `?model=` / `?a=&b=` / `?models=` query-state variants (self-canonicalise to their base page), and `noindex` pages |
| sitemap URL blocked by `robots.txt` | **0** — `robots.txt` disallows `/app`, `/*/app`, `/admin`, `/*/admin`, `/api/` (with an explicit `Allow: /api/prices.json`); no sitemap path matches |
| sitemap/robots consistency | `robots.txt` declares only `Sitemap: https://evaledger.com/sitemap-core.xml`; the core file is a subset of the full file; `/sitemap.xml` is byte-identical to the core file |

`/api/prices.json` is linked from the 18 calculator pages with the visible label
"机器可读: /api/prices.json" / "Machine-readable: /api/prices.json" — a deliberate machine-readable
price feed, explicitly allowed in `robots.txt`; not a defect.

### 5.2 Links from indexable pages to `noindex` pages (by design, quantified)

198 distinct `noindex` targets are linked from the 262 indexable pages. None of these is an error
(noindex pages may be linked), and none is listed in a sitemap.

| Category | Target URLs | Inbound links from indexable pages | Note |
| --- | --- | --- | --- |
| auth (`/login`, `/register`, ×2 locales) | 6 | 786 | header link on every page; correct to be `noindex` |
| benchmark history (`…/history`) | 76 | 110 | round-1 D12: `noindex` until the snapshot job lands |
| benchmark detail pages deemed thin | 42 | 400 | `noindex` by the indexability rule; linked from `/benchmarks` and comparisons |
| series lines/pairs deemed thin | 72 | 72 | `noindex` by the series indexability rule; linked from their line |
| `/leaderboard-history` (+ zh) | 2 | 262 | **P3 LM-14**: `noindex, follow`, not in the sitemap, yet linked from the footer of **every** page and from the home browse row. Deliberate noindex (data still pending) but the site is otherwise promoting the page. |

### 5.3 Other head facts (all 262 sitemap pages)

- `<html lang>` is `en` on en pages and `zh` on zh pages.
- `og:type`: `website` on 240 URLs, `article` on the 22 release URLs (round-1 fix holds).
- `og:url` == canonical and `og:title` == `<title>` on all 262; `og:image` = `https://evaledger.com/logo512.png` (resolves 200).
- JSON-LD present on 234/262. The 28 without any JSON-LD are `/changelog`, `/sponsor`, `/waitlist`, `/terms`, `/privacy`, `/methodology`, `/data-quality`, `/compare`, `/releases`, `/series` and the four `/leaderboard/*` pages, each ×2 locales. **214** sitemap pages carry `BreadcrumbList`; the 48 without it are those 28 hub/legal URLs plus the home pair (which has `Organization`/`WebSite` JSON-LD, no breadcrumb), `/token-cost-calculator` and the eight vendor launcher pages (each ×2 locales).
- Content is server-rendered: titles, descriptions, canonicals, hreflang, H1 and body copy are present in the raw HTML of every checked page (no client-only metadata).

---

## 6. Round-1 fixes re-verified live (not re-reported)

| Round-1 item | Live check |
| --- | --- |
| D1/D2 model-page anchors `{a} vs {b}` / `{model} model page` | **fixed** — 0 anchors contain `{placeholder}` residue; comparison anchors read `Claude Opus 5.5 vs GPT-6 Astra` etc. |
| D9 26 dead `/models/…` links | **fixed** — 0 internal 404s across 585 fetched URLs |
| D11 Chinese release post linked English pages | **fixed** — no zh release page has a non-`/zh` body link; the only zh→en content link is the intentional domain reference in the changelog (§2.7) |
| D3 home "9 LLMs" + brandless title | **fixed** — `/` title ends `\| EvalLedger`, description says "Compare 18 LLMs" (registry count), H1 is "LLM Leaderboard: Compare AI Models by Benchmark and Price" |
| D4/D5 raw dictionary keys in visible copy | **fixed** — no anchor/body residue found on the checked pages |
| D12 benchmark-history shared description | **known remaining** — still one description for 38×2 history pages, all `noindex` (latent) |
| D16 `og:type: article` on release posts | **holds** — 22 release URLs are `article` (+ `article:published_time`) |
| D17 `dateModified` removed from release BlogPosting | **holds** — no `dateModified` in the release JSON-LD |
| D13 head/sitemap indexability agreement | **holds** — 0 contradictions both directions |
| `/token-calculator` 301 alias, query preserved, not in sitemap | **holds** (§2.1) |
| Internal links never use `/en`, trailing slash or the old alias | **holds** — 0 such internal hrefs; all link targets are the canonical 200 address |
| hreflang cluster | **holds** — 0 mismatches, both in head and in the sitemaps |

---

## 7. Round-1 written claims that do not reproduce at `6dd36ab` (record drift)

These are **not** defects introduced by this round's crawl; they are places where the round-1
report/audit states a state that HEAD and production do not have. They are listed so the next
audit does not treat them as landed.

| Round-1 claim | Live/HEAD reality |
| --- | --- |
| `/en` → `/` is a **301** (`seo-implementation-report.md` §3.4; "canonical URLs … already correct") | **307** (`LM-1`). HEAD's `route.tsx` omits `statusCode`; TanStack default is 307. |
| Trailing-slash behaviour "already correct" (§3.4) | trailing slash → canonical is **307**, not a permanent 308 (`LM-2`). |
| "the canonical host, HTTPS … already correct" (§3.4) | `http://` apex and `https://www.` serve **200** with no redirect; only the canonical tag differs (`LM-3`). |
| `/leaderboard/$track` gained a `BreadcrumbList` (`seo-audit.md` §7.3, implementation report §3.3) | no JSON-LD at all on `/leaderboard/{general,coding,agent,reasoning}` (×2 locales); the route's `head()` calls `localeHead()` only. `BreadcrumbList` exists on the other deep families (214 sitemap pages). |
| `/series`, `/series/$slug` both have `BreadcrumbList` (§7.3) | `/series` hub has `ItemList` but **no** `BreadcrumbList`; `/series/$slug` and `/series/$slug/$pair` do. |

---

## 8. Explicitly unverified (no Search Console / analytics / external data)

1. **Index status of any URL.** Nothing in this document claims a page is indexed or not; the
   sitemap/indexability checks are eligibility checks only.
2. **Whether `/sitemap-full.xml` is submitted in Search Console.** It is deliberately not
   advertised in `robots.txt` (`buildRobots()` comment: "a declared sitemap is an invitation, and
   the long tail is not what this site is asking to be ranked for"). If it is not submitted, the
   121 zh URLs outside the core list and the long-tail model/comparison pages depend on hreflang
   clustering and external links — a discovery question only GSC can answer (`LM-6`).
3. **Whether the 307 / no-redirect host variants actually lose consolidation** — Google's handling
   of 307 vs 301 and of `http://`/`www.` duplicates cannot be measured from here.
4. **Impact of the duplicate benchmark anchors** on crawl/click behaviour — not measurable.
5. **Rich-result eligibility** for the JSON-LD (FAQPage/BlogPosting/BreadcrumbList) — GSC-only.
6. **Query-state URLs** (`?model=`, `?models=`, `?a=&b=`) are indexable per robots/meta and
   canonicalise to their base page; whether Google indexes or ignores them is GSC-only.
7. **Whether `/app` (robots-disallowed) contains links to `/sponsor`/`/waitlist`** — not crawled by
   design; the orphan finding is scoped to public, crawlable pages.
8. **External link targets** (719 external anchors) were not crawled; their status is out of scope.
9. **Crawl budget / impressions / CTR / rankings** — no data source exists for them here.
10. **`/login`, `/register` being `noindex`** is treated as intentional; no GSC question attached.

---

## 9. Reproduce

Scratch workspace: `/tmp/seo2/` (raw HTML for all 559 fetched pages, `crawl.json`).

```bash
mkdir -p /tmp/seo2 && cd /tmp/seo2

# 1) sitemaps + robots
for u in sitemap-core.xml sitemap-full.xml sitemap.xml robots.txt; do
  curl -sS --max-time 30 "https://evaledger.com/$u" -o "$u"
done
grep -o '<loc>' sitemap-core.xml | wc -l     # 38
grep -o '<loc>' sitemap-full.xml | wc -l     # 262

# 2) crawl (Python 3, stdlib): sitemap URLs + every internal href 2 levels deep,
#    following redirects manually so a 3xx target is visible.
python3 crawl.py      # writes crawl.json + html/ ; source in /tmp/seo2/crawl.py

# 3) analysis used for this report
python3 analyze.py    # canonical/robots/h1/og/hreflang/duplicates, all pages
python3 analyze2.py   # the same restricted to the 262 sitemap URLs
python3 analyze3.py   # link graph: statuses, locale, dup anchors, inbound counts

# 4) redirect / host evidence (one-liners)
curl -sI https://evaledger.com/en | grep -iE '^(HTTP|location)'
curl -sI https://evaledger.com/en/ | grep -iE '^(HTTP|location)'
curl -sI https://evaledger.com/best/ | grep -iE '^(HTTP|location)'
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://evaledger.com/
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.evaledger.com/

# 5) zh benchmark description (LM-5)
curl -s https://evaledger.com/zh/benchmarks/gpqa-diamond | grep -o '<meta name="description"[^>]*>'

# 6) orphan evidence (LM-4)
curl -s https://evaledger.com/ | grep -o 'href="/sponsor"' | wc -l   # 0
curl -s https://evaledger.com/sitemap-full.xml | grep -o '/sponsor' | wc -l  # listed
```

**Constraints honoured:** read-only audit; no application source, sitemap, route or public URL was
changed; the full Playwright suite was not run; nothing was deployed. The only repository write is
this document.
