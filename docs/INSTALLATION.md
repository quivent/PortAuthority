# Port Authority Installation Guide

## Prerequisites

- Node.js >= 16.0.0
- Python >= 3.7 (for Python client)
- npm or yarn

## Installation Steps

### 1. Install Port Authority Service

```bash
cd /home/alice/PortAuthority
npm install
```

### 2. Install CLI Tool (Optional but Recommended)

```bash
cd /home/alice/PortAuthority/cli
npm install
npm link  # Makes 'portauth' command available globally
```

### 3. Install Client Libraries

#### Node.js Client

```bash
cd /home/alice/PortAuthority/clients/node
npm install
npm link  # Makes it available as 'portauth-client' package
```

Or in your project:
```bash
npm install /home/alice/PortAuthority/clients/node
```

#### Python Client

```bash
cd /home/alice/PortAuthority/clients/python
pip install -e .
```

Or:
```bash
pip install /home/alice/PortAuthority/clients/python
```

## Start Port Authority Service

### Development Mode

```bash
cd /home/alice/PortAuthority
npm run dev
```

### Production Mode

```bash
cd /home/alice/PortAuthority
npm start
```

### As a Systemd Service (Recommended for Production)

Create `/etc/systemd/system/port-authority.service`:

```ini
[Unit]
Description=Port Authority - Centralized Port Management
After=network.target

[Service]
Type=simple
User=alice
WorkingDirectory=/home/alice/PortAuthority
ExecStart=/usr/bin/node /home/alice/PortAuthority/service/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable port-authority
sudo systemctl start port-authority
sudo systemctl status port-authority
```

## Verify Installation

```bash
# Check service health
portauth health

# Or use curl
curl http://localhost:9999/health
```

Expected output:
```json
{
  "status": "healthy",
  "service": "port-authority",
  "uptime": 42,
  "allocations": 0
}
```

## Environment Variables

Optional environment variables:

```bash
# Port Authority service port (default: 9999)
export PORT_AUTHORITY_PORT=9999

# For clients - Port Authority URL
export PORT_AUTHORITY_URL=http://localhost:9999

# For services - Service name and project
export SERVICE_NAME=my-service
export PROJECT_NAME=my-project
```

## Next Steps

See [USAGE.md](USAGE.md) for usage examples and integration guide.
