# scripts/releases

Local-only model-release **draft** fetcher. Runs a headless Chromium against
each vendor's official page, extracts the announcement, and writes a
Markdown/MDX skeleton plus a JSON file of extracted facts into
`data/release-drafts/`.

The script exists to remove one tedious step: *open the official announcement
page → copy the body*. Everything else stays human.

## What it does NOT do

| Never | Why |
|---|---|
| Write into `src/content/releases/` | The published collection is human-curated. The writer refuses any output path under `src/content/`. |
| Fill in prices / benchmarks | Those numbers are rendered live from REGISTRY + LEADERBOARD at request time. |
| Fill in `modelId` / `modelSlug` / `compareModelIds` / `compareSlugs` | The script doesn't know which model the article is about — a human decides. |
| Write conclusions | "Should you switch?" is the whole point of the series; a scraper can't answer it. |
| Overwrite an existing draft | A draft is half-finished work. Existing files are skipped unless you pass `--force`. |
| Auto-publish the changelog | The `/changelog` page is published site content (a file in git). The script writes a **changelog draft** into `<out>/changelog/`; a human fills it in and moves it to `src/content/changelog/`. |

## Changelog drafts

**Rule: every scraped model launch also produces a changelog draft.** The site's
`/changelog` page is a fumadocs collection under `src/content/changelog/` —
one file per shipped change. Because it is published content, the scraper
never writes there; it emits a skeleton next to the release draft that a
human expands and moves.

```
data/release-drafts/
  gpt-6-astra.md              # the release draft
  gpt-6-astra.json
  changelog/
    gpt-6-astra.md            # the changelog draft (same slug)
    gpt-6-astra.changelog.json
```

The changelog draft is skeletal by design:

- `title` / `description` / `version` are TODO placeholders — the changelog
  entry is prose about a shipped change, and the scraper only knows that
  *something* appeared, not what it means for the product. `version` stays
  `TBD` because the release train is a human decision.
- `published` stays `false` — it is not a live entry until a human fills it in.
- The body lists the traceable facts the scraper extracted (vendor, slug,
  source URL, scraped date) and stops there. **No prices, no benchmarks.**

The release draft and the changelog draft share one slug so a reviewer can
never lose track of which model a given draft belongs to. Both are skipped
without `--force`.

When a release ships, move the finished changelog entry to
`src/content/changelog/<version>-<slug>.md` (+ `.zh.md`), fill in the
frontmatter, and flip `published` to `true` — then run `pnpm typecheck && pnpm test`.

## Install

The Playwright browser is not bundled — install once:

```
npx playwright install chromium
```

## Usage

```
pnpm releases:fetch                      # all vendors → data/release-drafts/
pnpm releases:fetch -- --list            # show the source list + caveats, exit
pnpm releases:fetch -- --only deepseek   # single vendor (debug)
pnpm releases:fetch -- --out /tmp/drafts # custom output directory
pnpm releases:fetch -- --max-chars 8000  # cap the scraped body text
pnpm releases:fetch -- --force           # overwrite existing drafts
```

Exit codes: `0` = ran (failures are reported per vendor), `1` = every source
failed (offline / blocked), `2` = Chromium could not be launched.

## Workflow

1. **Run the script.**

   ```
   pnpm releases:fetch
   ```

   Output lands in `data/release-drafts/`:

   ```
   data/release-drafts/
     gpt-6-astra.md        # MDX skeleton: frontmatter + §4 template + source text
     gpt-6-astra.json      # extracted facts: title / date / headings / plain text
     ...
   ```

2. **Open the draft** and fill in the frontmatter by hand. The TODO fields are
   the ones the script is not allowed to decide:

   - `title` / `description` — write them for the reader (the English file and
     the Chinese file are *native rewrites*, not translations).
   - `modelId` — the protagonist model's `REGISTRY.id`.
   - `modelSlug` — the `LEADERBOARD.id`, if the leaderboard actually has a
     traceable score for that SKU. Leave it empty when it doesn't — an empty
     field renders an honest empty state instead of a borrowed number.
   - `compareModelIds` / `compareSlugs` — the comparison rows.
   - `releasedAt` — the model's release date, **only** if you can trace it.
   - `published` — flip to `true` when the article is finished.

   The price table, the "your usage costs" estimate and the benchmark table
   are rendered from REGISTRY / LEADERBOARD at request time — don't write
   prices into the frontmatter, and don't repeat them in the prose beyond the
   single TL;DR price the contract allows.

3. **Write the body** using the six-section template from
   `src/features/releases/README.md` §4:

   ```
   ## TL;DR            → 3 bullets, the first one is the conclusion
   ## What shipped     → a fact list, every item traceable
   ## What it costs    → the price *structure*, not a second copy of the table
   ## How it scores    → how to read the benchmark table
   ## Should you switch? → per-scenario advice
   ## Where to go next → links to /compare, /token-calculator, the model page
   ```

   The scraped source text at the bottom of the draft is **reference
   material** — delete it before publishing. Any price or benchmark number in
   the prose has to match REGISTRY / LEADERBOARD exactly (the integrity test
   in `src/features/releases/__tests__/` enforces this).

4. **Move the finished file** into `src/content/releases/`:

   ```
   src/content/releases/<slug>.md        # English
   src/content/releases/<slug>.zh.md     # Chinese
   ```

   Both languages share one slug. The collection has to be registered in
   `source.config.ts` (see `src/features/releases/README.md` §1).

4.5 **Write the changelog entry.** The scraper already wrote a skeleton into
   `data/release-drafts/changelog/<slug>.md`. Fill in `title` / `description`
   / `version` (drop the `TBD`), write the prose under "Added" / "Details",
   then move the finished entry to `src/content/changelog/<version>-<slug>.md`
   (+ `.zh.md`) and flip `published` to `true`. The changelog records that a
   model shipped — quote prices/scores only by reference to REGISTRY /
   LEADERBOARD, never hand-copied.

5. **Verify.**

   ```
   pnpm typecheck && pnpm test
   ```

## Output

### `data/release-drafts/<slug>.md`

```mdx
---
# ⚠️ 自动草稿：所有 TODO 字段必须人工补齐后才能发布。
title: ''
description: ''
date: '2026-10-19'
checkedAt: '2026-10-19'
releasedAt: ''
vendor: openai
modelId: ''
modelSlug: ''
compareModelIds: []
compareSlugs: []
sourceUrl: 'https://platform.openai.com/docs/pricing'
sourceTitle: 'OpenAI — API pricing'
published: false
---

## TL;DR

<!-- TODO(人工): 3 条要点，第 1 条给结论。… -->

...

---

## Source text (auto-extracted — reference only)

- 来源：https://platform.openai.com/docs/pricing
- 页面标题：…
- 抓取到的发布日期：…
- 抓取时间：…
- 正文长度：… 字符

小标题：
- …

原文纯文本：

```
…the announcement text…
```
```

### `data/release-drafts/<slug>.json`

```jsonc
{
  "vendor": "openai",
  "slug": "gpt-6-astra",
  "sourceUrl": "https://platform.openai.com/docs/pricing",
  "sourceTitle": "OpenAI — API pricing",   // from the contract (§5.1)
  "pageTitle": "Pricing | OpenAI Platform", // the live <title>
  "publishedAt": null,
  "headings": ["Models", "Audio", …],
  "bodyText": "…plain text…",
  "charCount": 18422,
  "truncated": false,
  "scrapedAt": "2026-10-19T12:00:00.000Z"
}
```

`sourceTitle` comes from the contract (§5.1) so the published article keeps the
title the rest of the site already links to; the *live* page title is kept in
`pageTitle` so a renamed page is still visible.

## Sources

One file per vendor under `scripts/releases/sources/`, same layout as
`scripts/prices/sources/`. Each file holds the URL, the contract title, the
selector candidates, and the caveats for that page.

| Vendor | Source | Notes |
|---|---|---|
| `openai` | `https://platform.openai.com/docs/pricing` | Client-rendered pricing page, no publish date. |
| `anthropic` | `https://claude.com/pricing#api` | Client-rendered tab panel, no publish date. |
| `google` | `https://ai.google.dev/gemini-api/docs/pricing` | Client-rendered tab panels, no publish date. |
| `grok` | `https://docs.x.ai/docs/models` | Pure SPA — needs hydration. |
| `deepseek` | `https://mp.weixin.qq.com/s/qg0NU3NNUbp1co2PdkAPAg` | WeChat article — can be blocked. |
| `minimax` | `https://www.minimax.cn/blog/minimax-m31f` | Client-rendered blog post. |

`pnpm releases:fetch -- --list` prints the same table with the full caveat
list.

## Debugging a broken source

When a source fails, the run continues and the failure is printed in the
summary. The scraper also dumps a screenshot + the rendered HTML:

```
.tmp/
  deepseek-fail.png
  deepseek-fail.html
```

Open the HTML locally, find the new structure, and update the selector lists
in `scripts/releases/sources/<vendor>.ts`. Every list is tried in order and
the first match wins, so a redesign usually only needs one new entry.

## Adding a new source

1. Add `scripts/releases/sources/<vendor>.ts` exporting a `ReleaseSource` and
   a `scrape<Vendor>(browser)` function.
2. Register it in `scripts/releases/sources.ts` (both `RELEASE_SOURCES` and
   `RELEASE_SCRAPERS`).
3. Add the vendor id to `VendorId` in `scripts/releases/types.ts` (it must
   match the `vendor` enum of the collection schema).
4. Add the slug + sourceUrl to the contract (`src/features/releases/README.md`
   §5.1) — the test in `scripts/releases/__tests__/sources.node.test.ts`
   fails when a source URL is not in the contract.
5. Bump `SCRIPT_VERSION` in `scripts/releases/version.ts`.

## Tests

```
pnpm test                                # everything
pnpm test scripts/releases               # just the release-draft tests
```

The tests cover the text helpers (date parsing, truncation, MDX escaping), the
draft builders (placeholders stay empty, no prices leak into the template),
the output guard (drafts can't be written into `src/content/`) and the source
registry (every URL is in the contract). They don't need a browser — only the
CLI does.
