# Porter Quick Start Guide

Get started with Porter in 60 seconds!

## Installation

```bash
cd port-authority
cargo install --path .
```

## Quick Setup

```bash
# Step 1: Set your base domain
porter set base localhost

# Step 2: Create your first mapping
porter map api 3000

# Step 3: View your mappings
porter list
```

## Common Commands

### Map Services

```bash
# Frontend
porter map app 3000

# Backend API
porter map api 8080

# Database UI
porter map db-admin 5432

# View all mappings
porter list
```

### Open in Browser

```bash
# Opens http://api.localhost:8080
porter open api
```

### Remove Mapping

```bash
porter unmap api
```

### View Command Structure

```bash
porter tree
```

## With Elevated Permissions

To update the hosts file (required for browser access):

```bash
# macOS/Linux
sudo porter map api 3000

# Windows (Run terminal as Administrator)
porter map api 3000
```

## Configuration

Porter stores configuration in `~/.porter/config.toml`:

```toml
base_domain = "localhost"

[mappings]
api = 3000
app = 8080
```

## Need Help?

```bash
# View all commands
porter --help

# View command-specific help
porter map --help

# View command tree
porter tree
```

## Reset Everything

```bash
# Clear all configuration
porter reset
```

## Tips

1. Use descriptive subdomain names: `auth-api`, `user-service`, `admin-panel`
2. Keep a consistent port numbering scheme: 3000s for frontend, 8000s for backend
3. Use `porter list` frequently to see your current setup
4. The `route` command is an alias for `map` - use whichever you prefer

## Troubleshooting

### Permission Denied

Run with sudo/admin privileges to modify hosts file.

### Mapping Not Working

1. Check config: `porter list`
2. Verify hosts file: `cat /etc/hosts` (macOS/Linux)
3. Clear browser cache
4. Use verbose mode: `porter --verbose map api 3000`

## Next Steps

- Explore `porter tree` for all available commands
- Read the full README.md for advanced features
- Consider setting up mappings for all your active projects
