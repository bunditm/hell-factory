// Mockup data v2 — full tile map with walls, lava pools, trees, fire pits
// 24 cols x 18 rows
// Layout:
//   Row 0-7:   War Room (top, where Hermes sits)         cols 0-23
//   Row 8:     lava strip (open lava, no walls)
//   Row 9-17:  The Pit (left) + Hell's Lounge (right)   cols 0-23

export type RoomId = 'lounge' | 'pit' | 'war'

export type FloorTile = 'cobble' | 'lava' | 'void' | 'wood_planks' | 'stone_tile' | 'carpet_red' | 'carpet_blue' | 'carpet_purple'
export type WallTile = 'stone' | 'lava_edge' | 'window' | 'door' | 'pillar' | null

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
  type: 'desk' | 'chair' | 'plant' | 'couch' | 'pillar' | 'firepit' | 'torch' | 'tree' | 'rock' |
        'desk_v3' | 'chair_v3' | 'lamp' | 'bookshelf' | 'water_cooler' | 'vending_machine' |
        'filing_cabinet' | 'fern' | 'palm' | 'flower' | 'cactus' | 'clock' | 'painting' |
        'bulletin' | 'torch_wall' | 'carpet_red' | 'carpet_blue' | 'carpet_purple'
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
// 'w' = wood_planks (War Room, rows 0-7)
// 's' = stone_tile (The Pit, rows 9-17, cols 0-13)
// 'r' = carpet_red (Hell's Lounge, rows 9-11, cols 14-23)
// 'p' = carpet_purple (Hell's Lounge, rows 12-14, cols 14-23)
// 'b' = carpet_blue (Hell's Lounge, rows 15-17, cols 14-23)
// 'l' = lava (row 8, lava strip)
// 'v' = void (empty areas)
const FLOOR_MAP_STR = `
wwwwwwwwwwwwwwwwwwwwwwww
wwwwwwwwwwwwwwwwwwwwwwww
wwwwwwwwwwwwwwwwwwwwwwww
wwwwwwwwwwwwwwwwwwwwwwww
wwwwwwwwwwwwwwwwwwwwwwww
wwwwwwwwwwwwwwwwwwwwwwww
wwwwwwwwwwwwwwwwwwwwwwww
wwwwwwwwwwwwwwwwwwwwwwww
llllllllllllllllllllllll
sssssssssssssssrrrrrrrrrr
sssssssssssssssrrrrrrrrrr
ssssssssssssssspppppppppp
ssssssssssssssspppppppppp
ssssssssssssssspppppppppp
sssssssssssssssbbbbbbbbbb
sssssssssssssssbbbbbbbbbb
sssssssssssssssbbbbbbbbbb
`.replace(/^\n/, '').replace(/\n$/, '')

export const FLOOR_MAP: FloorTile[][] = (() => {
  const rows = FLOOR_MAP_STR.split('\n')
  return rows.map(row => row.split('').map(ch => {
    if (ch === 'c') return 'cobble'
    if (ch === 'l') return 'lava'
    if (ch === 'v') return 'void'
    if (ch === 'w') return 'wood_planks'
    if (ch === 's') return 'stone_tile'
    if (ch === 'r') return 'carpet_red'
    if (ch === 'b') return 'carpet_blue'
    if (ch === 'p') return 'carpet_purple'
    return 'void'
  }))
})()

export interface WallCell {
  top: boolean
  left: boolean
  topType: 'stone' | 'window' | 'door' | 'pillar' | null
  leftType: 'stone' | 'window' | 'door' | 'pillar' | null
}

// === WALL MAP (24x18) — same dimensions ===
// 'h' = horizontal wall on top of tile, 'v' = vertical wall on left of tile
// 'H' = horizontal wall with window, 'V' = vertical wall with window
// 'D' = door, 'P' = pillar, '.' = no wall
// Windows: War Room rows 2,3,4 at col 22 (right wall), The Pit row 12 at col 13 (right wall)
const WALL_MAP_STR = `
hhhhhhhhhhhhhhhhhhhhhhhh
v.l...................v
v.l...................H
v.l...................H
v.l...................H
v.l...................v
v.l...................v
v.l...................v
........................
v.l...........v.......v
v.l...........v.......v
v.l...........v.......v
v.l...........v.......H
v.l...........v.......v
v.l...........v.......v
v.l...........v.......v
v.l...........v.......v
v.l...................v
hhhhhhhhhhhhhhhhhhhhhhhh
`.replace(/^\n/, '').replace(/\n$/, '')

export const WALL_MAP: WallCell[][] = (() => {
  const rows = WALL_MAP_STR.split('\n')
  return rows.map(row => {
    const cells: WallCell[] = []
    let i = 0
    while (i < row.length) {
      const ch = row[i]
      if (ch === 'h') {
        cells.push({ top: true, left: false, topType: 'stone', leftType: null }); i++
      } else if (ch === 'H') {
        cells.push({ top: true, left: false, topType: 'window', leftType: null }); i++
      } else if (ch === 'v') {
        cells.push({ top: false, left: true, topType: null, leftType: 'stone' }); i++
      } else if (ch === 'V') {
        cells.push({ top: false, left: true, topType: null, leftType: 'window' }); i++
      } else if (ch === '.') {
        cells.push({ top: false, left: false, topType: null, leftType: null }); i++
      } else if (ch === 'D') {
        cells.push({ top: true, left: false, topType: 'door', leftType: null }); i++
      } else if (ch === 'P') {
        cells.push({ top: true, left: false, topType: 'pillar', leftType: null }); i++
      } else {
        cells.push({ top: false, left: false, topType: null, leftType: null }); i++
      }
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
// Phase A v3 — comprehensive placement of all new furniture sprites
export const MOCKUP_FURNITURE: MockFurniture[] = [
  // === War Room (rows 0-7) ===
  // Pillars at corners
  { type: 'pillar', col: 1, row: 1, sw: 1, sh: 1 },
  { type: 'pillar', col: 22, row: 1, sw: 1, sh: 1 },
  { type: 'pillar', col: 1, row: 6, sw: 1, sh: 1 },
  { type: 'pillar', col: 22, row: 6, sw: 1, sh: 1 },
  // Wall decorations (torch_wall, painting, bulletin, clock)
  { type: 'torch_wall', col: 1, row: 3, sw: 1, sh: 1 },
  { type: 'torch_wall', col: 22, row: 3, sw: 1, sh: 1 },
  { type: 'torch_wall', col: 1, row: 5, sw: 1, sh: 1 },
  { type: 'torch_wall', col: 22, row: 5, sw: 1, sh: 1 },
  { type: 'painting', col: 4, row: 0, sw: 1, sh: 1 }, // on wall
  { type: 'painting', col: 19, row: 0, sw: 1, sh: 1 }, // on wall
  { type: 'bulletin', col: 11, row: 0, sw: 1, sh: 1 }, // on wall
  { type: 'clock', col: 11, row: 1, sw: 1, sh: 1 }, // on wall
  // Firepits flanking Hermes
  { type: 'firepit', col: 4, row: 5, sw: 1, sh: 1 },
  { type: 'firepit', col: 19, row: 5, sw: 1, sh: 1 },
  // Hermes' desk and chair (center)
  { type: 'desk_v3', col: 10, row: 3, sw: 2, sh: 1 },
  { type: 'chair_v3', col: 11, row: 4, sw: 1, sh: 1 },
  { type: 'lamp', col: 12, row: 3, sw: 1, sh: 1 }, // on desk
  // Bookshelves along side walls
  { type: 'bookshelf', col: 2, row: 1, sw: 1, sh: 2 },
  { type: 'bookshelf', col: 21, row: 1, sw: 1, sh: 2 },
  // Plants in corners
  { type: 'fern', col: 0, row: 6, sw: 1, sh: 1 },
  { type: 'fern', col: 23, row: 6, sw: 1, sh: 1 },
  { type: 'palm', col: 5, row: 1, sw: 1, sh: 1 },
  { type: 'palm', col: 18, row: 1, sw: 1, sh: 1 },
  // Carpet under Hermes' desk
  { type: 'carpet_purple', col: 8, row: 2, sw: 6, sh: 3 },

  // === The Pit (rows 9-17, cols 0-13) ===
  // Working desks with chairs (4 desks)
  { type: 'desk_v3', col: 1, row: 10, sw: 2, sh: 1 },
  { type: 'desk_v3', col: 4, row: 10, sw: 2, sh: 1 },
  { type: 'desk_v3', col: 7, row: 10, sw: 2, sh: 1 },
  { type: 'desk_v3', col: 10, row: 10, sw: 2, sh: 1 },
  { type: 'chair_v3', col: 1, row: 11, sw: 1, sh: 1 },
  { type: 'chair_v3', col: 5, row: 11, sw: 1, sh: 1 },
  { type: 'chair_v3', col: 7, row: 11, sw: 1, sh: 1 },
  { type: 'chair_v3', col: 11, row: 11, sw: 1, sh: 1 },
  // Lamps on desks
  { type: 'lamp', col: 2, row: 10, sw: 1, sh: 1 },
  { type: 'lamp', col: 5, row: 10, sw: 1, sh: 1 },
  { type: 'lamp', col: 8, row: 10, sw: 1, sh: 1 },
  { type: 'lamp', col: 11, row: 10, sw: 1, sh: 1 },
  // Utility furniture
  { type: 'water_cooler', col: 0, row: 12, sw: 1, sh: 2 },
  { type: 'vending_machine', col: 12, row: 12, sw: 1, sh: 1 },
  { type: 'filing_cabinet', col: 0, row: 15, sw: 1, sh: 2 },
  // Bookshelf on back wall
  { type: 'bookshelf', col: 5, row: 9, sw: 1, sh: 2 },
  // Wall decorations
  { type: 'bulletin', col: 9, row: 9, sw: 1, sh: 1 },
  { type: 'clock', col: 13, row: 9, sw: 1, sh: 1 },
  // Plants on side
  { type: 'fern', col: 0, row: 16, sw: 1, sh: 1 },
  { type: 'palm', col: 13, row: 16, sw: 1, sh: 1 },
  { type: 'flower', col: 13, row: 9, sw: 1, sh: 1 },
  { type: 'cactus', col: 0, row: 9, sw: 1, sh: 1 },
  // Firepits in corners
  { type: 'firepit', col: 0, row: 14, sw: 1, sh: 1 },
  { type: 'firepit', col: 13, row: 14, sw: 1, sh: 1 },
  // Carpet under desks
  { type: 'carpet_red', col: 0, row: 10, sw: 14, sh: 2 },

  // === Hell's Lounge (rows 9-17, cols 14-23) ===
  // Couches
  { type: 'couch', col: 15, row: 11, sw: 2, sh: 1 },
  { type: 'couch', col: 19, row: 11, sw: 2, sh: 1 },
  { type: 'couch', col: 15, row: 15, sw: 2, sh: 1 },
  { type: 'couch', col: 19, row: 15, sw: 2, sh: 1 },
  // Plants
  { type: 'fern', col: 14, row: 9, sw: 1, sh: 1 },
  { type: 'fern', col: 23, row: 9, sw: 1, sh: 1 },
  { type: 'palm', col: 14, row: 17, sw: 1, sh: 1 },
  { type: 'palm', col: 23, row: 17, sw: 1, sh: 1 },
  { type: 'flower', col: 15, row: 9, sw: 1, sh: 1 },
  { type: 'flower', col: 22, row: 9, sw: 1, sh: 1 },
  { type: 'cactus', col: 15, row: 17, sw: 1, sh: 1 },
  { type: 'cactus', col: 22, row: 17, sw: 1, sh: 1 },
  // Firepits in corners
  { type: 'firepit', col: 14, row: 13, sw: 1, sh: 1 },
  { type: 'firepit', col: 23, row: 13, sw: 1, sh: 1 },
  // Wall decorations
  { type: 'torch_wall', col: 14, row: 11, sw: 1, sh: 1 },
  { type: 'torch_wall', col: 23, row: 11, sw: 1, sh: 1 },
  { type: 'painting', col: 18, row: 9, sw: 1, sh: 1 },
  { type: 'clock', col: 18, row: 10, sw: 1, sh: 1 },
  // Carpets under couch areas
  { type: 'carpet_blue', col: 14, row: 10, sw: 10, sh: 6 },
  { type: 'carpet_purple', col: 14, row: 14, sw: 10, sh: 3 },
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
