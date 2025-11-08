/**
 * Line Component - Subway Line Visualization
 * Draws subway lines connecting stations
 */

import React from 'react';
import { SubwayLine } from '../../types/SubwayMap';

interface LineProps {
  line: SubwayLine;
}

export const Line: React.FC<LineProps> = ({ line }) => {
  if (line.stations.length < 2) return null;

  // Generate smooth path through stations
  const pathData = generateLinePath(line.stations);

  return (
    <g className={`subway-line line-${line.id}`}>
      {/* Main line path */}
      <path
        d={pathData}
        fill="none"
        stroke={line.color}
        strokeWidth={line.isExpress ? 6 : 4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />

      {/* Express line indicator (double line) */}
      {line.isExpress && (
        <path
          d={pathData}
          fill="none"
          stroke="#fff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10,10"
          opacity={0.5}
        />
      )}

      {/* Animated data flow */}
      {line.status === ('good_service' as any) && (
        <>
          <path
            d={pathData}
            fill="none"
            stroke={line.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="10,10"
            opacity={0.6}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-20"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>

          {/* Moving train indicators */}
          {Array.from({ length: line.isExpress ? 2 : 1 }).map((_, i) => (
            <circle key={i} r={4} fill={line.color}>
              <animateMotion
                dur={line.isExpress ? '6s' : '8s'}
                begin={`${i * 3}s`}
                repeatCount="indefinite"
                path={pathData}
              />
            </circle>
          ))}
        </>
      )}

      {/* Line label */}
      {line.stations.length > 0 && (
        <g transform={`translate(${line.stations[0].position.x - 40}, ${line.stations[0].position.y - 20})`}>
          <rect
            x="-25"
            y="-12"
            width="50"
            height="20"
            rx="10"
            fill={line.color}
            opacity="0.9"
          />
          <text
            x="0"
            y="2"
            textAnchor="middle"
            fill="#fff"
            fontSize="11"
            fontWeight="bold"
          >
            {line.serviceType.toUpperCase()}
          </text>
        </g>
      )}
    </g>
  );
};

// Helper function to generate smooth curved path
function generateLinePath(stations: any[]): string {
  if (stations.length === 0) return '';

  const points = stations.map((s) => s.position);

  // Start path
  let path = `M ${points[0].x} ${points[0].y}`;

  // Create smooth curves through points
  for (let i = 1; i < points.length; i++) {
    const current = points[i];
    const previous = points[i - 1];

    if (i === 1) {
      // First segment - simple line
      path += ` L ${current.x} ${current.y}`;
    } else {
      // Subsequent segments - smooth curve
      const controlX = previous.x + (current.x - previous.x) / 2;
      const controlY = previous.y;
      path += ` Q ${controlX} ${controlY}, ${current.x} ${current.y}`;
    }
  }

  return path;
}

export default Line;
