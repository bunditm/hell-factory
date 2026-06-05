// Mockup renderer — Hell Office with HELL_FIRE palette, hardcoded layout
// Phase A: static visual only (no game state, no pathfinding)

import { TILE_SIZE } from './constants'
import { HELL_FIRE, getAgentSprite, getFurnitureSprite } from './pixelArt'
import { MOCKUP_AGENTS, MOCKUP_FURNITURE, MOCKUP_ROOMS, type MockAgent, type MockRoom } from './mockupData'
import type { SpriteData } from './sprites'

const _ = ''

// Draw a sprite at world position with optional palette tint and animation offset
function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteData,
  x: number,
  y: number,
  zoom: number,
  offsetY = 0,
): void {
  const s = zoom
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < (sprite[row]?.length || 0); col++) {
      const color = sprite[row][col]
      if (color === '' || color === undefined) continue
      ctx.fillStyle = color
      ctx.fillRect(x + col * s, y + (row + offsetY) * s, s, s)
    }
  }
}

// === RENDERING PIPELINE ===
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
  const ts = TILE_SIZE * zoom

  // === Step 1: Background void (deepest black) ===
  ctx.fillStyle = HELL_FIRE.void
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // === Step 2: Floor tiles (room-by-room, each with own base) ===
  for (const room of MOCKUP_ROOMS) {
    const rx = offsetX + room.col * ts
    const ry = offsetY + room.row * ts
    const rw = room.cols * ts
    const rh = room.rows * ts
    // Room base floor
    ctx.fillStyle = room.floorColor
    ctx.fillRect(rx, ry, rw, rh)

    // Lava glow gradient overlay (animated)
    const phase = (time * 0.5 + room.col * 0.3) % 1
    const gradient = ctx.createRadialGradient(
      rx + rw / 2, ry + rh / 2, 0,
      rx + rw / 2, ry + rh / 2, Math.max(rw, rh) * 0.7,
    )
    const alpha = 0.15 + 0.05 * Math.sin(time * 2 + room.col)
    gradient.addColorStop(0, `rgba(255, 85, 0, ${alpha})`)
    gradient.addColorStop(0.5, `rgba(170, 34, 0, ${alpha * 0.5})`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(rx, ry, rw, rh)
  }

  // === Step 3: Room separators (lava strip between War Room and Pit) ===
  ctx.fillStyle = HELL_FIRE.crimson
  ctx.fillRect(offsetX, offsetY + 9 * ts, mapW, ts)
  ctx.fillStyle = HELL_FIRE.fireRed
  ctx.fillRect(offsetX, offsetY + 9 * ts + ts * 0.3, mapW, ts * 0.4)
  // Lava pulse (additive)
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const lavaPulse = 0.3 + 0.2 * Math.sin(time * 3)
  ctx.fillStyle = `rgba(255, 170, 0, ${lavaPulse})`
  ctx.fillRect(offsetX, offsetY + 9 * ts + ts * 0.2, mapW, ts * 0.6)
  ctx.restore()

  // === Step 4: Room labels (top of each room) ===
  for (const room of MOCKUP_ROOMS) {
    drawRoomLabel(ctx, room, offsetX, offsetY, ts, time)
  }

  // === Step 5: Tile grid (subtle, only inside rooms) ===
  ctx.strokeStyle = 'rgba(255, 100, 0, 0.08)'
  ctx.lineWidth = 1
  for (const room of MOCKUP_ROOMS) {
    for (let c = room.col; c <= room.col + room.cols; c++) {
      ctx.beginPath()
      ctx.moveTo(offsetX + c * ts, offsetY + room.row * ts)
      ctx.lineTo(offsetX + c * ts, offsetY + (room.row + room.rows) * ts)
      ctx.stroke()
    }
    for (let r = room.row; r <= room.row + room.rows; r++) {
      ctx.beginPath()
      ctx.moveTo(offsetX + room.col * ts, offsetY + r * ts)
      ctx.lineTo(offsetX + (room.col + room.cols) * ts, offsetY + r * ts)
      ctx.stroke()
    }
  }

  // === Step 6: Furniture (behind agents) ===
  for (const f of MOCKUP_FURNITURE) {
    const fx = offsetX + f.col * ts
    const fy = offsetY + f.row * ts
    const sprite = getFurnitureSprite(f.type)
    drawSprite(ctx, sprite, fx, fy, zoom)
  }

  // === Step 7: Agents (Z-sorted by row for proper depth) ===
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
  const fontSize = Math.max(8, Math.round(12 * (ts / TILE_SIZE)))
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
  const padX = fontSize * 0.4
  const padY = fontSize * 0.3
  const rx = cx - tw / 2 - padX
  const ry = cy - th / 2 - padY
  const rw = tw + padX * 2
  const rh = th + padY * 2
  const radius = rh / 2

  // Banner background
  ctx.fillStyle = 'rgba(10, 0, 0, 0.85)'
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

  // Banner border (red glow)
  const glow = 0.4 + 0.2 * Math.sin(time * 2 + room.col)
  ctx.strokeStyle = `rgba(255, 85, 0, ${glow})`
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Text
  const textGrad = ctx.createLinearGradient(cx, cy - th / 2, cx, cy + th / 2)
  textGrad.addColorStop(0, HELL_FIRE.gold)
  textGrad.addColorStop(1, HELL_FIRE.fireRed)
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
  const baseX = offsetX + agent.seatCol * ts
  const baseY = offsetY + agent.seatRow * ts

  // === Animation offsets ===
  let bobOffset = 0
  let shakeX = 0
  let pulseScale = 1
  let offsetRowShift = 0

  if (agent.state === 'idle') {
    // Angry shake: rapid small movements + speech bubble
    shakeX = Math.round(Math.sin(time * 12) * 0.5) * zoom
    // Slight bob (1 pixel)
    bobOffset = Math.sin(time * 6) * 0.3
  } else if (agent.state === 'working') {
    // Slow idle bob
    bobOffset = Math.sin(time * 2 + agent.id) * 0.5
  } else if (agent.state === 'waiting_approval') {
    // Urgent attention shake + slight pulse
    shakeX = Math.round(Math.sin(time * 15) * 1) * zoom
    pulseScale = 1 + Math.sin(time * 6) * 0.05
  } else if (agent.state === 'barking') {
    // Hermes bark: pulse + flash
    pulseScale = 1 + Math.sin(time * 10) * 0.15
    bobOffset = Math.sin(time * 8) * 1
  }

  // Draw shadow first
  ctx.save()
  ctx.globalAlpha = 0.4
  ctx.fillStyle = HELL_FIRE.void
  ctx.beginPath()
  ctx.ellipse(
    baseX + ts / 2 + shakeX, baseY + ts * 0.95,
    ts * 0.4 * pulseScale, ts * 0.12 * pulseScale,
    0, 0, Math.PI * 2,
  )
  ctx.fill()
  ctx.restore()

  // Draw agent (shifted up to align feet with seat)
  const drawX = baseX + shakeX - (ts * (pulseScale - 1)) / 2
  const drawY = baseY - ts * 0.1 + bobOffset - (ts * (pulseScale - 1)) / 2

  // If pulsing, scale via direct pixel draw (no ctx.scale — keeps integer pixels)
  if (pulseScale !== 1) {
    // Re-draw sprite at scaled size
    const s = zoom * pulseScale
    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < (sprite[row]?.length || 0); col++) {
        const color = sprite[row][col]
        if (color === '' || color === undefined) continue
        ctx.fillStyle = color
        ctx.fillRect(drawX + col * s, drawY + (row + offsetRowShift) * s, s, s)
      }
    }
  } else {
    drawSprite(ctx, sprite, drawX, drawY, zoom, offsetRowShift)
  }

  // === State glow aura behind agent ===
  drawStateAura(ctx, agent, baseX, baseY, ts, time)

  // === Speech bubble ===
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
    case 'idle':             color = '170, 0, 0';   pulse = 1; break  // dim red
    case 'working':          color = '255, 170, 0'; pulse = 0.3; break  // amber
    case 'waiting_approval': color = '255, 85, 0';  pulse = 1.5; break  // bright orange
    case 'barking':          color = '255, 0, 0';   pulse = 3; break  // bright red
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

  // Icon
  let icon = ''
  if (isBark) icon = '!'
  else if (isIdle) icon = '?'
  else if (isWait) icon = '!'
  else icon = ''

  const fontSize = Math.max(8, Math.round(7 * (ts / TILE_SIZE)))
  const padding = fontSize * 0.4
  const iconWidth = icon ? fontSize * 1.2 : 0
  const labelText = text

  ctx.save()
  ctx.font = `900 ${fontSize}px "Impact", "Arial Black", system-ui, sans-serif`
  const textWidth = ctx.measureText(labelText).width
  const bubbleW = textWidth + iconWidth + padding * 3
  const bubbleH = fontSize + padding * 2
  const bubbleX = baseX + ts / 2 - bubbleW / 2
  const bubbleY = baseY - bubbleH - 4

  // Tail
  const tailW = fontSize * 0.5
  const tailH = fontSize * 0.6
  const tailX = baseX + ts / 2 - tailW / 2
  const tailY = bubbleY + bubbleH

  // Background color
  const bgColor: string = 'rgba(10, 0, 0, 0.95)'
  let borderColor: string = HELL_FIRE.crimson
  let textColor: string = HELL_FIRE.bone

  if (isBark) {
    borderColor = HELL_FIRE.fireOrange
    textColor = HELL_FIRE.gold
  } else if (isIdle) {
    borderColor = HELL_FIRE.deepRed
    textColor = HELL_FIRE.fireRed
  } else if (isWait) {
    borderColor = HELL_FIRE.amber
    textColor = HELL_FIRE.amber
  }

  // Bubble shape (rounded rect + tail)
  ctx.fillStyle = bgColor
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1.5

  // Rounded rectangle
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

  // Tail (triangle)
  ctx.beginPath()
  ctx.moveTo(tailX, tailY)
  ctx.lineTo(tailX + tailW, tailY)
  ctx.lineTo(tailX + tailW / 2, tailY + tailH)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Icon (bouncing for bark)
  let iconOffsetY = 0
  if (isBark) {
    iconOffsetY = Math.sin(time * 12) * 2
  } else if (isIdle) {
    iconOffsetY = Math.sin(time * 6) * 1
  }
  if (icon) {
    ctx.fillStyle = isBark ? HELL_FIRE.gold : (isIdle ? HELL_FIRE.fireRed : HELL_FIRE.amber)
    ctx.font = `900 ${fontSize * 1.4}px "Impact", "Arial Black", system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, bubbleX + padding + iconWidth / 2, bubbleY + bubbleH / 2 + iconOffsetY)
  }

  // Text
  ctx.fillStyle = textColor
  ctx.font = `900 ${fontSize}px "Impact", "Arial Black", system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const textX = bubbleX + padding + iconWidth
  ctx.fillText(labelText, textX, bubbleY + bubbleH / 2)
  ctx.restore()
}
