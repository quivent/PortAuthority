# Testing Quick Start Guide

Get started with testing Subway Authority in under 5 minutes.

## Installation

Install all testing dependencies:

```bash
npm install
```

Install Playwright browsers for E2E testing:

```bash
npx playwright install --with-deps
```

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### Visual Regression Tests

```bash
npm run test:visual
```

### Performance Tests

```bash
npm run test:perf
```

### Run All Tests

```bash
npm run test:all
```

## Project Structure

```
subway-authority/
├── src/
│   ├── components/
│   │   └── __tests__/          # Component tests
│   ├── stores/
│   │   └── __tests__/          # Store tests
│   └── utils/
│       └── __tests__/          # Utility tests
├── tests/
│   ├── setup/                  # Test setup files
│   ├── utils/                  # Test utilities
│   ├── factories/              # Test data factories
│   ├── e2e/                    # E2E tests
│   │   ├── critical/           # Critical flow tests
│   │   ├── integration/        # Integration tests
│   │   └── smoke/              # Smoke tests
│   ├── visual/                 # Visual regression tests
│   └── performance/            # Performance tests
├── vitest.config.ts            # Vitest configuration
├── playwright.config.ts        # Playwright configuration
└── .github/workflows/          # CI/CD workflows
```

## Writing Your First Test

### Unit Test Example

Create a file: `src/utils/__tests__/myUtil.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { myUtil } from '../myUtil';

describe('myUtil', () => {
  it('should do something', () => {
    const result = myUtil('input');
    expect(result).toBe('expected output');
  });
});
```

### Component Test Example

Create a file: `src/components/__tests__/MyComponent.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@tests/utils/test-utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Store Test Example

Create a file: `src/stores/__tests__/myStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyStore } from '../myStore';

describe('myStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useMyStore());
    act(() => {
      result.current.reset();
    });
  });

  it('should update state', () => {
    const { result } = renderHook(() => useMyStore());

    act(() => {
      result.current.setValue('new value');
    });

    expect(result.current.value).toBe('new value');
  });
});
```

### E2E Test Example

Create a file: `tests/e2e/myFeature.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="my-button"]');

    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

## Test Data Factories

Use factories to create test data easily:

```typescript
import {
  createTestWorker,
  createTestConductor,
  createTestCrew,
} from '@tests/factories/character.factory';

import {
  createTestPort,
  createTestPorts,
  createTestMapping,
} from '@tests/factories/port.factory';

// Create a single worker
const worker = createTestWorker();

// Create a conductor with overrides
const conductor = createTestConductor({ mood: 'happy' });

// Create a full crew
const crew = createTestCrew();

// Create multiple ports
const ports = createTestPorts(5);
```

## Mocking Tauri Commands

Mock Tauri API calls in your tests:

```typescript
import { vi } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

// In your test
vi.mocked(invoke).mockResolvedValueOnce([
  { port: 3000, serviceName: 'api-server' },
]);

await myFunction(); // Will use mocked invoke
```

Or use the test utility:

```typescript
import { mockTauriCommands } from '@tests/utils/test-utils';

mockTauriCommands({
  scan_active_ports: [
    { port: 3000, serviceName: 'api-server' },
  ],
  create_port_mapping: undefined,
});
```

## Coverage Reports

After running tests with coverage:

```bash
npm run test:coverage
```

View the HTML report:

```bash
open coverage/index.html
```

## Debugging Tests

### Debug Unit Tests

```bash
# Run tests in watch mode and filter
npm run test:watch -- MyComponent

# Run tests with UI (recommended)
npm run test:ui
```

### Debug E2E Tests

```bash
# Open Playwright UI
npm run test:e2e:ui

# Debug mode (step through tests)
npm run test:e2e:debug
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## CI/CD Integration

Tests run automatically on:

- Every push to `main`, `develop`, or `feature/*` branches
- Every pull request to `main` or `develop`

View test results:
- GitHub Actions tab in your repository
- Coverage reports on Codecov (if configured)

## Common Issues

### Issue: Tests failing with "Cannot find module"

**Solution:** Make sure path aliases are configured correctly in `vitest.config.ts`

### Issue: E2E tests timing out

**Solution:** Increase timeout in `playwright.config.ts`:

```typescript
timeout: 90000, // 90 seconds
```

### Issue: Coverage not meeting thresholds

**Solution:** Write more tests or adjust thresholds in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 70, // Lower threshold
  },
}
```

### Issue: Tauri commands not working in tests

**Solution:** Make sure you've mocked the Tauri API:

```typescript
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));
```

## Next Steps

1. Read the [complete testing strategy](./TESTING_STRATEGY.md)
2. Review existing tests in the codebase
3. Write tests for new features as you develop them
4. Maintain 80%+ code coverage
5. Run tests before committing code

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
