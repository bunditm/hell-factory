// Shared types for Hell Factory engine

import type { CharacterState, Direction } from './sprites'

// Tile types
export const TileType = {
  WALL: 0,
  FLOOR_1: 1,
  FLOOR_2: 2,
  FLOOR_3: 3,
  FLOOR_4: 4,
  FLOOR_5: 5,
  FLOOR_6: 6,
  FLOOR_7: 7,
  VOID: 8,
} as const
export type TileType = typeof TileType[keyof typeof TileType]

// Office layout
export interface FloorColor {
  h: number; s: number; b: number; c: number
  colorize?: boolean
}

export interface PlacedFurniture {
  uid: string
  type: string
  col: number
  row: number
  color?: FloorColor
}

export interface OfficeLayout {
  version: 1
  cols: number
  rows: number
  tiles: TileType[]
  furniture: PlacedFurniture[]
  tileColors?: Array<FloorColor | null>
  backgroundGids?: number[]
}

// Seat
export interface Seat {
  uid: string
  seatCol: number
  seatRow: number
  facingDir: Direction
  assigned: boolean
}

// Character
export interface Character {
  id: number
  agentId: string
  state: CharacterState
  dir: Direction
  x: number
  y: number
  tileCol: number
  tileRow: number
  path: Array<{ col: number; row: number }>
  moveProgress: number
  currentTool: string | null
  isActive: boolean
  seatId: string | null
  idleSeatId: string | null
  frame: number
  frameTimer: number
  palette: number
  isSubagent: boolean
  parentAgentId: number | null
}

// Hermes agent status from SSE
export interface HermesAgentStatus {
  agentId: string
  profile: string
  state: 'idle' | 'thinking' | 'working' | 'waiting' | 'error'
  currentTask?: string
  toolInUse?: string
  startedAt?: number
  lastMessage?: string
  subAgentOf?: string
}