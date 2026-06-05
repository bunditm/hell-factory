// Wall tiles — 16x16 each
// Walls are NOT tileable (they have features) — except WALL_STONE which IS tileable.
// WALL_WINDOW/WINDOW_TOP/WINDOW_BOTTOM/DOOR use empty ('') for the cut-out portion.

import { HELL_FIRE } from '../../pixelArt'
import type { SpriteData } from '../../sprites'

const _: string = ''

// === WALL_STONE (16x16, tileable) ===
// Tall stone block with top edge highlight and mortar lines.
// Distinguishing features from TILE_COBBLE: taller blocks (3 rows of 5-6px), denser look,
// light highlight on row 0 (so ceiling line glows).
function makeWallStone(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) {
    const row: string[] = []
    for (let x = 0; x < 16; x++) {
      row.push(HELL_FIRE.stoneDark)
    }
    s.push(row)
  }

  // Block pattern: rows 0-4 (block 1), 5-10 (block 2), 11-15 (block 3)
  // Vertical seams at x=0, 4, 8, 12
  const blockColors = [HELL_FIRE.stoneMid, HELL_FIRE.stoneLite, HELL_FIRE.stoneHigh, HELL_FIRE.stoneMid]
  for (let y = 0; y < 16; y++) {
    const blockRow = y < 5 ? 0 : y < 11 ? 1 : 2
    for (let x = 0; x < 16; x++) {
      // Determine which vertical block we're in
      const blockCol = x < 4 ? 0 : x < 8 ? 1 : x < 12 ? 2 : 3
      // Choose color: vary by position
      const color = blockColors[(blockRow + blockCol) % 4]
      // Top row of each block: highlight
      if (y === 0 || y === 5 || y === 11) {
        s[y][x] = HELL_FIRE.stoneHigh
      } else if (y === 4 || y === 10 || y === 15) {
        s[y][x] = HELL_FIRE.stoneDark
      } else {
        s[y][x] = color
      }
      // Vertical mortar at x=0, 4, 8, 12
      if (x === 0 || x === 4 || x === 8 || x === 12) {
        s[y][x] = HELL_FIRE.stoneDark
      }
    }
  }

  // Top edge highlight (row 0 already stoneHigh, add a stoneEdge row at y=1 for a glint)
  for (let x = 0; x < 16; x++) {
    if (x !== 0 && x !== 4 && x !== 8 && x !== 12) {
      s[1][x] = HELL_FIRE.stoneEdge
    }
  }

  // A couple of crack highlights
  s[2][2] = HELL_FIRE.stoneEdge
  s[7][6] = HELL_FIRE.stoneEdge
  s[7][10] = HELL_FIRE.stoneEdge
  s[12][13] = HELL_FIRE.stoneEdge

  return s
}

// === WALL_WINDOW (16x16, NOT tileable) ===
// Stone wall with rectangular window cutout in rows 4-11, cols 4-11.
// Inside of window is "void" (transparent/dark) — represents glass or interior.
function makeWallWindow(): SpriteData {
  const s = makeWallStone()
  // Cut out the window: rows 4-11, cols 4-11
  for (let y = 4; y <= 11; y++) {
    for (let x = 4; x <= 11; x++) {
      s[y][x] = _
    }
  }
  // Window frame (sill + lintel) — gold/bone trim around the cutout
  // Top frame
  for (let x = 3; x <= 12; x++) s[3][x] = HELL_FIRE.bone
  // Bottom frame
  for (let x = 3; x <= 12; x++) s[12][x] = HELL_FIRE.bone
  // Left frame
  for (let y = 3; y <= 12; y++) s[y][3] = HELL_FIRE.bone
  // Right frame
  for (let y = 3; y <= 12; y++) s[y][12] = HELL_FIRE.bone
  // Highlight on top of frame
  s[3][3] = HELL_FIRE.goldMid
  s[3][12] = HELL_FIRE.goldMid
  // Cross bar (mullion) at vertical center
  s[7][4] = HELL_FIRE.bone
  s[7][5] = HELL_FIRE.bone
  s[7][6] = HELL_FIRE.bone
  s[7][7] = HELL_FIRE.bone
  s[7][8] = HELL_FIRE.bone
  s[7][9] = HELL_FIRE.bone
  s[7][10] = HELL_FIRE.bone
  s[7][11] = HELL_FIRE.bone
  // Cross bar (mullion) at horizontal center
  s[4][7] = HELL_FIRE.bone
  s[5][7] = HELL_FIRE.bone
  s[6][7] = HELL_FIRE.bone
  s[8][7] = HELL_FIRE.bone
  s[9][7] = HELL_FIRE.bone
  s[10][7] = HELL_FIRE.bone
  s[11][7] = HELL_FIRE.bone
  return s
}

// === WALL_WINDOW_TOP (16x16, NOT tileable) ===
// Top half of a 2-tile-tall window — stone wall with frame visible at bottom
function makeWallWindowTop(): SpriteData {
  const s = makeWallStone()
  // Window frame is at the bottom (rows 12-15)
  for (let x = 3; x <= 12; x++) {
    s[12][x] = HELL_FIRE.bone
  }
  for (let y = 12; y <= 15; y++) {
    s[y][3] = HELL_FIRE.bone
    s[y][12] = HELL_FIRE.bone
  }
  // Inner top: dark glass
  for (let y = 13; y <= 15; y++) {
    for (let x = 4; x <= 11; x++) {
      s[y][x] = HELL_FIRE.stoneDark
    }
  }
  // Glint on glass
  s[13][5] = HELL_FIRE.stoneHigh
  s[14][6] = HELL_FIRE.stoneHigh
  return s
}

// === WALL_WINDOW_BOTTOM (16x16, NOT tileable) ===
// Bottom half — frame at top, stone below
function makeWallWindowBottom(): SpriteData {
  const s = makeWallStone()
  // Frame at top (rows 0-3)
  for (let x = 3; x <= 12; x++) s[0][x] = HELL_FIRE.bone
  for (let y = 0; y <= 3; y++) {
    s[y][3] = HELL_FIRE.bone
    s[y][12] = HELL_FIRE.bone
  }
  // Glass
  for (let y = 1; y <= 3; y++) {
    for (let x = 4; x <= 11; x++) {
      s[y][x] = HELL_FIRE.stoneDark
    }
  }
  // Glint
  s[1][9] = HELL_FIRE.stoneHigh
  s[2][10] = HELL_FIRE.stoneHigh
  return s
}

// === WALL_DOOR (16x16, NOT tileable) ===
// Stone wall with arched doorway cutout (rows 5-15, cols 4-11) with arch at top
function makeWallDoor(): SpriteData {
  const s = makeWallStone()
  // Arched doorway cutout
  for (let y = 5; y <= 15; y++) {
    for (let x = 4; x <= 11; x++) {
      s[y][x] = _
    }
  }
  // Arch top: cols 5-10 at y=4, cols 6-9 at y=3
  for (let x = 5; x <= 10; x++) s[4][x] = _
  for (let x = 6; x <= 9; x++) s[3][x] = _

  // Door frame (gold trim)
  // Vertical sides
  for (let y = 4; y <= 15; y++) {
    s[y][3] = HELL_FIRE.goldDark
    s[y][12] = HELL_FIRE.goldDark
  }
  // Arch curve
  for (let x = 4; x <= 11; x++) s[2][x] = HELL_FIRE.goldDark
  s[1][5] = HELL_FIRE.goldDark
  s[1][6] = HELL_FIRE.goldDark
  s[1][7] = HELL_FIRE.goldDark
  s[1][8] = HELL_FIRE.goldDark
  s[1][9] = HELL_FIRE.goldDark
  s[1][10] = HELL_FIRE.goldDark
  // Top keystone
  s[0][7] = HELL_FIRE.goldMid
  s[0][8] = HELL_FIRE.goldMid
  // Inner highlight
  for (let y = 4; y <= 15; y++) {
    s[y][4] = HELL_FIRE.goldMid
    s[y][11] = HELL_FIRE.goldMid
  }
  // Threshold
  for (let x = 3; x <= 12; x++) s[15][x] = HELL_FIRE.goldDark
  return s
}

// === WALL_PILLAR (16x16, NOT tileable, sits flat on wall) ===
// Ornate column with capital, shaft, base. Top-down flat-on-wall style.
function makeWallPillar(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(HELL_FIRE.stoneDark))

  // Capital (rows 0-3) — wider top with gold trim
  s[0] = Array(16).fill(HELL_FIRE.stoneMid)
  s[1] = Array(16).fill(HELL_FIRE.stoneHigh)
  s[2] = Array(16).fill(HELL_FIRE.goldDark)
  s[3] = Array(16).fill(HELL_FIRE.goldMid)
  // Decorative dots on capital
  s[2][2] = HELL_FIRE.goldBright
  s[2][6] = HELL_FIRE.goldBright
  s[2][10] = HELL_FIRE.goldBright
  s[2][13] = HELL_FIRE.goldBright
  s[3][1] = HELL_FIRE.goldBright
  s[3][5] = HELL_FIRE.goldBright
  s[3][11] = HELL_FIRE.goldBright
  s[3][14] = HELL_FIRE.goldBright

  // Shaft (rows 4-11) — narrower column
  for (let y = 4; y <= 11; y++) {
    s[y][0] = HELL_FIRE.stoneDark
    s[y][1] = HELL_FIRE.stoneDark
    s[y][2] = HELL_FIRE.stoneMid
    s[y][3] = HELL_FIRE.stoneLite
    s[y][4] = HELL_FIRE.stoneHigh
    s[y][5] = HELL_FIRE.stoneLite
    s[y][6] = HELL_FIRE.stoneMid
    s[y][7] = HELL_FIRE.stoneLite
    s[y][8] = HELL_FIRE.stoneHigh
    s[y][9] = HELL_FIRE.stoneLite
    s[y][10] = HELL_FIRE.stoneMid
    s[y][11] = HELL_FIRE.stoneLite
    s[y][12] = HELL_FIRE.stoneHigh
    s[y][13] = HELL_FIRE.stoneLite
    s[y][14] = HELL_FIRE.stoneMid
    s[y][15] = HELL_FIRE.stoneDark
  }
  // Vertical fluting shadows every 3rd col
  for (let y = 4; y <= 11; y++) {
    s[y][3] = HELL_FIRE.stoneDark
    s[y][7] = HELL_FIRE.stoneDark
    s[y][11] = HELL_FIRE.stoneDark
  }

  // Base (rows 12-15)
  s[12] = Array(16).fill(HELL_FIRE.goldMid)
  s[13] = Array(16).fill(HELL_FIRE.goldDark)
  s[14] = Array(16).fill(HELL_FIRE.stoneHigh)
  s[15] = Array(16).fill(HELL_FIRE.stoneHigh)
  // Decorative dots on base
  s[12][2] = HELL_FIRE.goldBright
  s[12][6] = HELL_FIRE.goldBright
  s[12][10] = HELL_FIRE.goldBright
  s[12][13] = HELL_FIRE.goldBright

  return s
}

export const WALL_STONE: SpriteData = makeWallStone()
export const WALL_WINDOW: SpriteData = makeWallWindow()
export const WALL_WINDOW_TOP: SpriteData = makeWallWindowTop()
export const WALL_WINDOW_BOTTOM: SpriteData = makeWallWindowBottom()
export const WALL_DOOR: SpriteData = makeWallDoor()
export const WALL_PILLAR: SpriteData = makeWallPillar()
