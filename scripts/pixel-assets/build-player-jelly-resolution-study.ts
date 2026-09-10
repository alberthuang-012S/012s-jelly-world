import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { encodeRgbaPng, type RgbaImage } from "./validator.ts";

type Colour = readonly [number, number, number, number];

interface ResolutionOption {
  label: string;
  width: number;
  height: number;
  runtimeScale: 1 | 2;
  verdict: string;
  verdictColour: Colour;
}

const TRANSPARENT: Colour = [0, 0, 0, 0];
const SHEET_BACKGROUND: Colour = [247, 249, 247, 255];
const CARD_BACKGROUND: Colour = [235, 244, 250, 255];
const CARD_BORDER: Colour = [170, 207, 231, 255];
const TEXT: Colour = [24, 55, 88, 255];
const MUTED_TEXT: Colour = [82, 120, 153, 255];
const GUIDE: Colour = [196, 222, 239, 255];
const SHADOW: Colour = [178, 197, 211, 210];

const BLUE_OUTLINE: Colour = [10, 61, 143, 255];
const BLUE_SHADOW: Colour = [22, 101, 190, 255];
const BLUE_BASE: Colour = [62, 165, 235, 255];
const BLUE_HIGHLIGHT: Colour = [145, 226, 255, 255];
const BODY_SHADOW: Colour = [224, 217, 204, 255];
const BODY_BASE: Colour = [255, 248, 232, 255];
const BODY_HIGHLIGHT: Colour = [255, 254, 246, 255];
const EYE: Colour = [71, 31, 27, 255];
const EYE_HIGHLIGHT: Colour = [255, 235, 213, 255];
const BLUSH: Colour = [241, 143, 151, 255];
const BLUSH_HIGHLIGHT: Colour = [255, 188, 187, 255];

const OPTIONS: readonly ResolutionOption[] = [
  { label: "A 32X40", width: 32, height: 40, runtimeScale: 2, verdict: "REJECT / DETAIL LOW", verdictColour: [164, 75, 75, 255] },
  { label: "B 32X48", width: 32, height: 48, runtimeScale: 1, verdict: "REJECT / FACE SMALL", verdictColour: [164, 75, 75, 255] },
  { label: "C 40X48", width: 40, height: 48, runtimeScale: 1, verdict: "BORDERLINE / 1X SHORT", verdictColour: [163, 112, 53, 255] },
  { label: "D 48X48", width: 48, height: 48, runtimeScale: 1, verdict: "GOOD / SQUAT", verdictColour: [58, 119, 91, 255] },
  { label: "E 48X56", width: 48, height: 56, runtimeScale: 1, verdict: "RECOMMEND / MASTER FIT", verdictColour: [31, 126, 103, 255] },
];

const FONT: Record<string, readonly string[]> = {
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  "J": ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

function createImage(width: number, height: number, fill: Colour = TRANSPARENT): RgbaImage {
  const image: RgbaImage = { width, height, pixels: new Uint8Array(width * height * 4) };
  if (fill[3] !== 0) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        setPixel(image, x, y, fill);
      }
    }
  }
  return image;
}

function setPixel(image: RgbaImage, x: number, y: number, colour: Colour): void {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const index = (y * image.width + x) * 4;
  image.pixels[index] = colour[0];
  image.pixels[index + 1] = colour[1];
  image.pixels[index + 2] = colour[2];
  image.pixels[index + 3] = colour[3];
}

function fillRect(image: RgbaImage, x: number, y: number, width: number, height: number, colour: Colour): void {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      setPixel(image, column, row, colour);
    }
  }
}

function fillSpan(image: RgbaImage, y: number, left: number, right: number, colour: Colour): void {
  for (let x = left; x <= right; x += 1) setPixel(image, x, y, colour);
}

function createFrontPrototype(option: ResolutionOption): RgbaImage {
  const image = createImage(option.width, option.height);
  const centre = Math.floor(option.width / 2);
  const bodyTop = Math.max(5, Math.round(option.height * 0.22));
  const bodyBottom = Math.round(option.height * 0.62);
  const tentacleTop = bodyBottom - 2;
  const tentacleBottom = Math.round(option.height * 0.84);
  const bodyHalf = Math.round(option.width * 0.34);

  drawTentacles(image, centre, tentacleTop, tentacleBottom, option.width, option.height);
  drawCrown(image, centre, bodyTop, bodyHalf, option.width, option.height);
  drawBody(image, centre, bodyTop, bodyBottom, bodyHalf, option.width, option.height);
  drawFace(image, centre, bodyTop, bodyBottom, bodyHalf, option.width, option.height);
  return image;
}

function drawBody(
  image: RgbaImage,
  centre: number,
  bodyTop: number,
  bodyBottom: number,
  bodyHalf: number,
  width: number,
  height: number,
): void {
  const edgeDepth = width >= 48 ? 2 : 1;
  const domeProfile = [0.42, 0.58, 0.74, 0.88, 0.97, 1, 1, 0.98, 0.93, 0.86, 0.78];
  for (let y = bodyTop; y <= bodyBottom; y += 1) {
    const progress = (y - bodyTop) / Math.max(1, bodyBottom - bodyTop);
    const profileIndex = Math.min(domeProfile.length - 1, Math.round(progress * (domeProfile.length - 1)));
    const half = Math.max(2, Math.round(bodyHalf * (domeProfile[profileIndex] ?? 1)));
    const left = centre - half;
    const right = centre + half;
    fillSpan(image, y, left, right, BLUE_OUTLINE);
    if (right - left < 3) continue;
    fillSpan(image, y, left + 1, right - 1, BLUE_BASE);
    const innerLeft = left + edgeDepth;
    const innerRight = right - edgeDepth;
    const bodyColour = progress > 0.68 ? BODY_SHADOW : BODY_BASE;
    if (innerRight >= innerLeft) fillSpan(image, y, innerLeft, innerRight, bodyColour);
  }

  const highlightX = centre - Math.round(bodyHalf * 0.55);
  const highlightY = bodyTop + Math.max(2, Math.round((bodyBottom - bodyTop) * 0.24));
  fillRect(image, highlightX, highlightY, Math.max(2, Math.round(width * 0.08)), Math.max(2, Math.round(height * 0.07)), BODY_HIGHLIGHT);
  if (width >= 40) {
    setPixel(image, highlightX - 1, highlightY + 1, BODY_HIGHLIGHT);
    setPixel(image, highlightX + Math.max(2, Math.round(width * 0.08)), highlightY + 2, BODY_HIGHLIGHT);
  }
}

function drawCrown(
  image: RgbaImage,
  centre: number,
  bodyTop: number,
  bodyHalf: number,
  width: number,
  height: number,
): void {
  const crownTop = Math.max(1, Math.round(height * 0.04));
  const spread = Math.max(4, Math.round(bodyHalf * 0.9));
  const petalWidth = Math.max(3, Math.round(width * 0.12) | 1);
  const petalHeight = Math.max(6, Math.round(height * 0.17));
  const petalOffsets = [-2, -1, 0, 1, 2];
  const petalTops = [2, 1, 0, 1, 2];

  const crownBaseTop = Math.max(crownTop + 2, bodyTop - 3);
  const crownBaseLeft = centre - spread - 1;
  const crownBaseRight = centre + spread + 1;

  const petalCentres = petalOffsets.map((offset) => centre + Math.round(offset * spread / 2));
  const petalTopsByIndex = petalTops.map((offset) => crownTop + offset);
  const petalHalfWidth = Math.max(2, Math.floor(petalWidth / 2));
  const petalHalfHeight = Math.max(2, Math.floor(petalHeight / 2));
  const isCrownPixel = (x: number, y: number): boolean => {
    const inBase = y >= crownBaseTop && y <= crownBaseTop + 2 && x >= crownBaseLeft && x <= crownBaseRight;
    if (inBase) return true;
    return petalCentres.some((petalCentre, index) => {
      const top = petalTopsByIndex[index] ?? crownTop;
      return isRoundedLobePixel(x, y, petalCentre, top, petalHalfWidth, petalHalfHeight);
    });
  };

  const crownMinY = crownTop;
  const crownMaxY = Math.min(bodyTop, crownBaseTop + 2);
  for (let y = crownMinY; y <= crownMaxY + petalHalfHeight; y += 1) {
    for (let x = crownBaseLeft - 1; x <= crownBaseRight + 1; x += 1) {
      if (isCrownPixel(x, y)) setPixel(image, x, y, BLUE_OUTLINE);
    }
  }

  for (let y = crownMinY; y <= crownMaxY + petalHalfHeight; y += 1) {
    for (let x = crownBaseLeft; x <= crownBaseRight; x += 1) {
      if (!isCrownPixel(x, y)) continue;
      const inner = isCrownPixel(x - 1, y) && isCrownPixel(x + 1, y) && isCrownPixel(x, y - 1) && isCrownPixel(x, y + 1);
      setPixel(image, x, y, inner ? (y <= crownTop + petalHalfHeight ? BLUE_BASE : BLUE_SHADOW) : BLUE_OUTLINE);
    }
  }

  for (let index = 0; index < petalCentres.length; index += 1) {
    const petalCentre = petalCentres[index] ?? centre;
    const top = petalTopsByIndex[index] ?? crownTop;
    setPixel(image, petalCentre - 1, top + Math.min(2, petalHalfHeight), BLUE_HIGHLIGHT);
    setPixel(image, petalCentre, top + Math.min(2, petalHalfHeight) + 1, BLUE_HIGHLIGHT);
  }
}

function isRoundedLobePixel(x: number, y: number, centre: number, top: number, halfWidth: number, halfHeight: number): boolean {
  const centreY = top + halfHeight;
  const vertical = Math.abs(y - centreY) / halfHeight;
  if (vertical > 1) return false;
  const horizontal = Math.sqrt(Math.max(0, 1 - vertical * vertical)) * halfWidth;
  return Math.abs(x - centre) <= horizontal;
}

function drawTentacles(image: RgbaImage, centre: number, top: number, bottom: number, width: number, height: number): void {
  const gap = Math.max(3, Math.round(width * 0.14));
  const blobWidth = Math.max(5, Math.round(width * 0.16) | 1);
  const offsets = [-2, -1, 0, 1, 2];
  const shifts = [-1, 0, 0, 0, 1];
  const blobProfile = [0.3, 0.5, 0.72, 0.9, 1, 0.96, 0.84, 0.68, 0.5, 0.32, 0.2];

  for (let index = 0; index < offsets.length; index += 1) {
    const blobCentre = centre + (offsets[index] ?? 0) * gap;
    const shift = shifts[index] ?? 0;
    for (let y = top; y <= bottom; y += 1) {
      const progress = (y - top) / Math.max(1, bottom - top);
      const profileIndex = Math.min(blobProfile.length - 1, Math.round(progress * (blobProfile.length - 1)));
      const half = Math.max(1, Math.round((blobWidth / 2) * (blobProfile[profileIndex] ?? 1)));
      const x = blobCentre + (progress > 0.68 ? shift : 0);
      fillSpan(image, y, x - half, x + half, BLUE_OUTLINE);
      if (half > 1) {
        const innerColour = progress < 0.22
          ? BODY_BASE
          : progress > 0.78
            ? BLUE_SHADOW
            : BLUE_BASE;
        fillSpan(image, y, x - half + 1, x + half - 1, innerColour);
        if (progress > 0.28 && progress < 0.65) setPixel(image, x - half + 1, y, BLUE_HIGHLIGHT);
      }
    }
  }

  if (height >= 48) {
    setPixel(image, centre - gap, top + 1, BODY_HIGHLIGHT);
    setPixel(image, centre + gap, top + 1, BODY_HIGHLIGHT);
  }
}

function drawFace(
  image: RgbaImage,
  centre: number,
  bodyTop: number,
  bodyBottom: number,
  bodyHalf: number,
  width: number,
  height: number,
): void {
  const eyeWidth = width >= 48 ? 4 : width >= 40 ? 3 : 2;
  const eyeHeight = height >= 48 ? 6 : 4;
  const eyeY = bodyTop + Math.round((bodyBottom - bodyTop) * 0.48);
  const eyeOffset = Math.max(3, Math.round(bodyHalf * 0.43));
  drawEye(image, centre - eyeOffset, eyeY, eyeWidth, eyeHeight);
  drawEye(image, centre + eyeOffset - eyeWidth + 1, eyeY, eyeWidth, eyeHeight);

  const blushY = eyeY + eyeHeight + Math.max(1, Math.round(height * 0.035));
  const blushWidth = width >= 48 ? 4 : 3;
  drawBlush(image, centre - Math.round(bodyHalf * 0.55), blushY, blushWidth);
  drawBlush(image, centre + Math.round(bodyHalf * 0.55) - blushWidth + 1, blushY, blushWidth);

  const mouthY = blushY + Math.max(2, Math.round(height * 0.05));
  drawSmile(image, centre, mouthY, width >= 48 ? 7 : 5);
}

function drawEye(image: RgbaImage, x: number, y: number, width: number, height: number): void {
  for (let row = 0; row < height; row += 1) {
    const rowWidth = row === 0 || row === height - 1 ? Math.max(1, width - 1) : width;
    const rowX = x + Math.floor((width - rowWidth) / 2);
    fillRect(image, rowX, y + row, rowWidth, 1, EYE);
  }
  setPixel(image, x, y + 1, EYE_HIGHLIGHT);
}

function drawBlush(image: RgbaImage, x: number, y: number, width: number): void {
  fillRect(image, x + 1, y, Math.max(1, width - 2), 1, BLUSH_HIGHLIGHT);
  fillRect(image, x, y + 1, width, 2, BLUSH);
}

function drawSmile(image: RgbaImage, centre: number, y: number, width: number): void {
  const half = Math.floor(width / 2);
  setPixel(image, centre - half, y, EYE);
  setPixel(image, centre + half, y, EYE);
  setPixel(image, centre - half + 1, y + 1, EYE);
  setPixel(image, centre + half - 1, y + 1, EYE);
  for (let x = centre - 1; x <= centre + 1; x += 1) setPixel(image, x, y + 2, EYE);
}

function drawScaledSprite(target: RgbaImage, source: RgbaImage, x: number, y: number, scale: number): void {
  for (let sourceY = 0; sourceY < source.height; sourceY += 1) {
    for (let sourceX = 0; sourceX < source.width; sourceX += 1) {
      const sourceIndex = (sourceY * source.width + sourceX) * 4;
      if ((source.pixels[sourceIndex + 3] ?? 0) === 0) continue;
      const colour: Colour = [
        source.pixels[sourceIndex] ?? 0,
        source.pixels[sourceIndex + 1] ?? 0,
        source.pixels[sourceIndex + 2] ?? 0,
        source.pixels[sourceIndex + 3] ?? 0,
      ];
      fillRect(target, x + sourceX * scale, y + sourceY * scale, scale, scale, colour);
    }
  }
}

function drawPreviewShadow(target: RgbaImage, centreX: number, y: number, width: number): void {
  const half = Math.max(4, Math.floor(width / 2));
  for (let row = 0; row < 4; row += 1) {
    const inset = row === 0 || row === 3 ? Math.floor(half * 0.35) : Math.floor(half * 0.12);
    fillSpan(target, y + row, centreX - half + inset, centreX + half - inset, SHADOW);
  }
}

function drawText(target: RgbaImage, text: string, x: number, y: number, scale: number, colour: Colour): void {
  let cursor = x;
  for (const character of text) {
    const glyph = FONT[character] ?? FONT[" "]!;
    for (let row = 0; row < glyph.length; row += 1) {
      const line = glyph[row] ?? "";
      for (let column = 0; column < line.length; column += 1) {
        if (line[column] === "1") fillRect(target, cursor + column * scale, y + row * scale, scale, scale, colour);
      }
    }
    cursor += 6 * scale;
  }
}

function drawPanel(target: RgbaImage, option: ResolutionOption, panelX: number, panelY: number, panelWidth: number, panelHeight: number): void {
  fillRect(target, panelX, panelY, panelWidth, panelHeight, CARD_BACKGROUND);
  fillRect(target, panelX, panelY, panelWidth, 2, CARD_BORDER);
  fillRect(target, panelX, panelY + panelHeight - 2, panelWidth, 2, CARD_BORDER);
  fillRect(target, panelX, panelY, 2, panelHeight, CARD_BORDER);
  fillRect(target, panelX + panelWidth - 2, panelY, 2, panelHeight, CARD_BORDER);

  drawText(target, option.label, panelX + 20, panelY + 20, 4, TEXT);
  drawText(target, "NATIVE 1X DESIGN / GRID SHOWN 4X", panelX + 20, panelY + 62, 2, MUTED_TEXT);
  const prototype = createFrontPrototype(option);
  const nativeScale = 4;
  const nativeWidth = prototype.width * nativeScale;
  const nativeHeight = prototype.height * nativeScale;
  const nativeX = panelX + Math.floor((panelWidth - nativeWidth) / 2);
  const nativeY = panelY + 92;
  drawPreviewShadow(target, panelX + Math.floor(panelWidth / 2), nativeY + nativeHeight - 3, Math.max(70, Math.floor(nativeWidth * 0.48)));
  drawScaledSprite(target, prototype, nativeX, nativeY, nativeScale);

  const runtimeLabel = option.runtimeScale === 1 ? "RUNTIME CANDIDATE / INTEGER 1X" : "RUNTIME CANDIDATE / INTEGER 2X";
  drawText(target, runtimeLabel, panelX + 20, panelY + 390, 2, MUTED_TEXT);
  const runtimeWidth = prototype.width * option.runtimeScale;
  const runtimeHeight = prototype.height * option.runtimeScale;
  const runtimeX = panelX + Math.floor((panelWidth - runtimeWidth) / 2);
  const runtimeY = panelY + 430;
  drawPreviewShadow(target, panelX + Math.floor(panelWidth / 2), runtimeY + runtimeHeight - 2, Math.max(60, Math.floor(runtimeWidth * 0.48)));
  drawScaledSprite(target, prototype, runtimeX, runtimeY, option.runtimeScale);

  drawText(target, "FRONT / STATIC PROTOTYPE", panelX + 20, panelY + 610, 2, TEXT);
  drawText(target, option.verdict, panelX + 20, panelY + 646, 2, option.verdictColour);
}

export function createResolutionStudy(): RgbaImage {
  const panelWidth = 390;
  const panelHeight = 720;
  const gap = 18;
  const margin = 30;
  const width = margin * 2 + OPTIONS.length * panelWidth + (OPTIONS.length - 1) * gap;
  const height = 820;
  const sheet = createImage(width, height, SHEET_BACKGROUND);
  drawText(sheet, "PLAYER JELLY / RESOLUTION STUDY", margin, 18, 5, TEXT);
  drawText(sheet, "VISUAL MASTER TRANSLATION / FRONT ONLY / HARD PIXEL EDGES", margin, 58, 2, MUTED_TEXT);
  drawText(sheet, "NATIVE PANEL IS SHOWN 4X FOR PIXEL INSPECTION / RUNTIME PANEL USES INTEGER SCALE", margin, 78, 2, MUTED_TEXT);

  OPTIONS.forEach((option, index) => {
    const panelX = margin + index * (panelWidth + gap);
    drawPanel(sheet, option, panelX, 105, panelWidth, panelHeight);
  });
  return sheet;
}

export function writeResolutionStudy(projectRoot = process.cwd()): string {
  const outputPath = path.join(projectRoot, "validation-output", "player-jelly-resolution-study.png");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, encodeRgbaPng(createResolutionStudy()));
  return outputPath;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const outputPath = writeResolutionStudy();
  process.stdout.write(`Player Jelly resolution study written: ${outputPath}\n`);
}
