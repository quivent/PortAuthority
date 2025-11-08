/**
 * StationBoard Component - Port Details Display
 * Shows detailed information for selected port
 */

import React from 'react';
import { PortInfo } from '../../types/Port';
import { usePortStore } from '../../stores/portStore';
import './StationBoard.css';

interface StationBoardProps {
  port: PortInfo;
  onClose: () => void;
}

export const StationBoard: React.FC<StationBoardProps> = ({
  port,
  onClose,
}) => {
  const { mappings, metrics } = usePortStore();
  const portMappings = mappings.filter((m) => m.port === port.port);
  const portMetrics = metrics.get(port.port);

  return (
    <div className="station-board">
      <div className="station-board-header">
        <div className="station-board-title">
          <h2>Port {port.port}</h2>
          <span className={`status-badge status-${port.status}`}>
            {port.status}
          </span>
        </div>
        <button
          className="station-board-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="station-board-content">
        {/* Service Information */}
        <div className="board-section">
          <h3>Service Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Process</span>
              <span className="info-value">{port.processName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">PID</span>
              <span className="info-value">{port.pid}</span>
            </div>
            <div className="info-item">
              <span className="info-label">User</span>
              <span className="info-value">{port.user}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Type</span>
              <span className="info-value">
                <span className={`service-type-badge type-${port.serviceType}`}>
                  {port.serviceType}
                </span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Health</span>
              <span className="info-value">
                <span className={`health-badge health-${port.health}`}>
                  {port.health}
                </span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Uptime</span>
              <span className="info-value">{formatUptime(port.uptime)}</span>
            </div>
          </div>
        </div>

        {/* Domain Mappings */}
        <div className="board-section">
          <h3>Domain Mappings</h3>
          {portMappings.length > 0 ? (
            <div className="mappings-list">
              {portMappings.map((mapping) => (
                <div key={mapping.id} className="mapping-item">
                  <span className="mapping-subdomain">
                    {mapping.subdomain}.{mapping.domain}
                  </span>
                  <span
                    className={`mapping-status ${
                      mapping.enabled ? 'enabled' : 'disabled'
                    }`}
                  >
                    {mapping.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-mappings">No domain mappings configured</p>
          )}
        </div>

        {/* Performance Metrics */}
        {portMetrics && (
          <div className="board-section">
            <h3>Performance Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Requests/sec</span>
                <span className="metric-value">
                  {portMetrics.requestsPerSecond.toFixed(1)}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Avg Response</span>
                <span className="metric-value">
                  {portMetrics.averageResponseTime.toFixed(0)}ms
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Error Rate</span>
                <span className="metric-value">
                  {(portMetrics.errorRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Memory</span>
                <span className="metric-value">
                  {formatBytes(portMetrics.memoryUsage)}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">CPU</span>
                <span className="metric-value">
                  {portMetrics.cpuUsage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="board-section">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-button primary">
              Open in Browser
            </button>
            <button className="action-button">Add Mapping</button>
            <button className="action-button">View Logs</button>
            <button className="action-button danger">Stop Service</button>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

export default StationBoard;
