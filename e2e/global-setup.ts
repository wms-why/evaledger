import { ALL_PAGE_ROUTES, ENDPOINT_ROUTES } from './helpers/routes'

/**
 * Warm the dev server before the suite runs.
 *
 * `vite dev` compiles a route module the first time it is requested, and its
 * dependency optimizer re-bundles (and forces a full page reload) while the
 * suite is still starting. Both make a cold, parallel run flaky: pages time
 * out while they compile, and a reload mid-hydration looks like a React
 * hydration bug.
 *
 * Asking for every route once, up front and with a small amount of
 * concurrency, pays that cost here — serially and predictably — so the suite
 * itself runs against a warm server.
 */
const WARMUP_CONCURRENCY = 6

async function warm(baseURL: string, paths: string[]): Promise<number> {
  let cursor = 0
  let warmed = 0
  const workers = Array.from({ length: WARMUP_CONCURRENCY }, async () => {
    while (cursor < paths.length) {
      const path = paths[cursor++]
      try {
        const response = await fetch(new URL(path, baseURL), { redirect: 'manual' })
        if (response.ok) warmed++
      } catch {
        // A route that fails to warm up is reported by the suite itself.
      }
    }
  })
  await Promise.all(workers)
  return warmed
}

export default async function globalSetup(): Promise<void> {
  const port = Number(process.env.E2E_PORT ?? 3000)
  const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`
  const paths = [...ALL_PAGE_ROUTES, ...ENDPOINT_ROUTES].map((route) => route.path)
  const warmed = await warm(baseURL, paths)
  console.log(`[e2e] warmed ${warmed}/${paths.length} routes on ${baseURL}`)
}
