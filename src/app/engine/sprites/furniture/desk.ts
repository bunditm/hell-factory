// Furniture — desks (16x16)

import { HELL_FIRE } from '../../pixelArt'
import type { SpriteData } from '../../sprites'

const _: string = ''

// === DESK_WOOD (16x16) — wooden desk with monitor, papers, lava-glow edge ===
function makeDeskWood(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Desk top (rows 0-4) — wood color
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 16; x++) {
      s[y][x] = HELL_FIRE.cloth
    }
  }
  // Top edge highlight (row 0)
  for (let x = 0; x < 16; x++) s[0][x] = HELL_FIRE.clothLite
  // Wood grain on top
  s[1][2] = HELL_FIRE.clothLite
  s[1][6] = HELL_FIRE.clothLite
  s[1][10] = HELL_FIRE.clothLite
  s[1][14] = HELL_FIRE.clothLite
  s[2][3] = HELL_FIRE.barkMid
  s[2][9] = HELL_FIRE.barkMid
  s[2][13] = HELL_FIRE.barkMid
  s[3][2] = HELL_FIRE.clothLite
  s[3][8] = HELL_FIRE.clothLite
  s[3][14] = HELL_FIRE.clothLite
  // Lava-glow edge along front of top (row 4)
  for (let x = 0; x < 16; x++) {
    s[4][x] = (x % 2 === 0) ? HELL_FIRE.lavaGlow : HELL_FIRE.lavaHot
  }

  // Front face (rows 5-13) — darker wood
  for (let y = 5; y < 14; y++) {
    for (let x = 0; x < 16; x++) {
      s[y][x] = HELL_FIRE.barkDark
    }
  }
  // Wood panels (3 drawers)
  // Drawer 1: x 1-4
  s[5][1] = HELL_FIRE.cloth
  s[5][2] = HELL_FIRE.cloth
  s[5][3] = HELL_FIRE.cloth
  s[5][4] = HELL_FIRE.cloth
  s[6][1] = HELL_FIRE.cloth
  s[6][2] = HELL_FIRE.cloth
  s[6][3] = HELL_FIRE.cloth
  s[6][4] = HELL_FIRE.cloth
  s[7][1] = HELL_FIRE.cloth
  s[7][2] = HELL_FIRE.cloth
  s[7][3] = HELL_FIRE.cloth
  s[7][4] = HELL_FIRE.cloth
  s[8][1] = HELL_FIRE.cloth
  s[8][2] = HELL_FIRE.cloth
  s[8][3] = HELL_FIRE.cloth
  s[8][4] = HELL_FIRE.cloth
  // Drawer handle
  s[6][2] = HELL_FIRE.goldDark
  s[6][3] = HELL_FIRE.goldMid
  s[7][2] = HELL_FIRE.goldDark
  s[7][3] = HELL_FIRE.goldMid

  // Drawer 2: x 6-9
  s[5][6] = HELL_FIRE.cloth
  s[5][7] = HELL_FIRE.cloth
  s[5][8] = HELL_FIRE.cloth
  s[5][9] = HELL_FIRE.cloth
  s[6][6] = HELL_FIRE.cloth
  s[6][7] = HELL_FIRE.cloth
  s[6][8] = HELL_FIRE.cloth
  s[6][9] = HELL_FIRE.cloth
  s[7][6] = HELL_FIRE.cloth
  s[7][7] = HELL_FIRE.cloth
  s[7][8] = HELL_FIRE.cloth
  s[7][9] = HELL_FIRE.cloth
  s[8][6] = HELL_FIRE.cloth
  s[8][7] = HELL_FIRE.cloth
  s[8][8] = HELL_FIRE.cloth
  s[8][9] = HELL_FIRE.cloth
  s[6][7] = HELL_FIRE.goldDark
  s[6][8] = HELL_FIRE.goldMid
  s[7][7] = HELL_FIRE.goldDark
  s[7][8] = HELL_FIRE.goldMid

  // Drawer 3: x 11-14
  s[5][11] = HELL_FIRE.cloth
  s[5][12] = HELL_FIRE.cloth
  s[5][13] = HELL_FIRE.cloth
  s[5][14] = HELL_FIRE.cloth
  s[6][11] = HELL_FIRE.cloth
  s[6][12] = HELL_FIRE.cloth
  s[6][13] = HELL_FIRE.cloth
  s[6][14] = HELL_FIRE.cloth
  s[7][11] = HELL_FIRE.cloth
  s[7][12] = HELL_FIRE.cloth
  s[7][13] = HELL_FIRE.cloth
  s[7][14] = HELL_FIRE.cloth
  s[8][11] = HELL_FIRE.cloth
  s[8][12] = HELL_FIRE.cloth
  s[8][13] = HELL_FIRE.cloth
  s[8][14] = HELL_FIRE.cloth
  s[6][12] = HELL_FIRE.goldDark
  s[6][13] = HELL_FIRE.goldMid
  s[7][12] = HELL_FIRE.goldDark
  s[7][13] = HELL_FIRE.goldMid

  // Lower section (rows 9-13) — knee space, dark
  // Side legs (x 0-1, x 14-15)
  for (let y = 9; y < 14; y++) {
    s[y][0] = HELL_FIRE.barkDark
    s[y][1] = HELL_FIRE.barkDark
    s[y][14] = HELL_FIRE.barkDark
    s[y][15] = HELL_FIRE.barkDark
  }
  // Knee space (x 2-13, rows 9-13)
  for (let y = 9; y < 14; y++) {
    for (let x = 2; x < 14; x++) {
      s[y][x] = HELL_FIRE.black
    }
  }
  // Lava glow at bottom of knee space (row 13)
  for (let x = 2; x < 14; x++) {
    s[13][x] = (x % 2 === 0) ? HELL_FIRE.lavaDeep : HELL_FIRE.lavaMid
  }

  // Floor (rows 14-15)
  for (let y = 14; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      s[y][x] = HELL_FIRE.smokeDark
    }
  }

  // === Items on top of desk ===
  // Monitor (rows 1-3, cols 6-9) — sits on top of desk
  s[1][6] = HELL_FIRE.stoneDark
  s[1][7] = HELL_FIRE.stoneDark
  s[1][8] = HELL_FIRE.stoneDark
  s[1][9] = HELL_FIRE.stoneDark
  s[2][6] = HELL_FIRE.lavaGlow
  s[2][7] = HELL_FIRE.lavaYellow
  s[2][8] = HELL_FIRE.lavaHot
  s[2][9] = HELL_FIRE.lavaBright
  s[3][6] = HELL_FIRE.lavaGlow
  s[3][7] = HELL_FIRE.lavaWhite
  s[3][8] = HELL_FIRE.lavaYellow
  s[3][9] = HELL_FIRE.lavaHot

  // Stack of papers (rows 1-3, cols 11-13)
  s[1][11] = HELL_FIRE.bone
  s[1][12] = HELL_FIRE.bone
  s[1][13] = HELL_FIRE.bone
  s[2][11] = HELL_FIRE.bone
  s[2][12] = HELL_FIRE.bone
  s[2][13] = HELL_FIRE.bone
  s[3][11] = HELL_FIRE.smokeLite
  s[3][12] = HELL_FIRE.smokeLite
  s[3][13] = HELL_FIRE.smokeLite
  // Paper lines
  s[2][12] = HELL_FIRE.smokeMid

  // Coffee cup (rows 1-3, cols 1-2) — small lava cup
  s[1][1] = HELL_FIRE.lavaBright
  s[1][2] = HELL_FIRE.lavaBright
  s[2][1] = HELL_FIRE.lavaGlow
  s[2][2] = HELL_FIRE.lavaGlow
  s[3][1] = HELL_FIRE.lavaDeep
  s[3][2] = HELL_FIRE.lavaDeep
  s[3][1] = HELL_FIRE.lavaMid
  s[3][2] = HELL_FIRE.lavaMid

  return s
}

// === DESK_HERMES (16x16) — ornate dark wood desk with gold trim, glowing center ===
function makeDeskHermes(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(16).fill(_))

  // Desk top (rows 0-4) — dark wood with gold trim
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 16; x++) {
      s[y][x] = HELL_FIRE.barkDark
    }
  }
  // Gold trim top edge
  s[0] = Array(16).fill(HELL_FIRE.goldDark)
  s[0][0] = HELL_FIRE.goldBright
  s[0][15] = HELL_FIRE.goldBright
  // Top of desk surface — marble pattern with red veins
  s[1][2] = HELL_FIRE.goldMid
  s[1][7] = HELL_FIRE.redDark
  s[1][12] = HELL_FIRE.goldMid
  s[2][4] = HELL_FIRE.goldMid
  s[2][9] = HELL_FIRE.redFire
  s[2][13] = HELL_FIRE.goldMid
  s[3][1] = HELL_FIRE.goldMid
  s[3][5] = HELL_FIRE.redFire
  s[3][10] = HELL_FIRE.goldMid
  s[3][14] = HELL_FIRE.goldMid

  // Glowing center (rows 1-3, cols 7-8) — orb/sigil
  s[1][7] = HELL_FIRE.lavaGlow
  s[1][8] = HELL_FIRE.lavaYellow
  s[2][7] = HELL_FIRE.lavaWhite
  s[2][8] = HELL_FIRE.lavaYellow
  s[3][7] = HELL_FIRE.lavaHot
  s[3][8] = HELL_FIRE.lavaBright

  // Front face (rows 5-13)
  for (let y = 5; y < 14; y++) {
    for (let x = 0; x < 16; x++) {
      s[y][x] = HELL_FIRE.barkMid
    }
  }
  // Gold trim border
  for (let y = 5; y < 14; y++) {
    s[y][0] = HELL_FIRE.goldDark
    s[y][15] = HELL_FIRE.goldDark
  }
  s[5] = Array(16).fill(HELL_FIRE.goldMid)
  s[13] = Array(16).fill(HELL_FIRE.goldMid)
  // Decorative gold line at row 9
  for (let x = 0; x < 16; x++) s[9][x] = HELL_FIRE.goldDark

  // Center sigil (rows 6-8, cols 7-8) — repeating glow
  s[6][7] = HELL_FIRE.redFire
  s[6][8] = HELL_FIRE.redFire
  s[7][7] = HELL_FIRE.lavaGlow
  s[7][8] = HELL_FIRE.lavaGlow
  s[8][7] = HELL_FIRE.lavaHot
  s[8][8] = HELL_FIRE.lavaHot

  // Two side columns (rows 6-12, cols 2-3 and 12-13)
  for (let y = 6; y < 13; y++) {
    s[y][2] = HELL_FIRE.goldDark
    s[y][3] = HELL_FIRE.goldMid
    s[y][12] = HELL_FIRE.goldMid
    s[y][13] = HELL_FIRE.goldDark
  }

  // Knee space (rows 10-12, cols 4-11)
  for (let y = 10; y < 13; y++) {
    for (let x = 4; x < 12; x++) {
      s[y][x] = HELL_FIRE.black
    }
  }
  // Lava glow under desk
  for (let x = 4; x < 12; x++) {
    s[12][x] = (x % 2 === 0) ? HELL_FIRE.lavaDeep : HELL_FIRE.lavaMid
  }

  // Floor (rows 14-15)
  for (let y = 14; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      s[y][x] = HELL_FIRE.smokeDark
    }
  }

  // === Items on top ===
  // Left scroll (rows 1-3, cols 1-3)
  s[1][1] = HELL_FIRE.bone
  s[1][2] = HELL_FIRE.bone
  s[1][3] = HELL_FIRE.bone
  s[2][1] = HELL_FIRE.bone
  s[2][2] = HELL_FIRE.smokeMid
  s[2][3] = HELL_FIRE.bone
  s[3][1] = HELL_FIRE.bone
  s[3][2] = HELL_FIRE.bone
  s[3][3] = HELL_FIRE.bone

  // Right book stack (rows 1-3, cols 12-14)
  s[1][12] = HELL_FIRE.redFire
  s[1][13] = HELL_FIRE.redFire
  s[1][14] = HELL_FIRE.redFire
  s[2][12] = HELL_FIRE.redBright
  s[2][13] = HELL_FIRE.redBright
  s[2][14] = HELL_FIRE.redBright
  s[3][12] = HELL_FIRE.redMid
  s[3][13] = HELL_FIRE.redMid
  s[3][14] = HELL_FIRE.redMid
  // Gold bookmark
  s[2][14] = HELL_FIRE.goldBright

  return s
}

export const DESK_WOOD: SpriteData = makeDeskWood()
export const DESK_HERMES: SpriteData = makeDeskHermes()
