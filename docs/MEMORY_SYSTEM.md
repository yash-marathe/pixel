# Contextual Memory & Persistence System

## Overview

Pixel's contextual memory system provides persistent storage and intelligent retrieval of project-related information across terminal sessions. This enables Pixel to maintain context, learn from past interactions, and provide more relevant suggestions.

## Features

### 1. Session Continuity

Pixel maintains session information across terminal sessions:
- Automatic session start/end tracking
- Session summaries with key metrics
- Persistent storage of session data

### 2. Memory Types

The system tracks different types of information:
- **Commands**: Executed commands and their results
- **Files**: File modifications and changes
- **Context**: Important project context updates
- **Conversations**: User-assistant interactions
- **Insights**: Key observations and learnings

### 3. Context-Aware Suggestions

Pixel provides intelligent suggestions based on:
- Current working files
- Recent commands
- Historical patterns
- Project context

### 4. Memory Management

Automatic cleanup and optimization:
- Configurable retention policies
- Importance-based filtering
- Age-based cleanup
- Export/import capabilities

## Usage

### Basic Commands

#### View Memory Statistics
```bash
pixel memory stats
```

Shows overall memory usage, session count, and memory distribution by type.

#### Search Memories
```bash
pixel memory search "<query>"
```

Searches through all memories for relevant information.

#### Get Suggestions
```bash
pixel memory suggest
```

Displays context-aware suggestions based on current state.

#### View Session Summary
```bash
pixel memory summary
```

Shows a summary of the current session including commands executed, files touched, and insights captured.

#### List Recent Memories
```bash
pixel memory list [--limit <number>]
```

Lists recent memories with optional limit (default: 10).

#### Export Memories
```bash
pixel memory export <filepath>
```

Exports all memories to a JSON file for backup or sharing.

#### Import Memories
```bash
pixel memory import <filepath>
```

Imports memories from a previously exported JSON file.

#### Cleanup Old Memories
```bash
pixel memory cleanup
```

Removes old or low-importance memories based on retention policies.

## Configuration

Memory system behavior can be configured through the memory config:

```typescript
{
  maxMemories: 1000,        // Maximum number of memories to retain
  maxSessionAge: 30,        // Maximum session age in days
  importanceThreshold: 3,   // Minimum importance for retention (1-5)
  autoCleanup: true         // Enable automatic cleanup
}
```

## Integration

### Automatic Recording

Pixel automatically records:
- All commands executed through the CLI
- File modifications made during sessions
- Important context changes
- Conversation snippets

### Manual Recording

You can also manually record important information:

```typescript
import { getContextManager } from './memory/ContextManager'

const contextManager = getContextManager()

// Record an insight
contextManager.recordInsight(
  'This component handles authentication',
  ['src/auth/AuthComponent.tsx']
)

// Record a file change
contextManager.recordFileChange(
  'src/config.ts',
  'modify',
  'Updated API endpoint'
)
```

### React Hooks

For UI components, use the provided hooks:

```typescript
import { useMemory, useSessionSummary } from './hooks/useMemory'

function MyComponent() {
  const { suggestions, relevantMemories, recordInsight } = useMemory()
  const summary = useSessionSummary()
  
  // Use memory features in your component
}
```

## Storage

Memories are stored in the project directory:

```
.pixel/
  memory/
    sessions.json    # All session data and memories
```

## Best Practices

1. **Regular Cleanup**: Run cleanup periodically to maintain performance
2. **Export Important Sessions**: Export memories from critical work sessions
3. **Use Importance Levels**: Rate memories appropriately (1-5 scale)
4. **Tag Memories**: Use tags for better organization and retrieval
5. **Review Suggestions**: Check context-aware suggestions regularly

## Privacy

All memory data is stored locally in your project directory:
- No data is sent to external servers
- Memories are project-specific
- You have full control over retention and deletion

## Troubleshooting

### Memory Not Persisting

Check that the `.pixel/memory` directory exists and is writable:
```bash
ls -la .pixel/memory
```

### Too Many Memories

Run cleanup to remove old entries:
```bash
pixel memory cleanup
```

### Lost Sessions

If sessions are lost, check if `sessions.json` is corrupted:
```bash
cat .pixel/memory/sessions.json | jq
```

## API Reference

For detailed API documentation, see:
- [MemoryStore](../src/memory/MemoryStore.ts)
- [ContextManager](../src/memory/ContextManager.ts)
- [Integration Utilities](../src/utils/memoryIntegration.ts)

## Future Enhancements

- AI-powered memory summarization
- Cross-project memory sharing
- Memory visualization dashboard
- Semantic search capabilities
- Memory compression for large projects
