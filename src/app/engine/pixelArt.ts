// Hell Factory pixel art v2 — Reference-quality HELL_FIRE palette
// Based on dungeon-over-lava pixel art reference (cobblestone, lava pools, fire trees, stone walls)
//
// Sprite sizes:
//   - Floor tile: 16x16 (tileable cobblestone)
//   - Wall: 16x16 (tileable stone block)
//   - Lava: 16x16 (tileable animated)
//   - Fire tree: 32x32
//   - Character: 16x24 (3x upscale at runtime → 48x72 on screen)
//   - Furniture: 16x16 desk, 8x8 chair, 16x16 pillar, 32x16 couch, 32x32 firepit
//
// All sprites are color-indexed via HELL_FIRE palette

import type { SpriteData } from './sprites'

const _: string = ''

// === HELL_FIRE PALETTE (32 colors for depth) ===
export const HELL_FIRE = {
  // Pure tones
  void:        '#000000',
  black:       '#0a0000',
  // Stone / cobblestone
  stoneDark:   '#1a1a2a',
  stoneMid:    '#2d2d3f',
  stoneLite:   '#3d3d52',
  stoneHigh:   '#52526b',
  stoneEdge:   '#6a6a85',
  // Lava range
  lavaDark:    '#1a0500',
  lavaMid:     '#5a1500',
  lavaDeep:    '#aa2200',
  lavaBright:  '#ff5500',
  lavaHot:     '#ff8800',
  lavaGlow:    '#ffaa00',
  lavaYellow:  '#ffdd00',
  lavaWhite:   '#ffffaa',
  // Red range
  redDark:     '#3d0000',
  redMid:      '#6a0000',
  redBright:   '#aa0000',
  redFire:     '#cc2200',
  // Fire tree (autumn)
  leafDark:    '#5a1a00',
  leafMid:     '#aa3300',
  leafBright:  '#ff5500',
  leafGlow:    '#ffaa00',
  barkDark:    '#1a0a00',
  barkMid:     '#3d1a00',
  // Metal / gold
  goldDark:    '#aa6600',
  goldMid:     '#ddaa00',
  goldBright:  '#ffdd44',
  goldGlow:    '#ffff88',
  // Skin / cloth
  bone:        '#d4c4a8',
  cloth:       '#4a3a2a',
  clothLite:   '#6a5a4a',
  // Smoke / ash
  smokeDark:   '#1a1a1a',
  smokeMid:    '#3d3d3d',
  smokeLite:   '#5a5a5a',
  // Highlight
  pureWhite:   '#ffffff',
  pureYellow:  '#ffff00',
} as const

// === COBBLESTONE FLOOR TILE (16x16, tileable) ===
// Each "brick" is 8x4. Pattern: offset alternating rows for brickwork look.
export const TILE_COBBLE: SpriteData = (() => {
  const sprite: SpriteData = []
  // Base dark
  for (let y = 0; y < 16; y++) {
    const row: string[] = []
    for (let x = 0; x < 16; x++) {
      row.push(HELL_FIRE.stoneDark)
    }
    sprite.push(row)
  }
  // Brick pattern: rows of 4px height, offset by 8 on even rows
  // Use slightly different stone colors per brick for variation
  const brickCols = [HELL_FIRE.stoneMid, HELL_FIRE.stoneLite, HELL_FIRE.stoneMid, HELL_FIRE.stoneHigh, HELL_FIRE.stoneLite, HELL_FIRE.stoneMid]
  for (let y = 0; y < 16; y++) {
    const brickRow = Math.floor(y / 4) // 0,1,2,3
    const offsetX = (brickRow % 2) * 8
    for (let x = 0; x < 16; x++) {
      const realX = (x + offsetX) % 16
      // Brick ends at every 8 px in realX
      const brickIndex = Math.floor(realX / 8) + brickRow * 2
      const color = brickCols[brickIndex % brickCols.length]
      // Top edge of brick: lighter
      if (y % 4 === 0) {
        sprite[y][x] = HELL_FIRE.stoneEdge
      } else if (y % 4 === 3) {
        // Bottom edge: darker
        sprite[y][x] = HELL_FIRE.stoneDark
      } else {
        sprite[y][x] = color
      }
      // Vertical mortar lines (every 8 in realX, except edges)
      const inRealX = (realX === 0 || realX === 8)
      if (inRealX && y % 4 !== 0) {
        sprite[y][x] = HELL_FIRE.stoneDark
      }
    }
  }
  return sprite
})()

// === STONE WALL TILE (16x16, tileable) ===
// Tall blocks with cracks and depth
export const TILE_WALL: SpriteData = (() => {
  const sprite: SpriteData = []
  for (let y = 0; y < 16; y++) {
    const row: string[] = []
    for (let x = 0; x < 16; x++) {
      row.push(HELL_FIRE.stoneDark)
    }
    sprite.push(row)
  }
  // Brick pattern, taller blocks
  for (let y = 0; y < 16; y++) {
    const blockRow = Math.floor(y / 5)
    const offsetX = (blockRow % 2) * 8
    for (let x = 0; x < 16; x++) {
      const realX = (x + offsetX) % 16
      // Top edge: light (highlight)
      if (y % 5 === 0) {
        sprite[y][x] = HELL_FIRE.stoneHigh
      } else if (y % 5 === 4) {
        sprite[y][x] = HELL_FIRE.stoneDark
      } else {
        sprite[y][x] = HELL_FIRE.stoneMid
      }
      // Vertical mortar
      if ((realX === 0 || realX === 8) && y % 5 !== 0) {
        sprite[y][x] = HELL_FIRE.stoneDark
      }
    }
  }
  // Add some highlight pixels
  sprite[1][2] = HELL_FIRE.stoneEdge
  sprite[1][6] = HELL_FIRE.stoneEdge
  sprite[6][4] = HELL_FIRE.stoneEdge
  sprite[11][1] = HELL_FIRE.stoneEdge
  sprite[11][9] = HELL_FIRE.stoneEdge
  return sprite
})()

// === LAVA TILE (16x16, animated) ===
// 4 frames for animation, each is a 16x16 tileable pattern
export const LAVA_FRAMES: SpriteData[] = (() => {
  const frames: SpriteData[] = []
  for (let f = 0; f < 4; f++) {
    const sprite: SpriteData = []
    for (let y = 0; y < 16; y++) {
      const row: string[] = []
      for (let x = 0; x < 16; x++) {
        // Determine lava color based on noise-like function
        const phase = (x * 0.7 + y * 0.5 + f * 1.3) % 4
        let c: string
        if (phase < 0.8) c = HELL_FIRE.lavaDark
        else if (phase < 1.6) c = HELL_FIRE.lavaMid
        else if (phase < 2.4) c = HELL_FIRE.lavaDeep
        else if (phase < 3.2) c = HELL_FIRE.lavaBright
        else c = HELL_FIRE.lavaHot
        // Hot spots — bright glowing patches
        const hotX = (x + f) % 16
        const hotY = (y + f * 2) % 16
        if ((hotX > 3 && hotX < 6) && (hotY > 2 && hotY < 5)) c = HELL_FIRE.lavaGlow
        if ((hotX > 10 && hotX < 13) && (hotY > 9 && hotY < 12)) c = HELL_FIRE.lavaYellow
        if ((hotX > 7 && hotX < 9) && (hotY > 13 && hotY < 15)) c = HELL_FIRE.lavaHot
        row.push(c)
      }
      sprite.push(row)
    }
    frames.push(sprite)
  }
  return frames
})()

// === ROCK / STALAGMITE on lava (8x8) ===
export const LAVA_ROCK: SpriteData = [
  [_,_,_,_,HELL_FIRE.stoneMid,_,_,_],
  [_,_,_,HELL_FIRE.stoneMid,HELL_FIRE.stoneLite,HELL_FIRE.stoneMid,_],
  [_,_,HELL_FIRE.stoneMid,HELL_FIRE.stoneLite,HELL_FIRE.stoneHigh,HELL_FIRE.stoneMid,_],
  [_,HELL_FIRE.stoneDark,HELL_FIRE.stoneMid,HELL_FIRE.stoneLite,HELL_FIRE.stoneHigh,HELL_FIRE.stoneMid,HELL_FIRE.stoneDark,_],
  [_,HELL_FIRE.stoneDark,HELL_FIRE.stoneMid,HELL_FIRE.stoneLite,HELL_FIRE.stoneMid,HELL_FIRE.stoneMid,HELL_FIRE.stoneDark,_],
  [_,_,HELL_FIRE.stoneDark,HELL_FIRE.stoneMid,HELL_FIRE.stoneMid,HELL_FIRE.stoneDark,_],
  [_,_,_,HELL_FIRE.stoneDark,HELL_FIRE.stoneDark,_],
  [_,_,_,_,HELL_FIRE.stoneDark,_,_,_],
]

// === FIRE TREE (32x32) — autumn fiery foliage on dark trunk ===
function makeFireTree(): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 32; i++) s.push(Array(32).fill(_))
  // Trunk (bottom center)
  for (let y = 22; y < 30; y++) {
    for (let x = 14; x < 18; x++) {
      s[y][x] = (x === 14 || x === 17) ? HELL_FIRE.barkDark : HELL_FIRE.barkMid
    }
  }
  // Trunk branches reaching up
  s[21][13] = HELL_FIRE.barkDark; s[21][14] = HELL_FIRE.barkMid; s[21][18] = HELL_FIRE.barkMid; s[21][19] = HELL_FIRE.barkDark
  s[20][12] = HELL_FIRE.barkDark; s[20][20] = HELL_FIRE.barkDark
  s[19][11] = HELL_FIRE.barkMid; s[19][21] = HELL_FIRE.barkMid
  s[18][10] = HELL_FIRE.barkDark; s[18][22] = HELL_FIRE.barkDark
  s[17][9] = HELL_FIRE.barkMid; s[17][23] = HELL_FIRE.barkMid
  s[16][8] = HELL_FIRE.barkDark; s[16][24] = HELL_FIRE.barkDark
  s[15][7] = HELL_FIRE.barkMid; s[15][25] = HELL_FIRE.barkMid
  s[14][6] = HELL_FIRE.barkDark; s[14][26] = HELL_FIRE.barkDark
  // Foliage clusters (irregular leaf shapes)
  // Lower-left cluster
  const drawLeaf = (cx: number, cy: number, r: number, baseColor: string, accentColor: string) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.sqrt(dx*dx + dy*dy)
        if (d <= r && cy + dy >= 0 && cy + dy < 32 && cx + dx >= 0 && cx + dx < 32) {
          if (d < r * 0.4) s[cy + dy][cx + dx] = accentColor
          else if (d < r * 0.7) s[cy + dy][cx + dx] = baseColor
          else if (d <= r) s[cy + dy][cx + dx] = HELL_FIRE.leafDark
        }
      }
    }
  }
  drawLeaf(8, 18, 4, HELL_FIRE.leafMid, HELL_FIRE.leafBright)
  drawLeaf(4, 14, 3, HELL_FIRE.leafMid, HELL_FIRE.leafBright)
  drawLeaf(2, 9, 3, HELL_FIRE.leafMid, HELL_FIRE.leafGlow)
  drawLeaf(6, 8, 4, HELL_FIRE.leafMid, HELL_FIRE.leafBright)
  drawLeaf(11, 6, 4, HELL_FIRE.leafMid, HELL_FIRE.leafBright)
  drawLeaf(15, 3, 3, HELL_FIRE.leafMid, HELL_FIRE.leafGlow)
  drawLeaf(20, 5, 4, HELL_FIRE.leafMid, HELL_FIRE.leafBright)
  drawLeaf(24, 9, 3, HELL_FIRE.leafMid, HELL_FIRE.leafBright)
  drawLeaf(27, 13, 4, HELL_FIRE.leafMid, HELL_FIRE.leafBright)
  drawLeaf(23, 16, 3, HELL_FIRE.leafMid, HELL_FIRE.leafGlow)
  drawLeaf(20, 11, 3, HELL_FIRE.leafMid, HELL_FIRE.leafBright)
  drawLeaf(14, 10, 4, HELL_FIRE.leafMid, HELL_FIRE.leafBright)
  drawLeaf(10, 13, 3, HELL_FIRE.leafMid, HELL_FIRE.leafBright)
  // Some falling leaves (single pixels)
  s[28][4] = HELL_FIRE.leafBright
  s[29][8] = HELL_FIRE.leafMid
  s[30][22] = HELL_FIRE.leafBright
  s[28][27] = HELL_FIRE.leafMid
  return s
}
export const FIRE_TREE: SpriteData = makeFireTree()

// === CHARACTER SPRITE (16x24 native, 3x upscale → 48x72) ===
// Hellish humanoid: helmet, body armor, varied by profile color
function makeCharacterSprite(
  armor: string,     // main armor color
  armorDark: string,  // armor shadow
  armorLight: string, // armor highlight
  helmet: string,     // helmet color
  skin: string,       // face/skin
  trim: string,       // metal trim
  eyeColor: string,   // eyes
  hasShoulders: boolean,
  hasCape: boolean,
  capeColor?: string,
): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 24; i++) s.push(Array(16).fill(_))
  // Row 0-1: empty (above head)
  // Row 2-8: helmet/head (7 rows)
  for (let y = 2; y <= 8; y++) {
    for (let x = 5; x <= 10; x++) {
      if (y === 2 && (x === 5 || x === 10)) s[y][x] = HELL_FIRE.stoneDark
      else if (y === 2) s[y][x] = helmet
      else if (y === 3) s[y][x] = (x === 5 || x === 10) ? HELL_FIRE.stoneDark : helmet
      else if (y === 8) s[y][x] = (x === 5 || x === 10) ? armorDark : armor
      else {
        s[y][x] = (x === 5 || x === 10) ? HELL_FIRE.stoneDark : helmet
      }
    }
  }
  // Face (rows 5-7, cols 6-9)
  for (let y = 5; y <= 7; y++) {
    for (let x = 6; x <= 9; x++) {
      s[y][x] = skin
    }
  }
  // Eyes (row 5, col 6,9)
  s[5][6] = eyeColor
  s[5][7] = eyeColor
  s[5][8] = eyeColor
  s[5][9] = eyeColor
  // Mouth (row 7)
  s[7][7] = HELL_FIRE.redBright
  s[7][8] = HELL_FIRE.redBright
  // Helmet visor slit (row 4)
  s[4][6] = HELL_FIRE.stoneDark
  s[4][7] = HELL_FIRE.stoneDark
  s[4][8] = HELL_FIRE.stoneDark
  s[4][9] = HELL_FIRE.stoneDark
  // Helmet horns/spikes (corners)
  s[1][5] = trim
  s[1][10] = trim
  s[2][4] = trim
  s[2][11] = trim
  // Neck (row 9, cols 7-8)
  s[9][7] = skin
  s[9][8] = skin
  // Body (rows 10-17, 8 rows)
  for (let y = 10; y <= 17; y++) {
    for (let x = 4; x <= 11; x++) {
      if (y === 10) {
        s[y][x] = (x === 4 || x === 11) ? armorDark : trim  // shoulder trim
      } else if (y === 11) {
        if (x === 4 || x === 11) s[y][x] = armorLight
        else if (x === 5 || x === 10) s[y][x] = armor
        else s[y][x] = trim
      } else {
        if (x === 4 || x === 11) s[y][x] = armorDark
        else if (x === 5 || x === 10) s[y][x] = armor
        else s[y][x] = armor
      }
    }
  }
  // Chest emblem (rows 12-14, cols 7-8) — glowing center
  s[12][7] = HELL_FIRE.lavaGlow
  s[12][8] = HELL_FIRE.lavaGlow
  s[13][7] = HELL_FIRE.lavaHot
  s[13][8] = HELL_FIRE.lavaHot
  s[14][7] = HELL_FIRE.lavaBright
  s[14][8] = HELL_FIRE.lavaBright
  // Belt (row 16)
  for (let x = 4; x <= 11; x++) {
    s[16][x] = (x === 7 || x === 8) ? trim : HELL_FIRE.stoneDark
  }
  // Legs (rows 17-21, cols 5-10)
  for (let y = 17; y <= 21; y++) {
    for (let x = 5; x <= 10; x++) {
      if (x === 5 || x === 10) s[y][x] = armorDark
      else if (x === 6 || x === 9) s[y][x] = armor
      else s[y][x] = armorDark
    }
  }
  // Boots (row 22, cols 5-10)
  for (let x = 5; x <= 10; x++) {
    s[22][x] = (x === 5 || x === 10) ? HELL_FIRE.stoneDark : HELL_FIRE.stoneMid
  }
  // Cape (if hasCape) — drawn behind body
  if (hasShoulders) {
    for (let y = 11; y <= 19; y++) {
      s[y][3] = capeColor || HELL_FIRE.redBright
      s[y][12] = capeColor || HELL_FIRE.redBright
    }
  }
  // Shadow (row 23)
  s[23][4] = HELL_FIRE.smokeMid
  s[23][5] = HELL_FIRE.smokeDark
  s[23][6] = HELL_FIRE.smokeMid
  s[23][7] = HELL_FIRE.smokeDark
  s[23][8] = HELL_FIRE.smokeMid
  s[23][9] = HELL_FIRE.smokeDark
  s[23][10] = HELL_FIRE.smokeMid
  s[23][11] = HELL_FIRE.smokeDark
  return s
}

// Hermes sprite — gold armor, crown
function makeHermesSprite(): SpriteData {
  const s = makeCharacterSprite(
    HELL_FIRE.goldMid,    // armor
    HELL_FIRE.goldDark,   // armor dark
    HELL_FIRE.goldBright, // armor light
    HELL_FIRE.goldMid,    // helmet
    HELL_FIRE.bone,       // skin
    HELL_FIRE.goldGlow,   // trim
    HELL_FIRE.lavaGlow,   // eyes (glowing)
    true,                  // hasShoulders
    true,                  // hasCape
    HELL_FIRE.redFire,     // cape
  )
  // Replace helmet row 0-2 with crown
  s[0][5] = HELL_FIRE.goldBright
  s[0][6] = HELL_FIRE.goldGlow
  s[0][7] = HELL_FIRE.goldBright
  s[0][8] = HELL_FIRE.goldGlow
  s[0][9] = HELL_FIRE.goldBright
  s[0][10] = HELL_FIRE.goldGlow
  s[1][4] = HELL_FIRE.goldBright
  s[1][5] = HELL_FIRE.goldMid
  s[1][10] = HELL_FIRE.goldMid
  s[1][11] = HELL_FIRE.goldBright
  s[2][3] = HELL_FIRE.goldGlow
  s[2][4] = HELL_FIRE.goldMid
  s[2][11] = HELL_FIRE.goldMid
  s[2][12] = HELL_FIRE.goldGlow
  // Larger cape (royal)
  for (let y = 12; y <= 20; y++) {
    s[y][2] = HELL_FIRE.redBright
    s[y][13] = HELL_FIRE.redBright
  }
  return s
}

// Profile-specific character sprites
export const SPRITE_HERMES: SpriteData = makeHermesSprite()
export const SPRITE_FRONTEND: SpriteData = makeCharacterSprite(
  HELL_FIRE.lavaHot, HELL_FIRE.lavaDeep, HELL_FIRE.lavaGlow, // orange armor
  HELL_FIRE.lavaBright, HELL_FIRE.bone, HELL_FIRE.goldDark, // helmet + face
  HELL_FIRE.lavaWhite, // eyes
  false, false,
)
export const SPRITE_BACKEND: SpriteData = makeCharacterSprite(
  HELL_FIRE.cloth, HELL_FIRE.stoneDark, HELL_FIRE.clothLite, // brown leather
  HELL_FIRE.stoneMid, HELL_FIRE.bone, HELL_FIRE.smokeLite, // iron helmet
  HELL_FIRE.lavaGlow, // eyes
  false, true, HELL_FIRE.redMid, // cape
)
export const SPRITE_DEVOPS: SpriteData = makeCharacterSprite(
  HELL_FIRE.smokeMid, HELL_FIRE.smokeDark, HELL_FIRE.smokeLite, // gray plate
  HELL_FIRE.stoneLite, HELL_FIRE.bone, HELL_FIRE.goldMid, // blue-tinted helmet
  HELL_FIRE.lavaYellow, // eyes
  true, false,
)
export const SPRITE_QA: SpriteData = makeCharacterSprite(
  HELL_FIRE.goldDark, HELL_FIRE.barkDark, HELL_FIRE.goldMid, // bronze armor
  HELL_FIRE.goldMid, HELL_FIRE.bone, HELL_FIRE.goldGlow,
  HELL_FIRE.lavaGlow,
  false, false,
)

export function getAgentSprite(profile: string): SpriteData {
  switch (profile) {
    case 'hermes': return SPRITE_HERMES
    case 'frontend-eng': return SPRITE_FRONTEND
    case 'backend-eng': return SPRITE_BACKEND
    case 'ops': return SPRITE_DEVOPS
    case 'qa': return SPRITE_QA
    default: return SPRITE_FRONTEND
  }
}

// === FURNITURE (refined v2) ===

// Stone desk (16x16) — cobblestone with lava inlay
function makeDesk(): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 16; i++) s.push(Array(16).fill(HELL_FIRE.stoneMid))
  // Top edge
  s[0] = Array(16).fill(HELL_FIRE.stoneHigh)
  // Sides
  for (let y = 0; y < 16; y++) {
    s[y][0] = HELL_FIRE.stoneHigh
    s[y][15] = HELL_FIRE.stoneHigh
  }
  // Mortar lines
  s[5][0] = HELL_FIRE.stoneDark; s[5][15] = HELL_FIRE.stoneDark
  s[10][0] = HELL_FIRE.stoneDark; s[10][15] = HELL_FIRE.stoneDark
  // Lava inlay (rows 6-9, cols 4-11)
  for (let y = 6; y <= 9; y++) {
    for (let x = 4; x <= 11; x++) {
      if (y === 6 || y === 9 || x === 4 || x === 11) s[y][x] = HELL_FIRE.goldDark
      else {
        s[y][x] = (x + y) % 3 === 0 ? HELL_FIRE.lavaGlow : ((x + y) % 3 === 1 ? HELL_FIRE.lavaBright : HELL_FIRE.lavaHot)
      }
    }
  }
  // Highlights
  s[1][1] = HELL_FIRE.stoneEdge
  s[1][14] = HELL_FIRE.stoneEdge
  return s
}
export const FURNITURE_DESK: SpriteData = makeDesk()

// Throne chair (8x8) — gold on red
function makeChair(): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 8; i++) s.push(Array(8).fill(HELL_FIRE.redMid))
  // Back rest
  s[0] = Array(8).fill(HELL_FIRE.goldDark)
  s[1] = Array(8).fill(HELL_FIRE.goldMid)
  s[2][1] = HELL_FIRE.goldBright; s[2][2] = HELL_FIRE.goldBright; s[2][3] = HELL_FIRE.goldBright; s[2][4] = HELL_FIRE.goldBright; s[2][5] = HELL_FIRE.goldBright; s[2][6] = HELL_FIRE.goldBright
  s[3] = Array(8).fill(HELL_FIRE.goldMid)
  s[4] = Array(8).fill(HELL_FIRE.goldDark)
  // Seat
  s[5][1] = HELL_FIRE.redBright; s[5][2] = HELL_FIRE.redBright; s[5][3] = HELL_FIRE.redBright; s[5][4] = HELL_FIRE.redBright; s[5][5] = HELL_FIRE.redBright; s[5][6] = HELL_FIRE.redBright
  s[6][1] = HELL_FIRE.redMid; s[6][6] = HELL_FIRE.redMid
  // Legs
  s[7][1] = HELL_FIRE.stoneDark; s[7][6] = HELL_FIRE.stoneDark
  return s
}
export const FURNITURE_CHAIR: SpriteData = makeChair()

// Ornate pillar (16x16)
function makePillar(): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 16; i++) s.push(Array(16).fill(HELL_FIRE.stoneMid))
  // Capital (top)
  s[0] = Array(16).fill(HELL_FIRE.stoneHigh)
  s[1] = Array(16).fill(HELL_FIRE.stoneHigh)
  s[2] = Array(16).fill(HELL_FIRE.goldDark)
  // Frieze with skulls
  for (let x = 1; x < 16; x += 4) {
    s[2][x] = HELL_FIRE.goldMid
    s[3][x] = HELL_FIRE.goldBright
  }
  // Column shaft (rows 4-12)
  for (let y = 4; y <= 12; y++) {
    for (let x = 4; x <= 11; x++) {
      if (x === 4) s[y][x] = HELL_FIRE.stoneDark
      else if (x === 5) s[y][x] = HELL_FIRE.stoneMid
      else if (x === 10) s[y][x] = HELL_FIRE.stoneMid
      else if (x === 11) s[y][x] = HELL_FIRE.stoneDark
      else s[y][x] = HELL_FIRE.stoneLite
    }
  }
  // Base (rows 13-15)
  s[13] = Array(16).fill(HELL_FIRE.goldDark)
  s[14] = Array(16).fill(HELL_FIRE.stoneHigh)
  s[15] = Array(16).fill(HELL_FIRE.stoneHigh)
  return s
}
export const FURNITURE_PILLAR: SpriteData = makePillar()

// Couch (32x16) — long red bench with gold trim
function makeCouch(): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 16; i++) s.push(Array(32).fill(HELL_FIRE.redMid))
  // Top back
  s[0] = Array(32).fill(HELL_FIRE.redBright)
  s[1] = Array(32).fill(HELL_FIRE.redFire)
  s[2] = Array(32).fill(HELL_FIRE.redBright)
  s[3] = Array(32).fill(HELL_FIRE.redMid)
  // Gold trim
  s[2][1] = HELL_FIRE.goldDark; s[2][30] = HELL_FIRE.goldDark
  // Seat cushions
  for (let y = 8; y <= 12; y++) {
    for (let x = 2; x <= 29; x++) {
      if (y === 8) s[y][x] = HELL_FIRE.redFire
      else if (y === 12) s[y][x] = HELL_FIRE.redDark
      else if (x % 8 === 0) s[y][x] = HELL_FIRE.redBright
      else s[y][x] = HELL_FIRE.redFire
    }
  }
  // Legs
  s[13][1] = HELL_FIRE.stoneDark; s[13][30] = HELL_FIRE.stoneDark
  s[14][1] = HELL_FIRE.stoneDark; s[14][30] = HELL_FIRE.stoneDark
  s[15][1] = HELL_FIRE.stoneDark; s[15][30] = HELL_FIRE.stoneDark
  // Highlight
  s[1][8] = HELL_FIRE.goldMid; s[1][16] = HELL_FIRE.goldMid; s[1][24] = HELL_FIRE.goldMid
  return s
}
export const FURNITURE_COUCH: SpriteData = makeCouch()

// Fire pit (32x32) — stone ring around glowing lava
function makeFirepit(): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 32; i++) s.push(Array(32).fill(HELL_FIRE.stoneDark))
  // Outer ring of stones
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const dx = x - 15.5; const dy = y - 15.5
      const d = Math.sqrt(dx*dx + dy*dy)
      if (d > 11.5 && d <= 14) {
        if ((x + y) % 3 === 0) s[y][x] = HELL_FIRE.stoneLite
        else s[y][x] = HELL_FIRE.stoneMid
      } else if (d > 9.5 && d <= 11.5) {
        s[y][x] = HELL_FIRE.stoneHigh
      }
    }
  }
  // Inner lava
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const dx = x - 15.5; const dy = y - 15.5
      const d = Math.sqrt(dx*dx + dy*dy)
      if (d <= 9.5) {
        if (d < 2) s[y][x] = HELL_FIRE.lavaWhite
        else if (d < 4) s[y][x] = HELL_FIRE.lavaYellow
        else if (d < 6) s[y][x] = HELL_FIRE.lavaGlow
        else if (d < 8) s[y][x] = HELL_FIRE.lavaHot
        else s[y][x] = HELL_FIRE.lavaBright
      }
    }
  }
  return s
}
export const FURNITURE_FIREPIT: SpriteData = makeFirepit()

// Torch (8x16) — wall-mounted flame
function makeTorch(): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 16; i++) s.push(Array(8).fill(_))
  // Stick
  for (let y = 8; y < 15; y++) {
    s[y][3] = HELL_FIRE.barkMid
    s[y][4] = HELL_FIRE.barkDark
  }
  // Flame (rows 2-7)
  s[2][4] = HELL_FIRE.lavaGlow
  s[3][3] = HELL_FIRE.lavaHot; s[3][4] = HELL_FIRE.lavaYellow; s[3][5] = HELL_FIRE.lavaHot
  s[4][3] = HELL_FIRE.lavaBright; s[4][4] = HELL_FIRE.lavaWhite; s[4][5] = HELL_FIRE.lavaBright
  s[5][2] = HELL_FIRE.lavaGlow; s[5][3] = HELL_FIRE.lavaYellow; s[5][4] = HELL_FIRE.lavaWhite; s[5][5] = HELL_FIRE.lavaYellow; s[5][6] = HELL_FIRE.lavaGlow
  s[6][2] = HELL_FIRE.lavaHot; s[6][3] = HELL_FIRE.lavaBright; s[6][4] = HELL_FIRE.lavaYellow; s[6][5] = HELL_FIRE.lavaBright; s[6][6] = HELL_FIRE.lavaHot
  s[7][3] = HELL_FIRE.lavaDeep; s[7][4] = HELL_FIRE.lavaHot; s[7][5] = HELL_FIRE.lavaDeep
  return s
}
export const FURNITURE_TORCH: SpriteData = makeTorch()

// === TILES ===
export const FLOOR_TILES: Record<string, SpriteData> = {
  cobble: TILE_COBBLE,
}
export function getFloorTile(_type: string): SpriteData {
  return TILE_COBBLE
}

export const WALL_TILES: Record<string, SpriteData> = {
  stone: TILE_WALL,
}
export function getWallTile(_type: string): SpriteData {
  return TILE_WALL
}

export const LAVA_TILE_FRAMES: SpriteData[] = LAVA_FRAMES

export const FURNITURE_SPRITES: Record<string, SpriteData> = {
  desk: FURNITURE_DESK,
  chair: FURNITURE_CHAIR,
  pillar: FURNITURE_PILLAR,
  couch: FURNITURE_COUCH,
  firepit: FURNITURE_FIREPIT,
  torch: FURNITURE_TORCH,
  tree: FIRE_TREE,
  rock: LAVA_ROCK,
}

export function getFurnitureSprite(type: string): SpriteData {
  return FURNITURE_SPRITES[type] || FURNITURE_DESK
}
