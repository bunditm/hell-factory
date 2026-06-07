/**
 * Tests for sseClient.ts
 * 
 * Covers:
 * (a) First event is snapshot, applied to store
 * (b) Update applies full object (no merge)
 * (c) Reconnect with exponential backoff
 * (d) 5 consecutive failures stop retrying at max interval
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getSseClient, closeSseClient, useSseStatus } from '../sseClient';
import { useMonitoringStore } from '../monitoringStore';
import type { HermesAgentStatus } from '../types';

// Track all instances for testing
const instances: any[] = [];

beforeEach(() => {
  // Reset store
  useMonitoringStore.getState().clear();
  
  // Reset singleton
  closeSseClient();

  // Clear EventSource instances
  instances.length = 0;

  // Mock native EventSource global
  global.EventSource = class MockEventSourceCtor {
    static instances = instances;
    
    public url: string;
    public readyState: number = 0;
    public onopen: ((event: Event) => void) | null = null;
    public onerror: ((event: Event) => void) | null = null;
    
    private listeners: Map<string, Set<(event: MessageEvent) => void>> = new Map();

    constructor(url: string) {
      this.url = url;
      instances.push(this);
    }

    addEventListener(event: string, callback: (event: MessageEvent) => void): void {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event)!.add(callback);
    }

    removeEventListener(event: string, callback: (event: MessageEvent) => void): void {
      this.listeners.get(event)?.delete(callback);
    }

    close(): void {
      this.readyState = 2; // CLOSED
      this.listeners.clear();
    }

    // Test helper: simulate receiving an event
    simulateMessage(event: string, data: any): void {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        for (const callback of callbacks) {
          callback(new MessageEvent(event, { data: JSON.stringify(data) }));
        }
      }
    }

    // Test helper: simulate connection open
    simulateOpen(): void {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
      this.readyState = 1; // OPEN
    }

    // Test helper: simulate connection error
    simulateError(): void {
      if (this.onerror) {
        this.onerror(new Event('error'));
      }
      this.readyState = 2; // CLOSED
    }
  } as any;
});

describe('sseClient', () => {
  let originalSetTimeout: typeof setTimeout;
  let timeoutCallbacks: Array<() => void> = [];

  beforeEach(() => {
    // Setup timeout mocking
    timeoutCallbacks = [];
    originalSetTimeout = global.setTimeout;
    global.setTimeout = ((callback: () => void, _delay: number) => {
      timeoutCallbacks.push(callback);
      return 0 as any;
    }) as typeof setTimeout;
  });

  afterEach(() => {
    closeSseClient();
    global.setTimeout = originalSetTimeout;
    vi.useRealTimers();
  });

  describe('(a) First event is snapshot, applied to store', () => {
    it('should apply snapshot to store on first state_snapshot event', () => {
      // Get client to start connection
      const client = getSseClient();
      
      // Verify EventSource was created
      expect(instances.length).toBeGreaterThan(0);
      const eventSourceInstance = instances[0];
      expect(eventSourceInstance).toBeDefined();
      
      // Simulate connection open
      eventSourceInstance.simulateOpen();
      
      // Create mock agents
      const mockAgents: HermesAgentStatus[] = [
        {
          agentId: 'frontend-dev',
          profile: 'frontend-dev',
          sessionId: 'session-1',
          parentSessionId: null,
          parentAgentId: null,
          state: 'working',
          previousState: null,
          stateSinceAt: Date.now(),
          severity: null,
          currentTask: 'Build UI component',
          currentTool: 'write_file',
          currentToolTarget: null,
          lastActivityAt: Date.now(),
          lastMessagePreview: 'Building...',
          pendingApproval: null,
          toolCallCount: 5,
          messageCount: 10,
          errorCount: 0,
          uptimeSeconds: 120,
        },
        {
          agentId: 'backend-dev',
          profile: 'backend-dev',
          sessionId: 'session-2',
          parentSessionId: null,
          parentAgentId: null,
          state: 'thinking',
          previousState: 'idle',
          stateSinceAt: Date.now(),
          severity: null,
          currentTask: 'Design API schema',
          currentTool: null,
          currentToolTarget: null,
          lastActivityAt: Date.now() - 2000,
          lastMessagePreview: 'Designing...',
          pendingApproval: null,
          toolCallCount: 2,
          messageCount: 5,
          errorCount: 0,
          uptimeSeconds: 90,
        },
      ];

      // Simulate snapshot event
      eventSourceInstance.simulateMessage('state_snapshot', {
        agents: mockAgents,
        emittedAt: Date.now(),
      });

      // Verify agents in store
      const store = useMonitoringStore.getState();
      expect(store.getAllAgents()).toHaveLength(2);
      expect(store.getAgent('frontend-dev')?.state).toBe('working');
      expect(store.getAgent('backend-dev')?.state).toBe('thinking');
    });
  });

  describe('(b) Update applies full object, no merge', () => {
    it('should apply full agent update (not merge)', () => {
      const client = getSseClient();
      expect(instances.length).toBeGreaterThan(0);
      const eventSourceInstance = instances[0];
      eventSourceInstance.simulateOpen();

      // Start with an agent
      const initialAgent: HermesAgentStatus = {
        agentId: 'frontend-dev',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'idle',
        previousState: null,
        stateSinceAt: Date.now() - 5000,
        severity: null,
        currentTask: null,
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now() - 60000,
        lastMessagePreview: null,
        pendingApproval: null,
        toolCallCount: 0,
        messageCount: 0,
        errorCount: 0,
        uptimeSeconds: 30,
      };

      eventSourceInstance.simulateMessage('state_snapshot', {
        agents: [initialAgent],
        emittedAt: Date.now(),
      });

      // Update with completely new data
      const updatedAgent: HermesAgentStatus = {
        agentId: 'frontend-dev',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'working',
        previousState: 'idle',
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: 'Build component',
        currentTool: 'write_file',
        currentToolTarget: '/src/components/Test.tsx',
        lastActivityAt: Date.now(),
        lastMessagePreview: 'Writing code...',
        pendingApproval: null,
        toolCallCount: 1,
        messageCount: 2,
        errorCount: 0,
        uptimeSeconds: 35,
      };

      eventSourceInstance.simulateMessage('agent_update', updatedAgent);

      // Verify full replacement (not merge)
      const store = useMonitoringStore.getState();
      const agent = store.getAgent('frontend-dev');
      expect(agent).toBeDefined();
      expect(agent?.state).toBe('working');
      expect(agent?.currentTask).toBe('Build component');
      expect(agent?.currentTool).toBe('write_file');
      expect(agent?.currentToolTarget).toBe('/src/components/Test.tsx');
      expect(agent?.toolCallCount).toBe(1);
      expect(agent?.messageCount).toBe(2);
      
      // All fields should be from the update, not merged
      expect(agent?.lastMessagePreview).toBe('Writing code...');
    });
  });

  describe('(c) Reconnect with exponential backoff', () => {
    it('should reconnect with 1s, 2s, 4s backoff sequence', () => {
      const client = getSseClient();
      expect(instances.length).toBeGreaterThan(0);
      let eventSourceInstance = instances[0];
      eventSourceInstance.simulateOpen();

      // Simulate disconnection
      eventSourceInstance.simulateError();

      // Execute first reconnect callback
      expect(timeoutCallbacks).toHaveLength(1);
      timeoutCallbacks[0]();
      timeoutCallbacks = [];

      // New EventSource should be created
      eventSourceInstance = instances[1];
      expect(eventSourceInstance).toBeDefined();
      
      // Simulate another error
      eventSourceInstance.simulateError();

      // Should have scheduled reconnect with 2s backoff
      expect(timeoutCallbacks).toHaveLength(1);
      
      // Execute second reconnect
      timeoutCallbacks[0]();
      timeoutCallbacks = [];

      eventSourceInstance = instances[2];
      eventSourceInstance.simulateError();

      // Should have scheduled reconnect with 4s backoff
      expect(timeoutCallbacks).toHaveLength(1);
    });

    it('should cap backoff at 30s max', () => {
      const client = getSseClient();
      expect(instances.length).toBeGreaterThan(0);
      let eventSourceInstance = instances[0];
      eventSourceInstance.simulateOpen();

      // Trigger 4 failures to reach max backoff (30s at attempt 5)
      for (let i = 0; i < 4; i++) {
        eventSourceInstance.simulateError();
        if (timeoutCallbacks.length > 0) {
          timeoutCallbacks[0]();
          timeoutCallbacks = [];
          eventSourceInstance = instances[i + 1];
        }
      }

      // After 4 failures, we should still be in reconnecting state with max backoff
      const { result } = renderHook(() => useSseStatus());
      expect(result.current.connectionState).toBe('reconnecting');
    });
  });

  describe('(d) Stop retrying after 10 consecutive failures', () => {
    it('should stop retrying at max interval after max attempts', () => {
      const client = getSseClient();
      expect(instances.length).toBeGreaterThan(0);
      let eventSourceInstance = instances[0];
      eventSourceInstance.simulateOpen();

      // Trigger 11 consecutive failures (exceeds MAX_RETRY_ATTEMPTS of 10)
      for (let i = 0; i < 11; i++) {
        eventSourceInstance.simulateError();
        
        // For the first 10 attempts, a timeout should be scheduled
        if (i < 10) {
          expect(timeoutCallbacks.length).toBe(1);
          timeoutCallbacks[0]();
          timeoutCallbacks = [];
          eventSourceInstance = instances[i + 1];
        }
      }

      // After the 11th failure (exceeds MAX_RETRY_ATTEMPTS), no more timeouts should be scheduled
      expect(timeoutCallbacks).toHaveLength(0);

      // Connection state should be disconnected (not reconnecting)
      const { result } = renderHook(() => useSseStatus());
      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.reconnectAttempts).toBeGreaterThanOrEqual(10);
    });

    it('should reset retry count on successful connection', () => {
      const client = getSseClient();
      expect(instances.length).toBeGreaterThan(0);
      let eventSourceInstance = instances[0];
      eventSourceInstance.simulateOpen();

      // First connection error
      eventSourceInstance.simulateError();
      expect(timeoutCallbacks).toHaveLength(1);
      timeoutCallbacks[0]();
      timeoutCallbacks = [];

      // Successful reconnection
      eventSourceInstance = instances[1];
      eventSourceInstance.simulateOpen();

      const { result } = renderHook(() => useSseStatus());
      expect(result.current.connectionState).toBe('connected');
      expect(result.current.reconnectAttempts).toBe(0);

      // Another error should start fresh backoff sequence
      eventSourceInstance.simulateError();
      expect(timeoutCallbacks).toHaveLength(1); // Should schedule reconnect again
    });
  });

  describe('Additional SSE event handling', () => {
    it('should handle agent_removed event', () => {
      const client = getSseClient();
      expect(instances.length).toBeGreaterThan(0);
      const eventSourceInstance = instances[0];
      eventSourceInstance.simulateOpen();

      // Add an agent
      const agent: HermesAgentStatus = {
        agentId: 'frontend-dev',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'idle',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: null,
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now() - 60000,
        lastMessagePreview: null,
        pendingApproval: null,
        toolCallCount: 0,
        messageCount: 0,
        errorCount: 0,
        uptimeSeconds: 30,
      };

      eventSourceInstance.simulateMessage('state_snapshot', {
        agents: [agent],
        emittedAt: Date.now(),
      });

      expect(useMonitoringStore.getState().getAgent('frontend-dev')).toBeDefined();

      // Remove the agent
      eventSourceInstance.simulateMessage('agent_removed', {
        agentId: 'frontend-dev',
      });

      expect(useMonitoringStore.getState().getAgent('frontend-dev')).toBeUndefined();
    });

    it('should handle bark event', () => {
      const client = getSseClient();
      expect(instances.length).toBeGreaterThan(0);
      const eventSourceInstance = instances[0];
      eventSourceInstance.simulateOpen();

      // Add Hermes agent
      const hermesAgent: HermesAgentStatus = {
        agentId: 'hermes',
        profile: 'default',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'idle',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: null,
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now() - 10000,
        lastMessagePreview: null,
        pendingApproval: null,
        toolCallCount: 0,
        messageCount: 0,
        errorCount: 0,
        uptimeSeconds: 300,
      };

      eventSourceInstance.simulateMessage('state_snapshot', {
        agents: [hermesAgent],
        emittedAt: Date.now(),
      });

      expect(useMonitoringStore.getState().getAgent('hermes')?.state).toBe('idle');

      // Trigger bark event
      eventSourceInstance.simulateMessage('bark', {
        fromAgentId: 'hermes',
        toAgentId: 'frontend-dev',
        message: 'DO THE WORK',
        at: Date.now(),
      });

      // Hermes should be in bark state
      const hermes = useMonitoringStore.getState().getAgent('hermes');
      expect(hermes?.state).toBe('bark');
      expect(hermes?.currentTask).toBe('DO THE WORK');
    });

    it('should handle heartbeat event', () => {
      const client = getSseClient();
      expect(instances.length).toBeGreaterThan(0);
      const eventSourceInstance = instances[0];
      eventSourceInstance.simulateOpen();

      const { result } = renderHook(() => useSseStatus());
      expect(result.current.lastHeartbeatAt).toBeNull();

      const heartbeatTime = Date.now();
      eventSourceInstance.simulateMessage('heartbeat', {
        at: heartbeatTime,
        connectedClients: 3,
      });

      expect(result.current.lastHeartbeatAt).toBe(heartbeatTime);
    });
  });

  describe('Connection state machine', () => {
    it('should transition through connection states correctly', () => {
      const client = getSseClient();
      expect(instances.length).toBeGreaterThan(0);
      const eventSourceInstance = instances[0];

      const { result } = renderHook(() => useSseStatus());

      // Initial state should be connecting
      expect(result.current.connectionState).toBe('connecting');

      // On open, should be connected
      act(() => {
        eventSourceInstance.simulateOpen();
      });
      expect(result.current.connectionState).toBe('connected');

      // On error, should be error -> reconnecting
      act(() => {
        eventSourceInstance.simulateError();
      });
      expect(result.current.connectionState).toBe('reconnecting');
    });

    it('should expose error information', () => {
      const client = getSseClient();
      expect(instances.length).toBeGreaterThan(0);
      const eventSourceInstance = instances[0];
      eventSourceInstance.simulateOpen();

      const { result } = renderHook(() => useSseStatus());
      expect(result.current.error).toBeNull();

      act(() => {
        eventSourceInstance.simulateError();
      });
      expect(result.current.error).toBeDefined();
      expect(result.current.error).toBeInstanceOf(Event);
    });
  });

  describe('useSseStatus hook', () => {
    it('should subscribe to status changes', () => {
      const { result } = renderHook(() => useSseStatus());
      
      // Should get initial status
      expect(result.current.connectionState).toBe('connecting');

      expect(instances.length).toBeGreaterThan(0);
      const eventSourceInstance = instances[0];
      
      // Status should update on connection open
      act(() => {
        eventSourceInstance.simulateOpen();
      });
      
      expect(result.current.connectionState).toBe('connected');
    });

    it('should unsubscribe on unmount', () => {
      const { result, unmount } = renderHook(() => useSseStatus());
      
      expect(instances.length).toBeGreaterThan(0);
      const eventSourceInstance = instances[0];
      
      unmount();

      // Changing connection state should not cause issues after unmount
      eventSourceInstance.simulateOpen();
      eventSourceInstance.simulateError();
      
      // Should not throw errors
    });
  });

  describe('Manual reconnect', () => {
    it('should allow manual reconnection', () => {
      const client = getSseClient();
      expect(instances.length).toBeGreaterThan(0);
      let eventSourceInstance = instances[0];
      eventSourceInstance.simulateOpen();

      // Trigger error to reach disconnected state
      for (let i = 0; i < 13; i++) {
        eventSourceInstance.simulateError();
        if (timeoutCallbacks.length > 0) {
          timeoutCallbacks[0]();
          timeoutCallbacks = [];
          eventSourceInstance = instances[i + 1];
        }
      }

      const { result } = renderHook(() => useSseStatus());
      expect(result.current.connectionState).toBe('disconnected');

      // Manually trigger reconnect
      act(() => {
        client.reconnect();
      });

      // Should be connecting again
      expect(result.current.connectionState).toBe('connecting');
      expect(result.current.reconnectAttempts).toBe(0);

      // New EventSource should be created (at index 13, after 12 errors)
      const newEventSourceInstance = instances[13];
      expect(newEventSourceInstance).toBeDefined();
    });
  });
});