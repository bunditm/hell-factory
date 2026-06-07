/**
 * Tests for latencyTracking.ts
 * Covers:
 * 1. Ring buffer evicts old events
 * 2. p95 calculation is correct
 * 3. Warning fires when p95 > target
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RingBuffer,
  initLatencyTracking,
  recordE2ELatency,
  recordCanvasLatency,
  getLatencyStats,
  resetLatencyTracking,
  NFR_TARGETS,
} from '../latencyTracking';

describe('RingBuffer', () => {
  it('pushes items and returns them in FIFO order', () => {
    const buffer = new RingBuffer<number>(3);
    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    expect(buffer.getAll()).toEqual([1, 2, 3]);
    expect(buffer.count).toBe(3);
  });

  it('evicts oldest events when buffer is full', () => {
    const buffer = new RingBuffer<number>(3);
    buffer.push(1);
    buffer.push(2);
    buffer.push(3);
    buffer.push(4); // Evicts 1

    expect(buffer.getAll()).toEqual([2, 3, 4]);
    expect(buffer.count).toBe(3);
  });

  it('handles multiple evictions', () => {
    const buffer = new RingBuffer<number>(3);
    buffer.push(1);
    buffer.push(2);
    buffer.push(3);
    buffer.push(4);
    buffer.push(5);
    buffer.push(6);

    expect(buffer.getAll()).toEqual([4, 5, 6]);
    expect(buffer.count).toBe(3);
  });

  it('returns empty array when empty', () => {
    const buffer = new RingBuffer<number>(3);
    expect(buffer.getAll()).toEqual([]);
    expect(buffer.count).toBe(0);
    expect(buffer.isEmpty).toBe(true);
  });

  it('correctly tracks isEmpty', () => {
    const buffer = new RingBuffer<number>(3);
    expect(buffer.isEmpty).toBe(true);

    buffer.push(1);
    expect(buffer.isEmpty).toBe(false);

    buffer.push(2);
    buffer.push(3);
    buffer.push(4);
    expect(buffer.isEmpty).toBe(false);
  });
});

describe('Latency Tracking', () => {
  beforeEach(() => {
    // Reset tracking before each test
    resetLatencyTracking();
  });

  it('initializes buffers with specified capacity', () => {
    initLatencyTracking(50);

    const stats = getLatencyStats();
    // Implicit test: if this doesn't crash, initialization succeeded
    expect(stats).toBeDefined();
  });

  it('records E2E latency samples', () => {
    initLatencyTracking(5);

    const stateSinceAt = 1000;
    const eventReceivedAt = 1500;
    const canvasRenderedAt = 1700;

    recordE2ELatency(stateSinceAt, eventReceivedAt, canvasRenderedAt);

    const stats = getLatencyStats();
    expect(stats.e2eSampleCount).toBe(1);
    expect(stats.avgE2ELatencyMs).toBe(700); // 1700 - 1000
  });

  it('records canvas latency samples', () => {
    initLatencyTracking(5);

    const storeUpdateAt = 2000;
    const canvasRedrawAt = 2100;

    recordCanvasLatency(storeUpdateAt, canvasRedrawAt);

    const stats = getLatencyStats();
    expect(stats.canvasSampleCount).toBe(1);
    expect(stats.avgCanvasLatencyMs).toBe(100); // 2100 - 2000
  });

  it('computes correct p95 for even number of samples', () => {
    initLatencyTracking(10);

    // Add 10 samples: [100, 150, 200, 250, 300, 350, 400, 450, 500, 550]
    for (let i = 0; i < 10; i++) {
      recordCanvasLatency(0, 100 + i * 50);
    }

    const stats = getLatencyStats();
    // Sorted: [100, 150, 200, 250, 300, 350, 400, 450, 500, 550]
    // p95 index = ceil(10 * 0.95) - 1 = 9
    // p95 = 550
    expect(stats.p95CanvasLatencyMs).toBe(550);
  });

  it('computes correct p95 for odd number of samples', () => {
    initLatencyTracking(10);

    // Add 7 samples: [100, 150, 200, 250, 300, 350, 400]
    for (let i = 0; i < 7; i++) {
      recordCanvasLatency(0, 100 + i * 50);
    }

    const stats = getLatencyStats();
    // Sorted: [100, 150, 200, 250, 300, 350, 400]
    // p95 index = ceil(7 * 0.95) - 1 = 6
    // p95 = 400
    expect(stats.p95CanvasLatencyMs).toBe(400);
  });

  it('computes correct average', () => {
    initLatencyTracking(10);

    // Add samples: [100, 200, 300] -> avg = 200
    recordCanvasLatency(0, 100);
    recordCanvasLatency(0, 200);
    recordCanvasLatency(0, 300);

    const stats = getLatencyStats();
    expect(stats.avgCanvasLatencyMs).toBe(200);
  });

  it('evicts old samples when buffer is full', () => {
    initLatencyTracking(3);

    // Fill buffer
    recordCanvasLatency(0, 100);
    recordCanvasLatency(0, 200);
    recordCanvasLatency(0, 300);

    const stats1 = getLatencyStats();
    expect(stats1.canvasSampleCount).toBe(3);

    // Add one more, evicts oldest (100)
    recordCanvasLatency(0, 400);

    const stats2 = getLatencyStats();
    expect(stats2.canvasSampleCount).toBe(3);
    expect(stats2.avgCanvasLatencyMs).toBeCloseTo(300); // (200 + 300 + 400) / 3
  });

  it('logs warning when p95 exceeds E2E NFR target', () => {
    initLatencyTracking(10);
    const consoleWarn = vi.spyOn(console, 'warn');

    // Add samples with p95 > 2000ms
    for (let i = 0; i < 10; i++) {
      recordE2ELatency(0, 100, 100 + 2100 + i * 100); // All > 2000ms
    }

    const stats = getLatencyStats();
    expect(stats.p95E2ELatencyMs).toBeGreaterThan(NFR_TARGETS.E2E_LATENCY_MS);
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('NFR-M2 VIOLATION')
    );
  });

  it('logs warning when p95 exceeds in-process NFR target', () => {
    initLatencyTracking(10);
    const consoleWarn = vi.spyOn(console, 'warn');

    // Add samples with p95 > 200ms
    for (let i = 0; i < 10; i++) {
      recordCanvasLatency(0, 250 + i * 10); // All > 200ms
    }

    const stats = getLatencyStats();
    expect(stats.p95CanvasLatencyMs).toBeGreaterThan(NFR_TARGETS.IN_PROCESS_LATENCY_MS);
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('NFR-M4.7 VIOLATION')
    );
  });

  it('does not log warning when p95 is within NFR targets', () => {
    // Reset first to clear previous test data
    resetLatencyTracking();
    initLatencyTracking(10);
    const consoleWarn = vi.spyOn(console, 'warn');
    consoleWarn.mockClear(); // Clear any setup warnings

    // Add samples with p95 < 2000ms for E2E
    for (let i = 0; i < 10; i++) {
      recordE2ELatency(0, 100, 100 + 100 + i * 50); // p95 will be 550ms, well under 2000ms
    }

    getLatencyStats();

    // Check that NFR-M2 warning wasn't logged
    const nfrM2Warnings = consoleWarn.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('NFR-M2 VIOLATION')
    );
    expect(nfrM2Warnings.length).toBe(0);
  });

  it('debounces warnings (only logs once when crossing threshold)', () => {
    initLatencyTracking(10);
    const consoleWarn = vi.spyOn(console, 'warn');

    // First batch: within target
    for (let i = 0; i < 5; i++) {
      recordCanvasLatency(0, 150); // < 200ms
    }
    getLatencyStats();

    // Clear previous test warnings
    consoleWarn.mockClear();

    // Second batch: exceeds target
    for (let i = 0; i < 5; i++) {
      recordCanvasLatency(0, 250); // > 200ms
    }
    getLatencyStats();

    // Should only log once on first violation
    const nfrWarnings = consoleWarn.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('NFR-M4.7 VIOLATION')
    );
    expect(nfrWarnings.length).toBe(1);
  });

  it('handles zero samples gracefully', () => {
    initLatencyTracking(10);

    const stats = getLatencyStats();
    expect(stats.e2eSampleCount).toBe(0);
    expect(stats.canvasSampleCount).toBe(0);
    expect(stats.avgE2ELatencyMs).toBe(0);
    expect(stats.p95E2ELatencyMs).toBe(0);
    expect(stats.avgCanvasLatencyMs).toBe(0);
    expect(stats.p95CanvasLatencyMs).toBe(0);
  });
});