# Port Authority - Reverse Proxy Architecture

## Problem Statement

Current implementation ONLY edits `/etc/hosts` file, which means:
- You still need port numbers: `http://api.localhost:3000` ❌
- The whole point is LOST

## What Users Want

```bash
porter map api 3000
# Result: http://api.localhost (NO PORT) → localhost:3000
```

## Solution: Reverse Proxy

We need to run a local reverse proxy that:
1. Listens on port 80 (HTTP) and 443 (HTTPS)
2. Routes based on subdomain to localhost ports
3. Runs as a background service

## Architecture Options

### Option 1: Embedded Rust Proxy (RECOMMENDED)
- Use `hyper` or `warp` to build a simple reverse proxy
- Run as daemon with `porter start`
- Configuration stored in `~/.porter/config.toml`
- Benefits: No external dependencies, pure Rust, full control

### Option 2: Caddy Integration
- Generate Caddyfile on each config change
- Reload Caddy automatically
- Benefits: Battle-tested, automatic HTTPS
- Drawbacks: External dependency

### Option 3: nginx Integration
- Generate nginx config
- Reload nginx
- Benefits: Most common
- Drawbacks: More complex config, external dependency

## Recommended Implementation

### 1. Add Reverse Proxy to Porter

```rust
// src/proxy.rs
use hyper::{Body, Request, Response, Server, Client};
use hyper::service::{make_service_fn, service_fn};

pub async fn start_proxy(config: Config) -> Result<()> {
    let addr = ([127, 0, 0, 1], 80).into();

    let make_svc = make_service_fn(|_conn| {
        let config = config.clone();
        async move {
            Ok::<_, Error>(service_fn(move |req| {
                proxy_request(req, config.clone())
            }))
        }
    });

    Server::bind(&addr).serve(make_svc).await?;
    Ok(())
}

async fn proxy_request(req: Request<Body>, config: Config) -> Result<Response<Body>> {
    // Extract subdomain from Host header
    let host = req.headers().get("host")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    // Parse subdomain (e.g., "api.localhost" -> "api")
    let subdomain = extract_subdomain(host, &config.base_domain);

    // Look up port mapping
    if let Some(port) = config.mappings.get(&subdomain) {
        // Forward to localhost:port
        let client = Client::new();
        let uri = format!("http://127.0.0.1:{}{}", port, req.uri().path_and_query().map(|x| x.as_str()).unwrap_or("/"));
        // ... forward request
    } else {
        // Return 404 with helpful message
        Ok(Response::builder()
            .status(404)
            .body(Body::from("Subdomain not found. Run 'porter map <subdomain> <port>'"))
            .unwrap())
    }
}
```

### 2. Add Daemon Commands

```bash
porter start         # Start reverse proxy daemon
porter stop          # Stop daemon
porter restart       # Restart daemon
porter status        # Show daemon status
```

### 3. Auto-start on Map

```bash
porter map api 3000
# → Checks if daemon is running
# → If not, starts it automatically
# → Updates config
# → Reloads daemon config
# ✓ Mapped api → http://api.localhost (NO PORT)
```

## File Structure

```
~/.porter/
├── config.toml          # Base domain + mappings
├── porter.pid           # Daemon PID
└── porter.log           # Proxy logs
```

## Security Considerations

1. **Port 80 requires sudo**: Either:
   - Run daemon as root (BAD)
   - Use port 8080 and document (OKAY)
   - Use authbind/capabilities (BEST)

2. **Automatic startup**: Add to:
   - macOS: `~/Library/LaunchAgents/com.porter.proxy.plist`
   - Linux: systemd user service
   - Windows: Task Scheduler

## Implementation Priority

**Phase 1: Basic Proxy** (HIGH PRIORITY)
- [ ] Implement reverse proxy in `src/proxy.rs`
- [ ] Add `porter start/stop/status` commands
- [ ] Auto-start on `porter map`
- [ ] Forward HTTP requests based on subdomain

**Phase 2: Daemon Management** (MEDIUM)
- [ ] PID file management
- [ ] Background process handling
- [ ] Auto-restart on config changes
- [ ] Graceful shutdown

**Phase 3: Advanced Features** (LOW)
- [ ] HTTPS support with self-signed certs
- [ ] WebSocket proxying
- [ ] Request logging
- [ ] Health checks

## User Experience

### Before (Current - BROKEN):
```bash
porter map api 3000
# Visit: http://api.localhost:3000 (STILL NEED PORT!)
```

### After (Fixed):
```bash
porter map api 3000
# → Starting reverse proxy...
# ✓ Mapped api → http://api.localhost
# → Daemon running on port 80

# Visit: http://api.localhost (NO PORT!)
```

## Next Steps

1. Add `hyper` and `tokio` dependencies to Cargo.toml
2. Implement basic reverse proxy in src/proxy.rs
3. Add start/stop/status commands
4. Test with multiple subdomains
5. Add auto-start integration

---

**THIS IS CRITICAL**: The tool is USELESS without the reverse proxy. Users want `http://api.localhost`, not `http://api.localhost:3000`.
