# Port Authority Launcher - Complete Service Lifecycle Management

**Launch, manage, and monitor services with automatic port allocation**

## Overview

The Port Authority Launcher is a built-in process manager that allows you to launch, stop, restart, and monitor services directly through Port Authority. Services automatically receive their allocated ports through environment variables, and all output is captured to log files.

## Features

- 🚀 **Launch Services** - Start services with automatic PORT environment variable injection
- ⏹️ **Stop/Restart** - Graceful shutdown with force-kill option
- 📊 **Process Status** - Real-time process monitoring (like `docker ps`)
- 📋 **Log Capture** - Automatic stdout/stderr logging to files
- 🔄 **Auto-Restart** - Optional automatic restart on crash
- 🔍 **Status Tracking** - Track PIDs, start times, stop times, and status
- 💾 **Persistent Storage** - Launch configurations stored for easy restarts

## Commands

### Launch a Service

```bash
portauth launch <service-name> --command "<command>"
```

**Options:**
- `--command` (required) - Command to execute
- `--cwd <directory>` - Working directory (default: current)
- `--env <vars>` - Additional environment variables (format: `KEY1=val1,KEY2=val2`)
- `--auto-restart` - Automatically restart service if it crashes

**Example:**
```bash
# Launch a web server
portauth launch my-api --command "npm start" --cwd /path/to/app

# Launch with environment variables
portauth launch worker --command "python worker.py" --env "DEBUG=true,ENV=production"

# Launch with auto-restart
portauth launch critical-service --command "./start.sh" --auto-restart
```

**The service automatically receives:**
- `PORT` environment variable with its allocated port
- All existing environment variables
- Custom env vars specified with --env

### Stop a Service

```bash
portauth stop <service-name>
```

**Options:**
- `-f, --force` - Force kill (SIGKILL) instead of graceful shutdown (SIGTERM)

**Example:**
```bash
# Graceful stop
portauth stop my-api

# Force kill
portauth stop stuck-service --force
```

### Restart a Service

```bash
portauth restart <service-name>
```

Stops the service (if running) and restarts it with the stored launch command.

**Example:**
```bash
portauth restart my-api
```

### Show Process Status

```bash
portauth ps [service-name]
```

Show process status for services (inspired by `docker ps` and `kubectl get pods`).

**Options:**
- `--running-only` - Show only running services

**Examples:**
```bash
# Show status of specific service
portauth ps my-api

# Show all services
portauth ps

# Show only running services
portauth ps --running-only
```

### View Logs

```bash
portauth logs <service-name>
```

**Options:**
- `-n, --lines <number>` - Number of lines to show (default: 50)
- `-f, --follow` - Follow log output (updates every 2 seconds)

**Examples:**
```bash
# View last 50 lines
portauth logs my-api

# View last 100 lines
portauth logs my-api --lines 100

# Follow logs in real-time
portauth logs my-api --follow
```

## Complete Workflow Example

```bash
# 1. Allocate a port
portauth allocate my-web-app --project production

# 2. Launch the service
portauth launch my-web-app \
  --command "node server.js" \
  --cwd /home/user/my-app \
  --env "NODE_ENV=production" \
  --auto-restart

# 3. Check status
portauth ps my-web-app
# Output:
# 📊 my-web-app
# Status: RUNNING
# Port: 4016
# PID: 12345
# ...

# 4. View logs
portauth logs my-web-app --lines 100

# 5. View all services
portauth ps

# 6. Stop the service
portauth stop my-web-app

# 7. Restart (uses stored launch command)
portauth restart my-web-app
```

## Service States

Services can be in one of the following states:

- **RUNNING** - Service is actively running
- **STOPPED** - Service was gracefully stopped
- **CRASHED** - Service exited with non-zero code

## Log Files

Logs are automatically captured and stored in:
- **stdout**: `/tmp/port-authority-logs/<service-name>.stdout.log`
- **stderr**: `/tmp/port-authority-logs/<service-name>.stderr.log`

You can change the log directory by setting:
```bash
export PORT_AUTHORITY_LOG_DIR="/path/to/logs"
```

## How PORT Injection Works

When you launch a service, Port Authority:

1. Gets the allocated port for the service
2. Creates environment with `PORT=<allocated-port>`
3. Merges with system environment variables
4. Adds any custom env vars from `--env` option
5. Launches the service with this environment

Your application can then use `process.env.PORT` (Node.js), `os.environ['PORT']` (Python), etc.

## Auto-Restart Feature

When `--auto-restart` is enabled:

- Service automatically restarts if it exits with non-zero code
- Waits 1 second before restarting
- Does NOT restart if service exits cleanly (code 0)
- Useful for critical services that must stay running

**Example:**
```bash
portauth launch critical-api \
  --command "node api.js" \
  --auto-restart
```

## Process Management

The launcher runs services as:
- **Detached processes** - Run independently of Port Authority
- **Background processes** - Don't block the terminal
- **Supervised** - Status tracked and monitored

Services continue running even if:
- Port Authority restarts
- Your terminal closes
- SSH connection drops

## Integration with Discovery

You can combine launcher with discovery:

```bash
# Discover rogue services
portauth discover --register

# Launch managed services
portauth ps  # See what's registered

# Launch a service
portauth launch <service-name> --command "..."
```

## API Endpoints

The launcher exposes REST API endpoints:

- `POST /launcher/launch/:serviceName` - Launch a service
- `POST /launcher/stop/:serviceName` - Stop a service
- `POST /launcher/restart/:serviceName` - Restart a service
- `GET /launcher/status/:serviceName` - Get service status
- `GET /launcher/status` - Get all service statuses
- `GET /launcher/logs/:serviceName` - Get service logs

## Best Practices

1. **Always allocate first**: Use `portauth allocate` before `portauth launch`
2. **Use absolute paths**: Specify full paths for --cwd option
3. **Test commands manually**: Verify your command works before using launcher
4. **Monitor logs**: Check logs regularly with `portauth logs`
5. **Use auto-restart wisely**: Only for services that should never stop
6. **Clean shutdown**: Use `portauth stop` instead of manual `kill`

## Troubleshooting

### Service shows as CRASHED

Check logs:
```bash
portauth logs <service-name> --lines 100
```

### Service won't start

1. Verify the command works manually
2. Check the allocated port: `portauth list`
3. Ensure the service listens on the PORT env var
4. Check working directory exists

### Can't stop service

Use force kill:
```bash
portauth stop <service-name> --force
```

### Lost track of running services

```bash
# See all services
portauth ps

# Discover unregistered services
portauth discover
```

---

**Complete service lifecycle management under Port Authority control**
