# Port Authority CLI v2.0 🚀

> Beautiful, enhanced CLI for centralized port management with φ-optimization

## ✨ What's New in v2.0

### 🎨 Beautiful Design
- **Color-grouped commands** - Commands organized by category with color coding
- **Enhanced visual output** - Tables, boxes, gradients, and icons
- **Tree visualization** - See all commands in a beautiful tree structure
- **Improved UX** - Better formatting, clearer information, more intuitive

### 📋 Command Categories

#### 🔵 Core Commands
- `allocate` - Allocate a port for a service
- `release` - Release a port allocation
- `check` - Check if a port is available

#### 🟢 Management Commands
- `list` - List all port allocations (with beautiful tables)
- `metrics` - Show comprehensive metrics and statistics
- `health` - Check Port Authority service health

#### 🟡 Utility Commands
- `tree` - Show command hierarchy in tree format ⭐ **NEW**
- `docs` - View documentation (terminal/glow/web) ⭐ **NEW**
- `stats` - Show detailed statistics and analytics ⭐ **NEW**
- `scan` - Scan for port conflicts ⭐ **NEW**
- `watch` - Real-time monitoring of allocations ⭐ **NEW**
- `export` - Export allocations (JSON/CSV/YAML) ⭐ **NEW**

#### 🔴 Administration
- `enforce` - Kill unauthorized processes on allocated ports

## 🚀 Quick Start

### View Command Tree
```bash
portauth tree
```

### View Documentation
```bash
# Terminal rendering
portauth docs

# With glow (beautiful markdown rendering)
portauth docs --glow

# Open in web browser
portauth docs --web
```

### Allocate a Port
```bash
# Simple allocation
portauth allocate my-service

# With preferences
portauth allocate my-service --preferred 8080 --priority 3 --project myapp
```

### List Allocations
```bash
# List all
portauth list

# Filter by project
portauth list --project myapp
```

### Real-time Monitoring
```bash
# Watch allocations (updates every 5 seconds)
portauth watch

# Custom interval
portauth watch --interval 2

# Watch specific project
portauth watch --project myapp
```

### Scan for Conflicts
```bash
# Scan default range (3000-9999)
portauth scan

# Custom range
portauth scan --range 8000-9000

# Scan specific project
portauth scan --project myapp
```

### Export Data
```bash
# Export to JSON (default)
portauth export

# Export to CSV
portauth export --format csv --output allocations.csv

# Export to YAML
portauth export --format yaml --output allocations.yaml

# Export specific project
portauth export --project myapp --format json
```

### View Statistics
```bash
# Show detailed stats
portauth stats

# Stats for specific project
portauth stats --project myapp
```

### Check Health
```bash
portauth health
```

### View Metrics
```bash
portauth metrics
```

### Enforce Authority
```bash
# Kill unauthorized processes
portauth enforce
```

## 📊 Features

### Enhanced Visual Design
- 🎨 Color-coded command categories
- 📦 Beautiful boxed output
- 📋 Professional tables with proper alignment
- 🌈 Gradient headers and decorative elements
- ⚡ Loading spinners for long operations
- φ Golden ratio optimization indicators

### Documentation System
- 📖 Built-in documentation viewer
- 🌐 Web browser export with HTML rendering
- ✨ Glow integration for beautiful markdown
- 📝 Comprehensive usage guides

### Monitoring & Analysis
- 👀 Real-time watching with auto-refresh
- 🔍 Port conflict scanning
- 📊 Detailed statistics and analytics
- 📈 Project-based breakdowns
- 📉 Port distribution analysis

### Data Export
- 💾 Multiple format support (JSON, CSV, YAML)
- 📁 Custom output paths
- 🎯 Project filtering
- 📋 Formatted output

### Command Organization
- 🌳 Tree visualization of all commands
- 🎯 Category-based grouping
- 📱 Intuitive command structure
- 💡 Helpful inline tips

## 🏗️ Architecture

The CLI has been completely restructured for better maintainability:

```
cli/
├── portauth.js          # Main entry point
├── src/
│   ├── commands/        # Individual command implementations
│   │   ├── allocate.js
│   │   ├── release.js
│   │   ├── check.js
│   │   ├── list.js
│   │   ├── metrics.js
│   │   ├── health.js
│   │   ├── tree.js      # NEW: Command tree
│   │   ├── docs.js      # NEW: Documentation
│   │   ├── stats.js     # NEW: Statistics
│   │   ├── scan.js      # NEW: Port scanning
│   │   ├── watch.js     # NEW: Real-time watching
│   │   ├── export.js    # NEW: Data export
│   │   └── enforce.js
│   └── utils/           # Shared utilities
│       ├── colors.js    # Color schemes and themes
│       ├── api.js       # API client
│       ├── table.js     # Table formatting
│       └── tree.js      # Tree visualization
└── package.json
```

## 🎨 Color Scheme

Each command category has its own color theme:

- **🔵 Core** (Blue) - Primary port operations
- **🟢 Management** (Green) - Viewing and monitoring
- **🟡 Utility** (Yellow) - Helper tools
- **🔴 Administration** (Red) - Enforcement actions

## 🔧 Requirements

- Node.js 14+
- Port Authority service running
- Optional: `glow` for enhanced documentation rendering

## 📦 Installation

```bash
npm install
```

## 🌟 Examples

### Example 1: Complete Workflow
```bash
# Check service health
portauth health

# View command tree
portauth tree

# Allocate a port
portauth allocate api-service --preferred 8080 --project myapp

# List allocations
portauth list

# Watch in real-time
portauth watch --project myapp

# Export data
portauth export --format csv --output myapp-ports.csv
```

### Example 2: Port Management
```bash
# Check if port is available
portauth check 8080

# Allocate it
portauth allocate my-service --preferred 8080

# View metrics
portauth metrics

# Scan for conflicts
portauth scan

# Enforce authority
portauth enforce
```

### Example 3: Documentation
```bash
# View docs in terminal
portauth docs

# View with glow
portauth docs --glow

# Open in browser
portauth docs --web

# View command tree
portauth tree
```

## 🎯 Tips

1. **Use `tree` first** - Get familiar with all available commands
2. **Watch mode** - Monitor allocations during development
3. **Scan regularly** - Find unauthorized port usage
4. **Export data** - Create backups or share allocations
5. **View docs** - Comprehensive guides built-in

## 📝 License

MIT

## 🤝 Contributing

The CLI is structured for easy extension:
- Add new commands in `src/commands/`
- Update command tree in `src/utils/tree.js`
- Follow existing color themes

---

Made with ❤️ by the Port Authority team
