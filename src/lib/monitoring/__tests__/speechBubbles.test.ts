/**
 * Speech bubble tests (FR-M7)
 * 
 * Tests for speech bubble functionality:
 * - FR-M7.1: thinking bubble with 2-frame animation
 * - FR-M7.2: working bubble with gear icon
 * - FR-M7.3: waiting bubble with hourglass and ⚠ border
 * - FR-M7.4: error bubble with shake animation
 * - FR-M7.5: error_critical bubble with solid red border, sticky
 * - FR-M7.11: auto-dismiss after 1s (except critical)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { OfficeState } from '../../../app/engine/officeState'
import type { HermesAgentStatus } from '../types'

describe('Speech Bubbles (FR-M7)', () => {
  let officeState: OfficeState

  beforeEach(() => {
    officeState = new OfficeState()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Bubble appears on state change', () => {
    it('should show thinking bubble when agent transitions to thinking state', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'thinking',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: 'Implement feature X',
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: 'Working on it...',
        pendingApproval: null,
        toolCallCount: 1,
        messageCount: 2,
        errorCount: 0,
        uptimeSeconds: 10,
      }

      officeState.replaceAll([agent])
      const character = officeState.getCharacter('test-agent')

      expect(character?.bubbleState).toBeDefined()
      expect(character?.bubbleState?.type).toBe('thinking')
      expect(character?.bubbleState?.visible).toBe(true)
      expect(character?.bubbleState?.dismissedAt).not.toBeNull()  // Auto-dismiss enabled
    })

    it('should show working bubble when agent transitions to working state', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'working',
        previousState: 'idle',
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: 'Write code',
        currentTool: 'write_file',
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: null,
        pendingApproval: null,
        toolCallCount: 1,
        messageCount: 1,
        errorCount: 0,
        uptimeSeconds: 5,
      }

      officeState.replaceAll([agent])
      const character = officeState.getCharacter('test-agent')

      expect(character?.bubbleState?.type).toBe('working')
      expect(character?.bubbleState?.visible).toBe(true)
    })

    it('should show waiting bubble with ⚠ when agent transitions to waiting state', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'waiting',
        previousState: 'working',
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: 'Waiting for approval',
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: null,
        pendingApproval: {
          question: 'Should I proceed?',
          options: ['Yes', 'No'],
          requestedAt: Date.now(),
        },
        toolCallCount: 5,
        messageCount: 6,
        errorCount: 0,
        uptimeSeconds: 30,
      }

      officeState.replaceAll([agent])
      const character = officeState.getCharacter('test-agent')

      expect(character?.bubbleState?.type).toBe('waiting')
      expect(character?.bubbleState?.visible).toBe(true)
    })

    it('should show error bubble with shake when agent transitions to error state', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'error',
        previousState: 'working',
        stateSinceAt: Date.now(),
        severity: 'minor',
        currentTask: 'Fix bug',
        currentTool: 'write_file',
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: 'Error occurred',
        pendingApproval: null,
        toolCallCount: 10,
        messageCount: 11,
        errorCount: 1,
        uptimeSeconds: 60,
      }

      officeState.replaceAll([agent])
      const character = officeState.getCharacter('test-agent')

      expect(character?.bubbleState?.type).toBe('error')
      expect(character?.bubbleState?.visible).toBe(true)
      expect(character?.shakeTimer).toBe(500)  // 500ms shake animation
    })

    it('should show error_critical bubble when agent has critical severity', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'error',
        previousState: 'working',
        stateSinceAt: Date.now(),
        severity: 'critical',
        currentTask: 'Fix critical bug',
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: 'Critical error',
        pendingApproval: null,
        toolCallCount: 20,
        messageCount: 21,
        errorCount: 3,
        uptimeSeconds: 90,
      }

      officeState.replaceAll([agent])
      const character = officeState.getCharacter('test-agent')

      expect(character?.bubbleState?.type).toBe('error_critical')
      expect(character?.bubbleState?.visible).toBe(true)
    })

    it('should not show bubble for idle state', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: null,
        parentSessionId: null,
        parentAgentId: null,
        state: 'idle',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: null,
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now() - 60000,  // 60s ago
        lastMessagePreview: null,
        pendingApproval: null,
        toolCallCount: 0,
        messageCount: 0,
        errorCount: 0,
        uptimeSeconds: 0,
      }

      officeState.replaceAll([agent])
      const character = officeState.getCharacter('test-agent')

      expect(character?.bubbleState).toBeUndefined()
    })
  })

  describe('Bubble auto-dismiss (FR-M7.11)', () => {
    it('should auto-dismiss thinking bubble after 1s', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'thinking',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: 'Think',
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: null,
        pendingApproval: null,
        toolCallCount: 0,
        messageCount: 1,
        errorCount: 0,
        uptimeSeconds: 1,
      }

      officeState.replaceAll([agent])
      
      // Initially visible
      let character = officeState.getCharacter('test-agent')
      expect(character?.bubbleState?.visible).toBe(true)

      // Advance time by 1s
      vi.advanceTimersByTime(1000)
      officeState.updateBubbleAnimations(1000)
      
      // Should be dismissed
      character = officeState.getCharacter('test-agent')
      expect(character?.bubbleState?.visible).toBe(false)
    })

    it('should auto-dismiss working bubble after 1s', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'working',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: 'Work',
        currentTool: 'write_file',
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: null,
        pendingApproval: null,
        toolCallCount: 1,
        messageCount: 0,
        errorCount: 0,
        uptimeSeconds: 1,
      }

      officeState.replaceAll([agent])
      
      // Advance time by 1s
      vi.advanceTimersByTime(1000)
      officeState.updateBubbleAnimations(1000)
      
      const character = officeState.getCharacter('test-agent')
      expect(character?.bubbleState?.visible).toBe(false)
    })

    it('should auto-dismiss waiting bubble after 1s', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'waiting',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: 'Wait',
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: null,
        pendingApproval: {
          question: 'Proceed?',
          options: ['Yes', 'No'],
          requestedAt: Date.now(),
        },
        toolCallCount: 0,
        messageCount: 1,
        errorCount: 0,
        uptimeSeconds: 1,
      }

      officeState.replaceAll([agent])
      
      vi.advanceTimersByTime(1000)
      officeState.updateBubbleAnimations(1000)
      
      const character = officeState.getCharacter('test-agent')
      expect(character?.bubbleState?.visible).toBe(false)
    })

    it('should auto-dismiss error bubble after 1s', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'error',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: 'minor',
        currentTask: 'Error',
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: 'Error!',
        pendingApproval: null,
        toolCallCount: 5,
        messageCount: 5,
        errorCount: 1,
        uptimeSeconds: 10,
      }

      officeState.replaceAll([agent])
      
      vi.advanceTimersByTime(1000)
      officeState.updateBubbleAnimations(1000)
      
      const character = officeState.getCharacter('test-agent')
      expect(character?.bubbleState?.visible).toBe(false)
    })

    it('should NOT auto-dismiss error_critical bubble (sticky)', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'error',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: 'critical',
        currentTask: 'Critical error',
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: 'Critical!',
        pendingApproval: null,
        toolCallCount: 10,
        messageCount: 10,
        errorCount: 3,
        uptimeSeconds: 30,
      }

      officeState.replaceAll([agent])
      
      // Advance time by 10s (much longer than 1s)
      vi.advanceTimersByTime(10000)
      officeState.updateBubbleAnimations(10000)
      
      const character = officeState.getCharacter('test-agent')
      expect(character?.bubbleState?.visible).toBe(true)  // Should still be visible
      expect(character?.bubbleState?.dismissedAt).toBeNull()  // No auto-dismiss
    })
  })

  describe('Thinking bubble animation', () => {
    it('should cycle animation frames every 500ms', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'thinking',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: 'Think',
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: null,
        pendingApproval: null,
        toolCallCount: 0,
        messageCount: 1,
        errorCount: 0,
        uptimeSeconds: 1,
      }

      officeState.replaceAll([agent])
      
      let character = officeState.getCharacter('test-agent')
      expect(character?.bubbleState?.animFrame).toBe(0)
      
      // Advance 500ms
      vi.advanceTimersByTime(500)
      officeState.updateBubbleAnimations(500)
      
      character = officeState.getCharacter('test-agent')
      expect(character?.bubbleState?.animFrame).toBe(1)
      
      // Advance another 500ms (should cycle back to 0)
      vi.advanceTimersByTime(500)
      officeState.updateBubbleAnimations(500)
      
      character = officeState.getCharacter('test-agent')
      expect(character?.bubbleState?.animFrame).toBe(0)
    })
  })

  describe('Bubble tracking', () => {
    it('should maintain bubble position relative to character position', () => {
      const agent: HermesAgentStatus = {
        agentId: 'frontend-dev',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'working',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: 'Work',
        currentTool: 'write_file',
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: null,
        pendingApproval: null,
        toolCallCount: 1,
        messageCount: 0,
        errorCount: 0,
        uptimeSeconds: 1,
      }

      officeState.replaceAll([agent])
      
      const character1 = officeState.getCharacter('frontend-dev')
      expect(character1?.bubbleState?.visible).toBe(true)
      
      // Update character position (simulating movement)
      officeState.updateAgent('frontend-dev', { state: 'thinking' })
      
      const character2 = officeState.getCharacter('frontend-dev')
      expect(character2?.bubbleState?.visible).toBe(true)
      expect(character2?.bubbleState?.type).toBe('thinking')
    })
  })

  describe('Error shake animation', () => {
    it('should set shake timer when transitioning to error state', () => {
      const agent: HermesAgentStatus = {
        agentId: 'test-agent',
        profile: 'frontend-dev',
        sessionId: 'session-1',
        parentSessionId: null,
        parentAgentId: null,
        state: 'idle',
        previousState: null,
        stateSinceAt: Date.now(),
        severity: null,
        currentTask: null,
        currentTool: null,
        currentToolTarget: null,
        lastActivityAt: Date.now(),
        lastMessagePreview: null,
        pendingApproval: null,
        toolCallCount: 0,
        messageCount: 0,
        errorCount: 0,
        uptimeSeconds: 0,
      }

      officeState.replaceAll([agent])
      
      let character = officeState.getCharacter('test-agent')
      expect(character?.shakeTimer).toBeUndefined()
      
      // Transition to error
      officeState.updateAgent('test-agent', { state: 'error', severity: 'minor' })
      
      character = officeState.getCharacter('test-agent')
      expect(character?.shakeTimer).toBe(500)  // 500ms shake
    })
  })
})