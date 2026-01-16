# Contextual Memory Examples

## Example 1: Recording and Retrieving Project Insights

```typescript
import { getContextManager } from './memory/ContextManager'

const contextManager = getContextManager()

// Record an important insight about the codebase
contextManager.recordInsight(
  'The authentication flow uses JWT tokens stored in httpOnly cookies',
  ['src/auth/AuthService.ts', 'src/middleware/auth.ts']
)

// Later, retrieve relevant memories when working on auth files
const memories = contextManager.getRelevantMemories([
  'src/auth/LoginComponent.tsx'
])

for (const memory of memories) {
  console.log(memory.content)
}
```

## Example 2: Session Management

```typescript
import { getMemoryStore } from './memory/MemoryStore'

const memoryStore = getMemoryStore()

// Start a new session
const session = memoryStore.startSession('/path/to/project')

// Add memories during work
memoryStore.addMemory('command', 'npm test', {
  files: ['src/utils/helpers.test.ts'],
  importance: 3,
  tags: ['testing']
})

memoryStore.addMemory('insight', 'Helper functions need better error handling', {
  files: ['src/utils/helpers.ts'],
  importance: 4,
  tags: ['refactoring', 'quality']
})

// End session with summary
memoryStore.endSession('Completed testing and identified refactoring needs')
```

## Example 3: Context-Aware Suggestions

```typescript
import { getContextManager } from './memory/ContextManager'

const contextManager = getContextManager()

// When user opens a file, get relevant suggestions
const currentFiles = ['src/components/UserProfile.tsx']
const suggestions = contextManager.getSuggestions(currentFiles)

suggestions.forEach(suggestion => {
  console.log(`💡 ${suggestion}`)
})

// Output might include:
// 💡 Remember: This component was recently refactored to use hooks
// 💡 Consider: Running tests after changes
// 💡 Recent change: Updated user data validation
```

## Example 4: Memory Search and Filtering

```typescript
import { getMemoryStore } from './memory/MemoryStore'

const memoryStore = getMemoryStore()

// Search for specific content
const results = memoryStore.searchMemories('authentication', 10)

// Filter by type and importance
const importantCommands = memoryStore.getMemories({
  type: 'command',
  minImportance: 4,
  limit: 5
})

// Filter by files
const authFileMemories = memoryStore.getMemories({
  files: ['src/auth/AuthService.ts'],
  minImportance: 3
})
```

## Example 5: Export and Import

```typescript
import { getMemoryStore } from './memory/MemoryStore'

const memoryStore = getMemoryStore()

// Export memories for backup
memoryStore.export('backup/memories-2026-01-16.json')

// Import memories from another project
memoryStore.import('shared-memories.json')
```

## Example 6: React Component Integration

```tsx
import React from 'react'
import { useMemory } from '../hooks/useMemory'

function SmartSuggestions({ currentFiles }: { currentFiles: string[] }) {
  const { suggestions, updateSuggestions } = useMemory()
  
  React.useEffect(() => {
    updateSuggestions(currentFiles)
  }, [currentFiles])
  
  return (
    <div>
      <h3>Suggestions</h3>
      {suggestions.map((suggestion, index) => (
        <div key={index}>
          <span>💡</span> {suggestion}
        </div>
      ))}
    </div>
  )
}
```

## Example 7: Custom Memory Configuration

```typescript
import { MemoryStore } from './memory/MemoryStore'

const memoryStore = new MemoryStore()

// Update memory retention policy
memoryStore.updateConfig({
  maxMemories: 2000,        // Increase max memories
  maxSessionAge: 60,        // Keep sessions for 60 days
  importanceThreshold: 4,   // Only keep high-importance memories
  autoCleanup: true         // Enable automatic cleanup
})

// Manual cleanup
memoryStore.cleanup()
```

## Example 8: Tracking File Changes

```typescript
import { recordFileChange } from './utils/memoryIntegration'
import { watch } from 'fs'

// Watch for file changes and record them
watch('src/', { recursive: true }, (eventType, filename) => {
  if (filename && eventType === 'change') {
    recordFileChange(
      filename,
      'modify',
      'File modified by user'
    )
  }
})
```

## Example 9: Session Summary

```typescript
import { getContextManager } from './memory/ContextManager'

const contextManager = getContextManager()

// Generate and display session summary
const summary = await contextManager.generateSessionSummary()

console.log('\n📋 Session Summary:')
console.log(summary)

// Output:
// Session Duration: 2h 34m
// Commands Executed: 47
// Files Touched: 12
// Insights Captured: 5
// 
// Key Insights:
//   - Refactored authentication to use new API
//   - Added comprehensive tests for user service
//   - Updated documentation for memory system
```

## Example 10: CLI Integration

```bash
# View memory statistics
$ pixel memory stats
📊 Memory Statistics

Sessions:
  Total Sessions: 15
  Active Session: ✓

Current Session:
  ID: abc123def456
  Started: 1/16/2026, 6:30:00 PM
  Memories: 48

Memory Distribution:
  command: 20
  file: 15
  context: 8
  insight: 5

# Search memories
$ pixel memory search "authentication"
🔍 Search Results for "authentication"

[insight] 1/16/2026, 5:45:00 PM
  The authentication flow uses JWT tokens stored in httpOnly cookies
  Files: src/auth/AuthService.ts, src/middleware/auth.ts

[command] 1/16/2026, 4:30:00 PM
  npm test -- auth.test.ts
  Files: src/auth/auth.test.ts

# Get suggestions
$ pixel memory suggest
💡 Context-Aware Suggestions

  • Consider: Running tests after recent auth changes
  • Remember: Authentication tokens expire after 24 hours
  • Recent change: modify: src/auth/AuthService.ts - Updated token validation
```
