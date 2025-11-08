/**
 * Custom Testing Utilities
 * Enhanced render methods and test helpers
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';

// ====================
// Providers Wrapper
// ====================

interface AllTheProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper component that includes all necessary providers
 * Add your providers here (Context, Router, etc.)
 */
const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return <>{children}</>;
};

/**
 * Custom render method that includes providers
 */
export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => render(ui, { wrapper: AllTheProviders, ...options });

// Export all React Testing Library utilities
export * from '@testing-library/react';
export { customRender as render };

// ====================
// Test Helpers
// ====================

/**
 * Wait for a condition to be true
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> => {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
};

/**
 * Simulate async delay
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create a mock Tauri invoke function
 */
export const createMockInvoke = (
  commandResults: Record<string, any>
): ReturnType<typeof vi.fn> => {
  return vi.fn((command: string, args?: any) => {
    if (command in commandResults) {
      const result = commandResults[command];
      return typeof result === 'function' ? result(args) : Promise.resolve(result);
    }
    return Promise.reject(new Error(`Unmocked Tauri command: ${command}`));
  });
};

/**
 * Mock Tauri invoke with specific command results
 */
export const mockTauriCommands = (commandResults: Record<string, any>) => {
  const mockInvoke = createMockInvoke(commandResults);

  vi.mock('@tauri-apps/api/tauri', () => ({
    invoke: mockInvoke,
  }));

  return mockInvoke;
};

/**
 * Create a controlled promise for testing async behavior
 */
export const createControlledPromise = <T,>() => {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve: resolve!, reject: reject! };
};

/**
 * Flush all pending promises
 */
export const flushPromises = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Advance timers and flush promises
 */
export const advanceTimersAndFlush = async (ms: number): Promise<void> => {
  vi.advanceTimersByTime(ms);
  await flushPromises();
};

/**
 * Create a spy on console methods
 */
export const spyOnConsole = () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

  return {
    error: consoleError,
    warn: consoleWarn,
    log: consoleLog,
    restore: () => {
      consoleError.mockRestore();
      consoleWarn.mockRestore();
      consoleLog.mockRestore();
    },
  };
};

/**
 * Mock performance.now() for consistent timing
 */
export const mockPerformanceNow = (startTime = 0) => {
  let currentTime = startTime;

  vi.spyOn(performance, 'now').mockImplementation(() => currentTime);

  return {
    advance: (ms: number) => {
      currentTime += ms;
    },
    set: (time: number) => {
      currentTime = time;
    },
    get: () => currentTime,
  };
};

/**
 * Create a mock event
 */
export const createMockEvent = <T extends Event>(
  type: string,
  properties?: Partial<T>
): T => {
  const event = new Event(type) as T;
  if (properties) {
    Object.assign(event, properties);
  }
  return event;
};

/**
 * Simulate user typing with delay
 */
export const typeWithDelay = async (
  element: HTMLElement,
  text: string,
  delayMs = 50
): Promise<void> => {
  for (const char of text) {
    element.dispatchEvent(
      new KeyboardEvent('keydown', { key: char, bubbles: true })
    );
    element.dispatchEvent(
      new KeyboardEvent('keypress', { key: char, bubbles: true })
    );
    if (element instanceof HTMLInputElement) {
      element.value += char;
    }
    element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await delay(delayMs);
  }
};
