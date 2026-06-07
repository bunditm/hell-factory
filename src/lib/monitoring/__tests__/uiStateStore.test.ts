/**
 * Tests for UI state persistence (FR-M10)
 *
 * Tests:
 * - State persists across hard reload
 * - SSE snapshot overrides stale persisted state
 * - Graceful handling of malformed localStorage data
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeUiState, clearPersistedUiState, useUiStore } from '../uiStateStore';
import type { UiState } from '../uiStateStore';

const STORAGE_KEY = 'hell-factory:monitoring:ui-state';

// Mock localStorage for testing
const mockLocalStorage = {
  storage: new Map<string, string>(),
  getItem: vi.fn((key: string) => mockLocalStorage.storage.get(key) || null),
  setItem: vi.fn((key: string, value: string) => mockLocalStorage.storage.set(key, value)),
  removeItem: vi.fn((key: string) => mockLocalStorage.storage.delete(key)),
  clear: vi.fn(() => mockLocalStorage.storage.clear()),
};

// Reset store between tests
function resetStore() {
  // Clear the store by calling resetAll
  const store = useUiStore.getState();
  store.resetAll();
}

// Setup and teardown
beforeEach(() => {
  // Clear localStorage mock
  mockLocalStorage.storage.clear();
  mockLocalStorage.getItem.mockClear();
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.removeItem.mockClear();

  // Reset Zustand store
  resetStore();

  // Mock window.localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
});

afterEach(() => {
  resetStore();
  clearPersistedUiState();
});

describe('localStorage persistence (FR-M10)', () => {
  describe('initializeUiState', () => {
    it('should return null when localStorage is empty', () => {
      const state = initializeUiState();
      expect(state).toBeNull();
    });

    it('should parse valid persisted state', () => {
      const validState: UiState = {
        version: 1,
        camera: { x: 100, y: 200, zoom: 1.5 },
        panel: { open: true },
      };
      mockLocalStorage.storage.set(STORAGE_KEY, JSON.stringify(validState));

      const state = initializeUiState();
      expect(state).toEqual(validState);
    });

    it('should reject stale version', () => {
      const staleState = {
        version: 0, // Old version
        camera: { x: 100, y: 200, zoom: 1.5 },
        panel: { open: true },
      };
      mockLocalStorage.storage.set(STORAGE_KEY, JSON.stringify(staleState));

      const state = initializeUiState();
      expect(state).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      mockLocalStorage.storage.set(STORAGE_KEY, 'not valid json');

      const state = initializeUiState();
      expect(state).toBeNull();
    });

    it('should use defaults for missing fields', () => {
      const incompleteState = {
        version: 1,
        camera: { x: 100 }, // Missing y, zoom
        // Missing panel entirely
      };
      mockLocalStorage.storage.set(STORAGE_KEY, JSON.stringify(incompleteState));

      const state = initializeUiState();
      expect(state).toEqual({
        version: 1,
        camera: { x: 100, y: 0, zoom: 1 }, // Defaults filled in
        panel: { open: false }, // Default panel
      });
    });

    it('should use defaults for invalid field types', () => {
      const invalidState = {
        version: 1,
        camera: { x: 'invalid', y: 200, zoom: null }, // Invalid types
        panel: { open: 'yes' }, // Invalid type
      };
      mockLocalStorage.storage.set(STORAGE_KEY, JSON.stringify(invalidState));

      const state = initializeUiState();
      expect(state).toEqual({
        version: 1,
        camera: { x: 0, y: 200, zoom: 1 }, // Invalid x, zoom replaced with defaults
        panel: { open: false }, // Invalid open replaced with default
      });
    });
  });

  describe('clearPersistedUiState', () => {
    it('should remove state from localStorage', () => {
      mockLocalStorage.storage.set(STORAGE_KEY, JSON.stringify({ version: 1, camera: { x: 0, y: 0, zoom: 1 }, panel: { open: false } }));

      clearPersistedUiState();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(mockLocalStorage.storage.has(STORAGE_KEY)).toBe(false);
    });

    it('should handle missing localStorage gracefully', () => {
      expect(() => clearPersistedUiState()).not.toThrow();
    });
  });
});

describe('Camera state', () => {
  it('should initialize with default values', () => {
    const camera = useUiStore.getState().camera;
    expect(camera).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it('should update camera position via setCamera', () => {
    useUiStore.getState().setCamera({ x: 100, y: 200 });

    const camera = useUiStore.getState().camera;
    expect(camera).toEqual({ x: 100, y: 200, zoom: 1 });
  });

  it('should update partial camera fields', () => {
    useUiStore.getState().setCamera({ x: 100 });
    useUiStore.getState().setCamera({ zoom: 2 });

    const camera = useUiStore.getState().camera;
    expect(camera).toEqual({ x: 100, y: 0, zoom: 2 });
  });

  it('should pan camera', () => {
    useUiStore.getState().panCamera(50, -30);

    const camera = useUiStore.getState().camera;
    expect(camera).toEqual({ x: 50, y: -30, zoom: 1 });
  });

  it('should clamp zoom to minimum 0.1', () => {
    useUiStore.getState().setCameraZoom(0);

    const camera = useUiStore.getState().camera;
    expect(camera.zoom).toBe(0.1);
  });

  it('should clamp zoom to maximum 5', () => {
    useUiStore.getState().setCameraZoom(10);

    const camera = useUiStore.getState().camera;
    expect(camera.zoom).toBe(5);
  });

  it('should reset camera to defaults', () => {
    useUiStore.getState().setCamera({ x: 500, y: -300, zoom: 3 });
    useUiStore.getState().resetCamera();

    const camera = useUiStore.getState().camera;
    expect(camera).toEqual({ x: 0, y: 0, zoom: 1 });
  });
});

describe('Panel state', () => {
  it('should initialize with default closed state', () => {
    const panel = useUiStore.getState().panel;
    expect(panel).toEqual({ open: false });
  });

  it('should set panel open state', () => {
    useUiStore.getState().setPanelOpen(true);

    const panel = useUiStore.getState().panel;
    expect(panel.open).toBe(true);
  });

  it('should toggle panel open/closed', () => {
    expect(useUiStore.getState().panel.open).toBe(false);

    useUiStore.getState().togglePanel();
    expect(useUiStore.getState().panel.open).toBe(true);

    useUiStore.getState().togglePanel();
    expect(useUiStore.getState().panel.open).toBe(false);
  });
});

describe('State persistence across updates', () => {
  it('should persist camera changes to localStorage', () => {
    useUiStore.getState().setCamera({ x: 100, y: 200, zoom: 1.5 });

    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    const saved = mockLocalStorage.storage.get(STORAGE_KEY);
    const parsed = JSON.parse(saved!);

    // Zustand persist wraps the data in {state, version}
    expect(parsed.state).toBeDefined();
    expect(parsed.state.camera).toEqual({ x: 100, y: 200, zoom: 1.5 });
  });

  it('should persist panel changes to localStorage', () => {
    useUiStore.getState().setPanelOpen(true);

    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    const saved = mockLocalStorage.storage.get(STORAGE_KEY);
    const parsed = JSON.parse(saved!);

    // Zustand persist wraps the data in {state, version}
    expect(parsed.state.panel.open).toBe(true);
  });

  it('should persist multiple changes', () => {
    useUiStore.getState().setCamera({ x: 50, y: 100 });
    useUiStore.getState().setPanelOpen(true);
    useUiStore.getState().setCameraZoom(2);

    const saved = mockLocalStorage.storage.get(STORAGE_KEY);
    const parsed = JSON.parse(saved!);

    // Zustand persist wraps the data in {state, version}
    expect(parsed.state).toEqual({
      version: 1,
      camera: { x: 50, y: 100, zoom: 2 },
      panel: { open: true },
    });
    expect(typeof parsed.version).toBe('number'); // internal version, not our version
  });
});

describe('SSE snapshot override (FR-M10.4)', () => {
  it('should allow snapshot to override persisted camera state', () => {
    // Persist some state
    useUiStore.getState().setCamera({ x: 500, y: 600, zoom: 3 });
    useUiStore.getState().setPanelOpen(true);

    // Simulate SSE snapshot overriding camera
    // In real app, this would come from backend, but we test the API
    useUiStore.getState().setCamera({ x: 0, y: 0, zoom: 1 }); // Snapshot wins

    const camera = useUiStore.getState().camera;
    expect(camera).toEqual({ x: 0, y: 0, zoom: 1 });
    // Panel state should remain unchanged
    expect(useUiStore.getState().panel.open).toBe(true);
  });

  it('should allow snapshot to override panel state', () => {
    useUiStore.getState().setCamera({ x: 500, y: 600, zoom: 3 });
    useUiStore.getState().setPanelOpen(true);

    // Simulate SSE snapshot overriding panel
    useUiStore.getState().setPanelOpen(false); // Snapshot wins

    expect(useUiStore.getState().panel.open).toBe(false);
    // Camera state should remain unchanged
    expect(useUiStore.getState().camera).toEqual({ x: 500, y: 600, zoom: 3 });
  });
});

describe('Error handling', () => {
  it('should handle localStorage quota exceeded gracefully', () => {
    // Mock quota exceeded error
    mockLocalStorage.setItem.mockImplementation(() => {
      const err = new Error('QuotaExceededError') as Error & { name: string };
      err.name = 'QuotaExceededError';
      throw err;
    });

    // This should not throw
    expect(() => useUiStore.getState().setCamera({ x: 100, y: 200 })).not.toThrow();
  });

  it('should handle generic localStorage errors gracefully', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => useUiStore.getState().setCamera({ x: 100, y: 200 })).not.toThrow();
  });

  it('should work when localStorage is not available (SSR)', () => {
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      writable: true,
    });

    // Should not throw
    expect(() => {
      useUiStore.getState().setCamera({ x: 100, y: 200 });
      useUiStore.getState().setPanelOpen(true);
    }).not.toThrow();

    // State should still update (just not persist)
    expect(useUiStore.getState().camera).toEqual({ x: 100, y: 200, zoom: 1 });
    expect(useUiStore.getState().panel.open).toBe(true);
  });
});

describe('Reset all', () => {
  it('should reset all state to defaults', () => {
    useUiStore.getState().setCamera({ x: 500, y: 600, zoom: 3 });
    useUiStore.getState().setPanelOpen(true);

    useUiStore.getState().resetAll();

    expect(useUiStore.getState().camera).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(useUiStore.getState().panel).toEqual({ open: false });
  });
});