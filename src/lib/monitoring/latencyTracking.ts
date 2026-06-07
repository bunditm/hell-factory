/**
 * Latency tracking for monitoring function
 * Tracks E2E (Hermes activity → canvas) and in-process (SSE → Zustand → canvas) latency
 * Provides ring buffers for storing samples and computing statistics
 */

// Ring buffer implementation - fixed-size circular buffer
export class RingBuffer<T> {
  private buffer: T[];
  private capacity: number;
  private size: number = 0;
  private head: number = 0;
  private tail: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    } else {
      // Buffer full, evict oldest (move tail forward)
      this.tail = (this.tail + 1) % this.capacity;
    }
  }

  getAll(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const idx = (this.tail + i) % this.capacity;
      result.push(this.buffer[idx]);
    }
    return result;
  }

  get count(): number {
    return this.size;
  }

  get isEmpty(): boolean {
    return this.size === 0;
  }
}

// Latency sample for E2E (Hermes activity → canvas)
export interface E2ELatencySample {
  timestamp: number;
  latencyMs: number;
  isFresh: boolean; // State started within 100ms of event receipt
}

// Latency sample for in-process (SSE → Zustand → canvas)
export interface InProcessLatencySample {
  timestamp: number;
  latencyMs: number;
}

// Latency statistics
export interface LatencyStats {
  avgE2ELatencyMs: number;
  p95E2ELatencyMs: number;
  avgCanvasLatencyMs: number;
  p95CanvasLatencyMs: number;
  e2eSampleCount: number;
  canvasSampleCount: number;
}

// NFR targets from docs/06-monitoring-requirements.md
export const NFR_TARGETS = {
  E2E_LATENCY_MS: 2000, // NFR-M2
  IN_PROCESS_LATENCY_MS: 200, // NFR-M4.7
  CARD_UPDATE_LATENCY_MS: 500, // NFR-M9
  CANVAS_FRAME_MS: 16, // NFR-M10
} as const;

// Global latency tracking state (singleton pattern for production use)
let e2eBuffer: RingBuffer<E2ELatencySample> | null = null;
let canvasBuffer: RingBuffer<InProcessLatencySample> | null = null;
let warningThresholdE2E: number = 0;
let warningThresholdCanvas: number = 0;

// Initialize tracking (call once at app startup)
export function initLatencyTracking(bufferSize: number = 100): void {
  e2eBuffer = new RingBuffer<E2ELatencySample>(bufferSize);
  canvasBuffer = new RingBuffer<InProcessLatencySample>(bufferSize);
}

// Record E2E latency (Hermes activity → canvas pixel change)
export function recordE2ELatency(
  stateSinceAt: number,
  eventReceivedAt: number,
  canvasRenderedAt: number
): void {
  if (!e2eBuffer) {
    console.warn('[LatencyTracking] Tracking not initialized, call initLatencyTracking() first');
    return;
  }

  const latencyMs = canvasRenderedAt - stateSinceAt;
  const isFresh = Math.abs(eventReceivedAt - stateSinceAt) < 100;

  e2eBuffer.push({
    timestamp: canvasRenderedAt,
    latencyMs,
    isFresh,
  });
}

// Record in-process latency (SSE → Zustand → canvas redraw)
export function recordCanvasLatency(storeUpdateAt: number, canvasRedrawAt: number): void {
  if (!canvasBuffer) {
    console.warn('[LatencyTracking] Tracking not initialized, call initLatencyTracking() first');
    return;
  }

  const latencyMs = canvasRedrawAt - storeUpdateAt;
  canvasBuffer.push({
    timestamp: canvasRedrawAt,
    latencyMs,
  });
}

// Compute statistics from buffers
function computeAvg(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sum = samples.reduce((a, b) => a + b, 0);
  return sum / samples.length;
}

function computeP95(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.ceil(samples.length * 0.95) - 1;
  return sorted[idx];
}

// Get current latency statistics
export function getLatencyStats(): LatencyStats {
  const e2eSamples = e2eBuffer?.getAll() ?? [];
  const canvasSamples = canvasBuffer?.getAll() ?? [];

  const e2eLatencies = e2eSamples.map(s => s.latencyMs);
  const canvasLatencies = canvasSamples.map(s => s.latencyMs);

  const avgE2E = computeAvg(e2eLatencies);
  const p95E2E = computeP95(e2eLatencies);
  const avgCanvas = computeAvg(canvasLatencies);
  const p95Canvas = computeP95(canvasLatencies);

  // Check for NFR violations and log warnings
  if (e2eSamples.length > 0) {
    const prevThresholdE2E = warningThresholdE2E;
    warningThresholdE2E = p95E2E > NFR_TARGETS.E2E_LATENCY_MS ? 1 : 0;

    // Log warning when threshold is crossed (debounce: only log when crossing threshold)
    if (warningThresholdE2E && !prevThresholdE2E) {
      console.warn(
        `[LatencyTracking] NFR-M2 VIOLATION: E2E latency p95 = ${p95E2E.toFixed(0)}ms (target < ${NFR_TARGETS.E2E_LATENCY_MS}ms)`
      );
    }
  }

  if (canvasSamples.length > 0) {
    const prevThresholdCanvas = warningThresholdCanvas;
    warningThresholdCanvas = p95Canvas > NFR_TARGETS.IN_PROCESS_LATENCY_MS ? 1 : 0;

    if (warningThresholdCanvas && !prevThresholdCanvas) {
      console.warn(
        `[LatencyTracking] NFR-M4.7 VIOLATION: In-process latency p95 = ${p95Canvas.toFixed(0)}ms (target < ${NFR_TARGETS.IN_PROCESS_LATENCY_MS}ms)`
      );
    }
  }

  return {
    avgE2ELatencyMs: avgE2E,
    p95E2ELatencyMs: p95E2E,
    avgCanvasLatencyMs: avgCanvas,
    p95CanvasLatencyMs: p95Canvas,
    e2eSampleCount: e2eSamples.length,
    canvasSampleCount: canvasSamples.length,
  };
}

// Reset tracking (for tests or manual reset)
export function resetLatencyTracking(): void {
  e2eBuffer = null;
  canvasBuffer = null;
  warningThresholdE2E = 0;
  warningThresholdCanvas = 0;
}