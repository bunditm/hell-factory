// Office layout v4 — 5 rooms, per-room theming, named characters
// All tile references go through the TILE_SETS manifest so we can swap packs

import { IMP_SPRITES, TILE_SETS } from './assets'

// Canvas: 1600x900, 16x9 tile grid, 100px tiles
export const V4_COLS = 16
export const V4_ROWS = 9
export const V4_TILE = 100

// Per-room theme (Claw-Empire style: floor1/floor2/wall/accent)
export interface RoomTheme {
  floorTileSet: string  // key from TILE_SETS
  floorTile: { col: number; row: number }  // which cell to use as floor
  floorAlt: { col: number; row: number }   // alt cell for checkerboard
  wallTileSet: string
  wallTile: { col: number; row: number }
  wallAccent: { col: number; row: number } // wall trim
  label: string
  bgGradient: [string, string]  // top, bottom — wall background
}

export const ROOM_THEMES: Record<string, RoomTheme> = {
  'war-room': {
    floorTileSet: 'multi2',
    floorTile: { col: 0, row: 1 },  // marble-ish (placeholder until inspected)
    floorAlt: { col: 1, row: 1 },
    wallTileSet: 'multi1',
    wallTile: { col: 2, row: 2 },   // dark red brick
    wallAccent: { col: 0, row: 0 }, // red dragon scale
    label: "WAR ROOM",
    bgGradient: ['#2a0a0a', '#0a0000'],
  },
  'pit': {
    floorTileSet: 'multi2',
    floorTile: { col: 0, row: 2 },  // wood plank
    floorAlt: { col: 1, row: 2 },
    wallTileSet: 'multi1',
    wallTile: { col: 1, row: 2 },   // brown brick
    wallAccent: { col: 0, row: 4 }, // gold-ish
    label: "THE PIT",
    bgGradient: ['#1a1208', '#0a0604'],
  },
  'lounge': {
    floorTileSet: 'multi2',
    floorTile: { col: 0, row: 3 },  // sand/granite
    floorAlt: { col: 1, row: 3 },
    wallTileSet: 'multi1',
    wallTile: { col: 2, row: 2 },   // brown brick
    wallAccent: { col: 0, row: 5 }, // orange
    label: "HELL'S LOUNGE",
    bgGradient: ['#2a1508', '#1a0a04'],
  },
  'depths': {
    floorTileSet: 'multi2',
    floorTile: { col: 0, row: 4 },  // bamboo / dark mat
    floorAlt: { col: 1, row: 4 },
    wallTileSet: 'multi1',
    wallTile: { col: 3, row: 2 },   // teal-ish brick
    wallAccent: { col: 0, row: 6 }, // blue accent
    label: "THE DEPTHS",
    bgGradient: ['#080820', '#02020a'],
  },
  'catacombs': {
    floorTileSet: 'multi2',
    floorTile: { col: 0, row: 5 },  // stone
    floorAlt: { col: 1, row: 5 },
    wallTileSet: 'multi1',
    wallTile: { col: 4, row: 2 },   // grey stone
    wallAccent: { col: 0, row: 7 }, // dark blue
    label: "THE CATACOMBS",
    bgGradient: ['#10101a', '#040408'],
  },
}

// 5 rooms laid out in the 16x9 grid
// Layout:
//   Row 0:     Catacombs hallway across top (cols 0-15)
//   Row 1-4:   War Room (cols 0-7)  |  Lounge (cols 8-15)
//   Row 5:     Catacombs hall (cols 0-15)
//   Row 6-8:   Pit (cols 0-7)       |  Depths (cols 8-15)
//
// All room rectangles (col, row, w, h in tiles):
export interface RoomRect {
  id: string
  theme: RoomTheme
  col: number
  row: number
  cols: number
  rows: number
}

export const ROOMS: RoomRect[] = [
  { id: 'catacombs-top',  theme: ROOM_THEMES['catacombs'], col: 0,  row: 0,  cols: 16, rows: 1 },
  { id: 'war-room',        theme: ROOM_THEMES['war-room'],  col: 0,  row: 1,  cols: 8,  rows: 4 },
  { id: 'lounge',          theme: ROOM_THEMES['lounge'],    col: 8,  row: 1,  cols: 8,  rows: 4 },
  { id: 'catacombs-mid',   theme: ROOM_THEMES['catacombs'], col: 0,  row: 5,  cols: 16, rows: 1 },
  { id: 'pit',             theme: ROOM_THEMES['pit'],       col: 0,  row: 6,  cols: 8,  rows: 3 },
  { id: 'depths',          theme: ROOM_THEMES['depths'],    col: 8,  row: 6,  cols: 8,  rows: 3 },
]

// Characters — named, swap-friendly via IMP_SPRITES key
export interface OfficeCharacter {
  id: string          // "frontend-dev" / "frontend-dev-2" etc
  name: string        // displayed name
  role: string        // frontend-dev / backend-dev / etc
  spriteKey: string   // key into IMP_SPRITES
  roomId: string      // which room they're in
  seatCol: number     // local col within room
  seatRow: number     // local row within room
  state: 'idle' | 'working' | 'waiting' | 'thinking'
  bubble: string | null
}

export const CHARACTERS: OfficeCharacter[] = [
  // War Room — Hermes (the boss)
  { id: 'hermes', name: 'Hermes',   role: 'CEO',      spriteKey: 'hermes',       roomId: 'war-room', seatCol: 3, seatRow: 2, state: 'working', bubble: 'You there! Get to work!' },

  // The Pit — frontend + backend (working)
  { id: 'rian',   name: 'Rian',     role: 'frontend-dev', spriteKey: 'frontend-dev', roomId: 'pit',    seatCol: 1, seatRow: 1, state: 'working', bubble: null },
  { id: 'clio',   name: 'Clio',     role: 'backend-dev',  spriteKey: 'backend-dev',  roomId: 'pit',    seatCol: 3, seatRow: 1, state: 'working', bubble: 'CRUD again' },
  { id: 'sage',   name: 'Sage',     role: 'devops',       spriteKey: 'devops',       roomId: 'pit',    seatCol: 5, seatRow: 1, state: 'waiting', bubble: 'Waiting on deploy approval...' },

  // Lounge — QA + extra
  { id: 'hawk',   name: 'Hawk',     role: 'qa-engineer',  spriteKey: 'qa-engineer',  roomId: 'lounge', seatCol: 2, seatRow: 2, state: 'idle',    bubble: 'Bug hunting.' },
  { id: 'bolt',   name: 'Bolt',     role: 'frontend-dev', spriteKey: 'frontend-dev', roomId: 'lounge', seatCol: 5, seatRow: 2, state: 'idle',    bubble: 'Coffee?' },

  // Depths — break room
  { id: 'mira',   name: 'Mira',     role: 'frontend-dev', spriteKey: 'frontend-dev', roomId: 'depths', seatCol: 3, seatRow: 1, state: 'idle',    bubble: 'Any weekend plans?' },
]

// Furniture — placed per room (col, row in room-local coordinates)
export interface OfficeFurniture {
  type: 'desk' | 'chair' | 'plant' | 'couch' | 'firepit' | 'bookshelf' | 'water_cooler' | 'vending' | 'lamp' | 'throne' | 'table' | 'barrel' | 'rug' | 'candle' | 'pentagram' | 'banner'
  col: number
  row: number
  variant?: number  // sprite variant within type
}

export const FURNITURE: Record<string, OfficeFurniture[]> = {
  'war-room': [
    // Throne at the back wall (Hermes sits in front of it on row 2)
    { type: 'throne', col: 3, row: 0, variant: 0 },
    { type: 'throne', col: 4, row: 0, variant: 0 },
    // Lava firepits flanking
    { type: 'firepit', col: 0, row: 1, variant: 0 },
    { type: 'firepit', col: 7, row: 1, variant: 0 },
    // Banners on back wall
    { type: 'banner', col: 1, row: 0, variant: 0 },
    { type: 'banner', col: 6, row: 0, variant: 0 },
    // Pentagram table in center
    { type: 'pentagram', col: 3, row: 3, variant: 0 },
  ],
  'pit': [
    // 3 desks with chairs
    { type: 'desk', col: 1, row: 2, variant: 0 },
    { type: 'desk', col: 3, row: 2, variant: 0 },
    { type: 'desk', col: 5, row: 2, variant: 0 },
    { type: 'chair', col: 1, row: 3, variant: 0 },
    { type: 'chair', col: 3, row: 3, variant: 0 },
    { type: 'chair', col: 5, row: 3, variant: 0 },
    // Plants in corners
    { type: 'plant', col: 0, row: 0, variant: 0 },
    { type: 'plant', col: 7, row: 0, variant: 0 },
    { type: 'plant', col: 0, row: 4, variant: 0 },
    { type: 'plant', col: 7, row: 4, variant: 0 },
    // Bookshelf
    { type: 'bookshelf', col: 0, row: 1, variant: 0 },
    { type: 'bookshelf', col: 7, row: 1, variant: 0 },
  ],
  'lounge': [
    // Couch + table (waiting area)
    { type: 'couch', col: 1, row: 1, variant: 0 },
    { type: 'table', col: 2, row: 2, variant: 0 },
    { type: 'couch', col: 4, row: 1, variant: 0 },
    // Water cooler
    { type: 'water_cooler', col: 0, row: 0, variant: 0 },
    // Vending
    { type: 'vending', col: 7, row: 0, variant: 0 },
    // Plants
    { type: 'plant', col: 0, row: 3, variant: 1 },
    { type: 'plant', col: 7, row: 3, variant: 1 },
    // Rug under couches
    { type: 'rug', col: 2, row: 1, variant: 0 },
  ],
  'depths': [
    // Break room: couch, table, vending, water cooler
    { type: 'couch', col: 1, row: 1, variant: 0 },
    { type: 'table', col: 2, row: 2, variant: 0 },
    { type: 'barrel', col: 0, row: 0, variant: 0 },
    { type: 'barrel', col: 0, row: 1, variant: 0 },
    { type: 'vending', col: 7, row: 0, variant: 0 },
    // Candles for ambience
    { type: 'candle', col: 1, row: 3, variant: 0 },
    { type: 'candle', col: 6, row: 3, variant: 0 },
    { type: 'candle', col: 3, row: 3, variant: 0 },
    { type: 'candle', col: 4, row: 3, variant: 0 },
    { type: 'rug', col: 2, row: 1, variant: 1 },
  ],
  'catacombs-top': [],
  'catacombs-mid': [],
}
