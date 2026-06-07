/**
 * Tests for officeState.ts — SSE store → canvas state bridge
 * 
 * See task T11 §STEPS #9 (a-e):
 * a) snapshot triggers replaceAll
 * b) single update triggers updateAgent
 * c) sub-agent shadow appears on sub_agent_spawned
 * d) sub-agent shadow disappears within 1s of sub_agent_completed
 * e) canvas only re-renders when state actually changes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OfficeState } from '../officeState'
import type { HermesAgentStatus } from '../../../lib/monitoring/types'

describe('OfficeState', () => {
  let officeState: OfficeState

  beforeEach(() => {
    officeState = new OfficeState()
  })

  describe('snapshot handling (test #a)', () => {
    it('should replace all characters with snapshot', () => {
      const agents: HermesAgentStatus[] = [
        {
          agentId: 'frontend-dev',
          profile: 'frontend-dev',
          sessionId: 's1',
          parentSessionId: null,
          parentAgentId: null,
          state: 'working',
          previousState: null,
          stateSinceAt: Date.now(),
          severity: null,
          currentTask: 'Build UI component',
          currentTool: 'write_file',
          currentToolTarget: null,
          lastActivityAt: Date.now(),
          lastMessagePreview: 'Building...',
          pendingApproval: null,
          toolCallCount: 5,
          messageCount: 10,
          errorCount: 0,
          uptimeSeconds: 100,
        },
        {
          agentId: 'backend-dev',
          profile: 'backend-dev',
          sessionId: 's2',
          parentSessionId: null,
          parentAgentId: null,
          state: 'thinking',
          previousState: null,
          stateSinceAt: Date.now(),
          severity: null,
          currentTask: 'Design API schema',
          currentTool: null,
          currentToolTarget: null,
          lastActivityAt: Date.now(),
          lastMessagePreview: 'Designing...',
          pendingApproval: null,
          toolCallCount: 2,
          messageCount: 5,
          errorCount: 0,
          uptimeSeconds: 100,
        },
      ]

      const versionBefore = officeState.getVersion()
      officeState.replaceAll(agents)
      const versionAfter = officeState.getVersion()

      expect(versionAfter).toBeGreaterThan(versionBefore)
      expect(officeState.getAllCharacters()).toHaveLength(2)
      
      const frontendDev = officeState.getCharacter('frontend-dev')
      expect(frontendDev).toBeTruthy()
      expect(frontendDev?.state).toBe('working')
      expect(frontendDev?.currentTool).toBe('write_file')
      
      const backendDev = officeState.getCharacter('backend-dev')
      expect(backendDev).toBeTruthy()
      expect(backendDev?.state).toBe('thinking')
    })

    it('should clear existing characters on new snapshot', () => {
      // Add initial characters
      officeState.replaceAll([
        createMockAgent('frontend-dev', 'working'),
        createMockAgent('backend-dev', 'thinking'),
      ])
      
      expect(officeState.getAllCharacters()).toHaveLength(2)

      // Replace with new snapshot
      officeState.replaceAll([
        createMockAgent('hermes', 'idle'),
      ])

      expect(officeState.getAllCharacters()).toHaveLength(1)
      expect(officeState.getCharacter('frontend-dev')).toBeNull()
      expect(officeState.getCharacter('hermes')).toBeTruthy()
    })
  })

  describe('single agent update (test #b)', () => {
    it('should update existing character', () => {
      // Initial state
      officeState.replaceAll([
        createMockAgent('frontend-dev', 'working', 'write_file'),
      ])

      const versionBefore = officeState.getVersion()
      
      // Update agent state
      officeState.updateAgent('frontend-dev', {
        state: 'thinking',
        currentTool: null,
        severity: null,
      })

      const versionAfter = officeState.getVersion()
      expect(versionAfter).toBeGreaterThan(versionBefore)

      const char = officeState.getCharacter('frontend-dev')
      expect(char?.state).toBe('thinking')
      expect(char?.currentTool).toBeNull()
    })

    it('should create new character if not exists', () => {
      officeState.updateAgent('new-agent', {
        agentId: 'new-agent',
        state: 'idle',
        severity: null,
      } as HermesAgentStatus)

      expect(officeState.getCharacter('new-agent')).toBeTruthy()
      expect(officeState.getCharacter('new-agent')?.state).toBe('idle')
    })

    it('should set shake timer on error state', () => {
      officeState.replaceAll([
        createMockAgent('frontend-dev', 'working'),
      ])

      officeState.updateAgent('frontend-dev', {
        state: 'error',
        severity: 'minor',
      })

      const char = officeState.getCharacter('frontend-dev')
      expect(char?.shakeTimer).toBe(500)
    })

    it('should set shake timer on critical error', () => {
      officeState.replaceAll([
        createMockAgent('frontend-dev', 'working'),
      ])

      officeState.updateAgent('frontend-dev', {
        state: 'error_critical',
        severity: 'critical',
      })

      const char = officeState.getCharacter('frontend-dev')
      expect(char?.shakeTimer).toBe(500)
    })
  })

  describe('agent removal', () => {
    it('should remove character', () => {
      officeState.replaceAll([
        createMockAgent('frontend-dev', 'working'),
        createMockAgent('backend-dev', 'thinking'),
      ])

      const versionBefore = officeState.getVersion()
      officeState.removeAgent('frontend-dev')
      const versionAfter = officeState.getVersion()

      expect(versionAfter).toBeGreaterThan(versionBefore)
      expect(officeState.getCharacter('frontend-dev')).toBeNull()
      expect(officeState.getCharacter('backend-dev')).toBeTruthy()
    })

    it('should not increment version if agent does not exist', () => {
      const versionBefore = officeState.getVersion()
      officeState.removeAgent('nonexistent')
      const versionAfter = officeState.getVersion()

      expect(versionAfter).toBe(versionBefore)
    })
  })

  describe('sub-agent handling (test #c)', () => {
    it('should add sub-agent shadow when spawned', () => {
      officeState.replaceAll([
        createMockAgent('frontend-dev', 'working'),
      ])

      const versionBefore = officeState.getVersion()
      
      const subAgent: HermesAgentStatus = {
        ...createMockAgent('sub-agent-1', 'thinking'),
        agentId: 'sub-agent-1',
        sessionId: 'sub-s1',
        parentSessionId: 's1',
        parentAgentId: 'frontend-dev',
      }

      officeState.addSubAgent('frontend-dev', subAgent)
      const versionAfter = officeState.getVersion()

      expect(versionAfter).toBeGreaterThan(versionBefore)

      const parent = officeState.getCharacter('frontend-dev')
      expect(parent?.subAgents.size).toBe(1)
      
      const subAgentInfo = parent?.subAgents.get('sub-s1')
      expect(subAgentInfo).toBeTruthy()
      expect(subAgentInfo?.state).toBe('thinking')
      expect(subAgentInfo?.spawnedAt).toBeGreaterThan(0)
      expect(subAgentInfo?.completedAt).toBeNull()
    })

    it('should position sub-agents in arc around parent', () => {
      officeState.replaceAll([
        createMockAgent('frontend-dev', 'working'),
      ])

      // Add multiple sub-agents
      officeState.addSubAgent('frontend-dev', {
        ...createMockAgent('sub-1', 'working'),
        sessionId: 's1',
        parentSessionId: 'parent-s1',
        parentAgentId: 'frontend-dev',
      })

      officeState.addSubAgent('frontend-dev', {
        ...createMockAgent('sub-2', 'thinking'),
        sessionId: 's2',
        parentSessionId: 'parent-s1',
        parentAgentId: 'frontend-dev',
      })

      const parent = officeState.getCharacter('frontend-dev')
      const subAgents = Array.from(parent?.subAgents.values() || [])

      expect(subAgents).toHaveLength(2)
      
      // First sub-agent should be at left side of arc
      expect(subAgents[0].angle).toBeLessThan(0)
      
      // Second sub-agent should be at right side of arc
      expect(subAgents[1].angle).toBeGreaterThan(subAgents[0].angle)
    })
  })

  describe('sub-agent removal (test #d)', () => {
    it('should mark sub-agent as completed', () => {
      officeState.replaceAll([
        createMockAgent('frontend-dev', 'working'),
      ])

      officeState.addSubAgent('frontend-dev', {
        ...createMockAgent('sub-1', 'working'),
        sessionId: 's1',
        parentSessionId: 'parent-s1',
        parentAgentId: 'frontend-dev',
      })

      const versionBefore = officeState.getVersion()
      officeState.completeSubAgent('frontend-dev', 's1')
      const versionAfter = officeState.getVersion()

      expect(versionAfter).toBeGreaterThan(versionBefore)

      const parent = officeState.getCharacter('frontend-dev')
      const subAgent = parent?.subAgents.get('s1')
      expect(subAgent?.completedAt).toBeGreaterThan(0)
    })

    it('should remove completed sub-agents after 1s grace period', () => {
      vi.useFakeTimers()
      
      officeState.replaceAll([
        createMockAgent('frontend-dev', 'working'),
      ])

      officeState.addSubAgent('frontend-dev', {
        ...createMockAgent('sub-1', 'working'),
        sessionId: 's1',
        parentSessionId: 'parent-s1',
        parentAgentId: 'frontend-dev',
      })

      officeState.completeSubAgent('frontend-dev', 's1')

      // Immediately after completion, sub-agent should still exist
      expect(officeState.getCharacter('frontend-dev')?.subAgents.size).toBe(1)

      // Advance time by 500ms — still within grace period
      vi.advanceTimersByTime(500)
      officeState.tick(500)
      expect(officeState.getCharacter('frontend-dev')?.subAgents.size).toBe(1)

      // Advance time by 600ms total (over 1s) — should be removed
      vi.advanceTimersByTime(600)
      const removed = officeState.tick(600)
      expect(removed).toBe(true)
      expect(officeState.getCharacter('frontend-dev')?.subAgents.size).toBe(0)

      vi.useRealTimers()
    })

    it('should not remove sub-agents before grace period', () => {
      vi.useFakeTimers()
      
      officeState.replaceAll([
        createMockAgent('frontend-dev', 'working'),
      ])

      officeState.addSubAgent('frontend-dev', {
        ...createMockAgent('sub-1', 'working'),
        sessionId: 's1',
        parentSessionId: 'parent-s1',
        parentAgentId: 'frontend-dev',
      })

      officeState.completeSubAgent('frontend-dev', 's1')

      // Tick within grace period — should not remove
      vi.advanceTimersByTime(500)
      const removed = officeState.tick(500)
      expect(removed).toBe(false)
      expect(officeState.getCharacter('frontend-dev')?.subAgents.size).toBe(1)

      vi.useRealTimers()
    })
  })

  describe('state change detection (test #e)', () => {
    it('should increment version on snapshot', () => {
      const versionBefore = officeState.getVersion()
      officeState.replaceAll([createMockAgent('frontend-dev', 'working')])
      const versionAfter = officeState.getVersion()

      expect(versionAfter).toBeGreaterThan(versionBefore)
    })

    it('should increment version on update', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'working')])
      const versionBefore = officeState.getVersion()
      
      officeState.updateAgent('frontend-dev', {
        state: 'thinking',
        severity: null,
      })

      const versionAfter = officeState.getVersion()
      expect(versionAfter).toBeGreaterThan(versionBefore)
    })

    it('should increment version on removal', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'working')])
      const versionBefore = officeState.getVersion()
      
      officeState.removeAgent('frontend-dev')

      const versionAfter = officeState.getVersion()
      expect(versionAfter).toBeGreaterThan(versionBefore)
    })

    it('should not increment version on no-op tick', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'working')])
      const versionBefore = officeState.getVersion()
      
      // Tick without any changes
      const changed = officeState.tick(16)
      
      const versionAfter = officeState.getVersion()
      expect(changed).toBe(false)
      expect(versionAfter).toBe(versionBefore)
    })

    it('should increment version on tick with shake timer decrement', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'error')])
      const versionBefore = officeState.getVersion()
      
      // Tick with shake timer active
      const changed = officeState.tick(100)
      
      const versionAfter = officeState.getVersion()
      expect(changed).toBe(true)
      expect(versionAfter).toBeGreaterThan(versionBefore)
    })
  })

  describe('tick animation', () => {
    it('should decrement shake timer', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'error')])
      
      const charBefore = officeState.getCharacter('frontend-dev')
      const shakeBefore = charBefore?.shakeTimer ?? 0
      
      officeState.tick(100)
      
      const charAfter = officeState.getCharacter('frontend-dev')
      const shakeAfter = charAfter?.shakeTimer ?? 0
      
      expect(shakeAfter).toBe(shakeBefore - 100)
    })

    it('should remove shake timer when reaches zero', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'error')])
      
      // Tick past shake timer (500ms + extra)
      officeState.tick(600)
      
      const char = officeState.getCharacter('frontend-dev')
      // shakeTimer should be undefined after being removed
      expect(char?.shakeTimer).toBeUndefined()
    })

    it('should return true if any animation state changed', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'error')])
      
      const changed = officeState.tick(100)
      expect(changed).toBe(true)
    })
  })

  describe('Hermes state mapping', () => {
    it('should map idle → idle', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'idle')])
      expect(officeState.getCharacter('frontend-dev')?.state).toBe('idle')
    })

    it('should map thinking → thinking', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'thinking')])
      expect(officeState.getCharacter('frontend-dev')?.state).toBe('thinking')
    })

    it('should map working → working', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'working')])
      expect(officeState.getCharacter('frontend-dev')?.state).toBe('working')
    })

    it('should map waiting → waiting', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'waiting')])
      expect(officeState.getCharacter('frontend-dev')?.state).toBe('waiting')
    })

    it('should map error → error', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'error')])
      expect(officeState.getCharacter('frontend-dev')?.state).toBe('error')
    })

    it('should map error_critical → error', () => {
      officeState.replaceAll([createMockAgent('frontend-dev', 'error_critical')])
      expect(officeState.getCharacter('frontend-dev')?.state).toBe('error')
    })

    it('should map bark → bark', () => {
      officeState.replaceAll([createMockAgent('hermes', 'bark')])
      expect(officeState.getCharacter('hermes')?.state).toBe('bark')
    })
  })

  describe('seat assignment', () => {
    it('should assign known agents to configured seats', () => {
      officeState.replaceAll([
        createMockAgent('hermes', 'working'),
        createMockAgent('frontend-dev', 'working'),
        createMockAgent('backend-dev', 'working'),
      ])

      const hermes = officeState.getCharacter('hermes')
      expect(hermes?.roomId).toBe('war-room')
      expect(hermes?.tileCol).toBe(3)
      expect(hermes?.tileRow).toBe(2)

      const frontendDev = officeState.getCharacter('frontend-dev')
      expect(frontendDev?.roomId).toBe('pit')
      expect(frontendDev?.tileCol).toBe(1)
      expect(frontendDev?.tileRow).toBe(1)

      const backendDev = officeState.getCharacter('backend-dev')
      expect(backendDev?.roomId).toBe('pit')
      expect(backendDev?.tileCol).toBe(3)
      expect(backendDev?.tileRow).toBe(1)
    })

    it('should assign unknown agents to fallback seat', () => {
      officeState.replaceAll([
        createMockAgent('unknown-agent', 'working'),
      ])

      const agent = officeState.getCharacter('unknown-agent')
      expect(agent?.roomId).toBe('depths')
      expect(agent?.tileCol).toBe(3)
      expect(agent?.tileRow).toBe(1)
    })
  })

  describe('palette mapping', () => {
    it('should map agentId to correct palette', () => {
      const paletteTests = [
        ['hermes', 0],
        ['frontend-dev', 1],
        ['backend-dev', 2],
        ['devops', 3],
        ['qa-engineer', 4],
      ]

      for (const [agentId, expectedPalette] of paletteTests) {
        officeState.replaceAll([createMockAgent(agentId, 'idle')])
        const agent = officeState.getCharacter(agentId)
        expect(agent?.palette).toBe(expectedPalette)
      }
    })

    it('should use fallback palette for unknown agent', () => {
      officeState.replaceAll([createMockAgent('unknown', 'idle')])
      const agent = officeState.getCharacter('unknown')
      expect(agent?.palette).toBe(5)
    })
  })
})

// Helper to create mock Hermes agent status
function createMockAgent(
  agentId: string,
  state: HermesAgentStatus['state'],
  currentTool: string | null = null
): HermesAgentStatus {
  return {
    agentId,
    profile: agentId,
    sessionId: `s-${agentId}`,
    parentSessionId: null,
    parentAgentId: null,
    state,
    previousState: null,
    stateSinceAt: Date.now(),
    severity: null,
    currentTask: `Task for ${agentId}`,
    currentTool,
    currentToolTarget: null,
    lastActivityAt: Date.now(),
    lastMessagePreview: 'Working...',
    pendingApproval: null,
    toolCallCount: 1,
    messageCount: 2,
    errorCount: 0,
    uptimeSeconds: 100,
  }
}