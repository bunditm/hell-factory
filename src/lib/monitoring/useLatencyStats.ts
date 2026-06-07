/**
 * React hook for latency statistics
 * Returns computed avg and p95 latency metrics from tracking buffers
 */

import { useState, useEffect } from 'react';
import { getLatencyStats, LatencyStats, initLatencyTracking } from './latencyTracking';

// Hook that subscribes to latency stats updates
export function useLatencyStats(): LatencyStats | null {
  const [stats, setStats] = useState<LatencyStats | null>(null);

  useEffect(() => {
    // Initialize tracking on first hook mount
    initLatencyTracking(100); // Keep last 100 samples

    // Poll for stats every second (for live updates in dev overlay)
    const interval = setInterval(() => {
      setStats(getLatencyStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}