#!/usr/bin/env node
/**
 * Local-only LLM price-fetch CLI.
 *
 * Runs a headless Chromium against each provider's official pricing page,
 * extracts the visible rates, joins them with the hand-maintained display-name
 * map (`mapping.ts`), and writes the result to `data/last-fetch.json`. Prints
 * a summary table to stdout.
 *
 * The script can OPTIONALLY apply the scraped prices back to REGISTRY with
 * `--apply` (dry-run by default; `--yes` to write):
 *
 *   pnpm prices:fetch                          # scrape + JSON + summary
 *   pnpm prices:fetch -- --apply              # show diff, don't write
 *   pnpm prices:fetch -- --apply --yes        # write price fields back to model-prices.ts
 *
 * `--apply` only touches the four price/context fields + per-model
 * `lastVerified` + top-level `fetchedAt`. It NEVER bumps `registryVersion`
 * (humans do that, in the same commit as the script version bump).
 *
 * Usage:
 *   pnpm prices:fetch                     # all providers
 *   pnpm prices:fetch -- --only anthropic # single provider (debug)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { applyToFile, computeApplyDiff, formatDiff } from './apply.ts'
import { launchBrowser } from './browser.ts'
import { normalize } from './normalize.ts'
import { scrapeAnthropic } from './sources/anthropic.ts'
import { scrapeDeepSeek } from './sources/deepseek.ts'
import { scrapeGoogle } from './sources/google.ts'
import { scrapeGrok } from './sources/grok.ts'
import { scrapeMiniMax } from './sources/minimax.ts'
import { scrapeOpenAI } from './sources/openai.ts'
import type { FetchOutput, NormalizedModel, ProviderId, ProviderResult } from './types.ts'
import { SCRIPT_VERSION } from './version.ts'
import { REGISTRY, REGISTRY_VERSION } from '../../src/features/calculator/model-prices.ts'

interface CliArgs {
  only?: ProviderId
  out: string
  apply: boolean
  yes: boolean
  modelFile: string
}

const ALL_PROVIDERS: ProviderId[] = ['openai', 'anthropic', 'google', 'deepseek', 'minimax', 'grok']

const PROVIDER_SCRAPERS: Record<ProviderId, (b: import('@playwright/test').Browser) => Promise<ProviderResult>> = {
  openai: scrapeOpenAI,
  anthropic: scrapeAnthropic,
  google: scrapeGoogle,
  deepseek: scrapeDeepSeek,
  minimax: scrapeMiniMax,
  grok: scrapeGrok,
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    out: resolve('data/last-fetch.json'),
    apply: false,
    yes: false,
    modelFile: resolve('src/features/calculator/model-prices.ts'),
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    // pnpm 10 forwards the `--` separator verbatim; strip it for ergonomics.
    if (arg === '--') continue
    if (arg === '--only') {
      const next = argv[++i]
      if (!next || !(ALL_PROVIDERS as string[]).includes(next)) {
        throw new Error(`--only expects one of: ${ALL_PROVIDERS.join(', ')}`)
      }
      out.only = next as ProviderId
    } else if (arg === '--out') {
      const next = argv[++i]
      if (!next) throw new Error('--out expects a path')
      out.out = resolve(next)
    } else if (arg === '--apply') {
      out.apply = true
    } else if (arg === '--yes') {
      out.yes = true
    } else if (arg === '--model-file') {
      const next = argv[++i]
      if (!next) throw new Error('--model-file expects a path')
      out.modelFile = resolve(next)
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
  console.log(`Usage: pnpm prices:fetch [options]

Providers: ${ALL_PROVIDERS.join(', ')}
Default output: data/last-fetch.json

Options:
  --only <provider>       Scrape a single provider (debug).
  --out <path>            Write JSON to this path instead of data/last-fetch.json.
  --apply                 After scraping, compute & print the price diff that
                          would be applied to model-prices.ts. Without --yes,
                          this is dry-run — nothing is written.
  --yes                   With --apply, actually rewrite model-prices.ts.
  --model-file <path>     Override the path to model-prices.ts (default: src/features/calculator/model-prices.ts).

Version policy:
  Script version:  ${SCRIPT_VERSION}
  REGISTRY version: ${REGISTRY_VERSION}
  Both should move in lockstep in the same commit; --apply never touches REGISTRY_VERSION.
`)
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const targets = args.only ? [args.only] : ALL_PROVIDERS

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
  const scrapedAt = new Date()
  const results: ProviderResult[] = []

  try {
    // Scrape in parallel — each provider uses its own page/context and the
    // provider sites don't share cookies, so concurrency is safe.
    const settled = await Promise.allSettled(
      targets.map((p) => PROVIDER_SCRAPERS[p](browser)),
    )
    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i]
      if (outcome.status === 'fulfilled') {
        results.push(outcome.value)
      } else {
        // Should not happen — every scraper catches its own errors and
        // returns `{ ok: false }`. But if one throws synchronously, record
        // a synthetic failure so the summary stays complete.
        const provider = targets[i]
        results.push({
          provider,
          url: '',
          ok: false,
          scrapedAt: scrapedAt.toISOString(),
          models: [],
          error: String(outcome.reason),
        })
      }
    }
  } finally {
    await browser.close()
  }

  const normalizedModels = results.flatMap((r) => normalize(r.models))
  const mapped = normalizedModels.filter((m) => m.modelId !== null).length

  const output: FetchOutput = {
    fetchedAt: scrapedAt.toISOString().slice(0, 10),
    sources: Object.fromEntries(
      results.map((r) => [
        r.provider,
        {
          url: r.url,
          ok: r.ok,
          scrapedAt: r.scrapedAt,
          modelCount: r.models.length,
          ...(r.error ? { error: r.error } : {}),
        },
      ]),
    ) as FetchOutput['sources'],
    models: normalizedModels,
  }

  await mkdir(dirname(args.out), { recursive: true })
  await writeFile(args.out, JSON.stringify(output, null, 2) + '\n', 'utf8')

  printSummary(results, normalizedModels.length, mapped, args.out)

  if (args.apply) {
    await runApply(args, normalizedModels, scrapedAt)
  }

  printVersionWarning()
}

async function runApply(
  args: CliArgs,
  scraped: NormalizedModel[],
  scrapedAt: Date,
): Promise<void> {
  const diffs = computeApplyDiff(REGISTRY, scraped)
  const today = scrapedAt.toISOString().slice(0, 10)

  console.log('')
  console.log('─'.repeat(72))
  console.log(`Apply diff (${diffs.length} field${diffs.length === 1 ? '' : 's'}):`)
  console.log('─'.repeat(72))
  console.log(formatDiff(diffs))
  console.log('')

  if (diffs.length === 0) {
    console.log('No price changes to apply.')
    return
  }

  if (!args.yes) {
    console.log('Dry-run: pass --yes to write these changes to:', args.modelFile)
    console.log('Note: --apply only touches price fields, lastVerified, and fetchedAt.')
    console.log('      It never bumps registryVersion — humans do that, in the same commit.')
    return
  }

  // --yes: actually write.
  const { diffsApplied } = await applyToFile(args.modelFile, diffs, today)
  console.log(`✓ Wrote ${diffsApplied} change${diffsApplied === 1 ? '' : 's'} to ${args.modelFile}`)
  console.log(`  registryVersion unchanged at ${REGISTRY_VERSION} — bump it by hand if these changes are material.`)
}

function printVersionWarning(): void {
  if (SCRIPT_VERSION === REGISTRY_VERSION) return
  console.log('')
  console.log('─'.repeat(72))
  console.log('⚠️  Version drift detected')
  console.log('─'.repeat(72))
  console.log(`  Script version:   ${SCRIPT_VERSION}`)
  console.log(`  REGISTRY version: ${REGISTRY_VERSION}`)
  console.log('')
  console.log('These should move together in the same commit. If you just added a')
  console.log('provider or selector, bump SCRIPT_VERSION in scripts/prices/version.ts.')
  console.log('If you just changed REGISTRY contents, bump REGISTRY_VERSION in')
  console.log('src/features/calculator/model-prices.ts.')
}

function printSummary(
  results: ProviderResult[],
  totalRows: number,
  mappedRows: number,
  outPath: string,
): void {
  console.log('')
  for (const r of results) {
    const mark = r.ok ? '✓' : '✗'
    const detail = r.ok ? `${r.models.length} models` : r.error ?? 'failed'
    console.log(`${pad(r.provider, 10)} ${mark}  ${pad(detail, 30)} ${r.url}`)
  }
  console.log('')
  console.log(
    `Rows: ${totalRows} · Mapped: ${mappedRows} / ${totalRows} (${totalRows - mappedRows} unmapped)`,
  )
  console.log(`Wrote: ${outPath}`)
  console.log('')
  console.log('Next: diff data/last-fetch.json against REGISTRY, then hand-edit')
  console.log('      src/features/calculator/model-prices.ts if anything changed.')
  console.log('      Or pass --apply to compute & preview a price-only patch.')
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length)
}

main().catch((err) => {
  console.error('prices:fetch failed:', err)
  process.exit(1)
})