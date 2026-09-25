import { createFileRoute } from '@tanstack/react-router'
import { REGISTRY } from '@/features/calculator/model-prices'

/**
 * `GET /api/prices.json` — machine-readable price registry for AI agents.
 *
 * Same shape as the static registry but with explicit cache headers so AI
 * crawlers / chatops can pull it once and cite it. Includes the freshness
 * metadata as the FIRST field in `meta` so an agent parsing the JSON sees
 * it immediately — the same field the page renders as "Updated YYYY-MM-DD".
 *
 * CDN cache: 1 hour at the edge (price data is updated on a human cadence,
 * not per-request). Updates should bump REGISTRY.fetchedAt + the response
 * ETag together.
 */
const handler = () => {
  const body = JSON.stringify(
    {
      meta: {
        fetchedAt: REGISTRY.fetchedAt,
        sourceNote: REGISTRY.sourceNote,
        openRouterMarkup: REGISTRY.openRouterMarkup,
        modelCount: REGISTRY.models.length,
        schemaVersion: 1,
      },
      models: REGISTRY.models,
    },
    null,
    2,
  )

  return new Response(body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
      'access-control-allow-origin': '*',
    },
  })
}

export const Route = createFileRoute('/api/prices.json')({
  server: { handlers: { GET: handler } },
})