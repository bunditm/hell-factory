// Furniture — office swivel chairs (8x8, four directions)

import { HELL_FIRE } from '../../pixelArt'
import type { SpriteData } from '../../sprites'

const _: string = ''

// Each chair is 8x8. Top-down view: back of chair visible at top, seat in middle, wheels at bottom.
// Down = facing camera (we see the front edge of the seat and the back behind)
// Up = back is toward us (we see the back of the chair)
// Left/Right = profile views

// === CHAIR_DOWN (8x8) — facing camera, back at top ===
function makeChairDown(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 8; y++) s.push(Array(8).fill(_))

  // Backrest at top (rows 0-2)
  for (let y = 0; y < 3; y++) {
    for (let x = 2; x < 6; x++) {
      s[y][x] = HELL_FIRE.redBright
    }
  }
  // Backrest top edge highlight
  s[0] = [_, _, HELL_FIRE.redFire, HELL_FIRE.redFire, HELL_FIRE.redFire, HELL_FIRE.redFire, _, _]
  // Backrest sides darken
  s[0][2] = HELL_FIRE.redFire
  s[0][5] = HELL_FIRE.redFire
  s[1][2] = HELL_FIRE.redMid
  s[1][5] = HELL_FIRE.redMid
  // Backrest center stripe (gold)
  s[1][3] = HELL_FIRE.goldMid
  s[1][4] = HELL_FIRE.goldMid

  // Seat (rows 3-5) — wider, with armrests
  for (let y = 3; y < 6; y++) {
    for (let x = 1; x < 7; x++) {
      s[y][x] = HELL_FIRE.redMid
    }
  }
  // Seat highlight
  s[3] = [_, HELL_FIRE.redFire, HELL_FIRE.redBright, HELL_FIRE.redBright, HELL_FIRE.redBright, HELL_FIRE.redBright, HELL_FIRE.redFire, _]
  // Seat edge
  s[5] = [_, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, _]
  // Armrests (sides)
  s[3][0] = HELL_FIRE.stoneDark
  s[3][7] = HELL_FIRE.stoneDark
  s[4][0] = HELL_FIRE.stoneDark
  s[4][7] = HELL_FIRE.stoneDark

  // Base / wheels (rows 6-7)
  // Center post
  s[6][3] = HELL_FIRE.stoneMid
  s[6][4] = HELL_FIRE.stoneMid
  // Five-spoke star
  s[6][1] = HELL_FIRE.stoneLite
  s[6][6] = HELL_FIRE.stoneLite
  s[6][2] = HELL_FIRE.stoneLite
  s[6][5] = HELL_FIRE.stoneLite
  s[7][3] = HELL_FIRE.stoneDark
  s[7][4] = HELL_FIRE.stoneDark
  // Wheels
  s[7][1] = HELL_FIRE.stoneDark
  s[7][2] = HELL_FIRE.stoneDark
  s[7][5] = HELL_FIRE.stoneDark
  s[7][6] = HELL_FIRE.stoneDark
  s[7][0] = HELL_FIRE.black
  s[7][7] = HELL_FIRE.black

  return s
}

// === CHAIR_UP (8x8) — back toward camera, we see back of backrest ===
function makeChairUp(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 8; y++) s.push(Array(8).fill(_))

  // Backrest seen from behind (rows 0-2) — solid red, no center stripe
  for (let y = 0; y < 3; y++) {
    for (let x = 2; x < 6; x++) {
      s[y][x] = HELL_FIRE.redMid
    }
  }
  s[0] = [_, _, HELL_FIRE.redBright, HELL_FIRE.redBright, HELL_FIRE.redBright, HELL_FIRE.redBright, _, _]
  s[0][2] = HELL_FIRE.redFire
  s[0][5] = HELL_FIRE.redFire
  s[1][2] = HELL_FIRE.redMid
  s[1][5] = HELL_FIRE.redMid
  // Stitched seam down center
  s[1][3] = HELL_FIRE.redDark
  s[1][4] = HELL_FIRE.redDark

  // Seat (rows 3-5) — back of seat visible
  for (let y = 3; y < 6; y++) {
    for (let x = 1; x < 7; x++) {
      s[y][x] = HELL_FIRE.redDark
    }
  }
  s[5] = [_, HELL_FIRE.redMid, HELL_FIRE.redMid, HELL_FIRE.redMid, HELL_FIRE.redMid, HELL_FIRE.redMid, HELL_FIRE.redMid, _]

  // Base
  s[6][3] = HELL_FIRE.stoneMid
  s[6][4] = HELL_FIRE.stoneMid
  s[6][1] = HELL_FIRE.stoneLite
  s[6][6] = HELL_FIRE.stoneLite
  s[6][2] = HELL_FIRE.stoneLite
  s[6][5] = HELL_FIRE.stoneLite
  s[7][3] = HELL_FIRE.stoneDark
  s[7][4] = HELL_FIRE.stoneDark
  s[7][1] = HELL_FIRE.stoneDark
  s[7][2] = HELL_FIRE.stoneDark
  s[7][5] = HELL_FIRE.stoneDark
  s[7][6] = HELL_FIRE.stoneDark
  s[7][0] = HELL_FIRE.black
  s[7][7] = HELL_FIRE.black

  return s
}

// === CHAIR_LEFT (8x8) — profile, facing left ===
function makeChairLeft(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 8; y++) s.push(Array(8).fill(_))

  // Backrest on right side (rows 0-4, cols 4-6) — taller when seen from side
  for (let y = 0; y < 5; y++) {
    for (let x = 4; x < 7; x++) {
      s[y][x] = HELL_FIRE.redMid
    }
  }
  s[0][5] = HELL_FIRE.redBright
  s[0][4] = HELL_FIRE.redBright
  s[0][6] = HELL_FIRE.redBright
  s[1][5] = HELL_FIRE.redFire
  // Gold accent on side of backrest
  s[2][4] = HELL_FIRE.goldMid
  s[3][4] = HELL_FIRE.goldDark
  s[4][4] = HELL_FIRE.goldDark

  // Seat (rows 4-5, cols 1-5) — extends to the left
  for (let y = 4; y < 6; y++) {
    for (let x = 1; x < 6; x++) {
      s[y][x] = HELL_FIRE.redMid
    }
  }
  s[4] = [_, HELL_FIRE.redFire, HELL_FIRE.redBright, HELL_FIRE.redBright, HELL_FIRE.redBright, HELL_FIRE.redFire, _, _]
  s[5] = [_, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, _, _]
  // Armrest (row 3-4, col 3-4)
  s[3][3] = HELL_FIRE.stoneDark
  s[3][4] = HELL_FIRE.stoneDark
  s[4][3] = HELL_FIRE.stoneDark
  s[4][4] = HELL_FIRE.stoneDark

  // Base / wheels (rows 6-7)
  s[6][2] = HELL_FIRE.stoneLite
  s[6][3] = HELL_FIRE.stoneMid
  s[6][4] = HELL_FIRE.stoneMid
  s[6][5] = HELL_FIRE.stoneLite
  s[7][1] = HELL_FIRE.stoneDark
  s[7][2] = HELL_FIRE.stoneDark
  s[7][3] = HELL_FIRE.stoneDark
  s[7][4] = HELL_FIRE.stoneDark
  s[7][5] = HELL_FIRE.stoneDark
  s[7][6] = HELL_FIRE.stoneDark
  s[7][0] = HELL_FIRE.black
  s[7][7] = HELL_FIRE.black

  return s
}

// === CHAIR_RIGHT (8x8) — profile, facing right (mirror of left) ===
function makeChairRight(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 8; y++) s.push(Array(8).fill(_))

  // Backrest on left side (rows 0-4, cols 1-3)
  for (let y = 0; y < 5; y++) {
    for (let x = 1; x < 4; x++) {
      s[y][x] = HELL_FIRE.redMid
    }
  }
  s[0][1] = HELL_FIRE.redBright
  s[0][2] = HELL_FIRE.redBright
  s[0][3] = HELL_FIRE.redBright
  s[1][2] = HELL_FIRE.redFire
  // Gold accent
  s[2][3] = HELL_FIRE.goldMid
  s[3][3] = HELL_FIRE.goldDark
  s[4][3] = HELL_FIRE.goldDark

  // Seat (rows 4-5, cols 2-6)
  for (let y = 4; y < 6; y++) {
    for (let x = 2; x < 7; x++) {
      s[y][x] = HELL_FIRE.redMid
    }
  }
  s[4] = [_, _, HELL_FIRE.redFire, HELL_FIRE.redBright, HELL_FIRE.redBright, HELL_FIRE.redBright, HELL_FIRE.redFire, _]
  s[5] = [_, _, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, HELL_FIRE.redDark, _]
  // Armrest
  s[3][3] = HELL_FIRE.stoneDark
  s[3][4] = HELL_FIRE.stoneDark
  s[4][3] = HELL_FIRE.stoneDark
  s[4][4] = HELL_FIRE.stoneDark

  // Base / wheels
  s[6][2] = HELL_FIRE.stoneLite
  s[6][3] = HELL_FIRE.stoneMid
  s[6][4] = HELL_FIRE.stoneMid
  s[6][5] = HELL_FIRE.stoneLite
  s[7][1] = HELL_FIRE.stoneDark
  s[7][2] = HELL_FIRE.stoneDark
  s[7][3] = HELL_FIRE.stoneDark
  s[7][4] = HELL_FIRE.stoneDark
  s[7][5] = HELL_FIRE.stoneDark
  s[7][6] = HELL_FIRE.stoneDark
  s[7][0] = HELL_FIRE.black
  s[7][7] = HELL_FIRE.black

  return s
}

export const CHAIR_DOWN: SpriteData = makeChairDown()
export const CHAIR_UP: SpriteData = makeChairUp()
export const CHAIR_LEFT: SpriteData = makeChairLeft()
export const CHAIR_RIGHT: SpriteData = makeChairRight()
