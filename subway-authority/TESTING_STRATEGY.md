# Subway Authority - Comprehensive Testing Strategy

## Executive Summary

This document outlines a complete testing strategy for Subway Authority, covering unit tests, integration tests, E2E tests, visual regression tests, and performance testing. The goal is to achieve 80%+ code coverage with a balanced approach that provides confidence without excessive maintenance overhead.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Pyramid](#testing-pyramid)
3. [Testing Tools & Framework](#testing-tools--framework)
4. [Coverage Targets](#coverage-targets)
5. [Unit Testing Strategy](#unit-testing-strategy)
6. [Integration Testing Strategy](#integration-testing-strategy)
7. [E2E Testing Strategy](#e2e-testing-strategy)
8. [Visual Regression Testing](#visual-regression-testing)
9. [Performance Testing](#performance-testing)
10. [CI/CD Integration](#cicd-integration)
11. [Test Organization](#test-organization)
12. [Best Practices](#best-practices)

---

## Testing Philosophy

**Core Principles:**
- **Test behavior, not implementation** - Tests should validate user-facing functionality
- **Fast feedback loops** - Unit tests run in milliseconds, E2E tests complete in minutes
- **Maintainable tests** - Clear, DRY test code that's easy to update
- **Confidence over coverage** - Strategic testing of critical paths over 100% coverage
- **Test-driven development** - Write tests first for new features when practical

**Critical Testing Areas:**
1. Character state machine transitions (safety-critical for UX)
2. Port scanning and monitoring (core functionality)
3. Zustand store mutations (data integrity)
4. Tauri command integration (backend-frontend bridge)
5. Notification system (user alerts)

---

## Testing Pyramid

```
        /\
       /  \     E2E Tests (10%)
      /____\    - Critical user flows
     /      \   - Cross-platform validation
    /        \  Integration Tests (30%)
   /__________\ - Tauri commands + React
  /            \ - Store + Component integration
 /              \ Unit Tests (60%)
/________________\ - Pure functions, utilities
                   - Component logic
                   - State management
```

**Distribution:**
- **60% Unit Tests**: Fast, isolated, high coverage
- **30% Integration Tests**: Tauri + React, Store + Components
- **10% E2E Tests**: Critical user journeys, smoke tests

---

## Testing Tools & Framework

### Frontend Testing Stack

| Purpose | Tool | Rationale |
|---------|------|-----------|
| **Test Runner** | Vitest | Fast, Vite-native, excellent TypeScript support |
| **React Testing** | React Testing Library | User-centric testing, accessible queries |
| **Mocking** | Vitest (built-in) | Comprehensive mocking without extra dependencies |
| **Coverage** | V8 (Vitest) | Fast, accurate coverage reporting |
| **E2E** | Playwright | Cross-platform, reliable, great DX |
| **Visual Regression** | Percy / Playwright Screenshots | Visual consistency validation |
| **Performance** | Vitest + Chrome DevTools | Memory profiling, performance benchmarks |

### Backend Testing Stack (Rust/Tauri)

| Purpose | Tool | Rationale |
|---------|------|-----------|
| **Unit Tests** | Built-in Rust tests | Native, fast, integrated |
| **Integration** | `tauri::test` | Official Tauri testing utilities |
| **Mocking** | `mockall` | Powerful Rust mocking framework |

### CI/CD

- **GitHub Actions** - Free, integrated, cross-platform
- **Coverage Reporting** - Codecov or Coveralls
- **Performance Tracking** - GitHub Actions + artifact storage

---

## Coverage Targets

### Overall Targets
- **Total Coverage**: 80%+
- **Critical Paths**: 95%+
- **Utilities/Helpers**: 90%+
- **UI Components**: 75%+

### Per-Module Targets

| Module | Coverage Target | Rationale |
|--------|----------------|-----------|
| Character Store | 95% | Critical state management |
| Port Store | 95% | Core functionality |
| Character System | 85% | Complex UI logic |
| Subway Map | 75% | Visual component, harder to test |
| Notifications | 90% | User-facing alerts |
| Tauri Commands | 90% | Backend integration |
| Utilities | 95% | Pure functions, easy to test |

---

## Unit Testing Strategy

### What to Test

**Zustand Stores:**
- State mutations
- Action creators
- Selectors
- Derived state
- Event handlers

**Utilities & Helpers:**
- Character dialogue selection
- Animation state mapping
- Positioning calculations
- Type guards

**Component Logic:**
- Event handlers
- Conditional rendering
- Props validation
- State transformations

### What NOT to Test

- Third-party library internals
- CSS styling (use visual regression)
- Trivial getters/setters
- Type definitions

### Example: Character Store Tests

**File**: `src/stores/__tests__/characterStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCharacterStore } from '../characterStore';
import { WorkerMood, WorkerAction, WorkerRole } from '@types/Character';

describe('Character Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useCharacterStore());
    act(() => {
      result.current.workers = [];
      result.current.clearDialogueQueue();
    });
  });

  describe('Worker Management', () => {
    it('should add worker to store', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.addWorker({
          id: 'test-worker',
          name: 'Test Worker',
          role: WorkerRole.Conductor,
          position: { x: 100, y: 100 },
          mood: WorkerMood.Happy,
          currentAction: WorkerAction.Idle,
          dialogueQueue: [],
          personality: {
            enthusiasm: 80,
            patience: 70,
            chattiness: 90,
            professionalism: 85,
            quirks: [],
          },
          spriteVariant: 'conductor-blue-uniform',
        });
      });

      expect(result.current.workers).toHaveLength(1);
      expect(result.current.workers[0].id).toBe('test-worker');
    });

    it('should update worker mood', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.initializeWorkers();
      });

      const workerId = result.current.workers[0].id;

      act(() => {
        result.current.updateWorkerMood(workerId, WorkerMood.Frustrated);
      });

      const updatedWorker = result.current.workers.find(w => w.id === workerId);
      expect(updatedWorker?.mood).toBe(WorkerMood.Frustrated);
    });
  });

  describe('Dialogue System', () => {
    it('should queue dialogue when one is active', () => {
      const { result } = renderHook(() => useCharacterStore());

      const dialogue1 = {
        id: 'dialogue-1',
        workerId: 'worker-1',
        message: 'First message',
        duration: 3000,
        priority: 1,
        timestamp: new Date(),
      };

      const dialogue2 = {
        id: 'dialogue-2',
        workerId: 'worker-1',
        message: 'Second message',
        duration: 3000,
        priority: 1,
        timestamp: new Date(),
      };

      act(() => {
        result.current.triggerDialogue(dialogue1);
        result.current.triggerDialogue(dialogue2);
      });

      expect(result.current.activeDialogue?.id).toBe('dialogue-1');
      expect(result.current.dialogueQueue).toHaveLength(1);
      expect(result.current.dialogueQueue[0].id).toBe('dialogue-2');
    });

    it('should advance to next dialogue on dismiss', () => {
      const { result } = renderHook(() => useCharacterStore());

      const dialogue1 = { id: 'dialogue-1', workerId: 'worker-1', message: 'First', duration: 3000, priority: 1, timestamp: new Date() };
      const dialogue2 = { id: 'dialogue-2', workerId: 'worker-1', message: 'Second', duration: 3000, priority: 1, timestamp: new Date() };

      act(() => {
        result.current.triggerDialogue(dialogue1);
        result.current.triggerDialogue(dialogue2);
      });

      act(() => {
        result.current.dismissDialogue();
      });

      expect(result.current.activeDialogue?.id).toBe('dialogue-2');
      expect(result.current.dialogueQueue).toHaveLength(0);
    });
  });

  describe('Port Event Handling', () => {
    it('should update worker mood on port opening', async () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.initializeWorkers();
      });

      const initialWorker = result.current.workers[0];

      act(() => {
        result.current.handlePortEvent(3000, 'port_opened');
      });

      // Should trigger dialogue
      expect(result.current.activeDialogue).toBeDefined();
      expect(result.current.activeDialogue?.message).toContain('3000');
    });

    it('should set frustrated mood on health warning', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.initializeWorkers();
      });

      const workerId = result.current.workers[0].id;

      act(() => {
        result.current.handlePortEvent(8080, 'health_warning');
      });

      const worker = result.current.workers.find(w => w.id === workerId);
      expect(worker?.mood).toBe(WorkerMood.Frustrated);

      jest.useRealTimers();
    });
  });

  describe('Selectors', () => {
    it('should filter workers by role', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.initializeWorkers();
      });

      const conductors = result.current.workers.filter(
        w => w.role === WorkerRole.Conductor
      );

      expect(conductors).toHaveLength(1);
      expect(conductors[0].name).toBe('Tony');
    });
  });
});
```

---

## Integration Testing Strategy

### Scope

Integration tests verify interactions between:
1. **Tauri Commands + React Components**
2. **Zustand Stores + React Components**
3. **Multiple Components working together**
4. **Event system + State updates**

### Key Integration Points

**1. Tauri Command Integration:**
- Port scanning → Store updates → UI rendering
- Mapping creation → Backend call → Success notification
- System tray events → Window state changes

**2. Store + Component Integration:**
- Character state changes → Animation updates
- Port events → Character reactions → Dialogue display
- User actions → Store mutations → UI updates

**3. Multi-Component Flows:**
- Subway map interactions → Station selection → Port details
- Character dialogue → Mood animation → Sprite updates
- Notification triggers → Toast display → Auto-dismiss

### Example: Tauri Command Integration Test

**File**: `src/__tests__/integration/port-scanning.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { invoke } from '@tauri-apps/api/tauri';
import App from '@/App';

// Mock Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

describe('Port Scanning Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should scan ports and update UI', async () => {
    const mockPorts = [
      { port: 3000, service_name: 'api-server', status: 'Healthy' },
      { port: 8080, service_name: 'web-app', status: 'Healthy' },
    ];

    vi.mocked(invoke).mockResolvedValueOnce(mockPorts);

    render(<App />);

    const scanButton = screen.getByRole('button', { name: /scan ports/i });
    await userEvent.click(scanButton);

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('scan_active_ports');
    });

    await waitFor(() => {
      expect(screen.getByText(/3000/)).toBeInTheDocument();
      expect(screen.getByText(/8080/)).toBeInTheDocument();
    });
  });

  it('should handle port scanning errors gracefully', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Port scan failed'));

    render(<App />);

    const scanButton = screen.getByRole('button', { name: /scan ports/i });
    await userEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText(/port scan failed/i)).toBeInTheDocument();
    });
  });

  it('should create port mapping and show notification', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    render(<App />);

    const subdomainInput = screen.getByLabelText(/subdomain/i);
    const portInput = screen.getByLabelText(/port number/i);
    const createButton = screen.getByRole('button', { name: /create mapping/i });

    await userEvent.type(subdomainInput, 'api');
    await userEvent.type(portInput, '3000');
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('create_port_mapping', {
        subdomain: 'api',
        port: 3000,
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/mapping created/i)).toBeInTheDocument();
    });
  });
});
```

### Example: Store + Component Integration

**File**: `src/components/__tests__/integration/CharacterSystem.integration.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { CharacterSystem } from '@components/characters/CharacterSystem';
import { useCharacterStore } from '@stores/characterStore';
import { WorkerMood } from '@types/Character';

describe('Character System Integration', () => {
  beforeEach(() => {
    const store = useCharacterStore.getState();
    act(() => {
      store.clearDialogueQueue();
      store.initializeWorkers();
    });
  });

  it('should display character dialogue when port event occurs', async () => {
    render(<CharacterSystem />);

    act(() => {
      useCharacterStore.getState().handlePortEvent(3000, 'port_opened');
    });

    await waitFor(() => {
      const dialogue = screen.queryByRole('dialog');
      expect(dialogue).toBeInTheDocument();
      expect(dialogue).toHaveTextContent(/port 3000/i);
    });
  });

  it('should update character animation based on mood', async () => {
    render(<CharacterSystem />);

    const store = useCharacterStore.getState();
    const workerId = store.workers[0].id;

    act(() => {
      store.updateWorkerMood(workerId, WorkerMood.Frustrated);
    });

    await waitFor(() => {
      const character = screen.getByTestId(`character-${workerId}`);
      expect(character).toHaveClass('animation-fixing');
    });
  });

  it('should auto-dismiss dialogue after duration', async () => {
    vi.useFakeTimers();

    render(<CharacterSystem />);

    act(() => {
      useCharacterStore.getState().handlePortEvent(8080, 'port_closed');
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeInTheDocument();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
```

---

## E2E Testing Strategy

### Critical User Flows

**Priority 1 (Must Test):**
1. **Application Launch** - App starts, tray icon appears
2. **Port Scanning** - User scans ports, sees results
3. **Create Mapping** - User creates subdomain mapping successfully
4. **Character Interaction** - Characters react to port events
5. **Notification System** - Notifications appear and dismiss

**Priority 2 (Should Test):**
6. **Subway Map Navigation** - Click stations, view port details
7. **Settings Management** - Toggle characters, sound, preferences
8. **System Tray Actions** - Tray menu interactions
9. **Multi-window Management** - Hide/show window behavior

**Priority 3 (Nice to Test):**
10. **Performance Monitoring** - Long-running stability
11. **Cross-platform Consistency** - macOS/Windows/Linux parity

### Tool Selection: Playwright

**Why Playwright:**
- ✅ Cross-platform (macOS, Windows, Linux)
- ✅ Tauri-compatible (Chromium-based)
- ✅ Built-in video recording, screenshots
- ✅ Network interception for Tauri API mocking
- ✅ Fast, reliable, parallel execution

### Example: Critical Flow E2E Test

**File**: `tests/e2e/port-management.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

test.describe('Port Management Flow', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../src-tauri/target/release/subway-authority')],
    });

    window = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should complete full port scanning workflow', async () => {
    // Wait for app to load
    await window.waitForSelector('[data-testid="subway-map"]', { timeout: 10000 });

    // Navigate to port management
    await window.click('[data-testid="nav-ports"]');

    // Click scan ports button
    await window.click('[data-testid="scan-ports-btn"]');

    // Wait for scanning to complete
    await window.waitForSelector('[data-testid="scan-complete"]', { timeout: 5000 });

    // Verify ports are displayed
    const portElements = await window.$$('[data-testid^="port-"]');
    expect(portElements.length).toBeGreaterThan(0);

    // Verify character dialogue appears
    const dialogue = await window.waitForSelector('[data-testid="character-dialogue"]', { timeout: 3000 });
    expect(await dialogue.textContent()).toContain('port');
  });

  test('should create port mapping successfully', async () => {
    await window.waitForSelector('[data-testid="create-mapping-btn"]');

    // Fill in mapping form
    await window.fill('[data-testid="subdomain-input"]', 'api');
    await window.fill('[data-testid="port-input"]', '3000');

    // Submit form
    await window.click('[data-testid="create-mapping-btn"]');

    // Wait for success notification
    const notification = await window.waitForSelector('[data-testid="notification"]', { timeout: 5000 });
    expect(await notification.textContent()).toContain('mapping created');

    // Verify mapping appears in list
    const mapping = await window.waitForSelector('[data-testid="mapping-api-3000"]');
    expect(mapping).toBeTruthy();
  });

  test('should display character animations', async () => {
    // Trigger port event
    await window.click('[data-testid="scan-ports-btn"]');

    // Wait for character to appear
    const character = await window.waitForSelector('[data-testid^="character-"]', { timeout: 3000 });

    // Verify animation class is applied
    const classList = await character.getAttribute('class');
    expect(classList).toMatch(/animation-/);
  });
});
```

### E2E Test Organization

```
tests/
├── e2e/
│   ├── setup/
│   │   ├── global-setup.ts       # Install app, setup test env
│   │   └── global-teardown.ts    # Cleanup
│   ├── fixtures/
│   │   ├── app.ts                # App launching fixture
│   │   └── mock-data.ts          # Test data
│   ├── critical/
│   │   ├── app-launch.spec.ts
│   │   ├── port-management.spec.ts
│   │   └── character-system.spec.ts
│   ├── integration/
│   │   ├── subway-map.spec.ts
│   │   ├── notifications.spec.ts
│   │   └── settings.spec.ts
│   └── smoke/
│       └── basic-functionality.spec.ts
└── playwright.config.ts
```

---

## Visual Regression Testing

### Strategy

**Tools:**
- **Option 1**: Percy (cloud-based, CI-friendly)
- **Option 2**: Playwright Screenshots (self-hosted, free)

**Components to Test:**
1. Character sprites and animations
2. Subway map layout
3. Notification cards
4. Dialogue bubbles
5. System tray menu

### Example: Visual Regression with Playwright

**File**: `tests/visual/character-sprites.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Character Visual Regression', () => {
  test('conductor sprite - happy mood', async ({ page }) => {
    await page.goto('http://localhost:1420/character-showcase');

    await page.click('[data-testid="conductor-happy"]');

    await expect(page).toHaveScreenshot('conductor-happy.png', {
      maxDiffPixels: 100,
    });
  });

  test('station master sprite - frustrated mood', async ({ page }) => {
    await page.goto('http://localhost:1420/character-showcase');

    await page.click('[data-testid="station-master-frustrated"]');

    await expect(page).toHaveScreenshot('station-master-frustrated.png', {
      maxDiffPixels: 100,
    });
  });

  test('dialogue bubble rendering', async ({ page }) => {
    await page.goto('http://localhost:1420/character-showcase');

    await page.click('[data-testid="show-dialogue"]');

    const dialogue = page.locator('[data-testid="dialogue-bubble"]');
    await expect(dialogue).toHaveScreenshot('dialogue-bubble.png');
  });
});
```

---

## Performance Testing

### Metrics to Track

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **App Launch Time** | < 2s | < 5s |
| **Port Scan Duration** | < 1s | < 3s |
| **Character Animation FPS** | 60 fps | > 30 fps |
| **Memory Usage (Idle)** | < 150 MB | < 300 MB |
| **Memory Usage (Active)** | < 250 MB | < 500 MB |
| **Store Update Latency** | < 16ms | < 50ms |

### Performance Test Examples

**File**: `tests/performance/character-system.perf.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCharacterStore } from '@stores/characterStore';

describe('Character System Performance', () => {
  it('should handle 1000 dialogue updates in < 100ms', () => {
    const { result } = renderHook(() => useCharacterStore());

    act(() => {
      result.current.initializeWorkers();
    });

    const startTime = performance.now();

    act(() => {
      for (let i = 0; i < 1000; i++) {
        result.current.handlePortEvent(3000 + i, 'port_opened');
      }
    });

    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(100);
  });

  it('should not leak memory with repeated worker updates', () => {
    const { result } = renderHook(() => useCharacterStore());

    act(() => {
      result.current.initializeWorkers();
    });

    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    act(() => {
      for (let i = 0; i < 10000; i++) {
        const workerId = result.current.workers[0].id;
        result.current.updateWorkerMood(workerId, i % 2 === 0 ? 'happy' : 'frustrated');
      }
    });

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be < 10 MB
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

**File**: `tests/performance/benchmark.test.ts`

```typescript
import { describe, bench } from 'vitest';
import { selectDialogue } from '@components/characters/character-dialogue';
import { CharacterType, CharacterMood } from '@types/character-types';

describe('Dialogue Selection Benchmark', () => {
  const context = {
    portHealth: 'HEALTHY',
    portStatus: 'ACTIVE',
    hasConflicts: false,
    hasVulnerabilities: false,
    routingWorking: true,
    configValid: true,
  };

  bench('selectDialogue - happy mood', () => {
    selectDialogue(CharacterType.TRANSIT_CONDUCTOR, CharacterMood.HAPPY, context);
  });

  bench('selectDialogue - angry mood', () => {
    selectDialogue(CharacterType.STATION_MASTER, CharacterMood.ANGRY, {
      ...context,
      portHealth: 'CRITICAL',
    });
  });
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    name: Unit & Integration Tests
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unit-tests-${{ matrix.os }}

  e2e-tests:
    name: E2E Tests
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          override: true

      - name: Build Tauri app
        run: npm run tauri build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-artifacts-${{ matrix.os }}
          path: |
            tests/e2e/screenshots/
            tests/e2e/videos/

  visual-regression:
    name: Visual Regression Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run visual tests
        run: npm run test:visual

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: visual-regression-diffs
          path: tests/visual/__screenshots__/

  performance:
    name: Performance Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run performance tests
        run: npm run test:perf

      - name: Upload benchmark results
        uses: actions/upload-artifact@v3
        with:
          name: performance-benchmarks
          path: tests/performance/results/
```

---

## Test Organization

### Directory Structure

```
subway-authority/
├── src/
│   ├── components/
│   │   └── __tests__/
│   │       ├── unit/
│   │       │   ├── CharacterSprite.test.tsx
│   │       │   ├── DialogueBubble.test.tsx
│   │       │   └── MTANotificationCard.test.tsx
│   │       └── integration/
│   │           ├── CharacterSystem.integration.test.tsx
│   │           └── SubwayMap.integration.test.tsx
│   ├── stores/
│   │   └── __tests__/
│   │       ├── characterStore.test.ts
│   │       └── portStore.test.ts
│   └── utils/
│       └── __tests__/
│           ├── character-dialogue.test.ts
│           └── character-animations.test.ts
├── tests/
│   ├── e2e/
│   │   ├── setup/
│   │   ├── fixtures/
│   │   ├── critical/
│   │   └── smoke/
│   ├── visual/
│   │   ├── character-sprites.spec.ts
│   │   └── ui-components.spec.ts
│   └── performance/
│       ├── character-system.perf.test.ts
│       └── benchmark.test.ts
├── src-tauri/
│   └── src/
│       ├── lib.rs
│       ├── main.rs
│       └── tests/
│           ├── commands.rs
│           ├── notification_service.rs
│           └── system_tray.rs
├── vitest.config.ts
├── playwright.config.ts
└── .github/
    └── workflows/
        ├── test.yml
        └── visual-regression.yml
```

---

## Best Practices

### 1. Test Naming Conventions

```typescript
describe('ComponentName', () => {
  describe('Feature/Behavior', () => {
    it('should do something when condition', () => {
      // Test implementation
    });
  });
});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should add worker to store', () => {
  // Arrange
  const { result } = renderHook(() => useCharacterStore());
  const newWorker = createTestWorker();

  // Act
  act(() => {
    result.current.addWorker(newWorker);
  });

  // Assert
  expect(result.current.workers).toHaveLength(1);
});
```

### 3. Test Data Factories

**File**: `tests/factories/character.factory.ts`

```typescript
import { SubwayWorker, WorkerRole, WorkerMood } from '@types/Character';

export const createTestWorker = (overrides?: Partial<SubwayWorker>): SubwayWorker => ({
  id: `test-worker-${Date.now()}`,
  name: 'Test Worker',
  role: WorkerRole.Conductor,
  position: { x: 100, y: 100 },
  mood: WorkerMood.Neutral,
  currentAction: 'idle',
  dialogueQueue: [],
  personality: {
    enthusiasm: 80,
    patience: 70,
    chattiness: 90,
    professionalism: 85,
    quirks: [],
  },
  spriteVariant: 'conductor-blue-uniform',
  ...overrides,
});
```

### 4. Custom Test Utilities

**File**: `tests/utils/test-utils.tsx`

```typescript
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

interface AllTheProvidersProps {
  children: ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 5. Async Testing Best Practices

```typescript
// ✅ Good - Using waitFor
it('should display dialogue after port event', async () => {
  render(<CharacterSystem />);

  act(() => {
    useCharacterStore.getState().handlePortEvent(3000, 'port_opened');
  });

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// ❌ Bad - Using arbitrary delays
it('should display dialogue after port event', async () => {
  render(<CharacterSystem />);

  act(() => {
    useCharacterStore.getState().handlePortEvent(3000, 'port_opened');
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

### 6. Mocking Tauri APIs

**File**: `tests/mocks/tauri.ts`

```typescript
import { vi } from 'vitest';

export const mockTauriInvoke = (commandResults: Record<string, any>) => {
  const invoke = vi.fn((command: string, args?: any) => {
    if (commandResults[command]) {
      return Promise.resolve(commandResults[command]);
    }
    return Promise.reject(new Error(`Unmocked command: ${command}`));
  });

  vi.mock('@tauri-apps/api/tauri', () => ({
    invoke,
  }));

  return invoke;
};
```

---

## Next Steps

### Phase 1: Foundation (Week 1)
- ✅ Configure Vitest with coverage
- ✅ Setup test utilities and factories
- ✅ Write unit tests for stores (80%+ coverage)
- ✅ Write unit tests for utilities (90%+ coverage)

### Phase 2: Component Testing (Week 2)
- ⬜ Write component unit tests
- ⬜ Write integration tests for critical paths
- ⬜ Setup Playwright for E2E testing
- ⬜ Write 3-5 critical flow E2E tests

### Phase 3: Advanced Testing (Week 3)
- ⬜ Setup visual regression testing
- ⬜ Implement performance benchmarks
- ⬜ Configure CI/CD pipeline
- ⬜ Document testing guidelines

### Phase 4: Maintenance (Ongoing)
- ⬜ Monitor coverage metrics
- ⬜ Update tests with new features
- ⬜ Refactor flaky tests
- ⬜ Review and optimize test suite performance

---

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
