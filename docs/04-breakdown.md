---
title: Breakdown & Design
last_updated: 2026-06-05
status: draft
---

# Breakdown & Design

## Module Overview

```
hell-factory/
├── src/
│   ├── app/                      # Next.js web app
│   │   ├── page.tsx              # Main entry
│   │   ├── layout.tsx            # Root layout
│   │   ├── components/
│   │   │   └── OfficeCanvas.tsx  # Canvas game component
│   │   ├── engine/
│   │   │   ├── gameLoop.ts       # RAF game loop
│   │   │   ├── officeState.ts    # Office state management
│   │   │   ├── characters.ts     # Character entity + state machine
│   │   │   ├── renderer.ts       # Canvas render pipeline
│   │   │   ├── pathfinding.ts    # BFS pathfinding
│   │   │   ├── sprites.ts        # Character sprite definitions
│   │   │   └── assets.ts         # Furniture/floor sprites
│   │   ├── lib/
│   │   │   └── sseClient.ts      # SSE connection + state sync
│   │   └── stores/
│   │       └── officeStore.ts    # Zustand store
│   └── plugins/
│       └── hell-factory/         # Hermes plugin
│           ├── plugin.ts         # Plugin entry
│           ├── state.ts          # Agent state aggregator
│           ├── sse.ts            # SSE server
│           └── manifest.ts       # Plugin manifest
└── docs/                         # Project wiki
```

---

## Module 1: Hermes Plugin (`src/plugins/hell-factory/`)

### Purpose
Expose Hermes agent status to the web app via SSE.

### Design

**Entry point:** `plugin.ts` — Hermes plugin manifest + lifecycle hooks

**State aggregator:** `state.ts` — polls Hermes memory/profiles for agent status
- Reads from Hermes internal state (memory, active tools, session info)
- Maps each Hermes profile → HermesAgentStatus
- Tracks sub-agents (spawned by Task tool)

**SSE server:** `sse.ts` — Node.js HTTP server on port 3002
- `/events` — SSE stream emitting agent updates every 500ms
- `/health` — Health check endpoint

### Interface

```typescript
// Hermes calls this to register the plugin
export function activate(context: HermesContext) {
  const server = new HellFactoryServer({ port: 3002 })
  context.subscriptions.push(server)
}

// Poll state and emit SSE
function pollState() {
  const agents = aggregator.getAgents()
  for (const agent of agents) {
    server.emit('agent_update', agent)
  }
}
```

### Open Questions
- How does plugin read Hermes state? (Memory API? Profile files? Tool hooks?)
- Does Hermes have a plugin API for this?

---

## Module 2: Game Loop (`src/app/engine/gameLoop.ts`)

### Purpose
Drive the canvas rendering at 60fps using `requestAnimationFrame`.

### Design

Based on agentroom's `gameLoop.ts`:

```typescript
export function startGameLoop(
  canvas: HTMLCanvasElement,
  callbacks: GameLoopCallbacks,
): () => void {
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false  // Critical every frame

  let lastTime = 0
  let rafId = 0

  const frame = (time: number) => {
    const dt = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, 0.1)
    lastTime = time

    callbacks.update(dt)  // Update game state
    ctx.imageSmoothingEnabled = false
    callbacks.render(ctx) // Draw

    rafId = requestAnimationFrame(frame)
  }

  rafId = requestAnimationFrame(frame)
  return () => {
    cancelAnimationFrame(rafId)
  }
}
```

**Key:** `MAX_DELTA_TIME_SEC = 0.1` — caps dt to prevent spiral of death.

---

## Module 3: Office State (`src/app/engine/officeState.ts`)

### Purpose
Manage all entities in the office: characters, furniture, seats, layout.

### Design

Based on agentroom's `OfficeState.ts` (300+ lines). Key responsibilities:

1. **Layout management** — load/save office layout JSON
2. **Seat classification** — work seats (near desks) vs idle seats (couches)
3. **Character management** — add/remove/update characters
4. **Camera** — pan offset, zoom level, optional follow-lerp

```typescript
export class OfficeState {
  layout: OfficeLayout
  characters: Map<string, Character>  // agentId → Character
  seats: Map<string, Seat>           // uid → Seat
  camera: { x: number; y: number; zoom: number }

  addAgent(agentId: string): void
  removeAgent(agentId: string): void
  updateAgent(agentId: string, status: HermesAgentStatus): void
  update(dt: number): void  // Called by game loop
}
```

---

## Module 4: Characters (`src/app/engine/characters.ts`)

### Purpose
Character entity with state machine, movement, and animation.

### Design

Based on agentroom's `characters.ts` (220+ lines).

**Character State Machine:**

```
       ┌─────────────────────────────────────────┐
       │                                         │
       ▼                                         │
   IDLE ────── [becomes active] ────▶ WALK ────▶ TYPE
   ▲   ◀─────── [seat timer expires]             │
   │   ◀─────── [path complete, not active]      │
   └─────────── [type: work seat reached] ────────┘
   ◀─────────── [idle: idle seat reached] ───────┘
```

**States:**
- `IDLE` — Static pose, no animation. Inactive agent at random position.
- `WALK` — 4-frame walk cycle. Moving along BFS path toward seat.
- `TYPE` — 2-frame typing animation (or reading if tool is Read/Grep/etc.)

**Activation model:**
- Agent has work → `isActive = true` → walk to work seat → TYPE animation
- Agent finishes → `seatTimer` (3-5s) → `isActive = false` → walk to idle seat → IDLE

### Movement

```typescript
case CharacterState.WALK: {
  ch.moveProgress += (WALK_SPEED / TILE_SIZE) * dt  // px/sec ÷ tile size

  // Interpolate between tile centers
  const t = Math.min(ch.moveProgress, 1)
  ch.x = lerp(fromX, toX, t)
  ch.y = lerp(fromY, toY, t)

  if (ch.moveProgress >= 1) {
    ch.tileCol = nextTile.col
    ch.tileRow = nextTile.row
    ch.path.shift()
    ch.moveProgress = 0
  }
}
```

---

## Module 5: Renderer (`src/app/engine/renderer.ts`)

### Purpose
Draw everything to canvas in correct order: floor → furniture → characters → UI.

### Design

Based on agentroom's `renderer.ts`.

**Render order (Z-sorting):**
1. Background tiles (tileset GIDs)
2. Floor tiles (colorized)
3. Furniture (sorted by `zY`)
4. Characters (sorted by `y + 0.5` — characters appear in front of furniture at same Y)
5. Room labels ("Working" / "Idling" banners)
6. Selection/hover overlays
7. Editor UI (ghost previews, selection boxes) — in edit mode only

**Draw calls per frame (at zoom=1, 30×22 grid):**
- ~660 floor tiles
- ~20 furniture items
- ~6 characters
- Total: ~700 draw calls (acceptable for Canvas 2D)

---

## Module 6: Pathfinding (`src/app/engine/pathfinding.ts`)

### Purpose
Find walkable path from A to B on grid using BFS.

### Design

Based on agentroom's `tileMap.ts`.

```typescript
export function findPath(
  startCol: number, startRow: number,
  endCol: number, endRow: number,
  tileMap: TileType[][],
  blockedTiles: Set<string>,
): Array<{ col: number; row: number }> {
  // BFS on 4-connected grid (no diagonals)
  // Returns path EXCLUDING start, INCLUDING end
  // Returns [] if no path found
}
```

**Walkable check:**
- Not WALL, not VOID
- Not in `blockedTiles` (furniture)
- Within grid bounds

---

## Module 7: Sprites (`src/app/engine/sprites.ts`)

### Purpose
Define character sprite data as `SpriteData = string[][]`.

### Design

Based on agentroom's `spriteData.ts`.

**Sprite format:**
```typescript
type SpriteData = string[][]  // [row][col], '' = transparent

// Example: 2x2 red pixel
const sprite: SpriteData = [
  ['#FF0000', ''],
  ['#00FF00', '#0000FF'],
]
```

**Character sprite structure:**
```typescript
interface CharacterSprites {
  typing: SpriteData[][]   // [dir][frame] — 4×2
  reading: SpriteData[][] // [dir][frame] — 4×2
  walk: SpriteData[][]    // [dir][frame] — 4×4
}
```

**6 character palettes** (color variation for different agents):
- Palette 0-5: hue-shifted base sprites (0°, 45°, 90°, 135°, 180°, 225°)

---

## Module 8: SSE Client (`src/app/lib/sseClient.ts`)

### Purpose
Connect to Hermes plugin SSE stream and sync state to Zustand store.

### Design

```typescript
export function useSseClient(getOfficeState: () => OfficeState) {
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3002/events')

    eventSource.addEventListener('agent_update', (e) => {
      const status: HermesAgentStatus = JSON.parse(e.data)
      const os = getOfficeState()
      os.updateAgent(status.agentId, status)
    })

    eventSource.addEventListener('agent_removed', (e) => {
      const { agentId } = JSON.parse(e.data)
      const os = getOfficeState()
      os.removeAgent(agentId)
    })

    return () => eventSource.close()
  }, [getOfficeState])
}
```

---

## Module 9: Office Store (`src/app/stores/officeStore.ts`)

### Purpose
Zustand store for React-accessible office state.

### Design

```typescript
interface OfficeStore {
  agents: HermesAgentStatus[]
  selectedAgentId: string | null
  zoom: number
  pan: { x: number; y: number }
  editMode: boolean

  selectAgent: (id: string | null) => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  updateAgentStatus: (status: HermesAgentStatus) => void
}
```

---

## Implementation Sequence

### Step 1: Project Setup
- Initialize Next.js with TypeScript
- Install dependencies: zustand
- Create folder structure

### Step 2: Canvas & Game Loop
- `OfficeCanvas.tsx` component with canvas ref
- `gameLoop.ts` — RAF loop, DPR resize, update/render callbacks
- `renderer.ts` — basic floor tiles (solid color first, sprites later)
- Verify: canvas renders at 60fps with no flicker

### Step 3: Character Sprites
- `sprites.ts` — define typing/walk sprites as SpriteData
- `sprites.ts` — generate 6 palettes via hue shift
- Sprite caching to offscreen canvases
- Verify: 6 colored characters render on canvas

### Step 4: Character State Machine
- `characters.ts` — state transitions: IDLE/WALK/TYPE
- `characters.ts` — movement interpolation
- `officeState.ts` — character management
- Verify: characters animate (type cycle, walk cycle)

### Step 5: BFS Pathfinding
- `pathfinding.ts` — BFS on grid
- Integrate with character movement
- Verify: characters walk from one seat to another

### Step 6: Office Layout
- `assets.ts` — furniture sprites (desk, chair, plant)
- `officeState.ts` — furniture management, seat classification
- Render furniture with Z-sorting
- Work Room / Idle Room split
- Verify: desks in work room, couches in idle room, characters at seats

### Step 7: Hermes Plugin (SSE)
- `src/plugins/hell-factory/` — plugin entry + state aggregator
- `sse.ts` — SSE endpoint on port 3002
- Plugin polls Hermes state every 500ms
- Verify: SSE events received by browser

### Step 8: SSE Client Integration
- `sseClient.ts` — EventSource connection
- `officeStore.ts` — Zustand store
- Connect canvas to store updates
- Verify: canvas updates when agent state changes

### Step 9: Polish
- Room labels ("Working" / "Idling")
- Speech bubbles for waiting state
- Camera pan/zoom controls
- Selection + detail panel

---

## Related Documents

- [Architecture Design →](03-architecture.md)
- [Code Structure →](05-code-structure.md)
- [PRD →](02-prd.md)