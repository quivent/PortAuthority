#!/bin/bash
# Subway Authority - Immediate Dependency Upgrade Script
# Generated: 2025-11-07
#
# This script performs low-risk security and stability updates
# to React, Zustand, Framer Motion, Tauri API, and Rust dependencies.
#
# Total time: ~15 minutes
# Risk level: Very Low (patch/minor version updates)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Subway Authority - Immediate Upgrades${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Confirmation
echo -e "${YELLOW}This will upgrade:${NC}"
echo "  - React 18.2.0 → 18.3.1"
echo "  - Zustand 4.4.7 → 4.5.7"
echo "  - Framer Motion 10.16.16 → 10.18.0"
echo "  - @tauri-apps/api 1.5.3 → 1.6.0"
echo "  - clsx 2.0.0 → 2.1.1"
echo "  - Rust: tokio, chrono (security updates)"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Upgrade cancelled${NC}"
    exit 0
fi

echo ""

# Step 1: Backup current state
echo -e "${BLUE}[1/6] Creating backup...${NC}"
BACKUP_DIR="${SCRIPT_DIR}/.upgrade-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
cp src-tauri/Cargo.toml "$BACKUP_DIR/" 2>/dev/null || true
cp src-tauri/Cargo.lock "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}✓ Backup created: $BACKUP_DIR${NC}"
echo ""

# Step 2: Update frontend dependencies
echo -e "${BLUE}[2/6] Updating frontend dependencies...${NC}"
cd "$SCRIPT_DIR"

npm install \
  react@18.3.1 \
  react-dom@18.3.1 \
  zustand@4.5.7 \
  framer-motion@10.18.0 \
  @tauri-apps/api@1.6.0 \
  clsx@2.1.1

echo -e "${GREEN}✓ Frontend dependencies updated${NC}"
echo ""

# Step 3: Update Rust dependencies
echo -e "${BLUE}[3/6] Updating Rust dependencies (security)...${NC}"
cd "$SCRIPT_DIR/src-tauri"

# Update specific security-critical packages
cargo update tokio
cargo update chrono

echo -e "${GREEN}✓ Rust dependencies updated${NC}"
echo ""

# Step 4: Test Rust build
echo -e "${BLUE}[4/6] Testing Rust build...${NC}"
cargo build --release

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Rust build successful${NC}"
else
    echo -e "${RED}✗ Rust build failed${NC}"
    echo -e "${YELLOW}Rolling back Rust dependencies...${NC}"
    cp "$BACKUP_DIR/Cargo.toml" .
    cp "$BACKUP_DIR/Cargo.lock" .
    cargo build --release
    exit 1
fi
echo ""

# Step 5: Type check
echo -e "${BLUE}[5/6] Running TypeScript type check...${NC}"
cd "$SCRIPT_DIR"
npm run type-check

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Type check passed${NC}"
else
    echo -e "${YELLOW}⚠ Type check warnings (review manually)${NC}"
fi
echo ""

# Step 6: Build production bundle
echo -e "${BLUE}[6/6] Building production bundle (test)...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Production build successful${NC}"
else
    echo -e "${RED}✗ Production build failed${NC}"
    echo -e "${YELLOW}Review errors above. Backup available at: $BACKUP_DIR${NC}"
    exit 1
fi
echo ""

# Success summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All upgrades completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${BLUE}Updated versions:${NC}"
echo "  ✓ React 18.3.1"
echo "  ✓ Zustand 4.5.7"
echo "  ✓ Framer Motion 10.18.0"
echo "  ✓ @tauri-apps/api 1.6.0"
echo "  ✓ clsx 2.1.1"
echo "  ✓ Rust dependencies (tokio, chrono)"
echo ""

echo -e "${BLUE}Next steps:${NC}"
echo "  1. Test the app: npm run dev"
echo "  2. Manual testing:"
echo "     - Launch app and verify UI"
echo "     - Test port operations"
echo "     - Test animations"
echo "     - Test system tray/notifications"
echo "  3. Commit changes: git add . && git commit -m 'chore: upgrade dependencies (security & stability)'"
echo ""

echo -e "${YELLOW}Backup location (in case of issues):${NC}"
echo "  $BACKUP_DIR"
echo ""

echo -e "${BLUE}To rollback if needed:${NC}"
echo "  cp $BACKUP_DIR/package.json ."
echo "  cp $BACKUP_DIR/package-lock.json ."
echo "  npm install"
echo "  cp $BACKUP_DIR/Cargo.toml src-tauri/"
echo "  cp $BACKUP_DIR/Cargo.lock src-tauri/"
echo "  cd src-tauri && cargo build"
echo ""

echo -e "${GREEN}See TECH_VALIDATION_REPORT.md for full analysis${NC}"
echo -e "${GREEN}See UPGRADE_GUIDE.md for next steps (Zustand 5.0, Tauri 2.0)${NC}"
