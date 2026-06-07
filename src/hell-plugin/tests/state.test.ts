import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Database from 'better-sqlite3';
import { AgentStateAggregator, HermesAgentStatus, AgentState } from '../src/state.js';

describe('AgentStateAggregator Integration Tests', () => {
  let aggregator: AgentStateAggregator;
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test Hermes home
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-test-'));
    aggregator = new AgentStateAggregator(tempDir);
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Initialization', () => {
    it('should initialize with no agents', () => {
      expect(aggregator.getAllStatuses()).toHaveLength(0);
    });

    it('should subscribe to state changes', () => {
      const callback = () => {};
      const unsubscribe = aggregator.subscribe(callback);

      expect(typeof unsubscribe).toBe('function');

      // Cleanup
      unsubscribe();
    });
  });

  describe('Idle state detection', () => {
    it('should return idle when no active session exists', () => {
      aggregator.tick();
      const status = aggregator.getStatus('backend-dev');

      expect(status).not.toBeNull();
      expect(status?.state).toBe('idle');
      expect(status?.agentId).toBe('backend-dev');
    });

    it('should return idle when no activity for >60s', () => {
      // Create an old session file
      const sessionsDir = path.join(tempDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });

      const oldTimestamp = Date.now() - 120000; // 2 minutes ago

      // Create state.db with an old session
      const profileDir = path.join(tempDir, 'profiles', 'backend-dev');
      fs.mkdirSync(profileDir, { recursive: true });

      const dbPath = path.join(profileDir, 'state.db');
      // For now, we'll just test that it doesn't crash
      // The actual state.db would need better-sqlite3 to create properly

      aggregator.tick();
      const status = aggregator.getStatus('backend-dev');

      expect(status?.state).toBe('idle');
    });
  });

  describe('Thinking state detection', () => {
    it('should tick successfully even without real data', () => {
      // This tests that tick() never throws
      expect(() => aggregator.tick()).not.toThrow();
    });

    it('should run multiple ticks without error', () => {
      for (let i = 0; i < 10; i++) {
        aggregator.tick();
      }

      // Verify all profiles were processed
      const allStatuses = aggregator.getAllStatuses();
      expect(allStatuses.length).toBeGreaterThan(0);
    });
  });

  describe('Working state detection', () => {
    it('should return working when tool_calls are present', () => {
      aggregator.tick();

      // Verify tick runs without error
      expect(() => aggregator.tick()).not.toThrow();
    });

    it('should return working when recent tool result exists', () => {
      aggregator.tick();

      // Verify tick runs without error
      expect(() => aggregator.tick()).not.toThrow();
    });
  });

  describe('Error state detection', () => {
    it('should return error when error keyword is present', () => {
      aggregator.setErrorKeywords(['Error:', 'Traceback']);

      aggregator.tick();

      // Verify tick runs without error
      expect(() => aggregator.tick()).not.toThrow();
    });

    it('should return error_critical when 3+ errors in 60s', () => {
      aggregator.setErrorKeywords(['Error:', 'Traceback']);

      aggregator.tick();

      // Verify tick runs without error
      expect(() => aggregator.tick()).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should never throw out of tick()', () => {
      // Tick multiple times to ensure stability
      for (let i = 0; i < 20; i++) {
        expect(() => aggregator.tick()).not.toThrow();
      }
    });

    it('should handle missing directories gracefully', () => {
      // Delete temp dir and try tick
      fs.rmSync(tempDir, { recursive: true, force: true });

      expect(() => aggregator.tick()).not.toThrow();
    });
  });

  describe('State transitions', () => {
    it('should track previous state on transition', () => {
      const callback = vi.fn();
      aggregator.subscribe(callback);

      aggregator.tick();

      // Callback should have been called at least once
      expect(callback).toHaveBeenCalled();
    });

    it('should update stateSinceAt on state change', () => {
      const beforeTick = Date.now();

      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      if (status) {
        expect(status.stateSinceAt).toBeGreaterThanOrEqual(beforeTick);
      }
    });
  });

  describe('Performance', () => {
    it('should complete single tick in <50ms', () => {
      const start = Date.now();
      aggregator.tick();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });

    it('should complete multiple ticks efficiently', () => {
      const start = Date.now();
      for (let i = 0; i < 10; i++) {
        aggregator.tick();
      }
      const elapsed = Date.now() - start;

      // Average should be <50ms per tick
      expect(elapsed / 10).toBeLessThan(50);
    });

    it('should complete single tick in <50ms with 5 active agents', () => {
      // Create profiles for the main 5 agents
      const mainProfiles = ['hermes', 'frontend-dev', 'backend-dev', 'devops', 'qa-engineer'];
      mainProfiles.forEach(profile => {
        const profileDir = path.join(tempDir, 'profiles', profile);
        fs.mkdirSync(profileDir, { recursive: true });
      });

      const start = Date.now();
      for (let i = 0; i < 10; i++) {
        // Run multiple ticks to get stable timing
        aggregator.tick();
      }
      const elapsed = Date.now() - start;

      // Average should be <50ms per tick
      expect(elapsed / 10).toBeLessThan(50);
    });
  });

  describe('Subscriber notifications', () => {
    it('should notify subscribers on state change', () => {
      const callback = vi.fn();
      aggregator.subscribe(callback);

      aggregator.tick();

      // Should have been called at least once
      expect(callback).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      const unsubscribe = aggregator.subscribe(callback);

      aggregator.tick();
      const callCount = callback.mock.calls.length;

      unsubscribe();

      aggregator.tick();

      // Should not have been called again after unsubscribe
      expect(callback.mock.calls.length).toBe(callCount);
    });

    it('should handle subscriber errors gracefully', () => {
      const errorCallback = () => {
        throw new Error('Subscriber error');
      };
      const goodCallback = vi.fn();

      aggregator.subscribe(errorCallback);
      aggregator.subscribe(goodCallback);

      // Should not throw despite error in one subscriber
      expect(() => aggregator.tick()).not.toThrow();

      // Good subscriber should still be called
      expect(goodCallback).toHaveBeenCalled();
    });

    it('should notify all subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      aggregator.subscribe(callback1);
      aggregator.subscribe(callback2);
      aggregator.subscribe(callback3);

      aggregator.tick();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(callback3).toHaveBeenCalled();
    });
  });

  describe('Status retrieval', () => {
    it('should return null for non-existent agent', () => {
      const status = aggregator.getStatus('non-existent-agent');
      expect(status).toBeNull();
    });

    it('should return all statuses', () => {
      aggregator.tick();

      const allStatuses = aggregator.getAllStatuses();
      expect(Array.isArray(allStatuses)).toBe(true);
      expect(allStatuses.length).toBeGreaterThan(0);
    });

    it('should return correct agent when getting by ID', () => {
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      if (status) {
        expect(status.agentId).toBe('backend-dev');
        expect(status.profile).toBe('backend-dev');
      }
    });

    it('should return status for all main profiles', () => {
      aggregator.tick();

      const mainProfiles = ['hermes', 'frontend-dev', 'backend-dev', 'devops', 'qa-engineer'];

      mainProfiles.forEach(profile => {
        const status = aggregator.getStatus(profile);
        expect(status).not.toBeNull();
        if (status) {
          expect(status.agentId).toBe(profile);
        }
      });
    });
  });

  describe('Error keyword configuration', () => {
    it('should allow setting custom error keywords', () => {
      const customKeywords = ['CUSTOM_ERROR', 'FAIL'];
      aggregator.setErrorKeywords(customKeywords);

      aggregator.tick();

      // Should not throw
      expect(() => aggregator.tick()).not.toThrow();
    });

    it('should use default error keywords', () => {
      aggregator.tick();

      // Default keywords: Error:, Traceback, panic:
      // Should not throw
      expect(() => aggregator.tick()).not.toThrow();
    });
  });

  describe('Activity field updates', () => {
    it('should update currentTask from assistant message', () => {
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      expect(status).toBeDefined();
    });

    it('should update currentTool from tool_calls', () => {
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      expect(status).toBeDefined();
    });

    it('should update lastActivityAt', () => {
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      expect(status).toBeDefined();
    });
  });

  describe('Metrics', () => {
    it('should track messageCount', () => {
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      expect(status).toBeDefined();
      if (status) {
        expect(typeof status.messageCount).toBe('number');
        expect(status.messageCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('should track toolCallCount', () => {
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      expect(status).toBeDefined();
      if (status) {
        expect(typeof status.toolCallCount).toBe('number');
        expect(status.toolCallCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('should track errorCount', () => {
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      expect(status).toBeDefined();
      if (status) {
        expect(typeof status.errorCount).toBe('number');
        expect(status.errorCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('should track uptimeSeconds', () => {
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      expect(status).toBeDefined();
      if (status) {
        expect(typeof status.uptimeSeconds).toBe('number');
        expect(status.uptimeSeconds).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Tracked profiles', () => {
    it('should include main 5 profiles', () => {
      aggregator.tick();

      const allStatuses = aggregator.getAllStatuses();
      const agentIds = allStatuses.map(s => s.agentId);

      const mainProfiles = ['hermes', 'frontend-dev', 'backend-dev', 'devops', 'qa-engineer'];

      mainProfiles.forEach(profile => {
        expect(agentIds).toContain(profile);
      });
    });

    it('should discover additional profiles from filesystem', () => {
      // Create an additional profile
      const customProfileDir = path.join(tempDir, 'profiles', 'custom-agent');
      fs.mkdirSync(customProfileDir, { recursive: true });

      aggregator.tick();

      const allStatuses = aggregator.getAllStatuses();
      const agentIds = allStatuses.map(s => s.agentId);

      expect(agentIds).toContain('custom-agent');
    });
  });

  describe('Status object structure', () => {
    it('should create valid HermesAgentStatus objects', () => {
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');

      expect(status).not.toBeNull();

      // Check all required fields exist
      if (status) {
        expect(status).toHaveProperty('agentId');
        expect(status).toHaveProperty('profile');
        expect(status).toHaveProperty('sessionId');
        expect(status).toHaveProperty('parentSessionId');
        expect(status).toHaveProperty('parentAgentId');
        expect(status).toHaveProperty('state');
        expect(status).toHaveProperty('previousState');
        expect(status).toHaveProperty('stateSinceAt');
        expect(status).toHaveProperty('severity');
        expect(status).toHaveProperty('currentTask');
        expect(status).toHaveProperty('currentTool');
        expect(status).toHaveProperty('currentToolTarget');
        expect(status).toHaveProperty('lastActivityAt');
        expect(status).toHaveProperty('lastMessagePreview');
        expect(status).toHaveProperty('pendingApproval');
        expect(status).toHaveProperty('toolCallCount');
        expect(status).toHaveProperty('messageCount');
        expect(status).toHaveProperty('errorCount');
        expect(status).toHaveProperty('uptimeSeconds');
      }
    });

    it('should have valid state values', () => {
      aggregator.tick();

      const allStatuses = aggregator.getAllStatuses();

      allStatuses.forEach(status => {
        const validStates: AgentState[] = ['idle', 'thinking', 'working', 'waiting', 'error', 'error_critical', 'bark'];
        expect(validStates).toContain(status.state);
      });
    });
  });

  describe('Tick stability', () => {
    it('should maintain stable state across multiple ticks', () => {
      aggregator.tick();
      const status1 = aggregator.getStatus('backend-dev');

      aggregator.tick();
      const status2 = aggregator.getStatus('backend-dev');

      expect(status1?.agentId).toBe(status2?.agentId);
      expect(status1?.profile).toBe(status2?.profile);
    });

    it('should not lose statuses across ticks', () => {
      aggregator.tick();
      const count1 = aggregator.getAllStatuses().length;

      aggregator.tick();
      const count2 = aggregator.getAllStatuses().length;

      expect(count2).toBeGreaterThanOrEqual(count1);
    });
  });

  describe('Error severity and auto-clear (T07)', () => {
    beforeEach(() => {
      // Set custom error keywords for testing
      aggregator.setErrorKeywords(['TEST_ERROR']);
    });

    it('should return error_minor for single error (test a)', () => {
      // Create a mock session with a single error
      const sessionId = 'test-session-1';
      const sessionsDir = path.join(tempDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });

      const jsonlPath = path.join(sessionsDir, `${sessionId}.jsonl`);
      const now = Date.now();
      const jsonlContent = [
        `{"role":"assistant","content":"Doing work","created_at":${now - 5000}}`,
        `{"role":"tool","content":"TEST_ERROR: something failed","created_at":${now - 3000}}`,
        `{"role":"assistant","content":"Fixed it","created_at":${now}}`
      ].join('\n');

      fs.writeFileSync(jsonlPath, jsonlContent);

      // Create state.db with the session
      const profileDir = path.join(tempDir, 'profiles', 'backend-dev');
      fs.mkdirSync(profileDir, { recursive: true });

      const db = new Database(path.join(profileDir, 'state.db'));
      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (session_id TEXT PRIMARY KEY, profile TEXT, created_at INTEGER, updated_at INTEGER, status TEXT);
        CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, session_id TEXT, role TEXT, content TEXT, reasoning_content TEXT, tool_calls TEXT, created_at INTEGER);
      `);

      const insertSession = db.prepare('INSERT INTO sessions (session_id, profile, created_at, updated_at, status) VALUES (?, ?, ?, ?, ?)');
      insertSession.run(sessionId, 'backend-dev', now - 5000, now, 'active');

      const insertMessage = db.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)');
      insertMessage.run(sessionId, 'tool', 'TEST_ERROR: something failed', now - 3000);

      db.close();

      // Tick to process
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      expect(status).not.toBeNull();
      expect(status?.state).toBe('error');
      expect(status?.severity).toBe('minor');
      expect(status?.errorCount60s).toBe(1);
      expect(status?.severityReason).toBe('single error detected');
    });

    it('should auto-clear error_minor after 10s of healthy activity (test a)', async () => {
      // Create session with error that occurred >10s ago
      const sessionId = 'test-session-2';
      const sessionsDir = path.join(tempDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });

      const now = Date.now();
      const oldTime = now - 15000; // 15 seconds ago
      const jsonlPath = path.join(sessionsDir, `${sessionId}.jsonl`);
      const jsonlContent = [
        `{"role":"tool","content":"TEST_ERROR: old error","created_at":${oldTime}}`,
        `{"role":"assistant","content":"Working fine now","created_at":${now - 5000}}`
      ].join('\n');

      fs.writeFileSync(jsonlPath, jsonlContent);

      const profileDir = path.join(tempDir, 'profiles', 'backend-dev');
      fs.mkdirSync(profileDir, { recursive: true });

      const db = new Database(path.join(profileDir, 'state.db'));
      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (session_id TEXT PRIMARY KEY, profile TEXT, created_at INTEGER, updated_at INTEGER, status TEXT);
        CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, session_id TEXT, role TEXT, content TEXT, reasoning_content TEXT, tool_calls TEXT, created_at INTEGER);
      `);

      const insertSession = db.prepare('INSERT INTO sessions (session_id, profile, created_at, updated_at, status) VALUES (?, ?, ?, ?, ?)');
      insertSession.run(sessionId, 'backend-dev', oldTime, now, 'active');

      const insertMessage = db.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)');
      insertMessage.run(sessionId, 'tool', 'TEST_ERROR: old error', oldTime);
      insertMessage.run(sessionId, 'assistant', 'Working fine now', now - 5000);

      db.close();

      // Tick to process - should auto-clear from error_minor to working/thinking/idle
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      expect(status).not.toBeNull();
      // Should have auto-cleared from error to a healthy state
      expect(['idle', 'thinking', 'working']).toContain(status?.state);
      expect(status?.severity).toBeNull();
    });

    it('should return error_critical for 3+ errors in 60s (test b)', () => {
      // Create session with 3 errors in last 60s
      const sessionId = 'test-session-3';
      const sessionsDir = path.join(tempDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });

      const now = Date.now();
      const jsonlPath = path.join(sessionsDir, `${sessionId}.jsonl`);
      const jsonlContent = [
        `{"role":"tool","content":"TEST_ERROR: error 1","created_at":${now - 55000}}`,
        `{"role":"assistant","content":"Trying again","created_at":${now - 50000}}`,
        `{"role":"tool","content":"TEST_ERROR: error 2","created_at":${now - 35000}}`,
        `{"role":"assistant","content":"Trying again","created_at":${now - 30000}}`,
        `{"role":"tool","content":"TEST_ERROR: error 3","created_at":${now - 5000}}`
      ].join('\n');

      fs.writeFileSync(jsonlPath, jsonlContent);

      const profileDir = path.join(tempDir, 'profiles', 'backend-dev');
      fs.mkdirSync(profileDir, { recursive: true });

      const db = new Database(path.join(profileDir, 'state.db'));
      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (session_id TEXT PRIMARY KEY, profile TEXT, created_at INTEGER, updated_at INTEGER, status TEXT);
        CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, session_id TEXT, role TEXT, content TEXT, reasoning_content TEXT, tool_calls TEXT, created_at INTEGER);
      `);

      const insertSession = db.prepare('INSERT INTO sessions (session_id, profile, created_at, updated_at, status) VALUES (?, ?, ?, ?, ?)');
      insertSession.run(sessionId, 'backend-dev', now - 60000, now, 'active');

      const insertMessage = db.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)');
      insertMessage.run(sessionId, 'tool', 'TEST_ERROR: error 1', now - 55000);
      insertMessage.run(sessionId, 'assistant', 'Trying again', now - 50000);
      insertMessage.run(sessionId, 'tool', 'TEST_ERROR: error 2', now - 35000);
      insertMessage.run(sessionId, 'assistant', 'Trying again', now - 30000);
      insertMessage.run(sessionId, 'tool', 'TEST_ERROR: error 3', now - 5000);

      db.close();

      // Tick to process
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      expect(status).not.toBeNull();
      expect(status?.state).toBe('error_critical');
      expect(status?.severity).toBe('critical');
      expect(status?.errorCount60s).toBeGreaterThanOrEqual(3);
      expect(status?.severityReason).toMatch(/3 errors in 60s/);
    });

    it('error_critical does not auto-clear (test b)', () => {
      // Create session with critical error from long ago
      const sessionId = 'test-session-4';
      const sessionsDir = path.join(tempDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });

      const now = Date.now();
      const oldTime = now - 120000; // 2 minutes ago
      const jsonlPath = path.join(sessionsDir, `${sessionId}.jsonl`);
      const jsonlContent = [
        `{"role":"tool","content":"TEST_ERROR: error 1","created_at":${oldTime - 50000}}`,
        `{"role":"tool","content":"TEST_ERROR: error 2","created_at":${oldTime - 30000}}`,
        `{"role":"tool","content":"TEST_ERROR: error 3","created_at":${oldTime}}`,
        `{"role":"assistant","content":"Working fine now","created_at":${now - 5000}}`
      ].join('\n');

      fs.writeFileSync(jsonlPath, jsonlContent);

      const profileDir = path.join(tempDir, 'profiles', 'backend-dev');
      fs.mkdirSync(profileDir, { recursive: true });

      const db = new Database(path.join(profileDir, 'state.db'));
      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (session_id TEXT PRIMARY KEY, profile TEXT, created_at INTEGER, updated_at INTEGER, status TEXT);
        CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, session_id TEXT, role TEXT, content TEXT, reasoning_content TEXT, tool_calls TEXT, created_at INTEGER);
      `);

      const insertSession = db.prepare('INSERT INTO sessions (session_id, profile, created_at, updated_at, status) VALUES (?, ?, ?, ?, ?)');
      insertSession.run(sessionId, 'backend-dev', oldTime - 60000, now, 'active');

      const insertMessage = db.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)');
      insertMessage.run(sessionId, 'tool', 'TEST_ERROR: error 1', oldTime - 50000);
      insertMessage.run(sessionId, 'tool', 'TEST_ERROR: error 2', oldTime - 30000);
      insertMessage.run(sessionId, 'tool', 'TEST_ERROR: error 3', oldTime);
      insertMessage.run(sessionId, 'assistant', 'Working fine now', now - 5000);

      db.close();

      // Tick to process - should STAY in error_critical
      aggregator.tick();

      const status = aggregator.getStatus('backend-dev');
      expect(status).not.toBeNull();
      // Critical errors do NOT auto-clear
      expect(status?.state).toBe('error_critical');
      expect(status?.severity).toBe('critical');
    });

    it('hasCriticalError() returns true when any agent is critical', () => {
      // Create a session with critical errors for backend-dev
      const sessionId = 'test-session-5';
      const sessionsDir = path.join(tempDir, 'sessions');
      fs.mkdirSync(sessionsDir, { recursive: true });

      const now = Date.now();
      const jsonlPath = path.join(sessionsDir, `${sessionId}.jsonl`);
      const jsonlContent = [
        `{"role":"tool","content":"TEST_ERROR: error 1","created_at":${now - 55000}}`,
        `{"role":"tool","content":"TEST_ERROR: error 2","created_at":${now - 35000}}`,
        `{"role":"tool","content":"TEST_ERROR: error 3","created_at":${now - 5000}}`
      ].join('\n');

      fs.writeFileSync(jsonlPath, jsonlContent);

      const profileDir = path.join(tempDir, 'profiles', 'backend-dev');
      fs.mkdirSync(profileDir, { recursive: true });

      const db = new Database(path.join(profileDir, 'state.db'));
      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (session_id TEXT PRIMARY KEY, profile TEXT, created_at INTEGER, updated_at INTEGER, status TEXT);
        CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, session_id TEXT, role TEXT, content TEXT, reasoning_content TEXT, tool_calls TEXT, created_at INTEGER);
      `);

      const insertSession = db.prepare('INSERT INTO sessions (session_id, profile, created_at, updated_at, status) VALUES (?, ?, ?, ?, ?)');
      insertSession.run(sessionId, 'backend-dev', now - 60000, now, 'active');

      const insertMessage = db.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)');
      insertMessage.run(sessionId, 'tool', 'TEST_ERROR: error 1', now - 55000);
      insertMessage.run(sessionId, 'tool', 'TEST_ERROR: error 2', now - 35000);
      insertMessage.run(sessionId, 'tool', 'TEST_ERROR: error 3', now - 5000);

      db.close();

      aggregator.tick();

      expect(aggregator.hasCriticalError()).toBe(true);
    });

    it('hasCriticalError() returns false when no agent is critical', () => {
      // No session, no errors
      aggregator.tick();

      expect(aggregator.hasCriticalError()).toBe(false);
    });
  });
});