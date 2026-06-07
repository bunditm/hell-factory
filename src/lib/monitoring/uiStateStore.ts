/**
 * UI State Store for camera position and overlay panel state
 * Persists to localStorage per FR-M10 (docs/06-monitoring-requirements.md)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Versioned schema for future migrations
const STORAGE_VERSION = 1;
const STORAGE_KEY = 'hell-factory:monitoring:ui-state';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface PanelState {
  open: boolean;
}

export interface UiState {
  version: number;
  camera: CameraState;
  panel: PanelState;
}

const DEFAULT_CAMERA: CameraState = { x: 0, y: 0, zoom: 1 };
const DEFAULT_PANEL: PanelState = { open: false };

const DEFAULT_STATE: UiState = {
  version: STORAGE_VERSION,
  camera: DEFAULT_CAMERA,
  panel: DEFAULT_PANEL,
};

interface UiStore extends UiState {
  // Camera actions
  setCamera: (camera: Partial<CameraState>) => void;
  resetCamera: () => void;
  panCamera: (dx: number, dy: number) => void;
  setCameraZoom: (zoom: number) => void;

  // Panel actions
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;

  // Reset all
  resetAll: () => void;
}

/**
 * Safe localStorage wrapper that handles:
 * - Missing storage (SSR)
 * - Quota exceeded errors
 * - Malformed JSON
 */
function safeLocalStorage() {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  return {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch (err) {
        console.warn(`[uiStateStore] Failed to read localStorage key "${key}":`, err);
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        localStorage.setItem(key, value);
      } catch (err) {
        // Quota exceeded is common; log but don't crash
        if (err instanceof Error && err.name === 'QuotaExceededError') {
          console.warn(`[uiStateStore] localStorage quota exceeded for key "${key}" — state will not persist`);
        } else {
          console.warn(`[uiStateStore] Failed to write localStorage key "${key}":`, err);
        }
      }
    },
    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn(`[uiStateStore] Failed to remove localStorage key "${key}":`, err);
      }
    },
  };
}

/**
 * Custom storage adapter using our safe wrapper
 */
const customStorage = createJSONStorage(() => safeLocalStorage());

/**
 * Parse stored state safely, handling:
 * - Version mismatches
 * - Missing fields
 * - Malformed JSON
 */
function parseStoredState(stored: string | null): UiState | null {
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<UiState>;

    // Validate version
    if (typeof parsed.version !== 'number' || parsed.version < STORAGE_VERSION) {
      console.warn(
        `[uiStateStore] Stored state version ${parsed.version} < current ${STORAGE_VERSION}, discarding stale state`
      );
      return null;
    }

    // Validate and merge with defaults
    const validated: UiState = {
      version: STORAGE_VERSION,
      camera: {
        x: typeof parsed.camera?.x === 'number' ? parsed.camera.x : DEFAULT_CAMERA.x,
        y: typeof parsed.camera?.y === 'number' ? parsed.camera.y : DEFAULT_CAMERA.y,
        zoom: typeof parsed.camera?.zoom === 'number' ? parsed.camera.zoom : DEFAULT_CAMERA.zoom,
      },
      panel: {
        open: typeof parsed.panel?.open === 'boolean' ? parsed.panel.open : DEFAULT_PANEL.open,
      },
    };

    return validated;
  } catch (err) {
    console.warn('[uiStateStore] Failed to parse stored state, using defaults:', err);
    return null;
  }
}

/**
 * The UI state store with localStorage persistence
 * Note: Zustand persist middleware wraps the state in {state, version}
 */
const persistedUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      // Initial state (will be overridden by persisted state if valid)
      ...DEFAULT_STATE,

      setCamera: (cameraUpdate: Partial<CameraState>) => {
        set((state) => ({
          camera: { ...state.camera, ...cameraUpdate },
        }));
      },

      resetCamera: () => {
        set({ camera: { ...DEFAULT_CAMERA } });
      },

      panCamera: (dx: number, dy: number) => {
        set((state) => ({
          camera: {
            x: state.camera.x + dx,
            y: state.camera.y + dy,
            zoom: state.camera.zoom,
          },
        }));
      },

      setCameraZoom: (zoom: number) => {
        // Clamp zoom to reasonable bounds (0.1x to 5x)
        const clampedZoom = Math.max(0.1, Math.min(5, zoom));
        set((state) => ({
          camera: { ...state.camera, zoom: clampedZoom },
        }));
      },

      setPanelOpen: (open: boolean) => {
        set((state) => ({ panel: { ...state.panel, open } }));
      },

      togglePanel: () => {
        set((state) => ({ panel: { ...state.panel, open: !state.panel.open } }));
      },

      resetAll: () => {
        set(DEFAULT_STATE);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: customStorage,
      // Only persist specific fields (no secrets)
      partialize: (state) => ({
        version: state.version,
        camera: state.camera,
        panel: state.panel,
      }),
      // Handle version on rehydrate
      onRehydrateStorage: () => (state) => {
        if (!state) {
          console.warn('[uiStateStore] No persisted state found, using defaults');
          return;
        }
        console.log('[uiStateStore] Rehydrated UI state from localStorage');
      },
    }
  )
);

/**
 * Export the store directly
 * Zustand's persist middleware wraps state in {state, version}
 * but useUiStore() returns the unwrapped state directly
 */
export const useUiStore = persistedUiStore;

/**
 * Selector hooks for performance
 */
export const useCamera = () => useUiStore((state) => state.camera);
export const usePanel = () => useUiStore((state) => state.panel);
export const usePanelOpen = () => useUiStore((state) => state.panel.open);

/**
 * Initialize UI state on app load
 * This should be called from the main component (e.g., OfficeCanvas)
 * to restore state before mounting.
 *
 * Returns the persisted state, or null if none/invalid.
 */
export function initializeUiState(): UiState | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  return parseStoredState(stored);
}

/**
 * Clear persisted UI state (for testing/debugging)
 */
export function clearPersistedUiState(): void {
  if (typeof window === 'undefined') return;
  safeLocalStorage().removeItem(STORAGE_KEY);
  console.log('[uiStateStore] Cleared persisted UI state');
}