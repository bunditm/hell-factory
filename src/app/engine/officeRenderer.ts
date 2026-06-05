// Office renderer v4 — uses real PNG sprites from public/
// Replaces the hand-authored pixelArt.ts / sprites/* / mockupRenderer.ts

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants'
import {
  loadSpriteSheet, drawFrame, drawFrameImage, recolorImage,
  IMP_SPRITES, TILE_SETS,
  type SpriteSheet, type Frame,
} from './assets'
import {
  V4_COLS, V4_ROWS, V4_TILE,
  ROOMS, CHARACTERS, FURNITURE,
  type OfficeCharacter, type OfficeFurniture, type RoomRect,
} from './officeData'

// Pre-loaded sheets (one-time per session)
let impSheets: Record<string, SpriteSheet> = {}
let tileSheets: Record<string, SpriteSheet> = {}
let recoloredFrames: Record<string, Frame> = {}  // for purple imp, satan hermes
let ready = false

const HELL_FIRE = {
  black: '#0a0000',
  deepRed: '#660000',
  red: '#aa0000',
  crimson: '#cc1111',
  ember: '#dd5511',
  fire: '#ff7700',
  gold: '#ffcc00',
  yellow: '#ffee44',
  ash: '#aaaaaa',
  smoke: '#444444',
  charcoal: '#1a0a0a',
  blood: '#880022',
  purple: '#8822aa',
}

export async function preloadAssets(): Promise<void> {
  if (ready) return

  // Load imp sheets
  const uniqueImps = new Set(Object.values(IMP_SPRITES).map(s => s.src))
  for (const src of uniqueImps) {
    const key = src.replace(/.*\//, '').replace('.png', '')
    const sheet = await loadSpriteSheet(`imp-${key}`, src, 64, 64, 4, 4)
    impSheets[sheet.src] = sheet
  }

  // Load tile sheets
  for (const [key, def] of Object.entries(TILE_SETS)) {
    const sheet = await loadSpriteSheet(`tile-${key}`, def.src, def.cellW, def.cellH, def.cols, def.rows)
    tileSheets[key] = sheet
  }

  // Recolor qa-engineer (blue → purple)
  const qaKey = IMP_SPRITES['qa-engineer'].src
  if (impSheets[qaKey]) {
    const base = impSheets[qaKey]
    // Take the front-idle frame and recolor
    const blueCanvas = frameToCanvas(base, IMP_SPRITES['qa-engineer'].idleCol, IMP_SPRITES['qa-engineer'].idleRow)
    const purpleCanvas = recolorImage(blueCanvas, (r, g, b, a) => {
      // blue dominance → purple
      if (b > r && b > g && b > 60) {
        return [Math.min(255, r + 60), Math.max(0, g - 20), Math.min(255, b + 20), a]
      }
      return [r, g, b, a]
    })
    const purpleImg = canvasToImage(purpleCanvas)
    recoloredFrames['qa-engineer-idle'] = purpleImg
  }

  // Recolor Hermes: flame → black + red (Satan)
  const hermesSheet = impSheets[IMP_SPRITES['hermes'].src]
  if (hermesSheet) {
    const flameCanvas = frameToCanvas(hermesSheet, IMP_SPRITES['hermes'].idleCol, IMP_SPRITES['hermes'].idleRow)
    const satanCanvas = recolorImage(flameCanvas, (r, g, b, a) => {
      // Map flame palette to black+red+gold
      // White/yellow highlights → gold
      if (r > 200 && g > 200 && b < 100) return [255, 200, 0, a]  // bright yellow → gold
      if (r > 200 && g > 100 && b < 100) return [200, 30, 0, a]    // orange → deep red
      if (r > 100 && g < 80) return [80, 0, 0, a]                  // dark red body → black-red
      if (r < 30 && g < 30 && b < 30) return [0, 0, 0, a]          // near-black → black
      return [Math.max(0, r - 100), Math.max(0, g - 100), Math.max(0, b - 100), a]
    })
    recoloredFrames['hermes-satan'] = canvasToImage(satanCanvas)
  }

  ready = true
}

function frameToCanvas(sheet: SpriteSheet, col: number, row: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = sheet.cellW
  c.height = sheet.cellH
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    sheet.img,
    col * sheet.cellW, row * sheet.cellH, sheet.cellW, sheet.cellH,
    0, 0, sheet.cellW, sheet.cellH,
  )
  return c
}

function canvasToImage(c: HTMLCanvasElement): HTMLImageElement {
  const img = new Image()
  img.src = c.toDataURL()
  return img
}

// ─── Drawing primitives ──────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Volcano sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#1a0505')
  grad.addColorStop(0.4, '#330a0a')
  grad.addColorStop(0.7, '#5a1505')
  grad.addColorStop(1, '#0a0000')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Distant volcano silhouette
  ctx.fillStyle = '#0a0202'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.6)
  ctx.lineTo(w * 0.2, h * 0.45)
  ctx.lineTo(w * 0.4, h * 0.5)
  ctx.lineTo(w * 0.5, h * 0.35)  // peak
  ctx.lineTo(w * 0.6, h * 0.5)
  ctx.lineTo(w * 0.8, h * 0.45)
  ctx.lineTo(w, h * 0.6)
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  // Volcano glow at peak
  const peakGrad = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, 120)
  peakGrad.addColorStop(0, 'rgba(255, 120, 30, 0.4)')
  peakGrad.addColorStop(1, 'rgba(255, 120, 30, 0)')
  ctx.fillStyle = peakGrad
  ctx.fillRect(0, 0, w, h)

  // Embers floating
  const t = performance.now() / 1000
  for (let i = 0; i < 30; i++) {
    const x = (i * 137 + t * 20) % w
    const y = h - ((t * 40 + i * 50) % h)
    ctx.fillStyle = `rgba(255, ${100 + (i % 5) * 30}, 0, ${0.4 + 0.4 * Math.sin(t + i)})`
    ctx.fillRect(x, y, 2, 2)
  }
}

function drawRoom(ctx: CanvasRenderingContext2D, room: RoomRect, time: number): void {
  const { col, row, cols, rows, theme } = room
  const px = col * V4_TILE
  const py = row * V4_TILE
  const w = cols * V4_TILE
  const h = rows * V4_TILE

  // Wall (per-room gradient strip behind the floor)
  const wallGrad = ctx.createLinearGradient(0, py, 0, py + h)
  wallGrad.addColorStop(0, theme.bgGradient[0])
  wallGrad.addColorStop(1, theme.bgGradient[1])
  ctx.fillStyle = wallGrad
  ctx.fillRect(px, py, w, h)

  // Floor tiles (checkerboard of floorTile + floorAlt)
  const floorSheet = tileSheets[theme.floorTileSet]
  if (floorSheet) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const useAlt = (r + c) % 2 === 0
        const tile = useAlt ? theme.floorAlt : theme.floorTile
        const x = px + c * V4_TILE
        const y = py + r * V4_TILE
        drawFrame(ctx, floorSheet, tile.col, tile.row,
          x + 18, y + 18, V4_TILE - 36, V4_TILE - 36)
      }
    }
  }

  // Wall trim (top + bottom strip)
  const wallSheet = tileSheets[theme.wallTileSet]
  if (wallSheet) {
    // Top wall
    for (let c = 0; c < cols; c++) {
      drawFrame(ctx, wallSheet, theme.wallTile.col, theme.wallTile.row,
        px + c * V4_TILE + 18, py + 0, V4_TILE - 36, 16)
    }
    // Bottom wall
    for (let c = 0; c < cols; c++) {
      drawFrame(ctx, wallSheet, theme.wallTile.col, theme.wallTile.row,
        px + c * V4_TILE + 18, py + h - 16, V4_TILE - 36, 16)
    }
  }

  // Room label
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(px + 10, py + 10, 200, 24)
  ctx.fillStyle = '#ffcc00'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(theme.label, px + 16, py + 14)
}

function drawFurniture(
  ctx: CanvasRenderingContext2D,
  room: RoomRect,
  furniture: OfficeFurniture[],
  time: number,
): void {
  for (const f of furniture) {
    const x = (room.col + f.col) * V4_TILE
    const y = (room.row + f.row) * V4_TILE
    drawFurniturePiece(ctx, f, x, y, time)
  }
}

function drawFurniturePiece(
  ctx: CanvasRenderingContext2D,
  f: OfficeFurniture,
  x: number, y: number,
  time: number,
): void {
  const cx = x + V4_TILE / 2
  const cy = y + V4_TILE / 2
  const t = time

  switch (f.type) {
    case 'throne': {
      // Gold-trimmed dark throne
      ctx.fillStyle = '#2a0808'
      ctx.fillRect(x + 20, y + 30, 60, 60)
      ctx.fillStyle = '#660000'
      ctx.fillRect(x + 25, y + 35, 50, 50)
      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(x + 22, y + 32, 4, 56)
      ctx.fillRect(x + 74, y + 32, 4, 56)
      ctx.fillRect(x + 20, y + 30, 60, 4)
      // Crown points
      ctx.beginPath()
      ctx.moveTo(x + 25, y + 30)
      ctx.lineTo(x + 30, y + 18)
      ctx.lineTo(x + 35, y + 30)
      ctx.lineTo(x + 40, y + 18)
      ctx.lineTo(x + 45, y + 30)
      ctx.lineTo(x + 50, y + 18)
      ctx.lineTo(x + 55, y + 30)
      ctx.lineTo(x + 60, y + 18)
      ctx.lineTo(x + 65, y + 30)
      ctx.lineTo(x + 70, y + 18)
      ctx.lineTo(x + 75, y + 30)
      ctx.closePath()
      ctx.fillStyle = '#ffcc00'
      ctx.fill()
      break
    }
    case 'firepit': {
      // Stone circle + animated fire
      ctx.fillStyle = '#1a0808'
      ctx.beginPath()
      ctx.arc(cx, cy + 10, 30, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#3a1818'
      ctx.beginPath()
      ctx.arc(cx, cy + 10, 26, 0, Math.PI * 2)
      ctx.fill()
      // Fire
      const flicker = Math.sin(t * 8) * 0.2 + 0.8
      for (let i = 0; i < 5; i++) {
        const fh = 12 + i * 4 + flicker * 4
        const fx = cx + Math.sin(t * 3 + i) * 3
        ctx.fillStyle = i < 2 ? '#ff3300' : i < 4 ? '#ff7700' : '#ffcc00'
        ctx.beginPath()
        ctx.arc(fx, cy + 10 - i * 3, 4 + Math.sin(t * 5 + i) * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      // Glow
      const glow = ctx.createRadialGradient(cx, cy + 5, 5, cx, cy + 5, 50)
      glow.addColorStop(0, 'rgba(255, 100, 0, 0.4)')
      glow.addColorStop(1, 'rgba(255, 100, 0, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(x - 20, y - 20, V4_TILE + 40, V4_TILE + 40)
      break
    }
    case 'desk': {
      // Wooden desk
      ctx.fillStyle = '#3a1a08'
      ctx.fillRect(x + 12, y + 30, 76, 50)
      ctx.fillStyle = '#5a2a10'
      ctx.fillRect(x + 16, y + 34, 68, 42)
      // Computer monitor
      ctx.fillStyle = '#111'
      ctx.fillRect(x + 36, y + 14, 28, 22)
      ctx.fillStyle = '#aa0000'
      ctx.fillRect(x + 38, y + 16, 24, 18)
      // Screen flicker
      if (Math.sin(t * 2) > 0) {
        ctx.fillStyle = '#ff3300'
        ctx.fillRect(x + 50, y + 20, 4, 2)
      }
      // Keyboard
      ctx.fillStyle = '#222'
      ctx.fillRect(x + 26, y + 64, 48, 8)
      break
    }
    case 'chair': {
      // Office chair
      ctx.fillStyle = '#2a0808'
      ctx.fillRect(x + 35, y + 30, 30, 30)
      ctx.fillStyle = '#440000'
      ctx.fillRect(x + 38, y + 33, 24, 24)
      // Backrest
      ctx.fillStyle = '#2a0808'
      ctx.fillRect(x + 33, y + 10, 34, 24)
      ctx.fillStyle = '#440000'
      ctx.fillRect(x + 36, y + 13, 28, 18)
      // Base
      ctx.fillStyle = '#1a0505'
      ctx.fillRect(x + 30, y + 60, 40, 8)
      ctx.fillRect(x + 48, y + 68, 4, 8)
      break
    }
    case 'plant': {
      // Vase + foliage
      ctx.fillStyle = '#2a0808'
      ctx.fillRect(x + 38, y + 60, 24, 24)
      ctx.fillStyle = '#440000'
      ctx.fillRect(x + 40, y + 62, 20, 20)
      // Foliage
      const colors = f.variant === 1 ? ['#cc1111', '#aa0000', '#660000'] : ['#1a4a1a', '#0a3a0a', '#082a08']
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = colors[i % 3]
        const fx = x + 30 + (i * 8) + Math.sin(t + i) * 2
        const fy = y + 30 - (i * 5) - Math.cos(t + i) * 2
        ctx.beginPath()
        ctx.arc(fx, fy, 12, 0, Math.PI * 2)
        ctx.fill()
      }
      // Pot rim
      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(x + 36, y + 58, 28, 4)
      break
    }
    case 'couch': {
      // Red velvet couch
      ctx.fillStyle = '#660000'
      ctx.fillRect(x + 8, y + 30, 84, 50)
      ctx.fillStyle = '#aa0000'
      ctx.fillRect(x + 12, y + 34, 76, 42)
      ctx.fillStyle = '#cc1111'
      ctx.fillRect(x + 18, y + 40, 20, 16)  // cushion
      ctx.fillRect(x + 42, y + 40, 20, 16)
      ctx.fillRect(x + 66, y + 40, 20, 16)
      // Gold trim
      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(x + 8, y + 30, 84, 3)
      ctx.fillRect(x + 8, y + 77, 84, 3)
      break
    }
    case 'table': {
      // Round wooden table
      ctx.fillStyle = '#2a0808'
      ctx.beginPath()
      ctx.arc(cx, cy + 5, 32, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#5a2a10'
      ctx.beginPath()
      ctx.arc(cx, cy + 5, 28, 0, Math.PI * 2)
      ctx.fill()
      // Table leg
      ctx.fillStyle = '#2a0808'
      ctx.fillRect(x + 48, y + 70, 4, 16)
      // Cup
      ctx.fillStyle = '#aa0000'
      ctx.fillRect(x + 42, y + 50, 8, 10)
      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(x + 42, y + 50, 8, 2)
      break
    }
    case 'bookshelf': {
      // Tall dark bookshelf
      ctx.fillStyle = '#1a0808'
      ctx.fillRect(x + 14, y + 10, 72, 80)
      ctx.fillStyle = '#2a1008'
      ctx.fillRect(x + 18, y + 14, 64, 72)
      // Shelves with books
      const bookColors = ['#aa0000', '#cc1111', '#660000', '#ffcc00', '#884400', '#aa6600']
      for (let shelf = 0; shelf < 4; shelf++) {
        const sy = y + 18 + shelf * 18
        ctx.fillStyle = '#0a0000'
        ctx.fillRect(x + 18, sy + 14, 64, 2)
        let bx = x + 20
        for (let b = 0; b < 8; b++) {
          const bh = 8 + (b % 3) * 2
          ctx.fillStyle = bookColors[(shelf + b) % bookColors.length]
          ctx.fillRect(bx, sy + 14 - bh, 6, bh)
          bx += 8
        }
      }
      break
    }
    case 'water_cooler': {
      // Tall water cooler
      ctx.fillStyle = '#1a0808'
      ctx.fillRect(x + 30, y + 10, 40, 80)
      ctx.fillStyle = '#2a2a2a'
      ctx.fillRect(x + 32, y + 12, 36, 76)
      // Water bottle
      ctx.fillStyle = '#335577'
      ctx.fillRect(x + 36, y + 4, 28, 24)
      ctx.fillStyle = '#5588aa'
      ctx.fillRect(x + 38, y + 6, 24, 20)
      // Tap
      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(x + 44, y + 50, 12, 4)
      ctx.fillStyle = '#aa0000'
      ctx.fillRect(x + 48, y + 54, 4, 6)
      break
    }
    case 'vending': {
      // Vending machine
      ctx.fillStyle = '#1a0808'
      ctx.fillRect(x + 18, y + 4, 64, 88)
      ctx.fillStyle = '#2a2a2a'
      ctx.fillRect(x + 20, y + 6, 60, 84)
      // Glass with bottles
      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(x + 24, y + 12, 52, 40)
      const bottleColors = ['#aa0000', '#ff7700', '#ffcc00', '#aa6600']
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          ctx.fillStyle = bottleColors[(r + c) % 4]
          ctx.fillRect(x + 26 + c * 10, y + 14 + r * 12, 6, 10)
        }
      }
      // Coin slot
      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(x + 70, y + 60, 8, 2)
      ctx.fillStyle = '#222'
      ctx.fillRect(x + 30, y + 60, 40, 28)
      break
    }
    case 'barrel': {
      // Wooden barrel
      ctx.fillStyle = '#3a1a08'
      ctx.fillRect(x + 24, y + 20, 52, 64)
      ctx.fillStyle = '#5a2a10'
      ctx.fillRect(x + 28, y + 24, 44, 56)
      // Bands
      ctx.fillStyle = '#1a0808'
      ctx.fillRect(x + 24, y + 32, 52, 3)
      ctx.fillRect(x + 24, y + 60, 52, 3)
      // Top
      ctx.fillStyle = '#3a1a08'
      ctx.beginPath()
      ctx.ellipse(cx, y + 20, 26, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'rug': {
      // Patterned rug
      const rugColor = f.variant === 1 ? '#1a0833' : '#5a1a08'
      ctx.fillStyle = rugColor
      ctx.fillRect(x + 8, y + 16, 84, 68)
      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(x + 8, y + 16, 84, 3)
      ctx.fillRect(x + 8, y + 81, 84, 3)
      // Pattern
      ctx.fillStyle = '#aa0000'
      ctx.fillRect(x + 14, y + 22, 72, 56)
      ctx.fillStyle = rugColor
      ctx.fillRect(x + 18, y + 26, 64, 48)
      // Center medallion
      ctx.fillStyle = '#ffcc00'
      ctx.beginPath()
      ctx.arc(cx, cy + 10, 10, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'candle': {
      // Candle with flickering flame
      ctx.fillStyle = '#aa8844'
      ctx.fillRect(x + 45, y + 50, 10, 30)
      ctx.fillStyle = '#ffcc88'
      ctx.fillRect(x + 47, y + 52, 6, 26)
      // Flame
      const flick = Math.sin(t * 6 + (f.col || 0)) * 2
      ctx.fillStyle = '#ffcc00'
      ctx.beginPath()
      ctx.moveTo(x + 50, y + 42)
      ctx.lineTo(x + 46, y + 50)
      ctx.lineTo(x + 50, y + 48)
      ctx.lineTo(x + 54, y + 50)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#ff3300'
      ctx.beginPath()
      ctx.moveTo(x + 50, y + 46 + flick)
      ctx.lineTo(x + 47, y + 50)
      ctx.lineTo(x + 53, y + 50)
      ctx.closePath()
      ctx.fill()
      // Glow
      const g = ctx.createRadialGradient(cx, y + 50, 5, cx, y + 50, 30)
      g.addColorStop(0, 'rgba(255, 200, 100, 0.3)')
      g.addColorStop(1, 'rgba(255, 200, 100, 0)')
      ctx.fillStyle = g
      ctx.fillRect(x - 30, y - 30, V4_TILE + 60, V4_TILE + 60)
      break
    }
    case 'pentagram': {
      // 5-pointed star inscribed in a circle (ritual table top)
      ctx.fillStyle = '#1a0505'
      ctx.beginPath()
      ctx.arc(cx, cy, 35, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#660000'
      ctx.lineWidth = 2
      ctx.stroke()
      // Star
      ctx.strokeStyle = '#aa0000'
      ctx.lineWidth = 2
      ctx.beginPath()
      const starR = 28
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2
        const r = i % 2 === 0 ? starR : starR / 2
        const px = cx + Math.cos(angle) * r
        const py = cy + Math.sin(angle) * r
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
      // Glow
      const pg = ctx.createRadialGradient(cx, cy, 5, cx, cy, 50)
      pg.addColorStop(0, 'rgba(170, 0, 0, 0.4)')
      pg.addColorStop(1, 'rgba(170, 0, 0, 0)')
      ctx.fillStyle = pg
      ctx.fillRect(x - 30, y - 30, V4_TILE + 60, V4_TILE + 60)
      break
    }
    case 'banner': {
      // Wall banner: red with gold trim and sigil
      ctx.fillStyle = '#1a0505'
      ctx.fillRect(x + 38, y + 4, 24, 4)  // rod
      ctx.fillStyle = '#aa0000'
      ctx.fillRect(x + 30, y + 8, 40, 50)
      ctx.fillStyle = '#660000'
      ctx.fillRect(x + 34, y + 12, 32, 42)
      // Sigil (flame)
      ctx.fillStyle = '#ffcc00'
      ctx.beginPath()
      ctx.moveTo(cx, y + 22)
      ctx.lineTo(cx - 8, y + 36)
      ctx.lineTo(cx - 3, y + 32)
      ctx.lineTo(cx, y + 44)
      ctx.lineTo(cx + 3, y + 32)
      ctx.lineTo(cx + 8, y + 36)
      ctx.closePath()
      ctx.fill()
      // Trim
      ctx.fillStyle = '#ffcc00'
      ctx.fillRect(x + 30, y + 8, 40, 2)
      ctx.fillRect(x + 30, y + 56, 40, 2)
      // Tails
      ctx.fillStyle = '#aa0000'
      ctx.beginPath()
      ctx.moveTo(x + 30, y + 58)
      ctx.lineTo(x + 38, y + 72)
      ctx.lineTo(x + 50, y + 58)
      ctx.lineTo(x + 62, y + 72)
      ctx.lineTo(x + 70, y + 58)
      ctx.closePath()
      ctx.fill()
      break
    }
  }
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  ch: OfficeCharacter,
  time: number,
): void {
  const room = ROOMS.find(r => r.id === ch.roomId)
  if (!room) return

  const def = IMP_SPRITES[ch.spriteKey]
  if (!def) return

  // Bounce animation
  const bounce = Math.sin(time * 2 + ch.id.charCodeAt(0)) * 2
  const isWorking = ch.state === 'working'
  const isWaiting = ch.state === 'waiting'
  const isBarking = ch.spriteKey === 'hermes'  // Hermes always barking

  const x = (room.col + ch.seatCol) * V4_TILE
  const y = (room.row + ch.seatRow) * V4_TILE + bounce

  // Pick frame
  if (ch.spriteKey === 'hermes' && recoloredFrames['hermes-satan']) {
    // Hermes is 2x scale, uses recolored satan frame
    const size = 96
    drawFrameImage(ctx, recoloredFrames['hermes-satan'],
      x + (V4_TILE - size) / 2, y + V4_TILE - size, size, size)
    // Crown overlay
    ctx.fillStyle = '#ffcc00'
    ctx.fillRect(x + 30, y + V4_TILE - size - 8, 40, 6)
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(x + 30 + i * 8, y + V4_TILE - size - 8)
      ctx.lineTo(x + 34 + i * 8, y + V4_TILE - size - 16)
      ctx.lineTo(x + 38 + i * 8, y + V4_TILE - size - 8)
      ctx.closePath()
      ctx.fill()
    }
    // Cape (red flowing behind)
    ctx.fillStyle = '#aa0000'
    ctx.beginPath()
    ctx.moveTo(x + 18, y + V4_TILE - 40)
    ctx.lineTo(x + 12, y + V4_TILE - 4)
    ctx.lineTo(x + 30, y + V4_TILE - 16)
    ctx.lineTo(x + 50, y + V4_TILE - 4)
    ctx.lineTo(x + 82, y + V4_TILE - 40)
    ctx.closePath()
    ctx.fill()
  } else {
    // Normal character — use sprite sheet directly
    const sheet = impSheets[def.src]
    if (!sheet) return

    // Frame: use idle for D direction (front)
    const col = def.idleCol
    const row = def.idleRow
    const size = 72

    if (ch.spriteKey === 'qa-engineer' && recoloredFrames['qa-engineer-idle']) {
      drawFrameImage(ctx, recoloredFrames['qa-engineer-idle'],
        x + (V4_TILE - size) / 2, y + V4_TILE - size, size, size)
    } else {
      drawFrame(ctx, sheet, col, row,
        x + (V4_TILE - size) / 2, y + V4_TILE - size, size, size)
    }
  }

  // Status ring under feet
  const ringColor = isWorking ? '#00ff00' : isWaiting ? '#ffcc00' : isBarking ? '#ff3300' : '#888888'
  ctx.strokeStyle = ringColor
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(x + V4_TILE / 2, y + V4_TILE - 4, 28, 6, 0, 0, Math.PI * 2)
  ctx.stroke()
  // Pulse for working
  if (isWorking) {
    const pulse = Math.sin(time * 4) * 0.3 + 0.7
    ctx.globalAlpha = pulse * 0.3
    ctx.fillStyle = ringColor
    ctx.beginPath()
    ctx.ellipse(x + V4_TILE / 2, y + V4_TILE - 4, 30, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // Speech bubble
  if (ch.bubble) {
    drawSpeechBubble(ctx, ch.bubble, x + V4_TILE / 2, y + 8, isBarking)
  }

  // Name plate
  ctx.fillStyle = 'rgba(0,0,0,0.8)'
  ctx.fillRect(x + 8, y + V4_TILE - 2, V4_TILE - 16, 16)
  ctx.fillStyle = '#ffcc00'
  ctx.font = 'bold 10px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${ch.name} (${ch.role})`, x + V4_TILE / 2, y + V4_TILE + 6)
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number, cy: number,
  urgent: boolean = false,
): void {
  ctx.font = 'bold 11px monospace'
  const padding = 6
  const textW = ctx.measureText(text).width
  const w = textW + padding * 2
  const h = 22
  const x = cx - w / 2
  const y = cy

  // Bubble background
  ctx.fillStyle = urgent ? '#ff3300' : '#ffeecc'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.lineTo(x + w, y + h - 6)
  ctx.lineTo(cx + 4, y + h - 2)
  ctx.lineTo(cx, y + h)
  ctx.lineTo(cx - 4, y + h - 2)
  ctx.lineTo(x, y + h - 6)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1
  ctx.stroke()

  // Text
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, y + h / 2 - 2)
}

// ─── Main render entry ──────────────────────────────────────────────

export function renderOfficeFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
): void {
  if (!ready) return  // wait for assets

  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  // Background (volcano sky)
  drawBackground(ctx, width, height)

  // Draw rooms in order (back to front by row)
  const sortedRooms = [...ROOMS].sort((a, b) => a.row - b.row)
  for (const room of sortedRooms) {
    drawRoom(ctx, room, time)
  }

  // Draw furniture per room
  for (const room of sortedRooms) {
    const f = FURNITURE[room.id] || []
    drawFurniture(ctx, room, f, time)
  }

  // Draw characters (Z-sort by row + seatRow)
  const sortedChars = [...CHARACTERS].sort((a, b) => {
    const ra = ROOMS.find(r => r.id === a.roomId)
    const rb = ROOMS.find(r => r.id === b.roomId)
    return ((ra?.row ?? 0) + a.seatRow) - ((rb?.row ?? 0) + b.seatRow)
  })
  for (const ch of sortedChars) {
    drawCharacter(ctx, ch, time)
  }

  // Top status bar
  ctx.fillStyle = 'rgba(10, 0, 0, 0.85)'
  ctx.fillRect(0, 0, width, 36)
  ctx.fillStyle = '#ffcc00'
  ctx.font = 'bold 18px monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('☠  HELL FACTORY  ☠', 12, 18)
  ctx.textAlign = 'right'
  const working = CHARACTERS.filter(c => c.state === 'working').length
  const waiting = CHARACTERS.filter(c => c.state === 'waiting').length
  const idle = CHARACTERS.filter(c => c.state === 'idle').length
  ctx.fillStyle = '#00ff00'
  ctx.fillText(`● Working: ${working}`, width - 12, 18)
  ctx.fillStyle = '#ffcc00'
  ctx.fillText(`● Waiting: ${waiting}`, width - 160, 18)
  ctx.fillStyle = '#888888'
  ctx.fillText(`● Idle: ${idle}`, width - 320, 18)
}

export function isReady(): boolean {
  return ready
}
