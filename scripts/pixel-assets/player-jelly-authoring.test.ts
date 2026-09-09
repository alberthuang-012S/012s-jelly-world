import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  assertFormalPlayerJellyAuthoring,
  createFormalPlayerJellyAsset,
  getPlayerJellyFrameMetrics,
  PLAYER_JELLY_DIRECTIONS,
  PLAYER_JELLY_FRAME_HEIGHT,
  PLAYER_JELLY_FRAME_WIDTH,
  PLAYER_JELLY_HEIGHT,
  PLAYER_JELLY_MANIFEST,
  PLAYER_JELLY_PREVIEW_SCALE,
  PLAYER_JELLY_WIDTH,
} from "./build-formal-player-jelly.ts";
import { validationSpecFromCharacterManifest } from "./config.ts";
import { encodeRgbaPng, validateAsset } from "./validator.ts";

const asset = createFormalPlayerJellyAsset();
const secondAsset = createFormalPlayerJellyAsset();
assert.doesNotThrow(() => assertFormalPlayerJellyAuthoring(asset));
assert.deepEqual(secondAsset.image.pixels, asset.image.pixels, "Player Jelly authoring must be deterministic");
assert.deepEqual(secondAsset.preview.pixels, asset.preview.pixels, "Player Jelly preview must be deterministic");
assert.equal(asset.image.width, PLAYER_JELLY_WIDTH);
assert.equal(asset.image.height, PLAYER_JELLY_HEIGHT);
assert.equal(asset.preview.width, PLAYER_JELLY_WIDTH * PLAYER_JELLY_PREVIEW_SCALE);
assert.equal(asset.preview.height, PLAYER_JELLY_HEIGHT * PLAYER_JELLY_PREVIEW_SCALE);
assert.equal(asset.audit.outOfBoundsAttempts, 0);
assert.equal(asset.audit.paintedFrames.length, 16);

for (const direction of PLAYER_JELLY_DIRECTIONS) {
  for (let frame = 0; frame < 4; frame += 1) {
    const metrics = getPlayerJellyFrameMetrics(asset.image, direction, frame);
    assert.ok(metrics.visible > 0, `${direction}/${frame} must contain visible pixels`);
    assert.ok(metrics.boundingBox, `${direction}/${frame} must have a bounding box`);
    assert.ok((metrics.boundingBox?.x ?? 0) >= 1);
    assert.ok((metrics.boundingBox?.y ?? 0) >= 1);
    assert.ok((metrics.boundingBox?.x ?? 99) + (metrics.boundingBox?.width ?? 0) <= PLAYER_JELLY_FRAME_WIDTH - 1);
    assert.ok((metrics.boundingBox?.y ?? 99) + (metrics.boundingBox?.height ?? 0) <= PLAYER_JELLY_FRAME_HEIGHT - 1);
  }
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "012s-player-jelly-"));
try {
  const playerPath = path.join(tempRoot, "player-jelly.png");
  const manifestPath = path.join(tempRoot, "player-jelly.manifest.json");
  fs.writeFileSync(playerPath, encodeRgbaPng(asset.image));
  fs.writeFileSync(manifestPath, `${JSON.stringify(PLAYER_JELLY_MANIFEST, null, 2)}\n`);

  const spec = validationSpecFromCharacterManifest(PLAYER_JELLY_MANIFEST);
  const valid = validateAsset(playerPath, "character", spec, {
    strictMissing: true,
    includeCells: true,
    manifestPath,
  });
  assert.equal(valid.overall, "PASS");
  assert.equal(valid.image?.width, 96);
  assert.equal(valid.image?.height, 128);
  assert.equal(valid.grid?.columns, 4);
  assert.equal(valid.grid?.rows, 4);
  assert.equal(valid.grid?.cells?.length, 16);
  assert.equal(valid.checks.find((check) => check.name === "Manifest")?.status, "PASS");
  assert.equal(valid.checks.find((check) => check.name === "Frame Occupancy")?.status, "PASS");

  const badDimensionsPath = path.join(tempRoot, "bad-dimensions.png");
  fs.writeFileSync(badDimensionsPath, encodeRgbaPng({
    width: 95,
    height: 128,
    pixels: new Uint8Array(95 * 128 * 4),
  }));
  const badDimensions = validateAsset(badDimensionsPath, "character", spec, {
    strictMissing: true,
    manifestPath,
  });
  assert.equal(badDimensions.overall, "FAIL");
  assert.match(badDimensions.checks.find((check) => check.name === "Dimensions")?.message ?? "", /Expected: 96x128/);

  const badAlphaImage = cloneImage(asset.image);
  badAlphaImage.pixels[3] = 128;
  const badAlphaPath = path.join(tempRoot, "bad-alpha.png");
  fs.writeFileSync(badAlphaPath, encodeRgbaPng(badAlphaImage));
  const badAlpha = validateAsset(badAlphaPath, "character", spec, {
    strictMissing: true,
    manifestPath,
  });
  assert.equal(badAlpha.overall, "FAIL");
  assert.equal(badAlpha.checks.find((check) => check.name === "Alpha")?.status, "FAIL");

  const emptyFrameImage = cloneImage(asset.image);
  for (let y = 0; y < PLAYER_JELLY_FRAME_HEIGHT; y += 1) {
    for (let x = 0; x < PLAYER_JELLY_FRAME_WIDTH; x += 1) {
      const index = (y * emptyFrameImage.width + x) * 4;
      emptyFrameImage.pixels[index] = 0;
      emptyFrameImage.pixels[index + 1] = 0;
      emptyFrameImage.pixels[index + 2] = 0;
      emptyFrameImage.pixels[index + 3] = 0;
    }
  }
  const emptyFramePath = path.join(tempRoot, "empty-frame.png");
  fs.writeFileSync(emptyFramePath, encodeRgbaPng(emptyFrameImage));
  const emptyFrame = validateAsset(emptyFramePath, "character", spec, {
    strictMissing: true,
    manifestPath,
  });
  assert.equal(emptyFrame.overall, "FAIL");
  assert.match(emptyFrame.checks.find((check) => check.name === "Frame Occupancy")?.message ?? "", /Empty frames: 0/);

  const invalidManifestPath = path.join(tempRoot, "invalid.manifest.json");
  fs.writeFileSync(invalidManifestPath, "{ invalid json");
  const invalidManifest = validateAsset(playerPath, "character", spec, {
    strictMissing: true,
    manifestPath: invalidManifestPath,
  });
  assert.equal(invalidManifest.overall, "FAIL");
  assert.equal(invalidManifest.checks.find((check) => check.name === "Manifest")?.status, "FAIL");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

process.stdout.write("Formal Player Jelly authoring tests: PASS\n");

function cloneImage(image: { width: number; height: number; pixels: Uint8Array }): { width: number; height: number; pixels: Uint8Array } {
  return {
    width: image.width,
    height: image.height,
    pixels: new Uint8Array(image.pixels),
  };
}
