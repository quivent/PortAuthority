/**
 * ServiceAlert Component - MTA-Style Service Alerts
 * Displays port issues and notifications
 */

import React, { useEffect, useState } from 'react';
import { usePortStore } from '../../stores/portStore';
import { ServiceAlert as ServiceAlertType } from '../../types/SubwayMap';
import { PortEventType } from '../../types/Port';
import './ServiceAlert.css';

export const ServiceAlert: React.FC = () => {
  const { events } = usePortStore();
  const [alerts, setAlerts] = useState<ServiceAlertType[]>([]);

  useEffect(() => {
    // Convert recent events to service alerts
    const recentAlerts = events
      .filter((e) => e.severity !== 'info')
      .slice(0, 5)
      .map((event) => ({
        id: `alert-${event.port}-${event.timestamp.getTime()}`,
        severity: event.severity,
        title: getAlertTitle(event.type),
        message: event.message,
        affectedLines: [],
        affectedStations: [`Port ${event.port}`],
        timestamp: event.timestamp,
        acknowledged: false,
      }));

    setAlerts(recentAlerts);
  }, [events]);

  const handleAcknowledge = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );

    // Remove acknowledged alert after animation
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    }, 300);
  };

  const activeAlerts = alerts.filter((a) => !a.acknowledged);

  if (activeAlerts.length === 0) return null;

  return (
    <div
      className="service-alerts-container"
      role="region"
      aria-label="Service alerts and notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="service-alerts-header" role="heading" aria-level={2}>
        <span className="alerts-icon" aria-hidden="true">⚠️</span>
        <h3>Service Alerts</h3>
        <span className="alerts-count" aria-label={`${activeAlerts.length} active alerts`}>
          {activeAlerts.length}
        </span>
      </div>

      <div className="service-alerts-list" role="list">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`service-alert service-alert-${alert.severity}`}
            role="listitem"
            aria-labelledby={`alert-title-${alert.id}`}
            aria-describedby={`alert-message-${alert.id}`}
          >
            <div className="alert-indicator" aria-hidden="true" />
            <div className="alert-content">
              <div className="alert-header">
                <h4 className="alert-title" id={`alert-title-${alert.id}`}>
                  {alert.title}
                </h4>
                <span className="alert-time" aria-label={`Occurred ${formatTimeAgo(alert.timestamp)}`}>
                  {formatTimeAgo(alert.timestamp)}
                </span>
              </div>
              <p className="alert-message" id={`alert-message-${alert.id}`}>
                {alert.message}
              </p>
              {alert.affectedStations.length > 0 && (
                <div
                  className="alert-stations"
                  aria-label={`Affected stations: ${alert.affectedStations.join(', ')}`}
                >
                  Affected: {alert.affectedStations.join(', ')}
                </div>
              )}
            </div>
            <button
              className="alert-dismiss"
              onClick={() => handleAcknowledge(alert.id)}
              aria-label={`Dismiss ${alert.title} alert`}
              title={`Dismiss ${alert.title} alert`}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

function getAlertTitle(eventType: PortEventType): string {
  switch (eventType) {
    case PortEventType.PortClosed:
      return 'Service Ended';
    case PortEventType.HealthChanged:
      return 'Service Change';
    case PortEventType.ConflictDetected:
      return 'Port Conflict';
    case PortEventType.ServiceStopped:
      return 'Service Suspended';
    default:
      return 'Service Alert';
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default ServiceAlert;
