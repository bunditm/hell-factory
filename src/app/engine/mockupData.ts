// Mockup data v2 — full tile map with walls, lava pools, trees, fire pits
// 24 cols x 18 rows
// Layout:
//   Row 0-7:   War Room (top, where Hermes sits)         cols 0-23
//   Row 8:     lava strip (open lava, no walls)
//   Row 9-17:  The Pit (left) + Hell's Lounge (right)   cols 0-23

export type RoomId = 'lounge' | 'pit' | 'war'

export type FloorTile = 'cobble' | 'lava' | 'void'
export type WallTile = 'stone' | 'lava_edge' | null

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
}

export interface MockFurniture {
  type: 'desk' | 'chair' | 'plant' | 'couch' | 'pillar' | 'firepit' | 'torch' | 'tree' | 'rock'
  col: number
  row: number
  // sprite size in tiles
  sw: number
  sh: number
  // for 'rock' cluster, place multiple
  count?: number
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

export const MOCKUP_COLS = 24
export const MOCKUP_ROWS = 18

// === FLOOR MAP (24x18) ===
// 'c' = cobblestone, 'l' = lava, '.' = void
// Index = row * 24 + col
const FLOOR_MAP_STR = `
cccccccccccccccccccccccc
cccccccccccccccccccccccc
cccccccccccccccccccccccc
cccccccccccccccccccccccc
cccccccccccccccccccccccc
cccccccccccccccccccccccc
cccccccccccccccccccccccc
cccccccccccccccccccccccc
llllllllllllllllllllllll
ccccccccccccccpccccccccc
ccccccccccccccccccllccc
ccccccccccccccccccccccc
ccccccccccccccccccccccc
ccccccccccccccccccccccc
ccccccccccccccccccccccc
ccccccccccccccccccccccc
ccccccccccccccccccccccc
ccccccccccccccccccccccc
`.replace(/^\n/, '').replace(/\n$/, '')

export const FLOOR_MAP: FloorTile[][] = (() => {
  const rows = FLOOR_MAP_STR.split('\n')
  return rows.map(row => row.split('').map(ch => {
    if (ch === 'c') return 'cobble'
    if (ch === 'l') return 'lava'
    return 'void'
  }))
})()

// === WALL MAP (24x18) — same dimensions ===
// 'h' = horizontal wall on top of tile, 'v' = vertical wall on left of tile, 'x' = corner
// Or use 0/1: top wall, left wall
// Map cell format: { top: bool, left: bool }
const WALL_MAP_STR = `
hhhhhhhhhhhhhhhhhhhhhhhh
v.l...................v
v.l...................v
v.l...................v
v.l...................v
v.l...................v
v.l...................v
v.l...................v
.........................
v.l...........v.......v
v.l...........v.......v
v.l...........v.......v
v.l...........v.......v
v.l...........v.......v
v.l...........v.......v
v.l...........v.......v
v.l...................v
v.l...................v
hhhhhhhhhhhhhhhhhhhhhhhh
`.replace(/^\n/, '').replace(/\n$/, '')

export const WALL_MAP: { top: boolean; left: boolean }[][] = (() => {
  const rows = WALL_MAP_STR.split('\n')
  return rows.map(row => {
    const cells: { top: boolean; left: boolean }[] = []
    let i = 0
    while (i < row.length) {
      const ch = row[i]
      if (ch === 'h') { cells.push({ top: true, left: false }); i++ }
      else if (ch === 'v') { cells.push({ top: false, left: true }); i++ }
      else if (ch === '.') { cells.push({ top: false, left: false }); i++ }
      else { cells.push({ top: false, left: false }); i++ }
    }
    return cells
  })
})()

// Rooms (for label rendering only)
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

// === FURNITURE (tile-coords) ===
export const MOCKUP_FURNITURE: MockFurniture[] = [
  // === War Room ===
  // Pillars at corners
  { type: 'pillar', col: 1,  row: 1,  sw: 1, sh: 1 },
  { type: 'pillar', col: 22, row: 1,  sw: 1, sh: 1 },
  { type: 'pillar', col: 1,  row: 6,  sw: 1, sh: 1 },
  { type: 'pillar', col: 22, row: 6,  sw: 1, sh: 1 },
  // Torches on walls
  { type: 'torch',  col: 1,  row: 3,  sw: 1, sh: 1 },
  { type: 'torch',  col: 22, row: 3,  sw: 1, sh: 1 },
  { type: 'torch',  col: 1,  row: 5,  sw: 1, sh: 1 },
  { type: 'torch',  col: 22, row: 5,  sw: 1, sh: 1 },
  // Firepits flanking Hermes' desk
  { type: 'firepit', col: 4,  row: 5,  sw: 1, sh: 1 },
  { type: 'firepit', col: 19, row: 5,  sw: 1, sh: 1 },
  // Hermes' throne desk
  { type: 'desk',  col: 10, row: 3,  sw: 2, sh: 1 },
  { type: 'chair', col: 11, row: 4,  sw: 1, sh: 1 },
  // Fire trees for atmosphere
  { type: 'tree',  col: 5,  row: 1,  sw: 1, sh: 1 },
  { type: 'tree',  col: 18, row: 1,  sw: 1, sh: 1 },
  { type: 'tree',  col: 5,  row: 6,  sw: 1, sh: 1 },
  { type: 'tree',  col: 18, row: 6,  sw: 1, sh: 1 },

  // === The Pit (working desks) ===
  { type: 'desk',  col: 1,  row: 10, sw: 2, sh: 1 },
  { type: 'desk',  col: 4,  row: 10, sw: 2, sh: 1 },
  { type: 'desk',  col: 7,  row: 10, sw: 2, sh: 1 },
  { type: 'desk',  col: 10, row: 10, sw: 2, sh: 1 },
  { type: 'chair', col: 1,  row: 11, sw: 1, sh: 1 },
  { type: 'chair', col: 5,  row: 11, sw: 1, sh: 1 },
  { type: 'chair', col: 7,  row: 11, sw: 1, sh: 1 },
  { type: 'chair', col: 11, row: 11, sw: 1, sh: 1 },
  // Plants/trees on side
  { type: 'tree',  col: 0,  row: 16, sw: 1, sh: 1 },
  { type: 'tree',  col: 13, row: 16, sw: 1, sh: 1 },
  // Firepits in corners
  { type: 'firepit', col: 0, row: 14, sw: 1, sh: 1 },
  { type: 'firepit', col: 13, row: 14, sw: 1, sh: 1 },

  // === Hell's Lounge (idle agents on couches) ===
  { type: 'couch', col: 15, row: 11, sw: 2, sh: 1 },
  { type: 'couch', col: 19, row: 11, sw: 2, sh: 1 },
  { type: 'couch', col: 15, row: 15, sw: 2, sh: 1 },
  { type: 'couch', col: 19, row: 15, sw: 2, sh: 1 },
  { type: 'tree',  col: 14, row: 9,  sw: 1, sh: 1 },
  { type: 'tree',  col: 23, row: 9,  sw: 1, sh: 1 },
  { type: 'tree',  col: 14, row: 17, sw: 1, sh: 1 },
  { type: 'tree',  col: 23, row: 17, sw: 1, sh: 1 },
  { type: 'firepit', col: 14, row: 13, sw: 1, sh: 1 },
  { type: 'firepit', col: 23, row: 13, sw: 1, sh: 1 },
]

// Rocks scattered in the lava strip (row 8) for visual interest
export const LAVA_ROCKS: { col: number; row: number }[] = [
  { col: 3, row: 8 },
  { col: 8, row: 8 },
  { col: 14, row: 8 },
  { col: 19, row: 8 },
]

// === AGENTS ===
export const MOCKUP_AGENTS: MockAgent[] = [
  // The Pit — working agents
  {
    id: 1, name: 'frontend-dev', profile: 'frontend-eng', palette: 1,
    seatCol: 1, seatRow: 11, facing: 0,
    state: 'working', bubble: 'Building UI...',
  },
  {
    id: 2, name: 'backend-dev', profile: 'backend-eng', palette: 2,
    seatCol: 5, seatRow: 11, facing: 0,
    state: 'working', bubble: 'Compiling Rust...',
  },
  {
    id: 3, name: 'devops', profile: 'ops', palette: 3,
    seatCol: 7, seatRow: 11, facing: 0,
    state: 'waiting_approval', bubble: 'Need approval!',
  },
  {
    id: 4, name: 'qa-engineer', profile: 'qa', palette: 4,
    seatCol: 11, seatRow: 11, facing: 0,
    state: 'working', bubble: 'Running tests...',
  },
  // Hell's Lounge — idle
  {
    id: 5, name: 'frontend-dev-2', profile: 'frontend-eng', palette: 1,
    seatCol: 16, seatRow: 11, facing: 0,
    state: 'idle', bubble: 'Give me more work!',
  },
  {
    id: 6, name: 'backend-dev-2', profile: 'backend-eng', palette: 2,
    seatCol: 20, seatRow: 11, facing: 0,
    state: 'idle', bubble: 'Give me more work!',
  },
  {
    id: 7, name: 'devops-2', profile: 'ops', palette: 3,
    seatCol: 16, seatRow: 15, facing: 0,
    state: 'idle', bubble: 'Give me more work!',
  },
  {
    id: 8, name: 'qa-engineer-2', profile: 'qa', palette: 4,
    seatCol: 20, seatRow: 15, facing: 0,
    state: 'idle', bubble: 'Give me more work!',
  },
  // Hermes
  {
    id: 0, name: 'Hermes', profile: 'hermes', palette: 0,
    seatCol: 11, seatRow: 3, facing: 0,
    state: 'barking', bubble: 'DO THE WORK!',
  },
]
