// Carpets & rugs — large floor decorations
// 16-bit top-down RPG style. Uses reds/gold (hellish), blue/stone
// (office), and purple/gold (throne) palettes.

import { HELL_FIRE } from '../pixelArt'
import type { SpriteData } from '../sprites'

const _: string = ''

// === RUG_HELL (32x32) — red rug, dark border, hellish skull/circle motifs, gold trim ===
function makeRugHell(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 32; y++) s.push(Array(32).fill(_))

  const W = 32
  const H = 32

  // Outer dark red border (2 px thick)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < 2 || x >= W - 2 || y < 2 || y >= H - 2) {
        s[y][x] = HELL_FIRE.redDark
      }
    }
  }
  // Inner gold trim (1 px ring inside the border)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x === 2 || x === W - 3 || y === 2 || y === H - 3) {
        s[y][x] = HELL_FIRE.goldDark
      }
    }
  }
  // Highlight the gold trim
  s[2][3] = HELL_FIRE.goldMid
  s[2][W - 4] = HELL_FIRE.goldMid
  s[H - 3][3] = HELL_FIRE.goldMid
  s[H - 3][W - 4] = HELL_FIRE.goldMid

  // Central field (rows 3..H-4, cols 3..W-4) — redMid base
  for (let y = 3; y < H - 3; y++) {
    for (let x = 3; x < W - 3; x++) {
      s[y][x] = HELL_FIRE.redMid
    }
  }
  // Sprinkle redFire for depth
  for (let y = 4; y < H - 4; y++) {
    for (let x = 4; x < W - 4; x++) {
      if ((x + y) % 5 === 0) s[y][x] = HELL_FIRE.redFire
    }
  }

  // Corner gold trim motifs (4x4 in each corner just inside the trim)
  const drawCorner = (cx: number, cy: number) => {
    s[cy][cx] = HELL_FIRE.goldBright
    s[cy][cx + 1] = HELL_FIRE.goldMid
    s[cy + 1][cx] = HELL_FIRE.goldMid
    s[cy + 1][cx + 1] = HELL_FIRE.goldDark
    s[cy + 2][cx] = HELL_FIRE.goldDark
    s[cy][cx + 2] = HELL_FIRE.goldDark
  }
  drawCorner(4, 4)
  drawCorner(W - 7, 4)
  drawCorner(4, H - 7)
  drawCorner(W - 7, H - 7)

  // Central field motif: 2 skull/circle clusters horizontally
  // Skull 1 at (cx=10, cy=15), Skull 2 at (cx=21, cy=15)
  const drawSkull = (cx: number, cy: number) => {
    // Outer dark red ring (radius 3)
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const d = Math.abs(dx) + Math.abs(dy)  // Manhattan
        if (d === 3) {
          if (cy + dy >= 0 && cy + dy < H && cx + dx >= 0 && cx + dx < W) {
            s[cy + dy][cx + dx] = HELL_FIRE.redDark
          }
        }
      }
    }
    // Inner redBright circle
    s[cy - 1][cx] = HELL_FIRE.redFire
    s[cy - 1][cx + 1] = HELL_FIRE.redFire
    s[cy][cx - 1] = HELL_FIRE.redFire
    s[cy][cx] = HELL_FIRE.redBright
    s[cy][cx + 1] = HELL_FIRE.redFire
    s[cy + 1][cx] = HELL_FIRE.redFire
    s[cy + 1][cx + 1] = HELL_FIRE.redFire
    // Eye sockets (gold/hollow)
    s[cy - 1][cx - 1] = HELL_FIRE.goldDark
    s[cy - 1][cx + 2] = HELL_FIRE.goldDark
    // Mouth slit
    s[cy + 2][cx] = HELL_FIRE.goldDark
    s[cy + 2][cx + 1] = HELL_FIRE.goldDark
  }
  drawSkull(10, 15)
  drawSkull(21, 15)

  // Top and bottom decorative bands (rows 7-8 and 23-24)
  for (let x = 5; x < W - 5; x++) {
    s[7][x] = (x % 3 === 0) ? HELL_FIRE.goldMid : HELL_FIRE.redFire
    s[8][x] = (x % 3 === 0) ? HELL_FIRE.goldDark : HELL_FIRE.redBright
    s[23][x] = (x % 3 === 0) ? HELL_FIRE.goldDark : HELL_FIRE.redBright
    s[24][x] = (x % 3 === 0) ? HELL_FIRE.goldMid : HELL_FIRE.redFire
  }

  // Left and right decorative columns (cols 7-8, 23-24)
  for (let y = 9; y < 23; y++) {
    s[y][7] = (y % 3 === 0) ? HELL_FIRE.goldMid : HELL_FIRE.redFire
    s[y][8] = (y % 3 === 0) ? HELL_FIRE.goldDark : HELL_FIRE.redBright
    s[y][23] = (y % 3 === 0) ? HELL_FIRE.goldDark : HELL_FIRE.redBright
    s[y][24] = (y % 3 === 0) ? HELL_FIRE.goldMid : HELL_FIRE.redFire
  }

  return s
}
export const RUG_HELL: SpriteData = makeRugHell()

// === RUG_OFFICE (32x32) — blue geometric diamond pattern ===
function makeRugOffice(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 32; y++) s.push(Array(32).fill(_))

  const W = 32
  const H = 32

  // Outer dark blue border (2 px) using stoneDark
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < 2 || x >= W - 2 || y < 2 || y >= H - 2) {
        s[y][x] = HELL_FIRE.stoneDark
      }
    }
  }
  // Inner lighter border (1 px) using stoneMid
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x === 2 || x === W - 3 || y === 2 || y === H - 3) {
        s[y][x] = HELL_FIRE.stoneMid
      }
    }
  }
  // Tiny gold corner dots
  s[2][2] = HELL_FIRE.goldDark
  s[2][W - 3] = HELL_FIRE.goldDark
  s[H - 3][2] = HELL_FIRE.goldDark
  s[H - 3][W - 3] = HELL_FIRE.goldDark

  // Central field — stoneMid base
  for (let y = 3; y < H - 3; y++) {
    for (let x = 3; x < W - 3; x++) {
      s[y][x] = HELL_FIRE.stoneMid
    }
  }

  // Diamond pattern: light blue (stoneLite) diamonds on stoneMid
  // Center of field ~ (15.5, 15.5). Diamond pattern via |x-cx| + |y-cy| <= r
  const fieldX0 = 3, fieldY0 = 3
  const fieldW = W - 6, fieldH = H - 6
  // Tile size 4 px
  for (let y = 0; y < fieldH; y++) {
    for (let x = 0; x < fieldW; x++) {
      // Compute position in a 8x8 diamond lattice
      const gx = (x + fieldX0) % 8
      const gy = (y + fieldY0) % 8
      // Diamond at offset (4, 4) inside the 8x8 cell
      const d = Math.abs(gx - 4) + Math.abs(gy - 4)
      let c: string = HELL_FIRE.stoneMid
      if (d === 0) c = HELL_FIRE.stoneLite
      else if (d === 1) c = HELL_FIRE.stoneLite
      else if (d === 2) c = HELL_FIRE.stoneHigh
      else if (d === 3) c = HELL_FIRE.stoneLite
      s[y + fieldY0][x + fieldX0] = c
    }
  }

  // Add small gold dots at diamond centers for accent
  for (let cy = 3; cy < H - 3; cy += 8) {
    for (let cx = 3; cx < W - 3; cx += 8) {
      s[cy][cx] = HELL_FIRE.goldDark
      s[cy][cx + 1] = HELL_FIRE.goldMid
      s[cy + 1][cx] = HELL_FIRE.goldMid
    }
  }

  return s
}
export const RUG_OFFICE: SpriteData = makeRugOffice()

// === RUG_THRONE (48x32) — purple rug with gold trim, central gold sigil ===
function makeRugThrone(): SpriteData {
  const s: SpriteData = []
  for (let y = 0; y < 32; y++) s.push(Array(48).fill(_))

  const W = 48
  const H = 32

  // Outer dark purple border (2 px) using cloth as deep purple base
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < 2 || x >= W - 2 || y < 2 || y >= H - 2) {
        s[y][x] = HELL_FIRE.cloth
      }
    }
  }
  // Inner gold border (1 px) using goldDark
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x === 2 || x === W - 3 || y === 2 || y === H - 3) {
        s[y][x] = HELL_FIRE.goldDark
      }
    }
  }
  // Bright gold accent on the trim
  s[2][3] = HELL_FIRE.goldMid
  s[2][W - 4] = HELL_FIRE.goldMid
  s[H - 3][3] = HELL_FIRE.goldMid
  s[H - 3][W - 4] = HELL_FIRE.goldMid
  for (let x = 4; x < W - 4; x += 4) {
    s[2][x] = HELL_FIRE.goldMid
    s[H - 3][x] = HELL_FIRE.goldMid
  }
  for (let y = 4; y < H - 4; y += 4) {
    s[y][2] = HELL_FIRE.goldMid
    s[y][W - 3] = HELL_FIRE.goldMid
  }

  // Central field — cloth base (purple)
  for (let y = 3; y < H - 3; y++) {
    for (let x = 3; x < W - 3; x++) {
      s[y][x] = HELL_FIRE.cloth
    }
  }
  // Subtle clothLite texture
  for (let y = 4; y < H - 4; y++) {
    for (let x = 4; x < W - 4; x++) {
      if ((x * 3 + y * 5) % 17 === 0) s[y][x] = HELL_FIRE.clothLite
    }
  }

  // Central gold sigil — large emblem at (cx=23, cy=15)
  const cx = 23
  const cy = 15
  // Outer ring
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -7; dx <= 7; dx++) {
      // Oval-ish
      const inX = (dx * dx) / 49 + (dy * dy) / 25
      if (inX > 0.7 && inX <= 1.0) {
        if (cy + dy >= 0 && cy + dy < H && cx + dx >= 0 && cx + dx < W) {
          s[cy + dy][cx + dx] = HELL_FIRE.goldDark
        }
      }
    }
  }
  // Mid ring (goldMid)
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const inX = (dx * dx) / 36 + (dy * dy) / 16
      if (inX > 0.65 && inX <= 0.95) {
        if (cy + dy >= 0 && cy + dy < H && cx + dx >= 0 && cx + dx < W) {
          s[cy + dy][cx + dx] = HELL_FIRE.goldMid
        }
      }
    }
  }
  // Inner glow (goldBright center)
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const inX = (dx * dx) / 16 + (dy * dy) / 9
      if (inX <= 0.85) {
        if (cy + dy >= 0 && cy + dy < H && cx + dx >= 0 && cx + dx < W) {
          s[cy + dy][cx + dx] = HELL_FIRE.goldBright
        }
      }
    }
  }
  // Hot center pixel (goldGlow)
  s[cy - 1][cx] = HELL_FIRE.goldGlow
  s[cy][cx - 1] = HELL_FIRE.goldGlow
  s[cy][cx] = HELL_FIRE.goldGlow
  s[cy][cx + 1] = HELL_FIRE.goldGlow
  s[cy + 1][cx] = HELL_FIRE.goldGlow

  // Vertical "rays" of gold running from sigil to rug edges (top/bottom)
  // Top ray
  for (let y = 5; y < 9; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      s[y][cx + dx] = HELL_FIRE.goldDark
    }
  }
  // Top ray highlight
  s[5][cx] = HELL_FIRE.goldMid
  s[6][cx - 1] = HELL_FIRE.goldMid
  s[6][cx + 1] = HELL_FIRE.goldMid
  // Bottom ray
  for (let y = 22; y < 27; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      s[y][cx + dx] = HELL_FIRE.goldDark
    }
  }
  // Bottom ray highlight
  s[26][cx] = HELL_FIRE.goldMid
  s[25][cx - 1] = HELL_FIRE.goldMid
  s[25][cx + 1] = HELL_FIRE.goldMid

  // Horizontal "rays" running to left/right trim (at sigil height)
  // Left ray
  for (let x = 5; x < 15; x++) {
    for (let dy = -1; dy <= 1; dy++) {
      s[cy + dy][x] = HELL_FIRE.goldDark
    }
  }
  s[cy][7] = HELL_FIRE.goldMid
  s[cy][10] = HELL_FIRE.goldMid
  s[cy][13] = HELL_FIRE.goldMid
  // Right ray
  for (let x = 32; x < 43; x++) {
    for (let dy = -1; dy <= 1; dy++) {
      s[cy + dy][x] = HELL_FIRE.goldDark
    }
  }
  s[cy][34] = HELL_FIRE.goldMid
  s[cy][37] = HELL_FIRE.goldMid
  s[cy][40] = HELL_FIRE.goldMid

  // Small decorative gold dots along the rails of the sigil arms
  s[10][cx] = HELL_FIRE.goldBright
  s[21][cx] = HELL_FIRE.goldBright
  s[cy][16] = HELL_FIRE.goldBright
  s[cy][31] = HELL_FIRE.goldBright

  return s
}
export const RUG_THRONE: SpriteData = makeRugThrone()
