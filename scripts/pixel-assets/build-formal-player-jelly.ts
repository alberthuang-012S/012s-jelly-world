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
  drawTentacles(writer, direction, frame);
  drawCrown(writer, direction);
  drawBody(writer, direction, frame);

  if (direction === "down") {
    drawFrontFace(writer, frame);
  } else if (direction === "left" || direction === "right") {
    drawSideFace(writer, direction, frame);
  } else {
    drawBackDetail(writer, frame);
  }
}

function drawTentacles(writer: FrameWriter, direction: PlayerJellyDirection, frame: number): void {
  const starts = direction === "left" || direction === "right"
    ? [5, 8, 11, 14, 17]
    : [3, 7, 11, 15, 19];
  const endsByFrame: ReadonlyArray<readonly number[]> = [
    [27, 27, 26, 27, 27],
    [28, 27, 26, 27, 28],
    [28, 27, 27, 26, 28],
    [27, 26, 27, 26, 27],
  ];
  const ends = endsByFrame[frame] ?? endsByFrame[0]!;
  const swayByFrame: ReadonlyArray<readonly number[]> = [
    [0, 0, 0, 0, 0],
    [-1, 0, 0, 0, 1],
    [1, 0, 0, 0, -1],
    [0, -1, 0, 1, 0],
  ];
  const sway = swayByFrame[frame] ?? swayByFrame[0]!;

  for (let index = 0; index < starts.length; index += 1) {
    const startX = starts[index] ?? 0;
    const endY = ends[index] ?? 27;
    const outerSide = index === 0 ? "left" : index === starts.length - 1 ? "right" : "none";
    drawRoundedTentacle(writer, startX, 19, endY, sway[index] ?? 0, outerSide);
  }
}

function drawRoundedTentacle(
  writer: FrameWriter,
  startX: number,
  startY: number,
  endY: number,
  shift: number,
  outerSide: "left" | "right" | "none",
): void {
  const bendStart = Math.max(startY, endY - 3);
  for (let y = startY; y <= endY; y += 1) {
    const x = startX + (y >= bendStart ? shift : 0);
    if (y === endY) {
      writer.setPixel(x + 1, y, P.bodyShadow);
      continue;
    }
    writer.setPixel(x, y, outerSide === "left" ? P.outlineShadow : P.bodyShadow);
    writer.setPixel(x + 1, y, y >= endY - 2 ? P.bodyShadow : P.bodyBase);
    writer.setPixel(x + 2, y, outerSide === "right" ? P.outlineShadow : P.bodyShadow);
  }
}

function drawBody(writer: FrameWriter, direction: PlayerJellyDirection, frame: number): void {
  const side = direction === "left" || direction === "right";
  const left = side ? 4 : 2;
  const right = side ? 19 : 21;
  const rowInsets = side
    ? [4, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3]
    : [5, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3];
  const squashed = frame === 3;

  for (let row = 0; row < rowInsets.length; row += 1) {
    if (squashed && row === 0) {
      continue;
    }
    const y = 6 + row;
    const inset = rowInsets[row] ?? 0;
    const rowLeft = left + inset;
    const rowRight = right - inset;
    const rowWidth = rowRight - rowLeft + 1;
    writer.fillRect(rowLeft, y, rowWidth, 1, y >= 19 ? P.outlineShadow : P.outline);
    if (rowWidth > 2) {
      writer.fillRect(
        rowLeft + 1,
        y,
        rowWidth - 2,
        1,
        y >= 16 ? P.bodyShadow : P.bodyBase,
      );
    }
  }

  const highlightShift = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  const highlightX = Math.max(left + 2, Math.min(right - 4, left + 3 + highlightShift));
  const highlightY = squashed ? 11 : 10;
  writer.fillRect(highlightX, highlightY, 3, 2, P.bodyHighlight);
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
    writer.fillRect(centre - 1, top + 3, 3, 2, P.outlineShadow);
    writer.fillRect(centre - 1, top + 1, 3, 1, P.crownHighlight);
    writer.fillRect(centre - 1, top + 2, 3, 1, P.crownBase);
    writer.fillRect(centre, top + 3, 1, 1, P.crownBase);
    writer.fillRect(centre, top + 4, 1, 2, P.crownShadow);
  }
}

function drawFrontFace(writer: FrameWriter, frame: number): void {
  const eyeY = 13 + (frame === 2 ? 1 : 0) + (frame === 3 ? 1 : 0);
  writer.fillRect(8, eyeY, 2, 2, P.eye);
  writer.fillRect(15, eyeY, 2, 2, P.eye);
}

function drawSideFace(writer: FrameWriter, direction: "left" | "right", frame: number): void {
  const eyeX = direction === "left" ? 7 : 15;
  writer.fillRect(eyeX, 13 + (frame === 3 ? 1 : 0), 2, 2, P.eye);
}

function drawBackDetail(writer: FrameWriter, frame: number): void {
  const detailY = 11 + (frame === 3 ? 1 : 0);
  writer.fillRect(8, detailY, 8, 1, P.bodyShadow);
  if (frame === 1 || frame === 3) {
    writer.fillRect(7, detailY + 4, 2, 1, P.bodyHighlight);
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
