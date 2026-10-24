import { readFileSync } from 'node:fs'
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
 */
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

  it('has a version for every registry entry whose name advertises one', () => {
    for (const benchmark of BENCHMARKS) {
      const advertised = benchmark.name.match(/\bv?\d+(?:\.\d+)*\b/)
      if (!advertised) continue
      expect(
        benchmark.version,
        `${benchmark.id} is named "${benchmark.name}" but has no version`,
      ).toBeDefined()
      expect(
        benchmarkVersionSuffix(benchmark),
        `${benchmark.id} would print its version twice ("${benchmark.name}" + "${benchmark.version}")`,
      ).toBeNull()
    }
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
})
