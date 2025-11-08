/**
 * useViewport Hook - Viewport Calculation for Virtual Rendering
 * Optimizes rendering by calculating visible bounds and managing viewport state
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { MapViewport, Position, Station } from '../types/SubwayMap';

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export interface VisibilityResult {
  visibleStations: Station[];
  totalStations: number;
  culledCount: number;
  bounds: ViewportBounds;
}

interface UseViewportOptions {
  viewport: MapViewport;
  stations: Station[];
  svgWidth: number;
  svgHeight: number;
  bufferZone?: number; // Additional padding for smooth scrolling (default: 200)
}

/**
 * Calculate viewport bounds and determine visible stations
 * Performance optimized for 100+ stations
 */
export const useViewport = ({
  viewport,
  stations,
  svgWidth,
  svgHeight,
  bufferZone = 200,
}: UseViewportOptions): VisibilityResult => {
  // Memoize viewport bounds calculation
  const bounds = useMemo<ViewportBounds>(() => {
    const halfWidth = svgWidth / (2 * viewport.zoom);
    const halfHeight = svgHeight / (2 * viewport.zoom);
    const buffer = bufferZone / viewport.zoom;

    return {
      minX: viewport.centerX - halfWidth - buffer,
      maxX: viewport.centerX + halfWidth + buffer,
      minY: viewport.centerY - halfHeight - buffer,
      maxY: viewport.centerY + halfHeight + buffer,
      width: (halfWidth + buffer) * 2,
      height: (halfHeight + buffer) * 2,
    };
  }, [viewport.centerX, viewport.centerY, viewport.zoom, svgWidth, svgHeight, bufferZone]);

  // Memoize visible stations calculation with spatial partitioning
  const visibleStations = useMemo<Station[]>(() => {
    // Quick spatial culling
    return stations.filter((station) => {
      const pos = station.position;
      return (
        pos.x >= bounds.minX &&
        pos.x <= bounds.maxX &&
        pos.y >= bounds.minY &&
        pos.y <= bounds.maxY
      );
    });
  }, [stations, bounds]);

  // Performance metrics
  const culledCount = stations.length - visibleStations.length;

  return {
    visibleStations,
    totalStations: stations.length,
    culledCount,
    bounds,
  };
};

/**
 * Hook for optimized viewport state management
 * Implements smooth panning with debounced updates
 */
export const useViewportControls = (
  initialViewport: MapViewport,
  onViewportChange: (viewport: MapViewport) => void
) => {
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(initialViewport);

  // Update ref when viewport changes externally
  useEffect(() => {
    viewportRef.current = initialViewport;
  }, [initialViewport]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        const newViewport = {
          ...viewportRef.current,
          centerX: viewportRef.current.centerX - dx / viewportRef.current.zoom,
          centerY: viewportRef.current.centerY - dy / viewportRef.current.zoom,
        };

        viewportRef.current = newViewport;
        onViewportChange(newViewport);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [onViewportChange]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(3, viewportRef.current.zoom * zoomDelta));

      const newViewport = {
        ...viewportRef.current,
        zoom: newZoom,
      };

      viewportRef.current = newViewport;
      onViewportChange(newViewport);
    },
    [onViewportChange]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    isDragging: isDraggingRef.current,
  };
};

/**
 * Calculate if a position is within viewport bounds
 * Optimized for single position checks
 */
export const isPositionVisible = (
  position: Position,
  bounds: ViewportBounds
): boolean => {
  return (
    position.x >= bounds.minX &&
    position.x <= bounds.maxX &&
    position.y >= bounds.minY &&
    position.y <= bounds.maxY
  );
};

/**
 * Calculate Level of Detail based on zoom level
 * Used to dynamically adjust rendering quality
 */
export const calculateLOD = (zoom: number): 'low' | 'medium' | 'high' => {
  if (zoom >= 1.5) return 'high';
  if (zoom >= 0.8) return 'medium';
  return 'low';
};

/**
 * Spatial partitioning for large datasets
 * Divides space into grid cells for faster culling
 */
export interface SpatialGrid {
  cellSize: number;
  cells: Map<string, Station[]>;
}

export const createSpatialGrid = (
  stations: Station[],
  cellSize: number = 500
): SpatialGrid => {
  const cells = new Map<string, Station[]>();

  stations.forEach((station) => {
    const cellX = Math.floor(station.position.x / cellSize);
    const cellY = Math.floor(station.position.y / cellSize);
    const cellKey = `${cellX},${cellY}`;

    if (!cells.has(cellKey)) {
      cells.set(cellKey, []);
    }
    cells.get(cellKey)!.push(station);
  });

  return { cellSize, cells };
};

/**
 * Query visible cells from spatial grid
 * Much faster than checking all stations individually
 */
export const queryVisibleCells = (
  grid: SpatialGrid,
  bounds: ViewportBounds
): Station[] => {
  const visibleStations: Station[] = [];
  const { cellSize, cells } = grid;

  const minCellX = Math.floor(bounds.minX / cellSize);
  const maxCellX = Math.ceil(bounds.maxX / cellSize);
  const minCellY = Math.floor(bounds.minY / cellSize);
  const maxCellY = Math.ceil(bounds.maxY / cellSize);

  for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
    for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
      const cellKey = `${cellX},${cellY}`;
      const cellStations = cells.get(cellKey);

      if (cellStations) {
        // Fine-grained culling within the cell
        cellStations.forEach((station) => {
          if (isPositionVisible(station.position, bounds)) {
            visibleStations.push(station);
          }
        });
      }
    }
  }

  return visibleStations;
};
