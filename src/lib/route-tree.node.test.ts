import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

/**
 * The route tree must not shadow the homepage.
 *
 * TanStack Router's file conventions read a leading `_` in a route file name
 * as **pathless**: `_sitemap.xml.ts` is not "the sitemap at `/sitemap.xml`",
 * it is a pathless layout route that serves its *parent's* path. Directly
 * under `src/routes/` that parent is the root, so the route lands on `/` —
 * and a route that declares `server.handlers` answers every request to that
 * path with its handler.
 *
 * The failure was silent and total: `GET /` replied with the sitemap XML,
 * the homepage was unreachable, and `/sitemap.xml` 404ed. The file name
 * looked right; only the generated tree knew the truth.
 *
 * Two tests make that impossible to land again:
 *   - a top-level route file may not be a pathless **server** route,
 *   - the generated tree may not carry a second route on the root path.
 */

const ROUTES_DIR = fileURLToPath(new URL('../routes/', import.meta.url))
const ROUTE_TREE = fileURLToPath(new URL('../routeTree.gen.ts', import.meta.url))

/** The route files directly under `src/routes/` (the top level of the tree). */
function topLevelRouteFiles(): string[] {
  return readdirSync(ROUTES_DIR)
    .filter((entry) => statSync(`${ROUTES_DIR}/${entry}`).isFile())
    .filter((entry) => /\.(ts|tsx)$/.test(entry))
}

test('no top-level route file is a pathless server route', () => {
  const offenders = topLevelRouteFiles().filter((entry) => {
    if (!entry.startsWith('_')) return false
    // `__root.tsx` is the root route itself, not a pathless layout.
    if (entry === '__root.tsx') return false
    // A pathless route WITHOUT a server handler is harmless: it renders into
    // its children and never answers a request on its own.
    return /server\s*:\s*\{/.test(readFileSync(`${ROUTES_DIR}/${entry}`, 'utf8'))
  })

  expect(
    offenders,
    'a top-level route file whose name starts with `_` is a PATHLESS route — it serves the root path `/`, ' +
      'so a server handler on it takes over the homepage. Drop the `_` (or move the file out of `src/routes/`).',
  ).toEqual([])
})

test('the generated route tree has no second route on the root path', () => {
  const tree = readFileSync(ROUTE_TREE, 'utf8')
  const block = tree.slice(tree.indexOf('interface FileRoutesByPath'))
  const fullPaths = [...block.matchAll(/fullPath: '([^']*)'/g)].map((m) => m[1])

  expect(
    fullPaths.filter((p) => p === '/'),
    'a route with the root path `/` is a pathless route — it answers every request to the homepage. ' +
      'Only the locale index may serve `/`.',
  ).toEqual([])

  // The homepage itself: the index route of the locale group.
  expect(fullPaths, 'the homepage route must exist').toContain('/{-$locale}/')
})
