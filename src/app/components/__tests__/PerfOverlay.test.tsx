/**
 * Tests for PerfOverlay component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PerfOverlay from './PerfOverlay';

// Mock useLatencyStats
vi.mock('../../lib/monitoring/useLatencyStats', () => ({
  useLatencyStats: vi.fn(),
}));

// Mock NFR_TARGETS
vi.mock('../../lib/monitoring/latencyTracking', () => ({
  NFR_TARGETS: {
    E2E_LATENCY_MS: 2000,
    IN_PROCESS_LATENCY_MS: 200,
  },
}));

describe('PerfOverlay', () => {
  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        search: '?dev=1',
      },
      writable: true,
    });
  });

  it('renders null when dev mode is disabled', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
      },
      writable: true,
    });

    const { container } = render(<PerfOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null when dev mode is set to 0', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?dev=0',
      },
      writable: true,
    });

    const { container } = render(<PerfOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('shows initializing message when stats are null', () => {
    vi.mocked(useLatencyStats).mockReturnValue(null);

    render(<PerfOverlay />);
    expect(screen.getByText('Initializing latency tracking...')).toBeInTheDocument();
  });

  it('renders latency stats when available', () => {
    const mockStats = {
      avgE2ELatencyMs: 1500,
      p95E2ELatencyMs: 1800,
      avgCanvasLatencyMs: 100,
      p95CanvasLatencyMs: 150,
      e2eSampleCount: 42,
      canvasSampleCount: 38,
    };

    vi.mocked(useLatencyStats).mockReturnValue(mockStats);

    render(<PerfOverlay />);

    expect(screen.getByText('☠  Latency Stats  ☠')).toBeInTheDocument();
    expect(screen.getByText(/avg: 1500ms/)).toBeInTheDocument();
    expect(screen.getByText(/p95: 1800ms/)).toBeInTheDocument();
    expect(screen.getByText(/avg: 100ms/)).toBeInTheDocument();
    expect(screen.getByText(/p95: 150ms/)).toBeInTheDocument();
    expect(screen.getByText(/Samples: E2E=42, Canvas=38/)).toBeInTheDocument();
  });

  it('shows red text for NFR violations', () => {
    const mockStats = {
      avgE2ELatencyMs: 1500,
      p95E2ELatencyMs: 2500, // Over 2000ms limit
      avgCanvasLatencyMs: 100,
      p95CanvasLatencyMs: 300, // Over 200ms limit
      e2eSampleCount: 10,
      canvasSampleCount: 10,
    };

    vi.mocked(useLatencyStats).mockReturnValue(mockStats);

    render(<PerfOverlay />);

    // Check for red text spans (NFR violations)
    const redTextElements = screen.getAllByText('2500ms');
    expect(redTextElements.length).toBeGreaterThan(0);

    const redCanvasElements = screen.getAllByText('300ms');
    expect(redCanvasElements.length).toBeGreaterThan(0);
  });
});