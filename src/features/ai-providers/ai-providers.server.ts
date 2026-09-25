/**
 * Pure CRUD helpers over the `ai_provider` D1 table. No `@/db/scope` here —
 * providers are global configuration, not user-owned.
 *
 * Server fns in `ai-providers.actions.ts` import these and gate them with
 * `assertAdmin()`. Tests run against a real D1 (mini-flare / workers pool)
 * via `ai-providers.server.workers.test.ts`.
 *
 * Coalesced error writes: `recordFailure(...)` only mutates `lastError` when
 * the prior write was > 30s ago (death-spiral D1 write amplification).
 */
import { and, asc, desc, eq, gt, sql } from 'drizzle-orm'
import type { DB } from '@/db/client'
import { aiProvider, type AIProvider, type AIProviderInsert } from './ai-providers.schema'
import { D1_COALESCE_MS } from './health'

/** All enabled rows ordered by priority asc, then id asc (stable). */
export async function listEnabledByPriority(db: DB): Promise<AIProvider[]> {
  return db
    .select()
    .from(aiProvider)
    .where(eq(aiProvider.enabled, true))
    .orderBy(asc(aiProvider.priority), asc(aiProvider.id))
}

/** All rows — admin UI uses this. */
export async function listAllByPriority(db: DB): Promise<AIProvider[]> {
  return db
    .select()
    .from(aiProvider)
    .orderBy(asc(aiProvider.priority), asc(aiProvider.id))
}

export async function getProviderById(db: DB, id: string): Promise<AIProvider | null> {
  const rows = await db.select().from(aiProvider).where(eq(aiProvider.id, id)).limit(1)
  return rows[0] ?? null
}

export interface UpsertProviderInput {
  id?: string
  kind: AIProvider['kind']
  label: string
  model: string
  baseUrlOverride?: string | null
  enabled?: boolean
  priority: number
  maxTokensCap?: number | null
}

/** Insert a new provider, or update label/model/baseUrl/maxTokensCap/priority/enabled.
 *  Pass `id` to update; omit to insert (id is auto-generated as UUID). */
export async function upsertProvider(db: DB, input: UpsertProviderInput, now: number): Promise<AIProvider> {
  if (input.id) {
    const existing = await getProviderById(db, input.id)
    if (!existing) throw new Error(`Provider ${input.id} not found`)
    const updated = await db
      .update(aiProvider)
      .set({
        label: input.label,
        model: input.model,
        baseUrlOverride: input.baseUrlOverride ?? null,
        enabled: input.enabled ?? existing.enabled,
        priority: input.priority,
        maxTokensCap: input.maxTokensCap ?? null,
        updatedAt: new Date(now),
      })
      .where(eq(aiProvider.id, input.id))
      .returning()
    return updated[0]
  }
  const insertRow: AIProviderInsert = {
    id: crypto.randomUUID(),
    kind: input.kind,
    label: input.label,
    model: input.model,
    baseUrlOverride: input.baseUrlOverride ?? null,
    enabled: input.enabled ?? true,
    priority: input.priority,
    maxTokensCap: input.maxTokensCap ?? null,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  }
  const inserted = await db.insert(aiProvider).values(insertRow).returning()
  return inserted[0]
}

export async function setEnabled(db: DB, id: string, enabled: boolean, now: number): Promise<void> {
  await db
    .update(aiProvider)
    .set({ enabled, updatedAt: new Date(now) })
    .where(eq(aiProvider.id, id))
}

export async function deleteProvider(db: DB, id: string): Promise<boolean> {
  const res = await db.delete(aiProvider).where(eq(aiProvider.id, id)).returning({ id: aiProvider.id })
  return res.length > 0
}

/**
 * Move the given row up by one slot (priority = previous-priority - 1) or
 * down by one slot (priority = next-priority + 1). The composite `(enabled,
 * priority)` index keeps the lookup O(log n).
 *
 * Returns the updated row, or the existing row if at boundary.
 */
export async function reorderByPriority(db: DB, id: string, direction: 'up' | 'down', now: number): Promise<AIProvider | null> {
  const target = await getProviderById(db, id)
  if (!target) return null

  if (direction === 'up') {
    // Find the row immediately above (lower priority, ignoring disabled).
    const above = await db
      .select()
      .from(aiProvider)
      .where(and(eq(aiProvider.enabled, true), sql`${aiProvider.priority} < ${target.priority}`))
      .orderBy(desc(aiProvider.priority), desc(aiProvider.id))
      .limit(1)
    if (above.length === 0) return target // already at top
    const savedTargetPriority = target.priority
    await db.update(aiProvider).set({ priority: above[0].priority, updatedAt: new Date(now) }).where(eq(aiProvider.id, target.id))
    await db.update(aiProvider).set({ priority: savedTargetPriority, updatedAt: new Date(now) }).where(eq(aiProvider.id, above[0].id))
  } else {
    const below = await db
      .select()
      .from(aiProvider)
      .where(and(eq(aiProvider.enabled, true), sql`${aiProvider.priority} > ${target.priority}`))
      .orderBy(asc(aiProvider.priority), asc(aiProvider.id))
      .limit(1)
    if (below.length === 0) return target
    const savedTargetPriority = target.priority
    await db.update(aiProvider).set({ priority: below[0].priority, updatedAt: new Date(now) }).where(eq(aiProvider.id, target.id))
    await db.update(aiProvider).set({ priority: savedTargetPriority, updatedAt: new Date(now) }).where(eq(aiProvider.id, below[0].id))
  }
  return getProviderById(db, id)
}

/** Coalesced lastError write. Updates only when the prior write was > 30s ago
 *  OR the prior error was null (first failure). */
export async function recordLastError(
  db: DB,
  id: string,
  message: string,
  now: number,
): Promise<void> {
  const cutoff = now - D1_COALESCE_MS
  await db
    .update(aiProvider)
    .set({ lastError: message, lastErrorAt: new Date(now) })
    .where(
      and(
        eq(aiProvider.id, id),
        // Coalesce: only update if last error was > D1_COALESCE_MS ago OR was null.
        sql`(${aiProvider.lastErrorAt} IS NULL OR ${aiProvider.lastErrorAt} <= ${cutoff})`,
      ),
    )
}

/** Used by tests + admin UI to verify the coalesce WHERE clause parses cleanly. */
export const RECORD_LAST_ERROR_COALESCE_MS = D1_COALESCE_MS

// Re-exported for selector / public surface.
export { gt } // (silence unused import in case the file shrinks)
