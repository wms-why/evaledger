import { createFileRoute, redirect } from '@tanstack/react-router'
import { canonicalPath } from '@/features/seo/aliases'

/**
 * The calculator's historical alias.
 *
 * The page used to be published under two names — `/token-calculator` and
 * `/token-cost-calculator` — and the site's own chrome pointed at one here
 * and the other there, so the same labelled link resolved to two different
 * addresses and each one collected half the internal link equity.
 *
 * `/token-cost-calculator` is the canonical address: it says what the page
 * does (it prices a cost per token), and it is the one the sitemap, the
 * footer and the sibling calculator landings already point at. This file
 * stays because the URL is live and bookmarked — it answers with a **301**,
 * which is the one signal that says "this address moved here for good".
 *
 * The `?model=` deep link survives the move: the calculator's shareable
 * per-model links are built on it, and a redirect that dropped the query
 * would break every one of them.
 */
export const Route = createFileRoute('/{-$locale}/token-calculator')({
  validateSearch: (search: Record<string, unknown>): { model?: string } => ({
    model: typeof search.model === 'string' ? search.model : undefined,
  }),
  beforeLoad: ({ params, location }) => {
    const locale = (params as { locale?: string }).locale
    const prefix = locale ? `/${locale}` : ''
    const model = new URLSearchParams(location.search).get('model')
    const query = model ? `?model=${encodeURIComponent(model)}` : ''
    throw redirect({
      href: `${prefix}${canonicalPath('/token-calculator')}${query}`,
      statusCode: 301,
    })
  },
})
