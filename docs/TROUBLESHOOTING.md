# Memory System Troubleshooting Guide

## Common Issues and Solutions

### Issue: Memory Not Persisting Between Sessions

**Symptoms**:
- Memories are lost after restarting Pixel
- Session doesn't resume
- Empty memory list

**Possible Causes & Solutions**:

1. **Directory Permissions**
   ```bash
   # Check if .pixel/memory directory exists and is writable
   ls -la .pixel/memory
   
   # If it doesn't exist, it should be created automatically
   # If permissions are wrong, fix them:
   chmod 755 .pixel
   chmod 755 .pixel/memory
   chmod 644 .pixel/memory/sessions.json
   ```

2. **Corrupted sessions.json**
   ```bash
   # Validate JSON syntax
   cat .pixel/memory/sessions.json | jq
   
   # If corrupted, backup and reset:
   mv .pixel/memory/sessions.json .pixel/memory/sessions.json.backup
   # Pixel will create a new file on next run
   ```

3. **Multiple Project Paths**
   ```bash
   # Memory is project-specific. Ensure you're in the same directory:
   pwd
   
   # Check if there are memories in parent directories:
   find .. -name "sessions.json" -type f
   ```

### Issue: "Too Many Memories" Warning

**Symptoms**:
- Slow performance
- Large sessions.json file
- Warning messages about memory limit

**Solutions**:

1. **Run Cleanup**
   ```bash
   pixel memory cleanup
   ```

2. **Adjust Configuration**
   ```typescript
   import { getMemoryStore } from './memory/MemoryStore'
   
   const store = getMemoryStore()
   store.updateConfig({
     maxMemories: 2000,  // Increase limit
     maxSessionAge: 60,  // Keep sessions longer
   })
   ```

3. **Export and Archive Old Sessions**
   ```bash
   # Export old memories
   pixel memory export archive-$(date +%Y%m%d).json
   
   # Then cleanup
   pixel memory cleanup
   ```

### Issue: Search Returns No Results

**Symptoms**:
- `pixel memory search` returns empty
- Known memories not found

**Solutions**:

1. **Check Search Query**
   ```bash
   # Search is case-insensitive but requires partial match
   pixel memory search "test"     # Will find "testing", "Test", etc.
   ```

2. **Check Memory Content**
   ```bash
   # List all memories to see what's stored
   pixel memory list --limit 20
   ```

3. **Verify Session Active**
   ```bash
   # Check if memories are being recorded
   pixel memory stats
   ```

### Issue: Import Fails

**Symptoms**:
- Error when running `pixel memory import`
- "Failed to import memories" message

**Solutions**:

1. **Validate Import File**
   ```bash
   # Check if file exists and is valid JSON
   cat imported-file.json | jq
   ```

2. **Check File Format**
   ```typescript
   // Expected format:
   [
     {
       "id": "session-id",
       "startTime": 1234567890,
       "projectPath": "/path/to/project",
       "memories": [
         {
           "id": "memory-id",
           "timestamp": 1234567890,
           "type": "command",
           "content": "npm test",
           "metadata": {}
         }
       ]
     }
   ]
   ```

3. **Check Permissions**
   ```bash
   # Ensure file is readable
   ls -l imported-file.json
   ```

### Issue: Suggestions Not Relevant

**Symptoms**:
- `pixel memory suggest` returns unhelpful suggestions
- Suggestions don't match current context

**Solutions**:

1. **Ensure Files Are Tracked**
   ```bash
   # Check which files have memories
   pixel memory search "<your-file>"
   ```

2. **Record More Context**
   ```typescript
   import { recordInsight } from './utils/memoryIntegration'
   
   // Manually record important insights
   recordInsight(
     'This file handles authentication',
     ['src/auth/AuthService.ts']
   )
   ```

3. **Check Importance Threshold**
   ```typescript
   import { getMemoryStore } from './memory/MemoryStore'
   
   const store = getMemoryStore()
   store.updateConfig({
     importanceThreshold: 2,  // Lower threshold to include more memories
   })
   ```

### Issue: Session Not Starting

**Symptoms**:
- `pixel memory stats` shows no active session
- Memories not being recorded

**Solutions**:

1. **Manually Initialize**
   ```typescript
   import { initializeMemory } from './utils/memoryIntegration'
   
   await initializeMemory()
   ```

2. **Check Initialization Errors**
   ```bash
   # Run with verbose logging
   pixel --verbose
   ```

3. **Reset Memory System**
   ```bash
   # Backup and reset
   mv .pixel/memory .pixel/memory.backup
   # Restart Pixel
   ```

## Performance Issues

### Slow Startup

**Cause**: Large sessions.json file

**Solution**:
```bash
# Check file size
ls -lh .pixel/memory/sessions.json

# If > 10MB, cleanup:
pixel memory cleanup

# Or archive old sessions:
pixel memory export old-sessions.json
# Then manually edit sessions.json to remove old sessions
```

### Slow Search

**Cause**: Too many memories to search through

**Solution**:
```bash
# Use more specific queries
pixel memory search "exact phrase"

# Or filter by recent only
pixel memory list --limit 50
```

## Data Recovery

### Corrupted sessions.json

```bash
# Step 1: Backup
cp .pixel/memory/sessions.json .pixel/memory/sessions.json.backup

# Step 2: Try to repair with jq
cat .pixel/memory/sessions.json.backup | jq '.' > .pixel/memory/sessions.json

# Step 3: If that fails, extract what you can
cat .pixel/memory/sessions.json.backup | \
  grep -o '{"id":"[^"]*".*}' | \
  jq -s '.' > .pixel/memory/sessions-recovered.json

# Step 4: Import recovered data
pixel memory import sessions-recovered.json
```

### Lost Sessions

```bash
# Check for backup files
find .pixel/memory -name "*.backup" -o -name "*.json~"

# Check other projects
find ~ -name "sessions.json" -path "*/.pixel/memory/*"

# Check recent exports
find . -name "*.json" -mtime -7
```

## Debug Mode

### Enable Verbose Logging

```bash
# Run Pixel with verbose flag
pixel --verbose

# Or set environment variable
export PIXEL_DEBUG=1
pixel
```

### Check Memory System Status

```typescript
import { isMemoryActive } from './utils/memoryIntegration'
import { getMemoryStore } from './memory/MemoryStore'
import { getContextManager } from './memory/ContextManager'

// Check if memory is active
console.log('Memory Active:', isMemoryActive())

// Get detailed stats
const store = getMemoryStore()
const sessions = store.getSessions()
console.log('Total Sessions:', sessions.length)
console.log('Total Memories:', store.getMemories().length)

const manager = getContextManager()
const current = store.getCurrentSession()
console.log('Current Session:', current?.id)
```

## Getting Help

### Collect Debug Information

```bash
# Create debug report
echo "=== Memory System Debug Report ===" > debug-report.txt
echo "Date: $(date)" >> debug-report.txt
echo "" >> debug-report.txt

echo "Project Path: $(pwd)" >> debug-report.txt
echo "" >> debug-report.txt

echo "Memory Directory:" >> debug-report.txt
ls -lah .pixel/memory >> debug-report.txt
echo "" >> debug-report.txt

echo "Sessions File Size:" >> debug-report.txt
du -h .pixel/memory/sessions.json >> debug-report.txt
echo "" >> debug-report.txt

echo "Memory Stats:" >> debug-report.txt
pixel memory stats >> debug-report.txt
echo "" >> debug-report.txt

echo "Recent Logs:" >> debug-report.txt
tail -n 50 ~/.pixel/logs/pixel.log >> debug-report.txt
```

### Report an Issue

When reporting issues, include:
1. Debug report (above)
2. Steps to reproduce
3. Expected vs actual behavior
4. Pixel version (`pixel --version`)
5. Operating system
6. Node version (`node --version`)

Report at: https://github.com/yash-marathe/pixel/issues

## Best Practices to Avoid Issues

1. **Regular Cleanup**
   ```bash
   # Run cleanup monthly
   pixel memory cleanup
   ```

2. **Regular Exports**
   ```bash
   # Export weekly for important projects
   pixel memory export backup-$(date +%Y%m%d).json
   ```

3. **Monitor Size**
   ```bash
   # Check memory size occasionally
   du -h .pixel/memory
   ```

4. **Proper Shutdown**
   ```typescript
   // In your application shutdown handler
   import { shutdownMemory } from './utils/memoryIntegration'
   
   process.on('SIGINT', async () => {
     await shutdownMemory()
     process.exit(0)
   })
   ```

5. **Version Control**
   ```gitignore
   # Add to .gitignore
   .pixel/memory/
   ```
