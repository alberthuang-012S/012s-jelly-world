import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { encodeRgbaPng, type RgbaImage } from "./validator.ts";
import { TERRAIN_PALETTE, type PixelColor } from "./terrainPalette.ts";
import {
  TERRAIN_GRID_COLUMNS,
  TERRAIN_GRID_ROWS,
  TERRAIN_TILE_DEFINITIONS,
  TERRAIN_TILE_MAP,
  TERRAIN_TILE_SIZE,
  type TerrainTileDefinition,
  type TerrainTileId,
} from "../../src/game/assets/terrainTileMap.ts";

export const FORMAL_TERRAIN_WIDTH = TERRAIN_GRID_COLUMNS * TERRAIN_TILE_SIZE;
export const FORMAL_TERRAIN_HEIGHT = TERRAIN_GRID_ROWS * TERRAIN_TILE_SIZE;

interface PixelWriteAudit {
  tileName: string;
  tileIndex: number;
  localX: number;
  localY: number;
  globalX: number;
  globalY: number;
}

export interface TerrainAuthoringAudit {
  writes: PixelWriteAudit[];
  outOfBoundsAttempts: number;
  paintedTileIndices: number[];
}

export interface FormalTerrainAsset {
  image: RgbaImage;
  preview: RgbaImage;
  audit: TerrainAuthoringAudit;
}

class TileWriter {
  private readonly image: RgbaImage;
  private readonly tile: TerrainTileDefinition;
  private readonly audit: TerrainAuthoringAudit;

  public constructor(
    image: RgbaImage,
    tile: TerrainTileDefinition,
    audit: TerrainAuthoringAudit,
  ) {
    this.image = image;
    this.tile = tile;
    this.audit = audit;
  }

  public setPixel(localX: number, localY: number, color: PixelColor): void {
    if (!Number.isInteger(localX) || !Number.isInteger(localY) || localX < 0 || localY < 0 || localX >= TERRAIN_TILE_SIZE || localY >= TERRAIN_TILE_SIZE) {
      this.audit.outOfBoundsAttempts += 1;
      throw new Error(`Tile ${this.tile.name} attempted out-of-cell write at ${localX},${localY}`);
    }
    const globalX = this.tile.column * TERRAIN_TILE_SIZE + localX;
    const globalY = this.tile.row * TERRAIN_TILE_SIZE + localY;
    if (globalX < this.tile.column * TERRAIN_TILE_SIZE || globalX >= (this.tile.column + 1) * TERRAIN_TILE_SIZE ||
      globalY < this.tile.row * TERRAIN_TILE_SIZE || globalY >= (this.tile.row + 1) * TERRAIN_TILE_SIZE) {
      this.audit.outOfBoundsAttempts += 1;
      throw new Error(`Tile ${this.tile.name} crossed its cell boundary at ${globalX},${globalY}`);
    }
    const pixelIndex = (globalY * this.image.width + globalX) * 4;
    this.image.pixels[pixelIndex] = color[0] ?? 0;
    this.image.pixels[pixelIndex + 1] = color[1] ?? 0;
    this.image.pixels[pixelIndex + 2] = color[2] ?? 0;
    this.image.pixels[pixelIndex + 3] = color[3] ?? 0;
    this.audit.writes.push({
      tileName: this.tile.name,
      tileIndex: this.tile.index,
      localX,
      localY,
      globalX,
      globalY,
    });
  }

  public fillRect(startX: number, startY: number, width: number, height: number, color: PixelColor): void {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 0 || height < 0) {
      throw new Error(`Tile ${this.tile.name} received a non-integer rectangle size`);
    }
    for (let y = startY; y < startY + height; y += 1) {
      for (let x = startX; x < startX + width; x += 1) {
        this.setPixel(x, y, color);
      }
    }
  }

  public plotPattern(
    startX: number,
    startY: number,
    pattern: readonly string[],
    colours: Record<string, PixelColor | undefined>,
  ): void {
    for (let row = 0; row < pattern.length; row += 1) {
      const line = pattern[row] ?? "";
      for (let column = 0; column < line.length; column += 1) {
        const symbol = line[column] ?? " ";
        const colour = colours[symbol];
        if (colour) this.setPixel(startX + column, startY + row, colour);
      }
    }
  }
}

export function createFormalTerrainAsset(): FormalTerrainAsset {
  const image: RgbaImage = {
    width: FORMAL_TERRAIN_WIDTH,
    height: FORMAL_TERRAIN_HEIGHT,
    pixels: new Uint8Array(FORMAL_TERRAIN_WIDTH * FORMAL_TERRAIN_HEIGHT * 4),
  };
  const audit: TerrainAuthoringAudit = {
    writes: [],
    outOfBoundsAttempts: 0,
    paintedTileIndices: [],
  };

  for (const tile of TERRAIN_TILE_DEFINITIONS) {
    const writer = new TileWriter(image, tile, audit);
    drawTile(writer, tile.name as TerrainTileId);
    audit.paintedTileIndices.push(tile.index);
  }

  return {
    image,
    preview: createTerrainPreview(image),
    audit,
  };
}

export function assertFormalTerrainAuthoring(asset: FormalTerrainAsset): void {
  if (asset.image.width !== FORMAL_TERRAIN_WIDTH || asset.image.height !== FORMAL_TERRAIN_HEIGHT) {
    throw new Error(`Formal terrain dimensions must be ${FORMAL_TERRAIN_WIDTH}x${FORMAL_TERRAIN_HEIGHT}`);
  }
  if (asset.audit.outOfBoundsAttempts !== 0) {
    throw new Error(`Formal terrain authoring attempted ${asset.audit.outOfBoundsAttempts} out-of-cell writes`);
  }

  const ids = TERRAIN_TILE_DEFINITIONS.map((tile) => tile.index);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error("Formal terrain tile map contains duplicate tile indices");
  }
  if (ids.some((index) => !Number.isInteger(index) || index < 0 || index > 255)) {
    throw new Error("Formal terrain tile index must be an integer between 0 and 255");
  }
  for (const tile of TERRAIN_TILE_DEFINITIONS) {
    if (tile.index !== tile.row * TERRAIN_GRID_COLUMNS + tile.column) {
      throw new Error(`Tile ${tile.name} has an inconsistent row/column/index mapping`);
    }
  }
  for (const write of asset.audit.writes) {
    if (!Number.isInteger(write.localX) || !Number.isInteger(write.localY) ||
      write.localX < 0 || write.localX >= TERRAIN_TILE_SIZE || write.localY < 0 || write.localY >= TERRAIN_TILE_SIZE) {
      throw new Error(`Authoring audit found an out-of-cell write for ${write.tileName}`);
    }
    const tile = TERRAIN_TILE_DEFINITIONS.find((definition) => definition.index === write.tileIndex);
    if (!tile || write.globalX !== tile.column * TERRAIN_TILE_SIZE + write.localX || write.globalY !== tile.row * TERRAIN_TILE_SIZE + write.localY) {
      throw new Error(`Authoring audit found a cross-cell write for ${write.tileName}`);
    }
  }

  const painted = new Set(asset.audit.paintedTileIndices);
  for (const tile of TERRAIN_TILE_DEFINITIONS) {
    if (!painted.has(tile.index)) throw new Error(`Tile ${tile.name} was not authored`);
  }

  const alphaViolations = countNonBinaryAlpha(asset.image);
  if (alphaViolations > 0) throw new Error(`Formal terrain contains ${alphaViolations} non-binary alpha pixels`);

  const seamIssues = collectSeamIssues(asset.image);
  if (seamIssues.length > 0) {
    throw new Error(`Terrain seam QA failed: ${seamIssues.join(", ")}`);
  }
}

export function collectSeamIssues(image: RgbaImage): string[] {
  const checks: Array<{ tile: TerrainTileId; axis: "horizontal" | "vertical" }> = [
    { tile: "GRASS_BASE", axis: "horizontal" },
    { tile: "GRASS_BASE", axis: "vertical" },
    { tile: "ROAD_CENTER", axis: "horizontal" },
    { tile: "ROAD_CENTER", axis: "vertical" },
    { tile: "ROAD_HORIZONTAL", axis: "horizontal" },
    { tile: "ROAD_VERTICAL", axis: "vertical" },
    { tile: "WATER_BASE", axis: "horizontal" },
    { tile: "WATER_BASE", axis: "vertical" },
    { tile: "BRIDGE_HORIZONTAL_MIDDLE", axis: "horizontal" },
    { tile: "BRIDGE_VERTICAL_MIDDLE", axis: "vertical" },
  ];
  const issues: string[] = [];
  for (const check of checks) {
    const tile = TERRAIN_TILE_MAP[check.tile];
    for (let offset = 0; offset < TERRAIN_TILE_SIZE; offset += 1) {
      const firstX = tile.column * TERRAIN_TILE_SIZE + (check.axis === "horizontal" ? TERRAIN_TILE_SIZE - 1 : offset);
      const firstY = tile.row * TERRAIN_TILE_SIZE + (check.axis === "horizontal" ? offset : TERRAIN_TILE_SIZE - 1);
      const secondX = tile.column * TERRAIN_TILE_SIZE + (check.axis === "horizontal" ? 0 : offset);
      const secondY = tile.row * TERRAIN_TILE_SIZE + (check.axis === "horizontal" ? offset : 0);
      if (!samePixel(image, firstX, firstY, secondX, secondY)) {
        issues.push(`${check.tile} ${check.axis} offset ${offset}`);
      }
    }
  }
  return issues;
}

function drawTile(writer: TileWriter, tileId: TerrainTileId): void {
  const name = tileId;
  if (name.startsWith("ROAD_")) {
    drawRoadTile(writer, name);
    return;
  }
  if (name.startsWith("WATER_") || name.startsWith("SHORE_")) {
    drawWaterTile(writer, name);
    return;
  }
  if (name.startsWith("BRIDGE_")) {
    drawBridgeTile(writer, name);
    return;
  }
  drawGrassTile(writer, name);
}

function drawGrassTile(writer: TileWriter, name: string): void {
  const P = TERRAIN_PALETTE;
  const fullField = name === "GRASS_BASE" || name.startsWith("GRASS_VARIANT") || name.startsWith("GRASS_PATCH") || name === "GRASS_SPECKLE" || name === "GRASS_SPARSE" || name.startsWith("GRASS_EDGE_");
  if (fullField) {
    fillGrass(writer, grassVariant(name));
  }
  if (name === "GRASS_BASE") return;
  if (name === "GRASS_VARIANT_01") {
    plotGrassTufts(writer, 0);
    return;
  }
  if (name === "GRASS_VARIANT_02") {
    plotGrassTufts(writer, 1);
    writer.plotPattern(8, 3, ["l.", ".l"], { l: P.grassLight });
    return;
  }
  if (name === "GRASS_VARIANT_03" || name === "GRASS_PATCH_01") {
    plotGrassTufts(writer, 2);
    writer.fillRect(9, 9, 3, 1, P.grassShadow);
    return;
  }
  if (name === "GRASS_PATCH_02") {
    plotGrassTufts(writer, 3);
    writer.fillRect(3, 10, 2, 2, P.grassLight);
    return;
  }
  if (name === "GRASS_PATCH_03") {
    plotGrassTufts(writer, 4);
    writer.fillRect(10, 4, 2, 2, P.grassShadow);
    return;
  }
  if (name === "GRASS_SPECKLE" || name === "GRASS_SPARSE") {
    plotGrassTufts(writer, 5);
    writer.plotPattern(3, 4, [".d.", "...", ".d."], { d: P.grassDetail });
    return;
  }
  if (name.startsWith("GRASS_EDGE_")) {
    drawGrassEdge(writer, name);
    return;
  }
  if (name.startsWith("GRASS_WEED") || name === "WEED_CLUSTER") {
    drawWeed(writer, name === "GRASS_WEED_02" || name === "WEED_CLUSTER");
    return;
  }
  if (name.startsWith("FLOWER_") || name === "FLOWER_DAISY") {
    drawFlowerTile(writer, name);
    return;
  }
  if (name.startsWith("SHRUB_")) {
    drawShrub(writer, name);
    return;
  }
  if (name.startsWith("GRASS_PEBBLE") || name === "GRASS_ROCK_DETAIL") {
    drawGrassPebble(writer, name === "GRASS_PEBBLE_02");
    return;
  }
  throw new Error(`No grass authoring rule for ${name}`);
}

function fillGrass(writer: TileWriter, variant: number): void {
  const P = TERRAIN_PALETTE;
  writer.fillRect(0, 0, 16, 16, P.grassBase);
  const patterns: ReadonlyArray<ReadonlyArray<readonly [number, number, PixelColor]>> = [
    [[2, 3, P.grassShadow], [11, 2, P.grassLight], [6, 12, P.grassShadow], [13, 8, P.grassLight]],
    [[4, 2, P.grassLight], [8, 6, P.grassShadow], [12, 11, P.grassLight], [2, 13, P.grassShadow]],
    [[3, 5, P.grassShadow], [6, 2, P.grassLight], [10, 10, P.grassShadow], [12, 5, P.grassLight]],
    [[2, 8, P.grassLight], [5, 3, P.grassShadow], [9, 6, P.grassLight], [13, 12, P.grassShadow]],
    [[3, 3, P.grassShadow], [7, 11, P.grassLight], [11, 5, P.grassShadow], [13, 9, P.grassLight]],
    [[2, 5, P.grassLight], [5, 12, P.grassShadow], [9, 3, P.grassLight], [12, 8, P.grassShadow]],
  ];
  const pattern = patterns[variant % patterns.length] ?? patterns[0]!;
  for (const [x, y, colour] of pattern) writer.setPixel(x, y, colour);
  if (variant % 2 === 0) writer.setPixel(7, 7, P.grassHighlight);
  if (variant % 3 === 0) writer.setPixel(4, 10, P.grassDetail);
}

function grassVariant(name: string): number {
  if (name === "GRASS_BASE") return 5;
  const suffix = name.match(/(?:VARIANT|PATCH)_(\d+)/)?.[1];
  return suffix ? Number.parseInt(suffix, 10) : name === "GRASS_SPARSE" ? 5 : 0;
}

function plotGrassTufts(writer: TileWriter, variant: number): void {
  const P = TERRAIN_PALETTE;
  const patterns: readonly (readonly string[])[] = [
    ["..d...", ".d.l..", "d...l."],
    [".l....", "..d...", ".d.l.."],
    ["d.....", ".d.l..", "...l.."],
    ["...l..", "..d...", ".l..d."],
    [".d....", "..l...", "....d."],
  ];
  const pattern = patterns[variant % patterns.length] ?? patterns[0]!;
  writer.plotPattern(2, 4, pattern, { d: P.grassDetail, l: P.grassLight });
}

function drawGrassEdge(writer: TileWriter, name: string): void {
  const P = TERRAIN_PALETTE;
  if (name === "GRASS_EDGE_TOP") {
    writer.fillRect(0, 5, 16, 2, P.grassLight);
    writer.plotPattern(1, 5, [".d..d...d..d..."], { d: P.grassDeep });
  } else if (name === "GRASS_EDGE_BOTTOM") {
    writer.fillRect(0, 9, 16, 2, P.grassShadow);
    writer.plotPattern(2, 10, ["d...d..d...d.."], { d: P.grassDeep });
  } else if (name === "GRASS_EDGE_LEFT") {
    writer.fillRect(5, 0, 2, 16, P.grassLight);
    writer.plotPattern(5, 1, ["d", ".", "d", ".", ".", "d", ".", "d", ".", ".", "d", ".", "d", "."], { d: P.grassDeep });
  } else {
    writer.fillRect(9, 0, 2, 16, P.grassShadow);
    writer.plotPattern(10, 1, ["d", ".", ".", "d", ".", "d", ".", ".", "d", ".", "d", ".", ".", "d"], { d: P.grassDeep });
  }
}

function drawWeed(writer: TileWriter, mirror: boolean): void {
  const P = TERRAIN_PALETTE;
  const pattern = mirror ? ["..l...", ".d.l..", "d...d.", "..d..."] : ["...l..", "..l.d.", ".d...d", "...d.."];
  writer.plotPattern(5, 5, pattern, { d: P.grassDetail, l: P.grassLight });
}

function drawFlowerTile(writer: TileWriter, name: string): void {
  const P = TERRAIN_PALETTE;
  const colours: Record<string, PixelColor> = name.includes("PINK")
    ? { petal: P.flowerPink, petalLight: P.flowerPinkLight, center: P.flowerCenter }
    : name.includes("YELLOW") || name.includes("ORANGE")
      ? { petal: name.includes("ORANGE") ? P.flowerOrange : P.flowerYellow, petalLight: P.flowerYellow, center: P.flowerCenter }
      : name.includes("PURPLE")
        ? { petal: P.flowerPurple, petalLight: P.flowerPurpleLight, center: P.flowerCenter }
        : name.includes("BLUE")
          ? { petal: P.flowerBlue, petalLight: P.waterLight, center: P.flowerCenter }
          : { petal: P.flowerWhite, petalLight: P.flowerWhite, center: P.flowerCenter };
  const positions = name.includes("CLUSTER") || name === "FLOWER_MIX" || name === "FLOWER_TRIO"
    ? [[4, 5], [10, 9]]
    : [[7, 7]];
  for (const [centerX, centerY] of positions) {
    writer.setPixel(centerX, centerY - 2, colours.petalLight);
    writer.setPixel(centerX - 2, centerY, colours.petal);
    writer.setPixel(centerX + 2, centerY, colours.petal);
    writer.setPixel(centerX, centerY + 2, colours.petal);
    writer.setPixel(centerX - 1, centerY - 1, colours.petal);
    writer.setPixel(centerX + 1, centerY - 1, colours.petal);
    writer.setPixel(centerX, centerY, colours.center);
    writer.setPixel(centerX, centerY + 3, P.grassDeep);
    writer.setPixel(centerX - 1, centerY + 4, P.grassShadow);
  }
  if (name === "FLOWER_DAISY") writer.setPixel(8, 4, P.flowerWhite);
}

function drawShrub(writer: TileWriter, name: string): void {
  const P = TERRAIN_PALETTE;
  const dark = name.includes("DARK") ? P.grassDetail : P.grassDeep;
  writer.plotPattern(2, 4, [
    "..ddd.....",
    ".dsssd....",
    "dsssssd...",
    "dssllssd..",
    ".dsssdd...",
    "..dd......",
  ], { d: dark, s: P.grassShadow, l: P.grassLight });
  if (name.includes("BLOOM") || name.includes("FLOWER")) {
    writer.setPixel(6, 5, P.flowerYellow);
    writer.setPixel(10, 6, P.flowerPink);
  }
}

function drawGrassPebble(writer: TileWriter, second: boolean): void {
  const P = TERRAIN_PALETTE;
  const x = second ? 9 : 5;
  const y = second ? 9 : 6;
  writer.plotPattern(x, y, [".ss.", "sll.", ".s.."], { s: P.stoneShadow, l: P.stoneLight });
}

function drawRoadTile(writer: TileWriter, name: string): void {
  if (name === "ROAD_CENTER" || name === "ROAD_VARIANT" || name === "ROAD_HORIZONTAL" || name === "ROAD_VERTICAL" || name === "ROAD_STONE_VARIANT") {
    drawRoadBase(writer, name);
    return;
  }

  const predicate = roadPredicate(name);
  drawTransitionField(writer, predicate);
  const P = TERRAIN_PALETTE;
  const soilPixels = name.includes("SOFT") ? P.soilEdge : P.soilShadow;
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      if (!predicate(x, y)) continue;
      const edge = !predicate(x - 1, y) || !predicate(x + 1, y) || !predicate(x, y - 1) || !predicate(x, y + 1);
      if (edge && ((x + y) % 3 === 0)) writer.setPixel(x, y, P.roadLight);
    }
  }
  if (name.includes("EDGE") || name.includes("OUTER") || name.includes("INNER") || name.includes("SOFT")) {
    addSoilFringe(writer, predicate, soilPixels);
  }
  addRoadStone(writer, predicate, 4, 5);
}

function drawRoadBase(writer: TileWriter, name: string): void {
  const P = TERRAIN_PALETTE;
  writer.fillRect(0, 0, 16, 16, P.roadBase);
  if (name === "ROAD_HORIZONTAL") {
    writer.fillRect(2, 4, 12, 1, P.roadLight);
    writer.fillRect(1, 11, 14, 1, P.soilEdge);
  } else if (name === "ROAD_VERTICAL") {
    writer.fillRect(4, 2, 1, 12, P.roadLight);
    writer.fillRect(11, 1, 1, 14, P.soilEdge);
  } else {
    writer.fillRect(2, 2, 2, 1, P.roadLight);
    writer.fillRect(11, 11, 2, 1, P.roadLight);
  }
  addRoadStone(writer, () => true, name === "ROAD_VARIANT" ? 9 : 5, name === "ROAD_VARIANT" ? 9 : 5);
  if (name === "ROAD_STONE_VARIANT") {
    writer.plotPattern(7, 4, [".ss.", "sll.", ".s.."], { s: P.stoneShadow, l: P.stoneLight });
  }
}

function roadPredicate(name: string): (x: number, y: number) => boolean {
  if (name === "ROAD_EDGE_TOP" || name === "ROAD_SOFT_EDGE_TOP") return (_x, y) => y >= 7;
  if (name === "ROAD_EDGE_BOTTOM" || name === "ROAD_SOFT_EDGE_BOTTOM") return (_x, y) => y <= 8;
  if (name === "ROAD_EDGE_LEFT" || name === "ROAD_SOFT_EDGE_LEFT") return (x, _y) => x >= 7;
  if (name === "ROAD_EDGE_RIGHT" || name === "ROAD_SOFT_EDGE_RIGHT") return (x, _y) => x <= 8;
  if (name === "ROAD_OUTER_TL") return (x, y) => x >= 7 && y >= 7;
  if (name === "ROAD_OUTER_TR") return (x, y) => x <= 8 && y >= 7;
  if (name === "ROAD_OUTER_BL") return (x, y) => x >= 7 && y <= 8;
  if (name === "ROAD_OUTER_BR") return (x, y) => x <= 8 && y <= 8;
  if (name === "ROAD_INNER_TL") return (x, y) => x >= 7 || y >= 7;
  if (name === "ROAD_INNER_TR") return (x, y) => x <= 8 || y >= 7;
  if (name === "ROAD_INNER_BL") return (x, y) => x >= 7 || y <= 8;
  if (name === "ROAD_INNER_BR") return (x, y) => x <= 8 || y <= 8;
  if (name === "ROAD_T_TOP") return (x, y) => x >= 5 && x <= 10 || y >= 7;
  if (name === "ROAD_T_BOTTOM") return (x, y) => x >= 5 && x <= 10 || y <= 8;
  if (name === "ROAD_T_LEFT") return (x, y) => y >= 5 && y <= 10 || x >= 7;
  if (name === "ROAD_T_RIGHT") return (x, y) => y >= 5 && y <= 10 || x <= 8;
  if (name === "ROAD_CROSS") return (x, y) => (x >= 5 && x <= 10) || (y >= 5 && y <= 10);
  return () => true;
}

function drawTransitionField(writer: TileWriter, predicate: (x: number, y: number) => boolean): void {
  fillGrass(writer, 1);
  const P = TERRAIN_PALETTE;
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      if (predicate(x, y)) writer.setPixel(x, y, P.roadBase);
    }
  }
}

function addSoilFringe(writer: TileWriter, predicate: (x: number, y: number) => boolean, colour: PixelColor): void {
  const P = TERRAIN_PALETTE;
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      if (predicate(x, y)) continue;
      const touchesRoad = predicate(x - 1, y) || predicate(x + 1, y) || predicate(x, y - 1) || predicate(x, y + 1);
      if (touchesRoad && ((x * 3 + y) % 4 !== 0)) writer.setPixel(x, y, colour);
    }
  }
  writer.setPixel(3, 3, P.grassLight);
  writer.setPixel(12, 12, P.grassShadow);
}

function addRoadStone(writer: TileWriter, predicate: (x: number, y: number) => boolean, x: number, y: number): void {
  const P = TERRAIN_PALETTE;
  if (!predicate(x, y) || !predicate(x + 1, y) || !predicate(x, y + 1)) return;
  writer.setPixel(x, y, P.stoneShadow);
  writer.setPixel(x + 1, y, P.stone);
  writer.setPixel(x, y + 1, P.stoneLight);
}

function drawWaterTile(writer: TileWriter, name: string): void {
  if (name.startsWith("WATER_")) {
    drawWaterBase(writer, name);
    return;
  }
  const predicate = waterPredicate(name);
  drawShoreField(writer, predicate);
  addWaterHighlights(writer, predicate, name.includes("STONE") ? 2 : 0);
}

function drawWaterBase(writer: TileWriter, name: string): void {
  const P = TERRAIN_PALETTE;
  writer.fillRect(0, 0, 16, 16, P.waterBase);
  writer.fillRect(1, 1, 14, 1, P.waterShadow);
  writer.fillRect(1, 14, 14, 1, P.waterDeep);
  if (name === "WATER_VARIANT_01") {
    writer.plotPattern(2, 3, ["....llll....", "...........", "..lll......."], { l: P.waterLight });
  } else if (name === "WATER_VARIANT_02") {
    writer.plotPattern(6, 2, ["...rr...", "........", "rr......", "........"], { r: P.waterReflection });
  } else if (name === "WATER_VARIANT_03") {
    writer.plotPattern(1, 8, ["...lll....", "..........", "......rr.."], { l: P.waterLight, r: P.waterReflection });
  } else if (name === "WATER_RIPPLE_VERTICAL") {
    writer.plotPattern(2, 3, ["..ll........", "............", "........ll..", "............"], { l: P.waterLight });
  } else {
    writer.plotPattern(2, 3, ["..llll....", "..........", "......rr..", "..........", ".lll......"], { l: P.waterLight, r: P.waterReflection });
  }
  if (name === "WATER_REED" || name === "WATER_REED_MIRROR") {
    const x = name === "WATER_REED" ? 5 : 10;
    writer.plotPattern(x, 7, ["d.", "d.", ".d", ".d"], { d: TERRAIN_PALETTE.grassLight });
  }
  if (name === "WATER_HIGHLIGHT") writer.plotPattern(3, 11, ["llllll"], { l: P.waterReflection });
}

function waterPredicate(name: string): (x: number, y: number) => boolean {
  if (name.includes("TOP")) return (_x, y) => y >= 7;
  if (name.includes("BOTTOM")) return (_x, y) => y <= 8;
  if (name.includes("LEFT")) return (x, _y) => x >= 7;
  if (name.includes("RIGHT")) return (x, _y) => x <= 8;
  if (name.includes("OUTER_TL")) return (x, y) => x >= 7 && y >= 7;
  if (name.includes("OUTER_TR")) return (x, y) => x <= 8 && y >= 7;
  if (name.includes("OUTER_BL")) return (x, y) => x >= 7 && y <= 8;
  if (name.includes("OUTER_BR")) return (x, y) => x <= 8 && y <= 8;
  if (name.includes("INNER_TL")) return (x, y) => x >= 7 || y >= 7;
  if (name.includes("INNER_TR")) return (x, y) => x <= 8 || y >= 7;
  if (name.includes("INNER_BL")) return (x, y) => x >= 7 || y <= 8;
  if (name.includes("INNER_BR")) return (x, y) => x <= 8 || y <= 8;
  throw new Error(`No water authoring rule for ${name}`);
}

function drawShoreField(writer: TileWriter, water: (x: number, y: number) => boolean): void {
  fillGrass(writer, 2);
  const P = TERRAIN_PALETTE;
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      if (water(x, y)) writer.setPixel(x, y, P.waterBase);
    }
  }
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      if (water(x, y)) continue;
      const touchesWater = water(x - 1, y) || water(x + 1, y) || water(x, y - 1) || water(x, y + 1);
      if (touchesWater && ((x + y) % 3 !== 0)) writer.setPixel(x, y, P.soilEdge);
    }
  }
  addWaterHighlights(writer, water, 0);
}

function addWaterHighlights(writer: TileWriter, water: (x: number, y: number) => boolean, shift: number): void {
  const P = TERRAIN_PALETTE;
  const marks: readonly [number, number, number][] = [[2 + shift, 9, 4], [9, 12 - shift, 3], [5, 4 + shift, 3]];
  for (const [x, y, width] of marks) {
    if (water(x, y) && water(x + width - 1, y)) {
      for (let offset = 0; offset < width; offset += 1) writer.setPixel(x + offset, y, P.waterLight);
    }
  }
}

function drawBridgeTile(writer: TileWriter, name: string): void {
  const P = TERRAIN_PALETTE;
  if (name === "BRIDGE_HORIZONTAL_START" || name === "BRIDGE_HORIZONTAL_MIDDLE" || name === "BRIDGE_HORIZONTAL_END" || name === "BRIDGE_HORIZONTAL_RAIL_TOP" || name === "BRIDGE_HORIZONTAL_RAIL_BOTTOM") {
    drawHorizontalBridge(writer, name);
    return;
  }
  if (name === "BRIDGE_VERTICAL_START" || name === "BRIDGE_VERTICAL_MIDDLE" || name === "BRIDGE_VERTICAL_END" || name === "BRIDGE_VERTICAL_RAIL_LEFT" || name === "BRIDGE_VERTICAL_RAIL_RIGHT") {
    drawVerticalBridge(writer, name);
    return;
  }
  writer.plotPattern(2, 3, [
    "..oo........",
    ".oWWoo......",
    "oWLLWo......",
    ".oWWoo......",
    "..oo........",
  ], { o: P.woodOutline, W: P.woodBase, L: P.woodLight });
}

function drawHorizontalBridge(writer: TileWriter, name: string): void {
  const P = TERRAIN_PALETTE;
  writer.fillRect(0, 0, 16, 16, P.woodBase);
  writer.fillRect(1, 2, 14, 1, P.woodShadow);
  writer.fillRect(1, 6, 14, 1, P.woodLight);
  writer.fillRect(1, 10, 14, 1, P.woodShadow);
  writer.fillRect(1, 13, 14, 1, P.woodLight);
  if (name.includes("START")) writer.fillRect(1, 1, 2, 14, P.woodOutline);
  if (name.includes("END")) writer.fillRect(13, 1, 2, 14, P.woodOutline);
  if (name.includes("RAIL_TOP")) writer.fillRect(2, 1, 12, 2, P.woodOutline);
  if (name.includes("RAIL_BOTTOM")) writer.fillRect(2, 13, 12, 2, P.woodOutline);
  if (name.includes("START") || name.includes("END")) {
    writer.setPixel(name.includes("START") ? 2 : 13, 1, P.woodHighlight);
    writer.setPixel(name.includes("START") ? 2 : 13, 14, P.woodHighlight);
  }
}

function drawVerticalBridge(writer: TileWriter, name: string): void {
  const P = TERRAIN_PALETTE;
  writer.fillRect(0, 0, 16, 16, P.woodBase);
  writer.fillRect(2, 1, 1, 14, P.woodShadow);
  writer.fillRect(6, 1, 1, 14, P.woodLight);
  writer.fillRect(10, 1, 1, 14, P.woodShadow);
  writer.fillRect(13, 1, 1, 14, P.woodLight);
  if (name.includes("START")) writer.fillRect(1, 1, 14, 2, P.woodOutline);
  if (name.includes("END")) writer.fillRect(1, 13, 14, 2, P.woodOutline);
  if (name.includes("RAIL_LEFT")) writer.fillRect(1, 2, 2, 12, P.woodOutline);
  if (name.includes("RAIL_RIGHT")) writer.fillRect(13, 2, 2, 12, P.woodOutline);
  if (name.includes("START") || name.includes("END")) {
    writer.setPixel(1, name.includes("START") ? 2 : 13, P.woodHighlight);
    writer.setPixel(14, name.includes("START") ? 2 : 13, P.woodHighlight);
  }
}

function createTerrainPreview(tileset: RgbaImage): RgbaImage {
  const columns = 12;
  const rows = 9;
  const preview: RgbaImage = {
    width: columns * TERRAIN_TILE_SIZE,
    height: rows * TERRAIN_TILE_SIZE,
    pixels: new Uint8Array(columns * rows * TERRAIN_TILE_SIZE * TERRAIN_TILE_SIZE * 4),
  };
  const place = (tileId: TerrainTileId, column: number, row: number): void => {
    const tile = TERRAIN_TILE_MAP[tileId];
    for (let localY = 0; localY < TERRAIN_TILE_SIZE; localY += 1) {
      for (let localX = 0; localX < TERRAIN_TILE_SIZE; localX += 1) {
        const sourceIndex = ((tile.row * TERRAIN_TILE_SIZE + localY) * tileset.width + tile.column * TERRAIN_TILE_SIZE + localX) * 4;
        const targetIndex = ((row * TERRAIN_TILE_SIZE + localY) * preview.width + column * TERRAIN_TILE_SIZE + localX) * 4;
        preview.pixels[targetIndex] = tileset.pixels[sourceIndex] ?? 0;
        preview.pixels[targetIndex + 1] = tileset.pixels[sourceIndex + 1] ?? 0;
        preview.pixels[targetIndex + 2] = tileset.pixels[sourceIndex + 2] ?? 0;
        preview.pixels[targetIndex + 3] = tileset.pixels[sourceIndex + 3] ?? 0;
      }
    }
  };

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) place("GRASS_BASE", column, row);
  }
  for (let column = 0; column < columns; column += 1) place("ROAD_HORIZONTAL", column, 4);
  for (let row = 0; row < rows; row += 1) place("ROAD_VERTICAL", 5, row);
  place("ROAD_CROSS", 5, 4);

  for (let row = 0; row < rows; row += 1) {
    place(row === 0 ? "SHORE_OUTER_TL" : row === rows - 1 ? "SHORE_OUTER_BL" : "SHORE_LEFT", 7, row);
    place(row === 0 ? "SHORE_OUTER_TR" : row === rows - 1 ? "SHORE_OUTER_BR" : "SHORE_RIGHT", 10, row);
    for (let column = 8; column <= 9; column += 1) place("WATER_BASE", column, row);
  }
  place("SHORE_TOP", 8, 0);
  place("SHORE_TOP", 9, 0);
  place("SHORE_BOTTOM", 8, rows - 1);
  place("SHORE_BOTTOM", 9, rows - 1);
  place("BRIDGE_HORIZONTAL_START", 7, 6);
  place("BRIDGE_HORIZONTAL_MIDDLE", 8, 6);
  place("BRIDGE_HORIZONTAL_MIDDLE", 9, 6);
  place("BRIDGE_HORIZONTAL_END", 10, 6);

  place("FLOWER_WHITE", 1, 2);
  place("FLOWER_PINK", 3, 7);
  place("FLOWER_YELLOW", 9, 2);
  place("FLOWER_PURPLE", 2, 6);
  place("SHRUB_BLOOM", 11, 1);
  place("GRASS_WEED_01", 4, 2);
  place("GRASS_WEED_02", 2, 1);
  return preview;
}

function countNonBinaryAlpha(image: RgbaImage): number {
  let count = 0;
  for (let index = 3; index < image.pixels.length; index += 4) {
    const alpha = image.pixels[index] ?? 0;
    if (alpha !== 0 && alpha !== 255) count += 1;
  }
  return count;
}

function samePixel(image: RgbaImage, firstX: number, firstY: number, secondX: number, secondY: number): boolean {
  const first = (firstY * image.width + firstX) * 4;
  const second = (secondY * image.width + secondX) * 4;
  for (let channel = 0; channel < 4; channel += 1) {
    if (image.pixels[first + channel] !== image.pixels[second + channel]) return false;
  }
  return true;
}

export function writeFormalTerrainAssets(projectRoot = process.cwd()): { terrainPath: string; previewPath: string } {
  const asset = createFormalTerrainAsset();
  assertFormalTerrainAuthoring(asset);
  const terrainPath = path.join(projectRoot, "public", "assets", "pixel", "tiles", "terrain", "terrain.png");
  const previewPath = path.join(projectRoot, "validation-output", "terrain-preview.png");
  fs.mkdirSync(path.dirname(terrainPath), { recursive: true });
  fs.mkdirSync(path.dirname(previewPath), { recursive: true });
  fs.writeFileSync(terrainPath, encodeRgbaPng(asset.image));
  fs.writeFileSync(previewPath, encodeRgbaPng(asset.preview));
  return { terrainPath, previewPath };
}

export function main(): number {
  const output = writeFormalTerrainAssets();
  process.stdout.write(`Formal terrain written: ${output.terrainPath}\n`);
  process.stdout.write(`Terrain preview written: ${output.previewPath}\n`);
  process.stdout.write(`Authored tiles: ${TERRAIN_TILE_DEFINITIONS.length}; reserved rows: 13-15\n`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.exitCode = main();
  } catch (error) {
    process.stderr.write(`Formal terrain authoring failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
