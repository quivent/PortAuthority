# Port Authority CLI - Architecture Overview

## 🏗️ System Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     Port Authority CLI v2.0                     │
│                         (portauth.js)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   Commands   │      │   Utilities  │     │     API      │
│  (13 total)  │      │  (4 modules) │     │   Client     │
└──────────────┘      └──────────────┘     └──────────────┘
```

### Module Dependency Graph

```
portauth.js (Main Entry)
    │
    ├─→ commands/
    │       ├─→ allocate.js ──→ api.js, colors.js
    │       ├─→ release.js ───→ api.js, colors.js
    │       ├─→ check.js ─────→ api.js, colors.js
    │       ├─→ list.js ──────→ api.js, table.js, colors.js
    │       ├─→ metrics.js ───→ api.js, table.js, colors.js
    │       ├─→ health.js ────→ api.js, colors.js
    │       ├─→ tree.js ──────→ tree.js (util)
    │       ├─→ docs.js ──────→ colors.js
    │       ├─→ stats.js ─────→ api.js, table.js, colors.js
    │       ├─→ scan.js ──────→ api.js, table.js, colors.js
    │       ├─→ watch.js ─────→ api.js, table.js, colors.js
    │       ├─→ export.js ────→ api.js, colors.js
    │       └─→ enforce.js ───→ api.js, colors.js
    │
    └─→ utils/
            ├─→ colors.js    (Color themes & formatting)
            ├─→ api.js       (API client wrapper)
            ├─→ table.js     (Table creation)
            └─→ tree.js      (Command tree structure)
```

## 📦 Module Descriptions

### Main Entry Point

**`portauth.js`**
- Command-line interface setup with Commander.js
- Command registration and routing
- Custom help text with banner
- Version management
- Color-coded command descriptions

### Command Modules

#### 🔵 Core Commands

**`allocate.js`**
- Port allocation logic
- Beautiful boxed success messages
- Usage examples
- Options: preferred port, priority, project

**`release.js`**
- Port release logic
- Simple confirmation messages

**`check.js`**
- Port availability checking
- Shows allocation details if in use
- Boxed result display

#### 🟢 Management Commands

**`list.js`**
- Lists all allocations in table format
- Project filtering
- Summary statistics
- φ-optimization percentage

**`metrics.js`**
- Comprehensive metrics display
- Project breakdown with visual bars
- Efficiency scoring
- Multiple tables

**`health.js`**
- Service health checking
- Formatted uptime display
- Boxed status message

#### 🟡 Utility Commands

**`tree.js`**
- Command hierarchy visualization
- Delegates to tree utility

**`docs.js`**
- Documentation viewer
- Terminal/glow/web rendering
- Markdown processing
- HTML generation

**`stats.js`**
- Detailed statistics
- Port distribution
- Recent activity
- Multiple tables and charts

**`scan.js`**
- Port conflict scanning
- System integration (netstat/ss)
- Unauthorized port detection
- Loading spinner

**`watch.js`**
- Real-time monitoring
- Auto-refresh
- Change detection
- Full-screen display

**`export.js`**
- Data export functionality
- Multiple formats (JSON/CSV/YAML)
- Custom output paths

#### 🔴 Administration

**`enforce.js`**
- Enforcement of port authority
- Process termination
- Violation reporting
- Loading spinner

### Utility Modules

**`colors.js`**
- Color scheme definitions
- Theme management (core, management, utility, admin)
- Status indicators
- Gradient configurations
- Formatting utilities
  - `createTitle()`
  - `createHeader()`
  - `createSeparator()`
  - `formatKeyValue()`

**`api.js`**
- Centralized API client
- Axios wrapper
- Error handling
- Base URL configuration
- Methods:
  - `allocate()`
  - `release()`
  - `getAllocations()`
  - `checkPort()`
  - `enforce()`
  - `getMetrics()`
  - `getHealth()`

**`table.js`**
- Table creation utilities
- Theme-based styling
- Multiple table types:
  - `createAllocationTable()`
  - `createMetricsTable()`
  - `createStatsTable()`
  - `createKeyValueTable()`
- Row formatting:
  - `formatAllocationRow()`

**`tree.js`**
- Command tree data structure
- Tree rendering logic
- Category definitions
- Command metadata
- Methods:
  - `renderTree()`
  - `getCommandsByCategory()`
  - `getAllCommandNames()`

## 🎨 Design Patterns

### Separation of Concerns
```
┌─────────────────┐
│  Presentation   │  (Commands - User interface)
├─────────────────┤
│   Business      │  (Utils - Logic & formatting)
├─────────────────┤
│     Data        │  (API - External communication)
└─────────────────┘
```

### Color Theme System
```
Theme Structure:
{
  core: {
    primary: Function,
    secondary: Function,
    accent: Function,
    dim: Function
  },
  management: { ... },
  utility: { ... },
  admin: { ... }
}
```

### Command Structure Pattern
```javascript
async function commandName(args, options) {
  try {
    // 1. Fetch data via API
    const data = await api.method(args, options);

    // 2. Process and format
    const formatted = formatData(data);

    // 3. Display with theme
    console.log(createOutput(formatted, theme));
  } catch (error) {
    // Error handled by API client
  }
}
```

## 🔄 Data Flow

### Typical Command Execution

```
User Input
    │
    ▼
portauth.js (Parse & Route)
    │
    ▼
Command Module
    │
    ├─→ Validate Input
    │
    ├─→ Call API (api.js)
    │       │
    │       ├─→ HTTP Request
    │       │
    │       └─→ Error Handling
    │
    ├─→ Format Data (table.js / colors.js)
    │
    └─→ Display Output
            │
            ▼
        Terminal
```

### Real-time Monitoring Flow (Watch Command)

```
User starts watch
    │
    ▼
Initialize display
    │
    ▼
Start interval timer
    │
    ├─→ Fetch allocations (API)
    │
    ├─→ Compare with previous
    │
    ├─→ Detect changes
    │
    ├─→ Clear screen
    │
    ├─→ Render table
    │
    └─→ Wait for interval
        │
        └─→ (repeat)
```

## 📊 Scalability Considerations

### Modular Design Benefits
- ✅ Easy to add new commands
- ✅ Reusable utilities
- ✅ Consistent theming
- ✅ Centralized API client
- ✅ Independent testing

### Extension Points
1. **New Commands**: Add to `src/commands/`
2. **New Themes**: Add to `colors.js`
3. **New Table Types**: Add to `table.js`
4. **New API Methods**: Add to `api.js`

## 🔌 Integration Points

### External Services
- Port Authority API (HTTP)
- System commands (netstat/ss)
- Glow (optional)
- Web browser (for docs)

### File System
- Configuration: `PORT_AUTHORITY_URL` env var
- Documentation: `../../docs/` directory
- Export files: Current working directory

## 🎯 Quality Attributes

### Maintainability
- Clear module boundaries
- Consistent patterns
- Comprehensive comments
- Logical organization

### Usability
- Color-coded categories
- Helpful error messages
- Loading indicators
- Built-in documentation

### Reliability
- Error handling throughout
- Graceful fallbacks
- Input validation
- API timeout management

### Performance
- Efficient table rendering
- Cached color functions
- Minimal dependencies
- Fast startup time

## 📈 Metrics

### Code Organization
- **13** command modules
- **4** utility modules
- **1** main entry point
- **~2000** total lines of code
- **100%** modular architecture

### Reusability
- **4** shared utility modules
- **1** centralized API client
- **4** theme definitions
- **4** table creators

## 🚀 Future Extensibility

### Easy to Add
- ✅ New commands
- ✅ New color themes
- ✅ New table formats
- ✅ New export formats
- ✅ New API endpoints

### Architecture Supports
- ✅ Plugin system
- ✅ Custom themes
- ✅ Command aliases
- ✅ Configuration files
- ✅ Internationalization

---

**Architecture designed for beauty, maintainability, and extensibility** 🏗️✨
