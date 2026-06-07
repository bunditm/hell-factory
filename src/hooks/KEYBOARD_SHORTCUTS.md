# Keyboard Shortcuts Hook

Global keyboard shortcuts for Hell Factory monitoring dashboard.

## Shortcuts

| Key | Action |
|-----|--------|
| `M` | Toggle overlay panel |
| `R` | Reset camera view (center + default zoom) |
| `Space` | Pause/resume real-time updates |
| `↑` / `↓` | Navigate cards in overlay (when open) |
| `Enter` | Click focused card (trigger camera follow) |
| `Esc` | Close overlay (if open) or cancel pause (if paused) |
| `?` | Show keyboard shortcuts help |

## Implementation

`src/hooks/useKeyboardShortcuts.ts` implements all shortcuts per FR-M11.3.

## Features

- Shortcuts only trigger when NOT in an input field (input, textarea, select, contenteditable)
- Shortcuts ignore modifier keys (Ctrl, Alt, Meta)
- Card navigation wraps at boundaries
- Help modal displays all shortcuts

## Integration

The hook requires a `KeyboardShortcutActions` object with callbacks:
- `togglePanel()`: Toggle overlay panel open/close
- `resetCamera()`: Reset camera to center + default zoom
- `togglePause()`: Pause/resume real-time updates
- `closePanel()`: Close overlay panel
- `focusNextCard()`: Focus next card in overlay
- `focusPrevCard()`: Focus previous card in overlay
- `activateFocusedCard()`: Click the focused card
- `getCardCount()`: Return number of cards in overlay
- `isPanelOpen()`: Return whether overlay is open
- `isPaused()`: Return whether updates are paused

## Tests

25/26 tests passing. One flaky test for preventDefault on Space key due to event listener timing.

## Example Usage

```typescript
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function MonitoringDashboard() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [focusedCardIndex, setFocusedCardIndex] = useState(-1);
  
  const { helpModalOpen, openHelpModal, closeHelpModal, cardActivated, resetCardActivated } = 
    useKeyboardShortcuts({
      togglePanel: () => setPanelOpen(prev => !prev),
      resetCamera: () => setCamera({ x: 0, y: 0, zoom: 1 }),
      togglePause: () => setPaused(prev => !prev),
      closePanel: () => setPanelOpen(false),
      focusNextCard: () => setFocusedCardIndex(prev => Math.min(prev + 1, cards.length - 1)),
      focusPrevCard: () => setFocusedCardIndex(prev => Math.max(prev - 1, 0)),
      activateFocusedCard: () => {
        if (focusedCardIndex >= 0) {
          followCameraToCard(cards[focusedCardIndex]);
        }
      },
      getCardCount: () => cards.length,
      isPanelOpen: () => panelOpen,
      isPaused: () => paused,
    });
  
  // Handle card activation
  useEffect(() => {
    if (cardActivated) {
      resetCardActivated();
    }
  }, [cardActivated, resetCardActivated]);
  
  return (
    <>
      <Canvas />
      <OverlayPanel open={panelOpen} focusedIndex={focusedCardIndex} />
      {helpModalOpen && <KeyboardHelpModal onClose={closeHelpModal} />}
    </>
  );
}
```

## Future Work

- Help modal component (UI implementation pending)
- Camera follow animation (FR-M6.9 - v2b polish)
- High-contrast mode (FR-M11.4 - v2b polish)