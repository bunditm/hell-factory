import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { activate, deactivate, pluginInfo } from '../src/index.js';
import type { PluginContext } from '../src/index.js';

/**
 * Integration test for the full plugin with SSE endpoint
 * Tests FR-M4.2, FR-M4.3, FR-M4.4, FR-M4.9
 */
describe('SSE Integration Tests', () => {
  let mockCtx: PluginContext;

  beforeAll(async () => {
    mockCtx = {
      hermesHome: '/tmp/test-sse-integration',
      eventBus: undefined,
      logger: undefined,
    };
    await activate(mockCtx);

    // Wait for server to be fully started
    await new Promise(resolve => setTimeout(resolve, 500));
  }, 10000);

  afterAll(async () => {
    await deactivate(mockCtx);
  }, 10000);

  describe('SSE endpoint accessibility', () => {
    it('should respond to GET /events request', async () => {
      const response = await fetch('http://127.0.0.1:3002/events', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/event-stream');
      expect(response.headers.get('cache-control')).toBe('no-cache');
      expect(response.headers.get('connection')).toBe('keep-alive');
    });

    it('should return streaming response that can be read', async () => {
      const response = await fetch('http://127.0.0.1:3002/events');

      expect(response.body).toBeTruthy();

      // Read first chunk
      const reader = response.body?.getReader();
      const { value, done } = await reader!.read();

      expect(done).toBe(false);
      expect(value).toBeDefined();
      expect(typeof value).toBe('object');
      expect(value!.length).toBeGreaterThan(0);

      // Decode and check for SSE format
      const text = new TextDecoder().decode(value);
      expect(text).toContain('event:');
      expect(text).toContain('data:');

      reader!.releaseLock();
    });
  });

  describe('SSE event structure', () => {
    it('should send state_snapshot as first event', async () => {
      const response = await fetch('http://127.0.0.1:3002/events');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let foundSnapshot = false;

      // Read for up to 2 seconds looking for state_snapshot
      const startTime = Date.now();
      while (Date.now() - startTime < 2000) {
        const { value, done } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Check for complete event
        if (buffer.includes('\n\n')) {
          if (buffer.includes('event: state_snapshot')) {
            foundSnapshot = true;
            break;
          }
          // Reset buffer after processing events
          buffer = buffer.substring(buffer.lastIndexOf('\n\n') + 2);
        }
      }

      reader!.releaseLock();
      expect(foundSnapshot).toBe(true);
    });
  });

  describe('Health endpoint', () => {
    it('should return 200 with correct shape', async () => {
      const response = await fetch('http://127.0.0.1:3003/health');

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('agents');
      expect(data).toHaveProperty('uptime_s');
      expect(data).toHaveProperty('last_tick_at');
      expect(data).toHaveProperty('connected_clients');
      expect(data).toHaveProperty('hermes_event_bus_connected');

      expect(['ok', 'degraded']).toContain(data.status);
      expect(Array.isArray(data.agents)).toBe(true);
      expect(typeof data.uptime_s).toBe('number');
      expect(typeof data.last_tick_at).toBe('number');
      expect(typeof data.connected_clients).toBe('number');
      expect(typeof data.hermes_event_bus_connected).toBe('boolean');
    });
  });

  describe('Plugin metadata', () => {
    it('should export correct pluginInfo', () => {
      expect(pluginInfo.name).toBe('hell-factory-monitoring');
      expect(pluginInfo.version).toBe('0.1.0');
      expect(pluginInfo.description).toBe('Real-time agent monitoring via SSE');
      expect(pluginInfo.hooks).toEqual(['activate', 'deactivate']);
    });
  });
});