import express, { Request, Response } from 'express';
import type { HermesAgentStatus, AgentStateAggregator, StateChangeCallback } from './state.js';

/**
 * SSE event types per M4
 */
type SSEEventType = 'state_snapshot' | 'agent_update' | 'agent_removed' | 'heartbeat';

/**
 * SSE event payload
 */
interface SSEEvent {
  type: SSEEventType;
  data: any;
}

/**
 * Connected client info
 */
interface Client {
  res: Response;
  agentId: string | null;  // tracked agents that this client has seen
}

/**
 * SSEServer - Server-Sent Events endpoint for streaming agent status updates
 * Per M4 requirements: binds to 127.0.0.1:3002, snapshot-then-delta flow, heartbeats, connection cap
 */
export class SSEServer {
  private app: express.Application;
  private server: any;
  private aggregator: AgentStateAggregator;
  private host: string;
  private port: number;
  private maxConnections: number;
  private clients: Map<string, Client> = new Map();  // clientId -> Client
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private clientCounter = 0;
  private readonly HEARTBEAT_INTERVAL_MS = 5000;
  private unsubscribeCallback: (() => void) | null = null;
  private trackedAgents: Set<string> = new Set();  // agents we've sent updates for

  constructor(aggregator: AgentStateAggregator, host: string = '127.0.0.1', port: number = 3002, maxConnections: number = 5) {
    this.aggregator = aggregator;
    this.host = host;
    this.port = port;
    this.maxConnections = maxConnections;
    this.app = express();

    // Security check: NEVER allow 0.0.0.0 (per FR-M4.1, FR-M9.1)
    if (this.host === '0.0.0.0' || this.host === '::') {
      throw new Error(`SSEServer: Forbidden host "${this.host}". Must bind to 127.0.0.1 only for security.`);
    }

    this.setupRoutes();
  }

  /**
   * Setup express routes
   */
  private setupRoutes(): void {
    // GET /events - SSE endpoint (per FR-M4.2)
    this.app.get('/events', (req: Request, res: Response) => {
      this.handleSSEConnection(req, res);
    });
  }

  /**
   * Handle new SSE connection
   */
  private handleSSEConnection(req: Request, res: Response): void {
    // Check connection cap (per FR-M9.2)
    if (this.clients.size >= this.maxConnections) {
      res.status(503).json({ error: 'Too many concurrent connections', maxConnections: this.maxConnections });
      return;
    }

    // Set SSE headers (per FR-M4.2)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');  // Disable nginx buffering

    // Send immediate state_snapshot (per FR-M4.3)
    const allAgents = this.aggregator.getAllStatuses();
    const snapshotEvent: SSEEvent = {
      type: 'state_snapshot',
      data: {
        agents: allAgents,
        emittedAt: Date.now(),
      },
    };
    this.sendSSEEvent(res, snapshotEvent);

    // Track agents in snapshot
    for (const agent of allAgents) {
      this.trackedAgents.add(agent.agentId);
    }

    // Create client entry
    const clientId = `client-${++this.clientCounter}`;
    const client: Client = { res, agentId: null };
    this.clients.set(clientId, client);

    console.log(`[SSEServer] Client connected: ${clientId} (total: ${this.clients.size})`);

    // Handle client disconnect
    req.on('close', () => {
      this.handleClientDisconnect(clientId);
    });

    req.on('error', (err) => {
      console.error(`[SSEServer] Client error: ${clientId}`, err);
      this.handleClientDisconnect(clientId);
    });

    // Keep connection alive
    res.on('error', (err) => {
      console.error(`[SSEServer] Response error: ${clientId}`, err);
      this.handleClientDisconnect(clientId);
    });
  }

  /**
   * Send SSE event to a client
   */
  private sendSSEEvent(res: Response, event: SSEEvent): void {
    try {
      const data = JSON.stringify(event.data);
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('[SSEServer] Failed to send event:', error);
    }
  }

  /**
   * Broadcast event to all connected clients
   */
  private broadcastEvent(event: SSEEvent): void {
    const deadClients: string[] = [];

    for (const [clientId, client] of this.clients) {
      try {
        this.sendSSEEvent(client.res, event);
      } catch (error) {
        deadClients.push(clientId);
      }
    }

    // Cleanup dead clients
    for (const clientId of deadClients) {
      this.handleClientDisconnect(clientId);
    }
  }

  /**
   * Handle client disconnect - cleanup and unsubscribe
   */
  private handleClientDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      client.res.end();
    } catch (error) {
      // Ignore errors when closing
    }

    this.clients.delete(clientId);
    console.log(`[SSEServer] Client disconnected: ${clientId} (total: ${this.clients.size})`);
  }

  /**
   * State change callback - subscribed to AgentStateAggregator
   */
  private onStateChange: StateChangeCallback = (agentId: string, status: HermesAgentStatus) => {
    // Send agent_update event (per FR-M4.4 - full object, not JSON Patch)
    const updateEvent: SSEEvent = {
      type: 'agent_update',
      data: status,
    };

    this.trackedAgents.add(agentId);
    this.broadcastEvent(updateEvent);
  };

  /**
   * Send heartbeat every 5s (per FR-M4.9, M1.9)
   */
  private sendHeartbeat(): void {
    const heartbeatEvent: SSEEvent = {
      type: 'heartbeat',
      data: {
        at: Date.now(),
        connectedClients: this.clients.size,
      },
    };

    this.broadcastEvent(heartbeatEvent);

    // Check for removed agents - emit agent_removed if needed
    this.checkForRemovedAgents();
  }

  /**
   * Check for agents that are no longer tracked and emit agent_removed events
   * This is called during heartbeat to periodically clean up
   */
  private checkForRemovedAgents(): void {
    const currentAgents = new Set(this.aggregator.getAllStatuses().map(a => a.agentId));
    const removedAgents: string[] = [];

    // Find agents we were tracking but are now gone
    for (const agentId of this.trackedAgents) {
      if (!currentAgents.has(agentId)) {
        removedAgents.push(agentId);
      }
    }

    // Emit agent_removed events
    for (const agentId of removedAgents) {
      const removeEvent: SSEEvent = {
        type: 'agent_removed',
        data: { agentId },
      };
      this.broadcastEvent(removeEvent);
      this.trackedAgents.delete(agentId);
    }
  }

  /**
   * Start the SSE server
   */
  async start(): Promise<void> {
    // Subscribe to aggregator state changes (per FR-M4.4)
    this.unsubscribeCallback = this.aggregator.subscribe(this.onStateChange);

    // Start heartbeat timer
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL_MS);

    // Start express server
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.host, () => {
        console.log(`[SSEServer] Listening on http://${this.host}:${this.port}/events`);

        // Verify we're bound to the correct interface (per FR-M4.1, FR-M9.1)
        const address = this.server.address();
        if (address && typeof address === 'object' && address.address !== this.host) {
          this.server.close();
          reject(new Error(`SSEServer: Bound to ${address.address} instead of ${this.host}. Security violation.`));
          return;
        }

        resolve();
      });

      this.server.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  /**
   * Stop the SSE server
   */
  async stop(): Promise<void> {
    console.log('[SSEServer] Stopping...');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Unsubscribe from aggregator
    if (this.unsubscribeCallback) {
      this.unsubscribeCallback();
      this.unsubscribeCallback = null;
    }

    // Close all client connections
    for (const [clientId, client] of this.clients) {
      try {
        client.res.end();
      } catch (error) {
        // Ignore
      }
    }
    this.clients.clear();

    // Close server
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('[SSEServer] Stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Get current number of connected clients (for /health endpoint)
   */
  getConnectedClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get server URL
   */
  getServerUrl(): string {
    return `http://${this.host}:${this.port}`;
  }
}