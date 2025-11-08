/**
 * DialogueBubble Component
 * MTA-style speech bubbles for character dialogue
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CharacterMood,
  DialogueBubbleProps,
} from '../../types/character-types';
import {
  dialogueEnterVariants,
  dialogueFloatVariants,
  getAccessibleVariant,
} from './character-animations';

/**
 * Get bubble styling based on mood
 */
function getBubbleStyle(mood: CharacterMood): {
  background: string;
  border: string;
  textColor: string;
} {
  switch (mood) {
    case CharacterMood.HAPPY:
      return {
        background: '#ecfdf5',
        border: '#10b981',
        textColor: '#065f46',
      };
    case CharacterMood.CONTENT:
      return {
        background: '#eff6ff',
        border: '#3b82f6',
        textColor: '#1e40af',
      };
    case CharacterMood.NEUTRAL:
      return {
        background: '#f9fafb',
        border: '#6b7280',
        textColor: '#374151',
      };
    case CharacterMood.CONCERNED:
      return {
        background: '#fffbeb',
        border: '#f59e0b',
        textColor: '#92400e',
      };
    case CharacterMood.FRUSTRATED:
      return {
        background: '#fef2f2',
        border: '#ef4444',
        textColor: '#991b1b',
      };
    case CharacterMood.ANGRY:
      return {
        background: '#fee2e2',
        border: '#dc2626',
        textColor: '#7f1d1d',
      };
  }
}

/**
 * DialogueBubble Component
 */
export const DialogueBubble: React.FC<DialogueBubbleProps> = ({
  text,
  position,
  mood,
  onComplete,
  duration = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const style = getBubbleStyle(mood);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 300); // Allow exit animation to complete
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  const enterVariant = getAccessibleVariant(dialogueEnterVariants);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={enterVariant}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        variants={dialogueFloatVariants}
        initial="initial"
        animate="animate"
        style={{
          position: 'relative',
          background: style.background,
          border: `2px solid ${style.border}`,
          borderRadius: '12px',
          padding: '12px 16px',
          maxWidth: '220px',
          minWidth: '120px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontSize: '14px',
          lineHeight: '1.4',
          color: style.textColor,
          fontWeight: 500,
        }}
      >
        {/* Speech bubble pointer */}
        <div
          style={{
            position: 'absolute',
            bottom: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: `10px solid ${style.border}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-7px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderTop: `9px solid ${style.background}`,
          }}
        />

        {/* MTA-style header stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: style.border,
            borderRadius: '10px 10px 0 0',
          }}
        />

        {/* Text content */}
        <div
          style={{
            marginTop: '4px',
          }}
        >
          {text}
        </div>

        {/* MTA-style accent dot */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: style.border,
            opacity: 0.6,
          }}
        />
      </motion.div>

      {/* Screen reader support */}
      <div className="sr-only" role="status" aria-live="polite">
        {text}
      </div>
    </motion.div>
  );
};

/**
 * MultiLineDialogueBubble - for longer messages
 */
interface MultiLineDialogueBubbleProps extends DialogueBubbleProps {
  lines: string[];
}

export const MultiLineDialogueBubble: React.FC<MultiLineDialogueBubbleProps> = ({
  lines,
  position,
  mood,
  onComplete,
  duration = 4000,
}) => {
  const combinedText = lines.join(' ');

  return (
    <DialogueBubble
      text={combinedText}
      position={position}
      mood={mood}
      onComplete={onComplete}
      duration={duration}
    />
  );
};

/**
 * NotificationBubble - MTA announcement style
 */
interface NotificationBubbleProps {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  position: { x: number; y: number };
  duration?: number;
  onComplete?: () => void;
}

export const NotificationBubble: React.FC<NotificationBubbleProps> = ({
  title,
  message,
  type,
  position,
  duration = 4000,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Map notification type to character mood for styling
  const moodMap: Record<string, CharacterMood> = {
    info: CharacterMood.CONTENT,
    warning: CharacterMood.CONCERNED,
    error: CharacterMood.ANGRY,
    success: CharacterMood.HAPPY,
  };

  const mood = moodMap[type];
  const style = getBubbleStyle(mood);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 300);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={dialogueEnterVariants}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: style.background,
          border: `3px solid ${style.border}`,
          borderRadius: '8px',
          padding: '16px 20px',
          maxWidth: '300px',
          minWidth: '200px',
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {/* MTA-style header */}
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: style.textColor,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: '14px',
            lineHeight: '1.5',
            color: style.textColor,
            fontWeight: 500,
          }}
        >
          {message}
        </div>

        {/* MTA-style bottom stripe */}
        <div
          style={{
            marginTop: '12px',
            height: '3px',
            background: style.border,
            borderRadius: '2px',
          }}
        />
      </div>
    </motion.div>
  );
};

/**
 * ThinkingBubble - for character thinking/processing states
 */
interface ThinkingBubbleProps {
  position: { x: number; y: number };
  mood: CharacterMood;
}

export const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({
  position,
  mood,
}) => {
  const style = getBubbleStyle(mood);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 999,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 12px',
          background: style.background,
          border: `2px solid ${style.border}`,
          borderRadius: '20px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: style.border,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default DialogueBubble;
