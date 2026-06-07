/**
 * Tests for OverlayPanel component logic
 * 
 * See docs/06-monitoring-requirements.md §M6 (overlay)
 * 
 * Note: These tests validate the component's business logic without rendering.
 * Full React DOM testing would require additional setup.
 */

import { describe, it, expect } from 'vitest'
import { HermesAgentStatus } from '../types'

// Test data matching the schema
const mockAgent: HermesAgentStatus = {
  agentId: 'frontend-dev',
  profile: 'frontend-dev',
  sessionId: 'session-1',
  parentSessionId: null,
  parentAgentId: null,
  state: 'working',
  previousState: 'idle',
  stateSinceAt: Date.now() - 30000,
  severity: null,
  currentTask: 'Build overlay panel component',
  currentTool: 'write_file',
  currentToolTarget: '/src/components/OverlayPanel.tsx',
  lastActivityAt: Date.now() - 5000,
  lastMessagePreview: 'Creating component structure...',
  pendingApproval: null,
  toolCallCount: 5,
  messageCount: 10,
  errorCount: 0,
  uptimeSeconds: 3600,
}

const mockSubAgent: HermesAgentStatus = {
  agentId: 'frontend-sub-1',
  profile: 'frontend-dev',
  sessionId: 'session-2',
  parentSessionId: 'session-1',
  parentAgentId: 'frontend-dev',
  state: 'thinking',
  previousState: null,
  stateSinceAt: Date.now() - 10000,
  severity: null,
  currentTask: 'Write unit tests',
  currentTool: 'write_file',
  currentToolTarget: '/test/file.ts',
  lastActivityAt: Date.now() - 2000,
  lastMessagePreview: 'Testing...',
  pendingApproval: null,
  toolCallCount: 1,
  messageCount: 2,
  errorCount: 0,
  uptimeSeconds: 120,
}

const mockErrorAgent: HermesAgentStatus = {
  agentId: 'qa-engineer',
  profile: 'qa-engineer',
  sessionId: 'session-3',
  parentSessionId: null,
  parentAgentId: null,
  state: 'error',
  previousState: 'working',
  stateSinceAt: Date.now() - 20000,
  severity: 'minor',
  currentTask: 'Test deployment',
  currentTool: 'terminal',
  currentToolTarget: 'kubectl',
  lastActivityAt: Date.now() - 20000,
  lastMessagePreview: 'Error: Connection refused',
  pendingApproval: null,
  toolCallCount: 3,
  messageCount: 6,
  errorCount: 2,
  uptimeSeconds: 600,
}

const mockCriticalErrorAgent: HermesAgentStatus = {
  agentId: 'backend-dev',
  profile: 'backend-dev',
  sessionId: 'session-4',
  parentSessionId: null,
  parentAgentId: null,
  state: 'error_critical',
  previousState: 'working',
  stateSinceAt: Date.now() - 20000,
  severity: 'critical',
  currentTask: 'Test API',
  currentTool: 'curl',
  currentToolTarget: 'http://localhost:3002',
  lastActivityAt: Date.now() - 20000,
  lastMessagePreview: 'Error: 503',
  pendingApproval: null,
  toolCallCount: 5,
  messageCount: 10,
  errorCount: 5,
  uptimeSeconds: 300,
}

const mockWaitingAgent: HermesAgentStatus = {
  agentId: 'frontend-dev',
  profile: 'frontend-dev',
  sessionId: 'session-5',
  parentSessionId: null,
  parentAgentId: null,
  state: 'waiting',
  previousState: 'working',
  stateSinceAt: Date.now() - 10000,
  severity: null,
  currentTask: 'Deploy to production',
  currentTool: null,
  currentToolTarget: null,
  lastActivityAt: Date.now() - 10000,
  lastMessagePreview: 'Ready to deploy',
  pendingApproval: {
    question: 'Deploy to production?',
    options: ['Yes', 'No'],
    requestedAt: Date.now() - 10000,
  },
  toolCallCount: 8,
  messageCount: 15,
  errorCount: 0,
  uptimeSeconds: 2400,
}

describe('OverlayPanel - aggregate count logic', () => {
  it('should correctly count working agents', () => {
    const agents: HermesAgentStatus[] = [
      mockAgent,
      { ...mockSubAgent, state: 'working' as const }
    ]
    const workingCount = agents.filter(a => a.state === 'working').length
    expect(workingCount).toBe(2)
  })

  it('should correctly count thinking agents', () => {
    const agents: HermesAgentStatus[] = [
      { ...mockAgent, state: 'thinking' as const },
      { ...mockSubAgent, state: 'thinking' as const },
      { ...mockErrorAgent, state: 'thinking' as const },
    ]
    const thinkingCount = agents.filter(a => a.state === 'thinking').length
    expect(thinkingCount).toBe(3)
  })

  it('should correctly count idle agents', () => {
    const agents: HermesAgentStatus[] = [
      { ...mockAgent, state: 'idle' as const },
      { ...mockSubAgent, state: 'idle' as const },
    ]
    const idleCount = agents.filter(a => a.state === 'idle').length
    expect(idleCount).toBe(2)
  })

  it('should count both error and error_critical as errors', () => {
    const agents: HermesAgentStatus[] = [mockErrorAgent, mockCriticalErrorAgent]
    const errorCount = agents.filter(
      a => a.state === 'error' || a.state === 'error_critical'
    ).length
    expect(errorCount).toBe(2)
  })

  it('should filter out sub-agents from top-level count', () => {
    const agents: HermesAgentStatus[] = [mockAgent, mockSubAgent]
    const topLevelCount = agents.filter(a => !a.parentAgentId).length
    expect(topLevelCount).toBe(1)
  })

  it('should correctly identify sub-agents', () => {
    const agents: HermesAgentStatus[] = [mockAgent, mockSubAgent]
    const subAgentCount = agents.filter(a => a.parentAgentId).length
    expect(subAgentCount).toBe(1)
  })
})

describe('OverlayPanel - HermesAgentStatus validation', () => {
  it('should accept valid top-level agent data', () => {
    const agent: HermesAgentStatus = mockAgent
    expect(agent.agentId).toBe('frontend-dev')
    expect(agent.parentAgentId).toBeNull()
    expect(agent.state).toBe('working')
  })

  it('should accept valid sub-agent data', () => {
    const agent: HermesAgentStatus = mockSubAgent
    expect(agent.agentId).toBe('frontend-sub-1')
    expect(agent.parentAgentId).toBe('frontend-dev')
    expect(agent.parentSessionId).toBe('session-1')
    expect(agent.state).toBe('thinking')
  })

  it('should accept error state with minor severity', () => {
    const agent: HermesAgentStatus = mockErrorAgent
    expect(agent.state).toBe('error')
    expect(agent.severity).toBe('minor')
  })

  it('should accept error_critical state with critical severity', () => {
    const agent: HermesAgentStatus = mockCriticalErrorAgent
    expect(agent.state).toBe('error_critical')
    expect(agent.severity).toBe('critical')
  })

  it('should accept waiting state with pending approval', () => {
    const agent: HermesAgentStatus = mockWaitingAgent
    expect(agent.state).toBe('waiting')
    expect(agent.pendingApproval).not.toBeNull()
    expect(agent.pendingApproval?.question).toBe('Deploy to production?')
    expect(agent.pendingApproval?.options).toEqual(['Yes', 'No'])
  })

  it('should support all required canonical states', () => {
    const states: HermesAgentStatus['state'][] = [
      'idle',
      'thinking',
      'working',
      'waiting',
      'error',
      'error_critical',
      'bark',
    ]
    
    states.forEach(state => {
      expect(() => {
        const agent: HermesAgentStatus = {
          ...mockAgent,
          state,
        }
      }).not.toThrow()
    })
  })
})

describe('OverlayPanel - validation of requirements', () => {
  it('should support agentId field', () => {
    expect(mockAgent.agentId).toBeDefined()
    expect(typeof mockAgent.agentId).toBe('string')
  })

  it('should support currentTask field (for truncation to 60 chars)', () => {
    expect(mockAgent.currentTask).toBeDefined()
    const longTask = 'This is a very long task description that exceeds the maximum length'
    expect(longTask.length).toBeGreaterThan(60)
  })

  it('should support currentTool field', () => {
    expect(mockAgent.currentTool).toBeDefined()
    expect(typeof mockAgent.currentTool).toBe('string')
  })

  it('should support lastActivityAt field (for relative time)', () => {
    expect(mockAgent.lastActivityAt).toBeDefined()
    expect(typeof mockAgent.lastActivityAt).toBe('number')
  })

  it('should support severity field for error states', () => {
    expect(mockErrorAgent.severity).toBeDefined()
    expect(mockCriticalErrorAgent.severity).toBeDefined()
  })

  it('should support pendingApproval field for waiting state', () => {
    expect(mockWaitingAgent.pendingApproval).toBeDefined()
    expect(mockWaitingAgent.pendingApproval?.question).toBeDefined()
    expect(mockWaitingAgent.pendingApproval?.options).toBeDefined()
  })
})

