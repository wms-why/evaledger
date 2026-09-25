# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Storage** — Cloudflare R2 object storage wired end-to-end, with a working
  avatar upload (validated upload + private serving route). Zero-config locally
  via miniflare. See [`src/content/docs/storage.md`](src/content/docs/storage.md).
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

- **i18n** — the home route's `<meta name="description">` was hard-coded as two
  parallel `descByLocale` literals that concatenated `REGISTRY.fetchedAt`
  outside the i18n system. Moved to a new `marketing.homeMetaDescription` key
  (en + zh) with `{date}` interpolation; the en/zh dicts are the single source
  of truth for the description again.
- **REGISTRY freshness** — Google Gemini 2.5 Pro/Flash `cachedInputPricePer1M`
  were stale (0.31 / 0.075) vs. the current $0.125 / $0.03 the provider's
  pricing page shows for short-context cache reads. Updated to match.

### Changed

- **REGISTRY refresh** — added 5 active flagships the providers now market
  (GPT-6 astra/sol/luna, Fable 5.1, Opus 5.5, Sonnet 5, Gemini 3.1 Pro/3.8
  Flash/3.1 Flash-Lite/2.5 Flash-Lite, DeepSeek V4.1-Flash/V4-Pro, Grok 4.7)
  plus 7 GPT-5.6 entries and 11 Anthropic/GPT-5/4.1/o-series/DeepSeek V3.x/
  Grok 4 entries marked `delisted` (kept for long-tail search with explanatory
  `note`). Mapping table (`scripts/prices/mapping.ts`) extended to match.
  Google specialty models (image gen, TTS, robotics, embedding, omni) are
  intentionally out of scope — they don't fit the token-cost calculator frame.

### Notes

- This is the pre-release baseline. The first tagged release will become `[1.0.0]`.
- Known gaps tracked for production hardening: per-endpoint auth rate limiting,
  error/abuse monitoring, and analytics.

[Unreleased]: https://github.com/ymk/tokencalculator/commits/main
