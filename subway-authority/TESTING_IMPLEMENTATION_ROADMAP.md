# Testing Implementation Roadmap

A phased approach to implementing comprehensive testing for Subway Authority.

## Phase 1: Foundation (Week 1) ✓

**Goal**: Set up testing infrastructure and tooling

### Tasks

- [x] Install testing dependencies
  ```bash
  npm install --save-dev \
    vitest @vitest/ui @vitest/coverage-v8 \
    @testing-library/react @testing-library/user-event @testing-library/jest-dom \
    @playwright/test \
    jsdom
  ```

- [x] Configure Vitest (`vitest.config.ts`)
  - Set up test environment (jsdom)
  - Configure coverage thresholds
  - Set up path aliases
  - Configure reporters

- [x] Configure Playwright (`playwright.config.ts`)
  - Set up browser projects
  - Configure timeouts and retries
  - Set up screenshot/video capture
  - Configure global setup/teardown

- [x] Create test utilities (`tests/utils/test-utils.tsx`)
  - Custom render function
  - Tauri API mocking utilities
  - Async helpers
  - Test event utilities

- [x] Create test data factories
  - Character factory (`tests/factories/character.factory.ts`)
  - Port factory (`tests/factories/port.factory.ts`)

- [x] Set up global test configuration
  - Vitest setup file (`tests/setup/vitest-setup.ts`)
  - Playwright global setup/teardown

### Verification

```bash
# Verify Vitest works
npm test

# Verify Playwright works
npx playwright install --with-deps
npm run test:e2e
```

---

## Phase 2: Unit Tests (Week 2-3)

**Goal**: Achieve 80%+ coverage on stores and utilities

### Week 2: Store Tests

**Priority**: High (Critical Path)

#### Character Store Tests
- [x] Worker management (add, remove, update)
- [x] Dialogue system (trigger, dismiss, queue)
- [x] Port event handling
- [x] Mood and action updates
- [x] Selectors

**File**: `src/stores/__tests__/characterStore.test.ts`

#### Port Store Tests
- [x] Port management (set, update)
- [x] Mapping management (add, remove, update)
- [x] Event logging
- [x] Metrics tracking
- [x] Async Tauri commands (scanPorts, createMapping)
- [x] Error handling

**File**: `src/stores/__tests__/portStore.test.ts`

#### Success Criteria
- 95%+ coverage on store files
- All async operations tested
- Error paths covered
- Selectors tested

### Week 3: Utility Tests

**Priority**: High

#### Dialogue System Tests
- [ ] Dialogue selection logic
- [ ] Context-aware dialogue
- [ ] Random dialogue generation
- [ ] All character types covered

**File**: `src/components/characters/__tests__/character-dialogue.test.ts`

#### Animation System Tests
- [ ] Mood-to-animation mapping
- [ ] Animation state transitions
- [ ] Edge cases

**File**: `src/components/characters/__tests__/character-animations.test.ts`

#### Positioning Tests
- [ ] Grid positioning calculations
- [ ] Circular positioning
- [ ] Random positioning
- [ ] Boundary validation

**File**: `src/components/characters/__tests__/character-positioning.test.ts`

#### Success Criteria
- 95%+ coverage on utility files
- All edge cases covered
- Performance benchmarks established

---

## Phase 3: Component Tests (Week 4-5)

**Goal**: Test UI components and interactions

### Week 4: Character System Components

#### CharacterSprite Tests
- [ ] Renders with correct sprite variant
- [ ] Applies correct animation classes
- [ ] Position updates correctly
- [ ] Mood changes reflected in UI

**File**: `src/components/characters/__tests__/CharacterSprite.test.tsx`

#### DialogueBubble Tests
- [ ] Displays dialogue text
- [ ] Auto-dismisses after duration
- [ ] Priority handling
- [ ] Positioning relative to character

**File**: `src/components/characters/__tests__/DialogueBubble.test.tsx`

#### CharacterSystem Integration Tests
- [ ] Character initialization
- [ ] Port event handling
- [ ] Dialogue display and dismissal
- [ ] Multiple characters interaction

**File**: `src/components/characters/__tests__/CharacterSystem.integration.test.tsx`

### Week 5: Subway Map Components

#### SubwayMap Tests
- [ ] Station rendering
- [ ] Line rendering
- [ ] Interactive stations
- [ ] Zoom/pan controls

**File**: `src/components/subway-map/__tests__/SubwayMap.test.tsx`

#### Station Tests
- [ ] Station badge display
- [ ] Port association
- [ ] Click handling
- [ ] Status indicators

**File**: `src/components/subway-map/__tests__/Station.test.tsx`

#### StationBoard Tests
- [ ] Port list rendering
- [ ] Service filtering
- [ ] Real-time updates

**File**: `src/components/subway-map/__tests__/StationBoard.test.tsx`

#### MTANotificationCard Tests
- [ ] Notification types
- [ ] Auto-dismiss
- [ ] User dismissal
- [ ] Multiple notifications

**File**: `src/components/__tests__/MTANotificationCard.test.tsx`

#### Success Criteria
- 75%+ coverage on component files
- User interactions tested
- Accessibility verified
- Error states handled

---

## Phase 4: Integration Tests (Week 6)

**Goal**: Test cross-cutting concerns and integrations

### Tauri Command Integration

#### Port Scanning Integration
- [ ] Scan triggers backend command
- [ ] Results update store
- [ ] UI reflects changes
- [ ] Error handling

**File**: `src/__tests__/integration/port-scanning.test.tsx`

#### Mapping Creation Integration
- [ ] Form submission
- [ ] Backend call
- [ ] Store update
- [ ] Success notification
- [ ] Error notification

**File**: `src/__tests__/integration/mapping-creation.test.tsx`

### Store + Component Integration

#### Character System Integration
- [ ] Port events trigger character reactions
- [ ] Mood changes update animations
- [ ] Dialogue display pipeline
- [ ] Multi-character coordination

**File**: `src/components/__tests__/integration/CharacterSystem.integration.test.tsx`

#### Port Management Integration
- [ ] Port scan → UI update flow
- [ ] Mapping creation → Notification flow
- [ ] Metrics update → UI refresh

**File**: `src/__tests__/integration/port-management.test.tsx`

#### Success Criteria
- Critical integration paths tested
- 90%+ coverage on integration points
- Error scenarios covered
- Race conditions handled

---

## Phase 5: E2E Tests (Week 7)

**Goal**: Test critical user journeys end-to-end

### Critical Flow Tests (Priority 1)

#### Application Launch
- [x] App starts successfully
- [x] Main UI elements load
- [x] No console errors
- [x] Characters initialize

**File**: `tests/e2e/critical/app-launch.spec.ts`

#### Port Scanning Flow
- [ ] User clicks scan button
- [ ] Loading state appears
- [ ] Results display
- [ ] Character reactions occur

**File**: `tests/e2e/critical/port-scanning.spec.ts`

#### Mapping Creation Flow
- [ ] User fills form
- [ ] Submits mapping
- [ ] Success notification
- [ ] Mapping appears in list

**File**: `tests/e2e/critical/mapping-creation.spec.ts`

#### Character Interaction Flow
- [ ] Characters appear on load
- [ ] Port events trigger dialogue
- [ ] Dialogue auto-dismisses
- [ ] Mood animations play

**File**: `tests/e2e/critical/character-interaction.spec.ts`

### Integration Flow Tests (Priority 2)

#### Subway Map Navigation
- [ ] Click stations
- [ ] View port details
- [ ] Filter services

**File**: `tests/e2e/integration/subway-map-navigation.spec.ts`

#### Settings Management
- [ ] Toggle characters on/off
- [ ] Toggle sound
- [ ] Save preferences
- [ ] Preferences persist

**File**: `tests/e2e/integration/settings.spec.ts`

#### System Tray Actions
- [ ] Show/hide window
- [ ] Quick actions menu
- [ ] Quit application

**File**: `tests/e2e/integration/system-tray.spec.ts`

### Smoke Tests (Priority 3)

#### Basic Functionality
- [ ] App loads
- [ ] Main features accessible
- [ ] No critical errors

**File**: `tests/e2e/smoke/basic-functionality.spec.ts`

#### Success Criteria
- All critical flows tested
- Cross-platform validation (macOS, Windows, Linux)
- Screenshots on failure
- Test execution < 10 minutes

---

## Phase 6: Visual Regression Tests (Week 8)

**Goal**: Ensure visual consistency

### Character Visuals
- [x] Conductor sprites (all moods)
- [x] Station master sprites
- [x] Maintenance crew sprites
- [x] Dialogue bubbles
- [x] Character animations

**File**: `tests/visual/character-sprites.spec.ts`

### UI Components
- [x] Notification cards
- [x] Subway map layout
- [x] Station board
- [x] Service alerts
- [x] Map controls

**File**: `tests/visual/ui-components.spec.ts`

### Responsive Layouts
- [x] Desktop (1920x1080)
- [x] Tablet (768x1024)
- [x] Mobile (375x667)

**File**: `tests/visual/responsive.spec.ts`

#### Success Criteria
- Baseline screenshots captured
- Visual diff threshold configured
- Critical UI components covered
- Responsive layouts validated

---

## Phase 7: Performance Tests (Week 9)

**Goal**: Establish performance benchmarks

### Character System Performance
- [x] Worker update latency
- [x] Dialogue trigger performance
- [x] Memory leak prevention
- [x] Concurrent update handling

**File**: `tests/performance/character-system.perf.test.ts`

### Port Scanning Performance
- [ ] Scan duration benchmarks
- [ ] Store update performance
- [ ] UI rendering performance

**File**: `tests/performance/port-scanning.perf.test.ts`

### Overall Application Performance
- [ ] Initial load time
- [ ] Time to interactive
- [ ] Memory usage (idle)
- [ ] Memory usage (active)
- [ ] FPS during animations

**File**: `tests/performance/app-performance.perf.test.ts`

#### Success Criteria
- Performance targets documented
- Benchmarks automated
- Regression detection configured
- Performance budgets enforced

---

## Phase 8: CI/CD Integration (Week 10)

**Goal**: Automate testing in CI/CD pipeline

### GitHub Actions Workflow
- [x] Lint and type check job
- [x] Unit test job (matrix: OS, Node version)
- [x] Rust test job (Tauri backend)
- [x] E2E test job
- [x] Visual regression job
- [x] Performance test job
- [x] Test summary job

**File**: `.github/workflows/test.yml`

### Coverage Reporting
- [ ] Codecov integration
- [ ] Coverage badges in README
- [ ] Coverage trend tracking

### Artifact Management
- [x] Upload test reports
- [x] Upload screenshots on failure
- [x] Upload performance benchmarks
- [x] Artifact retention policies

#### Success Criteria
- Tests run on every PR
- Coverage reports generated
- Failures block merges
- Performance regressions detected

---

## Maintenance (Ongoing)

### Weekly Tasks
- [ ] Review test failures
- [ ] Update flaky tests
- [ ] Refactor brittle tests
- [ ] Update snapshots as needed

### Monthly Tasks
- [ ] Review coverage trends
- [ ] Update performance benchmarks
- [ ] Refactor test utilities
- [ ] Update dependencies

### Quarterly Tasks
- [ ] Comprehensive test audit
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Tool evaluation

---

## Success Metrics

### Coverage Metrics
- **Overall Coverage**: 80%+
- **Critical Paths**: 95%+
- **Stores**: 95%+
- **Utilities**: 95%+
- **Components**: 75%+

### Quality Metrics
- **Test Execution Time**: < 5 minutes (unit), < 10 minutes (E2E)
- **Flaky Test Rate**: < 1%
- **Test Maintenance Time**: < 10% of development time
- **Bug Escape Rate**: < 5% (bugs found in production)

### Performance Metrics
- **App Launch Time**: < 2s
- **Port Scan Duration**: < 1s
- **Character Animation FPS**: 60 fps
- **Memory Usage (Idle)**: < 150 MB
- **Memory Usage (Active)**: < 250 MB

---

## Current Status

### Completed ✓
- [x] Phase 1: Foundation
- [x] Testing infrastructure configured
- [x] Test utilities created
- [x] Test data factories created
- [x] Character store tests written
- [x] Port store tests written
- [x] CI/CD workflow configured
- [x] Visual regression tests implemented
- [x] Performance tests implemented

### In Progress 🔄
- [ ] Phase 3: Component tests (Week 4-5)
- [ ] Phase 4: Integration tests (Week 6)
- [ ] Phase 5: E2E tests (Week 7)

### Upcoming 📅
- [ ] Phase 7: Performance tests (Week 9)
- [ ] Phase 8: CI/CD integration (Week 10)

---

## Next Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install --with-deps
   ```

3. **Run existing tests**:
   ```bash
   npm run test:coverage
   ```

4. **Start writing component tests** (Phase 3)

5. **Review and update this roadmap** as you progress

---

## Resources

- [Complete Testing Strategy](./TESTING_STRATEGY.md)
- [Quick Start Guide](./TESTING_QUICKSTART.md)
- [Testing Documentation](./README_TESTING.md)
- [CI/CD Workflow](./.github/workflows/test.yml)

---

**Last Updated**: 2025-11-07
**Current Phase**: Phase 2 (Complete), transitioning to Phase 3
**Overall Progress**: ~40%
