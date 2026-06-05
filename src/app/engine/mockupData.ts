// Mockup data — static layout for Phase A review
// Hell Office: 3 rooms with hardcoded agent positions

export type RoomId = 'lounge' | 'pit' | 'war'

export interface MockAgent {
  id: number
  name: string
  profile: string
  palette: number
  seatCol: number
  seatRow: number
  facing: 0 | 1 | 2 | 3
  state: 'idle' | 'working' | 'waiting_approval' | 'barking'
  bubble: string | null
  deskCol: number
  deskRow: number
}

export interface MockFurniture {
  type: 'desk' | 'chair' | 'plant' | 'couch' | 'pillar' | 'firepit'
  col: number
  row: number
  w: number
  h: number
  color: string
}

export interface MockRoom {
  id: RoomId
  name: string
  col: number
  row: number
  cols: number
  rows: number
  floorColor: string
  glowColor: string
}

// 24 cols x 18 rows map
// Layout:
//   Row 0-7:   War Room (top, where Hermes sits)         cols 0-23
//   Row 8:     lava strip
//   Row 9-17:  The Pit (left) + Hell's Lounge (right)   cols 0-23

export const MOCKUP_COLS = 24
export const MOCKUP_ROWS = 18

export const MOCKUP_ROOMS: MockRoom[] = [
  {
    id: 'war',
    name: "Hermes' War Room",
    col: 0, row: 0, cols: 24, rows: 8,
    floorColor: '#0a0000',
    glowColor: '#3d0000',
  },
  {
    id: 'pit',
    name: 'The Pit',
    col: 0, row: 9, cols: 14, rows: 9,
    floorColor: '#1a0500',
    glowColor: '#aa2200',
  },
  {
    id: 'lounge',
    name: "Hell's Lounge",
    col: 14, row: 9, cols: 10, rows: 9,
    floorColor: '#150500',
    glowColor: '#7a1500',
  },
]

// Static furniture layout
export const MOCKUP_FURNITURE: MockFurniture[] = [
  // === War Room (Hermes' throne + 2 pillars) ===
  { type: 'pillar', col: 1,  row: 1,  w: 1, h: 1, color: '#1a1a1a' },
  { type: 'pillar', col: 22, row: 1,  w: 1, h: 1, color: '#1a1a1a' },
  { type: 'pillar', col: 1,  row: 6,  w: 1, h: 1, color: '#1a1a1a' },
  { type: 'pillar', col: 22, row: 6,  w: 1, h: 1, color: '#1a1a1a' },
  // Hermes desk (center of war room)
  { type: 'desk',    col: 10, row: 3,  w: 4, h: 2, color: '#3d0000' },
  { type: 'chair',   col: 11, row: 5,  w: 1, h: 1, color: '#aa0000' },
  { type: 'firepit', col: 4,  row: 5,  w: 2, h: 2, color: '#ff5500' },
  { type: 'firepit', col: 18, row: 5,  w: 2, h: 2, color: '#ff5500' },

  // === The Pit (working desks, 2x2 grid) ===
  { type: 'desk',  col: 1,  row: 10, w: 2, h: 2, color: '#2d0000' },
  { type: 'desk',  col: 4,  row: 10, w: 2, h: 2, color: '#2d0000' },
  { type: 'desk',  col: 7,  row: 10, w: 2, h: 2, color: '#2d0000' },
  { type: 'desk',  col: 10, row: 10, w: 2, h: 2, color: '#2d0000' },
  // 4 chairs in front of desks
  { type: 'chair', col: 1,  row: 12, w: 1, h: 1, color: '#1a1a1a' },
  { type: 'chair', col: 5,  row: 12, w: 1, h: 1, color: '#1a1a1a' },
  { type: 'chair', col: 7,  row: 12, w: 1, h: 1, color: '#1a1a1a' },
  { type: 'chair', col: 11, row: 12, w: 1, h: 1, color: '#1a1a1a' },
  // Plants for atmosphere
  { type: 'plant', col: 0,  row: 16, w: 1, h: 1, color: '#0a3d0a' },
  { type: 'plant', col: 13, row: 16, w: 1, h: 1, color: '#0a3d0a' },

  // === Hell's Lounge (idle agents on couches) ===
  { type: 'couch', col: 15, row: 11, w: 3, h: 1, color: '#5a0000' },
  { type: 'couch', col: 19, row: 11, w: 3, h: 1, color: '#5a0000' },
  { type: 'couch', col: 15, row: 15, w: 3, h: 1, color: '#5a0000' },
  { type: 'couch', col: 19, row: 15, w: 3, h: 1, color: '#5a0000' },
  { type: 'plant', col: 14, row: 9,  w: 1, h: 1, color: '#0a3d0a' },
  { type: 'plant', col: 23, row: 9,  w: 1, h: 1, color: '#0a3d0a' },
  { type: 'plant', col: 14, row: 17, w: 1, h: 1, color: '#0a3d0a' },
  { type: 'plant', col: 23, row: 17, w: 1, h: 1, color: '#0a3d0a' },
]

// Hardcoded agents
export const MOCKUP_AGENTS: MockAgent[] = [
  // === The Pit — working agents ===
  {
    id: 1, name: 'frontend-dev', profile: 'frontend-eng', palette: 1,
    seatCol: 1, seatRow: 11, facing: 0,
    state: 'working', bubble: 'Building UI...',
    deskCol: 1, deskRow: 10,
  },
  {
    id: 2, name: 'backend-dev', profile: 'backend-eng', palette: 2,
    seatCol: 5, seatRow: 11, facing: 0,
    state: 'working', bubble: 'Compiling Rust...',
    deskCol: 4, deskRow: 10,
  },
  {
    id: 3, name: 'devops', profile: 'ops', palette: 3,
    seatCol: 7, seatRow: 11, facing: 0,
    state: 'waiting_approval', bubble: 'Need approval!',
    deskCol: 7, deskRow: 10,
  },
  {
    id: 4, name: 'qa-engineer', profile: 'qa', palette: 4,
    seatCol: 11, seatRow: 11, facing: 0,
    state: 'working', bubble: 'Running tests...',
    deskCol: 10, deskRow: 10,
  },
  // === Hell's Lounge — idle agents (showing "Give Me More Work!") ===
  {
    id: 5, name: 'frontend-dev-2', profile: 'frontend-eng', palette: 1,
    seatCol: 16, seatRow: 11, facing: 0,
    state: 'idle', bubble: 'Give me more work!',
    deskCol: 15, deskRow: 11,
  },
  {
    id: 6, name: 'backend-dev-2', profile: 'backend-eng', palette: 2,
    seatCol: 20, seatRow: 11, facing: 0,
    state: 'idle', bubble: 'Give me more work!',
    deskCol: 19, deskRow: 11,
  },
  {
    id: 7, name: 'devops-2', profile: 'ops', palette: 3,
    seatCol: 16, seatRow: 15, facing: 0,
    state: 'idle', bubble: 'Give me more work!',
    deskCol: 15, deskRow: 15,
  },
  {
    id: 8, name: 'qa-engineer-2', profile: 'qa', palette: 4,
    seatCol: 20, seatRow: 15, facing: 0,
    state: 'idle', bubble: 'Give me more work!',
    deskCol: 19, deskRow: 15,
  },
  // === Hermes — always in War Room ===
  {
    id: 0, name: 'Hermes', profile: 'hermes', palette: 0,
    seatCol: 12, seatRow: 3, facing: 0,
    state: 'barking', bubble: 'DO THE WORK!',
    deskCol: 10, deskRow: 3,
  },
]
