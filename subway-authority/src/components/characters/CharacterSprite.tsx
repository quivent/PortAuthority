/**
 * CharacterSprite Component
 * SVG-based NYC subway worker illustrations
 */

import React from 'react';
import { CharacterType, CharacterMood } from '../../types/character-types';

interface CharacterSpriteProps {
  type: CharacterType;
  mood: CharacterMood;
  size?: number;
  className?: string;
}

/**
 * Get color scheme based on mood
 */
function getMoodColors(mood: CharacterMood): {
  primary: string;
  secondary: string;
  accent: string;
} {
  switch (mood) {
    case CharacterMood.HAPPY:
      return {
        primary: '#10b981', // green
        secondary: '#34d399',
        accent: '#fbbf24', // yellow accent
      };
    case CharacterMood.CONTENT:
      return {
        primary: '#3b82f6', // blue
        secondary: '#60a5fa',
        accent: '#93c5fd',
      };
    case CharacterMood.NEUTRAL:
      return {
        primary: '#6b7280', // gray
        secondary: '#9ca3af',
        accent: '#d1d5db',
      };
    case CharacterMood.CONCERNED:
      return {
        primary: '#f59e0b', // amber
        secondary: '#fbbf24',
        accent: '#fcd34d',
      };
    case CharacterMood.FRUSTRATED:
      return {
        primary: '#ef4444', // red
        secondary: '#f87171',
        accent: '#fca5a5',
      };
    case CharacterMood.ANGRY:
      return {
        primary: '#dc2626', // dark red
        secondary: '#991b1b',
        accent: '#ef4444',
      };
  }
}

/**
 * Transit Conductor SVG
 */
const TransitConductorSVG: React.FC<{ mood: CharacterMood; size: number }> = ({
  mood,
  size,
}) => {
  const colors = getMoodColors(mood);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Transit Conductor"
    >
      {/* Body */}
      <ellipse cx="50" cy="70" rx="20" ry="25" fill={colors.primary} />

      {/* Head */}
      <circle cx="50" cy="35" r="18" fill="#fbbf24" />

      {/* Hat */}
      <rect x="35" y="20" width="30" height="8" rx="2" fill={colors.secondary} />
      <rect x="40" y="16" width="20" height="6" rx="1" fill={colors.primary} />

      {/* Hat badge */}
      <circle cx="50" cy="19" r="3" fill="#fbbf24" />

      {/* Eyes */}
      {mood === CharacterMood.HAPPY || mood === CharacterMood.CONTENT ? (
        <>
          <path d="M43 32 Q45 35 47 32" stroke="#000" strokeWidth="2" fill="none" />
          <path d="M53 32 Q55 35 57 32" stroke="#000" strokeWidth="2" fill="none" />
        </>
      ) : mood === CharacterMood.ANGRY || mood === CharacterMood.FRUSTRATED ? (
        <>
          <path d="M43 35 L47 32" stroke="#000" strokeWidth="2" />
          <path d="M53 32 L57 35" stroke="#000" strokeWidth="2" />
          <line x1="42" y1="30" x2="46" y2="28" stroke="#000" strokeWidth="2" />
          <line x1="54" y1="28" x2="58" y2="30" stroke="#000" strokeWidth="2" />
        </>
      ) : (
        <>
          <circle cx="45" cy="33" r="2" fill="#000" />
          <circle cx="55" cy="33" r="2" fill="#000" />
        </>
      )}

      {/* Mouth */}
      {mood === CharacterMood.HAPPY ? (
        <path d="M42 42 Q50 48 58 42" stroke="#000" strokeWidth="2" fill="none" />
      ) : mood === CharacterMood.ANGRY || mood === CharacterMood.FRUSTRATED ? (
        <path d="M42 46 Q50 40 58 46" stroke="#000" strokeWidth="2" fill="none" />
      ) : (
        <line x1="43" y1="44" x2="57" y2="44" stroke="#000" strokeWidth="2" />
      )}

      {/* Arms */}
      <rect
        x="25"
        y="60"
        width="8"
        height="25"
        rx="4"
        fill={colors.primary}
        transform="rotate(-20 29 60)"
      />
      <rect
        x="67"
        y="60"
        width="8"
        height="25"
        rx="4"
        fill={colors.primary}
        transform="rotate(20 71 60)"
      />

      {/* Signal flag (held in right hand) */}
      {mood === CharacterMood.HAPPY && (
        <g transform="translate(75, 80)">
          <rect x="0" y="0" width="3" height="15" fill="#8b4513" />
          <rect x="3" y="0" width="10" height="8" fill="#22c55e" />
        </g>
      )}
    </svg>
  );
};

/**
 * Station Master SVG
 */
const StationMasterSVG: React.FC<{ mood: CharacterMood; size: number }> = ({
  mood,
  size,
}) => {
  const colors = getMoodColors(mood);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Station Master"
    >
      {/* Body */}
      <ellipse cx="50" cy="70" rx="22" ry="26" fill={colors.primary} />

      {/* Head */}
      <circle cx="50" cy="32" r="17" fill="#fbbf24" />

      {/* Glasses */}
      <circle cx="44" cy="32" r="6" fill="none" stroke="#000" strokeWidth="2" />
      <circle cx="56" cy="32" r="6" fill="none" stroke="#000" strokeWidth="2" />
      <line x1="50" y1="32" x2="50" y2="32" stroke="#000" strokeWidth="2" />

      {/* Eyes through glasses */}
      {mood === CharacterMood.ANGRY || mood === CharacterMood.FRUSTRATED ? (
        <>
          <circle cx="44" cy="32" r="2" fill="#000" />
          <circle cx="56" cy="32" r="2" fill="#000" />
          <line x1="40" y1="29" x2="43" y2="31" stroke="#000" strokeWidth="2" />
          <line x1="57" y1="31" x2="60" y2="29" stroke="#000" strokeWidth="2" />
        </>
      ) : (
        <>
          <circle cx="44" cy="32" r="2" fill="#000" />
          <circle cx="56" cy="32" r="2" fill="#000" />
        </>
      )}

      {/* Mouth */}
      {mood === CharacterMood.HAPPY ? (
        <path d="M42 40 Q50 44 58 40" stroke="#000" strokeWidth="2" fill="none" />
      ) : mood === CharacterMood.ANGRY || mood === CharacterMood.FRUSTRATED ? (
        <path d="M42 43 Q50 39 58 43" stroke="#000" strokeWidth="2" fill="none" />
      ) : (
        <line x1="43" y1="41" x2="57" y2="41" stroke="#000" strokeWidth="2" />
      )}

      {/* Tie */}
      <polygon points="50,48 47,52 50,68 53,52" fill={colors.accent} />

      {/* Clipboard (held in left hand) */}
      <g transform="translate(20, 65)">
        <rect x="0" y="0" width="15" height="20" rx="1" fill="#e5e7eb" stroke="#000" strokeWidth="1" />
        <line x1="3" y1="5" x2="12" y2="5" stroke="#3b82f6" strokeWidth="1" />
        <line x1="3" y1="9" x2="12" y2="9" stroke="#3b82f6" strokeWidth="1" />
        <line x1="3" y1="13" x2="12" y2="13" stroke="#3b82f6" strokeWidth="1" />
      </g>

      {/* Arms */}
      <rect x="24" y="55" width="7" height="22" rx="3" fill={colors.primary} />
      <rect x="69" y="55" width="7" height="22" rx="3" fill={colors.primary} />
    </svg>
  );
};

/**
 * Maintenance Crew SVG
 */
const MaintenanceCrewSVG: React.FC<{ mood: CharacterMood; size: number }> = ({
  mood,
  size,
}) => {
  const colors = getMoodColors(mood);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Maintenance Crew"
    >
      {/* Body - work vest */}
      <ellipse cx="50" cy="70" rx="23" ry="27" fill="#fb923c" />
      <ellipse cx="50" cy="70" rx="20" ry="24" fill={colors.primary} />

      {/* Head */}
      <circle cx="50" cy="33" r="16" fill="#fbbf24" />

      {/* Hard hat */}
      <ellipse cx="50" cy="20" rx="18" ry="8" fill={colors.secondary} />
      <rect x="32" y="20" width="36" height="6" rx="3" fill={colors.primary} />

      {/* Eyes */}
      {mood === CharacterMood.HAPPY || mood === CharacterMood.CONTENT ? (
        <>
          <path d="M42 31 Q44 34 46 31" stroke="#000" strokeWidth="2" fill="none" />
          <path d="M54 31 Q56 34 58 31" stroke="#000" strokeWidth="2" fill="none" />
        </>
      ) : (
        <>
          <circle cx="44" cy="32" r="2" fill="#000" />
          <circle cx="56" cy="32" r="2" fill="#000" />
        </>
      )}

      {/* Mouth */}
      {mood === CharacterMood.HAPPY ? (
        <path d="M42 39 Q50 43 58 39" stroke="#000" strokeWidth="2" fill="none" />
      ) : mood === CharacterMood.FRUSTRATED ? (
        <line x1="43" y1="40" x2="57" y2="40" stroke="#000" strokeWidth="2" />
      ) : (
        <path d="M45 39 L55 39" stroke="#000" strokeWidth="2" />
      )}

      {/* Tool belt */}
      <rect x="35" y="82" width="30" height="5" rx="1" fill="#78350f" />

      {/* Wrench (in hand) */}
      <g transform="translate(70, 70) rotate(45)">
        <rect x="0" y="0" width="4" height="20" fill="#94a3b8" />
        <rect x="-2" y="0" width="8" height="5" rx="1" fill="#94a3b8" />
      </g>

      {/* Arms */}
      <rect x="25" y="58" width="7" height="24" rx="3" fill={colors.primary} />
      <rect x="68" y="58" width="7" height="24" rx="3" fill={colors.primary} />
    </svg>
  );
};

/**
 * Track Inspector SVG
 */
const TrackInspectorSVG: React.FC<{ mood: CharacterMood; size: number }> = ({
  mood,
  size,
}) => {
  const colors = getMoodColors(mood);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Track Inspector"
    >
      {/* Body */}
      <ellipse cx="50" cy="72" rx="21" ry="25" fill={colors.primary} />

      {/* Head */}
      <circle cx="50" cy="34" r="17" fill="#fbbf24" />

      {/* Cap */}
      <ellipse cx="50" cy="20" rx="19" ry="7" fill={colors.secondary} />
      <ellipse cx="55" cy="20" rx="15" ry="5" fill={colors.primary} />

      {/* Eyes - focused/inspecting */}
      <circle cx="44" cy="33" r="2" fill="#000" />
      <circle cx="56" cy="33" r="2" fill="#000" />
      {mood === CharacterMood.CONCERNED || mood === CharacterMood.FRUSTRATED ? (
        <>
          <line x1="40" y1="30" x2="44" y2="32" stroke="#000" strokeWidth="2" />
          <line x1="56" y1="32" x2="60" y2="30" stroke="#000" strokeWidth="2" />
        </>
      ) : null}

      {/* Mouth */}
      {mood === CharacterMood.HAPPY ? (
        <path d="M42 41 Q50 45 58 41" stroke="#000" strokeWidth="2" fill="none" />
      ) : mood === CharacterMood.ANGRY ? (
        <path d="M42 44 Q50 40 58 44" stroke="#000" strokeWidth="2" fill="none" />
      ) : (
        <line x1="43" y1="42" x2="57" y2="42" stroke="#000" strokeWidth="2" />
      )}

      {/* Flashlight/inspection tool */}
      <g transform="translate(72, 75)">
        <rect x="0" y="0" width="6" height="18" rx="2" fill="#fbbf24" />
        <rect x="1" y="16" width="4" height="4" fill="#fef3c7" opacity="0.8" />
        {/* Light beam */}
        {mood === CharacterMood.HAPPY && (
          <polygon points="3,20 0,30 6,30" fill="#fef3c7" opacity="0.5" />
        )}
      </g>

      {/* Safety vest stripes */}
      <rect x="35" y="65" width="30" height="3" fill="#fbbf24" />
      <rect x="35" y="75" width="30" height="3" fill="#fbbf24" />

      {/* Arms */}
      <rect x="26" y="60" width="7" height="23" rx="3" fill={colors.primary} />
      <rect x="67" y="60" width="7" height="23" rx="3" fill={colors.primary} />
    </svg>
  );
};

/**
 * Dispatcher SVG
 */
const DispatcherSVG: React.FC<{ mood: CharacterMood; size: number }> = ({
  mood,
  size,
}) => {
  const colors = getMoodColors(mood);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Dispatcher"
    >
      {/* Body */}
      <ellipse cx="50" cy="70" rx="22" ry="26" fill={colors.primary} />

      {/* Head */}
      <circle cx="50" cy="33" r="17" fill="#fbbf24" />

      {/* Headset */}
      <path
        d="M35 30 Q33 33 33 36"
        stroke={colors.secondary}
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M65 30 Q67 33 67 36"
        stroke={colors.secondary}
        strokeWidth="3"
        fill="none"
      />
      <rect x="30" y="35" width="6" height="8" rx="2" fill={colors.secondary} />
      <rect x="64" y="35" width="6" height="8" rx="2" fill={colors.secondary} />
      <path
        d="M35 33 Q50 28 65 33"
        stroke={colors.secondary}
        strokeWidth="3"
        fill="none"
      />

      {/* Microphone */}
      <rect x="47" y="43" width="2" height="8" fill={colors.secondary} />
      <rect x="44" y="43" width="8" height="3" rx="1" fill={colors.secondary} />

      {/* Eyes */}
      <circle cx="44" cy="31" r="2" fill="#000" />
      <circle cx="56" cy="31" r="2" fill="#000" />

      {/* Mouth */}
      {mood === CharacterMood.HAPPY ? (
        <path d="M42 38 Q50 42 58 38" stroke="#000" strokeWidth="2" fill="none" />
      ) : mood === CharacterMood.FRUSTRATED || mood === CharacterMood.ANGRY ? (
        <circle cx="50" cy="40" r="3" fill="#000" />
      ) : (
        <line x1="43" y1="39" x2="57" y2="39" stroke="#000" strokeWidth="2" />
      )}

      {/* Shirt collar */}
      <path d="M42 48 L45 55" stroke={colors.secondary} strokeWidth="2" />
      <path d="M58 48 L55 55" stroke={colors.secondary} strokeWidth="2" />

      {/* Arms */}
      <rect x="25" y="58" width="7" height="22" rx="3" fill={colors.primary} />
      <rect x="68" y="58" width="7" height="22" rx="3" fill={colors.primary} />
    </svg>
  );
};

/**
 * Platform Manager SVG
 */
const PlatformManagerSVG: React.FC<{ mood: CharacterMood; size: number }> = ({
  mood,
  size,
}) => {
  const colors = getMoodColors(mood);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Platform Manager"
    >
      {/* Body - formal attire */}
      <ellipse cx="50" cy="72" rx="23" ry="27" fill={colors.primary} />

      {/* Head */}
      <circle cx="50" cy="32" r="17" fill="#fbbf24" />

      {/* Professional hair */}
      <ellipse cx="50" cy="18" rx="18" ry="8" fill="#78350f" />

      {/* Eyes */}
      <circle cx="44" cy="32" r="2" fill="#000" />
      <circle cx="56" cy="32" r="2" fill="#000" />
      {mood === CharacterMood.FRUSTRATED && (
        <>
          <line x1="40" y1="29" x2="44" y2="31" stroke="#000" strokeWidth="2" />
          <line x1="56" y1="31" x2="60" y2="29" stroke="#000" strokeWidth="2" />
        </>
      )}

      {/* Mouth */}
      {mood === CharacterMood.HAPPY ? (
        <path d="M42 39 Q50 43 58 39" stroke="#000" strokeWidth="2" fill="none" />
      ) : mood === CharacterMood.ANGRY || mood === CharacterMood.FRUSTRATED ? (
        <path d="M42 42 Q50 38 58 42" stroke="#000" strokeWidth="2" fill="none" />
      ) : (
        <line x1="43" y1="40" x2="57" y2="40" stroke="#000" strokeWidth="2" />
      )}

      {/* Name tag */}
      <rect x="40" y="60" width="20" height="8" rx="1" fill="#fff" stroke={colors.secondary} strokeWidth="1" />
      <line x1="43" y1="64" x2="57" y2="64" stroke={colors.primary} strokeWidth="1" />
      <line x1="43" y1="67" x2="53" y2="67" stroke={colors.primary} strokeWidth="1" />

      {/* Tablet/schedule board */}
      <g transform="translate(18, 68)">
        <rect x="0" y="0" width="18" height="24" rx="2" fill="#1f2937" stroke={colors.accent} strokeWidth="1" />
        <rect x="2" y="2" width="14" height="20" rx="1" fill="#3b82f6" opacity="0.3" />
        <line x1="4" y1="5" x2="14" y2="5" stroke="#fff" strokeWidth="1" />
        <line x1="4" y1="9" x2="14" y2="9" stroke="#fff" strokeWidth="1" />
        <line x1="4" y1="13" x2="14" y2="13" stroke="#fff" strokeWidth="1" />
      </g>

      {/* Arms */}
      <rect x="23" y="60" width="7" height="24" rx="3" fill={colors.primary} />
      <rect x="70" y="60" width="7" height="24" rx="3" fill={colors.primary} />
    </svg>
  );
};

/**
 * Main CharacterSprite component
 */
export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  type,
  mood,
  size = 80,
  className = '',
}) => {
  const renderSprite = () => {
    switch (type) {
      case CharacterType.TRANSIT_CONDUCTOR:
        return <TransitConductorSVG mood={mood} size={size} />;
      case CharacterType.STATION_MASTER:
        return <StationMasterSVG mood={mood} size={size} />;
      case CharacterType.MAINTENANCE_CREW:
        return <MaintenanceCrewSVG mood={mood} size={size} />;
      case CharacterType.TRACK_INSPECTOR:
        return <TrackInspectorSVG mood={mood} size={size} />;
      case CharacterType.DISPATCHER:
        return <DispatcherSVG mood={mood} size={size} />;
      case CharacterType.PLATFORM_MANAGER:
        return <PlatformManagerSVG mood={mood} size={size} />;
      default:
        return <TransitConductorSVG mood={mood} size={size} />;
    }
  };

  return (
    <div
      className={`character-sprite ${className}`}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
      }}
    >
      {renderSprite()}
    </div>
  );
};

export default CharacterSprite;
