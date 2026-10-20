# claude.md

Guide for AI coding agents (Claude Code, Codex, etc.) working in this repo.

## What this is

EvalLedger — a free token cost calculator built on **TanStack Start + Cloudflare Workers**, with D1 (SQLite) + KV, Drizzle ORM, better-auth, Stripe, Resend, and Tailwind v4. Compares LLM pricing across OpenAI, Claude, Gemini, DeepSeek, and Grok, plus an OpenRouter-aware markup factor and a Claude subscription-vs-API break-even block.

## Structure

- `src/features/*` — vertical feature slices, each self-contained (schema / server fns / actions / components): `admin`, `analytics`, `audience`, `auth`, `billing`, `changelog`, `email`, `i18n`, `leaderboard`, `maintenance`, `notifications`, `records`, `releases`, `seo`, `storage`, `theme`, `waitlist`.
- `src/routes/{-$locale}/` — file-based routes with an optional locale prefix (`/` = en, `/zh` = zh). Top-level routes (`api`, `sitemap`, `robots`) live outside the locale group.
- `src/components/` — `ui/` primitives + `marketing/` landing + `app/` shell.
- `src/db/` — Drizzle client + `schema.ts` barrel; tables in `src/db/tables/` and feature `*.schema.ts`.

## Conventions

- **Env:** read from `@/lib/env` (re-exports `cloudflare:workers`). Never use `process.env`. In server-only modules read env **lazily** inside the function (`const { env } = await import('@/lib/env')`) so pure cores stay node-testable.
- **i18n:** `src/features/i18n/dictionaries/en.ts` + `zh.ts` must be structurally identical (`zh` is typed `Dict = typeof en`). Add every key to both.
- **DB:** Drizzle + D1 migrations — `pnpm db:generate` then `pnpm db:migrate:local`; register new tables in `src/db/schema.ts`.
- **No mock, graceful degradation:** optional integrations (Resend, Stripe, Turnstile, Sentry, analytics) switch off when their env keys are absent — keep that behavior.
- **Routes:** after adding a route, run `pnpm build` before `pnpm typecheck` (the route tree is generated at build).
- **Tests:** Vitest — node pool (`*.node.test.ts`) for pure logic, workers pool (`*.workers.test.ts`) for D1; the workers pool does NOT auto-apply migrations (hand-create tables in `beforeAll`).
- **E2E (Playwright):** `e2e/` covers every public page with a real browser (`pnpm e2e`, needs `npx playwright install chromium`); it is NOT part of the CI gate. The route inventory in `e2e/helpers/routes.ts` derives the dynamic pages from the same registries the pages read (REGISTRY / LEADERBOARD / BENCHMARKS / SERIES) and reads the release posts from `src/content/releases/` — **a new model, benchmark, series or release post is covered by the suite the moment it lands**; never hand-list the slugs. Specs assert against the i18n dictionaries (`t('en', '…')` from `e2e/helpers/i18n.ts`), never against literal sentences. `/admin/*` is out of scope (no back office).
- **Never run the full Playwright suite on your own initiative** — 全量 e2e 除非用户主动要求，否则不要跑. `pnpm e2e` (or `npx playwright test` over the whole `e2e/` directory) is an explicit-human-action command: it boots a dev server, drives ~480 browser tests and takes minutes. Writing or editing specs is fine; verifying a **single** spec file (`npx playwright test e2e/<file>.spec.ts`) is fine and expected — but the whole suite runs only when the user asks for it by name. If a change plausibly needs the full suite, say so and let the user decide.
- **Wrangler pin:** `wrangler` in package.json must be exactly `4.151.1` (not `^4.151.1`) to satisfy `@cloudflare/vite-plugin@1.64.0`'s peer range `^4.151.0`. The old `4.95.0` pin caused `pnpm dev`/`pnpm build` to fail with "The installed version of Wrangler (4.95.0) does not satisfy the peer dependency". When bumping vite-plugin, bump wrangler to its peer range and re-run `pnpm build`.
- **SEO structured data (JSON-LD):** use `jsonLd(obj)` from `@/features/seo/seo` and pass the result through the `scripts` option of `localeHead()` — it folds them into `meta`. `head()` only renders `meta` and `links`; a `scripts[]` key in the returned head object is silently dropped (this used to break JSON-LD on every page — it now works). Reference impl: `src/routes/{-$locale}/index.tsx` (Organization + SoftwareApplication + FAQPage).
- **Rebrand gotchas:** marketing components carry hardcoded brand strings (GitHub URLs, `<span className="kicker">` copy, aria-labels) that are NOT in i18n dictionaries. When rebranding: `grep -rln -E "(OldBrand|oldbrand)" src` catches i18n + hardcoded + package.json + wrangler in one pass. Also `grep` old strings in `*.node.test.ts` — i18n-key assertions break silently.
- **The domain is one variable:** `BETTER_AUTH_URL` is the origin every absolute URL is derived from — canonical + hreflang, `og:url`, `sitemap.xml`, `robots.txt`, `feed.xml`, the Stripe return URLs, and every auth/verification email link. Change it and the whole site follows; forget it and the site advertises URLs that don't resolve. The custom domains themselves live in `wrangler.jsonc` (`env.production.routes`, `custom_domain: true`) and, in CI, are injected from the repo variable `CF_PROD_DOMAIN` by `.github/scripts/gen-wrangler.mjs` — which also rewrites `BETTER_AUTH_URL` to `https://$CF_PROD_DOMAIN`, so the two can never drift. `AUTH_TRUSTED_ORIGINS` (comma-separated) is the escape hatch for a host that still serves the app but isn't the canonical one: without it better-auth's CSRF origin check rejects sign-ins from that host.
- **Project context (EvalLedger):** this is a token-cost calculator product, forked twice from the upstream FlareStarter template (first into AIBookPlanner, then into TokenCalculator, now EvalLedger). The chrome (marketing/i18n, calculator, admin console, sponsor, feedback) is fully rebranded; the root README is rebranded as of the post-A/B/C pass. Brand assets live in i18n dictionaries (`marketing.*`) + `src/components/brand/logo.tsx`. The actual Cloudflare infra (D1 database `aibookplanner-db`, R2 bucket `aibookplanner-files`, worker names) keeps the historical name and is **not** renamed in a rebrand — the worker name is load-bearing: renaming it deploys a *new* Worker that comes with none of the `wrangler secret put` values. Route slugs (`/token-calculator`, `/token-cost-calculator`) and the internal dict key `leaderboard.tokenCalculator` likewise stay: they describe the product, not the brand, and changing them breaks live URLs and every `t('en', …)` assertion.

## Commands

```bash
pnpm dev               # vite dev on :3000
pnpm typecheck         # fumadocs-mdx && tsc --noEmit
pnpm test                  # vitest run
pnpm e2e               # playwright run (browser e2e, not in CI)
pnpm build             # vite build
pnpm db:migrate:local  # apply D1 migrations locally
pnpm deploy:prod       # CLOUDFLARE_ENV=production build + wrangler deploy (staging: deploy:staging)
```

## Model price refresh

- Source: `src/features/calculator/model-prices.ts` (REGISTRY, hand-curated)
- Local fetch: `pnpm prices:fetch` (Playwright + Node 22 strip-types, no CI yet)
- Output: `data/last-fetch.json` + stdout summary
- Workflow: run fetch → diff JSON against REGISTRY → manually update REGISTRY
- Never auto-merge prices. `cacheWrite` / `longContext` / `peakOffPeak` / `promo` / `status` are human-only.
- See `scripts/prices/README.md` for selector-debugging workflow and provider mapping.

## Data moves as one: prices + scores + release pages

`src/features/calculator/model-prices.ts` (prices),
`src/features/leaderboard/models.ts` (scores) and `src/content/releases/`
(the release pages) are three surfaces of the same facts. **When one of them
changes, the other two change in the same commit.** A price table that knows
about a model the articles still describe the old way is worse than no price
table at all.

The join keys:

- scores → prices: `LeaderboardModel.priceId` → `REGISTRY.models[].id`
- release page → prices: `modelId` / `compareModelIds` → `REGISTRY.models[].id`
- release page → scores: `modelSlug` / `compareSlugs` → `LEADERBOARD.models[].id`

| Change | What must move with it |
| --- | --- |
| A model ships | A REGISTRY entry + a LEADERBOARD row + a release page (en **and** zh) + a member row in the series it belongs to (`src/features/series/series.ts`) |
| A checkpoint ships (same SKU, new weights) | **A separate record, never a merged one**: a new REGISTRY row (the old checkpoint flips to `status: 'delisted'` and keeps its price), a new LEADERBOARD row (the old row keeps its scores), and a new release page — the two pages cross-link. Never fold two checkpoints' scores into one row, and never let one article quote the other checkpoint's numbers |
| A price changes | The REGISTRY price + `lastVerified` = today + `REGISTRY.fetchedAt` = today + every affected release page re-read with its `dataCheckedAt` bumped to today |
| A score is corrected or added | The LEADERBOARD score (+ a `history` snapshot when it overwrites one) + every affected release page re-read with its `dataCheckedAt` bumped to today |
| A model is retired | REGISTRY `status: 'delisted'` + the LEADERBOARD row + a line in the release page saying it is retired — **never delete the article**, it is a long-tail search entry |

`src/features/releases/__tests__/integrity.node.test.ts` enforces this
mechanically and fails the build on:

- an article quoting a price or score of a model it does **not** depend on
  (the tables moved, the prose did not),
- a dependency whose data changed after the article's `dataCheckedAt`
  (the article is older than the data it describes),
- a leaderboard model with no release page and no `POST_EXEMPTIONS` entry,
- a post that ships in one language only, or points at a model that is gone.

So: **after touching prices or scores, re-read the affected articles and bump
their `dataCheckedAt` to today**, then run `pnpm test`. Anything still red is
a page you have not re-read yet.

## Records: one model version = one record, and old records do not change

`src/features/records/ledger.ts` is a fourth surface: it pins **what we
published** — each record's scores, its caveats, its identity, and (for
retired records) its historical price line.

The rule it protects:

> **Every iteration is a release. Even a suffix-only change — DeepSeek's
> V4.1-Flash `-0910` → `-1017` — is a new model version: a new REGISTRY row,
> a new LEADERBOARD row, a new release page, a new ledger entry. Published
> data is not edited in place; it is retired and frozen.**

- A new checkpoint: new ids, new article, new ledger entry; the predecessor
  gets `retiredAt` and a non-active price row, and the new entry points at it
  with `supersedes`.
- A pinned value changes **only** through a logged change in the ledger
  entry: `correction` (we published a wrong number) or `remeasurement` (the
  source re-measured the same weights). Both need a date, a reason and a
  source. A retired record accepts corrections only.
- A **live** price may move without a change entry — prices are facts about
  the vendor's billing page and carry their own discipline
  (`lastVerified`, `fetchedAt`, re-read articles). A **retired** record's
  price line is a historical fact and is pinned.

`src/features/records/__tests__/records.node.test.ts` fails the build when a
price row or leaderboard row has no ledger entry, when a pinned value changed
without a logged change, when a superseded record was not retired, or when two
records in one family share a version token. `pnpm records:pins` prints the
ledger as it stands; the workflow is in `src/features/records/README.md`.

## Model Releases series (`/releases`)

The third series, next to the leaderboard and the calculator: one post per model
launch, rewritten as a cost-and-switch analysis. Full contract in
`src/features/releases/README.md` — read it before adding a post.

- **Articles carry no price tables.** A post stores only *keys* (`modelId`,
  `modelSlug`, `compareModelIds`, `compareSlugs`); every price, ratio and score
  on the page is resolved from REGISTRY / LEADERBOARD at render time by
  `src/features/releases/data.ts`. The body may quote a price in prose (the
  TL;DR usually does), but it must be a registry price or a multiple derived
  from one — never a hand-copied table, never a number the registry does not
  contain. The guard test enforces exactly that.
- **Locale convention:** `<slug>.md` (en) + `<slug>.zh.md` (zh), one shared URL
  slug. The zh file is a native rewrite, not a translation.
- **Never borrow another SKU's scores.** A post without `modelSlug` renders an
  honest empty state instead of a score table.
- **Guard test:** `src/features/releases/__tests__/integrity.node.test.ts` fails
  the build if an article quotes a price or score the registries do not contain
  (or one of a model the article does not depend on), points at a missing
  model, ships without its zh counterpart, is older than the data it quotes,
  or leaves a leaderboard model without a release page.
- **Drafting:** `pnpm releases:fetch` scrapes the vendor announcement into
  `data/release-drafts/` — drafts only, never `src/content/releases/`, never
  prices or conclusions.

## Model Series (`/series`)

The fourth series: **every version of one vendor product line, side by side** —
"is the new version worth switching to, and what actually changed?". The
leaderboard ranks models across vendors, `/compare/$pair` pits two hand-picked
models against each other, `/releases` analyses one launch; none of them
answers "how does this line's new version compare with the one we already
run?". Full contract in `src/features/series/README.md` — read it before
adding a line or a member.

- **A series stores keys, never numbers.** `src/features/series/series.ts` holds
  the member list (`priceId` / `scoreId` only); every price, ratio, score and
  cost on the page is resolved from REGISTRY / LEADERBOARD at render time by
  `src/features/series/data.ts`. A price change updates every series page that
  mentions it, and a series page can never contradict the calculator.
- **Membership is curated, not derived.** `REGISTRY.models[].family` mixes
  generations and tiers (`gpt-5` holds GPT-5, 5-mini, 5-nano *and* 5.6 sol /
  cyber), so the lines, their members and their order are written down by hand
  and held to the registries by the guard test.
- **Never interpolate, never borrow.** A version without a traceable score
  renders an honest empty state; a version's score row is only ever its own.
- **Only compare what both versions report.** Version averages are computed
  over the benchmarks *every* scored member of the line publishes, and the
  "which version is strongest" claim disappears when that set is empty.
- **Guard test:** `src/features/series/__tests__/series.node.test.ts` fails the
  build if a member points at a missing registry/leaderboard row, if the
  versions are not newest-first, if a registry model of a series' family is
  missing from the line (or from `FAMILY_EXCLUSIONS`, with a reason), or if a
  reported price/context change does not add up.
- **URLs:** `/series` (index), `/series/$slug` (one line),
  `/series/$slug/$pair` (two versions of that line, e.g.
  `/series/claude-opus/opus-5.5-vs-opus-5`). Cross-line comparisons stay on
  `/compare/$pair`.
