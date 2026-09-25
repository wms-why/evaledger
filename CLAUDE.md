# claude.md

Guide for AI coding agents (Claude Code, Codex, etc.) working in this repo.

## What this is

TokenCalculator — a free token cost calculator built on **TanStack Start + Cloudflare Workers**, with D1 (SQLite) + KV, Drizzle ORM, better-auth, Stripe, Resend, and Tailwind v4. Compares LLM pricing across OpenAI, Claude, Gemini, DeepSeek, and Grok, plus an OpenRouter-aware markup factor and a Claude subscription-vs-API break-even block.

## Structure

- `src/features/*` — vertical feature slices, each self-contained (schema / server fns / actions / components): `admin`, `analytics`, `audience`, `auth`, `billing`, `changelog`, `docs`, `email`, `i18n`, `maintenance`, `notifications`, `seo`, `storage`, `theme`, `waitlist`.
- `src/routes/{-$locale}/` — file-based routes with an optional locale prefix (`/` = en, `/zh` = zh). Top-level routes (`api`, `sitemap`, `robots`, `docs`) live outside the locale group.
- `src/components/` — `ui/` primitives + `marketing/` landing + `app/` shell.
- `src/db/` — Drizzle client + `schema.ts` barrel; tables in `src/db/tables/` and feature `*.schema.ts`.
- `src/content/docs/` — in-app docs, grouped into `getting-started/`, `features/`, `platform/`, `customization/` (read `platform/cf-gotchas.mdx` before touching Workers/D1 specifics).

## Conventions

- **Env:** read from `@/lib/env` (re-exports `cloudflare:workers`). Never use `process.env`. In server-only modules read env **lazily** inside the function (`const { env } = await import('@/lib/env')`) so pure cores stay node-testable.
- **i18n:** `src/features/i18n/dictionaries/en.ts` + `zh.ts` must be structurally identical (`zh` is typed `Dict = typeof en`). Add every key to both.
- **DB:** Drizzle + D1 migrations — `pnpm db:generate` then `pnpm db:migrate:local`; register new tables in `src/db/schema.ts`.
- **No mock, graceful degradation:** optional integrations (Resend, Stripe, Turnstile, Sentry, analytics) switch off when their env keys are absent — keep that behavior.
- **Routes:** after adding a route, run `pnpm build` before `pnpm typecheck` (the route tree is generated at build).
- **Tests:** Vitest — node pool (`*.node.test.ts`) for pure logic, workers pool (`*.workers.test.ts`) for D1; the workers pool does NOT auto-apply migrations (hand-create tables in `beforeAll`).
- **Wrangler pin:** `wrangler` in package.json must be exactly `4.95.0` (not `^4.95.0`). `@cloudflare/vite-plugin@1.39.0` calls `wrangler.unstable_getWorkerNameFromProject`, removed in later 4.x — `pnpm build` fails with `TypeError: wrangler.unstable_getWorkerNameFromProject is not a function` if pnpm resolves to 4.106+. Bump vite-plugin first and re-check before touching the pin.
- **SEO structured data (JSON-LD):** use `jsonLd(obj)` from `@/features/seo/seo` and pass the result via `scripts[]` to `localeHead()`. TanStack Router's head() returns `{ meta, links, scripts }` and renders scripts as `<script type="application/ld+json">` in `<head>`. Reference impl: `src/routes/{-$locale}/index.tsx` (Organization + SoftwareApplication + FAQPage).
- **Rebrand gotchas:** marketing components carry hardcoded brand strings (GitHub URLs, `<span className="kicker">` copy, aria-labels) that are NOT in i18n dictionaries. When rebranding: `grep -rln -E "(OldBrand|oldbrand)" src` catches i18n + hardcoded + package.json + wrangler in one pass. Also `grep` old strings in `*.node.test.ts` — i18n-key assertions break silently.
- **Project context (TokenCalculator):** this is a token-cost calculator product, forked twice from the upstream FlareStarter template (first into AIBookPlanner, then here). The chrome (marketing/i18n, calculator, admin console, sponsor, feedback) is fully rebranded; the in-app docs under `src/content/docs/*` and the root README are now also rebranded as of the post-A/B/C pass. Brand assets live in i18n dictionaries (`marketing.*`) + `src/components/brand/logo.tsx`. The actual Cloudflare infra (D1 database `aibookplanner-db`, R2 bucket `aibookplanner-files`, worker names) keeps the historical name and is not renamed in this rebrand.

## Commands

```bash
pnpm dev               # vite dev on :3000
pnpm typecheck         # fumadocs-mdx && tsc --noEmit
pnpm test                  # vitest run
pnpm build             # vite build
pnpm db:migrate:local  # apply D1 migrations locally
pnpm deploy:prod       # CLOUDFLARE_ENV=production build + wrangler deploy (staging: deploy:staging)
```
