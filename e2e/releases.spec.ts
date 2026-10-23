import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, realConsoleErrors, test, visit } from './helpers/fixtures'
import { t } from './helpers/i18n'
import { RELEASE_SLUGS } from './helpers/routes'
import { REGISTRY } from '@/features/calculator/model-prices'
import { formatReleasePrice } from '@/features/releases/format'

/**
 * The release series: one post per model launch, in two languages.
 *
 * The posts store only *keys* (`modelId`, `compareModelIds`); every price on
 * the page is resolved from REGISTRY when the page renders. These tests read
 * the same frontmatter and check that the table on the page quotes exactly
 * the registry prices — a price that moves without the page moving shows up
 * here.
 */

const RELEASE_DIR = fileURLToPath(new URL('../src/content/releases/', import.meta.url))

interface PostFrontmatter {
  title: string
  date: string
  modelId: string
  compareModelIds: string[]
  /** True while the model has not shipped — no price table, no score table. */
  pending: boolean
  /** Site-relative clip rendered above the article body, when there is one. */
  videoSrc: string
}

function unquote(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length > 1 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1)
  }
  if (trimmed.length > 1 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

/** Read the frontmatter of one post file (`<slug>.md` or `<slug>.zh.md`). */
function readPost(file: string): PostFrontmatter {
  const raw = readFileSync(join(RELEASE_DIR, file), 'utf8')
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)?.[1] ?? ''
  const scalars: Record<string, string> = {}
  const lists: Record<string, string[]> = {}
  let current: string | undefined
  for (const line of block.split(/\r?\n/)) {
    const item = /^\s+-\s+(.*)$/.exec(line)
    if (item && current) {
      lists[current].push(unquote(item[1]))
      continue
    }
    const pair = /^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/.exec(line)
    if (!pair) continue
    current = pair[1]
    const value = pair[2].trim()
    scalars[current] = value === '' ? '' : unquote(value)
    if (value === '') lists[current] = []
  }
  return {
    title: scalars.title ?? '',
    date: scalars.date ?? '',
    modelId: scalars.modelId ?? '',
    compareModelIds: lists.compareModelIds ?? [],
    pending: scalars.pending === 'true',
    videoSrc: scalars.videoSrc ?? '',
  }
}

/**
 * Read the DOM, tolerating a dev-server reload that lands mid-read.
 *
 * A teammate editing the app triggers an HMR reload, which destroys the
 * execution context while a locator is being read. The page comes back with
 * the same content, so the read is simply retried.
 */
async function read<T>(reader: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await reader()
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  throw lastError
}

/**
 * The console errors that are the page's own fault.
 *
 * The browser asks `/api/auth/get-session` on every page (the auth client
 * hydrates its session atom), and that endpoint sits behind better-auth's
 * per-IP rate limiter — so a burst of page views from the whole e2e suite
 * (one IP) makes it answer 429. That is a server-side rate limit, not a
 * broken page, so it is filtered out here.
 */
function ownErrors(consoleErrors: string[]): string[] {
  return realConsoleErrors(consoleErrors).filter((error) => !/status of 429/.test(error))
}

test('the index lists every release post', async ({ page, consoleErrors, pageErrors }) => {
  const response = await visit(page, '/releases')
  expect(response?.status()).toBe(200)

  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(RELEASE_SLUGS.length)

  for (const slug of RELEASE_SLUGS) {
    const post = readPost(`${slug}.md`)
    await expect(
      page.getByRole('heading', { level: 2, name: post.title, exact: true }),
    ).toBeVisible()
    // The headline is the link to the post.
    await expect(
      page.getByRole('link', { name: post.title, exact: true }),
    ).toHaveAttribute('href', `/releases/${slug}`)
  }

  expect(pageErrors).toEqual([])
  expect(ownErrors(consoleErrors)).toEqual([])
})

for (const slug of RELEASE_SLUGS) {
  test(`the post ${slug} renders its headline, its date and the registry prices`, async ({ page, consoleErrors, pageErrors }) => {
    const post = readPost(`${slug}.md`)
    const response = await visit(page, `/releases/${slug}`)
    expect(response?.status()).toBe(200)

    await expect(
      page.getByRole('heading', { level: 1, name: post.title, exact: true }),
    ).toBeVisible()
    await expect(page.getByText(`${t('en', 'releases.publishedOn')} ${post.date}`)).toBeVisible()

    if (post.videoSrc) {
      // A mirrored clip must actually be playable on the page — a poster with
      // a broken source renders as a dead grey box and nobody notices.
      const video = page.locator('video').first()
      await expect(video).toBeVisible()
      await expect(video.locator('source')).toHaveAttribute('src', post.videoSrc)
      // `readyState >= 1` means the browser read the metadata: the file is
      // real, served from `public/`, and encoded in a format the page plays.
      await expect
        .poll(() => video.evaluate((el: HTMLVideoElement) => el.readyState), { timeout: 15_000 })
        .toBeGreaterThan(0)
    }

    if (post.pending) {
      // A pre-release post has no price table at all — the model has not
      // shipped, so there is nothing to resolve from the registry.
      await expect(
        page.getByRole('heading', { level: 2, name: t('en', 'releases.pendingTitle'), exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole('columnheader', { name: t('en', 'releases.colModel'), exact: true }),
      ).toHaveCount(0)
      expect(pageErrors).toEqual([])
      expect(ownErrors(consoleErrors)).toEqual([])
      return
    }

    // The price table: the subject first, then every model the post compares.
    const table = page
      .getByRole('columnheader', { name: t('en', 'releases.colModel'), exact: true })
      .locator('xpath=ancestor::table')
    const ids = [post.modelId, ...post.compareModelIds]
    await expect(table.locator('tbody tr')).toHaveCount(ids.length)

    for (const [index, id] of ids.entries()) {
      const price = REGISTRY.models.find((model) => model.id === id)
      expect(price, `${slug} should compare a model the registry knows: ${id}`).toBeTruthy()
      const cells = await read(async () =>
        (await table.locator('tbody tr').nth(index).locator('td').allTextContents()).map((text) =>
          text.trim(),
        ),
      )
      expect(cells[0]).toContain(price!.displayName)
      expect(cells[1]).toBe(formatReleasePrice(price!.inputPricePer1M))
      expect(cells[2]).toBe(formatReleasePrice(price!.outputPricePer1M))
    }

    expect(pageErrors).toEqual([])
    expect(ownErrors(consoleErrors)).toEqual([])
  })

  test(`the post ${slug} has a Chinese counterpart`, async ({ page, consoleErrors, pageErrors }) => {
    const en = readPost(`${slug}.md`)
    const zh = readPost(`${slug}.zh.md`)

    const response = await visit(page, `/zh/releases/${slug}`)
    expect(response?.status()).toBe(200)

    await expect(
      page.getByRole('heading', { level: 1, name: zh.title, exact: true }),
    ).toBeVisible()
    // A native rewrite, not the English text.
    expect(zh.title).not.toBe(en.title)
    expect(zh.title).toMatch(/[一-鿿]/)

    if (zh.pending) {
      // Pre-release: no price table in either language, so the Chinese page
      // is checked on its own empty-state copy instead of a column header.
      await expect(
        page.getByRole('heading', { level: 2, name: t('zh', 'releases.pendingTitle'), exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole('columnheader', { name: t('zh', 'releases.colModel'), exact: true }),
      ).toHaveCount(0)
      expect(pageErrors).toEqual([])
      expect(ownErrors(consoleErrors)).toEqual([])
      return
    }

    // The Chinese page quotes the Chinese column names.
    await expect(
      page.getByRole('columnheader', { name: t('zh', 'releases.colModel'), exact: true }),
    ).toBeVisible()

    expect(pageErrors).toEqual([])
    expect(ownErrors(consoleErrors)).toEqual([])
  })
}
