// MTA-Style Notification Card Component
// Displays in-app notifications with NYC Transit Authority theming

import React, { useEffect, useState } from 'react';
import {
  MTANotification,
  MTANotificationType,
  getNotificationStyle,
  ActionType,
} from '../services/notificationService';

interface MTANotificationCardProps {
  notification: MTANotification;
  onDismiss?: (id: string) => void;
  onAction?: (notificationId: string, actionId: string) => void;
}

/**
 * MTA-style notification card with NYC Transit theming
 */
export const MTANotificationCard: React.FC<MTANotificationCardProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const style = getNotificationStyle(notification.notification_type);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (!notification.dismissible) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.dismissible]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss?.(notification.id);
    }, 300);
  };

  const handleActionClick = (actionId: string) => {
    onAction?.(notification.id, actionId);

    // Auto-dismiss after action
    if (notification.dismissible) {
      handleDismiss();
    }
  };

  const getActionIcon = (actionType: ActionType): string => {
    switch (actionType) {
      case ActionType.VIEW_DETAILS:
        return '👁️';
      case ActionType.OPEN_PORT:
        return '🌐';
      case ActionType.FIX_ISSUE:
        return '🔧';
      case ActionType.OPEN_SETTINGS:
        return '⚙️';
      case ActionType.DISMISS:
        return '✖️';
      default:
        return '▶️';
    }
  };

  return (
    <div
      className={`mta-notification ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}
      style={{
        backgroundColor: style.background,
        color: style.color,
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="mta-notification-header">
        <span className="mta-notification-icon" role="img" aria-label="Status icon">
          {style.icon}
        </span>
        <h3 className="mta-notification-title">{notification.title}</h3>
        {notification.dismissible && (
          <button
            className="mta-notification-close"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            ✖️
          </button>
        )}
      </div>

      {/* Message */}
      <div className="mta-notification-body">
        <p className="mta-notification-message">{notification.message}</p>
      </div>

      {/* Service Line Info */}
      {notification.port && (
        <div className="mta-notification-service-line">
          <span className="mta-train-icon" role="img" aria-label="Train line">
            {style.train}
          </span>
          <span className="mta-service-name">
            {notification.service_name || `Port ${notification.port}`}
            {notification.service_name && ` (Port ${notification.port})`}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {notification.actions.length > 0 && (
        <div className="mta-notification-actions">
          {notification.actions.map((action) => (
            <button
              key={action.id}
              className="mta-action-button"
              onClick={() => handleActionClick(action.id)}
              aria-label={action.label}
            >
              <span className="mta-action-icon" role="img">
                {getActionIcon(action.action_type)}
              </span>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div className="mta-notification-footer">
        <time className="mta-notification-time">
          {formatTimestamp(notification.timestamp)}
        </time>
      </div>
    </div>
  );
};

/**
 * Notification container for stacking multiple notifications
 */
interface MTANotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  children: React.ReactNode;
}

export const MTANotificationContainer: React.FC<MTANotificationContainerProps> = ({
  position = 'top-right',
  children,
}) => {
  return (
    <div className={`mta-notification-container ${position}`} role="region" aria-label="Notifications">
      {children}
    </div>
  );
};

/**
 * Format Unix timestamp to relative time
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Example usage component
 */
export const MTANotificationExample: React.FC = () => {
  const [notifications, setNotifications] = useState<MTANotification[]>([]);

  const addNotification = (notification: MTANotification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleAction = (notificationId: string, actionId: string) => {
    console.log(`Action ${actionId} clicked for notification ${notificationId}`);
    // Handle action logic here
  };

  // Example: Add test notifications
  const addTestNotification = () => {
    const testNotification: MTANotification = {
      id: `test-${Date.now()}`,
      notification_type: MTANotificationType.SERVICE_ALERT,
      title: '⚠️ SERVICE CHANGE - Port 3000 Conflict',
      message: 'Port 3000 conflict detected. Another service may be using this port.',
      port: 3000,
      service_name: 'api-server',
      timestamp: Math.floor(Date.now() / 1000),
      dismissible: true,
      actions: [
        {
          id: 'view_details',
          label: 'View Details',
          action_type: ActionType.VIEW_DETAILS,
        },
        {
          id: 'fix_issue',
          label: 'Fix Issue',
          action_type: ActionType.FIX_ISSUE,
        },
      ],
    };
    addNotification(testNotification);
  };

  return (
    <div>
      <button onClick={addTestNotification}>Show Test Notification</button>

      <MTANotificationContainer position="top-right">
        {notifications.map((notification) => (
          <MTANotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
            onAction={handleAction}
          />
        ))}
      </MTANotificationContainer>
    </div>
  );
};

export default MTANotificationCard;
