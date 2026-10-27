#!/usr/bin/env node
/**
 * Local-only model-release draft fetcher.
 *
 * Reads each vendor's official page (see `src/features/releases/README.md`
 * §5.1) with a headless Chromium and writes **drafts only**:
 *
 *   data/release-drafts/<slug>.md   — MDX skeleton (frontmatter + §4 template)
 *   data/release-drafts/<slug>.json — the extracted facts (title / date /
 *                                     headings / plain-text body)
 *
 * What this script deliberately does NOT do:
 *   - never writes into `src/content/releases/` (the writer refuses that path)
 *   - never fills in `modelId` / `modelSlug` / `compareModelIds` / `compareSlugs`
 *   - never fills in prices, benchmarks, or conclusions
 *
 * Its only job is to save the human the "open the announcement → copy the
 * body" step. Everything after that is manual.
 *
 * Usage:
 *   pnpm releases:fetch                      # all vendors → data/release-drafts
 *   pnpm releases:fetch -- --list            # show the source list and exit
 *   pnpm releases:fetch -- --only deepseek   # single vendor (debug)
 *   pnpm releases:fetch -- --slug gpt-6-1-terra # single source (debug)
 *   pnpm releases:fetch -- --force           # overwrite existing drafts
 */
import { relative, resolve, sep } from 'node:path'

import { buildChangelogDraft, buildChangelogPayload } from './changelog.ts'
import { buildDraftMarkdown, buildFactsPayload } from './draft.ts'
import { assertOutputDirSafe, DEFAULT_OUT_DIR, writeDraftFiles } from './output.ts'
import { launchBrowser } from '../shared/browser.ts'
import { RELEASE_SCRAPERS, RELEASE_SOURCES, VENDOR_IDS, findSourceBySlug } from './sources.ts'
import { truncateText } from './text.ts'
import type { ReleaseFacts, ReleaseSource, SourceResult, VendorId } from './types.ts'
import { SCRIPT_VERSION } from './version.ts'

interface CliArgs {
  only?: VendorId
  /** Slug of a single source to scrape (a vendor may have several). */
  slug?: string
  out: string
  force: boolean
  maxChars: number
  list: boolean
}

/** Default cap for the scraped body text that lands in the draft. */
const DEFAULT_MAX_CHARS = 20_000

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    out: DEFAULT_OUT_DIR,
    force: false,
    maxChars: DEFAULT_MAX_CHARS,
    list: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    // pnpm 10 forwards the `--` separator verbatim; strip it for ergonomics.
    if (arg === '--') continue
    if (arg === '--only') {
      const next = argv[++i]
      if (!next || !(VENDOR_IDS as string[]).includes(next)) {
        throw new Error(`--only expects one of: ${VENDOR_IDS.join(', ')}`)
      }
      out.only = next as VendorId
    } else if (arg === '--slug') {
      const next = argv[++i]
      if (!next) throw new Error('--slug expects a slug')
      out.slug = next
    } else if (arg === '--out') {
      const next = argv[++i]
      if (!next) throw new Error('--out expects a path')
      out.out = next
    } else if (arg === '--max-chars') {
      const next = argv[++i]
      const n = Number(next)
      if (!next || !Number.isFinite(n) || n <= 0) {
        throw new Error('--max-chars expects a positive number')
      }
      out.maxChars = Math.floor(n)
    } else if (arg === '--force') {
      out.force = true
    } else if (arg === '--list') {
      out.list = true
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return out
}

function printHelp(): void {
  console.log(`Usage: pnpm releases:fetch [options]

Vendors: ${VENDOR_IDS.join(', ')}
Slugs:   ${RELEASE_SOURCES.map((s) => s.slug).join(', ')}
Default output: ${DEFAULT_OUT_DIR}/<slug>.md + <slug>.json

Options:
  --list              List the configured sources (URL, slug, caveats) and exit.
  --only <vendor>     Scrape every source of a vendor (debug).
  --slug <slug>       Scrape exactly one source (debug).
  --out <dir>         Write drafts to this directory (default: ${DEFAULT_OUT_DIR}).
  --max-chars <n>     Cap the scraped body text (default: ${DEFAULT_MAX_CHARS}).
  --force             Overwrite existing drafts. Without it, existing files are skipped.

Safety:
  * Drafts never land in src/content/ — the writer refuses that path.
  * No prices, benchmarks, model ids, or conclusions are filled in. Those are human-only.
  * A failed source never aborts the run: it is recorded, dumped to
    .tmp/<slug>-fail.{png,html}, and the next source continues.

Script version: ${SCRIPT_VERSION}
`)
}

function printSourceList(sources: ReleaseSource[]): void {
  console.log('Configured release sources:')
  console.log('')
  for (const source of sources) {
    console.log(`${source.vendor}  →  ${source.slug}`)
    console.log(`  url:   ${source.url}`)
    console.log(`  title: ${source.knownTitle}`)
    for (const note of source.notes) {
      console.log(`  · ${note}`)
    }
    console.log('')
  }
  console.log(`Contract: src/features/releases/README.md §5.1`)
  console.log(`Output:   ${DEFAULT_OUT_DIR}/<slug>.md + <slug>.json (drafts only)`)
}

/**
 * Pick the sources this run should scrape.
 *
 * `--only <vendor>` scrapes *every* source of that vendor (a vendor may
 * have several); `--slug <slug>` scrapes exactly one source. The two flags
 * are exclusive — "one source of one vendor" is what `--slug` already says.
 */
function selectTargets(args: CliArgs): ReleaseSource[] {
  if (args.slug) {
    const source = findSourceBySlug(args.slug)
    if (!source) {
      throw new Error(
        `--slug expects one of: ${RELEASE_SOURCES.map((s) => s.slug).join(', ')}`,
      )
    }
    return [source]
  }
  if (args.only) {
    return RELEASE_SOURCES.filter((s) => s.vendor === args.only)
  }
  return RELEASE_SOURCES
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const targets = selectTargets(args)

  if (args.list) {
    printSourceList(targets)
    return
  }

  // Fail fast if somebody points --out at the published content directory.
  const outDir = assertOutputDirSafe(args.out)

  let browser: import('@playwright/test').Browser
  try {
    browser = await launchBrowser()
  } catch (err) {
    console.error('')
    console.error('Could not launch headless Chromium. Did you run `npx playwright install chromium`?')
    console.error('')
    console.error('Underlying error:', err instanceof Error ? err.message : String(err))
    console.error('')
    process.exit(2)
  }

  const results: SourceResult[] = []
  try {
    // Scrape in parallel — each source uses its own page/context and the
    // vendor sites don't share cookies, so concurrency is safe.
    const settled = await Promise.allSettled(
      targets.map((source) => RELEASE_SCRAPERS[source.slug]!(browser)),
    )
    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i]
      if (outcome.status === 'fulfilled') {
        results.push(outcome.value)
      } else {
        // Should not happen — every scraper catches its own errors and
        // returns `{ ok: false }`. Record a synthetic failure so the summary
        // stays complete.
        const source = targets[i]!
        results.push({
          vendor: source.vendor,
          slug: source.slug,
          url: source.url,
          ok: false,
          facts: null,
          error: String(outcome.reason),
        })
      }
    }
  } finally {
    await browser.close()
  }

  const today = new Date().toISOString().slice(0, 10)
  let written = 0
  let skipped = 0
  let failed = 0
  let changelogWritten = 0
  let changelogSkipped = 0
  // Facts after the `--max-chars` cap — this is what actually lands on disk,
  // so the summary reports these numbers.
  const writtenFacts = new Map<string, ReleaseFacts>()

  for (const result of results) {
    if (!result.ok || !result.facts) {
      failed++
      continue
    }
    const facts = applyLimit(result.facts, args.maxChars)
    writtenFacts.set(result.slug, facts)
    const markdown = buildDraftMarkdown(facts, today)
    const payload = buildFactsPayload(facts)
    const outcome = await writeDraftFiles(outDir, result.slug, markdown, payload, args.force)
    if (outcome === 'written') {
      written++
    } else {
      skipped++
    }

    // Rule: every scraped model launch also emits a changelog draft. The
    // site's /changelog is published content (a file in git, reviewed in a
    // diff) — the scraper never writes there. It writes a skeleton into
    // <outDir>/changelog/ that a human fills in and moves to
    // src/content/changelog/ when the release ships. See
    // scripts/releases/changelog.ts and scripts/releases/README.md.
    const changelogDir = resolve(outDir, 'changelog')
    const changelogMarkdown = buildChangelogDraft(facts, today)
    const changelogPayload = buildChangelogPayload(facts, today)
    const changelogOutcome = await writeDraftFiles(
      changelogDir,
      result.slug,
      changelogMarkdown,
      changelogPayload,
      args.force,
    )
    if (changelogOutcome === 'written') {
      changelogWritten++
    } else {
      changelogSkipped++
    }
  }

  printSummary(results, writtenFacts, { written, skipped, failed }, outDir, {
    changelogWritten,
    changelogSkipped,
  })

  if (failed > 0 && written + skipped === 0) {
    // Every source failed — that is a systemic problem (offline, blocked,
    // browser missing), not a per-vendor hiccup. Signal it with exit code 1.
    process.exit(1)
  }
}

/** Apply the `--max-chars` cap to the scraped body. */
function applyLimit(facts: ReleaseFacts, maxChars: number): ReleaseFacts {
  const { text, truncated } = truncateText(facts.bodyText, maxChars)
  return {
    ...facts,
    bodyText: text,
    charCount: text.length,
    truncated: facts.truncated || truncated,
  }
}

function printSummary(
  results: SourceResult[],
  writtenFacts: Map<string, ReleaseFacts>,
  counts: { written: number; skipped: number; failed: number },
  outDir: string,
  changelogCounts: { changelogWritten: number; changelogSkipped: number },
): void {
  console.log('')
  for (const result of results) {
    const mark = result.ok ? '✓' : '✗'
    const facts = writtenFacts.get(result.slug)
    const detail = result.ok
      ? `${facts?.charCount ?? 0} chars${facts?.truncated ? ' (cut)' : ''}`
      : (result.error ?? 'failed').split('\n')[0]!
    // The slug, not the vendor: one vendor can have several sources, and the
    // slug is what names the draft file.
    console.log(`${pad(result.slug, 22)} ${mark}  ${pad(detail, 46)} ${result.url}`)
  }

  const errors = results.filter((r) => !r.ok)
  if (errors.length > 0) {
    console.log('')
    console.log('─'.repeat(72))
    console.log('Errors:')
    console.log('─'.repeat(72))
    for (const error of errors) {
      console.log(`  ${error.vendor}/${error.slug}: ${error.error}`)
      console.log(`    debug dump: .tmp/${error.slug}-fail.png / .tmp/${error.slug}-fail.html`)
    }
  }

  console.log('')
  console.log(
    `Drafts written: ${counts.written} · skipped (exists): ${counts.skipped} · failed: ${counts.failed}`,
  )
  console.log(
    `Changelog drafts written: ${changelogCounts.changelogWritten} · skipped (exists): ${changelogCounts.changelogSkipped}`,
  )
  console.log(`Output: ${displayPath(outDir)}`)
  console.log('')
  console.log('Next: open each draft, fill in modelId / prices / conclusions by hand,')
  console.log('      then move it into src/content/releases/ per')
  console.log('      src/features/releases/README.md §1/§4, and run:')
  console.log('      pnpm typecheck && pnpm test')
  console.log('')
  console.log('Each draft also got a changelog skeleton in <out>/changelog/ — the')
  console.log('/changelog page is published content, so fill it in by hand and move')
  console.log('it to src/content/changelog/ (see scripts/releases/README.md §changelog).')
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length)
}

/** Show a path relative to the repo root, unless it points outside of it. */
function displayPath(outDir: string): string {
  const rel = relative(process.cwd(), resolve(outDir))
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`)) return resolve(outDir)
  return rel
}

main().catch((err) => {
  console.error('releases:fetch failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
