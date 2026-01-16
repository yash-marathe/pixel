import { MemoryStore, MemoryEntry, getMemoryStore } from './MemoryStore'
import { getCwd } from '../utils/state'
import { logError } from '../utils/log'
import { getContext as getProjectContext } from '../context'

/**
 * Manages contextual information and provides context-aware suggestions
 */
export class ContextManager {
  private memoryStore: MemoryStore
  private currentContext: Map<string, any>

  constructor(memoryStore?: MemoryStore) {
    this.memoryStore = memoryStore || getMemoryStore()
    this.currentContext = new Map()
  }

  /**
   * Initializes the context manager for a new session
   */
  public async initialize(): Promise<void> {
    try {
      const projectPath = getCwd()
      this.memoryStore.startSession(projectPath)

      // Load existing project context
      const projectContext = await getProjectContext()
      for (const [key, value] of Object.entries(projectContext)) {
        this.currentContext.set(key, value)
      }

      // Log session start
      this.memoryStore.addMemory('context', 'Session started', {
        tags: ['session', 'start'],
        importance: 2,
      })
    } catch (error) {
      logError('Failed to initialize context manager:', error)
    }
  }

  /**
   * Updates the current context with new information
   */
  public updateContext(key: string, value: any): void {
    this.currentContext.set(key, value)

    // Store significant context updates as memories
    if (this.isSignificantUpdate(key)) {
      this.memoryStore.addMemory(
        'context',
        `Updated ${key}: ${JSON.stringify(value)}`,
        {
          tags: ['context-update', key],
          importance: 3,
        },
      )
    }
  }

  /**
   * Gets a value from the current context
   */
  public getContext(key: string): any {
    return this.currentContext.get(key)
  }

  /**
   * Gets all current context
   */
  public getAllContext(): Record<string, any> {
    return Object.fromEntries(this.currentContext)
  }

  /**
   * Records a command execution
   */
  public recordCommand(
    command: string,
    files?: string[],
    result?: string,
  ): void {
    this.memoryStore.addMemory('command', command, {
      files,
      tags: ['command'],
      importance: 3,
    })

    if (result) {
      this.memoryStore.addMemory('context', `Command result: ${result}`, {
        files,
        tags: ['result'],
        importance: 2,
      })
    }
  }

  /**
   * Records a file modification
   */
  public recordFileChange(
    filepath: string,
    changeType: 'create' | 'modify' | 'delete',
    description?: string,
  ): void {
    this.memoryStore.addMemory(
      'file',
      `${changeType}: ${filepath}${description ? ` - ${description}` : ''}`,
      {
        files: [filepath],
        tags: ['file-change', changeType],
        importance: 4,
      },
    )
  }

  /**
   * Records an insight or important observation
   */
  public recordInsight(insight: string, relatedFiles?: string[]): void {
    this.memoryStore.addMemory('insight', insight, {
      files: relatedFiles,
      tags: ['insight'],
      importance: 5,
    })
  }

  /**
   * Records a conversation snippet
   */
  public recordConversation(
    message: string,
    isUserMessage: boolean,
    files?: string[],
  ): void {
    this.memoryStore.addMemory('conversation', message, {
      files,
      tags: [isUserMessage ? 'user' : 'assistant', 'conversation'],
      importance: 2,
    })
  }

  /**
   * Gets relevant memories for the current context
   */
  public getRelevantMemories(
    currentFiles: string[],
    limit: number = 10,
  ): MemoryEntry[] {
    const memories = this.memoryStore.getMemories({
      minImportance: 3,
      limit: limit * 2, // Get more to filter
    })

    // Score memories based on relevance
    const scored = memories.map(memory => {
      let score = memory.metadata.importance ?? 0

      // Boost if related to current files
      if (memory.metadata.files) {
        const matchingFiles = memory.metadata.files.filter(f =>
          currentFiles.includes(f),
        )
        score += matchingFiles.length * 2
      }

      // Boost recent memories
      const age = Date.now() - memory.timestamp
      const hoursSinceCreation = age / (1000 * 60 * 60)
      if (hoursSinceCreation < 24) {
        score += 2
      } else if (hoursSinceCreation < 168) {
        // 7 days
        score += 1
      }

      return { memory, score }
    })

    // Sort by score and return top results
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory)
  }

  /**
   * Gets context-aware suggestions for the user
   */
  public getSuggestions(currentFiles: string[]): string[] {
    const suggestions: string[] = []

    // Get relevant memories
    const relevantMemories = this.getRelevantMemories(currentFiles, 5)

    // Generate suggestions based on patterns
    for (const memory of relevantMemories) {
      if (memory.type === 'command') {
        suggestions.push(`Consider: ${memory.content}`)
      } else if (memory.type === 'insight') {
        suggestions.push(`Remember: ${memory.content}`)
      }
    }

    // Add file-specific suggestions
    const fileMemories = this.memoryStore.getMemories({
      type: 'file',
      files: currentFiles,
      limit: 3,
    })

    for (const memory of fileMemories) {
      suggestions.push(`Recent change: ${memory.content}`)
    }

    return suggestions.slice(0, 5)
  }

  /**
   * Generates a summary of the current session
   */
  public async generateSessionSummary(): Promise<string> {
    const session = this.memoryStore.getCurrentSession()
    if (!session) {
      return 'No active session'
    }

    const commands = session.memories.filter(m => m.type === 'command')
    const files = new Set<string>()
    session.memories.forEach(m => {
      m.metadata.files?.forEach(f => files.add(f))
    })
    const insights = session.memories.filter(m => m.type === 'insight')

    const summary = [
      `Session Duration: ${this.formatDuration(Date.now() - session.startTime)}`,
      `Commands Executed: ${commands.length}`,
      `Files Touched: ${files.size}`,
      `Insights Captured: ${insights.length}`,
    ]

    if (insights.length > 0) {
      summary.push('\nKey Insights:')
      insights.slice(0, 3).forEach(insight => {
        summary.push(`  - ${insight.content}`)
      })
    }

    return summary.join('\n')
  }

  /**
   * Ends the current session
   */
  public async endSession(): Promise<void> {
    const summary = await this.generateSessionSummary()
    this.memoryStore.endSession(summary)
    this.currentContext.clear()
  }

  /**
   * Performs cleanup of old memories
   */
  public cleanup(): void {
    this.memoryStore.cleanup()
  }

  /**
   * Determines if a context update is significant enough to store
   */
  private isSignificantUpdate(key: string): boolean {
    const significantKeys = [
      'currentBranch',
      'activeFiles',
      'recentCommands',
      'projectGoals',
      'currentTask',
    ]
    return significantKeys.includes(key)
  }

  /**
   * Formats duration in a human-readable format
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }
}

// Global context manager instance
let globalContextManager: ContextManager | null = null

/**
 * Gets or creates the global context manager instance
 */
export function getContextManager(): ContextManager {
  if (!globalContextManager) {
    globalContextManager = new ContextManager()
  }
  return globalContextManager
}

/**
 * Resets the global context manager (mainly for testing)
 */
export function resetContextManager(): void {
  globalContextManager = null
}
