import { MemoryStore } from '../MemoryStore'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { nanoid } from 'nanoid'

describe('MemoryStore', () => {
  let testDir: string
  let memoryStore: MemoryStore

  beforeEach(() => {
    // Create a temporary directory for tests
    testDir = join(tmpdir(), `pixel-test-${nanoid()}`)
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
    memoryStore = new MemoryStore(testDir)
  })

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Session Management', () => {
    it('should start a new session', () => {
      const session = memoryStore.startSession(testDir)
      
      expect(session).toBeDefined()
      expect(session.id).toBeDefined()
      expect(session.projectPath).toBe(testDir)
      expect(session.memories).toEqual([])
      expect(session.endTime).toBeUndefined()
    })

    it('should resume an active session', () => {
      const session1 = memoryStore.startSession(testDir)
      const session2 = memoryStore.startSession(testDir)
      
      expect(session1.id).toBe(session2.id)
    })

    it('should end a session', () => {
      const session = memoryStore.startSession(testDir)
      memoryStore.endSession('Test summary')
      
      const sessions = memoryStore.getSessions()
      const endedSession = sessions.find(s => s.id === session.id)
      
      expect(endedSession?.endTime).toBeDefined()
      expect(endedSession?.summary).toBe('Test summary')
    })
  })

  describe('Memory Operations', () => {
    beforeEach(() => {
      memoryStore.startSession(testDir)
    })

    it('should add a memory', () => {
      const memory = memoryStore.addMemory('command', 'npm test', {
        tags: ['testing'],
        importance: 4,
      })
      
      expect(memory.id).toBeDefined()
      expect(memory.type).toBe('command')
      expect(memory.content).toBe('npm test')
      expect(memory.metadata.importance).toBe(4)
    })

    it('should retrieve memories by type', () => {
      memoryStore.addMemory('command', 'npm test')
      memoryStore.addMemory('insight', 'Test insight')
      memoryStore.addMemory('command', 'npm build')
      
      const commands = memoryStore.getMemories({ type: 'command' })
      
      expect(commands.length).toBe(2)
      expect(commands.every(m => m.type === 'command')).toBe(true)
    })

    it('should retrieve memories by importance', () => {
      memoryStore.addMemory('command', 'Low importance', { importance: 2 })
      memoryStore.addMemory('insight', 'High importance', { importance: 5 })
      memoryStore.addMemory('command', 'Medium importance', { importance: 3 })
      
      const important = memoryStore.getMemories({ minImportance: 4 })
      
      expect(important.length).toBe(1)
      expect(important[0].content).toBe('High importance')
    })

    it('should retrieve memories by tags', () => {
      memoryStore.addMemory('command', 'Test 1', { tags: ['testing', 'unit'] })
      memoryStore.addMemory('command', 'Test 2', { tags: ['testing', 'integration'] })
      memoryStore.addMemory('command', 'Build', { tags: ['build'] })
      
      const testMemories = memoryStore.getMemories({ tags: ['testing'] })
      
      expect(testMemories.length).toBe(2)
    })

    it('should retrieve memories by files', () => {
      memoryStore.addMemory('file', 'Modified file', {
        files: ['src/test.ts'],
      })
      memoryStore.addMemory('file', 'Modified another', {
        files: ['src/another.ts'],
      })
      
      const fileMemories = memoryStore.getMemories({
        files: ['src/test.ts'],
      })
      
      expect(fileMemories.length).toBe(1)
      expect(fileMemories[0].content).toBe('Modified file')
    })

    it('should limit results', () => {
      for (let i = 0; i < 10; i++) {
        memoryStore.addMemory('command', `Command ${i}`)
      }
      
      const limited = memoryStore.getMemories({ limit: 5 })
      
      expect(limited.length).toBe(5)
    })
  })

  describe('Search', () => {
    beforeEach(() => {
      memoryStore.startSession(testDir)
    })

    it('should search memories by content', () => {
      memoryStore.addMemory('command', 'npm test')
      memoryStore.addMemory('command', 'npm build')
      memoryStore.addMemory('insight', 'Testing is important')
      
      const results = memoryStore.searchMemories('test')
      
      expect(results.length).toBe(2)
    })

    it('should be case-insensitive', () => {
      memoryStore.addMemory('command', 'npm TEST')
      
      const results = memoryStore.searchMemories('test')
      
      expect(results.length).toBe(1)
    })
  })

  describe('Contextual Suggestions', () => {
    beforeEach(() => {
      memoryStore.startSession(testDir)
    })

    it('should get suggestions based on files', () => {
      memoryStore.addMemory('insight', 'Auth insight', {
        files: ['src/auth.ts'],
        importance: 5,
      })
      memoryStore.addMemory('command', 'Low importance', {
        files: ['src/auth.ts'],
        importance: 1,
      })
      
      const suggestions = memoryStore.getContextualSuggestions(
        ['src/auth.ts'],
        [],
      )
      
      expect(suggestions.length).toBe(1)
      expect(suggestions[0].content).toBe('Auth insight')
    })
  })

  describe('Cleanup', () => {
    beforeEach(() => {
      memoryStore.startSession(testDir)
    })

    it('should remove low-importance memories when exceeding limit', () => {
      memoryStore.updateConfig({ maxMemories: 5, autoCleanup: true })
      
      // Add more memories than the limit
      for (let i = 0; i < 10; i++) {
        memoryStore.addMemory('command', `Command ${i}`, {
          importance: i < 5 ? 2 : 4,
        })
      }
      
      memoryStore.cleanup()
      
      const memories = memoryStore.getMemories()
      expect(memories.length).toBeLessThan(10)
    })
  })

  describe('Export/Import', () => {
    beforeEach(() => {
      memoryStore.startSession(testDir)
    })

    it('should export memories to file', () => {
      memoryStore.addMemory('command', 'npm test')
      memoryStore.addMemory('insight', 'Test insight')
      
      const exportPath = join(testDir, 'export.json')
      memoryStore.export(exportPath)
      
      expect(existsSync(exportPath)).toBe(true)
    })

    it('should import memories from file', () => {
      const importPath = join(testDir, 'import.json')
      const testData = [{
        id: 'test-session',
        startTime: Date.now(),
        projectPath: testDir,
        memories: [{
          id: 'test-memory',
          timestamp: Date.now(),
          type: 'command' as const,
          content: 'Imported command',
          metadata: {},
        }],
      }]
      
      writeFileSync(importPath, JSON.stringify(testData))
      memoryStore.import(importPath)
      
      const memories = memoryStore.getMemories()
      expect(memories.some(m => m.content === 'Imported command')).toBe(true)
    })
  })
})
