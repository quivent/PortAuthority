# Port Authority Discovery & Enforcement

## New Features

Port Authority now has the ability to discover and enforce registration of all services running on your system.

### Commands

#### 1. Discover Services

Scan your system for services using ports:

```bash
portauth discover
```

Options:
- `--start <port>` - Start of port range (default: 1000)
- `--end <port>` - End of port range (default: 65535)
- `--registered` - Include already registered services in output
- `--register` - Auto-register discovered services
- `--force` - Kill services before registering them (use with caution!)
- `--project <name>` - Project name for registered services (default: 'discovered')

#### 2. System Health Check

Run comprehensive diagnostics:

```bash
portauth doctor
```

Checks:
- Port Authority service health
- System dependencies (lsof, ss, ps, kill)
- Port conflicts and unregistered services
- Registry database accessibility

### Examples

**Basic discovery:**
```bash
portauth discover --start 3000 --end 10000
```

**Discover and register:**
```bash
portauth discover --register --project my-services
```

**Force registration (kills services first):**
```bash
portauth discover --force --project rogue-services
```

**Full system scan:**
```bash
portauth discover --start 1000 --end 65535 --registered
```

### How It Works

1. **Discovery**: Scans ports using `ss` and `lsof` to find listening services
2. **Service Identification**: Extracts PID, command, and user information
3. **Name Inference**: Intelligently infers service names from process commands
   - Node.js apps: Extracts project name from path
   - Python apps: Extracts script name
   - Vite/nginx/apache: Uses recognizable names
   - Others: Uses binary name or `service-{port}`
4. **Registration**: Adds services to Port Authority registry with metadata
5. **Enforcement**: Optionally kills unauthorized processes before registration

### API Endpoints

New REST API endpoints:

- `GET /discover?start=1000&end=65535&includeRegistered=true` - Discover services
- `POST /discover/register/:port` - Register a single service
  ```json
  {
    "kill": false,
    "serviceName": "my-service",
    "project": "production"
  }
  ```
- `POST /discover/register-all` - Batch register all discovered services
  ```json
  {
    "portRangeStart": 1000,
    "portRangeEnd": 65535,
    "kill": false,
    "project": "discovered"
  }
  ```

### Metadata Tracking

When services are force-registered, Port Authority stores:
- Original command
- Original PID
- Original user
- Discovery timestamp
- Force registration flag

### Use Cases

1. **System Audit**: Discover what's running on your system
2. **Port Cleanup**: Find and manage orphaned services
3. **Migration**: Bring existing services under Port Authority management
4. **Enforcement**: Kill rogue services and enforce registration
5. **Monitoring**: Track which services are registered vs unregistered

### Safety

- Use `--force` carefully - it will kill running services
- Test with small port ranges first
- Backup critical services before force registration
- Services with the same name get unique names: `service-name-{port}`

---

**Zero port conflicts. Zero port stealing. Total control.**
