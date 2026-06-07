import express from 'express';
import cors from 'cors';
import { loadConfig, type MonitoringConfig } from './config.js';
import { AgentStateAggregator } from './state.js';
import { SSEServer } from './sse.js';

/**
 * Hermes plugin context passed to activate/deactivate hooks
 */
export interface PluginContext {
  hermesHome: string;
  eventBus?: any;
  logger?: any;
}

/**
 * Agent state for tracking and health reporting
 */
interface AgentStatus {
  agentId: string;
  lastSeen: number;
}

/**
 * Plugin state maintained between activate and deactivate
 */
interface PluginState {
  expressApp: express.Express | null;
  server: any;
  config: MonitoringConfig;
  pollIntervalId: any;
  heartbeatIntervalId: any;
  startTime: number;
  lastTickAt: number;
  agents: Map<string, AgentStatus>;
  connectedClients: number;
  hermesEventBusConnected: boolean;
  aggregator: AgentStateAggregator | null;
  sseServer: SSEServer | null;
}

let pluginState: PluginState | null = null;

/**
 * Activate the plugin - called by Hermes when plugin is loaded
 */
export async function activate(ctx: PluginContext): Promise<void> {
  console.log('[hell-factory-monitoring] Activating plugin...');
  console.log(`[hell-factory-monitoring] Hermes home: ${ctx.hermesHome}`);

  try {
    // Load configuration
    const config = loadConfig();
    console.log(`[hell-factory-monitoring] Config loaded. Polling: ${config.pollingIntervalMs}ms, SSE: ${config.sse.host}:${config.sse.port}`);

    // Initialize AgentStateAggregator (per T03)
    const aggregator = new AgentStateAggregator(ctx.hermesHome);
    console.log('[hell-factory-monitoring] AgentStateAggregator initialized');

    // Initialize SSE server (per T04)
    const sseServer = new SSEServer(
      aggregator,
      config.sse.host,
      config.sse.port,
      config.sse.maxConnections || 5
    );
    await sseServer.start();
    console.log(`[hell-factory-monitoring] SSE server started on ${config.sse.host}:${config.sse.port}`);

    // Initialize Express app for /health endpoint only
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Health endpoint
    app.get('/health', (req: any, res: any) => {
      if (!pluginState) {
        return res.status(503).json({
          status: 'degraded',
          agents: [],
          uptime_s: 0,
          last_tick_at: 0,
          connected_clients: 0,
          hermes_event_bus_connected: false,
        });
      }

      const now = Date.now();
      const pollIntervalMs = pluginState.config.pollingIntervalMs;
      const timeSinceLastTick = now - pluginState.lastTickAt;
      const lastTickStalled = timeSinceLastTick > (pollIntervalMs * 2);
      const eventBusDisconnected = !pluginState.hermesEventBusConnected;
      const hasCriticalError = pluginState.aggregator?.hasCriticalError() || false;

      // Status is degraded if tick loop is stalled OR event bus disconnected OR critical error
      const status = (lastTickStalled || eventBusDisconnected || hasCriticalError) ? 'degraded' : 'ok';

      const agents = pluginState.aggregator?.getAllStatuses() || [];
      const uptimeS = Math.floor((now - pluginState.startTime) / 1000);

      res.json({
        status,
        agents: agents.map((a: any) => a.agentId),
        uptime_s: uptimeS,
        last_tick_at: pluginState.lastTickAt,
        connected_clients: pluginState.sseServer?.getConnectedClientCount() || 0,
        hermes_event_bus_connected: pluginState.hermesEventBusConnected,
      });
    });

    // Start server for /health endpoint only (on a different port to avoid conflict with SSE)
    // The SSE server is already running on config.sse.port
    const healthPort = config.sse.port + 1;  // Use port 3003 for health if SSE is on 3002
    const server = app.listen(healthPort, config.sse.host, () => {
      console.log(`[hell-factory-monitoring] Health endpoint listening on ${config.sse.host}:${healthPort}`);
    });

    // Initialize state poller (call aggregator.tick() every 500ms)
    const pollIntervalId = setInterval(() => {
      if (pluginState && pluginState.aggregator) {
        pluginState.lastTickAt = Date.now();
        pluginState.aggregator.tick();
      }
    }, config.pollingIntervalMs);

    // No separate heartbeat needed - SSEServer handles it

    // Register event bus subscribers (full implementation in T06)
    const hermesEventBusConnected = !!(ctx.eventBus);
    if (hermesEventBusConnected) {
      console.log('[hell-factory-monitoring] Event bus available, will subscribe in T06');
      // Event subscriptions will be added in T06
    } else {
      console.log('[hell-factory-monitoring] No event bus available (will use polling fallback)');
    }

    // Store plugin state
    pluginState = {
      expressApp: app,
      server,
      config,
      pollIntervalId,
      heartbeatIntervalId: null,  // Not used - SSEServer handles heartbeat
      startTime: Date.now(),
      lastTickAt: Date.now(),
      agents: new Map(),  // Kept for compatibility but aggregator is source of truth
      connectedClients: 0,  // Kept for compatibility but sseServer is source of truth
      hermesEventBusConnected,
      aggregator,
      sseServer,
    };

    console.log('[hell-factory-monitoring] Plugin activated successfully');
  } catch (error) {
    console.error('[hell-factory-monitoring] Activation failed:', error);
    throw error;
  }
}

/**
 * Deactivate the plugin - called by Hermes when plugin is unloaded
 */
export async function deactivate(ctx: PluginContext): Promise<void> {
  console.log('[hell-factory-monitoring] Deactivating plugin...');

  if (!pluginState) {
    console.log('[hell-factory-monitoring] Plugin not active, nothing to clean up');
    return;
  }

  try {
    // Stop SSE server first
    if (pluginState.sseServer) {
      await pluginState.sseServer.stop();
      console.log('[hell-factory-monitoring] SSE server stopped');
    }

    // Clear poll interval
    if (pluginState.pollIntervalId) {
      clearInterval(pluginState.pollIntervalId);
      console.log('[hell-factory-monitoring] Polling stopped');
    }

    // Clear heartbeat interval (not used but clean up for safety)
    if (pluginState.heartbeatIntervalId) {
      clearInterval(pluginState.heartbeatIntervalId);
      console.log('[hell-factory-monitoring] Heartbeat stopped');
    }

    // Close health endpoint server
    if (pluginState.server) {
      await new Promise<void>((resolve) => {
        pluginState!.server.close(() => {
          console.log('[hell-factory-monitoring] Health endpoint closed');
          resolve();
        });
      });
    }

    // Clear plugin state
    pluginState = null;
    console.log('[hell-factory-monitoring] Plugin deactivated successfully');
  } catch (error) {
    console.error('[hell-factory-monitoring] Deactivation failed:', error);
    throw error;
  }
}

/**
 * Export plugin metadata (for Hermes plugin system)
 */
export const pluginInfo = {
  name: 'hell-factory-monitoring',
  version: '0.1.0',
  description: 'Real-time agent monitoring via SSE',
  hooks: ['activate', 'deactivate'] as const,
};