/**
 * useKeyboardShortcuts hook
 *
 * Global keyboard shortcuts for Hell Factory monitoring dashboard.
 * Per FR-M11.3 (docs/06-monitoring-requirements.md §M11):
 *
 * Shortcuts:
 * - M → toggle overlay panel
 * - R → reset camera view (center + default zoom)
 * - Space → pause/resume real-time updates
 * - ↑/↓ → navigate cards in overlay (when open)
 * - Enter on focused card → click card (trigger camera follow)
 * - Esc → close overlay (if open) or cancel pause (if paused)
 *
 * Design decisions:
 * - Shortcuts only trigger when NOT in an input field (input, textarea, select)
 * - Uses state to track the focused card index in the overlay
 * - Signals when a card is "clicked" via keyboard for camera follow
 * - Includes a help modal with all shortcuts
 *
 * @see docs/06-monitoring-requirements.md §M11 (accessibility)
 */

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Actions that the shortcut consumer can provide
 */
export interface KeyboardShortcutActions {
  togglePanel: () => void;
  resetCamera: () => void;
  togglePause: () => void;
  closePanel: () => void;
  focusNextCard: () => void;
  focusPrevCard: () => void;
  activateFocusedCard: () => void;
  getCardCount: () => number;
  isPanelOpen: () => boolean;
  isPaused: () => boolean;
}

/**
 * Return type from useKeyboardShortcuts
 */
export interface KeyboardShortcutsReturn {
  /**
   * Whether the help modal is currently open
   */
  helpModalOpen: boolean;
  /**
   * Function to open the help modal
   */
  openHelpModal: () => void;
  /**
   * Function to close the help modal
   */
  closeHelpModal: () => void;
  /**
   * Index of the currently focused card (for overlay panel)
   * -1 means no card is focused
   */
  focusedCardIndex: number;
  /**
   * Whether a card was just activated via keyboard (Enter key)
   * This is a transient signal that resets after reading
   */
  cardActivated: boolean;
  /**
   * Reset the card activated signal (call after handling)
   */
  resetCardActivated: () => void;
}

/**
 * All keyboard shortcuts documented
 */
export const SHORTCUTS = [
  { key: 'M', action: 'Toggle overlay panel' },
  { key: 'R', action: 'Reset camera view' },
  { key: 'Space', action: 'Pause/resume real-time updates' },
  { key: '↑', action: 'Navigate to previous card (overlay)' },
  { key: '↓', action: 'Navigate to next card (overlay)' },
  { key: 'Enter', action: 'Click focused card (camera follow)' },
  { key: 'Esc', action: 'Close overlay or cancel pause' },
  { key: '?', action: 'Show keyboard shortcuts help' },
] as const;

/**
 * Check if the active element is an input-like field
 * Shortcuts should NOT trigger when the user is typing
 */
function isInInputField(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  const isInput = ['input', 'textarea', 'select'].includes(tagName);
  const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';

  return isInput || isContentEditable;
}

/**
 * Keyboard shortcuts hook
 *
 * @param actions - Callback functions for each shortcut action
 * @returns State and controls for keyboard shortcuts
 */
export function useKeyboardShortcuts(
  actions: KeyboardShortcutActions
): KeyboardShortcutsReturn {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [cardActivated, setCardActivated] = useState(false);
  const [focusedCardIndex, setFocusedCardIndex] = useState(-1);
  
  // Use ref to avoid recreating handler when helpModalOpen changes
  const helpModalOpenRef = useRef(false);
  helpModalOpenRef.current = helpModalOpen;
  
  // Use ref for actions to avoid recreating handler
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if typing in an input field
    if (isInInputField()) return;

    // Ignore if any modifier keys are pressed (Ctrl, Alt, Meta, Cmd)
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    const { key } = event;
    const currentActions = actionsRef.current;
    const cardCount = currentActions.getCardCount();

    switch (key) {
      case 'm':
      case 'M':
        event.preventDefault();
        currentActions.togglePanel();
        // Reset focus index when toggling panel
        setFocusedCardIndex(-1);
        break;

      case 'r':
      case 'R':
        event.preventDefault();
        currentActions.resetCamera();
        break;

      case ' ':
        event.preventDefault();
        currentActions.togglePause();
        break;

      case 'ArrowUp':
        if (currentActions.isPanelOpen() && cardCount > 0) {
          event.preventDefault();
          currentActions.focusPrevCard();
          setFocusedCardIndex((prev) =>
            prev <= 0 ? cardCount - 1 : prev - 1
          );
        }
        break;

      case 'ArrowDown':
        if (currentActions.isPanelOpen() && cardCount > 0) {
          event.preventDefault();
          currentActions.focusNextCard();
          setFocusedCardIndex((prev) =>
            prev >= cardCount - 1 ? 0 : prev + 1
          );
        }
        break;

      case 'Enter':
        setFocusedCardIndex((current) => {
          if (currentActions.isPanelOpen() && current >= 0) {
            event.preventDefault();
            currentActions.activateFocusedCard();
            setCardActivated(true);
          }
          return current;
        });
        break;

      case 'Escape':
        event.preventDefault();
        // Priority: cancel pause first (if paused), then close panel, then close modal
        if (currentActions.isPaused()) {
          currentActions.togglePause(); // Cancel pause
        } else if (currentActions.isPanelOpen()) {
          currentActions.closePanel();
          setFocusedCardIndex(-1);
        } else if (helpModalOpenRef.current) {
          setHelpModalOpen(false);
        }
        break;

      case '?':
        event.preventDefault();
        setHelpModalOpen(true);
        break;

      default:
        // Ignore other keys
        break;
    }
  }, []); // Empty deps - we use refs for everything

  // Attach global keydown listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Auto-reset card activated signal after consumer handles it
  const resetCardActivated = useCallback(() => {
    setCardActivated(false);
  }, []);

  return {
    helpModalOpen,
    openHelpModal: () => setHelpModalOpen(true),
    closeHelpModal: () => setHelpModalOpen(false),
    focusedCardIndex,
    cardActivated,
    resetCardActivated,
  };
}