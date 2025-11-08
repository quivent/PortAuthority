// Frontend MTA-Style Notification Service
// Handles in-app notifications with NYC Transit Authority theming

import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

/**
 * MTA Notification Types
 */
export enum MTANotificationType {
  SERVICE_ALERT = 'service_alert',
  PLANNED_WORK = 'planned_work',
  GOOD_SERVICE = 'good_service',
  SERVICE_CHANGE = 'service_change',
  EMERGENCY = 'emergency',
}

/**
 * Notification action types
 */
export enum ActionType {
  VIEW_DETAILS = 'view_details',
  OPEN_PORT = 'open_port',
  FIX_ISSUE = 'fix_issue',
  DISMISS = 'dismiss',
  OPEN_SETTINGS = 'open_settings',
}

/**
 * Notification action button
 */
export interface NotificationAction {
  id: string;
  label: string;
  action_type: ActionType;
}

/**
 * MTA Notification payload
 */
export interface MTANotification {
  id: string;
  notification_type: MTANotificationType;
  title: string;
  message: string;
  port?: number;
  service_name?: string;
  timestamp: number;
  dismissible: boolean;
  actions: NotificationAction[];
}

/**
 * Notification display options
 */
export interface NotificationOptions {
  duration?: number;  // Duration in milliseconds (0 = persistent)
  sound?: boolean;    // Play notification sound
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showInApp?: boolean;  // Show in-app notification
  showDesktop?: boolean; // Show desktop notification
}

/**
 * Default notification options
 */
const DEFAULT_OPTIONS: NotificationOptions = {
  duration: 5000,
  sound: true,
  position: 'top-right',
  showInApp: true,
  showDesktop: true,
};

/**
 * Notification callback handler
 */
type NotificationHandler = (notification: MTANotification) => void;

/**
 * MTA-Style Notification Service
 * Manages both desktop and in-app notifications with NYC Transit theming
 */
class NotificationService {
  private listeners: Map<string, NotificationHandler[]> = new Map();
  private activeNotifications: Map<string, MTANotification> = new Map();
  private eventUnlisten?: () => void;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup Tauri event listeners for backend notifications
   */
  private async setupEventListeners() {
    try {
      this.eventUnlisten = await listen<MTANotification>(
        'notification:new',
        (event) => {
          const notification = event.payload;
          this.handleIncomingNotification(notification);
        }
      );
    } catch (error) {
      console.error('Failed to setup notification listeners:', error);
    }
  }

  /**
   * Handle incoming notification from backend
   */
  private handleIncomingNotification(notification: MTANotification) {
    // Store active notification
    this.activeNotifications.set(notification.id, notification);

    // Notify all listeners
    const handlers = this.listeners.get('notification') || [];
    handlers.forEach(handler => handler(notification));

    // Auto-dismiss if needed
    if (notification.dismissible) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, 5000);
    }
  }

  /**
   * Show a notification
   */
  async show(
    type: MTANotificationType,
    title: string,
    message: string,
    options: Partial<NotificationOptions> = {}
  ): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      if (opts.showDesktop) {
        await invoke('show_mta_notification', {
          notificationType: type,
          title,
          message,
        });
      }

      // In-app notifications are handled via event listeners
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw error;
    }
  }

  /**
   * Show port conflict notification
   */
  async notifyPortConflict(port: number, serviceName: string): Promise<void> {
    try {
      await invoke('notify_port_conflict', {
        port,
        serviceName,
      });
    } catch (error) {
      console.error('Failed to show port conflict notification:', error);
      throw error;
    }
  }

  /**
   * Show service down notification
   */
  async notifyServiceDown(port: number, serviceName: string): Promise<void> {
    try {
      await invoke('notify_service_down', {
        port,
        serviceName,
      });
    } catch (error) {
      console.error('Failed to show service down notification:', error);
      throw error;
    }
  }

  /**
   * Show all services healthy notification
   */
  async notifyAllHealthy(totalPorts: number): Promise<void> {
    try {
      await invoke('notify_all_healthy', {
        totalPorts,
      });
    } catch (error) {
      console.error('Failed to show healthy notification:', error);
      throw error;
    }
  }

  /**
   * Show configuration change notification
   */
  async notifyConfigChange(description: string): Promise<void> {
    await this.show(
      MTANotificationType.PLANNED_WORK,
      '🔧 PLANNED WORK - Configuration Updated',
      `Configuration change: ${description}. Changes take effect immediately.`
    );
  }

  /**
   * Show new mapping notification
   */
  async notifyMappingCreated(subdomain: string, port: number): Promise<void> {
    await this.show(
      MTANotificationType.SERVICE_CHANGE,
      '🚇 SERVICE CHANGE - New Route Created',
      `New subdomain mapping: ${subdomain}.localhost → Port ${port}. Service is now accessible.`
    );
  }

  /**
   * Register notification listener
   */
  on(event: 'notification', handler: NotificationHandler): () => void {
    const handlers = this.listeners.get(event) || [];
    handlers.push(handler);
    this.listeners.set(event, handlers);

    // Return unsubscribe function
    return () => {
      const currentHandlers = this.listeners.get(event) || [];
      const index = currentHandlers.indexOf(handler);
      if (index > -1) {
        currentHandlers.splice(index, 1);
        this.listeners.set(event, currentHandlers);
      }
    };
  }

  /**
   * Dismiss a notification
   */
  dismiss(notificationId: string): void {
    this.activeNotifications.delete(notificationId);

    // Notify listeners about dismissal
    const handlers = this.listeners.get('notification') || [];
    handlers.forEach(handler => {
      // Send a dismiss notification (could extend MTANotification interface)
      console.log(`Dismissed notification: ${notificationId}`);
    });
  }

  /**
   * Get all active notifications
   */
  getActiveNotifications(): MTANotification[] {
    return Array.from(this.activeNotifications.values());
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.activeNotifications.clear();
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    if (this.eventUnlisten) {
      this.eventUnlisten();
    }
    this.listeners.clear();
    this.activeNotifications.clear();
  }
}

/**
 * Singleton instance
 */
export const notificationService = new NotificationService();

/**
 * React hook for notifications (example implementation)
 */
export function useNotifications() {
  const [notifications, setNotifications] = React.useState<MTANotification[]>([]);

  React.useEffect(() => {
    const unsubscribe = notificationService.on('notification', (notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const showNotification = React.useCallback(
    (
      type: MTANotificationType,
      title: string,
      message: string,
      options?: Partial<NotificationOptions>
    ) => {
      return notificationService.show(type, title, message, options);
    },
    []
  );

  const dismissNotification = React.useCallback((id: string) => {
    notificationService.dismiss(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    notifications,
    showNotification,
    dismissNotification,
    clearAll: () => {
      notificationService.clearAll();
      setNotifications([]);
    },
  };
}

/**
 * MTA Notification styling utilities
 */
export const MTANotificationStyles = {
  [MTANotificationType.SERVICE_ALERT]: {
    background: '#FF6319',  // MTA Orange
    color: '#FFFFFF',
    icon: '⚠️',
    train: '🚈',
  },
  [MTANotificationType.PLANNED_WORK]: {
    background: '#FCCC02',  // NYC Yellow
    color: '#333333',
    icon: '🔧',
    train: '🚊',
  },
  [MTANotificationType.GOOD_SERVICE]: {
    background: '#00933C',  // MTA Green
    color: '#FFFFFF',
    icon: '✅',
    train: '🚇',
  },
  [MTANotificationType.SERVICE_CHANGE]: {
    background: '#0039A6',  // MTA Blue
    color: '#FFFFFF',
    icon: '🚇',
    train: '🚇',
  },
  [MTANotificationType.EMERGENCY]: {
    background: '#EE352E',  // MTA Red
    color: '#FFFFFF',
    icon: '🚫',
    train: '🚨',
  },
};

/**
 * Get notification style for a given type
 */
export function getNotificationStyle(type: MTANotificationType) {
  return MTANotificationStyles[type];
}

/**
 * Format notification for MTA style display
 */
export function formatMTANotification(notification: MTANotification): string {
  const style = getNotificationStyle(notification.notification_type);
  const serviceLine = notification.port
    ? notification.service_name
      ? `${notification.service_name} (Port ${notification.port})`
      : `Port ${notification.port}`
    : 'System';

  return `
${style.icon} ${notification.title}

${notification.message}

${style.train} Train Line ${serviceLine}
  `.trim();
}

export default notificationService;
