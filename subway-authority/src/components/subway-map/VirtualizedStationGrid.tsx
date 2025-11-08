/**
 * VirtualizedStationGrid Component
 * Implements virtual rendering for subway stations with viewport culling
 * Performance target: <100ms render for 100+ stations
 */

import React, { useMemo, useCallback } from 'react';
import { Station as StationType } from '../../types/SubwayMap';
import { Station } from './Station';
import { ViewportBounds } from '../../hooks/useViewport';

interface VirtualizedStationGridProps {
  stations: StationType[];
  visibleStations: StationType[];
  selectedPort: number | null;
  onStationClick: (station: StationType) => void;
  bounds?: ViewportBounds; // Optional for future use
  zoom: number;
}

/**
 * VirtualizedStationGrid - Renders only visible stations
 * Uses React.memo and viewport culling for optimal performance
 */
export const VirtualizedStationGrid: React.FC<VirtualizedStationGridProps> = React.memo(
  ({ stations, visibleStations, selectedPort, onStationClick, zoom }) => {
    // Calculate Level of Detail based on zoom
    const lod = useMemo(() => {
      if (zoom >= 1.5) return 'high';
      if (zoom >= 0.8) return 'medium';
      return 'low';
    }, [zoom]);

    // Optimize connection rendering based on LOD
    const renderConnections = lod !== 'low';
    const showTooltips = lod === 'high';

    // Memoize station click handlers to prevent recreation
    const createStationClickHandler = useCallback(
      (station: StationType) => () => onStationClick(station),
      [onStationClick]
    );

    // Render connection lines only between visible stations
    const visibleConnections = useMemo(() => {
      if (!renderConnections) return [];

      const connections: Array<{
        key: string;
        from: StationType;
        to: StationType;
      }> = [];

      const visibleIds = new Set(visibleStations.map((s) => s.id));

      for (let i = 0; i < visibleStations.length; i++) {
        const station = visibleStations[i];

        // Find next station in the full list
        const stationIndex = stations.findIndex((s) => s.id === station.id);
        const nextStation = stations[stationIndex + 1];

        if (nextStation && visibleIds.has(nextStation.id)) {
          connections.push({
            key: `connection-${station.id}-${nextStation.id}`,
            from: station,
            to: nextStation,
          });
        }
      }

      return connections;
    }, [stations, visibleStations, renderConnections]);

    // Performance monitoring
    const culledPercentage = (
      ((stations.length - visibleStations.length) / stations.length) *
      100
    ).toFixed(1);
    console.debug(
      `[VirtualGrid] Rendering ${visibleStations.length}/${stations.length} stations (${culledPercentage}% culled) at LOD: ${lod}`
    );

    return (
      <>
        {/* Connection paths with animated data flow */}
        {renderConnections && (
          <g className="connections">
            {visibleConnections.map(({ key, from, to }) => (
              <ConnectionLine key={key} from={from} to={to} lod={lod} />
            ))}
          </g>
        )}

        {/* Visible stations only */}
        <g className="stations">
          {visibleStations.map((station) => (
            <Station
              key={station.id}
              station={station}
              isSelected={selectedPort === station.port.port}
              onClick={createStationClickHandler(station)}
              lod={lod}
              showTooltip={showTooltips}
            />
          ))}
        </g>
      </>
    );
  }
);

VirtualizedStationGrid.displayName = 'VirtualizedStationGrid';

/**
 * ConnectionLine - Memoized connection line between stations
 * Optimized with React.memo to prevent unnecessary re-renders
 */
interface ConnectionLineProps {
  from: StationType;
  to: StationType;
  lod: 'low' | 'medium' | 'high';
}

const ConnectionLine: React.FC<ConnectionLineProps> = React.memo(
  ({ from, to, lod }) => {
    const animated = lod === 'high';
    const opacity = lod === 'low' ? 0.2 : 0.3;

    return (
      <line
        x1={from.position.x}
        y1={from.position.y}
        x2={to.position.x}
        y2={to.position.y}
        stroke="#999"
        strokeWidth="2"
        strokeDasharray={animated ? '5,5' : undefined}
        opacity={opacity}
      >
        {animated && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-10"
            dur="1s"
            repeatCount="indefinite"
          />
        )}
      </line>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimal memoization
    return (
      prevProps.from.id === nextProps.from.id &&
      prevProps.to.id === nextProps.to.id &&
      prevProps.lod === nextProps.lod
    );
  }
);

ConnectionLine.displayName = 'ConnectionLine';

/**
 * Performance Metrics Component (Development Only)
 */
interface PerformanceMetricsProps {
  totalStations: number;
  visibleStations: number;
  renderTime: number;
  memoryUsage?: number;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  totalStations,
  visibleStations,
  renderTime,
  memoryUsage,
}) => {
  // Always show in development (can be toggled off in production build)
  if (typeof window === 'undefined') return null;

  const culledPercentage = (
    ((totalStations - visibleStations) / totalStations) *
    100
  ).toFixed(1);

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#0f0',
        padding: '8px 12px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '11px',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <div>Stations: {visibleStations}/{totalStations}</div>
      <div>Culled: {culledPercentage}%</div>
      <div>Render: {renderTime.toFixed(1)}ms</div>
      {memoryUsage && <div>Memory: {(memoryUsage / 1024 / 1024).toFixed(1)}MB</div>}
    </div>
  );
};

export default VirtualizedStationGrid;
