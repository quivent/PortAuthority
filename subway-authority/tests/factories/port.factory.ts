/**
 * Port Test Data Factories
 * Factory functions for creating test port data
 */

import { PortInfo, SubdomainMapping, PortEvent, PortMetrics } from '@/types/Port';

let portCounter = 3000;
let mappingIdCounter = 0;
let eventIdCounter = 0;

/**
 * Create a test port
 */
export const createTestPort = (overrides?: Partial<PortInfo>): PortInfo => ({
  port: ++portCounter,
  serviceName: `test-service-${portCounter}`,
  status: 'active' as any,
  processName: 'node',
  pid: Math.floor(Math.random() * 10000),
  protocol: 'http',
  healthStatus: 'healthy' as any,
  lastChecked: new Date(),
  ...overrides,
});

/**
 * Create multiple test ports
 */
export const createTestPorts = (count: number): PortInfo[] => {
  return Array.from({ length: count }, (_, index) =>
    createTestPort({
      port: 3000 + index,
      serviceName: `service-${index + 1}`,
    })
  );
};

/**
 * Create a test subdomain mapping
 */
export const createTestMapping = (
  overrides?: Partial<SubdomainMapping>
): SubdomainMapping => ({
  id: `test-mapping-${++mappingIdCounter}`,
  subdomain: `test${mappingIdCounter}`,
  port: 3000 + mappingIdCounter,
  domain: 'localhost',
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create multiple test mappings
 */
export const createTestMappings = (count: number): SubdomainMapping[] => {
  return Array.from({ length: count }, (_, index) =>
    createTestMapping({
      subdomain: `service${index + 1}`,
      port: 3000 + index,
    })
  );
};

/**
 * Create a test port event
 */
export const createTestEvent = (overrides?: Partial<PortEvent>): PortEvent => ({
  type: 'port_opened' as any,
  port: 3000,
  timestamp: new Date(),
  message: 'Test event',
  severity: 'info',
  ...overrides,
});

/**
 * Create multiple test events
 */
export const createTestEvents = (count: number): PortEvent[] => {
  const eventTypes = ['port_opened', 'port_closed', 'mapping_created', 'health_warning'] as const;

  return Array.from({ length: count }, (_, index) =>
    createTestEvent({
      type: eventTypes[index % eventTypes.length] as any,
      port: 3000 + index,
      message: `Event ${index + 1}`,
      timestamp: new Date(Date.now() - index * 60000),
    })
  );
};

/**
 * Create test port metrics
 */
export const createTestMetrics = (overrides?: Partial<PortMetrics>): PortMetrics => ({
  requestCount: 100,
  errorCount: 5,
  avgResponseTime: 150,
  uptime: 0.99,
  lastCheck: new Date(),
  cpuUsage: 25,
  memoryUsage: 128,
  ...overrides,
});

/**
 * Create a healthy port
 */
export const createHealthyPort = (overrides?: Partial<PortInfo>): PortInfo =>
  createTestPort({
    status: 'active' as any,
    healthStatus: 'healthy' as any,
    ...overrides,
  });

/**
 * Create a warning port
 */
export const createWarningPort = (overrides?: Partial<PortInfo>): PortInfo =>
  createTestPort({
    status: 'active' as any,
    healthStatus: 'warning' as any,
    ...overrides,
  });

/**
 * Create an error port
 */
export const createErrorPort = (overrides?: Partial<PortInfo>): PortInfo =>
  createTestPort({
    status: 'error' as any,
    healthStatus: 'error' as any,
    ...overrides,
  });

/**
 * Create a complete port scan result
 */
export const createPortScanResult = (): PortInfo[] => [
  createHealthyPort({ port: 3000, serviceName: 'api-server' }),
  createHealthyPort({ port: 8080, serviceName: 'web-app' }),
  createWarningPort({ port: 5432, serviceName: 'postgres' }),
  createHealthyPort({ port: 6379, serviceName: 'redis' }),
  createErrorPort({ port: 9090, serviceName: 'metrics' }),
];

/**
 * Reset factory counters (useful for test isolation)
 */
export const resetPortFactoryCounters = () => {
  portCounter = 3000;
  mappingIdCounter = 0;
  eventIdCounter = 0;
};
