/**
 * Port Store Unit Tests
 * Complete test suite for port state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePortStore } from '../portStore';
import {
  createTestPort,
  createTestPorts,
  createTestMapping,
  createTestEvent,
  resetPortFactoryCounters,
} from '@tests/factories/port.factory';

// Mock Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

describe('Port Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPortFactoryCounters();

    // Reset store state
    const { result } = renderHook(() => usePortStore());
    act(() => {
      result.current.setPorts([]);
      result.current.clearEvents();
      result.current.setSelectedPort(null);
    });
  });

  describe('Port Management', () => {
    it('should set ports in store', () => {
      const { result } = renderHook(() => usePortStore());
      const testPorts = createTestPorts(3);

      act(() => {
        result.current.setPorts(testPorts);
      });

      expect(result.current.ports).toHaveLength(3);
      expect(result.current.lastScanTime).toBeInstanceOf(Date);
    });

    it('should update specific port', () => {
      const { result } = renderHook(() => usePortStore());
      const testPort = createTestPort({ port: 3000 });

      act(() => {
        result.current.setPorts([testPort]);
      });

      act(() => {
        result.current.updatePort(3000, { serviceName: 'updated-service' });
      });

      expect(result.current.ports[0].serviceName).toBe('updated-service');
    });

    it('should not update other ports when updating one', () => {
      const { result } = renderHook(() => usePortStore());
      const testPorts = createTestPorts(3);

      act(() => {
        result.current.setPorts(testPorts);
      });

      const originalSecondPort = result.current.ports[1];

      act(() => {
        result.current.updatePort(testPorts[0].port, { serviceName: 'updated' });
      });

      expect(result.current.ports[1]).toEqual(originalSecondPort);
    });
  });

  describe('Mapping Management', () => {
    it('should add mapping to store', () => {
      const { result } = renderHook(() => usePortStore());
      const testMapping = createTestMapping();

      act(() => {
        result.current.addMapping(testMapping);
      });

      expect(result.current.mappings).toHaveLength(1);
      expect(result.current.mappings[0].id).toBe(testMapping.id);
    });

    it('should remove mapping from store', () => {
      const { result } = renderHook(() => usePortStore());
      const testMapping = createTestMapping({ id: 'test-mapping-1' });

      act(() => {
        result.current.addMapping(testMapping);
      });

      expect(result.current.mappings).toHaveLength(1);

      act(() => {
        result.current.removeMapping('test-mapping-1');
      });

      expect(result.current.mappings).toHaveLength(0);
    });

    it('should update mapping', () => {
      const { result } = renderHook(() => usePortStore());
      const testMapping = createTestMapping({ id: 'test-mapping-1' });

      act(() => {
        result.current.addMapping(testMapping);
      });

      act(() => {
        result.current.updateMapping('test-mapping-1', { enabled: false });
      });

      expect(result.current.mappings[0].enabled).toBe(false);
    });
  });

  describe('Event Management', () => {
    it('should add event to store', () => {
      const { result } = renderHook(() => usePortStore());
      const testEvent = createTestEvent();

      act(() => {
        result.current.addEvent(testEvent);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0]).toEqual(testEvent);
    });

    it('should limit events to 100', () => {
      const { result } = renderHook(() => usePortStore());

      act(() => {
        for (let i = 0; i < 150; i++) {
          result.current.addEvent(createTestEvent({ port: 3000 + i }));
        }
      });

      expect(result.current.events).toHaveLength(100);
    });

    it('should clear all events', () => {
      const { result } = renderHook(() => usePortStore());

      act(() => {
        result.current.addEvent(createTestEvent());
        result.current.addEvent(createTestEvent());
      });

      expect(result.current.events).toHaveLength(2);

      act(() => {
        result.current.clearEvents();
      });

      expect(result.current.events).toHaveLength(0);
    });

    it('should keep newest events when exceeding limit', () => {
      const { result } = renderHook(() => usePortStore());

      const firstEvent = createTestEvent({ port: 3000 });
      const lastEvent = createTestEvent({ port: 3100 });

      act(() => {
        result.current.addEvent(firstEvent);

        for (let i = 1; i < 100; i++) {
          result.current.addEvent(createTestEvent({ port: 3000 + i }));
        }

        result.current.addEvent(lastEvent);
      });

      expect(result.current.events[0]).toEqual(lastEvent);
      expect(result.current.events).not.toContainEqual(firstEvent);
    });
  });

  describe('Metrics Management', () => {
    it('should update metrics for port', () => {
      const { result } = renderHook(() => usePortStore());

      const metrics = {
        requestCount: 100,
        errorCount: 5,
        avgResponseTime: 150,
        uptime: 0.99,
        lastCheck: new Date(),
        cpuUsage: 25,
        memoryUsage: 128,
      };

      act(() => {
        result.current.updateMetrics(3000, metrics);
      });

      expect(result.current.metrics.get(3000)).toEqual(metrics);
    });

    it('should update metrics for multiple ports', () => {
      const { result } = renderHook(() => usePortStore());

      act(() => {
        result.current.updateMetrics(3000, {
          requestCount: 100,
          errorCount: 5,
          avgResponseTime: 150,
          uptime: 0.99,
          lastCheck: new Date(),
          cpuUsage: 25,
          memoryUsage: 128,
        });

        result.current.updateMetrics(8080, {
          requestCount: 200,
          errorCount: 10,
          avgResponseTime: 200,
          uptime: 0.95,
          lastCheck: new Date(),
          cpuUsage: 50,
          memoryUsage: 256,
        });
      });

      expect(result.current.metrics.size).toBe(2);
      expect(result.current.metrics.get(3000)?.requestCount).toBe(100);
      expect(result.current.metrics.get(8080)?.requestCount).toBe(200);
    });
  });

  describe('Scanning State', () => {
    it('should set scanning state', () => {
      const { result } = renderHook(() => usePortStore());

      expect(result.current.isScanning).toBe(false);

      act(() => {
        result.current.setIsScanning(true);
      });

      expect(result.current.isScanning).toBe(true);
    });

    it('should set selected port', () => {
      const { result } = renderHook(() => usePortStore());

      act(() => {
        result.current.setSelectedPort(3000);
      });

      expect(result.current.selectedPort).toBe(3000);

      act(() => {
        result.current.setSelectedPort(null);
      });

      expect(result.current.selectedPort).toBe(null);
    });
  });

  describe('Async Actions - Port Scanning', () => {
    it('should scan ports successfully', async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const { result } = renderHook(() => usePortStore());

      const mockPorts = createTestPorts(3);
      vi.mocked(invoke).mockResolvedValueOnce(mockPorts);

      await act(async () => {
        await result.current.scanPorts();
      });

      expect(invoke).toHaveBeenCalledWith('scan_active_ports');
      expect(result.current.ports).toEqual(mockPorts);
      expect(result.current.events[0].message).toContain('Scanned 3 active ports');
    });

    it('should handle scan errors gracefully', async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const { result } = renderHook(() => usePortStore());

      vi.mocked(invoke).mockRejectedValueOnce(new Error('Scan failed'));

      await act(async () => {
        await result.current.scanPorts();
      });

      expect(result.current.ports).toHaveLength(0);
      expect(result.current.events[0].severity).toBe('error');
      expect(result.current.events[0].message).toContain('Port scan failed');
    });

    it('should set scanning state during scan', async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const { result } = renderHook(() => usePortStore());

      let scanningDuringScan = false;

      vi.mocked(invoke).mockImplementation(async () => {
        scanningDuringScan = result.current.isScanning;
        return createTestPorts(2);
      });

      await act(async () => {
        await result.current.scanPorts();
      });

      expect(scanningDuringScan).toBe(true);
      expect(result.current.isScanning).toBe(false);
    });
  });

  describe('Async Actions - Mapping Management', () => {
    it('should create mapping successfully', async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const { result } = renderHook(() => usePortStore());

      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.createMapping('api', 3000);
      });

      expect(invoke).toHaveBeenCalledWith('create_port_mapping', {
        subdomain: 'api',
        port: 3000,
      });

      expect(result.current.mappings).toHaveLength(1);
      expect(result.current.mappings[0].subdomain).toBe('api');
      expect(result.current.events[0].message).toContain('Created mapping');
    });

    it('should handle mapping creation errors', async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const { result } = renderHook(() => usePortStore());

      vi.mocked(invoke).mockRejectedValueOnce(new Error('Mapping failed'));

      await expect(
        act(async () => {
          await result.current.createMapping('api', 3000);
        })
      ).rejects.toThrow('Mapping failed');

      expect(result.current.mappings).toHaveLength(0);
      expect(result.current.events[0].severity).toBe('error');
    });

    it('should remove mapping successfully', async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const { result } = renderHook(() => usePortStore());

      const testMapping = createTestMapping({ id: 'test-1', subdomain: 'api' });

      act(() => {
        result.current.addMapping(testMapping);
      });

      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.removePortMapping('test-1');
      });

      expect(invoke).toHaveBeenCalledWith('remove_port_mapping', {
        subdomain: 'api',
      });

      expect(result.current.mappings).toHaveLength(0);
    });
  });

  describe('Selectors', () => {
    it('should select active services', () => {
      const { result } = renderHook(() => usePortStore());

      const ports = [
        createTestPort({ port: 3000, status: 'active' as any }),
        createTestPort({ port: 8080, status: 'inactive' as any }),
        createTestPort({ port: 5432, status: 'active' as any }),
      ];

      act(() => {
        result.current.setPorts(ports);
      });

      const activeServices = result.current.ports.filter(
        (p) => p.status === 'active'
      );

      expect(activeServices).toHaveLength(2);
    });

    it('should select port by number', () => {
      const { result } = renderHook(() => usePortStore());

      const testPort = createTestPort({ port: 3000 });

      act(() => {
        result.current.setPorts([testPort]);
      });

      const port = result.current.ports.find((p) => p.port === 3000);

      expect(port).toBeDefined();
      expect(port?.port).toBe(3000);
    });

    it('should select mappings by port', () => {
      const { result } = renderHook(() => usePortStore());

      const mappings = [
        createTestMapping({ port: 3000, subdomain: 'api' }),
        createTestMapping({ port: 3000, subdomain: 'web' }),
        createTestMapping({ port: 8080, subdomain: 'admin' }),
      ];

      act(() => {
        mappings.forEach((m) => result.current.addMapping(m));
      });

      const port3000Mappings = result.current.mappings.filter(
        (m) => m.port === 3000
      );

      expect(port3000Mappings).toHaveLength(2);
    });

    it('should select recent events', () => {
      const { result } = renderHook(() => usePortStore());

      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.addEvent(createTestEvent({ port: 3000 + i }));
        }
      });

      const recentEvents = result.current.events.slice(0, 10);

      expect(recentEvents).toHaveLength(10);
    });
  });
});
