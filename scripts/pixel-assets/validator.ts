import * as fs from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";
import type { AssetValidationKind, AssetValidationSpec } from "./config.ts";

export type ValidationStatus = "PASS" | "WARN" | "FAIL" | "SKIP";

export interface RgbaImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

export interface ValidationCheck {
  name: string;
  status: ValidationStatus;
  message: string;
  data?: Record<string, unknown>;
}

export interface OccupancyCell {
  index: number;
  column: number;
  row: number;
  visible: number;
  transparent: number;
  occupancy: number;
}

export interface GridDiagnostic {
  vertical: Array<{ position: number; crossingPixels: number }>;
  horizontal: Array<{ position: number; crossingPixels: number }>;
  repeatedTransparentSeparatorIntervals: Array<{
    axis: "vertical" | "horizontal";
    interval: number;
    expected: number;
  }>;
  debugGridPath?: string;
}

export interface ValidationReport {
  file: string;
  kind: AssetValidationKind;
  overall: ValidationStatus;
  checks: ValidationCheck[];
  warnings: string[];
  errors: string[];
  image?: { width: number; height: number };
  grid?: {
    tileWidth: number;
    tileHeight: number;
    columns: number;
    rows: number;
    margin: number;
    spacing: number;
    nonEmptyTiles: number;
    emptyTiles: number;
    cells?: OccupancyCell[];
    diagnostic: GridDiagnostic;
  };
}

interface DecodedPngMetadata {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  interlace: number;
  palette?: Buffer;
  paletteAlpha?: Buffer;
  transparentGray?: number;
  transparentRgb?: [number, number, number];
}

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function validateAsset(
  filePath: string,
  kind: AssetValidationKind,
  spec: AssetValidationSpec,
  options: { strictMissing?: boolean; includeCells?: boolean } = {},
): ValidationReport {
  if (!fs.existsSync(filePath)) {
    const status: ValidationStatus = options.strictMissing ? "FAIL" : "SKIP";
    const message = options.strictMissing ? "NOT FOUND (strict mode)" : "NOT FOUND";
    return {
      file: filePath,
      kind,
      overall: status,
      checks: [{ name: "File", status, message }],
      warnings: status === "SKIP" ? [message] : [],
      errors: status === "FAIL" ? [message] : [],
    };
  }

  let image: RgbaImage;
  try {
    image = decodePng(fs.readFileSync(filePath));
  } catch (error) {
    const message = `PNG parser error: ${error instanceof Error ? error.message : String(error)}`;
    return {
      file: filePath,
      kind,
      overall: "FAIL",
      checks: [{ name: "PNG Readable", status: "FAIL", message }],
      warnings: [],
      errors: [message],
    };
  }

  const checks: ValidationCheck[] = [
    { name: "PNG Readable", status: "PASS", message: "RGBA pixels decoded" },
  ];
  const warnings: string[] = [];
  const errors: string[] = [];

  const dimensions = validateDimensions(image, spec);
  checks.push(dimensions);
  if (dimensions.status === "FAIL") {
    errors.push(dimensions.message);
  }

  const alpha = validateAlpha(image);
  checks.push(alpha.check);
  if (alpha.check.status === "FAIL") {
    errors.push(alpha.check.message);
  }

  let grid: ValidationReport["grid"];
  if (kind === "terrain" || kind === "character") {
    const gridResult = validateGrid(image, spec, options.includeCells ?? false);
    checks.push(gridResult.check);
    if (gridResult.check.status === "FAIL") {
      errors.push(gridResult.check.message);
    }
    grid = gridResult.grid;

    if (grid) {
      const occupancyCheck: ValidationCheck = {
        name: "Occupied Tiles",
        status: "PASS",
        message: `Non-empty tiles: ${grid.nonEmptyTiles} / ${grid.columns * grid.rows}; Empty tiles: ${grid.emptyTiles} / ${grid.columns * grid.rows}`,
        data: {
          nonEmptyTiles: grid.nonEmptyTiles,
          emptyTiles: grid.emptyTiles,
        },
      };
      checks.push(occupancyCheck);
      const diagnostic = validateGridDiagnostics(image, spec.frameWidth ?? 16, spec.frameHeight ?? 16);
      grid.diagnostic = diagnostic.diagnostic;
      checks.push(diagnostic.boundaryCheck);
      checks.push(diagnostic.strideCheck);
      if (diagnostic.boundaryCheck.status === "WARN") {
        warnings.push(diagnostic.boundaryCheck.message);
      }
      if (diagnostic.strideCheck.status === "WARN") {
        warnings.push(diagnostic.strideCheck.message);
      }
    }
  } else {
    checks.push({
      name: "Native Scale",
      status: "PASS",
      message: `${image.width}x${image.height} integer pixel dimensions; no fixed sheet size required`,
    });
  }

  const overall = combineStatus(checks);
  return {
    file: filePath,
    kind,
    overall,
    checks,
    warnings,
    errors,
    image: { width: image.width, height: image.height },
    grid,
  };
}

export function decodePng(input: Buffer | Uint8Array): RgbaImage {
  const buffer = Buffer.from(input);
  if (buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("invalid PNG signature");
  }

  let offset = 8;
  let metadata: DecodedPngMetadata | undefined;
  const idat: Buffer[] = [];

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) {
      throw new Error(`truncated ${type} chunk`);
    }
    const data = buffer.subarray(dataStart, dataEnd);
    offset = dataEnd + 4;

    if (type === "IHDR") {
      if (length !== 13) {
        throw new Error("invalid IHDR chunk");
      }
      metadata = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8] ?? 0,
        colorType: data[9] ?? 0,
        interlace: data[12] ?? 0,
      };
    } else if (type === "PLTE") {
      if (!metadata) {
        throw new Error("PLTE appeared before IHDR");
      }
      metadata.palette = Buffer.from(data);
    } else if (type === "tRNS") {
      if (!metadata) {
        throw new Error("tRNS appeared before IHDR");
      }
      if (metadata.colorType === 0 && data.length >= 2) {
        metadata.transparentGray = data.readUInt16BE(0);
      } else if (metadata.colorType === 2 && data.length >= 6) {
        metadata.transparentRgb = [data.readUInt16BE(0), data.readUInt16BE(2), data.readUInt16BE(4)];
      } else if (metadata.colorType === 3) {
        metadata.paletteAlpha = Buffer.from(data);
      }
    } else if (type === "IDAT") {
      idat.push(Buffer.from(data));
    } else if (type === "IEND") {
      break;
    }
  }

  if (!metadata) {
    throw new Error("missing IHDR chunk");
  }
  if (idat.length === 0) {
    throw new Error("missing IDAT chunk");
  }
  if (metadata.width <= 0 || metadata.height <= 0) {
    throw new Error("image dimensions must be positive");
  }
  if (metadata.bitDepth !== 8) {
    throw new Error(`unsupported bit depth ${metadata.bitDepth}; only 8-bit PNG is supported`);
  }
  if (metadata.interlace !== 0) {
    throw new Error("interlaced PNG is not supported by the deterministic validator");
  }
  if (![0, 2, 3, 4, 6].includes(metadata.colorType)) {
    throw new Error(`unsupported PNG color type ${metadata.colorType}`);
  }
  if (metadata.colorType === 3 && (!metadata.palette || metadata.palette.length % 3 !== 0)) {
    throw new Error("indexed PNG is missing a valid PLTE palette");
  }

  const bytesPerPixel = bytesPerPixelForColorType(metadata.colorType);
  const rowBytes = metadata.width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idat));
  const expectedInflatedLength = (rowBytes + 1) * metadata.height;
  if (inflated.length < expectedInflatedLength) {
    throw new Error(`pixel data is truncated; expected at least ${expectedInflatedLength} bytes, got ${inflated.length}`);
  }

  const pixels = new Uint8Array(metadata.width * metadata.height * 4);
  let inputOffset = 0;
  let previousRow = new Uint8Array(rowBytes);
  for (let y = 0; y < metadata.height; y += 1) {
    const filter = inflated[inputOffset++];
    if (filter === undefined) {
      throw new Error(`missing filter byte for row ${y}`);
    }
    const row = new Uint8Array(rowBytes);
    for (let x = 0; x < rowBytes; x += 1) {
      const raw = inflated[inputOffset++];
      if (raw === undefined) {
        throw new Error(`missing pixel data at row ${y}`);
      }
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] ?? 0 : 0;
      const up = previousRow[x] ?? 0;
      const upLeft = x >= bytesPerPixel ? previousRow[x - bytesPerPixel] ?? 0 : 0;
      row[x] = (raw + filterPredictor(filter, left, up, upLeft)) & 0xff;
    }

    for (let x = 0; x < metadata.width; x += 1) {
      writeRgbaPixel(pixels, (y * metadata.width + x) * 4, row, x * bytesPerPixel, metadata, x);
    }
    previousRow = row;
  }

  return { width: metadata.width, height: metadata.height, pixels };
}

/** Encodes a small RGBA PNG and is also used by validator fixture tests. */
export function encodeRgbaPng(image: RgbaImage): Buffer {
  if (image.pixels.length !== image.width * image.height * 4) {
    throw new Error("RGBA buffer length does not match image dimensions");
  }
  const raw = Buffer.alloc((image.width * 4 + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    const rowStart = y * (image.width * 4 + 1);
    raw[rowStart] = 0;
    Buffer.from(image.pixels).copy(raw, rowStart + 1, y * image.width * 4, (y + 1) * image.width * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

export function createGridDebugImage(image: RgbaImage, tileWidth: number, tileHeight: number): Buffer {
  const debugPixels = new Uint8Array(image.pixels);
  const gridColour = [255, 0, 255, 255];
  const setPixel = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
      return;
    }
    const index = (y * image.width + x) * 4;
    debugPixels[index] = gridColour[0] ?? 255;
    debugPixels[index + 1] = gridColour[1] ?? 0;
    debugPixels[index + 2] = gridColour[2] ?? 255;
    debugPixels[index + 3] = gridColour[3] ?? 255;
  };

  for (let x = 0; x < image.width; x += tileWidth) {
    for (let y = 0; y < image.height; y += 1) {
      setPixel(x, y);
    }
  }
  for (let y = 0; y < image.height; y += tileHeight) {
    for (let x = 0; x < image.width; x += 1) {
      setPixel(x, y);
    }
  }
  return encodeRgbaPng({ width: image.width, height: image.height, pixels: debugPixels });
}

function validateDimensions(image: RgbaImage, spec: AssetValidationSpec): ValidationCheck {
  if (spec.expectedWidth !== undefined && spec.expectedHeight !== undefined) {
    const expected = `${spec.expectedWidth}x${spec.expectedHeight}`;
    const actual = `${image.width}x${image.height}`;
    return {
      name: "Dimensions",
      status: image.width === spec.expectedWidth && image.height === spec.expectedHeight ? "PASS" : "FAIL",
      message: `Expected: ${expected}; Actual: ${actual}`,
      data: { expectedWidth: spec.expectedWidth, expectedHeight: spec.expectedHeight, actualWidth: image.width, actualHeight: image.height },
    };
  }
  return {
    name: "Dimensions",
    status: "PASS",
    message: `Actual: ${image.width}x${image.height}; no fixed dimensions required`,
    data: { actualWidth: image.width, actualHeight: image.height },
  };
}

function validateAlpha(image: RgbaImage): { check: ValidationCheck; invalidCount: number; first?: { x: number; y: number; alpha: number } } {
  let invalidCount = 0;
  let first: { x: number; y: number; alpha: number } | undefined;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.pixels[(y * image.width + x) * 4 + 3] ?? 0;
      if (alpha !== 0 && alpha !== 255) {
        invalidCount += 1;
        first ??= { x, y, alpha };
      }
    }
  }
  if (invalidCount === 0) {
    return {
      check: { name: "Alpha", status: "PASS", message: "binary alpha only (0/255)" },
      invalidCount,
    };
  }
  const firstText = first ? `First occurrence: x=${first.x} y=${first.y} alpha=${first.alpha}` : "";
  return {
    check: {
      name: "Alpha",
      status: "FAIL",
      message: `Semi-transparent pixels: ${invalidCount}; ${firstText}`,
      data: { semiTransparentPixels: invalidCount, firstOccurrence: first },
    },
    invalidCount,
    first,
  };
}

function validateGrid(
  image: RgbaImage,
  spec: AssetValidationSpec,
  includeCells: boolean,
): { check: ValidationCheck; grid?: NonNullable<ValidationReport["grid"]> } {
  const tileWidth = spec.frameWidth ?? 16;
  const tileHeight = spec.frameHeight ?? 16;
  const columns = Math.floor((image.width - spec.margin * 2 + spec.spacing) / (tileWidth + spec.spacing));
  const rows = Math.floor((image.height - spec.margin * 2 + spec.spacing) / (tileHeight + spec.spacing));
  const divisible = image.width % tileWidth === 0 && image.height % tileHeight === 0;
  const matchesExpected =
    spec.columns === undefined || spec.rows === undefined || (columns === spec.columns && rows === spec.rows);
  const status: ValidationStatus = divisible && matchesExpected ? "PASS" : "FAIL";
  const message = spec.kind === "terrain"
    ? `Columns: ${columns}; Rows: ${rows}; Tile Size: ${tileWidth}x${tileHeight}; Margin: ${spec.margin}; Spacing: ${spec.spacing}`
    : `Frame grid: ${columns} columns x ${rows} rows; Frame Size: ${tileWidth}x${tileHeight}`;

  if (columns <= 0 || rows <= 0) {
    return {
      check: { name: spec.kind === "terrain" ? "Tile Grid" : "Frame Grid", status: "FAIL", message },
    };
  }

  const cells: OccupancyCell[] = [];
  let nonEmptyTiles = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      let visible = 0;
      const startX = spec.margin + column * (tileWidth + spec.spacing);
      const startY = spec.margin + row * (tileHeight + spec.spacing);
      for (let y = startY; y < Math.min(startY + tileHeight, image.height); y += 1) {
        for (let x = startX; x < Math.min(startX + tileWidth, image.width); x += 1) {
          if ((image.pixels[(y * image.width + x) * 4 + 3] ?? 0) > 0) {
            visible += 1;
          }
        }
      }
      const total = tileWidth * tileHeight;
      const cell: OccupancyCell = {
        index: row * columns + column,
        column,
        row,
        visible,
        transparent: total - visible,
        occupancy: Number(((visible / total) * 100).toFixed(1)),
      };
      cells.push(cell);
      if (visible > 0) {
        nonEmptyTiles += 1;
      }
    }
  }

  return {
    check: {
      name: spec.kind === "terrain" ? "Tile Grid" : "Frame Grid",
      status,
      message,
      data: { columns, rows, tileWidth, tileHeight, margin: spec.margin, spacing: spec.spacing },
    },
    grid: {
      tileWidth,
      tileHeight,
      columns,
      rows,
      margin: spec.margin,
      spacing: spec.spacing,
      nonEmptyTiles,
      emptyTiles: cells.length - nonEmptyTiles,
      cells: includeCells ? cells : undefined,
      diagnostic: { vertical: [], horizontal: [], repeatedTransparentSeparatorIntervals: [] },
    },
  };
}

function validateGridDiagnostics(
  image: RgbaImage,
  tileWidth: number,
  tileHeight: number,
): {
  diagnostic: GridDiagnostic;
  boundaryCheck: ValidationCheck;
  strideCheck: ValidationCheck;
} {
  const vertical = [] as Array<{ position: number; crossingPixels: number }>;
  for (let x = tileWidth; x < image.width; x += tileWidth) {
    vertical.push({ position: x, crossingPixels: countVerticalCrossing(image, x) });
  }
  const horizontal = [] as Array<{ position: number; crossingPixels: number }>;
  for (let y = tileHeight; y < image.height; y += tileHeight) {
    horizontal.push({ position: y, crossingPixels: countHorizontalCrossing(image, y) });
  }

  const repeatedTransparentSeparatorIntervals = [
    ...findRepeatedBlankIntervals(image, "vertical", tileWidth),
    ...findRepeatedBlankIntervals(image, "horizontal", tileHeight),
  ];
  const crossingTotal = vertical.reduce((sum, item) => sum + item.crossingPixels, 0) +
    horizontal.reduce((sum, item) => sum + item.crossingPixels, 0);
  const boundaryCheck: ValidationCheck = {
    name: "Grid Diagnostic",
    status: crossingTotal > 0 ? "WARN" : "PASS",
    message: crossingTotal > 0
      ? `Diagnostic only: ${crossingTotal} visible boundary crossings; content may legitimately touch cell edges`
      : "No visible pixels cross a 16px grid boundary",
    data: { vertical, horizontal, crossingTotal },
  };
  const strideCheck: ValidationCheck = {
    name: "Stride Diagnostic",
    status: repeatedTransparentSeparatorIntervals.length > 0 ? "WARN" : "PASS",
    message: repeatedTransparentSeparatorIntervals.length > 0
      ? `Possible non-${tileWidth}px stride detected: ${repeatedTransparentSeparatorIntervals.map((item) => `${item.interval}px ${item.axis}`).join(", ")}`
      : `No repeated transparent separator interval inconsistent with ${tileWidth}px grid`,
    data: { repeatedTransparentSeparatorIntervals },
  };
  return {
    diagnostic: { vertical, horizontal, repeatedTransparentSeparatorIntervals },
    boundaryCheck,
    strideCheck,
  };
}

function combineStatus(checks: ValidationCheck[]): ValidationStatus {
  if (checks.some((check) => check.status === "FAIL")) {
    return "FAIL";
  }
  if (checks.some((check) => check.status === "WARN")) {
    return "WARN";
  }
  if (checks.length === 0 || checks.every((check) => check.status === "SKIP")) {
    return "SKIP";
  }
  return "PASS";
}

function bytesPerPixelForColorType(colorType: number): number {
  if (colorType === 0 || colorType === 3) return 1;
  if (colorType === 2) return 3;
  if (colorType === 4) return 2;
  return 4;
}

function filterPredictor(filter: number, left: number, up: number, upLeft: number): number {
  if (filter === 0) return 0;
  if (filter === 1) return left;
  if (filter === 2) return up;
  if (filter === 3) return Math.floor((left + up) / 2);
  if (filter === 4) return paethPredictor(left, up, upLeft);
  throw new Error(`unsupported PNG filter type ${filter}`);
}

function paethPredictor(left: number, up: number, upLeft: number): number {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}

function writeRgbaPixel(
  target: Uint8Array,
  targetOffset: number,
  row: Uint8Array,
  sourceOffset: number,
  metadata: DecodedPngMetadata,
  x: number,
): void {
  const colorType = metadata.colorType;
  if (colorType === 6) {
    target.set(row.subarray(sourceOffset, sourceOffset + 4), targetOffset);
    return;
  }
  if (colorType === 2) {
    target[targetOffset] = row[sourceOffset] ?? 0;
    target[targetOffset + 1] = row[sourceOffset + 1] ?? 0;
    target[targetOffset + 2] = row[sourceOffset + 2] ?? 0;
    const transparent = metadata.transparentRgb &&
      row[sourceOffset] === metadata.transparentRgb[0] &&
      row[sourceOffset + 1] === metadata.transparentRgb[1] &&
      row[sourceOffset + 2] === metadata.transparentRgb[2];
    target[targetOffset + 3] = transparent ? 0 : 255;
    return;
  }
  if (colorType === 4) {
    const gray = row[sourceOffset] ?? 0;
    target[targetOffset] = gray;
    target[targetOffset + 1] = gray;
    target[targetOffset + 2] = gray;
    target[targetOffset + 3] = row[sourceOffset + 1] ?? 0;
    return;
  }
  if (colorType === 0) {
    const gray = row[sourceOffset] ?? 0;
    target[targetOffset] = gray;
    target[targetOffset + 1] = gray;
    target[targetOffset + 2] = gray;
    target[targetOffset + 3] = metadata.transparentGray === gray ? 0 : 255;
    return;
  }

  const paletteIndex = row[sourceOffset] ?? 0;
  const paletteOffset = paletteIndex * 3;
  target[targetOffset] = metadata.palette?.[paletteOffset] ?? 0;
  target[targetOffset + 1] = metadata.palette?.[paletteOffset + 1] ?? 0;
  target[targetOffset + 2] = metadata.palette?.[paletteOffset + 2] ?? 0;
  target[targetOffset + 3] = metadata.paletteAlpha?.[paletteIndex] ?? 255;
  void x;
}

function countVerticalCrossing(image: RgbaImage, x: number): number {
  let count = 0;
  for (let y = 0; y < image.height; y += 1) {
    const left = image.pixels[(y * image.width + x - 1) * 4 + 3] ?? 0;
    const right = image.pixels[(y * image.width + x) * 4 + 3] ?? 0;
    if (left > 0 && right > 0) count += 1;
  }
  return count;
}

function countHorizontalCrossing(image: RgbaImage, y: number): number {
  let count = 0;
  for (let x = 0; x < image.width; x += 1) {
    const above = image.pixels[((y - 1) * image.width + x) * 4 + 3] ?? 0;
    const below = image.pixels[(y * image.width + x) * 4 + 3] ?? 0;
    if (above > 0 && below > 0) count += 1;
  }
  return count;
}

function findRepeatedBlankIntervals(
  image: RgbaImage,
  axis: "vertical" | "horizontal",
  expected: number,
): GridDiagnostic["repeatedTransparentSeparatorIntervals"] {
  const positions: number[] = [];
  const size = axis === "vertical" ? image.width : image.height;
  for (let position = 0; position < size; position += 1) {
    let blank = true;
    const span = axis === "vertical" ? image.height : image.width;
    for (let offset = 0; offset < span; offset += 1) {
      const x = axis === "vertical" ? position : offset;
      const y = axis === "vertical" ? offset : position;
      if ((image.pixels[(y * image.width + x) * 4 + 3] ?? 0) > 0) {
        blank = false;
        break;
      }
    }
    if (blank && (position === 0 || !isAxisPositionBlank(image, axis, position - 1))) {
      positions.push(position);
    }
  }

  const frequencies = new Map<number, number>();
  for (let index = 1; index < positions.length; index += 1) {
    const interval = positions[index]! - positions[index - 1]!;
    frequencies.set(interval, (frequencies.get(interval) ?? 0) + 1);
  }
  return [...frequencies.entries()]
    .filter(([interval, count]) => count >= 2 && interval !== expected)
    .map(([interval]) => ({ axis, interval, expected }));
}

function isAxisPositionBlank(image: RgbaImage, axis: "vertical" | "horizontal", position: number): boolean {
  const span = axis === "vertical" ? image.height : image.width;
  for (let offset = 0; offset < span; offset += 1) {
    const x = axis === "vertical" ? position : offset;
    const y = axis === "vertical" ? offset : position;
    if ((image.pixels[(y * image.width + x) * 4 + 3] ?? 0) > 0) return false;
  }
  return true;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuffer, data]);
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length, 0);
  typeBuffer.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(body), data.length + 8);
  return result;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
