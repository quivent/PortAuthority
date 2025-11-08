# 🎨 Component Usage Examples

## Quick Component Reference

### SubwayMap - Main Interactive Map

```tsx
import { SubwayMap } from '@components/subway-map/SubwayMap';

function App() {
  return <SubwayMap />;
}
```

**Props**: None (uses stores internally)

**Features**:
- Automatic port scanning every 5 seconds
- Interactive pan (click and drag)
- Zoom with mouse wheel
- Click stations to view details

---

### Station - Interactive Port Station

```tsx
import { Station } from '@components/subway-map/Station';
import { Station as StationType } from '@types/SubwayMap';

const station: StationType = {
  id: 'station-3000',
  name: 'API Server',
  port: { port: 3000, processName: 'node', ... },
  position: { x: 400, y: 300 },
  lines: [],
  connections: [],
  status: 'operational',
  passengers: 5,
};

<Station
  station={station}
  isSelected={false}
  onClick={() => console.log('Clicked!')}
/>
```

**Visual States**:
- Default: 12px radius circle
- Hover: Brightness increase, tooltip appears
- Selected: 16px radius, enhanced glow
- Active: Pulsing outer ring

---

### Line - Subway Route Visualization

```tsx
import { Line } from '@components/subway-map/Line';
import { SubwayLine } from '@types/SubwayMap';

const line: SubwayLine = {
  id: 'line-nodejs',
  name: 'Lexington Express',
  color: '#00933C',
  serviceType: ServiceType.NodeJS,
  stations: [station1, station2, station3],
  status: 'good_service',
  isExpress: true,
};

<Line line={line} />
```

**Features**:
- Automatic path generation through stations
- Express lines show double line effect
- Animated data flow with moving trains
- Service type badge display

---

### ServiceAlert - MTA-Style Notifications

```tsx
import { ServiceAlert } from '@components/subway-map/ServiceAlert';

// Component automatically subscribes to port events
<ServiceAlert />
```

**Displays**:
- Latest 5 port events with severity != 'info'
- Auto-dismissible alerts
- Color-coded by severity (info/warning/critical)
- Slide-in animation from right

**Alert Triggers**:
```tsx
import { usePortStore } from '@stores/portStore';

const { addEvent } = usePortStore();

addEvent({
  type: PortEventType.HealthChanged,
  port: 3000,
  timestamp: new Date(),
  message: 'Port 3000 health degraded to warning',
  severity: 'warning',
});
```

---

### StationBoard - Port Details Panel

```tsx
import { StationBoard } from '@components/subway-map/StationBoard';

<StationBoard
  port={selectedPortInfo}
  onClose={() => setSelectedPort(null)}
/>
```

**Sections**:
1. Service Information (process, PID, user, type, health)
2. Domain Mappings (subdomain.localhost → port)
3. Performance Metrics (requests/sec, latency, errors)
4. Quick Actions (open, map, logs, stop)

---

### MapControls - Navigation Controls

```tsx
import { MapControls } from '@components/subway-map/MapControls';
import { MapViewport } from '@types/SubwayMap';

const [viewport, setViewport] = useState<MapViewport>({
  centerX: 600,
  centerY: 400,
  zoom: 1,
  rotation: 0,
});

<MapControls
  viewport={viewport}
  onViewportChange={setViewport}
  onResetView={() => setViewport(defaultViewport)}
/>
```

**Controls**:
- Zoom in: Multiply zoom by 1.2
- Zoom out: Divide zoom by 1.2
- Rotate left: Subtract 15 degrees
- Rotate right: Add 15 degrees
- Reset: Return to defaults

---

## Store Usage Examples

### Port Store Operations

```tsx
import { usePortStore } from '@stores/portStore';

function PortManager() {
  const {
    ports,
    mappings,
    isScanning,
    scanPorts,
    createMapping,
    removePortMapping,
  } = usePortStore();

  // Scan ports manually
  const handleScan = async () => {
    await scanPorts();
  };

  // Create subdomain mapping
  const handleCreateMapping = async () => {
    await createMapping('api', 3000);
    // Creates: api.localhost → port 3000
  };

  // Remove mapping
  const handleRemoveMapping = async () => {
    const mapping = mappings.find(m => m.subdomain === 'api');
    if (mapping) {
      await removePortMapping(mapping.id);
    }
  };

  return (
    <div>
      <button onClick={handleScan} disabled={isScanning}>
        {isScanning ? 'Scanning...' : 'Scan Ports'}
      </button>
      <p>Active ports: {ports.length}</p>
      <p>Mappings: {mappings.length}</p>
    </div>
  );
}
```

### Character Store Operations

```tsx
import { useCharacterStore } from '@stores/characterStore';
import { WorkerMood, WorkerAction } from '@types/Character';

function CharacterPanel() {
  const {
    workers,
    activeDialogue,
    initializeWorkers,
    updateWorkerMood,
    triggerDialogue,
    handlePortEvent,
  } = useCharacterStore();

  // Initialize default workers
  useEffect(() => {
    initializeWorkers();
  }, []);

  // Trigger character reaction to port event
  const handlePortOpened = (port: number) => {
    handlePortEvent(port, 'port_opened');
    // Character will show dialogue automatically
  };

  // Manual dialogue trigger
  const showCustomDialogue = () => {
    triggerDialogue({
      id: 'custom-1',
      workerId: workers[0].id,
      message: 'All systems operational!',
      duration: 3000,
      priority: 1,
      timestamp: new Date(),
    });
  };

  return (
    <div>
      <h3>Subway Workers</h3>
      {workers.map(worker => (
        <div key={worker.id}>
          <p>{worker.name} ({worker.role})</p>
          <p>Mood: {worker.mood}</p>
          <p>Action: {worker.currentAction}</p>
        </div>
      ))}
      {activeDialogue && (
        <div className="dialogue-bubble">
          {activeDialogue.message}
        </div>
      )}
    </div>
  );
}
```

---

## Styling Examples

### Using Design Tokens

```css
/* Component-specific styles */
.my-component {
  /* Colors */
  background-color: var(--pa-blue-primary);
  color: var(--pa-white);
  border: 2px solid var(--mta-green);

  /* Typography */
  font-family: var(--font-primary);
  font-size: var(--font-size-lg);

  /* Spacing */
  padding: var(--spacing-md);
  margin: var(--spacing-lg);

  /* Border Radius */
  border-radius: var(--radius-md);

  /* Shadows */
  box-shadow: var(--shadow-lg);

  /* Transitions */
  transition: all var(--transition-base);
}

.my-component:hover {
  background-color: var(--pa-blue-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}
```

### MTA Line Badge

```tsx
function LineBadge({ serviceType }: { serviceType: ServiceType }) {
  return (
    <div className={`mta-line-badge type-${serviceType}`}>
      {serviceType.toUpperCase()}
    </div>
  );
}

// Styling automatically applied from nyc-theme.css
// .type-nodejs { background-color: #00933C; }
// .type-python { background-color: #FCCC02; }
// etc.
```

### Status Indicators

```tsx
function HealthBadge({ health }: { health: PortHealth }) {
  return (
    <span className={`health-badge health-${health}`}>
      {health}
    </span>
  );
}

// Colors:
// .health-healthy { color: var(--status-healthy); } // Green
// .health-degraded { color: var(--status-warning); } // Yellow
// .health-unhealthy { color: var(--status-error); } // Red
```

---

## Animation Examples

### Pulse Animation (Active Connections)

```tsx
<circle r={12} fill={stationColor}>
  <animate
    attributeName="r"
    values="12;16;12"
    dur="2s"
    repeatCount="indefinite"
  />
</circle>
```

### Moving Train (Data Flow)

```tsx
<circle r={4} fill={lineColor}>
  <animateMotion
    dur="6s"
    repeatCount="indefinite"
    path="M100,100 Q200,150 300,100"
  />
</circle>
```

### Slide In Panel

```css
@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.panel {
  animation: slideInLeft 200ms ease-out;
}
```

---

## TypeScript Type Examples

### Creating Port Info

```typescript
import { PortInfo, PortStatus, PortHealth, ServiceType } from '@types/Port';

const portInfo: PortInfo = {
  port: 3000,
  processName: 'node',
  pid: 12345,
  user: 'developer',
  status: PortStatus.Active,
  health: PortHealth.Healthy,
  subdomain: 'api',
  serviceType: ServiceType.NodeJS,
  lastChecked: new Date(),
  uptime: 3600,
  connections: 5,
};
```

### Creating Subdomain Mapping

```typescript
import { SubdomainMapping } from '@types/Port';

const mapping: SubdomainMapping = {
  id: 'api-3000',
  subdomain: 'api',
  port: 3000,
  domain: 'localhost',
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Creating Service Alert

```typescript
import { ServiceAlert } from '@types/SubwayMap';

const alert: ServiceAlert = {
  id: 'alert-123',
  severity: 'warning',
  title: 'Service Delayed',
  message: 'Port 3000 experiencing high latency',
  affectedLines: ['nodejs'],
  affectedStations: ['Port 3000'],
  timestamp: new Date(),
  acknowledged: false,
};
```

---

## Testing Examples

### Component Testing (Vitest + Testing Library)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Station } from './Station';

describe('Station Component', () => {
  it('renders station with port number', () => {
    const station = createMockStation({ port: 3000 });
    render(<Station station={station} isSelected={false} onClick={vi.fn()} />);

    expect(screen.getByText('3000')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const station = createMockStation();

    render(<Station station={station} isSelected={false} onClick={handleClick} />);

    const stationElement = screen.getByRole('button');
    fireEvent.click(stationElement);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows tooltip on hover', async () => {
    const station = createMockStation({ name: 'API Server' });
    render(<Station station={station} isSelected={false} onClick={vi.fn()} />);

    const stationElement = screen.getByRole('button');
    fireEvent.mouseEnter(stationElement);

    expect(await screen.findByText('API Server')).toBeVisible();
  });
});
```

### Store Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { usePortStore } from './portStore';

describe('Port Store', () => {
  beforeEach(() => {
    // Reset store before each test
    usePortStore.setState({ ports: [], mappings: [] });
  });

  it('adds port to store', () => {
    const { setPorts } = usePortStore.getState();
    const mockPorts = [createMockPort({ port: 3000 })];

    setPorts(mockPorts);

    expect(usePortStore.getState().ports).toHaveLength(1);
    expect(usePortStore.getState().ports[0].port).toBe(3000);
  });

  it('updates port health', () => {
    const { setPorts, updatePort } = usePortStore.getState();
    setPorts([createMockPort({ port: 3000, health: 'healthy' })]);

    updatePort(3000, { health: 'degraded' });

    const port = usePortStore.getState().ports[0];
    expect(port.health).toBe('degraded');
  });
});
```

---

## Performance Optimization Examples

### Memoized Station List

```tsx
import { useMemo } from 'react';

function SubwayMap() {
  const { ports } = usePortStore();

  // Only recalculate when ports change
  const stations = useMemo(() => {
    return ports.map((port, index) => ({
      id: `station-${port.port}`,
      name: port.subdomain || `Port ${port.port}`,
      port,
      position: calculatePosition(index, ports.length),
      // ... other properties
    }));
  }, [ports]);

  return (
    <svg>
      {stations.map(station => (
        <Station key={station.id} station={station} />
      ))}
    </svg>
  );
}
```

### Debounced Scanning

```tsx
import { useEffect } from 'react';
import { debounce } from 'lodash';

function usePortScanning() {
  const { scanPorts } = usePortStore();

  useEffect(() => {
    const debouncedScan = debounce(scanPorts, 1000);

    const interval = setInterval(debouncedScan, 5000);

    return () => {
      clearInterval(interval);
      debouncedScan.cancel();
    };
  }, [scanPorts]);
}
```

### Virtualized Station Rendering

```tsx
function SubwayMapVirtualized() {
  const { ports } = usePortStore();
  const [viewportBounds, setViewportBounds] = useState<Bounds>();

  // Only render stations in viewport
  const visibleStations = useMemo(() => {
    if (!viewportBounds) return stations;

    return stations.filter(station =>
      isInViewport(station.position, viewportBounds)
    );
  }, [stations, viewportBounds]);

  return (
    <svg onViewportChange={setViewportBounds}>
      {visibleStations.map(station => (
        <Station key={station.id} station={station} />
      ))}
    </svg>
  );
}
```

---

**Component Library Complete** ✅

All components are production-ready with comprehensive examples and documentation.
