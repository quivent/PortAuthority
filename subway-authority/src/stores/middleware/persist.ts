/**
 * Persist Middleware for Zustand
 * Provides localStorage-based persistence with automatic serialization/deserialization
 */

import { StateCreator, StoreMutatorIdentifier } from 'zustand';

interface PersistOptions<T> {
  name: string;
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
  partialize?: (state: T) => Partial<T>;
  merge?: (persistedState: any, currentState: T) => T;
  skipHydration?: boolean;
}

type PersistApi<T> = {
  rehydrate: () => Promise<void>;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
};

type Write<T, U> = Omit<T, keyof U> & U;
type Cast<T, U> = T extends U ? T : U;

export type Persist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  config: StateCreator<T, [...Mps, ...Mcs], []>,
  options: PersistOptions<T>
) => StateCreator<T, Mps, [['zustand/persist', PersistApi<T>], ...Mcs]>;

/**
 * Custom serializer that handles Date objects and other special types
 */
const customSerializer = {
  serialize: (state: any): string => {
    return JSON.stringify(state, (key, value) => {
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      if (value instanceof Map) {
        return { __type: 'Map', value: Array.from(value.entries()) };
      }
      if (value instanceof Set) {
        return { __type: 'Set', value: Array.from(value) };
      }
      return value;
    });
  },
  deserialize: (str: string): any => {
    return JSON.parse(str, (key, value) => {
      if (value && typeof value === 'object') {
        if (value.__type === 'Date') {
          return new Date(value.value);
        }
        if (value.__type === 'Map') {
          return new Map(value.value);
        }
        if (value.__type === 'Set') {
          return new Set(value.value);
        }
      }
      return value;
    });
  },
};

/**
 * Default merge function that merges persisted state with current state
 */
const defaultMerge = <T>(persistedState: any, currentState: T): T => {
  return { ...currentState, ...persistedState };
};

/**
 * Persist middleware implementation
 */
export const persist: Persist =
  (config, options) => (set, get, api) => {
    const {
      name,
      version = 1,
      migrate,
      partialize = (state) => state,
      merge = defaultMerge,
      skipHydration = false,
    } = options;

    let hasHydrated = false;
    const storageKey = `subway-authority-${name}-v${version}`;

    // Storage operations
    const getStorage = (): any | null => {
      try {
        const item = localStorage.getItem(storageKey);
        if (!item) return null;
        return customSerializer.deserialize(item);
      } catch (error) {
        console.error(`Failed to load state from storage (${storageKey}):`, error);
        return null;
      }
    };

    const setStorage = (state: any): void => {
      try {
        const serialized = customSerializer.serialize(partialize(state));
        localStorage.setItem(storageKey, serialized);
      } catch (error) {
        console.error(`Failed to save state to storage (${storageKey}):`, error);
      }
    };

    const removeStorage = (): void => {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error(`Failed to remove state from storage (${storageKey}):`, error);
      }
    };

    // Hydration
    const rehydrate = async (): Promise<void> => {
      if (hasHydrated) return;

      try {
        const persistedState = getStorage();
        if (persistedState) {
          let stateToMerge = persistedState;

          // Run migration if needed
          if (migrate && persistedState.version !== version) {
            stateToMerge = migrate(persistedState, persistedState.version || 0);
          }

          // Merge persisted state with current state
          const currentState = get() as any;
          const mergedState = merge(stateToMerge, currentState);
          set(mergedState, true);
        }

        hasHydrated = true;
      } catch (error) {
        console.error(`Failed to rehydrate state (${storageKey}):`, error);
      }
    };

    // Initialize the store with the config
    const stateCreator = config(
      (update, replace, ...args) => {
        set(update, replace, ...args);
        // Persist after every state change
        setStorage(get());
      },
      get,
      api
    );

    // Add persist API methods
    (api as any).persist = {
      rehydrate,
      hasHydrated: () => hasHydrated,
      setHasHydrated: (value: boolean) => {
        hasHydrated = value;
      },
      clearStorage: removeStorage,
    };

    // Hydrate on initialization if not skipped
    if (!skipHydration) {
      rehydrate();
    }

    return stateCreator;
  };

/**
 * Hook to manually trigger rehydration
 */
export const useHydrate = (store: any) => {
  if (store.persist && !store.persist.hasHydrated()) {
    store.persist.rehydrate();
  }
};
