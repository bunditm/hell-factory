// Character sprite definitions as SpriteData
// SpriteData = string[][] where '' = transparent

export type SpriteData = string[][]

export type CharacterState = 'idle' | 'walk' | 'type'
export type Direction = 0 | 1 | 2 | 3  // DOWN=0, LEFT=1, RIGHT=2, UP=3

// Helper to upscale sprite
function upscale(sprite: string[][], factor: number): SpriteData {
  const rows = sprite.length
  const cols = sprite[0]?.length || 0
  const result: SpriteData = []
  for (let r = 0; r < rows; r++) {
    const newRow: string[] = []
    for (let c = 0; c < cols; c++) {
      for (let i = 0; i < factor; i++) newRow.push(sprite[r][c])
    }
    for (let i = 0; i < factor; i++) result.push([...newRow])
  }
  return result
}

// Base sprite (16x24 character, 2x upscale to 32x48)
const _: string = ''

// Simple character sprites for different states
// These are basic placeholder sprites — will be replaced with Metro City assets

/** DOWN facing walk/idle sprite (32x48) */
const BASE_DOWN: string[][] = [
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,'#3d8b37','#3d8b37','#3d8b37','#3d8b37','#3d8b37','#3d8b37',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,'#3d8b37','#4a9e42','#4a9e42','#4a9e42','#4a9e42','#4a9e42','#3d8b37',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,'#3d8b37','#4a9e42','#f5deb3','#f5deb3','#f5deb3','#f5deb3','#f5deb3','#4a9e42','#3d8b37',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,'#3d8b37','#4a9e42','#f5deb3','#333333','#333333','#333333','#f5deb3','#4a9e42','#3d8b37',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,'#3d8b37','#4a9e42','#f5deb3','#333333','#333333','#f5deb3','#4a9e42','#3d8b37',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,'#3d8b37','#4a9e42','#4a9e42','#4a9e42','#4a9e42','#4a9e42','#3d8b37',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,'#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,'#1a1a2e','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#1a1a2e',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,'#1a1a2e','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#1a1a2e',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,'#1a1a2e','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#1a1a2e',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,'#1a1a2e','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#2d2d4a','#1a1a2e',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,'#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e','#1a1a2e',_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
]

// Simple placeholder — just a colored rectangle for now
// Real sprites will use Metro City asset pack
export const PLACEHOLDER_SPRITE: SpriteData = Array(32).fill(null).map(() =>
  Array(32).fill('#888888')
)

// Character sprite data organized by state and direction
export interface CharacterSprites {
  type: SpriteData[][]   // [dir][frame]
  walk: SpriteData[][]   // [dir][frame]
}

// 6 palettes — base colors for different agents
export const PALETTE_COLORS = [
  '#3d8b37', // green (hermes)
  '#1e40af', // blue (frontend-dev)
  '#7c3aed', // purple (backend-dev)
  '#dc2626', // red (devops)
  '#d97706', // orange (qa-engineer)
  '#0891b2', // cyan
]

export function createCharacterSprites(paletteIndex: number): CharacterSprites {
  const baseColor = PALETTE_COLORS[paletteIndex % PALETTE_COLORS.length]

  // Simple approach: use same base sprite for all states/dirs
  // Real implementation would load Metro City sprites
  const sprite = Array(48).fill(null).map((_, row) =>
    Array(32).fill(null).map((_, col) => {
      // Simple pixel art: body outline
      const isEdge = row === 0 || row === 47 || col === 0 || col === 31
      const isHeadRow = row >= 4 && row <= 16
      const isBodyRow = row >= 18 && row <= 38
      if (isHeadRow) {
        if (col >= 10 && col <= 21) return baseColor
        if (isEdge) return baseColor
      }
      if (isBodyRow) {
        if (col >= 8 && col <= 23) return baseColor
        if (isEdge) return baseColor
      }
      return ''
    })
  )

  return {
    type: Array(4).fill(null).map(() => [sprite, sprite]),  // 4 dirs × 2 frames
    walk: Array(4).fill(null).map(() => [sprite, sprite, sprite, sprite]), // 4 dirs × 4 frames
  }
}

// All character sprites (6 agents)
export const ALL_CHARACTER_SPRITES: CharacterSprites[] = Array(6).fill(null).map((_, i) =>
  createCharacterSprites(i)
)