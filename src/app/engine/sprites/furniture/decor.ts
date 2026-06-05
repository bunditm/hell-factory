// Furniture — decor: painting, bulletin, mirror, statue, flag

import { HELL_FIRE } from '../../pixelArt'
import type { SpriteData } from '../../sprites'

const _: string = ''

// === PAINTING (16x16) — gold-framed picture of volcano landscape ===
function makePainting(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Gold frame
  s[0] = Array(16).fill(HELL_FIRE.goldMid)
  s[15] = Array(16).fill(HELL_FIRE.goldMid)
  for (let y = 0; y < 16; y++) {
    s[y][0] = HELL_FIRE.goldMid
    s[y][15] = HELL_FIRE.goldMid
  }
  // Frame inner highlight
  s[1] = Array(16).fill(HELL_FIRE.goldBright)
  s[1][0] = HELL_FIRE.goldMid
  s[1][15] = HELL_FIRE.goldMid
  s[14] = Array(16).fill(HELL_FIRE.goldDark)
  s[14][0] = HELL_FIRE.goldMid
  s[14][15] = HELL_FIRE.goldMid
  for (let y = 2; y < 14; y++) {
    s[y][1] = HELL_FIRE.goldBright
    s[y][14] = HELL_FIRE.goldDark
  }
  // Corner ornaments
  s[0][0] = HELL_FIRE.goldBright
  s[0][15] = HELL_FIRE.goldBright
  s[15][0] = HELL_FIRE.goldBright
  s[15][15] = HELL_FIRE.goldBright

  // Painting interior (rows 2-13, cols 2-13)
  // Dark sky background
  for (let y = 2; y < 14; y++) {
    for (let x = 2; x < 14; x++) {
      s[y][x] = HELL_FIRE.black
    }
  }
  // Sky gradient (dark red to red)
  s[2] = [_, _, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redMid, HELL_FIRE.redMid, HELL_FIRE.redMid, HELL_FIRE.redMid, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, _, _]
  s[3] = [_, _, HELL_FIRE.redDark, HELL_FIRE.redMid, HELL_FIRE.redBright, HELL_FIRE.redFire, HELL_FIRE.redFire, HELL_FIRE.redFire, HELL_FIRE.redBright, HELL_FIRE.redMid, HELL_FIRE.redMid, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, _, _]

  // Volcano shape (mountain in lower half)
  // Left slope
  s[8][3] = HELL_FIRE.redDark
  s[9][3] = HELL_FIRE.redMid
  s[9][4] = HELL_FIRE.redDark
  s[10][3] = HELL_FIRE.redMid
  s[10][4] = HELL_FIRE.redMid
  s[10][5] = HELL_FIRE.redDark
  s[11][3] = HELL_FIRE.redFire
  s[11][4] = HELL_FIRE.redBright
  s[11][5] = HELL_FIRE.redMid
  s[11][6] = HELL_FIRE.redDark
  s[12][3] = HELL_FIRE.redBright
  s[12][4] = HELL_FIRE.redFire
  s[12][5] = HELL_FIRE.redBright
  s[12][6] = HELL_FIRE.redMid
  s[12][7] = HELL_FIRE.redDark
  s[13][3] = HELL_FIRE.redFire
  s[13][4] = HELL_FIRE.redFire
  s[13][5] = HELL_FIRE.redFire
  s[13][6] = HELL_FIRE.redBright
  s[13][7] = HELL_FIRE.redMid
  s[13][8] = HELL_FIRE.redDark

  // Right slope (smaller mountain)
  s[9][10] = HELL_FIRE.redDark
  s[10][9] = HELL_FIRE.redDark
  s[10][10] = HELL_FIRE.redMid
  s[10][11] = HELL_FIRE.redDark
  s[11][8] = HELL_FIRE.redDark
  s[11][9] = HELL_FIRE.redMid
  s[11][10] = HELL_FIRE.redMid
  s[11][11] = HELL_FIRE.redMid
  s[11][12] = HELL_FIRE.redDark
  s[12][8] = HELL_FIRE.redMid
  s[12][9] = HELL_FIRE.redBright
  s[12][10] = HELL_FIRE.redFire
  s[12][11] = HELL_FIRE.redBright
  s[12][12] = HELL_FIRE.redMid
  s[12][13] = HELL_FIRE.redDark
  s[13][8] = HELL_FIRE.redBright
  s[13][9] = HELL_FIRE.redFire
  s[13][10] = HELL_FIRE.redFire
  s[13][11] = HELL_FIRE.redFire
  s[13][12] = HELL_FIRE.redBright
  s[13][13] = HELL_FIRE.redMid

  // Lava at top of volcanoes (small glow)
  s[7][4] = HELL_FIRE.lavaGlow
  s[7][5] = HELL_FIRE.lavaGlow
  s[8][4] = HELL_FIRE.lavaHot
  s[8][5] = HELL_FIRE.lavaHot
  s[8][10] = HELL_FIRE.lavaGlow
  s[8][11] = HELL_FIRE.lavaGlow

  // Eruption plume
  s[4][4] = HELL_FIRE.lavaDeep
  s[4][5] = HELL_FIRE.lavaDeep
  s[5][3] = HELL_FIRE.lavaMid
  s[5][4] = HELL_FIRE.lavaMid
  s[5][5] = HELL_FIRE.lavaMid
  s[5][6] = HELL_FIRE.lavaMid
  s[6][4] = HELL_FIRE.lavaBright
  s[6][5] = HELL_FIRE.lavaBright

  // Stars in sky
  s[4][8] = HELL_FIRE.goldBright
  s[4][12] = HELL_FIRE.goldBright
  s[5][7] = HELL_FIRE.goldBright
  s[5][11] = HELL_FIRE.goldBright
  s[6][9] = HELL_FIRE.goldBright
  s[6][13] = HELL_FIRE.goldBright

  return s
}

// === BULLETIN (16x16) — cork board with pinned notes ===
function makeBulletin(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Frame
  for (let y = 0; y < 16; y++) {
    s[y][0] = HELL_FIRE.barkDark
    s[y][15] = HELL_FIRE.barkDark
  }
  s[0] = Array(16).fill(HELL_FIRE.barkDark)
  s[15] = Array(16).fill(HELL_FIRE.barkDark)

  // Cork surface
  for (let y = 1; y < 15; y++) {
    for (let x = 1; x < 15; x++) {
      s[y][x] = HELL_FIRE.cloth
    }
  }
  // Cork texture (specks)
  const specks: Array<[number, number, string]> = [
    [2, 2, HELL_FIRE.clothLite], [5, 3, HELL_FIRE.clothLite], [8, 2, HELL_FIRE.clothLite], [12, 3, HELL_FIRE.clothLite],
    [3, 5, HELL_FIRE.barkMid], [7, 6, HELL_FIRE.barkMid], [11, 5, HELL_FIRE.barkMid], [13, 7, HELL_FIRE.barkMid],
    [2, 8, HELL_FIRE.clothLite], [5, 9, HELL_FIRE.clothLite], [9, 8, HELL_FIRE.clothLite], [13, 9, HELL_FIRE.clothLite],
    [3, 11, HELL_FIRE.barkMid], [7, 12, HELL_FIRE.barkMid], [10, 11, HELL_FIRE.barkMid], [12, 13, HELL_FIRE.barkMid],
    [4, 13, HELL_FIRE.clothLite], [8, 14, HELL_FIRE.clothLite],
  ]
  for (const [x, y, c] of specks) {
    s[y][x] = c
  }

  // Note 1: yellow (rows 2-5, cols 2-5)
  s[2][2] = HELL_FIRE.goldBright
  s[2][3] = HELL_FIRE.goldBright
  s[2][4] = HELL_FIRE.goldBright
  s[2][5] = HELL_FIRE.goldBright
  s[3][2] = HELL_FIRE.goldBright
  s[3][3] = HELL_FIRE.goldMid
  s[3][4] = HELL_FIRE.goldMid
  s[3][5] = HELL_FIRE.goldBright
  s[4][2] = HELL_FIRE.goldBright
  s[4][3] = HELL_FIRE.goldMid
  s[4][4] = HELL_FIRE.goldMid
  s[4][5] = HELL_FIRE.goldBright
  s[5][2] = HELL_FIRE.goldBright
  s[5][3] = HELL_FIRE.goldBright
  s[5][4] = HELL_FIRE.goldBright
  s[5][5] = HELL_FIRE.goldBright
  // Pin
  s[2][3] = HELL_FIRE.redBright
  s[2][4] = HELL_FIRE.redBright

  // Note 2: red (rows 3-6, cols 7-10)
  s[3][7] = HELL_FIRE.redBright
  s[3][8] = HELL_FIRE.redBright
  s[3][9] = HELL_FIRE.redBright
  s[3][10] = HELL_FIRE.redBright
  s[4][7] = HELL_FIRE.redBright
  s[4][8] = HELL_FIRE.redMid
  s[4][9] = HELL_FIRE.redMid
  s[4][10] = HELL_FIRE.redBright
  s[5][7] = HELL_FIRE.redBright
  s[5][8] = HELL_FIRE.redMid
  s[5][9] = HELL_FIRE.redMid
  s[5][10] = HELL_FIRE.redBright
  s[6][7] = HELL_FIRE.redBright
  s[6][8] = HELL_FIRE.redBright
  s[6][9] = HELL_FIRE.redBright
  s[6][10] = HELL_FIRE.redBright
  // Pin
  s[3][8] = HELL_FIRE.goldBright
  s[3][9] = HELL_FIRE.goldBright

  // Note 3: lava/orange (rows 7-10, cols 11-13)
  s[7][11] = HELL_FIRE.lavaBright
  s[7][12] = HELL_FIRE.lavaBright
  s[7][13] = HELL_FIRE.lavaBright
  s[8][11] = HELL_FIRE.lavaBright
  s[8][12] = HELL_FIRE.lavaHot
  s[8][13] = HELL_FIRE.lavaBright
  s[9][11] = HELL_FIRE.lavaBright
  s[9][12] = HELL_FIRE.lavaHot
  s[9][13] = HELL_FIRE.lavaBright
  s[10][11] = HELL_FIRE.lavaBright
  s[10][12] = HELL_FIRE.lavaBright
  s[10][13] = HELL_FIRE.lavaBright
  // Pin
  s[7][12] = HELL_FIRE.redBright
  s[7][13] = HELL_FIRE.redBright

  // Note 4: blue (rows 9-12, cols 3-6)
  s[9][3] = HELL_FIRE.stoneHigh
  s[9][4] = HELL_FIRE.stoneHigh
  s[9][5] = HELL_FIRE.stoneHigh
  s[9][6] = HELL_FIRE.stoneHigh
  s[10][3] = HELL_FIRE.stoneHigh
  s[10][4] = HELL_FIRE.stoneLite
  s[10][5] = HELL_FIRE.stoneLite
  s[10][6] = HELL_FIRE.stoneHigh
  s[11][3] = HELL_FIRE.stoneHigh
  s[11][4] = HELL_FIRE.stoneLite
  s[11][5] = HELL_FIRE.stoneLite
  s[11][6] = HELL_FIRE.stoneHigh
  s[12][3] = HELL_FIRE.stoneHigh
  s[12][4] = HELL_FIRE.stoneHigh
  s[12][5] = HELL_FIRE.stoneHigh
  s[12][6] = HELL_FIRE.stoneHigh
  // Pin
  s[9][4] = HELL_FIRE.goldBright
  s[9][5] = HELL_FIRE.goldBright

  // Note 5: small torn paper (rows 12-13, cols 8-10)
  s[12][8] = HELL_FIRE.bone
  s[12][9] = HELL_FIRE.bone
  s[12][10] = HELL_FIRE.bone
  s[13][8] = HELL_FIRE.bone
  s[13][9] = HELL_FIRE.bone
  s[13][10] = HELL_FIRE.bone

  return s
}

// === MIRROR (8x16) — gold-framed mirror ===
function makeMirror(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(8).fill(_))

  // Gold frame
  s[0] = Array(8).fill(HELL_FIRE.goldDark)
  s[15] = Array(8).fill(HELL_FIRE.goldDark)
  for (let y = 0; y < 16; y++) {
    s[y][0] = HELL_FIRE.goldDark
    s[y][7] = HELL_FIRE.goldDark
  }
  // Frame highlights
  s[0][0] = HELL_FIRE.goldBright
  s[0][7] = HELL_FIRE.goldBright
  s[15][0] = HELL_FIRE.goldBright
  s[15][7] = HELL_FIRE.goldBright
  for (let y = 1; y < 15; y++) {
    s[y][1] = HELL_FIRE.goldMid
    s[y][6] = HELL_FIRE.goldMid
  }
  s[1][0] = HELL_FIRE.goldMid
  s[1][7] = HELL_FIRE.goldMid
  s[14][0] = HELL_FIRE.goldMid
  s[14][7] = HELL_FIRE.goldMid

  // Mirror surface (rows 2-13, cols 2-5)
  for (let y = 2; y < 14; y++) {
    for (let x = 2; x < 6; x++) {
      s[y][x] = HELL_FIRE.stoneHigh
    }
  }
  // Reflection highlight
  s[2][2] = HELL_FIRE.pureWhite
  s[3][2] = HELL_FIRE.pureWhite
  s[4][2] = HELL_FIRE.bone
  s[5][2] = HELL_FIRE.bone
  s[6][2] = HELL_FIRE.bone
  s[7][2] = HELL_FIRE.bone
  s[8][2] = HELL_FIRE.bone
  // Dark side
  s[2][5] = HELL_FIRE.stoneLite
  s[3][5] = HELL_FIRE.stoneLite
  s[4][5] = HELL_FIRE.stoneLite
  s[5][5] = HELL_FIRE.stoneLite
  s[6][5] = HELL_FIRE.stoneLite
  s[7][5] = HELL_FIRE.stoneLite
  s[8][5] = HELL_FIRE.stoneLite
  s[9][5] = HELL_FIRE.stoneLite
  s[10][5] = HELL_FIRE.stoneLite
  s[11][5] = HELL_FIRE.stoneLite
  s[12][5] = HELL_FIRE.stoneLite
  s[13][5] = HELL_FIRE.stoneLite

  // Decorative top crest
  s[1][3] = HELL_FIRE.goldBright
  s[1][4] = HELL_FIRE.goldBright

  return s
}

// === STATUE (8x16) — small obsidian demon statue ===
function makeStatue(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(8).fill(_))

  // Pedestal (rows 12-15)
  s[12] = Array(8).fill(HELL_FIRE.stoneMid)
  s[13] = Array(8).fill(HELL_FIRE.stoneLite)
  s[14] = Array(8).fill(HELL_FIRE.stoneLite)
  s[15] = Array(8).fill(HELL_FIRE.stoneDark)
  // Pedestal highlight
  s[12][0] = HELL_FIRE.stoneDark
  s[12][7] = HELL_FIRE.stoneDark
  s[13][0] = HELL_FIRE.stoneMid
  s[13][7] = HELL_FIRE.stoneMid
  s[14][0] = HELL_FIRE.stoneMid
  s[14][7] = HELL_FIRE.stoneMid

  // Body of statue (rows 5-11) — obsidian black with red highlights
  // Head (rows 0-5)
  s[0][3] = HELL_FIRE.black
  s[0][4] = HELL_FIRE.black
  s[1][2] = HELL_FIRE.black
  s[1][3] = HELL_FIRE.smokeDark
  s[1][4] = HELL_FIRE.smokeDark
  s[1][5] = HELL_FIRE.black
  // Horns
  s[0][2] = HELL_FIRE.redDark
  s[0][5] = HELL_FIRE.redDark
  s[1][1] = HELL_FIRE.redMid
  s[1][6] = HELL_FIRE.redMid
  s[2][1] = HELL_FIRE.redBright
  s[2][6] = HELL_FIRE.redBright
  // Face
  s[2][2] = HELL_FIRE.smokeDark
  s[2][3] = HELL_FIRE.smokeMid
  s[2][4] = HELL_FIRE.smokeMid
  s[2][5] = HELL_FIRE.smokeDark
  s[3][2] = HELL_FIRE.smokeDark
  s[3][3] = HELL_FIRE.smokeMid
  s[3][4] = HELL_FIRE.smokeMid
  s[3][5] = HELL_FIRE.smokeDark
  // Glowing eyes
  s[3][3] = HELL_FIRE.lavaGlow
  s[3][4] = HELL_FIRE.lavaGlow
  s[4][3] = HELL_FIRE.redFire
  s[4][4] = HELL_FIRE.redFire
  s[4][2] = HELL_FIRE.smokeDark
  s[4][5] = HELL_FIRE.smokeDark
  s[5][2] = HELL_FIRE.smokeDark
  s[5][3] = HELL_FIRE.smokeMid
  s[5][4] = HELL_FIRE.smokeMid
  s[5][5] = HELL_FIRE.smokeDark

  // Torso (rows 6-11)
  s[6][2] = HELL_FIRE.smokeDark
  s[6][3] = HELL_FIRE.smokeMid
  s[6][4] = HELL_FIRE.smokeMid
  s[6][5] = HELL_FIRE.smokeDark
  s[7][2] = HELL_FIRE.smokeDark
  s[7][3] = HELL_FIRE.smokeMid
  s[7][4] = HELL_FIRE.smokeMid
  s[7][5] = HELL_FIRE.smokeDark
  // Arms
  s[6][1] = HELL_FIRE.smokeDark
  s[6][6] = HELL_FIRE.smokeDark
  s[7][1] = HELL_FIRE.smokeDark
  s[7][6] = HELL_FIRE.smokeDark
  s[8][1] = HELL_FIRE.smokeDark
  s[8][6] = HELL_FIRE.smokeDark
  s[9][1] = HELL_FIRE.smokeDark
  s[9][6] = HELL_FIRE.smokeDark

  // Body widening
  s[8][2] = HELL_FIRE.smokeMid
  s[8][3] = HELL_FIRE.smokeLite
  s[8][4] = HELL_FIRE.smokeLite
  s[8][5] = HELL_FIRE.smokeMid
  s[9][2] = HELL_FIRE.smokeMid
  s[9][3] = HELL_FIRE.smokeLite
  s[9][4] = HELL_FIRE.smokeLite
  s[9][5] = HELL_FIRE.smokeMid
  s[10][2] = HELL_FIRE.smokeDark
  s[10][3] = HELL_FIRE.smokeMid
  s[10][4] = HELL_FIRE.smokeMid
  s[10][5] = HELL_FIRE.smokeDark
  s[11][2] = HELL_FIRE.smokeDark
  s[11][3] = HELL_FIRE.smokeMid
  s[11][4] = HELL_FIRE.smokeMid
  s[11][5] = HELL_FIRE.smokeDark

  // Chest emblem (rows 8-9, col 3-4) — glowing sigil
  s[8][3] = HELL_FIRE.lavaGlow
  s[8][4] = HELL_FIRE.lavaHot
  s[9][3] = HELL_FIRE.lavaBright
  s[9][4] = HELL_FIRE.lavaBright

  return s
}

// === FLAG (8x16) — banner on pole ===
function makeFlag(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(8).fill(_))

  // Pole (rows 0-15, cols 1-2)
  for (let y = 0; y < 16; y++) {
    s[y][1] = HELL_FIRE.goldMid
    s[y][2] = HELL_FIRE.goldDark
  }
  // Top finial
  s[0][1] = HELL_FIRE.goldBright
  s[0][2] = HELL_FIRE.goldBright
  // Ball on top
  s[0][1] = HELL_FIRE.goldGlow
  s[0][2] = HELL_FIRE.goldBright
  // Pole base
  s[14][0] = HELL_FIRE.goldDark
  s[14][1] = HELL_FIRE.goldMid
  s[14][2] = HELL_FIRE.goldMid
  s[14][3] = HELL_FIRE.goldDark
  s[15][0] = HELL_FIRE.goldDark
  s[15][1] = HELL_FIRE.goldMid
  s[15][2] = HELL_FIRE.goldMid
  s[15][3] = HELL_FIRE.goldDark

  // Banner (rows 1-10, cols 3-7) — wavy red flag
  for (let y = 1; y < 11; y++) {
    s[y][3] = HELL_FIRE.redBright
    s[y][4] = HELL_FIRE.redFire
    s[y][5] = HELL_FIRE.redBright
    s[y][6] = HELL_FIRE.redFire
    s[y][7] = HELL_FIRE.redBright
  }
  // Wavy edge (right side)
  s[1][7] = HELL_FIRE.redFire
  s[2][6] = HELL_FIRE.redMid
  s[2][7] = HELL_FIRE.redMid
  s[3][7] = HELL_FIRE.redFire
  s[4][6] = HELL_FIRE.redMid
  s[4][7] = HELL_FIRE.redMid
  s[5][7] = HELL_FIRE.redFire
  s[6][6] = HELL_FIRE.redMid
  s[6][7] = HELL_FIRE.redMid
  s[7][7] = HELL_FIRE.redFire
  s[8][6] = HELL_FIRE.redMid
  s[8][7] = HELL_FIRE.redMid
  s[9][7] = HELL_FIRE.redFire
  s[10][6] = HELL_FIRE.redMid
  s[10][7] = HELL_FIRE.redMid

  // Gold sigil in middle (rows 4-6, col 4-6)
  s[4][5] = HELL_FIRE.goldBright
  s[5][4] = HELL_FIRE.goldBright
  s[5][5] = HELL_FIRE.goldGlow
  s[5][6] = HELL_FIRE.goldBright
  s[6][5] = HELL_FIRE.goldBright

  // Top edge of banner (highlight)
  s[1][3] = HELL_FIRE.goldMid
  s[1][4] = HELL_FIRE.goldMid
  s[1][5] = HELL_FIRE.goldMid
  s[1][6] = HELL_FIRE.goldMid
  s[1][7] = HELL_FIRE.goldMid

  return s
}

export const PAINTING: SpriteData = makePainting()
export const BULLETIN: SpriteData = makeBulletin()
export const MIRROR: SpriteData = makeMirror()
export const STATUE: SpriteData = makeStatue()
export const FLAG: SpriteData = makeFlag()
