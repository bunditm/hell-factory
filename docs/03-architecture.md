---
title: Architecture Design
last_updated: 2026-06-05
status: draft
---

# Architecture Design

## System Overview

Hell Factory consists of two primary components:

1. **Hermes Plugin** — a Node.js plugin inside Hermes Agent that polls agent state and exposes it via an internal HTTP/SSE endpoint
2. **Next.js Web App** — a browser-accessible canvas rendering the virtual office, consuming the plugin's SSE stream

The two communicate over localhost HTTP. No external services, no database — state lives in Hermes memory.

## Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                        VPS (157.254.192.79)                     │
│                                                                 │
│  ┌──────────────────────────┐    ┌──────────────────────────┐  │
│  │   Hermes Agent           │    │   Next.js Web App        │  │
│  │                          │    │   (hell-factory)         │  │
│  │  ┌────────────────────┐  │    │                          │  │
│  │  │  Plugin:           │  │    │  ┌────────────────────┐  │  │
│  │  │  - Poll state      │  │    │  │  OfficeCanvas      │  │  │
│  │  │  - Expose SSE      │──┼────┼─▶│  (Canvas 2D game)   │  │  │
│  │  │                    │  │SSE │  │  │                    │  │  │
│  │  └────────────────────┘  │    │  │  - Game loop        │  │  │
│  │                           │    │  │  - Sprite renderer  │  │  │
│  │  Profiles:               │    │  │  - State machine    │  │  │
│  │  - hermes (dev lead)     │    │  │  - BFS pathfinding  │  │  │
│  │  - frontend-dev          │    │  └────────────────────┘  │  │
│  │  - backend-dev           │    │                          │  │
│  │  - devops                │    │  ┌────────────────────┐  │  │
│  │  - qa-engineer           │    │  │  OfficeLayout       │  │  │
│  │                           │    │  │  - Work Room        │  │  │
│  │                           │    │  │  - Idle Room        │  │  │
│  │                           │    │  │  - Furniture        │  │  │
│  │                           │    │  └────────────────────┘  │  │
│  └──────────────────────────┘    └──────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Nginx (:9443/hell-factory → :3001)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    Browser (human)
```

## Tech Stack

| Layer | Technology | Version | Why |
|---|---|---|---|
| Web Framework | Next.js | 15 | SSR/SSG support, API routes, React 19 |
| Language | TypeScript | 5 | Type safety, better DX |
| Styling | Tailwind CSS | 4 | Utility-first, matches GCS NG stack |
| Canvas Rendering | HTML5 Canvas 2D | — | Pixel-perfect, no WebGL complexity |
| Real-time | Server-Sent Events (SSE) | — | Simpler than WebSocket, Hermes→Browser |
| State Management | Zustand | 5 | Lightweight, React hooks integration |
| Package Manager | npm | — | |
| Deployment | VPS + Nginx | — | Same host as Hermes |

## Component Breakdown

### Hermes Plugin (`/src/plugins/hell-factory/`)

**Purpose:** Bridge between Hermes internal state and the web app.

**Responsibilities:**
- Poll Hermes for agent status every 500ms
- Aggregate profiles: frontend-dev, backend-dev, devops, qa-engineer, hermes
- Expose SSE endpoint at `localhost:PLUGIN_PORT/events`
- Handle sub-agent tracking (spawned by Task tool)

**Key Files:**
- `src/plugins/hell-factory/plugin.ts` — Main plugin entry
- `src/plugins/hell-factory/state.ts` — Agent state aggregator
- `src/plugins/hell-factory/sse.ts` — SSE endpoint handler

**Agent Status Schema:**
```typescript
interface HermesAgentStatus {
  agentId: string        // e.g., "frontend-dev"
  profile: string
  state: 'idle' | 'thinking' | 'working' | 'waiting' | 'error'
  currentTask?: string  // e.g., "Implement login API"
  toolInUse?: string    // e.g., "delegate_task", "write_file"
  startedAt?: number    // Unix timestamp
  lastMessage?: string
  subAgentOf?: string   // Parent agent if spawned
}
```

### Next.js Web App (`/src/app/`)

**Purpose:** Browser-accessible virtual office canvas.

**Responsibilities:**
- Connect to Hermes plugin SSE stream
- Update office state from incoming events
- Render canvas at 60fps (game loop via `requestAnimationFrame`)
- Handle user interactions (zoom, pan, character selection)

**Key Files:**
- `src/app/page.tsx` — Main page (entry point)
- `src/app/components/OfficeCanvas.tsx` — Canvas game component
- `src/app/engine/gameLoop.ts` — RAF game loop
- `src/app/engine/officeState.ts` — Office state management
- `src/app/engine/characters.ts` — Character state machine
- `src/app/engine/renderer.ts` — Canvas render pipeline
- `src/app/engine/pathfinding.ts` — BFS pathfinding
- `src/app/engine/sprites.ts` — Sprite definitions
- `src/app/engine/assets.ts` — Furniture/floor sprite data
- `src/app/lib/sseClient.ts` — SSE connection management

### Office Engine (`/src/app/engine/`)

**Core modules:**
- `gameLoop.ts` — `requestAnimationFrame` loop, delta time capping
- `officeState.ts` — Manages characters, seats, furniture, layout
- `characters.ts` — Character entity: state machine, movement, animation
- `renderer.ts` — Draws: floor → furniture → characters → UI
- `pathfinding.ts` — BFS on 4-connected grid
- `sprites.ts` — Character sprite data (typing, reading, walk cycles)
- `assets.ts` — Furniture/floor sprites as `SpriteData` string arrays

## Data Flow

```
Hermes Agent (internal state)
  → Plugin polls every 500ms
  → SSE endpoint emits: { type: 'agent_update', data: HermesAgentStatus }
  → Browser EventSource receives event
  → useSseClient hook updates Zustand store
  → OfficeCanvas re-renders via React state
  → Character positions update, animations play
```

## API Design

### SSE Endpoint (Hermes Plugin → Web App)

```
GET http://localhost:3002/events

Headers:
  Content-Type: text/event-stream
  Cache-Control: no-cache

Event format:
event: agent_update
data: {"agentId":"frontend-dev","state":"working","toolInUse":"write_file",...}

event: agent_removed
data: {"agentId":"frontend-dev"}

event: heartbeat
data: {"timestamp":1700000000}
```

### Hermes Plugin Health Check

```
GET http://localhost:3002/health

Response: {"status":"ok","connectedAgents":["frontend-dev","backend-dev"]}
```

## Data Model

### OfficeLayout

```typescript
interface OfficeLayout {
  cols: number      // Grid width (default: 30)
  rows: number      // Grid height (default: 22)
  tiles: TileType[] // Flat array [row * cols + col]
  furniture: PlacedFurniture[]
  tileColors?: FloorColor[]
}

interface PlacedFurniture {
  uid: string
  type: FurnitureType  // 'desk' | 'chair' | 'plant' | etc.
  col: number
  row: number
}

interface Character {
  id: number
  agentId: string
  state: 'idle' | 'walk' | 'type'
  dir: 0 | 1 | 2 | 3  // DOWN, LEFT, RIGHT, UP
  x: number           // Pixel position
  y: number
  tileCol: number
  tileRow: number
  path: Array<{col, row}>  // BFS path
  moveProgress: number     // 0-1 lerp between tiles
  currentTool: string | null
  isActive: boolean
  seatId: string | null
  idleSeatId: string | null
  frame: number           // Animation frame
}
```

## Integration Points

| Integration | Type | Direction | Protocol |
|---|---|---|---|
| Hermes Agent | Internal | Inbound | Plugin polls Hermes memory/API |
| Browser | Internal | Outbound | SSE via localhost HTTP |
| Nginx | Internal | Reverse Proxy | HTTP on port 9443 |

## Deployment Architecture

```
GitHub (hell-factory repo)
  → git push
  → VPS pull + npm install + npm run build
  → PM2/systemd manages Next.js process on port 3001
  → Nginx routes :9443/hell-factory → :3001
  → Browser → https://157.254.192.79/hell-factory
```

**Ports:**
| Port | Service | Notes |
|---|---|---|
| 3001 | Next.js | localhost only |
| 3002 | Hermes Plugin | localhost only (SSE endpoint) |
| 9443 | Nginx | Public HTTPS, routes /hell-factory |

## Security Considerations

- **Access:** Internal VPS only, no auth needed (already behind VPN/firewall)
- **Hermes Plugin:** Exposes agent status only, no write access
- **SSE:** No authentication (assumes localhost only access)
- **No database:** All state is ephemeral (Hermes memory + browser)

## Architecture Decision Records

### ADR-001: SSE over WebSocket
- **Date:** 2026-06-05
- **Status:** Accepted
- **Context:** Need real-time updates from Hermes to browser. WebSocket is more complex (reconnection, backpressure). SSE is simpler and sufficient for one-way agent status flow.
- **Decision:** Use SSE for v1. Upgrade to WebSocket if bidirectional communication needed later.
- **Consequences:** Simpler implementation, works with Next.js API routes, but browser must reconnect if connection drops.

### ADR-002: Canvas 2D over WebGL/Three.js
- **Date:** 2026-06-05
- **Status:** Accepted
- **Context:** Both pixel-agents and agentroom use Canvas 2D. It's simpler, more portable, and pixel-perfect at integer zoom. No need for 3D.
- **Decision:** Canvas 2D with `imageSmoothingEnabled = false`.
- **Consequences:** Limited to 2D rendering, but fits the pixel art aesthetic perfectly.

### ADR-003: Sprite data in TypeScript (not external files)
- **Date:** 2026-06-05
- **Status:** Accepted
- **Context:** agentroom defines sprites as `SpriteData = string[][]` directly in TypeScript files. Simpler than loading external PNGs at startup.
- **Decision:** Define sprites inline as string arrays, pre-cache to offscreen canvases.
- **Consequences:** Faster startup (no image loading), easier to colorize at runtime.

## Related Documents

- [PRD →](02-prd.md)
- [Breakdown & Design →](04-breakdown.md)
- [Code Structure →](05-code-structure.md)