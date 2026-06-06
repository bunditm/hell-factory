---
title: Frontend Dev Review Feedback on Monitoring Requirements (v2)
reviewed_by: frontend-dev
date: 2026-06-06
source: docs/06-monitoring-requirements.md
---

# Frontend Dev Review Feedback

## Overall Assessment

The v2 monitoring requirements document is comprehensive and well-structured. The state machine, SSE schema, and 9 monitoring areas cover the core functionality needed. However, there are several areas that need clarification, technical feasibility concerns, and frontend-specific considerations.

---

## Critical Questions & Concerns

### 1. State Detection Accuracy (Open Question #1)

**Concern**: Relying on JSONL `reasoning_content` + `tool_calls` + timestamp to distinguish states is fragile.

**Why**:
- The JSONL format is for logging, not for real-time state queries. Parsing it every 500ms is inefficient.
- `reasoning_content` presence doesn't always mean "thinking" — could be cached results.
- Tool call completion doesn't always mean "working" finished — agent could still be processing the result.

**Recommendation**:
- Add a lightweight state tracking layer in Hermes itself that emits explicit state events
- Fallback to JSONL parsing if explicit events aren't available
- Consider adding a `delegate_task` callback that notifies the monitoring plugin when a sub-agent is spawned/completed

**Impact**: HIGH — This is the foundation of the entire monitoring system.

---

### 2. Waiting-for-Approval Detection (Open Question #2)

**Concern**: Content heuristics for detecting "waiting for approval" will produce many false positives/negatives.

**Why**:
- Different agents phrase questions differently
- A question might be rhetorical, not a request for approval
- Approvals might happen via other channels (Discord, terminal input)

**Recommendation**:
- Add explicit `approval_request` event type in Hermes message structure
- If not possible, create a configurable pattern-matching system with confidence scores
- Allow manual override in the overlay panel (user can mark an agent as "waiting")

**Impact**: HIGH — This is the most important visual indicator for the user.

---

### 3. Sub-Agent Rendering (Open Question #3)

**Feedback**: "50% scale shadows at parent's feet" is good.

**Concerns**:
- Shadows overlapping when 3+ sub-agents exist under one parent
- Shadow visibility on light backgrounds
- Interaction: Can users click a shadow to see sub-agent details?

**Recommendations**:
- Arrange shadows in a small arc around the parent (fanned out, not stacked)
- Add a subtle glow/border for contrast
- Shadows should be interactive — clicking opens sub-agent card in overlay
- Add tooltip on hover showing sub-agent agentId + state

**Impact**: MEDIUM — Visual polish, but important for usability.

---

### 4. Browser State Management & SSE Reconnection

**Missing Requirement**: What happens to the Zustand store during SSE disconnect?

**Concerns**:
- After reconnection, browser receives fresh `state_snapshot` — but what if there was activity during the disconnect?
- Should we show "reconnecting..." state in UI?
- Should we persist last known state to localStorage for cross-tab sync?

**Recommendation**: Add to FR-M4:
- Browser shows "Reconnecting..." toast during disconnect
- On reconnection, apply fresh snapshot and highlight agents with "(updated since disconnect)" badge
- Persist open/closed state of overlay panel to localStorage (FR-M6.6)
- Consider persisting last 10 seconds of activity log for cross-tab sync

**Impact**: HIGH — Direct user experience.

---

### 5. Performance: 60fps with Overlay Open (NFR-M1)

**Concern**: Canvas 60fps + SSE updates every 500ms + overlay re-render = potential frame drops.

**Why**:
- React re-renders of overlay cards every 500ms will be expensive
- Zustand store updates trigger re-renders for all subscribed components

**Recommendations**:
- Use `useMemo` + `React.memo` aggressively for overlay cards
- Batch SSE updates: only re-render cards if their data actually changed
- Use `requestAnimationFrame` for canvas updates, decoupled from SSE ticks
- Consider using `react-window` or virtualization if overlay has 20+ cards

**Impact**: HIGH — Performance requirement.

---

### 6. Speech Bubble Stacking (FR-M7.7)

**Concern**: "Stack vertically with 4px gap" — what happens when 4+ bubbles stack? Does it go off-screen?

**Recommendation**:
- Cap bubble stack height at 3 bubbles
- 4th+ bubbles rotate in a carousel (fading in/out) or collapse into a "+2 more" indicator
- Ensure bubbles never clip through room walls or other sprites

**Impact**: LOW — Edge case, but important for polish.

---

### 7. Camera Follow on Card Click (FR-M6.3)

**Concern**: "Pans + zooms the canvas to that agent's seat" — how smooth is this transition?

**Recommendations**:
- Add ease-in/ease-out animation (duration: 500ms)
- Preserve current zoom level if agent is already visible
- Add a "Reset view" button to return to default camera
- Support keyboard navigation (Arrow keys to move camera, +/- for zoom)

**Impact**: MEDIUM — UX detail.

---

### 8. Error Bubble Dismissal (Open Question #8)

**Feedback**: "Auto-clear after 10s + counter badge in overlay" is good.

**Additional suggestion**:
- Add a manual dismiss button on the bubble (click to clear early)
- Add error severity levels: ERROR (auto-clear 10s), CRITICAL (sticky until dismissed)
- Show error preview in overlay card (last error message truncated)

**Impact**: LOW — Nice-to-have.

---

## Missing Requirements

### M10 — Cross-Session State Persistence

**Missing**: What happens if the user closes the browser tab and reopens?

**Recommendation**:
- Persist last camera position to localStorage
- Persist overlay panel open/closed state
- Optionally: persist last 5 minutes of activity log (for debugging)

**Impact**: MEDIUM — User convenience.

---

### M11 — Accessibility

**Missing**: Keyboard accessibility, screen reader support.

**Recommendations**:
- All overlay cards are focusable (Tab navigation)
- Speech bubbles have `aria-label` describing state + agent name
- Keyboard shortcuts: `M` toggle overlay, `R` reset view, `Space` pause/resume real-time updates
- High-contrast mode option for users with visual impairments

**Impact**: MEDIUM — Accessibility requirement.

---

### M12 — Error Boundaries

**Missing**: What happens if the frontend crashes due to malformed SSE data?

**Recommendation**:
- Wrap all SSE handling in error boundary
- On parse error: show toast "Connection error — reconnecting..." and attempt auto-reconnect
- Log malformed payloads to console (sanitized, no sensitive data)
- Provide "Report issue" button that captures last 10 events for debugging

**Impact**: HIGH — Reliability.

---

## Technical Feasibility Concerns

### SSE Payload Size (FR-M1.7)

**Concern**: "Full set of agents on every tick" — what's the expected payload size?

**Calculation**:
- 6 agents × ~500 bytes per agent = 3KB per tick
- 500ms ticks = 6KB/s inbound (manageable)
- But with sub-agents (3 per parent) = 15 agents = 7.5KB per tick = 15KB/s

**Recommendation**:
- Verify actual payload size with real data
- If >10KB per tick, consider compression or batching
- Consider using MessagePack for binary encoding if performance is an issue

**Impact**: LOW — Likely fine, but worth measuring.

---

### Delta Encoding Implementation (FR-M4.4)

**Concern**: "Delta-encoded after first snapshot" — how do we detect what changed?

**Question**: Does the plugin track last-emitted state per agent, or does the frontend compare?

**Recommendation**:
- Plugin should track last-emitted state and only send `agent_update` if fields changed
- Use JSON Patch format for delta: `{ op: "replace", path: "/state", value: "working" }`
- Alternatively, send full `agent_update` object (easier, slightly more bandwidth)

**Impact**: MEDIUM — Affects implementation complexity.

---

## Priority Re-Rankings

### Should be "Must" instead of "Should":

- **FR-M4.7**: SSE → Zustand latency < 200ms (currently "Should") — Real-time feedback is core to monitoring
- **FR-M6.3**: Camera follow on card click (currently "Should") — Critical for navigation
- **FR-M6.5**: "Open transcript" link (currently "Should") — Primary debugging workflow

### Should be "Should" instead of "Must":

- **FR-M7.2**: Gear icon for "working" state — Can be deferred, speech bubble is sufficient initially

---

## Acceptance Criteria Additions

Add to AC #3:
- "Overlay cards update within 500ms of state change (measured from SSE event to DOM update)"

Add to AC #9:
- "DevTools Performance tab shows <16ms frame time for canvas renders during 60fps test"

---

## Summary

### Must Fix Before v2:
1. Clarify state detection mechanism (add explicit events or improve heuristics)
2. Design robust waiting-for-approval detection
3. Define SSE reconnection + browser state persistence behavior
4. Add error boundaries for SSE handling

### Nice-to-Have for v2:
5. Sub-agent shadow interaction (tooltips, click-to-view)
6. Camera follow animation + keyboard navigation
7. Accessibility features (keyboard shortcuts, screen reader support)
8. Error severity levels (sticky critical errors)

### Can Defer to v3:
9. Audio cues (already deferred)
10. Cross-session state persistence (camera position)
11. Historical analytics

---

## Open Questions for Hermes:

1. Can we add explicit state events to Hermes, or must we rely on JSONL parsing?
2. What's the approval flow pattern we're trying to detect? Examples?
3. Should we implement delta encoding at the plugin or frontend level?
4. Do you want error severity levels (sticky critical vs auto-clear minor)?
5. What's your priority: real-time accuracy (frequent polls) vs performance (fewer polls)?

---

**Next Steps**:
- Hermes to respond to open questions above
- Iterate on requirements document
- Once aligned, proceed to task breakdown for frontend workstreams