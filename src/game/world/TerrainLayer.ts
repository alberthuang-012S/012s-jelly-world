import Phaser from "phaser";
import { isPixelAssetReady } from "../assets/assetPipeline";
import {
  terrainTileIndex,
  type TerrainTileId,
} from "../assets/terrainTileMap";

export const FORMAL_TERRAIN_ASSET_ID = "terrain.main" as const;
export const LOGICAL_TERRAIN_TILE_SIZE = 32;
const NATIVE_TERRAIN_SCALE = 2;

export interface TerrainLayer {
  root: Phaser.GameObjects.Container;
  detail: Phaser.GameObjects.Graphics;
  usesFormalTerrain: boolean;
}

/**
 * Formal Terrain is a 16px source sheet displayed as 32px logical world art.
 * The existing Graphics callback remains the complete fallback path when the
 * registry asset is disabled, missing, or failed during Phaser preload.
 */
export function createTerrainLayer(
  scene: Phaser.Scene,
  width: number,
  height: number,
  fallback: (graphics: Phaser.GameObjects.Graphics) => void,
): TerrainLayer {
  const root = new Phaser.GameObjects.Container(scene, 0, 0).setDepth(0);
  scene.add.existing(root);

  const detail = new Phaser.GameObjects.Graphics(scene);
  detail.setDepth(1);
  root.add(detail);

  const usesFormalTerrain = isFormalTerrainReady(scene);
  const layer: TerrainLayer = { root, detail, usesFormalTerrain };
  if (usesFormalTerrain) {
    drawFormalGrass(layer, scene, width, height);
  } else {
    fallback(detail);
  }
  return layer;
}

export function isFormalTerrainReady(scene: Phaser.Scene): boolean {
  return isPixelAssetReady(scene, FORMAL_TERRAIN_ASSET_ID);
}

export function addFormalTerrainTile(
  layer: TerrainLayer,
  scene: Phaser.Scene,
  tileId: TerrainTileId,
  x: number,
  y: number,
): Phaser.GameObjects.Image | undefined {
  if (!layer.usesFormalTerrain || !isFormalTerrainReady(scene)) {
    return undefined;
  }
  const tile = new Phaser.GameObjects.Image(
    scene,
    x,
    y,
    FORMAL_TERRAIN_ASSET_ID,
    terrainTileIndex(tileId),
  );
  tile.setOrigin(0, 0);
  tile.setScale(NATIVE_TERRAIN_SCALE);
  layer.root.add(tile);
  return tile;
}

export function drawFormalRoadRect(
  layer: TerrainLayer,
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (!layer.usesFormalTerrain) return;
  const columns = Math.max(1, Math.ceil(width / LOGICAL_TERRAIN_TILE_SIZE));
  const rows = Math.max(1, Math.ceil(height / LOGICAL_TERRAIN_TILE_SIZE));
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      addFormalTerrainTile(
        layer,
        scene,
        chooseRoadTile(column, row, columns, rows, x, y),
        x + column * LOGICAL_TERRAIN_TILE_SIZE,
        y + row * LOGICAL_TERRAIN_TILE_SIZE,
      );
    }
  }
}

export function drawFormalWaterBody(
  layer: TerrainLayer,
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  seedOffset: number,
): void {
  if (!layer.usesFormalTerrain) return;
  const columns = Math.max(1, Math.ceil(width / LOGICAL_TERRAIN_TILE_SIZE));
  const rows = Math.max(1, Math.ceil(height / LOGICAL_TERRAIN_TILE_SIZE));
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const hash = terrainHash(column + seedOffset, row + seedOffset * 3);
      const tileId: TerrainTileId = hash < 10
        ? "WATER_VARIANT_01"
        : hash < 18
          ? "WATER_VARIANT_02"
          : hash < 23
            ? "WATER_VARIANT_03"
            : "WATER_BASE";
      addFormalTerrainTile(
        layer,
        scene,
        tileId,
        x + column * LOGICAL_TERRAIN_TILE_SIZE,
        y + row * LOGICAL_TERRAIN_TILE_SIZE,
      );
    }
  }
}

export function drawFormalShoreline(
  layer: TerrainLayer,
  scene: Phaser.Scene,
  edge: number,
  start: number,
  length: number,
  direction: "left" | "right" | "top",
): void {
  if (!layer.usesFormalTerrain) return;
  if (direction === "top") {
    for (let offset = 0; offset < length; offset += LOGICAL_TERRAIN_TILE_SIZE) {
      addFormalTerrainTile(layer, scene, "SHORE_TOP", edge + offset, start - 16);
    }
    return;
  }

  const tileId: TerrainTileId = direction === "right" ? "SHORE_RIGHT" : "SHORE_LEFT";
  for (let offset = 0; offset < length; offset += LOGICAL_TERRAIN_TILE_SIZE) {
    addFormalTerrainTile(layer, scene, tileId, edge - 16, start + offset);
  }
}

export function drawFormalBridge(
  layer: TerrainLayer,
  scene: Phaser.Scene,
  x: number,
  y: number,
): void {
  if (!layer.usesFormalTerrain) return;
  const segmentCount = Math.max(3, Math.ceil(220 / LOGICAL_TERRAIN_TILE_SIZE));
  for (let index = 0; index < segmentCount; index += 1) {
    const tileId: TerrainTileId = index === 0
      ? "BRIDGE_HORIZONTAL_START"
      : index === segmentCount - 1
        ? "BRIDGE_HORIZONTAL_END"
        : "BRIDGE_HORIZONTAL_MIDDLE";
    const tileX = x + index * LOGICAL_TERRAIN_TILE_SIZE;
    addFormalTerrainTile(layer, scene, tileId, tileX, y);
    if (index > 0 && index < segmentCount - 1) {
      addFormalTerrainTile(layer, scene, "BRIDGE_HORIZONTAL_RAIL_TOP", tileX, y);
      addFormalTerrainTile(layer, scene, "BRIDGE_HORIZONTAL_RAIL_BOTTOM", tileX, y);
    }
  }
}

export function addFormalTerrainDecoration(
  layer: TerrainLayer,
  scene: Phaser.Scene,
  tileId: TerrainTileId,
  centerX: number,
  centerY: number,
): Phaser.GameObjects.Image | undefined {
  return addFormalTerrainTile(
    layer,
    scene,
    tileId,
    centerX - LOGICAL_TERRAIN_TILE_SIZE / 2,
    centerY - LOGICAL_TERRAIN_TILE_SIZE / 2,
  );
}

function drawFormalGrass(layer: TerrainLayer, scene: Phaser.Scene, width: number, height: number): void {
  const columns = Math.max(1, Math.ceil(width / LOGICAL_TERRAIN_TILE_SIZE));
  const rows = Math.max(1, Math.ceil(height / LOGICAL_TERRAIN_TILE_SIZE));
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const hash = terrainHash(column, row);
      const tileId: TerrainTileId = hash < 8
        ? "GRASS_VARIANT_01"
        : hash < 14
          ? "GRASS_VARIANT_02"
          : hash < 20
            ? "GRASS_VARIANT_03"
            : "GRASS_BASE";
      addFormalTerrainTile(
        layer,
        scene,
        tileId,
        column * LOGICAL_TERRAIN_TILE_SIZE,
        row * LOGICAL_TERRAIN_TILE_SIZE,
      );
    }
  }
}

function chooseRoadTile(
  column: number,
  row: number,
  columns: number,
  rows: number,
  originX: number,
  originY: number,
): TerrainTileId {
  const top = row > 0;
  const bottom = row < rows - 1;
  const left = column > 0;
  const right = column < columns - 1;

  if (columns >= 3 && rows >= 3 && column === Math.floor(columns / 2) && row === Math.floor(rows / 2)) {
    return "ROAD_CROSS";
  }
  if (!top && !bottom && !left && !right) return "ROAD_CENTER";
  if (!top && !bottom) return roadVariant(originX, originY) ? "ROAD_VARIANT" : "ROAD_HORIZONTAL";
  if (!left && !right) return roadVariant(originX, originY) ? "ROAD_VARIANT" : "ROAD_VERTICAL";
  if (!top && !left) return "ROAD_OUTER_TL";
  if (!top && !right) return "ROAD_OUTER_TR";
  if (!bottom && !left) return "ROAD_OUTER_BL";
  if (!bottom && !right) return "ROAD_OUTER_BR";
  if (!top) return "ROAD_EDGE_TOP";
  if (!bottom) return "ROAD_EDGE_BOTTOM";
  if (!left) return "ROAD_EDGE_LEFT";
  if (!right) return "ROAD_EDGE_RIGHT";
  return roadVariant(originX + column, originY + row) ? "ROAD_VARIANT" : "ROAD_CENTER";
}

function roadVariant(x: number, y: number): boolean {
  return terrainHash(Math.floor(x / LOGICAL_TERRAIN_TILE_SIZE), Math.floor(y / LOGICAL_TERRAIN_TILE_SIZE)) % 11 === 0;
}

function terrainHash(x: number, y: number): number {
  return Math.abs((Math.floor(x) * 41 + Math.floor(y) * 73 + 17) % 101);
}
