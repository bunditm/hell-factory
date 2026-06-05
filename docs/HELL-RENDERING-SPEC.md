---
title: Hell Factory — Rendering & Visual Specification
last_updated: 2026-06-05
status: draft
tags: [rendering, sprites, palette, animation]
---

# Hell Factory — Rendering & Visual Specification

This document covers the **visual layer** of Hell Factory: Canvas 2D rendering, pixel-art sprites, color palette, animations, and atmosphere. It complements the [PRD](./02-prd.md) (user-facing features) and [Architecture](./03-architecture.md) (system design).

---

## 1. Visual Theme: "Hell Office"

Hell Factory's aesthetic is **industrial inferno** — a rundown office building that happens to be in Hell. Not cartoon fire, not fantasy lava: grime, fire, concrete, and fluorescent lights.

| Element | Treatment |
|---|---|
| **Palette** | Black, dark reds, oranges, yellows — HIRE_FIRE palette |
| **Agents** | Pixel-art humanoid sprites (32×48 native), per-profile hue shift |
| **Rooms** | Work Room (warmer, active lighting), Idle Room (cooler, dim), Hell's Lounge (lounge lighting) |
| **Furniture** | Simple geometric desks, chairs, plants — dark with warm accent lighting |
| **Atmosphere** | Lava glow from floor vents, subtle ember particles, flickering torch light |
| **Typography** | Pixel-perfect labels, `monospace` for status text |

---

## 2. HELL_FIRE Color Palette

16 colors. Used for all rendered elements.

```typescript
const HELL_FIRE = {
  VOID:   '#0a0000',  // deepest black-red (background void)
  ABYSS:  '#1a0404',  // volcanic rock / shadow
  ROCK:   '#2e0a0a',  // dark stone / walls
  CHAR:   '#4a1010',  // charred surfaces
  DARK:   '#6b1c1c',  // shadowed red
  CRIMSON:'#8b2222',  // blood red
  BLOOD:  '#aa2222',  // blood
  FIRE_D: '#cc2a1a',  // dark orange-red
  FIRE:   '#ee3311',  // bright fire red
  FLAME:  '#ff4400',  // orange flame
  LAVA:   '#ff6600',  // molten orange
  SURGE:  '#ff8800',  // lava surge / highlight
  GLOW:   '#ffaa00',  // amber glow
  EMBER:  '#ffcc00',  // yellow ember
  BRIGHT: '#ffee44',  // bright yellow
  WHITE:  '#ffffaa',  // white-hot center
}
```

### Palette Usage
| Color | Usage |
|---|---|
| `VOID` | Canvas background |
| `ABYSS` | Volcano rock, deep shadows |
| `ROCK` | Walls, dividers, desk frames |
| `CHAR` | Charred furniture edges |
| `DARK`–`CRIMSON` | Agent body/hair (hue-shifted per palette) |
| `FIRE`–`LAVA` | Active/lava elements |
| `SURGE`–`WHITE` | Highlights, lava pools, glow effects |

---

## 3. Agent Sprites

### Dimensions
- **Native**: 32 columns × 48 rows per frame (TILE_SIZE=32 wide, character is 1.5 tiles tall)
- **Rendered**: 32 × 48 canvas pixels at 1× zoom

### SpriteData Format
```typescript
type SpriteData = string[][]  // [row][col], '' = transparent
```

Each cell is a hex color string from `HELL_FIRE`.

### Agent Color Palettes (6 profiles)

Each agent is assigned one of 6 palettes by shifting the hue of the CRIMSON→DARK range:

```typescript
const AGENT_PALETTES = [
  { name: 'hermes',      primary: '#ff4400', secondary: '#ffcc00' }, // red-orange
  { name: 'frontend',    primary: '#8b2222', secondary: '#ff6600' }, // dark red
  { name: 'backend',     primary: '#cc2a1a', secondary: '#ff4400' }, // orange-red
  { name: 'devops',      primary: '#aa2222', secondary: '#ff8800' }, // blood-surge
  { name: 'qa',          primary: '#ee3311', secondary: '#ffaa00' }, // fire-glow
  { name: 'hermes-lead', primary: '#ff4400', secondary: '#ffee44' }, // flame-bright
]
```

### Sprite States

| State | Frames | Animation |
|---|---|---|
| `idle` | 1 | Static at seat, subtle bob (sin wave, 1Hz, ±2px vertical) |
| `walk` | 4 | 4-frame walk cycle (15fps) — only during pathfinding |
| `type` | 2 | 2-frame typing animation (30fps) — when `currentTool !== null` |

### State → Sprite Mapping

```typescript
function getSprite(state: CharacterState, frame: number): SpriteData {
  if (state === 'idle') return SPRITES.idle
  if (state === 'type') return SPRITES.type[frame % 2]
  return SPRITES.walk[frame % 4]  // walk
}
```

---

## 4. Furniture Sprites

Furniture is drawn from `assets.ts` as `SpriteData`. All furniture is 32×32.

| Type | Sprite Style |
|---|---|
| `desk` | Dark rock rectangle, `CHAR` edges, warm top highlight |
| `chair` | Simple geometric, same palette as desk |
| `plant` | Dark silhouette with ember-glow top |
| `bookshelf` | `ROCK` shelves with small accent details |
| `cooler` | Water cooler silhouette |
| `couch` | Wide, low, dark red |

---

## 5. Office Layout

### Grid
- **Tiles**: 30 cols × 22 rows (DEFAULT_COLS, DEFAULT_ROWS)
- **Tile size**: 32px
- **World size**: 960 × 704 logical pixels

### Room Zones (logical, not tile-enforced)

```
┌─────────────────────────────────────────────────────┐
│           WORK ROOM          │     IDLE ROOM       │  ← top row
│     (agents working)          │   (agents idle)     │
│     cols 0–13                 │   cols 14–29        │
├───────────────────────────────┴─────────────────────┤
│                  HELL'S LOUNGE                       │  ← bottom row
│              (break / waiting agents)                │
└─────────────────────────────────────────────────────┘
```

### Rooms Config
```typescript
const ROOMS = [
  { id: 'work', name: 'WORKING',  colStart: 0,  colEnd: 13, rowStart: 0, rowEnd: 8  },
  { id: 'idle', name: 'IDLING',   colStart: 14, colEnd: 29, rowStart: 0, rowEnd: 8  },
  { id: 'lounge', name: "HELL'S LOUNGE", colStart: 0, colEnd: 29, rowStart: 9, rowEnd: 21 },
]
```

### Seat Slots
- **Work Room**: 6 seats (2 rows × 3 cols)
- **Idle Room**: 6 seats (2 rows × 3 cols)
- **Lounge**: 4 seats (informal, around a `couch`)

---

## 6. Rendering Pipeline

Each frame (RAF, ~60fps):

```
1. ctx.clearRect(0, 0, W, H)
2. Draw VOID background fill
3. Draw floor tiles (TILE_SIZE grid, room-specific colors)
4. Draw furniture sprites
5. Sort characters by (tileRow + Z_SORT_OFFSET) — Z-sort
6. Draw each character sprite at interpolated (x, y)
7. Draw speech/action bubbles above characters
8. Draw room label banners
9. Draw lava glow overlay (additive blend on floor tiles near lava sources)
10. ctx.restore()
```

### Offset Calculation
```typescript
const mapW = COLS * TILE_SIZE * zoom
const mapH = ROWS * TILE_SIZE * zoom
const offsetX = (canvasWidth - mapW) / 2 + panX
const offsetY = (canvasHeight - mapH) / 2 + panY
```

### Z-Sort
```typescript
const zSorted = [...characters].sort((a, b) =>
  (a.tileRow + CHARACTER_Z_SORT_OFFSET) - (b.tileRow + CHARACTER_Z_SORT_OFFSET)
)
```

---

## 7. Animations

### Agent Idle Bob
```typescript
const bob = Math.sin(time * 1 + index) * 2  // ±2px at 1Hz
drawSprite(ctx, sprite, x, y + bob, zoom)
```

### Agent Angry Shake (idle + no work queued)
```typescript
const shake = Math.sin(time * 10 + index * 3) * 2  // ±2px at ~1.6Hz
drawSprite(ctx, sprite, x + shake, y, zoom)
```

### Hermes Bark Pulse (when `hermesActive`)
```typescript
const pulse = (Math.sin(time * 8) + 1) / 2  // 0→1 at 8Hz
ctx.globalAlpha = 0.5 + pulse * 0.5
drawSprite(ctx, hermesSprite, x, y, zoom)
drawBubble(ctx, x + 32, y - 16, zoom, 'bark')
ctx.globalAlpha = 1
```

### Lava Glow (floor tiles)
```typescript
// Draw additive gradient on floor tiles in bottom rows
ctx.globalCompositeOperation = 'lighter'
const grad = ctx.createRadialGradient(floorX, floorY, 0, floorX, floorY, TILE_SIZE * 2)
grad.addColorStop(0, 'rgba(255, 102, 0, 0.3)')
grad.addColorStop(1, 'transparent')
ctx.fillStyle = grad
ctx.fillRect(floorX - TILE_SIZE, floorY - TILE_SIZE, TILE_SIZE * 4, TILE_SIZE * 4)
ctx.globalCompositeOperation = 'source-over'
```

### Lava Pools (3 fixed locations in Lounge)
```typescript
const wave = Math.sin(time * 1.2 + poolIndex * 1.3)
const grad = ctx.createRadialGradient(
  poolX + Math.cos(time * 0.8) * 4,
  poolY + Math.sin(time * 0.8) * 4,
  0,
  poolX, poolY,
  poolRadius,
)
grad.addColorStop(0, HELL_FIRE.WHITE)
grad.addColorStop(0.2, HELL_FIRE.EMBER)
grad.addColorStop(0.6, HELL_FIRE.LAVA)
grad.addColorStop(1, HELL_FIRE.FIRE_D)
ctx.fillStyle = grad
ctx.fillEllipse(poolX - poolRadius, poolY - poolRadius, poolRadius * 2, poolRadius * 2)
```

---

## 8. Speech & Action Bubbles

Drawn above character sprites using `drawBubble()`.

| Trigger | Bubble Type | Content |
|---|---|---|
| `state === 'type'` | Work bubble | Gear/cog icon (simple geometric) |
| `agent.waitingApproval` | Wait bubble | Hourglass icon |
| `hermesActive` | Bark bubble | Exclamation mark |
| `agent.speaking` | Speech bubble | 3 dots |

### Bubble Drawing
```typescript
function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  scale: number,
  type: 'work' | 'wait' | 'bark' | 'speech',
) {
  const px = TILE_SIZE * scale
  const bw = 7 * px  // bubble width
  const bh = 4 * px  // bubble height
  ctx.fillStyle = '#fffffe'  // off-white
  ctx.fillRect(x - bw / 2, y - bh, bw, bh)
  // tail pointing to character
  ctx.fillRect(x - px, y - bh - px, px * 2, px * 2)
  // icon inside (type-specific)
}
```

---

## 9. Camera & Viewport

### Pan
- **Middle-mouse drag**: `panRef.current.x/y` updated, clamped via `clampPan()`
- **Initial**: centered on map (`clampPan(0, 0)`)

### Zoom
- **Scroll wheel**: accumulator pattern (50px threshold → step zoom ±1)
- **Range**: 1× – 10× (`ZOOM_MIN=1`, `ZOOM_MAX=10`)
- **Default**: 2×

### Clamp Pan Formula
```typescript
const mapW = COLS * TILE_SIZE * zoom
const mapH = ROWS * TILE_SIZE * zoom
const maxPanX = (mapW / 2) + canvas.width / 2 - marginX
const maxPanY = (mapH / 2) + canvas.height / 2 - marginY
```

---

## 10. Known Rendering Issues

| Issue | Severity | Status |
|---|---|---|
| Placeholder sprite (32×32 gray rect) in `sprites.ts:84` | High | 🔴 Not started |
| No BFS pathfinding wired to character movement | High | 🔴 Not started |
| `officeState.ts` file missing from engine | High | 🔴 Not started |
| `characters.ts` file missing from engine | High | 🔴 Not started |
| `pathfinding.ts` missing from engine | Medium | 🟡 Not started |
| Lava glow uses `globalCompositeOperation='lighter'` — verify browser support | Low | 🟡 Verify |
| DPR sizing via `ResizeObserver` — verify correct on HiDPI | Low | 🟡 Verify |

---

## 11. Related Documents

- [PRD (user-facing requirements) →](./02-prd.md)
- [Architecture (system design) →](./03-architecture.md)
- [Code Structure (file inventory) →](./05-code-structure.md)
