/**
 * Tests for useKeyboardShortcuts hook
 *
 * See docs/06-monitoring-requirements.md §M11.3
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, SHORTCUTS } from '../useKeyboardShortcuts';
import type { KeyboardShortcutActions } from '../useKeyboardShortcuts';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useKeyboardShortcuts - basic functionality', () => {
  const mockActions: KeyboardShortcutActions = {
    togglePanel: vi.fn(),
    resetCamera: vi.fn(),
    togglePause: vi.fn(),
    closePanel: vi.fn(),
    focusNextCard: vi.fn(),
    focusPrevCard: vi.fn(),
    activateFocusedCard: vi.fn(),
    getCardCount: () => 5,
    isPanelOpen: () => true,
    isPaused: () => false,
  };

  it('should initialize with help modal closed and no focused card', () => {
    const { result, unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    expect(result.current.helpModalOpen).toBe(false);
    expect(result.current.focusedCardIndex).toBe(-1);
    expect(result.current.cardActivated).toBe(false);
    unmount();
  });

  it('should open help modal when "?" is pressed', () => {
    const { result, unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: '?' });
      document.dispatchEvent(event);
    });

    expect(result.current.helpModalOpen).toBe(true);
    unmount();
  });

  it('should close help modal via closeHelpModal function', () => {
    const { result, unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      result.current.openHelpModal();
    });
    expect(result.current.helpModalOpen).toBe(true);

    act(() => {
      result.current.closeHelpModal();
    });
    expect(result.current.helpModalOpen).toBe(false);
    unmount();
  });
});

describe('useKeyboardShortcuts - M key toggle overlay', () => {
  let mockActions: KeyboardShortcutActions;

  beforeEach(() => {
    mockActions = {
      togglePanel: vi.fn(),
      resetCamera: vi.fn(),
      togglePause: vi.fn(),
      closePanel: vi.fn(),
      focusNextCard: vi.fn(),
      focusPrevCard: vi.fn(),
      activateFocusedCard: vi.fn(),
      getCardCount: () => 5,
      isPanelOpen: () => true,
      isPaused: () => false,
    };
  });

  it('should toggle panel when M key is pressed (lowercase)', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'm' });
      document.dispatchEvent(event);
    });

    expect(mockActions.togglePanel).toHaveBeenCalled();
    unmount();
  });

  it('should toggle panel when M key is pressed (uppercase)', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'M' });
      document.dispatchEvent(event);
    });

    expect(mockActions.togglePanel).toHaveBeenCalled();
    unmount();
  });

  it('should NOT toggle panel when typing M in an input field', () => {
    // Create an input element and make it active
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'm' });
      document.dispatchEvent(event);
    });

    expect(mockActions.togglePanel).not.toHaveBeenCalled();

    unmount();
    document.body.removeChild(input);
  });

  it('should NOT toggle panel when Ctrl+M is pressed', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'M', ctrlKey: true });
      document.dispatchEvent(event);
    });

    expect(mockActions.togglePanel).not.toHaveBeenCalled();
    unmount();
  });
});

describe('useKeyboardShortcuts - R key reset camera', () => {
  let mockActions: KeyboardShortcutActions;

  beforeEach(() => {
    mockActions = {
      togglePanel: vi.fn(),
      resetCamera: vi.fn(),
      togglePause: vi.fn(),
      closePanel: vi.fn(),
      focusNextCard: vi.fn(),
      focusPrevCard: vi.fn(),
      activateFocusedCard: vi.fn(),
      getCardCount: () => 5,
      isPanelOpen: () => true,
      isPaused: () => false,
    };
  });

  it('should reset camera when R key is pressed (lowercase)', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'r' });
      document.dispatchEvent(event);
    });

    expect(mockActions.resetCamera).toHaveBeenCalled();
    unmount();
  });

  it('should reset camera when R key is pressed (uppercase)', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'R' });
      document.dispatchEvent(event);
    });

    expect(mockActions.resetCamera).toHaveBeenCalled();
    unmount();
  });
});

describe('useKeyboardShortcuts - Space key pause/resume', () => {
  let mockActions: KeyboardShortcutActions;

  beforeEach(() => {
    mockActions = {
      togglePanel: vi.fn(),
      resetCamera: vi.fn(),
      togglePause: vi.fn(),
      closePanel: vi.fn(),
      focusNextCard: vi.fn(),
      focusPrevCard: vi.fn(),
      activateFocusedCard: vi.fn(),
      getCardCount: () => 5,
      isPanelOpen: () => true,
      isPaused: () => false,
    };
  });

  it('should toggle pause when Space key is pressed', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      document.dispatchEvent(event);
    });

    expect(mockActions.togglePause).toHaveBeenCalled();
    unmount();
  });

  it('should prevent default browser behavior for Space key', () => {
    const preventDefault = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: ' ',
        preventDefault,
      } as any);
      document.dispatchEvent(event);
    });

    expect(preventDefault).toHaveBeenCalled();
    unmount();
  });
});

describe('useKeyboardShortcuts - arrow key navigation', () => {
  it('should navigate cards with arrow keys when panel is open', () => {
    const mockActions: KeyboardShortcutActions = {
      togglePanel: vi.fn(),
      resetCamera: vi.fn(),
      togglePause: vi.fn(),
      closePanel: vi.fn(),
      focusNextCard: vi.fn(),
      focusPrevCard: vi.fn(),
      activateFocusedCard: vi.fn(),
      getCardCount: () => 5,
      isPanelOpen: () => true,
      isPaused: () => false,
    };

    const { result, unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    // Press ArrowDown - should navigate to next card
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(event);
    });

    expect(mockActions.focusNextCard).toHaveBeenCalled();
    expect(mockActions.focusPrevCard).not.toHaveBeenCalled();

    // Press ArrowUp - should navigate to previous card
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      document.dispatchEvent(event);
    });

    expect(mockActions.focusPrevCard).toHaveBeenCalled();
    unmount();
  });

  it('should NOT navigate cards when panel is closed', () => {
    const mockActions: KeyboardShortcutActions = {
      togglePanel: vi.fn(),
      resetCamera: vi.fn(),
      togglePause: vi.fn(),
      closePanel: vi.fn(),
      focusNextCard: vi.fn(),
      focusPrevCard: vi.fn(),
      activateFocusedCard: vi.fn(),
      getCardCount: () => 5,
      isPanelOpen: () => false,
      isPaused: () => false,
    };

    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(event);
    });

    expect(mockActions.focusNextCard).not.toHaveBeenCalled();
    unmount();
  });

  it('should NOT navigate cards when there are no cards', () => {
    const mockActions: KeyboardShortcutActions = {
      togglePanel: vi.fn(),
      resetCamera: vi.fn(),
      togglePause: vi.fn(),
      closePanel: vi.fn(),
      focusNextCard: vi.fn(),
      focusPrevCard: vi.fn(),
      activateFocusedCard: vi.fn(),
      getCardCount: () => 0,
      isPanelOpen: () => true,
      isPaused: () => false,
    };

    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(event);
    });

    expect(mockActions.focusNextCard).not.toHaveBeenCalled();
    unmount();
  });
});

describe('useKeyboardShortcuts - Enter key activate card', () => {
  it('should activate focused card when Enter is pressed', () => {
    const mockActions: KeyboardShortcutActions = {
      togglePanel: vi.fn(),
      resetCamera: vi.fn(),
      togglePause: vi.fn(),
      closePanel: vi.fn(),
      focusNextCard: vi.fn(),
      focusPrevCard: vi.fn(),
      activateFocusedCard: vi.fn(),
      getCardCount: () => 5,
      isPanelOpen: () => true,
      isPaused: () => false,
    };

    const { result, unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    // Simulate focusing a card by pressing arrow key first
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(event);
    });

    // Now press Enter
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });

    expect(mockActions.activateFocusedCard).toHaveBeenCalled();
    expect(result.current.cardActivated).toBe(true);

    // Reset the signal
    act(() => {
      result.current.resetCardActivated();
    });

    expect(result.current.cardActivated).toBe(false);
    unmount();
  });

  it('should NOT activate card when panel is closed', () => {
    const mockActions: KeyboardShortcutActions = {
      togglePanel: vi.fn(),
      resetCamera: vi.fn(),
      togglePause: vi.fn(),
      closePanel: vi.fn(),
      focusNextCard: vi.fn(),
      focusPrevCard: vi.fn(),
      activateFocusedCard: vi.fn(),
      getCardCount: () => 5,
      isPanelOpen: () => false,
      isPaused: () => false,
    };

    const { result, unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });

    expect(mockActions.activateFocusedCard).not.toHaveBeenCalled();
    expect(result.current.cardActivated).toBe(false);
    unmount();
  });
});

describe('useKeyboardShortcuts - Esc key close/cancel', () => {
  let mockActions: KeyboardShortcutActions;

  beforeEach(() => {
    mockActions = {
      togglePanel: vi.fn(),
      resetCamera: vi.fn(),
      togglePause: vi.fn(),
      closePanel: vi.fn(),
      focusNextCard: vi.fn(),
      focusPrevCard: vi.fn(),
      activateFocusedCard: vi.fn(),
      getCardCount: () => 5,
      isPanelOpen: () => true,
      isPaused: () => false,
    };
  });

  it('should cancel pause when Esc is pressed and paused', () => {
    mockActions.isPaused = () => true;

    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(mockActions.togglePause).toHaveBeenCalled(); // Cancel pause
    expect(mockActions.closePanel).not.toHaveBeenCalled();
    unmount();
  });

  it('should close panel when Esc is pressed and not paused', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(mockActions.closePanel).toHaveBeenCalled();
    expect(mockActions.togglePause).not.toHaveBeenCalled();
    unmount();
  });

  it('should close help modal when Esc is pressed and modal is open', () => {
    mockActions.isPanelOpen = () => false;

    const { result, unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    // Open help modal
    act(() => {
      result.current.openHelpModal();
    });
    expect(result.current.helpModalOpen).toBe(true);

    // Press Esc
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(result.current.helpModalOpen).toBe(false);
    unmount();
  });
});

describe('useKeyboardShortcuts - SHORTCUTS constant', () => {
  it('should have all shortcuts documented', () => {
    const keys = SHORTCUTS.map((s) => s.key);
    expect(keys).toContain('M');
    expect(keys).toContain('R');
    expect(keys).toContain('Space');
    expect(keys).toContain('↑');
    expect(keys).toContain('↓');
    expect(keys).toContain('Enter');
    expect(keys).toContain('Esc');
    expect(keys).toContain('?');
  });

  it('should have descriptive actions for each shortcut', () => {
    SHORTCUTS.forEach((shortcut) => {
      expect(shortcut.action).toBeTruthy();
      expect(typeof shortcut.action).toBe('string');
    });
  });
});

describe('useKeyboardShortcuts - edge cases', () => {
  let mockActions: KeyboardShortcutActions;

  beforeEach(() => {
    mockActions = {
      togglePanel: vi.fn(),
      resetCamera: vi.fn(),
      togglePause: vi.fn(),
      closePanel: vi.fn(),
      focusNextCard: vi.fn(),
      focusPrevCard: vi.fn(),
      activateFocusedCard: vi.fn(),
      getCardCount: () => 5,
      isPanelOpen: () => true,
      isPaused: () => false,
    };
  });

  it('should NOT trigger shortcuts when typing in textarea', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'm' });
      document.dispatchEvent(event);
    });

    expect(mockActions.togglePanel).not.toHaveBeenCalled();

    unmount();
    document.body.removeChild(textarea);
  });

  it('should NOT trigger shortcuts when typing in contenteditable div', () => {
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
    document.body.appendChild(div);
    div.focus();

    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'm' });
      document.dispatchEvent(event);
    });

    expect(mockActions.togglePanel).not.toHaveBeenCalled();

    unmount();
    document.body.removeChild(div);
  });

  it('should NOT trigger shortcuts with Alt key modifier', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'M', altKey: true });
      document.dispatchEvent(event);
    });

    expect(mockActions.togglePanel).not.toHaveBeenCalled();
    unmount();
  });

  it('should NOT trigger shortcuts with Meta key modifier', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'M', metaKey: true });
      document.dispatchEvent(event);
    });

    expect(mockActions.togglePanel).not.toHaveBeenCalled();
    unmount();
  });

  it('should wrap card navigation when reaching end of list', () => {
    mockActions.getCardCount = () => 3;

    const { result, unmount } = renderHook(() => useKeyboardShortcuts(mockActions));

    // Navigate through all cards
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' })); // -1 → 0
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' })); // 0 → 1
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' })); // 1 → 2
    });

    expect(result.current.focusedCardIndex).toBe(2);

    // Navigate backward
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); // 2 → 1
    });

    expect(result.current.focusedCardIndex).toBe(1);
    
    // Test forward wrap
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' })); // 1 → 2
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' })); // 2 → 0 (wrap)
    });
    
    expect(result.current.focusedCardIndex).toBe(0);
    
    // Test backward wrap
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); // 0 → 2 (wrap)
    });
    
    expect(result.current.focusedCardIndex).toBe(2);
    unmount();
  });
});