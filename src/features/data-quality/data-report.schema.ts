import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { user } from '@/features/auth/auth.schema'

/**
 * Correction reports filed by visitors about a price, score or version.
 *
 * These are operational intake (like `feedback` / `waitlist`), not published
 * site content: the fix a report produces is still an edit to the price file.
 *
 * `userId` is nullable on purpose: reporting a wrong price must not require an
 * account. A signed-in reporter gets their row attributed, which is what makes
 * "my reports" (list / edit / withdraw before triage) possible; an anonymous
 * report stays unattributed and only the admin queue can touch it.
 */
export const dataReport = sqliteTable('data_report', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  modelId: text('model_id'),
  kind: text('kind').notNull(),
  detail: text('detail').notNull(),
  sourceUrl: text('source_url'),
  email: text('email'),
  status: text('status').notNull().default('open'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => [
  // The admin queue always lists newest-first.
  index('data_report_createdAt_idx').on(t.createdAt),
  // "My reports" lists by owner; SQLite does not index foreign keys for us.
  index('data_report_userId_idx').on(t.userId),
])

export type DataReport = typeof dataReport.$inferSelect
