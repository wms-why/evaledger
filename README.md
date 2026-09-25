# TokenCalculator

> **See what your LLM tokens actually cost — across every major model.**

A free token cost calculator built on **TanStack Start** + **Cloudflare Workers**. Paste a prompt (or enter monthly usage), pick the tokenizer family, and get a live cost breakdown across OpenAI, Claude, Gemini, DeepSeek, and Grok — including the OpenRouter markup factor and a Claude-subscription-vs-API break-even calculator.

The pricing registry lives in [`src/features/calculator/model-prices.ts`](src/features/calculator/model-prices.ts) and is re-verified against each provider's official pricing page on every refresh — see the "Refresh workflow" comment at the top of that file.

**Live:** [tokencalculator.com](https://tokencalculator.com) · **Docs:** [tokencalculator.com/docs](https://tokencalculator.com/docs)

---

## What it does

- **Live token counting** — OpenAI models use the real tokenizer (`o200k_base` for GPT-5, `cl100k_base` for older families); Anthropic / Google / DeepSeek / Grok use a CJK-aware character approximation (~10% error for English, ~5% for Chinese).
- **Per-model cost breakdown** — every active model in the registry, sorted cheapest first. Switch to most-expensive, filter by provider, click to copy the estimate to clipboard.
- **Three SEO landing pages** — `/token-cost-calculator`, `/openrouter-pricing-calculator`, `/claude-token-cost-calculator` — each with its own hero, TLDR, FAQ, and tips block.
- **Claude break-even** — the Claude page shows where Claude Pro ($20/mo) and Claude Max ($200/mo) stop being cheaper than the API, computed live from the Sonnet 4.5 input/output rates.
- **OpenRouter markup factor** — the registry stores the current average markup (default 5%); every comparison shows the post-markup number.
- **Machine-readable** — same data at [`/api/prices.json`](src/features/calculator/api/prices.json.ts), designed for AI agents and programmatic access.

## What's inside

| Area | Notes |
|------|-------|
| **Calculator** | The product. Two input modes (paste / manual), live tokenization, OpenRouter-aware cost grid, three SEO routes. Source: [`src/features/calculator/`](src/features/calculator/). |
| **Sponsor** | A standalone `/sponsor` page on a real Stripe donation loop (one-time + monthly, WeChat Pay via Stripe). Custom amounts (PWYW) via `price_data.recurring`. GitHub avatar wall grouped by tier. |
| **Feedback** | In-app feedback box + admin governance (open / planned / shipped / closed + one-line replies). The vertical-slice template for any feature you add on top. |
| **Auth** | Email/password + Google OAuth via [better-auth](https://better-auth.com). OAuth buttons hide themselves when env vars are unset. |
| **i18n** | Path-based locale routing (`/` = en, `/zh` = zh). Translations in [`src/features/i18n/dictionaries/`](src/features/i18n/dictionaries/). |
| **SEO** | Per-locale sitemap, `hreflang`, canonical URLs, OpenGraph tags, `robots.txt`, JSON-LD (`Organization` + `SoftwareApplication/FinanceApplication` + `FAQPage`). |
| **Admin** | Admin-only console: stats dashboard, user search/ban/impersonate, waitlist + sponsors + feedback governance. |
| **Theme** | Light/dark follows system preference, persists in a cookie. |

## Tech stack

- **[TanStack Start](https://tanstack.com/start)** (React 19, file-based routing, server functions)
- **[Cloudflare Workers](https://workers.cloudflare.com)** runtime via `@cloudflare/vite-plugin`
- **[D1](https://developers.cloudflare.com/d1/)** (SQLite) + **[Drizzle ORM](https://orm.drizzle.team)** for auth, sponsors, feedback, waitlist
- **[KV](https://developers.cloudflare.com/kv/)** for caching, **[R2](https://developers.cloudflare.com/r2/)** for avatar storage
- **[better-auth](https://better-auth.com)** + **[Stripe](https://stripe.com)** + **[Resend](https://resend.com)**
- **[Tailwind CSS v4](https://tailwindcss.com)** + **[Vitest](https://vitest.dev)** (Node unit tests + Workers/D1 integration tests)

## Quick start

```bash
pnpm install
cp wrangler.example.jsonc wrangler.jsonc
cp .dev.vars.example .dev.vars       # everything is optional locally
pnpm db:migrate:local                # apply D1 migrations
pnpm dev                             # http://localhost:3000
```

### Scripts

```bash
pnpm dev               # vite dev on :3000
pnpm typecheck         # fumadocs-mdx && tsc --noEmit
pnpm test              # vitest run (node pool + workers pool)
pnpm build             # vite build
pnpm db:generate       # generate a Drizzle migration from schema changes
pnpm db:migrate:local  # apply migrations to local D1
pnpm db:migrate:prod   # apply migrations to the prod D1 (see docs/getting-started/deploy)
pnpm deploy:prod       # CLOUDFLARE_ENV=production build + wrangler deploy
```

## Refreshing prices

The calculator only stays honest if the registry stays current. The workflow lives at the top of [`src/features/calculator/model-prices.ts`](src/features/calculator/model-prices.ts):

1. Open each `sourceUrl`, confirm `inputPricePer1M` / `outputPricePer1M`.
2. Bump `lastVerified` to today's ISO date.
3. Bump `REGISTRY.fetchedAt` so the page can render "Updated YYYY-MM-DD".
4. Re-run `pnpm test && pnpm typecheck`.

## Project structure

```
src/
  features/
    calculator/    # the product — pricing registry, cost math, tokenizer, three SEO routes
    auth/          # better-auth + email/password + Google OAuth
    billing/       # Stripe subscriptions + lifetime + webhook
    sponsor/       # one-time/monthly Stripe + GitHub avatar wall + WeChat Pay
    feedback/      # submit + admin governance — the teach-by-example vertical slice
    i18n/          # en/zh dictionaries + provider
    seo/           # sitemap, robots, locale head tags, JSON-LD helpers
    docs/          # fumadocs source/layout + llms.txt generator
    admin/         # admin plugin wiring + dashboard
    analytics/     # CF Web Analytics (optional)
    audience/      # Resend audience sync (reused by waitlist)
    waitlist/      # pre-launch signup + Turnstile + Resend sync
    changelog/     # in-app changelog page (MDX-driven, per-locale)
    storage/       # R2 upload + serving route (avatar upload reference)
    email/         # Resend client + string templates
    maintenance/   # Cron cleanup task (expired sessions/tokens/rate-limit rows)
    theme/         # light/dark theme toggle
  routes/
    {-$locale}/    # locale-prefixed pages: /, /zh, /admin, /app, /token-cost-calculator, ...
    api/, docs/, docs-md/, llms.txt, robots.txt, sitemap.xml
  content/docs/    # in-app docs content (fumadocs mdx sources)
  db/              # Drizzle schema barrel + client + migrations
drizzle/           # generated SQL migrations
```

## Documentation

Docs are built into the main app — visit `/docs` to read them (powered by [Fumadocs](https://fumadocs.dev)):

- [`install.mdx`](src/content/docs/getting-started/install.mdx) — local setup
- [`deploy.mdx`](src/content/docs/getting-started/deploy.mdx) — production deployment
- [`migrations.mdx`](src/content/docs/getting-started/migrations.mdx) — D1 migration workflow
- [`codebase.mdx`](src/content/docs/getting-started/codebase.mdx) — directory structure
- [`environment.mdx`](src/content/docs/getting-started/environment.mdx) — env vars
- [`calculator.mdx`](src/content/docs/features/calculator.mdx) — calculator internals
- [`billing.mdx`](src/content/docs/features/billing.mdx) — Stripe + sponsor loops
- [`storage.mdx`](src/content/docs/features/storage.mdx) — R2 object storage
- [`cf-gotchas.mdx`](src/content/docs/platform/cf-gotchas.mdx) — Cloudflare/workerd pitfalls
- [`security.mdx`](src/content/docs/platform/security.mdx) — security headers/CSP, env validation, rate limiting

## Credits

This project started as a fork of [FlareStarter](https://github.com/FlareStarter/flarestarter) — the Cloudflare-native SaaS starter that gave us auth, billing, i18n, the admin shell, and the Workers/D1 wiring for free. We've since repurposed most of it for the calculator product; the auth/billing/sponsor/admin plumbing is essentially stock FlareStarter with the brand swapped.

## Contributing & support

- **Hit a snag?** [GitHub Issues](https://github.com/ymk/tokencalculator/issues).
- **Local setup / conventions:** [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Notable changes:** [`CHANGELOG.md`](CHANGELOG.md).

## Sponsor

❤️ [Sponsor the project](https://tokencalculator.com/sponsor) — your avatar shows up on the live sponsor wall, and it funds fresh price updates, new calculators, and the infra that keeps the tool free.

## License

[Apache License 2.0](LICENSE). Copyright 2026 TokenCalculator.