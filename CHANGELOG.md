# Changelog

All notable changes to Pixel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Contextual Memory System** - Comprehensive memory and persistence layer
  - Session continuity across terminal sessions
  - Project-specific memory storage
  - Context-aware suggestions engine
  - Memory search and filtering capabilities
  - Export/import functionality for backup
  - Automatic cleanup and optimization
  - Five memory types: commands, files, context, conversations, insights
  - Configurable retention policies
  - CLI commands for memory management
  - React hooks for UI integration
  - Comprehensive test suite
  - Full documentation with examples

- **New CLI Commands**:
  - `pixel memory stats` - View memory statistics
  - `pixel memory search <query>` - Search through memories
  - `pixel memory suggest` - Get context-aware suggestions
  - `pixel memory summary` - View current session summary
  - `pixel memory list` - List recent memories
  - `pixel memory export <file>` - Export memories
  - `pixel memory import <file>` - Import memories
  - `pixel memory cleanup` - Clean up old memories

- **New Documentation**:
  - `docs/MEMORY_SYSTEM.md` - Complete memory system guide
  - `docs/EXAMPLES.md` - Code examples and patterns
  - Architecture diagrams and flow charts

### Changed
- Updated README with memory system features
- Enhanced project structure with memory module

### Technical Details
- **Storage**: Local filesystem (`.pixel/memory/sessions.json`)
- **Default Retention**: 1000 memories, 30 days session age
- **Memory Types**: Command, File, Context, Conversation, Insight
- **Importance Scale**: 1-5 (used for relevance ranking)

### Migration Notes
- No breaking changes to existing functionality
- Memory system auto-initializes on first use
- Existing projects will automatically get `.pixel/memory/` directory
- No action required from users

## [0.0.1] - Previous Version

### Added
- Initial release with core AI agent functionality
- Multi-file editing capabilities
- Project initialization with `/init` command
- Context-aware code suggestions
- MCP (Model Context Protocol) integration
