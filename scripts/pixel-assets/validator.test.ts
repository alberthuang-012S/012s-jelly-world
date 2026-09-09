import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { DEFAULT_VALIDATION_SPECS } from "./config.ts";
import { encodeRgbaPng, validateAsset, type RgbaImage } from "./validator.ts";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "012s-pixel-validator-"));

try {
  const validPath = writeFixture("valid-256.png", 256, 256, (pixels) => {
    fillRect(pixels, 256, 0, 0, 16, 16, 255);
  });
  const valid = validateAsset(validPath, "terrain", DEFAULT_VALIDATION_SPECS.terrain, { includeCells: true });
  assert.equal(valid.overall, "PASS");
  assert.equal(valid.grid?.nonEmptyTiles, 1);
  assert.equal(valid.grid?.emptyTiles, 255);

  const badDimensionsPath = writeFixture("bad-dimensions.png", 255, 256, () => undefined);
  const badDimensions = validateAsset(badDimensionsPath, "terrain", DEFAULT_VALIDATION_SPECS.terrain);
  assert.equal(badDimensions.overall, "FAIL");
  assert.match(badDimensions.checks.find((check) => check.name === "Dimensions")?.message ?? "", /Expected: 256x256/);
  assert.match(badDimensions.checks.find((check) => check.name === "Dimensions")?.message ?? "", /Actual: 255x256/);

  const badAlphaPath = writeFixture("bad-alpha.png", 256, 256, (pixels) => {
    pixels[(17 * 256 + 34) * 4 + 3] = 128;
  });
  const badAlpha = validateAsset(badAlphaPath, "terrain", DEFAULT_VALIDATION_SPECS.terrain);
  assert.equal(badAlpha.overall, "FAIL");
  assert.match(badAlpha.checks.find((check) => check.name === "Alpha")?.message ?? "", /x=34 y=17 alpha=128/);

  const missing = validateAsset(path.join(tempRoot, "missing.png"), "terrain", DEFAULT_VALIDATION_SPECS.terrain);
  assert.equal(missing.overall, "SKIP");
  const missingStrict = validateAsset(path.join(tempRoot, "missing-strict.png"), "terrain", DEFAULT_VALIDATION_SPECS.terrain, { strictMissing: true });
  assert.equal(missingStrict.overall, "FAIL");

  process.stdout.write("Pixel asset validator tests: PASS\n");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function writeFixture(
  filename: string,
  width: number,
  height: number,
  mutate: (pixels: Uint8Array) => void,
): string {
  const pixels = new Uint8Array(width * height * 4);
  mutate(pixels);
  const image: RgbaImage = { width, height, pixels };
  const filePath = path.join(tempRoot, filename);
  fs.writeFileSync(filePath, encodeRgbaPng(image));
  return filePath;
}

function fillRect(
  pixels: Uint8Array,
  width: number,
  startX: number,
  startY: number,
  rectWidth: number,
  rectHeight: number,
  alpha: number,
): void {
  for (let y = startY; y < startY + rectHeight; y += 1) {
    for (let x = startX; x < startX + rectWidth; x += 1) {
      const index = (y * width + x) * 4;
      pixels[index] = 30;
      pixels[index + 1] = 160;
      pixels[index + 2] = 120;
      pixels[index + 3] = alpha;
    }
  }
}
