/**
 * SSE Client for Hermes monitoring
 * Connects to http://127.0.0.1:3002/events and applies events to Zustand store
 * Implements exponential backoff reconnection
 */

import { useMonitoringStore } from './monitoringStore';
import { recordE2ELatency } from './latencyTracking';
import type {
  SseEvent,
  SseStateSnapshotEvent,
  SseAgentUpdateEvent,
  SseAgentRemovedEvent,
  SseBarkEvent,
  SseHeartbeatEvent,
  ConnectionState,
  SseStatus,
} from './types';

const SSE_URL = 'http://127.0.0.1:3002/events';

// Backoff configuration
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const MAX_RETRY_ATTEMPTS = 10; // Stop retrying after 10 consecutive failures

class SseClient {
  private eventSource: any | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private lastHeartbeatAt: number | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private error: Error | null = null;
  private statusListeners: Set<(status: SseStatus) => void> = new Set();
  private store = useMonitoringStore.getState();

  constructor() {
    this.startConnecting();
  }

  // Start connecting to SSE endpoint
  private startConnecting(): void {
    this.connectionState = 'connecting';
    this.notifyStatus();

    try {
      // Use native EventSource (or mocked EventSource in tests)
      const EventSourceCtor = (global as any).EventSource;
      this.eventSource = new EventSourceCtor(SSE_URL);

      this.eventSource.onopen = () => this.handleOpen();
    this.eventSource.onerror = (err: Event) => this.handleError(err);
      this.eventSource.addEventListener('state_snapshot', (e: MessageEvent) =>
        this.handleStateSnapshot(e)
      );
      this.eventSource.addEventListener('agent_update', (e: MessageEvent) =>
        this.handleAgentUpdate(e)
      );
      this.eventSource.addEventListener('agent_removed', (e: MessageEvent) =>
        this.handleAgentRemoved(e)
      );
      this.eventSource.addEventListener('bark', (e: MessageEvent) =>
        this.handleBark(e)
      );
      this.eventSource.addEventListener('heartbeat', (e: MessageEvent) =>
        this.handleHeartbeat(e)
      );
    } catch (err) {
      this.handleError(err as Error);
    }
  }

  // Handle connection open
  private handleOpen(): void {
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    this.error = null;
    this.notifyStatus();
  }

  // Handle connection error
  private handleError(err: unknown): void {
    this.connectionState = 'error';
    const errorObj = err instanceof Error ? err : new Error(String(err));
    this.error = errorObj;
    this.notifyStatus();

    this.close();

    // Stop retrying if we've hit max attempts
    if (this.reconnectAttempts >= MAX_RETRY_ATTEMPTS) {
      console.error('[SseClient] Max retry attempts reached, stopping reconnection');
      this.connectionState = 'disconnected';
      this.notifyStatus();
      return;
    }

    // Schedule reconnection with exponential backoff
    const backoffMs = Math.min(
      INITIAL_BACKOFF_MS * Math.pow(2, this.reconnectAttempts),
      MAX_BACKOFF_MS
    );

    console.warn(`[SseClient] Disconnected, reconnecting in ${backoffMs}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.connectionState = 'reconnecting';
    this.notifyStatus();

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectAttempts++;
      this.startConnecting();
    }, backoffMs);
  }

  // Handle state_snapshot event (full agent list)
  private handleStateSnapshot(event: MessageEvent): void {
    try {
      const data: SseStateSnapshotEvent['data'] = JSON.parse(event.data);
      
      // Apply full snapshot to store
      this.store.applySnapshot(data.agents);
      
      console.log(`[SseClient] Applied snapshot with ${data.agents.length} agents`);
    } catch (err) {
      console.error('[SseClient] Failed to parse state_snapshot:', err);
      // Don't throw; continue processing
    }
  }

  // Handle agent_update event (single agent change)
  private handleAgentUpdate(event: MessageEvent): void {
    try {
      const data: SseAgentUpdateEvent['data'] = JSON.parse(event.data);
      const eventReceivedAt = performance.now();

      // Check if this is a fresh state change (within 100ms)
      // We'll track when the canvas renders this change via a callback
      const isFresh = data.stateSinceAt ? Math.abs(eventReceivedAt - data.stateSinceAt) < 100 : false;

      // Apply full update to store (no merge, full object replacement)
      this.store.applyAgentUpdate(data);

      // Record E2E latency (event received now, canvas render will complete later)
      // We don't have canvas render time here, so we mark it as pending
      // The renderer will call recordE2ELatency with the canvas render time
      // For now, we just log if it's fresh for debugging
      if (isFresh && data.stateSinceAt) {
        const initialLatency = eventReceivedAt - data.stateSinceAt;
        console.debug(`[SseClient] Fresh state change for ${data.agentId}: ${initialLatency.toFixed(0)}ms`);
      }
    } catch (err) {
      console.error('[SseClient] Failed to parse agent_update:', err);
    }
  }

  // Handle agent_removed event
  private handleAgentRemoved(event: MessageEvent): void {
    try {
      const data: SseAgentRemovedEvent['data'] = JSON.parse(event.data);
      
      this.store.removeAgent(data.agentId);
    } catch (err) {
      console.error('[SseClient] Failed to parse agent_removed:', err);
    }
  }

  // Handle bark event (Hermes shouting at idle agent)
  private handleBark(event: MessageEvent): void {
    try {
      const data: SseBarkEvent['data'] = JSON.parse(event.data);
      
      this.store.applyBark(
        data.fromAgentId,
        data.toAgentId,
        data.message,
        data.at
      );
    } catch (err) {
      console.error('[SseClient] Failed to parse bark:', err);
    }
  }

  // Handle heartbeat event (liveness check)
  private handleHeartbeat(event: MessageEvent): void {
    try {
      const data: SseHeartbeatEvent['data'] = JSON.parse(event.data);
      
      this.lastHeartbeatAt = data.at;
      this.notifyStatus();
    } catch (err) {
      console.error('[SseClient] Failed to parse heartbeat:', err);
    }
  }

  // Close the SSE connection
  public close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  // Get current SSE status
  public getStatus(): SseStatus {
    return {
      connectionState: this.connectionState,
      lastHeartbeatAt: this.lastHeartbeatAt,
      reconnectAttempts: this.reconnectAttempts,
      error: this.error,
    };
  }

  // Register a listener for status changes
  public onStatusChange(callback: (status: SseStatus) => void): () => void {
    this.statusListeners.add(callback);
    // Immediately call with current status
    callback(this.getStatus());
    
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  // Notify all status listeners of current status
  private notifyStatus(): void {
    const status = this.getStatus();
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  // Manually trigger a reconnection (for user-triggered reconnect)
  public reconnect(): void {
    this.close();
    this.reconnectAttempts = 0;
    this.startConnecting();
  }
}

// Singleton instance
let sseClientInstance: SseClient | null = null;

/**
 * Get or create the singleton SSE client instance
 */
export function getSseClient(): SseClient {
  if (!sseClientInstance) {
    sseClientInstance = new SseClient();
  }
  return sseClientInstance;
}

/**
 * Close the singleton SSE client (for cleanup on unmount)
 */
export function closeSseClient(): void {
  if (sseClientInstance) {
    sseClientInstance.close();
    sseClientInstance = null;
  }
}

/**
 * React hook for SSE status
 * Returns { connectionState, lastHeartbeatAt, reconnectAttempts, error }
 */
export function useSseStatus(): SseStatus {
  const [status, setStatus] = React.useState<SseStatus>({
    connectionState: 'disconnected',
    lastHeartbeatAt: null,
    reconnectAttempts: 0,
    error: null,
  });

  React.useEffect(() => {
    const client = getSseClient();
    const unsubscribe = client.onStatusChange(setStatus);
    
    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}

// Import React at top level for the hook
import React from 'react';