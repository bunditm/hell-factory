---
title: Code Structure
last_updated: 2026-06-05
status: draft
---

# Code Structure

> This document is updated frequently — whenever code structure changes significantly.

## Directory Tree

```
hell-factory/
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── README.md
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Main entry
│   │   │
│   │   ├── components/
│   │   │   └── OfficeCanvas.tsx      # Canvas game component
│   │   │
│   │   ├── engine/
│   │   │   ├── types.ts              # Shared types (OfficeLayout, Character, etc.)
│   │   │   ├── constants.ts          # Magic numbers (TILE_SIZE, WALK_SPEED, etc.)
│   │   │   ├── gameLoop.ts           # RAF game loop
│   │   │   ├── officeState.ts        # Office state management (characters, seats, furniture)
│   │   │   ├── characters.ts         # Character entity + state machine
│   │   │   ├── renderer.ts           # Canvas render pipeline
│   │   │   ├── pathfinding.ts        # BFS pathfinding
│   │   │   ├── sprites.ts            # Character sprite definitions (SpriteData)
│   │   │   ├── assets.ts             # Furniture/floor sprites
│   │   │   └── layoutUtils.ts        # Layout serialization/deserialization
│   │   │
│   │   ├── lib/
│   │   │   └── sseClient.ts          # SSE connection + event handlers
│   │   │
│   │   └── stores/
│   │       └── officeStore.ts        # Zustand store
│   │
│   └── plugins/                      # Hermes Agent plugins
│       └── hell-factory/
│           ├── manifest.ts           # Plugin manifest (name, version, dependencies)
│           ├── plugin.ts             # Plugin entry point
│           ├── state.ts              # Agent state aggregator
│           ├── sse.ts                # SSE server (port 3002)
│           └── types.ts              # Plugin-specific types
│
├── docs/                             # Project wiki (git-committed)
│   ├── README.md
│   ├── server.js                     # Wiki web server
│   ├── package.json
│   ├── 01-business-case.md
│   ├── 02-prd.md
│   ├── 03-architecture.md
│   ├── 04-breakdown.md
│   └── 05-code-structure.md          # ← You are here
│
└── public/                           # Static assets
    ├── sprites/                      # Character sprite sheets (PNG)
    └── assets/                       # Furniture/floor tiles (PNG or JSON manifest)
```

## Key Files Explained

### `src/app/engine/types.ts`

All shared types. Single source of truth.

```typescript
// Tile system
export const TileType = {
  WALL: 0, FLOOR_1: 1, FLOOR_2: 2, VOID: 8,
} as const

// Character
export const CharacterState = { IDLE: 'idle', WALK: 'walk', TYPE: 'type' } as const
export const Direction = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 } as const

export interface Character {
  id: number
  agentId: string
  state: CharacterState
  dir: Direction
  x: number; y: number
  tileCol: number; tileRow: number
  path: Array<{col: number; row: number}>
  moveProgress: number
  currentTool: string | null
  isActive: boolean
  seatId: string | null
  idleSeatId: string | null
  frame: number
  frameTimer: number
  palette: number
}

export interface OfficeLayout {
  cols: number; rows: number
  tiles: TileType[]
  furniture: PlacedFurniture[]
  tileColors?: FloorColor[]
}

export interface HermesAgentStatus {
  agentId: string
  state: 'idle' | 'thinking' | 'working' | 'waiting' | 'error'
  currentTask?: string
  toolInUse?: string
  startedAt?: number
  subAgentOf?: string
}
```

### `src/app/engine/constants.ts`

All magic numbers centralized.

```typescript
export const TILE_SIZE = 32
export const DEFAULT_COLS = 30
export const DEFAULT_ROWS = 22
export const WALK_SPEED_PX_PER_SEC = 96
export const WALK_FRAME_DURATION_SEC = 0.15
export const TYPE_FRAME_DURATION_SEC = 0.3
export const MAX_DELTA_TIME_SEC = 0.1
export const CHARACTER_Z_SORT_OFFSET = 0.5
export const PALETTE_COUNT = 6
export const ZOOM_MIN = 1; ZOOM_MAX = 10
```

### `src/app/engine/gameLoop.ts`

Simple, ~30 lines. Based on agentroom's gameLoop.ts.

### `src/app/engine/officeState.ts`

Core state container. Based on agentroom's OfficeState.ts (300+ lines).
Manages characters, seats, furniture, camera, update tick.

### `src/app/engine/characters.ts`

Character entity logic. Based on agentroom's characters.ts (220+ lines).
State machine transitions, movement interpolation, animation timing.

### `src/app/engine/renderer.ts`

Draws to canvas. Based on agentroom's renderer.ts.
Renders: floor → furniture → characters (Z-sorted) → room labels → overlays.

### `src/app/engine/pathfinding.ts`

BFS on 4-connected grid. Based on agentroom's tileMap.ts.
~80 lines. Returns path array or empty if no path.

### `src/app/engine/sprites.ts`

Character sprite data as `SpriteData = string[][]`.
Includes 6 palette hue shifts (0°, 45°, 90°, 135°, 180°, 225°).

### `src/app/engine/assets.ts`

Furniture sprites: desk, chair, plant, bookshelf, cooler, couch.
All as `SpriteData` string arrays, upscaled from 16×16 to 32×32.

### `src/app/components/OfficeCanvas.tsx`

React component that:
1. Creates canvas ref
2. Sets up ResizeObserver for DPR-aware sizing
3. Starts game loop via `startGameLoop()`
4. Passes update/render callbacks
5. Handles mouse events (pan, zoom, click-to-select)

### `src/app/stores/officeStore.ts`

Zustand store for React state access.
Holds: agents[], selectedAgentId, zoom, pan, editMode.
Methods: selectAgent, setZoom, setPan, updateAgentStatus.

### `src/app/lib/sseClient.ts`

EventSource connection to Hermes plugin SSE.
Dispatches events to OfficeState.

### `src/plugins/hell-factory/plugin.ts`

Hermes plugin entry point.
- Registers SSE server on port 3002
- Sets up polling interval (500ms)
- Reads Hermes state and emits to SSE clients

## Naming Conventions

| Pattern | Example | Used For |
|---------|---------|----------|
| `camelCase` | `gameLoop`, `officeState` | Files, functions, variables |
| `PascalCase` | `OfficeCanvas`, `CharacterState` | Components, types, enums |
| `SCREAMING_SNAKE` | `TILE_SIZE`, `WALK_SPEED` | Constants |
| `kebab-case` | Not used | Only in package.json name |

## Dependencies

```
src/app/
├── react, react-dom           # UI framework
├── next                      # Web framework
├── zustand                   # State management

src/plugins/hell-factory/
└── node (built-in)           # HTTP server for SSE
```

No external canvas/sprite libraries — pure Canvas 2D API.

## Related Documents

- [Breakdown & Design →](04-breakdown.md)
- [Architecture Design →](03-architecture.md)
- [PRD →](02-prd.md)