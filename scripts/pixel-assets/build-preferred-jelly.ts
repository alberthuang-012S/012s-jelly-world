import { readFileSync, writeFileSync } from "node:fs";
import { decodePng, encodeRgbaPng, type RgbaImage } from "./validator.ts";

// User-authorized extraction: preserve the supplied pixels, remove only exterior
// neutral checkerboard connected to a cell edge. Enclosed white faces stay intact.
const source = decodePng(readFileSync(new URL("../../reference/player-jelly-preferred.png", import.meta.url)));
const size = 64;
const sheet: RgbaImage = { width: size * 4, height: size, pixels: new Uint8Array(size * 4 * size * 4) };
const bounds = [];
for (let frame = 0; frame < 4; frame++) {
  const left = Math.floor((frame % 2) * source.width / 2);
  const top = Math.floor(Math.floor(frame / 2) * source.height / 2);
  const right = Math.floor(((frame % 2) + 1) * source.width / 2);
  const bottom = Math.floor((Math.floor(frame / 2) + 1) * source.height / 2);
  const w = right - left, h = bottom - top;
  const outside = new Uint8Array(w * h), queue: number[] = [];
  const enqueue = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h || outside[y * w + x]) return;
    const i = ((top + y) * source.width + left + x) * 4;
    const [r, g, b] = source.pixels.subarray(i, i + 3);
    if (source.pixels[i + 3] > 0 && Math.max(r, g, b) - Math.min(r, g, b) > 40) return;
    outside[y * w + x] = 1;
    queue.push(y * w + x);
  };
  for (let x = 0; x < w; x++) { enqueue(x, 0); enqueue(x, h - 1); }
  for (let y = 0; y < h; y++) { enqueue(0, y); enqueue(w - 1, y); }
  for (let n = 0; n < queue.length; n++) {
    const x = queue[n] % w, y = Math.floor(queue[n] / w);
    enqueue(x - 1, y); enqueue(x + 1, y); enqueue(x, y - 1); enqueue(x, y + 1);
  }
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!outside[y * w + x]) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const cropW = maxX - minX + 1, cropH = maxY - minY + 1;
  const targetH = 56, targetW = Math.round(cropW * targetH / cropH);
  if (targetW > size - 4 || cropH < 50) throw new Error(`Unexpected silhouette in frame ${frame}`);
  const offsetX = Math.floor((size - targetW) / 2), offsetY = 4;
  for (let y = 0; y < targetH; y++) for (let x = 0; x < targetW; x++) {
    const sx = minX + Math.min(cropW - 1, Math.floor((x + 0.5) * cropW / targetW));
    const sy = minY + Math.min(cropH - 1, Math.floor((y + 0.5) * cropH / targetH));
    if (outside[sy * w + sx]) continue;
    const from = ((top + sy) * source.width + left + sx) * 4;
    const to = ((y + offsetY) * sheet.width + frame * size + offsetX + x) * 4;
    sheet.pixels.set(source.pixels.subarray(from, from + 4), to);
    sheet.pixels[to + 3] = 255;
  }
  bounds.push({ direction: ["down", "left", "right", "up"][frame], source: [left + minX, top + minY, cropW, cropH], width: targetW, height: targetH });
}
const out = new URL("../../public/assets/v2/", import.meta.url);
writeFileSync(new URL("jelly-preferred.png", out), encodeRgbaPng(sheet));
const front: RgbaImage = { width: size, height: size, pixels: new Uint8Array(size * size * 4) };
for (let y = 0; y < size; y++) front.pixels.set(sheet.pixels.subarray(y * sheet.width * 4, (y * sheet.width + size) * 4), y * size * 4);
writeFileSync(new URL("jelly-preferred-front.png", out), encodeRgbaPng(front));
console.log(JSON.stringify(bounds, null, 2));
