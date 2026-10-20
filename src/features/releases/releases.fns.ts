import { createServerFn } from '@tanstack/react-start'
import { selectReleases, type ReleaseRaw } from './select'

/**
 * The release series, resolved on the server.
 *
 * Shared by the list route, the post route, the model pages (which link to
 * the release analysis of their model) and the homepage strip — one query,
 * one shape, one place where the collection is read.
 */
export const getReleases = createServerFn({ method: 'GET' })
  .validator((locale: string) => locale)
  .handler(async ({ data: locale }) => {
    const { releases } = await import('collections/server')
    return selectReleases(releases as unknown as ReleaseRaw[], locale)
  })
