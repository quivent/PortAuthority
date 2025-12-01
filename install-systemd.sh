#!/bin/bash
################################################################################
# Port Authority - Systemd Service Installation Script
################################################################################

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║  Port Authority - Systemd Service Installation    ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script requires sudo privileges"
    echo "   Run with: sudo bash install-systemd.sh"
    exit 1
fi

# Stop the manually started service if running
echo "🔧 Checking for manually started Port Authority..."
pkill -f "node.*service/index.js" || true
echo "✅ Manual processes stopped"
echo ""

# Copy service file
echo "📋 Installing systemd service file..."
cp /home/alice/PortAuthority/port-authority.service /etc/systemd/system/
echo "✅ Service file installed to /etc/systemd/system/"
echo ""

# Reload systemd
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload
echo "✅ Systemd daemon reloaded"
echo ""

# Enable service (start on boot)
echo "🚀 Enabling Port Authority to start on boot..."
systemctl enable port-authority
echo "✅ Service enabled"
echo ""

# Start service now
echo "▶️  Starting Port Authority service..."
systemctl start port-authority
echo "✅ Service started"
echo ""

# Check status
echo "📊 Service Status:"
systemctl status port-authority --no-pager
echo ""

echo "╔════════════════════════════════════════════════════╗"
echo "║  ✅ Port Authority Installation Complete!         ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status port-authority    # Check status"
echo "  sudo systemctl stop port-authority      # Stop service"
echo "  sudo systemctl restart port-authority   # Restart service"
echo "  sudo journalctl -u port-authority -f   # View logs"
echo ""
