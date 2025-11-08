/**
 * Character Test Data Factories
 * Factory functions for creating test data
 */

import {
  SubwayWorker,
  Dialogue,
  WorkerRole,
  WorkerMood,
  WorkerAction,
} from '@/types/Character';

let workerIdCounter = 0;
let dialogueIdCounter = 0;

/**
 * Create a test worker with default values
 */
export const createTestWorker = (
  overrides?: Partial<SubwayWorker>
): SubwayWorker => ({
  id: `test-worker-${++workerIdCounter}`,
  name: 'Test Worker',
  role: WorkerRole.Conductor,
  position: { x: 100, y: 100 },
  mood: WorkerMood.Neutral,
  currentAction: WorkerAction.Idle,
  dialogueQueue: [],
  personality: {
    enthusiasm: 80,
    patience: 70,
    chattiness: 90,
    professionalism: 85,
    quirks: ['Loves coffee'],
  },
  spriteVariant: 'conductor-blue-uniform',
  ...overrides,
});

/**
 * Create a test conductor
 */
export const createTestConductor = (
  overrides?: Partial<SubwayWorker>
): SubwayWorker =>
  createTestWorker({
    name: 'Tony',
    role: WorkerRole.Conductor,
    spriteVariant: 'conductor-blue-uniform',
    personality: {
      enthusiasm: 85,
      patience: 70,
      chattiness: 90,
      professionalism: 80,
      quirks: ['Always announces stops enthusiastically', 'Loves coffee'],
    },
    ...overrides,
  });

/**
 * Create a test station master
 */
export const createTestStationMaster = (
  overrides?: Partial<SubwayWorker>
): SubwayWorker =>
  createTestWorker({
    name: 'Maria',
    role: WorkerRole.StationMaster,
    spriteVariant: 'station-master-vest',
    mood: WorkerMood.Working,
    currentAction: WorkerAction.Monitoring,
    personality: {
      enthusiasm: 75,
      patience: 90,
      chattiness: 60,
      professionalism: 95,
      quirks: ['Always has a clipboard', 'Meticulous about schedules'],
    },
    ...overrides,
  });

/**
 * Create a test maintenance crew member
 */
export const createTestMaintenanceCrew = (
  overrides?: Partial<SubwayWorker>
): SubwayWorker =>
  createTestWorker({
    name: 'Carlos',
    role: WorkerRole.MaintenanceCrew,
    spriteVariant: 'maintenance-orange-vest',
    mood: WorkerMood.Working,
    currentAction: WorkerAction.Inspecting,
    personality: {
      enthusiasm: 65,
      patience: 85,
      chattiness: 50,
      professionalism: 88,
      quirks: ['Always has tools ready', 'Prefers night shifts'],
    },
    ...overrides,
  });

/**
 * Create test dialogue
 */
export const createTestDialogue = (overrides?: Partial<Dialogue>): Dialogue => ({
  id: `test-dialogue-${++dialogueIdCounter}`,
  workerId: 'test-worker-1',
  message: 'Test message',
  duration: 3000,
  priority: 1,
  timestamp: new Date(),
  ...overrides,
});

/**
 * Create multiple test workers
 */
export const createTestWorkers = (count: number): SubwayWorker[] => {
  return Array.from({ length: count }, (_, index) =>
    createTestWorker({
      id: `test-worker-${index + 1}`,
      name: `Worker ${index + 1}`,
    })
  );
};

/**
 * Create a full worker crew (all roles)
 */
export const createTestCrew = (): SubwayWorker[] => [
  createTestConductor(),
  createTestStationMaster(),
  createTestMaintenanceCrew(),
  createTestWorker({ role: WorkerRole.TrackInspector, name: 'Inspector' }),
  createTestWorker({ role: WorkerRole.Dispatcher, name: 'Dispatcher' }),
  createTestWorker({ role: WorkerRole.PlatformManager, name: 'Manager' }),
];

/**
 * Reset factory counters (useful for test isolation)
 */
export const resetFactoryCounters = () => {
  workerIdCounter = 0;
  dialogueIdCounter = 0;
};
