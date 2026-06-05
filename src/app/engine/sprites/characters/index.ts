// Top-down character sprites — 16x16, chibi view
// 4 profiles + Hermes, each with 4-direction walk (4 frames) + typing (2 frames)

import { HELL_FIRE } from '../../pixelArt'
import type { SpriteData } from '../../sprites'

const _: string = ''

// Profile color schemes
interface ProfileColors {
  hair: string
  hairDark: string
  shirt: string
  shirtDark: string
  shirtLight: string
  skin: string
  skinDark: string
  eyes: string
  name: string
}

const PROFILES: Record<string, ProfileColors> = {
  'frontend-eng': {
    hair: '#ff8833', hairDark: '#aa4400',
    shirt: '#3d6acc', shirtDark: '#1a3a88', shirtLight: '#5a8aff',
    skin: HELL_FIRE.bone, skinDark: '#aa8a66',
    eyes: HELL_FIRE.lavaGlow,
    name: 'frontend',
  },
  'backend-eng': {
    hair: '#5a3a1a', hairDark: '#3a1a00',
    shirt: '#6a4a2a', shirtDark: '#3a1a00', shirtLight: '#8a6a4a',
    skin: HELL_FIRE.bone, skinDark: '#aa8a66',
    eyes: HELL_FIRE.lavaBright,
    name: 'backend',
  },
  'ops': {
    hair: '#1a1a1a', hairDark: '#0a0a0a',
    shirt: '#2a5a2a', shirtDark: '#0a3a0a', shirtLight: '#4a8a4a',
    skin: HELL_FIRE.bone, skinDark: '#aa8a66',
    eyes: HELL_FIRE.lavaYellow,
    name: 'devops',
  },
  'qa': {
    hair: '#ddcc44', hairDark: '#aa9900',
    shirt: '#cc8822', shirtDark: '#884400', shirtLight: '#eeaa44',
    skin: HELL_FIRE.bone, skinDark: '#aa8a66',
    eyes: HELL_FIRE.lavaGlow,
    name: 'qa',
  },
  'hermes': {
    hair: '#ffffff', hairDark: '#aaaaaa',
    shirt: HELL_FIRE.goldMid, shirtDark: HELL_FIRE.goldDark, shirtLight: HELL_FIRE.goldBright,
    skin: HELL_FIRE.bone, skinDark: '#aa8a66',
    eyes: HELL_FIRE.lavaWhite,
    name: 'hermes',
  },
}

// === FRAME GENERATORS ===

// DOWN-facing (looking at camera — back of head + shoulders, body)
// Row 0-1: empty
// Row 2-7: head (round, hair on top, face on bottom)
// Row 8-9: shoulders/upper body
// Row 10-15: body (legs visible from above, walking animation)
function makeFrameDown(p: ProfileColors, walkFrame: number, isTyping: boolean): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 16; i++) s.push(Array(16).fill(_))
  // Hair/head (rows 2-7, cols 4-11)
  for (let y = 2; y <= 7; y++) {
    for (let x = 4; x <= 11; x++) {
      if (y === 2 && (x === 4 || x === 11)) continue  // round top
      s[y][x] = (x === 4 || x === 11) ? p.hairDark : p.hair
    }
  }
  // Round top corners
  s[3][3] = p.hairDark; s[3][12] = p.hairDark
  s[4][3] = p.hair; s[4][12] = p.hair
  s[5][3] = p.hair; s[5][12] = p.hair
  s[6][3] = p.hair; s[6][12] = p.hair
  // Face (rows 6-7, cols 5-10) — small face area
  for (let y = 6; y <= 7; y++) {
    for (let x = 5; x <= 10; x++) {
      s[y][x] = p.skin
    }
  }
  // Eyes (row 6, cols 6, 9)
  s[6][6] = p.eyes
  s[6][9] = p.eyes
  // Hair fringe
  s[5][6] = p.hairDark; s[5][9] = p.hairDark
  // Shoulders (row 8-9, cols 3-12)
  for (let y = 8; y <= 9; y++) {
    for (let x = 3; x <= 12; x++) {
      if (y === 8 && (x === 3 || x === 12)) s[y][x] = p.shirtDark
      else if (y === 9 && (x === 3 || x === 12)) s[y][x] = p.shirtDark
      else s[y][x] = (x === 3 || x === 12) ? p.shirtDark : p.shirt
    }
  }
  // Body (rows 10-13, cols 4-11)
  for (let y = 10; y <= 13; y++) {
    for (let x = 4; x <= 11; x++) {
      if (x === 4 || x === 11) s[y][x] = p.shirtDark
      else s[y][x] = p.shirt
    }
  }
  // Walk animation: legs shift left-right
  // Frame 0: legs together (default above)
  // Frame 1: left leg forward
  // Frame 2: legs together
  // Frame 3: right leg forward
  if (walkFrame === 1) {
    // Left leg forward (slightly visible)
    s[14][5] = p.shirtDark
    s[14][6] = p.shirtDark
    s[15][5] = p.skinDark
    s[15][6] = p.skinDark
  } else if (walkFrame === 3) {
    // Right leg forward
    s[14][9] = p.shirtDark
    s[14][10] = p.shirtDark
    s[15][9] = p.skinDark
    s[15][10] = p.skinDark
  } else {
    // Legs together
    s[14][6] = p.shirtDark; s[14][7] = p.shirtDark; s[14][8] = p.shirtDark; s[14][9] = p.shirtDark
    s[15][6] = p.skinDark; s[15][7] = p.skinDark; s[15][8] = p.skinDark; s[15][9] = p.skinDark
  }
  // Typing animation: arm small movement (frame 0 default, frame 1 arm forward)
  if (isTyping) {
    if (walkFrame % 2 === 1) {
      // Arm forward
      s[10][3] = p.skin
      s[10][4] = p.skin
      s[9][3] = p.shirtLight
    } else {
      s[10][3] = p.skin
      s[9][3] = p.skin
    }
  }
  return s
}

// UP-facing (back of head + back of body, no face)
function makeFrameUp(p: ProfileColors, walkFrame: number): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 16; i++) s.push(Array(16).fill(_))
  // Head — back view, more hair visible
  for (let y = 2; y <= 7; y++) {
    for (let x = 4; x <= 11; x++) {
      if (y === 2 && (x === 4 || x === 11)) continue
      s[y][x] = (x === 4 || x === 11) ? p.hairDark : p.hair
    }
  }
  s[3][3] = p.hairDark; s[3][12] = p.hairDark
  s[4][3] = p.hair; s[4][12] = p.hair
  s[5][3] = p.hair; s[5][12] = p.hair
  s[6][3] = p.hair; s[6][12] = p.hair
  // No face — all hair (rows 6-7)
  for (let x = 5; x <= 10; x++) {
    s[6][x] = p.hair
    s[7][x] = p.hair
  }
  s[6][4] = p.hairDark; s[6][11] = p.hairDark
  s[7][4] = p.hairDark; s[7][11] = p.hairDark
  // Shoulders (back of body)
  for (let y = 8; y <= 9; y++) {
    for (let x = 3; x <= 12; x++) {
      s[y][x] = (x === 3 || x === 12) ? p.shirtDark : p.shirt
    }
  }
  // Back of body
  for (let y = 10; y <= 13; y++) {
    for (let x = 4; x <= 11; x++) {
      s[y][x] = (x === 4 || x === 11) ? p.shirtDark : p.shirt
    }
  }
  // Legs
  if (walkFrame === 1) {
    s[14][5] = p.shirtDark; s[14][6] = p.shirtDark
    s[15][5] = p.skinDark; s[15][6] = p.skinDark
  } else if (walkFrame === 3) {
    s[14][9] = p.shirtDark; s[14][10] = p.shirtDark
    s[15][9] = p.skinDark; s[15][10] = p.skinDark
  } else {
    s[14][6] = p.shirtDark; s[14][7] = p.shirtDark; s[14][8] = p.shirtDark; s[14][9] = p.shirtDark
    s[15][6] = p.skinDark; s[15][7] = p.skinDark; s[15][8] = p.skinDark; s[15][9] = p.skinDark
  }
  return s
}

// LEFT-facing (profile, 3/4 view)
function makeFrameLeft(p: ProfileColors, walkFrame: number): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 16; i++) s.push(Array(16).fill(_))
  // Head — shifted right (face pointing left)
  for (let y = 2; y <= 7; y++) {
    for (let x = 5; x <= 11; x++) {
      if (y === 2 && (x === 5 || x === 11)) continue
      s[y][x] = (x === 5 || x === 11) ? p.hairDark : p.hair
    }
  }
  s[3][4] = p.hairDark; s[3][12] = p.hairDark
  s[4][4] = p.hair; s[4][12] = p.hair
  s[5][4] = p.hair; s[5][12] = p.hair
  // Face (visible from side) — left side
  for (let y = 5; y <= 7; y++) {
    for (let x = 4; x <= 7; x++) {
      s[y][x] = p.skin
    }
  }
  // Eye (one visible from side)
  s[5][5] = p.eyes
  // Nose
  s[6][4] = p.skinDark
  // Hair on top continues
  for (let x = 5; x <= 11; x++) {
    s[5][x] = p.hair
    s[6][x] = p.hair
    s[7][x] = p.hair
  }
  // Shoulders
  for (let y = 8; y <= 9; y++) {
    for (let x = 3; x <= 12; x++) {
      s[y][x] = (x === 3 || x === 12) ? p.shirtDark : p.shirt
    }
  }
  // Body
  for (let y = 10; y <= 13; y++) {
    for (let x = 4; x <= 11; x++) {
      s[y][x] = (x === 4 || x === 11) ? p.shirtDark : p.shirt
    }
  }
  // Legs (side walk)
  if (walkFrame === 1) {
    s[14][5] = p.shirtDark; s[14][6] = p.shirtDark
    s[15][5] = p.skinDark; s[15][6] = p.skinDark
  } else if (walkFrame === 3) {
    s[14][7] = p.shirtDark; s[14][8] = p.shirtDark
    s[15][7] = p.skinDark; s[15][8] = p.skinDark
  } else {
    s[14][6] = p.shirtDark; s[14][7] = p.shirtDark
    s[15][6] = p.skinDark; s[15][7] = p.skinDark
  }
  return s
}

// RIGHT-facing (profile, mirror of left)
function makeFrameRight(p: ProfileColors, walkFrame: number): SpriteData {
  const s: SpriteData = []
  for (let i = 0; i < 16; i++) s.push(Array(16).fill(_))
  for (let y = 2; y <= 7; y++) {
    for (let x = 4; x <= 10; x++) {
      if (y === 2 && (x === 4 || x === 10)) continue
      s[y][x] = (x === 4 || x === 10) ? p.hairDark : p.hair
    }
  }
  s[3][3] = p.hairDark; s[3][11] = p.hairDark
  s[4][3] = p.hair; s[4][11] = p.hair
  s[5][3] = p.hair; s[5][11] = p.hair
  // Face — right side
  for (let y = 5; y <= 7; y++) {
    for (let x = 8; x <= 11; x++) {
      s[y][x] = p.skin
    }
  }
  s[5][10] = p.eyes
  s[6][11] = p.skinDark
  for (let x = 4; x <= 10; x++) {
    s[5][x] = p.hair
    s[6][x] = p.hair
    s[7][x] = p.hair
  }
  for (let y = 8; y <= 9; y++) {
    for (let x = 3; x <= 12; x++) {
      s[y][x] = (x === 3 || x === 12) ? p.shirtDark : p.shirt
    }
  }
  for (let y = 10; y <= 13; y++) {
    for (let x = 4; x <= 11; x++) {
      s[y][x] = (x === 4 || x === 11) ? p.shirtDark : p.shirt
    }
  }
  if (walkFrame === 1) {
    s[14][7] = p.shirtDark; s[14][8] = p.shirtDark
    s[15][7] = p.skinDark; s[15][8] = p.skinDark
  } else if (walkFrame === 3) {
    s[14][9] = p.shirtDark; s[14][10] = p.shirtDark
    s[15][9] = p.skinDark; s[15][10] = p.skinDark
  } else {
    s[14][8] = p.shirtDark; s[14][9] = p.shirtDark
    s[15][8] = p.skinDark; s[15][9] = p.skinDark
  }
  return s
}

// === HERMES SPECIAL: Crown + cape ===
function makeHermesFrames() {
  const p = PROFILES['hermes']
  // Add gold crown on top of head, red cape on shoulders
  const addCrown = (s: SpriteData) => {
    s[0][6] = HELL_FIRE.goldBright
    s[0][7] = HELL_FIRE.goldGlow
    s[0][8] = HELL_FIRE.goldBright
    s[0][9] = HELL_FIRE.goldGlow
    s[1][5] = HELL_FIRE.goldMid
    s[1][6] = HELL_FIRE.goldBright
    s[1][7] = HELL_FIRE.goldGlow
    s[1][8] = HELL_FIRE.goldBright
    s[1][9] = HELL_FIRE.goldMid
    s[1][10] = HELL_FIRE.goldDark
    // Red cape behind shoulders
    s[8][2] = HELL_FIRE.redFire
    s[8][13] = HELL_FIRE.redFire
    s[9][2] = HELL_FIRE.redBright
    s[9][13] = HELL_FIRE.redBright
    s[10][2] = HELL_FIRE.redMid
    s[10][13] = HELL_FIRE.redMid
  }
  return {
    WALK_DOWN: [0, 1, 2, 3].map((f) => {
      const s = makeFrameDown(p, f, false); addCrown(s); return s
    }),
    WALK_UP: [0, 1, 2, 3].map((f) => {
      const s = makeFrameUp(p, f); addCrown(s); return s
    }),
    WALK_LEFT: [0, 1, 2, 3].map((f) => {
      const s = makeFrameLeft(p, f); addCrown(s); return s
    }),
    WALK_RIGHT: [0, 1, 2, 3].map((f) => {
      const s = makeFrameRight(p, f); addCrown(s); return s
    }),
    TYPE_DOWN: [0, 1].map((f) => {
      const s = makeFrameDown(p, f, true); addCrown(s); return s
    }),
  }
}

function makeProfileFrames(profile: string) {
  const p = PROFILES[profile]
  return {
    WALK_DOWN: [0, 1, 2, 3].map((f) => makeFrameDown(p, f, false)),
    WALK_UP: [0, 1, 2, 3].map((f) => makeFrameUp(p, f)),
    WALK_LEFT: [0, 1, 2, 3].map((f) => makeFrameLeft(p, f)),
    WALK_RIGHT: [0, 1, 2, 3].map((f) => makeFrameRight(p, f)),
    TYPE_DOWN: [0, 1].map((f) => makeFrameDown(p, f, true)),
  }
}

export const CHARACTERS = {
  'frontend-eng': makeProfileFrames('frontend-eng'),
  'backend-eng': makeProfileFrames('backend-eng'),
  'ops': makeProfileFrames('ops'),
  'qa': makeProfileFrames('qa'),
  'hermes': makeHermesFrames(),
}

// Convenience getters
export function getCharacterFrame(profile: string, dir: 'down' | 'up' | 'left' | 'right', frame: number, isTyping: boolean = false): SpriteData {
  const charData = CHARACTERS[profile as keyof typeof CHARACTERS] || CHARACTERS['frontend-eng']
  if (isTyping) return charData.TYPE_DOWN[frame % 2]
  switch (dir) {
    case 'down': return charData.WALK_DOWN[frame % 4]
    case 'up': return charData.WALK_UP[frame % 4]
    case 'left': return charData.WALK_LEFT[frame % 4]
    case 'right': return charData.WALK_RIGHT[frame % 4]
  }
}
