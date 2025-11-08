/**
 * Subway Map Visualization Type Definitions
 * NYC MTA-inspired port routing visualization
 */

import { PortInfo, ServiceType } from './Port';

export interface Station {
  id: string;
  name: string;
  port: PortInfo;
  position: Position;
  lines: SubwayLine[];
  connections: string[];
  status: StationStatus;
  passengers: number; // Active connections
}

export interface Position {
  x: number;
  y: number;
}

export interface SubwayLine {
  id: string;
  name: string;
  color: string;
  serviceType: ServiceType;
  stations: Station[];
  status: LineStatus;
  isExpress: boolean;
}

export enum StationStatus {
  Operational = 'operational',
  DelayMinor = 'delay_minor',
  DelayMajor = 'delay_major',
  ServiceChange = 'service_change',
  Closed = 'closed'
}

export enum LineStatus {
  GoodService = 'good_service',
  Delays = 'delays',
  PlannedWork = 'planned_work',
  ServiceChange = 'service_change',
  Suspended = 'suspended'
}

export interface ConnectionPath {
  from: string;
  to: string;
  lineId: string;
  animated: boolean;
  dataFlowRate: number; // requests/second
}

export interface MapViewport {
  centerX: number;
  centerY: number;
  zoom: number;
  rotation: number;
}

export interface ServiceAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  affectedLines: string[];
  affectedStations: string[];
  timestamp: Date;
  acknowledged: boolean;
}

export interface Train {
  id: string;
  lineId: string;
  position: Position;
  direction: 'inbound' | 'outbound';
  speed: number;
  nextStation: string;
  representingData: boolean; // Is this train representing active data transfer?
}

// NYC MTA Color Scheme
export const NYC_SUBWAY_COLORS: Record<ServiceType, string> = {
  [ServiceType.NodeJS]: '#00933C', // 4-5-6 Green Line
  [ServiceType.Python]: '#FCCC02', // N-Q-R-W Yellow Line
  [ServiceType.Ruby]: '#EE352E', // 1-2-3 Red Line
  [ServiceType.Go]: '#0039A6', // A-C-E Blue Line
  [ServiceType.Rust]: '#FF6319', // B-D-F-M Orange Line
  [ServiceType.Java]: '#996633', // J-Z Brown Line
  [ServiceType.Docker]: '#808183', // L Grey Line
  [ServiceType.Unknown]: '#A7A9AC' // Shuttle Grey
};

export const LINE_NAMES: Record<ServiceType, string> = {
  [ServiceType.NodeJS]: 'Lexington Express',
  [ServiceType.Python]: 'Broadway Local',
  [ServiceType.Ruby]: '7th Avenue Express',
  [ServiceType.Go]: '8th Avenue Express',
  [ServiceType.Rust]: 'Concourse Local',
  [ServiceType.Java]: 'Nassau Street',
  [ServiceType.Docker]: 'Canarsie Local',
  [ServiceType.Unknown]: 'Shuttle'
};
