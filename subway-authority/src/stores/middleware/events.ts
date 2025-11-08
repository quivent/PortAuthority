/**
 * Events Middleware for Zustand
 * Integrates Tauri event system with Zustand stores for real-time updates
 */

import { StateCreator } from 'zustand';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { PortInfo, PortEvent as PortEventType, PortMetrics } from '../../types/Port';

export interface EventHandler<T> {
  event: string;
  handler: (state: T, payload: any) => Partial<T> | null;
}

export interface EventsOptions<T> {
  handlers: EventHandler<T>[];
  autoStart?: boolean;
}

/**
 * Event system state and controls
 */
interface EventsApi {
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  isListening: boolean;
  unsubscribe: () => Promise<void>;
}

/**
 * Events middleware that connects Tauri events to Zustand state updates
 */
export const createEventsMiddleware = <T>(
  config: StateCreator<T>,
  options: EventsOptions<T>
): StateCreator<T & EventsApi> => {
  return (set, get, api) => {
    const unlisteners: UnlistenFn[] = [];
    let isListening = false;

    // Start listening to all registered events
    const startListening = async (): Promise<void> => {
      if (isListening) {
        console.warn('Already listening to events');
        return;
      }

      try {
        for (const { event, handler } of options.handlers) {
          const unlisten = await listen(event, (tauriEvent) => {
            try {
              const currentState = get() as T;
              const stateUpdate = handler(currentState, tauriEvent.payload);

              if (stateUpdate !== null) {
                set(stateUpdate as any, false, `event:${event}`);
              }
            } catch (error) {
              console.error(`Error handling event ${event}:`, error);
            }
          });

          unlisteners.push(unlisten);
        }

        isListening = true;
        console.log(`Started listening to ${options.handlers.length} events`);
      } catch (error) {
        console.error('Failed to start event listeners:', error);
        throw error;
      }
    };

    // Stop listening to all events
    const stopListening = async (): Promise<void> => {
      if (!isListening) return;

      for (const unlisten of unlisteners) {
        try {
          unlisten();
        } catch (error) {
          console.error('Error unsubscribing from event:', error);
        }
      }

      unlisteners.length = 0;
      isListening = false;
      console.log('Stopped listening to all events');
    };

    // Cleanup function
    const unsubscribe = async (): Promise<void> => {
      await stopListening();
    };

    // Initialize the base store
    const baseStore = config(set, get, api);

    // Start listening automatically if configured
    if (options.autoStart !== false) {
      startListening().catch((error) => {
        console.error('Failed to auto-start event listeners:', error);
      });
    }

    // Return store with event API
    return {
      ...baseStore,
      startListening,
      stopListening,
      isListening,
      unsubscribe,
    } as T & EventsApi;
  };
};

/**
 * Port-specific event handlers
 */
export const portEventHandlers: EventHandler<any>[] = [
  {
    event: 'port-update',
    handler: (state, payload: PortInfo) => {
      const existingIndex = state.ports.findIndex(
        (p: PortInfo) => p.port === payload.port
      );

      if (existingIndex !== -1) {
        const updatedPorts = [...state.ports];
        updatedPorts[existingIndex] = payload;
        return { ports: updatedPorts };
      } else {
        return { ports: [...state.ports, payload] };
      }
    },
  },
  {
    event: 'port-added',
    handler: (state, payload: PortInfo) => {
      const exists = state.ports.some((p: PortInfo) => p.port === payload.port);
      if (!exists) {
        return {
          ports: [...state.ports, payload],
          events: [
            {
              type: 'port_opened',
              port: payload.port,
              timestamp: new Date(),
              message: `New service started on port ${payload.port}`,
              severity: 'info',
            },
            ...state.events,
          ].slice(0, 100),
        };
      }
      return null;
    },
  },
  {
    event: 'port-removed',
    handler: (state, payload: { port: number }) => {
      return {
        ports: state.ports.filter((p: PortInfo) => p.port !== payload.port),
        events: [
          {
            type: 'port_closed',
            port: payload.port,
            timestamp: new Date(),
            message: `Service stopped on port ${payload.port}`,
            severity: 'info',
          },
          ...state.events,
        ].slice(0, 100),
      };
    },
  },
  {
    event: 'port-health-changed',
    handler: (state, payload: { port: number; health: string }) => {
      const updatedPorts = state.ports.map((p: PortInfo) =>
        p.port === payload.port ? { ...p, health: payload.health } : p
      );

      return {
        ports: updatedPorts,
        events: [
          {
            type: 'health_changed',
            port: payload.port,
            timestamp: new Date(),
            message: `Port ${payload.port} health changed to ${payload.health}`,
            severity: payload.health === 'healthy' ? 'info' : 'warning',
          },
          ...state.events,
        ].slice(0, 100),
      };
    },
  },
  {
    event: 'port-metrics',
    handler: (state, payload: PortMetrics) => {
      const newMetrics = { ...state.metrics };
      newMetrics[payload.port] = payload;
      return { metrics: newMetrics };
    },
  },
  {
    event: 'mapping-created',
    handler: (state, payload: any) => {
      return {
        mappings: [...state.mappings, payload],
        events: [
          {
            type: 'mapping_created',
            port: payload.port,
            timestamp: new Date(),
            message: `Created mapping: ${payload.subdomain}.${payload.domain}`,
            severity: 'info',
          },
          ...state.events,
        ].slice(0, 100),
      };
    },
  },
  {
    event: 'mapping-removed',
    handler: (state, payload: { id: string }) => {
      const mapping = state.mappings.find((m: any) => m.id === payload.id);
      return {
        mappings: state.mappings.filter((m: any) => m.id !== payload.id),
        events: mapping
          ? [
              {
                type: 'mapping_removed',
                port: mapping.port,
                timestamp: new Date(),
                message: `Removed mapping: ${mapping.subdomain}.${mapping.domain}`,
                severity: 'info',
              },
              ...state.events,
            ].slice(0, 100)
          : state.events,
      };
    },
  },
];

/**
 * Character-specific event handlers
 */
export const characterEventHandlers: EventHandler<any>[] = [
  {
    event: 'port-event',
    handler: (state, payload: { port: number; eventType: string }) => {
      // Trigger character response through existing handler
      if (state.handlePortEvent) {
        setTimeout(() => {
          state.handlePortEvent(payload.port, payload.eventType);
        }, 0);
      }
      return null;
    },
  },
  {
    event: 'worker-update',
    handler: (state, payload: any) => {
      const updatedWorkers = state.workers.map((w: any) =>
        w.id === payload.id ? { ...w, ...payload.updates } : w
      );
      return { workers: updatedWorkers };
    },
  },
];
