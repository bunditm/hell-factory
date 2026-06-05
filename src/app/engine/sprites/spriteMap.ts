// Sprite map — central registry of all sprites in the engine
// Each sprite is a SpriteData (string[][])

import type { SpriteData } from '../sprites'
import { FURNITURE_FIREPIT, FIRE_TREE as OLD_FIRE_TREE } from '../pixelArt'

// Floor tiles
import {
  WOOD_PLANKS, STONE_TILE, CARPET_RED, CARPET_BLUE, CARPET_PURPLE,
} from './tiles/floor'
// Wall tiles
import {
  WALL_STONE, WALL_WINDOW, WALL_WINDOW_TOP, WALL_WINDOW_BOTTOM, WALL_DOOR, WALL_PILLAR,
} from './tiles/walls'
// Furniture
import { CHAIR_DOWN, CHAIR_UP, CHAIR_LEFT, CHAIR_RIGHT } from './furniture/chair'
import { DESK_WOOD, DESK_HERMES } from './furniture/desk'
import { LAMP_DESK, LAMP_WALL, LAMP_FLOOR } from './furniture/lamp'
import {
  BOOKSHELF, WATER_COOLER, VENDING_MACHINE, FILING_CABINET, WHITEBOARD, CLOCK,
} from './furniture/storage'
import { PAINTING, BULLETIN, MIRROR, STATUE, FLAG } from './furniture/decor'
// Plants
import {
  PLANT_FERN, PLANT_PALM, PLANT_FLOWER, PLANT_CACTUS, PLANT_BUSH, PLANT_HANGING,
} from './plants'
// Carpets
import { RUG_HELL, RUG_OFFICE, RUG_THRONE } from './carpets'
// Characters
import { CHARACTERS, getCharacterFrame } from './characters'

// === FLOOR ===
export const FLOOR = {
  wood: WOOD_PLANKS,
  stone: STONE_TILE,
  carpet_red: CARPET_RED,
  carpet_blue: CARPET_BLUE,
  carpet_purple: CARPET_PURPLE,
}

// === WALLS ===
export const WALLS = {
  stone: WALL_STONE,
  window: WALL_WINDOW,
  window_top: WALL_WINDOW_TOP,
  window_bottom: WALL_WINDOW_BOTTOM,
  door: WALL_DOOR,
  pillar: WALL_PILLAR,
}

// === FURNITURE ===
export const FURNITURE = {
  desk_wood: DESK_WOOD,
  desk_hermes: DESK_HERMES,
  chair_down: CHAIR_DOWN,
  chair_up: CHAIR_UP,
  chair_left: CHAIR_LEFT,
  chair_right: CHAIR_RIGHT,
  lamp_desk: LAMP_DESK,
  lamp_wall: LAMP_WALL,
  lamp_floor: LAMP_FLOOR,
  bookshelf: BOOKSHELF,
  water_cooler: WATER_COOLER,
  vending_machine: VENDING_MACHINE,
  filing_cabinet: FILING_CABINET,
  whiteboard: WHITEBOARD,
  clock: CLOCK,
  painting: PAINTING,
  bulletin: BULLETIN,
  mirror: MIRROR,
  statue: STATUE,
  flag: FLAG,
}

// === PLANTS ===
export const PLANTS = {
  fern: PLANT_FERN,
  palm: PLANT_PALM,
  flower: PLANT_FLOWER,
  cactus: PLANT_CACTUS,
  bush: PLANT_BUSH,
  hanging: PLANT_HANGING,
}

// === CARPETS ===
export const CARPETS = {
  hell: RUG_HELL,
  office: RUG_OFFICE,
  throne: RUG_THRONE,
}

// === ALL SPRITES (flat registry for renderer lookup) ===
export const ALL_SPRITES: Record<string, SpriteData> = {
  ...FLOOR,
  ...WALLS,
  ...FURNITURE,
  ...PLANTS,
  ...CARPETS,
  // Add legacy sprites still referenced by renderer
  firepit: FURNITURE_FIREPIT,
  tree: OLD_FIRE_TREE,
}

// === CHARACTER API ===
export { CHARACTERS, getCharacterFrame }

// Helper to get any sprite by name
export function getSprite(name: string): SpriteData | null {
  return ALL_SPRITES[name] || null
}
