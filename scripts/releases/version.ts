/**
 * Version of the `pnpm releases:fetch` script.
 *
 * Bump when the script gains a new source, a new selector, or a new draft
 * field. There is no registry to keep in lockstep with (unlike
 * `scripts/prices/version.ts`) — the release contract lives in
 * `src/features/releases/README.md` and is enforced by its own tests.
 */
export const SCRIPT_VERSION = '0.2.0'
