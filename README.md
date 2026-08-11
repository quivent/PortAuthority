<div align="center">

```
 ____            _       _         _   _                _ _         
|  _ \ ___  _ __| |_    / \  _   _| |_| |__   ___  _ __(_) |_ _   _ 
| |_) / _ \| '__| __|  / _ \| | | | __| '_ \ / _ \| '__| | __| | | |
|  __/ (_) | |  | |_  / ___ \ |_| | |_| | | | (_) | |  | | |_| |_| |
|_|   \___/|_|   \__|/_/   \_\__,_|\__|_| |_|\___/|_|  |_|\__|\__, |
                                                              |___/ 
```

**PortAuthority**

*A CLI tool for managing subdomain-to-localhost port mappings with intelligent app detection*

[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![OS](https://img.shields.io/badge/OS-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey.svg?style=for-the-badge)](#platform-support)

</div>

---

## 📑 Table of Contents

- [⚡ Overview](#-overview)
- [✨ Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Usage](#-usage)
- [🔧 Daemon Process Management](#-daemon-process-management)
- [⚙️ Configuration](#-configuration)
- [📖 Architecture](#-architecture)
- [🤝 Contributing](#-contributing)

---

## ⚡ Overview

A CLI tool for managing subdomain-to-localhost port mappings. Simplify local development by mapping custom subdomains to your local services safely and easily.

---

## ✨ Features

### Core Features
- Map subdomains to local ports (e.g., `api.localhost:3000`)
- Automatic `/etc/hosts` file management with automatic backups
- Cross-platform support (macOS, Linux, Windows)
- Beautiful terminal output with colors
- Browser integration for quick access
- Persistent configuration storage

### Daemon Process Management (New!)
- Background daemon for managing multiple app processes
- Automatic process restart on failure
- Health monitoring with TCP/HTTP checks
- Process log management and viewing
- Graceful shutdown handling
- Configurable restart limits and intervals

---

## 📦 Installation

### From Source

```bash
cargo install --path .
```

### Quick Start

**First time using Porter? Run the interactive setup wizard:**

```bash
porter init
```

The wizard will guide you through setting up your base domain, creating your first subdomain mapping, and updating your system's hosts file.

---

## 🚀 Usage

### Setting Base Domain

This sets the base domain for all your subdomain mappings.

```bash
porter set base localhost
```

### Mapping Subdomains

Map a subdomain to a local port:

```bash
porter map api 3000
porter map web 8080

# You can also use `route` as an alias:
porter route admin 4000
```

### Additional Commands

```bash
# List all mappings
porter list

# Open mapped subdomain URL in default browser
porter open api

# Remove a mapping
porter unmap api

# Reset configuration and hosts file entries
porter reset --yes
```

> [!IMPORTANT]
> Modifying the hosts file requires elevated permissions. Run with `sudo` on macOS/Linux or as Administrator on Windows.

---

## 🔧 Daemon Process Management

Port Authority includes a powerful daemon system for managing background processes.

### Managing the Daemon

```bash
port daemon start
port daemon status --verbose
port daemon stop
port daemon restart
```

### Managing Apps

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

# View apps and logs
port app list --status
port app logs myapp --follow
```

---

## ⚙️ Configuration

Porter stores configuration in `~/.porter/config.toml`:

```toml
base_domain = "localhost"

[mappings]
api = 3000
web = 8080
admin = 4000
```

Porter automatically manages your `/etc/hosts` file by adding entries between special markers:

```
# BEGIN PORTER MANAGED
127.0.0.1    api.localhost    # porter:port=3000
127.0.0.1    web.localhost    # porter:port=8080
# END PORTER MANAGED
```

---

## 📖 Architecture

Porter is built with clean architecture principles:
- **config.rs**: Configuration management with validation
- **hosts.rs**: Cross-platform hosts file operations
- **browser.rs**: Browser integration
- **output.rs**: Styled terminal output
- **error.rs**: Custom error types with helpful messages
- **main.rs**: CLI parsing and command routing

<details>
<summary>Dependencies</summary>

- `clap`: CLI parsing with colors and suggestions
- `colored`: Terminal styling
- `serde/toml`: Configuration serialization
- `anyhow/thiserror`: Error handling
- `dirs`: Cross-platform directory paths
- `env_logger/log`: Logging infrastructure
</details>

---

## 🤝 Contributing

Contributions welcome! Please ensure tests pass before submitting PRs.

```bash
cargo build
cargo test
```

> [!TIP]
> Use `--verbose` to enable debug logging during development: `porter --verbose list`.
