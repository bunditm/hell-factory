// Furniture — lamps

import { HELL_FIRE } from '../../pixelArt'
import type { SpriteData } from '../../sprites'

const _: string = ''

// === LAMP_DESK (8x16) — desk lamp with base, arm, shade, glowing bulb ===
function makeLampDesk(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(8).fill(_))

  // Shade (rows 0-4) — conical/cylindrical
  // Top
  s[0][3] = HELL_FIRE.goldDark
  s[0][4] = HELL_FIRE.goldDark
  // Body
  s[1][2] = HELL_FIRE.goldDark
  s[1][3] = HELL_FIRE.goldMid
  s[1][4] = HELL_FIRE.goldMid
  s[1][5] = HELL_FIRE.goldDark
  s[2][1] = HELL_FIRE.goldDark
  s[2][2] = HELL_FIRE.goldMid
  s[2][3] = HELL_FIRE.goldBright
  s[2][4] = HELL_FIRE.goldBright
  s[2][5] = HELL_FIRE.goldMid
  s[2][6] = HELL_FIRE.goldDark
  s[3][0] = HELL_FIRE.goldDark
  s[3][1] = HELL_FIRE.goldMid
  s[3][2] = HELL_FIRE.goldBright
  s[3][3] = HELL_FIRE.goldBright
  s[3][4] = HELL_FIRE.goldBright
  s[3][5] = HELL_FIRE.goldBright
  s[3][6] = HELL_FIRE.goldMid
  s[3][7] = HELL_FIRE.goldDark
  s[4][0] = HELL_FIRE.goldDark
  s[4][1] = HELL_FIRE.goldDark
  s[4][2] = HELL_FIRE.goldDark
  s[4][3] = HELL_FIRE.goldDark
  s[4][4] = HELL_FIRE.goldDark
  s[4][5] = HELL_FIRE.goldDark
  s[4][6] = HELL_FIRE.goldDark
  s[4][7] = HELL_FIRE.goldDark

  // Bulb glow (rows 5-6, peeking out the bottom of shade)
  s[5][3] = HELL_FIRE.lavaWhite
  s[5][4] = HELL_FIRE.lavaYellow
  s[6][2] = HELL_FIRE.lavaYellow
  s[6][3] = HELL_FIRE.lavaGlow
  s[6][4] = HELL_FIRE.lavaGlow
  s[6][5] = HELL_FIRE.lavaYellow

  // Arm (rows 7-12) — bent arm, with a kink
  // Vertical segment from row 7-9
  s[7][4] = HELL_FIRE.stoneLite
  s[7][5] = HELL_FIRE.stoneMid
  s[8][4] = HELL_FIRE.stoneLite
  s[8][5] = HELL_FIRE.stoneMid
  s[9][4] = HELL_FIRE.stoneLite
  s[9][5] = HELL_FIRE.stoneMid
  // Bend at row 10
  s[10][3] = HELL_FIRE.stoneLite
  s[10][4] = HELL_FIRE.stoneMid
  s[10][5] = HELL_FIRE.stoneMid
  s[10][6] = HELL_FIRE.stoneLite
  // Horizontal segment from row 11-12
  s[11][2] = HELL_FIRE.stoneLite
  s[11][3] = HELL_FIRE.stoneMid
  s[11][4] = HELL_FIRE.stoneMid
  s[11][5] = HELL_FIRE.stoneMid
  s[11][6] = HELL_FIRE.stoneLite
  s[12][1] = HELL_FIRE.stoneLite
  s[12][2] = HELL_FIRE.stoneMid
  s[12][3] = HELL_FIRE.stoneMid
  s[12][4] = HELL_FIRE.stoneMid
  s[12][5] = HELL_FIRE.stoneMid
  s[12][6] = HELL_FIRE.stoneMid
  s[12][7] = HELL_FIRE.stoneLite

  // Base (rows 13-15) — wide and flat
  s[13][0] = HELL_FIRE.stoneDark
  s[13][1] = HELL_FIRE.stoneMid
  s[13][2] = HELL_FIRE.stoneLite
  s[13][3] = HELL_FIRE.stoneLite
  s[13][4] = HELL_FIRE.stoneLite
  s[13][5] = HELL_FIRE.stoneLite
  s[13][6] = HELL_FIRE.stoneMid
  s[13][7] = HELL_FIRE.stoneDark
  s[14][0] = HELL_FIRE.stoneDark
  s[14][1] = HELL_FIRE.stoneDark
  s[14][2] = HELL_FIRE.stoneMid
  s[14][3] = HELL_FIRE.stoneMid
  s[14][4] = HELL_FIRE.stoneMid
  s[14][5] = HELL_FIRE.stoneMid
  s[14][6] = HELL_FIRE.stoneDark
  s[14][7] = HELL_FIRE.stoneDark
  s[15] = [HELL_FIRE.black, HELL_FIRE.black, HELL_FIRE.stoneDark, HELL_FIRE.stoneDark, HELL_FIRE.stoneDark, HELL_FIRE.stoneDark, HELL_FIRE.black, HELL_FIRE.black]

  return s
}

// === LAMP_WALL (8x16) — wall-mounted torch with bracket, different from existing FURNITURE_TORCH ===
function makeLampWall(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 16; y++) s.push(Array(8).fill(_))

  // Bracket (rows 5-8) — metal arm attached to wall
  // Horizontal arm extending out
  s[6][0] = HELL_FIRE.stoneMid
  s[6][1] = HELL_FIRE.stoneMid
  s[6][2] = HELL_FIRE.stoneLite
  s[6][3] = HELL_FIRE.stoneHigh
  s[6][4] = HELL_FIRE.stoneLite
  s[6][5] = HELL_FIRE.stoneMid
  s[7][0] = HELL_FIRE.stoneDark
  s[7][1] = HELL_FIRE.stoneMid
  s[7][2] = HELL_FIRE.stoneMid
  s[7][3] = HELL_FIRE.stoneLite
  s[7][4] = HELL_FIRE.stoneMid
  s[7][5] = HELL_FIRE.stoneMid
  s[7][6] = HELL_FIRE.stoneDark

  // Bowl/cup holding the flame (rows 7-9, cols 5-7)
  s[8][5] = HELL_FIRE.goldDark
  s[8][6] = HELL_FIRE.goldMid
  s[8][7] = HELL_FIRE.goldDark
  s[9][4] = HELL_FIRE.goldDark
  s[9][5] = HELL_FIRE.goldMid
  s[9][6] = HELL_FIRE.goldMid
  s[9][7] = HELL_FIRE.goldMid
  s[9][8] = HELL_FIRE.goldDark
  s[10][4] = HELL_FIRE.goldDark
  s[10][5] = HELL_FIRE.goldDark
  s[10][6] = HELL_FIRE.goldDark
  s[10][7] = HELL_FIRE.goldDark
  s[10][8] = HELL_FIRE.goldDark

  // Flame (rows 0-7, cols 3-7)
  s[0][5] = HELL_FIRE.lavaYellow
  s[0][6] = HELL_FIRE.lavaYellow
  s[1][4] = HELL_FIRE.lavaYellow
  s[1][5] = HELL_FIRE.lavaWhite
  s[1][6] = HELL_FIRE.lavaWhite
  s[1][7] = HELL_FIRE.lavaYellow
  s[2][3] = HELL_FIRE.lavaGlow
  s[2][4] = HELL_FIRE.lavaYellow
  s[2][5] = HELL_FIRE.lavaWhite
  s[2][6] = HELL_FIRE.lavaYellow
  s[2][7] = HELL_FIRE.lavaGlow
  s[3][3] = HELL_FIRE.lavaHot
  s[3][4] = HELL_FIRE.lavaYellow
  s[3][5] = HELL_FIRE.lavaWhite
  s[3][6] = HELL_FIRE.lavaYellow
  s[3][7] = HELL_FIRE.lavaHot
  s[4][2] = HELL_FIRE.lavaGlow
  s[4][3] = HELL_FIRE.lavaHot
  s[4][4] = HELL_FIRE.lavaBright
  s[4][5] = HELL_FIRE.lavaYellow
  s[4][6] = HELL_FIRE.lavaBright
  s[4][7] = HELL_FIRE.lavaHot
  s[4][8] = HELL_FIRE.lavaGlow
  s[5][2] = HELL_FIRE.lavaBright
  s[5][3] = HELL_FIRE.lavaHot
  s[5][4] = HELL_FIRE.lavaGlow
  s[5][5] = HELL_FIRE.lavaYellow
  s[5][6] = HELL_FIRE.lavaGlow
  s[5][7] = HELL_FIRE.lavaHot
  s[5][8] = HELL_FIRE.lavaBright
  s[6][3] = HELL_FIRE.lavaBright
  s[6][4] = HELL_FIRE.lavaDeep
  s[6][5] = HELL_FIRE.lavaMid
  s[6][6] = HELL_FIRE.lavaDeep
  s[6][7] = HELL_FIRE.lavaBright
  s[7][4] = HELL_FIRE.lavaDeep
  s[7][5] = HELL_FIRE.lavaMid
  s[7][6] = HELL_FIRE.lavaDeep

  return s
}

// === LAMP_FLOOR (8x24) — tall standing floor lamp ===
function makeLampFloor(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 24; y++) s.push(Array(8).fill(_))

  // Shade (rows 0-5)
  s[0][3] = HELL_FIRE.goldDark
  s[0][4] = HELL_FIRE.goldDark
  s[1][2] = HELL_FIRE.goldDark
  s[1][3] = HELL_FIRE.goldMid
  s[1][4] = HELL_FIRE.goldMid
  s[1][5] = HELL_FIRE.goldDark
  s[2][1] = HELL_FIRE.goldDark
  s[2][2] = HELL_FIRE.goldMid
  s[2][3] = HELL_FIRE.goldBright
  s[2][4] = HELL_FIRE.goldBright
  s[2][5] = HELL_FIRE.goldMid
  s[2][6] = HELL_FIRE.goldDark
  s[3][0] = HELL_FIRE.goldDark
  s[3][1] = HELL_FIRE.goldMid
  s[3][2] = HELL_FIRE.goldBright
  s[3][3] = HELL_FIRE.goldBright
  s[3][4] = HELL_FIRE.goldBright
  s[3][5] = HELL_FIRE.goldBright
  s[3][6] = HELL_FIRE.goldMid
  s[3][7] = HELL_FIRE.goldDark
  s[4][0] = HELL_FIRE.goldDark
  s[4][1] = HELL_FIRE.goldDark
  s[4][2] = HELL_FIRE.goldDark
  s[4][3] = HELL_FIRE.goldDark
  s[4][4] = HELL_FIRE.goldDark
  s[4][5] = HELL_FIRE.goldDark
  s[4][6] = HELL_FIRE.goldDark
  s[4][7] = HELL_FIRE.goldDark
  s[5][1] = HELL_FIRE.goldDark
  s[5][2] = HELL_FIRE.goldDark
  s[5][3] = HELL_FIRE.goldDark
  s[5][4] = HELL_FIRE.goldDark
  s[5][5] = HELL_FIRE.goldDark
  s[5][6] = HELL_FIRE.goldDark

  // Bulb glow visible at bottom of shade
  s[6][2] = HELL_FIRE.lavaYellow
  s[6][3] = HELL_FIRE.lavaWhite
  s[6][4] = HELL_FIRE.lavaWhite
  s[6][5] = HELL_FIRE.lavaYellow
  s[7][3] = HELL_FIRE.lavaYellow
  s[7][4] = HELL_FIRE.lavaYellow

  // Neck connecting shade to pole (row 8)
  s[8][3] = HELL_FIRE.goldDark
  s[8][4] = HELL_FIRE.goldDark
  s[9][3] = HELL_FIRE.goldMid
  s[9][4] = HELL_FIRE.goldMid

  // Pole (rows 10-19) — thin vertical
  for (let y = 10; y < 20; y++) {
    s[y][3] = HELL_FIRE.stoneLite
    s[y][4] = HELL_FIRE.stoneMid
  }
  // Decorative rings
  s[12][2] = HELL_FIRE.goldDark
  s[12][3] = HELL_FIRE.goldBright
  s[12][4] = HELL_FIRE.goldBright
  s[12][5] = HELL_FIRE.goldDark
  s[16][2] = HELL_FIRE.goldDark
  s[16][3] = HELL_FIRE.goldBright
  s[16][4] = HELL_FIRE.goldBright
  s[16][5] = HELL_FIRE.goldDark

  // Base (rows 20-23) — wide
  s[20][1] = HELL_FIRE.stoneMid
  s[20][2] = HELL_FIRE.stoneMid
  s[20][3] = HELL_FIRE.stoneMid
  s[20][4] = HELL_FIRE.stoneMid
  s[20][5] = HELL_FIRE.stoneMid
  s[20][6] = HELL_FIRE.stoneMid
  s[21][0] = HELL_FIRE.stoneDark
  s[21][1] = HELL_FIRE.stoneMid
  s[21][2] = HELL_FIRE.stoneLite
  s[21][3] = HELL_FIRE.stoneLite
  s[21][4] = HELL_FIRE.stoneLite
  s[21][5] = HELL_FIRE.stoneLite
  s[21][6] = HELL_FIRE.stoneMid
  s[21][7] = HELL_FIRE.stoneDark
  s[22][0] = HELL_FIRE.stoneDark
  s[22][1] = HELL_FIRE.stoneDark
  s[22][2] = HELL_FIRE.stoneMid
  s[22][3] = HELL_FIRE.stoneMid
  s[22][4] = HELL_FIRE.stoneMid
  s[22][5] = HELL_FIRE.stoneMid
  s[22][6] = HELL_FIRE.stoneDark
  s[22][7] = HELL_FIRE.stoneDark
  s[23] = [HELL_FIRE.black, HELL_FIRE.black, HELL_FIRE.stoneDark, HELL_FIRE.stoneDark, HELL_FIRE.stoneDark, HELL_FIRE.stoneDark, HELL_FIRE.black, HELL_FIRE.black]

  return s
}

export const LAMP_DESK: SpriteData = makeLampDesk()
export const LAMP_WALL: SpriteData = makeLampWall()
export const LAMP_FLOOR: SpriteData = makeLampFloor()
