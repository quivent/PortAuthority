/**
 * SubwayMap Component - Main Interactive Map
 * NYC MTA-inspired port routing visualization
 * Performance optimized with virtual rendering for 100+ stations
 * Target: <100ms render time
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePortStore } from '../../stores/portStore';
import { VirtualizedStationGrid, PerformanceMetrics } from './VirtualizedStationGrid';
import { Line } from './Line';
import { ServiceAlert } from './ServiceAlert';
import { MapControls } from './MapControls';
import { StationBoard } from './StationBoard';
import {
  Station as StationType,
  SubwayLine,
  MapViewport,
  NYC_SUBWAY_COLORS,
  LINE_NAMES,
} from '../../types/SubwayMap';
import { ServiceType } from '../../types/Port';
import { useViewport } from '../../hooks/useViewport';
import './SubwayMap.css';

export const SubwayMap: React.FC = () => {
  const { ports, selectedPort, setSelectedPort } = usePortStore();
  const [viewport, setViewport] = useState<MapViewport>({
    centerX: 600,
    centerY: 400,
    zoom: 1,
    rotation: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [renderTime, setRenderTime] = useState(0);
  const renderStartRef = useRef<number>(0);

  // SVG dimensions for viewport calculations
  const SVG_WIDTH = 1200;
  const SVG_HEIGHT = 800;

  // Convert ports to stations (memoized for performance)
  const stations = useMemo<StationType[]>(() => {
    renderStartRef.current = performance.now();

    return ports.map((port, index) => ({
      id: `station-${port.port}`,
      name: port.subdomain || `Port ${port.port}`,
      port,
      position: calculateStationPosition(index, ports.length),
      lines: [],
      connections: [],
      status: mapPortStatusToStationStatus(port.status),
      passengers: port.connections || 0,
    }));
  }, [ports]);

  // Use viewport hook for virtual rendering
  const { visibleStations, totalStations, bounds } = useViewport({
    viewport,
    stations,
    svgWidth: SVG_WIDTH,
    svgHeight: SVG_HEIGHT,
    bufferZone: 200,
  });

  // Track render time for performance metrics
  useEffect(() => {
    if (renderStartRef.current > 0) {
      const elapsed = performance.now() - renderStartRef.current;
      setRenderTime(elapsed);
      renderStartRef.current = 0;

      // Log performance warnings if render time exceeds target
      if (elapsed > 100) {
        console.warn(
          `[SubwayMap] Render time ${elapsed.toFixed(1)}ms exceeds 100ms target`
        );
      }
    }
  });

  // Group stations into subway lines by service type
  const subwayLines = useMemo<SubwayLine[]>(() => {
    const lineMap = new Map<ServiceType, StationType[]>();

    stations.forEach((station) => {
      const serviceType = station.port.serviceType;
      if (!lineMap.has(serviceType)) {
        lineMap.set(serviceType, []);
      }
      lineMap.get(serviceType)!.push(station);
    });

    return Array.from(lineMap.entries()).map(([serviceType, stationList]) => ({
      id: `line-${serviceType}`,
      name: LINE_NAMES[serviceType] || 'Unknown Line',
      color: NYC_SUBWAY_COLORS[serviceType] || '#A7A9AC',
      serviceType,
      stations: stationList,
      status: 'good_service' as any,
      isExpress: stationList.length > 5,
    }));
  }, [stations]);

  // Handle mouse interactions for pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        renderStartRef.current = performance.now();
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        setViewport((prev) => ({
          ...prev,
          centerX: prev.centerX - dx / prev.zoom,
          centerY: prev.centerY - dy / prev.zoom,
        }));

        setDragStart({ x: e.clientX, y: e.clientY });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    renderStartRef.current = performance.now();
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;

    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(3, prev.zoom * zoomDelta)),
    }));
  }, []);

  // Handle station click
  const handleStationClick = useCallback(
    (station: StationType) => {
      setSelectedPort(
        selectedPort === station.port.port ? null : station.port.port
      );
    },
    [selectedPort, setSelectedPort]
  );

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = stations.findIndex(s => s.port.port === selectedPort);

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % stations.length;
          setSelectedPort(stations[nextIndex].port.port);
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
          setSelectedPort(stations[prevIndex].port.port);
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (currentIndex >= 0) {
            handleStationClick(stations[currentIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setSelectedPort(null);
          break;

        case 'Home':
          e.preventDefault();
          setSelectedPort(stations[0].port.port);
          break;

        case 'End':
          e.preventDefault();
          setSelectedPort(stations[stations.length - 1].port.port);
          break;
      }
    },
    [stations, selectedPort, setSelectedPort, handleStationClick]
  );

  return (
    <div
      className="subway-map-container"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Subway Authority Network Map - Use arrow keys to navigate stations, Enter to select, Escape to deselect"
    >
      <div className="subway-map-header">
        <h1 className="subway-map-title">Subway Authority Network Map</h1>
        <div className="subway-map-legend" role="region" aria-label="Service lines legend">
          {subwayLines.map((line) => (
            <div key={line.id} className="legend-item" role="listitem">
              <div
                className="legend-color"
                style={{ backgroundColor: line.color }}
                aria-hidden="true"
              />
              <span className="legend-label">{line.name}</span>
              <span className="legend-count" aria-label={`${line.stations.length} stops on ${line.name}`}>
                {line.stations.length} stops
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="subway-map-main">
        <svg
          className="subway-map-svg"
          viewBox={`${viewport.centerX - 600 / viewport.zoom} ${
            viewport.centerY - 400 / viewport.zoom
          } ${1200 / viewport.zoom} ${800 / viewport.zoom}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          role="img"
          aria-label="Interactive subway network map showing all port stations and their connections"
        >
          {/* Background grid */}
          <defs>
            <pattern
              id="grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="#E6E6E6"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Subway lines */}
          <g className="subway-lines">
            {subwayLines.map((line) => (
              <Line key={line.id} line={line} />
            ))}
          </g>

          {/* Virtualized station rendering - Only visible stations */}
          <VirtualizedStationGrid
            stations={stations}
            visibleStations={visibleStations}
            selectedPort={selectedPort}
            onStationClick={handleStationClick}
            bounds={bounds}
            zoom={viewport.zoom}
          />
        </svg>

        {/* Map controls */}
        <MapControls
          viewport={viewport}
          onViewportChange={setViewport}
          onResetView={() => {
            renderStartRef.current = performance.now();
            setViewport({
              centerX: 600,
              centerY: 400,
              zoom: 1,
              rotation: 0,
            });
          }}
        />

        {/* Performance metrics (dev mode only) */}
        <PerformanceMetrics
          totalStations={totalStations}
          visibleStations={visibleStations.length}
          renderTime={renderTime}
        />
      </div>

      {/* Station board showing selected port details */}
      {selectedPort && (
        <StationBoard
          port={ports.find((p) => p.port === selectedPort)!}
          onClose={() => setSelectedPort(null)}
        />
      )}

      {/* Service alerts */}
      <ServiceAlert />
    </div>
  );
};

// Helper functions
function calculateStationPosition(
  index: number,
  total: number
): { x: number; y: number } {
  // Create a visually pleasing subway map layout
  // Distribute stations in a spiral pattern
  const angle = (index / total) * Math.PI * 4;
  const radius = 150 + (index / total) * 200;

  return {
    x: 600 + Math.cos(angle) * radius,
    y: 400 + Math.sin(angle) * radius,
  };
}

function mapPortStatusToStationStatus(status: string): any {
  switch (status) {
    case 'active':
      return 'operational';
    case 'warning':
      return 'delay_minor';
    case 'error':
      return 'delay_major';
    case 'stopped':
      return 'closed';
    default:
      return 'operational';
  }
}

export default SubwayMap;
