/**
 * Character System Type Definitions
 * Animated subway workers with personality
 */

export interface SubwayWorker {
  id: string;
  name: string;
  role: WorkerRole;
  assignedPort?: number;
  position: { x: number; y: number };
  mood: WorkerMood;
  currentAction: WorkerAction;
  dialogueQueue: Dialogue[];
  personality: WorkerPersonality;
  spriteVariant: string;
}

export enum WorkerRole {
  Conductor = 'conductor',
  StationMaster = 'station_master',
  MaintenanceCrew = 'maintenance_crew',
  TrackWorker = 'track_worker',
  Dispatcher = 'dispatcher',
  TokenBooth = 'token_booth'
}

export enum WorkerMood {
  Happy = 'happy',
  Working = 'working',
  Frustrated = 'frustrated',
  Celebrating = 'celebrating',
  Sleeping = 'sleeping',
  Alert = 'alert',
  Confused = 'confused'
}

export enum WorkerAction {
  Idle = 'idle',
  Monitoring = 'monitoring',
  Repairing = 'repairing',
  Directing = 'directing',
  Announcing = 'announcing',
  Inspecting = 'inspecting',
  Celebrating = 'celebrating'
}

export interface Dialogue {
  id: string;
  workerId: string;
  message: string;
  duration: number;
  priority: number;
  timestamp: Date;
  portContext?: number;
}

export interface WorkerPersonality {
  enthusiasm: number; // 0-100
  patience: number; // 0-100
  chattiness: number; // 0-100
  professionalism: number; // 0-100
  quirks: string[];
}

export interface WorkerAnimation {
  workerId: string;
  animationType: AnimationType;
  duration: number;
  loop: boolean;
}

export enum AnimationType {
  Wave = 'wave',
  Jump = 'jump',
  ThumbsUp = 'thumbs_up',
  Shrug = 'shrug',
  PointAt = 'point_at',
  WorkOnTerminal = 'work_on_terminal',
  InspectWithClipboard = 'inspect_with_clipboard',
  WalkTo = 'walk_to',
  Sleep = 'sleep',
  WakeUp = 'wake_up'
}

// Character dialogue templates
export const DIALOGUE_TEMPLATES: Record<string, string[]> = {
  port_opened: [
    "New service on port {port}! All aboard!",
    "Port {port} is now accepting passengers!",
    "Stand clear of the closing doors, please! Port {port} is active!"
  ],
  port_closed: [
    "Service on port {port} has ended. Please use alternate routes.",
    "Port {port} is now out of service.",
    "This train is not in service. Port {port} closed."
  ],
  mapping_created: [
    "Express service to {subdomain} now available!",
    "Route to {subdomain} established. Mind the gap!",
    "New connection: {subdomain} at port {port}!"
  ],
  health_warning: [
    "Experiencing delays on port {port}.",
    "Reduced service on port {port}. Please be patient.",
    "Port {port} is running with delays due to service conditions."
  ],
  conflict_detected: [
    "Traffic on port {port}! Proceed with caution.",
    "Multiple services competing for port {port}!",
    "Port conflict detected. Dispatching maintenance crew..."
  ],
  all_healthy: [
    "All services running smoothly!",
    "Good service on all lines!",
    "System running like clockwork!"
  ]
};
