/**
 * Zustand store for Hermes monitoring state
 * Applies SSE events from sseClient.ts
 *
 * See docs/06-monitoring-requirements.md §M4.6
 */

import { create } from 'zustand';
import { HermesAgentStatus, ConnectionState } from './types';

interface BarkData {
  fromAgentId: string;
  toAgentId: string;
  message: string;
  at: number;
}

interface MonitoringState {
  // Core state
  agents: Map<string, HermesAgentStatus>
  
  // Connection state
  connectionState: ConnectionState
  lastSnapshotAt: number | null
  lastHeartbeatAt: number | null
  
  // Bark state (v2b M5 display)
  recentBark: BarkData | null
  
  // Reconnect UX (FR-M4.11): agents updated since disconnect
  agentsDisconnectedSince: Set<string>
  agentsAtDisconnect: Map<string, HermesAgentStatus>  // Snapshot at disconnect
  lastDisconnectAt: number | null  // When disconnect started

  // Actions
  applySnapshot: (agents: HermesAgentStatus[]) => void
  applyAgentUpdate: (agent: HermesAgentStatus) => void
  removeAgent: (agentId: string) => void
  applyBark: (fromAgentId: string, toAgentId: string, message: string, at: number) => void
  setConnectionState: (state: ConnectionState) => void
  updateHeartbeat: () => void
  clear: () => void

  // Getters
  getAgent: (agentId: string) => HermesAgentStatus | undefined
  getAllAgents: () => HermesAgentStatus[]
  getSubAgents: (parentAgentId: string) => HermesAgentStatus[]
  getChangedSinceDisconnect: () => HermesAgentStatus[]  // FR-M4.11
}

// Auto-clear bark after 5 seconds
let barkClearTimeout: ReturnType<typeof setTimeout> | null = null;

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  // Initial state
  agents: new Map(),
  connectionState: 'disconnected',
  lastSnapshotAt: null,
  lastHeartbeatAt: null,
  recentBark: null,
  agentsDisconnectedSince: new Set(),
  agentsAtDisconnect: new Map(),
  lastDisconnectAt: null,

  applySnapshot: (agents: HermesAgentStatus[]) => {
    set({
      agents: new Map(agents.map(agent => [agent.agentId, agent])),
      lastSnapshotAt: Date.now(),
      agentsDisconnectedSince: new Set(), // Clear on fresh snapshot
      agentsAtDisconnect: new Map(), // Clear disconnect snapshot on fresh snapshot
      lastDisconnectAt: null,
    });
  },

  applyAgentUpdate: (agent: HermesAgentStatus) => {
    set((state) => {
      const newAgents = new Map(state.agents);
      const agentId = agent.agentId;
      
      // If this agent was marked as disconnected, remove that mark
      const newDisconnectedSince = new Set(state.agentsDisconnectedSince);
      if (newDisconnectedSince.has(agentId)) {
        newDisconnectedSince.delete(agentId);
      }
      
      newAgents.set(agentId, agent);
      return { 
        agents: newAgents,
        agentsDisconnectedSince: newDisconnectedSince,
      };
    });
  },

  removeAgent: (agentId: string) => {
    set((state) => {
      const newAgents = new Map(state.agents);
      newAgents.delete(agentId);
      return { agents: newAgents };
    });
  },

  applyBark: (fromAgentId: string, toAgentId: string, message: string, at: number) => {
    const barkData: BarkData = { fromAgentId, toAgentId, message, at };
    
    // Clear existing timeout if any
    if (barkClearTimeout) {
      clearTimeout(barkClearTimeout);
    }
    
    // Set new bark data
    set({ recentBark: barkData });
    
    // Auto-clear after 5 seconds
    barkClearTimeout = setTimeout(() => {
      set({ recentBark: null });
      barkClearTimeout = null;
    }, 5000);
  },

  setConnectionState: (newState: ConnectionState) => {
    set((state) => {
      const agentsDisconnectedSince = new Set(state.agentsDisconnectedSince);
      const agentsAtDisconnect = new Map(state.agentsAtDisconnect);
      let lastDisconnectAt = state.lastDisconnectAt;
      
      // If transitioning to disconnected or error, mark all agents
      if ((newState === 'disconnected' || newState === 'error') && 
          (state.connectionState === 'connected' || state.connectionState === 'connecting')) {
        // Save snapshot of current agent states at disconnect
        state.agents.forEach((agentStatus, agentId) => {
          agentsDisconnectedSince.add(agentId);
          agentsAtDisconnect.set(agentId, agentStatus);
        });
        lastDisconnectAt = Date.now();
      }
      
      // If reconnecting, clear disconnect tracking
      if (newState === 'connecting' || newState === 'connected') {
        if (lastDisconnectAt !== null) {
          // We were disconnected; we'll handle the comparison in applySnapshot
          // Don't clear yet - we need to compare in applySnapshot
        }
      }
      
      return {
        connectionState: newState,
        agentsDisconnectedSince,
        agentsAtDisconnect,
        lastDisconnectAt,
      };
    });
  },

  updateHeartbeat: () => {
    set({ lastHeartbeatAt: Date.now() });
  },

  clear: () => {
    // Clear bark timeout if active
    if (barkClearTimeout) {
      clearTimeout(barkClearTimeout);
      barkClearTimeout = null;
    }
    
    set({
      agents: new Map(),
      lastSnapshotAt: null,
      lastHeartbeatAt: null,
      recentBark: null,
      agentsDisconnectedSince: new Set(),
      agentsAtDisconnect: new Map(),
      lastDisconnectAt: null,
      connectionState: 'disconnected',
    });
  },

  getAgent: (agentId: string) => {
    return get().agents.get(agentId);
  },

  getAllAgents: () => {
    return Array.from(get().agents.values());
  },

  getSubAgents: (parentAgentId: string) => {
    return get()
      .getAllAgents()
      .filter(agent => agent.parentAgentId === parentAgentId);
  },

  getChangedSinceDisconnect: () => {
    const state = get();
    const changed: HermesAgentStatus[] = [];
    
    state.agents.forEach((currentAgent, agentId) => {
      const agentAtDisconnect = state.agentsAtDisconnect.get(agentId);
      
      // Agent changed if it didn't exist at disconnect or state differs
      if (!agentAtDisconnect || 
          agentAtDisconnect.state !== currentAgent.state ||
          agentAtDisconnect.task !== currentAgent.task) {
        changed.push(currentAgent);
      }
    });
    
    return changed;
  },
}));

// Selector hooks
export const useAgents = () => {
  const store = useMonitoringStore();
  return { agents: store.getAllAgents(), count: store.agents.size };
};

export const useAgent = (agentId: string) =>
  useMonitoringStore((state) => state.getAgent(agentId));

export const useConnectionState = () =>
  useMonitoringStore((state) => state.connectionState);

export const useRecentBark = () =>
  useMonitoringStore((state) => state.recentBark);

export const useAgentsDisconnectedSince = () => {
  const store = useMonitoringStore();
  return Array.from(store.agentsDisconnectedSince);
};