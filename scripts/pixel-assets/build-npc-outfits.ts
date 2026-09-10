import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodeRgbaPng } from "./validator.ts";

const image = decodePng(readFileSync(new URL("../../reference/npc-outfits-source.png", import.meta.url)));
const { width, height, pixels } = image;
const seen = new Uint8Array(width * height), queue: number[] = [];
function visit(x: number, y: number): void {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const p = y * width + x, i = p * 4;
  if (seen[p]) return;
  const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
  if (Math.max(r, g, b) - Math.min(r, g, b) > 12) return;
  seen[p] = 1; pixels[i + 3] = 0; queue.push(p);
}
for (let x = 0; x < width; x++) { visit(x, 0); visit(x, height - 1); }
for (let y = 0; y < height; y++) { visit(0, y); visit(width - 1, y); }
for (let n = 0; n < queue.length; n++) {
  const x = queue[n] % width, y = Math.floor(queue[n] / width);
  visit(x - 1, y); visit(x + 1, y); visit(x, y - 1); visit(x, y + 1);
}
// Preserve the existing robot exactly; only the two requested outfits change.
const original = decodePng(readFileSync(new URL("../../public/assets/v2/npcs.png", import.meta.url)));
for (let y = 0; y < height; y++) {
  const start = (y * width + 1024) * 4, end = (y * width + 1536) * 4;
  pixels.set(original.pixels.subarray(start, end), start);
}
writeFileSync(new URL("../../public/assets/v2/npcs-outfits.png", import.meta.url), encodeRgbaPng(image));
console.log(`Removed ${queue.length} exterior background pixels; original robot preserved.`);
