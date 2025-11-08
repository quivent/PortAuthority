// System Tray Service - Frontend integration
// Handles tray updates and interactions from the frontend

import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

/**
 * System tray state
 */
export interface TrayState {
  active_ports: number;
  healthy_ports: number;
  issues: number;
  last_status: string;
}

/**
 * System health status
 */
export enum SystemStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  ERROR = 'error',
  INACTIVE = 'inactive',
}

/**
 * Port menu item for tray display
 */
export interface PortMenuItem {
  port: number;
  name: string;
  status_emoji: string;
}

/**
 * Tray action events
 */
export type TrayAction =
  | 'scan-ports'
  | 'refresh-status'
  | 'navigate';

/**
 * System Tray Service
 * Manages system tray state and interactions
 */
class TrayService {
  private state: TrayState = {
    active_ports: 0,
    healthy_ports: 0,
    issues: 0,
    last_status: 'Initializing...',
  };

  private actionListeners: Map<TrayAction, (() => void)[]> = new Map();
  private eventUnlisten?: () => void;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup Tauri event listeners for tray actions
   */
  private async setupEventListeners() {
    try {
      // Listen for scan ports action from tray
      await listen('action:scan-ports', () => {
        this.triggerAction('scan-ports');
      });

      // Listen for refresh status action
      await listen('action:refresh-status', () => {
        this.triggerAction('refresh-status');
      });

      // Listen for navigation actions
      await listen<string>('navigate', (event) => {
        const route = event.payload;
        console.log('Navigate to:', route);
        // Handle navigation in your router
        if (typeof window !== 'undefined' && window.location) {
          window.location.hash = route;
        }
      });
    } catch (error) {
      console.error('Failed to setup tray listeners:', error);
    }
  }

  /**
   * Update tray tooltip with current state
   */
  async updateTooltip(state: TrayState): Promise<void> {
    this.state = state;

    try {
      await invoke('update_tray_tooltip', { state });
    } catch (error) {
      console.error('Failed to update tray tooltip:', error);
    }
  }

  /**
   * Update tray icon based on system status
   */
  async updateIcon(status: SystemStatus): Promise<void> {
    try {
      await invoke('update_tray_icon', { status });
    } catch (error) {
      console.error('Failed to update tray icon:', error);
    }
  }

  /**
   * Update port status menu in tray
   */
  async updatePortStatusMenu(ports: PortMenuItem[]): Promise<void> {
    try {
      await invoke('update_port_status_menu', { ports });
    } catch (error) {
      console.error('Failed to update port status menu:', error);
    }
  }

  /**
   * Register action listener
   */
  onAction(action: TrayAction, handler: () => void): () => void {
    const handlers = this.actionListeners.get(action) || [];
    handlers.push(handler);
    this.actionListeners.set(action, handlers);

    // Return unsubscribe function
    return () => {
      const currentHandlers = this.actionListeners.get(action) || [];
      const index = currentHandlers.indexOf(handler);
      if (index > -1) {
        currentHandlers.splice(index, 1);
        this.actionListeners.set(action, currentHandlers);
      }
    };
  }

  /**
   * Trigger action listeners
   */
  private triggerAction(action: TrayAction): void {
    const handlers = this.actionListeners.get(action) || [];
    handlers.forEach(handler => handler());
  }

  /**
   * Get current tray state
   */
  getState(): TrayState {
    return { ...this.state };
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    if (this.eventUnlisten) {
      this.eventUnlisten();
    }
    this.actionListeners.clear();
  }
}

/**
 * Singleton instance
 */
export const trayService = new TrayService();

/**
 * React hook for tray integration
 */
export function useTrayIntegration() {
  const updateTrayState = React.useCallback(async (
    activePorts: number,
    healthyPorts: number,
    issues: number,
    status?: string
  ) => {
    const state: TrayState = {
      active_ports: activePorts,
      healthy_ports: healthyPorts,
      issues,
      last_status: status || (issues > 0 ? 'Issues Detected' : 'All Services Running'),
    };

    await trayService.updateTooltip(state);

    // Update icon based on status
    let systemStatus: SystemStatus;
    if (activePorts === 0) {
      systemStatus = SystemStatus.INACTIVE;
    } else if (issues > 0) {
      systemStatus = SystemStatus.ERROR;
    } else if (healthyPorts < activePorts) {
      systemStatus = SystemStatus.WARNING;
    } else {
      systemStatus = SystemStatus.HEALTHY;
    }

    await trayService.updateIcon(systemStatus);
  }, []);

  const updateTrayPorts = React.useCallback(async (ports: Array<{
    port: number;
    name: string;
    healthy: boolean;
  }>) => {
    const portMenuItems: PortMenuItem[] = ports.map(p => ({
      port: p.port,
      name: p.name,
      status_emoji: p.healthy ? '✅' : '⚠️',
    }));

    await trayService.updatePortStatusMenu(portMenuItems);
  }, []);

  const onTrayAction = React.useCallback((
    action: TrayAction,
    handler: () => void
  ) => {
    return trayService.onAction(action, handler);
  }, []);

  return {
    updateTrayState,
    updateTrayPorts,
    onTrayAction,
  };
}

export default trayService;
