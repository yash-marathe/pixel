# Memory System Architecture

## Overview

The Pixel Memory System is designed with a layered architecture that separates concerns and provides clean interfaces for integration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLI / User Interface                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Memory Cmds  │  │  React UI    │  │  AI Agent    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Integration Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         memoryIntegration.ts / useMemory.tsx         │  │
│  │  • initializeMemory()   • recordCommand()            │  │
│  │  • shutdownMemory()     • recordFileChange()         │  │
│  │  • getRelevantMemories() • getContextualSuggestions()│  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Context Manager                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ContextManager.ts                       │  │
│  │  • Context Tracking      • Recording Methods         │  │
│  │  • Relevance Scoring     • Suggestion Generation     │  │
│  │  • Session Summaries     • Smart Filtering           │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Memory Store                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               MemoryStore.ts                         │  │
│  │  • Session Management    • Memory CRUD               │  │
│  │  • Search & Filter       • Export/Import             │  │
│  │  • Cleanup Policies      • Configuration             │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Persistence Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          .pixel/memory/sessions.json                 │  │
│  │  • Local Filesystem Storage                          │  │
│  │  • JSON Format                                       │  │
│  │  • Project-Specific                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. Memory Store (`MemoryStore.ts`)

**Purpose**: Core storage engine for memories and sessions

**Responsibilities**:
- Manage session lifecycle (create, resume, end)
- Store and retrieve memory entries
- Implement filtering and search logic
- Handle export/import operations
- Execute cleanup policies
- Manage configuration

**Key Methods**:
- `startSession(projectPath)` - Start or resume a session
- `endSession(summary)` - End current session
- `addMemory(type, content, metadata)` - Add a memory
- `getMemories(filters)` - Retrieve filtered memories
- `searchMemories(query)` - Search by content
- `cleanup()` - Apply retention policies
- `export(filepath)` / `import(filepath)` - Backup operations

### 2. Context Manager (`ContextManager.ts`)

**Purpose**: High-level context tracking and intelligent retrieval

**Responsibilities**:
- Track current context state
- Record various types of activities
- Score memories for relevance
- Generate context-aware suggestions
- Create session summaries

**Key Methods**:
- `initialize()` - Initialize context for session
- `updateContext(key, value)` - Update context state
- `recordCommand(command, files, result)` - Record command execution
- `recordFileChange(filepath, type, description)` - Record file change
- `recordInsight(insight, files)` - Record important observation
- `getRelevantMemories(files, limit)` - Get scored relevant memories
- `getSuggestions(files)` - Generate suggestions
- `generateSessionSummary()` - Create session summary
- `endSession()` - End session with cleanup

### 3. Integration Layer (`memoryIntegration.ts`, `useMemory.tsx`)

**Purpose**: Bridge between memory system and rest of application

**Responsibilities**:
- Initialize/shutdown memory system
- Provide convenient wrapper functions
- Expose React hooks for UI
- Handle errors gracefully

**Key Functions**:
- `initializeMemory()` - One-time initialization
- `shutdownMemory()` - Graceful shutdown
- `recordCommand()` - Wrapper for command recording
- `recordFileChange()` - Wrapper for file change recording
- `getRelevantMemories()` - Wrapper for memory retrieval
- `useMemory()` - React hook for memory features
- `useSessionSummary()` - React hook for session summary

## Data Flow

### Memory Creation Flow

```
User Action (CLI/UI)
      ↓
Integration Layer (recordCommand/recordFileChange)
      ↓
Context Manager (recordCommand/recordFileChange)
      ↓
Memory Store (addMemory)
      ↓
Persistence (sessions.json)
```

### Memory Retrieval Flow

```
User Request (search/suggestions)
      ↓
Integration Layer (getRelevantMemories)
      ↓
Context Manager (getRelevantMemories/getSuggestions)
      ↓
Memory Store (getMemories with filters)
      ↓
Relevance Scoring
      ↓
Filtered & Sorted Results
```

## Memory Entry Structure

```typescript
interface MemoryEntry {
  id: string                    // Unique identifier
  timestamp: number             // Creation time (ms)
  type: MemoryType             // command|context|file|conversation|insight
  content: string              // Main content
  metadata: {
    project?: string           // Project path
    files?: string[]           // Related files
    tags?: string[]            // Categorization tags
    importance?: number        // 1-5 scale
    relatedTo?: string[]       // Related memory IDs
  }
}
```

## Session Structure

```typescript
interface Session {
  id: string                    // Unique session ID
  startTime: number            // Session start (ms)
  endTime?: number             // Session end (ms)
  projectPath: string          // Project location
  memories: MemoryEntry[]      // Session memories
  summary?: string             // Session summary
}
```

## Configuration

```typescript
interface MemoryConfig {
  maxMemories: number          // Max memories to retain (default: 1000)
  maxSessionAge: number        // Max session age in days (default: 30)
  importanceThreshold: number  // Min importance for retention (default: 3)
  autoCleanup: boolean         // Auto cleanup enabled (default: true)
}
```

## Relevance Scoring Algorithm

```typescript
score = base_importance

// File match bonus
if (memory.files ∩ current_files) {
  score += matching_files.length × 2
}

// Recency bonus
if (age < 24 hours) {
  score += 2
} else if (age < 7 days) {
  score += 1
}

// Type-specific bonuses
if (type === 'insight') {
  score += 1
}
```

## Cleanup Strategy

1. **Age-based**: Remove sessions older than `maxSessionAge` days
2. **Capacity-based**: When total memories exceed `maxMemories`:
   - Keep all memories with `importance >= importanceThreshold`
   - Keep all memories from last 7 days
   - Remove oldest low-importance memories first
3. **Active sessions**: Never remove active (not ended) sessions

## Performance Considerations

### Storage
- Single JSON file per project
- Lazy loading on initialization
- Incremental saves on updates
- Average size: ~1-10 MB per project

### Memory
- In-memory cache of active session
- On-demand loading of historical sessions
- Configurable memory limits

### Search
- Content-based: O(n) linear search (acceptable for n < 10,000)
- Filter-based: O(n) with early termination
- Future: Consider indexing for larger datasets

## Security & Privacy

- **Local Storage**: All data stays on user's machine
- **Project Isolation**: Memories are project-specific
- **No Network**: No external communication
- **User Control**: Easy export/deletion
- **No PII**: Content is whatever user records

## Extension Points

### Future Enhancements

1. **AI Summarization**: Use LLM to generate better summaries
2. **Semantic Search**: Embed memories for similarity search
3. **Cross-Project**: Share memories across related projects
4. **Compression**: Compress old sessions
5. **Cloud Sync**: Optional cloud backup (with encryption)
6. **Analytics**: Dashboard for memory insights

## Error Handling

All operations include error handling:
- File system errors (permissions, disk space)
- JSON parsing errors (corrupted data)
- Invalid state transitions
- Graceful degradation (continue without memory if fails)

## Testing Strategy

- **Unit Tests**: Each component in isolation
- **Integration Tests**: Component interactions
- **Persistence Tests**: Storage layer
- **Performance Tests**: Cleanup and search at scale
- **Error Tests**: Failure scenarios

## Dependencies

- `fs` - File system operations
- `nanoid` - Unique ID generation
- `lodash-es` - Utility functions
- No external network dependencies
