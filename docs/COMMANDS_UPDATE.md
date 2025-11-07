# Porter Commands Documentation Update

This document outlines the correct command structure for Porter's HTML documentation.

## Actual Porter Commands

Based on the README, Porter has these commands:

### Configuration Commands
- `porter set base <domain>` - Set the base domain for subdomain mappings

### Mapping Commands
- `porter map <subdomain> <port>` - Create a subdomain-to-port mapping
- `porter route <subdomain> <port>` - Alias for `map`
- `porter unmap <subdomain>` - Remove a mapping

### Query Commands
- `porter list` - Show all current mappings

### Browser Commands
- `porter open <subdomain>` - Open a mapped subdomain in browser

### Utility Commands
- `porter tree [depth]` - Display command hierarchy
- `porter docs` - Open documentation in browser
- `porter reset [--yes]` - Clear all configuration
- `porter --verbose <command>` - Run command with debug logging
- `porter --help` - Show help information

## Command Groups for HTML Docs

1. **Configuration & Setup** (🔧)
   - set base

2. **Subdomain Mapping** (⚓)
   - map / route
   - unmap
   - list

3. **Browser Integration** (🌐)
   - open

4. **Utilities** (🛠️)
   - tree
   - docs
   - reset
   - --verbose
   - --help

## Key Features to Highlight

- Automatic hosts file management with backups
- Cross-platform support
- Beautiful colored terminal output
- Persistent configuration in `~/.porter/config.toml`
- Safe operations with confirmation prompts
