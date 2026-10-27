# scripts/prices

Local-only LLM price-fetch CLI. Runs a headless Chromium against each
provider's official pricing page, extracts the visible rates, joins them with
the hand-maintained display-name map, and writes the result to
`data/last-fetch.json` plus a stdout summary.

> Scraping a vendor link for the first time? Read `scripts/README.md` first
> (Chinese) — the browser fingerprint rules and the diagnostic ladder for
> "the page loads but the body is empty" live there.

Optionally applies the scraped prices back to REGISTRY with `--apply`. The
apply path is intentionally narrow:

- Only updates `inputPricePer1M`, `outputPricePer1M`, `cachedInputPricePer1M`,
  `contextWindow` on existing entries whose `modelId` matched the mapping.
- Bumps `lastVerified` on those entries + top-level `fetchedAt`.
- **Never** touches `registryVersion` — humans do that, in the same commit as
  the script version bump. See "Versioning" below.

## Install

The Playwright browser is not bundled — install once:

```
npx playwright install chromium
```

## Usage

```
pnpm prices:fetch                          # scrape + write JSON + summary
pnpm prices:fetch -- --only anthropic      # single provider (debug)
pnpm prices:fetch -- --out /tmp/x.json     # custom output path
pnpm prices:fetch -- --apply               # dry-run diff to model-prices.ts
pnpm prices:fetch -- --apply --yes         # actually rewrite model-prices.ts
```

## `--apply` workflow

Default is **dry-run**: scrape → compute the diff → print it. Nothing is
written. With `--yes` the script rewrites `src/features/calculator/model-prices.ts`
in place.

Field policy (deliberately narrow):
- Updates `inputPricePer1M`, `outputPricePer1M`, `cachedInputPricePer1M`,
  `contextWindow` on existing entries.
- Bumps per-model `lastVerified` and top-level `fetchedAt`.
- **Does not** touch `registryVersion`.
- **Does not** add new models, change `status`, `family`, `displayName`,
  `cacheWrite`, `longContext`, `peakOffPeak`, `promo`.
- Skips when the scraped value is `null` (don't overwrite valid with null).
- Skips when before === after.
- **Deduplicates** by `(modelId, field)` — if the scraper returns the same
  model multiple times (OpenAI returns one row per pricing tier), the FIRST
  non-null value wins, so the "standard" tier is applied deterministically.

If `--apply --yes` shows unexpected changes, run `git diff
src/features/calculator/model-prices.ts` and revert by hand — the script
only knows about price fields; humans stay in charge of `status`,
`cacheWrite`, etc.

## Versioning

Both artifacts have version numbers that should move in lockstep:

| Artifact | Constant | File |
|---|---|---|
| Script | `SCRIPT_VERSION` | `scripts/prices/version.ts` |
| REGISTRY | `REGISTRY_VERSION` | `src/features/calculator/model-prices.ts` |

When the two diverge, `pnpm prices:fetch` prints a warning at the end of its
run, suggesting the user update both in the same commit.

**Rule:** the script version is bumped manually when the script gains
scraping capability for a new model type or version (new provider, new
selector, new regex). The REGISTRY version is bumped manually whenever
REGISTRY contents change materially (new active model added, status flipped,
prices re-verified). `--apply` never touches `REGISTRY_VERSION` — that field
is human-only.

## Output

### `data/last-fetch.json`

```jsonc
{
  "fetchedAt": "2026-09-25",
  "sources": {
    "openai":    { "url": "...", "ok": true, "scrapedAt": "...", "modelCount": 8 },
    "anthropic": { "url": "...", "ok": true, "scrapedAt": "...", "modelCount": 5 },
    "google":    { "url": "...", "ok": false, "scrapedAt": "...", "modelCount": 0, "error": "..." }
  },
  "models": [
    {
      "provider": "anthropic",
      "scrapedName": "Claude Sonnet 4.5",
      "modelId": "claude-sonnet-4.5",   // null when unmapped
      "inputPricePer1M": 3.0,
      "outputPricePer1M": 15.0,
      "cachedInputPricePer1M": 0.3,
      "contextWindow": 200000,
      "raw": { /* original extracted cells, debugging aid */ }
    }
  ]
}
```

### stdout

```
openai     ✓  14 models    https://platform.openai.com/docs/pricing
anthropic  ✓  12 models    https://claude.com/pricing#api
google     ✓  29 models    https://ai.google.dev/gemini-api/docs/pricing
deepseek   ✓   2 models    https://api-docs.deepseek.com/quick_start/pricing
minimax    ✓   2 models    https://platform.minimax.io/docs/pricing/overview
grok       ✓   1 models    https://docs.x.ai/docs/models

Rows: 60 · Mapped: 37 / 60 (23 unmapped)
Wrote: data/last-fetch.json

Next: diff data/last-fetch.json against REGISTRY, then hand-edit
      src/features/calculator/model-prices.ts if anything changed.
      Or pass --apply to compute & preview a price-only patch.
```

### With `--apply`

```
────────────────────────────────────────────────────────────────────────
Apply diff (5 fields):
────────────────────────────────────────────────────────────────────────
  Gemini 2.5 Pro             cachedInputPricePer1M  0.31 → 0.125
  Gemini 2.5 Flash           cachedInputPricePer1M  0.075 → 0.03
  GPT-6 astra                inputPricePer1M        10 → 5
  GPT-6 sol                  inputPricePer1M        2 → 1
  ...

Dry-run: pass --yes to write these changes to: src/features/calculator/model-prices.ts
Note: --apply only touches price fields, lastVerified, and fetchedAt.
      It never bumps registryVersion — humans do that, in the same commit.
```

## Debugging a broken provider

When a provider's selector breaks (HTML redesign), the scraper dumps a
screenshot + the rendered HTML to `.tmp/`:

```
.tmp/
  anthropic-fail.png
  anthropic-fail.html
```

Open the HTML locally, identify the new table structure, and update the
`extractRows(page)` helper in `scripts/prices/sources/<provider>.ts`.

**Read the column by its header name, never by its index.** A pricing table
reorders its columns without warning — OpenAI's now reads
`Model / Input / Output / Cached input / 30m write / 12h write`, so a reader
that assumes `Input / Cached / Cache writes / Output` silently reports the
"30m write" price as the output price and the output price as the cached
price. Those wrong numbers then land in a published price row. Resolve the
column indexes from the header row instead
(`scripts/prices/sources/openai.ts` → `resolveColumns`), and skip a table
that has no price column at all rather than mislabel one of its cells.

## When a model has several price bands

A provider page may list the same model once per band (standard / batch /
flex / priority / long-context). The rows are all scraped, and `--apply`
keeps the **first** non-null value per `(modelId, field)` — so the standard
band wins, deterministically. If the first band on the page is not the
standard one, reorder the source instead of trusting the first row.

## Adding a new model

1. Add the entry to `src/features/calculator/model-prices.ts` (REGISTRY).
2. Add the scraped display name → id mapping in `scripts/prices/mapping.ts`.
3. The mapping test (`scripts/prices/__tests__/mapping.node.test.ts`) will
   catch any drift between the two tables.
4. Bump `REGISTRY_VERSION` in `model-prices.ts` AND `SCRIPT_VERSION` in
   `scripts/prices/version.ts` together — the script warns otherwise.

## Adding a new provider

1. Add a `scripts/prices/sources/<provider>.ts` that exports
   `scrape<Provider>(browser)`. Follow the existing shape.
2. Wire it into `fetch.ts` (add to `ALL_PROVIDERS` and `PROVIDER_SCRAPERS`).
3. Update `scripts/prices/types.ts` if a new provider id is needed.
4. Bump both versions in lockstep.

## What we explicitly don't scrape

`cacheWrite[]` / `longContext[]` / `peakOffPeak` / `promo` / `status` aren't
exposed by provider pricing pages in a stable way. Those stay human-only in
REGISTRY — the scraper only fills the fields every page shows
(`inputPricePer1M`, `outputPricePer1M`, optional `cachedInputPricePer1M`,
optional `contextWindow`).

## Tests

```
pnpm test                              # everything
pnpm test scripts/prices               # just the price-fetch tests
```

Tests cover `mapping.ts` (every value is a real REGISTRY id), `normalize.ts`
(null-safety, price/window parsing), and `apply.ts` (compute diff + rewrite
file + dedup). They don't need a browser — only the CLI does.