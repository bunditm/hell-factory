/**
 * Performance overlay component (dev-only)
 * Shows latency statistics when ?dev=1 query param is present
 */

'use client';

import { useLatencyStats } from '../../lib/monitoring/useLatencyStats';
import { NFR_TARGETS } from '../../lib/monitoring/latencyTracking';

// Check if dev mode is enabled via ?dev=1 query param
function isDevMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('dev') === '1';
}

export default function PerfOverlay() {
  const stats = useLatencyStats();

  if (!isDevMode()) return null;

  if (!stats) {
    return (
      <div className="fixed bottom-4 left-4 bg-black/90 text-green-500 p-2 text-xs font-mono rounded border border-green-900">
        Initializing latency tracking...
      </div>
    );
  }

  const { avgE2ELatencyMs, p95E2ELatencyMs, avgCanvasLatencyMs, p95CanvasLatencyMs } = stats;

  // Color coding: green = OK, yellow = warning, red = violation
  const e2eStatus = p95E2ELatencyMs > NFR_TARGETS.E2E_LATENCY_MS ? 'text-red-500' : 'text-green-500';
  const canvasStatus = p95CanvasLatencyMs > NFR_TARGETS.IN_PROCESS_LATENCY_MS ? 'text-red-500' : 'text-green-500';

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-green-500 p-3 text-xs font-mono rounded border border-green-900 min-w-[280px]">
      <div className="font-bold mb-2 text-amber-500">☠  Latency Stats  ☠</div>

      <div className="mb-2">
        <div className="text-gray-400 mb-1">E2E (Hermes to Canvas, target less than 2s)</div>
        <div>avg: {avgE2ELatencyMs.toFixed(0)}ms</div>
        <div>p95: <span className={e2eStatus}>{p95E2ELatencyMs.toFixed(0)}ms</span></div>
      </div>

      <div className="mb-2">
        <div className="text-gray-400 mb-1">In-Process (SSE to Zustand to Canvas, target less than 200ms)</div>
        <div>avg: {avgCanvasLatencyMs.toFixed(0)}ms</div>
        <div>p95: <span className={canvasStatus}>{p95CanvasLatencyMs.toFixed(0)}ms</span></div>
      </div>

      <div className="text-gray-500 text-[10px]">
        Samples: E2E={stats.e2eSampleCount}, Canvas={stats.canvasSampleCount}
      </div>
    </div>
  );
}