// Plant sprites — fern, palm, flower, cactus, bush, hanging vine
// 16-bit top-down RPG style. Pots use barkDark/barkMid. Greens are
// derived locally since HELL_FIRE palette lacks a true green range.

import { HELL_FIRE } from '../../pixelArt'
import type { SpriteData } from '../../sprites'

const _: string = ''

// Locally-defined greens & flower accent (HELL_FIRE has no true green)
const GREEN_DARK = '#2a4a1a'
const GREEN_MID  = '#4a7a2a'
const GREEN_LITE = '#7aaa4a'
const FLOWER_RED = '#ff5555'
const FLOWER_ORG = '#ffaa55'

// === PLANT_FERN (8x8) — leafy green fern in terracotta pot ===
function makePlantFern(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 8; y++) s.push(Array(8).fill(_))

  // Fern fronds (rows 0-4) — bushy leafy top
  // Center column
  s[0][3] = GREEN_LITE
  s[0][4] = GREEN_LITE
  s[1][2] = GREEN_MID
  s[1][3] = GREEN_LITE
  s[1][4] = GREEN_LITE
  s[1][5] = GREEN_MID
  s[2][1] = GREEN_MID
  s[2][2] = GREEN_LITE
  s[2][3] = GREEN_MID
  s[2][4] = GREEN_MID
  s[2][5] = GREEN_LITE
  s[2][6] = GREEN_MID
  s[3][1] = GREEN_DARK
  s[3][2] = GREEN_MID
  s[3][3] = GREEN_MID
  s[3][4] = GREEN_MID
  s[3][5] = GREEN_MID
  s[3][6] = GREEN_MID
  s[3][7] = GREEN_DARK
  // A couple of stray fronds (overhanging tips)
  s[1][1] = GREEN_DARK
  s[1][6] = GREEN_DARK
  s[2][0] = GREEN_DARK
  s[2][7] = GREEN_DARK

  // Pot rim (row 5)
  s[5][1] = HELL_FIRE.barkMid
  s[5][2] = HELL_FIRE.barkMid
  s[5][3] = HELL_FIRE.barkDark
  s[5][4] = HELL_FIRE.barkDark
  s[5][5] = HELL_FIRE.barkMid
  s[5][6] = HELL_FIRE.barkMid

  // Pot body (rows 6-7)
  s[6][1] = HELL_FIRE.barkDark
  s[6][2] = HELL_FIRE.barkMid
  s[6][3] = HELL_FIRE.barkMid
  s[6][4] = HELL_FIRE.barkMid
  s[6][5] = HELL_FIRE.barkMid
  s[6][6] = HELL_FIRE.barkDark
  s[7][1] = HELL_FIRE.barkDark
  s[7][2] = HELL_FIRE.barkDark
  s[7][3] = HELL_FIRE.barkMid
  s[7][4] = HELL_FIRE.barkMid
  s[7][5] = HELL_FIRE.barkDark
  s[7][6] = HELL_FIRE.barkDark
  return s
}
export const PLANT_FERN: SpriteData = makePlantFern()

// === PLANT_PALM (16x16) — tall palm tree, fronds at top, brown trunk ===
function makePlantPalm(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Crown of fronds (rows 0-3) — radial spread
  // Center top
  s[0][7] = GREEN_LITE
  s[0][8] = GREEN_LITE
  s[1][6] = GREEN_MID
  s[1][7] = GREEN_LITE
  s[1][8] = GREEN_LITE
  s[1][9] = GREEN_MID
  s[2][5] = GREEN_DARK
  s[2][6] = GREEN_MID
  s[2][7] = GREEN_LITE
  s[2][8] = GREEN_LITE
  s[2][9] = GREEN_MID
  s[2][10] = GREEN_DARK

  // Long fronds extending outward (row 2-3)
  // Left fronds
  s[2][3] = GREEN_MID
  s[2][4] = GREEN_LITE
  s[3][1] = GREEN_DARK
  s[3][2] = GREEN_MID
  s[3][3] = GREEN_LITE
  s[3][4] = GREEN_MID
  s[3][5] = GREEN_DARK
  // Right fronds
  s[2][11] = GREEN_LITE
  s[2][12] = GREEN_MID
  s[3][10] = GREEN_DARK
  s[3][11] = GREEN_MID
  s[3][12] = GREEN_LITE
  s[3][13] = GREEN_MID
  s[3][14] = GREEN_DARK

  // Trunk (rows 4-15, cols 7-8) — narrow brown column
  for (let y = 4; y < 16; y++) {
    s[y][7] = HELL_FIRE.barkMid
    s[y][8] = HELL_FIRE.barkMid
  }
  // Trunk shading (left side darker, right side highlights)
  for (let y = 4; y < 16; y++) {
    s[y][6] = HELL_FIRE.barkDark
    s[y][9] = HELL_FIRE.barkDark
  }
  // Trunk ring highlights every few rows
  for (let y = 5; y < 15; y += 3) {
    s[y][7] = HELL_FIRE.barkMid
    s[y][8] = HELL_FIRE.barkMid
  }
  // A couple of stray frond droops below the crown
  s[4][5] = GREEN_DARK
  s[4][10] = GREEN_DARK
  return s
}
export const PLANT_PALM: SpriteData = makePlantPalm()

// === PLANT_FLOWER (8x8) — small plant with red flowers in pot ===
function makePlantFlower(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 8; y++) s.push(Array(8).fill(_))

  // Three red flowers with green stems/leaves
  // Left flower (around col 2)
  s[0][2] = FLOWER_RED
  s[0][3] = HELL_FIRE.redBright
  s[1][1] = HELL_FIRE.redBright
  s[1][2] = HELL_FIRE.redFire
  s[1][3] = HELL_FIRE.redFire
  s[1][4] = HELL_FIRE.redBright
  // Center
  s[2][3] = GREEN_MID
  s[2][4] = GREEN_LITE
  s[3][3] = GREEN_DARK
  s[3][4] = GREEN_MID
  // Center flower (around col 4)
  s[1][4] = HELL_FIRE.redBright
  // Right flower (around col 5)
  s[0][5] = HELL_FIRE.redBright
  s[0][6] = FLOWER_RED
  s[1][5] = HELL_FIRE.redFire
  s[1][6] = HELL_FIRE.redFire
  s[1][7] = HELL_FIRE.redBright

  // Central tall stem with center bloom
  s[1][3] = HELL_FIRE.redFire
  s[1][4] = HELL_FIRE.redFire
  s[1][5] = HELL_FIRE.redFire

  // Leaves at the base of stems
  s[3][1] = GREEN_DARK
  s[3][2] = GREEN_MID
  s[3][5] = GREEN_MID
  s[3][6] = GREEN_DARK
  s[3][7] = GREEN_DARK
  s[4][1] = GREEN_DARK
  s[4][6] = GREEN_DARK

  // Pot rim (row 5)
  s[5][1] = HELL_FIRE.barkMid
  s[5][2] = HELL_FIRE.barkMid
  s[5][3] = HELL_FIRE.barkDark
  s[5][4] = HELL_FIRE.barkDark
  s[5][5] = HELL_FIRE.barkMid
  s[5][6] = HELL_FIRE.barkMid

  // Pot body (rows 6-7)
  s[6][1] = HELL_FIRE.barkDark
  s[6][2] = HELL_FIRE.barkMid
  s[6][3] = HELL_FIRE.barkMid
  s[6][4] = HELL_FIRE.barkMid
  s[6][5] = HELL_FIRE.barkMid
  s[6][6] = HELL_FIRE.barkDark
  s[7][1] = HELL_FIRE.barkDark
  s[7][2] = HELL_FIRE.barkDark
  s[7][3] = HELL_FIRE.barkMid
  s[7][4] = HELL_FIRE.barkMid
  s[7][5] = HELL_FIRE.barkDark
  s[7][6] = HELL_FIRE.barkDark
  return s
}
export const PLANT_FLOWER: SpriteData = makePlantFlower()

// === PLANT_CACTUS (8x8) — round cactus with red flower on top, in pot ===
function makePlantCactus(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 8; y++) s.push(Array(8).fill(_))

  // Red flower on top (rows 0-1)
  s[0][3] = HELL_FIRE.redBright
  s[0][4] = HELL_FIRE.redFire
  s[0][5] = FLOWER_RED
  s[1][3] = HELL_FIRE.redFire
  s[1][4] = HELL_FIRE.redBright
  s[1][5] = HELL_FIRE.redFire

  // Cactus body (rows 1-4) — round, green sphere
  s[1][3] = HELL_FIRE.redFire // covered above
  s[2][2] = GREEN_MID
  s[2][3] = GREEN_LITE
  s[2][4] = GREEN_LITE
  s[2][5] = GREEN_MID
  s[3][1] = GREEN_DARK
  s[3][2] = GREEN_MID
  s[3][3] = GREEN_LITE
  s[3][4] = GREEN_LITE
  s[3][5] = GREEN_MID
  s[3][6] = GREEN_DARK
  s[4][2] = GREEN_MID
  s[4][3] = GREEN_LITE
  s[4][4] = GREEN_LITE
  s[4][5] = GREEN_MID

  // Spines / highlight (a few lighter pixels)
  s[3][2] = GREEN_LITE
  s[3][5] = GREEN_LITE

  // Pot rim (row 5)
  s[5][1] = HELL_FIRE.barkMid
  s[5][2] = HELL_FIRE.barkMid
  s[5][3] = HELL_FIRE.barkDark
  s[5][4] = HELL_FIRE.barkDark
  s[5][5] = HELL_FIRE.barkMid
  s[5][6] = HELL_FIRE.barkMid

  // Pot body (rows 6-7)
  s[6][1] = HELL_FIRE.barkDark
  s[6][2] = HELL_FIRE.barkMid
  s[6][3] = HELL_FIRE.barkMid
  s[6][4] = HELL_FIRE.barkMid
  s[6][5] = HELL_FIRE.barkMid
  s[6][6] = HELL_FIRE.barkDark
  s[7][1] = HELL_FIRE.barkDark
  s[7][2] = HELL_FIRE.barkDark
  s[7][3] = HELL_FIRE.barkMid
  s[7][4] = HELL_FIRE.barkMid
  s[7][5] = HELL_FIRE.barkDark
  s[7][6] = HELL_FIRE.barkDark
  return s
}
export const PLANT_CACTUS: SpriteData = makePlantCactus()

// === PLANT_BUSH (16x16) — dark green leafy bush, no pot ===
function makePlantBush(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Bush silhouette: roughly a 14x12 leafy mound centered on the sprite
  // Base shadow row
  s[14][3] = HELL_FIRE.barkDark
  s[14][4] = HELL_FIRE.barkDark
  s[14][5] = HELL_FIRE.barkDark
  s[14][6] = HELL_FIRE.barkDark
  s[14][7] = HELL_FIRE.barkDark
  s[14][8] = HELL_FIRE.barkDark
  s[14][9] = HELL_FIRE.barkDark
  s[14][10] = HELL_FIRE.barkDark
  s[14][11] = HELL_FIRE.barkDark
  s[14][12] = HELL_FIRE.barkDark
  s[15][3] = HELL_FIRE.smokeDark
  s[15][4] = HELL_FIRE.smokeDark
  s[15][5] = HELL_FIRE.smokeDark
  s[15][6] = HELL_FIRE.smokeDark
  s[15][7] = HELL_FIRE.smokeDark
  s[15][8] = HELL_FIRE.smokeDark
  s[15][9] = HELL_FIRE.smokeDark
  s[15][10] = HELL_FIRE.smokeDark
  s[15][11] = HELL_FIRE.smokeDark
  s[15][12] = HELL_FIRE.smokeDark

  // Foliage body — fill rows 4-13, cols 2-13 with green tones
  for (let y = 4; y < 14; y++) {
    for (let x = 2; x < 14; x++) {
      // Edges are darker
      const distFromCenter = Math.max(Math.abs(x - 7.5), Math.abs(y - 8.5))
      if (distFromCenter > 4.5) s[y][x] = GREEN_DARK
      else if (distFromCenter > 3) s[y][x] = GREEN_MID
      else s[y][x] = GREEN_LITE
    }
  }

  // Round the top: clear pixels in upper corners to form a dome
  // Row 3 — narrow top
  for (let x = 4; x < 12; x++) {
    s[3][x] = distFromCenterForBush(x, 3) > 3.5 ? GREEN_DARK : GREEN_MID
  }
  // Row 2 — small bump
  for (let x = 6; x < 10; x++) {
    s[2][x] = distFromCenterForBush(x, 2) > 3 ? GREEN_MID : GREEN_LITE
  }
  // Row 1 — single highlight
  s[1][7] = GREEN_LITE
  s[1][8] = GREEN_LITE

  // Darken the outer perimeter ring
  // Top edges
  s[3][2] = GREEN_DARK; s[3][3] = GREEN_DARK
  s[3][12] = GREEN_DARK; s[3][13] = GREEN_DARK
  // Side edges
  s[4][2] = GREEN_DARK; s[5][2] = GREEN_DARK; s[6][2] = GREEN_DARK; s[7][2] = GREEN_DARK; s[8][2] = GREEN_DARK
  s[4][13] = GREEN_DARK; s[5][13] = GREEN_DARK; s[6][13] = GREEN_DARK; s[7][13] = GREEN_DARK; s[8][13] = GREEN_DARK
  // Bottom edges (meet the shadow)
  s[13][2] = GREEN_DARK; s[13][3] = GREEN_DARK; s[13][4] = GREEN_DARK
  s[13][11] = GREEN_DARK; s[13][12] = GREEN_DARK; s[13][13] = GREEN_DARK

  // Internal leaf highlights (clumps)
  s[5][5] = GREEN_LITE; s[5][6] = GREEN_LITE
  s[6][9] = GREEN_LITE; s[6][10] = GREEN_LITE; s[6][11] = GREEN_LITE
  s[8][4] = GREEN_LITE; s[8][5] = GREEN_LITE
  s[9][8] = GREEN_LITE; s[9][9] = GREEN_LITE
  s[11][6] = GREEN_LITE; s[11][7] = GREEN_LITE
  s[12][10] = GREEN_LITE; s[12][11] = GREEN_LITE

  // A few single red berries for visual interest
  s[7][4] = HELL_FIRE.redFire
  s[10][11] = HELL_FIRE.redFire
  s[12][5] = HELL_FIRE.redBright

  return s
}

// Local helper for bush top bumps
function distFromCenterForBush(x: number, y: number): number {
  return Math.max(Math.abs(x - 7.5), Math.abs(y - 8.5))
}

export const PLANT_BUSH: SpriteData = makePlantBush()

// === PLANT_HANGING (8x8) — vine plant hanging from above ===
// Top half is the foliage cluster anchored at top of sprite, vines trail
// down through the bottom half.
function makePlantHanging(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 8; y++) s.push(Array(8).fill(_))

  // Foliage cluster (rows 0-3) — wide rounded mound
  s[0][3] = GREEN_LITE
  s[0][4] = GREEN_LITE
  s[1][2] = GREEN_MID
  s[1][3] = GREEN_LITE
  s[1][4] = GREEN_LITE
  s[1][5] = GREEN_MID
  s[2][1] = GREEN_DARK
  s[2][2] = GREEN_MID
  s[2][3] = GREEN_LITE
  s[2][4] = GREEN_LITE
  s[2][5] = GREEN_MID
  s[2][6] = GREEN_DARK
  s[3][1] = GREEN_DARK
  s[3][2] = GREEN_MID
  s[3][3] = GREEN_MID
  s[3][4] = GREEN_MID
  s[3][5] = GREEN_MID
  s[3][6] = GREEN_DARK

  // A couple of red flowers peeking out
  s[1][3] = HELL_FIRE.redFire
  s[1][4] = HELL_FIRE.redFire
  s[2][3] = HELL_FIRE.redBright
  s[2][4] = HELL_FIRE.redBright

  // Hanging vines (rows 4-7) — single-pixel strands
  // Vine 1 (left, col 2)
  s[4][2] = GREEN_DARK
  s[5][2] = GREEN_DARK
  s[6][2] = GREEN_MID
  s[7][2] = GREEN_MID
  // Vine 2 (center-left, col 3)
  s[4][3] = GREEN_DARK
  s[5][3] = GREEN_MID
  s[6][3] = GREEN_DARK
  s[7][3] = GREEN_DARK
  // Vine 3 (center, col 4)
  s[4][4] = GREEN_MID
  s[5][4] = GREEN_DARK
  s[6][4] = GREEN_MID
  s[7][4] = GREEN_DARK
  // Vine 4 (right, col 5)
  s[4][5] = GREEN_DARK
  s[5][5] = GREEN_DARK
  s[6][5] = GREEN_MID
  s[7][5] = GREEN_DARK

  // A small leaf on one of the vines
  s[6][3] = GREEN_LITE
  s[6][4] = GREEN_LITE
  return s
}
export const PLANT_HANGING: SpriteData = makePlantHanging()
