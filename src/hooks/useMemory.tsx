import { useEffect, useState } from 'react'
import { getContextManager } from '../memory/ContextManager'
import type { MemoryEntry } from '../memory/MemoryStore'

/**
 * React hook for accessing memory system
 */
export function useMemory() {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [relevantMemories, setRelevantMemories] = useState<MemoryEntry[]>([])

  const contextManager = getContextManager()

  const updateSuggestions = (currentFiles: string[]) => {
    const newSuggestions = contextManager.getSuggestions(currentFiles)
    setSuggestions(newSuggestions)
  }

  const updateRelevantMemories = (currentFiles: string[], limit?: number) => {
    const memories = contextManager.getRelevantMemories(currentFiles, limit)
    setRelevantMemories(memories)
  }

  const recordCommand = (command: string, files?: string[], result?: string) => {
    contextManager.recordCommand(command, files, result)
  }

  const recordFileChange = (
    filepath: string,
    changeType: 'create' | 'modify' | 'delete',
    description?: string,
  ) => {
    contextManager.recordFileChange(filepath, changeType, description)
  }

  const recordInsight = (insight: string, relatedFiles?: string[]) => {
    contextManager.recordInsight(insight, relatedFiles)
  }

  return {
    suggestions,
    relevantMemories,
    updateSuggestions,
    updateRelevantMemories,
    recordCommand,
    recordFileChange,
    recordInsight,
  }
}

/**
 * React hook for session summary
 */
export function useSessionSummary() {
  const [summary, setSummary] = useState<string>('')
  const contextManager = getContextManager()

  useEffect(() => {
    const updateSummary = async () => {
      const newSummary = await contextManager.generateSessionSummary()
      setSummary(newSummary)
    }

    updateSummary()
    const interval = setInterval(updateSummary, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return summary
}
