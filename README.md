# Port Authority - Centralized Port Management System

**Zero port conflicts. Zero port stealing. Total control.**

Port Authority is a standalone service that manages port allocation across all your projects, ensuring services never conflict or steal ports from each other.

## Features

- ✅ **Centralized Port Management** - Single source of truth for all port allocations
- ✅ **Automatic Conflict Detection** - Prevents port conflicts before they happen
- ✅ **Multi-Language Support** - Client libraries for Node.js, Python, Rust, Go
- ✅ **CLI Tool** - Simple command-line interface for port management
- ✅ **Enforcement Layer** - Automatically kills unauthorized port usage
- ✅ **φ-Based Optimization** - Golden ratio port allocation for optimal distribution
- ✅ **Health Monitoring** - Track service health and port usage
- ✅ **REST API** - HTTP API for programmatic access

## Quick Start

### 1. Start Port Authority Service

```bash
cd /home/alice/PortAuthority
npm install
npm start
```

### 2. Request a Port

```bash
# Using CLI
portauth allocate my-service

# Using Node.js
const { PortAuthorityClient } = require('portauth-client');
const client = new PortAuthorityClient();
const port = await client.allocate('my-service');

# Using Python
from portauth import PortAuthorityClient
client = PortAuthorityClient()
port = client.allocate('my-service')
```

### 3. Start Your Service on Assigned Port

Your service receives an authorized port and starts without conflicts.

## Architecture

```
┌─────────────────────────────────────────┐
│       Port Authority Service            │
│  - Port Registry (SQLite)               │
│  - Allocation Engine                    │
│  - Conflict Detector                    │
│  - REST API (Port 9999)                 │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────▼────┐         ┌────▼────┐
   │   CLI   │         │ Clients │
   │ portauth│         │ (libs)  │
   └─────────┘         └─────────┘
        │                   │
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │  Your Services    │
        │  (authorized)     │
        └───────────────────┘
```

## Installation

See [INSTALLATION.md](docs/INSTALLATION.md)

## Usage

See [USAGE.md](docs/USAGE.md)

## API Documentation

See [API.md](docs/API.md)

## License

MIT
