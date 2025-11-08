# Subway Authority - System Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUBWAY AUTHORITY SYSTEM                          │
│                    (NYC MTA-Themed Port Management)                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER                                │
│                         (React + TypeScript)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐                                                         │
│  │   App.tsx   │  Main Application Entry Point                           │
│  └──────┬──────┘                                                         │
│         │                                                                 │
│         ├──────────────┬──────────────┬──────────────┐                  │
│         │              │              │              │                   │
│         ▼              ▼              ▼              ▼                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐            │
│  │ SubwayMap │  │Characters │  │ Alerts    │  │ Controls │            │
│  │ Component │  │ System    │  │ System    │  │ Panel    │            │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬─────┘            │
│        │              │              │              │                    │
│        ├──────┬───────┼──────────────┼──────────────┘                   │
│        │      │       │              │                                   │
│        ▼      ▼       ▼              ▼                                   │
│  ┌─────────────────────────────────────────┐                            │
│  │          STATE MANAGEMENT LAYER         │                            │
│  │              (Zustand Stores)           │                            │
│  ├─────────────────────────────────────────┤                            │
│  │                                         │                            │
│  │  ┌──────────────┐   ┌───────────────┐ │                            │
│  │  │  Port Store  │   │ Character     │ │                            │
│  │  │              │   │ Store         │ │                            │
│  │  ├──────────────┤   ├───────────────┤ │                            │
│  │  │ State:       │   │ State:        │ │                            │
│  │  │ • ports[]    │   │ • workers[]   │ │                            │
│  │  │ • mappings[] │   │ • dialogue[]  │ │                            │
│  │  │ • events[]   │   │ • enabled     │ │                            │
│  │  │ • metrics{}  │   │ • sound       │ │                            │
│  │  │              │   │               │ │                            │
│  │  │ Actions:     │   │ Actions:      │ │                            │
│  │  │ • scanPorts()│   │ • updateMood()│ │                            │
│  │  │ • addMapping()  │ • dialogue()  │ │                            │
│  │  │ • updatePort()  │ • assign()    │ │                            │
│  │  └──────┬───────┘   └───────┬───────┘ │                            │
│  │         │                   │          │                            │
│  └─────────┼───────────────────┼──────────┘                            │
│            │                   │                                        │
└────────────┼───────────────────┼────────────────────────────────────────┘
             │                   │
             ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         TAURI IPC BRIDGE                                 │
│                     (Rust ⟷ JavaScript)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Commands (JS → Rust):              Events (Rust → JS):                  │
│  • scan_active_ports()              • port:opened                        │
│  • create_port_mapping()            • port:closed                        │
│  • remove_port_mapping()            • port:health_changed                │
│  • show_mta_notification()          • notification:new                   │
│  • update_tray_tooltip()            • action:scan-ports                  │
│                                                                           │
└────────────┬────────────────────────────────────────────┬────────────────┘
             │                                            │
             ▼                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND LAYER                                 │
│                          (Rust + Tauri)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐                                                        │
│  │  main.rs     │  Application Entry Point                               │
│  └──────┬───────┘                                                        │
│         │                                                                 │
│         ├──────────────┬──────────────┬──────────────┬─────────────┐   │
│         │              │              │              │             │   │
│         ▼              ▼              ▼              ▼             ▼   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌────────┐│
│  │Port Service│ │ System     │ │Notification│ │  State   │ │ Events ││
│  │            │ │ Tray       │ │  Service   │ │ Manager  │ │ System ││
│  │⚠️ MISSING  │ │            │ │            │ │          │ │⚠️ PARTIAL││
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └────┬─────┘ └────┬───┘│
│        │              │              │              │            │    │
│        │              │              │              │            │    │
│  ┌─────▼──────────────▼──────────────▼──────────────▼────────────▼───┐│
│  │                    CORE SERVICES LAYER                             ││
│  ├────────────────────────────────────────────────────────────────────┤│
│  │                                                                     ││
│  │  Port Scanner (MISSING):      Notification Service:                ││
│  │  ❌ Real-time monitoring       ✅ MTA-style notifications           ││
│  │  ❌ Platform-specific impl     ✅ Cross-platform support            ││
│  │  ❌ Health checking            ✅ Priority levels                   ││
│  │  ❌ Process detection          ✅ Action buttons                    ││
│  │                                                                     ││
│  │  System Tray:                 State Management:                    ││
│  │  ✅ Menu system                ✅ TrayState                         ││
│  │  ✅ Quick actions              ✅ Thread-safe (RwLock)              ││
│  │  ✅ Dynamic updates            ⚠️ Limited persistence               ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                           │
└───────────────────────────┬───────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SYSTEM INTEGRATION                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   macOS      │  │   Linux      │  │  Windows     │                  │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤                  │
│  │ • lsof       │  │ • ss/netstat │  │ • netstat    │                  │
│  │ • launchctl  │  │ • systemd    │  │ • services   │                  │
│  │ • NSNotif    │  │ • libnotify  │  │ • WinNotif   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── SubwayMap
│   ├── MapControls
│   │   ├── ZoomControls
│   │   ├── PanControls
│   │   └── ViewResetButton
│   │
│   ├── SubwayLines (grouped by ServiceType)
│   │   └── Line (per service type)
│   │       └── LineSegments
│   │
│   ├── Stations (per port)
│   │   └── Station
│   │       ├── StationCircle
│   │       ├── StationLabel
│   │       ├── HealthIndicator
│   │       ├── ActivityRing
│   │       └── Tooltip
│   │
│   ├── StationBoard (selected port details)
│   │   ├── PortInfo
│   │   ├── Metrics
│   │   └── Actions
│   │
│   └── ServiceAlert (system alerts)
│       └── AlertBanner
│
├── CharacterSystem
│   ├── CharacterComponent (per worker)
│   │   ├── CharacterSprite
│   │   ├── AnimationLayer
│   │   └── DialogueBubble
│   │
│   └── DialogueQueue
│
└── MTANotificationCard
    ├── NotificationIcon
    ├── NotificationContent
    └── NotificationActions
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW PATTERNS                             │
└─────────────────────────────────────────────────────────────────────────┘

1. INITIAL PORT SCAN (App Startup)
   ─────────────────────────────────

   User Opens App
        │
        ▼
   App.tsx useEffect()
        │
        ├─→ initializeWorkers() ──→ CharacterStore
        │
        └─→ scanPorts() ──────────→ PortStore.scanPorts()
                                          │
                                          ▼
                                    invoke('scan_active_ports')
                                          │
                                          ▼
                                    [TAURI IPC BRIDGE]
                                          │
                                          ▼
                                    main.rs handler
                                          │
                                          ▼
                                    ❌ Currently returns placeholder
                                    ✅ Should call PortScanner.scan_ports()
                                          │
                                          ▼
                                    System Commands (lsof/ss/netstat)
                                          │
                                          ▼
                                    Parse Output → PortInfo[]
                                          │
                                          ▼
                                    Return to Frontend
                                          │
                                          ▼
                                    PortStore.setPorts()
                                          │
                                          ▼
                                    SubwayMap Re-renders
                                          │
                                          └─→ Creates Stations


2. REAL-TIME PORT MONITORING (Background)
   ───────────────────────────────────────

   PortScanner.start_monitoring(5s)
        │
        └─→ Every 5 seconds:
                 │
                 ├─→ Scan current ports
                 │
                 ├─→ Compare with cache
                 │
                 ├─→ Detect changes:
                 │   ├─ New port → emit('port:opened')
                 │   ├─ Closed port → emit('port:closed')
                 │   └─ Health change → emit('port:health_changed')
                 │
                 ▼
            [TAURI EVENT SYSTEM]
                 │
                 ▼
            Frontend Event Listeners
                 │
                 ├─→ PortStore.updatePort()
                 │
                 ├─→ CharacterStore.handlePortEvent()
                 │   └─→ Trigger dialogue/animation
                 │
                 └─→ NotificationService.show()


3. USER CREATES PORT MAPPING
   ──────────────────────────

   User clicks "Add Mapping"
        │
        ▼
   UI Form Submission
        │
        ▼
   PortStore.createMapping(subdomain, port)
        │
        ├─→ Optimistic Update
        │   └─→ addMapping(tempMapping)
        │
        └─→ invoke('create_port_mapping', { subdomain, port })
                 │
                 ▼
            [TAURI IPC BRIDGE]
                 │
                 ▼
            main.rs handler
                 │
                 ▼
            Update system config
                 │
                 ├─→ Success:
                 │   ├─→ Update mapping with permanent ID
                 │   └─→ Emit notification
                 │
                 └─→ Error:
                     └─→ Rollback optimistic update


4. CHARACTER MOOD UPDATES
   ──────────────────────

   Port Health Changes
        │
        ▼
   PortStore.updatePort({ health: 'unhealthy' })
        │
        ▼
   CharacterSystem.useEffect() detects port change
        │
        ▼
   calculateMood(context) → FRUSTRATED
        │
        ├─→ Update Character.mood
        │
        ├─→ Update Character.animationState
        │
        └─→ Trigger Dialogue
             │
             ├─→ selectDialogue(type, mood, context)
             │
             ├─→ Show DialogueBubble
             │
             └─→ Auto-dismiss after duration
```

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STATE MANAGEMENT FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

PORT STORE STATE TRANSITIONS:
─────────────────────────────

Initial State:
  ports: []
  mappings: []
  events: []
  metrics: {}
  isScanning: false
       │
       ▼
[scanPorts() called]
       │
       ├─→ setIsScanning(true)
       │
       ├─→ invoke('scan_active_ports')
       │        │
       │        ├─→ Success:
       │        │   ├─→ setPorts(newPorts)
       │        │   └─→ addEvent(successEvent)
       │        │
       │        └─→ Error:
       │            └─→ addEvent(errorEvent)
       │
       └─→ setIsScanning(false)

Updated State:
  ports: [PortInfo, PortInfo, ...]
  mappings: []
  events: [PortEvent]
  metrics: {}
  isScanning: false
       │
       ▼
[Real-time event received]
       │
       ├─→ updatePort(portNum, changes)
       │        │
       │        └─→ ports.map(p => p.port === portNum ? {...p, ...changes} : p)
       │
       └─→ addEvent(event)
                │
                └─→ events = [newEvent, ...events].slice(0, 100)


CHARACTER STORE STATE TRANSITIONS:
──────────────────────────────────

Initial State:
  workers: []
  activeDialogue: null
  dialogueQueue: []
  enableCharacters: true
       │
       ▼
[initializeWorkers() called]
       │
       └─→ workers = [Tony, Maria, Carlos]

Active State:
  workers: [SubwayWorker, ...]
  activeDialogue: null
  dialogueQueue: []
       │
       ▼
[Port event triggers dialogue]
       │
       ├─→ selectDialogue(type, mood, context)
       │
       ├─→ triggerDialogue(dialogue)
       │        │
       │        ├─→ activeDialogue is null:
       │        │   └─→ activeDialogue = dialogue
       │        │
       │        └─→ activeDialogue exists:
       │            └─→ dialogueQueue.push(dialogue)
       │
       └─→ setTimeout(() => dismissDialogue(), duration)
                │
                └─→ activeDialogue = dialogueQueue.shift() || null
```

## Performance Critical Paths

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PERFORMANCE BOTTLENECKS                             │
└─────────────────────────────────────────────────────────────────────────┘

RENDER PATH (Current - Inefficient):
────────────────────────────────────

Port Update
    │
    ▼
PortStore.updatePort()
    │
    ▼
All subscribers notified
    │
    ├─→ SubwayMap re-renders
    │   │
    │   ├─→ useMemo(() => stations) recalculates
    │   │   └─→ O(n) position calculations
    │   │
    │   ├─→ useMemo(() => subwayLines) recalculates
    │   │   └─→ O(n) grouping operations
    │   │
    │   └─→ ALL Stations re-render
    │       └─→ O(n²) with connections
    │           │
    │           └─→ 100 ports = 10,000 operations! ❌
    │
    └─→ CharacterSystem re-renders
        └─→ All character animations update


OPTIMIZED RENDER PATH (Proposed):
──────────────────────────────────

Port Update
    │
    ▼
PortStore.updatePort()
    │
    ▼
Selective subscribers notified
    │
    ├─→ SubwayMap re-renders
    │   │
    │   ├─→ useMemo(() => stationPositions)
    │   │   └─→ Only recalcs if ports.length changes ✅
    │   │
    │   ├─→ useMemo(() => visibleStations)
    │   │   └─→ Filters based on viewport ✅
    │   │       └─→ ~20-30 stations instead of 100
    │   │
    │   └─→ ONLY visible Stations re-render
    │       └─→ React.memo prevents unnecessary updates ✅
    │           │
    │           └─→ 100 ports = ~30 operations! ✅
    │
    └─→ CharacterSystem re-renders
        └─→ Only active animations (max 5) ✅

Performance Improvement: 300x faster! 🚀
```

## Legend

```
✅ - Implemented and working
⚠️ - Partially implemented or has issues
❌ - Not implemented or broken
→  - Data flow direction
├─ - Branch in flow
└─ - End of branch
```

## Critical Implementation Gaps

1. **Port Scanning Service** - Core functionality missing
2. **Event System** - Partial implementation, needs completion
3. **Persistence Layer** - No data persistence
4. **Performance Optimization** - No virtualization
5. **Error Handling** - Basic/incomplete
6. **Testing** - Minimal coverage

## Next Steps

Refer to `ARCHITECTURE_REVIEW.md` for detailed implementation plans and `OPTIMIZATION_QUICK_REFERENCE.md` for immediate action items.
