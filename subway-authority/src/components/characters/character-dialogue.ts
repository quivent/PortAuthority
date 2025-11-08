/**
 * Character Dialogue System
 * Contextual messages for NYC Subway Authority characters
 */

import {
  CharacterType,
  CharacterMood,
  CharacterContext,
  DialogueEntry,
  DialogueTrigger,
  PortHealth,
  PortStatus,
} from '../../types/character-types';

// ==================== Dialogue Triggers ====================

/**
 * Create trigger for healthy port conditions
 */
const createHealthyTrigger = (weight: number = 1): DialogueTrigger => ({
  condition: (context: CharacterContext) =>
    context.portHealth === PortHealth.HEALTHY &&
    context.portStatus === PortStatus.ACTIVE,
  weight,
});

/**
 * Create trigger for warning conditions
 */
const createWarningTrigger = (weight: number = 1): DialogueTrigger => ({
  condition: (context: CharacterContext) =>
    context.portHealth === PortHealth.WARNING ||
    (context.serviceHealth?.responseTime ?? 0) > 1000,
  weight,
});

/**
 * Create trigger for critical conditions
 */
const createCriticalTrigger = (weight: number = 1): DialogueTrigger => ({
  condition: (context: CharacterContext) =>
    context.portHealth === PortHealth.CRITICAL ||
    context.portStatus === PortStatus.ERROR,
  weight,
});

/**
 * Create trigger for routing issues
 */
const createRoutingTrigger = (weight: number = 1): DialogueTrigger => ({
  condition: (context: CharacterContext) => !context.routingWorking,
  weight,
});

/**
 * Create trigger for configuration issues
 */
const createConfigTrigger = (weight: number = 1): DialogueTrigger => ({
  condition: (context: CharacterContext) => !context.configValid,
  weight,
});

/**
 * Create trigger for conflicts
 */
const createConflictTrigger = (weight: number = 1): DialogueTrigger => ({
  condition: (context: CharacterContext) => context.hasConflicts,
  weight,
});

/**
 * Create trigger for security issues
 */
const createSecurityTrigger = (weight: number = 1): DialogueTrigger => ({
  condition: (context: CharacterContext) => context.hasVulnerabilities,
  weight,
});

// ==================== Transit Conductor Dialogue ====================

const TRANSIT_CONDUCTOR_DIALOGUE: Record<CharacterMood, DialogueEntry[]> = {
  [CharacterMood.HAPPY]: [
    {
      text: "All trains running on time! Traffic's flowing smooth.",
      mood: CharacterMood.HAPPY,
      duration: 3000,
      trigger: createHealthyTrigger(2),
    },
    {
      text: "Port routing is crystal clear - no delays!",
      mood: CharacterMood.HAPPY,
      duration: 3000,
      trigger: createHealthyTrigger(1),
    },
    {
      text: "This is what peak performance looks like!",
      mood: CharacterMood.HAPPY,
      duration: 3000,
      trigger: createHealthyTrigger(1),
    },
    {
      text: "Express service to your destination!",
      mood: CharacterMood.HAPPY,
      duration: 2500,
    },
  ],
  [CharacterMood.CONTENT]: [
    {
      text: "Normal service - all good here.",
      mood: CharacterMood.CONTENT,
      duration: 2500,
    },
    {
      text: "Steady as she goes.",
      mood: CharacterMood.CONTENT,
      duration: 2000,
    },
  ],
  [CharacterMood.NEUTRAL]: [
    {
      text: "Monitoring port traffic...",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
    {
      text: "Waiting for the next connection.",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
  ],
  [CharacterMood.CONCERNED]: [
    {
      text: "We've got some minor delays here...",
      mood: CharacterMood.CONCERNED,
      duration: 3000,
      trigger: createWarningTrigger(1),
    },
    {
      text: "Traffic's getting backed up.",
      mood: CharacterMood.CONCERNED,
      duration: 2500,
      trigger: createWarningTrigger(1),
    },
  ],
  [CharacterMood.FRUSTRATED]: [
    {
      text: "Major routing issues! Ports are blocked!",
      mood: CharacterMood.FRUSTRATED,
      duration: 3500,
      trigger: createRoutingTrigger(2),
    },
    {
      text: "We're experiencing significant delays...",
      mood: CharacterMood.FRUSTRATED,
      duration: 3000,
      trigger: createCriticalTrigger(1),
    },
    {
      text: "This port is not responding!",
      mood: CharacterMood.FRUSTRATED,
      duration: 2500,
    },
  ],
  [CharacterMood.ANGRY]: [
    {
      text: "Complete service disruption! This is unacceptable!",
      mood: CharacterMood.ANGRY,
      duration: 4000,
      trigger: createCriticalTrigger(2),
    },
    {
      text: "ALL TRAINS STOPPED. Need immediate attention!",
      mood: CharacterMood.ANGRY,
      duration: 3500,
    },
  ],
};

// ==================== Station Master Dialogue ====================

const STATION_MASTER_DIALOGUE: Record<CharacterMood, DialogueEntry[]> = {
  [CharacterMood.HAPPY]: [
    {
      text: "Configuration is pristine! Everything's organized.",
      mood: CharacterMood.HAPPY,
      duration: 3500,
      trigger: createHealthyTrigger(2),
    },
    {
      text: "All subdomains properly mapped. Beautiful!",
      mood: CharacterMood.HAPPY,
      duration: 3000,
    },
    {
      text: "This station is running like clockwork!",
      mood: CharacterMood.HAPPY,
      duration: 2500,
    },
  ],
  [CharacterMood.CONTENT]: [
    {
      text: "Station operations are stable.",
      mood: CharacterMood.CONTENT,
      duration: 2500,
    },
    {
      text: "Configuration looks good.",
      mood: CharacterMood.CONTENT,
      duration: 2000,
    },
  ],
  [CharacterMood.NEUTRAL]: [
    {
      text: "Checking the station manifest...",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
    {
      text: "Reviewing port configurations.",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
  ],
  [CharacterMood.CONCERNED]: [
    {
      text: "I'm seeing some configuration inconsistencies...",
      mood: CharacterMood.CONCERNED,
      duration: 3000,
      trigger: createConfigTrigger(1),
    },
    {
      text: "These mappings don't look right.",
      mood: CharacterMood.CONCERNED,
      duration: 2500,
    },
  ],
  [CharacterMood.FRUSTRATED]: [
    {
      text: "Configuration is a mess! Multiple conflicts detected!",
      mood: CharacterMood.FRUSTRATED,
      duration: 3500,
      trigger: createConflictTrigger(2),
    },
    {
      text: "Who organized this? This needs immediate cleanup!",
      mood: CharacterMood.FRUSTRATED,
      duration: 3000,
    },
  ],
  [CharacterMood.ANGRY]: [
    {
      text: "CRITICAL CONFIG ERROR! Station is compromised!",
      mood: CharacterMood.ANGRY,
      duration: 4000,
      trigger: createConfigTrigger(2),
    },
    {
      text: "This configuration is completely broken!",
      mood: CharacterMood.ANGRY,
      duration: 3000,
    },
  ],
};

// ==================== Maintenance Crew Dialogue ====================

const MAINTENANCE_CREW_DIALOGUE: Record<CharacterMood, DialogueEntry[]> = {
  [CharacterMood.HAPPY]: [
    {
      text: "All systems operational! Services are healthy.",
      mood: CharacterMood.HAPPY,
      duration: 3000,
      trigger: createHealthyTrigger(2),
    },
    {
      text: "No maintenance needed - everything's running smooth!",
      mood: CharacterMood.HAPPY,
      duration: 3500,
    },
    {
      text: "Uptime is perfect! Great job!",
      mood: CharacterMood.HAPPY,
      duration: 2500,
    },
  ],
  [CharacterMood.CONTENT]: [
    {
      text: "Services are running normally.",
      mood: CharacterMood.CONTENT,
      duration: 2500,
    },
    {
      text: "All systems operational.",
      mood: CharacterMood.CONTENT,
      duration: 2000,
    },
  ],
  [CharacterMood.NEUTRAL]: [
    {
      text: "Performing routine health checks...",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
    {
      text: "Monitoring service status.",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
  ],
  [CharacterMood.CONCERNED]: [
    {
      text: "Services are showing some wear... might need attention.",
      mood: CharacterMood.CONCERNED,
      duration: 3500,
      trigger: createWarningTrigger(1),
    },
    {
      text: "Response times are degrading.",
      mood: CharacterMood.CONCERNED,
      duration: 2500,
    },
  ],
  [CharacterMood.FRUSTRATED]: [
    {
      text: "Multiple services down! Need urgent maintenance!",
      mood: CharacterMood.FRUSTRATED,
      duration: 3500,
      trigger: createCriticalTrigger(2),
    },
    {
      text: "This service is falling apart!",
      mood: CharacterMood.FRUSTRATED,
      duration: 2500,
    },
  ],
  [CharacterMood.ANGRY]: [
    {
      text: "TOTAL SYSTEM FAILURE! Everything's down!",
      mood: CharacterMood.ANGRY,
      duration: 4000,
      trigger: createCriticalTrigger(3),
    },
    {
      text: "Critical failure! Services are NOT responding!",
      mood: CharacterMood.ANGRY,
      duration: 3500,
    },
  ],
};

// ==================== Track Inspector Dialogue ====================

const TRACK_INSPECTOR_DIALOGUE: Record<CharacterMood, DialogueEntry[]> = {
  [CharacterMood.HAPPY]: [
    {
      text: "All ports are secure! No vulnerabilities detected.",
      mood: CharacterMood.HAPPY,
      duration: 3500,
      trigger: createHealthyTrigger(2),
    },
    {
      text: "Security clearance: GREEN. All tracks are safe!",
      mood: CharacterMood.HAPPY,
      duration: 3000,
    },
    {
      text: "Perfect security posture!",
      mood: CharacterMood.HAPPY,
      duration: 2500,
    },
  ],
  [CharacterMood.CONTENT]: [
    {
      text: "Security status: normal.",
      mood: CharacterMood.CONTENT,
      duration: 2000,
    },
    {
      text: "No immediate threats detected.",
      mood: CharacterMood.CONTENT,
      duration: 2500,
    },
  ],
  [CharacterMood.NEUTRAL]: [
    {
      text: "Conducting security inspection...",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
    {
      text: "Scanning for vulnerabilities.",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
  ],
  [CharacterMood.CONCERNED]: [
    {
      text: "Found some potential security issues...",
      mood: CharacterMood.CONCERNED,
      duration: 3000,
      trigger: createSecurityTrigger(1),
    },
    {
      text: "These ports might be vulnerable.",
      mood: CharacterMood.CONCERNED,
      duration: 2500,
    },
  ],
  [CharacterMood.FRUSTRATED]: [
    {
      text: "SECURITY BREACH! Multiple vulnerabilities found!",
      mood: CharacterMood.FRUSTRATED,
      duration: 3500,
      trigger: createSecurityTrigger(2),
    },
    {
      text: "This is a serious security risk!",
      mood: CharacterMood.FRUSTRATED,
      duration: 3000,
    },
  ],
  [CharacterMood.ANGRY]: [
    {
      text: "CRITICAL SECURITY ALERT! Immediate action required!",
      mood: CharacterMood.ANGRY,
      duration: 4000,
      trigger: createSecurityTrigger(3),
    },
    {
      text: "This port is completely exposed!",
      mood: CharacterMood.ANGRY,
      duration: 3000,
    },
  ],
};

// ==================== Dispatcher Dialogue ====================

const DISPATCHER_DIALOGUE: Record<CharacterMood, DialogueEntry[]> = {
  [CharacterMood.HAPPY]: [
    {
      text: "All routes optimized! Routing table is perfect!",
      mood: CharacterMood.HAPPY,
      duration: 3500,
      trigger: createHealthyTrigger(2),
    },
    {
      text: "Connections are lightning fast!",
      mood: CharacterMood.HAPPY,
      duration: 2500,
    },
    {
      text: "Dispatch efficiency: 100%!",
      mood: CharacterMood.HAPPY,
      duration: 2500,
    },
  ],
  [CharacterMood.CONTENT]: [
    {
      text: "Routing operations are stable.",
      mood: CharacterMood.CONTENT,
      duration: 2500,
    },
    {
      text: "All connections functioning.",
      mood: CharacterMood.CONTENT,
      duration: 2000,
    },
  ],
  [CharacterMood.NEUTRAL]: [
    {
      text: "Monitoring routing tables...",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
    {
      text: "Checking connection status.",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
  ],
  [CharacterMood.CONCERNED]: [
    {
      text: "Routing is getting complicated...",
      mood: CharacterMood.CONCERNED,
      duration: 3000,
      trigger: createWarningTrigger(1),
    },
    {
      text: "Some routes are taking too long.",
      mood: CharacterMood.CONCERNED,
      duration: 2500,
    },
  ],
  [CharacterMood.FRUSTRATED]: [
    {
      text: "ROUTING FAILURE! Can't establish connections!",
      mood: CharacterMood.FRUSTRATED,
      duration: 3500,
      trigger: createRoutingTrigger(2),
    },
    {
      text: "Routes are completely broken!",
      mood: CharacterMood.FRUSTRATED,
      duration: 2500,
    },
  ],
  [CharacterMood.ANGRY]: [
    {
      text: "COMPLETE ROUTING BREAKDOWN! Nothing's connecting!",
      mood: CharacterMood.ANGRY,
      duration: 4000,
      trigger: createRoutingTrigger(3),
    },
    {
      text: "All dispatch operations have failed!",
      mood: CharacterMood.ANGRY,
      duration: 3000,
    },
  ],
};

// ==================== Platform Manager Dialogue ====================

const PLATFORM_MANAGER_DIALOGUE: Record<CharacterMood, DialogueEntry[]> = {
  [CharacterMood.HAPPY]: [
    {
      text: "Platform operations are perfectly organized!",
      mood: CharacterMood.HAPPY,
      duration: 3500,
      trigger: createHealthyTrigger(2),
    },
    {
      text: "All ports properly allocated. Excellent!",
      mood: CharacterMood.HAPPY,
      duration: 3000,
    },
    {
      text: "This is management excellence!",
      mood: CharacterMood.HAPPY,
      duration: 2500,
    },
  ],
  [CharacterMood.CONTENT]: [
    {
      text: "Platform management is stable.",
      mood: CharacterMood.CONTENT,
      duration: 2500,
    },
    {
      text: "Operations are running smoothly.",
      mood: CharacterMood.CONTENT,
      duration: 2000,
    },
  ],
  [CharacterMood.NEUTRAL]: [
    {
      text: "Overseeing platform operations...",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
    {
      text: "Monitoring port allocations.",
      mood: CharacterMood.NEUTRAL,
      duration: 2500,
    },
  ],
  [CharacterMood.CONCERNED]: [
    {
      text: "Platform organization needs improvement...",
      mood: CharacterMood.CONCERNED,
      duration: 3000,
    },
    {
      text: "We're getting a bit disorganized here.",
      mood: CharacterMood.CONCERNED,
      duration: 2500,
    },
  ],
  [CharacterMood.FRUSTRATED]: [
    {
      text: "Platform chaos! Too many conflicts!",
      mood: CharacterMood.FRUSTRATED,
      duration: 3500,
      trigger: createConflictTrigger(2),
    },
    {
      text: "This is complete disorganization!",
      mood: CharacterMood.FRUSTRATED,
      duration: 2500,
    },
  ],
  [CharacterMood.ANGRY]: [
    {
      text: "TOTAL PLATFORM BREAKDOWN! This is chaos!",
      mood: CharacterMood.ANGRY,
      duration: 4000,
      trigger: createConflictTrigger(3),
    },
    {
      text: "Everything is out of control!",
      mood: CharacterMood.ANGRY,
      duration: 3000,
    },
  ],
};

// ==================== Dialogue Map ====================

/**
 * Complete dialogue mapping for all character types
 */
export const CHARACTER_DIALOGUES: Record<
  CharacterType,
  Record<CharacterMood, DialogueEntry[]>
> = {
  [CharacterType.TRANSIT_CONDUCTOR]: TRANSIT_CONDUCTOR_DIALOGUE,
  [CharacterType.STATION_MASTER]: STATION_MASTER_DIALOGUE,
  [CharacterType.MAINTENANCE_CREW]: MAINTENANCE_CREW_DIALOGUE,
  [CharacterType.TRACK_INSPECTOR]: TRACK_INSPECTOR_DIALOGUE,
  [CharacterType.DISPATCHER]: DISPATCHER_DIALOGUE,
  [CharacterType.PLATFORM_MANAGER]: PLATFORM_MANAGER_DIALOGUE,
};

// ==================== Dialogue Selection Logic ====================

/**
 * Select appropriate dialogue based on character context
 */
export function selectDialogue(
  characterType: CharacterType,
  mood: CharacterMood,
  context: CharacterContext
): DialogueEntry {
  const dialogues = CHARACTER_DIALOGUES[characterType][mood];

  // Filter dialogues that match current context
  const matchingDialogues = dialogues.filter((dialogue) => {
    if (!dialogue.trigger) return true;
    return dialogue.trigger.condition(context);
  });

  if (matchingDialogues.length === 0) {
    // Fallback to any dialogue for this mood
    return dialogues[Math.floor(Math.random() * dialogues.length)];
  }

  // Sort by weight and pick the highest weighted matching dialogue
  const sortedDialogues = matchingDialogues.sort(
    (a, b) => (b.trigger?.weight ?? 0) - (a.trigger?.weight ?? 0)
  );

  // Add some randomness - pick from top 3 weighted dialogues
  const topDialogues = sortedDialogues.slice(0, Math.min(3, sortedDialogues.length));
  return topDialogues[Math.floor(Math.random() * topDialogues.length)];
}

/**
 * Get random dialogue for a character type and mood (no context)
 */
export function getRandomDialogue(
  characterType: CharacterType,
  mood: CharacterMood
): DialogueEntry {
  const dialogues = CHARACTER_DIALOGUES[characterType][mood];
  return dialogues[Math.floor(Math.random() * dialogues.length)];
}

/**
 * Get all dialogues for a character type
 */
export function getCharacterDialogues(
  characterType: CharacterType
): Record<CharacterMood, DialogueEntry[]> {
  return CHARACTER_DIALOGUES[characterType];
}

/**
 * Get dialogue preview text for testing
 */
export function getDialoguePreview(characterType: CharacterType): string[] {
  const allDialogues = CHARACTER_DIALOGUES[characterType];
  return Object.values(CharacterMood).map((mood) => {
    const dialogue = allDialogues[mood][0];
    return `[${mood.toUpperCase()}] ${dialogue.text}`;
  });
}
