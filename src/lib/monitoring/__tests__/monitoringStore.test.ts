/**
 * Tests for monitoringStore.ts
 * Covers all acceptance criteria:
 * 1. Snapshot replaces all agents
 * 2. Update applies correctly
 * 3. removeAgent drops from map
 * 4. Store is reactive and functional
 */

import { renderHook, act } from '@testing-library/react';
import { useMonitoringStore, useAgents, useAgent, useConnectionState, useRecentBark, useAgentsDisconnectedSince } from '../monitoringStore';
import { HermesAgentStatus } from '../types';

describe('monitoringStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { clear } = useMonitoringStore.getState();
    clear();
  });

  const createMockAgent = (overrides: Partial<HermesAgentStatus> = {}): HermesAgentStatus => ({
    agentId: 'test-agent',
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
    lastActivityAt: Date.now(),
    lastMessagePreview: null,
    pendingApproval: null,
    toolCallCount: 0,
    messageCount: 0,
    errorCount: 0,
    uptimeSeconds: 0,
    ...overrides,
  });

  describe('applySnapshot', () => {
    it('replaces all agents with new snapshot', () => {
      const { applySnapshot, getAllAgents } = useMonitoringStore.getState();

      // Initial state: empty
      expect(getAllAgents()).toEqual([]);

      const agent1 = createMockAgent({ agentId: 'agent-1', state: 'working' });
      const agent2 = createMockAgent({ agentId: 'agent-2', state: 'thinking' });

      act(() => {
        applySnapshot([agent1, agent2]);
      });

      const agents = getAllAgents();
      expect(agents).toHaveLength(2);
      expect(agents.find(a => a.agentId === 'agent-1')?.state).toBe('working');
      expect(agents.find(a => a.agentId === 'agent-2')?.state).toBe('thinking');
      expect(useMonitoringStore.getState().lastSnapshotAt).toBeGreaterThan(0);
    });

    it('replaces entire state on snapshot (no merge)', () => {
      const { applySnapshot, getAllAgents, getAgent } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ agentId: 'agent-1', state: 'working' });
      
      act(() => {
        applySnapshot([agent1]);
      });

      expect(getAllAgents()).toHaveLength(1);

      // Apply new snapshot with different agents only
      const agent2 = createMockAgent({ agentId: 'agent-2', state: 'idle' });
      
      act(() => {
        applySnapshot([agent2]);
      });

      const agents = getAllAgents();
      expect(agents).toHaveLength(1);
      expect(agents[0].agentId).toBe('agent-2');
      expect(getAgent('agent-1')).toBeUndefined();
    });

    it('clears agentsDisconnectedSince on snapshot', () => {
      const { applySnapshot, setConnectionState } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ agentId: 'agent-1' });
      
      act(() => {
        applySnapshot([agent1]);
        setConnectionState('disconnected');
      });

      expect(useMonitoringStore.getState().agentsDisconnectedSince.has('agent-1')).toBe(true);

      // New snapshot should clear the disconnected set
      const agent2 = createMockAgent({ agentId: 'agent-2' });
      
      act(() => {
        applySnapshot([agent2]);
      });

      expect(useMonitoringStore.getState().agentsDisconnectedSince.size).toBe(0);
    });
  });

  describe('applyAgentUpdate', () => {
    it('applies single agent update correctly', () => {
      const { applySnapshot, applyAgentUpdate, getAgent } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ agentId: 'agent-1', state: 'idle' });
      const agent2 = createMockAgent({ agentId: 'agent-2', state: 'thinking' });

      act(() => {
        applySnapshot([agent1, agent2]);
      });

      expect(getAgent('agent-1')?.state).toBe('idle');

      // Update agent-1 state
      const updatedAgent1 = createMockAgent({ agentId: 'agent-1', state: 'working' });
      
      act(() => {
        applyAgentUpdate(updatedAgent1);
      });

      expect(getAgent('agent-1')?.state).toBe('working');
      // agent-2 should be unchanged
      expect(getAgent('agent-2')?.state).toBe('thinking');
    });

    it('full object replacement (no merge)', () => {
      const { applySnapshot, applyAgentUpdate, getAgent } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ 
        agentId: 'agent-1', 
        state: 'working',
        currentTool: 'write_file',
        toolCallCount: 5,
      });

      act(() => {
        applySnapshot([agent1]);
      });

      // Update with only some fields
      const partialUpdate = createMockAgent({ 
        agentId: 'agent-1', 
        state: 'thinking',
        // currentTool and toolCallCount not included
      });

      act(() => {
        applyAgentUpdate(partialUpdate);
      });

      const updatedAgent = getAgent('agent-1');
      expect(updatedAgent?.state).toBe('thinking');
      // These should NOT be merged - they're missing from the new object
      expect(updatedAgent?.currentTool).toBeNull();
      expect(updatedAgent?.toolCallCount).toBe(0);
    });

    it('removes agent from agentsDisconnectedSince on update', () => {
      const { applySnapshot, applyAgentUpdate, setConnectionState } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ agentId: 'agent-1' });
      
      act(() => {
        applySnapshot([agent1]);
        setConnectionState('disconnected'); // Marks all agents
      });

      expect(useMonitoringStore.getState().agentsDisconnectedSince.has('agent-1')).toBe(true);

      // Agent update should remove from disconnected set
      const updatedAgent1 = createMockAgent({ agentId: 'agent-1', state: 'working' });
      
      act(() => {
        applyAgentUpdate(updatedAgent1);
      });

      expect(useMonitoringStore.getState().agentsDisconnectedSince.has('agent-1')).toBe(false);
    });
  });

  describe('removeAgent', () => {
    it('removes agent from map', () => {
      const { applySnapshot, removeAgent, getAllAgents, getAgent } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ agentId: 'agent-1' });
      const agent2 = createMockAgent({ agentId: 'agent-2' });

      act(() => {
        applySnapshot([agent1, agent2]);
      });

      expect(getAllAgents()).toHaveLength(2);

      act(() => {
        removeAgent('agent-1');
      });

      expect(getAllAgents()).toHaveLength(1);
      expect(getAgent('agent-1')).toBeUndefined();
      expect(getAgent('agent-2')).toBeDefined();
    });

    it('handles removing non-existent agent gracefully', () => {
      const { applySnapshot, removeAgent, getAllAgents } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ agentId: 'agent-1' });

      act(() => {
        applySnapshot([agent1]);
      });

      // Should not throw
      act(() => {
        removeAgent('non-existent');
      });

      expect(getAllAgents()).toHaveLength(1);
    });
  });

  describe('applyBark', () => {
    it('sets recentBark correctly', () => {
      const { applyBark } = useMonitoringStore.getState();

      expect(useMonitoringStore.getState().recentBark).toBeNull();

      act(() => {
        applyBark('hermes', 'frontend-dev', 'DO THE WORK', Date.now());
      });

      expect(useMonitoringStore.getState().recentBark).toEqual({
        fromAgentId: 'hermes',
        toAgentId: 'frontend-dev',
        message: 'DO THE WORK',
        at: expect.any(Number),
      });
    });

    it('replaces existing bark with new one', () => {
      const { applyBark } = useMonitoringStore.getState();

      act(() => {
        applyBark('hermes', 'frontend-dev', 'FIRST BARK', Date.now());
      });

      expect(useMonitoringStore.getState().recentBark?.message).toBe('FIRST BARK');

      act(() => {
        applyBark('hermes', 'backend-dev', 'SECOND BARK', Date.now());
      });

      expect(useMonitoringStore.getState().recentBark?.message).toBe('SECOND BARK');
      expect(useMonitoringStore.getState().recentBark?.toAgentId).toBe('backend-dev');
    });
  });

  describe('setConnectionState', () => {
    it('updates connection state', () => {
      const { setConnectionState } = useMonitoringStore.getState();

      expect(useMonitoringStore.getState().connectionState).toBe('disconnected');

      act(() => {
        setConnectionState('connecting');
      });

      expect(useMonitoringStore.getState().connectionState).toBe('connecting');
    });

    it('marks all agents as disconnected on state change to disconnected', () => {
      const { applySnapshot, setConnectionState } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ agentId: 'agent-1' });
      const agent2 = createMockAgent({ agentId: 'agent-2' });

      act(() => {
        applySnapshot([agent1, agent2]);
      });

      expect(useMonitoringStore.getState().agentsDisconnectedSince.size).toBe(0);

      act(() => {
        setConnectionState('disconnected');
      });

      expect(useMonitoringStore.getState().agentsDisconnectedSince.has('agent-1')).toBe(true);
      expect(useMonitoringStore.getState().agentsDisconnectedSince.has('agent-2')).toBe(true);
    });

    it('marks all agents as disconnected on error state', () => {
      const { applySnapshot, setConnectionState } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ agentId: 'agent-1' });

      act(() => {
        applySnapshot([agent1]);
      });

      act(() => {
        setConnectionState('error');
      });

      expect(useMonitoringStore.getState().agentsDisconnectedSince.has('agent-1')).toBe(true);
    });
  });

  describe('updateHeartbeat', () => {
    it('updates lastHeartbeatAt timestamp', () => {
      const { updateHeartbeat } = useMonitoringStore.getState();

      expect(useMonitoringStore.getState().lastHeartbeatAt).toBeNull();

      act(() => {
        updateHeartbeat();
      });

      expect(useMonitoringStore.getState().lastHeartbeatAt).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('resets all state to initial values', () => {
      const { applySnapshot, setConnectionState, updateHeartbeat, applyBark, clear, getAllAgents } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ agentId: 'agent-1' });

      act(() => {
        applySnapshot([agent1]);
        setConnectionState('connected');
        updateHeartbeat();
        applyBark('hermes', 'agent-1', 'bark', Date.now());
      });

      expect(getAllAgents()).toHaveLength(1);
      expect(useMonitoringStore.getState().connectionState).toBe('connected');
      expect(useMonitoringStore.getState().lastHeartbeatAt).toBeGreaterThan(0);
      expect(useMonitoringStore.getState().recentBark).not.toBeNull();

      act(() => {
        clear();
      });

      expect(getAllAgents()).toEqual([]);
      expect(useMonitoringStore.getState().connectionState).toBe('disconnected');
      expect(useMonitoringStore.getState().lastSnapshotAt).toBeNull();
      expect(useMonitoringStore.getState().lastHeartbeatAt).toBeNull();
      expect(useMonitoringStore.getState().recentBark).toBeNull();
      expect(useMonitoringStore.getState().agentsDisconnectedSince.size).toBe(0);
    });
  });

  describe('getSubAgents', () => {
    it('returns sub-agents for a parent', () => {
      const { applySnapshot, getSubAgents } = useMonitoringStore.getState();

      const parent = createMockAgent({ 
        agentId: 'parent',
        parentSessionId: null,
        parentAgentId: null,
      });
      const child1 = createMockAgent({ 
        agentId: 'child-1',
        parentSessionId: 'session-1',
        parentAgentId: 'parent',
      });
      const child2 = createMockAgent({ 
        agentId: 'child-2',
        parentSessionId: 'session-2',
        parentAgentId: 'parent',
      });
      const other = createMockAgent({ 
        agentId: 'other',
        parentSessionId: null,
        parentAgentId: null,
      });

      act(() => {
        applySnapshot([parent, child1, child2, other]);
      });

      const subAgents = getSubAgents('parent');
      expect(subAgents).toHaveLength(2);
      expect(subAgents.map(a => a.agentId)).toEqual(['child-1', 'child-2']);
    });

    it('returns empty array for parent with no sub-agents', () => {
      const { applySnapshot, getSubAgents } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ agentId: 'agent-1' });

      act(() => {
        applySnapshot([agent1]);
      });

      const subAgents = getSubAgents('agent-1');
      expect(subAgents).toEqual([]);
    });
  });

  describe('Store reactivity with selector hooks', () => {
    it('useAgents returns agents and count', () => {
      const agent1 = createMockAgent({ agentId: 'agent-1', state: 'working' });
      const agent2 = createMockAgent({ agentId: 'agent-2', state: 'thinking' });

      act(() => {
        useMonitoringStore.getState().applySnapshot([agent1, agent2]);
      });

      const { result } = renderHook(() => useAgents());
      expect(result.current.agents).toHaveLength(2);
      expect(result.current.count).toBe(2);
    });

    it('useAgent returns specific agent', () => {
      const agent1 = createMockAgent({ agentId: 'agent-1', state: 'idle' });
      const agent2 = createMockAgent({ agentId: 'agent-2', state: 'thinking' });

      act(() => {
        useMonitoringStore.getState().applySnapshot([agent1, agent2]);
      });

      const { result } = renderHook(() => useAgent('agent-1'));
      expect(result.current?.state).toBe('idle');

      // Update the same agent
      const updatedAgent1 = createMockAgent({ agentId: 'agent-1', state: 'working' });
      act(() => {
        useMonitoringStore.getState().applyAgentUpdate(updatedAgent1);
      });

      expect(result.current?.state).toBe('working');
    });

    it('useConnectionState returns connection state', () => {
      const { result } = renderHook(() => useConnectionState());
      expect(result.current).toBe('disconnected');

      act(() => {
        useMonitoringStore.getState().setConnectionState('connecting');
      });

      expect(result.current).toBe('connecting');
    });

    it('useRecentBark returns bark data', () => {
      const { result } = renderHook(() => useRecentBark());
      expect(result.current).toBeNull();

      act(() => {
        useMonitoringStore.getState().applyBark('hermes', 'agent-1', 'bark', Date.now());
      });

      expect(result.current?.message).toBe('bark');
    });

    it('useAgentsDisconnectedSince returns array of agent IDs', () => {
      const agent1 = createMockAgent({ agentId: 'agent-1' });
      const agent2 = createMockAgent({ agentId: 'agent-2' });

      act(() => {
        useMonitoringStore.getState().applySnapshot([agent1, agent2]);
      });

      const { result } = renderHook(() => useAgentsDisconnectedSince());
      expect(result.current).toEqual([]);

      act(() => {
        useMonitoringStore.getState().setConnectionState('disconnected');
      });

      expect(result.current).toEqual(['agent-1', 'agent-2']);
    });
  });

  describe('Multiple concurrent updates', () => {
    it('handles multiple updates correctly', () => {
      const { applySnapshot, applyAgentUpdate, getAgent } = useMonitoringStore.getState();

      const agent1 = createMockAgent({ agentId: 'agent-1', state: 'idle' });
      const agent2 = createMockAgent({ agentId: 'agent-2', state: 'idle' });
      const agent3 = createMockAgent({ agentId: 'agent-3', state: 'idle' });

      act(() => {
        applySnapshot([agent1, agent2, agent3]);
      });

      // Update all three in sequence
      const updated1 = createMockAgent({ agentId: 'agent-1', state: 'thinking' });
      const updated2 = createMockAgent({ agentId: 'agent-2', state: 'working' });
      const updated3 = createMockAgent({ agentId: 'agent-3', state: 'waiting' });

      act(() => {
        applyAgentUpdate(updated1);
        applyAgentUpdate(updated2);
        applyAgentUpdate(updated3);
      });

      expect(getAgent('agent-1')?.state).toBe('thinking');
      expect(getAgent('agent-2')?.state).toBe('working');
      expect(getAgent('agent-3')?.state).toBe('waiting');
    });
  });
});