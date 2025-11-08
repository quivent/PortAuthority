/**
 * Vitest Global Setup
 * Runs before all tests
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Extend Vitest matchers with jest-dom matchers
expect.extend({});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/window', () => ({
  appWindow: {
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    unmaximize: vi.fn(),
    center: vi.fn(),
    setTitle: vi.fn(),
  },
}));

vi.mock('@tauri-apps/api/notification', () => ({
  sendNotification: vi.fn(),
  isPermissionGranted: vi.fn().mockResolvedValue(true),
  requestPermission: vi.fn().mockResolvedValue('granted'),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16) as unknown as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock performance.memory (for memory leak tests)
Object.defineProperty(performance, 'memory', {
  writable: true,
  value: {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
  },
});

// Suppress console errors in tests (optional)
// Uncomment if you want to suppress console output during tests
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args: any[]) => {
//     if (
//       typeof args[0] === 'string' &&
//       args[0].includes('Warning: ReactDOM.render')
//     ) {
//       return;
//     }
//     originalError.call(console, ...args);
//   };
// });
//
// afterAll(() => {
//   console.error = originalError;
// });
