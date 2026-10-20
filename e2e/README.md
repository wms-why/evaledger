# End-to-end tests (Playwright)

These drive a real Chromium against the running app and assert what a **visitor
actually sees**: that every page renders, that the numbers on it match the
registries, and that the interactions (calculator, filters, theme, language
switch) work.

They are **not** part of `pnpm test` (Vitest). Vitest owns the pure logic and
the D1-level behaviour; Playwright owns the page. Run them where a browser can
launch:

```bash
npx playwright install chromium   # one-time browser download
pnpm e2e                          # the whole suite
```

> **The full suite is an explicit-human-action command.** Agents: write and
> edit specs freely, and verify a **single** file
> (`npx playwright test e2e/<file>.spec.ts`) while you work — but do not run
> `pnpm e2e` (or the whole `e2e/` directory) unless the user asks for it by
> name. It boots a dev server and drives ~480 browser tests.

## Scope

**In:** every public page — landing, the calculator and its five per-provider
pricing landings, leaderboard + history, compare (tool and pairs), model
profiles, benchmarks (+ history), best-of categories, releases, series (+ pairs),
changelog, sponsor, waitlist, legal pages, the auth screens — plus the
machine-readable endpoints (`/sitemap.xml`, `/robots.txt`, `/feed.xml`,
`/api/prices.json`).

**Out:** `/admin/*` — this project ships no back office. `/app/*` is covered
only as a redirect (the signed-in shell is behind the login gate).

## How it is wired

- `playwright.config.ts` — one chromium project, 4 workers, `webServer` boots
  `pnpm db:migrate:local && pnpm dev` (the seed script is **not** run: it
  wipes the local `user` / `feedback` tables). An already-running dev server on
  :3000 is reused instead.
- `e2e/helpers/routes.ts` — the route inventory. Dynamic pages (models,
  benchmarks, best-of categories, compare pairs, series, series pairs) are
  derived from the same registries the pages read at runtime, and release
  posts are read from `src/content/releases/`. **A newly shipped model or post
  is covered by the suite the moment it lands** — there is no list to maintain.
- `e2e/helpers/i18n.ts` — the dictionaries, importable from a spec, so
  assertions run against the *real* copy instead of hard-coded English.
- `e2e/helpers/fixtures.ts` — the shared `test`, plus the two instruments every
  spec gets: the browser console errors and the uncaught exceptions the page
  raised. A page that renders but throws is broken, and the suite says so.
- `e2e/global-setup.ts` — warms every route once before the suite starts.
  `vite dev` compiles a route module on first request and re-bundles its
  dependencies while the suite boots; both make a cold, parallel run flaky.
  Warming the server up front pays that cost predictably.

## Layout

483 tests over 12 spec files, ~1.5 minutes on a warm dev server.

| Spec | Covers |
| --- | --- |
| `smoke.spec.ts` | every route in the inventory renders — in English **and** in Chinese — with an `<h1>`, a `<title>`, no exception and no console error |
| `marketing.spec.ts` | landing, header/footer, theme toggle, language switch, mobile nav, changelog, sponsor, waitlist |
| `auth.spec.ts` | login / register / forgot / reset / verify, and the `/app` gate |
| `calculator.spec.ts` | the calculator's arithmetic and the per-provider pricing tables |
| `leaderboard.spec.ts` | the leaderboard table, its sorting, the history page |
| `models.spec.ts` | model profiles: prices, scores, cross-links |
| `benchmarks.spec.ts` | benchmark pages and their history |
| `best.spec.ts` | the best-of category pages |
| `compare.spec.ts` | the comparison tool and the curated pairs |
| `series.spec.ts` | series index, one line, two versions of one line |
| `releases.spec.ts` | the release index and every post (en + zh) |
| `seo.spec.ts` | sitemap / robots / feed / price API, meta, canonical, hreflang, JSON-LD |

## Writing a new spec

```ts
import { expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'

test('…', async ({ page, consoleErrors, pageErrors }) => {
  await visit(page, '/some-page')
  await expect(page.getByRole('heading', { name: t('en', 'some.key') })).toBeVisible()
  expect(pageErrors).toEqual([])
  expect(realConsoleErrors(consoleErrors)).toEqual([])
})
```

Assert on the dictionary copy (`t('en', …)` / `t('zh', …)`), not on literal
sentences: a copy edit then shows up as a failing test instead of as a stale
expectation.

## Notes

- Screenshots are written to `e2e/screenshots/` (git-ignored) and
  `playwright-report/` on failure.
- `E2E_BASE_URL` / `E2E_PORT` point the suite at another server.
- `E2E_HOME` overrides `HOME` for the dev server — needed in sandboxes where
  wrangler cannot write to `~/Library`.
- `PLAYWRIGHT_BROWSERS_PATH` points the suite at a browser cache that is not
  `~/Library/Caches/ms-playwright` (a machine that cannot write there, or a CI
  image with the browser baked in elsewhere).
- `E2E_CHROMIUM_PATH` points the suite at one Chromium executable — the
  escape hatch for a machine that already has a build but cannot download the
  one this Playwright version wants.
- **One dev server per repo.** A second `pnpm dev` in the same checkout fights
  the first one over the shared `node_modules/.vite` cache and both start
  500-ing.
- The suite retries once (twice in CI): `vite dev` re-bundles a dependency
  while the suite runs, and the reload it forces lands on a page whose client
  bundle is momentarily gone. That is a dev-server artifact, not a page
  defect — but it is also why the specs wait for hydration before they click.
- CI runs `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`. The
  Playwright suite is **not** part of the CI gate yet: it needs a Chromium
  download in the runner image.
