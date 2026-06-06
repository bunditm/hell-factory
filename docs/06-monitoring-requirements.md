---
title: Monitoring Function Requirements (v2)
last_updated: 2026-06-06
status: draft — pending frontend-dev review
extends: 02-prd.md (v1 visual scope)
---

# Hell Factory — Monitoring Function Requirements (v2)

## Why this document exists

The v1 PRD (`02-prd.md`) defined the **visual scope** of Hell Factory: a pixel-art canvas with 4-6 characters sitting in Work Room / Idle Room. The visual layer is built (branch `phase-a-v3-detail` — 5 rooms, real PNG sprites, full Canvas 2D pipeline).

This v2 document defines the **monitoring function** — everything that has to exist *behind* the canvas so the canvas is a faithful, real-time, observable reflection of the Hermes agent team. Without this layer, the canvas is a pretty mockup. With it, the canvas *is* the team's operating dashboard.

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
| **Tick** | One polling cycle of the Hermes plugin (target: every 500ms) |
| **Reconciliation** | Plugin recomputing each agent's current state from the underlying source-of-truth (Hermes state.db + JSONL sessions) |

---

## FR-M (Monitoring Functional Requirements)

### M1 — Agent observation (the heart of monitoring)

The system must be able to answer, for any agent at any tick: *"What is this agent doing right now, with what tool, on what task, and is anyone waiting on it?"*

| ID | Requirement | Priority |
|---|---|---|
| FR-M1.1 | Plugin polls Hermes internal state every 500ms (configurable) | Must |
| FR-M1.2 | Plugin reads `~/.hermes/state.db` (`sessions`, `messages` tables) to detect active/ended sessions, last tool call, last message timestamp | Must |
| FR-M1.3 | Plugin reads active JSONL session files to detect `reasoning_content` (thinking), `tool_calls` (working), and waiting-for-human patterns | Must |
| FR-M1.4 | Plugin handles the 5 main profiles (`hermes`, `frontend-dev`, `backend-dev`, `devops`, `qa-engineer`) | Must |
| FR-M1.5 | Plugin derives a canonical state per agent: `idle`, `thinking`, `working`, `waiting`, `error` (see State Machine below) | Must |
| FR-M1.6 | Plugin survives DB locked / JSONL parse errors — log and continue, never crash the SSE stream | Must |
| FR-M1.7 | Plugin emits a `state_snapshot` SSE event containing the full set of agents on every tick (delta-encoded after first snapshot) | Must |
| FR-M1.8 | Plugin emits an `agent_removed` event when a session ends and the agent is no longer tracked | Must |
| FR-M1.9 | Plugin emits a `heartbeat` event every 5s on the SSE stream so the client can detect dead connections | Should |

### M2 — Sub-agent detection & visualization

The monitoring function must surface the full team, including the transient children that `delegate_task` spawns.

| ID | Requirement | Priority |
|---|---|---|
| FR-M2.1 | Plugin detects sub-agents by reading JSONL session headers (`role: session_meta` with `parent_session_id` set) | Must |
| FR-M2.2 | Plugin links sub-agent to parent via `parentSessionId` and exposes `subAgentOf` field in the agent status | Must |
| FR-M2.3 | Browser renders sub-agent characters as smaller "shadow" sprites positioned near the parent character | Must |
| FR-M2.4 | Sub-agent lifecycle: appears within 1s of spawn, disappears within 1s of completion (no zombie characters) | Must |
| FR-M2.5 | At least 3 concurrent sub-agents must be visible at once (test scenario: hermes delegates 3 tasks simultaneously) | Should |
| FR-M2.6 | A line / dotted connector is drawn from parent to active sub-agents to make the relationship visible at a glance | Could |

### M3 — State machine (canonical)

The canonical state machine that drives the canvas:

| State | Canvas effect | Detected when |
|---|---|---|
| `idle` | Character stands in Idle Room, idle animation, no speech bubble | No active session, OR session exists but no tool/reasoning for >60s |
| `thinking` | Character at work seat, thought-bubble with "..." (2-frame animation) | Active session, last message is `assistant` with `reasoning_content`, no recent tool call in last 3s |
| `working` | Character at work seat, typing animation (2-frame) | Active session, last message is `tool` result within last 3s OR `assistant` with `tool_calls` pending |
| `waiting` | Character at work seat, hourglass speech bubble, Hermes bark suppressed | Last message is a `human` prompt and the last assistant message ended with a question OR explicit "awaiting approval" pattern detected in last message content |
| `error` | Character at work seat, red exclamation speech bubble | Last tool result contains error keyword (configurable list: `Error:`, `Traceback`, `panic:`) AND no recovery within 10s |
| `bark` | Special Hermes-only state: Hermes pulses + shows "DO THE WORK" speech bubble targeting an idle agent | (See M5 — Hermes bark logic) |

Transition rules:
- `working` → `thinking` after 3s without tool call
- `working` → `error` if last tool result has error keyword
- `error` → `thinking` after 10s of healthy activity
- any → `idle` after 60s without any activity
- `idle` → `thinking` within 1s of new session activity

### M4 — Live SSE pipeline

| ID | Requirement | Priority |
|---|---|---|
| FR-M4.1 | Plugin binds SSE server to `127.0.0.1:3002` only (NEVER 0.0.0.0) | Must |
| FR-M4.2 | Endpoint: `GET /events` returns `text/event-stream` with `Cache-Control: no-cache`, `Connection: keep-alive` | Must |
| FR-M4.3 | First event after connect is always a full `state_snapshot` (so a fresh browser load sees the world immediately) | Must |
| FR-M4.4 | Subsequent events are delta-encoded: `agent_update`, `agent_removed`, `state_snapshot` (full) | Must |
| FR-M4.5 | Browser (`sseClient.ts`) auto-reconnects on disconnect with exponential backoff (1s, 2s, 4s, max 30s) | Must |
| FR-M4.6 | Browser applies the first `state_snapshot` to the Zustand store, then deltas | Must |
| FR-M4.7 | SSE → Zustand → `officeState.updateAgent()` → canvas tick — total path latency < 200ms in-process | Should |
| FR-M4.8 | End-to-end latency (Hermes activity → canvas pixel change) < 2s (NFR-M2) | Must |
| FR-M4.9 | Plugin exposes `GET /health` returning `{ status: "ok", agents: [...], uptime_s, last_tick_at }` | Must |
| FR-M4.10 | If plugin crashes, devops watchdog restarts it within 5s | Should |

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
| FR-M6.3 | Clicking a card pans + zooms the canvas to that agent's seat (camera follow) | Should |
| FR-M6.4 | Clicking a card also opens a detail popover with: full current task, recent tool history (last 5), and "Open transcript" link | Should |
| FR-M6.5 | "Open transcript" link opens a new browser tab to the Hermes session transcript URL (session_search link) | Should |
| FR-M6.6 | Panel header shows aggregate counts: `2 working · 1 thinking · 1 idle · 1 error` | Should |
| FR-M6.7 | Card for sub-agents is visually smaller / indented under parent card | Should |
| FR-M6.8 | Panel is keyboard accessible: `M` to toggle, arrow keys to navigate cards | Could |

### M7 — Speech bubbles & visual indicators (in-canvas)

In addition to the overlay, the canvas itself must show readable status signals on each character.

| ID | Requirement | Priority |
|---|---|---|
| FR-M7.1 | `thinking` → small "..." bubble above character (cycles frames every 500ms) | Must |
| FR-M7.2 | `working` → gear icon (small, semi-transparent, above head) | Must |
| FR-M7.3 | `waiting` → hourglass bubble with ⚠ border (high contrast — most important to spot) | Must |
| FR-M7.4 | `error` → red ! bubble, character briefly shakes | Must |
| FR-M7.5 | `bark` (Hermes) → "DO THE WORK" bubble with arrow pointing at target agent | Should |
| FR-M7.6 | All bubbles stay above the character as they walk, follow their position | Must |
| FR-M7.7 | If multiple bubbles would overlap, they stack vertically with 4px gap | Should |
| FR-M7.8 | Bubbles auto-dismiss 1s after state transition | Must |

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

---

## NFR-M (Monitoring Non-Functional Requirements)

| ID | Category | Requirement | Target |
|---|---|---|---|
| NFR-M1 | Performance | Canvas continues to render at 60fps with 6 agents + overlay open | 60fps |
| NFR-M2 | Latency | End-to-end Hermes activity → canvas pixel change | < 2s |
| NFR-M3 | Reliability | Plugin runs continuously for 24h without crash/restart | 99% uptime |
| NFR-M4 | Resilience | Plugin recovers from Hermes DB lock within 1 tick (500ms) | < 1s |
| NFR-M5 | Resilience | Browser auto-reconnects within 30s of any network blip | < 30s |
| NFR-M6 | Resource | Plugin RSS memory | < 200MB |
| NFR-M7 | Resource | Plugin CPU under normal load | < 5% of one core |
| NFR-M8 | Security | SSE port not reachable from outside the VPS | bind 127.0.0.1 |

---

## Data Model

### `HermesAgentStatus` (plugin → browser)

Extends the v1 schema in `03-architecture.md` §Component Breakdown with monitoring additions:

```typescript
interface HermesAgentStatus {
  // Identity
  agentId: string                // e.g. "frontend-dev"
  profile: string                // e.g. "default" | "frontend-dev"
  sessionId: string | null       // current session, null if no active session
  parentSessionId: string | null // non-null = this is a sub-agent
  parentAgentId: string | null   // convenience: parent agent's agentId

  // State
  state: 'idle' | 'thinking' | 'working' | 'waiting' | 'error' | 'bark'
  previousState: HermesAgentStatus['state'] | null  // for transition detection
  stateSinceAt: number           // when current state started (unix ms)

  // Activity
  currentTask: string | null     // latest user/assistant task description (truncated 200 chars)
  currentTool: string | null     // active tool name, e.g. "write_file"
  currentToolTarget: string | null // optional: file path / command / etc.
  lastActivityAt: number         // unix ms of last detected activity
  lastMessagePreview: string | null // first 100 chars of last assistant message (no content beyond that)

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
| `state_snapshot` | `{ agents: HermesAgentStatus[], emittedAt: number }` | First event on connect, or full refresh |
| `agent_update` | `HermesAgentStatus` | One agent's state changed |
| `agent_removed` | `{ agentId: string }` | Agent no longer tracked |
| `bark` | `{ fromAgentId, toAgentId, message, at }` | Hermes bark event (FR-M5) |
| `heartbeat` | `{ at: number, connectedClients: number }` | Every 5s |

---

## Integration Points (additive to v1)

| Integration | Type | Direction | Protocol | Notes |
|---|---|---|---|---|
| Hermes state.db | Internal | Read-only | better-sqlite3 | New in v2 |
| Hermes JSONL sessions | Internal | Read-only | fs.watch + tail | New in v2 |
| Browser | Internal | Outbound | SSE on :3002 | Already in v1 §FR-007 |
| Plugin ↔ Hermes lifecycle | Internal | Lifecycle | Hermes plugin hook (`activate`, `deactivate`) | New in v2 |
| `session_search` (for "Open transcript") | Internal | Outbound | HTTP to Hermes dashboard | New in v2 |

---

## Out of Scope (v2)

- Audio cues for state changes (deferred from v1)
- Persisting monitoring state to a database (everything is in-memory; plugin restart = clean slate)
- Multi-VPS / multi-Hermes federation
- Historical analytics / time-series of agent activity
- Custom user-defined state machines
- WebSocket support (SSE is sufficient for the read-only monitoring direction)

---

## Acceptance Criteria (v2 done means…)

1. Plugin runs alongside Hermes on the VPS, binds only to 127.0.0.1:3002, and survives 24h of operation.
2. With 5 agents + 3 sub-agents active simultaneously, the canvas reflects every state change within 2s.
3. The overlay panel correctly lists all 5 agents + any active sub-agents (indented), with live state, current tool, and "Xs ago" timestamps updating every second.
4. Hermes barks at idle agents per the rules in M5 (verified by a manual test scenario).
5. Sub-agents appear and disappear within 1s of their actual lifecycle.
6. Killing the plugin and restarting it does not crash the web app — the browser reconnects and receives a fresh `state_snapshot`.
7. `curl http://127.0.0.1:3002/health` returns a valid JSON status with all current agents.
8. Browser DevTools shows SSE connection from `localhost:3002` only, never from external IPs.
9. CPU < 5% / memory < 200MB during normal load (6 agents, 1 Hz overlay update).

---

## Open Questions (for frontend-dev review)

1. **State detection accuracy**: Is reading JSONL `reasoning_content` + `tool_calls` + last message timestamp enough to reliably distinguish `thinking` vs `working` vs `waiting`? Or do we need a more reliable signal (e.g. intercept Hermes' own status)?
2. **Waiting-for-approval pattern**: How do we detect "agent is asking human a question and waiting for approval"? Heuristic on last assistant message content? An explicit "approval_request" event from Hermes?
3. **Sub-agent rendering**: Should sub-agents be 50% scale shadows at the parent's feet, or full-size smaller sprites in a designated sub-agent pen in the room? Recommend shadows — keeps parent as visual anchor.
4. **Bark target selection**: When multiple agents are idle, do we bark at the one idle longest, or pick randomly? (Recommend: longest-idle, deterministic).
5. **Overlay panel position**: Right side, left side, or top? Recommend right side — feels like a chat sidebar, doesn't obscure the canvas center.
6. **Overlay persistence**: Should panel open/closed state survive page reload? (Recommend: yes, localStorage).
7. **Hermes bark frequency default**: 5 minutes — is this annoying or right? Need a real-world test.
8. **Error recovery**: When a tool error fires, do we want a "dismiss" button on the canvas bubble, or does it auto-clear after 10s? (Recommend: auto-clear + counter badge in overlay).
9. **Should Hermes ever bark at a `waiting` agent?** My recommendation: no — they already show a bubble. Confirm.
10. **Are 6 agents + 3 sub-agents a reasonable upper bound for v2**, or do we need to plan for 10+ concurrent sub-agents (e.g. for batch jobs)?

---

## Related Documents

- [v1 PRD (visual scope) →](02-prd.md)
- [Architecture Design →](03-architecture.md) — component breakdown
- [Breakdown & Design →](04-breakdown.md) — module-level design
- [Code Structure →](05-code-structure.md) — current code status
- [Hell Rendering Spec →](HELL-RENDERING-SPEC.md) — visual style

---

**Reviewer**: frontend-dev
**Review focus**: validate the 9 monitoring areas, the state machine, the SSE schema, and the 10 open questions above. Push back on anything ambiguous, missing, or over-scoped. We'll iterate on Discord until aligned.
