# 🚀 Subway Authority - Quick Start Guide

Get the interactive subway map running in 5 minutes.

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Git**: For cloning (optional)

Check versions:
```bash
node --version  # Should be v18+
npm --version   # Should be v9+
```

## Installation

### Step 1: Navigate to Project

```bash
cd /Users/joshkornreich/Documents/Projects/CLIs/port-authority/subway-authority
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- React 18.2.0 (UI framework)
- Zustand 4.4.7 (state management)
- Vite 5.0.10 (build tool)
- TypeScript 5.3.3 (type safety)
- All development tools

**Installation time**: ~30 seconds with fast internet

### Step 3: Start Development Server

```bash
npm run dev
```

You should see:
```
VITE v5.0.10  ready in 342 ms

➜  Local:   http://localhost:1420/
➜  Network: use --host to expose
➜  press h to show help
```

### Step 4: Open in Browser

Navigate to: **http://localhost:1420**

You should see the Subway Authority interface with the interactive subway map!

## What You'll See

### Initial View
- **Blue header** with "Subway Authority Network Map" title
- **Legend** showing service types with colors
- **Interactive map** with spiral station layout
- **Map controls** in top-left corner (zoom, rotate, reset)

### Interactive Features

**Hover over a station:**
- Tooltip appears showing port details
- Station highlights with glow effect

**Click a station:**
- Station Board panel slides in from bottom-left
- Shows detailed port information
- Displays domain mappings and metrics
- Provides quick action buttons

**Use map controls:**
- Zoom in/out: Scale the map
- Rotate left/right: Change perspective
- Reset: Return to default view

**Pan the map:**
- Click and drag anywhere on the map
- Smooth panning with momentum

## Mock Data for Development

Since Tauri backend isn't connected yet, the app uses mock data:

```typescript
// Mock ports appear automatically
const mockPorts = [
  { port: 3000, processName: 'node', serviceType: 'nodejs' },
  { port: 8000, processName: 'python', serviceType: 'python' },
  { port: 4000, processName: 'rails', serviceType: 'ruby' },
  // ... more mock ports
];
```

To customize mock data, edit `/src/stores/portStore.ts`

## Development Commands

```bash
# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking (no output = success)
npm run type-check

# Linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Project Structure Quick Reference

```
subway-authority/
├── src/
│   ├── components/subway-map/  # All map components
│   ├── stores/                 # State management
│   ├── types/                  # TypeScript definitions
│   └── styles/                 # CSS and design tokens
├── index.html                  # Entry HTML
├── package.json                # Dependencies
└── vite.config.ts              # Build configuration
```

## Customization Examples

### Change Subway Line Colors

Edit `/src/types/SubwayMap.ts`:

```typescript
export const NYC_SUBWAY_COLORS: Record<ServiceType, string> = {
  [ServiceType.NodeJS]: '#00FF00', // Change to bright green
  [ServiceType.Python]: '#FF00FF', // Change to magenta
  // ... other colors
};
```

### Adjust Station Layout

Edit `/src/components/subway-map/SubwayMap.tsx`:

```typescript
function calculateStationPosition(index: number, total: number) {
  // Change from spiral to grid
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;

  return {
    x: 200 + col * 150,
    y: 200 + row * 150,
  };
}
```

### Add Custom Service Alert

```typescript
import { usePortStore } from '@stores/portStore';

const { addEvent } = usePortStore();

addEvent({
  type: PortEventType.ServiceStarted,
  port: 3000,
  timestamp: new Date(),
  message: 'Custom service started on port 3000',
  severity: 'info',
});
```

## Troubleshooting

### Port 1420 Already in Use

```bash
# Kill process on port 1420
lsof -ti:1420 | xargs kill -9

# Or change port in vite.config.ts
server: {
  port: 3000, // Change to any available port
  strictPort: true,
}
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Regenerate types
npm run type-check

# If persists, restart TypeScript server in VS Code:
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Hot Reload Not Working

```bash
# Restart dev server
# Press Ctrl+C to stop, then:
npm run dev
```

## Next Steps

### 1. Explore the Code
- **Components**: Check out `src/components/subway-map/` for UI
- **State**: Review `src/stores/` for state management
- **Types**: See `src/types/` for TypeScript definitions

### 2. Read Documentation
- **README.md**: Complete feature documentation
- **DESIGN_SPECIFICATIONS.md**: Visual design details
- **IMPLEMENTATION_SUMMARY.md**: Technical overview

### 3. Customize
- Change colors in `src/styles/nyc-theme.css`
- Modify layout in `SubwayMap.tsx`
- Add new features to stores

### 4. Integrate with Backend
- Set up Tauri (see main Port Authority docs)
- Implement Rust commands for port scanning
- Connect stores to real Tauri API

## Performance Tips

### Development
- Use Chrome DevTools Performance tab
- Enable React DevTools Profiler
- Monitor bundle size with `npm run build`

### Production
- Always build before deploying: `npm run build`
- Test on target devices
- Verify bundle sizes in `dist/assets/`

## Common Tasks

### Add New Station
```typescript
const newPort: PortInfo = {
  port: 5000,
  processName: 'custom-app',
  pid: 12345,
  user: 'developer',
  status: PortStatus.Active,
  health: PortHealth.Healthy,
  serviceType: ServiceType.NodeJS,
  lastChecked: new Date(),
  uptime: 0,
  connections: 0,
};

usePortStore.getState().setPorts([...ports, newPort]);
```

### Trigger Service Alert
```typescript
const alert: ServiceAlertType = {
  id: 'alert-123',
  severity: 'warning',
  title: 'Service Degraded',
  message: 'Port 3000 experiencing high latency',
  affectedLines: ['nodejs'],
  affectedStations: ['Port 3000'],
  timestamp: new Date(),
  acknowledged: false,
};

// Alert appears automatically through event system
```

### Update Station Health
```typescript
usePortStore.getState().updatePort(3000, {
  health: PortHealth.Degraded,
  status: PortStatus.Warning,
});
```

## Support

### Issues?
- Check console for errors: `Cmd+Opt+J` (Chrome)
- Review Network tab for failed requests
- Verify all dependencies installed: `npm list`

### Questions?
- Review inline code comments (comprehensive)
- Check TypeScript types for API reference
- Read component documentation in files

---

**Ready to build!** 🚀

Start customizing your subway map and transform port management into a visual experience.

**Development URL**: http://localhost:1420
**Build Command**: `npm run build`
**Deploy Directory**: `dist/`
