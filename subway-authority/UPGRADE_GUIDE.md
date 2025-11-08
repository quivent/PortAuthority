# Subway Authority - Quick Upgrade Guide

**Generated:** 2025-11-07

This is a quick reference for implementing the technology validation recommendations. See `TECH_VALIDATION_REPORT.md` for detailed analysis.

---

## Immediate Upgrades (Do This Week)

### 1. Frontend Dependencies

```bash
cd /Users/joshkornreich/Documents/Projects/CLIs/port-authority/subway-authority

# Update React to stable bridge version (18.3.1)
npm install react@18.3.1 react-dom@18.3.1

# Update state management
npm install zustand@4.5.7

# Update animation library
npm install framer-motion@10.18.0

# Update Tauri API
npm install @tauri-apps/api@1.6.0

# Update utilities
npm install clsx@2.1.1

# Install all dependencies
npm install
```

**Time:** 15 minutes
**Risk:** Very Low (patch/minor versions)
**Testing:** Run `npm run dev` and verify app works

### 2. Rust Security Updates

```bash
cd /Users/joshkornreich/Documents/Projects/CLIs/port-authority/subway-authority/src-tauri

# Update security-critical dependencies
cargo update tokio
cargo update chrono

# Verify updates
cargo build
cargo test
```

**Time:** 10 minutes
**Risk:** Very Low (security patches)
**Testing:** Build and run app

### 3. Vite Configuration Updates

Add to `/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 1420,
    strictPort: true,
    clearScreen: false, // ← ADD THIS: Don't obscure Rust errors
  },

  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 600, // ← ADD THIS: Desktop-appropriate
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'animation-vendor': ['framer-motion'],
          'state-vendor': ['zustand'],
        },
      },
      treeshake: { // ← ADD THIS: Enhanced tree-shaking
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@services': path.resolve(__dirname, './src/services'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'framer-motion'],
  },

  envPrefix: 'SUBWAY_',
});
```

**Time:** 5 minutes
**Risk:** Very Low
**Testing:** Run `npm run build` and verify output

---

## Verification Steps

After completing immediate upgrades:

```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Type check
npm run type-check

# 3. Lint
npm run lint

# 4. Build production
npm run build

# 5. Run development server
npm run dev

# 6. Manual testing
# - Launch app
# - Test port operations
# - Test animations
# - Test system tray
# - Test notifications
```

---

## Next Steps (2-3 Months)

### Zustand 5.0 Migration

**When:** After immediate updates are stable

```bash
npm install zustand@5.0.8
```

**Breaking Changes:** Review at https://github.com/pmndrs/zustand/releases/tag/v5.0.0

**Testing:**
- Test all state mutations
- Verify TypeScript types
- Test persistence (if used)
- Test middleware (if used)

**Effort:** 1-2 days

### Tauri 2.0 Migration

**When:** After Zustand 5.0 (or in parallel on separate branch)

**Preparation:**
1. Read migration guide: https://v2.tauri.app/start/migrate/from-tauri-1/
2. Create migration branch: `git checkout -b feature/tauri-2.0`
3. Install Tauri 2.0 CLI: `cargo install tauri-cli@^2.0`

**Migration:**
```bash
# Update Cargo.toml
cd src-tauri

# Change tauri version
# tauri = { version = "1.4", ... }
# TO:
# tauri = { version = "2.0", ... }

# Run migration tool (if available)
cargo tauri migrate

# Update build dependencies
cargo update

# Test build
cargo tauri build
```

**Breaking Changes:**
- Permissions system (replaces allowlist)
- Plugin system changes
- API updates
- Configuration changes

**Testing Plan:**
1. Test all Tauri commands
2. Test IPC communication
3. Test system tray
4. Test notifications
5. Test file operations
6. Cross-platform testing (Windows, macOS, Linux)
7. Performance benchmarking

**Effort:** 2-3 weeks

---

## Optional Upgrades (Evaluate Based on Needs)

### Motion One Migration (Optional)

**Only if:**
- Animation performance becomes bottleneck
- Bundle size is critical
- Team agrees to imperative API

**Install:**
```bash
npm install motion
npm uninstall framer-motion
```

**Update Vite Config:**
```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'animation-vendor': ['motion'], // ← Changed
  'state-vendor': ['zustand'],
},
```

**Code Migration:**
```typescript
// Before (Framer Motion)
import { motion } from 'framer-motion';
<motion.div animate={{ x: 100 }} />

// After (Motion One)
import { animate } from 'motion';
useEffect(() => {
  animate(ref.current, { x: 100 });
}, []);
```

**Effort:** 2-3 weeks (depending on animation count)

### React 19 Migration (2026)

**Wait until:** Mid-2026 (ecosystem maturity)

**Preparation:**
- Monitor React 19 adoption
- Check library compatibility
- Review codemods

**Install (when ready):**
```bash
npm install react@19 react-dom@19
```

**Effort:** 1-2 weeks

---

## Installation Cheat Sheet

### Quick Update All (Immediate)

```bash
#!/bin/bash
# Save as: upgrade-immediate.sh

cd "$(dirname "$0")"

echo "Updating frontend dependencies..."
npm install react@18.3.1 react-dom@18.3.1 zustand@4.5.7 \
  framer-motion@10.18.0 @tauri-apps/api@1.6.0 clsx@2.1.1

echo "Updating Rust dependencies..."
cd src-tauri
cargo update tokio
cargo update chrono

echo "Testing build..."
cargo build

echo "Done! Run 'npm run dev' to test."
```

**Usage:**
```bash
chmod +x upgrade-immediate.sh
./upgrade-immediate.sh
```

---

## Rollback Plan

If issues arise after upgrades:

### Frontend Rollback

```bash
# Revert package.json changes
git checkout package.json package-lock.json

# Reinstall old versions
npm install
```

### Rust Rollback

```bash
# Revert Cargo changes
cd src-tauri
git checkout Cargo.toml Cargo.lock

# Rebuild
cargo build
```

### Complete Rollback

```bash
# Revert all changes
git reset --hard HEAD

# Reinstall dependencies
npm install
cd src-tauri && cargo build
```

---

## Dependency Version Reference

### Current Versions (Before Upgrade)

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "zustand": "^4.4.7",
  "framer-motion": "^10.16.16",
  "@tauri-apps/api": "^1.5.3",
  "clsx": "^2.0.0"
}
```

### Recommended Versions (After Immediate Upgrade)

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "zustand": "^4.5.7",
  "framer-motion": "^10.18.0",
  "@tauri-apps/api": "^1.6.0",
  "clsx": "^2.1.1"
}
```

### Future Versions (Strategic Upgrades)

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "zustand": "^5.0.8",
  "framer-motion": "^12.23.24",
  "@tauri-apps/api": "^2.0.0"
}
```

---

## Security Audit Commands

### Install Security Tools

```bash
# Rust
cargo install cargo-audit

# npm (built-in)
npm audit
```

### Run Security Audits

```bash
# Frontend
npm audit
npm audit fix

# Backend
cd src-tauri
cargo audit
cargo audit fix
```

### Automated Security Checks (CI/CD)

Add to GitHub Actions workflow:

```yaml
- name: Security Audit (npm)
  run: npm audit --production

- name: Security Audit (Cargo)
  run: |
    cargo install cargo-audit
    cd src-tauri
    cargo audit
```

---

## Support & Resources

**Questions or Issues?**
- See full report: `TECH_VALIDATION_REPORT.md`
- React docs: https://react.dev
- Zustand docs: https://zustand.docs.pmnd.rs
- Tauri docs: https://v2.tauri.app
- Vite docs: https://vite.dev

**Performance Issues?**
- Run Chrome DevTools Profiler
- Check bundle size: https://bundlephobia.com
- Review `TECH_VALIDATION_REPORT.md` Section 10

**Security Concerns?**
- Run `npm audit` and `cargo audit`
- Review `TECH_VALIDATION_REPORT.md` Section 5
- Check RustSec: https://rustsec.org

---

**Last Updated:** 2025-11-07
**Next Review:** After completing immediate upgrades
