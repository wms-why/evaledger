# claude.md

Guide for AI coding agents (Claude Code, Codex, etc.) working in this repo.

## What this is

EvalLedger — a free token cost calculator built on **TanStack Start + Cloudflare Workers**, with D1 (SQLite) + KV, Drizzle ORM, better-auth, Stripe, Resend, and Tailwind v4. Compares LLM pricing across OpenAI, Claude, Gemini, DeepSeek, and Grok, plus an OpenRouter-aware markup factor and a Claude subscription-vs-API break-even block.

## Structure

- `src/features/*` — vertical feature slices, each self-contained (schema / server fns / actions / components): `admin`, `analytics`, `audience`, `auth`, `billing`, `changelog`, `data-quality`, `email`, `i18n`, `leaderboard`, `maintenance`, `notifications`, `records`, `releases`, `seo`, `storage`, `theme`, `waitlist`.
- `src/routes/{-$locale}/` — file-based routes with an optional locale prefix (`/` = en, `/zh` = zh). Top-level routes (`api`, `sitemap`, `robots`) live outside the locale group.
- `src/components/` — `ui/` primitives + `marketing/` landing + `app/` shell.
- `src/db/` — Drizzle client + `schema.ts` barrel; tables in `src/db/tables/` and feature `*.schema.ts`.

## Where data lives: published data is files, submissions are intake

The rule that governs every change to this repo:

> **Published site content is a file in git. Submitted intake is a row.**
> Prices, scores, benchmarks, articles and the ledger are reviewed in diffs;
> correction reports, waitlist signups and feedback are operational rows.

- **Published data → files in git.** Model prices
  (`src/features/calculator/model-prices.ts`), scores
  (`src/features/leaderboard/models.ts`), benchmarks
  (`src/features/leaderboard/benchmarks.ts`), release articles
  (`src/content/releases/`), series (`src/features/series/series.ts`) and
  the records ledger (`src/features/records/ledger.ts`) are TypeScript and
  Markdown files. There is **no** `model`, `price`, `score` or `release`
  table in D1, and there must never be one: a price is a claim about a
  vendor's page, so it is reviewed in a diff and changed in a commit — not
  a row a request handler mutates.
- **Submitted data → D1 intake tables.** A correction report ("this price
  is stale") is a row in `data_report`
  (`src/features/data-quality/data-report.schema.ts`), triaged in the admin
  console like `waitlist` / `feedback`. It is intake, not site content: the
  report is a claim, and the **fix** it produces is still an edit to the
  price file. Never let a report become the source of a published price or
  score.
- **A migration that adds a table for published site content is a design
  error, not a feature.** Adding one is how this repo ends up with a
  database that disagrees with the files it is supposed to describe. The
  tables D1 *does* hold (`user`, `session`, `account`, `verification`,
  `rateLimit`, `subscription`, `processedWebhookEvents`, `waitlist`,
  `sponsorship`, `feedback`, `data_report`) are accounts, payments,
  moderation and intake — not site content.

**A migration is a schema change, not a feature.** `.github/workflows/deploy.yml`
deploys the Worker but never runs `wrangler d1 migrations apply`, so
`pnpm db:migrate:prod` is a **required manual step** after any deploy that
ships a migration. Before merging a migration, say so in the PR/commit. The
cheapest way to never say it: do not need one.


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
- **SEO titles and descriptions have hard budgets: title ≤ 60 characters, meta description ≤ 160 characters.** Write to the budget, not to "roughly" — a search result truncates around 60, and a description beyond 160 is ignored. The brand suffix (` — EvalLedger`) is appended once by `brandedTitle()` inside `localeHead()`; never type it into a route template, and keep the page subject ≤ 47 characters so the branded title fits 60. Two-model titles go through `pairTitle()` (`src/features/leaderboard/pair-title.ts`), which compresses a shared family prefix only when the unbranded pair exceeds 47. Both budgets are enforced: `src/features/seo/meta-budget.node.test.ts` (dictionary-, registry- and release-frontmatter-derived copy), `src/features/leaderboard/__tests__/pair-title.node.test.ts` (all compare/series pairs), and `e2e/seo.spec.ts` (rendered pages, including every vendor landing). A new page or a rewritten description that breaks either budget fails the suite — shorten the copy rather than raising the limit.
- **Rebrand gotchas:** marketing components carry hardcoded brand strings (GitHub URLs, `<span className="kicker">` copy, aria-labels) that are NOT in i18n dictionaries. When rebranding: `grep -rln -E "(OldBrand|oldbrand)" src` catches i18n + hardcoded + package.json + wrangler in one pass. Also `grep` old strings in `*.node.test.ts` — i18n-key assertions break silently.
- **The domain is one variable:** `BETTER_AUTH_URL` is the origin every absolute URL is derived from — canonical + hreflang, `og:url`, `sitemap.xml`, `robots.txt`, `feed.xml`, the Stripe return URLs, and every auth/verification email link. Change it and the whole site follows; forget it and the site advertises URLs that don't resolve. The custom domains themselves live in `wrangler.jsonc` (`env.production.routes`, `custom_domain: true`) and, in CI, are injected from the repo variable `CF_PROD_DOMAIN` by `.github/scripts/gen-wrangler.mjs` — which also rewrites `BETTER_AUTH_URL` to `https://$CF_PROD_DOMAIN`, so the two can never drift. `AUTH_TRUSTED_ORIGINS` (comma-separated) is the escape hatch for a host that still serves the app but isn't the canonical one: without it better-auth's CSRF origin check rejects sign-ins from that host.
- **Project context (EvalLedger):** this is a token-cost calculator product, forked twice from the upstream FlareStarter template (first into AIBookPlanner, then into TokenCalculator, now EvalLedger). The chrome (marketing/i18n, calculator, admin console, sponsor, feedback) is fully rebranded; the root README is rebranded as of the post-A/B/C pass. Brand assets live in i18n dictionaries (`marketing.*`) + `src/components/brand/logo.tsx`. Cloudflare resources are named `evaledger-*` (`evaledger-db[-prod]`, `evaledger-files[-prod]`, `evaledger-cache-prod`), but the production Worker name stays `tokencalculator-production`: renaming it deploys a *new* Worker with none of the existing secrets and forces a custom-domain cutover. Route slugs (`/token-calculator`, `/token-cost-calculator`) and the internal dict key `leaderboard.tokenCalculator` likewise stay: they describe the product, not the brand, and changing them breaks live URLs and every `t('en', …)` assertion.

## Commands

```bash
pnpm dev               # vite dev on :3000
pnpm typecheck         # fumadocs-mdx && tsc --noEmit
pnpm test              # vitest run
pnpm e2e               # playwright run (browser e2e, not in CI)
pnpm build             # vite build
pnpm db:migrate:local  # apply D1 migrations locally
pnpm deploy:prod       # CLOUDFLARE_ENV=production build + wrangler deploy
```

## Model price refresh

- Source: `src/features/calculator/model-prices.ts` (REGISTRY, hand-curated)
- Local fetch: `pnpm prices:fetch` (Playwright + Node 22 strip-types, no CI yet)
- Output: `data/last-fetch.json` + stdout summary
- Workflow: run fetch → diff JSON against REGISTRY → manually update REGISTRY
- Never auto-merge prices. `cacheWrite` / `longContext` / `peakOffPeak` / `promo` / `status` are human-only.
- See `scripts/prices/README.md` for selector-debugging workflow and provider mapping.

## A model launch is a changelog entry

**Rule: every time new model information is scraped, a changelog record is
produced — never skip it.** The `/changelog` page is published site content
(a file in `src/content/changelog/`, reviewed in a diff), so the scraper
**never** writes there. It writes a **changelog draft** next to the release
draft; a human fills it in and moves it when the launch ships.

- `pnpm releases:fetch` now emits, per scraped vendor, both the release draft
  and a changelog draft at `data/release-drafts/changelog/<slug>.md` (+
  `<slug>.changelog.json`). The two share one slug so a reviewer can never
  lose track of which model a draft belongs to.
- The changelog draft is skeletal: `title` / `description` / `version` are
  TODO placeholders (`version` stays `TBD` — the release train is a human
  decision), `published` stays `false`, and the body lists only the facts the
  scraper extracted. **No prices, no benchmarks** — quote them by reference
  to REGISTRY / LEADERBOARD, never hand-copied.
- When the launch ships: fill the draft, move it to
  `src/content/changelog/<version>-<slug>.md` (+ `.zh.md`), flip
  `published: true`, and run `pnpm typecheck && pnpm test`.
- The rule is enforced in code (`scripts/releases/changelog.ts`, tested in
  `scripts/releases/__tests__/changelog.node.test.ts`) and documented in
  `scripts/releases/README.md` §"Changelog drafts".

## A price is a timeline, not a number

A model with a promotion is not "one price" — it is a timeline. The registry
records that timeline as `priceWindows: PriceWindow[]` (a dated rate band:
`from`, optional `until`, the rates, a label) rather than describing it only
in prose. `tiers: PricingTier[]` records the service tiers a vendor
publishes next to the standard rate, and `channel` records whether the row
is the vendor's own price list (`official`) or a router's quote
(`aggregator` — the OpenRouter clone).

- `cost.ts` resolves the band whose `[from, until]` contains the date and
  falls back to the base price outside every band; `priceDetail(model, now)`
  exposes the same resolution as data. **The two must never disagree** —
  a price the calculator charges and a price the page shows are the same
  number by construction, not by convention.
- `appliedRule` names the band (`"Promotional rate (until 2026-11-21)"`),
  and `pricing-rule.ts` localizes it via `calculator.ruleWindow` /
  `calculator.ruleWindowUntil`. The Chinese band names live in
  `PRICE_WINDOW_LABELS_ZH` (`model-notes.ts`), mirroring `MODEL_NOTES_ZH`.
- **A promo window is a promise with a date.** Encoding a rate band means
  committing to when it ends — the figure and the expiry come from the same
  source, and the source is linked from the price detail. Never invent a
  band: only encode what the provider's own page already states.

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
| A model ships | A REGISTRY entry + a LEADERBOARD row + a release page (en **and** zh) + a member row in the series it belongs to (`src/features/series/series.ts`) + a changelog entry (en **and** zh) in `src/content/changelog/` |
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

## Capability boards: how a score is computed

`src/features/leaderboard/scoring.ts` is the site's scoring core. It exists
because the old "Avg" column averaged each model over **whatever benchmarks
it happened to have** — so a model measured on three easy tests could
outrank one measured on seven hard ones, and a reader could not tell from
the page whether the comparison was fair.

The rule it enforces:

> **A model is ranked on a board only if it was measured on every core
> benchmark of that board. A missing benchmark is "not tested" — never zero,
> and never a partial average over a smaller denominator.**

- A **track** (`TRACKS`) is a named capability: general, coding, agent,
  reasoning. Each declares `core` (the gate, with weights) and `context`
  (shown, never scored).
- **Normalization is per benchmark**: a score is `raw / fieldBest * 100`,
  where `fieldBest` is the best score ANY model has recorded on that
  benchmark. A raw 90% on one test and a raw 90% on another are not the
  same achievement, so they must not be averaged as if they were.
- Only `percent` benchmarks can enter a composite. A `rating` benchmark
  (codeforces) has no field best and is context-only.
- `rankTrack(track)` returns `{ ranked, incomplete }` — the two partition the
  registry. `incomplete` models are **listed, not hidden**, each with the
  benchmark it is missing.
- **Adding a model must not move anyone's score** unless it becomes the
  field best on a core benchmark. Pinned by
  `src/features/leaderboard/__tests__/board-fairness.node.test.ts`.

The same gate governs the `/best/*` pages (`categoryRows` →
`scoreAgainstCore`) and the data-quality page. If you add a benchmark, a
board, or a model, run `pnpm vitest run src/features/leaderboard` — the
fairness tests are the contract.

The **methodology page** (`/methodology`) and each **board page**
(`/leaderboard/$track`) publish this arithmetic: the formula, the weights,
the field best and who holds it, and the source of every score. A change to
the formula is a change to a published promise — update the copy in
`src/features/i18n/dictionaries/` (en **and** zh) in the same commit.

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
  prices or conclusions. Per the "A model launch is a changelog entry" rule,
  it also emits a changelog draft into `data/release-drafts/changelog/`; a
  human fills it in and moves it to `src/content/changelog/` when the launch
  ships.

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
