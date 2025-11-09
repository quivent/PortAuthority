# Porter (Port Authority)

A CLI tool for managing subdomain-to-localhost port mappings. Simplify local development by mapping custom subdomains to your local services.

## Features

### Core Features
- Map subdomains to local ports (e.g., `api.localhost:3000`)
- Automatic `/etc/hosts` file management
- Cross-platform support (macOS, Linux, Windows)
- Beautiful terminal output with colors
- Browser integration for quick access
- Persistent configuration storage
- Safe hosts file updates with automatic backups

### Daemon Process Management (New!)
- Background daemon for managing multiple app processes
- Automatic process restart on failure
- Health monitoring with TCP/HTTP checks
- Process log management and viewing
- Graceful shutdown handling
- Configurable restart limits and intervals

## Installation

### From Source

```bash
cargo install --path .
```

### Quick Start

**First time using Porter? Run the interactive setup wizard:**

```bash
porter init
```

The wizard will guide you through:
1. ✓ Setting up your base domain (e.g., `localhost`)
2. ✓ Creating your first subdomain mapping (e.g., `api` → port `3000`)
3. ✓ Updating your system's hosts file

**Or use commands directly:**

```bash
# Set your base domain (usually "localhost")
porter set base localhost

# Map a subdomain to a port
porter map api 3000

# Access your service
porter open api
# Opens http://api.localhost:3000 in your browser

# List all mappings
porter list

# Remove a mapping
porter unmap api
```

## Usage

### Setting Base Domain

```bash
porter set base localhost
```

This sets the base domain for all your subdomain mappings.

### Mapping Subdomains

Map a subdomain to a local port:

```bash
porter map <subdomain> <port>
```

Example:
```bash
porter map api 3000
porter map web 8080
porter map admin 4000
```

You can also use `route` as an alias:
```bash
porter route api 3000
```

### Listing Mappings

```bash
porter list
```

Shows all configured mappings with formatted output.

### Opening in Browser

```bash
porter open <subdomain>
```

Opens the mapped subdomain URL in your default browser.

## Daemon Process Management

Port Authority includes a powerful daemon system for managing background processes with automatic restart, health monitoring, and log management.

### Managing the Daemon

Start the daemon (runs in background):
```bash
port daemon start
```

Stop the daemon:
```bash
port daemon stop
```

Check daemon status:
```bash
port daemon status

# Detailed status with app information
port daemon status --verbose
```

Restart the daemon:
```bash
port daemon restart
```

### Managing Apps

Add an app to the daemon:
```bash
port app add myapp \
  --command "npm start" \
  --port 3000 \
  --dir /path/to/app

# With custom options
port app add api \
  --command "python app.py" \
  --port 8000 \
  --dir ~/projects/api \
  --env DATABASE_URL=postgres://localhost/db \
  --env DEBUG=true \
  --max-restarts 10 \
  --health-interval 60
```

List managed apps:
```bash
port app list

# Include live status from daemon
port app list --status
```

View app logs:
```bash
port app logs myapp

# Last 50 lines
port app logs myapp --lines 50

# Follow log output
port app logs myapp --follow
```

Remove an app:
```bash
port app remove myapp

# Skip confirmation
port app remove myapp --yes
```

### App Configuration Options

- `--command`: Command to execute (required)
- `--port`: Port for health checks (required)
- `--dir`: Working directory (required)
- `--env`: Environment variables (KEY=VALUE format, can be used multiple times)
- `--no-auto-restart`: Disable automatic restart on failure
- `--max-restarts`: Maximum restart attempts (default: 5)
- `--health-interval`: Health check interval in seconds (default: 30)
- `--health-path`: HTTP health check path (e.g., /health)

### How It Works

1. **Background Daemon**: Runs as a background process managing all your apps
2. **Health Monitoring**: Checks each app every 30 seconds (configurable)
3. **Auto-Restart**: Automatically restarts failed apps with exponential backoff
4. **Log Management**: Stores stdout/stderr logs with automatic rotation
5. **Graceful Shutdown**: Properly stops all apps when daemon is stopped

### Example Workflow

```bash
# Start the daemon
port daemon start

# Add your development apps
port app add frontend \
  --command "npm run dev" \
  --port 3000 \
  --dir ~/projects/frontend

port app add backend \
  --command "python manage.py runserver" \
  --port 8000 \
  --dir ~/projects/backend \
  --env DEBUG=1

port app add database \
  --command "docker run -p 5432:5432 postgres" \
  --port 5432 \
  --dir /tmp

# Check status
port daemon status --verbose

# View logs
port app logs backend --lines 100

# All apps now run in the background with auto-restart!
```

### Removing Mappings

```bash
porter unmap <subdomain>
```

Removes the mapping and cleans up the hosts file entry.

### Viewing Command Tree

```bash
porter tree [depth]
```

Display the command hierarchy. Default depth is 2.

### Documentation

```bash
porter docs
```

Opens the documentation in your browser.

### Reset Configuration

```bash
porter reset
```

Clears all configuration and hosts file entries. Prompts for confirmation.

Use `--yes` to skip confirmation:
```bash
porter reset --yes
```

## Configuration

Porter stores configuration in `~/.porter/config.toml`:

```toml
base_domain = "localhost"

[mappings]
api = 3000
web = 8080
admin = 4000
```

## Hosts File Management

Porter automatically manages your `/etc/hosts` file (or Windows equivalent). It adds entries between special markers:

```
# BEGIN PORTER MANAGED
127.0.0.1    api.localhost    # porter:port=3000
127.0.0.1    web.localhost    # porter:port=8080
# END PORTER MANAGED
```

### Permissions

Modifying the hosts file requires elevated permissions:

**macOS/Linux:**
```bash
sudo porter map api 3000
```

**Windows:**
Run your terminal as Administrator.

## Architecture

Porter is built with clean architecture principles:

- **config.rs**: Configuration management with validation
- **hosts.rs**: Cross-platform hosts file operations
- **browser.rs**: Browser integration
- **output.rs**: Styled terminal output
- **error.rs**: Custom error types with helpful messages
- **main.rs**: CLI parsing and command routing

## Error Handling

Porter provides clear error messages and guidance:

```bash
$ porter map api 3000
✗ Base domain must be set before creating mappings

$ porter unmap nonexistent
✗ Mapping not found: nonexistent

$ porter map invalid.subdomain 3000
✗ Invalid input: Subdomain cannot contain dots
```

## Development

### Building

```bash
cargo build
```

### Running Tests

```bash
cargo test
```

### Verbose Logging

```bash
porter --verbose list
```

### Code Quality

The codebase includes:
- Comprehensive unit tests
- Integration tests
- Input validation
- Safe concurrent access
- Atomic file operations
- Automatic backups

## Platform Support

- macOS (tested)
- Linux (tested)
- Windows (supported, not tested)

## Dependencies

- **clap**: CLI parsing with colors and suggestions
- **colored**: Terminal styling
- **serde/toml**: Configuration serialization
- **anyhow/thiserror**: Error handling
- **dirs**: Cross-platform directory paths
- **env_logger/log**: Logging infrastructure

## License

MIT

## Author

Josh Kornreich

## Contributing

Contributions welcome! Please ensure tests pass before submitting PRs.

## Troubleshooting

### Permission Denied

Run with sudo (macOS/Linux) or as Administrator (Windows).

### Mapping Not Working

1. Check configuration: `porter list`
2. Verify hosts file: `cat /etc/hosts` (macOS/Linux)
3. Clear browser cache
4. Try verbose mode: `porter --verbose map api 3000`

### Browser Not Opening

The tool will print the URL even if the browser fails to open. You can manually visit the URL.

## Examples

### Development Environment Setup

```bash
# Set up local development domains
porter set base localhost

# Frontend development server
porter map app 3000

# Backend API server
porter map api 8080

# Database admin interface
porter map admin 5432

# List everything
porter list

# Open in browser
porter open app
porter open api
porter open admin
```

### Working with Multiple Projects

```bash
# Project A
porter map project-a 3000

# Project B
porter map project-b 3001

# Microservices
porter map auth-service 4000
porter map user-service 4001
porter map payment-service 4002
```

## Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `set base <domain>` | Set base domain | `porter set base localhost` |
| `map <subdomain> <port>` | Map subdomain to port | `porter map api 3000` |
| `route <subdomain> <port>` | Alias for map | `porter route api 3000` |
| `unmap <subdomain>` | Remove mapping | `porter unmap api` |
| `list` | Show all mappings | `porter list` |
| `open <subdomain>` | Open in browser | `porter open api` |
| `tree [depth]` | Show command tree | `porter tree 2` |
| `docs` | Open documentation | `porter docs` |
| `reset` | Clear all config | `porter reset` |
| `--verbose` | Enable debug logging | `porter --verbose list` |

## Future Enhancements

- SSL/TLS certificate generation
- Docker integration
- Nginx/Apache configuration generation
- Import/export configurations
- Project-specific configuration files
- Shell completion scripts
