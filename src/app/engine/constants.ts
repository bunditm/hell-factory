// Core constants — all magic numbers centralized here
// Phase A v3-detail: 1600x1200 canvas, ~100px sprite objects, 16x12 tile grid

// Canvas — fixed pixel-art resolution
export const CANVAS_WIDTH = 1600
export const CANVAS_HEIGHT = 1200

// Tile grid — each tile is 100px, so 16 cols x 12 rows
export const TILE_SIZE = 100
export const DEFAULT_COLS = 16
export const DEFAULT_ROWS = 12
export const MAX_COLS = 32
export const MAX_ROWS = 24

// Sprite size targets (within a 100x100 tile)
// - Small decor (vase, lamp)  : 60x80
// - Medium furniture (desk)   : 96x64 (wide)
// - Character (chibi)         : 48x64 (fits in 100x100 tile with room to walk)
// - Wall tile                 : 100x100
// - Floor tile                : 100x100
export const SPRITE_CHAR_W = 48
export const SPRITE_CHAR_H = 64

// Character Animation
export const WALK_SPEED_PX_PER_SEC = 200          // ~2 tiles/sec
export const WALK_FRAME_DURATION_SEC = 0.15       // 4-frame walk cycle
export const TYPE_FRAME_DURATION_SEC = 0.3        // 2-frame typing animation

// Game Loop
export const MAX_DELTA_TIME_SEC = 0.1

// Rendering
export const CHARACTER_Z_SORT_OFFSET = 0.5
export const CAMERA_FOLLOW_LERP = 0.1
export const CAMERA_FOLLOW_SNAP_THRESHOLD = 0.5
export const FALLBACK_FLOOR_COLOR = '#808080'

// Zoom — 1x is native (1600x1200 fits most viewports)
export const ZOOM_MIN = 0.5
export const ZOOM_MAX = 2
export const ZOOM_SCROLL_THRESHOLD = 50
export const PAN_MARGIN_FRACTION = 0.1

// Character palettes
export const PALETTE_COUNT = 6
export const HUE_SHIFT_MIN_DEG = 45
export const HUE_SHIFT_RANGE_DEG = 271
