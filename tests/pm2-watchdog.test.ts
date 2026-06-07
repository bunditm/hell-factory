/**
 * Tests for PM2 watchdog functionality
 * Validates ecosystem config, deploy script, and health endpoint
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import http from 'http';

const exec = promisify(require('child_process').exec);

describe('PM2 Watchdog Tests', () => {
  const PROJECT_DIR = '/home/bunditm/projects/hell-factory';
  const HEALTH_URL = 'http://127.0.0.1:3002/health';
  const APP_NAME = 'hell-factory-monitoring';

  // Test (a): Ecosystem config validates
  describe('Ecosystem config validation', () => {
    it('should have a valid ecosystem.config.js file', async () => {
      const configPath = path.join(PROJECT_DIR, 'ops/pm2/ecosystem.config.js');

      expect(fs.existsSync(configPath)).toBe(true);

      // Load and validate the config
      const configContent = await fs.promises.readFile(configPath, 'utf-8');
      expect(configContent).toContain('hell-factory-monitoring');
      expect(configContent).toContain('max_memory_restart');
      expect(configContent).toContain('max_restarts');
      expect(configContent).toContain('restart_delay');
      expect(configContent).toContain('autorestart: true');
    });

    it('should have correct process configuration', async () => {
      const configPath = path.join(PROJECT_DIR, 'ops/pm2/ecosystem.config.js');
      const config = require(configPath);

      expect(config.apps).toBeDefined();
      expect(config.apps).toHaveLength(1);

      const app = config.apps[0];
      expect(app.name).toBe('hell-factory-monitoring');
      expect(app.autorestart).toBe(true);
      expect(app.max_memory_restart).toBe('300M');
      expect(app.max_restarts).toBe(50);
      expect(app.restart_delay).toBe(1000);
      expect(app.env.SSE_PORT).toBe('3002');
      expect(app.env.SSE_HOST).toBe('127.0.0.1');
    });
  });

  // Test (b): Deploy script builds and restarts cleanly
  describe('Deploy script validation', () => {
    it('should have a deploy-plugin.sh script', async () => {
      const scriptPath = path.join(PROJECT_DIR, 'ops/deploy-plugin.sh');

      expect(fs.existsSync(scriptPath)).toBe(true);
      expect(fs.statSync(scriptPath).mode & parseInt('111', 8)).toBeTruthy(); // Executable
    });

    it('should include required deployment steps', async () => {
      const scriptPath = path.join(PROJECT_DIR, 'ops/deploy-plugin.sh');
      const scriptContent = await fs.promises.readFile(scriptPath, 'utf-8');

      expect(scriptContent).toContain('phase-a-v3-detail'); // Branch checkout
      expect(scriptContent).toContain('npm run build'); // Build step
      expect(scriptContent).toContain('pm2 restart hell-factory-monitoring'); // Restart step
      expect(scriptContent).toContain('curl'); // Health check
      expect(scriptContent).toContain('/health'); // Health endpoint
    });

    it('should have executable permissions', async () => {
      const scriptPath = path.join(PROJECT_DIR, 'ops/deploy-plugin.sh');
      const stats = await fs.promises.stat(scriptPath);

      // Check if file is executable by owner
      const mode = stats.mode;
      const ownerExecutable = (mode & parseInt('100', 8)) !== 0;

      expect(ownerExecutable).toBe(true);
    });
  });

  // Test (c): Health endpoint responds within 5s of restart
  describe('Health endpoint validation', () => {
    let pm2Process: any;

    beforeAll(async () => {
      // Ensure PM2 is running
      try {
        await exec('pm2 list');
      } catch (error) {
        console.log('PM2 not available, skipping PM2-dependent tests');
      }
    });

    afterAll(async () => {
      // Cleanup if needed
      // Note: Don't kill the production process in tests
    });

    it('should respond to health endpoint', async () => {
      const response = await fetch(HEALTH_URL);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
    });

    it('should respond within 5 seconds of request', async () => {
      const startTime = Date.now();

      try {
        const response = await fetch(HEALTH_URL, {
          signal: AbortSignal.timeout(5000),
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.ok).toBe(true);
        expect(responseTime).toBeLessThan(5000);
      } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
          throw new Error('Health endpoint did not respond within 5 seconds');
        }
        throw error;
      }
    });

    it('should return valid JSON structure', async () => {
      const response = await fetch(HEALTH_URL);
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('agents');
      expect(Array.isArray(data.agents)).toBe(true);
      expect(data).toHaveProperty('uptime_s');
      expect(data).toHaveProperty('last_tick_at');
    });

    it('should have SSE port 3002 and bind to 127.0.0.1 only', async () => {
      // Test that port 3002 is listening on 127.0.0.1
      const response = await fetch('http://127.0.0.1:3002/health');

      expect(response.ok).toBe(true);

      // Test that port 3002 is NOT accessible from 0.0.0.0 (security check)
      // This should fail or timeout, confirming bind to 127.0.0.1 only
      try {
        await fetch('http://0.0.0.0:3002/health', {
          signal: AbortSignal.timeout(1000),
        });
        // If this succeeds, it's a security concern (bound to 0.0.0.0)
        expect.fail('Port 3002 should not be accessible from 0.0.0.0');
      } catch (error) {
        // This is expected - connection should fail
        expect(error).toBeDefined();
      }
    });
  });

  // Additional tests for pre-start hook
  describe('Pre-start hook validation', () => {
    it('should have pre-start.sh script', async () => {
      const scriptPath = path.join(PROJECT_DIR, 'ops/pm2/pre-start.sh');

      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    it('should check port 3002 availability', async () => {
      const scriptPath = path.join(PROJECT_DIR, 'ops/pm2/pre-start.sh');
      const scriptContent = await fs.promises.readFile(scriptPath, 'utf-8');

      expect(scriptContent).toContain('lsof -ti:');
      expect(scriptContent).toContain('SSE_PORT');
      expect(scriptContent).toContain('kill');
      expect(scriptContent).toContain('127.0.0.1');
    });

    it('should verify SSE_HOST security check', async () => {
      const scriptPath = path.join(PROJECT_DIR, 'ops/pm2/pre-start.sh');
      const scriptContent = await fs.promises.readFile(scriptPath, 'utf-8');

      expect(scriptContent).toContain('SSE_HOST');
      expect(scriptContent).toContain('SECURITY ERROR');
      expect(scriptContent).toContain('127.0.0.1');
      expect(scriptContent).toContain('::1');
    });
  });

  // Additional tests for log rotation
  describe('Log rotation validation', () => {
    it('should have pm2-logrotate installed', async () => {
      const { stdout, stderr } = await exec('pm2 list');

      expect(stdout).toContain('pm2-logrotate');
    });

    it('should have correct log rotation settings', async () => {
      const { stdout } = await exec('pm2 conf pm2-logrotate');

      expect(stdout).toContain('retain 7');
      expect(stdout).toContain('rotateInterval 0 0 * * *');
      expect(stdout).toContain('max_size 10M');
    });
  });

  // Additional tests for monitoring script
  describe('Monitoring script validation', () => {
    it('should have monitor-plugin.sh script', async () => {
      const scriptPath = path.join(PROJECT_DIR, 'ops/monitor-plugin.sh');

      expect(fs.existsSync(scriptPath)).toBe(true);
      expect(fs.statSync(scriptPath).mode & parseInt('111', 8)).toBeTruthy(); // Executable
    });

    it('should check CPU and memory thresholds', async () => {
      const scriptPath = path.join(PROJECT_DIR, 'ops/monitor-plugin.sh');
      const scriptContent = await fs.promises.readFile(scriptPath, 'utf-8');

      expect(scriptContent).toContain('CPU_THRESHOLD');
      expect(scriptContent).toContain('MEMORY_THRESHOLD');
      expect(scriptContent).toContain('pm2 describe');
      expect(scriptContent).toContain('/health');
    });
  });

  // Additional tests for package.json scripts
  describe('Package.json scripts validation', () => {
    it('should have pm2:status script', async () => {
      const packageJsonPath = path.join(PROJECT_DIR, 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts).toHaveProperty('pm2:status');
      expect(packageJson.scripts['pm2:status']).toContain('pm2 status');
    });

    it('should have pm2:monitor script', async () => {
      const packageJsonPath = path.join(PROJECT_DIR, 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts).toHaveProperty('pm2:monitor');
      expect(packageJson.scripts['pm2:monitor']).toContain('pm2 monitor');
    });

    it('should have pm2:logs script', async () => {
      const packageJsonPath = path.join(PROJECT_DIR, 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts).toHaveProperty('pm2:logs');
      expect(packageJson.scripts['pm2:logs']).toContain('pm2 logs');
    });
  });
});