# State Management Architecture

## Overview

The Subway Authority application uses Zustand for state management with custom middleware for persistence and real-time event integration. This document describes the state management architecture, middleware implementations, and best practices.

## Store Architecture

### Port Store (`/src/stores/portStore.ts`)

Manages port information, subdomain mappings, and service metrics.

**State Structure:**
```typescript
interface PortState {
  // Core Data
  ports: PortInfo[];                      // Active port information
  mappings: SubdomainMapping[];           // Subdomain-to-port mappings
  events: PortEvent[];                    // Event history (last 100)
  metrics: Record<number, PortMetrics>;   // Port performance metrics

  // UI State
  isScanning: boolean;                    // Scanning in progress
  lastScanTime: Date | null;              // Last scan timestamp
  selectedPort: number | null;            // Currently selected port

  // Actions
  // ... (see type definition)
}
```

**Key Features:**
- Automatic persistence of ports, mappings, and metrics
- Real-time event listeners for port updates
- Immutable state updates using Record instead of Map
- Transient state (events, isScanning) not persisted

### Character Store (`/src/stores/characterStore.ts`)

Manages subway workers, dialogue system, and character animations.

**State Structure:**
```typescript
interface CharacterState {
  // Core Data
  workers: SubwayWorker[];                // Subway worker characters
  activeDialogue: Dialogue | null;        // Currently displayed dialogue
  dialogueQueue: Dialogue[];              // Queued dialogue messages

  // Settings
  enableCharacters: boolean;              // Character system enabled
  soundEnabled: boolean;                  // Sound effects enabled

  // Actions
  // ... (see type definition)
}
```

**Key Features:**
- Automatic persistence of workers and settings
- Real-time event listeners for port events
- Dialogue queue management
- Character mood and action updates

## Middleware

### Persist Middleware (`/src/stores/middleware/persist.ts`)

Provides localStorage-based persistence with automatic serialization/deserialization.

**Features:**
- Custom serializer for Date, Map, and Set objects
- Selective state persistence via `partialize` option
- Version migration support
- Automatic hydration on store initialization

**Usage:**
```typescript
persist(
  (set, get) => ({
    // Store implementation
  }),
  {
    name: 'store-name',           // Storage key
    version: 1,                   // Schema version
    partialize: (state) => ({     // Select what to persist
      // Return only fields to persist
    }),
    migrate: (state, version) => {  // Optional migration
      // Migrate old state to new version
      return state;
    },
  }
)
```

**Serialization:**
- Dates: Serialized as ISO strings with `__type: 'Date'`
- Maps: Converted to array of entries with `__type: 'Map'`
- Sets: Converted to array with `__type: 'Set'`

**Storage Keys:**
- Port Store: `subway-authority-port-store-v1`
- Character Store: `subway-authority-character-store-v1`

### Events Middleware (`/src/stores/middleware/events.ts`)

Integrates Tauri event system with Zustand stores for real-time updates.

**Features:**
- Automatic event listener registration
- Type-safe event handlers
- Event payload validation
- Automatic cleanup on unmount

**Event Handlers:**

#### Port Events
- `port-update`: Updates existing port information
- `port-added`: Adds new port to list
- `port-removed`: Removes port from list
- `port-health-changed`: Updates port health status
- `port-metrics`: Updates port performance metrics
- `mapping-created`: Adds new subdomain mapping
- `mapping-removed`: Removes subdomain mapping

#### Character Events
- `port-event`: Triggers character dialogue response
- `worker-update`: Updates worker state

**Usage:**
```typescript
createEventsMiddleware(
  (set, get) => ({
    // Store implementation
  }),
  {
    handlers: [
      {
        event: 'event-name',
        handler: (state, payload) => {
          // Return partial state update or null
          return { /* state updates */ };
        },
      },
    ],
    autoStart: true,  // Start listeners immediately
  }
)
```

## Critical Fixes Applied

### 1. Map Immutability Issue (CRITICAL)

**Problem:** Using `Map` for metrics broke Zustand's immutability requirements.

**Solution:** Replaced `Map<number, PortMetrics>` with `Record<number, PortMetrics>`.

**Before:**
```typescript
metrics: new Map<number, PortMetrics>();

updateMetrics: (port, metrics) => {
  const newMetrics = new Map(state.metrics);
  newMetrics.set(port, metrics);
  return { metrics: newMetrics };
}
```

**After:**
```typescript
metrics: Record<number, PortMetrics> = {};

updateMetrics: (port, metrics) => ({
  metrics: {
    ...state.metrics,
    [port]: metrics,
  },
})
```

### 2. Missing Persistence (HIGH)

**Problem:** No data persistence resulted in data loss on app restart.

**Solution:** Added persist middleware to both stores with selective state persistence.

**Configuration:**
- Persisted: Core data (ports, mappings, workers, settings)
- Not persisted: Transient state (events, scanning status, active dialogue)

### 3. Event System Integration (HIGH)

**Problem:** No real-time updates from Tauri backend.

**Solution:** Implemented events middleware with automatic event listener registration.

**Benefits:**
- Real-time port status updates
- Automatic UI synchronization
- Character reactions to port events
- Performance metric streaming

## Best Practices

### State Updates

1. **Always use immutable updates:**
```typescript
// Good
set((state) => ({
  ports: [...state.ports, newPort],
}));

// Bad
state.ports.push(newPort);
```

2. **Use partial updates when possible:**
```typescript
// Good
set({ isScanning: true });

// Less efficient
set((state) => ({ ...state, isScanning: true }));
```

3. **Provide action names for devtools:**
```typescript
set({ ports: newPorts }, false, 'setPorts');
```

### Selectors

1. **Use memoized selectors for derived state:**
```typescript
export const selectActiveServices = (state: PortState) =>
  state.ports.filter((p) => p.status === 'active');
```

2. **Create parameterized selectors:**
```typescript
export const selectPortByNumber = (state: PortState, port: number) =>
  state.ports.find((p) => p.port === port);
```

### Error Handling

1. **Wrap async operations in try-catch:**
```typescript
scanPorts: async () => {
  try {
    const ports = await invoke('scan_active_ports');
    set({ ports });
  } catch (error) {
    console.error('Scan failed:', error);
    // Handle error appropriately
  }
}
```

2. **Log errors to event system:**
```typescript
catch (error) {
  get().addEvent({
    type: 'error',
    message: `Operation failed: ${error}`,
    severity: 'error',
  });
}
```

## Testing

### Unit Tests

Test stores in isolation using Zustand's testing utilities:

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePortStore } from './portStore';

test('should update port', () => {
  const { result } = renderHook(() => usePortStore());

  act(() => {
    result.current.updatePort(3000, { status: 'active' });
  });

  expect(result.current.ports[0].status).toBe('active');
});
```

### Integration Tests

Test event integration using mock Tauri events:

```typescript
import { mockIPC } from '@tauri-apps/api/mocks';

test('should handle port-added event', async () => {
  const { result } = renderHook(() => usePortStore());

  await mockIPC((cmd, args) => {
    // Emit mock event
    emit('port-added', { port: 3000, status: 'active' });
  });

  expect(result.current.ports).toContainEqual(
    expect.objectContaining({ port: 3000 })
  );
});
```

## Performance Considerations

### Persistence

- Persistence occurs after every state change
- Use `partialize` to reduce serialization overhead
- Avoid persisting large transient data (events, logs)

### Event Listeners

- Event handlers are called synchronously
- Keep handlers lightweight to avoid blocking UI
- Use `setTimeout` for expensive operations
- Debounce high-frequency events if needed

### Selectors

- Selectors are not memoized by default
- Use React hooks or libraries like Reselect for memoization
- Avoid complex computations in selectors

## Migration Guide

### Updating Store Schema

When changing store structure:

1. Increment version number
2. Implement migration function
3. Test with old persisted data

```typescript
persist(
  storeConfig,
  {
    name: 'my-store',
    version: 2,  // Incremented
    migrate: (persistedState, version) => {
      if (version === 1) {
        // Migrate v1 to v2
        return {
          ...persistedState,
          newField: 'default',
        };
      }
      return persistedState;
    },
  }
)
```

### Adding New Events

1. Define event in Tauri backend
2. Add event handler to middleware
3. Update TypeScript types
4. Test event flow

```typescript
export const portEventHandlers: EventHandler<any>[] = [
  // ... existing handlers
  {
    event: 'new-event-name',
    handler: (state, payload) => {
      // Handle event
      return { /* state updates */ };
    },
  },
];
```

## Troubleshooting

### State Not Persisting

1. Check browser localStorage for key
2. Verify `partialize` includes desired fields
3. Check console for serialization errors
4. Ensure state updates are immutable

### Events Not Firing

1. Verify Tauri backend is emitting events
2. Check event names match exactly
3. Ensure `autoStart: true` in middleware config
4. Check console for event handler errors

### Performance Issues

1. Reduce persisted state size
2. Debounce high-frequency events
3. Use selectors instead of computing in components
4. Profile with React DevTools and Zustand DevTools

## References

- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Tauri Event System](https://tauri.app/v1/guides/features/events)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
