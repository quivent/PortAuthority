/**
 * Character Store - Zustand State Management
 * Manages subway workers, animations, and dialogue
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  SubwayWorker,
  Dialogue,
  WorkerMood,
  WorkerAction,
  WorkerRole,
} from '../types/Character';
import { characterEventHandlers } from './middleware/events';

interface CharacterState {
  // State
  workers: SubwayWorker[];
  activeDialogue: Dialogue | null;
  dialogueQueue: Dialogue[];
  enableCharacters: boolean;
  soundEnabled: boolean;

  // Actions
  addWorker: (worker: SubwayWorker) => void;
  removeWorker: (workerId: string) => void;
  updateWorker: (workerId: string, updates: Partial<SubwayWorker>) => void;
  assignWorkerToPort: (workerId: string, port: number | undefined) => void;
  updateWorkerMood: (workerId: string, mood: WorkerMood) => void;
  updateWorkerAction: (workerId: string, action: WorkerAction) => void;
  triggerDialogue: (dialogue: Dialogue) => void;
  dismissDialogue: () => void;
  clearDialogueQueue: () => void;
  toggleCharacters: () => void;
  toggleSound: () => void;
  initializeWorkers: () => void;
  handlePortEvent: (port: number, eventType: string) => void;
}

// Base store configuration
const storeConfig = (set: any, get: any): CharacterState => ({
  // Initial state
  workers: [],
  activeDialogue: null,
  dialogueQueue: [],
  enableCharacters: true,
  soundEnabled: true,

      // Mutations
      addWorker: (worker) =>
        set(
          (state) => ({
            workers: [...state.workers, worker],
          }),
          false,
          'addWorker'
        ),

      removeWorker: (workerId) =>
        set(
          (state) => ({
            workers: state.workers.filter((w) => w.id !== workerId),
          }),
          false,
          'removeWorker'
        ),

      updateWorker: (workerId, updates) =>
        set(
          (state) => ({
            workers: state.workers.map((w) =>
              w.id === workerId ? { ...w, ...updates } : w
            ),
          }),
          false,
          'updateWorker'
        ),

      assignWorkerToPort: (workerId, port) =>
        set(
          (state) => ({
            workers: state.workers.map((w) =>
              w.id === workerId ? { ...w, assignedPort: port } : w
            ),
          }),
          false,
          'assignWorkerToPort'
        ),

      updateWorkerMood: (workerId, mood) =>
        set(
          (state) => ({
            workers: state.workers.map((w) =>
              w.id === workerId ? { ...w, mood } : w
            ),
          }),
          false,
          'updateWorkerMood'
        ),

      updateWorkerAction: (workerId, action) =>
        set(
          (state) => ({
            workers: state.workers.map((w) =>
              w.id === workerId ? { ...w, currentAction: action } : w
            ),
          }),
          false,
          'updateWorkerAction'
        ),

      triggerDialogue: (dialogue) =>
        set(
          (state) => {
            if (!state.activeDialogue) {
              return { activeDialogue: dialogue };
            }
            return {
              dialogueQueue: [...state.dialogueQueue, dialogue],
            };
          },
          false,
          'triggerDialogue'
        ),

      dismissDialogue: () =>
        set(
          (state) => {
            const nextDialogue = state.dialogueQueue[0];
            return {
              activeDialogue: nextDialogue || null,
              dialogueQueue: state.dialogueQueue.slice(1),
            };
          },
          false,
          'dismissDialogue'
        ),

      clearDialogueQueue: () =>
        set(
          { dialogueQueue: [], activeDialogue: null },
          false,
          'clearDialogueQueue'
        ),

      toggleCharacters: () =>
        set(
          (state) => ({
            enableCharacters: !state.enableCharacters,
          }),
          false,
          'toggleCharacters'
        ),

      toggleSound: () =>
        set(
          (state) => ({
            soundEnabled: !state.soundEnabled,
          }),
          false,
          'toggleSound'
        ),

      initializeWorkers: () => {
        const defaultWorkers: SubwayWorker[] = [
          {
            id: 'conductor-1',
            name: 'Tony',
            role: WorkerRole.Conductor,
            position: { x: 100, y: 100 },
            mood: WorkerMood.Happy,
            currentAction: WorkerAction.Idle,
            dialogueQueue: [],
            personality: {
              enthusiasm: 85,
              patience: 70,
              chattiness: 90,
              professionalism: 80,
              quirks: ['Always announces stops enthusiastically', 'Loves coffee'],
            },
            spriteVariant: 'conductor-blue-uniform',
          },
          {
            id: 'station-master-1',
            name: 'Maria',
            role: WorkerRole.StationMaster,
            position: { x: 300, y: 150 },
            mood: WorkerMood.Working,
            currentAction: WorkerAction.Monitoring,
            dialogueQueue: [],
            personality: {
              enthusiasm: 75,
              patience: 90,
              chattiness: 60,
              professionalism: 95,
              quirks: ['Always has a clipboard', 'Meticulous about schedules'],
            },
            spriteVariant: 'station-master-vest',
          },
          {
            id: 'maintenance-1',
            name: 'Carlos',
            role: WorkerRole.MaintenanceCrew,
            position: { x: 500, y: 200 },
            mood: WorkerMood.Working,
            currentAction: WorkerAction.Inspecting,
            dialogueQueue: [],
            personality: {
              enthusiasm: 65,
              patience: 85,
              chattiness: 50,
              professionalism: 88,
              quirks: ['Always has tools ready', 'Prefers night shifts'],
            },
            spriteVariant: 'maintenance-orange-vest',
          },
        ];

        set({ workers: defaultWorkers }, false, 'initializeWorkers');
      },

      handlePortEvent: (port, eventType) => {
        const { workers, triggerDialogue } = get();

        // Find available worker or use first one
        const worker = workers[Math.floor(Math.random() * workers.length)];
        if (!worker) return;

        // Generate dialogue based on event type
        const templates: Record<string, string[]> = {
          port_opened: [
            `Port ${port} is now in service!`,
            `All aboard at port ${port}!`,
            `New service starting on port ${port}!`,
          ],
          port_closed: [
            `Service ended on port ${port}.`,
            `Port ${port} is now closed.`,
            `That's all for port ${port} today.`,
          ],
          mapping_created: [
            `New route established to port ${port}!`,
            `Connection added at port ${port}!`,
            `Express service to port ${port} is ready!`,
          ],
          health_warning: [
            `Experiencing delays on port ${port}...`,
            `Port ${port} needs attention.`,
            `Service issues detected on port ${port}.`,
          ],
        };

        const messageTemplates = templates[eventType] || templates.port_opened;
        const message =
          messageTemplates[Math.floor(Math.random() * messageTemplates.length)];

        const dialogue: Dialogue = {
          id: `${worker.id}-${Date.now()}`,
          workerId: worker.id,
          message,
          duration: 3000,
          priority: 1,
          timestamp: new Date(),
          portContext: port,
        };

        triggerDialogue(dialogue);

        // Update worker mood based on event
        if (eventType === 'port_opened') {
          get().updateWorkerMood(worker.id, WorkerMood.Celebrating);
          setTimeout(() => {
            get().updateWorkerMood(worker.id, WorkerMood.Happy);
          }, 3000);
        } else if (eventType === 'health_warning') {
          get().updateWorkerMood(worker.id, WorkerMood.Frustrated);
        }
      },
});

// Create store with devtools
export const useCharacterStore = create<CharacterState>()(
  devtools(storeConfig, { name: 'CharacterStore' })
);

// Initialize event listeners
if (typeof window !== 'undefined') {
  import('@tauri-apps/api/event').then(({ listen }) => {
    characterEventHandlers.forEach(({ event, handler }) => {
      listen(event, (tauriEvent) => {
        try {
          const currentState = useCharacterStore.getState();
          const stateUpdate = handler(currentState, tauriEvent.payload);

          if (stateUpdate !== null) {
            useCharacterStore.setState(stateUpdate as any);
          }
        } catch (error) {
          console.error(`Error handling event ${event}:`, error);
        }
      }).catch((error) => {
        console.error(`Failed to listen to event ${event}:`, error);
      });
    });
  }).catch((error) => {
    console.warn('Tauri event system not available:', error);
  });

  // Initialize persistence
  const STORAGE_KEY = 'subway-authority-character-store-v1';

  // Load persisted state
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      useCharacterStore.setState({
        workers: parsed.workers || [],
        enableCharacters: parsed.enableCharacters !== undefined ? parsed.enableCharacters : true,
        soundEnabled: parsed.soundEnabled !== undefined ? parsed.soundEnabled : true,
      }, true);
    }
  } catch (error) {
    console.error('Failed to load persisted character state:', error);
  }

  // Subscribe to state changes for persistence
  useCharacterStore.subscribe((state) => {
    try {
      const toSave = {
        workers: state.workers,
        enableCharacters: state.enableCharacters,
        soundEnabled: state.soundEnabled,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to persist character state:', error);
    }
  });
}

// Selectors
export const selectWorkersByRole = (state: CharacterState, role: WorkerRole) =>
  state.workers.filter((w) => w.role === role);

export const selectWorkerByPort = (state: CharacterState, port: number) =>
  state.workers.find((w) => w.assignedPort === port);

export const selectActiveWorkers = (state: CharacterState) =>
  state.workers.filter(
    (w) => w.currentAction !== WorkerAction.Idle && w.currentAction !== ('sleeping' as any)
  );
