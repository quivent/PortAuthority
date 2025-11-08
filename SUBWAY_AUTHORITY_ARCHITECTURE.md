# 🚇 Subway Authority - Architecture Design

## Phase 2: Architecture Design & Component Structure

### 2.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBWAY AUTHORITY DESKTOP APP                 │
│                         (Tauri Application)                     │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Web Technologies)          │  Backend (Rust/Tauri)   │
│  ┌─────────────────────────────────┐   │  ┌─────────────────────┐ │
│  │         UI Layer                │   │  │   Tauri Commands    │ │
│  │  ┌─────────────────────────────┐│   │  │  ┌─────────────────┐│ │
│  │  │  Subway Map Visualizer      ││   │  │  │ Port Management ││ │
│  │  │  Character System           ││   │  │  │ Config Service  ││ │
│  │  │  Station Board              ││   │  │  │ Hosts Manager   ││ │
│  │  │  Control Tower Dashboard    ││   │  │  │ System Monitor  ││ │
│  │  └─────────────────────────────┘│   │  │  └─────────────────┘│ │
│  │         State Management        │   │  │                     │ │
│  │  ┌─────────────────────────────┐│   │  │   Core Services     │ │
│  │  │  Port Store                 ││   │  │  ┌─────────────────┐│ │
│  │  │  Character Store            ││   │  │  │ Port Scanner    ││ │
│  │  │  Config Store               ││   │  │  │ Character Engine││ │
│  │  │  Notification Store         ││   │  │  │ Health Monitor  ││ │
│  │  └─────────────────────────────┘│   │  │  │ Notification Svc││ │
│  └─────────────────────────────────┘   │  │  └─────────────────┘│ │
└─────────────────────────────────────────┴──┴─────────────────────┘
            │                                         │
            │              IPC/WebView                │
            ▼                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM INTEGRATION                           │
├─────────────────────────────────────────────────────────────────┤
│  System Tray    │  Native Notifications  │  File System        │
│  Menu Actions   │  MTA-Style Alerts       │  /etc/hosts         │
│  Quick Launch   │  Sound Effects          │  Config Files       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Frontend Architecture (React + TypeScript)

#### 2.2.1 Component Hierarchy

```
src/
├── components/
│   ├── layout/
│   │   ├── App.tsx                 # Main application shell
│   │   ├── NavigationBar.tsx       # NYC subway-style navigation
│   │   ├── SystemTray.tsx          # System tray integration
│   │   └── StatusBar.tsx           # Bottom status bar
│   │
│   ├── subway-map/
│   │   ├── SubwayMap.tsx           # Main routing visualization
│   │   ├── SubwayLine.tsx          # Individual route lines
│   │   ├── Station.tsx             # Port stations
│   │   ├── ConnectionPath.tsx      # Visual connections
│   │   └── MapControls.tsx         # Zoom, pan, filters
│   │
│   ├── characters/
│   │   ├── CharacterManager.tsx    # Character orchestration
│   │   ├── SubwayWorker.tsx        # Individual character component
│   │   ├── CharacterDialogue.tsx   # Speech bubbles
│   │   ├── WorkerAnimations.tsx    # CSS/JS animations
│   │   └── CharacterSprites.tsx    # Sprite management
│   │
│   ├── dashboard/
│   │   ├── ControlTower.tsx        # Main management interface
│   │   ├── StationBoard.tsx        # Service status display
│   │   ├── DispatchCenter.tsx      # Service controls
│   │   ├── LineStatus.tsx          # Health indicators
│   │   └── MetricsPanel.tsx        # Performance metrics
│   │
│   ├── port-management/
│   │   ├── PortList.tsx            # Available ports list
│   │   ├── PortCard.tsx            # Individual port display
│   │   ├── MappingForm.tsx         # Create/edit mappings
│   │   ├── ConflictResolver.tsx    # Handle port conflicts
│   │   └── QuickActions.tsx        # Common operations
│   │
│   ├── notifications/
│   │   ├── MTAAlert.tsx            # MTA-style notifications
│   │   ├── AnnouncementSystem.tsx  # Subway announcements
│   │   ├── ToastManager.tsx        # In-app notifications
│   │   └── SoundEffects.tsx        # Audio system
│   │
│   └── settings/
│       ├── PreferencesPanel.tsx    # User preferences
│       ├── ThemeSelector.tsx       # NYC color schemes
│       ├── CharacterSettings.tsx   # Enable/disable characters
│       └── AdvancedSettings.tsx    # Power user options
│
├── stores/                         # State management (Zustand/Redux)
│   ├── portStore.ts               # Port information state
│   ├── characterStore.ts          # Character system state
│   ├── configStore.ts             # Application configuration
│   ├── notificationStore.ts       # Notification queue
│   └── uiStore.ts                 # UI state (themes, panels)
│
├── services/                      # Business logic layer
│   ├── tauriApi.ts               # Tauri command wrappers
│   ├── characterEngine.ts        # Character behavior logic
│   ├── mapLayoutEngine.ts        # Subway map positioning
│   ├── healthMonitor.ts          # Port health analysis
│   └── soundSystem.ts            # Audio management
│
├── types/                        # TypeScript definitions
│   ├── Port.ts                   # Port-related types
│   ├── Character.ts              # Character system types
│   ├── SubwayMap.ts              # Map visualization types
│   └── Config.ts                 # Configuration types
│
├── assets/                       # Static assets
│   ├── characters/               # Character sprites
│   ├── icons/                    # NYC subway icons
│   ├── sounds/                   # Subway sounds/announcements
│   └── themes/                   # NYC color schemes
│
└── styles/                       # CSS/styling
    ├── global.css               # Global styles
    ├── nyc-theme.css            # NYC subway design tokens
    ├── components/              # Component-specific styles
    └── animations/              # Character/UI animations
```

#### 2.2.2 State Management Architecture

```typescript
// Port Store - Central port management
interface PortStore {
  ports: PortInfo[];
  mappings: SubdomainMapping[];
  activeServices: ServiceInfo[];

  // Actions
  scanPorts: () => Promise<void>;
  createMapping: (subdomain: string, port: number) => Promise<void>;
  removeMapping: (subdomain: string) => Promise<void>;
  updatePortHealth: (port: number, health: PortHealth) => void;
}

// Character Store - Character system state
interface CharacterStore {
  workers: SubwayWorker[];
  activeDialogue: string | null;
  animationQueue: Animation[];

  // Actions
  assignWorkerToPort: (workerId: string, port: number) => void;
  updateWorkerMood: (workerId: string, mood: WorkerMood) => void;
  triggerDialogue: (workerId: string, message: string) => void;
}

// UI Store - Interface state
interface UIStore {
  activePanel: PanelType;
  selectedPort: number | null;
  mapViewport: MapViewport;
  theme: NYCTheme;

  // Actions
  setActivePanel: (panel: PanelType) => void;
  selectPort: (port: number) => void;
  updateMapViewport: (viewport: MapViewport) => void;
}
```

### 2.3 Backend Architecture (Rust/Tauri)

#### 2.3.1 Module Structure

```
src-tauri/
├── src/
│   ├── main.rs                    # Tauri app entry point
│   ├── lib.rs                     # Library exports
│   │
│   ├── commands/                  # Tauri command handlers
│   │   ├── mod.rs
│   │   ├── port_commands.rs       # Port scanning/management
│   │   ├── config_commands.rs     # Configuration operations
│   │   ├── host_commands.rs       # Hosts file management
│   │   ├── character_commands.rs  # Character system API
│   │   └── system_commands.rs     # System integration
│   │
│   ├── services/                  # Business logic services
│   │   ├── mod.rs
│   │   ├── port_service.rs        # Enhanced port operations
│   │   ├── character_service.rs   # Character behavior engine
│   │   ├── health_service.rs      # Port health monitoring
│   │   ├── notification_service.rs # System notifications
│   │   └── config_service.rs      # Configuration management
│   │
│   ├── models/                    # Data structures
│   │   ├── mod.rs
│   │   ├── port.rs               # Port information models
│   │   ├── character.rs          # Character system models
│   │   ├── config.rs             # Configuration models
│   │   └── subway.rs             # Subway map models
│   │
│   ├── utils/                     # Utility functions
│   │   ├── mod.rs
│   │   ├── health_analyzer.rs    # Port health analysis
│   │   ├── character_ai.rs       # Character behavior logic
│   │   ├── system_integration.rs # OS-specific features
│   │   └── validation.rs         # Input validation
│   │
│   └── legacy/                    # Ported CLI modules
│       ├── mod.rs
│       ├── config.rs             # Original config.rs (adapted)
│       ├── hosts.rs              # Original hosts.rs (adapted)
│       ├── ports.rs              # Original ports.rs (enhanced)
│       ├── nginx.rs              # Original nginx.rs (adapted)
│       └── browser.rs            # Original browser.rs (enhanced)
│
├── Cargo.toml                     # Tauri dependencies
├── tauri.conf.json               # Tauri configuration
├── build.rs                      # Build script
└── icons/                        # Application icons
```

#### 2.3.2 Tauri Command API

```rust
// Port Management Commands
#[tauri::command]
async fn scan_active_ports() -> Result<Vec<PortInfo>, String>;

#[tauri::command]
async fn create_port_mapping(subdomain: String, port: u16) -> Result<(), String>;

#[tauri::command]
async fn remove_port_mapping(subdomain: String) -> Result<(), String>;

#[tauri::command]
async fn get_port_health(port: u16) -> Result<PortHealth, String>;

// Configuration Commands
#[tauri::command]
async fn load_config() -> Result<AppConfig, String>;

#[tauri::command]
async fn save_config(config: AppConfig) -> Result<(), String>;

#[tauri::command]
async fn reset_config() -> Result<(), String>;

// Character System Commands
#[tauri::command]
async fn get_active_characters() -> Result<Vec<SubwayWorker>, String>;

#[tauri::command]
async fn update_character_assignment(worker_id: String, port: Option<u16>) -> Result<(), String>;

#[tauri::command]
async fn trigger_character_reaction(port: u16, event: PortEvent) -> Result<String, String>;

// System Integration Commands
#[tauri::command]
async fn show_system_notification(title: String, body: String) -> Result<(), String>;

#[tauri::command]
async fn play_subway_sound(sound_type: SubwaySoundType) -> Result<(), String>;

#[tauri::command]
async fn open_external_url(url: String) -> Result<(), String>;
```

### 2.4 Data Flow Architecture

#### 2.4.1 Real-time Port Monitoring Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Port Scanner   │ -> │  Health Monitor │ -> │ Character Engine│
│  (Background)   │    │  (Analysis)     │    │  (Reactions)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Port Store    │    │   UI Updates    │    │  Notifications  │
│   (Frontend)    │    │  (Reactive)     │    │  (System/App)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 2.4.2 User Interaction Flow

```
User Action (UI) -> Frontend Handler -> Tauri Command -> Backend Service
                                                            │
Character Reaction <- Character Engine <- Health Analysis <- │
     │                      │                              │
     ▼                      ▼                              ▼
UI Animation         Dialogue System              System Integration
```

### 2.5 Component Communication Patterns

#### 2.5.1 Frontend Communication

```typescript
// Event-driven architecture using custom hooks
const usePortOperations = () => {
  const { ports, scanPorts, createMapping } = usePortStore();
  const { triggerCharacterReaction } = useCharacterStore();
  const { showNotification } = useNotificationStore();

  const handleCreateMapping = async (subdomain: string, port: number) => {
    try {
      await createMapping(subdomain, port);
      await triggerCharacterReaction(port, 'MAPPING_CREATED');
      showNotification('success', `${subdomain} mapped to port ${port}`);
    } catch (error) {
      showNotification('error', error.message);
    }
  };

  return { ports, scanPorts, handleCreateMapping };
};
```

#### 2.5.2 Backend Communication

```rust
// Service layer pattern with dependency injection
pub struct PortService {
    config_service: Arc<ConfigService>,
    character_service: Arc<CharacterService>,
    notification_service: Arc<NotificationService>,
}

impl PortService {
    pub async fn create_mapping(&self, subdomain: String, port: u16) -> Result<(), PortError> {
        // 1. Validate inputs
        self.validate_mapping(&subdomain, port)?;

        // 2. Update configuration
        self.config_service.add_mapping(subdomain.clone(), port).await?;

        // 3. Update hosts file
        hosts::add_entry(&format!("{}.localhost", subdomain), port)?;

        // 4. Trigger character reaction
        self.character_service.handle_port_event(port, PortEvent::MappingCreated).await?;

        // 5. Show notification
        self.notification_service.show_success(&format!("Mapped {} to port {}", subdomain, port)).await?;

        Ok(())
    }
}
```

### 2.6 Security Architecture

#### 2.6.1 Input Validation Layer

```rust
// Comprehensive input validation
pub fn validate_subdomain(subdomain: &str) -> Result<(), ValidationError> {
    if subdomain.is_empty() {
        return Err(ValidationError::EmptySubdomain);
    }

    if subdomain.len() > 63 {
        return Err(ValidationError::SubdomainTooLong);
    }

    if !subdomain.chars().all(|c| c.is_alphanumeric() || c == '-') {
        return Err(ValidationError::InvalidCharacters);
    }

    if subdomain.starts_with('-') || subdomain.ends_with('-') {
        return Err(ValidationError::InvalidFormat);
    }

    Ok(())
}

pub fn validate_port(port: u16) -> Result<(), ValidationError> {
    if port == 0 {
        return Err(ValidationError::InvalidPort("Port cannot be 0".into()));
    }

    if port < 1024 {
        return Err(ValidationError::PrivilegedPort);
    }

    Ok(())
}
```

#### 2.6.2 Safe File Operations

```rust
// Atomic hosts file operations with rollback
pub async fn safe_hosts_update<F>(operation: F) -> Result<(), HostsError>
where
    F: FnOnce(&mut String) -> Result<(), HostsError>,
{
    let hosts_path = get_hosts_path();

    // 1. Create backup
    let backup_path = create_backup(&hosts_path).await?;

    // 2. Perform operation
    match perform_hosts_operation(operation).await {
        Ok(_) => {
            // 3. Cleanup backup on success
            cleanup_backup(&backup_path).await?;
            Ok(())
        }
        Err(e) => {
            // 4. Restore from backup on failure
            restore_backup(&backup_path, &hosts_path).await?;
            Err(e)
        }
    }
}
```

### 2.7 Performance Architecture

#### 2.7.1 Efficient Port Monitoring

```rust
// Background monitoring with smart polling
pub struct PortMonitor {
    scan_interval: Duration,
    last_scan: Instant,
    cached_ports: Arc<RwLock<Vec<PortInfo>>>,
    event_sender: mpsc::Sender<PortEvent>,
}

impl PortMonitor {
    pub async fn start_monitoring(&self) {
        let mut interval = tokio::time::interval(self.scan_interval);

        loop {
            interval.tick().await;

            if let Ok(current_ports) = self.scan_ports().await {
                let previous_ports = self.cached_ports.read().await.clone();

                // Smart diff to detect changes
                let changes = self.detect_changes(&previous_ports, &current_ports);

                // Update cache
                *self.cached_ports.write().await = current_ports;

                // Emit events for changes only
                for change in changes {
                    let _ = self.event_sender.send(change).await;
                }
            }
        }
    }
}
```

#### 2.7.2 Frontend Performance Optimizations

```typescript
// Virtualized subway map for large port counts
const SubwayMapVirtualized: React.FC = () => {
  const { ports } = usePortStore();
  const [viewportBounds, setViewportBounds] = useState<Bounds>();

  // Only render visible stations
  const visibleStations = useMemo(() => {
    if (!viewportBounds) return ports;

    return ports.filter(port =>
      isWithinBounds(port.position, viewportBounds)
    );
  }, [ports, viewportBounds]);

  return (
    <VirtualizedContainer onViewportChange={setViewportBounds}>
      {visibleStations.map(port => (
        <Station key={port.port} portInfo={port} />
      ))}
    </VirtualizedContainer>
  );
};
```

### 2.8 Testing Architecture

#### 2.8.1 Testing Strategy

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Unit Tests    │  │Integration Tests│  │     E2E Tests   │
│                 │  │                 │  │                 │
│ • Pure functions│  │ • API endpoints │  │ • User workflows│
│ • Components    │  │ • Service layer │  │ • Cross-platform│
│ • Utils/helpers │  │ • File operations│  │ • Performance   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

#### 2.8.2 Test Structure

```
tests/
├── unit/
│   ├── frontend/
│   │   ├── components/
│   │   ├── stores/
│   │   └── services/
│   │
│   └── backend/
│       ├── commands/
│       ├── services/
│       └── utils/
│
├── integration/
│   ├── api_tests.rs
│   ├── file_operations_tests.rs
│   └── character_system_tests.rs
│
└── e2e/
    ├── port_management.spec.ts
    ├── character_interactions.spec.ts
    └── system_integration.spec.ts
```

---

**Phase 2 Status**: ✅ COMPLETE
**Quality Gate**: Architecture comprehensively designed with clear component structure
**Next Phase**: Technology Stack Selection