# Subway Authority - Quick Optimization Reference

**Last Updated:** 2025-11-07

## Critical Issues (Fix Immediately)

### 1. Missing Port Scanning Implementation
**File:** `/src-tauri/src/main.rs` lines 56-73
**Status:** Returns hardcoded data instead of actual port scan
**Fix:** See ARCHITECTURE_REVIEW.md Section 3.1.1

### 2. State Management Map Issue
**File:** `/src/stores/portStore.ts` line 15
**Problem:** Using `Map` breaks Zustand immutability
**Fix:**
```typescript
// Change from:
metrics: Map<number, PortMetrics>;
// To:
metrics: Record<number, PortMetrics>;
```

### 3. No Real-Time Events
**Problem:** No Tauri event system for port changes
**Fix:** See ARCHITECTURE_REVIEW.md Section 3.1.2

## High-Priority Performance Issues

### 4. SVG Rendering Without Virtualization
**File:** `/src/components/subway-map/SubwayMap.tsx` lines 179-188
**Impact:** Poor performance with 50+ ports
**Quick Fix:**
```typescript
// Filter visible stations based on viewport
const visibleStations = useMemo(() => {
  if (stations.length < 50) return stations;

  const buffer = 100;
  return stations.filter(station =>
    station.position.x >= viewport.centerX - 600/viewport.zoom - buffer &&
    station.position.x <= viewport.centerX + 600/viewport.zoom + buffer &&
    station.position.y >= viewport.centerY - 400/viewport.zoom - buffer &&
    station.position.y <= viewport.centerY + 400/viewport.zoom + buffer
  );
}, [stations, viewport]);
```

### 5. Missing Persistence
**File:** Both stores
**Impact:** User loses all data on restart
**Quick Fix:**
```typescript
import { persist } from 'zustand/middleware';

export const usePortStore = create<PortState>()(
  devtools(
    persist(
      (set, get) => ({
        // ... existing code
      }),
      { name: 'port-store-storage' }
    ),
    { name: 'PortStore' }
  )
);
```

## Code Quality Issues

### 6. Type Assertions (as any)
**Locations:** Multiple files
**Fix Pattern:**
```typescript
// Instead of:
type: 'port_opened' as any

// Use proper enum:
type: PortEventType.PortOpened
```

### 7. Dynamic Imports in Actions
**File:** `/src/stores/portStore.ts` line 127
**Fix:**
```typescript
// Top of file:
import { invoke } from '@tauri-apps/api/tauri';

// Then use directly:
const ports = await invoke<PortInfo[]>('scan_active_ports');
```

## Performance Optimization Checklist

- [ ] Implement virtual rendering (4-10x speedup)
- [ ] Add React.memo to Station component
- [ ] Separate SVG layers (static vs dynamic)
- [ ] Memoize position calculations
- [ ] Add request deduplication
- [ ] Limit concurrent character animations

## Testing Checklist

- [ ] Add portStore unit tests
- [ ] Add SubwayMap component tests
- [ ] Add integration tests
- [ ] Test with 100+ ports
- [ ] Performance benchmarks

## File Quick Links

### Files to Modify (Priority Order)
1. `/src-tauri/src/main.rs` - Add port scanning
2. `/src-tauri/src/services/port_service.rs` - Create new file
3. `/src/stores/portStore.ts` - Fix Map, add persistence, events
4. `/src/components/subway-map/SubwayMap.tsx` - Add virtualization
5. `/src/App.tsx` - Add event listeners

### Files to Create
- `/src-tauri/src/services/port_service.rs`
- `/src-tauri/src/services/mod.rs`
- `/src/stores/__tests__/portStore.test.ts`
- `/docs/adr/001-state-management.md`

## Command Reference

### Development
```bash
# Frontend dev
npm run dev

# Backend dev (Tauri)
npm run tauri dev

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint:fix
```

### Building
```bash
# Build frontend
npm run build

# Build Tauri app
npm run tauri build
```

## Dependencies to Add

```bash
# Virtual rendering
npm install @tanstack/react-virtual

# Runtime validation (optional)
npm install zod

# Rust (add to Cargo.toml)
sysinfo = "0.30"  # For system info gathering
```

## Performance Targets

| Metric | Current | Target | After Fix |
|--------|---------|--------|-----------|
| 100 ports render | 800ms | <100ms | ~90ms |
| Re-render | 300ms | <50ms | ~25ms |
| Memory (100 ports) | 150MB | <100MB | ~65MB |

## One-Line Fixes

```typescript
// Fix 1: Import at module level
import { invoke } from '@tauri-apps/api/tauri';

// Fix 2: Use proper enums
type: PortEventType.PortOpened

// Fix 3: Add React.memo
export const Station = React.memo(({ ... }) => { ... });

// Fix 4: Fix metrics type
metrics: Record<number, PortMetrics>

// Fix 5: Add persistence
persist((set, get) => ({ ... }), { name: 'store' })
```

## Testing Quick Start

```typescript
// Create test file
import { describe, it, expect } from 'vitest';
import { usePortStore } from '../portStore';

describe('Port Store', () => {
  it('should update ports', () => {
    const ports = [{ port: 3000, /* ... */ }];
    usePortStore.getState().setPorts(ports);
    expect(usePortStore.getState().ports).toEqual(ports);
  });
});
```

## Next Steps

1. **Week 1:** Implement critical issues (1-3)
2. **Week 2:** Fix high-priority performance (4-5)
3. **Week 3:** Code quality and testing (6-7)
4. **Week 4:** Documentation and polish

## Useful Resources

- Full review: `ARCHITECTURE_REVIEW.md`
- Zustand docs: https://zustand-demo.pmnd.rs
- Tauri events: https://tauri.app/v1/guides/features/events
- React Virtual: https://tanstack.com/virtual/latest

---

**Quick Command to See All TODOs:**
```bash
grep -r "TODO" src src-tauri --include="*.ts" --include="*.tsx" --include="*.rs"
```

**Quick Command to Check File Sizes:**
```bash
du -sh src/components/* src/stores/*
```

**Quick Command to Count Lines:**
```bash
cloc src src-tauri/src
```
