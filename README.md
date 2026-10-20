# EvalLedger

> **See what your LLM tokens actually cost — across every major model.**

A free token cost calculator built on **TanStack Start** + **Cloudflare Workers**. Paste a prompt (or enter monthly usage), pick the tokenizer family, and get a live cost breakdown across OpenAI, Claude, Gemini, DeepSeek, and Grok — including the OpenRouter markup factor and a Claude-subscription-vs-API break-even calculator.

The pricing registry lives in [`src/features/calculator/model-prices.ts`](src/features/calculator/model-prices.ts) and is re-verified against each provider's official pricing page on every refresh — see the "Refresh workflow" comment at the top of that file.

**Live:** [evaledger.com](https://evaledger.com)

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
pnpm db:migrate:prod   # apply migrations to the prod D1
pnpm deploy:prod       # CLOUDFLARE_ENV=production build + wrangler deploy
```

## Refreshing prices

The calculator only stays honest if the registry stays current. The workflow lives at the top of [`src/features/calculator/model-prices.ts`](src/features/calculator/model-prices.ts):

1. Open each `sourceUrl`, confirm `inputPricePer1M` / `outputPricePer1M`.
2. Bump `lastVerified` to today's ISO date.
3. Bump `REGISTRY.fetchedAt` so the page can render "Updated YYYY-MM-DD".
4. Re-run `pnpm test && pnpm typecheck`.

## The Model Releases series

`/releases` is the site's third series, next to the leaderboard and the
calculator. Each post covers one model launch, rewritten as a cost-and-switch
analysis rather than a translation of the vendor's announcement.

The rule that keeps it worth reading: **the articles carry no prices.** A post
only stores the *keys* of the model it is about; every price, ratio and score
on the rendered page is resolved from the pricing registry and the leaderboard
when the page renders. A provider changes its prices, and every article that
mentions that model updates itself — an article can never contradict the
calculator.

The contract (frontmatter schema, article template, per-post fact sheets) lives
in [`src/features/releases/README.md`](src/features/releases/README.md). A
guard test fails the build if an article quotes a price the registry does not
contain, or points at a model that no longer exists.

Subscribe to the whole series over RSS at [`/feed.xml`](src/routes/feed[.]xml.ts)
— one feed, both languages, one item per article.

## The Model Series pages

`/series` is the site's fourth series: **every version of one vendor line,
side by side** — Claude Opus 5.5 vs Opus 5 vs Opus 4.8, GPT-6 astra vs sol vs
luna, DeepSeek V4.1-Flash vs V4-Pro. The leaderboard ranks models across
vendors, `/compare/$pair` pits two hand-picked models against each other and
`/releases` analyses one launch; none of them answers *"the line shipped a new
version — is the old one still worth running, and what actually changed?"*.

Same rule as the release posts: a series stores only the **keys** of its
versions. Every price, score, delta and monthly cost on the page is resolved
from the pricing registry and the leaderboard when the page renders, so the
pages cannot go stale and cannot contradict the calculator. Comparisons are
only made over benchmarks **both** versions publish — a version with no
verifiable score gets an honest empty state, never an estimate.

The contract lives in [`src/features/series/README.md`](src/features/series/README.md).

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
    admin/         # admin plugin wiring + dashboard
    analytics/     # CF Web Analytics (optional)
    audience/      # Resend audience sync (reused by waitlist)
    waitlist/      # pre-launch signup + Turnstile + Resend sync
    changelog/     # in-app changelog page (MDX-driven, per-locale)
    releases/      # "Model Releases" series — launch posts rewritten as cost analyses
    series/        # "Model Series" pages — every version of one vendor line, side by side
    storage/       # R2 upload + serving route (avatar upload reference)
    email/         # Resend client + string templates
    maintenance/   # Cron cleanup task (expired sessions/tokens/rate-limit rows)
    theme/         # light/dark theme toggle
  routes/
    {-$locale}/    # locale-prefixed pages: /, /zh, /admin, /app, /token-cost-calculator, ...
    api/, robots.txt, sitemap.xml
  content/changelog/  # in-app changelog content (fumadocs mdx sources)
  content/releases/  # "Model Releases" articles (fumadocs mdx sources, en + zh)
  db/              # Drizzle schema barrel + client + migrations
drizzle/           # generated SQL migrations
```

## Credits

This project started as a fork of [FlareStarter](https://github.com/FlareStarter/flarestarter) — the Cloudflare-native SaaS starter that gave us auth, billing, i18n, the admin shell, and the Workers/D1 wiring for free. We've since repurposed most of it for the calculator product; the auth/billing/sponsor/admin plumbing is essentially stock FlareStarter with the brand swapped.

## Contributing & support

- **Hit a snag?** [GitHub Issues](https://github.com/ymk/tokencalculator/issues).
- **Local setup / conventions:** [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Notable changes:** [`CHANGELOG.md`](CHANGELOG.md).

## Sponsor

❤️ [Sponsor the project](https://evaledger.com/sponsor) — your avatar shows up on the live sponsor wall, and it funds fresh price updates, new calculators, and the infra that keeps the tool free.

## License

[Apache License 2.0](LICENSE). Copyright 2026 EvalLedger.