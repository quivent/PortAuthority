# Changelog

## [2.0.0] - Complete CLI Makeover

### 🎨 Design Enhancements

#### Visual Design System
- **Color-grouped commands** with category-based color theming
  - 🔵 Blue for Core commands (allocate, release, check)
  - 🟢 Green for Management commands (list, metrics, health)
  - 🟡 Yellow for Utility commands (tree, docs, stats, scan, watch, export)
  - 🔴 Red for Administration commands (enforce)
- **Beautiful banner** with gradient effects on help screen
- **Professional tables** using cli-table3 with proper borders and alignment
- **Boxed output** for important messages and results
- **Loading spinners** with ora for long-running operations
- **Icons and emojis** for better visual feedback
- **Status indicators** (✅, ❌, ⚠️, ℹ️, φ)

### 🆕 New Commands

#### `tree` - Command Hierarchy Visualization
```bash
portauth tree
```
- Beautiful tree structure showing all commands
- Color-coded by category
- Shows all options for each command
- Visual hierarchy with Unicode box-drawing characters

#### `docs` - Documentation Viewer
```bash
portauth docs              # Terminal rendering
portauth docs --glow       # Glow rendering
portauth docs --web        # Open in browser
```
- Built-in documentation viewer
- Multiple rendering modes
- Reads from /docs directory
- HTML export for web browsers
- Markdown rendering in terminal

#### `stats` - Detailed Statistics
```bash
portauth stats
portauth stats --project myapp
```
- Overview metrics
- Project breakdown with percentages
- Port distribution by range
- Visual bar charts
- Recent activity listing
- φ-optimization statistics

#### `scan` - Port Conflict Scanner
```bash
portauth scan
portauth scan --range 3000-9999
portauth scan --project myapp
```
- Scans system for active ports
- Identifies unauthorized ports
- Shows conflicts
- Lists authorized but unused ports
- Integration with netstat/ss

#### `watch` - Real-time Monitoring
```bash
portauth watch
portauth watch --interval 5
portauth watch --project myapp
```
- Live updates of allocations
- Auto-refresh with configurable interval
- Change indicators for new/removed allocations
- Full-screen display with timestamps
- Ctrl+C to stop

#### `export` - Data Export
```bash
portauth export
portauth export --format csv --output file.csv
portauth export --format yaml
portauth export --project myapp
```
- Export to JSON, CSV, or YAML
- Custom output file paths
- Project filtering
- Formatted output

### ✨ Enhanced Existing Commands

#### `allocate`
- Beautiful boxed success message
- Clear usage examples
- Color-coded output
- φ-optimization indicator

#### `release`
- Simple, clean confirmation
- Color-coded service name

#### `check`
- Boxed result display
- Shows allocation details if in use
- Green for available, red for in use

#### `list`
- Professional table layout
- φ indicators
- Summary statistics
- Percentage calculations

#### `metrics`
- Enhanced table display
- Project breakdown with visual bars
- Efficiency scoring
- Color-coded efficiency levels

#### `health`
- Boxed status display
- Formatted uptime (days, hours, minutes)
- Clear status indicators

#### `enforce`
- Loading spinner during execution
- Boxed results
- Detailed violation listing

### 🏗️ Architecture Improvements

#### Modular Structure
```
src/
  commands/      # Individual command files
  utils/         # Shared utilities
    colors.js    # Color themes and formatting
    api.js       # API client wrapper
    table.js     # Table creation utilities
    tree.js      # Command tree structure
```

#### Utility Modules
- **colors.js** - Centralized color schemes, themes, and formatting functions
- **api.js** - Clean API client with error handling
- **table.js** - Table creation and formatting utilities
- **tree.js** - Command tree data structure and rendering

### 📦 Dependencies Added

- `cli-table3` - Professional table rendering
- `boxen` - Beautiful boxes for important messages
- `gradient-string` - Gradient text effects
- `ora` - Elegant terminal spinners
- `inquirer` - Interactive prompts (future use)
- `marked` - Markdown parsing
- `marked-terminal` - Terminal markdown rendering
- `open` - Cross-platform file/URL opening
- `chokidar` - File watching capabilities

### 🎯 User Experience Improvements

1. **Consistent Design Language** - All commands follow same visual patterns
2. **Clear Information Hierarchy** - Important info stands out
3. **Helpful Guidance** - Tips and suggestions throughout
4. **Error Messages** - Clear, actionable error messages
5. **Loading Feedback** - Spinners for long operations
6. **Professional Output** - Tables, boxes, proper alignment
7. **Color Coding** - Visual categorization and status
8. **Documentation** - Built-in docs and tree view

### 🔧 Technical Details

- Maintained backward compatibility with API
- Error handling in all commands
- Graceful fallbacks (e.g., if glow not installed)
- Cross-platform support
- Clean separation of concerns
- Reusable utility functions
- Consistent color theming

### 📝 Breaking Changes

None - all existing commands work the same way, just with enhanced output.

### 🚀 Migration

The old CLI has been backed up to `portauth-old.js`. The new CLI is a drop-in replacement with the same command syntax.

### 🎉 Summary

This is a complete transformation of the Port Authority CLI:
- **Before**: 200 lines, 7 commands, basic output
- **After**: 2000+ lines, 13 commands, beautiful design, modular architecture

The CLI now provides:
- Professional-grade visual design
- Comprehensive command set
- Built-in documentation
- Real-time monitoring
- Detailed analytics
- Data export capabilities
- Tree visualization
- Excellent user experience

---

## [1.0.0] - Initial Release

- Basic port allocation commands
- Simple terminal output
- 7 core commands
