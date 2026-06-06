// Floor tiles — 16x16 each, all tileable on horizontal/vertical edges
// HELL_FIRE palette: stoneDark/Mid/Lite/High/Edge for stone, bark* for wood, red* for red carpet, cloth* for blue/purple

import { HELL_FIRE } from '../../pixelArt'
import type { SpriteData } from '../../sprites'

const _: string = ''

// === WOOD_PLANKS (16x16, tileable) ===
// Horizontal planks with varied widths (3-5px), grain lines, dark knots.
// Pattern is symmetric left-right: plank seams at columns 0, 5, 9, 13 (repeating with period 16).
// To stay tileable: seam positions must match at x=0 and x=16 (they do, since the seam at 0 == seam at 16).
// Plank heights: rows 0-4, 5-8, 9-12, 13-15 (one is 3px to break the pattern).
function makeWoodPlanks(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Plank seams (vertical lines) at columns 5, 9, 13
  // Horizontal seam pattern: rows 0-4 (plank 1), 5-8 (plank 2), 9-12 (plank 3), 13-15 (plank 4)
  // Each plank has slight color variation
  const plankBaseColors = [HELL_FIRE.barkDark, HELL_FIRE.cloth, HELL_FIRE.barkMid, HELL_FIRE.clothLite]
  // planks from y bands: band 0 = y 0-4, 1 = y 5-8, 2 = y 9-12, 3 = y 13-15
  for (let y = 0; y < 16; y++) {
    const band = y < 5 ? 0 : y < 9 ? 1 : y < 13 ? 2 : 3
    const baseColor = plankBaseColors[band]
    for (let x = 0; x < 16; x++) {
      s[y][x] = baseColor
      // Vertical seam: dark line
      if (x === 5 || x === 9 || x === 13) {
        s[y][x] = HELL_FIRE.black
      }
      // Horizontal seam at row 5, 9, 13: darker line
      if (y === 5 || y === 9 || y === 13) {
        s[y][x] = HELL_FIRE.black
      }
      // Top-of-plank highlight (row 0, 6, 10)
      if (y === 0 || y === 6 || y === 10) {
        if (x !== 5 && x !== 9 && x !== 13) {
          s[y][x] = HELL_FIRE.barkMid
        }
      }
    }
  }

  // Grain lines (horizontal striations within each plank)
  // Use 1-pixel alternating colors that follow the plank bands
  const grain = [
    // band 0 (y 0-4): y=2 is mid grain
    { y: 2, xStart: 0, xEnd: 4, color: HELL_FIRE.barkMid },
    { y: 2, xStart: 6, xEnd: 8, color: HELL_FIRE.barkMid },
    { y: 2, xStart: 10, xEnd: 12, color: HELL_FIRE.barkMid },
    { y: 2, xStart: 14, xEnd: 15, color: HELL_FIRE.barkMid },
    { y: 3, xStart: 0, xEnd: 4, color: HELL_FIRE.barkDark },
    { y: 3, xStart: 6, xEnd: 8, color: HELL_FIRE.barkDark },
    { y: 3, xStart: 10, xEnd: 12, color: HELL_FIRE.barkDark },
    { y: 3, xStart: 14, xEnd: 15, color: HELL_FIRE.barkDark },
    // band 1 (y 5-8)
    { y: 7, xStart: 0, xEnd: 4, color: HELL_FIRE.clothLite },
    { y: 7, xStart: 6, xEnd: 8, color: HELL_FIRE.clothLite },
    { y: 7, xStart: 10, xEnd: 12, color: HELL_FIRE.clothLite },
    { y: 7, xStart: 14, xEnd: 15, color: HELL_FIRE.clothLite },
    // band 2 (y 9-12)
    { y: 11, xStart: 0, xEnd: 4, color: HELL_FIRE.barkDark },
    { y: 11, xStart: 6, xEnd: 8, color: HELL_FIRE.barkDark },
    { y: 11, xStart: 10, xEnd: 12, color: HELL_FIRE.barkDark },
    { y: 11, xStart: 14, xEnd: 15, color: HELL_FIRE.barkDark },
    // band 3 (y 13-15)
    { y: 14, xStart: 0, xEnd: 4, color: HELL_FIRE.barkMid },
    { y: 14, xStart: 6, xEnd: 8, color: HELL_FIRE.barkMid },
    { y: 14, xStart: 10, xEnd: 12, color: HELL_FIRE.barkMid },
    { y: 14, xStart: 14, xEnd: 15, color: HELL_FIRE.barkMid },
  ]
  for (const g of grain) {
    for (let x = g.xStart; x <= g.xEnd; x++) {
      s[g.y][x] = g.color
    }
  }

  // Knots: a couple of darker ovals, placed in plank centers
  // Knot 1 in plank (y 0-4, x 0-4) at approx (2, 1)
  s[1][2] = HELL_FIRE.black
  s[1][3] = HELL_FIRE.black
  s[2][2] = HELL_FIRE.barkDark
  s[2][3] = HELL_FIRE.black
  // Knot 2 in plank (y 9-12, x 6-8) at approx (7, 10)
  s[10][7] = HELL_FIRE.black
  s[11][6] = HELL_FIRE.barkDark
  s[11][7] = HELL_FIRE.black
  s[11][8] = HELL_FIRE.barkDark

  return s
}

// === STONE_TILE (16x16, tileable) ===
// Uniform square stone tiles with regular mortar grid.
// Unlike TILE_COBBLE which has offset 8x4 bricks, this is a regular 8x8 grid of square tiles
// (i.e., one horizontal and one vertical mortar line, perfectly aligned with the tile edges).
// Pattern: mortar at column 0, 8 and row 0, 8 — both edges match seamlessly.
function makeStoneTile(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) {
    const row: string[] = []
    for (let x = 0; x < 16; x++) {
      row.push(HELL_FIRE.stoneMid)
    }
    s.push(row)
  }

  // Mortar: 1px wide lines at column 0, 8 and row 0, 8
  // To stay tileable, the mortar pixels at x=0 and x=15 (and y=0, y=15) must be the same color.
  // We do that by using a shared dark color on the seam columns/rows.
  const mortar = HELL_FIRE.stoneDark

  // Vertical mortar at x=0, x=8 — note x=0 is seam with the tile to the left, so its color must match x=15's edge.
  // Both edges use stoneDark so the seam between tiles is continuous.
  for (let y = 0; y < 16; y++) {
    s[y][0] = mortar
    s[y][8] = mortar
  }
  // Horizontal mortar at y=0, y=8
  for (let x = 0; x < 16; x++) {
    s[0][x] = mortar
    s[8][x] = mortar
  }
  // Corner intersections darker still
  s[0][0] = HELL_FIRE.black
  s[0][8] = HELL_FIRE.black
  s[8][0] = HELL_FIRE.black
  s[8][8] = HELL_FIRE.black

  // Inside each quadrant (8x8 of tile, minus 1px mortar border), add subtle variation:
  // Quadrant 1: y 1-7, x 1-7
  // Quadrant 2: y 1-7, x 9-15
  // Quadrant 3: y 9-15, x 1-7
  // Quadrant 4: y 9-15, x 9-15
  const quadrantShades: Array<Array<string>> = [
    [HELL_FIRE.stoneMid, HELL_FIRE.stoneLite, HELL_FIRE.stoneMid, HELL_FIRE.stoneHigh, HELL_FIRE.stoneMid, HELL_FIRE.stoneLite, HELL_FIRE.stoneMid],
    [HELL_FIRE.stoneLite, HELL_FIRE.stoneMid, HELL_FIRE.stoneHigh, HELL_FIRE.stoneMid, HELL_FIRE.stoneLite, HELL_FIRE.stoneMid, HELL_FIRE.stoneHigh],
    [HELL_FIRE.stoneMid, HELL_FIRE.stoneHigh, HELL_FIRE.stoneLite, HELL_FIRE.stoneMid, HELL_FIRE.stoneHigh, HELL_FIRE.stoneLite, HELL_FIRE.stoneMid],
    [HELL_FIRE.stoneLite, HELL_FIRE.stoneMid, HELL_FIRE.stoneHigh, HELL_FIRE.stoneLite, HELL_FIRE.stoneMid, HELL_FIRE.stoneHigh, HELL_FIRE.stoneLite],
  ]

  // Place quadrant variations (use a noise-like pattern for natural look)
  // Make sure edges (x=1 and x=15) are the same — use same color for both edges of each quadrant
  // Actually we need edges to match: row 1, 7, 9, 15 of each column and column 1, 7, 9, 15 of each row
  // So the function used must be wrap-around: f(x,y) = f(15-x, y) etc. We use simple position-based.
  for (let y = 1; y < 8; y++) {
    for (let x = 1; x < 8; x++) {
      // Quadrant 1 — symmetric
      const a = quadrantShades[(x + y) % 4][(x * 3 + y) % 7]
      s[y][x] = a
      // Quadrant 2 — mirror x
      const ax = quadrantShades[(x + y + 1) % 4][((7 - x) * 3 + y) % 7]
      s[y][x + 8] = ax
      // Quadrant 3 — mirror y
      const ay = quadrantShades[(x + y + 2) % 4][(x * 3 + (7 - y)) % 7]
      s[y + 8][x] = ay
      // Quadrant 4 — mirror both
      const axy = quadrantShades[(x + y + 3) % 4][((7 - x) * 3 + (7 - y)) % 7]
      s[y + 8][x + 8] = axy
    }
  }

  // Add a few edge highlights
  s[1][1] = HELL_FIRE.stoneEdge
  s[1][9] = HELL_FIRE.stoneEdge
  s[9][1] = HELL_FIRE.stoneEdge
  s[9][9] = HELL_FIRE.stoneEdge

  return s
}

// === CARPET_RED (16x16, tileable) ===
// Deep red base with subtle texture pattern (no grid lines).
function makeCarpetRed(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) {
    const row: string[] = []
    for (let x = 0; x < 16; x++) {
      row.push(HELL_FIRE.redMid)
    }
    s.push(row)
  }

  // Subtle diamond/dot pattern at fixed positions
  // Pattern unit: 8x8, repeated at (0,0) and (8,8) so it tiles
  // Diamond centers at (4,4) and (12,12) within the 16x16 tile
  const diamondCenters: Array<[number, number]> = [[3, 3], [3, 11], [11, 3], [11, 11]]
  for (const [cx, cy] of diamondCenters) {
    // Diamond pattern (3x3 around center)
    s[cy - 1][cx] = HELL_FIRE.redDark
    s[cy + 1][cx] = HELL_FIRE.redDark
    s[cy][cx - 1] = HELL_FIRE.redDark
    s[cy][cx + 1] = HELL_FIRE.redDark
    s[cy][cx] = HELL_FIRE.redFire
  }

  // Subtle texture noise (redDark specks)
  const specks: Array<[number, number, string]> = [
    [1, 1, HELL_FIRE.redDark], [5, 1, HELL_FIRE.redDark], [9, 1, HELL_FIRE.redDark], [13, 1, HELL_FIRE.redDark],
    [2, 5, HELL_FIRE.redDark], [6, 5, HELL_FIRE.redDark], [10, 5, HELL_FIRE.redDark], [14, 5, HELL_FIRE.redDark],
    [0, 7, HELL_FIRE.redDark], [4, 7, HELL_FIRE.redDark], [8, 7, HELL_FIRE.redDark], [12, 7, HELL_FIRE.redDark],
    [1, 9, HELL_FIRE.redDark], [5, 9, HELL_FIRE.redDark], [9, 9, HELL_FIRE.redDark], [13, 9, HELL_FIRE.redDark],
    [2, 13, HELL_FIRE.redDark], [6, 13, HELL_FIRE.redDark], [10, 13, HELL_FIRE.redDark], [14, 13, HELL_FIRE.redDark],
    [3, 15, HELL_FIRE.redDark], [7, 15, HELL_FIRE.redDark], [11, 15, HELL_FIRE.redDark], [15, 15, HELL_FIRE.redDark],
  ]
  for (const [x, y, c] of specks) {
    s[y][x] = c
  }

  // Occasional bright fiber highlights
  const fibers: Array<[number, number, string]> = [
    [2, 2, HELL_FIRE.redBright], [6, 6, HELL_FIRE.redBright], [10, 10, HELL_FIRE.redBright], [14, 14, HELL_FIRE.redBright],
    [0, 14, HELL_FIRE.redBright], [4, 4, HELL_FIRE.redBright], [8, 0, HELL_FIRE.redBright], [12, 8, HELL_FIRE.redBright],
  ]
  for (const [x, y, c] of fibers) {
    s[y][x] = c
  }

  return s
}

// === CARPET_BLUE (16x16, tileable) ===
// Dark blue base — uses cloth/stoneDark for "dark blue" tones
function makeCarpetBlue(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) {
    const row: string[] = []
    for (let x = 0; x < 16; x++) {
      row.push(HELL_FIRE.stoneLite)
    }
    s.push(row)
  }

  // Subtle X pattern at center (3,3), (3,11), (11,3), (11,11)
  const xCenters: Array<[number, number]> = [[3, 3], [3, 11], [11, 3], [11, 11]]
  for (const [cx, cy] of xCenters) {
    s[cy - 1][cx - 1] = HELL_FIRE.stoneHigh
    s[cy - 1][cx + 1] = HELL_FIRE.stoneHigh
    s[cy + 1][cx - 1] = HELL_FIRE.stoneHigh
    s[cy + 1][cx + 1] = HELL_FIRE.stoneHigh
    s[cy][cx] = HELL_FIRE.smokeMid
  }

  // Texture dots — darker
  const dots: Array<[number, number, string]> = [
    [0, 0, HELL_FIRE.stoneMid], [4, 0, HELL_FIRE.stoneMid], [8, 0, HELL_FIRE.stoneMid], [12, 0, HELL_FIRE.stoneMid],
    [2, 2, HELL_FIRE.stoneMid], [6, 2, HELL_FIRE.stoneMid], [10, 2, HELL_FIRE.stoneMid], [14, 2, HELL_FIRE.stoneMid],
    [0, 4, HELL_FIRE.stoneMid], [4, 4, HELL_FIRE.stoneMid], [8, 4, HELL_FIRE.stoneMid], [12, 4, HELL_FIRE.stoneMid],
    [2, 6, HELL_FIRE.stoneMid], [6, 6, HELL_FIRE.stoneMid], [10, 6, HELL_FIRE.stoneMid], [14, 6, HELL_FIRE.stoneMid],
    [0, 8, HELL_FIRE.stoneMid], [4, 8, HELL_FIRE.stoneMid], [8, 8, HELL_FIRE.stoneMid], [12, 8, HELL_FIRE.stoneMid],
    [2, 10, HELL_FIRE.stoneMid], [6, 10, HELL_FIRE.stoneMid], [10, 10, HELL_FIRE.stoneMid], [14, 10, HELL_FIRE.stoneMid],
    [0, 12, HELL_FIRE.stoneMid], [4, 12, HELL_FIRE.stoneMid], [8, 12, HELL_FIRE.stoneMid], [12, 12, HELL_FIRE.stoneMid],
    [2, 14, HELL_FIRE.stoneMid], [6, 14, HELL_FIRE.stoneMid], [10, 14, HELL_FIRE.stoneMid], [14, 14, HELL_FIRE.stoneMid],
  ]
  for (const [x, y, c] of dots) {
    s[y][x] = c
  }

  // Highlights
  const highlights: Array<[number, number, string]> = [
    [1, 1, HELL_FIRE.stoneEdge], [5, 5, HELL_FIRE.stoneEdge], [9, 9, HELL_FIRE.stoneEdge], [13, 13, HELL_FIRE.stoneEdge],
  ]
  for (const [x, y, c] of highlights) {
    s[y][x] = c
  }

  return s
}

// === CARPET_PURPLE (16x16, tileable) ===
// Deep purple — uses redDark + redMid blend
function makeCarpetPurple(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) {
    const row: string[] = []
    for (let x = 0; x < 16; x++) {
      row.push(HELL_FIRE.redDark)
    }
    s.push(row)
  }

  // Subtle pattern: small star shapes (4 lines from center)
  const starCenters: Array<[number, number]> = [[3, 3], [3, 11], [11, 3], [11, 11]]
  for (const [cx, cy] of starCenters) {
    // Plus shape
    s[cy - 1][cx] = HELL_FIRE.redMid
    s[cy + 1][cx] = HELL_FIRE.redMid
    s[cy][cx - 1] = HELL_FIRE.redMid
    s[cy][cx + 1] = HELL_FIRE.redMid
    s[cy][cx] = HELL_FIRE.redFire
  }

  // Texture noise
  const specks: Array<[number, number, string]> = [
    [0, 0, HELL_FIRE.black], [4, 0, HELL_FIRE.black], [8, 0, HELL_FIRE.black], [12, 0, HELL_FIRE.black],
    [2, 2, HELL_FIRE.redDark], [6, 2, HELL_FIRE.redDark], [10, 2, HELL_FIRE.redDark], [14, 2, HELL_FIRE.redDark],
    [0, 4, HELL_FIRE.redDark], [4, 4, HELL_FIRE.redDark], [8, 4, HELL_FIRE.redDark], [12, 4, HELL_FIRE.redDark],
    [2, 6, HELL_FIRE.redDark], [6, 6, HELL_FIRE.redDark], [10, 6, HELL_FIRE.redDark], [14, 6, HELL_FIRE.redDark],
    [0, 8, HELL_FIRE.redDark], [4, 8, HELL_FIRE.redDark], [8, 8, HELL_FIRE.redDark], [12, 8, HELL_FIRE.redDark],
    [2, 10, HELL_FIRE.redDark], [6, 10, HELL_FIRE.redDark], [10, 10, HELL_FIRE.redDark], [14, 10, HELL_FIRE.redDark],
    [0, 12, HELL_FIRE.redDark], [4, 12, HELL_FIRE.redDark], [8, 12, HELL_FIRE.redDark], [12, 12, HELL_FIRE.redDark],
    [2, 14, HELL_FIRE.redDark], [6, 14, HELL_FIRE.redDark], [10, 14, HELL_FIRE.redDark], [14, 14, HELL_FIRE.redDark],
  ]
  for (const [x, y, c] of specks) {
    s[y][x] = c
  }

  // Gold thread highlights
  const goldThreads: Array<[number, number, string]> = [
    [1, 1, HELL_FIRE.goldDark], [5, 5, HELL_FIRE.goldDark], [9, 9, HELL_FIRE.goldDark], [13, 13, HELL_FIRE.goldDark],
    [2, 12, HELL_FIRE.goldDark], [7, 7, HELL_FIRE.goldDark], [12, 2, HELL_FIRE.goldDark],
  ]
  for (const [x, y, c] of goldThreads) {
    s[y][x] = c
  }

  return s
}

export const WOOD_PLANKS: SpriteData = makeWoodPlanks()
export const STONE_TILE: SpriteData = makeStoneTile()
export const CARPET_RED: SpriteData = makeCarpetRed()
export const CARPET_BLUE: SpriteData = makeCarpetBlue()
export const CARPET_PURPLE: SpriteData = makeCarpetPurple()

// === WOOD_PARQUET (16x16, tileable) ===
// Diagonal parquet pattern with light/dark alternating diamonds
function makeWoodParquet(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Base wood color
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      s[y][x] = HELL_FIRE.barkMid
    }
  }

  // Diagonal diamond pattern — 8x8 repeating unit
  // Diamond centers at (4,4) and (12,12)
  const diamondCenters: Array<[number, number]> = [[4, 4], [12, 12]]
  for (const [cx, cy] of diamondCenters) {
    // Diamond shape using Manhattan distance
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dist = Math.abs(x - cx) + Math.abs(y - cy)
        if (dist <= 3) {
          // Inner diamond: lighter
          if (dist <= 1) {
            s[y][x] = HELL_FIRE.barkMid
          } else if (dist === 2) {
            s[y][x] = HELL_FIRE.clothLite
          } else {
            s[y][x] = HELL_FIRE.cloth
          }
        }
      }
    }
  }

  // Add subtle grain lines following diamond edges
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dist1 = Math.abs(x - 4) + Math.abs(y - 4)
      const dist2 = Math.abs(x - 12) + Math.abs(y - 12)
      if (dist1 === 3 || dist2 === 3) {
        s[y][x] = HELL_FIRE.barkDark
      }
    }
  }

  return s
}

// === WOOD_DARK (16x16, tileable) ===
// Dark stained wood with vertical grain and subtle streaks
function makeWoodDark(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Base dark wood
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      s[y][x] = HELL_FIRE.barkDark
    }
  }

  // Vertical grain lines with variation
  const grainLines = [
    { x: 1, color: HELL_FIRE.barkMid },
    { x: 3, color: HELL_FIRE.barkDark },
    { x: 5, color: HELL_FIRE.cloth },
    { x: 7, color: HELL_FIRE.barkMid },
    { x: 9, color: HELL_FIRE.barkDark },
    { x: 11, color: HELL_FIRE.clothLite },
    { x: 13, color: HELL_FIRE.barkMid },
    { x: 15, color: HELL_FIRE.barkDark },
  ]
  for (const line of grainLines) {
    for (let y = 0; y < 16; y++) {
      s[y][line.x] = line.color
    }
  }

  // Dark streaks
  const streaks = [
    { x: 2, yStart: 0, yEnd: 5, color: HELL_FIRE.black },
    { x: 6, yStart: 8, yEnd: 13, color: HELL_FIRE.black },
    { x: 10, yStart: 2, yEnd: 7, color: HELL_FIRE.black },
    { x: 14, yStart: 10, yEnd: 15, color: HELL_FIRE.black },
  ]
  for (const streak of streaks) {
    for (let y = streak.yStart; y <= streak.yEnd; y++) {
      s[y][streak.x] = streak.color
    }
  }

  // Highlight knots
  s[3][7] = HELL_FIRE.clothLite
  s[11][3] = HELL_FIRE.clothLite

  return s
}

// === STONE_COBBLE (16x16, tileable) ===
// Offset brick pattern — 8x4 bricks alternating rows
// Different from STONE_TILE which has regular grid
function makeStoneCobble(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Base color
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      s[y][x] = HELL_FIRE.stoneMid
    }
  }

  // Brick pattern: 8x4 bricks, offset by 4 on even rows
  const brickHeight = 4
  const brickWidth = 8
  for (let y = 0; y < 16; y++) {
    const brickRow = Math.floor(y / brickHeight)
    const offsetX = (brickRow % 2) * (brickWidth / 2) // Offset by 4 on even rows
    
    for (let x = 0; x < 16; x++) {
      const realX = (x + offsetX) % 16
      const inBrickX = realX % brickWidth
      
      // Vertical mortar lines
      if (inBrickX === 0 || (realX < 8 && realX === 7) || (realX >= 8 && realX === 15)) {
        if (y % brickHeight !== 0) {
          s[y][x] = HELL_FIRE.stoneDark
        }
      }
      
      // Horizontal mortar lines
      if (y % brickHeight === 0) {
        s[y][x] = HELL_FIRE.stoneEdge
      } else if (y % brickHeight === 3) {
        s[y][x] = HELL_FIRE.stoneDark
      }
    }
  }

  // Brick color variation
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const brickRow = Math.floor(y / brickHeight)
      const brickCol = Math.floor(x / brickWidth)
      const colorIdx = (brickRow + brickCol) % 3
      
      if (s[y][x] === HELL_FIRE.stoneMid) {
        if (colorIdx === 0) s[y][x] = HELL_FIRE.stoneLite
        else if (colorIdx === 1) s[y][x] = HELL_FIRE.stoneMid
        else s[y][x] = HELL_FIRE.stoneHigh
      }
    }
  }

  return s
}

// === STONE_SLATE (16x16, tileable) ===
// Dark slate with rough, irregular texture
function makeStoneSlate(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Base dark slate
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      s[y][x] = HELL_FIRE.stoneDark
    }
  }

  // Subtle crack lines
  const cracks = [
    // Diagonal crack from top-left
    { x: 2, y: 0, dir: 'se' },
    { x: 5, y: 0, dir: 'se' },
    // Horizontal cracks
    { x: 0, y: 6, dir: 'e' },
    { x: 0, y: 11, dir: 'e' },
    // Vertical cracks
    { x: 9, y: 3, dir: 's' },
    { x: 13, y: 8, dir: 's' },
  ]
  for (const crack of cracks) {
    for (let i = 0; i < 6; i++) {
      let cx = crack.x, cy = crack.y
      if (crack.dir === 'se') { cx += i; cy += i; }
      else if (crack.dir === 'e') { cx += i; }
      else if (crack.dir === 's') { cy += i; }
      
      if (cx < 16 && cy < 16) {
        s[cy][cx] = HELL_FIRE.black
      }
    }
  }

  // Texture noise — lighter specks
  const specks: Array<[number, number]> = [
    [1, 1], [3, 2], [5, 1], [7, 3], [9, 2], [11, 1], [13, 3], [15, 2],
    [2, 4], [4, 5], [6, 4], [8, 6], [10, 5], [12, 4], [14, 6],
    [1, 7], [3, 8], [5, 7], [7, 9], [9, 8], [11, 7], [13, 9], [15, 8],
    [2, 10], [4, 11], [6, 10], [8, 12], [10, 11], [12, 10], [14, 12],
    [1, 13], [3, 14], [5, 13], [7, 15], [9, 14], [11, 13], [13, 15], [15, 14],
  ]
  for (const [x, y] of specks) {
    s[y][x] = HELL_FIRE.stoneMid
  }

  // Highlight edges
  s[0][0] = HELL_FIRE.stoneMid
  s[0][8] = HELL_FIRE.stoneMid
  s[8][0] = HELL_FIRE.stoneMid
  s[8][8] = HELL_FIRE.stoneMid

  return s
}

// === CARPET_GREEN (16x16, tileable) ===
// Olive-green carpet using bark* colors (no green in HELL_FIRE palette)
function makeCarpetGreen(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) {
    const row: string[] = []
    for (let x = 0; x < 16; x++) {
      row.push(HELL_FIRE.barkMid)
    }
    s.push(row)
  }

  // Subtle cross pattern
  const crossCenters: Array<[number, number]> = [[3, 3], [3, 11], [11, 3], [11, 11]]
  for (const [cx, cy] of crossCenters) {
    // Horizontal line
    s[cy][cx - 2] = HELL_FIRE.barkDark
    s[cy][cx - 1] = HELL_FIRE.cloth
    s[cy][cx] = HELL_FIRE.clothLite
    s[cy][cx + 1] = HELL_FIRE.cloth
    s[cy][cx + 2] = HELL_FIRE.barkDark
    // Vertical line
    s[cy - 2][cx] = HELL_FIRE.barkDark
    s[cy - 1][cx] = HELL_FIRE.cloth
    s[cy + 1][cx] = HELL_FIRE.cloth
    s[cy + 2][cx] = HELL_FIRE.barkDark
  }

  // Texture dots
  const dots: Array<[number, number, string]> = [
    [0, 0, HELL_FIRE.barkDark], [4, 0, HELL_FIRE.barkDark], [8, 0, HELL_FIRE.barkDark], [12, 0, HELL_FIRE.barkDark],
    [2, 2, HELL_FIRE.barkDark], [6, 2, HELL_FIRE.barkDark], [10, 2, HELL_FIRE.barkDark], [14, 2, HELL_FIRE.barkDark],
    [0, 4, HELL_FIRE.barkDark], [4, 4, HELL_FIRE.barkDark], [8, 4, HELL_FIRE.barkDark], [12, 4, HELL_FIRE.barkDark],
    [2, 6, HELL_FIRE.barkDark], [6, 6, HELL_FIRE.barkDark], [10, 6, HELL_FIRE.barkDark], [14, 6, HELL_FIRE.barkDark],
    [0, 8, HELL_FIRE.barkDark], [4, 8, HELL_FIRE.barkDark], [8, 8, HELL_FIRE.barkDark], [12, 8, HELL_FIRE.barkDark],
    [2, 10, HELL_FIRE.barkDark], [6, 10, HELL_FIRE.barkDark], [10, 10, HELL_FIRE.barkDark], [14, 10, HELL_FIRE.barkDark],
    [0, 12, HELL_FIRE.barkDark], [4, 12, HELL_FIRE.barkDark], [8, 12, HELL_FIRE.barkDark], [12, 12, HELL_FIRE.barkDark],
    [2, 14, HELL_FIRE.barkDark], [6, 14, HELL_FIRE.barkDark], [10, 14, HELL_FIRE.barkDark], [14, 14, HELL_FIRE.barkDark],
  ]
  for (const [x, y, c] of dots) {
    s[y][x] = c
  }

  // Highlights
  const highlights: Array<[number, number, string]> = [
    [1, 1, HELL_FIRE.clothLite], [5, 5, HELL_FIRE.clothLite], [9, 9, HELL_FIRE.clothLite], [13, 13, HELL_FIRE.clothLite],
  ]
  for (const [x, y, c] of highlights) {
    s[y][x] = c
  }

  return s
}

// === CARPET_GOLD (16x16, tileable) ===
// Luxury gold carpet with ornate diamond pattern
function makeCarpetGold(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) {
    const row: string[] = []
    for (let x = 0; x < 16; x++) {
      row.push(HELL_FIRE.goldDark)
    }
    s.push(row)
  }

  // Ornate diamond pattern at center
  const diamondCenters: Array<[number, number]> = [[4, 4], [4, 12], [12, 4], [12, 12]]
  for (const [cx, cy] of diamondCenters) {
    // Outer diamond (radius 3)
    for (let y = cy - 3; y <= cy + 3; y++) {
      for (let x = cx - 3; x <= cx + 3; x++) {
        if (y >= 0 && y < 16 && x >= 0 && x < 16) {
          const dist = Math.abs(x - cx) + Math.abs(y - cy)
          if (dist === 3) {
            s[y][x] = HELL_FIRE.goldMid
          }
        }
      }
    }
    // Inner diamond (radius 1)
    s[cy][cx] = HELL_FIRE.goldBright
    s[cy - 1][cx] = HELL_FIRE.goldMid
    s[cy + 1][cx] = HELL_FIRE.goldMid
    s[cy][cx - 1] = HELL_FIRE.goldMid
    s[cy][cx + 1] = HELL_FIRE.goldMid
  }

  // Corner accents
  const accents = [
    [0, 0], [0, 15], [15, 0], [15, 15],
    [0, 7], [0, 8], [15, 7], [15, 8],
    [7, 0], [8, 0], [7, 15], [8, 15],
  ]
  for (const [x, y] of accents) {
    s[y][x] = HELL_FIRE.goldGlow
  }

  // Subtle texture weave
  const weave: Array<[number, number]> = [
    [1, 1], [3, 1], [5, 1], [7, 1], [9, 1], [11, 1], [13, 1],
    [1, 3], [3, 3], [5, 3], [7, 3], [9, 3], [11, 3], [13, 3],
    [1, 5], [3, 5], [5, 5], [7, 5], [9, 5], [11, 5], [13, 5],
    [1, 7], [3, 7], [5, 7], [9, 7], [11, 7], [13, 7],
    [1, 8], [3, 8], [5, 8], [9, 8], [11, 8], [13, 8],
    [1, 10], [3, 10], [5, 10], [7, 10], [9, 10], [11, 10], [13, 10],
    [1, 12], [3, 12], [5, 12], [7, 12], [9, 12], [11, 12], [13, 12],
    [1, 14], [3, 14], [5, 14], [7, 14], [9, 14], [11, 14], [13, 14],
  ]
  for (const [x, y] of weave) {
    s[y][x] = HELL_FIRE.goldMid
  }

  return s
}

// Export all variants
export const WOOD_PARQUET: SpriteData = makeWoodParquet()
export const WOOD_DARK: SpriteData = makeWoodDark()
export const STONE_COBBLE: SpriteData = makeStoneCobble()
export const STONE_SLATE: SpriteData = makeStoneSlate()
export const CARPET_GREEN: SpriteData = makeCarpetGreen()
export const CARPET_GOLD: SpriteData = makeCarpetGold()
