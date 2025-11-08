/**
 * Character System Type Definitions
 * NYC Subway Authority themed port management characters
 */

// ==================== Core Character Types ====================

/**
 * Character types representing different NYC transit workers
 */
export enum CharacterType {
  TRANSIT_CONDUCTOR = 'transit_conductor',
  STATION_MASTER = 'station_master',
  MAINTENANCE_CREW = 'maintenance_crew',
  TRACK_INSPECTOR = 'track_inspector',
  DISPATCHER = 'dispatcher',
  PLATFORM_MANAGER = 'platform_manager',
}

/**
 * Character mood states based on port/service health
 */
export enum CharacterMood {
  HAPPY = 'happy',
  CONTENT = 'content',
  NEUTRAL = 'neutral',
  CONCERNED = 'concerned',
  FRUSTRATED = 'frustrated',
  ANGRY = 'angry',
}

/**
 * Animation states for character transitions
 */
export enum AnimationState {
  IDLE = 'idle',
  WORKING = 'working',
  CELEBRATING = 'celebrating',
  CONCERNED = 'concerned',
  FIXING = 'fixing',
  UPSET = 'upset',
}

// ==================== Port Health Types ====================

/**
 * Port health status
 */
export enum PortHealth {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

/**
 * Port status
 */
export enum PortStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  ERROR = 'error',
}

/**
 * Service health metrics
 */
export interface ServiceHealth {
  responseTime: number;
  errorRate: number;
  uptime: number;
  lastCheck: Date;
}

// ==================== Character Data Structures ====================

/**
 * Complete character definition
 */
export interface Character {
  id: string;
  type: CharacterType;
  name: string;
  mood: CharacterMood;
  animationState: AnimationState;
  assignedPort?: number;
  position: { x: number; y: number };
  currentDialogue?: string;
  lastUpdate: Date;
}

/**
 * Character state context for determining mood
 */
export interface CharacterContext {
  portHealth: PortHealth;
  portStatus: PortStatus;
  serviceHealth?: ServiceHealth;
  hasConflicts: boolean;
  hasVulnerabilities: boolean;
  routingWorking: boolean;
  configValid: boolean;
}

/**
 * Dialogue trigger conditions
 */
export interface DialogueTrigger {
  condition: (context: CharacterContext) => boolean;
  weight: number; // Priority weight for multiple matching conditions
}

/**
 * Dialogue entry with metadata
 */
export interface DialogueEntry {
  text: string;
  mood: CharacterMood;
  duration: number; // milliseconds
  trigger?: DialogueTrigger;
}

/**
 * Character behavior configuration
 */
export interface CharacterBehavior {
  type: CharacterType;
  happyTriggers: DialogueTrigger[];
  unhappyTriggers: DialogueTrigger[];
  neutralDialogue: string[];
  updateInterval: number; // milliseconds between mood checks
}

// ==================== Animation Types ====================

/**
 * Framer Motion animation variants
 */
export interface AnimationVariants {
  initial: object;
  animate: object;
  exit?: object;
  transition?: object;
}

/**
 * Character sprite animation configuration
 */
export interface SpriteAnimation {
  frames: number;
  duration: number;
  loop: boolean;
  easing?: string;
}

/**
 * Position animation configuration
 */
export interface PositionAnimation {
  from: { x: number; y: number };
  to: { x: number; y: number };
  duration: number;
  easing?: string;
}

// ==================== Component Props ====================

/**
 * Props for CharacterSystem component
 */
export interface CharacterSystemProps {
  characters: Character[];
  onCharacterUpdate?: (character: Character) => void;
  onDialogueComplete?: (characterId: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Props for individual character component
 */
export interface CharacterProps {
  character: Character;
  context: CharacterContext;
  onMoodChange?: (mood: CharacterMood) => void;
  onClick?: () => void;
  scale?: number;
}

/**
 * Props for dialogue bubble component
 */
export interface DialogueBubbleProps {
  text: string;
  position: { x: number; y: number };
  mood: CharacterMood;
  onComplete?: () => void;
  duration?: number;
}

// ==================== Store Types ====================

/**
 * Character store state
 */
export interface CharacterStoreState {
  characters: Map<string, Character>;
  activeDialogues: Set<string>;
  animationQueue: AnimationState[];
}

/**
 * Character store actions
 */
export interface CharacterStoreActions {
  addCharacter: (character: Character) => void;
  removeCharacter: (characterId: string) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  updateCharacterMood: (characterId: string, context: CharacterContext) => void;
  triggerDialogue: (characterId: string, dialogue: string, duration?: number) => void;
  clearDialogue: (characterId: string) => void;
  assignCharacterToPort: (characterId: string, port: number) => void;
  unassignCharacter: (characterId: string) => void;
}

// ==================== Utility Types ====================

/**
 * Character factory options
 */
export interface CharacterFactoryOptions {
  type: CharacterType;
  position?: { x: number; y: number };
  assignedPort?: number;
  name?: string;
}

/**
 * Mood calculation result
 */
export interface MoodCalculation {
  mood: CharacterMood;
  animationState: AnimationState;
  suggestedDialogue?: string;
  confidence: number; // 0-1
}

/**
 * Character metrics for debugging/monitoring
 */
export interface CharacterMetrics {
  totalCharacters: number;
  activeDialogues: number;
  moodDistribution: Record<CharacterMood, number>;
  averageUpdateTime: number;
  errorCount: number;
}

// ==================== Event Types ====================

/**
 * Character system events
 */
export enum CharacterEvent {
  MOOD_CHANGED = 'mood_changed',
  DIALOGUE_STARTED = 'dialogue_started',
  DIALOGUE_COMPLETED = 'dialogue_completed',
  ANIMATION_STARTED = 'animation_started',
  ANIMATION_COMPLETED = 'animation_completed',
  CHARACTER_ASSIGNED = 'character_assigned',
  CHARACTER_UNASSIGNED = 'character_unassigned',
}

/**
 * Event payload for character events
 */
export interface CharacterEventPayload {
  characterId: string;
  type: CharacterEvent;
  data?: unknown;
  timestamp: Date;
}

/**
 * Event listener callback
 */
export type CharacterEventListener = (payload: CharacterEventPayload) => void;

// ==================== Configuration Types ====================

/**
 * Global character system configuration
 */
export interface CharacterSystemConfig {
  enabled: boolean;
  maxCharacters: number;
  updateInterval: number;
  animationSpeed: number;
  dialogueDuration: number;
  autoAssign: boolean;
  accessibilityMode: boolean;
  soundEffects: boolean;
}

/**
 * Character theme configuration
 */
export interface CharacterTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
}

// ==================== Type Guards ====================

/**
 * Type guard for Character
 */
export function isCharacter(obj: unknown): obj is Character {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    'mood' in obj
  );
}

/**
 * Type guard for CharacterContext
 */
export function isCharacterContext(obj: unknown): obj is CharacterContext {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'portHealth' in obj &&
    'portStatus' in obj
  );
}

// ==================== Exports ====================

export type {
  Character,
  CharacterContext,
  DialogueEntry,
  CharacterBehavior,
  AnimationVariants,
  SpriteAnimation,
  CharacterSystemProps,
  CharacterProps,
  DialogueBubbleProps,
  CharacterStoreState,
  CharacterStoreActions,
  MoodCalculation,
  CharacterMetrics,
  CharacterEventPayload,
  CharacterSystemConfig,
  CharacterTheme,
};
