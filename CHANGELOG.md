# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Capability boards** — the leaderboard is now four boards (general
  intelligence, coding, agent, reasoning), each scoring on its own benchmarks
  with its own published weights. Every board states its formula, its
  weights, the field best each benchmark is normalized against, and what it
  deliberately excludes. New pages at `/leaderboard/{general,coding,agent,reasoning}`.
- **Composite scores that are actually comparable** — a model is ranked on a
  board only if it was measured on *every* core benchmark of that board. A
  model missing one is listed as "not tested" with the missing benchmark
  named, never averaged over the benchmarks it happens to have and never
  scored as zero. Per-benchmark scores are normalized against the best
  result anyone has published on that benchmark, so a 90% on one test and a
  90% on another no longer count for the same thing.
- **Custom weights** — the landing board can be re-weighted across the four
  boards plus price, and re-ranks itself. The price axis is logarithmic, so
  the cheapest model in the field scores 100.
- **Scoring methodology page** — `/methodology` publishes the whole of the
  site's arithmetic: every board, its benchmarks, their weights, the field
  best each is normalized against, and the source of every score.
- **Price breakdown** — prices are split into input, output, cached input,
  provider, channel (official API vs third-party router), published tiers and
  the date they were last verified. Every price now carries a dated timeline
  (`PriceWindow`), so a promotional rate and the rate it reverts to are both
  explicit, with their effective dates.
- **Data quality report** — `/data-quality` shows, per model, when its price
  was last verified, how many scores came from a vendor page vs a third-party
  evaluation vs a reference table, what changed since the previous version,
  and which boards it was measured on. Visitors can report a stale price, a
  wrong version or two contradictory scores, and the reports are triaged in
  the admin console. Reports are rows in the `data_report` D1 table; the fix
  a report produces is still an edit to the price file.
- **Storage** — Cloudflare R2 object storage wired end-to-end, with a working
  avatar upload (validated upload + private serving route). Zero-config locally
  via miniflare. See [`src/features/storage/`](src/features/storage/).
- **Security headers** — baseline headers (X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, Permissions-Policy, HSTS) on every response, plus a production
  Content-Security-Policy, via a custom worker entry.
- **Error boundary** — a styled 500 page (`defaultErrorComponent`) so uncaught
  render/loader errors no longer blank the screen.
- **Environment validation** — fail-fast zod schema validates required env on
  startup; conditional rules for OAuth pairs and Stripe; clear aggregated errors.
- **Bot protection** — optional Cloudflare Turnstile on sign-up / sign-in /
  password-reset, enabled when `TURNSTILE_*` keys are set (degrades gracefully).
- **Governance** — `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, and
  this changelog.
- **Local price-fetch script** — `pnpm prices:fetch` scrapes the official
  pricing pages for OpenAI, Anthropic, Google, DeepSeek, and Grok with a
  headless Chromium and writes `data/last-fetch.json` plus a stdout summary.
  All 5 providers have working selectors (table-based, regex on
  modelCard divs, SPA bg-card containers, etc.). See
  [`scripts/prices/README.md`](scripts/prices/README.md).
- **Price version pairing** — `SCRIPT_VERSION` (in `scripts/prices/version.ts`)
  and `REGISTRY_VERSION` (in `model-prices.ts`) move in lockstep; the script
  prints a warning at the end of every run when they diverge.
- **`--apply` mode** — `pnpm prices:fetch -- --apply` computes and previews
  the price-only diff that would be written to `model-prices.ts`. Pass
  `--yes` to actually write it. Only touches `inputPricePer1M` /
  `outputPricePer1M` / `cachedInputPricePer1M` / `contextWindow` +
  per-model `lastVerified` + top-level `fetchedAt`. Never bumps
  `registryVersion` (humans do that).

### Fixed

- **The custom-weight board no longer ranks a thin model over a full one.**
  When a model was missing one of the weighted boards, that board's weight was
  dropped from *both* the numerator and the denominator — so it was scored
  over a smaller denominator than its neighbours and could win outright (GPT-6
  astra ranked #1 on 50 of 125 weight). The custom board now applies the same
  coverage gate as the fixed boards: a model is ranked only if it was measured
  on **every** weighted board, every ranked row is divided by the **same**
  denominator, and the models that fail are listed with the boards they are
  missing named. Pinned by `src/features/leaderboard/__tests__/custom-weights.node.test.ts`
  and by a new e2e case that weights two boards at once — the old spec only
  ever weighted one, which is the one configuration the broken code happened
  to get right.
- **Every displayed price now resolves the dated band in force.** The board,
  the compare pages, the release price tables and the series ladder all read
  the registry's *base* rate, which for a model in a promotional band is the
  promotional number — so a temporary rate was presented as the standing
  price. All of them now go through the one resolver (`priceDetail`), the same
  one the calculator charges with, so a price the page shows and a price the
  calculator charges are the same number by construction. A promotional rate
  additionally carries a visible badge on the board rather than a hover
  tooltip.
- **Release articles that quote a promotional price now carry its dates.**
  Five posts (en + zh) quoted a banded model's rate with no end date, and the
  "2.5× the price of sol" comparisons would silently become wrong when the
  promotion ends. Each now states the window it holds for, and the multiples
  are scoped to it. All ten files had their `dataCheckedAt` bumped to
  2026-10-21.
- **The Chinese pages no longer print English service tiers.** Tier labels and
  notes came straight from the registry ("Batch", "Runs at half the standard
  rate."), so the `zh` pages mixed English into the price panel. They now go
  through a zh overlay in `model-notes.ts`, mirroring the existing price-window
  labels.
- **One band resolution, not two.** The data-quality page re-implemented band
  resolution with different semantics from the calculator's (raw string
  comparison, first match wins, "a later band exists ⇒ a promo is running").
  It now delegates to the same resolver, so the two can never disagree.
- **The data-quality page shows the evidence it had but did not render.** Each
  model now shows when its scores were measured, whether its price is the
  vendor's own rate or a router's quote, a link to every page its scores were
  read from, and whether the score set is still within the freshness window.
- **i18n** — the home route's `<meta name="description">` was hard-coded as two
  parallel `descByLocale` literals that concatenated `REGISTRY.fetchedAt`
  outside the i18n system. Moved to a new `marketing.homeMetaDescription` key
  (en + zh) with `{date}` interpolation; the en/zh dicts are the single source
  of truth for the description again.
- **REGISTRY freshness** — Google Gemini 2.5 Pro/Flash `cachedInputPricePer1M`
  were stale (0.31 / 0.075) vs. the current $0.125 / $0.03 the provider's
  pricing page shows for short-context cache reads. Updated to match.

### Changed

- **The leaderboard no longer averages over a different denominator per
  model.** The landing table's "Avg" column averaged whatever benchmarks a
  model happened to have, so a model measured on three easy tests could
  outrank one measured on seven hard ones and a reader could not tell from
  the page whether the comparison was fair. It is replaced by the
  coverage-gated composite described above; the `/best/*` pages go through
  the same gate.
- **Prices carry a dated timeline.** A model with a promotion now records
  its rate bands (`PriceWindow`) rather than only describing them in prose,
  so "this is the promotional rate and it ends on 2026-11-30" is data, not a
  sentence in a note. `REGISTRY_VERSION` / `SCRIPT_VERSION` moved to 0.8.0.
- **REGISTRY refresh** — added 5 active flagships the providers now market
  (GPT-6 astra/sol/luna, Fable 5.1, Opus 5.5, Sonnet 5, Gemini 3.1 Pro/3.8
  Flash/3.1 Flash-Lite/2.5 Flash-Lite, DeepSeek V4.1-Flash/V4-Pro, Grok 4.7)
  plus 7 GPT-5.6 entries and 11 Anthropic/GPT-5/4.1/o-series/DeepSeek V3.x/
  Grok 4 entries marked `delisted` (kept for long-tail search with explanatory
  `note`). Mapping table (`scripts/prices/mapping.ts`) extended to match.
  Google specialty models (image gen, TTS, robotics, embedding, omni) are
  intentionally out of scope — they don't fit the token-cost calculator frame.

### Notes

- **This release ships a D1 migration.** Migration `0022` creates the
  `data_report` table used by the correction-report intake. The deploy
  workflow (`.github/workflows/deploy.yml`) builds and deploys the Worker but
  never runs `wrangler d1 migrations apply`, so `pnpm db:migrate:prod` is a
  required manual step after this deploy. The report only records a claim;
  the fix it produces is still an edit to the price file.
- **Cloudflare resources now share the `evaledger-*` name.** The production
  D1, R2 and KV resources were recreated/renamed as `evaledger-db-prod`,
  `evaledger-files-prod` and `evaledger-cache-prod`. The production Worker
  name stays `tokencalculator-production` to avoid a custom-domain cutover.
  The unused staging environment was removed from the Wrangler config.
- **The drizzle snapshot chain was repaired.** `drizzle/meta/0020_snapshot.json`
  and `drizzle/meta/0021_snapshot.json` had a colliding `prevId` — both
  pointed at `0018`, and `0021` reused `0020`'s `id` — which broke
  `pnpm db:generate` repo-wide. The `id`/`prevId` links were rewritten to a
  coherent `0019 → 0020 → 0021` chain. No table content was changed; the
  repair is a separate concern from the feature and should be its own commit.
- This is the pre-release baseline. The first tagged release will become `[1.0.0]`.
- Known gaps tracked for production hardening: per-endpoint auth rate limiting,
  error/abuse monitoring, and analytics.
- The roadmap for the work that did **not** ship in this pass (best-value
  ranking, real task-cost estimation, model-upgrade advice, provider
  comparison, agent benchmarks, open data/MCP) is recorded in
  [`docs/roadmap-p1-p3.md`](docs/roadmap-p1-p3.md).

[Unreleased]: https://github.com/ymk/tokencalculator/commits/main
