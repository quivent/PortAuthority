/**
 * MapControls Component - Zoom and Navigation Controls
 * Provides user controls for map interaction
 */

import React from 'react';
import { MapViewport } from '../../types/SubwayMap';
import './MapControls.css';

interface MapControlsProps {
  viewport: MapViewport;
  onViewportChange: (viewport: MapViewport) => void;
  onResetView: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  viewport,
  onViewportChange,
  onResetView,
}) => {
  const handleZoomIn = () => {
    onViewportChange({
      ...viewport,
      zoom: Math.min(3, viewport.zoom * 1.2),
    });
  };

  const handleZoomOut = () => {
    onViewportChange({
      ...viewport,
      zoom: Math.max(0.5, viewport.zoom / 1.2),
    });
  };

  const handleRotateLeft = () => {
    onViewportChange({
      ...viewport,
      rotation: (viewport.rotation - 15) % 360,
    });
  };

  const handleRotateRight = () => {
    onViewportChange({
      ...viewport,
      rotation: (viewport.rotation + 15) % 360,
    });
  };

  return (
    <div className="map-controls">
      <div className="control-group">
        <button
          className="control-button"
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="Zoom in"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path
              d="M10 4v12M4 10h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          className="control-button"
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="Zoom out"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path
              d="M4 10h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="control-group">
        <button
          className="control-button"
          onClick={handleRotateLeft}
          title="Rotate Left"
          aria-label="Rotate left"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path
              d="M10 2 L10 6 M10 2 L6 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <circle
              cx="10"
              cy="10"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray="18 10"
              strokeDashoffset="4"
            />
          </svg>
        </button>
        <button
          className="control-button"
          onClick={handleRotateRight}
          title="Rotate Right"
          aria-label="Rotate right"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path
              d="M10 2 L10 6 M10 2 L14 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <circle
              cx="10"
              cy="10"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray="18 10"
              strokeDashoffset="-4"
            />
          </svg>
        </button>
      </div>

      <button
        className="control-button control-reset"
        onClick={onResetView}
        title="Reset View"
        aria-label="Reset view"
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path
            d="M10 2 L10 4 M2 10 L4 10 M10 16 L10 18 M16 10 L18 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="10"
            cy="10"
            r="4"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </button>

      <div className="zoom-indicator">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
};

export default MapControls;
