import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BENCHMARKS, benchmarkVersionSuffix } from '@/features/leaderboard/benchmarks'

/**
 * The benchmark label contract.
 *
 * A benchmark's display name carries its own version ("DeepSWE v1.1",
 * "Terminal-Bench 4.0") because that is how a reader names the test. The
 * registry keeps the version as metadata, and the UI prints it *next to*
 * the name only when the name does not already say it — otherwise
 * `/methodology` read "DeepSWE v1.1 1.1".
 *
 * These tests pin both halves: the helper's rule, and the fact that every
 * current registry entry names its version so no page can stutter.
 *
 * Why the "whole registry yields null" assertion alone was not enough: it
 * was green while the page still printed "DeepSWE v1.1 1.1", because it
 * asked the helper the same question the helper's own implementation
 * answers. The tests below therefore include a rule *restated
 * independently* of the implementation (extract version tokens from the
 * name, compare as strings), plus an end-to-end label built for every real
 * benchmark: `name` followed by whatever the helper would append must
 * contain the version exactly once.
 */

/**
 * The rule, restated without calling the helper: the version tokens a
 * string advertises, as whole strings.
 *
 * Every number is a token ("Foo 3 v2.1" carries both), because the
 * helper compares whole tokens and a name may advertise its version
 * anywhere. The separate "does this name look versioned?" question below is
 * narrower — see {@link looksVersioned}.
 */
function tokensOf(text: string): string[] {
  return (text.match(/\d+(?:\.\d+)*/g) ?? []).map((t) => t.replace(/\.+$/, ''))
}

/**
 * Whether a bare name looks like it advertises a version: a `v`-prefixed
 * number, or a dotted number. "NL2Repo-Bench" contains a `2` that is part of
 * the product's name, not a version, so it must not be held to having one.
 */
function looksVersioned(text: string): boolean {
  return /\bv\d+(?:\.\d+)*\b|\b\d+\.\d+/i.test(text)
}

/** What a page prints: the name, then the suffix if the helper returns one. */
function renderedLabel(benchmark: { name: string; version?: string }): string {
  const suffix = benchmarkVersionSuffix(benchmark)
  return suffix ? `${benchmark.name} ${suffix}` : benchmark.name
}

/** How many times a version appears, as a whole token, in a rendered label. */
function versionOccurrences(label: string, version: string): number {
  return tokensOf(label).filter((token) => token === version).length
}

describe('benchmark version labels', () => {
  it('returns no suffix when the name already names the version', () => {
    expect(
      benchmarkVersionSuffix({ name: 'DeepSWE v1.1', version: '1.1' }),
    ).toBeNull()
    expect(
      benchmarkVersionSuffix({ name: 'Terminal-Bench 4.0', version: '4.0' }),
    ).toBeNull()
    expect(benchmarkVersionSuffix({ name: 'FrontierSWE v2', version: '2' })).toBeNull()
  })

  it('returns the version when the name does not carry it', () => {
    expect(benchmarkVersionSuffix({ name: 'DeepSWE', version: '1.1' })).toBe('1.1')
    expect(benchmarkVersionSuffix({ name: 'Terminal-Bench', version: '4.0' })).toBe('4.0')
  })

  it('returns null when the benchmark has no version', () => {
    expect(benchmarkVersionSuffix({ name: 'GPQA Diamond' })).toBeNull()
    expect(benchmarkVersionSuffix({ name: 'GPQA Diamond', version: undefined })).toBeNull()
  })

  it('does not treat a version as present when it is only a substring of another number', () => {
    // "v2" occurs inside "v2.1", but the name names the version "2.1".
    expect(benchmarkVersionSuffix({ name: 'Foo v2.1', version: '2' })).toBe('2')
    expect(benchmarkVersionSuffix({ name: 'Foo v2', version: '2' })).toBeNull()
  })

  it('recognises a version that ends the string, followed by punctuation', () => {
    // The regression that made the old regex-based helper read
    // "DeepSWE v1.1. 1.1": the boundary after the version refused a trailing
    // dot, so a name ending in its version plus a period looked version-less.
    expect(benchmarkVersionSuffix({ name: 'DeepSWE v1.1.', version: '1.1' })).toBeNull()
    expect(benchmarkVersionSuffix({ name: 'DeepSWE v1.1)', version: '1.1' })).toBeNull()
    expect(benchmarkVersionSuffix({ name: 'DeepSWE (v1.1)', version: '1.1' })).toBeNull()
    expect(benchmarkVersionSuffix({ name: 'OSWorld-V2.1', version: '2.1' })).toBeNull()
  })

  describe('real registry names (explicit, one case per benchmark)', () => {
    // Every benchmark name that carries a version in today's registry. These
    // are written out rather than derived so that the *input* the helper sees
    // is visible in the test: a registry rename shows up as a failing case
    // instead of silently shrinking the loop.
    const cases: ReadonlyArray<readonly [string, string]> = [
      ['DeepSWE v1.1', '1.1'],
      ['Terminal-Bench 4.0', '4.0'],
      ['Terminal-Bench Science 0.1', '0.1'],
      ['SWE-Marathon v1.1', '1.1'],
      ['OSWorld V2.1', '2.1'],
      ['OSWorld-2.0', '2.0'],
      ['GDPVal-AA v2.1', '2.1'],
      ['CWE-bench v1', '1'],
      ['OfficeQA Pro v2', '2'],
      ['FrontierSWE v2', '2'],
      ['Apex Bench v1.1', '1.1'],
      ['Terminal-Bench 2.1', '2.1'],
      ['Terminal-Bench 3.0', '3.0'],
    ]

    it.each(cases)('%s v%s prints its version exactly once', (name, version) => {
      expect(benchmarkVersionSuffix({ name, version })).toBeNull()
      expect(versionOccurrences(renderedLabel({ name, version }), version)).toBe(1)
    })

    it('covers every versioned benchmark in the registry', () => {
      const versioned = BENCHMARKS.filter((b) => b.version).map((b) => b.name)
      expect(new Set(versioned)).toEqual(new Set(cases.map(([name]) => name)))
    })
  })

  it('has a version for every registry entry whose name advertises one', () => {
    for (const benchmark of BENCHMARKS) {
      if (!looksVersioned(benchmark.name)) continue
      expect(
        benchmark.version,
        `${benchmark.id} is named "${benchmark.name}" but has no version`,
      ).toBeDefined()
    }
  })

  it('independently: every registry name already carries its own version token', () => {
    // Deliberately does NOT ask the helper. Restates the rule from the data:
    // if the name advertises exactly the `version` token, the helper has
    // nothing left to add. If this fails, the registry name and its
    // `version` field disagree and the page will stutter — no matter what
    // the helper does internally.
    for (const benchmark of BENCHMARKS) {
      if (!benchmark.version) continue
      const carried = tokensOf(benchmark.name)
      expect(
        carried,
        `${benchmark.id}: name "${benchmark.name}" does not advertise its version "${benchmark.version}"`,
      ).toContain(benchmark.version)
    }
  })

  it('no versioned registry benchmark prints its version twice', () => {
    for (const benchmark of BENCHMARKS) {
      if (!benchmark.version) continue
      expect(
        benchmarkVersionSuffix(benchmark),
        `${benchmark.id} would print its version twice ("${benchmark.name}" + "${benchmark.version}")`,
      ).toBeNull()
      expect(
        versionOccurrences(renderedLabel(benchmark), benchmark.version),
        `${benchmark.id} renders its version more than once ("${benchmark.name}")`,
      ).toBe(1)
    }
  })

  it('still prints a version that the name omits', () => {
    // The other half of the contract: the helper must not silence a version
    // just because *some* number appears in the name ("HLE 2" vs "1").
    expect(benchmarkVersionSuffix({ name: 'Terminal-Bench 4.0', version: '1.0' })).toBe('1.0')
    expect(benchmarkVersionSuffix({ name: 'HLE 2', version: '1' })).toBe('1')
    expect(versionOccurrences(renderedLabel({ name: 'HLE 2', version: '1' }), '1')).toBe(1)
  })

  it('renders the version through the shared helper, never a raw field', () => {
    // The regression this guards: every page that prints a benchmark name
    // appended `benchmark.version` unconditionally. If a component
    // interpolates the field directly, that bug is back.
    const components = [
      'Methodology',
      'ModelProfile',
      'ScoreProvenance',
      'TrackBoard',
    ] as const

    for (const component of components) {
      const source = readFileSync(
        new URL(`../components/${component}.tsx`, import.meta.url),
        'utf8',
      )
      expect(source, `${component} must use benchmarkVersionSuffix`).toContain(
        'benchmarkVersionSuffix',
      )
      expect(
        source,
        `${component} interpolates a benchmark version directly instead of using benchmarkVersionSuffix`,
      ).not.toMatch(/(?:benchmark|bm|member)\??\.version\s*[}<]/)
    }
  })

  it('has no fifth render site: only the helper decides to print a version', () => {
    // `/leaderboard/{coding,agent,…}`, the model page and the provenance
    // popover were the known sites. This asserts the whole components
    // directory: a component that reads `version` at all must be one of the
    // four that go through the helper, so a new page cannot quietly start
    // interpolating the field again. (`model.version` — the *model's* own
    // version, e.g. "5.5" — is a different field on a different type and is
    // matched by neither alternative below.)
    const allowed = new Set(['Methodology', 'ModelProfile', 'ScoreProvenance', 'TrackBoard'])
    const dir = new URL('../components/', import.meta.url)
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.tsx')) continue
      const name = file.replace(/\.tsx$/, '')
      const source = readFileSync(new URL(file, dir), 'utf8')
      const mentionsBenchmarkVersion = /(?:benchmark|bm|core)\??\.version\b/.test(source)
      if (!mentionsBenchmarkVersion) continue
      expect(allowed.has(name), `${name}.tsx reads a benchmark version; route it through benchmarkVersionSuffix`).toBe(true)
    }
  })
})
