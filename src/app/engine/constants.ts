// Core constants — all magic numbers centralized here
// Based on agentroom's constants.ts

// Grid & Layout
export const TILE_SIZE = 32
export const DEFAULT_COLS = 30
export const DEFAULT_ROWS = 22
export const MAX_COLS = 64
export const MAX_ROWS = 64

// Character Animation
export const WALK_SPEED_PX_PER_SEC = 96           // ~3 tiles/sec
export const WALK_FRAME_DURATION_SEC = 0.15      // 4-frame walk cycle
export const TYPE_FRAME_DURATION_SEC = 0.3       // 2-frame typing animation

// Game Loop
export const MAX_DELTA_TIME_SEC = 0.1            // Prevents spiral of death

// Rendering
export const CHARACTER_Z_SORT_OFFSET = 0.5
export const CAMERA_FOLLOW_LERP = 0.1
export const CAMERA_FOLLOW_SNAP_THRESHOLD = 0.5
export const FALLBACK_FLOOR_COLOR = '#808080'

// Zoom
export const ZOOM_MIN = 0.5
export const ZOOM_MAX = 6
export const ZOOM_SCROLL_THRESHOLD = 50
export const PAN_MARGIN_FRACTION = 0.1

// Character palettes
export const PALETTE_COUNT = 6
export const HUE_SHIFT_MIN_DEG = 45
export const HUE_SHIFT_RANGE_DEG = 271