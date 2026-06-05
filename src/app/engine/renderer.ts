// Canvas renderer — draws floor, furniture, characters, room labels
// Based on agentroom's renderer.ts

import type { SpriteData } from './sprites'
import { TILE_SIZE } from './constants'
import { FALLBACK_FLOOR_COLOR } from './constants'

// Room labels
const ROOM_LABELS = [
  { name: 'Working', cx: 6.5, cy: 1.1 },
  { name: 'Idling', cx: 22, cy: 1.1 },
]
const ROOM_LABEL_FONT_BASE = 11

// Draw a sprite at world position
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
      if (color === '') continue
      ctx.fillStyle = color
      ctx.fillRect(x + col * s, y + row * s, s, s)
    }
  }
}

// Render room name labels with background banners
function renderRoomLabels(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  zoom: number,
): void {
  const s = TILE_SIZE * zoom
  const fontSize = Math.max(8, Math.round(ROOM_LABEL_FONT_BASE * zoom))
  ctx.save()
  ctx.font = `900 ${fontSize}px "SF Pro Display", "Segoe UI", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const padX = fontSize * 0.6
  const padY = fontSize * 0.35
  for (const label of ROOM_LABELS) {
    const x = offsetX + label.cx * s
    const y = offsetY + label.cy * s
    const text = label.name.toUpperCase()
    const metrics = ctx.measureText(text)
    const tw = metrics.width
    const th = fontSize
    ctx.globalAlpha = 0.55
    ctx.fillStyle = '#1a1a2e'
    const rx = x - tw / 2 - padX
    const ry = y - th / 2 - padY
    const rw = tw + padX * 2
    const rh = th + padY * 2
    const radius = rh / 2
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
    ctx.globalAlpha = 0.9
    ctx.fillStyle = '#000000'
    ctx.fillText(text, x, y)
  }
  ctx.restore()
}

export interface RenderFrameResult {
  offsetX: number
  offsetY: number
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  panX: number,
  panY: number,
  cols: number,
  rows: number,
): RenderFrameResult {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // Calculate offset to center the office
  const mapW = cols * TILE_SIZE * zoom
  const mapH = rows * TILE_SIZE * zoom
  const offsetX = (canvasWidth - mapW) / 2 + panX
  const offsetY = (canvasHeight - mapH) / 2 + panY

  // Draw floor tiles (placeholder: solid color)
  ctx.fillStyle = '#2d2d4a'  // dark blue-gray floor
  ctx.fillRect(offsetX, offsetY, mapW, mapH)

  // Draw tile grid (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  const ts = TILE_SIZE * zoom
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath()
    ctx.moveTo(offsetX + c * ts, offsetY)
    ctx.lineTo(offsetX + c * ts, offsetY + mapH)
    ctx.stroke()
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY + r * ts)
    ctx.lineTo(offsetX + mapW, offsetY + r * ts)
    ctx.stroke()
  }

  // Draw room labels
  renderRoomLabels(ctx, offsetX, offsetY, zoom)

  return { offsetX, offsetY }
}