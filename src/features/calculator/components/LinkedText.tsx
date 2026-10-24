import { Link } from '@tanstack/react-router'
import { parseCopySegments } from '../model-links'

/**
 * A copy string with its model names turned into links.
 *
 * The calculator pages' prose names models — "Sonnet 5", "Opus 5.5", "GPT-6
 * astra" — and a model name that is not a link is a dead end: the reader has
 * to go back to a search engine to find the page. The dictionary marks the
 * names with `[[model:<registry-id>|<label>]]`, and this component resolves
 * the registry id to its `/models/<slug>` page.
 *
 * A model with no leaderboard row degrades to plain text — there is no page
 * to link to, and a link to a 404 is worse than no link.
 */
export function LinkedText({ text }: { text: string }) {
  return (
    <>
      {parseCopySegments(text).map((segment, index) =>
        segment.kind === 'model' && segment.slug ? (
          <Link
            key={index}
            to="/{-$locale}/models/$slug"
            params={{ slug: segment.slug }}
            className="text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {segment.label}
          </Link>
        ) : (
          <span key={index}>{segment.kind === 'text' ? segment.text : segment.label}</span>
        ),
      )}
    </>
  )
}
