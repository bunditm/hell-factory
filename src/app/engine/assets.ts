// Asset loader — loads PNGs at runtime, slices them into frame caches.
// All hardcoded sprite arrays (pixelArt.ts) and the per-category sprites/ files
// are replaced by this. Adding a new character is: drop a PNG in public/sprites/imps/
// and add an entry to IMP_SPRITES below.

export type Frame = HTMLImageElement

export interface SpriteSheet {
  /** full source image */
  img: HTMLImageElement
  /** cell width in source pixels */
  cellW: number
  /** cell height in source pixels */
  cellH: number
  /** number of columns */
  cols: number
  /** number of rows */
  rows: number
  /** source file path */
  src: string
}

const cache: Record<string, SpriteSheet> = {}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('loadImage: window undefined (SSR)'))
      return
    }
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

/** Load a sprite sheet (assumes uniform cells, no padding) */
export async function loadSpriteSheet(
  key: string,
  src: string,
  cellW: number,
  cellH: number,
  cols: number,
  rows: number,
): Promise<SpriteSheet> {
  if (cache[key]) return cache[key]
  const img = await loadImage(src)
  const sheet: SpriteSheet = { img, cellW, cellH, cols, rows, src }
  cache[key] = sheet
  return sheet
}

/** Get a frame from a sprite sheet as a separate Image (canvas-drawn to support recolor) */
export async function getFrame(
  sheet: SpriteSheet,
  col: number,
  row: number,
): Promise<HTMLImageElement> {
  const cacheKey = `${sheet.src}#${col},${row}`
  if (frameCache[cacheKey]) return frameCache[cacheKey]
  const c = document.createElement('canvas')
  c.width = sheet.cellW
  c.height = sheet.cellH
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    sheet.img,
    col * sheet.cellW, row * sheet.cellH, sheet.cellW, sheet.cellH,
    0, 0, sheet.cellW, sheet.cellH,
  )
  const img = new Image()
  await new Promise<void>((res) => {
    img.onload = () => res()
    img.src = c.toDataURL()
  })
  frameCache[cacheKey] = img
  return img
}

const frameCache: Record<string, HTMLImageElement> = {}

/** Direct canvas draw of a frame (no intermediate Image needed) */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  col: number,
  row: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    sheet.img,
    col * sheet.cellW, row * sheet.cellH, sheet.cellW, sheet.cellH,
    dx, dy, dw, dh,
  )
}

/** Direct canvas draw from a frame Image (used for recolored frames) */
export function drawFrameImage(
  ctx: CanvasRenderingContext2D,
  frame: HTMLImageElement | HTMLCanvasElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(frame, dx, dy, dw, dh)
}

/** Recolor an image using canvas pixel manipulation. Returns canvas. */
export function recolorImage(
  source: HTMLImageElement | HTMLCanvasElement,
  transform: (r: number, g: number, b: number, a: number) => [number, number, number, number],
): HTMLCanvasElement {
  const c = document.createElement('canvas')
  const sw = source instanceof HTMLImageElement ? (source.naturalWidth || source.width) : source.width
  const sh = source instanceof HTMLImageElement ? (source.naturalHeight || source.height) : source.height
  c.width = sw
  c.height = sh
  const ctx = c.getContext('2d')!
  ctx.drawImage(source, 0, 0)
  const data = ctx.getImageData(0, 0, c.width, c.height)
  const px = data.data
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue
    const [r, g, b, a] = transform(px[i], px[i + 1], px[i + 2], px[i + 3])
    px[i] = r
    px[i + 1] = g
    px[i + 2] = b
    px[i + 3] = a
  }
  ctx.putImageData(data, 0, 0)
  return c
}

// ─── Asset manifest (the swap-friendly pattern) ────────────────────────
// To add/replace a character: change the entry below. The renderer does not
// care about the underlying image — it just looks up by key.

export interface ImpSpriteDef {
  key: string
  src: string
  /** which cell in 4x4 grid is the idle/front frame */
  idleCol: number
  idleRow: number
  /** map: direction ('D' | 'L' | 'R' | 'U') → {col, row} of walk frame */
  walkFrames: { D: [number, number]; L: [number, number]; R: [number, number]; U: [number, number] }
}

export const IMP_SPRITES: Record<string, ImpSpriteDef> = {
  'frontend-dev': {
    key: 'imp-red',
    src: '/sprites/imps/imp-red-walk.png',
    idleCol: 2, idleRow: 0, // row 0 = flying front (4 frames); col 0 = first
    walkFrames: {
      D: [2, 0],  // front (idle/flying)
      L: [0, 1],  // side
      R: [3, 1],  // side mirrored = back-right? we'll see
      U: [0, 3],  // back
    },
  },
  'backend-dev': {
    key: 'imp-blue',
    src: '/sprites/imps/imp-blue-walk.png',
    idleCol: 0, idleRow: 0,
    walkFrames: {
      D: [0, 0],
      L: [0, 1],
      R: [3, 1],
      U: [0, 3],
    },
  },
  'devops': {
    key: 'imp-green',
    src: '/sprites/imps/imp-green-walk.png',
    idleCol: 0, idleRow: 0,
    walkFrames: {
      D: [0, 0],
      L: [0, 1],
      R: [3, 1],
      U: [0, 3],
    },
  },
  'qa-engineer': {
    key: 'imp-purple',
    src: '/sprites/imps/imp-blue-walk.png', // reuse blue, recolor purple at runtime
    idleCol: 0, idleRow: 0,
    walkFrames: {
      D: [0, 0],
      L: [0, 1],
      R: [3, 1],
      U: [0, 3],
    },
  },
  'hermes': {
    key: 'hermes-satan',
    src: '/sprites/imps/imp-recolors.png', // 4-pack 128x128
    idleCol: 1, idleRow: 1, // bottom-right = flame variant (will be recolored to black+red)
    walkFrames: {
      D: [1, 1],
      L: [1, 1],
      R: [1, 1],
      U: [1, 1],
    },
  },
}

// ─── Tile set manifest ──────────────────────────────────────────────────

export interface TileSetDef {
  key: string
  src: string
  cellW: number
  cellH: number
  cols: number
  rows: number
}

export const TILE_SETS: Record<string, TileSetDef> = {
  volcanic: {
    key: 'volcanic',
    src: '/tiles/volcanic/tileset.png',
    cellW: 64, cellH: 64,
    cols: 12, rows: 9,  // 768 / 64 = 12, 576 / 64 = 9
  },
  multi1: {
    key: 'multi1',
    src: '/tiles/multi1/tileset.png',
    cellW: 64, cellH: 64,
    cols: 12, rows: 11, // 768 / 64 = 12, 720 / 64 ≈ 11.25
  },
  multi2: {
    key: 'multi2',
    src: '/tiles/multi2/tileset.png',
    cellW: 64, cellH: 64,
    cols: 12, rows: 11,
  },
  furniture: {
    key: 'furniture',
    src: '/tiles/furniture/tileset.png',
    cellW: 64, cellH: 64,
    cols: 12, rows: 12, // 768 / 64 = 12, 768 / 64 = 12
  },
}
