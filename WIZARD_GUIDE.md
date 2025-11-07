# Porter Init Wizard Guide

## Overview

The `porter init` command launches an interactive wizard that guides first-time users through Porter setup in under a minute.

## What It Does

The wizard walks you through 3 simple steps:

### Step 1: Base Domain Configuration
- Prompts for your base domain (default: `localhost`)
- Common choices: `localhost`, `local`, `test`, `dev`
- Validates and saves the configuration

### Step 2: Create First Mapping
- Optional: Create your first subdomain-to-port mapping
- Provides helpful examples (e.g., `api` → `3000`)
- Validates subdomain and port input
- Shows the full URL that will be created

### Step 3: Hosts File Update
- Optional: Update system hosts file automatically
- Explains permission requirements (sudo/admin)
- Provides fallback instructions if permission denied
- Shows next steps for completion

## Example Wizard Flow

```
⚓ Welcome to Porter - Domain to Port Mapper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This wizard will help you set up Porter for the first time.

Step 1: Base Domain
This is the domain that subdomains will be added to.
Common choices: localhost, local, test, dev

? Enter your base domain › localhost

✓ Base domain set to: localhost

Step 2: Create Your First Mapping
Let's map a subdomain to a port on your computer.
Example: 'api' subdomain → port 3000 = api.localhost

? Would you like to create a mapping now? › Yes
? Enter subdomain name › api
? Enter port number › 3000

✓ Mapping created: api → api.localhost:3000

Step 3: Update Hosts File
To access your mapping, Porter needs to update your system's hosts file.
This requires elevated permissions (sudo/admin).

? Would you like to update the hosts file now? › Yes

Attempting to update hosts file...
✓ Hosts file updated successfully!

🎉 Setup Complete!

You can now:
  • Access your service at: http://api.localhost:3000
  • Open in browser: porter open api
  • View all mappings: porter list
  • Create more mappings: porter map <subdomain> <port>

Need help? Run: porter --help
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Key Features

### Smart Detection
- Detects existing configuration and asks before overwriting
- Shows current mappings if already configured
- Allows skipping wizard if setup is complete

### Input Validation
- Subdomain validation (no dots, no empty strings)
- Port validation (1-65535 range)
- Safe defaults for quick setup

### Helpful Guidance
- Clear explanations at each step
- Fallback instructions for permission errors
- Next steps guidance after completion

### Error Handling
- Graceful handling of permission issues
- Clear error messages with solutions
- Non-destructive (doesn't break existing config)

## When to Use

**Perfect for:**
- First-time Porter users
- Quick onboarding for teams
- Setting up new development machines
- Users unfamiliar with CLI tools

**Skip if:**
- You're already familiar with Porter
- You want to script Porter setup
- You have existing configuration

## Running the Wizard

```bash
# Start the interactive wizard
porter init

# If you already have configuration, wizard will ask before continuing
# Press Ctrl+C at any time to safely exit
```

## After the Wizard

Once complete, you can:

```bash
# View your configuration
porter list

# Create more mappings
porter map frontend 8080
porter map backend 3000
porter map database 5432

# Open in browser
porter open frontend

# View all commands
porter --help
porter tree
```

## Troubleshooting

**Permission Denied?**
- Run with `sudo`: `sudo porter map <subdomain> <port>`
- Or follow the guidance provided by the wizard

**Already Have Configuration?**
- Wizard will show existing config and ask before proceeding
- Use `porter list` to view current mappings
- Use `porter reset` to start fresh (asks for confirmation)

**Need to Skip Steps?**
- You can skip creating a mapping (Step 2)
- You can skip hosts file update (Step 3)
- You'll get clear next steps for completing setup

## Design Philosophy

The wizard follows these principles:

1. **Minimal Friction**: Get users productive in <60 seconds
2. **Clear Guidance**: Explain each step with examples
3. **Safe Defaults**: Sensible defaults that work for most users
4. **Non-Destructive**: Never break existing configuration
5. **Helpful Errors**: Clear solutions for common problems

---

**Questions?** Run `porter --help` or check out the full documentation with `porter docs`
