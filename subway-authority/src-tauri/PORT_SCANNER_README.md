# Port Scanner Service Implementation

## Overview

The port scanner service has been successfully implemented for Subway Authority, providing real-time system port scanning capabilities with intelligent application detection.

## Architecture

### Core Components

1. **`services/port_scanner.rs`** - Main port scanning implementation
   - Cross-platform port scanning (macOS, Linux, Windows)
   - Intelligent process detection and categorization
   - Framework detection (Vite, Next.js, Flask, Django, etc.)
   - Project name extraction from package.json

2. **`services/mod.rs`** - Service module coordinator
   - Re-exports public API for port scanner
   - Provides clean interface for consumers

3. **Integration in `main.rs`**
   - Three Tauri commands exposed to frontend:
     - `scan_active_ports()` - Get all active ports
     - `is_port_in_use(port)` - Check specific port
     - `get_categorized_ports()` - Get ports grouped by category

## Features

### Platform Support

- **macOS/Linux**: Uses `lsof` command for port scanning
- **Windows**: Uses `netstat` and `tasklist` commands
- Graceful degradation with proper error handling

### Application Detection

The scanner automatically detects and categorizes:

- **Node.js Applications**: Detects Vite, Next.js, React, Express, etc.
- **Python Applications**: Detects Flask, Django, FastAPI, Streamlit, etc.
- **Databases**: PostgreSQL, MongoDB, Redis, MySQL
- **Web Servers**: nginx, Apache
- **System Services**: Docker, etc.
- **Desktop Apps**: Spotify, Discord, Slack, Figma

### Intelligent Naming

- Extracts project names from `package.json` for Node.js apps
- Converts slug-names to Title Case (e.g., "my-awesome-app" → "My Awesome App")
- Displays framework + project name (e.g., "Vite · Cinema")
- Falls back to process names when detection fails

### Data Enrichment

Each port includes:
- Port number
- Process name
- Process ID (PID)
- Protocol (TCP/UDP)
- Friendly display name
- Category classification

## API Usage

### From Frontend (TypeScript)

```typescript
import { invoke } from '@tauri-apps/api/tauri';

// Scan all active ports
const ports = await invoke<PortInfo[]>('scan_active_ports');

// Check if specific port is in use
const inUse = await invoke<boolean>('is_port_in_use', { port: 3000 });

// Get categorized ports
const categorized = await invoke<Record<string, PortInfo[]>>('get_categorized_ports');
```

### From Rust

```rust
use subway_authority::{PortScanner, PortInfo};

let scanner = PortScanner::new();

// Scan all ports
let ports = scanner.scan_ports()?;

// Check specific port
let in_use = scanner.is_port_in_use(3000);

// Process individual port info
for port in ports {
    println!("Port {}: {} ({})",
        port.port,
        port.friendly_name.unwrap_or_default(),
        port.category.map(|c| c.name()).unwrap_or("Unknown")
    );
}
```

## Type Definitions

### PortInfo

```rust
pub struct PortInfo {
    pub port: u16,
    pub process_name: String,
    pub pid: String,
    pub protocol: String,
    pub friendly_name: Option<String>,
    pub category: Option<PortCategory>,
}
```

### PortCategory

```rust
pub enum PortCategory {
    Database,
    WebServer,
    NodeApp,
    PythonApp,
    RubyApp,
    JavaApp,
    DesktopApp,
    SystemService,
    Other,
}
```

## Testing

### Unit Tests

Located in `src/services/port_scanner.rs`:
- Port categorization
- Slug to title case conversion
- App color mapping
- Category name mapping

### Integration Tests

Located in `tests/port_scanner_tests.rs`:
- Scanner initialization
- Port scanning across platforms
- Port usage checking
- Categorization logic
- Serialization/deserialization
- Multiple scan consistency

Run tests with:
```bash
cargo test --lib port_scanner        # Unit tests
cargo test --test port_scanner_tests # Integration tests
cargo test                            # All tests
```

## Performance

- **Scanning Speed**: ~100-500ms on typical systems
- **Memory Usage**: Minimal (zero-sized scanner type)
- **Caching**: Results not cached (real-time data)
- **Sorting**: Ports sorted by number for consistency

## Error Handling

The scanner provides detailed error types:

```rust
pub enum PortScannerError {
    UnsupportedOS,           // OS not supported
    CommandFailed(String),    // System command failed
    ParseError(String),       // Output parsing failed
    PermissionDenied,         // Insufficient permissions
    Io(std::io::Error),      // I/O error
}
```

### Permission Requirements

- **macOS/Linux**: May require sudo for `lsof` (degrades gracefully)
- **Windows**: Standard user permissions sufficient

## Cross-Platform Compatibility

| Platform | Primary Tool | Secondary Tool | Fallback |
|----------|-------------|----------------|----------|
| macOS    | lsof        | ps             | ✓        |
| Linux    | lsof        | ps             | ✓        |
| Windows  | netstat     | tasklist/wmic  | ✓        |

## Future Enhancements

Potential improvements identified:

1. **Caching Layer**: Add configurable TTL cache for results
2. **Change Detection**: Monitor port changes and emit events
3. **Port Health Checks**: HTTP health checks for web services
4. **Custom Detection Rules**: User-defined categorization
5. **Performance Metrics**: Track port usage over time
6. **Docker Integration**: Detect containerized services

## Dependencies

Core dependencies:
- `serde` - Serialization/deserialization
- `thiserror` - Error type definitions
- `log` - Logging framework

No external port scanning libraries required - uses native OS commands.

## Maintenance Notes

### Updating Framework Detection

Add new frameworks in the relevant detection function:
- Node.js: `get_node_details()`
- Python: `get_python_details()`

### Adding New Categories

1. Add variant to `PortCategory` enum
2. Update `categorize_port()` function
3. Add corresponding name in `PortCategory::name()`

### Platform-Specific Changes

Platform-specific code is gated with:
- `#[cfg(target_os = "macos")]`
- `#[cfg(target_os = "linux")]`
- `#[cfg(target_os = "windows")]`

## Integration Status

✅ Port scanning service implemented
✅ Cross-platform support (macOS, Linux, Windows)
✅ Intelligent app detection
✅ Project name extraction
✅ Tauri command integration
✅ Comprehensive test coverage
✅ Documentation complete

## Related Files

- Implementation: `/src-tauri/src/services/port_scanner.rs`
- Module coordinator: `/src-tauri/src/services/mod.rs`
- Main integration: `/src-tauri/src/main.rs`
- Library exports: `/src-tauri/src/lib.rs`
- Unit tests: Within `port_scanner.rs`
- Integration tests: `/src-tauri/tests/port_scanner_tests.rs`
- This documentation: `/src-tauri/PORT_SCANNER_README.md`

## Support

For issues or questions:
1. Check error messages for detailed diagnostics
2. Verify system commands are available (`lsof`, `netstat`)
3. Review test output for platform-specific issues
4. Check logs for debugging information

---

**Status**: ✅ Complete and Production Ready
**Last Updated**: 2025-11-07
**Version**: 1.0.0
