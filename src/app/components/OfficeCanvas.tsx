'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { TILE_SIZE, DEFAULT_COLS, DEFAULT_ROWS, ZOOM_MIN, ZOOM_MAX } from '../engine/constants'
import { startGameLoop } from '../engine/gameLoop'
import { renderFrame } from '../engine/renderer'
import { PAN_MARGIN_FRACTION, ZOOM_SCROLL_THRESHOLD } from '../engine/constants'

const ZOOM_DEFAULT = 2

export default function OfficeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const panRef = useRef({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(ZOOM_DEFAULT)

  // Resize canvas to device pixels
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
  }, [])

  // Clamp pan so map edge doesn't go past margin
  const clampPan = useCallback((px: number, py: number): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: px, y: py }
    const mapW = DEFAULT_COLS * TILE_SIZE * zoom
    const mapH = DEFAULT_ROWS * TILE_SIZE * zoom
    const marginX = canvas.width * PAN_MARGIN_FRACTION
    const marginY = canvas.height * PAN_MARGIN_FRACTION
    const maxPanX = (mapW / 2) + canvas.width / 2 - marginX
    const maxPanY = (mapH / 2) + canvas.height / 2 - marginY
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, px)),
      y: Math.max(-maxPanY, Math.min(maxPanY, py)),
    }
  }, [zoom])

  // Pan state for middle-mouse drag
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })

  // Zoom scroll accumulator
  const zoomAccumRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    resizeCanvas()

    const observer = new ResizeObserver(() => resizeCanvas())
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    const stop = startGameLoop(canvas, {
      update: (_dt) => {
        // TODO: Update game state from SSE events
      },
      render: (ctx) => {
        const w = canvas.width
        const h = canvas.height

        const { offsetX, offsetY } = renderFrame(
          ctx,
          w,
          h,
          zoom,
          panRef.current.x,
          panRef.current.y,
          DEFAULT_COLS,
          DEFAULT_ROWS,
        )
      },
    })

    // Initial center pan
    const initialPan = clampPan(0, 0)
    panRef.current = initialPan

    return () => {
      stop()
      observer.disconnect()
    }
  }, [resizeCanvas, clampPan])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    zoomAccumRef.current += e.deltaY
    if (zoomAccumRef.current > ZOOM_SCROLL_THRESHOLD) {
      zoomAccumRef.current = 0
      setZoom(z => Math.max(ZOOM_MIN, z - 1))
    } else if (zoomAccumRef.current < -ZOOM_SCROLL_THRESHOLD) {
      zoomAccumRef.current = 0
      setZoom(z => Math.min(ZOOM_MAX, z + 1))
    }
  }, [])

  // Middle-mouse pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse
      e.preventDefault()
      isPanningRef.current = true
      panStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      }
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanningRef.current) return
    const dx = e.clientX - panStartRef.current.mouseX
    const dy = e.clientY - panStartRef.current.mouseY
    panRef.current = clampPan(
      panStartRef.current.panX + dx,
      panStartRef.current.panY + dy,
    )
  }, [clampPan])

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        className="block cursor-grab active:cursor-grabbing"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}