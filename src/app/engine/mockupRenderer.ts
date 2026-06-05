// Mockup renderer v2 — tile-based floor, walls, animated lava pools
// Hell Office reference-quality visual

import { TILE_SIZE } from './constants'
import {
  HELL_FIRE, TILE_COBBLE, TILE_WALL, LAVA_TILE_FRAMES, LAVA_ROCK,
  getAgentSprite, getFurnitureSprite,
} from './pixelArt'
import {
  MOCKUP_AGENTS, MOCKUP_FURNITURE, MOCKUP_ROOMS, FLOOR_MAP, WALL_MAP, LAVA_ROCKS,
  type MockAgent, type MockRoom,
} from './mockupData'
import type { SpriteData } from './sprites'

const _ = ''

// Draw a sprite at world position with integer scaling
function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteData,
  x: number,
  y: number,
  zoom: number,
): void {
  const s = zoom
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < (sprite[row]?.length || 0); col++) {
      const color = sprite[row][col]
      if (color === '' || color === undefined) continue
      ctx.fillStyle = color
      ctx.fillRect(x + col * s, y + row * s, s, s)
    }
  }
}

// Render a single 16x16 tile at position (col, row) with given zoom
function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: SpriteData,
  x: number,
  y: number,
  zoom: number,
): void {
  // 16x16 tile rendered at 2x zoom = 32x32 screen pixels
  // We want tile to fill a TILE_SIZE x TILE_SIZE area
  const scale = TILE_SIZE / tile[0].length  // = 2 for 16x16 → 32
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
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  const mapW = cols * TILE_SIZE * zoom
  const mapH = rows * TILE_SIZE * zoom
  const offsetX = (canvasWidth - mapW) / 2 + panX
  const offsetY = (canvasHeight - mapH) / 2 + panY
  const ts = TILE_SIZE * zoom  // screen pixels per tile

  // === Step 1: Background void ===
  ctx.fillStyle = HELL_FIRE.void
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // === Step 2: Floor tiles (tile-based) ===
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * ts
      const y = offsetY + row * ts
      const tile = FLOOR_MAP[row]?.[col]
      if (tile === 'cobble') {
        drawTile(ctx, TILE_COBBLE, x, y, zoom)
      } else if (tile === 'lava') {
        // Animated lava: cycle through frames
        const frameIdx = Math.floor(time * 6) % LAVA_TILE_FRAMES.length
        drawTile(ctx, LAVA_TILE_FRAMES[frameIdx], x, y, zoom)
        // Glow overlay
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        ctx.fillStyle = `rgba(255, 100, 0, ${0.15 + 0.1 * Math.sin(time * 4 + col + row)})`
        ctx.fillRect(x, y, ts, ts)
        ctx.restore()
      } else {
        // void — black
        ctx.fillStyle = HELL_FIRE.black
        ctx.fillRect(x, y, ts, ts)
      }
    }
  }

  // === Step 3: Room glow gradients (atmospheric) ===
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
    const alpha = 0.12 + 0.05 * Math.sin(time * 1.5 + room.col)
    gradient.addColorStop(0, `rgba(255, 85, 0, ${alpha})`)
    gradient.addColorStop(0.6, `rgba(170, 34, 0, ${alpha * 0.4})`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(rx, ry, rw, rh)
    ctx.restore()
  }

  // === Step 4: Walls ===
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const wall = WALL_MAP[row]?.[col]
      if (!wall) continue
      const x = offsetX + col * ts
      const y = offsetY + row * ts
      if (wall.top) {
        // Top wall — full tile
        drawTile(ctx, TILE_WALL, x, y - ts * 0.1, zoom)
        // Highlight edge
        ctx.fillStyle = HELL_FIRE.stoneEdge
        ctx.fillRect(x, y, ts, Math.max(1, zoom))
      }
      if (wall.left) {
        // Left wall — half tile
        const wallW = ts * 0.2
        const wallH = ts
        const wallSprite = TILE_WALL
        const scale = TILE_SIZE / wallSprite[0].length
        for (let r = 0; r < wallSprite.length; r++) {
          for (let c = 0; c < Math.floor(wallSprite[0].length * 0.25); c++) {
            const color = wallSprite[r][c]
            if (color === '' || color === undefined) continue
            ctx.fillStyle = color
            ctx.fillRect(x + c * scale * zoom, y + r * scale * zoom, scale * zoom, scale * zoom)
          }
        }
        // Shadow on floor (right of wall)
        ctx.save()
        ctx.globalAlpha = 0.4
        ctx.fillStyle = HELL_FIRE.black
        const shadowGrad = ctx.createLinearGradient(x + wallW, y, x + wallW + ts * 0.15, y)
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)')
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = shadowGrad
        ctx.fillRect(x + wallW, y, ts * 0.2, wallH)
        ctx.restore()
      }
    }
  }

  // === Step 5: Lava strip rocks (decoration) ===
  for (const rock of LAVA_ROCKS) {
    const rx = offsetX + rock.col * ts + ts * 0.4
    const ry = offsetY + rock.row * ts + ts * 0.3
    drawSprite(ctx, LAVA_ROCK, rx, ry, zoom * 2)
  }

  // === Step 6: Room labels ===
  for (const room of MOCKUP_ROOMS) {
    drawRoomLabel(ctx, room, offsetX, offsetY, ts, time)
  }

  // === Step 7: Furniture (sorted by row for depth) ===
  const sortedFurniture = [...MOCKUP_FURNITURE].sort((a, b) => a.row - b.row)
  for (const f of sortedFurniture) {
    const fx = offsetX + f.col * ts
    const fy = offsetY + f.row * ts
    const sprite = getFurnitureSprite(f.type)
    drawSprite(ctx, sprite, fx, fy, zoom)
  }

  // === Step 8: Agents (Z-sorted) ===
  const sortedAgents = [...MOCKUP_AGENTS].sort((a, b) => a.seatRow - b.seatRow)
  for (const agent of sortedAgents) {
    drawAgent(ctx, agent, offsetX, offsetY, ts, zoom, time)
  }

  return { offsetX, offsetY, time }
}

function drawRoomLabel(
  ctx: CanvasRenderingContext2D,
  room: MockRoom,
  offsetX: number,
  offsetY: number,
  ts: number,
  time: number,
): void {
  const fontSize = Math.max(8, Math.round(10 * (ts / TILE_SIZE)))
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

function drawAgent(
  ctx: CanvasRenderingContext2D,
  agent: MockAgent,
  offsetX: number,
  offsetY: number,
  ts: number,
  zoom: number,
  time: number,
): void {
  const sprite = getAgentSprite(agent.profile)
  // Character is 16x24 native. We want it to fit a tile (TILE_SIZE = 32).
  // Scale: 32/24 ≈ 1.33
  const charScale = (ts / 24) * 1.0
  // Or just use zoom * 2 since 16*2 = 32
  const spriteScale = zoom * 2

  const baseX = offsetX + agent.seatCol * ts
  const baseY = offsetY + agent.seatRow * ts

  // Animation
  let bobOffset = 0
  let shakeX = 0
  let pulseScale = 1
  if (agent.state === 'idle') {
    shakeX = Math.round(Math.sin(time * 12) * 0.5) * zoom
    bobOffset = Math.sin(time * 6) * 0.3
  } else if (agent.state === 'working') {
    bobOffset = Math.sin(time * 2 + agent.id) * 0.5
  } else if (agent.state === 'waiting_approval') {
    shakeX = Math.round(Math.sin(time * 15) * 1) * zoom
    pulseScale = 1 + Math.sin(time * 6) * 0.05
  } else if (agent.state === 'barking') {
    pulseScale = 1 + Math.sin(time * 10) * 0.15
    bobOffset = Math.sin(time * 8) * 1
  }

  // Shadow
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = HELL_FIRE.void
  ctx.beginPath()
  ctx.ellipse(
    baseX + ts / 2 + shakeX, baseY + ts * 0.95,
    ts * 0.4 * pulseScale, ts * 0.1 * pulseScale,
    0, 0, Math.PI * 2,
  )
  ctx.fill()
  ctx.restore()

  // Draw character (centered horizontally in tile, feet at bottom)
  const drawX = baseX + shakeX - (spriteScale * 16 * (pulseScale - 1)) / 2
  const drawY = baseY - ts * 0.05 + bobOffset - (spriteScale * 24 * (pulseScale - 1)) / 2
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < (sprite[row]?.length || 0); col++) {
      const color = sprite[row][col]
      if (color === '' || color === undefined) continue
      ctx.fillStyle = color
      ctx.fillRect(drawX + col * spriteScale, drawY + row * spriteScale, spriteScale, spriteScale)
    }
  }

  // State aura
  drawStateAura(ctx, agent, baseX, baseY, ts, time)

  // Speech bubble
  if (agent.bubble) {
    drawSpeechBubble(ctx, agent, baseX, baseY, ts, time)
  }
}

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
  const alpha = 0.1 + 0.15 * phase
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

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  agent: MockAgent,
  baseX: number,
  baseY: number,
  ts: number,
  time: number,
): void {
  const text = agent.bubble || ''
  const isBark = agent.state === 'barking'
  const isIdle = agent.state === 'idle'
  const isWait = agent.state === 'waiting_approval'

  let icon = ''
  if (isBark) icon = '!'
  else if (isIdle) icon = '?'
  else if (isWait) icon = '!'

  const fontSize = Math.max(6, Math.round(6 * (ts / TILE_SIZE)))
  const padding = fontSize * 0.4
  const iconWidth = icon ? fontSize * 1.2 : 0

  ctx.save()
  ctx.font = `900 ${fontSize}px "Impact", "Arial Black", system-ui, sans-serif`
  const textWidth = ctx.measureText(text).width
  const bubbleW = textWidth + iconWidth + padding * 3
  const bubbleH = fontSize + padding * 2
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
