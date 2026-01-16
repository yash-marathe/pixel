# Pixel - Your Coding Companion

A Multi Agent AI that helps with coding like debugging, suggesting optimizations, or even editing multiple files based on requirements. 

## 🌟 New Features

### Contextual Memory & Persistence

Pixel now features an intelligent memory system that maintains context across sessions:

- **💾 Session Continuity**: Maintains context across terminal sessions
- **💡 Context-Aware Suggestions**: Get intelligent suggestions based on your work patterns
- **📊 Memory Management**: Automatic cleanup and optimization of stored information
- **🔍 Smart Search**: Search through your project history and insights
- **📦 Import/Export**: Backup and share project memories

[Learn more about the Memory System →](docs/MEMORY_SYSTEM.md)

## Getting Started

### For Development:
```bash
git clone https://github.com/yash-marathe/Pixel
npm install
npm run dev
```

### For Production:
```bash
git clone https://github.com/yash-marathe/Pixel
npm install
npm run build
```

### Usage

Navigate to your project directory and run:
```bash
pixel
```

## Key Features

### 🤖 Multi-Agent AI
- Intelligent code analysis and suggestions
- Multi-file editing capabilities
- Context-aware debugging assistance

### 📝 Project Management
- Automatic project initialization with `/init`
- Project documentation in `Pixel.md`
- Comprehensive codebase understanding

### 💾 Contextual Memory (NEW)
- Persistent session storage
- Project-specific memory
- Intelligent context retrieval
- Automated insight capture

### 🛠️ Developer Tools
- Code refactoring suggestions
- Test generation and validation
- Error handling improvements
- Performance optimization tips

## Memory Commands

```bash
# View memory statistics
pixel memory stats

# Search through memories
pixel memory search "<query>"

# Get context-aware suggestions
pixel memory suggest

# View current session summary
pixel memory summary

# List recent memories
pixel memory list

# Export memories for backup
pixel memory export backup.json

# Import memories
pixel memory import backup.json

# Cleanup old memories
pixel memory cleanup
```

## Best Practices

### Project Initialization
When starting a new project, always use the `/init` command. This creates a "Pixel.md" document containing your project documentation for easy reference.

### Working Effectively
After initializing your project, ask Pixel to explain the project thoroughly. Request details about each component, their functionalities, and how they interconnect.

### Planning Changes
For major changes (refactoring, complex features), instruct Pixel to outline a plan before implementing. Use phrases like:
- Think hard
- Think deep  
- Think longer

### Making Changes
For smaller changes, clearly specify the exact file:
```
Pixel, can you increase the size of the chat input in the file "user/page.tsx"?
```

### Regular Maintenance
- Regularly use the `/compact` command during development
- Run tests frequently to validate functionality
- Periodically ask Pixel to review the entire project
- Clean up memory with `pixel memory cleanup`

## Documentation

- [User Guide](GUIDE.md) - Complete usage guide
- [Memory System](docs/MEMORY_SYSTEM.md) - Memory features documentation
- [Examples](docs/EXAMPLES.md) - Code examples and patterns

## Architecture

Pixel is built with:
- **TypeScript** for type safety
- **React** + **Ink** for CLI UI
- **Claude API** for AI capabilities
- **MCP (Model Context Protocol)** for extensibility
- **Local Storage** for memory persistence

## Privacy & Security

- All memory data is stored locally in `.pixel/memory/`
- No data is sent to external servers (except AI API calls)
- You have full control over memory retention and deletion
- Sessions are project-specific

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See the [LICENSE](LICENSE) file for details.

## Author

Yash Marathe

## Repository

https://github.com/yash-marathe/Pixel

## Issues

Report issues at: https://github.com/yash-marathe/Pixel/issues
