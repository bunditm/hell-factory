---
title: Monitoring Function Requirements (v2.1)
last_updated: 2026-06-06
status: v2.1 — incorporates frontend-dev review feedback (docs/07-frontend-dev-review-feedback.md)
extends: 02-prd.md (v1 visual scope)
reviewers: frontend-dev
---

# Hell Factory — Monitoring Function Requirements (v2.1)

## Revision history

| Version | Date | Author | Notes |
|---|---|---|---|
| v1 | 2026-06-05 | Hermes | Visual scope (canvas, 4-6 characters, work/idle rooms) — `02-prd.md` |
| v2 | 2026-06-06 | Hermes | Monitoring function (9 areas M1–M9, state machine, SSE schema) — initial draft |
| **v2.1** | 2026-06-06 | Hermes | Incorporates frontend-dev review: +M0, +M10, +M11, +M12, FR additions, priority re-rankings, schema additions, v2a/v2b scope split, plugin-side delta, 2-level error severity, explicit events > JSONL |

## Why this document exists

The v1 PRD (`02-prd.md`) defined the **visual scope** of Hell Factory: a pixel-art canvas with 4-6 characters sitting in Work Room / Idle Room. The visual layer is built (branch `phase-a-v3-detail` — 5 rooms, real PNG sprites, full Canvas 2D pipeline).

This v2.1 document defines the **monitoring function** — everything that has to exist *behind* the canvas so the canvas is a faithful, real-time, observable reflection of the Hermes agent team. Without this layer, the canvas is a pretty mockup. With it, the canvas *is* the team's operating dashboard.

Frontend-dev reviewed v2 on 2026-06-06 (see `07-frontend-dev-review-feedback.md`). All feedback has been incorporated.

**Target user is unchanged**: Dev Lead (Ton/Bunditm) at-a-glance team status, identify blockers, redirect agents. Secondary: PM, developer observers.

**Out of scope for v2** (still deferred from v1): audio notifications, mobile responsive, multi-tenant auth, 3D, multi-office federation.

---

## Glossary

| Term | Definition |
|---|---|
| **Agent** | A Hermes profile that can act on its own: `hermes`, `frontend-dev`, `backend-dev`, `devops`, `qa-engineer` |
| **Sub-agent** | A child session spawned by a parent agent via `delegate_task` (or similar). Sub-agents belong to a parent and have a short lifetime. |
| **Activity** | A unit of work the agent is currently doing (a tool call, a reasoning turn, waiting for human input) |
| **State** | A canonical agent state used by the canvas: `idle`, `thinking`, `working`, `waiting`, `error`, `bark` |
| **Severity** | Sub-classification of `error` state: `error_minor` (auto-clear 10s) or `error_critical` (sticky until dismissed) |
| **Tick** | One polling cycle of the Hermes plugin (target: every 500ms) |
| **Reconciliation** | Plugin recomputing each agent's current state from the underlying source-of-truth (Hermes state.db + JSONL sessions + Hermes event stream) |
| **Snapshot** | A full state payload emitted on connect (and on explicit re-snapshot request) — contains all agents |
| **Delta** | A partial update containing only the agents whose state changed since the last emission |

---

## FR-M (Monitoring Functional Requirements)

### M0 — Hermes event integration (NEW in v2.1, per frontend-dev Q1+Q2)

Hermes must emit explicit events for state changes the plugin can subscribe to. JSONL parsing remains as a fallback for legacy sessions and startup backfill, but is no longer the primary signal source.

| ID | Requirement | Priority |
|---|---|---|
| FR-M0.1 | Hermes emits `state_change` event whenever an agent transitions between canonical states | Must |
| FR-M0.2 | Hermes emits `approval_request` event when an agent invokes a tool whose contract is "wait for human" (e.g. `AskUserQuestion`, `human_input`) | Must |
| FR-M0.3 | Hermes emits `sub_agent_spawned` and `sub_agent_completed` events with `parentSessionId` and `childSessionId` | Must |
| FR-M0.4 | Hermes plugin subscribes to all three event types; on event receipt, marks the affected agent for re-emit on next tick | Must |
| FR-M0.5 | JSONL parsing remains as a fallback signal for: (a) older sessions without event emission, (b) plugin startup backfill, (c) drift reconciliation | Should |
| FR-M0.6 | Event payload includes: `agentId`, `sessionId`, `parentSessionId` (if sub-agent), `eventType`, `timestamp`, `data` (event-specific) | Must |
| FR-M0.7 | Content heuristics (e.g. detecting "shall I proceed" in last assistant message) stay as a fallback for `waiting` state detection | Should |

### M1 — Agent observation (the heart of monitoring)

The system must be able to answer, for any agent at any tick: *"What is this agent doing right now, with what tool, on what task, and is anyone waiting on it?"*

| ID | Requirement | Priority |
|---|---|---|
| FR-M1.1 | Plugin polls Hermes internal state every 500ms (configurable) | Must |
| FR-M1.2 | Plugin reads `~/.hermes/state.db` (`sessions`, `messages` tables) to detect active/ended sessions, last tool call, last message timestamp | Must |
| FR-M1.3 | Plugin reads active JSONL session files as a **fallback** (per M0) to detect `reasoning_content` (thinking), `tool_calls` (working), and waiting-for-human patterns | Must |
| FR-M1.4 | Plugin handles the 5 main profiles (`hermes`, `frontend-dev`, `backend-dev`, `devops`, `qa-engineer`) | Must |
| FR-M1.5 | Plugin derives a canonical state per agent: `idle`, `thinking`, `working`, `waiting`, `error` (see State Machine below) | Must |
| FR-M1.6 | Plugin survives DB locked / JSONL parse errors — log and continue, never crash the SSE stream | Must |
| FR-M1.7 | Plugin emits a `state_snapshot` SSE event containing the full set of agents on connect (full payload, ~3-7.5KB at 6-15 agents) | Must |
| FR-M1.8 | Plugin emits an `agent_removed` event when a session ends and the agent is no longer tracked | Must |
| FR-M1.9 | Plugin emits a `heartbeat` event every 5s on the SSE stream so the client can detect dead connections | Should |

### M2 — Sub-agent detection & visualization

The monitoring function must surface the full team, including the transient children that `delegate_task` spawns.

| ID | Requirement | Priority |
|---|---|---|
| FR-M2.1 | Plugin detects sub-agents by reading JSONL session headers (`role: session_meta` with `parent_session_id` set) — fallback signal | Must |
| FR-M2.2 | Plugin uses Hermes `sub_agent_spawned` event as the **primary** signal (per M0) | Must |
| FR-M2.3 | Plugin links sub-agent to parent via `parentSessionId` and exposes `subAgentOf` field in the agent status | Must |
| FR-M2.4 | Browser renders sub-agent characters as smaller (50% scale) "shadow" sprites positioned in a small arc around the parent character (fan layout, not stacked) | Must |
| FR-M2.5 | Sub-agent shadows have a subtle glow/border for contrast against any background | Should |
| FR-M2.6 | Sub-agent shadows are interactive: clicking opens the sub-agent card in the overlay panel; hovering shows a tooltip with `agentId` + state | Should |
| FR-M2.7 | Sub-agent lifecycle: appears within 1s of spawn, disappears within 1s of completion (no zombie characters) | Must |
| FR-M2.8 | At least 3 concurrent sub-agents must be visible at once (test scenario: hermes delegates 3 tasks simultaneously) | Should |
| FR-M2.9 | A line / dotted connector is drawn from parent to active sub-agents to make the relationship visible at a glance | Could |

### M3 — State machine (canonical, with severity)

The canonical state machine that drives the canvas:

| State | Canvas effect | Detected when |
|---|---|---|
| `idle` | Character stands in Idle Room, idle animation, no speech bubble | No active session, OR session exists but no tool/reasoning for >60s |
| `thinking` | Character at work seat, thought-bubble with "..." (2-frame animation) | Active session, last message is `assistant` with `reasoning_content`, no recent tool call in last 3s |
| `working` | Character at work seat, typing animation (2-frame) | Active session, last message is `tool` result within last 3s OR `assistant` with `tool_calls` pending |
| `waiting` | Character at work seat, hourglass speech bubble, Hermes bark suppressed | `approval_request` event received (primary) OR last message heuristic matches (fallback) |
| `error` | Character at work seat, red exclamation speech bubble, severity-dependent | Last tool result contains error keyword (configurable list: `Error:`, `Traceback`, `panic:`) AND no recovery within 10s |
| `error_critical` | Same as `error` but with sticky bubble + red badge in overlay (does not auto-clear) | 3+ errors within 60s, OR DB lock, OR plugin crash, OR explicit `severity: critical` flag |
| `bark` | Special Hermes-only state: Hermes pulses + shows "DO THE WORK" speech bubble targeting an idle agent | (See M5 — Hermes bark logic) |

**Severity (NEW in v2.1)**:
- `severity: 'minor'` (default) — auto-clear after 10s, no badge
- `severity: 'critical'` — sticky until user dismisses, red badge in overlay card
- Plugin decides severity based on error count + pattern (3+ errors in 60s = critical)

Transition rules:
- `working` → `thinking` after 3s without tool call
- `working` → `error` if last tool result has error keyword
- `error` → `thinking` after 10s of healthy activity
- `error_minor` auto-clears after 10s of healthy activity
- `error_critical` does NOT auto-clear; only user dismiss or plugin restart
- any → `idle` after 60s without any activity
- `idle` → `thinking` within 1s of new session activity

### M4 — Live SSE pipeline

| ID | Requirement | Priority |
|---|---|---|
| FR-M4.1 | Plugin binds SSE server to `127.0.0.1:3002` only (NEVER 0.0.0.0) | Must |
| FR-M4.2 | Endpoint: `GET /events` returns `text/event-stream` with `Cache-Control: no-cache`, `Connection: keep-alive` | Must |
| FR-M4.3 | First event after connect is always a full `state_snapshot` (so a fresh browser load sees the world immediately) | Must |
| FR-M4.4 | Subsequent events are deltas — plugin tracks last-emitted state per agent, only sends `agent_update` when fields actually change (plugin-side delta, **per frontend-dev Q3**). Full `HermesAgentStatus` object on change; no JSON Patch | Must |
| FR-M4.5 | Browser (`sseClient.ts`) auto-reconnects on disconnect with exponential backoff (1s, 2s, 4s, max 30s) | Must |
| FR-M4.6 | Browser applies the first `state_snapshot` to the Zustand store, then deltas | Must |
| FR-M4.7 | SSE → Zustand → `officeState.updateAgent()` → canvas tick — total path latency **< 200ms in-process** (promoted to Must per frontend-dev re-rank) | Must |
| FR-M4.8 | End-to-end latency (Hermes activity → canvas pixel change) < 2s (NFR-M2) | Must |
| FR-M4.9 | Plugin exposes `GET /health` returning `{ status: "ok", agents: [...], uptime_s, last_tick_at }` | Must |
| FR-M4.10 | If plugin crashes, devops watchdog restarts it within 5s | Should |
| FR-M4.11 | **Reconnect UX (NEW in v2.1, per frontend-dev §4)**: browser shows "Reconnecting..." toast during disconnect; on reconnection, applies fresh snapshot and highlights agents with "(updated since disconnect)" badge for 5s | Should |

### M5 — Hermes bark logic (emotional model)

Hermes is the dev-lead persona in the office. Barking is his motivational shouting, NOT a system alert.

| ID | Requirement | Priority |
|---|---|---|
| FR-M5.1 | Hermes barks ONCE when a work item is assigned to an idle agent (one bark per assignment) | Must |
| FR-M5.2 | Hermes barks ONCE per `barkIntervalMinutes` (default: 5 min) for any agent still idle with no work | Should |
| FR-M5.3 | Hermes does NOT bark when work completes (silent return to idle) | Must |
| FR-M5.4 | Hermes does NOT bark at agents that are in `waiting` state (they already show a speech bubble) | Must |
| FR-M5.5 | Bark target: if multiple idle agents, target the one idle the longest | Should |
| FR-M5.6 | Bark visual: Hermes pulses (size +10% for 300ms) + speech bubble "DO THE WORK" with arrow pointing at the target | Should |
| FR-M5.7 | Bark config (`barkIntervalMinutes`, enabled/disabled) is exposed in the dashboard overlay and persisted to plugin config | Could |

### M6 — Status UI overlay (monitoring dashboard)

The canvas alone isn't enough. A right-side (or top) overlay panel is needed to see textual detail.

| ID | Requirement | Priority |
|---|---|---|
| FR-M6.1 | Floating panel (collapsible) listing all tracked agents as cards | Must |
| FR-M6.2 | Each card shows: agentId, current state (color-coded), current task (truncated to 60 chars), current tool, last activity timestamp (relative: "2s ago") | Must |
| FR-M6.3 | Clicking a card pans + zooms the canvas to that agent's seat (camera follow — **promoted to Must per frontend-dev re-rank**) | Must |
| FR-M6.4 | Clicking a card also opens a detail popover with: full current task, recent tool history (last 5), and "Open transcript" link | Should |
| FR-M6.5 | "Open transcript" link opens a new browser tab to the Hermes session transcript URL (session_search link) — **promoted to Must per frontend-dev re-rank** (primary debugging workflow) | Must |
| FR-M6.6 | Panel header shows aggregate counts: `2 working · 1 thinking · 1 idle · 1 error` | Should |
| FR-M6.7 | Card for sub-agents is visually smaller / indented under parent card | Should |
| FR-M6.8 | Panel is keyboard accessible: `M` to toggle, arrow keys to navigate cards | Could |
| FR-M6.9 | **Camera follow animation (NEW in v2.1, per frontend-dev §7)**: 500ms ease-in-out transition, preserve current zoom if agent already visible, "Reset view" button to return to default | Should |
| FR-M6.10 | **Panel open/closed state persisted to localStorage** (per frontend-dev §M10) | Should |

### M7 — Speech bubbles & visual indicators (in-canvas)

In addition to the overlay, the canvas itself must show readable status signals on each character.

| ID | Requirement | Priority |
|---|---|---|
| FR-M7.1 | `thinking` → small "..." bubble above character (cycles frames every 500ms) | Must |
| FR-M7.2 | `working` → gear icon (small, semi-transparent, above head) — **demoted to Should per frontend-dev re-rank** (speech bubble is sufficient initially) | Should |
| FR-M7.3 | `waiting` → hourglass bubble with ⚠ border (high contrast — most important to spot) | Must |
| FR-M7.4 | `error` → red ! bubble, character briefly shakes | Must |
| FR-M7.5 | `error_critical` → red ! bubble with solid red border, sticky until dismissed, red badge in overlay | Must |
| FR-M7.6 | `bark` (Hermes) → "DO THE WORK" bubble with arrow pointing at target agent | Should |
| FR-M7.7 | All bubbles stay above the character as they walk, follow their position | Must |
| FR-M7.8 | If multiple bubbles would overlap, they stack vertically with 4px gap | Should |
| FR-M7.9 | **Bubble stack capped at 3 (NEW in v2.1, per frontend-dev §6)**: 4th+ bubbles rotate in a carousel (fading in/out) or collapse into a "+N more" overflow indicator. Bubbles never clip through room walls or other sprites | Should |
| FR-M7.10 | **Error bubble manual dismiss (NEW in v2.1, per frontend-dev §8)**: user can click the bubble to dismiss early (for `error_minor` only) | Should |
| FR-M7.11 | Bubbles auto-dismiss 1s after state transition (except `error_critical` which is sticky) | Must |

### M8 — Activity log & observability

| ID | Requirement | Priority |
|---|---|---|
| FR-M8.1 | Plugin keeps a rolling 100-event activity log in memory (state, agentId, tool, timestamp) | Must |
| FR-M8.2 | Expose `GET /activity?limit=50&agentId=<id>` returning recent events | Should |
| FR-M8.3 | Plugin logs to stderr in structured format: `{ ts, level, event, ...fields }` | Must |
| FR-M8.4 | Plugin never logs full message content (privacy + log size) — only tool names, agent IDs, state changes | Must |
| FR-M8.5 | SSE connection count exposed at `/health` | Should |

### M9 — Security & resource bounds

| ID | Requirement | Priority |
|---|---|---|
| FR-M9.1 | Plugin binds to `127.0.0.1` only — `0.0.0.0` is forbidden by a startup check | Must |
| FR-M9.2 | SSE connections are capped (default: 5 concurrent) — excess get 503 | Should |
| FR-M9.3 | Plugin reads Hermes DB read-only — never writes to Hermes state | Must |
| FR-M9.4 | Plugin handles concurrent reads (Hermes may have DB write transaction) without blocking tick loop | Must |
| FR-M9.5 | Plugin memory bounded — agent log capped at 1000 entries, older pruned | Should |
| FR-M9.6 | Plugin CPU bounded — single tick should complete in < 50ms with 20 active agents | Should |

### M10 — Cross-session state persistence (NEW in v2.1, per frontend-dev §M10)

| ID | Requirement | Priority |
|---|---|---|
| FR-M10.1 | Persist last camera position (pan, zoom) to localStorage | Should |
| FR-M10.2 | Persist overlay panel open/closed state to localStorage (also covered by FR-M6.10) | Should |
| FR-M10.3 | Optionally persist last 5 minutes of activity log to localStorage (for debugging across tab close) | Could |
| FR-M10.4 | On tab open, restore camera + panel state from localStorage; if SSE snapshot disagrees, canvas follows the SSE snapshot | Should |

### M11 — Accessibility (NEW in v2.1, per frontend-dev §M11)

| ID | Requirement | Priority |
|---|---|---|
| FR-M11.1 | All overlay cards are focusable (Tab navigation) | Should |
| FR-M11.2 | Speech bubbles have `aria-label` describing state + agent name | Should |
| FR-M11.3 | Keyboard shortcuts: `M` toggle overlay, `R` reset view, `Space` pause/resume real-time updates, arrow keys navigate cards | Should |
| FR-M11.4 | High-contrast mode toggle for users with visual impairments | Could |
| FR-M11.5 | All interactive elements (cards, sub-agent shadows, camera buttons) have visible focus rings | Should |

### M12 — Error boundaries (NEW in v2.1, per frontend-dev §M12)

| ID | Requirement | Priority |
|---|---|---|
| FR-M12.1 | Wrap all SSE handling in a React error boundary | Must |
| FR-M12.2 | On SSE parse error: show toast "Connection error — reconnecting..." and attempt auto-reconnect (already covered by FR-M4.5) | Must |
| FR-M12.3 | Log malformed payloads to console (sanitized, no sensitive data — no message content, only structural fields) | Must |
| FR-M12.4 | Provide "Report issue" button that captures last 10 events + browser/OS metadata for debugging | Should |
| FR-M12.5 | Canvas errors (render loop crash) are caught and trigger a "Canvas crashed — Reload" overlay | Must |

---

## NFR-M (Monitoring Non-Functional Requirements)

| ID | Category | Requirement | Target | Notes |
|---|---|---|---|---|
| NFR-M1 | Performance | Canvas continues to render at 60fps with 6 agents + overlay open | 60fps | |
| NFR-M2 | Latency | End-to-end Hermes activity → canvas pixel change | < 2s | |
| NFR-M3 | Reliability | Plugin runs continuously for 24h without crash/restart | 99% uptime | |
| NFR-M4 | Resilience | Plugin recovers from Hermes DB lock within 1 tick (500ms) | < 1s | |
| NFR-M5 | Resilience | Browser auto-reconnects within 30s of any network blip | < 30s | |
| NFR-M6 | Resource | Plugin RSS memory | < 200MB | |
| NFR-M7 | Resource | Plugin CPU under normal load | < 5% of one core | |
| NFR-M8 | Security | SSE port not reachable from outside the VPS | bind 127.0.0.1 | |
| NFR-M9 | **Card update latency (NEW in v2.1)** | Overlay card DOM update from SSE event | < 500ms | Per frontend-dev AC additions |
| NFR-M10 | **Canvas frame time (NEW in v2.1)** | Canvas render frame time measured in DevTools | < 16ms (60fps) | Per frontend-dev AC additions |

---

## Data Model

### `HermesAgentStatus` (plugin → browser) — v2.1 schema

```typescript
interface HermesAgentStatus {
  // Identity
  agentId: string                // e.g. "frontend-dev"
  profile: string                // e.g. "default" | "frontend-dev"
  sessionId: string | null       // current session, null if no active session
  parentSessionId: string | null // non-null = this is a sub-agent
  parentAgentId: string | null   // convenience: parent agent's agentId

  // State
  state: 'idle' | 'thinking' | 'working' | 'waiting' | 'error' | 'error_critical' | 'bark'
  previousState: HermesAgentStatus['state'] | null
  stateSinceAt: number           // when current state started (unix ms)
  severity: 'minor' | 'critical' | null  // NEW in v2.1, only for error states

  // Activity
  currentTask: string | null     // latest user/assistant task description (truncated 200 chars)
  currentTool: string | null     // active tool name, e.g. "write_file"
  currentToolTarget: string | null // optional: file path / command / etc.
  lastActivityAt: number         // unix ms of last detected activity
  lastMessagePreview: string | null // first 100 chars of last assistant message (no content beyond that)

  // NEW in v2.1: approval request data
  pendingApproval: {
    question: string
    options: string[] | null
    requestedAt: number
  } | null  // non-null when state == 'waiting' AND source is approval_request event

  // Metrics
  toolCallCount: number          // total tool calls in current session
  messageCount: number
  errorCount: number             // errors in current session
  uptimeSeconds: number          // since plugin started tracking this agent
}
```

### SSE event types

| Event | Payload | When |
|---|---|---|
| `state_snapshot` | `{ agents: HermesAgentStatus[], emittedAt: number }` | First event on connect, or full refresh (plugin-side delta tracking decides when to re-snapshot) |
| `agent_update` | `HermesAgentStatus` | One agent's state changed (full object, not patch) |
| `agent_removed` | `{ agentId: string }` | Agent no longer tracked |
| `bark` | `{ fromAgentId, toAgentId, message, at }` | Hermes bark event (FR-M5) |
| `heartbeat` | `{ at: number, connectedClients: number }` | Every 5s |

---

## Integration Points (additive to v1)

| Integration | Type | Direction | Protocol | Notes |
|---|---|---|---|---|
| Hermes state.db | Internal | Read-only | better-sqlite3 | New in v2 (fallback signal) |
| Hermes JSONL sessions | Internal | Read-only | fs.watch + tail | New in v2 (fallback signal) |
| **Hermes event stream** | Internal | Read | Hermes event bus | **NEW in v2.1 — primary signal** |
| Browser | Internal | Outbound | SSE on :3002 | Already in v1 §FR-007 |
| Plugin ↔ Hermes lifecycle | Internal | Lifecycle | Hermes plugin hook (`activate`, `deactivate`) | New in v2 |
| `session_search` (for "Open transcript") | Internal | Outbound | HTTP to Hermes dashboard | New in v2 (FR-M6.5) |
| `localStorage` (browser) | Internal | Read/Write | Web Storage API | New in v2.1 (M10, FR-M6.10) |

---

## Scope split: v2a (core) vs v2b (polish)

Per frontend-dev discussion 2026-06-06, the v2 work is split into two phases:

### v2a — Core monitoring (must have for "monitoring function" claim to be true)

**Target: ~2 weeks of work, blocks the team from claiming "monitoring works"**

- **M0** — Hermes event integration (state_change, approval_request, sub_agent_spawned) — backend-dev
- **M1** — Agent observation (state.db + JSONL fallback) — backend-dev
- **M2** — Sub-agent detection & visualization (shadows, no carousel yet) — backend-dev + frontend-dev
- **M3** — State machine (including severity) — backend-dev
- **M4** — Live SSE pipeline (including FR-M4.11 reconnect UX) — backend-dev + frontend-dev
- **M6 core** — Overlay list with cards + click-to-pan (no detail popover, no transcript link) — frontend-dev
- **M7 core** — Speech bubbles for thinking/working/waiting/error (no carousel, no manual dismiss) — frontend-dev
- **M8** — Activity log — backend-dev
- **M9** — Security & resource bounds — backend-dev + devops
- **M10, M11, M12** — Cross-session persistence, accessibility, error boundaries — frontend-dev (flagged HIGH/MEDIUM by frontend-dev, so they belong in v2a not v2b)

### v2b — Polish

**Target: ~1-2 weeks of work, makes monitoring "delightful" not just "functional"**

- **M5** — Hermes bark logic — frontend-dev (doesn't affect the monitoring function)
- **M6 polish** — Detail popovers, FR-M6.5 "Open transcript" link, FR-M6.9 camera animation
- **M7 polish** — Bubble carousel, FR-M7.10 manual dismiss
- **M11 polish** — High-contrast mode (FR-M11.4)
- **NFR-M9, NFR-M10** — Performance budgets measured in DevTools

---

## Out of Scope (v2)

- Audio cues for state changes (deferred from v1)
- Persisting monitoring state to a database (everything is in-memory; plugin restart = clean slate)
- Multi-VPS / multi-Hermes federation
- Historical analytics / time-series of agent activity
- Custom user-defined state machines
- WebSocket support (SSE is sufficient for the read-only monitoring direction)

---

## Acceptance Criteria (v2a done means…)

1. Plugin runs alongside Hermes on the VPS, binds only to 127.0.0.1:3002, and survives 24h of operation.
2. With 5 agents + 3 sub-agents active simultaneously, the canvas reflects every state change within 2s.
3. The overlay panel correctly lists all 5 agents + any active sub-agents (indented), with live state, current tool, and "Xs ago" timestamps updating every second.
4. Hermes barks at idle agents per the rules in M5 (verified by a manual test scenario) — **v2b AC, not required for v2a**.
5. Sub-agents appear and disappear within 1s of their actual lifecycle.
6. Killing the plugin and restarting it does not crash the web app — the browser reconnects and receives a fresh `state_snapshot`.
7. `curl http://127.0.0.1:3002/health` returns a valid JSON status with all current agents.
8. Browser DevTools shows SSE connection from `localhost:3002` only, never from external IPs.
9. CPU < 5% / memory < 200MB during normal load (6 agents, 1 Hz overlay update).
10. **NFR-M9**: Overlay card DOM updates within 500ms of SSE event (measured via Performance API).
11. **NFR-M10**: Canvas frame time < 16ms during 60fps test (measured in DevTools Performance tab).

---

## Open Questions (v2.1 — answers from frontend-dev review)

| # | Question | Answer (v2.1) |
|---|---|---|
| 1 | JSONL parsing or explicit events? | **Both: explicit events as primary (M0), JSONL as fallback (FR-M0.5)** |
| 2 | Waiting-for-approval detection pattern? | **`approval_request` event (primary) + content heuristics (fallback)** |
| 3 | Delta encoding: plugin or frontend? | **Plugin-side (FR-M4.4); full `HermesAgentStatus` on change, no JSON Patch** |
| 4 | Error severity levels? | **Yes — `error_minor` (auto-clear 10s) + `error_critical` (sticky)** |
| 5 | Real-time accuracy vs performance? | **Accuracy wins at our scale; perf via memoization not via reducing tick freq** |
| 6 | Sub-agent rendering layout? | **Shadows in arc around parent (per frontend-dev §M2.7)** |
| 7 | Camera follow smoothness? | **500ms ease-in-out animation (FR-M6.9)** |
| 8 | Error bubble dismiss UX? | **Auto-clear for minor, sticky for critical + click-to-dismiss (FR-M7.10)** |
| 9 | Should Hermes bark at `waiting` agents? | **No** (per FR-M5.4) |
| 10 | Upper bound on concurrent agents? | **6-15 typical, plugin tested to 20 (FR-M9.6)** |

**No remaining open questions for v2a.** v2b may have follow-ups (e.g. specific bark phrases, bubble carousel animation timing) — defer to v2b planning.

---

## Related Documents

- [v1 PRD (visual scope) →](02-prd.md)
- [Architecture Design →](03-architecture.md) — component breakdown
- [Breakdown & Design →](04-breakdown.md) — module-level design
- [Code Structure →](05-code-structure.md) — current code status
- [Hell Rendering Spec →](HELL-RENDERING-SPEC.md) — visual style
- [Frontend Dev Review Feedback →](07-frontend-dev-review-feedback.md) — review source for v2.1

---

**Status**: v2.1 aligned with frontend-dev. Ready for task breakdown.
**Next step**: Hermes to break v2a into kanban tasks with specializations (frontend-dev / backend-dev / devops / qa-engineer).
