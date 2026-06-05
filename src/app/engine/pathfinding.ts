// BFS pathfinding on 4-connected grid
// Based on agentroom's tileMap.ts

import { TileType } from './types'

export function isWalkable(
  col: number,
  row: number,
  tileMap: TileType[][],
  blockedTiles: Set<string>,
): boolean {
  const rows = tileMap.length
  const cols = rows > 0 ? tileMap[0].length : 0
  if (row < 0 || row >= rows || col < 0 || col >= cols) return false
  const t = tileMap[row][col]
  if (t === TileType.WALL || t === TileType.VOID) return false
  if (blockedTiles.has(`${col},${row}`)) return false
  return true
}

export function getWalkableTiles(
  tileMap: TileType[][],
  blockedTiles: Set<string>,
): Array<{ col: number; row: number }> {
  const rows = tileMap.length
  const cols = rows > 0 ? tileMap[0].length : 0
  const tiles: Array<{ col: number; row: number }> = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isWalkable(c, r, tileMap, blockedTiles)) {
        tiles.push({ col: c, row: r })
      }
    }
  }
  return tiles
}

/** BFS pathfinding. Returns path EXCLUDING start, INCLUDING end. Returns [] if no path. */
export function findPath(
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
  tileMap: TileType[][],
  blockedTiles: Set<string>,
): Array<{ col: number; row: number }> {
  if (startCol === endCol && startRow === endRow) return []

  const key = (c: number, r: number) => `${c},${r}`
  const visited = new Set<string>()
  const parent = new Map<string, string>()
  const queue: Array<{ col: number; row: number }> = [{ col: startCol, row: startRow }]
  visited.add(key(startCol, startRow))

  const dirs = [
    { dc: 0, dr: -1 },
    { dc: 0, dr: 1 },
    { dc: -1, dr: 0 },
    { dc: 1, dr: 0 },
  ]

  while (queue.length > 0) {
    const curr = queue.shift()!

    if (curr.col === endCol && curr.row === endRow) {
      const path: Array<{ col: number; row: number }> = []
      let k = key(endCol, endRow)
      while (k !== key(startCol, startRow)) {
        const [c, r] = k.split(',').map(Number)
        path.unshift({ col: c, row: r })
        k = parent.get(k)!
      }
      return path
    }

    for (const d of dirs) {
      const nc = curr.col + d.dc
      const nr = curr.row + d.dr
      const nk = key(nc, nr)
      if (visited.has(nk)) continue
      if (!isWalkable(nc, nr, tileMap, blockedTiles)) continue
      visited.add(nk)
      parent.set(nk, key(curr.col, curr.row))
      queue.push({ col: nc, row: nr })
    }
  }

  return []
}