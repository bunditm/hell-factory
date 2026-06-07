/**
 * Monitoring types for SSE communication with Hermes plugin
 * See docs/06-monitoring-requirements.md §Data Model
 */

export interface HermesAgentStatus {
  // Identity
  agentId: string                // e.g. "frontend-dev"
  profile: string                // e.g. "default" | "frontend-dev"
  sessionId: string | null       // current session, null if no active session
  parentSessionId: string | null // non-null = this is a sub-agent
  parentAgentId: string | null   // convenience: parent agent's agentId

  // State
  state: 'idle' | 'thinking' | 'working' | 'waiting' | 'error' | 'error_critical' | 'bark'
  previousState: HermesAgentStatus['state'] | null
  stateSinceAt: number           // when current state started (unix ms)
  severity: 'minor' | 'critical' | null  // only for error states

  // Activity
  currentTask: string | null     // latest user/assistant task description (truncated 200 chars)
  currentTool: string | null     // active tool name, e.g. "write_file"
  currentToolTarget: string | null // optional: file path / command / etc.
  lastActivityAt: number         // unix ms of last detected activity
  lastMessagePreview: string | null // first 100 chars of last assistant message

  // Approval request data (v2.1)
  pendingApproval: {
    question: string
    options: string[] | null
    requestedAt: number
  } | null

  // Metrics
  toolCallCount: number          // total tool calls in current session
  messageCount: number
  errorCount: number             // errors in current session
  uptimeSeconds: number          // since plugin started tracking this agent
}

// SSE event types (see docs/06-monitoring-requirements.md §SSE event types)
export interface SseStateSnapshotEvent {
  type: 'state_snapshot'
  data: {
    agents: HermesAgentStatus[]
    emittedAt: number
  }
}

export interface SseAgentUpdateEvent {
  type: 'agent_update'
  data: HermesAgentStatus
}

export interface SseAgentRemovedEvent {
  type: 'agent_removed'
  data: {
    agentId: string
  }
}

export interface SseBarkEvent {
  type: 'bark'
  data: {
    fromAgentId: string
    toAgentId: string
    message: string
    at: number
  }
}

export interface SseHeartbeatEvent {
  type: 'heartbeat'
  data: {
    at: number
    connectedClients: number
  }
}

export type SseEvent = 
  | SseStateSnapshotEvent 
  | SseAgentUpdateEvent 
  | SseAgentRemovedEvent 
  | SseBarkEvent 
  | SseHeartbeatEvent

// Connection states for the SSE client
export type ConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'error'

// SSE status exposed via useSseStatus() hook
export interface SseStatus {
  connectionState: ConnectionState
  lastHeartbeatAt: number | null
  reconnectAttempts: number
  error: Error | null
}