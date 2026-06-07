import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { activate, deactivate, pluginInfo } from '../src/index.js';
import type { PluginContext } from '../src/index.js';
import request from 'supertest';

describe('GET /health endpoint', () => {
  let mockCtx: PluginContext;
  let agent: any;

  beforeAll(async () => {
    mockCtx = {
      hermesHome: '/tmp/test-hermes-health',
      eventBus: undefined,
      logger: undefined,
    };
    await activate(mockCtx);
    agent = request('http://127.0.0.1:3002');
  });

  afterAll(async () => {
    await deactivate(mockCtx);
  });

  it('should return 200 with correct shape in healthy state', async () => {
    const start = Date.now();
    const response = await agent.get('/health').expect(200);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(50);
    expect(response.body).toMatchObject({
      status: expect.any(String),
      agents: expect.any(Array),
      uptime_s: expect.any(Number),
      last_tick_at: expect.any(Number),
      connected_clients: expect.any(Number),
      hermes_event_bus_connected: expect.any(Boolean),
    });
    expect(['ok', 'degraded']).toContain(response.body.status);
  });

  it('should return degraded status when tick loop stalls (>2x poll interval)', async () => {
    await agent.get('/health').expect(200);
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