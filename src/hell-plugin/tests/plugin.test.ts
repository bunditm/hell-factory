import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { activate, deactivate, pluginInfo } from '../src/index.js';
import type { PluginContext } from '../src/index.js';
import request from 'supertest';

describe('hell-factory-monitoring plugin', () => {
  let mockCtx: PluginContext;

  beforeEach(() => {
    mockCtx = {
      hermesHome: '/tmp/test-hermes',
      eventBus: undefined,
      logger: undefined,
    };
  });

  afterEach(async () => {
    // Clean up if plugin is still active
    try {
      await deactivate(mockCtx);
    } catch {
      // Ignore if already deactivated
    }
  });

  it('should activate successfully', async () => {
    await expect(activate(mockCtx)).resolves.not.toThrow();
  });

  it('should deactivate successfully after activation', async () => {
    await activate(mockCtx);
    await expect(deactivate(mockCtx)).resolves.not.toThrow();
  });

  it('should handle deactivate when not active', async () => {
    await expect(deactivate(mockCtx)).resolves.not.toThrow();
  });

  it('should expose plugin metadata', () => {
    expect(pluginInfo.name).toBe('hell-factory-monitoring');
    expect(pluginInfo.version).toBe('0.1.0');
    expect(pluginInfo.hooks).toEqual(['activate', 'deactivate']);
  });

  describe('GET /health endpoint', () => {
    let agent: any;

    beforeEach(async () => {
      await activate(mockCtx);
      agent = request('http://127.0.0.1:3002');
    });

    afterEach(async () => {
      await deactivate(mockCtx);
    });

    it('should return 200 with correct shape in healthy state', async () => {
      const response = await agent.get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        agents: expect.any(Array),
        uptime_s: expect.any(Number),
        last_tick_at: expect.any(Number),
        connected_clients: expect.any(Number),
        hermes_event_bus_connected: expect.any(Boolean),
      });
      expect(['ok', 'degraded']).toContain(response.body.status);
    });

    it('should return degraded status when tick loop stalls (>2x poll interval)', async () => {
      const startTime = Date.now();
      await agent.get('/health').expect(200);

      // Wait for more than 2x poll interval (500ms default from config)
      await new Promise(resolve => setTimeout(resolve, 1200));

      const response = await agent.get('/health').expect(200);
      expect(response.body.status).toBe('degraded');
    });

    it('should show monotonic increase of uptime', async () => {
      const first = await agent.get('/health').expect(200);
      const uptime1 = first.body.uptime_s;

      await new Promise(resolve => setTimeout(resolve, 1100));

      const second = await agent.get('/health').expect(200);
      const uptime2 = second.body.uptime_s;

      expect(uptime2).toBeGreaterThan(uptime1);
    });
  });
});