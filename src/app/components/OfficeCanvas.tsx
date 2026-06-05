'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { TILE_SIZE, DEFAULT_COLS, DEFAULT_ROWS, ZOOM_MIN, ZOOM_MAX, ZOOM_SCROLL_THRESHOLD, PAN_MARGIN_FRACTION } from '../engine/constants'
import { startGameLoop } from '../engine/gameLoop'
import { renderMockupFrame } from '../engine/mockupRenderer'
import { MOCKUP_COLS, MOCKUP_ROWS } from '../engine/mockupData'

const ZOOM_DEFAULT = 1

export default function OfficeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const panRef = useRef({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(ZOOM_DEFAULT)
  // Force re-mount of game loop when zoom changes (since render closure reads zoom)
  const [loopKey, setLoopKey] = useState(0)

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

  const clampPan = useCallback((px: number, py: number): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: px, y: py }
    const mapW = MOCKUP_COLS * TILE_SIZE * zoom
    const mapH = MOCKUP_ROWS * TILE_SIZE * zoom
    const marginX = canvas.width * PAN_MARGIN_FRACTION
    const marginY = canvas.height * PAN_MARGIN_FRACTION
    const maxPanX = (mapW / 2) + canvas.width / 2 - marginX
    const maxPanY = (mapH / 2) + canvas.height / 2 - marginY
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, px)),
      y: Math.max(-maxPanY, Math.min(maxPanY, py)),
    }
  }, [zoom])

  // Re-init the loop whenever zoom changes (so the closure captures fresh zoom)
  useEffect(() => { setLoopKey(k => k + 1) }, [zoom])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    resizeCanvas()
    const observer = new ResizeObserver(() => resizeCanvas())
    if (containerRef.current) observer.observe(containerRef.current)

    const startTime = performance.now()
    const stop = startGameLoop(canvas, {
      update: (_dt) => {
        // No game state yet — animations are time-based in render
      },
      render: (ctx) => {
        renderMockupFrame(
          ctx,
          canvas.width,
          canvas.height,
          zoom,
          panRef.current.x,
          panRef.current.y,
          MOCKUP_COLS,
          MOCKUP_ROWS,
          (performance.now() - startTime) / 1000,
        )
      },
    })

    // Initial center: pan = 0 already centers map in viewport
    panRef.current = clampPan(0, 0)

    return () => { stop(); observer.disconnect() }
  }, [resizeCanvas, clampPan, zoom, loopKey])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY > 0) {
      setZoom(z => Math.max(ZOOM_MIN, z - 1))
    } else {
      setZoom(z => Math.min(ZOOM_MAX, z + 1))
    }
  }, [])

  // Pan state for drag (left mouse) + middle-mouse
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 0) {
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
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        className="block"
        style={{ imageRendering: 'pixelated', cursor: 'grab' }}
      />
    </div>
  )
}
