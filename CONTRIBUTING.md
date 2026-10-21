# Contributing to EvalLedger

Thanks for your interest in improving EvalLedger! The bar is: changes
should keep it **honest** (no mocked/stubbed features), lean, and runnable on
the Cloudflare free-to-cheap stack.

## Prerequisites

- **Node 22+**
- A Cloudflare account (free tier is enough)
- `wrangler` ships as a dev dependency — no global install needed

## Local setup

```bash
pnpm install
cp wrangler.example.jsonc wrangler.jsonc  # fill in local values under `vars`; blanks degrade gracefully
pnpm db:migrate:local                     # create the local D1 schema
pnpm dev                      # http://localhost:3000
```

## The checks (must pass before a PR)

CI runs exactly these — run them locally first:

```bash
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest (node unit + workers/D1 integration)
pnpm build       # production build
```

## Conventions

- **Branch** off `main`: `feat/...`, `fix/...`, `docs/...`, `chore/...`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org) (`feat(storage): ...`, `fix(billing): ...`). Keep them scoped and self-describing.
- **Code style**: match the surrounding file. Features live as self-contained vertical slices under `src/features/<name>/`; never hand-write owner filters — use `scopeFromUser`/`ownedBy`/`withOwner` from `src/db/scope.ts`.
- **Env access**: only via `src/lib/env.ts` (never `process.env`). New vars go in `wrangler.example.jsonc` (and your local `wrangler.jsonc`) vars, and the zod schema in `src/lib/env-validate.ts`.
- **Tests**: name them `*.node.test.ts` (pure/node pool) or `*.workers.test.ts` (real D1/R2 via miniflare). Add tests for new logic.
- **Docs**: if you change setup/deploy/behaviour, update the relevant section of the README.

## Database gotcha

Local D1 state persists under `.wrangler/state`. If you switch between branches with
**different migrations**, the local DB can drift (a table from another branch lingers
with the wrong shape). Reset it:

```bash
pnpm db:reset:local   # wipe + re-migrate + re-seed
```

## Cloudflare/workerd notes

The runtime is workerd, not Node — some npm packages won't work (e.g. React Email).
Reach for a dependency carefully: confirm it has no Node-only imports before adding it.

## Reporting bugs / proposing features

Open an issue with repro steps (bugs) or the problem you're solving (features). For
security issues, **do not** open a public issue — reach the maintainers via
GitHub Issues marked "security" or via the contact in the README.

## License

By contributing, you agree your contributions are licensed under the
[Apache License 2.0](LICENSE).
