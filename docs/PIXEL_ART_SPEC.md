# 012S Jelly World Pixel Art Spec

This document is the handoff contract for formal Pixel Art assets. It keeps
future PNG/WebP work aligned with the current Phase 1 world without forcing a
Tiled migration or replacing the playable procedural fallback.

## Global rules

- Native logical tile: **32×32 px**. A 16×16 micro-detail grid is allowed for
  small marks, highlights, and material seams.
- `PIXEL_SCALE` is currently `1`. Assets may be exported at 2× or 3× for
  authoring convenience, but the runtime display size must resolve to the
  logical dimensions in the Registry.
- Use nearest-neighbor sampling only. Phaser keeps `pixelArt: true`,
  `antialias: false`, and `roundPixels: true`.
- Camera and world coordinates stay unchanged in Phase 1.4: deadzone
  **220×108**, Y offset **72**, world **1800×1200**.
- Perspective is a readable top-down RPG view: roofs are visible, building
  facades face the play space, and characters/props use a consistent grounded
  shadow.
- Shared outline colour: deep blue-gray around `#24324A`. Avoid pure black.
- Shared hard-shadow colour: around `#29394C`, usually 30–65% alpha.
- Transparent PNG/WebP pixels are allowed around irregular sprites. Do not use
  transparent padding to define collision; collision remains explicit world
  data.

## Palette families

Keep hue families stable across files so formal assets can sit beside the
fallback art while the migration is incremental.

| Family | Direction |
| --- | --- |
| Grass | deep `#3D765B`, mid `#78B874`, light `#96C981`, highlight `#C1DD91` |
| Road / stone | shadow `#8B7558`, mid `#D0B57B`, light `#E3C990` |
| Water | deep `#2B6F9F`, mid `#3EA9C8`, light `#75D2DC`, foam `#B1E8DF` |
| Common neutral | outline `#24324A`, ink-soft `#33465E`, paper `#FFF2D0` |
| LAB | cyan-blue roof and cool off-white wall |
| LIVE | coral-pink roof and warm peach wall |
| INFO | violet roof and warm neutral wall |
| ARCADE | blue roof and pale blue-gray open facade |

## Characters

- Target frame: **32×48 logical px** for Player, 阿長, 莘蒂, and the BOT;
  the BOT may use a 32×40 visible body inside the same frame.
- Sprite sheets use rows for idle/walk and front/back/side directions. The
  Registry records row, frame count, frame rate, and repeat mode; actors only
  request a visual and expose movement state.
- Keep a 1–2 px dark outline, one main body colour, one shadow colour, and at
  most two highlight colours per material.
- Feet must share a clear ground anchor. The visual anchor may differ from the
  collision box, but the collision box is explicit and independent.

### Player Jelly

Blue/cyan translucent jelly body, stepped dome, three readable tentacles,
small face, and one restrained highlight. No anti-aliased curves or tiny
facial noise.

### 阿長 / LAB manager

Dark jacket silhouette, warm face, short dark hair, cyan or red tie accent.
Readable as the manager from shape and palette before facial detail.

### 莘蒂 / LIVE streamer

Coral/pink outfit, warm face, long warm-brown hair silhouette, and a tiny
microphone cue. Keep the microphone separate from the body silhouette when
possible.

### 012S BOT

Compact cyan robot with dark screen outline, pale display face, purple side
accents, and a small antenna. Keep it rectangular and service-oriented.

## Buildings

Each building is an independent image or atlas entry under
`public/assets/pixel/buildings/`. The Registry visual bounds are not collision
bounds: a roof may overhang while the solid rectangle covers only the wall or
counter.

- **LAB**: blue/cyan roof, cool light wall, flask sign, windows and a clear
  front door.
- **LIVE**: coral roof, warm wall, large glass window, ON AIR sign, microphone
  cue.
- **INFO**: compact violet-roof booth, service window, desk/counter and BOT
  interaction space.
- **ARCADE**: broad open-front game center, repeated roof rhythm, central
  entry, and an accessible machine row.

Buildings should export with transparent surrounding pixels and a hard ground
shadow only when the shadow belongs to the building art. Do not bake collision
or invisible blockers into alpha.

## Terrain and props

Terrain assets are tile-ready, even though Phase 1.4 still uses the existing
world renderer. Provide grass base, road center/edge/corner, water, shoreline,
and bridge-friendly terrain pieces. Road tiles must preserve 32 px logical
alignment without becoming oversized checkerboard squares.

Props are independent, grounded sprites: trees, flowers, benches, lamps,
fences, signs, and event boards. Trees support two visual layers:

1. trunk/body behind the player sorting point;
2. canopy/front layer that can pass in front of the player.

The tree collision is a small explicit trunk rectangle, not the canopy alpha.

## Asset pipeline contract

- `src/game/assets/assetRegistry.ts` is the source of truth for IDs, URLs,
  types, animation metadata, logical visual bounds, and fallback category.
- `BootScene` is the single preload entry point. Actors and world code never
  call `scene.load` or fetch assets dynamically.
- Formal files are opt-in (`enabled: true`) after review. If a file is absent
  or fails, the procedural fallback stays visible and the loader emits at most
  one warning for that asset.
- Runtime code never reads `reference/`; reference files are for human
  direction only. Formal assets belong under `public/assets/pixel/`.
- Replace an asset one ID at a time. Logic, collision, interaction, dialogue,
  and sorting should remain stable during the visual migration.

## Formal Asset Acceptance Gate

Before a reviewed file is enabled in the Registry, run the deterministic
validator:

```bash
pnpm validate:terrain -- path/to/terrain.png
pnpm validate:assets -- --strict
pnpm test:assets
```

Formal Terrain source sheets use a separate native source grid from the
current 32px world renderer:

- Native tile: **16×16 px**
- Sheet: **256×256 px**
- Grid: **16 columns × 16 rows / 256 cells**
- Margin: **0**
- Spacing: **0**

The acceptance gate requires a readable PNG, exact 256×256 dimensions, binary
alpha (`0` or `255` only), and a complete 16×16 cell cut. Boundary-crossing
and repeated transparent-separator checks are diagnostics: they report WARN
when a possible non-16px stride is suspected, but do not pretend to judge
artistic meaning or fail a legitimate edge-touching tile. Building, prop, and
future character sheets reuse the same PNG/alpha parser with their own
dimension or frame specifications.

The first formal Terrain source is authored by
`scripts/pixel-assets/build-formal-terrain.ts` using the centralized palette in
`scripts/pixel-assets/terrainPalette.ts`. It writes each pixel through a
cell-bounded writer, audits tile indices and write coordinates, and runs seam
checks for repeated grass, road, water, and bridge tiles. The stable IDs and
coordinates are recorded in `src/game/assets/terrainTileMap.ts`.

Use:

```bash
pnpm build:terrain
pnpm validate:terrain -- --strict public/assets/pixel/tiles/terrain/terrain.png
pnpm test:assets
```

The authoring command writes the formal sheet under `public/assets/pixel/` and
the non-runtime visual inspection scene to
`validation-output/terrain-preview.png`. The accepted sheet is now integrated
through Registry entry `terrain.main`: `TerrainLayer` renders the existing
grass, road, water, shoreline, bridge, flower, and shrub positions from the
16px source at 2x logical scale. World layout, actors, collision, camera, NPC,
and interaction code remain unchanged; missing or failed formal loading falls
back to the original procedural Graphics renderer.

Optional `--report`, `--json`, `--verbose`, and `--debug-grid` outputs are QA
artifacts only. A grid debug PNG is written outside the runtime asset tree and
must never be enabled in the runtime Registry.
