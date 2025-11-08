/**
 * Character Animation System
 * Framer Motion configurations for NYC Subway Authority characters
 */

import {
  AnimationState,
  CharacterMood,
  AnimationVariants,
  SpriteAnimation,
  PositionAnimation,
} from '../../types/character-types';

// ==================== Core Animation Variants ====================

/**
 * Idle animation - subtle breathing/floating effect
 */
export const idleVariants: AnimationVariants = {
  initial: {
    y: 0,
    scale: 1,
  },
  animate: {
    y: [-2, 2, -2],
    scale: [1, 1.02, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Working animation - busy movement
 */
export const workingVariants: AnimationVariants = {
  initial: {
    rotate: 0,
    x: 0,
  },
  animate: {
    rotate: [-5, 5, -5],
    x: [-3, 3, -3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Celebrating animation - jump and spin
 */
export const celebratingVariants: AnimationVariants = {
  initial: {
    scale: 1,
    rotate: 0,
    y: 0,
  },
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 360, 0],
    y: [0, -30, 0],
    transition: {
      duration: 1.5,
      repeat: 3,
      ease: 'easeInOut',
    },
  },
};

/**
 * Concerned animation - head shake
 */
export const concernedVariants: AnimationVariants = {
  initial: {
    rotate: 0,
  },
  animate: {
    rotate: [-10, 10, -10, 10, 0],
    transition: {
      duration: 1,
      repeat: 2,
      ease: 'easeInOut',
    },
  },
};

/**
 * Fixing animation - tool movement
 */
export const fixingVariants: AnimationVariants = {
  initial: {
    rotate: 0,
    scale: 1,
  },
  animate: {
    rotate: [-15, 15, -15],
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Upset animation - frustrated pacing
 */
export const upsetVariants: AnimationVariants = {
  initial: {
    x: 0,
    rotate: 0,
  },
  animate: {
    x: [-10, 10, -10],
    rotate: [-8, 8, -8],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ==================== Animation State Mappings ====================

/**
 * Map animation states to Framer Motion variants
 */
export const ANIMATION_VARIANTS: Record<AnimationState, AnimationVariants> = {
  [AnimationState.IDLE]: idleVariants,
  [AnimationState.WORKING]: workingVariants,
  [AnimationState.CELEBRATING]: celebratingVariants,
  [AnimationState.CONCERNED]: concernedVariants,
  [AnimationState.FIXING]: fixingVariants,
  [AnimationState.UPSET]: upsetVariants,
};

// ==================== Mood-Based Animations ====================

/**
 * Get animation state based on character mood
 */
export function getMoodAnimation(mood: CharacterMood): AnimationState {
  switch (mood) {
    case CharacterMood.HAPPY:
      return AnimationState.CELEBRATING;
    case CharacterMood.CONTENT:
      return AnimationState.IDLE;
    case CharacterMood.NEUTRAL:
      return AnimationState.IDLE;
    case CharacterMood.CONCERNED:
      return AnimationState.CONCERNED;
    case CharacterMood.FRUSTRATED:
      return AnimationState.FIXING;
    case CharacterMood.ANGRY:
      return AnimationState.UPSET;
    default:
      return AnimationState.IDLE;
  }
}

// ==================== Dialogue Bubble Animations ====================

/**
 * Dialogue bubble entrance animation
 */
export const dialogueEnterVariants: AnimationVariants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -5,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * Dialogue bubble floating animation
 */
export const dialogueFloatVariants: AnimationVariants = {
  initial: {
    y: 0,
  },
  animate: {
    y: [-3, 3, -3],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Typing indicator animation for dialogue
 */
export const typingIndicatorVariants: AnimationVariants = {
  initial: {
    opacity: 0.4,
  },
  animate: {
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ==================== Character Entrance Animations ====================

/**
 * Character spawn/entrance animation
 */
export const characterSpawnVariants: AnimationVariants = {
  initial: {
    opacity: 0,
    scale: 0,
    y: 50,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1], // Bounce easing
    },
  },
  exit: {
    opacity: 0,
    scale: 0,
    y: 50,
    transition: {
      duration: 0.4,
      ease: 'easeIn',
    },
  },
};

/**
 * Character slide-in animation (from side)
 */
export const characterSlideInVariants: AnimationVariants = {
  initial: {
    opacity: 0,
    x: -100,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: 0.4,
      ease: 'easeIn',
    },
  },
};

// ==================== Attention-Grabbing Animations ====================

/**
 * Pulse animation for drawing attention
 */
export const pulseVariants: AnimationVariants = {
  initial: {
    scale: 1,
  },
  animate: {
    scale: [1, 1.15, 1],
    transition: {
      duration: 0.6,
      repeat: 3,
      ease: 'easeInOut',
    },
  },
};

/**
 * Glow effect for highlighting
 */
export const glowVariants: AnimationVariants = {
  initial: {
    filter: 'drop-shadow(0 0 0px rgba(0, 0, 0, 0))',
  },
  animate: {
    filter: [
      'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5))',
      'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8))',
      'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5))',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Shake animation for errors/alerts
 */
export const shakeVariants: AnimationVariants = {
  initial: {
    x: 0,
  },
  animate: {
    x: [-10, 10, -10, 10, -5, 5, 0],
    transition: {
      duration: 0.5,
      ease: 'linear',
    },
  },
};

// ==================== Position Transition Animations ====================

/**
 * Create smooth position transition animation
 */
export function createPositionTransition(
  from: { x: number; y: number },
  to: { x: number; y: number },
  duration: number = 1
): PositionAnimation {
  return {
    from,
    to,
    duration,
    easing: 'easeInOut',
  };
}

/**
 * Position animation variants generator
 */
export function getPositionVariants(
  targetX: number,
  targetY: number,
  duration: number = 0.8
): AnimationVariants {
  return {
    initial: {},
    animate: {
      x: targetX,
      y: targetY,
      transition: {
        duration,
        ease: 'easeInOut',
      },
    },
  };
}

// ==================== Sprite-Based Animations ====================

/**
 * Walk animation sprite configuration
 */
export const walkSpriteAnimation: SpriteAnimation = {
  frames: 8,
  duration: 1000,
  loop: true,
  easing: 'steps(8)',
};

/**
 * Work animation sprite configuration
 */
export const workSpriteAnimation: SpriteAnimation = {
  frames: 6,
  duration: 800,
  loop: true,
  easing: 'steps(6)',
};

/**
 * Wave animation sprite configuration
 */
export const waveSpriteAnimation: SpriteAnimation = {
  frames: 4,
  duration: 600,
  loop: false,
  easing: 'steps(4)',
};

// ==================== Transition Configurations ====================

/**
 * Spring transition configuration for bouncy animations
 */
export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
};

/**
 * Smooth transition configuration
 */
export const smoothTransition = {
  duration: 0.5,
  ease: 'easeInOut',
};

/**
 * Quick transition configuration
 */
export const quickTransition = {
  duration: 0.2,
  ease: 'easeOut',
};

/**
 * Slow transition configuration
 */
export const slowTransition = {
  duration: 1.5,
  ease: 'easeInOut',
};

// ==================== Custom Easing Functions ====================

/**
 * Custom cubic bezier easings
 */
export const customEasings = {
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.68, -0.6, 0.32, 1.6],
  smooth: [0.43, 0.13, 0.23, 0.96],
  sharp: [0.4, 0, 0.6, 1],
};

// ==================== Animation Utilities ====================

/**
 * Get animation variant for current state
 */
export function getAnimationVariant(state: AnimationState): AnimationVariants {
  return ANIMATION_VARIANTS[state] || idleVariants;
}

/**
 * Combine multiple animation variants
 */
export function combineVariants(
  ...variants: AnimationVariants[]
): AnimationVariants {
  return variants.reduce(
    (combined, variant) => ({
      initial: { ...combined.initial, ...variant.initial },
      animate: { ...combined.animate, ...variant.animate },
      exit: { ...combined.exit, ...variant.exit },
    }),
    { initial: {}, animate: {} }
  );
}

/**
 * Create staggered children animation
 */
export const staggeredChildrenVariants: AnimationVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Child item animation for staggered lists
 */
export const staggeredItemVariants: AnimationVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

// ==================== Performance Optimization ====================

/**
 * Layout animation configuration (uses GPU acceleration)
 */
export const layoutAnimation = {
  layout: true,
  layoutId: undefined,
  transition: springTransition,
};

/**
 * Will-change CSS optimization for animations
 */
export const willChangeStyle = {
  willChange: 'transform, opacity',
};

// ==================== Animation Presets ====================

/**
 * Preset animation configurations for common scenarios
 */
export const ANIMATION_PRESETS = {
  // Subtle, non-intrusive animation
  subtle: {
    duration: 2,
    ease: 'easeInOut',
    repeat: Infinity,
  },
  // Energetic, attention-grabbing animation
  energetic: {
    duration: 0.8,
    ease: customEasings.bounce,
    repeat: 2,
  },
  // Quick, responsive animation
  responsive: {
    duration: 0.3,
    ease: 'easeOut',
  },
  // Smooth, professional animation
  professional: {
    duration: 0.6,
    ease: customEasings.smooth,
  },
};

// ==================== Accessibility Considerations ====================

/**
 * Check if user prefers reduced motion
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation variant with reduced motion support
 */
export function getAccessibleVariant(
  variant: AnimationVariants,
  reducedMotion: boolean = shouldReduceMotion()
): AnimationVariants {
  if (!reducedMotion) return variant;

  // Return simplified animation for reduced motion
  return {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: { opacity: 0 },
  };
}

/**
 * Animation configuration with reduced motion support
 */
export function getAccessibleTransition(baseTransition: object): object {
  if (shouldReduceMotion()) {
    return { duration: 0.01 }; // Nearly instant
  }
  return baseTransition;
}
