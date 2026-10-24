import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dictionaries } from '@/features/i18n/locale'

/**
 * The i18n contract, checked against the SOURCE.
 *
 * `translate()` fails quietly: a key that is not in the dictionary comes
 * back **as the key**, and a `{placeholder}` the caller did not supply stays
 * **in the string**. Both are invisible in review and very visible to a
 * reader — the site shipped a model page whose comparison links read
 * `{a} vs {b}`, a release page whose cost tile read `releases.costPeak`,
 * and a calculator page whose two content sections were EMPTY because the
 * key they named did not exist.
 *
 * So the contract is checked mechanically:
 *
 *   1. every dictionary key the source names must exist, in BOTH languages;
 *   2. every call site must supply every `{placeholder}` its string needs;
 *   3. the two languages must use the same placeholders for the same key.
 *
 * The check reads the source rather than a hand-written list, so a key that
 * is added, renamed or dropped is caught the moment it lands.
 */

/** The repository's `src/` directory. */
const SRC_DIR = fileURLToPath(new URL('../../', import.meta.url))

/**
 * Flatten a dictionary into `path → string`.
 *
 * An ARRAY is a leaf too: `calculator.tldrItems` and `calculator.tips` are
 * lists of sentences, and the components that read them look the key up by
 * name. A key that holds a list is as real as a key that holds a sentence —
 * if it is missing, the list renders empty.
 */
function flatten(dict: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  if (!dict || typeof dict !== 'object') return out
  for (const [key, value] of Object.entries(dict as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out.set(path, value)
    else if (Array.isArray(value)) {
      out.set(path, value.filter((item) => typeof item === 'string').join('\n'))
    } else if (value && typeof value === 'object') {
      for (const [p, v] of flatten(value, path)) out.set(p, v)
    }
  }
  return out
}

const en = flatten(dictionaries.en)
const zh = flatten(dictionaries.zh)

/** The top-level sections of the dictionary — the first segment of a key. */
const SECTIONS = new Set(Object.keys(dictionaries.en))

/** Every `.ts` / `.tsx` file under `src/`, minus the tests themselves. */
function sourceFiles(dir: string = SRC_DIR): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = `${dir}/${entry}`
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full))
      continue
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue
    if (/\.test\.ts$/.test(entry)) continue
    out.push(full)
  }
  return out
}

/** The `{placeholders}` a dictionary string needs. */
function placeholders(value: string): string[] {
  return [...new Set([...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))]
}

/**
 * The dictionary keys a source file NAMES.
 *
 * Two shapes count:
 *
 *   - `t('a.b.c')` / `translate(dict, 'a.b.c')` — the call itself.
 *   - any other string literal that looks like a dictionary key — a key
 *     handed to a component as a prop (`itemsKey="calc.tldrItems"`), or a
 *     key stored in a lookup table (`VENDOR_LABEL_KEY`).
 *
 * The second shape is the one that let `calc.tldrItems` slip through: it
 * was never passed to `t()`, it was passed to `<PricingTLDR>`, and the
 * component's `lookup()` returned `undefined` for it — so the page rendered
 * an EMPTY list where the copy should have been.
 *
 * Both quote styles count: a key handed to a component as a JSX prop is
 * written with double quotes.
 */
const KEY_LITERAL = /['"]([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_-]+)+)['"]/g

/**
 * The file extensions that make a dotted string a PATH, not a dictionary key.
 *
 * `'waitlist.csv'` is a route file name, not an i18n key — but its first
 * segment happens to be a dictionary section, so the section check alone
 * would not catch it.
 */
const FILE_EXTENSIONS = new Set([
  'csv',
  'html',
  'js',
  'json',
  'jsonc',
  'md',
  'mdx',
  'png',
  'svg',
  'ts',
  'tsx',
  'txt',
  'xml',
  'yaml',
  'yml',
])

describe('the i18n dictionary', () => {
  it('has the same key set in both languages', () => {
    const onlyEn = [...en.keys()].filter((key) => !zh.has(key))
    const onlyZh = [...zh.keys()].filter((key) => !en.has(key))
    expect(onlyEn, 'these keys exist in English only').toEqual([])
    expect(onlyZh, 'these keys exist in Chinese only').toEqual([])
  })

  it('uses no placeholder in one language that the other does not have', () => {
    for (const [key, value] of en) {
      const other = zh.get(key)
      if (other == null) continue
      // A language may legitimately DROP a placeholder whose value its
      // sentence does not interpolate — the Chinese "这个模型值不值?" carries
      // no model name, and forcing one in would be noise. What it may never
      // do is USE one the other language does not have: that placeholder
      // would be unfilled in the language that lacks it.
      const enNames = new Set(placeholders(value))
      const extra = placeholders(other).filter((name) => !enNames.has(name))
      expect(extra, `${key} uses a placeholder the English string does not have`).toEqual([])
    }
  })

  it('has no key that is only a placeholder left over', () => {
    // A dictionary string whose only content is `{x}` prints the braces.
    for (const [key, value] of en) {
      expect(value.trim(), `${key} is an empty string`).not.toBe('')
    }
  })
})

describe('the source and the dictionary', () => {
  const files = sourceFiles()

  it('finds the source files to check', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it('names only keys that exist in both languages', () => {
    const missing: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      // A key only counts when its FIRST segment is a real dictionary
      // section — otherwise every dotted string in the codebase (a CSS
      // class, a file path) would be treated as a key.
      for (const match of source.matchAll(KEY_LITERAL)) {
        const key = match[1]
        const section = key.split('.')[0]
        if (!SECTIONS.has(section)) continue
        // A file name, not a key.
        const extension = key.split('.').pop() ?? ''
        if (FILE_EXTENSIONS.has(extension.toLowerCase())) continue
        if (!en.has(key)) {
          missing.push(`${file.replace(SRC_DIR, '')}: ${key}`)
          continue
        }
        if (!zh.has(key)) missing.push(`${file.replace(SRC_DIR, '')}: ${key} (zh)`)
      }
    }
    expect(missing, 'these dictionary keys do not exist').toEqual([])
  })

  it('supplies every placeholder the dictionary string needs', () => {
    const gaps: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      // Two call shapes:
      //   - `t('key', { … })`                   — the component form.
      //   - `translate(dict, 'key', { … })`      — the route-head form.
      // The object literal is read with a balanced-brace scan, so a
      // multi-line call is read whole.
      const shapes = [
        /\bt\(\s*'([\w.]+)'\s*,\s*\{/g,
        /\btranslate\(\s*(?:dict|dictionaries\[\w+\])\s*,\s*'([\w.]+)'\s*,\s*\{/g,
      ]
      for (const shape of shapes) {
        for (const match of source.matchAll(shape)) {
          const key = match[1]
          const needed = placeholders(en.get(key) ?? '')
          if (needed.length === 0) continue
          const start = match.index + match[0].length - 1
          let depth = 0
          let end = start
          for (; end < source.length; end++) {
            if (source[end] === '{') depth++
            else if (source[end] === '}') {
              depth--
              if (depth === 0) break
            }
          }
          // The closing brace is part of the slice: in the shorthand form
          // (`{ vendor }`) it is the ONLY delimiter, so leaving it out would
          // make every shorthand property look unsupplied.
          const object = source.slice(start + 1, end + 1)
          const supplied = new Set(
            [...object.matchAll(/([A-Za-z_$][\w$]*)\s*[:,}]/g)].map((m) => m[1]),
          )
          for (const name of needed) {
            if (!supplied.has(name)) {
              gaps.push(`${file.replace(SRC_DIR, '')}: ${key} is missing {${name}}`)
            }
          }
        }
      }
    }
    expect(gaps, 'these call sites leave a placeholder in the rendered text').toEqual([])
  })
})
