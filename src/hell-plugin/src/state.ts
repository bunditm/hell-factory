import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Canonical agent states (per M3)
 */
export type AgentState =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'waiting'
  | 'error'
  | 'error_critical'
  | 'bark';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'minor' | 'critical';

/**
 * Pending approval data (FR-M6)
 */
export interface PendingApproval {
  question: string;
  options: string[] | null;
  requestedAt: number;
}

/**
 * Hermes event payload (per M0)
 */
export interface HermesEvent {
  agentId: string;
  sessionId: string;
  parentSessionId: string | null;
  eventType: 'state_change' | 'approval_request' | 'sub_agent_spawned' | 'sub_agent_completed';
  timestamp: number;
  data: {
    // state_change: { fromState: string, toState: string }
    fromState?: string;
    toState?: string;
    // approval_request: { question: string, options: string[] | null, requestedAt: number }
    question?: string;
    options?: string[] | null;
    requestedAt?: number;
    // sub_agent_spawned: { childSessionId: string, profile: string }
    childSessionId?: string;
    profile?: string;
    // sub_agent_completed: { childSessionId: string, status: string }
    status?: string;
  };
}

/**
 * HermesAgentStatus - canonical agent status object (per M3 Data Model)
 */
export interface HermesAgentStatus {
  // Identity
  agentId: string;
  profile: string;
  sessionId: string | null;
  parentSessionId: string | null;
  parentAgentId: string | null;

  // State
  state: AgentState;
  previousState: AgentState | null;
  stateSinceAt: number;
  severity: ErrorSeverity | null;

  // Activity
  currentTask: string | null;
  currentTool: string | null;
  currentToolTarget: string | null;
  lastActivityAt: number;
  lastMessagePreview: string | null;

  // Approval request data (v2.1)
  pendingApproval: PendingApproval | null;

  // Metrics
  toolCallCount: number;
  messageCount: number;
  errorCount: number;
  errorCount60s: number;  // Errors in last 60 seconds (for observability)
  severityReason: string | null;  // Reason for severity promotion (e.g., "3 errors in 60s")
  uptimeSeconds: number;
}

/**
 * State change callback type
 */
export type StateChangeCallback = (agentId: string, status: HermesAgentStatus) => void;

/**
 * Message from state.db messages table
 */
interface DbMessage {
  id: number;
  session_id: string;
  role: string;
  content: string | null;
  reasoning_content: string | null;
  tool_calls: string | null; // JSON string
  created_at: number; // unix timestamp
}

/**
 * Session from state.db sessions table
 */
interface DbSession {
  id: number;
  session_id: string;
  profile: string;
  created_at: number;
  updated_at: number;
  status: string;
}

/**
 * Parsed JSONL line
 */
interface JsonlMessage {
  role: string;
  content?: string;
  reasoning_content?: string;
  tool_calls?: any[];
  created_at?: number;
}

/**
 * AgentStateAggregator - polls Hermes state.db + JSONL and computes canonical states
 * PRIMARY: Event bus (M0)
 * FALLBACK: JSONL polling (for backfill, drift reconciliation, legacy sessions)
 */
export class AgentStateAggregator {
  private statuses: Map<string, HermesAgentStatus> = new Map();
  private hermesHome: string;
  private readonly TICK_INTERVAL_MS = 500;
  private readonly ERROR_CRITICAL_THRESHOLD = 3;
  private readonly ERROR_WINDOW_MS = 60000;
  private readonly ERROR_AUTO_CLEAR_MS = 10000;  // 10s auto-clear for error_minor
  private readonly IDLE_THRESHOLD_MS = 60000;
  private readonly RECENT_TOOL_MS = 3000;
  private subscribers: Set<StateChangeCallback> = new Set();
  private errorKeywords: Set<string> = new Set(['Error:', 'Traceback', 'panic:']);

  // Event bus integration (M0)
  private eventBus: any = null;
  private eventBusConnected: boolean = false;
  private eventBusDisconnectedSince: number | null = null;
  private eventUnsubscribers: (() => void)[] = [];
  private pendingStateChanges: Map<string, Partial<HermesAgentStatus>> = new Map();
  private subAgentsToRemove: Set<string> = new Set(); // sessionId -> removal timestamp

  constructor(hermesHome: string) {
    this.hermesHome = hermesHome;
  }

  /**
   * Connect to Hermes event bus and subscribe to events (M0)
   * Called during plugin activation
   */
  connectEventBus(eventBus: any): void {
    if (!eventBus) {
      console.warn('[AgentStateAggregator] No event bus provided - using polling fallback only');
      this.eventBusConnected = false;
      return;
    }

    this.eventBus = eventBus;
    this.eventBusConnected = true;
    this.eventBusDisconnectedSince = null;

    console.log('[AgentStateAggregator] Connecting to Hermes event bus...');

    try {
      // Subscribe to the 4 event types
      this.subscribeToEvent('state_change', (event: HermesEvent) => this.handleStateChangeEvent(event));
      this.subscribeToEvent('approval_request', (event: HermesEvent) => this.handleApprovalRequestEvent(event));
      this.subscribeToEvent('sub_agent_spawned', (event: HermesEvent) => this.handleSubAgentSpawnedEvent(event));
      this.subscribeToEvent('sub_agent_completed', (event: HermesEvent) => this.handleSubAgentCompletedEvent(event));

      console.log('[AgentStateAggregator] Event bus connected successfully');
    } catch (error) {
      console.error('[AgentStateAggregator] Failed to connect to event bus:', error);
      this.eventBusConnected = false;
      this.eventBusDisconnectedSince = Date.now();
    }
  }

  /**
   * Subscribe to a specific event type
   */
  private subscribeToEvent(eventType: string, handler: (event: HermesEvent) => void): void {
    if (!this.eventBus || typeof this.eventBus.subscribe !== 'function') {
      console.warn(`[AgentStateAggregator] Event bus does not support subscription to ${eventType}`);
      return;
    }

    try {
      // Python event bus passes handler as callback
      this.eventBus.subscribe(eventType, (payload: any) => {
        try {
          handler(payload);
          this.eventBusConnected = true;
          this.eventBusDisconnectedSince = null;
        } catch (error) {
          console.error(`[AgentStateAggregator] Error handling ${eventType} event:`, error);
        }
      });

      console.log(`[AgentStateAggregator] Subscribed to ${eventType} events`);
    } catch (error) {
      console.error(`[AgentStateAggregator] Failed to subscribe to ${eventType}:`, error);
      this.eventBusConnected = false;
      this.eventBusDisconnectedSince = Date.now();
    }
  }

  /**
   * Disconnect from event bus (called during plugin deactivation)
   */
  disconnectEventBus(): void {
    console.log('[AgentStateAggregator] Disconnecting from event bus...');

    // Unsubscribe from all events
    for (const unsubscribe of this.eventUnsubscribers) {
      try {
        unsubscribe();
      } catch (error) {
        console.error('[AgentStateAggregator] Error unsubscribing:', error);
      }
    }
    this.eventUnsubscribers = [];

    this.eventBus = null;
    this.eventBusConnected = false;
    console.log('[AgentStateAggregator] Event bus disconnected');
  }

  /**
   * Check if event bus is healthy
   * Returns true if connected OR disconnected for < 10s
   */
  isEventBusHealthy(): boolean {
    if (this.eventBusConnected) {
      return true;
    }

    if (this.eventBusDisconnectedSince === null) {
      // Never connected - consider healthy (grace period for startup)
      return true;
    }

    // Allow 10s grace period before marking unhealthy
    const disconnectedDuration = Date.now() - this.eventBusDisconnectedSince;
    return disconnectedDuration < 10000;
  }

  /**
   * Get event bus connection status for health endpoint
   */
  getEventBusStatus(): { connected: boolean; degraded: boolean } {
    const healthy = this.isEventBusHealthy();
    return {
      connected: this.eventBusConnected,
      degraded: !healthy,
    };
  }

  /**
   * Handle state_change event (M0)
   */
  private handleStateChangeEvent(event: HermesEvent): void {
    const { agentId, sessionId, data } = event;
    const toState = data.toState;

    if (!toState) {
      console.warn('[AgentStateAggregator] state_change event missing toState', event);
      return;
    }

    console.log(`[AgentStateAggregator] state_change: ${agentId} -> ${toState}`);

    // Mark agent for immediate state update on next tick
    const pending = this.pendingStateChanges.get(agentId) || {};
    pending.state = toState as AgentState;
    pending.sessionId = sessionId;
    this.pendingStateChanges.set(agentId, pending);
  }

  /**
   * Handle approval_request event (M0)
   * Sets pendingApproval and transitions to waiting immediately
   */
  private handleApprovalRequestEvent(event: HermesEvent): void {
    const { agentId, sessionId, data } = event;
    const { question, options, requestedAt } = data;

    if (!question) {
      console.warn('[AgentStateAggregator] approval_request event missing question', event);
      return;
    }

    console.log(`[AgentStateAggregator] approval_request: ${agentId}`);

    // Get or create agent status
    let status = this.statuses.get(agentId);
    if (!status) {
      status = this.initializeStatus(agentId, agentId, Date.now());
      this.statuses.set(agentId, status);
    }

    // Set pending approval data
    status.pendingApproval = {
      question,
      options: options || null,
      requestedAt: requestedAt || Date.now(),
    };

    // Transition to waiting immediately (don't wait for next tick)
    status.previousState = status.state;
    status.state = 'waiting';
    status.stateSinceAt = Date.now();
    status.sessionId = sessionId;

    // Notify subscribers of this immediate change
    this.notifySubscribers(agentId, status);
  }

  /**
   * Handle sub_agent_spawned event (M0)
   * Adds new sub-agent with parent links
   */
  private handleSubAgentSpawnedEvent(event: HermesEvent): void {
    const { agentId, sessionId, data } = event;
    const { childSessionId, profile } = data;

    if (!childSessionId || !profile) {
      console.warn('[AgentStateAggregator] sub_agent_spawned event missing childSessionId or profile', event);
      return;
    }

    console.log(`[AgentStateAggregator] sub_agent_spawned: ${profile} (${childSessionId}) parent=${agentId}`);

    // Create new sub-agent status
    const childStatus = this.initializeStatus(childSessionId, profile, Date.now());
    childStatus.parentSessionId = sessionId;
    childStatus.parentAgentId = agentId;
    childStatus.sessionId = childSessionId;
    childStatus.state = 'working'; // Sub-agents start in working state
    childStatus.stateSinceAt = Date.now();

    // Add to tracked agents
    this.statuses.set(childSessionId, childStatus);

    // Remove from removal queue if it was there (re-spawned)
    this.subAgentsToRemove.delete(childSessionId);

    // Notify subscribers
    this.notifySubscribers(childSessionId, childStatus);
  }

  /**
   * Handle sub_agent_completed event (M0)
   * Schedules removal of sub-agent on next tick (1s cleanup grace per FR-M2.7)
   */
  private handleSubAgentCompletedEvent(event: HermesEvent): void {
    const { data } = event;
    const { childSessionId } = data;

    if (!childSessionId) {
      console.warn('[AgentStateAggregator] sub_agent_completed event missing childSessionId', event);
      return;
    }

    console.log(`[AgentStateAggregator] sub_agent_completed: ${childSessionId}`);

    // Schedule removal in the next tick (applies 1s grace period)
    this.subAgentsToRemove.add(childSessionId);
  }

  /**
   * Main tick function - called by poller every ~500ms
   * Updates all agent statuses from events (primary) + state.db + JSONL (fallback)
   */
  tick(): void {
    const now = Date.now();

    try {
      // Step 1: Process sub-agent removals (1s grace period per FR-M2.7)
      this.processSubAgentRemovals(now);

      // Step 2: Apply pending event-driven state changes
      this.applyPendingStateChanges(now);

      // Step 3: Get list of tracked agent profiles
      const profiles = this.getTrackedProfiles();

      for (const profile of profiles) {
        this.updateAgentStatus(profile, now);
      }

      // Step 4: Check event bus health
      if (!this.isEventBusHealthy()) {
        console.warn('[AgentStateAggregator] Event bus disconnected for >10s, status degraded');
      }
    } catch (error) {
      // Never throw out of tick() - log and continue
      console.error('[AgentStateAggregator] Tick error:', error);
    }
  }

  /**
   * Process sub-agent removals (1s grace period)
   */
  private processSubAgentRemovals(now: number): void {
    for (const childSessionId of this.subAgentsToRemove) {
      const status = this.statuses.get(childSessionId);
      if (!status) {
        this.subAgentsToRemove.delete(childSessionId);
        continue;
      }

      // Check if 1s has passed since last activity
      const timeSinceActivity = now - status.lastActivityAt;
      if (timeSinceActivity > 1000) {
        console.log(`[AgentStateAggregator] Removing sub-agent: ${childSessionId}`);
        this.statuses.delete(childSessionId);
        this.subAgentsToRemove.delete(childSessionId);

        // Emit agent_removed event (will be handled by SSE layer)
        // For now, just remove from tracked set
      }
    }
  }

  /**
   * Apply pending event-driven state changes before polling
   */
  private applyPendingStateChanges(now: number): void {
    for (const [agentId, pending] of this.pendingStateChanges.entries()) {
      let status = this.statuses.get(agentId);
      if (!status) {
        // Create new status if not exists
        status = this.initializeStatus(agentId, agentId, now);
        this.statuses.set(agentId, status);
      }

      // Apply pending changes
      if (pending.state) {
        status.previousState = status.state;
        status.state = pending.state;
        status.stateSinceAt = now;
      }
      if (pending.sessionId) {
        status.sessionId = pending.sessionId;
      }

      // Mark for re-emit on this tick
      this.notifySubscribers(agentId, status);
    }

    // Clear pending changes after applying
    this.pendingStateChanges.clear();
  }

  /**
   * Get tracked agent profiles
   */
  private getTrackedProfiles(): string[] {
    // M1.4: Handle the 5 main profiles
    const mainProfiles = ['hermes', 'frontend-dev', 'backend-dev', 'devops', 'qa-engineer'];

    // Also scan ~/.hermes/profiles/ for any other profiles
    const profilesDir = path.join(this.hermesHome, 'profiles');
    if (fs.existsSync(profilesDir)) {
      try {
        const allProfiles = fs.readdirSync(profilesDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        // Return main profiles + any additional ones found
        return [...new Set([...mainProfiles, ...allProfiles])];
      } catch (error) {
        console.error('[AgentStateAggregator] Failed to scan profiles directory:', error);
      }
    }

    return mainProfiles;
  }

  /**
   * Update status for a single agent
   * Events (M0) provide instant updates, JSONL/state.db provides fallback
   */
  private updateAgentStatus(profile: string, now: number): void {
    const agentId = profile;

    let status: HermesAgentStatus;

    // Get existing status or initialize
    const existing = this.statuses.get(agentId);
    if (existing) {
      status = { ...existing };
    } else {
      status = this.initializeStatus(agentId, profile, now);
    }

    try {
      // Step 4a: Read state.db for session and message info
      const dbData = this.readFromStateDb(profile);

      // Step 4b: Tail JSONL for reasoning_content and tool_calls
      const jsonlData = this.readFromJsonl(dbData.latestSessionId);

      // Step 4c: Apply state machine (M3)
      const newState = this.computeState(dbData, jsonlData, existing?.state, now);

      // Step 4d: Compute currentTask, currentTool, lastActivityAt
      this.updateActivityFields(status, dbData, jsonlData, now);

      // Update state fields BEFORE computing error severity
      if (newState !== status.state) {
        status.previousState = status.state;
        status.state = newState;
        status.stateSinceAt = now;
      }

      // Step 4e: Compute errorCount and severity (needs updated state)
      this.updateErrorFields(status, dbData, jsonlData, now);

      // Update metrics
      status.messageCount = dbData.messageCount;
      status.sessionId = dbData.latestSessionId;

      // Track uptime
      if (!existing) {
        status.uptimeSeconds = 0;
      } else {
        status.uptimeSeconds = (now - (status.stateSinceAt)) / 1000;
      }

      // Notify subscribers of changes
      if (this.hasStatusChanged(existing, status)) {
        this.notifySubscribers(agentId, status);
      }

      this.statuses.set(agentId, status);
    } catch (error) {
      console.error(`[AgentStateAggregator] Error updating agent ${agentId}:`, error);
      // Don't throw - continue with existing status
    }
  }

  /**
   * Initialize a new HermesAgentStatus object
   */
  private initializeStatus(agentId: string, profile: string, now: number): HermesAgentStatus {
    return {
      agentId,
      profile,
      sessionId: null,
      parentSessionId: null,
      parentAgentId: null,
      state: 'idle',
      previousState: null,
      stateSinceAt: now,
      severity: null,
      currentTask: null,
      currentTool: null,
      currentToolTarget: null,
      lastActivityAt: now,
      lastMessagePreview: null,
      pendingApproval: null,
      toolCallCount: 0,
      messageCount: 0,
      errorCount: 0,
      errorCount60s: 0,
      severityReason: null,
      uptimeSeconds: 0,
    };
  }

  /**
   * Read from state.db (sessions and messages tables)
   */
  private readFromStateDb(profile: string): {
    latestSessionId: string | null;
    lastMessage: DbMessage | null;
    messageCount: number;
  } {
    const dbPath = path.join(this.hermesHome, 'profiles', profile, 'state.db');

    if (!fs.existsSync(dbPath)) {
      return {
        latestSessionId: null,
        lastMessage: null,
        messageCount: 0,
      };
    }

    try {
      const db = new Database(dbPath, { readonly: true });

      // Get most recent session
      const latestSession = db
        .prepare(
          'SELECT session_id, profile, created_at, updated_at, status FROM sessions ORDER BY updated_at DESC LIMIT 1'
        )
        .get() as DbSession | undefined;

      // Get last message
      const lastMessage = db
        .prepare(
          'SELECT id, session_id, role, content, reasoning_content, tool_calls, created_at FROM messages ORDER BY created_at DESC LIMIT 1'
        )
        .get() as DbMessage | undefined;

      // Get message count for current session
      let messageCount = 0;
      if (latestSession) {
        const countResult = db
          .prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ?')
          .get(latestSession.session_id) as { count: number };
        messageCount = countResult.count;
      }

      db.close();

      return {
        latestSessionId: latestSession?.session_id || null,
        lastMessage: lastMessage || null,
        messageCount,
      };
    } catch (error) {
      // DB locked or other error - log and continue
      console.error(`[AgentStateAggregator] DB error for ${profile}:`, error);
      return {
        latestSessionId: null,
        lastMessage: null,
        messageCount: 0,
      };
    }
  }

  /**
   * Tail JSONL session file for recent messages
   */
  private readFromJsonl(sessionId: string | null): {
    messages: JsonlMessage[];
    lastAssistantMessage: JsonlMessage | null;
    lastToolCall: JsonlMessage | null;
  } {
    if (!sessionId) {
      return {
        messages: [],
        lastAssistantMessage: null,
        lastToolCall: null,
      };
    }

    // Look for JSONL file in various possible locations
    const possiblePaths = [
      path.join(this.hermesHome, 'sessions', `${sessionId}.jsonl`),
      path.join(this.hermesHome, 'sessions', sessionId, 'session.jsonl'),
      path.join(this.hermesHome, 'profiles', 'default', 'sessions', `${sessionId}.jsonl`),
    ];

    let jsonlPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        jsonlPath = p;
        break;
      }
    }

    if (!jsonlPath) {
      return {
        messages: [],
        lastAssistantMessage: null,
        lastToolCall: null,
      };
    }

    try {
      // Read last 50 lines (tail)
      const content = fs.readFileSync(jsonlPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      // Get last 50 lines
      const recentLines = lines.slice(-50);

      const messages: JsonlMessage[] = [];
      let lastAssistantMessage: JsonlMessage | null = null;
      let lastToolCall: JsonlMessage | null = null;

      for (const line of recentLines) {
        try {
          const msg = JSON.parse(line) as JsonlMessage;
          messages.push(msg);

          if (msg.role === 'assistant') {
            lastAssistantMessage = msg;
          }
          if (msg.tool_calls && msg.tool_calls.length > 0) {
            lastToolCall = msg;
          }
        } catch (error) {
          // JSONL parse error - log and continue with other lines
          console.error('[AgentStateAggregator] JSONL parse error:', error);
        }
      }

      return {
        messages,
        lastAssistantMessage,
        lastToolCall,
      };
    } catch (error) {
      console.error('[AgentStateAggregator] JSONL read error:', error);
      return {
        messages: [],
        lastAssistantMessage: null,
        lastToolCall: null,
      };
    }
  }

  /**
   * Compute canonical state using state machine (M3)
   */
  private computeState(
    dbData: { latestSessionId: string | null; lastMessage: DbMessage | null },
    jsonlData: { messages: JsonlMessage[]; lastAssistantMessage: JsonlMessage | null; lastToolCall: JsonlMessage | null },
    previousState: AgentState | undefined,
    now: number
  ): AgentState {
    // First check for new error in last tool result
    let hasNewError = false;
    if (dbData.lastMessage?.role === 'tool' && dbData.lastMessage.content) {
      if (this.hasErrorKeyword(dbData.lastMessage.content)) {
        hasNewError = true;
        // Determine severity
        const errorCount = this.countRecentErrors(dbData.lastMessage.created_at, jsonlData.messages);
        if (errorCount >= this.ERROR_CRITICAL_THRESHOLD) {
          return 'error_critical';
        }
        return 'error';
      }
    }

    // error_critical does NOT auto-clear - sticky until explicit error_resolved event or restart
    // Check this AFTER checking for new errors (new critical errors override the sticky behavior)
    if (previousState === 'error_critical' && !hasNewError) {
      return 'error_critical';
    }

    // For initial state (no previous state), check if we should be in error_critical
    // based on historical error count in the session
    if (!previousState && dbData.latestSessionId) {
      // Count errors in the session (not just recent)
      let errorCount = 0;
      for (const msg of jsonlData.messages) {
        if (msg.role === 'tool' && msg.content && this.hasErrorKeyword(msg.content)) {
          errorCount++;
        }
      }
      if (errorCount >= this.ERROR_CRITICAL_THRESHOLD) {
        return 'error_critical';
      }
    }

    // Auto-clear error_minor after 10s of healthy activity (no new errors)
    if (previousState === 'error' && !hasNewError) {
      const lastErrorTime = dbData.lastMessage?.created_at || 0;
      const timeSinceError = now - lastErrorTime;
      if (timeSinceError > this.ERROR_AUTO_CLEAR_MS) {
        // Check if there are recent errors - if yes, don't auto-clear
        const recentErrors = this.countRecentErrors(lastErrorTime, jsonlData.messages);
        if (recentErrors === 0) {
          // Auto-clear - determine appropriate healthy state
          if (jsonlData.lastToolCall && now - (jsonlData.lastToolCall.created_at || 0) < this.RECENT_TOOL_MS) {
            return 'working';
          }
          if (jsonlData.lastAssistantMessage?.reasoning_content) {
            return 'thinking';
          }
          return 'idle';
        }
      }
      // If still error conditions, stay in error state
      return 'error';
    }

    // No active session -> idle
    if (!dbData.latestSessionId) {
      return 'idle';
    }

    // Check for idle: no tool/reasoning for >60s
    const lastActivity = dbData.lastMessage?.created_at || 0;
    if (now - lastActivity > this.IDLE_THRESHOLD_MS) {
      return 'idle';
    }

    // Check for waiting: approval_request event OR content heuristic
    // Note: M0 event bus handling is in T06, this is fallback
    if (this.isWaitingState(dbData, jsonlData)) {
      return 'waiting';
    }

    // Check for thinking: reasoning_content without recent tool call
    if (jsonlData.lastAssistantMessage?.reasoning_content) {
      const lastToolCallTime = jsonlData.lastToolCall?.created_at || 0;
      if (now - lastToolCallTime > this.RECENT_TOOL_MS) {
        return 'thinking';
      }
    }

    // Check for working: recent tool result OR pending tool_calls
    if (dbData.lastMessage?.role === 'tool') {
      if (now - dbData.lastMessage.created_at < this.RECENT_TOOL_MS) {
        return 'working';
      }
    }

    if (jsonlData.lastAssistantMessage?.tool_calls && jsonlData.lastAssistantMessage.tool_calls.length > 0) {
      return 'working';
    }

    // Default to thinking if there's an active session but no clear state
    if (jsonlData.lastAssistantMessage) {
      return 'thinking';
    }

    // Fallback
    return previousState || 'idle';
  }

  /**
   * Check if agent is waiting for human input
   */
  private isWaitingState(
    dbData: { latestSessionId: string | null; lastMessage: DbMessage | null },
    jsonlData: { lastAssistantMessage: JsonlMessage | null }
  ): boolean {
    // Check for approval_request event (M0 event bus, handled in T06)
    // For now, use content heuristic as fallback

    if (jsonlData.lastAssistantMessage?.content) {
      const content = jsonlData.lastAssistantMessage.content.toLowerCase();
      // Common patterns for waiting for human input
      const waitingPatterns = [
        'shall i proceed',
        'should i continue',
        'do you want me to',
        'would you like me to',
        'awaiting your input',
        'waiting for approval',
        'please confirm',
      ];

      return waitingPatterns.some(pattern => content.includes(pattern));
    }

    return false;
  }

  /**
   * Check if content contains error keyword
   */
  private hasErrorKeyword(content: string): boolean {
    for (const keyword of this.errorKeywords) {
      if (content.includes(keyword)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Count errors in last 60 seconds
   */
  private countRecentErrors(lastErrorTime: number, jsonlMessages: JsonlMessage[]): number {
    const windowStart = lastErrorTime - this.ERROR_WINDOW_MS;
    let count = 0;

    // Count tool messages with errors in the window
    for (const msg of jsonlMessages) {
      if (msg.role === 'tool' && msg.content) {
        if (msg.created_at && msg.created_at >= windowStart && this.hasErrorKeyword(msg.content)) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Update activity fields: currentTask, currentTool, currentToolTarget, lastActivityAt
   */
  private updateActivityFields(
    status: HermesAgentStatus,
    dbData: { latestSessionId: string | null; lastMessage: DbMessage | null },
    jsonlData: { lastAssistantMessage: JsonlMessage | null; lastToolCall: JsonlMessage | null },
    now: number
  ): void {
    // Update lastActivityAt
    const lastActivityTime = dbData.lastMessage?.created_at || jsonlData.lastAssistantMessage?.created_at || now;
    status.lastActivityAt = lastActivityTime;

    // Update currentTask from last assistant message
    if (jsonlData.lastAssistantMessage?.content) {
      let task = jsonlData.lastAssistantMessage.content;
      // Truncate to 200 chars
      if (task.length > 200) {
        task = task.substring(0, 200);
      }
      status.currentTask = task;
    }

    // Update lastMessagePreview (first 100 chars)
    if (jsonlData.lastAssistantMessage?.content) {
      status.lastMessagePreview = jsonlData.lastAssistantMessage.content.substring(0, 100);
    }

    // Update currentTool from tool_calls
    if (jsonlData.lastToolCall?.tool_calls && jsonlData.lastToolCall.tool_calls.length > 0) {
      const lastCall = jsonlData.lastToolCall.tool_calls[jsonlData.lastToolCall.tool_calls.length - 1];
      status.currentTool = lastCall.function?.name || lastCall.name || null;
      status.currentToolTarget = lastCall.function?.arguments || null;
    }

    // Update tool call count
    if (status.currentTool) {
      status.toolCallCount++;
    }
  }

  /**
   * Update error fields: errorCount, errorCount60s, severity, and severityReason
   */
  private updateErrorFields(
    status: HermesAgentStatus,
    dbData: { lastMessage: DbMessage | null },
    jsonlData: { messages: JsonlMessage[] },
    now: number
  ): void {
    // Count total errors in current session
    let errorCount = 0;

    for (const msg of jsonlData.messages) {
      if (msg.role === 'tool' && msg.content && this.hasErrorKeyword(msg.content)) {
        errorCount++;
      }
    }

    status.errorCount = errorCount;

    // Count errors in last 60 seconds and set errorCount60s
    const lastErrorTime = dbData.lastMessage?.created_at || now;
    const recentErrors = this.countRecentErrors(lastErrorTime, jsonlData.messages);
    status.errorCount60s = recentErrors;

    // Determine severity for error states
    if (status.state === 'error' || status.state === 'error_critical') {
      // For error_critical state, use historical error count if no recent errors
      if (status.state === 'error_critical' && recentErrors === 0 && errorCount >= this.ERROR_CRITICAL_THRESHOLD) {
        status.severity = 'critical';
        status.severityReason = `${errorCount} errors in session`;
      } else if (recentErrors >= this.ERROR_CRITICAL_THRESHOLD) {
        status.severity = 'critical';
        status.severityReason = `${recentErrors} errors in 60s`;
      } else {
        status.severity = 'minor';
        status.severityReason = 'single error detected';
      }
    } else {
      status.severity = null;
      status.severityReason = null;
    }
  }

  /**
   * Check if status has meaningfully changed
   */
  private hasStatusChanged(old: HermesAgentStatus | undefined, current: HermesAgentStatus): boolean {
    if (!old) {
      return true;
    }

    // Check key fields for changes
    return (
      old.state !== current.state ||
      old.currentTool !== current.currentTool ||
      old.currentTask !== current.currentTask ||
      old.errorCount !== current.errorCount ||
      old.sessionId !== current.sessionId
    );
  }

  /**
   * Notify all subscribers of a state change
   */
  private notifySubscribers(agentId: string, status: HermesAgentStatus): void {
    for (const callback of this.subscribers) {
      try {
        callback(agentId, status);
      } catch (error) {
        console.error('[AgentStateAggregator] Subscriber error:', error);
      }
    }
  }

  /**
   * Get status for a single agent
   */
  getStatus(agentId: string): HermesAgentStatus | null {
    return this.statuses.get(agentId) || null;
  }

  /**
   * Get all agent statuses
   */
  getAllStatuses(): HermesAgentStatus[] {
    return Array.from(this.statuses.values());
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: StateChangeCallback): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Set custom error keywords (for testing)
   */
  setErrorKeywords(keywords: string[]): void {
    this.errorKeywords = new Set(keywords);
  }

  /**
   * Check if any agent is in error_critical state
   * Used by /health endpoint to determine degraded status
   */
  hasCriticalError(): boolean {
    for (const status of this.statuses.values()) {
      if (status.state === 'error_critical') {
        return true;
      }
    }
    return false;
  }
}