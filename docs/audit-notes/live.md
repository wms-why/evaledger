# Live technical SEO audit — evaledger.com (second round)

**Date:** 2026-10-24 · **Auditor:** live-audit (read-only) · **Method:** `curl` against
production + static inspection of `git show HEAD:…`; scratch data in `/tmp/seo`.
No app source was modified; no Playwright suite, no deploy, no URL changes.

**Baseline.** Production serves the deployed tree of **HEAD `6dd36ab`**: live home
title = `LLM Leaderboard: Benchmarks, Rankings & API Prices | EvalLedger` (HEAD
`dictionaries/en.ts:49`), live `/sitemap-core.xml` = HEAD `CORE_PATHS` (28 en) +
`CORE_ZH_PATHS` (10 zh) = 38 URLs, byte-for-byte URL set identical. So live ≈ HEAD;
the working-tree sitemap expansion and the `route.tsx` 301 change are **not**
deployed and are treated below as pending fixes, not as live defects.

Severity: **P0** reader/crawler sees broken text · **P1** page competes with itself ·
**P2** permanent/duplicate-address or cross-locale contradiction · **P3** missed
opportunity / incomplete markup.

---

## 1. Live defects (current state)

| ID | Sev | URL(s) | Expected | Actual (evidence) |
| --- | --- | --- | --- | --- |
| L1 | **P2** | `/en`, `/en/*` | 301 → unprefixed URL (permanent locale alias) | **307**: `curl -w '%{http_code} %{redirect_url}'` → `/en` **307 → /**; `/en/token-cost-calculator` **307 → /token-cost-calculator**; `/en/models/claude-opus-5.5` **307 → /models/claude-opus-5.5**. HEAD `src/routes/{-$locale}/route.tsx` calls `redirect({href})` with no `statusCode`; TanStack `redirect()` defaults to **307** (`router-core/.../redirect.js:12,20`). Fix exists uncommitted in working tree (`statusCode: 301`). |
| L2 | **P2** | any path + `/` | 301/308 → no-slash URL | **307**, app-generated (response carries the Worker's CSP/HSTS from `src/lib/security-headers.ts`). `/models/claude-opus-5.5/` **307 → /models/claude-opus-5.5**; same for `/benchmarks/hle/`, `/compare/<pair>/`, `/series/kimi-k3/`, `/best/for-coding/`, `/releases/kimi-k3-1/`, `/leaderboard/coding/`, `/zh/compare/`, `/zh/releases/kimi-k3-1/`. No `trailingSlash`/308/307 handler in HEAD (`git grep 307 HEAD -- src` = HSTS line only). |
| L3 | **P2** | redirect chains | single hop | 2-hop chains when L1/L2 compose: `/en/` **307→/en →307→/** (2 redirects); `/en/token-calculator?model=gpt-5` **307→/token-calculator?model=gpt-5 →301→/token-cost-calculator?model=gpt-5**; `/token-calculator/?model=gpt-5` **307→/token-calculator?model=gpt-5 →301→/token-cost-calculator?model=gpt-5** (`%{num_redirects}` = 2, final 200). Query is preserved throughout. |
| L4 | **P2** | `http://evaledger.com/*` | 301/308 → `https://…` | **200 OK served over plain HTTP** (`curl -D - http://evaledger.com/` → `HTTP/1.1 200 OK`, `server: cloudflare`, full 56,976-byte home HTML). HSTS header is present but only applies after a first HTTPS visit. Canonical is correct: `http://…/` and `http://…/models/claude-opus-5.5` both emit `<link rel="canonical" href="https://evaledger.com/…">`, so duplicate is canonical-mitigated, not host-consolidated. |
| L5 | **P2** | `https://www.evaledger.com/*` | 301 → apex | **200 OK duplicate** (`www…/models/claude-opus-5.5` → 200, 36 KB, canonical = `https://evaledger.com/models/claude-opus-5.5`). `wrangler.jsonc` `env.production.routes` serves `www.evaledger.com` as a `custom_domain`, and no redirect rule exists. Canonical + hreflang on www all point at apex, so mitigated. |
| L6 | **P2** | `https://tokencalculator.flowmails.net/` | 301 → `https://evaledger.com/` | **200 OK duplicate** 56,976-byte home HTML with correct apex canonical; legacy `custom_domain` route is still live (comment in `wrangler.jsonc` says "retire it once evaledger.com is verified"). |
| L7 | **P2** | 17 zh benchmark pages | localized zh meta description | **English description identical to the en twin.** e.g. `/zh/benchmarks/hle` and `/benchmarks/hle` both `<meta name="description" content="Humanity's Last Exam — a broad frontier-knowledge set. …">`. All 17: `gpqa-diamond`, `hle`, `matharena-apex`, `terminal-bench-{2.1,3.0,4.0}`, `deepswe-v1.1`, `programbench`, `nl2repo-bench`, `cybergym`, `exploitgym`, `hle-tools`, `automation-bench`, `agents-last-exam`, `chartography-tools`, `babyvision-tools`, `zerobench-main-tools` (7 of them also `<60` chars; max 133). Root cause: HEAD `src/routes/{-$locale}/benchmarks/$slug/index.tsx` uses `loaderData.benchmark.description` (English registry string) for both locales. |
| L8 | **P3** | `/sitemap-core.xml`, `/sitemap.xml`, `/sitemap-full.xml` (38 / 38 / 262 URLs) | `<lastmod>` per URL | **No `<lastmod>` at all** (`re.findall('<lastmod>')` = 0 on all three; `buildSitemap()` in `src/features/seo/seo.ts` never emits one). Freshness signal absent; change dates cannot be verified by a crawler. |
| L9 | **P3** | `/sitemap.xml/`, `/robots.txt/`, `/feed.xml/` | 307 → canonical no-slash URL | **200 duplicate resource** (`/sitemap.xml/` `200 application/xml` with the full sitemap body; `/robots.txt/` `200 text/plain`; `/feed.xml/` `200 application/rss+xml`). Trailing-slash normalization is inconsistent: HTML routes 307, machine routes 200. |
| L10 | **P3** | `/MODELS/claude-opus-5.5`, `/TOKEN-COST-CALCULATOR`, `/Terms` | 301/404 | **200 duplicate** (same content, canonical = lowercase canonical, hreflang triad correct); `/ZH` is 404. Route matching is case-insensitive for en paths only. Canonical mitigates; duplicate addresses still resolve. |
| L11 | **P3** | `/leaderboard/{general,coding,agent,reasoning}` (+zh) | BreadcrumbList as stated in `seo-implementation-report.md` §7.3 | **No JSON-LD at all** (`<script type="application/ld+json">` count = 0; HEAD route imports only `localeHead`, no `breadcrumbLd`). Report claim ≠ live/HEAD. |
| L12 | **P3** | `/methodology`, `/compare`, `/releases`, `/series`, `/changelog`, `/data-quality` (+zh) | BreadcrumbList like every deep page | **No JSON-LD** (28 of 262 sitemap pages have none; 14 paths × 2 locales). Every deep family (`/models/*`, `/compare/*`, `/benchmarks/*`, `/best/*`, `/series/*`, `/releases/*`) does have it. |
| L13 | **P3** | 22 `/releases/*` pages | Article rich-result required props | `BlogPosting` has `headline, description, datePublished, publisher, url, inLanguage, isBasedOn, about` but **no `image`, no `author`, no `mainEntityOfPage`** (22/22). Panel deliberately avoids invented authors (`seo-audit.md` §7.2); `image` is a real omission. |
| L14 | **P3** | metadata quality | unique, descriptive | `/compare` title = `Compare LLMs` (12 chars, no brand); zh hubs `模型对比` (4), `新模型发布` (5), `模型版本系列` (6). 36 descriptions > 160 chars (max 342, release posts), 49 < 60 chars (min 26). Titles unique, descriptions unique except L7. |
| L15 | **P3** | `/series/*` ItemList | every `ListItem` has `url` | `{"@type":"ListItem","position":2,"name":"Kimi K3.1 Pro Highspeed"}` has **no url** (member has no model page); valid schema but incomplete ItemList. |
| L16 | **P3** | HTML/sitemap/robots responses | explicit `Cache-Control` | **No `Cache-Control`** on HTML, sitemap or robots responses (25/25 sampled HTML pages `MISSING`); only `/api/prices.json` (`public, max-age=3600, stale-while-revalidate=86400`) and `/feed.xml` (`max-age=3600`) set it. `X-Robots-Tag` absent everywhere (good — no accidental header noindex). `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` present on 25/25 sampled pages. |
| L17 | **P3** | `/en/index.html` | 404 or 301 to a 200 | **307 → `/index.html` → 404**: a redirect that lands on a 404 (`/en/index.html` 307 Location `/index.html`; `/index.html` 404). `/index.html` alone is correctly 404. |

No **P0** and no **P1** found: every duplicate address above resolves to a page whose
canonical points at the one canonical URL, and every tested unknown path returns a
real 404 (§5).

---

## 2. Redirect matrix (raw evidence)

`curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}'` unless noted.

| Request | Status | Location |
| --- | --- | --- |
| `/token-calculator` | **301** | `/token-cost-calculator` |
| `/token-calculator?model=gpt-5` | **301** | `/token-cost-calculator?model=gpt-5` (query preserved) |
| `/token-calculator?model=deepseek-v4-pro` | **301** | `/token-cost-calculator?model=deepseek-v4-pro` |
| `/zh/token-calculator` | **301** | `/zh/token-cost-calculator` |
| `/zh/token-calculator?model=gpt-5` | **301** | `/zh/token-cost-calculator?model=gpt-5` |
| `/en` | **307** | `/` |
| `/en/` | **307** | `/en` (then 307 → `/`) |
| `/en/token-cost-calculator` | **307** | `/token-cost-calculator` |
| `/en/token-calculator?model=gpt-5` | **307** | `/token-calculator?model=gpt-5` (then 301) |
| `/en?model=gpt-5` | **307** | `/?model=gpt-5` |
| `/token-calculator/` | **307** | `/token-calculator` (then 301) |
| `/token-calculator/?model=gpt-5` | **307** | `/token-calculator?model=gpt-5` (then 301) |
| `/zh/` | **307** | `/zh` |
| `/models/claude-opus-5.5/` | **307** | `/models/claude-opus-5.5` |
| `//models/claude-opus-5.5` | **308** | `/models/claude-opus-5.5` (edge collapse, correct) |
| `/index.html` | **404** | — |
| `/en/index.html` | **307** | `/index.html` (→ 404) |
| `/EN`, `/ZH`, `/zh/zh` | **404** | — |
| `http://evaledger.com/token-calculator` | **301** | `http://evaledger.com/token-cost-calculator` (scheme not upgraded) |

Alias target `/token-cost-calculator` returns 200 with self-canonical
`https://evaledger.com/token-cost-calculator`, so the 301 is well-formed; only the
**status code of the locale alias and of trailing-slash normalization** is temporary (307).

---

## 3. Sitemaps & robots

All sitemap URLs fetched with `curl` (no `-L`): **262/262 in `/sitemap-full.xml`
return 200**, 0 redirects, 0 canonical mismatches (`<link rel=canonical>` == `<loc>`
exactly), 0 `noindex`. `/sitemap.xml` and `/sitemap-core.xml` are **byte-identical**
(md5 `2296b0bde2b5…`, 13,704 bytes, 38 URLs = 28 en + 10 zh); `core ⊂ full`, 0 missing.

| Check | Result |
| --- | --- |
| `/sitemap.xml` | 200 `application/xml`, 38 URLs, = core |
| `/sitemap-core.xml` | 200 `application/xml`, 38 URLs, declared in robots |
| `/sitemap-full.xml` | 200 `application/xml`, 262 URLs (131 en / 131 zh), intentionally **not** declared |
| XML well-formed, no duplicate `<loc>` | valid (`xml.etree` parse), 0 dups, 114 / 786 `xhtml:link` |
| hreflang per URL | exactly 3 (`en`, `zh`, `x-default`); en↔zh reciprocity verified URL-by-URL; `x-default` = en URL |
| HTML hreflang == sitemap hreflang | **262/262 identical** (`<link rel="alternate" hrefLang=…>`) |
| `<lastmod>` | **0/262 present** (L8) |
| noindex URLs in sitemap | 0 (195 linked noindex pages — 76 benchmark history, 42 thin benchmarks, 68 series pairs, 4 series lines, 2 leaderboard-history, 3 auth — are correctly excluded) |
| robots.txt | `200 text/plain`; `User-agent: *`, `Allow: /`, `Allow: /api/prices.json`, `Disallow: /*/app /app /*/admin /admin /api/`, `Sitemap: https://evaledger.com/sitemap-core.xml` (matches `buildRobots()` at HEAD). No disallow matches an intended indexable path; `/api/prices.json` 200 `application/json` (longest-match Allow). |
| linked pages in sitemap | every one of **551** distinct internal page links fetched: 551/551 return 200; 195 are `noindex`, the other 356 canonicals are all in `/sitemap-full.xml` (0 missing). |

---

## 4. JSON-LD (all 262 sitemap pages)

| Check | Result |
| --- | --- |
| Parse | 0 errors; 0 missing `@context`; 0 duplicate `@type` in one page; 0 blocks that are not objects |
| Types present | `BreadcrumbList` 214, `FAQPage` 22, `BlogPosting` 22, `SoftwareApplication` 18, `ItemList` 36, `Organization` 2, `WebSite` 2 |
| `BreadcrumbList` | positions sequential 1..n; **last item URL == page canonical** on every page; all 222 distinct breadcrumb/item URLs return **200** with no redirect |
| `FAQPage` | 22 pages; **every Question `name` found verbatim in the visible HTML** (0 mismatches); no empty `mainEntity`; zh calculator FAQ is Chinese (no English leak) |
| Fabricated ratings | **none** — no `aggregateRating`, `review`, `reviewRating` anywhere; `SoftwareApplication.offers` is `price "0", USD, Free` (honest) |
| `url` vs canonical | home `Organization`/`WebSite` `url` = `https://evaledger.com` (canonical is `https://evaledger.com/`; harmless); all `SoftwareApplication.url` and `BlogPosting.url` equal the page canonical exactly |
| Missing entirely | 28 pages (L11, L12) |
| `BlogPosting` gaps | 22/22 missing `image`, `author`, `mainEntityOfPage` (L13); no `dateModified` — prior fix D17 verified |

---

## 5. Headers, soft-404s, SSR

- **Headers** (25 random sitemap pages + home/model/sitemap/robots): `content-type`
  correct (`text/html; charset=utf-8`, `application/xml`, `text/plain`);
  `Strict-Transport-Security` on 25/25; **no `X-Robots-Tag` on any response**;
  `Cache-Control` missing on HTML/sitemap/robots (L16). 404s: `content-type` HTML, 404 status.
- **Soft-404 (all real 404):** `/models/nonexistent-model`, `/compare/bogus-vs-bogus`,
  `/benchmarks/bogus-benchmark`, `/releases/bogus-post`, `/best/bogus`,
  `/leaderboard/bogus`, `/nonexistent-page-xyz`, `/zh/nonexistent-page-xyz`,
  `/admin`, `/admin/records` → **404**; 404 body has `Page not found` H1, no canonical,
  no `noindex` meta (HTTP 404 is sufficient), and inherits the root brand title — no soft-404.
- **SSR:** raw HTML (no JS) contains title, meta description, canonical, hreflang,
  exactly **one `<h1>` on all 262 pages**, and body content (calculator grid, compare
  table incl. `$4.00 · $20.00`, release article, boards). **0 pages** contain a
  "Loading…" placeholder or `animate-pulse`; 0 pages have key content missing from raw HTML.
- **Regression checks against the previous audit (all verified fixed live):** no
  `{a}`/`{b}`/`{model}` placeholders and no dotted dictionary keys in the rendered
  text of 262 pages (D1/D2/D4/D5); home no longer says "9 frontier LLMs" (D3,
  description says 18, matches HEAD); internal links 0/551 broken (D9); zh pages link
  only `/zh`-prefixed internal pages except `/manifest.json` (D11); release pages are
  `og:type article`, all others `website` (D16); no `dateModified` (D17);
  `/token-calculator` 301 + `?model=` preserved (alias module is live).

---

## 6. UNVERIFIED (no data access — nothing invented)

1. **Search Console / Bing Webmaster:** index coverage, submitted-sitemap state, crawl
   stats, manual actions, rich-result eligibility/reports, CTR — no access.
2. **Rankings, impressions, clicks, search volume, keyword difficulty** — no keyword or
   analytics tool; this document contains no traffic or ranking number.
3. **Whether Google honours the core-vs-full sitemap split** (crawl-budget effect) — unknown.
4. **Core Web Vitals / Lighthouse / CrUX / real-user performance** — not measured; no score claimed.
5. **Backlinks, external 404s, external links to `/en` or `http://`** — no backlink/crawl data.
6. **Whether http/www/legacy-host duplicates are actually indexed** — canonical says apex,
   but index state requires Search Console.
7. **Repository-side parity of `/sitemap-full.xml` with HEAD registries** — not re-executed
   (would need a build); instead all live sitemap URLs were fetched and all internal
   links were verified, and the *core* list was diffed against HEAD `CORE_PATHS` exactly.
8. **The working-tree changes are not deployed** (sitemap expansion; `route.tsx` 301) — live
   behaviour above is HEAD behaviour.

## 7. Fix summary for the Lead

- **Code (HEAD):** add `statusCode: 301` to the `/en` locale redirect (working-tree patch
  already does this — deploy it); add an explicit permanent trailing-slash redirect
  (301/308) since no handler exists at HEAD; localize benchmark meta descriptions (L7).
- **Config (Cloudflare, not repo source):** enable http→https redirect; 301
  `www` → apex and 301 the legacy `tokencalculator.flowmails.net` host → apex (or retire
  the legacy custom domain); this removes L4/L5/L6 duplicates at the source.
- **Optional/P3:** emit `<lastmod>`; add BreadcrumbList to boards/hubs; add `image`
  (and `mainEntityOfPage`) to `BlogPosting`; give ItemList items a `url`; add
  `Cache-Control` to HTML/sitemap/robots; normalize machine-route trailing slashes;
  consider `caseSensitive`/edge rules for uppercase duplicates.
