/**
 * Version of the `pnpm prices:fetch` script.
 *
 * Bump when the script gains scraping capability for a new model type or
 * version (new provider, new selector, new regex pattern). Move in lockstep
 * with `REGISTRY_VERSION` in `src/features/calculator/model-prices.ts` —
 * when the two diverge, the script prints a warning at the end of its run.
 *
 * The `--apply` mode does NOT touch `REGISTRY_VERSION`; only humans update
 * both versions, in the same commit.
 */
export const SCRIPT_VERSION = '0.6.0'