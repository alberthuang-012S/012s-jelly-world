import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { DEFAULT_VALIDATION_SPECS } from "./config.ts";
import {
  assertFormalTerrainAuthoring,
  collectSeamIssues,
  createFormalTerrainAsset,
  FORMAL_TERRAIN_HEIGHT,
  FORMAL_TERRAIN_WIDTH,
} from "./build-formal-terrain.ts";
import { encodeRgbaPng, validateAsset } from "./validator.ts";
import {
  TERRAIN_GRID_COLUMNS,
  TERRAIN_GRID_ROWS,
  TERRAIN_TILE_DEFINITIONS,
  TERRAIN_TILE_SIZE,
} from "../../src/game/assets/terrainTileMap.ts";

const asset = createFormalTerrainAsset();
assert.doesNotThrow(() => assertFormalTerrainAuthoring(asset));
assert.equal(asset.image.width, 256);
assert.equal(asset.image.height, 256);
assert.equal(asset.image.width, TERRAIN_GRID_COLUMNS * TERRAIN_TILE_SIZE);
assert.equal(asset.image.height, TERRAIN_GRID_ROWS * TERRAIN_TILE_SIZE);
assert.equal(asset.audit.outOfBoundsAttempts, 0);
assert.equal(collectSeamIssues(asset.image).length, 0);

const indices = TERRAIN_TILE_DEFINITIONS.map((tile) => tile.index);
assert.equal(new Set(indices).size, indices.length, "tile indices must be unique");
assert.ok(indices.every((index) => Number.isInteger(index) && index >= 0 && index <= 255));
for (const write of asset.audit.writes) {
  assert.ok(Number.isInteger(write.localX) && write.localX >= 0 && write.localX < 16);
  assert.ok(Number.isInteger(write.localY) && write.localY >= 0 && write.localY < 16);
}
for (let index = 3; index < asset.image.pixels.length; index += 4) {
  assert.ok(asset.image.pixels[index] === 0 || asset.image.pixels[index] === 255, `alpha at ${index} must be binary`);
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "012s-formal-terrain-"));
try {
  const terrainPath = path.join(tempRoot, "terrain.png");
  fs.writeFileSync(terrainPath, encodeRgbaPng(asset.image));
  const report = validateAsset(terrainPath, "terrain", DEFAULT_VALIDATION_SPECS.terrain);
  assert.equal(report.overall, "PASS");
  assert.equal(report.image?.width, 256);
  assert.equal(report.image?.height, 256);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

process.stdout.write("Formal terrain authoring tests: PASS\n");
