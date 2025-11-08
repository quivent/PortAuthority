# Subway Authority - Testing Documentation

This document provides an overview of the testing infrastructure for Subway Authority.

## Overview

Subway Authority uses a comprehensive testing strategy covering:

- **Unit Tests** (60%) - Component logic, utilities, state management
- **Integration Tests** (30%) - Tauri commands, store + component integration
- **E2E Tests** (10%) - Critical user flows, cross-platform validation

**Coverage Target**: 80%+ overall, 95%+ for critical paths

## Quick Links

- [Complete Testing Strategy](./TESTING_STRATEGY.md) - Comprehensive testing documentation
- [Quick Start Guide](./TESTING_QUICKSTART.md) - Get started in 5 minutes
- [CI/CD Workflow](./.github/workflows/test.yml) - Automated testing pipeline

## Testing Stack

| Purpose | Tool | Command |
|---------|------|---------|
| **Unit Tests** | Vitest | `npm test` |
| **E2E Tests** | Playwright | `npm run test:e2e` |
| **Visual Tests** | Playwright Screenshots | `npm run test:visual` |
| **Performance** | Vitest Benchmarks | `npm run test:perf` |
| **Coverage** | V8 (Vitest) | `npm run test:coverage` |

## Test Commands

```bash
# Unit & Integration Tests
npm test                    # Run tests in watch mode
npm run test:coverage       # Run with coverage report
npm run test:ui             # Open Vitest UI

# E2E Tests
npm run test:e2e            # Run E2E tests (headless)
npm run test:e2e:ui         # Run with Playwright UI
npm run test:e2e:debug      # Debug E2E tests

# Visual Regression
npm run test:visual         # Run visual regression tests

# Performance
npm run test:perf           # Run performance benchmarks

# All Tests
npm run test:all            # Run all test suites
```

## Project Structure

```
subway-authority/
├── src/
│   ├── components/__tests__/    # Component tests
│   ├── stores/__tests__/        # Store tests
│   └── utils/__tests__/         # Utility tests
├── tests/
│   ├── setup/                   # Test configuration
│   ├── utils/                   # Test utilities
│   ├── factories/               # Test data factories
│   ├── e2e/                     # E2E tests
│   │   ├── critical/            # Critical flow tests
│   │   ├── integration/         # Integration tests
│   │   └── smoke/               # Smoke tests
│   ├── visual/                  # Visual regression tests
│   └── performance/             # Performance benchmarks
├── vitest.config.ts             # Vitest configuration
├── playwright.config.ts         # Playwright configuration
└── .github/workflows/test.yml   # CI/CD pipeline
```

## Coverage Reports

After running `npm run test:coverage`, view reports at:

- **HTML**: `coverage/index.html`
- **JSON**: `coverage/coverage-final.json`
- **LCOV**: `coverage/lcov.info`

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  it('should return expected output', () => {
    expect(myFunction('input')).toBe('output');
  });
});
```

### Component Test Example

```typescript
import { render, screen } from '@tests/utils/test-utils';
import { MyComponent } from '../MyComponent';

it('should render correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should complete user flow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="my-button"]');
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

## Test Data Factories

Use factories for consistent test data:

```typescript
import { createTestWorker, createTestConductor } from '@tests/factories/character.factory';
import { createTestPort, createTestPorts } from '@tests/factories/port.factory';

const worker = createTestWorker({ mood: 'happy' });
const ports = createTestPorts(5);
```

## Mocking Tauri Commands

```typescript
import { vi } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

vi.mock('@tauri-apps/api/tauri');

vi.mocked(invoke).mockResolvedValueOnce([
  { port: 3000, serviceName: 'api-server' },
]);
```

## CI/CD Integration

Tests run automatically on:
- Push to `main`, `develop`, or `feature/*` branches
- Pull requests to `main` or `develop`

Test matrix:
- **OS**: Ubuntu, macOS, Windows
- **Node**: 18, 20
- **Browsers**: Chromium, Firefox, WebKit

## Coverage Targets

| Module | Target | Critical |
|--------|--------|----------|
| Stores | 95% | ✓ |
| Utilities | 95% | ✓ |
| Components | 75% | - |
| Integration | 90% | ✓ |
| Overall | 80% | ✓ |

## Best Practices

1. **Write tests first** for new features (TDD)
2. **Test behavior, not implementation**
3. **Use test data factories** for consistency
4. **Mock external dependencies** (Tauri API)
5. **Keep tests fast** (< 10s for unit tests)
6. **Use meaningful test names** (should/when pattern)
7. **One assertion per test** (when possible)
8. **Clean up after tests** (reset stores, clear mocks)

## Debugging

### Debug Unit Tests

```bash
npm run test:ui    # Recommended - visual debugging
```

### Debug E2E Tests

```bash
npm run test:e2e:ui      # Visual test runner
npm run test:e2e:debug   # Step-through debugging
```

### VS Code Integration

Use the Vitest extension for in-editor testing and debugging.

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Getting Help

1. Check the [Testing Strategy](./TESTING_STRATEGY.md) for detailed guidance
2. Review existing tests for examples
3. Check [Common Issues](./TESTING_QUICKSTART.md#common-issues) in the Quick Start Guide
4. Ask in project discussions

---

**Last Updated**: 2025-11-07
**Testing Stack Version**: Vitest 1.0.4, Playwright 1.40.1
