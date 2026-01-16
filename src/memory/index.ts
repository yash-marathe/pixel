/**
 * Contextual Memory and Persistence Module
 * 
 * This module provides persistent memory storage and context management
 * for Pixel, enabling:
 * - Session continuity across terminal sessions
 * - Project-specific memory storage
 * - Context-aware suggestions
 * - Memory export/import capabilities
 */

export { MemoryStore, getMemoryStore, resetMemoryStore } from './MemoryStore'
export type { MemoryEntry, Session, MemoryConfig } from './MemoryStore'

export {
  ContextManager,
  getContextManager,
  resetContextManager,
} from './ContextManager'
