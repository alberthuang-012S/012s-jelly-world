import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { encodeRgbaPng, type RgbaImage } from "./validator.ts";
import { PLAYER_JELLY_PALETTE as P } from "./playerJellyPalette.ts";
import type { PixelColor } from "./terrainPalette.ts";

export const PLAYER_JELLY_FRAME_WIDTH = 24;
export const PLAYER_JELLY_FRAME_HEIGHT = 32;
export const PLAYER_JELLY_COLUMNS = 4;
export const PLAYER_JELLY_ROWS = 4;
export const PLAYER_JELLY_WIDTH = PLAYER_JELLY_FRAME_WIDTH * PLAYER_JELLY_COLUMNS;
export const PLAYER_JELLY_HEIGHT = PLAYER_JELLY_FRAME_HEIGHT * PLAYER_JELLY_ROWS;
export const PLAYER_JELLY_PREVIEW_SCALE = 4;

export const PLAYER_JELLY_DIRECTIONS = ["down", "left", "right", "up"] as const;
export type PlayerJellyDirection = typeof PLAYER_JELLY_DIRECTIONS[number];

export const PLAYER_JELLY_MANIFEST = {
  type: "character",
  frameWidth: PLAYER_JELLY_FRAME_WIDTH,
  frameHeight: PLAYER_JELLY_FRAME_HEIGHT,
  columns: PLAYER_JELLY_COLUMNS,
  rows: PLAYER_JELLY_ROWS,
  margin: 0,
  spacing: 0,
  directions: {
    down: 0,
    left: 1,
    right: 2,
    up: 3,
  },
  frames: {
    idle: 0,
    walkA: 1,
    walkB: 2,
    walkC: 3,
  },
  animations: {
    idle: { sequence: [0], frameRate: 1, repeat: -1 },
    walk: { sequence: [1, 0, 2, 3, 0], frameRate: 8, repeat: -1 },
  },
  anchor: {
    name: "bottom-center",
    x: 12,
    y: 31,
  },
} as const;

interface FrameWriteAudit {
  direction: PlayerJellyDirection;
  frame: number;
  localX: number;
  localY: number;
  globalX: number;
  globalY: number;
}

export interface PlayerJellyAuthoringAudit {
  writes: FrameWriteAudit[];
  outOfBoundsAttempts: number;
  paintedFrames: string[];
}

export interface FormalPlayerJellyAsset {
  image: RgbaImage;
  preview: RgbaImage;
  audit: PlayerJellyAuthoringAudit;
  manifest: typeof PLAYER_JELLY_MANIFEST;
}

class FrameWriter {
  private readonly image: RgbaImage;
  private readonly frameX: number;
  private readonly frameY: number;
  private readonly direction: PlayerJellyDirection;
  private readonly frame: number;
  private readonly audit: PlayerJellyAuthoringAudit;

  public constructor(
    image: RgbaImage,
    direction: PlayerJellyDirection,
    frame: number,
    audit: PlayerJellyAuthoringAudit,
  ) {
    this.image = image;
    this.frameX = frame * PLAYER_JELLY_FRAME_WIDTH;
    this.frameY = PLAYER_JELLY_DIRECTIONS.indexOf(direction) * PLAYER_JELLY_FRAME_HEIGHT;
    this.direction = direction;
    this.frame = frame;
    this.audit = audit;
  }

  public setPixel(localX: number, localY: number, colour: PixelColor): void {
    if (!Number.isInteger(localX) || !Number.isInteger(localY) ||
      localX < 0 || localY < 0 || localX >= PLAYER_JELLY_FRAME_WIDTH || localY >= PLAYER_JELLY_FRAME_HEIGHT) {
      this.audit.outOfBoundsAttempts += 1;
      throw new Error(`Player Jelly frame ${this.direction}/${this.frame} attempted out-of-cell write at ${localX},${localY}`);
    }

    const globalX = this.frameX + localX;
    const globalY = this.frameY + localY;
    if (globalX < this.frameX || globalX >= this.frameX + PLAYER_JELLY_FRAME_WIDTH ||
      globalY < this.frameY || globalY >= this.frameY + PLAYER_JELLY_FRAME_HEIGHT) {
      this.audit.outOfBoundsAttempts += 1;
      throw new Error(`Player Jelly frame ${this.direction}/${this.frame} crossed its frame boundary`);
    }

    const pixelIndex = (globalY * this.image.width + globalX) * 4;
    this.image.pixels[pixelIndex] = colour[0] ?? 0;
    this.image.pixels[pixelIndex + 1] = colour[1] ?? 0;
    this.image.pixels[pixelIndex + 2] = colour[2] ?? 0;
    this.image.pixels[pixelIndex + 3] = colour[3] ?? 0;
    this.audit.writes.push({
      direction: this.direction,
      frame: this.frame,
      localX,
      localY,
      globalX,
      globalY,
    });
  }

  public fillRect(startX: number, startY: number, width: number, height: number, colour: PixelColor): void {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 0 || height < 0) {
      throw new Error(`Player Jelly frame ${this.direction}/${this.frame} received a non-integer rectangle size`);
    }
    for (let y = startY; y < startY + height; y += 1) {
      for (let x = startX; x < startX + width; x += 1) {
        this.setPixel(x, y, colour);
      }
    }
  }
}

export function createFormalPlayerJellyAsset(): FormalPlayerJellyAsset {
  const image: RgbaImage = {
    width: PLAYER_JELLY_WIDTH,
    height: PLAYER_JELLY_HEIGHT,
    pixels: new Uint8Array(PLAYER_JELLY_WIDTH * PLAYER_JELLY_HEIGHT * 4),
  };
  const audit: PlayerJellyAuthoringAudit = {
    writes: [],
    outOfBoundsAttempts: 0,
    paintedFrames: [],
  };

  for (const direction of PLAYER_JELLY_DIRECTIONS) {
    for (let frame = 0; frame < PLAYER_JELLY_COLUMNS; frame += 1) {
      const writer = new FrameWriter(image, direction, frame, audit);
      drawJellyFrame(writer, direction, frame);
      audit.paintedFrames.push(`${direction}:${frame}`);
    }
  }

  return {
    image,
    preview: createPlayerJellyPreview(image),
    audit,
    manifest: PLAYER_JELLY_MANIFEST,
  };
}

export function assertFormalPlayerJellyAuthoring(asset: FormalPlayerJellyAsset): void {
  if (asset.image.width !== PLAYER_JELLY_WIDTH || asset.image.height !== PLAYER_JELLY_HEIGHT) {
    throw new Error(`Formal Player Jelly dimensions must be ${PLAYER_JELLY_WIDTH}x${PLAYER_JELLY_HEIGHT}`);
  }
  if (asset.audit.outOfBoundsAttempts !== 0) {
    throw new Error(`Formal Player Jelly authoring attempted ${asset.audit.outOfBoundsAttempts} out-of-frame writes`);
  }
  if (asset.audit.paintedFrames.length !== PLAYER_JELLY_COLUMNS * PLAYER_JELLY_ROWS) {
    throw new Error("Formal Player Jelly did not author all 16 frames");
  }

  const alphaViolations = countNonBinaryAlpha(asset.image);
  if (alphaViolations > 0) {
    throw new Error(`Formal Player Jelly contains ${alphaViolations} non-binary alpha pixels`);
  }

  for (const direction of PLAYER_JELLY_DIRECTIONS) {
    const signatures = new Set<string>();
    for (let frame = 0; frame < PLAYER_JELLY_COLUMNS; frame += 1) {
      const metrics = getPlayerJellyFrameMetrics(asset.image, direction, frame);
      if (metrics.visible === 0 || !metrics.boundingBox) {
        throw new Error(`Formal Player Jelly frame ${direction}/${frame} is empty`);
      }
      if (metrics.boundingBox.x < 1 || metrics.boundingBox.y < 1 ||
        metrics.boundingBox.x + metrics.boundingBox.width > PLAYER_JELLY_FRAME_WIDTH - 1 ||
        metrics.boundingBox.y + metrics.boundingBox.height > PLAYER_JELLY_FRAME_HEIGHT - 1) {
        throw new Error(`Formal Player Jelly frame ${direction}/${frame} does not retain a safe transparent border`);
      }
      signatures.add(frameSignature(asset.image, direction, frame));
    }
    if (signatures.size !== PLAYER_JELLY_COLUMNS) {
      throw new Error(`Formal Player Jelly ${direction} row contains duplicate animation frames`);
    }
  }
}

export interface PlayerJellyFrameMetrics {
  visible: number;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
}

export function getPlayerJellyFrameMetrics(
  image: RgbaImage,
  direction: PlayerJellyDirection,
  frame: number,
): PlayerJellyFrameMetrics {
  const frameX = frame * PLAYER_JELLY_FRAME_WIDTH;
  const frameY = PLAYER_JELLY_DIRECTIONS.indexOf(direction) * PLAYER_JELLY_FRAME_HEIGHT;
  let visible = 0;
  let minX = PLAYER_JELLY_FRAME_WIDTH;
  let minY = PLAYER_JELLY_FRAME_HEIGHT;
  let maxX = -1;
  let maxY = -1;

  for (let localY = 0; localY < PLAYER_JELLY_FRAME_HEIGHT; localY += 1) {
    for (let localX = 0; localX < PLAYER_JELLY_FRAME_WIDTH; localX += 1) {
      const globalX = frameX + localX;
      const globalY = frameY + localY;
      const alpha = image.pixels[(globalY * image.width + globalX) * 4 + 3] ?? 0;
      if (alpha === 0) continue;
      visible += 1;
      minX = Math.min(minX, localX);
      minY = Math.min(minY, localY);
      maxX = Math.max(maxX, localX);
      maxY = Math.max(maxY, localY);
    }
  }

  return {
    visible,
    boundingBox: maxX < 0 ? null : {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    },
  };
}

function drawJellyFrame(writer: FrameWriter, direction: PlayerJellyDirection, frame: number): void {
  const bodyTop = frame === 2 ? 8 : 7;
  drawTentacles(writer, direction, frame);
  drawBody(writer, direction, frame, bodyTop);
  drawCrown(writer, direction);

  if (direction === "down") {
    drawFrontFace(writer, frame, bodyTop);
  } else if (direction === "left" || direction === "right") {
    drawSideFace(writer, direction, bodyTop);
  } else {
    drawBackDetail(writer, frame, bodyTop);
  }
}

function drawTentacles(writer: FrameWriter, direction: PlayerJellyDirection, frame: number): void {
  const starts = direction === "left" || direction === "right"
    ? [4, 7, 10, 13, 16]
    : [2, 6, 10, 14, 18];
  const endsByFrame: ReadonlyArray<readonly number[]> = [
    [29, 28, 29, 28, 29],
    [28, 29, 29, 28, 28],
    [29, 29, 28, 29, 29],
    [28, 29, 29, 29, 28],
  ];
  const ends = endsByFrame[frame] ?? endsByFrame[0]!;
  const swayPatterns: ReadonlyArray<readonly number[]> = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, -1, -1, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
  ];
  const sway = swayPatterns[frame] ?? swayPatterns[0]!;

  for (let index = 0; index < starts.length; index += 1) {
    const startX = starts[index] ?? 0;
    const endY = ends[index] ?? 30;
    for (let y = 20; y <= endY; y += 1) {
      const swayIndex = Math.min(y - 20, sway.length - 1);
      const directionShift = index % 2 === 0 ? 1 : -1;
      const shift = (sway[swayIndex] ?? 0) * directionShift;
      const x = startX + shift;
      writer.fillRect(x, y, 4, 1, P.outline);
      if (y === endY) {
        writer.fillRect(x + 1, y, 2, 1, P.bodyShadow);
      } else {
        writer.fillRect(x + 1, y, 2, 1, y >= endY - 2 ? P.bodyShadow : P.bodyBase);
      }
    }
  }
}

function drawBody(
  writer: FrameWriter,
  direction: PlayerJellyDirection,
  frame: number,
  top: number,
): void {
  const side = direction === "left" || direction === "right";
  const left = side ? 5 : 3;
  const right = side ? 18 : 20;
  const width = right - left + 1;

  writer.fillRect(left + 4, top, width - 8, 1, P.outline);
  writer.fillRect(left + 2, top + 1, width - 4, 1, P.outline);
  writer.fillRect(left + 1, top + 2, width - 2, 2, P.outline);
  writer.fillRect(left, top + 4, width, 7, P.outline);
  writer.fillRect(left + 1, top + 11, width - 2, 2, P.outline);
  writer.fillRect(left + 3, top + 13, width - 6, 1, P.outlineShadow);

  writer.fillRect(left + 5, top + 1, width - 10, 1, P.bodyBase);
  writer.fillRect(left + 3, top + 2, width - 6, 2, P.bodyBase);
  writer.fillRect(left + 2, top + 4, width - 4, 6, P.bodyBase);
  writer.fillRect(left + 2, top + 10, width - 4, 2, P.bodyShadow);
  writer.fillRect(left + 4, top + 12, width - 8, 1, P.bodyShadow);

  const highlightShift = frame === 3 ? 1 : frame === 1 ? -1 : 0;
  const highlightX = Math.max(left + 2, Math.min(right - 5, left + 3 + highlightShift));
  writer.fillRect(highlightX, top + 3, 4, 3, P.bodyHighlight);

  if (direction === "up") {
    writer.fillRect(left + 3, top + 2, width - 6, 1, P.bodyShadow);
    writer.fillRect(left + 4, top + 8, width - 8, 2, P.bodyHighlight);
  }
}

function drawCrown(writer: FrameWriter, direction: PlayerJellyDirection): void {
  const side = direction === "left" || direction === "right";
  const centres = side ? [5, 8, 11, 14, 17] : [4, 8, 12, 16, 20];
  const tops = [3, 2, 1, 2, 3];

  for (let index = 0; index < centres.length; index += 1) {
    const centre = centres[index] ?? 12;
    const top = tops[index] ?? 2;
    writer.fillRect(centre - 1, top, 3, 1, P.outline);
    writer.fillRect(centre - 2, top + 1, 5, 2, P.outline);
    writer.fillRect(centre - 1, top + 3, 3, 1, P.outline);
    writer.fillRect(centre, top + 4, 1, 1, P.outline);
  }

  for (let index = 0; index < centres.length; index += 1) {
    const centre = centres[index] ?? 12;
    const top = tops[index] ?? 2;
    writer.fillRect(centre - 1, top + 1, 3, 1, P.crownHighlight);
    writer.fillRect(centre - 1, top + 2, 3, 2, P.crownBase);
    writer.fillRect(centre, top + 4, 1, 1, P.crownShadow);
  }

}

function drawFrontFace(writer: FrameWriter, frame: number, bodyTop: number): void {
  const eyeY = bodyTop + 6 + (frame === 2 ? 1 : 0);
  writer.fillRect(8, eyeY, 2, 2, P.eye);
  writer.fillRect(15, eyeY, 2, 2, P.eye);
}

function drawSideFace(writer: FrameWriter, direction: "left" | "right", bodyTop: number): void {
  const eyeX = direction === "left" ? 7 : 15;
  writer.fillRect(eyeX, bodyTop + 6, 2, 2, P.eye);
}

function drawBackDetail(writer: FrameWriter, frame: number, bodyTop: number): void {
  writer.fillRect(8, bodyTop + 4, 8, 1, P.bodyShadow);
  if (frame === 1 || frame === 3) {
    writer.fillRect(7, bodyTop + 8, 2, 1, P.bodyHighlight);
  }
}

function createPlayerJellyPreview(image: RgbaImage): RgbaImage {
  const scale = PLAYER_JELLY_PREVIEW_SCALE;
  const preview: RgbaImage = {
    width: PLAYER_JELLY_WIDTH * scale,
    height: PLAYER_JELLY_HEIGHT * scale,
    pixels: new Uint8Array(PLAYER_JELLY_WIDTH * scale * PLAYER_JELLY_HEIGHT * scale * 4),
  };
  const background: PixelColor = [229, 232, 229, 255];

  for (let y = 0; y < preview.height; y += 1) {
    for (let x = 0; x < preview.width; x += 1) {
      writePreviewPixel(preview, x, y, background);
    }
  }

  for (let sourceY = 0; sourceY < image.height; sourceY += 1) {
    for (let sourceX = 0; sourceX < image.width; sourceX += 1) {
      const sourceIndex = (sourceY * image.width + sourceX) * 4;
      if ((image.pixels[sourceIndex + 3] ?? 0) === 0) continue;
      const colour: PixelColor = [
        image.pixels[sourceIndex] ?? 0,
        image.pixels[sourceIndex + 1] ?? 0,
        image.pixels[sourceIndex + 2] ?? 0,
        255,
      ];
      for (let offsetY = 0; offsetY < scale; offsetY += 1) {
        for (let offsetX = 0; offsetX < scale; offsetX += 1) {
          writePreviewPixel(preview, sourceX * scale + offsetX, sourceY * scale + offsetY, colour);
        }
      }
    }
  }
  return preview;
}

function writePreviewPixel(image: RgbaImage, x: number, y: number, colour: PixelColor): void {
  const index = (y * image.width + x) * 4;
  image.pixels[index] = colour[0] ?? 0;
  image.pixels[index + 1] = colour[1] ?? 0;
  image.pixels[index + 2] = colour[2] ?? 0;
  image.pixels[index + 3] = colour[3] ?? 0;
}

function countNonBinaryAlpha(image: RgbaImage): number {
  let count = 0;
  for (let index = 3; index < image.pixels.length; index += 4) {
    const alpha = image.pixels[index] ?? 0;
    if (alpha !== 0 && alpha !== 255) count += 1;
  }
  return count;
}

function frameSignature(image: RgbaImage, direction: PlayerJellyDirection, frame: number): string {
  const frameX = frame * PLAYER_JELLY_FRAME_WIDTH;
  const frameY = PLAYER_JELLY_DIRECTIONS.indexOf(direction) * PLAYER_JELLY_FRAME_HEIGHT;
  const values: number[] = [];
  for (let localY = 0; localY < PLAYER_JELLY_FRAME_HEIGHT; localY += 1) {
    for (let localX = 0; localX < PLAYER_JELLY_FRAME_WIDTH; localX += 1) {
      const index = ((frameY + localY) * image.width + frameX + localX) * 4;
      values.push(image.pixels[index] ?? 0, image.pixels[index + 1] ?? 0, image.pixels[index + 2] ?? 0, image.pixels[index + 3] ?? 0);
    }
  }
  return values.join(",");
}

export function writeFormalPlayerJellyAssets(projectRoot = process.cwd()): {
  playerPath: string;
  manifestPath: string;
  previewPath: string;
} {
  const asset = createFormalPlayerJellyAsset();
  assertFormalPlayerJellyAuthoring(asset);

  const playerPath = path.join(projectRoot, "public", "assets", "pixel", "characters", "player", "player-jelly.png");
  const manifestPath = path.join(projectRoot, "public", "assets", "pixel", "characters", "player", "player-jelly.manifest.json");
  const previewPath = path.join(projectRoot, "validation-output", "player-jelly-preview.png");
  fs.mkdirSync(path.dirname(playerPath), { recursive: true });
  fs.mkdirSync(path.dirname(previewPath), { recursive: true });
  fs.writeFileSync(playerPath, encodeRgbaPng(asset.image));
  fs.writeFileSync(manifestPath, `${JSON.stringify(asset.manifest, null, 2)}\n`);
  fs.writeFileSync(previewPath, encodeRgbaPng(asset.preview));
  return { playerPath, manifestPath, previewPath };
}

export function main(): number {
  const output = writeFormalPlayerJellyAssets();
  process.stdout.write(`Formal Player Jelly written: ${output.playerPath}\n`);
  process.stdout.write(`Player Jelly manifest written: ${output.manifestPath}\n`);
  process.stdout.write(`Player Jelly preview written: ${output.previewPath}\n`);
  process.stdout.write(`Frames authored: ${PLAYER_JELLY_COLUMNS * PLAYER_JELLY_ROWS}; directions: ${PLAYER_JELLY_DIRECTIONS.join(", ")}\n`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.exitCode = main();
  } catch (error) {
    process.stderr.write(`Formal Player Jelly authoring failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
