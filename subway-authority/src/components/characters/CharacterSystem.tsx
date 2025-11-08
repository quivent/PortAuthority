/**
 * CharacterSystem Component
 * Main orchestrator for NYC Subway Authority character system
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Character,
  CharacterContext,
  CharacterMood,
  CharacterType,
  AnimationState,
  PortHealth,
  PortStatus,
  CharacterSystemProps,
  DialogueEntry,
} from '../../types/character-types';
import { selectDialogue } from './character-dialogue';
import {
  getAnimationVariant,
  getMoodAnimation,
  characterSpawnVariants,
  getAccessibleVariant,
  shouldReduceMotion,
} from './character-animations';
import { CharacterSprite } from './CharacterSprite';
import { DialogueBubble } from './DialogueBubble';

/**
 * Calculate character mood based on context
 */
function calculateMood(context: CharacterContext): CharacterMood {
  // Critical conditions override everything
  if (
    context.portHealth === PortHealth.CRITICAL ||
    context.portStatus === PortStatus.ERROR
  ) {
    return CharacterMood.ANGRY;
  }

  // Check for frustrated conditions
  if (
    !context.routingWorking ||
    context.hasConflicts ||
    (context.hasVulnerabilities && context.portHealth === PortHealth.WARNING)
  ) {
    return CharacterMood.FRUSTRATED;
  }

  // Check for concerned conditions
  if (
    context.portHealth === PortHealth.WARNING ||
    context.hasVulnerabilities ||
    !context.configValid ||
    (context.serviceHealth?.responseTime ?? 0) > 1000
  ) {
    return CharacterMood.CONCERNED;
  }

  // Happy conditions
  if (
    context.portHealth === PortHealth.HEALTHY &&
    context.portStatus === PortStatus.ACTIVE &&
    context.routingWorking &&
    context.configValid &&
    !context.hasConflicts &&
    !context.hasVulnerabilities
  ) {
    return CharacterMood.HAPPY;
  }

  // Content/neutral states
  if (
    context.portStatus === PortStatus.ACTIVE &&
    context.portHealth === PortHealth.HEALTHY
  ) {
    return CharacterMood.CONTENT;
  }

  return CharacterMood.NEUTRAL;
}

/**
 * Individual Character Component
 */
interface CharacterComponentProps {
  character: Character;
  context: CharacterContext;
  onUpdate: (character: Character) => void;
  disabled?: boolean;
}

const CharacterComponent: React.FC<CharacterComponentProps> = ({
  character,
  context,
  onUpdate,
  disabled = false,
}) => {
  const [currentDialogue, setCurrentDialogue] = useState<DialogueEntry | null>(
    null
  );
  const [showDialogue, setShowDialogue] = useState(false);

  // Calculate mood and animation state
  const mood = useMemo(() => calculateMood(context), [context]);
  const animationState = useMemo(() => getMoodAnimation(mood), [mood]);

  // Update character when mood changes
  useEffect(() => {
    if (mood !== character.mood) {
      const updatedCharacter: Character = {
        ...character,
        mood,
        animationState,
        lastUpdate: new Date(),
      };
      onUpdate(updatedCharacter);

      // Trigger dialogue on significant mood changes
      if (
        mood === CharacterMood.ANGRY ||
        mood === CharacterMood.FRUSTRATED ||
        mood === CharacterMood.HAPPY
      ) {
        triggerDialogue();
      }
    }
  }, [mood, animationState, character, onUpdate]);

  // Trigger dialogue
  const triggerDialogue = useCallback(() => {
    if (disabled || showDialogue) return;

    const dialogue = selectDialogue(character.type, mood, context);
    setCurrentDialogue(dialogue);
    setShowDialogue(true);

    // Auto-hide dialogue after duration
    setTimeout(() => {
      setShowDialogue(false);
      setCurrentDialogue(null);
    }, dialogue.duration);
  }, [character.type, mood, context, disabled, showDialogue]);

  // Get animation variants
  const animationVariants = useMemo(() => {
    const baseVariant = getAnimationVariant(animationState);
    return getAccessibleVariant(baseVariant);
  }, [animationState]);

  // Handle character click
  const handleClick = useCallback(() => {
    if (!disabled) {
      triggerDialogue();
    }
  }, [disabled, triggerDialogue]);

  return (
    <motion.div
      className="character-container"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={characterSpawnVariants}
      style={{
        position: 'absolute',
        left: character.position.x,
        top: character.position.y,
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
      }}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${character.name} - ${character.type} character`}
      aria-live="polite"
      aria-atomic="true"
    >
      <motion.div
        variants={animationVariants}
        className="character-sprite-wrapper"
      >
        <CharacterSprite type={character.type} mood={mood} />
      </motion.div>

      <AnimatePresence>
        {showDialogue && currentDialogue && (
          <DialogueBubble
            text={currentDialogue.text}
            position={{ x: 0, y: -80 }}
            mood={mood}
            onComplete={() => setShowDialogue(false)}
            duration={currentDialogue.duration}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Main CharacterSystem Component
 */
export const CharacterSystem: React.FC<CharacterSystemProps> = ({
  characters,
  onCharacterUpdate,
  onDialogueComplete,
  disabled = false,
  className = '',
}) => {
  const [characterContexts, setCharacterContexts] = useState<
    Map<string, CharacterContext>
  >(new Map());

  // Update character contexts (would typically come from port monitoring)
  const updateContext = useCallback(
    (characterId: string, context: CharacterContext) => {
      setCharacterContexts((prev) => {
        const updated = new Map(prev);
        updated.set(characterId, context);
        return updated;
      });
    },
    []
  );

  // Handle character updates
  const handleCharacterUpdate = useCallback(
    (character: Character) => {
      if (onCharacterUpdate) {
        onCharacterUpdate(character);
      }
    },
    [onCharacterUpdate]
  );

  // Get context for character (with fallback)
  const getCharacterContext = useCallback(
    (character: Character): CharacterContext => {
      return (
        characterContexts.get(character.id) || {
          portHealth: PortHealth.UNKNOWN,
          portStatus: PortStatus.INACTIVE,
          hasConflicts: false,
          hasVulnerabilities: false,
          routingWorking: true,
          configValid: true,
        }
      );
    },
    [characterContexts]
  );

  // Check for reduced motion preference
  const reducedMotion = shouldReduceMotion();

  return (
    <div
      className={`character-system ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      aria-label="Character system"
      role="region"
    >
      <AnimatePresence mode="popLayout">
        {characters.map((character) => (
          <CharacterComponent
            key={character.id}
            character={character}
            context={getCharacterContext(character)}
            onUpdate={handleCharacterUpdate}
            disabled={disabled}
          />
        ))}
      </AnimatePresence>

      {reducedMotion && (
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {characters.length} characters active with reduced motion enabled
        </div>
      )}
    </div>
  );
};

/**
 * Hook for character system management
 */
export function useCharacterSystem() {
  const [characters, setCharacters] = useState<Character[]>([]);

  const addCharacter = useCallback((character: Character) => {
    setCharacters((prev) => [...prev, character]);
  }, []);

  const removeCharacter = useCallback((characterId: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== characterId));
  }, []);

  const updateCharacter = useCallback(
    (characterId: string, updates: Partial<Character>) => {
      setCharacters((prev) =>
        prev.map((c) => (c.id === characterId ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const getCharacter = useCallback(
    (characterId: string) => {
      return characters.find((c) => c.id === characterId);
    },
    [characters]
  );

  const clearCharacters = useCallback(() => {
    setCharacters([]);
  }, []);

  return {
    characters,
    addCharacter,
    removeCharacter,
    updateCharacter,
    getCharacter,
    clearCharacters,
  };
}

/**
 * Character factory function
 */
export function createCharacter(
  type: CharacterType,
  options: {
    name?: string;
    position?: { x: number; y: number };
    assignedPort?: number;
  } = {}
): Character {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    type,
    name: options.name || getDefaultCharacterName(type),
    mood: CharacterMood.NEUTRAL,
    animationState: AnimationState.IDLE,
    position: options.position || { x: 100, y: 100 },
    assignedPort: options.assignedPort,
    lastUpdate: new Date(),
  };
}

/**
 * Get default name for character type
 */
function getDefaultCharacterName(type: CharacterType): string {
  const names: Record<CharacterType, string> = {
    [CharacterType.TRANSIT_CONDUCTOR]: 'Transit Conductor',
    [CharacterType.STATION_MASTER]: 'Station Master',
    [CharacterType.MAINTENANCE_CREW]: 'Maintenance Crew',
    [CharacterType.TRACK_INSPECTOR]: 'Track Inspector',
    [CharacterType.DISPATCHER]: 'Dispatcher',
    [CharacterType.PLATFORM_MANAGER]: 'Platform Manager',
  };
  return names[type];
}

/**
 * Character positioning helpers
 */
export const CharacterPositioning = {
  /**
   * Calculate grid position for multiple characters
   */
  grid: (index: number, columns: number = 4, spacing: number = 150) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    return {
      x: 100 + col * spacing,
      y: 100 + row * spacing,
    };
  },

  /**
   * Calculate circular position around a center point
   */
  circle: (
    index: number,
    total: number,
    radius: number = 200,
    centerX: number = 400,
    centerY: number = 300
  ) => {
    const angle = (index / total) * 2 * Math.PI;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  },

  /**
   * Random position within bounds
   */
  random: (
    minX: number = 50,
    maxX: number = 750,
    minY: number = 50,
    maxY: number = 550
  ) => {
    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
    };
  },
};

export default CharacterSystem;
