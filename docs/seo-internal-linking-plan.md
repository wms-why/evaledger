# Internal-linking / SEO landing-page plan (2026-10)

This is the contract for the current internal-linking work. Everyone reads it
before editing. It is a **plan**, not published site content.

> **Status: implemented.** Every item below shipped; the "Status" notes record
> where the work landed and the one place a decision had to be made against
> the plan's letter (the canonical calculator slug). The verification at the
> bottom is what actually ran.

## 0. Hard rules (from AGENTS.md — these still win)

- Published site content is a **file in git**. Prices live in
  `src/features/calculator/model-prices.ts`, scores in
  `src/features/leaderboard/models.ts`, benchmarks in
  `src/features/leaderboard/benchmarks.ts`.
  **Never invent a number.** If a page needs a price or a score, resolve it
  from REGISTRY / LEADERBOARD at render time.
- `src/features/i18n/dictionaries/en.ts` and `zh.ts` must stay structurally
  identical (`zh` is typed `Dict = typeof en`).
- Prices + scores + release pages move together. If a price changes, the
  affected release article is re-read and its `dataCheckedAt` bumped.
- Guard tests (`pnpm test`) must stay green. They fail the build on an
  article that quotes a number the registry does not contain.

## 1. File ownership (do not edit another owner's files)

| Owner | Files |
| --- | --- |
| **Lead** | `src/features/leaderboard/leaderboard.ts` (COMPARE_PAIRS, BEST_CATEGORIES), `src/features/seo/sitemap-paths.ts`, `src/features/seo/sitemap-core.ts`, `src/features/i18n/dictionaries/en.ts`, `src/features/i18n/dictionaries/zh.ts`, `src/routes/{-$locale}/token-calculator.tsx` |
| **hub** | `src/routes/{-$locale}/benchmarks.tsx`, `src/routes/{-$locale}/best/index.tsx`, `src/features/leaderboard/components/BenchmarkHubPage.tsx`, `src/features/leaderboard/components/BestHubPage.tsx`, `src/features/i18n/dictionaries/hub.ts` |
| **linking** | `src/features/leaderboard/components/LeaderboardBoard.tsx`, `Methodology.tsx`, `TrackBoard.tsx`, `CompareTool.tsx`, `BenchmarkDetail.tsx`, `src/routes/{-$locale}/compare/index.tsx`, `src/routes/{-$locale}/methodology.tsx`, `src/features/i18n/dictionaries/linking.ts` |
| **calc** | `src/features/calculator/**`, `src/routes/{-$locale}/token-cost-calculator.tsx`, `claude-token-cost-calculator.tsx`, `chatgpt-api-pricing.tsx`, `deepseek-api-pricing.tsx`, `openrouter-pricing-calculator.tsx`, `src/features/i18n/dictionaries/calc.ts` |
| **landing** | `src/routes/{-$locale}/gemini-api-pricing.tsx`, `grok-api-pricing.tsx`, `minimax-api-pricing.tsx`, `kimi-api-pricing.tsx`, `src/routes/{-$locale}/models/$slug.tsx`, `src/features/leaderboard/components/ModelProfile.tsx`, `BestCategoryPage.tsx`, `src/features/i18n/dictionaries/landing.ts` |
| **site** | `src/components/marketing/site-nav.tsx`, `src/components/marketing/footer.tsx`, `src/routes/{-$locale}/releases/index.tsx`, `src/features/releases/components/**`, `src/features/series/components/**`, `src/features/i18n/dictionaries/site.ts` |

If you need a file you do not own, **ask the Lead** — do not edit it.

## 2. New i18n dictionary modules

Each owner creates ONE new module under `src/features/i18n/dictionaries/`:

```ts
// src/features/i18n/dictionaries/<name>.ts
export const <name> = {
  en: {
    title: '…',
    someKey: '…',
  },
  zh: {
    title: '…',
    someKey: '…',
  },
}
```

- `en` and `zh` must have **identical key sets**.
- The Lead wires them into `en.ts` (`<name>: <name>.en`) and `zh.ts`
  (`<name>: <name>.zh`). Until the Lead wires it, `t('<name>.key')` returns the
  raw key — so the page renders with visible key names in dev. That is
  expected; do **not** work around it by hardcoding English strings.
- Use `t('<name>.<key>')` inside components and
  `translate(dict, '<name>.<key>', params)` inside route `head()`.

## 3. Linking rules

- Every internal link is a TanStack `<Link to="/{-$locale}/…">`. The `{-$locale}`
  optional param makes the router emit `/zh/…` for a Chinese visitor, so the
  locale prefix is never hand-written.
- Anchor text must **name the destination**. `Open`, `Read the analysis →`,
  `Compare all boards →`, `Best models` are banned as link text.
- Every benchmark name that appears in a table cell, a weight table or a
  changelog line links to `/benchmarks/<benchmark-id>`.
- Every model name links to `/models/<leaderboard-id>`.
- Click depth from the home page to a calculator landing page must be 1.

## 4. Canonical routes

| Canonical | Alias (301) |
| --- | --- |
| `/token-cost-calculator` | `/token-calculator` |
| `/methodology` | `/boards` |
| `/data-quality` | `/quality` |

All internal links point at the **canonical** path. The alias route files
stay on disk (they are live URLs) but redirect.

## 5. Guard tests to run

```bash
pnpm vitest run src/features/leaderboard   # board fairness contract
pnpm vitest run src/features/releases      # article/registry integrity
pnpm vitest run src/features/seo           # sitemap inventory
pnpm typecheck                            # after `pnpm build`
```

`pnpm build` regenerates the route tree — **run it before `pnpm typecheck`**
whenever a route file was added or removed.

---

## 6. What shipped

| Plan item | Where it landed |
| --- | --- |
| Board tabs become real links | `LeaderboardBoard.tsx` renders each board as a `<Link>` to `/leaderboard/<track>` (and to its `/best/<category>` twin where one exists), with a plain click still re-ranking the table in place |
| Benchmark names are links | `LeaderboardBoard.tsx`, `TrackBoard.tsx`, `CompareResult.tsx`, `BenchmarkDetail.tsx`, `Methodology.tsx`, `ModelProfile.tsx`, and the new `VendorRateTable` |
| "Not tested" gets a next step | `UnrankedRow` links to the model page and names how many benchmarks **are** tracked, computed from the model's own `scores` |
| `/benchmarks` + `/best` hubs | `src/routes/{-$locale}/benchmarks/index.tsx` + `best/index.tsx`; the home page's Browse row points at them instead of at one arbitrary child |
| New compare pairs | `COMPARE_PAIRS` gained the current frontier row (Opus 5.5 / GPT-6 Astra / Gemini 4 Argon / DeepSeek V4.1-Flash 1017 / Grok 4.7 / MiniMax M3.1 Flash / Kimi K3.1 Pro), including the same-vendor upgrade pairs |
| New `/best/*` categories | `BEST_CATEGORIES` gained `for-agents`, `for-reasoning`, `cheapest-llms`, `1m-context-window`, `prompt-caching`, behind a new `kind` discriminator (`score` \| `price` \| `context` \| `cache`) |
| New vendor pricing pages | `/gemini-api-pricing`, `/grok-api-pricing`, `/minimax-api-pricing`, `/kimi-api-pricing`, generated from `src/features/landing/` |
| Vendor pages land on their vendor | `<Calculator initialModelId=…>` on all four new pages **and** on the four pre-existing ones |
| OpenRouter page pays off its title | `OpenRouterSection.tsx` renders every active model priced both ways, direct and routed, with the markup column |
| Stale / contradictory copy | `src/features/calculator/copy.ts` resolves every figure from `REGISTRY`; the Claude break-even and the DeepSeek cache price are now computed, not typed |
| Model names in prose are links | `model-links.ts` + `LinkedText.tsx`; a `[[model:<id>|<label>]]` marker resolves at render time and degrades to plain text when the model has no leaderboard row |
| Nav renamed + canonicalised | `site-nav.tsx`: `Capability boards` → `Methodology`, calculator → `/token-cost-calculator` |
| Footer columns | `footer.tsx` gained **Pricing & Calculators** (all nine calculator landings) and **Best Models & Benchmarks** |
| Release index anchor text | `releases/index.tsx`: the card title is the single primary anchor |
| Series mesh links | `vendor-links.ts` maps a series' vendor to its pricing page and its newest release post |
| Chinese nav terms | `site.nav.*`: 大模型排行榜 / 模型对比 / Token 价格计算器 / 新模型评测 / 模型版本演进 / 评分标准 / 数据溯源 |
| Sitemaps | New paths in both `PUBLIC_PATHS` and the core list; the caps were raised by exactly the four new vendor landings |

### The one deviation: which slug is canonical

The plan recommends `/token-cost-calculator` as canonical and `/token-calculator`
as the 301 alias. That is what shipped (`src/features/seo/aliases.ts`,
`src/routes/{-$locale}/token-calculator.tsx`), with `?model=` preserved across
the redirect. But the two pages were **not** aliases of each other before this
change — they were two distinct pages with different H1s, FAQ sets and sections
— so the merge had to fold the loser's assets into the winner rather than drop
them: `/token-cost-calculator` now accepts `?model=` and carries the superset
FAQ. Both URLs keep working; only one is canonical.

### The regression this work introduced, and its fix

Adding `src/routes/{-$locale}/benchmarks.tsx` made the flat file the **parent
route** of `benchmarks/$slug`, so `/benchmarks/gpqa-diamond` rendered the hub.
The fix was to move the hub to `benchmarks/index.tsx` — an index of the same
segment, leaving `$slug` a proper sibling. `e2e/benchmarks.spec.ts` caught it.
The lesson: a hub page for a family that already has a `$slug` child must be an
`index.tsx` inside the directory, never a flat file beside it.

## 7. Verification

```bash
pnpm build          # ✓
pnpm typecheck      # ✓ (one PRE-EXISTING error, see below)
pnpm test           # ✓ 622 / 622
pnpm e2e            # ✓ 615 / 615
```

The pre-existing `src/features/analytics/analytics.ts` error
(`Property 'GA4_MEASUREMENT_ID' does not exist on type 'Env'`) is **not** from
this work: the committed generated `worker-configuration.d.ts` is stale while
`GA4_MEASUREMENT_ID` is present in `wrangler.jsonc`. It fails `pnpm typecheck`
at `HEAD` too. It needs `wrangler types` regenerated, which is a deploy-affecting
change outside this task's scope — flagged, not fixed.
