/**
 * Public barrel for the AI providers feature. Everything an external caller
 * (currently `src/features/books/ai/{architect,writer,pipeline}.server.ts`)
 * needs is re-exported here so the only thing those files change is the
 * import path.
 *
 *   import { runAI, AIRuntimeError } from '@/features/ai-providers'
 *
 * Administration-only entry points (admin server fns) live under
 * `@/features/ai-providers/ai-providers.actions` and are not re-exported
 * from here — admins import them via the admin layer.
 */
export {
  runAI,
  runAIString,
  // type re-exports
} from './selector'

export {
  AIRuntimeError,
  type ChatMessage,
  type RunOptions,
  type RunResult,
  type FailureKind,
  type ProviderKind,
} from './ai-providers.shared'
