'use client'

import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { startGameLoop } from '../engine/gameLoop'
import { renderOfficeFrame, preloadAssets, isReady } from '../engine/officeRenderer'
import { useMonitoringStore } from '../../lib/monitoring/monitoringStore'
import { OfficeState } from '../engine/officeState'

const ZOOM_DEFAULT = 1

export default function OfficeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [assetsLoaded, setAssetsLoaded] = useState(false)
  
  // Office state manager (immutable, recreated when needed for memoization)
  const officeState = useMemo(() => new OfficeState(), [])
  
  // Subscribe to monitoring store
  const agents = useMonitoringStore((state) => state.agents)
  const lastSnapshotAt = useMonitoringStore((state) => state.lastSnapshotAt)
  const connectionState = useMonitoringStore((state) => state.connectionState)

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const rect = container.getBoundingClientRect()
    // 1600x900 internal resolution, scales to fit container (16:9 widescreen)
    const targetW = 1600
    const targetH = 900
    canvas.width = targetW
    canvas.height = targetH
    const scale = Math.min(rect.width / targetW, rect.height / targetH)
    canvas.style.width = `${targetW * scale}px`
    canvas.style.height = `${targetH * scale}px`
  }, [])

  // Preload all assets before starting render loop
  useEffect(() => {
    let cancelled = false
    preloadAssets()
      .then(() => { if (!cancelled) setAssetsLoaded(true) })
      .catch(err => {
        console.error('Asset preload failed:', err)
        // Still try to render with whatever loaded
        if (!cancelled) setAssetsLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  // Handle initial snapshot (applySnapshot in store)
  // This effect runs when lastSnapshotAt changes, indicating a new snapshot
  useEffect(() => {
    if (!assetsLoaded || lastSnapshotAt === 0) return
    
    // Convert Map to array for replaceAll
    const agentsArray = Array.from(agents.values())
    officeState.replaceAll(agentsArray)
    
    console.log('[OfficeCanvas] Applied snapshot with', agentsArray.length, 'agents')
  }, [assetsLoaded, lastSnapshotAt, agents, officeState])

  // Handle agent updates (applyAgentUpdate in store)
  // This effect runs when agents Map reference changes (Zustand shallow comparison)
  useEffect(() => {
    if (!assetsLoaded) return
    
    // We rely on the store to emit updates; the agents Map already has the latest state
    // This effect is mainly for debugging / initialization
    const agentsArray = Array.from(agents.values())
    
    // Check if we need to update (version check would be ideal but not available here)
    // For now, just log updates
    if (agentsArray.length > 0 && officeState.getVersion() === 0) {
      officeState.replaceAll(agentsArray)
      console.log('[OfficeCanvas] Initial sync with', agentsArray.length, 'agents')
    }
  }, [assetsLoaded, agents, officeState])

  useEffect(() => {
    if (!assetsLoaded) return
    const canvas = canvasRef.current
    if (!canvas) return
    resizeCanvas()
    const observer = new ResizeObserver(() => resizeCanvas())
    if (containerRef.current) observer.observe(containerRef.current)

    const startTime = performance.now()
    const stop = startGameLoop(canvas, {
      update: (dt) => {
        // Update bubble animations (FR-M7.11: auto-dismiss after 1s)
        officeState.updateBubbleAnimations(dt)
      },
      render: (ctx) => {
        if (!isReady()) return
        const t = (performance.now() - startTime) / 1000
        renderOfficeFrame(ctx, canvas.width, canvas.height, t)
      },
    })

    return () => { stop(); observer.disconnect() }
  }, [assetsLoaded, resizeCanvas])

  if (!assetsLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0a0000] text-amber-500">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-pulse">☠ Summoning demons... ☠</div>
          <div className="text-sm text-amber-700">Loading sprite atlas</div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center bg-[#0a0000]" style={{ minHeight: '100vh' }}>
      <canvas
        ref={canvasRef}
        style={{ imageRendering: 'pixelated', width: 'min(100vw, 177.78vh)', height: 'min(56.25vw, 100vh)', maxWidth: '100%', maxHeight: '100%' }}
        className="block"
      />
    </div>
  )
}
