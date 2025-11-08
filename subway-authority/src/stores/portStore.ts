/**
 * Port Store - Zustand State Management
 * Manages port information, mappings, and real-time updates
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PortInfo, SubdomainMapping, PortEvent, PortMetrics } from '../types/Port';
import { portEventHandlers } from './middleware/events';

interface PortState {
  // State
  ports: PortInfo[];
  mappings: SubdomainMapping[];
  events: PortEvent[];
  metrics: Record<number, PortMetrics>; // Changed from Map to Record for immutability
  isScanning: boolean;
  lastScanTime: Date | null;
  selectedPort: number | null;

  // Actions
  setPorts: (ports: PortInfo[]) => void;
  updatePort: (port: number, updates: Partial<PortInfo>) => void;
  addMapping: (mapping: SubdomainMapping) => void;
  removeMapping: (id: string) => void;
  updateMapping: (id: string, updates: Partial<SubdomainMapping>) => void;
  addEvent: (event: PortEvent) => void;
  clearEvents: () => void;
  updateMetrics: (port: number, metrics: PortMetrics) => void;
  setIsScanning: (scanning: boolean) => void;
  setSelectedPort: (port: number | null) => void;
  scanPorts: () => Promise<void>;
  createMapping: (subdomain: string, port: number) => Promise<void>;
  removePortMapping: (id: string) => Promise<void>;
}

// Base store configuration
const storeConfig = (set: any, get: any): PortState => ({
  // Initial state
  ports: [],
  mappings: [],
  events: [],
  metrics: {}, // Changed from new Map() to empty object
  isScanning: false,
  lastScanTime: null,
  selectedPort: null,

      // Mutations
      setPorts: (ports) =>
        set({ ports, lastScanTime: new Date() }, false, 'setPorts'),

      updatePort: (port, updates) =>
        set(
          (state) => ({
            ports: state.ports.map((p) =>
              p.port === port ? { ...p, ...updates } : p
            ),
          }),
          false,
          'updatePort'
        ),

      addMapping: (mapping) =>
        set(
          (state) => ({
            mappings: [...state.mappings, mapping],
          }),
          false,
          'addMapping'
        ),

      removeMapping: (id) =>
        set(
          (state) => ({
            mappings: state.mappings.filter((m) => m.id !== id),
          }),
          false,
          'removeMapping'
        ),

      updateMapping: (id, updates) =>
        set(
          (state) => ({
            mappings: state.mappings.map((m) =>
              m.id === id ? { ...m, ...updates } : m
            ),
          }),
          false,
          'updateMapping'
        ),

      addEvent: (event) =>
        set(
          (state) => ({
            events: [event, ...state.events].slice(0, 100), // Keep last 100 events
          }),
          false,
          'addEvent'
        ),

      clearEvents: () => set({ events: [] }, false, 'clearEvents'),

      updateMetrics: (port, metrics) =>
        set(
          (state) => ({
            metrics: {
              ...state.metrics,
              [port]: metrics,
            },
          }),
          false,
          'updateMetrics'
        ),

      setIsScanning: (scanning) =>
        set({ isScanning: scanning }, false, 'setIsScanning'),

      setSelectedPort: (port) =>
        set({ selectedPort: port }, false, 'setSelectedPort'),

      // Async actions with Tauri integration
      scanPorts: async () => {
        const { setIsScanning, setPorts, addEvent } = get();
        setIsScanning(true);

        try {
          // Import Tauri API dynamically
          const { invoke } = await import('@tauri-apps/api/tauri');
          const ports = await invoke<PortInfo[]>('scan_active_ports');

          setPorts(ports);

          addEvent({
            type: 'port_opened' as any,
            port: 0,
            timestamp: new Date(),
            message: `Scanned ${ports.length} active ports`,
            severity: 'info',
          });
        } catch (error) {
          console.error('Failed to scan ports:', error);
          addEvent({
            type: 'port_closed' as any,
            port: 0,
            timestamp: new Date(),
            message: `Port scan failed: ${error}`,
            severity: 'error',
          });
        } finally {
          setIsScanning(false);
        }
      },

      createMapping: async (subdomain, port) => {
        const { addMapping, addEvent } = get();

        try {
          const { invoke } = await import('@tauri-apps/api/tauri');
          await invoke('create_port_mapping', { subdomain, port });

          const mapping: SubdomainMapping = {
            id: `${subdomain}-${port}`,
            subdomain,
            port,
            domain: 'localhost',
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          addMapping(mapping);

          addEvent({
            type: 'mapping_created' as any,
            port,
            timestamp: new Date(),
            message: `Created mapping: ${subdomain}.localhost → port ${port}`,
            severity: 'info',
          });
        } catch (error) {
          console.error('Failed to create mapping:', error);
          addEvent({
            type: 'conflict_detected' as any,
            port,
            timestamp: new Date(),
            message: `Failed to create mapping: ${error}`,
            severity: 'error',
          });
          throw error;
        }
      },

      removePortMapping: async (id) => {
        const { mappings, removeMapping, addEvent } = get();
        const mapping = mappings.find((m) => m.id === id);

        if (!mapping) return;

        try {
          const { invoke } = await import('@tauri-apps/api/tauri');
          await invoke('remove_port_mapping', { subdomain: mapping.subdomain });

          removeMapping(id);

          addEvent({
            type: 'mapping_removed' as any,
            port: mapping.port,
            timestamp: new Date(),
            message: `Removed mapping: ${mapping.subdomain}.localhost`,
            severity: 'info',
          });
        } catch (error) {
          console.error('Failed to remove mapping:', error);
          addEvent({
            type: 'conflict_detected' as any,
            port: mapping.port,
            timestamp: new Date(),
            message: `Failed to remove mapping: ${error}`,
            severity: 'error',
          });
          throw error;
        }
      },
});

// Create store with devtools
export const usePortStore = create<PortState>()(
  devtools(storeConfig, { name: 'PortStore' })
);

// Initialize event listeners
if (typeof window !== 'undefined') {
  import('@tauri-apps/api/event').then(({ listen }) => {
    portEventHandlers.forEach(({ event, handler }) => {
      listen(event, (tauriEvent) => {
        try {
          const currentState = usePortStore.getState();
          const stateUpdate = handler(currentState, tauriEvent.payload);

          if (stateUpdate !== null) {
            usePortStore.setState(stateUpdate as any);
          }
        } catch (error) {
          console.error(`Error handling event ${event}:`, error);
        }
      }).catch((error) => {
        console.error(`Failed to listen to event ${event}:`, error);
      });
    });
  }).catch((error) => {
    console.warn('Tauri event system not available:', error);
  });

  // Initialize persistence
  const STORAGE_KEY = 'subway-authority-port-store-v1';

  // Load persisted state
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored, (key, value) => {
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      });

      usePortStore.setState({
        ports: parsed.ports || [],
        mappings: parsed.mappings || [],
        metrics: parsed.metrics || {},
        selectedPort: parsed.selectedPort || null,
        lastScanTime: parsed.lastScanTime || null,
      }, true);
    }
  } catch (error) {
    console.error('Failed to load persisted state:', error);
  }

  // Subscribe to state changes for persistence
  usePortStore.subscribe((state) => {
    try {
      const toSave = {
        ports: state.ports,
        mappings: state.mappings,
        metrics: state.metrics,
        selectedPort: state.selectedPort,
        lastScanTime: state.lastScanTime,
      };

      const serialized = JSON.stringify(toSave, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      });

      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  });
}

// Selectors for derived state
export const selectActiveServices = (state: PortState) =>
  state.ports.filter((p) => p.status === 'active' as any);

export const selectPortByNumber = (state: PortState, port: number) =>
  state.ports.find((p) => p.port === port);

export const selectMappingsByPort = (state: PortState, port: number) =>
  state.mappings.filter((m) => m.port === port);

export const selectRecentEvents = (state: PortState, limit = 10) =>
  state.events.slice(0, limit);
