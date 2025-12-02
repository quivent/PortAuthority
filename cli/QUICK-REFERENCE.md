# Port Authority CLI - Quick Reference

## 🚀 Essential Commands

```bash
# View all commands in tree format
portauth tree

# View help
portauth --help
portauth <command> --help

# View documentation
portauth docs
portauth docs --glow
portauth docs --web
```

## 🔵 Core Commands (Port Operations)

```bash
# Allocate a port
portauth allocate <service-name>
portauth allocate api --preferred 8080 --priority 3 --project myapp

# Release a port
portauth release <service-name>

# Check port availability
portauth check <port>
```

## 🟢 Management Commands (View & Monitor)

```bash
# List all allocations
portauth list
portauth list --project myapp

# View metrics
portauth metrics

# Check service health
portauth health
```

## 🟡 Utility Commands (Tools & Analysis)

```bash
# Show command tree
portauth tree

# View documentation
portauth docs [--glow|--web]

# Detailed statistics
portauth stats
portauth stats --project myapp

# Scan for conflicts
portauth scan
portauth scan --range 3000-9999

# Real-time monitoring
portauth watch
portauth watch --interval 2 --project myapp

# Export data
portauth export
portauth export --format csv --output file.csv
portauth export --format yaml --project myapp
```

## 🔴 Administration (Enforcement)

```bash
# Kill unauthorized processes
portauth enforce
```

## 📋 Command Options

### Allocate Options
- `-p, --preferred <port>` - Preferred port number
- `--priority <1-5>` - Allocation priority
- `--project <name>` - Project name

### List/Stats/Watch/Export Options
- `-p, --project <name>` - Filter by project

### Watch Options
- `-i, --interval <seconds>` - Refresh interval (default: 5)

### Scan Options
- `--range <start-end>` - Port range (e.g., 3000-9999)

### Export Options
- `-f, --format <type>` - Format: json, csv, yaml
- `-o, --output <file>` - Output file path

### Docs Options
- `--glow` - Render with glow
- `--web` - Open in browser

## 🎨 Color Coding

- 🔵 **Blue** - Core operations (allocate, release, check)
- 🟢 **Green** - Management (list, metrics, health)
- 🟡 **Yellow** - Utilities (tree, docs, stats, scan, watch, export)
- 🔴 **Red** - Administration (enforce)

## 💡 Pro Tips

1. **Start with tree**: `portauth tree` - See all commands
2. **Read the docs**: `portauth docs` - Built-in documentation
3. **Watch during dev**: `portauth watch` - Real-time monitoring
4. **Scan regularly**: `portauth scan` - Find conflicts
5. **Export backups**: `portauth export --format json` - Save state
6. **Use project filters**: Most commands support `--project`
7. **Check health first**: `portauth health` - Verify service running

## 📊 Typical Workflows

### Initial Setup
```bash
portauth health              # Check service
portauth tree                # See available commands
portauth docs                # Read documentation
```

### Development
```bash
portauth allocate my-service --project dev
portauth list --project dev
portauth watch --project dev
```

### Maintenance
```bash
portauth scan                # Find conflicts
portauth enforce             # Kill unauthorized
portauth metrics             # View statistics
```

### Analysis
```bash
portauth stats               # Detailed stats
portauth export --format csv # Export data
```

## 🔍 Troubleshooting

```bash
# Service not responding?
portauth health

# Port conflicts?
portauth scan
portauth enforce

# Need allocation details?
portauth list
portauth check <port>

# Want statistics?
portauth stats
portauth metrics
```

## 📖 More Information

- Full documentation: `portauth docs`
- Command tree: `portauth tree`
- Command help: `portauth <command> --help`
- README: See README.md
- Changelog: See CHANGELOG.md

---

Quick reference for Port Authority CLI v2.0 🚀
