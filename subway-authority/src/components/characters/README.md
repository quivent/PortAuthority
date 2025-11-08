# Subway Authority Character System

A delightful, contextual feedback system featuring NYC subway-themed worker characters that react to port and service health in real-time.

## Features

- **6 Unique Character Types**: Transit conductors, station masters, maintenance crew, track inspectors, dispatchers, and platform managers
- **Contextual Reactions**: Characters change mood and dialogue based on port health, routing status, and configuration validity
- **Smooth Animations**: 60fps Framer Motion animations with accessibility support
- **SVG-Based Sprites**: Lightweight, scalable character illustrations with NYC MTA styling
- **Comprehensive Dialogue System**: 100+ contextual messages with mood-based selection
- **TypeScript**: Full type safety with comprehensive interfaces
- **Accessible**: ARIA labels, keyboard navigation, reduced motion support
- **Tested**: 50+ unit tests covering all core functionality

## Quick Start

```tsx
import { CharacterSystem, createCharacter, useCharacterSystem } from './components/characters/CharacterSystem';
import { CharacterType } from './types/character-types';

function App() {
  const { characters, addCharacter } = useCharacterSystem();

  React.useEffect(() => {
    const conductor = createCharacter(CharacterType.TRANSIT_CONDUCTOR, {
      position: { x: 100, y: 100 },
    });
    addCharacter(conductor);
  }, []);

  return (
    <CharacterSystem characters={characters} />
  );
}
```

## File Structure

```
characters/
├── CharacterSystem.tsx          # Main orchestrator component
├── CharacterSprite.tsx          # SVG character illustrations
├── DialogueBubble.tsx           # Speech bubble component
├── character-animations.ts      # Framer Motion animation configs
├── character-dialogue.ts        # Contextual dialogue system
├── character-system.css         # NYC MTA styling
└── README.md                    # This file

../types/
└── character-types.ts           # TypeScript definitions

../examples/
└── CharacterSystemExample.tsx   # 7 complete usage examples

../__tests__/
└── character-system.test.tsx    # Comprehensive unit tests
```

## Character Types

### 1. Transit Conductor
Monitors port routing and traffic flow
- **Happy**: Smooth routing, no delays
- **Unhappy**: Blocked ports, traffic issues

### 2. Station Master
Manages configuration and subdomain mappings
- **Happy**: Clean configuration, no conflicts
- **Unhappy**: Configuration errors, conflicts

### 3. Maintenance Crew
Monitors service health and uptime
- **Happy**: Services healthy, good uptime
- **Unhappy**: Services down, poor health

### 4. Track Inspector
Monitors security and vulnerabilities
- **Happy**: Secure ports, no vulnerabilities
- **Unhappy**: Security issues detected

### 5. Dispatcher
Oversees routing and connections
- **Happy**: Fast routing, all connections working
- **Unhappy**: Routing failures, slow connections

### 6. Platform Manager
Manages overall organization and operations
- **Happy**: Well-organized system
- **Unhappy**: Chaos, disorganization

## API Reference

### CharacterSystem Component

```tsx
interface CharacterSystemProps {
  characters: Character[];
  onCharacterUpdate?: (character: Character) => void;
  onDialogueComplete?: (characterId: string) => void;
  disabled?: boolean;
  className?: string;
}
```

### useCharacterSystem Hook

```tsx
const {
  characters,          // Current character array
  addCharacter,        // Add new character
  removeCharacter,     // Remove character by ID
  updateCharacter,     // Update character properties
  getCharacter,        // Get character by ID
  clearCharacters,     // Remove all characters
} = useCharacterSystem();
```

### createCharacter Factory

```tsx
const character = createCharacter(
  CharacterType.TRANSIT_CONDUCTOR,
  {
    name: 'Custom Name',
    position: { x: 100, y: 100 },
    assignedPort: 3000,
  }
);
```

### CharacterPositioning Helpers

```tsx
// Grid layout
const pos = CharacterPositioning.grid(index, columns, spacing);

// Circular layout
const pos = CharacterPositioning.circle(index, total, radius, centerX, centerY);

// Random positioning
const pos = CharacterPositioning.random(minX, maxX, minY, maxY);
```

## Character Context

Characters react to the current system state provided via `CharacterContext`:

```tsx
interface CharacterContext {
  portHealth: PortHealth;        // HEALTHY | WARNING | CRITICAL | UNKNOWN
  portStatus: PortStatus;        // ACTIVE | INACTIVE | BLOCKED | ERROR
  serviceHealth?: {
    responseTime: number;
    errorRate: number;
    uptime: number;
    lastCheck: Date;
  };
  hasConflicts: boolean;         // Port conflicts present
  hasVulnerabilities: boolean;   // Security issues
  routingWorking: boolean;       // Routing functional
  configValid: boolean;          // Configuration valid
}
```

## Mood System

Characters automatically calculate their mood based on context:

- **HAPPY**: All systems healthy, no issues
- **CONTENT**: Normal operations, stable
- **NEUTRAL**: Inactive or unknown state
- **CONCERNED**: Warning conditions detected
- **FRUSTRATED**: Multiple issues, degraded service
- **ANGRY**: Critical failures, system down

## Animation System

Built with Framer Motion, supports:

- **Idle**: Subtle breathing/floating
- **Working**: Busy movement
- **Celebrating**: Jump and spin (happy mood)
- **Concerned**: Head shake
- **Fixing**: Tool movement (frustrated)
- **Upset**: Frustrated pacing (angry)

All animations respect `prefers-reduced-motion`.

## Accessibility

- **ARIA Labels**: All interactive elements properly labeled
- **Keyboard Navigation**: Tab/Space/Enter support
- **Screen Reader**: Live regions for status updates
- **Reduced Motion**: Simplified animations when requested
- **High Contrast**: Enhanced borders and outlines
- **Focus Visible**: Clear focus indicators

## Testing

Run tests with:

```bash
npm test                  # Run all tests
npm run test:ui           # Visual test UI
npm run test:coverage     # Coverage report
```

Test coverage:
- ✅ Mood calculation logic
- ✅ Dialogue selection
- ✅ Animation mappings
- ✅ Character factory
- ✅ Positioning helpers
- ✅ Type guards
- ✅ Performance benchmarks
- ✅ Edge cases

## Performance

- **Bundle Size**: ~15KB core system (gzipped)
- **Animation**: 60fps target with GPU acceleration
- **Character Limit**: Optimized for up to 10 simultaneous characters
- **Memory**: Minimal footprint, efficient state management

## Styling

Import the CSS file:

```tsx
import './components/characters/character-system.css';
```

Or customize with MTA color variables:

```css
:root {
  --mta-blue: #0039a6;
  --mta-orange: #ff6319;
  --mta-red: #ee352e;
  --mta-green: #00933c;
  --mta-yellow: #fccc0a;
}
```

## Examples

See `/src/examples/CharacterSystemExample.tsx` for 7 complete examples:

1. **Basic Setup**: Single character initialization
2. **Multiple Characters**: All 6 character types
3. **Port Monitoring**: Real-time health tracking
4. **Interactive Dashboard**: Manual state control
5. **Circular Layout**: Characters in a circle
6. **Port Assignment**: Characters assigned to specific ports
7. **Real-time Updates**: Simulated context changes

## Integration Guide

See `CHARACTER_SYSTEM_GUIDE.md` for comprehensive integration documentation including:

- Architecture overview
- Component API details
- Tauri backend integration
- Custom character types
- Event system
- Troubleshooting

## Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "framer-motion": "^10.16.0"
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## License

Part of the Port Authority project - MIT License

## Contributing

When adding new features:

1. Update type definitions in `character-types.ts`
2. Add dialogue in `character-dialogue.ts`
3. Implement sprites in `CharacterSprite.tsx`
4. Add tests in `__tests__/character-system.test.tsx`
5. Update documentation

## Credits

Designed and implemented for the Subway Authority desktop application, bringing delight and personality to port management.
