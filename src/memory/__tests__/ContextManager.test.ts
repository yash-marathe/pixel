import { ContextManager } from '../ContextManager'
import { MemoryStore } from '../MemoryStore'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { nanoid } from 'nanoid'

describe('ContextManager', () => {
  let testDir: string
  let memoryStore: MemoryStore
  let contextManager: ContextManager

  beforeEach(() => {
    // Create a temporary directory for tests
    testDir = join(tmpdir(), `pixel-test-${nanoid()}`)
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
    memoryStore = new MemoryStore(testDir)
    contextManager = new ContextManager(memoryStore)
  })

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Context Management', () => {
    it('should update context', () => {
      contextManager.updateContext('testKey', 'testValue')
      
      const value = contextManager.getContext('testKey')
      expect(value).toBe('testValue')
    })

    it('should get all context', () => {
      contextManager.updateContext('key1', 'value1')
      contextManager.updateContext('key2', 'value2')
      
      const allContext = contextManager.getAllContext()
      
      expect(allContext.key1).toBe('value1')
      expect(allContext.key2).toBe('value2')
    })
  })

  describe('Recording', () => {
    beforeEach(() => {
      memoryStore.startSession(testDir)
    })

    it('should record commands', () => {
      contextManager.recordCommand('npm test', ['test.ts'], 'success')
      
      const memories = memoryStore.getMemories({ type: 'command' })
      expect(memories.length).toBe(1)
      expect(memories[0].content).toBe('npm test')
    })

    it('should record file changes', () => {
      contextManager.recordFileChange('src/test.ts', 'modify', 'Added tests')
      
      const memories = memoryStore.getMemories({ type: 'file' })
      expect(memories.length).toBe(1)
      expect(memories[0].content).toContain('modify')
      expect(memories[0].content).toContain('src/test.ts')
    })

    it('should record insights', () => {
      contextManager.recordInsight('Important discovery', ['src/main.ts'])
      
      const memories = memoryStore.getMemories({ type: 'insight' })
      expect(memories.length).toBe(1)
      expect(memories[0].content).toBe('Important discovery')
      expect(memories[0].metadata.importance).toBe(5)
    })

    it('should record conversations', () => {
      contextManager.recordConversation('User message', true)
      contextManager.recordConversation('Assistant reply', false)
      
      const memories = memoryStore.getMemories({ type: 'conversation' })
      expect(memories.length).toBe(2)
    })
  })

  describe('Relevant Memories', () => {
    beforeEach(() => {
      memoryStore.startSession(testDir)
    })

    it('should get relevant memories for files', () => {
      contextManager.recordFileChange('src/auth.ts', 'modify')
      contextManager.recordInsight('Auth insight', ['src/auth.ts'])
      contextManager.recordCommand('npm test')
      
      const relevant = contextManager.getRelevantMemories(['src/auth.ts'])
      
      expect(relevant.length).toBeGreaterThan(0)
      expect(relevant[0].metadata.files).toContain('src/auth.ts')
    })

    it('should prioritize by importance and recency', () => {
      // Add memories with different importance
      memoryStore.addMemory('insight', 'High importance', {
        files: ['test.ts'],
        importance: 5,
      })
      
      // Wait a bit
      setTimeout(() => {
        memoryStore.addMemory('command', 'Low importance', {
          files: ['test.ts'],
          importance: 2,
        })
      }, 100)
      
      const relevant = contextManager.getRelevantMemories(['test.ts'])
      
      // High importance should come first
      expect(relevant[0].content).toBe('High importance')
    })
  })

  describe('Suggestions', () => {
    beforeEach(() => {
      memoryStore.startSession(testDir)
    })

    it('should generate suggestions', () => {
      contextManager.recordCommand('npm test', ['test.ts'])
      contextManager.recordInsight('Tests are important', ['test.ts'])
      contextManager.recordFileChange('test.ts', 'modify')
      
      const suggestions = contextManager.getSuggestions(['test.ts'])
      
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should limit suggestions', () => {
      // Add many memories
      for (let i = 0; i < 10; i++) {
        contextManager.recordInsight(`Insight ${i}`, ['test.ts'])
      }
      
      const suggestions = contextManager.getSuggestions(['test.ts'])
      
      expect(suggestions.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Session Summary', () => {
    beforeEach(() => {
      memoryStore.startSession(testDir)
    })

    it('should generate session summary', async () => {
      contextManager.recordCommand('npm test')
      contextManager.recordFileChange('test.ts', 'create')
      contextManager.recordInsight('Test insight')
      
      const summary = await contextManager.generateSessionSummary()
      
      expect(summary).toContain('Commands Executed: 1')
      expect(summary).toContain('Files Touched: 1')
      expect(summary).toContain('Insights Captured: 1')
    })
  })
})
