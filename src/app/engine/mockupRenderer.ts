// Mockup renderer v3 — full detail upgrade
// - Per-tile floor (wood, stone, carpet variants)
// - Per-tile walls with windows, doors
// - Volcano view through windows
// - Top-down characters (4-direction, walk cycle)
// - Lamp light cones, proper shadows
// - All new furniture (desk, chair, lamp, bookshelf, plants, decor)
// - Carpets/rugs
// - Hermes throne area

import { TILE_SIZE } from './constants'
import {
  HELL_FIRE, TILE_COBBLE, TILE_WALL, LAVA_TILE_FRAMES, LAVA_ROCK,
  getAgentSprite, getAgentAnimationFrame, getFurnitureSprite, getFloorTile, getWallTile,
  type AnimationType,
} from './pixelArt'
import {
  FLOOR, WALLS, FURNITURE, PLANTS, CARPETS, getSprite,
} from './sprites/spriteMap'
import {
  MOCKUP_AGENTS, MOCKUP_ROOMS,
  type MockAgent, type MockRoom,
} from './mockupData'
import type { SpriteData } from './sprites'

const _ = ''

// === SPRITE DRAWING ===

// Draw a sprite at world position with integer zoom scaling
function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteData,
  x: number,
  y: number,
  zoom: number,
  alpha: number = 1,
): void {
  if (alpha < 1) ctx.save()
  if (alpha < 1) ctx.globalAlpha = alpha
  const s = zoom
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < (sprite[row]?.length || 0); col++) {
      const color = sprite[row][col]
      if (color === '' || color === undefined) continue
      ctx.fillStyle = color
      ctx.fillRect(x + col * s, y + row * s, s, s)
    }
  }
  if (alpha < 1) ctx.restore()
}

// Draw sprite at center (for centered placement, e.g. chairs on tile)
function drawSpriteCentered(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteData,
  centerX: number,
  centerY: number,
  zoom: number,
): void {
  const w = sprite[0]?.length || 16
  const h = sprite.length
  const s = zoom
  drawSprite(ctx, sprite, centerX - (w * s) / 2, centerY - (h * s) / 2, zoom)
}

// Draw a tile scaled to fit a TILE_SIZE area
function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: SpriteData,
  x: number,
  y: number,
  zoom: number,
): void {
  const tw = tile[0]?.length || 16
  const scale = TILE_SIZE / tw
  for (let row = 0; row < tile.length; row++) {
    for (let col = 0; col < (tile[row]?.length || 0); col++) {
      const color = tile[row][col]
      if (color === '' || color === undefined) continue
      ctx.fillStyle = color
      ctx.fillRect(x + col * scale * zoom, y + row * scale * zoom, scale * zoom, scale * zoom)
    }
  }
}

// === RENDER FRAME ===
export interface RenderFrameResult {
  offsetX: number
  offsetY: number
  time: number
}

export function renderMockupFrame(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  panX: number,
  panY: number,
  cols: number,
  rows: number,
  time: number,
): RenderFrameResult {
  try {
    return renderFrameInner(ctx, canvasWidth, canvasHeight, zoom, panX, panY, cols, rows, time)
  } catch (e) {
    ;(window as unknown as { __renderError?: string }).__renderError = String(e) + '\n' + (e as Error).stack
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.fillStyle = '#ff0000'
    ctx.font = '20px monospace'
    ctx.fillText(String(e).substring(0, 100), 20, 40)
    return { offsetX: 0, offsetY: 0, time }
  }
}

function renderFrameInner(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  panX: number,
  panY: number,
  cols: number,
  rows: number,
  time: number,
): RenderFrameResult {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  const mapW = cols * TILE_SIZE * zoom
  const mapH = rows * TILE_SIZE * zoom
  const offsetX = (canvasWidth - mapW) / 2 + panX
  const offsetY = (canvasHeight - mapH) / 2 + panY
  const ts = TILE_SIZE * zoom

  // === Step 1: Background void ===
  ctx.fillStyle = HELL_FIRE.void
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // === Step 2: Floor tiles ===
  // For now use simple pattern: stone in War Room, wood in Pit, carpet in Lounge
  // This will be replaced by per-tile map in next iteration
  drawFloors(ctx, offsetX, offsetY, ts, time, zoom)

  // === Step 3: Carpets (under furniture) ===
  drawCarpets(ctx, offsetX, offsetY, ts, time)

  // === Step 4: Atmospheric glow ===
  drawAtmosphericGlow(ctx, offsetX, offsetY, ts, time)

  // === Step 5: Lava strip (row 8) with rocks ===
  drawLavaStrip(ctx, offsetX, offsetY, ts, time, zoom)

  // === Step 6: Walls ===
  drawWalls(ctx, offsetX, offsetY, ts, time, zoom)

  // === Step 7: Volcano view through windows ===
  // (Drawn after walls so it shows in window cutouts)
  drawVolcanoViews(ctx, offsetX, offsetY, ts, time)

  // === Step 8: Room labels ===
  for (const room of MOCKUP_ROOMS) {
    drawRoomLabel(ctx, room, offsetX, offsetY, ts, time)
  }

  // === Step 9: Furniture (sorted by row) ===
  drawFurniture(ctx, offsetX, offsetY, ts, zoom, time)

  // === Step 10: Characters (Z-sorted) ===
  drawCharacters(ctx, offsetX, offsetY, ts, zoom, time)

  // === Step 11: Lamp light cones (overlay) ===
  drawLampLight(ctx, offsetX, offsetY, ts, time)

  // === Step 12: Speech bubbles (top layer) ===
  for (const agent of MOCKUP_AGENTS) {
    const sortedAgents = [...MOCKUP_AGENTS].sort((a, b) => a.seatRow - b.seatRow)
    const idx = sortedAgents.findIndex(a => a.id === agent.id)
    if (idx === sortedAgents.length - 1) {
      drawSpeechBubble(ctx, agent, offsetX, offsetY, ts, time)
    }
  }

  return { offsetX, offsetY, time }
}

// === FLOOR ===
function drawFloors(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, ts: number, time: number, zoom: number): void {
  for (let row = 0; row < 18; row++) {
    for (let col = 0; col < 24; col++) {
      const x = offsetX + col * ts
      const y = offsetY + row * ts
      let tile: SpriteData

      if (row === 8) {
        // Lava strip — animated lava tile
        const frameIdx = Math.floor(time * 6) % LAVA_TILE_FRAMES.length
        tile = LAVA_TILE_FRAMES[frameIdx]
        // Glow overlay
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        ctx.fillStyle = `rgba(255, 100, 0, ${0.2 + 0.1 * Math.sin(time * 4 + col + row)})`
        ctx.fillRect(x, y, ts, ts)
        ctx.restore()
      } else if (row < 8) {
        // War Room — stone tile floor
        tile = FLOOR.stone
      } else if (col < 14) {
        // The Pit — wood plank floor
        tile = FLOOR.wood
      } else {
        // Hell's Lounge — stone tile floor
        tile = FLOOR.stone
      }
      drawTile(ctx, tile, x, y, zoom)
    }
  }
}

// === CARPETS ===
function drawCarpets(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, ts: number, time: number): void {
  // Throne rug in War Room center (under Hermes desk)
  // 48x32 carpet, scale up
  const rugX = offsetX + 8 * ts
  const rugY = offsetY + 2.5 * ts
  // Carpet is 32x16 pixels (sub-sprite coords), scale to fit 6 tiles wide x 2 tiles tall
  const carpetW = 6 * ts
  const carpetH = 2 * ts
  // Draw RUG_THRONE stretched
  const rug = CARPETS.throne
  // 32 cols x 16 rows of pixel art, stretched to fit
  const scaleX = carpetW / 32
  const scaleY = carpetH / 16
  for (let row = 0; row < rug.length; row++) {
    for (let col = 0; col < (rug[row]?.length || 0); col++) {
      const color = rug[row][col]
      if (color === '' || color === undefined) continue
      ctx.fillStyle = color
      ctx.fillRect(rugX + col * scaleX, rugY + row * scaleY, scaleX, scaleY)
    }
  }
  // Office rug in Pit (red, under working desks)
  const officeRug = CARPETS.office
  const oRugX = offsetX + 0.5 * ts
  const oRugY = offsetY + 9.5 * ts
  const oCarpetW = 13 * ts
  const oCarpetH = 4 * ts
  const oScaleX = oCarpetW / 32
  const oScaleY = oCarpetH / 32
  for (let row = 0; row < officeRug.length && row < 32; row++) {
    for (let col = 0; col < (officeRug[row]?.length || 0); col++) {
      const color = officeRug[row][col]
      if (color === '' || color === undefined) continue
      ctx.fillStyle = color
      ctx.fillRect(oRugX + col * oScaleX, oRugY + row * oScaleY, oScaleX, oScaleY)
    }
  }
  // Hell rug in Lounge
  const hellRug = CARPETS.hell
  const hRugX = offsetX + 14.5 * ts
  const hRugY = offsetY + 13.5 * ts
  const hCarpetW = 9 * ts
  const hCarpetH = 4 * ts
  const hScaleX = hCarpetW / 32
  const hScaleY = hCarpetH / 32
  for (let row = 0; row < hellRug.length; row++) {
    for (let col = 0; col < (hellRug[row]?.length || 0); col++) {
      const color = hellRug[row][col]
      if (color === '' || color === undefined) continue
      ctx.fillStyle = color
      ctx.fillRect(hRugX + col * hScaleX, hRugY + row * hScaleY, hScaleX, hScaleY)
    }
  }
}

// === ATMOSPHERIC GLOW ===
function drawAtmosphericGlow(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, ts: number, time: number): void {
  for (const room of MOCKUP_ROOMS) {
    const rx = offsetX + room.col * ts
    const ry = offsetY + room.row * ts
    const rw = room.cols * ts
    const rh = room.rows * ts
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const gradient = ctx.createRadialGradient(
      rx + rw / 2, ry + rh / 2, 0,
      rx + rw / 2, ry + rh / 2, Math.max(rw, rh) * 0.6,
    )
    const alpha = 0.1 + 0.05 * Math.sin(time * 1.5 + room.col)
    gradient.addColorStop(0, `rgba(255, 85, 0, ${alpha})`)
    gradient.addColorStop(0.6, `rgba(170, 34, 0, ${alpha * 0.4})`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(rx, ry, rw, rh)
    ctx.restore()
  }
}

// === LAVA STRIP ===
function drawLavaStrip(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, ts: number, time: number, zoom: number): void {
  // Rocks
  const rockPositions = [3, 8, 14, 19]
  for (const col of rockPositions) {
    const rx = offsetX + col * ts + ts * 0.4
    const ry = offsetY + 8 * ts + ts * 0.3
    drawSprite(ctx, LAVA_ROCK, rx, ry, zoom * 2)
  }
}

// === WALLS ===
// Wall layout: top of every room has wall, sides have wall, door gaps
function drawWalls(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, ts: number, time: number, zoom: number): void {
  // Top wall of War Room (row 0)
  for (let col = 0; col < 24; col++) {
    const x = offsetX + col * ts
    const y = offsetY
    // Mix windows and stone
    if (col === 4 || col === 11 || col === 12 || col === 19) {
      // Window tile
      drawTile(ctx, WALLS.window, x, y, zoom)
    } else {
      drawTile(ctx, WALLS.stone, x, y, zoom)
    }
  }
  // Side walls (left col 0, right col 23)
  for (let row = 1; row < 18; row++) {
    const xl = offsetX
    const xr = offsetX + 23 * ts
    const y = offsetY + row * ts
    if (row === 8) {
      // Gap for corridor — no side wall on row 8
      continue
    }
    drawTile(ctx, WALLS.stone, xl, y, zoom)
    drawTile(ctx, WALLS.stone, xr, y, zoom)
  }
  // Bottom wall (row 17)
  for (let col = 0; col < 24; col++) {
    const x = offsetX + col * ts
    const y = offsetY + 17 * ts
    drawTile(ctx, WALLS.stone, x, y, zoom)
  }
  // Wall shadows on floor (cast from top-left light)
  ctx.save()
  ctx.globalAlpha = 0.3
  ctx.fillStyle = HELL_FIRE.black
  for (let col = 0; col < 24; col++) {
    const x = offsetX + col * ts
    // Shadow below top wall
    ctx.fillRect(x, offsetY + ts, ts, ts * 0.15)
  }
  // Shadow from left wall
  for (let row = 1; row < 18; row++) {
    if (row === 8) continue
    const y = offsetY + row * ts
    ctx.fillRect(offsetX + ts * 0.2, y, ts * 0.08, ts)
  }
  // Shadow from right wall
  for (let row = 1; row < 18; row++) {
    if (row === 8) continue
    const y = offsetY + row * ts
    ctx.fillRect(offsetX + 22.8 * ts, y, ts * 0.2, ts)
  }
  ctx.restore()
}

// === VOLCANO VIEWS through windows ===
function drawVolcanoViews(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, ts: number, time: number): void {
  // Window cutout positions: row 0, cols 4, 11, 12, 19
  const windowCols = [4, 11, 12, 19]
  for (const col of windowCols) {
    const x = offsetX + col * ts
    const y = offsetY
    // Draw volcano sky: dark orange-red gradient with animated lava particles
    const grad = ctx.createLinearGradient(x, y, x, y + ts)
    grad.addColorStop(0, '#1a0500')  // top: dark void
    grad.addColorStop(0.4, '#5a1500') // mid: dark red
    grad.addColorStop(0.8, '#ff5500') // bottom: bright lava
    grad.addColorStop(1, '#ffff00')   // bottom: yellow
    ctx.fillStyle = grad
    // Inside the window cutout (the wall has transparent in the middle)
    // Approximate: draw a 12x12 area in the middle
    const wx = x + ts * 0.2
    const wy = y + ts * 0.1
    const ww = ts * 0.6
    const wh = ts * 0.8
    ctx.fillRect(wx, wy, ww, wh)
    // Animated lava particles
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (let p = 0; p < 3; p++) {
      const phase = (time * 0.5 + p * 0.3) % 1
      const px = wx + ww * ((p * 0.4 + phase * 0.2) % 1)
      const py = wy + wh * (0.4 + 0.3 * Math.sin(time * 2 + p))
      const pr = 2 + Math.sin(time * 3 + p) * 1
      ctx.fillStyle = `rgba(255, 200, 0, ${0.6 - phase * 0.4})`
      ctx.beginPath()
      ctx.arc(px, py, pr, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
}

// === ROOM LABEL ===
function drawRoomLabel(
  ctx: CanvasRenderingContext2D,
  room: MockRoom,
  offsetX: number,
  offsetY: number,
  ts: number,
  time: number,
): void {
  const fontSize = Math.max(8, Math.round(8 * (ts / TILE_SIZE)))
  const cx = offsetX + (room.col + room.cols / 2) * ts
  const cy = offsetY + (room.row + 0.5) * ts
  const text = room.name.toUpperCase()
  ctx.save()
  ctx.font = `900 ${fontSize}px "Impact", "Arial Black", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const metrics = ctx.measureText(text)
  const tw = metrics.width
  const th = fontSize
  const padX = fontSize * 0.5
  const padY = fontSize * 0.3
  const rx = cx - tw / 2 - padX
  const ry = cy - th / 2 - padY
  const rw = tw + padX * 2
  const rh = th + padY * 2
  const radius = rh / 2
  ctx.fillStyle = 'rgba(10, 0, 0, 0.9)'
  ctx.beginPath()
  ctx.moveTo(rx + radius, ry)
  ctx.lineTo(rx + rw - radius, ry)
  ctx.arcTo(rx + rw, ry, rx + rw, ry + radius, radius)
  ctx.arcTo(rx + rw, ry + rh, rx + rw - radius, ry + rh, radius)
  ctx.lineTo(rx + radius, ry + rh)
  ctx.arcTo(rx, ry + rh, rx, ry + rh - radius, radius)
  ctx.arcTo(rx, ry, rx + radius, ry, radius)
  ctx.closePath()
  ctx.fill()
  const glow = 0.5 + 0.2 * Math.sin(time * 2 + room.col)
  ctx.strokeStyle = `rgba(255, 85, 0, ${glow})`
  ctx.lineWidth = 1.5
  ctx.stroke()
  const textGrad = ctx.createLinearGradient(cx, cy - th / 2, cx, cy + th / 2)
  textGrad.addColorStop(0, HELL_FIRE.goldBright)
  textGrad.addColorStop(1, HELL_FIRE.lavaBright)
  ctx.fillStyle = textGrad
  ctx.fillText(text, cx, cy)
  ctx.restore()
}

// === FURNITURE (placed per room) ===
function drawFurniture(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, ts: number, zoom: number, time: number): void {
  // === War Room: pillars, firepits, torches, desk, bookshelves, paintings ===
  // Pillars at corners
  drawSprite(ctx, getSprite('pillar')!, offsetX + 1 * ts, offsetY + 1 * ts, zoom)
  drawSprite(ctx, getSprite('pillar')!, offsetX + 22 * ts, offsetY + 1 * ts, zoom)
  drawSprite(ctx, getSprite('pillar')!, offsetX + 1 * ts, offsetY + 6 * ts, zoom)
  drawSprite(ctx, getSprite('pillar')!, offsetX + 22 * ts, offsetY + 6 * ts, zoom)
  // Torches on side walls
  drawSprite(ctx, FURNITURE.lamp_wall, offsetX + 1.2 * ts, offsetY + 3 * ts, zoom)
  drawSprite(ctx, FURNITURE.lamp_wall, offsetX + 22.2 * ts, offsetY + 3 * ts, zoom)
  drawSprite(ctx, FURNITURE.lamp_wall, offsetX + 1.2 * ts, offsetY + 5 * ts, zoom)
  drawSprite(ctx, FURNITURE.lamp_wall, offsetX + 22.2 * ts, offsetY + 5 * ts, zoom)
  // Bookshelves on left and right of war room
  drawSprite(ctx, FURNITURE.bookshelf, offsetX + 2.5 * ts, offsetY + 1 * ts, zoom)
  drawSprite(ctx, FURNITURE.bookshelf, offsetX + 19.5 * ts, offsetY + 1 * ts, zoom)
  // Firepits flanking Hermes
  drawSprite(ctx, getSprite('firepit')!, offsetX + 5 * ts, offsetY + 5.5 * ts, zoom)
  drawSprite(ctx, getSprite('firepit')!, offsetX + 18 * ts, offsetY + 5.5 * ts, zoom)
  // Hermes' ornate desk (center)
  drawSprite(ctx, FURNITURE.desk_hermes, offsetX + 10 * ts, offsetY + 3 * ts, zoom)
  // Paintings on walls (above bookshelves)
  drawSprite(ctx, FURNITURE.painting, offsetX + 2.5 * ts, offsetY + 0.2 * ts, zoom)
  drawSprite(ctx, FURNITURE.painting, offsetX + 19.5 * ts, offsetY + 0.2 * ts, zoom)

  // === The Pit (left bottom) ===
  // 4 working desks with chairs
  for (let i = 0; i < 4; i++) {
    const cx = 1 + i * 3
    drawSprite(ctx, FURNITURE.desk_wood, offsetX + cx * ts, offsetY + 10 * ts, zoom)
    // Chair behind desk (DOWN-facing — character sits facing up at desk)
    drawSprite(ctx, FURNITURE.chair_up, offsetX + (cx + 0.5) * ts, offsetY + 11.2 * ts, zoom * 0.5)
  }
  // Plants on side
  drawSprite(ctx, PLANTS.palm, offsetX + 0.2 * ts, offsetY + 15 * ts, zoom)
  drawSprite(ctx, PLANTS.palm, offsetX + 12.8 * ts, offsetY + 15 * ts, zoom)
  // Bookshelf on far wall
  drawSprite(ctx, FURNITURE.bookshelf, offsetX + 5.5 * ts, offsetY + 9.2 * ts, zoom)
  // Whiteboard
  drawSprite(ctx, FURNITURE.whiteboard, offsetX + 9 * ts, offsetY + 9.2 * ts, zoom)
  // Water cooler
  drawSprite(ctx, FURNITURE.water_cooler, offsetX + 0.5 * ts, offsetY + 12 * ts, zoom * 0.5)
  // Vending
  drawSprite(ctx, FURNITURE.vending_machine, offsetX + 13.5 * ts, offsetY + 12 * ts, zoom * 0.5)
  // Bulletin
  drawSprite(ctx, FURNITURE.bulletin, offsetX + 12 * ts, offsetY + 9.2 * ts, zoom)
  // Floor lamps
  drawSprite(ctx, FURNITURE.lamp_floor, offsetX + 0.3 * ts, offsetY + 9.5 * ts, zoom * 0.4)
  drawSprite(ctx, FURNITURE.lamp_floor, offsetX + 13.5 * ts, offsetY + 9.5 * ts, zoom * 0.4)

  // === Hell's Lounge (right bottom) ===
  // 4 couches
  for (let i = 0; i < 2; i++) {
    const cy = 11 + i * 4
    drawSprite(ctx, FURNITURE.desk_wood, offsetX + (15 + i * 4) * ts, offsetY + cy * ts, zoom)
    drawSprite(ctx, FURNITURE.chair_up, offsetX + (15 + i * 4 + 0.5) * ts, offsetY + (cy + 1.2) * ts, zoom * 0.5)
  }
  // Plants
  drawSprite(ctx, PLANTS.palm, offsetX + 14.3 * ts, offsetY + 9.2 * ts, zoom)
  drawSprite(ctx, PLANTS.palm, offsetX + 22.5 * ts, offsetY + 9.2 * ts, zoom)
  drawSprite(ctx, PLANTS.palm, offsetX + 14.3 * ts, offsetY + 16.5 * ts, zoom)
  drawSprite(ctx, PLANTS.palm, offsetX + 22.5 * ts, offsetY + 16.5 * ts, zoom)
  // Cactus and fern
  drawSprite(ctx, PLANTS.cactus, offsetX + 14.5 * ts, offsetY + 11 * ts, zoom * 0.5)
  drawSprite(ctx, PLANTS.fern, offsetX + 22.7 * ts, offsetY + 11 * ts, zoom * 0.5)
  drawSprite(ctx, PLANTS.fern, offsetX + 14.5 * ts, offsetY + 15 * ts, zoom * 0.5)
  drawSprite(ctx, PLANTS.cactus, offsetX + 22.7 * ts, offsetY + 15 * ts, zoom * 0.5)
  // Firepit in center
  drawSprite(ctx, getSprite('firepit')!, offsetX + 18 * ts, offsetY + 13 * ts, zoom)
  // Statue
  drawSprite(ctx, FURNITURE.statue, offsetX + 14.5 * ts, offsetY + 13 * ts, zoom * 0.5)
  drawSprite(ctx, FURNITURE.statue, offsetX + 22.5 * ts, offsetY + 13 * ts, zoom * 0.5)
  // Filing cabinet
  drawSprite(ctx, FURNITURE.filing_cabinet, offsetX + 14.5 * ts, offsetY + 17 * ts, zoom * 0.5)
  // Clock on wall
  drawSprite(ctx, FURNITURE.clock, offsetX + 18.5 * ts, offsetY + 9.3 * ts, zoom * 0.5)
}

// === CHARACTERS (top-down, 4-direction, walk cycle) ===
function drawCharacters(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, ts: number, zoom: number, time: number): void {
  // For each agent, draw character sprite at their seat position
  for (const agent of MOCKUP_AGENTS) {
    const baseX = offsetX + agent.seatCol * ts
    const baseY = offsetY + agent.seatRow * ts

    // State-based animation (T18-T19)
    let bobY = 0
    let pulseScale = 1
    let shakeX = 0

    if (agent.state === 'idle') {
      // Angry shake + small bob
      shakeX = Math.round(Math.sin(time * 12) * 0.5) * zoom
      bobY = Math.sin(time * 6) * 0.3 * zoom
    } else if (agent.state === 'working') {
      // Looking down at screen, slight typing bob
      bobY = Math.sin(time * 6) * 0.2 * zoom
    } else if (agent.state === 'waiting_approval') {
      // Urgent shake
      shakeX = Math.round(Math.sin(time * 15) * 1) * zoom
      pulseScale = 1 + Math.sin(time * 6) * 0.05
    } else if (agent.state === 'barking') {
      // Hermes pulse + bounce
      pulseScale = 1 + Math.sin(time * 10) * 0.15
      bobY = Math.sin(time * 8) * 1 * zoom
    }

    // Get animation frame from state
    const animInfo = getAgentAnimationFrame(agent.state, time)

    // State aura (T18)
    drawStateAura(ctx, agent, baseX, baseY, ts, time)

    // Shadow
    ctx.save()
    ctx.globalAlpha = 0.4
    ctx.fillStyle = HELL_FIRE.void
    ctx.beginPath()
    ctx.ellipse(
      baseX + ts / 2 + shakeX, baseY + ts * 0.95,
      ts * 0.35 * pulseScale, ts * 0.08 * pulseScale,
      0, 0, Math.PI * 2,
    )
    ctx.fill()
    ctx.restore()

    // Character sprite — 16x24, rendered at 3x scale = 48x72 screen pixels (T15)
    const charSprite = getAgentSprite(
      agent.profile,
      agent.palette,
      agent.facing,
      animInfo.frame,
      animInfo.type,
    )
    const spriteScale = zoom * 3  // 3x upscale as specified
    const drawX = baseX + ts * 0.5 - (16 * spriteScale) / 2 + shakeX - (spriteScale * 16 * (pulseScale - 1)) / 2
    const drawY = baseY + ts * 0.5 - (24 * spriteScale) / 2 + bobY - (spriteScale * 24 * (pulseScale - 1)) / 2

    for (let row = 0; row < charSprite.length; row++) {
      for (let col = 0; col < (charSprite[row]?.length || 0); col++) {
        const color = charSprite[row][col]
        if (color === '' || color === undefined) continue
        ctx.fillStyle = color
        ctx.fillRect(drawX + col * spriteScale, drawY + row * spriteScale, spriteScale, spriteScale)
      }
    }
  }
}

// === LAMP LIGHT CONES ===
function drawLampLight(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, ts: number, time: number): void {
  // Light sources: wall torches in War Room, firepits, desk lamps
  const lights: { x: number; y: number; radius: number; flicker: number }[] = [
    // War Room torches
    { x: offsetX + 1.5 * ts, y: offsetY + 3.5 * ts, radius: ts * 1.5, flicker: 0.15 },
    { x: offsetX + 22.5 * ts, y: offsetY + 3.5 * ts, radius: ts * 1.5, flicker: 0.15 },
    { x: offsetX + 1.5 * ts, y: offsetY + 5.5 * ts, radius: ts * 1.5, flicker: 0.15 },
    { x: offsetX + 22.5 * ts, y: offsetY + 5.5 * ts, radius: ts * 1.5, flicker: 0.15 },
    // War Room firepits
    { x: offsetX + 5.5 * ts, y: offsetY + 6.5 * ts, radius: ts * 2.5, flicker: 0.25 },
    { x: offsetX + 18.5 * ts, y: offsetY + 6.5 * ts, radius: ts * 2.5, flicker: 0.25 },
    // Lounge firepit
    { x: offsetX + 18.5 * ts, y: offsetY + 14 * ts, radius: ts * 2.5, flicker: 0.25 },
  ]
  for (const light of lights) {
    const flicker = 1 + Math.sin(time * 8 + light.x) * light.flicker
    const radius = light.radius * flicker
    const grad = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, radius)
    grad.addColorStop(0, 'rgba(255, 170, 0, 0.4)')
    grad.addColorStop(0.3, 'rgba(255, 85, 0, 0.2)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(light.x, light.y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// === STATE AURA ===
function drawStateAura(
  ctx: CanvasRenderingContext2D,
  agent: MockAgent,
  baseX: number,
  baseY: number,
  ts: number,
  time: number,
): void {
  let color = ''
  let pulse = 0
  switch (agent.state) {
    case 'idle':             color = '170, 0, 0';   pulse = 1; break
    case 'working':          color = '255, 170, 0'; pulse = 0.3; break
    case 'waiting_approval': color = '255, 85, 0';  pulse = 1.5; break
    case 'barking':          color = '255, 0, 0';   pulse = 3; break
  }
  if (!color) return
  const phase = (Math.sin(time * pulse * 3) + 1) / 2
  const alpha = 0.08 + 0.12 * phase
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const gradient = ctx.createRadialGradient(
    baseX + ts / 2, baseY + ts * 0.4, 0,
    baseX + ts / 2, baseY + ts * 0.4, ts * 0.7,
  )
  gradient.addColorStop(0, `rgba(${color}, ${alpha})`)
  gradient.addColorStop(1, `rgba(${color}, 0)`)
  ctx.fillStyle = gradient
  ctx.fillRect(baseX, baseY, ts, ts)
  ctx.restore()
}

// === SPEECH BUBBLE (top layer, only for front-most character) ===
function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  agent: MockAgent,
  offsetX: number,
  offsetY: number,
  ts: number,
  time: number,
): void {
  const text = agent.bubble || ''
  if (!text) return
  const isBark = agent.state === 'barking'
  const isIdle = agent.state === 'idle'
  const isWait = agent.state === 'waiting_approval'
  let icon = ''
  if (isBark) icon = '!'
  else if (isIdle) icon = '?'
  else if (isWait) icon = '!'
  const fontSize = Math.max(6, Math.round(5 * (ts / TILE_SIZE)))
  const padding = fontSize * 0.4
  const iconWidth = icon ? fontSize * 1.2 : 0
  ctx.save()
  ctx.font = `900 ${fontSize}px "Impact", "Arial Black", system-ui, sans-serif`
  const textWidth = ctx.measureText(text).width
  const bubbleW = textWidth + iconWidth + padding * 3
  const bubbleH = fontSize + padding * 2
  const baseX = offsetX + agent.seatCol * ts
  const baseY = offsetY + agent.seatRow * ts
  const bubbleX = baseX + ts / 2 - bubbleW / 2
  const bubbleY = baseY - bubbleH - 4
  const tailW = fontSize * 0.5
  const tailH = fontSize * 0.6
  const tailX = baseX + ts / 2 - tailW / 2
  const tailY = bubbleY + bubbleH
  const bgColor: string = 'rgba(10, 0, 0, 0.95)'
  let borderColor: string = HELL_FIRE.redBright
  let textColor: string = HELL_FIRE.bone
  if (isBark) {
    borderColor = HELL_FIRE.lavaHot
    textColor = HELL_FIRE.goldBright
  } else if (isIdle) {
    borderColor = HELL_FIRE.redMid
    textColor = HELL_FIRE.lavaBright
  } else if (isWait) {
    borderColor = HELL_FIRE.lavaGlow
    textColor = HELL_FIRE.lavaGlow
  }
  ctx.fillStyle = bgColor
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1.5
  const radius = bubbleH / 2
  ctx.beginPath()
  ctx.moveTo(bubbleX + radius, bubbleY)
  ctx.lineTo(bubbleX + bubbleW - radius, bubbleY)
  ctx.arcTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + radius, radius)
  ctx.arcTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - radius, bubbleY + bubbleH, radius)
  ctx.lineTo(bubbleX + radius, bubbleY + bubbleH)
  ctx.arcTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - radius, radius)
  ctx.arcTo(bubbleX, bubbleY, bubbleX + radius, bubbleY, radius)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(tailX, tailY)
  ctx.lineTo(tailX + tailW, tailY)
  ctx.lineTo(tailX + tailW / 2, tailY + tailH)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  let iconOffsetY = 0
  if (isBark) iconOffsetY = Math.sin(time * 12) * 2
  else if (isIdle) iconOffsetY = Math.sin(time * 6) * 1
  if (icon) {
    ctx.fillStyle = isBark ? HELL_FIRE.goldBright : (isIdle ? HELL_FIRE.lavaBright : HELL_FIRE.lavaGlow)
    ctx.font = `900 ${fontSize * 1.4}px "Impact", "Arial Black", system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, bubbleX + padding + iconWidth / 2, bubbleY + bubbleH / 2 + iconOffsetY)
  }
  ctx.fillStyle = textColor
  ctx.font = `900 ${fontSize}px "Impact", "Arial Black", system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const textX = bubbleX + padding + iconWidth
  ctx.fillText(text, textX, bubbleY + bubbleH / 2)
  ctx.restore()
}
