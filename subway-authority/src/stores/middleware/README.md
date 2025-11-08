# Store Middleware

This directory contains middleware implementations for Zustand state management.

## Files

### `events.ts`
Event system integration for Tauri events.

**Exports:**
- `EventHandler<T>` - Type for event handlers
- `portEventHandlers` - Port-related event handlers
- `characterEventHandlers` - Character-related event handlers
- `createEventsMiddleware()` - Event middleware factory (reference implementation)

**Usage:**
Event handlers are automatically registered when stores initialize. The event system integrates Tauri's IPC event system with Zustand stores for real-time updates.

**Supported Events:**
- Port: `port-update`, `port-added`, `port-removed`, `port-health-changed`, `port-metrics`, `mapping-created`, `mapping-removed`
- Character: `port-event`, `worker-update`

### `persist.ts`
Persistence middleware for localStorage-based state persistence.

**Exports:**
- `persist()` - Persistence middleware factory (reference implementation)
- `PersistOptions<T>` - Configuration options
- `useHydrate()` - Manual hydration hook

**Features:**
- Custom serialization for Date, Map, Set
- Selective persistence via `partialize`
- Version migration support
- Automatic hydration on initialization

## Current Implementation

The stores currently use a simplified approach with direct event listener registration and localStorage subscription instead of middleware composition. The middleware files serve as reference implementations and type definitions.

## Migration Notes

To use full middleware composition:

1. Update Zustand to latest version
2. Refactor store creation to use middleware chain
3. Test thoroughly with existing state

## Documentation

See `/docs/STATE_MANAGEMENT.md` for comprehensive documentation on state management architecture.
