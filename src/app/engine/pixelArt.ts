// Hell Factory pixel art — HELL_FIRE palette, designed for the office mockup
// All sprites are 32x48 (character), 32x32 (furniture), 16x16 (small)

import type { SpriteData } from './sprites'

const _: string = ''

// === HELL_FIRE PALETTE (16 colors) ===
export const HELL_FIRE = {
  void:       '#000000',
  black:      '#0a0000',
  darkRed:    '#1a0500',
  deepRed:    '#3d0000',
  red:        '#6a0000',
  crimson:    '#aa0000',
  fireRed:    '#cc2200',
  fireOrange: '#ff5500',
  orange:     '#ff7700',
  amber:      '#ffaa00',
  yellow:     '#ffdd00',
  gold:       '#ffff66',
  ash:        '#3d3d3d',
  smoke:      '#5a5a5a',
  bone:       '#d4c4a8',
  white:      '#ffffaa',
} as const

// === CHARACTER SPRITE (32x48) — Hellish humanoid ===
function makeAgentSprite(bodyColor: string, trim: string, head: string): SpriteData {
  const c: string = bodyColor
  const t: string = trim
  const h: string = head
  const k: string = HELL_FIRE.black
  return [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,t,h,h,h,h,h,h,h,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,t,h,HELL_FIRE.crimson,h,HELL_FIRE.crimson,h,h,h,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,t,h,h,h,HELL_FIRE.crimson,h,h,h,HELL_FIRE.crimson,h,t,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,t,h,h,h,h,h,h,h,h,h,h,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,t,h,HELL_FIRE.yellow,h,HELL_FIRE.void,HELL_FIRE.yellow,h,h,h,h,h,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,t,h,h,h,h,h,h,h,h,h,h,h,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,t,h,h,h,HELL_FIRE.crimson,h,h,HELL_FIRE.crimson,h,h,h,h,t,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,t,h,h,h,h,h,h,h,h,h,h,h,h,h,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,t,h,h,h,h,h,h,h,h,h,h,h,h,h,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,c,c,c,t,t,t,t,t,t,t,t,t,t,c,c,c,t,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,t,c,c,c,c,c,t,t,t,t,t,t,t,t,c,c,c,c,c,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,t,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,t,c,c,HELL_FIRE.fireRed,c,c,c,c,c,c,c,c,c,c,c,c,c,HELL_FIRE.fireRed,c,t,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,t,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,t,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,t,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,t,t,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,c,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,HELL_FIRE.fireRed,HELL_FIRE.fireRed,t,t,t,HELL_FIRE.fireRed,HELL_FIRE.fireRed,t,t,t,HELL_FIRE.fireRed,HELL_FIRE.fireRed,t,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,HELL_FIRE.fireRed,HELL_FIRE.fireRed,t,t,t,HELL_FIRE.fireRed,HELL_FIRE.fireRed,t,t,t,HELL_FIRE.fireRed,HELL_FIRE.fireRed,t,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,t,t,c,c,t,t,t,t,t,t,t,t,c,c,t,t,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,t,c,c,c,t,_,_,_,_,_,_,_,_,t,c,c,c,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,t,c,c,t,_,_,_,_,_,_,_,_,_,_,t,c,c,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,c,c,t,_,_,_,_,_,_,_,_,_,_,_,_,t,c,c,t,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,c,t,_,_,_,_,_,_,_,_,_,_,_,_,_,_,t,c,t,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,t,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,t,t,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,k,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,k,t,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,t,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,t,t,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,k,k,_,_,_,_,_,_,_,_,_,_,_,_,_,_,k,k,t,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,k,k,_,_,_,_,_,_,_,_,_,_,_,_,_,_,k,k,t,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,t,t,_,_,_,_,_,_,_,_,_,_,_,_,_,_,t,t,t,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,HELL_FIRE.smoke,HELL_FIRE.smoke,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HELL_FIRE.smoke,HELL_FIRE.smoke,_,_,_,_,_,_,_,_],
    [_,_,_,HELL_FIRE.smoke,HELL_FIRE.ash,HELL_FIRE.smoke,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HELL_FIRE.smoke,HELL_FIRE.ash,HELL_FIRE.smoke,_,_,_,_,_,_,_,_],
    [_,_,_,_,HELL_FIRE.ash,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HELL_FIRE.ash,_,_,_,_,_,_,_,_,_],
  ]
}

// Hermes sprite — distinct crown, red robe
function makeHermesSprite(): SpriteData {
  const t: string = HELL_FIRE.deepRed
  const k: string = HELL_FIRE.black
  return [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,_,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,_,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,_,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,_,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.gold,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,_,HELL_FIRE.gold,HELL_FIRE.gold,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.gold,HELL_FIRE.gold,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,t,HELL_FIRE.fireRed,t,t,t,t,t,t,HELL_FIRE.fireRed,t,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,t,t,HELL_FIRE.fireRed,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.fireRed,t,t,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,t,t,t,HELL_FIRE.crimson,HELL_FIRE.yellow,HELL_FIRE.void,HELL_FIRE.yellow,HELL_FIRE.crimson,HELL_FIRE.void,HELL_FIRE.yellow,HELL_FIRE.crimson,t,t,t,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,t,t,t,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,t,t,t,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,t,t,t,t,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,t,t,t,t,t,t,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,t,t,t,t,t,t,t,t,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,HELL_FIRE.crimson,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_],
    [_,t,HELL_FIRE.gold,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,HELL_FIRE.gold,_,_,_,_,_,_,_,_,_,_],
    [_,t,HELL_FIRE.gold,HELL_FIRE.gold,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,HELL_FIRE.gold,HELL_FIRE.gold,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,HELL_FIRE.gold,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,HELL_FIRE.gold,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,t,t,t,t,t,t,t,t,t,t,t,t,t,t,t,_,_,_,_,_,_,_,_,_,_,_,_],
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
    [_,_,_,HELL_FIRE.smoke,HELL_FIRE.smoke,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HELL_FIRE.smoke,HELL_FIRE.smoke,_,_,_,_,_,_,_,_],
    [_,_,_,HELL_FIRE.smoke,HELL_FIRE.ash,HELL_FIRE.smoke,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HELL_FIRE.smoke,HELL_FIRE.ash,HELL_FIRE.smoke,_,_,_,_,_,_,_,_],
    [_,_,_,_,HELL_FIRE.ash,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,HELL_FIRE.ash,_,_,_,_,_,_,_,_,_],
  ]
}

// Palette definitions for each agent profile
export interface AgentPalette {
  body: string
  trim: string
  head: string
  name: string
}

export const AGENT_PALETTES: Record<string, AgentPalette> = {
  hermes:        { body: HELL_FIRE.crimson,  trim: HELL_FIRE.deepRed, head: HELL_FIRE.bone,  name: 'Hermes' },
  'frontend-eng':{ body: HELL_FIRE.fireOrange, trim: HELL_FIRE.red,   head: HELL_FIRE.bone,  name: 'frontend-dev' },
  'backend-eng': { body: '#7c2a00',          trim: HELL_FIRE.deepRed, head: HELL_FIRE.bone,  name: 'backend-dev' },
  'ops':         { body: HELL_FIRE.smoke,     trim: HELL_FIRE.ash,    head: HELL_FIRE.bone,  name: 'devops' },
  'qa':          { body: HELL_FIRE.gold,      trim: HELL_FIRE.amber,  head: HELL_FIRE.black, name: 'qa-engineer' },
}

// Cached sprites per profile
const SPRITE_CACHE: Record<string, SpriteData> = {}

export function getAgentSprite(profile: string): SpriteData {
  if (SPRITE_CACHE[profile]) return SPRITE_CACHE[profile]
  if (profile === 'hermes') {
    SPRITE_CACHE[profile] = makeHermesSprite()
  } else {
    const palette = AGENT_PALETTES[profile] || AGENT_PALETTES['frontend-eng']
    SPRITE_CACHE[profile] = makeAgentSprite(palette.body, palette.trim, palette.head)
  }
  return SPRITE_CACHE[profile]
}

// === FURNITURE SPRITES (32x32) ===

// Desk — black/charred wood with red trim
function makeDeskSprite(): SpriteData {
  const k: string = HELL_FIRE.black
  const d: string = HELL_FIRE.darkRed
  const r: string = HELL_FIRE.deepRed
  const sprite: SpriteData = []
  for (let y = 0; y < 32; y++) {
    const row: string[] = []
    for (let x = 0; x < 32; x++) {
      let c: string = r
      if (y === 0 || y === 31 || x === 0 || x === 31) c = k
      else if (y === 1 || y === 30 || x === 1 || x === 30) c = d
      else if (y === 2 && x === 2) c = HELL_FIRE.fireRed
      else c = r
      row.push(c)
    }
    sprite.push(row)
  }
  return sprite
}

// Chair (16x16) — small dark throne
function makeChairSprite(): SpriteData {
  const k: string = HELL_FIRE.black
  const d: string = HELL_FIRE.deepRed
  const r: string = HELL_FIRE.crimson
  const f: string = HELL_FIRE.fireRed
  const sprite: SpriteData = []
  for (let y = 0; y < 16; y++) {
    const row: string[] = Array(16).fill(k)
    if (y >= 1 && y <= 4 && x_in(y, 3, 12)) {
      row[3] = d; row[4] = d; row[5] = d; row[6] = d; row[7] = d; row[8] = d; row[9] = d; row[10] = d; row[11] = d; row[12] = d
      if (y === 2) {
        for (let x = 3; x <= 12; x++) row[x] = r
      }
      if (y === 3) {
        for (let x = 4; x <= 11; x++) row[x] = d
      }
      if (y === 4) {
        for (let x = 3; x <= 12; x++) row[x] = r
      }
    }
    if (y >= 7 && y <= 9 && x_in(y, 4, 11)) {
      for (let x = 4; x <= 11; x++) {
        row[x] = y === 8 ? f : d
      }
    }
    if (y >= 11 && y <= 14) {
      row[5] = k; row[10] = k
    }
    sprite.push(row)
  }
  return sprite

  function x_in(_y: number, _lo: number, _hi: number) { return true }
}

// Plant (16x16) — withered tree in red pot
function makePlantSprite(): SpriteData {
  const k: string = HELL_FIRE.black
  const s: SpriteData = []
  for (let i = 0; i < 16; i++) s.push(Array(16).fill(k))
  // Branches
  s[2][8] = HELL_FIRE.fireRed
  s[3][7] = HELL_FIRE.crimson
  s[4][7] = HELL_FIRE.red; s[4][8] = HELL_FIRE.red
  s[5][6] = HELL_FIRE.crimson; s[5][7] = HELL_FIRE.crimson; s[5][8] = HELL_FIRE.crimson; s[5][9] = HELL_FIRE.crimson
  s[6][5] = '#1a3d1a'; s[6][6] = '#1a3d1a'; s[6][9] = '#1a3d1a'; s[6][10] = '#1a3d1a'
  s[7][6] = '#2a5a2a'; s[7][7] = '#2a5a2a'; s[7][8] = '#2a5a2a'; s[7][9] = '#2a5a2a'
  s[8][7] = '#1a3d1a'; s[8][8] = '#1a3d1a'
  // Pot
  for (let x = 5; x <= 10; x++) s[10][x] = HELL_FIRE.deepRed
  for (let x = 4; x <= 11; x++) {
    s[11][x] = x === 4 || x === 11 ? HELL_FIRE.red : HELL_FIRE.crimson
    s[12][x] = x === 4 || x === 11 ? HELL_FIRE.red : HELL_FIRE.deepRed
  }
  for (let x = 5; x <= 10; x++) {
    s[13][x] = HELL_FIRE.crimson
    s[14][x] = HELL_FIRE.red
  }
  for (let x = 4; x <= 11; x++) s[15][x] = HELL_FIRE.deepRed
  return s
}

// Couch (48x16) — long red couch
function makeCouchSprite(): SpriteData {
  const k: string = HELL_FIRE.black
  const d: string = HELL_FIRE.deepRed
  const r: string = HELL_FIRE.crimson
  const f: string = HELL_FIRE.fireRed
  const sprite: SpriteData = []
  for (let y = 0; y < 16; y++) {
    const row: string[] = Array(48).fill(k)
    if (y >= 1 && y <= 6) {
      for (let x = 1; x <= 46; x++) {
        if (y === 1) row[x] = d
        else if (y === 2 || y === 5) row[x] = r
        else row[x] = f
      }
    }
    if (y >= 1 && y <= 10) {
      row[0] = d; row[47] = d
    }
    if (y >= 8 && y <= 10) {
      for (let x = 2; x <= 45; x++) {
        row[x] = y === 8 ? f : (y === 9 ? r : d)
      }
    }
    if (y >= 11 && y <= 15) {
      row[3] = y === 11 ? d : k
      row[44] = y === 11 ? d : k
    }
    sprite.push(row)
  }
  return sprite
}

// Pillar (32x32) — obsidian column
function makePillarSprite(): SpriteData {
  const k: string = HELL_FIRE.black
  const d: string = HELL_FIRE.darkRed
  const r: string = HELL_FIRE.deepRed
  const sprite: SpriteData = []
  for (let y = 0; y < 32; y++) {
    const row: string[] = Array(32).fill(k)
    if (y >= 4 && y <= 28) {
      for (let x = 8; x <= 23; x++) {
        if (x === 8 || x === 23) row[x] = d
        else if (x === 9 || x === 22) row[x] = r
        else row[x] = k
      }
    }
    if (y >= 0 && y <= 3) {
      for (let x = 4; x <= 27; x++) {
        if (y === 0) row[x] = d
        else if (y === 1) row[x] = r
        else if (y === 2) row[x] = d
        else row[x] = k
      }
    }
    if (y >= 28 && y <= 31) {
      for (let x = 4; x <= 27; x++) {
        if (y === 28) row[x] = d
        else if (y === 29) row[x] = r
        else if (y === 30) row[x] = d
        else row[x] = k
      }
    }
    sprite.push(row)
  }
  return sprite
}

// Firepit (32x32) — glowing lava pit with stone ring
function makeFirepitSprite(): SpriteData {
  const k: string = HELL_FIRE.black
  const d: string = HELL_FIRE.darkRed
  const r: string = HELL_FIRE.deepRed
  const o: string = HELL_FIRE.fireOrange
  const y: string = HELL_FIRE.yellow
  const w: string = HELL_FIRE.gold
  const sprite: SpriteData = []
  for (let yi = 0; yi < 32; yi++) {
    const row: string[] = Array(32).fill(k)
    for (let x = 6; x <= 25; x++) {
      const dx = x - 15.5; const dy = yi - 15.5
      const d2 = Math.sqrt(dx*dx + dy*dy)
      if (d2 > 8.5 && d2 < 11) row[x] = d
      else if (d2 <= 8.5 && d2 > 6) row[x] = r
      else if (d2 <= 6) row[x] = o
      if (d2 <= 3.5) row[x] = y
      if (d2 <= 1.5) row[x] = w
    }
    sprite.push(row)
  }
  return sprite
}

export const FURNITURE_SPRITES: Record<string, SpriteData> = {
  desk: makeDeskSprite(),
  chair: makeChairSprite(),
  plant: makePlantSprite(),
  couch: makeCouchSprite(),
  pillar: makePillarSprite(),
  firepit: makeFirepitSprite(),
}

export function getFurnitureSprite(type: string): SpriteData {
  return FURNITURE_SPRITES[type] || FURNITURE_SPRITES.desk
}
