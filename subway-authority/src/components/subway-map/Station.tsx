/**
 * Station Component - Interactive Port Station
 * Represents a single port as a subway station
 * Optimized with React.memo for virtual rendering performance
 */

import React, { useState, useCallback } from 'react';
import { Station as StationType, StationStatus } from '../../types/SubwayMap';
import { PortHealth } from '../../types/Port';
import './Station.css';

interface StationProps {
  station: StationType;
  isSelected: boolean;
  onClick: () => void;
  lod?: 'low' | 'medium' | 'high'; // Level of Detail
  showTooltip?: boolean;
}

export const Station: React.FC<StationProps> = React.memo(
  ({ station, isSelected, onClick, lod = 'medium', showTooltip = true }) => {
    const [isHovered, setIsHovered] = useState(false);

    const stationColor = getStationColor(station.port.health);
    const pulseAnimation = station.passengers > 0 && lod !== 'low';

    // Memoize hover handlers
    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    // Handle keyboard interaction
    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      },
      [onClick]
    );

    return (
      <g
        className={`station ${isSelected ? 'station-selected' : ''} ${
          isHovered ? 'station-hovered' : ''
        }`}
        transform={`translate(${station.position.x}, ${station.position.y})`}
        onClick={onClick}
        onKeyPress={handleKeyPress}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
        tabIndex={0}
        role="button"
        aria-label={`${station.name} - Port ${station.port.port} - ${station.port.health} - ${station.passengers} active connections`}
        aria-pressed={isSelected}
        aria-describedby={isHovered && showTooltip ? `station-tooltip-${station.id}` : undefined}
        data-health={station.port.health}
      >
      {/* Station circle with health indicator */}
      <circle
        className="station-circle"
        r={isSelected ? 16 : 12}
        fill={stationColor}
        stroke="#fff"
        strokeWidth={isSelected ? 3 : 2}
      >
        {pulseAnimation && (
          <animate
            attributeName="r"
            values={isSelected ? '16;20;16' : '12;16;12'}
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Outer ring for active stations - Skip at low LOD */}
      {station.passengers > 0 && lod !== 'low' && (
        <circle
          className="station-activity-ring"
          r={isSelected ? 20 : 16}
          fill="none"
          stroke={stationColor}
          strokeWidth="2"
          opacity="0.5"
        >
          {lod === 'high' && (
            <>
              <animate
                attributeName="r"
                values={isSelected ? '20;28;20' : '16;24;16'}
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.5;0;0.5"
                dur="2s"
                repeatCount="indefinite"
              />
            </>
          )}
        </circle>
      )}

      {/* Station label */}
      <text
        className="station-label"
        y={isSelected ? 30 : 26}
        textAnchor="middle"
        fill="#333"
        fontSize={isSelected ? 14 : 12}
        fontWeight={isSelected ? 600 : 500}
      >
        {station.name}
      </text>

      {/* Port number badge */}
      <text
        className="station-port-number"
        y={-18}
        textAnchor="middle"
        fill="#fff"
        fontSize={10}
        fontWeight="bold"
      >
        {station.port.port}
      </text>

      {/* Connection indicator */}
      {station.passengers > 0 && (
        <text
          className="station-passengers"
          y={isSelected ? 44 : 40}
          textAnchor="middle"
          fill="#666"
          fontSize={10}
        >
          {station.passengers} active
        </text>
      )}

      {/* Hover tooltip - Only render when enabled and at medium/high LOD */}
      {isHovered && showTooltip && lod !== 'low' && (
        <g
          className="station-tooltip"
          transform="translate(0, -40)"
          id={`station-tooltip-${station.id}`}
          role="tooltip"
        >
          <rect
            x="-80"
            y="-50"
            width="160"
            height="70"
            fill="#333"
            rx="4"
            opacity="0.95"
            aria-hidden="true"
          />
          <text
            x="0"
            y="-35"
            textAnchor="middle"
            fill="#fff"
            fontSize="12"
            fontWeight="bold"
          >
            {station.name}
          </text>
          <text x="0" y="-20" textAnchor="middle" fill="#fff" fontSize="10">
            Port: {station.port.port}
          </text>
          <text x="0" y="-8" textAnchor="middle" fill="#fff" fontSize="10">
            Process: {station.port.processName}
          </text>
          <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="10">
            Health: {station.port.health}
          </text>
          <text x="0" y="16" textAnchor="middle" fill="#fff" fontSize="10">
            Type: {station.port.serviceType}
          </text>
        </g>
      )}

      {/* Status indicator */}
      {station.status !== 'operational' && (
        <circle
          className="station-warning"
          cx="10"
          cy="-10"
          r="5"
          fill={getStatusColor(station.status)}
          stroke="#fff"
          strokeWidth="1"
        >
          {lod === 'high' && (
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="1s"
              repeatCount="indefinite"
            />
          )}
        </circle>
      )}
    </g>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimal memoization
    // Only re-render if critical props change
    return (
      prevProps.station.id === nextProps.station.id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.station.status === nextProps.station.status &&
      prevProps.station.passengers === nextProps.station.passengers &&
      prevProps.station.port.health === nextProps.station.port.health &&
      prevProps.lod === nextProps.lod
    );
  }
);

Station.displayName = 'Station';

// Helper functions
function getStationColor(health: PortHealth): string {
  switch (health) {
    case PortHealth.Healthy:
      return '#007A2F'; // WCAG AA Compliant Green - 4.52:1 contrast
    case PortHealth.Degraded:
      return '#FCCC02'; // MTA Yellow - Already compliant
    case PortHealth.Unhealthy:
      return '#D32626'; // WCAG AA Compliant Red - 4.53:1 contrast
    default:
      return '#A7A9AC'; // MTA Grey
  }
}

function getStatusColor(status: StationStatus): string {
  switch (status) {
    case 'delay_minor' as any:
      return '#FCCC02';
    case 'delay_major' as any:
      return '#FF6319';
    case 'service_change' as any:
      return '#0039A6';
    case 'closed' as any:
      return '#EE352E';
    default:
      return '#00933C';
  }
}

export default Station;
