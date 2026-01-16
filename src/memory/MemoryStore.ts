import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { getCwd } from '../utils/state'
import { logError } from '../utils/log'
import { nanoid } from 'nanoid'

/**
 * Represents a memory entry with contextual information
 */
export interface MemoryEntry {
  id: string
  timestamp: number
  type: 'command' | 'context' | 'file' | 'conversation' | 'insight'
  content: string
  metadata: {
    project?: string
    files?: string[]
    tags?: string[]
    importance?: number // 1-5 scale
    relatedTo?: string[] // IDs of related memories
  }
}

/**
 * Represents a session with its associated memories
 */
export interface Session {
  id: string
  startTime: number
  endTime?: number
  projectPath: string
  memories: MemoryEntry[]
  summary?: string
}

/**
 * Configuration for memory retention policies
 */
export interface MemoryConfig {
  maxMemories: number
  maxSessionAge: number // in days
  importanceThreshold: number
  autoCleanup: boolean
}

const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxMemories: 1000,
  maxSessionAge: 30,
  importanceThreshold: 3,
  autoCleanup: true,
}

/**
 * Main memory store class that handles persistence and retrieval
 */
export class MemoryStore {
  private memoryDir: string
  private sessionFile: string
  private config: MemoryConfig
  private currentSession: Session | null = null

  constructor(projectPath?: string) {
    const basePath = projectPath || getCwd()
    this.memoryDir = join(basePath, '.pixel', 'memory')
    this.sessionFile = join(this.memoryDir, 'sessions.json')
    this.config = DEFAULT_MEMORY_CONFIG

    // Ensure memory directory exists
    this.ensureMemoryDir()
  }

  /**
   * Ensures the memory directory structure exists
   */
  private ensureMemoryDir(): void {
    try {
      if (!existsSync(this.memoryDir)) {
        mkdirSync(this.memoryDir, { recursive: true })
      }
    } catch (error) {
      logError('Failed to create memory directory:', error)
    }
  }

  /**
   * Starts a new session or resumes an existing one
   */
  public startSession(projectPath: string): Session {
    // Check if there's an active session from the same project
    const sessions = this.loadSessions()
    const activeSession = sessions.find(
      s => !s.endTime && s.projectPath === projectPath,
    )

    if (activeSession) {
      this.currentSession = activeSession
      return activeSession
    }

    // Create new session
    this.currentSession = {
      id: nanoid(),
      startTime: Date.now(),
      projectPath,
      memories: [],
    }

    sessions.push(this.currentSession)
    this.saveSessions(sessions)
    return this.currentSession
  }

  /**
   * Ends the current session
   */
  public endSession(summary?: string): void {
    if (!this.currentSession) return

    this.currentSession.endTime = Date.now()
    if (summary) {
      this.currentSession.summary = summary
    }

    const sessions = this.loadSessions()
    const index = sessions.findIndex(s => s.id === this.currentSession?.id)
    if (index !== -1) {
      sessions[index] = this.currentSession
      this.saveSessions(sessions)
    }

    this.currentSession = null
  }

  /**
   * Adds a memory entry to the current session
   */
  public addMemory(
    type: MemoryEntry['type'],
    content: string,
    metadata: MemoryEntry['metadata'] = {},
  ): MemoryEntry {
    const memory: MemoryEntry = {
      id: nanoid(),
      timestamp: Date.now(),
      type,
      content,
      metadata: {
        ...metadata,
        project: this.currentSession?.projectPath,
        importance: metadata.importance ?? 3,
      },
    }

    if (this.currentSession) {
      this.currentSession.memories.push(memory)
      this.saveCurrentSession()
    }

    return memory
  }

  /**
   * Retrieves memories based on various filters
   */
  public getMemories(filters?: {
    type?: MemoryEntry['type']
    tags?: string[]
    files?: string[]
    minImportance?: number
    limit?: number
    sessionId?: string
  }): MemoryEntry[] {
    const sessions = this.loadSessions()
    let memories: MemoryEntry[] = []

    // Filter by session if specified
    const relevantSessions = filters?.sessionId
      ? sessions.filter(s => s.id === filters.sessionId)
      : sessions

    // Collect all memories from relevant sessions
    for (const session of relevantSessions) {
      memories = memories.concat(session.memories)
    }

    // Apply filters
    let filtered = memories

    if (filters?.type) {
      filtered = filtered.filter(m => m.type === filters.type)
    }

    if (filters?.tags && filters.tags.length > 0) {
      filtered = filtered.filter(m =>
        m.metadata.tags?.some(tag => filters.tags!.includes(tag)),
      )
    }

    if (filters?.files && filters.files.length > 0) {
      filtered = filtered.filter(m =>
        m.metadata.files?.some(file => filters.files!.includes(file)),
      )
    }

    if (filters?.minImportance) {
      filtered = filtered.filter(
        m => (m.metadata.importance ?? 0) >= filters.minImportance!,
      )
    }

    // Sort by timestamp (most recent first)
    filtered.sort((a, b) => b.timestamp - a.timestamp)

    // Apply limit
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered
  }

  /**
   * Searches memories by content
   */
  public searchMemories(query: string, limit: number = 10): MemoryEntry[] {
    const memories = this.getMemories()
    const lowerQuery = query.toLowerCase()

    return memories
      .filter(m => m.content.toLowerCase().includes(lowerQuery))
      .slice(0, limit)
  }

  /**
   * Gets context-aware suggestions based on current state
   */
  public getContextualSuggestions(
    currentFiles: string[],
    recentCommands: string[],
  ): MemoryEntry[] {
    const sessions = this.loadSessions()
    const suggestions: MemoryEntry[] = []

    // Find memories related to current files
    for (const session of sessions) {
      for (const memory of session.memories) {
        if (
          memory.metadata.files?.some(file => currentFiles.includes(file)) &&
          (memory.metadata.importance ?? 0) >= this.config.importanceThreshold
        ) {
          suggestions.push(memory)
        }
      }
    }

    // Sort by relevance (importance and recency)
    return suggestions
      .sort((a, b) => {
        const importanceA = a.metadata.importance ?? 0
        const importanceB = b.metadata.importance ?? 0
        if (importanceA !== importanceB) {
          return importanceB - importanceA
        }
        return b.timestamp - a.timestamp
      })
      .slice(0, 5)
  }

  /**
   * Gets the current active session
   */
  public getCurrentSession(): Session | null {
    return this.currentSession
  }

  /**
   * Gets all sessions
   */
  public getSessions(): Session[] {
    return this.loadSessions()
  }

  /**
   * Cleans up old or low-importance memories
   */
  public cleanup(): void {
    if (!this.config.autoCleanup) return

    const sessions = this.loadSessions()
    const now = Date.now()
    const maxAge = this.config.maxSessionAge * 24 * 60 * 60 * 1000

    // Remove old sessions
    const filteredSessions = sessions.filter(session => {
      const age = now - session.startTime
      return age < maxAge || !session.endTime // Keep active sessions
    })

    // Limit total memories
    let totalMemories = 0
    for (const session of filteredSessions) {
      totalMemories += session.memories.length
    }

    if (totalMemories > this.config.maxMemories) {
      // Keep high-importance memories and recent ones
      for (const session of filteredSessions) {
        session.memories = session.memories.filter(
          m =>
            (m.metadata.importance ?? 0) >= this.config.importanceThreshold ||
            now - m.timestamp < 7 * 24 * 60 * 60 * 1000, // Keep last 7 days
        )
      }
    }

    this.saveSessions(filteredSessions)
  }

  /**
   * Exports memories to a JSON file
   */
  public export(filepath: string): void {
    try {
      const sessions = this.loadSessions()
      writeFileSync(filepath, JSON.stringify(sessions, null, 2), 'utf-8')
    } catch (error) {
      logError('Failed to export memories:', error)
      throw error
    }
  }

  /**
   * Imports memories from a JSON file
   */
  public import(filepath: string): void {
    try {
      const content = readFileSync(filepath, 'utf-8')
      const importedSessions = JSON.parse(content) as Session[]
      const existingSessions = this.loadSessions()

      // Merge sessions, avoiding duplicates
      const sessionMap = new Map<string, Session>()
      for (const session of [...existingSessions, ...importedSessions]) {
        sessionMap.set(session.id, session)
      }

      this.saveSessions(Array.from(sessionMap.values()))
    } catch (error) {
      logError('Failed to import memories:', error)
      throw error
    }
  }

  /**
   * Updates memory configuration
   */
  public updateConfig(config: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Loads sessions from disk
   */
  private loadSessions(): Session[] {
    try {
      if (!existsSync(this.sessionFile)) {
        return []
      }
      const content = readFileSync(this.sessionFile, 'utf-8')
      return JSON.parse(content) as Session[]
    } catch (error) {
      logError('Failed to load sessions:', error)
      return []
    }
  }

  /**
   * Saves sessions to disk
   */
  private saveSessions(sessions: Session[]): void {
    try {
      writeFileSync(this.sessionFile, JSON.stringify(sessions, null, 2), 'utf-8')
    } catch (error) {
      logError('Failed to save sessions:', error)
    }
  }

  /**
   * Saves the current session
   */
  private saveCurrentSession(): void {
    if (!this.currentSession) return

    const sessions = this.loadSessions()
    const index = sessions.findIndex(s => s.id === this.currentSession?.id)

    if (index !== -1) {
      sessions[index] = this.currentSession
    } else {
      sessions.push(this.currentSession)
    }

    this.saveSessions(sessions)
  }
}

// Global memory store instance
let globalMemoryStore: MemoryStore | null = null

/**
 * Gets or creates the global memory store instance
 */
export function getMemoryStore(): MemoryStore {
  if (!globalMemoryStore) {
    globalMemoryStore = new MemoryStore()
  }
  return globalMemoryStore
}

/**
 * Resets the global memory store (mainly for testing)
 */
export function resetMemoryStore(): void {
  globalMemoryStore = null
}
