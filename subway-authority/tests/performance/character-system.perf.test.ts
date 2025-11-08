/**
 * Character System Performance Tests
 * Benchmark tests for character state management
 */

import { describe, it, expect, bench, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCharacterStore } from '@stores/characterStore';
import {
  createTestWorker,
  createTestDialogue,
  resetFactoryCounters,
} from '@tests/factories/character.factory';
import { WorkerMood, WorkerAction } from '@/types/Character';

describe('Character System Performance', () => {
  beforeEach(() => {
    resetFactoryCounters();
  });

  describe('Store Update Performance', () => {
    it('should handle 1000 worker updates in < 100ms', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.initializeWorkers();
      });

      const workerId = result.current.workers[0].id;
      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.updateWorkerMood(
            workerId,
            i % 2 === 0 ? WorkerMood.Happy : WorkerMood.Frustrated
          );
        }
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
      console.log(`✓ 1000 worker updates completed in ${duration.toFixed(2)}ms`);
    });

    it('should handle 1000 dialogue triggers in < 200ms', () => {
      const { result } = renderHook(() => useCharacterStore());

      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.handlePortEvent(3000 + i, 'port_opened');
        }
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(200);
      console.log(`✓ 1000 dialogue triggers completed in ${duration.toFixed(2)}ms`);
    });

    it('should handle adding 100 workers in < 50ms', () => {
      const { result } = renderHook(() => useCharacterStore());

      const workers = Array.from({ length: 100 }, () => createTestWorker());
      const startTime = performance.now();

      act(() => {
        workers.forEach((worker) => result.current.addWorker(worker));
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50);
      expect(result.current.workers).toHaveLength(100);
      console.log(`✓ 100 workers added in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with repeated updates', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.initializeWorkers();
      });

      const workerId = result.current.workers[0].id;

      // Get initial memory (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      act(() => {
        for (let i = 0; i < 10000; i++) {
          result.current.updateWorkerMood(
            workerId,
            i % 2 === 0 ? WorkerMood.Happy : WorkerMood.Frustrated
          );
        }
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (< 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);

      console.log(
        `✓ Memory increase after 10k updates: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
      );
    });

    it('should cleanup dialogue queue efficiently', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Add 1000 dialogues
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.triggerDialogue(createTestDialogue());
        }
      });

      expect(result.current.dialogueQueue.length).toBeGreaterThan(0);

      const startTime = performance.now();

      act(() => {
        result.current.clearDialogueQueue();
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(10);
      expect(result.current.dialogueQueue).toHaveLength(0);
      expect(result.current.activeDialogue).toBeNull();

      console.log(`✓ Cleared 1000 dialogues in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Concurrent Updates', () => {
    it('should handle concurrent worker updates efficiently', async () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.initializeWorkers();
      });

      const workers = result.current.workers;
      const startTime = performance.now();

      act(() => {
        // Simulate concurrent updates
        workers.forEach((worker, index) => {
          result.current.updateWorkerMood(worker.id, WorkerMood.Happy);
          result.current.updateWorkerAction(worker.id, WorkerAction.Monitoring);
          result.current.assignWorkerToPort(worker.id, 3000 + index);
        });
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50);
      console.log(
        `✓ Concurrent updates for ${workers.length} workers completed in ${duration.toFixed(2)}ms`
      );
    });
  });

  describe('Selector Performance', () => {
    it('should filter workers by role efficiently', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Add 100 workers
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addWorker(createTestWorker());
        }
      });

      const startTime = performance.now();

      const conductors = result.current.workers.filter(
        (w) => w.role === 'Conductor'
      );

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5);
      console.log(
        `✓ Filtered 100 workers in ${duration.toFixed(2)}ms (found ${conductors.length})`
      );
    });
  });
});

// ==================== Benchmarks ====================

describe('Character System Benchmarks', () => {
  bench('updateWorkerMood', () => {
    const { result } = renderHook(() => useCharacterStore());

    act(() => {
      result.current.initializeWorkers();
    });

    const workerId = result.current.workers[0].id;

    act(() => {
      result.current.updateWorkerMood(workerId, WorkerMood.Happy);
    });
  });

  bench('triggerDialogue', () => {
    const { result } = renderHook(() => useCharacterStore());

    act(() => {
      result.current.handlePortEvent(3000, 'port_opened');
    });
  });

  bench('addWorker', () => {
    const { result } = renderHook(() => useCharacterStore());

    act(() => {
      result.current.addWorker(createTestWorker());
    });
  });

  bench('filter workers by role', () => {
    const { result } = renderHook(() => useCharacterStore());

    act(() => {
      result.current.initializeWorkers();
    });

    result.current.workers.filter((w) => w.role === 'Conductor');
  });
});
