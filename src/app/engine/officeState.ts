/**
 * Office state manager — bridges SSE store events to canvas character state
 * 
 * This is the data layer for the canvas. It receives updates from the monitoring
 * store (SSE events) and maintains the character state that the renderer consumes.
 * 
 * Key responsibilities:
 * - Map Hermes agent states to canvas character states
 * - Track sub-agents and their parent relationships
 * - Provide API for updating characters without full re-renders
 * - Decouple SSE tick frequency from canvas render frequency
 * - Track speech bubble state for each character
 */

import type { HermesAgentStatus } from '../../lib/monitoring/types'
import type { Character } from './types'

// Canvas character state (subset of Hermes agent states we visualize)
export type CanvasCharacterState = 
  | 'idle'       // Standing in Idle Room, no activity
  | 'thinking'   // At work seat, thought bubble
  | 'working'    // At work seat, typing animation
  | 'waiting'    // At work seat, hourglass bubble
  | 'error'      // At work seat, shake + red bubble
  | 'bark'       // Hermes-only special state

// Speech bubble type (FR-M7)
export type BubbleType = 
  | 'thinking'   // "..." with cycling animation
  | 'working'    // Gear icon (semi-transparent)
  | 'waiting'    // Hourglass with ⚠ border
  | 'error'      // Red ! bubble
  | 'error_critical'  // Red ! with solid red border, sticky
  | 'bark'       // "DO THE WORK" bubble

// Speech bubble state
interface BubbleState {
  type: BubbleType
  visible: boolean
  dismissedAt: number | null  // When bubble should disappear (null for sticky)
  animFrame: number  // For cycling animations (0 or 1)
  animTimer: number  // ms timer for frame switching
}

// Internal character state for canvas
interface CanvasCharacter extends Omit<Character, 'state' | 'currentTool' | 'subAgents'> {
  state: CanvasCharacterState
  hermesState: HermesAgentStatus['state']
  currentTool: string | null
  subAgents: Map<string, SubAgentInfo>
  severity: 'minor' | 'critical' | null
  bubble?: string | null
  shakeTimer?: number
  bubbleState?: BubbleState  // Speech bubble state tracking
  roomId: string
}

// Sub-agent info for shadow rendering
interface SubAgentInfo {
  sessionId: string
  agentId: string
  parentSessionId: string
  state: CanvasCharacterState
  spawnedAt: number
  completedAt: number | null
  angle: number
  distance: number
}

// Room and seat configuration
interface SeatConfig {
  roomId: string
  seatCol: number
  seatRow: number
  facingDir: number
  isWorkSeat: boolean
}

const SEAT_ASSIGNMENTS: Record<string, SeatConfig> = {
  'hermes': {
    roomId: 'war-room',
    seatCol: 3,
    seatRow: 2,
    facingDir: 0,
    isWorkSeat: true,
  },
  'frontend-dev': {
    roomId: 'pit',
    seatCol: 1,
    seatRow: 1,
    facingDir: 0,
    isWorkSeat: true,
  },
  'backend-dev': {
    roomId: 'pit',
    seatCol: 3,
    seatRow: 1,
    facingDir: 0,
    isWorkSeat: true,
  },
  'devops': {
    roomId: 'pit',
    seatCol: 5,
    seatRow: 1,
    facingDir: 0,
    isWorkSeat: true,
  },
  'qa-engineer': {
    roomId: 'lounge',
    seatCol: 2,
    seatRow: 2,
    facingDir: 0,
    isWorkSeat: false,
  },
}

const FALLBACK_SEAT: SeatConfig = {
  roomId: 'depths',
  seatCol: 3,
  seatRow: 1,
  facingDir: 0,
  isWorkSeat: false,
}

export class OfficeState {
  private characters: Map<string, CanvasCharacter>
  private version: number
  
  constructor() {
    this.characters = new Map()
    this.version = 0
  }

  getVersion(): number {
    return this.version
  }

  getAllCharacters(): readonly CanvasCharacter[] {
    return Array.from(this.characters.values())
  }

  getCharacter(agentId: string): CanvasCharacter | null {
    const char = this.characters.get(agentId)
    return char ? { ...char } : null
  }

  replaceAll(agents: HermesAgentStatus[]): void {
    this.characters.clear()
    
    for (const agent of agents) {
      const canvasChar = this.hermesToCanvasCharacter(agent)
      this.characters.set(agent.agentId, canvasChar)
    }
    
    this.version++
  }

  updateAgent(agentId: string, update: Partial<HermesAgentStatus>): void {
    const existing = this.characters.get(agentId)
    
    if (!existing) {
      if (update.agentId && update.state) {
        const canvasChar = this.hermesToCanvasCharacter(update as HermesAgentStatus)
        this.characters.set(agentId, canvasChar)
        this.version++
      }
      return
    }
    
    const updated = { ...existing }
    
    if (update.state !== undefined) {
      const oldState = updated.hermesState
      updated.hermesState = update.state
      updated.state = this.mapHermesStateToCanvas(update.state)
      
      // Set shake timer on transition to error
      if ((update.state === 'error' || update.state === 'error_critical') &&
          (oldState !== 'error' && oldState !== 'error_critical')) {
        updated.shakeTimer = 500
      }
    }
    
    if (update.currentTool !== undefined) {
      updated.currentTool = update.currentTool
    }
    
    if (update.severity !== undefined) {
      updated.severity = update.severity
    }
    
    this.characters.set(agentId, updated)
    this.version++
  }

  removeAgent(agentId: string): void {
    if (this.characters.delete(agentId)) {
      this.version++
    }
  }

  addSubAgent(parentAgentId: string, subAgent: HermesAgentStatus): void {
    const parent = this.characters.get(parentAgentId)
    if (!parent) return
    
    const existingSubAgents = Array.from(parent.subAgents.values())
    const angle = this.calculateSubAgentAngle(existingSubAgents.length)
    const distance = 60
    
    const subInfo: SubAgentInfo = {
      sessionId: subAgent.sessionId || '',
      agentId: subAgent.agentId,
      parentSessionId: subAgent.parentSessionId || '',
      state: this.mapHermesStateToCanvas(subAgent.state),
      spawnedAt: Date.now(),
      completedAt: null,
      angle,
      distance,
    }
    
    const updated = {
      ...parent,
      subAgents: new Map(parent.subAgents).set(subAgent.sessionId || '', subInfo),
    }
    
    this.characters.set(parentAgentId, updated)
    this.version++
  }

  completeSubAgent(parentAgentId: string, sessionId: string): void {
    const parent = this.characters.get(parentAgentId)
    if (!parent) return
    
    const subAgent = parent.subAgents.get(sessionId)
    if (!subAgent || subAgent.completedAt) return
    
    const updatedSubAgent = { ...subAgent, completedAt: Date.now() }
    const updatedSubAgents = new Map(parent.subAgents).set(sessionId, updatedSubAgent)
    
    const updated = {
      ...parent,
      subAgents: updatedSubAgents,
    }
    
    this.characters.set(parentAgentId, updated)
    this.version++
  }

  cleanupExpiredSubAgents(): boolean {
    const now = Date.now()
    const GRACE_PERIOD_MS = 1000
    let removedAny = false
    
    for (const [agentId, char] of this.characters) {
      let needsUpdate = false
      const updatedSubAgents = new Map(char.subAgents)
      
      for (const [sessionId, subAgent] of char.subAgents) {
        if (subAgent.completedAt && (now - subAgent.completedAt) > GRACE_PERIOD_MS) {
          updatedSubAgents.delete(sessionId)
          needsUpdate = true
          removedAny = true
        }
      }
      
      if (needsUpdate) {
        this.characters.set(agentId, { ...char, subAgents: updatedSubAgents })
      }
    }
    
    if (removedAny) {
      this.version++
    }
    
    return removedAny
  }

  tick(dt: number): boolean {
    let changed = false
    
    for (const [agentId, char] of this.characters) {
      let needsUpdate = false
      const updated: Partial<CanvasCharacter> = {}
      
      if (char.shakeTimer !== undefined && char.shakeTimer > 0) {
        const newShakeTimer = Math.max(0, char.shakeTimer - dt)
        if (newShakeTimer === 0) {
          // Remove shake timer when it reaches zero
          // Don't include it in updated at all, so it won't be spread into the result
          needsUpdate = true
          changed = true
        } else {
          updated.shakeTimer = newShakeTimer
          needsUpdate = true
          changed = true
        }
      }
      
      if (needsUpdate) {
        // Create new character without shakeTimer if we're removing it
        const newChar: CanvasCharacter = { ...char, ...updated }
        // Explicitly delete shakeTimer if we wanted it gone
        if (char.shakeTimer !== undefined && (updated.shakeTimer === undefined || updated.shakeTimer === 0)) {
          delete (newChar as any).shakeTimer
        }
        this.characters.set(agentId, newChar)
      }
    }
    
    if (this.cleanupExpiredSubAgents()) {
      changed = true
    }
    
    if (changed) {
      this.version++
    }
    
    return changed
  }

  private hermesToCanvasCharacter(agent: HermesAgentStatus): CanvasCharacter {
    const seat = SEAT_ASSIGNMENTS[agent.agentId] || FALLBACK_SEAT
    const tileX = seat.seatCol * 100 + 50
    const tileY = seat.seatRow * 100 + 50
    
    const shakeTimer = (agent.state === 'error' || agent.state === 'error_critical') ? 500 : undefined
    
    return {
      id: 0,
      agentId: agent.agentId,
      state: this.mapHermesStateToCanvas(agent.state),
      hermesState: agent.state,
      dir: seat.facingDir,
      x: tileX,
      y: tileY,
      tileCol: seat.seatCol,
      tileRow: seat.seatRow,
      path: [],
      moveProgress: 0,
      currentTool: agent.currentTool,
      isActive: agent.state !== 'idle',
      seatId: seat.roomId + '-' + seat.seatCol + '-' + seat.seatRow,
      idleSeatId: seat.isWorkSeat ? null : seat.roomId + '-' + seat.seatCol + '-' + seat.seatRow,
      frame: 0,
      frameTimer: 0,
      palette: this.agentIdToPalette(agent.agentId),
      isSubagent: agent.parentSessionId !== null,
      parentAgentId: null,
      subAgents: new Map(),
      severity: agent.severity || null,
      bubble: null,
      shakeTimer,
      bubbleState: this.createBubbleState(agent.state, agent.severity),
      roomId: seat.roomId,
    }
  }

  private mapHermesStateToCanvas(hermesState: HermesAgentStatus['state']): CanvasCharacterState {
    switch (hermesState) {
      case 'idle':
        return 'idle'
      case 'thinking':
        return 'thinking'
      case 'working':
        return 'working'
      case 'waiting':
        return 'waiting'
      case 'error':
      case 'error_critical':
        return 'error'
      case 'bark':
        return 'bark'
      default:
        return 'idle'
    }
  }

  /**
   * Create initial bubble state based on agent state
   */
  private createBubbleState(state: HermesAgentStatus['state'], severity: 'minor' | 'critical' | null): BubbleState | undefined {
    // No bubble for idle state
    if (state === 'idle') return undefined
    
    let bubbleType: BubbleType
    
    switch (state) {
      case 'thinking':
        bubbleType = 'thinking'
        break
      case 'working':
        bubbleType = 'working'
        break
      case 'waiting':
        bubbleType = 'waiting'
        break
      case 'error':
        bubbleType = severity === 'critical' ? 'error_critical' : 'error'
        break
      case 'error_critical':
        bubbleType = 'error_critical'
        break
      case 'bark':
        bubbleType = 'bark'
        break
      default:
        return undefined
    }
    
    // error_critical is sticky (doesn't auto-dismiss)
    const isSticky = bubbleType === 'error_critical'
    
    return {
      type: bubbleType,
      visible: true,
      dismissedAt: isSticky ? null : Date.now() + 1000,  // 1s auto-dismiss (FR-M7.11)
      animFrame: 0,
      animTimer: 0,
    }
  }

  /**
   * Update bubble state when character state changes
   */
  private updateBubbleState(char: CanvasCharacter, newState: HermesAgentStatus['state'], previousState: HermesAgentStatus['state'] | null): void {
    // Only update bubble if state actually changed
    if (newState === previousState) return
    
    // Reset bubble state when state changes
    char.bubbleState = this.createBubbleState(newState, char.severity)
  }

  /**
   * Update bubble animations (called each frame)
   * Returns true if any animation changed
   */
  updateBubbleAnimations(dt: number): boolean {
    let changed = false
    const now = Date.now()
    
    for (const [agentId, char] of this.characters.entries()) {
      if (!char.bubbleState || !char.bubbleState.visible) continue
      
      // Check if bubble should auto-dismiss (1s after state transition)
      if (char.bubbleState.dismissedAt !== null && now >= char.bubbleState.dismissedAt) {
        const updated = { ...char, bubbleState: { ...char.bubbleState, visible: false } }
        this.characters.set(agentId, updated)
        changed = true
        continue
      }
      
      // Update animation frame for cycling bubbles (thinking)
      if (char.bubbleState.type === 'thinking') {
        char.bubbleState.animTimer += dt
        if (char.bubbleState.animTimer >= 500) {  // 500ms per frame
          const updated = { ...char, bubbleState: { ...char.bubbleState, animFrame: (char.bubbleState.animFrame + 1) % 2, animTimer: 0 } }
          this.characters.set(agentId, updated)
          changed = true
        }
      }
    }
    
    if (changed) this.version++
    return changed
  }

  private calculateSubAgentAngle(existingCount: number): number {
    const totalArc = Math.PI
    const step = totalArc / Math.max(1, existingCount + 1)
    const startAngle = -Math.PI / 2
    
    return startAngle + step * existingCount
  }

  private agentIdToPalette(agentId: string): number {
    const paletteMap: Record<string, number> = {
      'hermes': 0,
      'frontend-dev': 1,
      'backend-dev': 2,
      'devops': 3,
      'qa-engineer': 4,
    }
    return paletteMap[agentId] ?? 5
  }
}