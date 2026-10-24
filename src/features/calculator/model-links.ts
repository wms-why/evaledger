import { LEADERBOARD } from '@/features/leaderboard/models'

/**
 * Model-name links for the calculator pages.
 *
 * Two things live here:
 *
 *  1. The join from a price-registry id to its leaderboard slug. The
 *     leaderboard row carries `priceId` (its join key into `REGISTRY`), and
 *     the row's own `id` is the `/models/<slug>` URL. A model that has no
 *     leaderboard row has no model page — so its name must stay plain text
 *     rather than link to a 404.
 *
 *  2. The marker syntax the dictionary uses to say "this model name is a
 *     link": `[[model:<registry-id>|<label>]]`. The dictionary stores the
 *     REGISTRY id, not the slug, so a renamed leaderboard row cannot leave a
 *     dead link behind — the slug is resolved at render time.
 */

/** The marker a dictionary string uses to mark a linked model name. */
const MODEL_MARKER = /\[\[model:([a-z0-9][a-z0-9._-]*)\|([^\]]+)\]\]/g

export type CopySegment =
  | { kind: 'text'; text: string }
  | { kind: 'model'; priceId: string; label: string; slug?: string }

/**
 * The `/models/<slug>` page for a price-registry id, when it has one.
 *
 * `undefined` when the model has no leaderboard row — the caller then renders
 * the name as plain text.
 */
export function modelSlugFor(priceId: string): string | undefined {
  return LEADERBOARD.models.find((m) => m.priceId === priceId)?.id
}

/**
 * Split a copy string into plain-text and linked-model segments.
 *
 * A marker whose model has no leaderboard row degrades to plain text: the
 * name still reads correctly, it just is not a link.
 */
export function parseCopySegments(text: string): CopySegment[] {
  const segments: CopySegment[] = []
  let lastIndex = 0
  for (const match of text.matchAll(MODEL_MARKER)) {
    const [whole, priceId, label] = match
    const start = match.index ?? 0
    if (start > lastIndex) segments.push({ kind: 'text', text: text.slice(lastIndex, start) })
    const slug = modelSlugFor(priceId)
    if (slug) segments.push({ kind: 'model', priceId, label, slug })
    else segments.push({ kind: 'text', text: label })
    lastIndex = start + whole.length
  }
  if (lastIndex < text.length) segments.push({ kind: 'text', text: text.slice(lastIndex) })
  return segments
}

/**
 * The same string with every model marker removed — the plain-text form.
 *
 * Used for the FAQPage JSON-LD, where the answer must be text (schema.org
 * accepts plain text or HTML; plain text is what every other page emits).
 */
export function stripModelMarkers(text: string): string {
  return text.replace(MODEL_MARKER, (_whole, _priceId, label) => label)
}
