# Port Authority Systemd Setup

## Automatic Installation

Run the installation script:

```bash
cd /home/alice/PortAuthority
sudo bash install-systemd.sh
```

This will:
1. Stop any manually running Port Authority processes
2. Install the systemd service file
3. Enable Port Authority to start on boot
4. Start the service immediately
5. Show the service status

## Manual Installation

If you prefer to install manually:

```bash
# 1. Copy service file
sudo cp /home/alice/PortAuthority/port-authority.service /etc/systemd/system/

# 2. Reload systemd
sudo systemctl daemon-reload

# 3. Enable service (start on boot)
sudo systemctl enable port-authority

# 4. Start service now
sudo systemctl start port-authority

# 5. Check status
sudo systemctl status port-authority
```

## Systemd Commands

### Check Service Status

```bash
sudo systemctl status port-authority
```

### View Logs

```bash
# Real-time logs
sudo journalctl -u port-authority -f

# Last 100 lines
sudo journalctl -u port-authority -n 100

# Logs since boot
sudo journalctl -u port-authority -b
```

### Control Service

```bash
# Start
sudo systemctl start port-authority

# Stop
sudo systemctl stop port-authority

# Restart
sudo systemctl restart port-authority

# Reload configuration
sudo systemctl daemon-reload
sudo systemctl restart port-authority
```

### Enable/Disable Auto-Start

```bash
# Enable (start on boot)
sudo systemctl enable port-authority

# Disable (don't start on boot)
sudo systemctl disable port-authority

# Check if enabled
systemctl is-enabled port-authority
```

## Verify Installation

After installation, verify Port Authority is running:

```bash
# Check systemd status
sudo systemctl status port-authority

# Check with portauth CLI
portauth health

# Check with curl
curl http://localhost:9999/health
```

Expected output from `portauth health`:
```
✅ Port Authority is healthy
Uptime: XXs
Allocations: X
```

## Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u port-authority -n 50

# Check if port 9999 is already in use
lsof -i :9999

# Try starting manually to see errors
cd /home/alice/PortAuthority
node service/index.js
```

### Service keeps restarting

```bash
# View real-time logs
sudo journalctl -u port-authority -f

# Check for errors in the last restart
sudo journalctl -u port-authority -n 100
```

### Can't connect to Port Authority

```bash
# Check if service is running
sudo systemctl status port-authority

# Check firewall (if applicable)
sudo ufw status

# Test connection
curl -v http://localhost:9999/health
```

## Uninstall

To remove Port Authority systemd service:

```bash
# Stop and disable
sudo systemctl stop port-authority
sudo systemctl disable port-authority

# Remove service file
sudo rm /etc/systemd/system/port-authority.service

# Reload daemon
sudo systemctl daemon-reload
```

## Security Notes

The service runs with:
- User: `alice`
- Group: `alice`
- NoNewPrivileges: `true`
- PrivateTmp: `true`

These settings provide basic security isolation.
