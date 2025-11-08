# Character System Integration Guide

## Overview

The Subway Authority Character System provides delightful, contextual feedback through NYC subway-themed worker characters that react to port and service health. This guide covers complete integration and usage.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Component API](#component-api)
4. [Character Types](#character-types)
5. [Integration Examples](#integration-examples)
6. [Styling Guide](#styling-guide)
7. [Accessibility](#accessibility)
8. [Testing](#testing)
9. [Performance](#performance)
10. [Troubleshooting](#troubleshooting)

## Quick Start

### Installation

Ensure you have the required dependencies:

```bash
npm install framer-motion react react-dom
# or
yarn add framer-motion react react-dom
```

### Basic Usage

```tsx
import React from 'react';
import { CharacterSystem, createCharacter, useCharacterSystem } from './components/characters/CharacterSystem';
import { CharacterType } from './types/character-types';

function App() {
  const { characters, addCharacter } = useCharacterSystem();

  React.useEffect(() => {
    // Create initial characters
    const conductor = createCharacter(CharacterType.TRANSIT_CONDUCTOR, {
      position: { x: 100, y: 100 },
      assignedPort: 3000,
    });
    addCharacter(conductor);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <CharacterSystem
        characters={characters}
        onCharacterUpdate={(char) => console.log('Character updated:', char)}
      />
    </div>
  );
}
```

## Architecture

### Component Structure

```
CharacterSystem (Orchestrator)
├── CharacterComponent (Individual character)
│   ├── CharacterSprite (SVG visualization)
│   └── DialogueBubble (Speech bubble)
├── Character State Management
├── Mood Calculation Logic
└── Animation System
```

### Data Flow

```
Port Health Data → CharacterContext → Mood Calculation → Animation State → Visual Update
                                   ↓
                            Dialogue Selection → Speech Bubble
```

## Component API

### CharacterSystem Props

```typescript
interface CharacterSystemProps {
  characters: Character[];                    // Array of characters to render
  onCharacterUpdate?: (character: Character) => void;  // Update callback
  onDialogueComplete?: (characterId: string) => void;  // Dialogue end callback
  disabled?: boolean;                         // Disable interactions
  className?: string;                         // Additional CSS classes
}
```

### Character Interface

```typescript
interface Character {
  id: string;                    // Unique identifier
  type: CharacterType;           // Character role
  name: string;                  // Display name
  mood: CharacterMood;           // Current mood state
  animationState: AnimationState; // Current animation
  assignedPort?: number;         // Assigned port number
  position: { x: number; y: number }; // Screen position
  currentDialogue?: string;      // Active dialogue text
  lastUpdate: Date;              // Last state change timestamp
}
```

### CharacterContext Interface

```typescript
interface CharacterContext {
  portHealth: PortHealth;        // Port health status
  portStatus: PortStatus;        // Port active/inactive
  serviceHealth?: ServiceHealth; // Optional service metrics
  hasConflicts: boolean;         // Port conflicts present
  hasVulnerabilities: boolean;   // Security issues
  routingWorking: boolean;       // Routing functional
  configValid: boolean;          // Configuration valid
}
```

## Character Types

### 1. Transit Conductor

**Purpose**: Monitors port routing and traffic flow

**Happy State**: Smooth routing, no delays
**Unhappy State**: Blocked ports, traffic issues

```tsx
const conductor = createCharacter(CharacterType.TRANSIT_CONDUCTOR, {
  name: 'Express Conductor',
  assignedPort: 3000,
});
```

### 2. Station Master

**Purpose**: Manages configuration and subdomain mappings

**Happy State**: Clean configuration, no conflicts
**Unhappy State**: Configuration errors, conflicts

```tsx
const stationMaster = createCharacter(CharacterType.STATION_MASTER, {
  name: 'Config Master',
  position: { x: 200, y: 100 },
});
```

### 3. Maintenance Crew

**Purpose**: Monitors service health and uptime

**Happy State**: Services healthy, good uptime
**Unhappy State**: Services down, poor health

```tsx
const maintenance = createCharacter(CharacterType.MAINTENANCE_CREW, {
  assignedPort: 8080,
});
```

### 4. Track Inspector

**Purpose**: Monitors security and vulnerabilities

**Happy State**: Secure ports, no vulnerabilities
**Unhappy State**: Security issues detected

```tsx
const inspector = createCharacter(CharacterType.TRACK_INSPECTOR);
```

### 5. Dispatcher

**Purpose**: Oversees routing and connections

**Happy State**: Fast routing, all connections working
**Unhappy State**: Routing failures, slow connections

```tsx
const dispatcher = createCharacter(CharacterType.DISPATCHER);
```

### 6. Platform Manager

**Purpose**: Manages overall organization and operations

**Happy State**: Well-organized system
**Unhappy State**: Chaos, disorganization

```tsx
const manager = createCharacter(CharacterType.PLATFORM_MANAGER);
```

## Integration Examples

### Example 1: Port Monitoring Dashboard

```tsx
import React, { useEffect, useState } from 'react';
import { CharacterSystem, createCharacter, useCharacterSystem } from './components/characters/CharacterSystem';
import { CharacterType, CharacterContext, PortHealth, PortStatus } from './types/character-types';

function PortDashboard() {
  const { characters, addCharacter, updateCharacter } = useCharacterSystem();
  const [portContexts, setPortContexts] = useState<Map<string, CharacterContext>>(new Map());

  useEffect(() => {
    // Create characters for each service role
    const conductor = createCharacter(CharacterType.TRANSIT_CONDUCTOR, {
      position: { x: 100, y: 150 },
      assignedPort: 3000,
    });

    const maintenance = createCharacter(CharacterType.MAINTENANCE_CREW, {
      position: { x: 300, y: 150 },
      assignedPort: 3000,
    });

    const inspector = createCharacter(CharacterType.TRACK_INSPECTOR, {
      position: { x: 500, y: 150 },
    });

    addCharacter(conductor);
    addCharacter(maintenance);
    addCharacter(inspector);

    // Simulate port monitoring
    const interval = setInterval(() => {
      updatePortHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updatePortHealth = () => {
    // Fetch port health from your monitoring service
    const context: CharacterContext = {
      portHealth: PortHealth.HEALTHY,
      portStatus: PortStatus.ACTIVE,
      hasConflicts: false,
      hasVulnerabilities: false,
      routingWorking: true,
      configValid: true,
    };

    // Update context for all characters
    setPortContexts(new Map([
      ['character-1', context],
      ['character-2', context],
      ['character-3', context],
    ]));
  };

  return (
    <div className="port-dashboard">
      <h1>Port Authority Dashboard</h1>
      <div className="character-area" style={{
        position: 'relative',
        width: '800px',
        height: '400px',
        background: '#f3f4f6',
        borderRadius: '8px',
      }}>
        <CharacterSystem
          characters={characters}
          onCharacterUpdate={(char) => {
            console.log(`${char.name} mood changed to ${char.mood}`);
          }}
        />
      </div>
    </div>
  );
}
```

### Example 2: Service Health Monitoring

```tsx
import React, { useEffect } from 'react';
import { CharacterSystem, createCharacter, CharacterPositioning } from './components/characters/CharacterSystem';
import { CharacterType } from './types/character-types';

function ServiceMonitor({ services }: { services: Service[] }) {
  const { characters, addCharacter, clearCharacters } = useCharacterSystem();

  useEffect(() => {
    clearCharacters();

    // Create a character for each service
    services.forEach((service, index) => {
      const position = CharacterPositioning.grid(index, 4, 200);

      const character = createCharacter(CharacterType.MAINTENANCE_CREW, {
        name: `${service.name} Monitor`,
        position,
        assignedPort: service.port,
      });

      addCharacter(character);
    });
  }, [services]);

  return (
    <div className="service-monitor">
      <CharacterSystem
        characters={characters}
        onDialogueComplete={(charId) => {
          console.log(`Dialogue completed for ${charId}`);
        }}
      />
    </div>
  );
}
```

### Example 3: Custom Character Positioning

```tsx
import { CharacterPositioning, createCharacter } from './components/characters/CharacterSystem';
import { CharacterType } from './types/character-types';

// Grid layout
function createGridCharacters(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const position = CharacterPositioning.grid(i, 4, 150);
    return createCharacter(CharacterType.TRANSIT_CONDUCTOR, { position });
  });
}

// Circular layout
function createCircularCharacters(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const position = CharacterPositioning.circle(i, count, 250, 400, 300);
    return createCharacter(CharacterType.STATION_MASTER, { position });
  });
}

// Random positioning
function createRandomCharacters(count: number) {
  return Array.from({ length: count }, () => {
    const position = CharacterPositioning.random(50, 750, 50, 550);
    return createCharacter(CharacterType.DISPATCHER, { position });
  });
}
```

### Example 4: Responsive Context Updates

```tsx
import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

function RealtimePortMonitor() {
  const { characters, addCharacter } = useCharacterSystem();
  const [portHealth, setPortHealth] = useState<PortHealth>(PortHealth.UNKNOWN);

  useEffect(() => {
    // Poll Tauri backend for port health
    const pollHealth = async () => {
      try {
        const health = await invoke<PortHealth>('get_port_health', { port: 3000 });
        setPortHealth(health);
      } catch (error) {
        console.error('Failed to get port health:', error);
      }
    };

    const interval = setInterval(pollHealth, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <CharacterSystem
      characters={characters}
      onCharacterUpdate={(char) => {
        // Log mood changes for analytics
        if (char.mood === CharacterMood.ANGRY) {
          logCriticalIssue(char);
        }
      }}
    />
  );
}
```

## Styling Guide

### MTA Color Scheme

```css
/* NYC Subway Authority theme */
:root {
  --mta-blue: #0039a6;
  --mta-orange: #ff6319;
  --mta-red: #ee352e;
  --mta-green: #00933c;
  --mta-yellow: #fccc0a;
  --mta-gray: #a7a9ac;
}
```

### Character Container Styling

```css
.character-system {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  overflow: hidden;
}

.character-container {
  position: absolute;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.character-container:hover {
  transform: scale(1.05);
  z-index: 10;
}

.character-sprite-wrapper {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}
```

### Accessibility Styles

```css
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .character-container,
  .character-sprite-wrapper {
    animation: none !important;
    transition: none !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .character-system {
    border: 3px solid currentColor;
  }
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Accessibility

### ARIA Labels

```tsx
<CharacterSystem
  characters={characters}
  aria-label="Port monitoring characters"
  role="region"
/>
```

### Keyboard Navigation

```tsx
// Characters are keyboard navigable with Tab key
// Space/Enter triggers dialogue
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === ' ' || e.key === 'Enter') {
    triggerDialogue();
  }
};
```

### Screen Reader Support

```tsx
<div className="sr-only" role="status" aria-live="polite">
  {character.name} is {character.mood}. {character.currentDialogue}
</div>
```

### Reduced Motion

```tsx
import { shouldReduceMotion, getAccessibleVariant } from './character-animations';

const reducedMotion = shouldReduceMotion();
const variants = reducedMotion
  ? getAccessibleVariant(baseVariants)
  : baseVariants;
```

## Testing

### Running Tests

```bash
npm run test
# or
yarn test
```

### Test Coverage

```bash
npm run test:coverage
```

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { createCharacter } from './CharacterSystem';
import { CharacterType, CharacterMood } from '../types/character-types';

describe('Character System', () => {
  it('creates character with correct defaults', () => {
    const character = createCharacter(CharacterType.TRANSIT_CONDUCTOR);

    expect(character.type).toBe(CharacterType.TRANSIT_CONDUCTOR);
    expect(character.mood).toBe(CharacterMood.NEUTRAL);
    expect(character.position).toBeDefined();
  });
});
```

## Performance

### Optimization Tips

1. **Limit Active Characters**: Keep character count under 10 for optimal performance
2. **Use Position Pooling**: Reuse character instances instead of creating new ones
3. **Throttle Context Updates**: Update character context at most every 1-2 seconds
4. **Lazy Load Animations**: Only animate visible characters

### Performance Monitoring

```tsx
import { useEffect } from 'react';

function PerformanceMonitor() {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure') {
          console.log(`${entry.name}: ${entry.duration}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    return () => observer.disconnect();
  }, []);
}
```

### Bundle Size

- Core character system: ~15KB (gzipped)
- With Framer Motion: ~45KB (gzipped)
- All character sprites: ~8KB (SVG)

## Troubleshooting

### Issue: Characters not animating

**Solution**: Ensure Framer Motion is installed and imported correctly

```bash
npm install framer-motion
```

### Issue: Dialogue not showing

**Solution**: Check that character has valid context and mood

```tsx
console.log('Character mood:', character.mood);
console.log('Character context:', characterContext);
```

### Issue: Poor performance with many characters

**Solution**: Limit active characters and use virtualization

```tsx
const MAX_CHARACTERS = 8;
const visibleCharacters = characters.slice(0, MAX_CHARACTERS);
```

### Issue: Characters not updating mood

**Solution**: Ensure context is being updated correctly

```tsx
useEffect(() => {
  const interval = setInterval(() => {
    updateCharacterContext(character.id, getCurrentContext());
  }, 2000);

  return () => clearInterval(interval);
}, [character.id]);
```

## Advanced Usage

### Custom Character Types

```typescript
// Extend character types
enum CustomCharacterType {
  SECURITY_GUARD = 'security_guard',
  TICKET_AGENT = 'ticket_agent',
}

// Implement custom sprite component
const CustomSprite: React.FC<CharacterSpriteProps> = ({ type, mood }) => {
  // Custom SVG implementation
};
```

### Integration with Tauri

```typescript
import { invoke } from '@tauri-apps/api/tauri';

async function fetchPortContext(port: number): Promise<CharacterContext> {
  const health = await invoke<PortHealth>('get_port_health', { port });
  const status = await invoke<PortStatus>('get_port_status', { port });

  return {
    portHealth: health,
    portStatus: status,
    hasConflicts: false,
    hasVulnerabilities: false,
    routingWorking: true,
    configValid: true,
  };
}
```

### Event System

```typescript
import { CharacterEvent, CharacterEventPayload } from './types/character-types';

const eventEmitter = new EventTarget();

// Listen for character events
eventEmitter.addEventListener('character:mood_changed', (event: Event) => {
  const payload = (event as CustomEvent<CharacterEventPayload>).detail;
  console.log(`Character ${payload.characterId} mood changed`);
});

// Emit events
const emitCharacterEvent = (payload: CharacterEventPayload) => {
  const event = new CustomEvent('character:' + payload.type, { detail: payload });
  eventEmitter.dispatchEvent(event);
};
```

## API Reference

See `/Users/joshkornreich/Documents/Projects/CLIs/port-authority/subway-authority/src/types/character-types.ts` for complete type definitions.

## Contributing

When adding new character types or features:

1. Update type definitions in `character-types.ts`
2. Add dialogue in `character-dialogue.ts`
3. Implement sprite in `CharacterSprite.tsx`
4. Add tests in `__tests__/character-system.test.tsx`
5. Update this guide

## License

Part of the Port Authority project - see main LICENSE file.
