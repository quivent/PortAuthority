/**
 * Port and Service Type Definitions
 * Subway Authority - Port Management System
 */

export interface PortInfo {
  port: number;
  processName: string;
  pid: number;
  user: string;
  status: PortStatus;
  health: PortHealth;
  subdomain?: string;
  serviceType: ServiceType;
  lastChecked: Date;
  uptime: number;
  connections: number;
}

export enum PortStatus {
  Active = 'active',
  Idle = 'idle',
  Warning = 'warning',
  Error = 'error',
  Stopped = 'stopped'
}

export enum PortHealth {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Unhealthy = 'unhealthy',
  Unknown = 'unknown'
}

export enum ServiceType {
  NodeJS = 'nodejs',
  Python = 'python',
  Ruby = 'ruby',
  Go = 'go',
  Rust = 'rust',
  Java = 'java',
  Docker = 'docker',
  Unknown = 'unknown'
}

export interface SubdomainMapping {
  id: string;
  subdomain: string;
  port: number;
  domain: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortEvent {
  type: PortEventType;
  port: number;
  timestamp: Date;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export enum PortEventType {
  PortOpened = 'port_opened',
  PortClosed = 'port_closed',
  MappingCreated = 'mapping_created',
  MappingRemoved = 'mapping_removed',
  HealthChanged = 'health_changed',
  ServiceStarted = 'service_started',
  ServiceStopped = 'service_stopped',
  ConflictDetected = 'conflict_detected'
}

export interface PortMetrics {
  port: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}
