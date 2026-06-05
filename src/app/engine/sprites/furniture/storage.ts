// Furniture — storage: bookshelf, water cooler, vending machine, filing cabinet, whiteboard, clock

import { HELL_FIRE } from '../../pixelArt'
import type { SpriteData } from '../../sprites'

const _: string = ''

// === BOOKSHELF (16x32) — tall wooden bookshelf with rows of colored books ===
function makeBookshelf(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 32; y++) s.push(Array(16).fill(_))

  // Outer frame (left, right, top, bottom)
  for (let y = 0; y < 32; y++) {
    s[y][0] = HELL_FIRE.barkDark
    s[y][1] = HELL_FIRE.barkMid
    s[y][14] = HELL_FIRE.barkMid
    s[y][15] = HELL_FIRE.barkDark
  }
  // Top
  s[0] = Array(16).fill(HELL_FIRE.barkDark)
  s[1] = Array(16).fill(HELL_FIRE.cloth)
  // Bottom
  s[30] = Array(16).fill(HELL_FIRE.barkDark)
  s[31] = Array(16).fill(HELL_FIRE.cloth)

  // Shelves at y=1, 8, 15, 22, 30 (horizontal planks)
  const shelfYs = [1, 8, 15, 22, 30]
  for (const y of shelfYs) {
    for (let x = 2; x < 14; x++) {
      s[y][x] = HELL_FIRE.clothLite
    }
  }

  // Row 1: books between y=2-7 (6 rows tall)
  const bookColors1 = [HELL_FIRE.redFire, HELL_FIRE.redBright, HELL_FIRE.goldDark, HELL_FIRE.redMid, HELL_FIRE.goldMid, HELL_FIRE.redDark, HELL_FIRE.redFire, HELL_FIRE.redBright, HELL_FIRE.goldDark, HELL_FIRE.redMid]
  for (let i = 0; i < bookColors1.length; i++) {
    const x = 2 + i
    for (let y = 2; y < 8; y++) {
      s[y][x] = bookColors1[i]
    }
    // Highlight at top of book
    s[2][x] = HELL_FIRE.goldMid
  }

  // Row 2: books between y=9-14
  const bookColors2 = [HELL_FIRE.stoneMid, HELL_FIRE.goldBright, HELL_FIRE.redFire, HELL_FIRE.stoneLite, HELL_FIRE.goldMid, HELL_FIRE.redBright, HELL_FIRE.stoneMid, HELL_FIRE.goldBright, HELL_FIRE.redFire, HELL_FIRE.stoneLite]
  for (let i = 0; i < bookColors2.length; i++) {
    const x = 2 + i
    for (let y = 9; y < 15; y++) {
      s[y][x] = bookColors2[i]
    }
    s[9][x] = HELL_FIRE.goldDark
  }

  // Row 3: books between y=16-21
  const bookColors3 = [HELL_FIRE.redMid, HELL_FIRE.goldDark, HELL_FIRE.redFire, HELL_FIRE.redBright, HELL_FIRE.goldMid, HELL_FIRE.redDark, HELL_FIRE.redMid, HELL_FIRE.goldDark, HELL_FIRE.redFire, HELL_FIRE.redBright]
  for (let i = 0; i < bookColors3.length; i++) {
    const x = 2 + i
    for (let y = 16; y < 22; y++) {
      s[y][x] = bookColors3[i]
    }
    s[16][x] = HELL_FIRE.goldMid
  }

  // Row 4: books between y=23-29
  const bookColors4 = [HELL_FIRE.goldMid, HELL_FIRE.redFire, HELL_FIRE.stoneMid, HELL_FIRE.goldBright, HELL_FIRE.redBright, HELL_FIRE.stoneLite, HELL_FIRE.goldMid, HELL_FIRE.redFire, HELL_FIRE.stoneMid, HELL_FIRE.goldBright]
  for (let i = 0; i < bookColors4.length; i++) {
    const x = 2 + i
    for (let y = 23; y < 30; y++) {
      s[y][x] = bookColors4[i]
    }
    s[23][x] = HELL_FIRE.goldDark
  }

  // Side trim gold accents
  for (const y of shelfYs) {
    s[y][1] = HELL_FIRE.goldDark
    s[y][14] = HELL_FIRE.goldDark
  }

  return s
}

// === WATER_COOLER (8x16) — blue jug on top, dispenser ===
function makeWaterCooler(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(8).fill(_))

  // Jug on top (rows 0-5)
  // Cap
  s[0][3] = HELL_FIRE.stoneLite
  s[0][4] = HELL_FIRE.stoneLite
  s[1][3] = HELL_FIRE.stoneMid
  s[1][4] = HELL_FIRE.stoneMid
  // Jug body (rounded)
  s[2][2] = HELL_FIRE.smokeMid
  s[2][3] = HELL_FIRE.stoneHigh
  s[2][4] = HELL_FIRE.stoneHigh
  s[2][5] = HELL_FIRE.smokeMid
  s[3][1] = HELL_FIRE.smokeMid
  s[3][2] = HELL_FIRE.stoneHigh
  s[3][3] = HELL_FIRE.lavaBright  // "water" is actually glowing
  s[3][4] = HELL_FIRE.lavaBright
  s[3][5] = HELL_FIRE.stoneHigh
  s[3][6] = HELL_FIRE.smokeMid
  s[4][1] = HELL_FIRE.smokeMid
  s[4][2] = HELL_FIRE.stoneHigh
  s[4][3] = HELL_FIRE.lavaHot
  s[4][4] = HELL_FIRE.lavaHot
  s[4][5] = HELL_FIRE.stoneHigh
  s[4][6] = HELL_FIRE.smokeMid
  s[5][1] = HELL_FIRE.smokeMid
  s[5][2] = HELL_FIRE.stoneHigh
  s[5][3] = HELL_FIRE.lavaGlow
  s[5][4] = HELL_FIRE.lavaGlow
  s[5][5] = HELL_FIRE.stoneHigh
  s[5][6] = HELL_FIRE.smokeMid
  s[6][2] = HELL_FIRE.smokeMid
  s[6][3] = HELL_FIRE.stoneLite
  s[6][4] = HELL_FIRE.stoneLite
  s[6][5] = HELL_FIRE.smokeMid

  // Body of cooler (rows 7-15)
  for (let y = 7; y < 16; y++) {
    s[y][0] = HELL_FIRE.smokeMid
    s[y][1] = HELL_FIRE.smokeLite
    s[y][2] = HELL_FIRE.bone
    s[y][3] = HELL_FIRE.bone
    s[y][4] = HELL_FIRE.bone
    s[y][5] = HELL_FIRE.bone
    s[y][6] = HELL_FIRE.smokeLite
    s[y][7] = HELL_FIRE.smokeMid
  }
  // Highlight on left
  s[7][2] = HELL_FIRE.pureWhite
  s[8][2] = HELL_FIRE.pureWhite
  s[9][2] = HELL_FIRE.pureWhite

  // Dispenser area (rows 10-12, cols 3-4)
  s[10][3] = HELL_FIRE.stoneDark
  s[10][4] = HELL_FIRE.stoneDark
  s[11][3] = HELL_FIRE.lavaBright
  s[11][4] = HELL_FIRE.lavaBright
  s[12][3] = HELL_FIRE.stoneDark
  s[12][4] = HELL_FIRE.stoneDark
  // Drip
  s[13][3] = HELL_FIRE.lavaGlow
  s[13][4] = HELL_FIRE.lavaGlow

  // Tray
  s[14][2] = HELL_FIRE.stoneLite
  s[14][3] = HELL_FIRE.stoneLite
  s[14][4] = HELL_FIRE.stoneLite
  s[14][5] = HELL_FIRE.stoneLite

  return s
}

// === VENDING_MACHINE (8x16) — gray machine with colored drink slots ===
function makeVendingMachine(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(8).fill(_))

  // Frame
  for (let y = 0; y < 16; y++) {
    s[y][0] = HELL_FIRE.stoneDark
    s[y][1] = HELL_FIRE.stoneMid
    s[y][6] = HELL_FIRE.stoneMid
    s[y][7] = HELL_FIRE.stoneDark
  }
  // Top
  s[0] = Array(8).fill(HELL_FIRE.stoneDark)
  s[1] = Array(8).fill(HELL_FIRE.stoneMid)
  // Bottom
  s[15] = Array(8).fill(HELL_FIRE.stoneDark)

  // Display panel (rows 2-5, cols 2-5) — lava glow
  for (let y = 2; y < 6; y++) {
    for (let x = 2; x < 6; x++) {
      s[y][x] = HELL_FIRE.lavaDeep
    }
  }
  s[2][2] = HELL_FIRE.lavaGlow
  s[2][5] = HELL_FIRE.lavaGlow
  s[3][3] = HELL_FIRE.lavaYellow
  s[3][4] = HELL_FIRE.lavaYellow
  s[4][3] = HELL_FIRE.lavaHot
  s[4][4] = HELL_FIRE.lavaHot

  // Drink slots — 3 rows of 3 drinks each
  // Row 1: y 6-7
  s[6][2] = HELL_FIRE.lavaBright
  s[6][3] = HELL_FIRE.lavaBright
  s[6][4] = HELL_FIRE.lavaBright
  s[7][2] = HELL_FIRE.lavaGlow
  s[7][3] = HELL_FIRE.lavaGlow
  s[7][4] = HELL_FIRE.lavaGlow
  // Row 2: y 8-9
  s[8][2] = HELL_FIRE.redFire
  s[8][3] = HELL_FIRE.redFire
  s[8][4] = HELL_FIRE.redFire
  s[9][2] = HELL_FIRE.redBright
  s[9][3] = HELL_FIRE.redBright
  s[9][4] = HELL_FIRE.redBright
  // Row 3: y 10-11
  s[10][2] = HELL_FIRE.goldMid
  s[10][3] = HELL_FIRE.goldMid
  s[10][4] = HELL_FIRE.goldMid
  s[11][2] = HELL_FIRE.goldDark
  s[11][3] = HELL_FIRE.goldDark
  s[11][4] = HELL_FIRE.goldDark

  // Coin slot / pickup (rows 12-14)
  s[12][2] = HELL_FIRE.goldDark
  s[12][3] = HELL_FIRE.goldDark
  s[12][4] = HELL_FIRE.goldDark
  s[13][2] = HELL_FIRE.black
  s[13][3] = HELL_FIRE.black
  s[13][4] = HELL_FIRE.black
  s[14][2] = HELL_FIRE.stoneDark
  s[14][3] = HELL_FIRE.stoneDark
  s[14][4] = HELL_FIRE.stoneDark
  s[14][5] = HELL_FIRE.goldMid

  return s
}

// === FILING_CABINET (8x16) — gray metal cabinet with drawers ===
function makeFilingCabinet(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(8).fill(_))

  // Outer frame
  for (let y = 0; y < 16; y++) {
    s[y][0] = HELL_FIRE.stoneDark
    s[y][1] = HELL_FIRE.stoneMid
    s[y][6] = HELL_FIRE.stoneMid
    s[y][7] = HELL_FIRE.stoneDark
  }
  // Top
  s[0] = Array(8).fill(HELL_FIRE.stoneHigh)

  // Drawer 1: rows 1-4
  for (let y = 1; y < 5; y++) {
    for (let x = 2; x < 6; x++) {
      s[y][x] = HELL_FIRE.stoneLite
    }
  }
  // Drawer border
  s[1][2] = HELL_FIRE.stoneHigh
  s[1][5] = HELL_FIRE.stoneHigh
  s[4][2] = HELL_FIRE.stoneDark
  s[4][5] = HELL_FIRE.stoneDark
  // Handle
  s[2][3] = HELL_FIRE.goldDark
  s[2][4] = HELL_FIRE.goldDark
  s[3][3] = HELL_FIRE.goldMid
  s[3][4] = HELL_FIRE.goldMid
  // Label
  s[1][3] = HELL_FIRE.bone
  s[1][4] = HELL_FIRE.bone

  // Drawer 2: rows 6-9
  for (let y = 6; y < 10; y++) {
    for (let x = 2; x < 6; x++) {
      s[y][x] = HELL_FIRE.stoneLite
    }
  }
  s[6][2] = HELL_FIRE.stoneHigh
  s[6][5] = HELL_FIRE.stoneHigh
  s[9][2] = HELL_FIRE.stoneDark
  s[9][5] = HELL_FIRE.stoneDark
  s[7][3] = HELL_FIRE.goldDark
  s[7][4] = HELL_FIRE.goldDark
  s[8][3] = HELL_FIRE.goldMid
  s[8][4] = HELL_FIRE.goldMid
  s[6][3] = HELL_FIRE.bone
  s[6][4] = HELL_FIRE.bone

  // Drawer 3: rows 11-14
  for (let y = 11; y < 15; y++) {
    for (let x = 2; x < 6; x++) {
      s[y][x] = HELL_FIRE.stoneLite
    }
  }
  s[11][2] = HELL_FIRE.stoneHigh
  s[11][5] = HELL_FIRE.stoneHigh
  s[14][2] = HELL_FIRE.stoneDark
  s[14][5] = HELL_FIRE.stoneDark
  s[12][3] = HELL_FIRE.goldDark
  s[12][4] = HELL_FIRE.goldDark
  s[13][3] = HELL_FIRE.goldMid
  s[13][4] = HELL_FIRE.goldMid
  s[11][3] = HELL_FIRE.bone
  s[11][4] = HELL_FIRE.bone

  // Legs/feet
  s[15][1] = HELL_FIRE.stoneDark
  s[15][6] = HELL_FIRE.stoneDark

  return s
}

// === WHITEBOARD (16x16) — white surface with colored marks ===
function makeWhiteboard(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Frame
  for (let y = 0; y < 16; y++) {
    s[y][0] = HELL_FIRE.stoneDark
    s[y][15] = HELL_FIRE.stoneDark
  }
  s[0] = Array(16).fill(HELL_FIRE.stoneMid)
  s[15] = Array(16).fill(HELL_FIRE.stoneMid)

  // White surface
  for (let y = 1; y < 15; y++) {
    for (let x = 1; x < 15; x++) {
      s[y][x] = HELL_FIRE.bone
    }
  }
  // Slight tint variation
  s[1][1] = HELL_FIRE.pureWhite
  s[1][14] = HELL_FIRE.pureWhite
  s[14][1] = HELL_FIRE.pureWhite
  s[14][14] = HELL_FIRE.pureWhite

  // Colored marks (text scribbles / diagram)
  // Red circle/diagram
  s[3][3] = HELL_FIRE.redBright
  s[3][4] = HELL_FIRE.redBright
  s[4][2] = HELL_FIRE.redBright
  s[4][5] = HELL_FIRE.redBright
  s[5][2] = HELL_FIRE.redBright
  s[5][5] = HELL_FIRE.redBright
  s[6][3] = HELL_FIRE.redBright
  s[6][4] = HELL_FIRE.redBright

  // Blue lines (text rows)
  s[3][8] = HELL_FIRE.lavaBright
  s[3][9] = HELL_FIRE.lavaBright
  s[3][10] = HELL_FIRE.lavaBright
  s[3][11] = HELL_FIRE.lavaBright
  s[4][8] = HELL_FIRE.lavaBright
  s[4][11] = HELL_FIRE.lavaBright
  s[5][8] = HELL_FIRE.lavaBright
  s[5][9] = HELL_FIRE.lavaBright
  s[5][11] = HELL_FIRE.lavaBright
  s[6][8] = HELL_FIRE.lavaBright
  s[6][11] = HELL_FIRE.lavaBright

  // Black diagram arrow
  s[9][3] = HELL_FIRE.black
  s[9][4] = HELL_FIRE.black
  s[9][5] = HELL_FIRE.black
  s[9][6] = HELL_FIRE.black
  s[10][7] = HELL_FIRE.black
  s[11][8] = HELL_FIRE.black
  s[12][7] = HELL_FIRE.black
  s[10][5] = HELL_FIRE.black
  s[10][6] = HELL_FIRE.black

  // Green checkmark
  s[9][11] = HELL_FIRE.lavaGlow
  s[10][10] = HELL_FIRE.lavaGlow
  s[10][11] = HELL_FIRE.lavaGlow
  s[11][9] = HELL_FIRE.lavaGlow
  s[11][10] = HELL_FIRE.lavaGlow
  s[11][11] = HELL_FIRE.lavaGlow
  s[12][10] = HELL_FIRE.lavaGlow
  s[12][11] = HELL_FIRE.lavaGlow

  return s
}

// === CLOCK (8x8) — round wall clock face ===
function makeClock(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 8; y++) s.push(Array(8).fill(_))

  // Outer ring
  s[0][3] = HELL_FIRE.stoneLite
  s[0][4] = HELL_FIRE.stoneLite
  s[1][2] = HELL_FIRE.stoneLite
  s[1][5] = HELL_FIRE.stoneLite
  s[2][1] = HELL_FIRE.stoneLite
  s[2][6] = HELL_FIRE.stoneLite
  s[3][1] = HELL_FIRE.stoneLite
  s[3][6] = HELL_FIRE.stoneLite
  s[4][1] = HELL_FIRE.stoneLite
  s[4][6] = HELL_FIRE.stoneLite
  s[5][2] = HELL_FIRE.stoneLite
  s[5][5] = HELL_FIRE.stoneLite
  s[6][3] = HELL_FIRE.stoneLite
  s[6][4] = HELL_FIRE.stoneLite

  // Face
  s[1][3] = HELL_FIRE.bone
  s[1][4] = HELL_FIRE.bone
  s[2][2] = HELL_FIRE.bone
  s[2][3] = HELL_FIRE.bone
  s[2][4] = HELL_FIRE.bone
  s[2][5] = HELL_FIRE.bone
  s[3][2] = HELL_FIRE.bone
  s[3][3] = HELL_FIRE.bone
  s[3][4] = HELL_FIRE.bone
  s[3][5] = HELL_FIRE.bone
  s[4][2] = HELL_FIRE.bone
  s[4][3] = HELL_FIRE.bone
  s[4][4] = HELL_FIRE.bone
  s[4][5] = HELL_FIRE.bone
  s[5][3] = HELL_FIRE.bone
  s[5][4] = HELL_FIRE.bone

  // Hour marks (12, 3, 6, 9 positions)
  s[1][3] = HELL_FIRE.black
  s[1][4] = HELL_FIRE.black
  s[6][3] = HELL_FIRE.black
  s[6][4] = HELL_FIRE.black
  s[3][1] = HELL_FIRE.black
  s[4][1] = HELL_FIRE.black
  s[3][6] = HELL_FIRE.black
  s[4][6] = HELL_FIRE.black

  // Hands (pointing to ~10:10)
  // Hour hand (shorter, pointing up-left)
  s[3][3] = HELL_FIRE.black
  s[2][2] = HELL_FIRE.black
  // Minute hand (longer, pointing up-right)
  s[3][4] = HELL_FIRE.black
  s[2][5] = HELL_FIRE.black
  s[1][5] = HELL_FIRE.black

  // Center dot
  s[3][3] = HELL_FIRE.redBright

  return s
}

export const BOOKSHELF: SpriteData = makeBookshelf()
export const WATER_COOLER: SpriteData = makeWaterCooler()
export const VENDING_MACHINE: SpriteData = makeVendingMachine()
export const FILING_CABINET: SpriteData = makeFilingCabinet()
export const WHITEBOARD: SpriteData = makeWhiteboard()
export const CLOCK: SpriteData = makeClock()
