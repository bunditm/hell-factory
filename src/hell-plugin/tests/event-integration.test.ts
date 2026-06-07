import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentStateAggregator, HermesEvent, AgentState } from '../src/state.js';

describe('AgentStateAggregator Event Bus Integration (T06)', () => {
  let aggregator: AgentStateAggregator;
  let mockEventBus: any;

  beforeEach(() => {
    // Create a temporary directory for test Hermes home
    const tempDir = `/tmp/hermes-test-${Date.now()}`;
    aggregator = new AgentStateAggregator(tempDir);

    // Mock event bus
    mockEventBus = {
      subscribe: vi.fn((eventType: string, handler: (event: HermesEvent) => void) => {
        // Store the handler for testing
        (mockEventBus as any)[`${eventType}Handler`] = handler;
        return () => {}; // Mock unsubscribe
      }),
    };
  });

  afterEach(() => {
    if (aggregator) {
      aggregator.disconnectEventBus();
    }
  });

  describe('Event bus connection', () => {
    it('should connect to event bus and subscribe to all 4 event types', () => {
      aggregator.connectEventBus(mockEventBus);

      expect(mockEventBus.subscribe).toHaveBeenCalledWith('state_change', expect.any(Function));
      expect(mockEventBus.subscribe).toHaveBeenCalledWith('approval_request', expect.any(Function));
      expect(mockEventBus.subscribe).toHaveBeenCalledWith('sub_agent_spawned', expect.any(Function));
      expect(mockEventBus.subscribe).toHaveBeenCalledWith('sub_agent_completed', expect.any(Function));

      const status = aggregator.getEventBusStatus();
      expect(status.connected).toBe(true);
      expect(status.degraded).toBe(false);
    });

    it('should handle null event bus gracefully', () => {
      aggregator.connectEventBus(null);

      const status = aggregator.getEventBusStatus();
      expect(status.connected).toBe(false);
      // Grace period means not degraded initially
      expect(status.degraded).toBe(false);
    });

    it('should mark event bus as degraded after 10s disconnect', () => {
      aggregator.connectEventBus(mockEventBus);

      // Manually simulate disconnection
      (aggregator as any).eventBusConnected = false;
      (aggregator as any).eventBusDisconnectedSince = Date.now() - 11000; // 11s ago

      const status = aggregator.getEventBusStatus();
      expect(status.connected).toBe(false);
      expect(status.degraded).toBe(true);
    });

    it('should disconnect cleanly', () => {
      aggregator.connectEventBus(mockEventBus);
      aggregator.disconnectEventBus();

      const status = aggregator.getEventBusStatus();
      expect(status.connected).toBe(false);
    });
  });

  describe('approval_request event handling', () => {
    it('should set pendingApproval and transition to waiting immediately', () => {
      aggregator.connectEventBus(mockEventBus);

      const event: HermesEvent = {
        agentId: 'devops',
        sessionId: 'session-789',
        parentSessionId: null,
        eventType: 'approval_request',
        timestamp: Date.now(),
        data: {
          question: 'Deploy to production?',
          options: ['Yes', 'No'],
          requestedAt: Date.now(),
        },
      };

      // Emit event
      const handler = (mockEventBus as any).approval_requestHandler;
      if (handler) {
        handler(event);
      }

      // Should transition immediately (no tick needed)
      const status = aggregator.getStatus('devops');
      expect(status).not.toBeNull();
      expect(status?.state).toBe('waiting');
      expect(status?.pendingApproval).toEqual({
        question: 'Deploy to production?',
        options: ['Yes', 'No'],
        requestedAt: event.data.requestedAt,
      });
      expect(status?.previousState).toBe('idle'); // Was idle before
    });

    it('should handle approval_request without options', () => {
      aggregator.connectEventBus(mockEventBus);

      const event: HermesEvent = {
        agentId: 'qa-engineer',
        sessionId: 'session-101',
        parentSessionId: null,
        eventType: 'approval_request',
        timestamp: Date.now(),
        data: {
          question: 'Is this test passing?',
          options: null,
          requestedAt: Date.now(),
        },
      };

      const handler = (mockEventBus as any).approval_requestHandler;
      if (handler) {
        handler(event);
      }

      const status = aggregator.getStatus('qa-engineer');
      expect(status?.state).toBe('waiting');
      expect(status?.pendingApproval?.options).toBeNull();
    });
  });

  describe('sub_agent_spawned event handling', () => {
    it('should add new sub-agent with parent links', () => {
      aggregator.connectEventBus(mockEventBus);

      const event: HermesEvent = {
        agentId: 'hermes',
        sessionId: 'session-parent-1',
        parentSessionId: null,
        eventType: 'sub_agent_spawned',
        timestamp: Date.now(),
        data: {
          childSessionId: 'session-child-1',
          profile: 'backend-dev',
        },
      };

      const handler = (mockEventBus as any).sub_agent_spawnedHandler;
      if (handler) {
        handler(event);
      }

      const childStatus = aggregator.getStatus('session-child-1');
      expect(childStatus).not.toBeNull();
      expect(childStatus?.agentId).toBe('session-child-1');
      expect(childStatus?.profile).toBe('backend-dev');
      expect(childStatus?.parentSessionId).toBe('session-parent-1');
      expect(childStatus?.parentAgentId).toBe('hermes');
      expect(childStatus?.state).toBe('working'); // Sub-agents start in working state
      expect(childStatus?.sessionId).toBe('session-child-1');
    });
  });

  describe('Integration with existing T03 tests', () => {
    it('should not regress T03 tick() behavior', () => {
      aggregator.connectEventBus(mockEventBus);

      // Tick should work without event bus
      expect(() => aggregator.tick()).not.toThrow();

      // Multiple ticks should work
      for (let i = 0; i < 10; i++) {
        aggregator.tick();
      }

      // Should track main profiles
      const allStatuses = aggregator.getAllStatuses();
      expect(allStatuses.length).toBeGreaterThan(0);
    });

    it('should maintain T03 error handling (tick() never throws)', () => {
      aggregator.connectEventBus(mockEventBus);

      // Even with malformed events, tick should never throw
      const handler = (mockEventBus as any).state_changeHandler;
      if (handler) {
        handler({} as HermesEvent); // Completely malformed
      }

      expect(() => aggregator.tick()).not.toThrow();
    });
  });

  describe('Event-driven vs polling fallback', () => {
    it('should work correctly when event bus is unavailable', () => {
      // Don't connect event bus
      const status = aggregator.getEventBusStatus();
      expect(status.connected).toBe(false);

      // Tick should still work with polling fallback
      expect(() => aggregator.tick()).not.toThrow();

      // Should still track agents (via polling)
      aggregator.tick();
      const allStatuses = aggregator.getAllStatuses();
      expect(allStatuses.length).toBeGreaterThan(0);
    });
  });
});