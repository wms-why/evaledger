import type { LeaderboardModel, Vendor } from './types'
import { VENDOR_ORDER } from './vendors'

export interface VendorModelGroup {
  vendor: Vendor
  models: LeaderboardModel[]
}

const VENDOR_RANK = new Map<Vendor, number>(
  VENDOR_ORDER.map((vendor, index) => [vendor, index] as const),
)

/**
 * Filter models for the picker's search box.
 *
 * Every whitespace-separated token must appear somewhere in the model's
 * searchable text (display name, id, version, kind, vendor slug, or the
 * localized vendor name), so `"anthropic opus"` and `"智谱"` both work.
 * An empty / whitespace-only query keeps the caller's original order.
 */
export function filterModels(
  models: readonly LeaderboardModel[],
  query: string,
  vendorLabel: (vendor: Vendor) => string,
): LeaderboardModel[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return [...models]

  return models.filter((model) => {
    const haystack = [
      model.id,
      model.displayName,
      model.version,
      model.kind,
      model.vendor,
      vendorLabel(model.vendor),
    ]
      .join(' ')
      .toLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
}

/**
 * Bucket models into vendor sections in {@link VENDOR_ORDER}, keeping the
 * caller's order inside each bucket. Empty vendors are omitted, so this can
 * run on the already-filtered list.
 */
export function groupModelsByVendor(models: readonly LeaderboardModel[]): VendorModelGroup[] {
  const buckets = new Map<Vendor, LeaderboardModel[]>()
  for (const model of models) {
    const bucket = buckets.get(model.vendor)
    if (bucket) bucket.push(model)
    else buckets.set(model.vendor, [model])
  }

  return [...buckets.entries()]
    .sort(
      ([a], [b]) =>
        (VENDOR_RANK.get(a) ?? VENDOR_ORDER.length) -
        (VENDOR_RANK.get(b) ?? VENDOR_ORDER.length),
    )
    .map(([vendor, entries]) => ({ vendor, models: entries }))
}
