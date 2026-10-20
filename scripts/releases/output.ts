/**
 * Output helpers for the release draft writer.
 *
 * One rule is enforced here, in code rather than in prose: **drafts never
 * land in `src/content/`**. The collection under `src/content/releases/` is
 * the published article set — writing there by accident would ship an
 * unreviewed draft, so the writer refuses to touch that path.
 */
import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'

/** Where drafts go by default. */
export const DEFAULT_OUT_DIR = 'data/release-drafts'

/** The published content root — drafts must stay out of here. */
export const CONTENT_DIR = 'src/content'

export type WriteOutcome = 'written' | 'skipped'

/**
 * Resolve the output directory and refuse to point it at `src/content/`.
 *
 * Returns the resolved path so callers can print it.
 */
export function assertOutputDirSafe(outDir: string): string {
  const target = resolve(outDir)
  const contentRoot = resolve(CONTENT_DIR)
  const rel = relative(contentRoot, target)
  const insideContent =
    rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`))
  if (insideContent) {
    throw new Error(
      `Refusing to write release drafts into ${target} — ` +
        `drafts must never be written to ${CONTENT_DIR}/ (the published collection).`,
    )
  }
  return target
}

/**
 * Write `<slug>.md` + `<slug>.json` into `outDir`.
 *
 * Existing files are **never** overwritten unless `force` is set — a draft is
 * someone's half-finished work, not a cache entry.
 */
export async function writeDraftFiles(
  outDir: string,
  slug: string,
  markdown: string,
  factsJson: string,
  force: boolean,
): Promise<WriteOutcome> {
  const mdPath = resolve(outDir, `${slug}.md`)
  const jsonPath = resolve(outDir, `${slug}.json`)

  if (!force && (await exists(mdPath) || (await exists(jsonPath)))) {
    return 'skipped'
  }

  await mkdir(dirname(mdPath), { recursive: true })
  await writeFile(mdPath, markdown, 'utf8')
  await writeFile(jsonPath, factsJson, 'utf8')
  return 'written'
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}
