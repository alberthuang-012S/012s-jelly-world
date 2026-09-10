import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodePng } from "./pixel-assets/validator.ts";

// Verify real production files: reject baked checkerboards and broken atlas dimensions.
const assets = [
  ["town-roads", 1536, 1024, false],
  ["town", 1536, 1024, false], ["jelly", 1254, 1254, true],
  ["jelly-side", 1214, 1295, true], ["jelly-back", 1254, 1254, true],
  ["npcs", 1536, 1024, true],
  ["npcs-outfits", 1536, 1024, true],
  ["jelly-preferred", 256, 64, true], ["jelly-preferred-front", 64, 64, true],
] as const;
for (const [name, width, height, transparent] of assets) {
  const image = decodePng(readFileSync(new URL(`../public/assets/v2/${name}.png`, import.meta.url)));
  assert.equal(image.width, width, `${name}: width`);
  assert.equal(image.height, height, `${name}: height`);
  const columns = name.startsWith("npcs") ? 3 : name === "jelly-preferred" ? 4 : 1;
  for (let column = 0; column < columns; column++) {
    let clear = 0, visible = 0;
    for (let y = 0; y < height; y++) for (let x = column * width / columns; x < (column + 1) * width / columns; x++) {
      const alpha = image.pixels[(y * width + x) * 4 + 3];
      if (alpha === 0) clear++;
      if (alpha >= 240) visible++;
    }
    const area = width * height / columns;
    assert(visible > area * 0.1, `${name}:${column}: empty sprite`);
    if (transparent) assert(clear > area * 0.15, `${name}:${column}: missing genuine transparency`);
  }
  console.log(`PASS ${name}: ${width}x${height}${transparent ? " with alpha" : ""}`);
}
