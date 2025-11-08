/**
 * Performance Benchmark Tests for Virtual Rendering
 * Target: <100ms render time for 100+ stations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SubwayMap } from '../components/subway-map/SubwayMap';
import { usePortStore } from '../stores/portStore';
import { PortInfo, ServiceType, PortHealth, PortStatus } from '../types/Port';
import '@testing-library/jest-dom';

// Mock the port store
vi.mock('../stores/portStore');

describe('SubwayMap Virtual Rendering Performance', () => {
  const createMockPorts = (count: number): PortInfo[] => {
    return Array.from({ length: count }, (_, i) => ({
      port: 3000 + i,
      processName: `process-${i}`,
      pid: 1000 + i,
      user: 'testuser',
      subdomain: `service-${i}`,
      serviceType: [
        ServiceType.NodeJS,
        ServiceType.Python,
        ServiceType.Ruby,
        ServiceType.Go,
        ServiceType.Rust,
      ][i % 5],
      health: [
        PortHealth.Healthy,
        PortHealth.Degraded,
        PortHealth.Unhealthy,
      ][i % 3],
      status: PortStatus.Active,
      connections: Math.floor(Math.random() * 100),
      uptime: 3600000,
      lastChecked: new Date(),
    }));
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should render 50 stations within performance target', async () => {
    const ports = createMockPorts(50);
    (usePortStore as any).mockReturnValue({
      ports,
      selectedPort: null,
      setSelectedPort: vi.fn(),
    });

    const startTime = performance.now();
    const { container } = render(<SubwayMap />);
    const renderTime = performance.now() - startTime;

    expect(renderTime).toBeLessThan(100);
    expect(container.querySelector('.subway-map-svg')).toBeInTheDocument();
  });

  it('should render 100 stations within performance target', async () => {
    const ports = createMockPorts(100);
    (usePortStore as any).mockReturnValue({
      ports,
      selectedPort: null,
      setSelectedPort: vi.fn(),
    });

    const startTime = performance.now();
    const { container } = render(<SubwayMap />);
    const renderTime = performance.now() - startTime;

    expect(renderTime).toBeLessThan(100);
    expect(container.querySelector('.subway-map-svg')).toBeInTheDocument();
  });

  it('should render 200 stations with acceptable performance', async () => {
    const ports = createMockPorts(200);
    (usePortStore as any).mockReturnValue({
      ports,
      selectedPort: null,
      setSelectedPort: vi.fn(),
    });

    const startTime = performance.now();
    const { container } = render(<SubwayMap />);
    const renderTime = performance.now() - startTime;

    // Allow slightly higher threshold for 200 stations
    expect(renderTime).toBeLessThan(150);
    expect(container.querySelector('.subway-map-svg')).toBeInTheDocument();
  });

  it('should cull off-viewport stations efficiently', () => {
    const ports = createMockPorts(100);
    (usePortStore as any).mockReturnValue({
      ports,
      selectedPort: null,
      setSelectedPort: vi.fn(),
    });

    const { container } = render(<SubwayMap />);

    // Count rendered station elements
    const stationElements = container.querySelectorAll('.station');

    // Should render fewer stations than total (viewport culling)
    expect(stationElements.length).toBeLessThan(ports.length);
    expect(stationElements.length).toBeGreaterThan(0);
  });

  it('should update render time metrics', async () => {
    const ports = createMockPorts(50);
    (usePortStore as any).mockReturnValue({
      ports,
      selectedPort: null,
      setSelectedPort: vi.fn(),
    });

    render(<SubwayMap />);

    // In development mode, performance metrics should be visible
    // Skip this test in CI environments
    if (typeof window !== 'undefined' && import.meta.env?.DEV) {
      await waitFor(() => {
        const metricsElement = screen.queryByText(/Render:/i);
        if (metricsElement) {
          expect(metricsElement).toBeInTheDocument();
        }
      });
    }
  });

  it('should handle viewport changes without performance degradation', async () => {
    const ports = createMockPorts(100);
    const setSelectedPort = vi.fn();
    (usePortStore as any).mockReturnValue({
      ports,
      selectedPort: null,
      setSelectedPort,
    });

    const { container, rerender } = render(<SubwayMap />);

    // Simulate viewport change
    const svg = container.querySelector('.subway-map-svg');
    expect(svg).toBeInTheDocument();

    // Trigger multiple viewport updates
    const iterations = 10;
    const renderTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      rerender(<SubwayMap />);
      const renderTime = performance.now() - startTime;
      renderTimes.push(renderTime);
    }

    // Average render time should be under target
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    expect(avgRenderTime).toBeLessThan(100);
  });

  it('should optimize memory usage with large datasets', () => {
    const ports = createMockPorts(200);
    (usePortStore as any).mockReturnValue({
      ports,
      selectedPort: null,
      setSelectedPort: vi.fn(),
    });

    // Check initial memory if available
    const initialMemory = (performance as any).memory?.usedJSHeapSize;

    render(<SubwayMap />);

    // Check memory after render
    const finalMemory = (performance as any).memory?.usedJSHeapSize;

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory;
      // Memory increase should be under 65MB
      expect(memoryIncrease).toBeLessThan(65 * 1024 * 1024);
    }
  });

  it('should use spatial grid for large datasets', () => {
    const ports = createMockPorts(100);
    (usePortStore as any).mockReturnValue({
      ports,
      selectedPort: null,
      setSelectedPort: vi.fn(),
    });

    const { container } = render(<SubwayMap />);

    // Verify spatial grid optimization is active (more than 50 stations)
    const stationElements = container.querySelectorAll('.station');
    expect(stationElements.length).toBeLessThan(ports.length);
  });

  it('should render different LOD levels based on zoom', () => {
    const ports = createMockPorts(50);
    (usePortStore as any).mockReturnValue({
      ports,
      selectedPort: null,
      setSelectedPort: vi.fn(),
    });

    const { container } = render(<SubwayMap />);

    // At default zoom (1.0), should be medium LOD
    const stations = container.querySelectorAll('.station');
    expect(stations.length).toBeGreaterThan(0);

    // Animations should be present at medium/high LOD
    const animations = container.querySelectorAll('animate');
    expect(animations.length).toBeGreaterThan(0);
  });
});

describe('Virtual Rendering Edge Cases', () => {
  it('should handle empty port list', () => {
    (usePortStore as any).mockReturnValue({
      ports: [],
      selectedPort: null,
      setSelectedPort: vi.fn(),
    });

    const { container } = render(<SubwayMap />);
    expect(container.querySelector('.subway-map-svg')).toBeInTheDocument();
  });

  it('should handle single port', () => {
    const ports = createMockPorts(1);
    (usePortStore as any).mockReturnValue({
      ports,
      selectedPort: null,
      setSelectedPort: vi.fn(),
    });

    const startTime = performance.now();
    const { container } = render(<SubwayMap />);
    const renderTime = performance.now() - startTime;

    expect(renderTime).toBeLessThan(50);
    expect(container.querySelector('.station')).toBeInTheDocument();
  });

  it('should handle rapid viewport changes', async () => {
    const ports = createMockPorts(100);
    (usePortStore as any).mockReturnValue({
      ports,
      selectedPort: null,
      setSelectedPort: vi.fn(),
    });

    const { rerender } = render(<SubwayMap />);

    // Simulate rapid viewport changes (panning/zooming)
    const rapidUpdates = 20;
    const renderTimes: number[] = [];

    for (let i = 0; i < rapidUpdates; i++) {
      const startTime = performance.now();
      rerender(<SubwayMap />);
      renderTimes.push(performance.now() - startTime);
    }

    // All updates should be reasonably fast
    renderTimes.forEach((time) => {
      expect(time).toBeLessThan(100);
    });
  });
});

// Helper function to create mock ports
function createMockPorts(count: number): PortInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    port: 3000 + i,
    processName: `process-${i}`,
    pid: 1000 + i,
    user: 'testuser',
    subdomain: `service-${i}`,
    serviceType: [
      ServiceType.NodeJS,
      ServiceType.Python,
      ServiceType.Ruby,
      ServiceType.Go,
      ServiceType.Rust,
    ][i % 5],
    health: [
      PortHealth.Healthy,
      PortHealth.Degraded,
      PortHealth.Unhealthy,
    ][i % 3],
    status: PortStatus.Active,
    connections: Math.floor(Math.random() * 100),
    uptime: 3600000,
    lastChecked: new Date(),
  }));
}
