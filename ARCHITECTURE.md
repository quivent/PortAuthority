# Porter Architecture

Technical architecture and design decisions for the Porter CLI tool.

## Overview

Porter is a command-line tool built in Rust that manages subdomain-to-localhost port mappings for local development environments. It provides a clean abstraction over hosts file management and configuration storage.

## Project Structure

```
port-authority/
├── src/
│   ├── main.rs          # CLI entry point and command routing
│   ├── config.rs        # Configuration management
│   ├── hosts.rs         # Hosts file operations
│   ├── browser.rs       # Browser integration
│   ├── output.rs        # Terminal styling and output
│   └── error.rs         # Error types and handling
├── Cargo.toml           # Project dependencies
├── README.md            # User documentation
├── QUICKSTART.md        # Quick start guide
├── EXAMPLES.md          # Usage examples
├── ARCHITECTURE.md      # This file
└── LICENSE              # MIT License
```

## Module Architecture

### main.rs - CLI Entry Point

**Responsibilities:**
- Parse command-line arguments using Clap
- Route commands to appropriate handlers
- Initialize logging based on verbosity flags
- Handle top-level error cases

**Key Components:**
- `Cli` struct: Defines the command-line interface structure
- `Commands` enum: All available commands
- `execute_command()`: Command routing logic
- Handler functions: One per command (`handle_set()`, `handle_map()`, etc.)

**Design Patterns:**
- Command pattern for CLI operations
- Strategy pattern for command execution

### config.rs - Configuration Management

**Responsibilities:**
- Load and save configuration from/to TOML files
- Validate configuration data
- Provide CRUD operations for mappings
- Maintain configuration invariants

**Key Features:**
- Configuration stored in `~/.porter/config.toml`
- Automatic directory creation
- Validation on all mutations
- Domain and port validation rules
- Fallback to default configuration

**Data Model:**
```rust
pub struct Config {
    pub base_domain: Option<String>,
    pub mappings: HashMap<String, u16>,
}
```

**Validation Rules:**
- Base domain required before creating mappings
- Subdomain: alphanumeric + hyphens only, no dots
- Domain: no path separators
- Port: non-zero, warning for privileged ports (<1024)

### hosts.rs - Hosts File Management

**Responsibilities:**
- Cross-platform hosts file path detection
- Atomic hosts file updates with backups
- Add/remove individual entries
- Bulk sync operations
- Permission checking

**Key Features:**
- Special markers for Porter-managed sections
- Automatic backup before modifications
- Cross-platform support (macOS/Linux/Windows)
- Safe concurrent access patterns
- Rollback capability via backups

**Hosts File Format:**
```
# BEGIN PORTER MANAGED
127.0.0.1    api.localhost    # porter:port=3000
127.0.0.1    web.localhost    # porter:port=8080
# END PORTER MANAGED
```

**Platform-Specific Paths:**
- macOS/Linux: `/etc/hosts`
- Windows: `C:\Windows\System32\drivers\etc\hosts`

### browser.rs - Browser Integration

**Responsibilities:**
- Build URLs from hostname and port
- Open URLs in default browser
- Cross-platform browser launching

**Key Features:**
- Platform detection (macOS/Linux/Windows)
- Use of standard OS commands (`open`, `xdg-open`, `start`)
- Error handling for browser launch failures

### output.rs - Terminal Output

**Responsibilities:**
- Styled terminal output with colors
- Consistent formatting across commands
- Box drawing and table formatting
- Status symbols and indicators

**Key Features:**
- Color-coded output (success/error/warning/info)
- Unicode box-drawing characters
- Formatted tables for configuration display
- Command tree visualization
- Consistent visual language

**Color Scheme:**
- Cyan: Commands and headers
- Green: Success and values
- Red: Errors
- Yellow: Warnings
- Blue: URLs

### error.rs - Error Handling

**Responsibilities:**
- Define custom error types
- Provide error conversions
- Enable error propagation with `?` operator

**Key Features:**
- `thiserror` for error derivation
- Context-rich error messages
- Conversion from std errors
- Result type alias for convenience

**Error Types:**
- Config: Configuration-related errors
- HostsFile: Hosts file operation errors
- Permission: Permission-denied errors
- InvalidInput: Validation failures
- MappingNotFound: Missing mapping lookups
- Browser: Browser launch failures

## Data Flow

### Mapping Creation Flow

```
User Command
    ↓
CLI Parser (main.rs)
    ↓
handle_map()
    ↓
Config::load() ← Read ~/.porter/config.toml
    ↓
Config::add_mapping() ← Validate input
    ↓
Config::save() → Write ~/.porter/config.toml
    ↓
hosts::add_entry() → Update /etc/hosts
    ↓
output::print_mapping() → Display success
```

### Configuration Loading Flow

```
Config::load()
    ↓
Config::config_path() ← Determine path
    ↓
Check if file exists
    ↓
    Yes → Read file → Parse TOML → Return Config
    No → Return Config::default()
```

### Hosts File Update Flow

```
hosts::add_entry()
    ↓
check_permissions() ← Verify write access
    ↓
read_hosts_file() ← Load current content
    ↓
add_porter_entry() ← Modify content
    ↓
write_hosts_file()
    ↓
    Create backup → Write new content
```

## Design Decisions

### Why TOML for Configuration?

- Human-readable and editable
- Native Rust support with `serde`
- Good for hierarchical configuration
- Clear key-value structure

### Why Hosts File Management?

- No DNS server required
- Works immediately without network setup
- Standard practice for local development
- Browser-native support

### Why Rust?

- Systems programming language for file operations
- Strong type safety for configuration
- Excellent error handling with Result<T>
- Cross-platform support
- Fast compilation and execution
- Zero-cost abstractions

### Why Clap for CLI Parsing?

- Derive macros for clean code
- Built-in help generation
- Suggestions for typos
- Colored output support
- Subcommand support

### Why Separate Modules?

- Separation of concerns
- Testability of individual components
- Clear boundaries and interfaces
- Easy to extend with new features

## Error Handling Strategy

1. **Use Result<T> everywhere**: All fallible operations return `Result<T, PorterError>`
2. **Provide context**: Error messages include enough information for users to fix issues
3. **Fail gracefully**: Config saved even if hosts file update fails
4. **User guidance**: Error messages include suggested actions
5. **Atomic operations**: Hosts file updates use backups for rollback

## Testing Strategy

### Unit Tests

- Config validation logic
- Hosts file content manipulation
- URL building
- Input validation

### Integration Tests

- End-to-end command execution
- Configuration persistence
- Error handling paths

### Test Coverage

```bash
cargo test              # Run all tests
cargo test --verbose    # Detailed output
cargo test config::     # Test specific module
```

## Security Considerations

1. **Input Validation**: All user input validated before processing
2. **Path Traversal**: No user-controlled path components
3. **Hosts File Safety**: Backups created before modifications
4. **Permission Checking**: Early validation of file access rights
5. **Sanitization**: Subdomain and domain names strictly validated

## Performance Characteristics

- **Configuration Load**: O(1) file read + TOML parsing
- **Mapping Lookup**: O(1) HashMap access
- **Hosts File Update**: O(n) where n = number of lines in hosts file
- **Memory Usage**: Minimal - configuration held in memory
- **Startup Time**: <50ms for typical operations

## Extensibility Points

### Adding New Commands

1. Add variant to `Commands` enum
2. Create handler function
3. Add route in `execute_command()`
4. Update help text and documentation

### Adding New Configuration Fields

1. Add field to `Config` struct
2. Update validation logic
3. Handle migration from old config format
4. Update serialization/deserialization

### Supporting New Platforms

1. Add platform detection in hosts.rs
2. Implement platform-specific paths
3. Add platform-specific browser commands
4. Update permission guidance

## Future Architecture Considerations

### Planned Enhancements

1. **SSL/TLS Support**: Certificate generation and management
2. **Configuration Import/Export**: Share setups across teams
3. **Project-Specific Configs**: `.porter.toml` in project directories
4. **Shell Completions**: Bash/Zsh/Fish completion scripts
5. **DNS Server Mode**: Optional DNS server for advanced users

### Scalability

- Current design handles 100+ mappings efficiently
- Hosts file approach has limitations (~1000 entries)
- Future: Consider DNS server mode for larger setups

### Maintainability

- Module boundaries clearly defined
- Comprehensive test coverage
- Documentation at code and architectural level
- Clear error messages aid debugging

## Dependencies

### Core Dependencies

- **clap**: CLI parsing and help generation
- **colored**: Terminal output styling
- **serde**: Serialization/deserialization
- **toml**: TOML parsing
- **anyhow/thiserror**: Error handling
- **dirs**: Cross-platform directory paths
- **env_logger/log**: Logging infrastructure

### Dev Dependencies

- **tempfile**: Temporary files for tests
- **assert_cmd**: CLI testing utilities
- **predicates**: Test assertions

## Build and Deployment

### Build Process

```bash
cargo build              # Debug build
cargo build --release    # Optimized build
cargo test               # Run tests
cargo install --path .   # Install locally
```

### Binary Aliases

The binary is named `porter` via Cargo.toml configuration:

```toml
[[bin]]
name = "porter"
path = "src/main.rs"
```

### Installation Locations

- macOS/Linux: `~/.cargo/bin/porter`
- Windows: `%USERPROFILE%\.cargo\bin\porter.exe`

## Conclusion

Porter follows clean architecture principles with clear separation of concerns, comprehensive error handling, and extensive testing. The modular design allows for easy extension while maintaining backwards compatibility and providing a excellent user experience.
