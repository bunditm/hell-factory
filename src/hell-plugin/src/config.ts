import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface StateThresholds {
  idleTimeoutMs: number;
  workingToThinkingMs: number;
  errorMinorAutoClearMs: number;
  errorCriticalThreshold: number;
  errorCriticalWindowMs: number;
}

export interface SseConfig {
  port: number;
  host: string;
  maxConnections: number;
}

export interface BarkConfig {
  enabled: boolean;
  intervalMinutes: number;
}

export interface ActivityLogConfig {
  maxEntries: number;
  keepRecentForHealth: number;
}

export interface MonitoringConfig {
  pollingIntervalMs: number;
  sse: SseConfig;
  trackedProfiles: string[];
  errorKeywords: string[];
  stateThresholds: StateThresholds;
  bark: BarkConfig;
  activityLog: ActivityLogConfig;
}

const DEFAULT_CONFIG: MonitoringConfig = {
  pollingIntervalMs: 500,
  sse: {
    port: 3002,
    host: '127.0.0.1',
    maxConnections: 5,
  },
  trackedProfiles: ['hermes', 'frontend-dev', 'backend-dev', 'devops', 'qa-engineer'],
  errorKeywords: ['Error:', 'Traceback', 'panic:', 'FATAL'],
  stateThresholds: {
    idleTimeoutMs: 60000,
    workingToThinkingMs: 3000,
    errorMinorAutoClearMs: 10000,
    errorCriticalThreshold: 3,
    errorCriticalWindowMs: 60000,
  },
  bark: {
    enabled: true,
    intervalMinutes: 5,
  },
  activityLog: {
    maxEntries: 1000,
    keepRecentForHealth: 100,
  },
};

export function loadConfig(configPath?: string): MonitoringConfig {
  const resolvedPath = configPath || path.join(__dirname, '../config/default.yaml');

  try {
    const fileContents = fs.readFileSync(resolvedPath, 'utf8');
    const loadedConfig = yaml.load(fileContents) as Partial<MonitoringConfig>;

    // Merge with defaults (deep merge)
    const config: MonitoringConfig = {
      pollingIntervalMs: loadedConfig.pollingIntervalMs ?? DEFAULT_CONFIG.pollingIntervalMs,
      sse: { ...DEFAULT_CONFIG.sse, ...loadedConfig.sse },
      trackedProfiles: loadedConfig.trackedProfiles ?? DEFAULT_CONFIG.trackedProfiles,
      errorKeywords: loadedConfig.errorKeywords ?? DEFAULT_CONFIG.errorKeywords,
      stateThresholds: { ...DEFAULT_CONFIG.stateThresholds, ...loadedConfig.stateThresholds },
      bark: { ...DEFAULT_CONFIG.bark, ...loadedConfig.bark },
      activityLog: { ...DEFAULT_CONFIG.activityLog, ...loadedConfig.activityLog },
    };

    // Security check: ensure host is 127.0.0.1 only
    if (config.sse.host !== '127.0.0.1') {
      throw new Error(`Security violation: SSE host must be "127.0.0.1", got "${config.sse.host}"`);
    }

    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`Config file not found at ${resolvedPath}, using defaults`);
      return DEFAULT_CONFIG;
    }
    throw error;
  }
}

export default loadConfig;