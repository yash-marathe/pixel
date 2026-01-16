import { getMemoryStore } from '../memory/MemoryStore'
import { getContextManager } from '../memory/ContextManager'
import { getCwd } from '../utils/state'
import chalk from 'chalk'

/**
 * Command handlers for memory management
 */

export async function showMemoryStats(): Promise<string> {
  const memoryStore = getMemoryStore()
  const contextManager = getContextManager()

  const sessions = memoryStore.getSessions()
  const currentSession = memoryStore.getCurrentSession()

  let output = chalk.bold('\n📊 Memory Statistics\n\n')

  output += chalk.cyan('Sessions:\n')
  output += `  Total Sessions: ${sessions.length}\n`
  output += `  Active Session: ${currentSession ? '✓' : '✗'}\n\n`

  if (currentSession) {
    output += chalk.cyan('Current Session:\n')
    output += `  ID: ${currentSession.id}\n`
    output += `  Started: ${new Date(currentSession.startTime).toLocaleString()}\n`
    output += `  Memories: ${currentSession.memories.length}\n\n`
  }

  const allMemories = memoryStore.getMemories()
  const byType = allMemories.reduce(
    (acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  output += chalk.cyan('Memory Distribution:\n')
  for (const [type, count] of Object.entries(byType)) {
    output += `  ${type}: ${count}\n`
  }

  return output
}

export async function searchMemory(query: string): Promise<string> {
  const memoryStore = getMemoryStore()
  const results = memoryStore.searchMemories(query, 10)

  if (results.length === 0) {
    return chalk.yellow(`\nNo memories found matching "${query}"\n`)
  }

  let output = chalk.bold(`\n🔍 Search Results for "${query}"\n\n`)

  for (const memory of results) {
    const date = new Date(memory.timestamp).toLocaleString()
    output += chalk.cyan(`[${memory.type}] ${date}\n`)
    output += `  ${memory.content.substring(0, 100)}${memory.content.length > 100 ? '...' : ''}\n`
    if (memory.metadata.files && memory.metadata.files.length > 0) {
      output += chalk.gray(`  Files: ${memory.metadata.files.join(', ')}\n`)
    }
    output += '\n'
  }

  return output
}

export async function getSuggestions(): Promise<string> {
  const contextManager = getContextManager()
  const suggestions = contextManager.getSuggestions([])

  if (suggestions.length === 0) {
    return chalk.yellow('\nNo suggestions available at this time.\n')
  }

  let output = chalk.bold('\n💡 Context-Aware Suggestions\n\n')

  for (const suggestion of suggestions) {
    output += `  • ${suggestion}\n`
  }

  return output
}

export async function showSessionSummary(): Promise<string> {
  const contextManager = getContextManager()
  const summary = await contextManager.generateSessionSummary()

  return chalk.bold('\n📋 Session Summary\n\n') + summary + '\n'
}

export async function exportMemories(filepath: string): Promise<string> {
  try {
    const memoryStore = getMemoryStore()
    memoryStore.export(filepath)
    return chalk.green(`\n✓ Memories exported to ${filepath}\n`)
  } catch (error) {
    return chalk.red(
      `\n✗ Failed to export memories: ${error instanceof Error ? error.message : String(error)}\n`,
    )
  }
}

export async function importMemories(filepath: string): Promise<string> {
  try {
    const memoryStore = getMemoryStore()
    memoryStore.import(filepath)
    return chalk.green(`\n✓ Memories imported from ${filepath}\n`)
  } catch (error) {
    return chalk.red(
      `\n✗ Failed to import memories: ${error instanceof Error ? error.message : String(error)}\n`,
    )
  }
}

export async function cleanupMemories(): Promise<string> {
  const memoryStore = getMemoryStore()
  const beforeCount = memoryStore.getMemories().length
  memoryStore.cleanup()
  const afterCount = memoryStore.getMemories().length
  const removed = beforeCount - afterCount

  return removed > 0
    ? chalk.green(`\n✓ Cleaned up ${removed} old memories\n`)
    : chalk.yellow('\n✓ No memories needed cleanup\n')
}

export async function listRecentMemories(limit: number = 10): Promise<string> {
  const memoryStore = getMemoryStore()
  const memories = memoryStore.getMemories({ limit })

  if (memories.length === 0) {
    return chalk.yellow('\nNo memories found.\n')
  }

  let output = chalk.bold('\n📝 Recent Memories\n\n')

  for (const memory of memories) {
    const date = new Date(memory.timestamp).toLocaleString()
    const importance = '⭐'.repeat(memory.metadata.importance ?? 0)
    output += chalk.cyan(`[${memory.type}] ${date} ${importance}\n`)
    output += `  ${memory.content.substring(0, 80)}${memory.content.length > 80 ? '...' : ''}\n`
    output += '\n'
  }

  return output
}
