# Asset Credits

Hell Factory uses the following free pixel art assets, all from OpenGameArt.org and similar open-source repositories.

## Characters — [LPC] Imp 2
- **Source:** https://opengameart.org/content/lpc-imp-2
- **Authors:** William.Thompsonj, Redshrike
- **License:** CC-BY 3.0 / CC-BY 4.0 / GPL 2.0 / GPL 3.0 / OGA-BY 3.0
- **Files used:**
  - `public/sprites/imps/imp-red-walk.png` — frontend-dev (Rian, Bolt, Mira)
  - `public/sprites/imps/imp-green-walk.png` — devops (Sage)
  - `public/sprites/imps/imp-blue-walk.png` — backend-dev (Clio)
  - `public/sprites/imps/imp-recolors.png` — flame variant recolored to black+red for Hermes (Satan)
- **Modifications:** qa-engineer (Hawk) is the blue sprite recolored to purple via canvas pixel manipulation. Hermes is the flame variant recolored to black+red+gold.

## Tilesets (free, attribution required)
- `public/tiles/volcanic/tileset.png` — volcanic/lava tileset (attribution: [author])
- `public/tiles/multi1/tileset.png` — multi-theme wall/floor tileset #1 (attribution: [author])
- `public/tiles/multi2/tileset.png` — multi-theme wall/floor tileset #2 (attribution: [author])
- `public/tiles/furniture/tileset.png` — interior furniture tileset (attribution: [author])

## Procedural art (hand-written in this project)
- Background volcano sky gradient + ember particles (`officeRenderer.ts`)
- Furniture: throne, firepit, desk, chair, couch, table, plant, bookshelf, water cooler, vending, barrel, rug, candle, pentagram, banner — all drawn with Canvas 2D `fillRect`/`arc` primitives
- Status rings, speech bubbles, room labels, name plates, top status bar
