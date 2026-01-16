import { getContextManager } from '../memory/ContextManager'
import { getMemoryStore } from '../memory/MemoryStore'
import { logError } from './log'
import { getCwd } from './state'

/**
 * Integration utilities for memory system
 */

let isMemoryInitialized = false

/**
 * Initializes the memory system
 */
export async function initializeMemory(): Promise<void> {
  if (isMemoryInitialized) {
    return
  }

  try {
    const contextManager = getContextManager()
    await contextManager.initialize()
    isMemoryInitialized = true
  } catch (error) {
    logError('Failed to initialize memory system:', error)
  }
}

/**
 * Shuts down the memory system gracefully
 */
export async function shutdownMemory(): Promise<void> {
  if (!isMemoryInitialized) {
    return
  }

  try {
    const contextManager = getContextManager()
    await contextManager.endSession()
    
    // Perform cleanup
    contextManager.cleanup()
    
    isMemoryInitialized = false
  } catch (error) {
    logError('Failed to shutdown memory system:', error)
  }
}

/**
 * Records a command execution in memory
 */
export function recordCommand(
  command: string,
  files?: string[],
  result?: string,
): void {
  if (!isMemoryInitialized) {
    return
  }

  try {
    const contextManager = getContextManager()
    contextManager.recordCommand(command, files, result)
  } catch (error) {
    logError('Failed to record command:', error)
  }
}

/**
 * Records a file change in memory
 */
export function recordFileChange(
  filepath: string,
  changeType: 'create' | 'modify' | 'delete',
  description?: string,
): void {
  if (!isMemoryInitialized) {
    return
  }

  try {
    const contextManager = getContextManager()
    contextManager.recordFileChange(filepath, changeType, description)
  } catch (error) {
    logError('Failed to record file change:', error)
  }
}

/**
 * Records an insight in memory
 */
export function recordInsight(insight: string, relatedFiles?: string[]): void {
  if (!isMemoryInitialized) {
    return
  }

  try {
    const contextManager = getContextManager()
    contextManager.recordInsight(insight, relatedFiles)
  } catch (error) {
    logError('Failed to record insight:', error)
  }
}

/**
 * Records a conversation message in memory
 */
export function recordConversation(
  message: string,
  isUserMessage: boolean,
  files?: string[],
): void {
  if (!isMemoryInitialized) {
    return
  }

  try {
    const contextManager = getContextManager()
    contextManager.recordConversation(message, isUserMessage, files)
  } catch (error) {
    logError('Failed to record conversation:', error)
  }
}

/**
 * Gets relevant memories for current context
 */
export function getRelevantMemories(currentFiles: string[], limit?: number) {
  if (!isMemoryInitialized) {
    return []
  }

  try {
    const contextManager = getContextManager()
    return contextManager.getRelevantMemories(currentFiles, limit)
  } catch (error) {
    logError('Failed to get relevant memories:', error)
    return []
  }
}

/**
 * Gets context-aware suggestions
 */
export function getContextualSuggestions(currentFiles: string[]): string[] {
  if (!isMemoryInitialized) {
    return []
  }

  try {
    const contextManager = getContextManager()
    return contextManager.getSuggestions(currentFiles)
  } catch (error) {
    logError('Failed to get suggestions:', error)
    return []
  }
}

/**
 * Checks if memory system is initialized
 */
export function isMemoryActive(): boolean {
  return isMemoryInitialized
}
