import Phaser from "phaser";
import { announcements } from "../../data/announcements";
import { arcadeGames } from "../../data/games";
import { addRegisteredWorldImage } from "./WorldAssetBindings";
import { createTerrainLayer } from "./TerrainLayer";
import type { PixelAssetId } from "../assets/assetRegistry";

export const TILE_SIZE = 32;
export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 1200;
export const WORLD_BOUNDS = new Phaser.Geom.Rectangle(16, 16, WORLD_WIDTH - 32, WORLD_HEIGHT - 32);

export interface LobbyLayout {
  solids: Phaser.Geom.Rectangle[];
  spawn: { x: number; y: number };
  announcement: { x: number; y: number };
  npcPositions: {
    achang: { x: number; y: number };
    xindi: { x: number; y: number };
    bot: { x: number; y: number };
  };
  arcadePositions: Array<{ x: number; y: number }>;
}

// A compact GBA-inspired palette keeps every material readable at a glance.
const COLORS = {
  ink: 0x24324a,
  inkSoft: 0x33465e,
  grassDeep: 0x3d765b,
  grassDark: 0x5a9968,
  grassMid: 0x78b874,
  grassLight: 0x96c981,
  grassHighlight: 0xc1dd91,
  roadShadow: 0x8b7558,
  roadDark: 0xa78a62,
  roadMid: 0xd0b57b,
  roadLight: 0xe3c990,
  roadHighlight: 0xf2dda6,
  shoreDark: 0x5a7e68,
  shoreMid: 0x7ea66d,
  waterDeep: 0x2b6f9f,
  waterDark: 0x3289b5,
  waterMid: 0x3ea9c8,
  waterLight: 0x75d2dc,
  waterHighlight: 0xb1e8df,
  woodDeep: 0x5a3b39,
  woodDark: 0x74483a,
  woodMid: 0x9b6043,
  woodLight: 0xc7894e,
  woodHighlight: 0xe3ae61,
  paper: 0xfff2d0,
  shadow: 0x29394c,
  labRoof: 0x3b8fc4,
  labRoofDark: 0x245d8d,
  labRoofLight: 0x70c2d6,
  labWall: 0xe4ebdf,
  labWallDark: 0xc4d1c8,
  liveRoof: 0xd75b7a,
  liveRoofDark: 0x8e3657,
  liveRoofLight: 0xf28e8f,
  liveWall: 0xf0c5aa,
  liveWallDark: 0xd89d8b,
  infoRoof: 0x6d62c8,
  infoRoofDark: 0x463f8e,
  infoRoofLight: 0x9c8fe7,
  infoWall: 0xf0eadb,
  infoWallDark: 0xd7cfbd,
  arcadeRoof: 0x3f78c9,
  arcadeRoofDark: 0x28549b,
  arcadeRoofLight: 0x6fa9dd,
  arcadeWall: 0xd6e3e2,
  arcadeWallDark: 0xa8c1c5,
};

type TreeVariant = 0 | 1 | 2;

export function renderLobby(scene: Phaser.Scene): LobbyLayout {
  const solids: Phaser.Geom.Rectangle[] = [];
  const terrainLayer = createTerrainLayer(scene, WORLD_WIDTH, WORLD_HEIGHT, drawGrassTerrain);
  drawMainRoads(terrainLayer.detail);
  drawWaterways(scene, solids);
  drawNaturalBoundary(scene, solids);
  drawTownGate(scene, solids);
  drawCentralPlaza(scene);

  drawLabBuilding(scene, solids);
  drawLiveBuilding(scene, solids);
  drawInfoBooth(scene, solids);
  drawArcadeCenter(scene, solids);
  drawEventBoard(scene, solids);
  drawTownProps(scene, solids);
  drawFlowersAndShrubs(scene);

  return {
    solids,
    // Layout intentionally stays aligned with Phase 1.1.
    spawn: { x: 900, y: 620 },
    announcement: { x: 900, y: 545 },
    npcPositions: {
      achang: { x: 450, y: 455 },
      xindi: { x: 1370, y: 455 },
      bot: { x: 1490, y: 730 },
    },
    arcadePositions: arcadeGames.map((_, index) => ({ x: 630 + index * 190, y: 1015 })),
  };
}

function tileSeed(x: number, y: number): number {
  return Math.abs((Math.floor(x / TILE_SIZE) * 41 + Math.floor(y / TILE_SIZE) * 73 + 17) % 101);
}

function drawGrassTerrain(g: Phaser.GameObjects.Graphics): void {
  // One quiet base keeps the field from reading as a checkerboard of large
  // squares. The texture is built from small marks instead of tile-sized
  // colour blocks.
  g.fillStyle(COLORS.grassMid, 1);
  g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  for (let y = 0; y < WORLD_HEIGHT; y += TILE_SIZE) {
    for (let x = 0; x < WORLD_WIDTH; x += TILE_SIZE) {
      const seed = tileSeed(x, y);

      // Sparse, deterministic 2–6px marks keep the field readable without a
      // visible 32px grid.
      if (seed % 3 === 0) {
        g.fillStyle(COLORS.grassDark, 0.42);
        g.fillRect(x + 5 + (seed % 5), y + 18, 2, 5);
        g.fillRect(x + 9 + (seed % 4), y + 15, 2, 8);
        g.fillRect(x + 13 + (seed % 3), y + 20, 2, 4);
      } else if (seed % 5 === 0) {
        g.fillStyle(COLORS.grassLight, 0.55);
        g.fillRect(x + 18, y + 7 + (seed % 4), 5, 2);
        g.fillRect(x + 21, y + 9 + (seed % 4), 3, 3);
      } else if (seed % 7 === 0) {
        g.fillStyle(COLORS.grassDeep, 0.38);
        g.fillRect(x + 13, y + 23, 3, 3);
        g.fillRect(x + 16, y + 20, 2, 6);
      }

      if (seed % 11 === 0) {
        g.fillStyle(COLORS.grassDark, 0.28);
        g.fillRect(x + 3, y + 28, 6, 2);
        g.fillRect(x + 8, y + 26, 4, 2);
      }
      if (seed % 17 === 0) {
        g.fillStyle(COLORS.grassHighlight, 0.62);
        g.fillRect(x + 4, y + 5, 3, 2);
        g.fillRect(x + 7, y + 7, 2, 2);
      }
    }
  }
}

function drawMainRoads(g: Phaser.GameObjects.Graphics): void {
  const segments = [
    [828, 68, 144, 852],
    [120, 532, 1515, 128],
    [394, 398, 112, 195],
    [1288, 398, 112, 210],
    [828, 640, 144, 235],
    [1255, 635, 160, 115],
    [350, 865, 112, 285],
    [1400, 865, 112, 285],
  ] as const;

  segments.forEach(([x, y, width, height]) => drawStoneRoad(g, x, y, width, height));
}

function drawStoneRoad(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const endX = x + width;
  const endY = y + height;

  // A continuous underlay makes junctions read as one path while the tile
  // detail remains inset and visually smaller than the logical grid.
  g.fillStyle(COLORS.roadMid, 0.62);
  g.fillRect(x + 6, y + 6, Math.max(1, width - 12), Math.max(1, height - 12));

  for (let py = y; py < endY; py += TILE_SIZE) {
    for (let px = x; px < endX; px += TILE_SIZE) {
      const tileWidth = Math.min(TILE_SIZE, endX - px);
      const tileHeight = Math.min(TILE_SIZE, endY - py);
      const top = py === y;
      const bottom = py + tileHeight >= endY;
      const left = px === x;
      const right = px + tileWidth >= endX;
      const edgeCount = Number(top) + Number(bottom) + Number(left) + Number(right);
      const kind: "center" | "edge" | "corner" =
        edgeCount >= 2 ? "corner" :
        edgeCount === 1 ? "edge" :
        "center";
      drawRoadTile(g, px, py, tileWidth, tileHeight, kind, tileSeed(px, py));
    }
  }
}

function drawRoadTile(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  kind: "center" | "edge" | "corner",
  seed: number,
): void {
  const inset = kind === "center" ? 3 : kind === "corner" ? 5 : 4;
  const tileWidth = Math.max(1, width - inset * 2);
  const tileHeight = Math.max(1, height - inset * 2);
  const tileX = x + inset;
  const tileY = y + inset;

  // The logical tile stays 32px for collision/layout, but the art is made of
  // several smaller stone marks so no single tile becomes a giant square.
  g.fillStyle(seed % 7 === 0 ? COLORS.roadLight : COLORS.roadMid, 0.68);
  g.fillRect(tileX + 2, tileY + 3, Math.min(11, tileWidth - 4), Math.min(7, tileHeight - 4));
  g.fillStyle(COLORS.roadLight, 0.42);
  g.fillRect(tileX + Math.max(9, tileWidth - 13), tileY + 5, Math.min(8, tileWidth - 6), 4);
  g.fillRect(tileX + 5, tileY + Math.max(11, tileHeight - 10), Math.min(7, tileWidth - 8), 3);
  if (seed % 4 === 0) {
    g.fillStyle(COLORS.roadShadow, 0.28);
    g.fillRect(tileX + 15, tileY + 12, Math.min(7, tileWidth - 16), 2);
  }

  if (kind === "edge" || kind === "corner") {
    g.fillStyle(COLORS.roadHighlight, 0.58);
    g.fillRect(tileX + 3, tileY + 2, Math.min(10, Math.max(2, tileWidth - 9)), 2);
    g.fillStyle(COLORS.grassDark, 0.34);
    g.fillRect(x + 4, y + height - 3, Math.min(11, Math.max(2, width - 9)), 2);
  }

  if (kind === "corner" && tileWidth > 12 && tileHeight > 12) {
    g.fillStyle(COLORS.roadShadow, 0.42);
    g.fillRect(tileX + tileWidth - 8, tileY + 7, 4, 3);
  }

  if (seed % 6 === 0 && tileWidth > 14 && tileHeight > 14) {
    g.fillStyle(COLORS.roadDark, 0.48);
    g.fillRect(tileX + 9, tileY + 15, 4, 2);
    g.fillRect(tileX + 13, tileY + 13, 3, 2);
  }
}

function drawWaterways(scene: Phaser.Scene, solids: Phaser.Geom.Rectangle[]): void {
  const water = scene.add.graphics().setDepth(1);
  drawWaterBody(water, 0, 124, 146, 850, 3);
  drawWaterBody(water, 1616, 846, 184, 280, 11);
  drawShoreline(water, 146, 124, 850, "right");
  drawShoreline(water, 1616, 846, 280, "left");
  drawShoreline(water, 1616, 846, 184, "top");

  drawLilyPad(water, 55, 326, 1);
  drawLilyPad(water, 102, 748, 0);
  drawLilyPad(water, 1700, 900, 1);
  drawReeds(scene, 138, 380, "vertical");
  drawReeds(scene, 1608, 872, "horizontal");
  drawRock(scene, 150, 250, 1.2);
  drawRock(scene, 152, 820, 0.9);
  drawRock(scene, 1602, 1050, 1.1);
  drawBridge(scene, 1558, 948);

  // The bridge is the only walkable break in the small east pond.
  solids.push(new Phaser.Geom.Rectangle(0, 124, 146, 850));
  solids.push(new Phaser.Geom.Rectangle(1616, 846, 184, 96));
  solids.push(new Phaser.Geom.Rectangle(1616, 1018, 184, 108));
}

function drawWaterBody(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  seedOffset: number,
): void {
  g.fillStyle(COLORS.waterDeep, 1);
  g.fillRect(x, y, width, height);
  g.fillStyle(COLORS.waterDark, 1);
  g.fillRect(x + 7, y + 7, Math.max(1, width - 14), Math.max(1, height - 14));
  g.fillStyle(COLORS.waterMid, 1);
  g.fillRect(x + 11, y + 11, Math.max(1, width - 22), Math.max(1, height - 22));

  for (let py = y + 18; py < y + height - 8; py += 32) {
    const seed = tileSeed(x + seedOffset * TILE_SIZE, py);
    drawWaterRipple(g, x + 18 + (seed % 4) * 11, py, 18 + (seed % 3) * 6, seed % 2 === 0);
    if (seed % 3 === 0) {
      drawWaterRipple(g, x + width - 45 - (seed % 2) * 8, py + 13, 20, false);
    }
  }
}

function drawWaterRipple(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  bright: boolean,
): void {
  g.fillStyle(bright ? COLORS.waterLight : COLORS.waterDark, 0.9);
  g.fillRect(x, y, width, 4);
  g.fillStyle(bright ? COLORS.waterHighlight : COLORS.waterMid, 0.75);
  g.fillRect(x + 5, y - 3, Math.max(6, width - 12), 3);
  g.fillStyle(COLORS.waterDeep, 0.55);
  g.fillRect(x + Math.max(4, width - 9), y + 6, 8, 3);
}

function drawShoreline(
  g: Phaser.GameObjects.Graphics,
  edge: number,
  start: number,
  length: number,
  direction: "left" | "right" | "top",
): void {
  g.fillStyle(COLORS.shoreDark, 0.9);
  if (direction === "right") {
    g.fillRect(edge - 10, start, 10, length);
    for (let y = start + 8; y < start + length; y += 32) {
      g.fillStyle(COLORS.shoreMid, 1);
      g.fillRect(edge - 5, y, 5, 13);
      g.fillStyle(COLORS.grassLight, 0.8);
      g.fillRect(edge - 1, y + 4, 4, 4);
    }
  } else if (direction === "left") {
    g.fillRect(edge, start, 10, length);
    for (let y = start + 11; y < start + length; y += 32) {
      g.fillStyle(COLORS.shoreMid, 1);
      g.fillRect(edge, y, 5, 13);
      g.fillStyle(COLORS.grassLight, 0.8);
      g.fillRect(edge - 3, y + 4, 4, 4);
    }
  } else {
    g.fillRect(edge, start, length, 10);
    for (let x = edge + 10; x < edge + length; x += 32) {
      g.fillStyle(COLORS.shoreMid, 1);
      g.fillRect(x, start, 13, 5);
      g.fillStyle(COLORS.grassLight, 0.8);
      g.fillRect(x + 4, start - 3, 4, 4);
    }
  }
}

function drawNaturalBoundary(scene: Phaser.Scene, solids: Phaser.Geom.Rectangle[]): void {
  const topTrees = [170, 266, 362, 460, 554, 1210, 1302, 1400, 1498, 1592, 1690];
  const leftTrees = [170, 260, 370, 500, 640, 760, 900, 1030];
  const rightTrees = [170, 300, 430, 570, 690, 810];
  const bottomTrees = [190, 286, 388, 510, 1520, 1610, 1710];

  for (const x of topTrees) {
    addTree(scene, x, 70 + (x % 3) * 8, solids, 0.95, Math.floor(x / TILE_SIZE) % 3 as TreeVariant);
  }
  for (const y of leftTrees) {
    addTree(scene, 190 + (y % 3) * 8, y, solids, 0.88, Math.floor(y / TILE_SIZE) % 3 as TreeVariant);
  }
  for (const y of rightTrees) {
    addTree(scene, 1580 + (y % 2) * 8, y, solids, 0.9, Math.floor(y / TILE_SIZE) % 3 as TreeVariant);
  }
  for (const x of bottomTrees) {
    addTree(scene, x, 1130 - (x % 2) * 8, solids, 0.9, Math.floor(x / TILE_SIZE) % 3 as TreeVariant);
  }

  // Small clusters make the boundary feel grown rather than stamped at an
  // even interval. Keep the paths and plaza openings clear.
  const treeGroups: Array<Array<[number, number, TreeVariant]>> = [
    [[246, 82, 0], [282, 94, 1], [318, 78, 2]],
    [[490, 88, 1], [526, 72, 2], [562, 92, 0]],
    [[1230, 82, 2], [1268, 98, 0], [1302, 76, 1]],
    [[1508, 88, 1], [1544, 72, 2], [1580, 94, 0]],
    [[262, 708, 2], [298, 730, 0]],
    [[1490, 690, 1], [1528, 714, 2]],
  ];
  treeGroups.forEach((group) => group.forEach(([x, y, variant]) => {
    addTree(scene, x, y, solids, 0.72 + (variant % 2) * 0.08, variant);
  }));

  const interiorTrees: Array<[number, number, TreeVariant]> = [
    [710, 160, 0], [760, 242, 1], [1040, 164, 2], [1080, 258, 0], [700, 370, 1], [1110, 360, 2],
    [250, 530, 2], [320, 730, 0], [590, 744, 1], [1180, 745, 2], [1550, 520, 1], [1575, 780, 0],
    [244, 1050, 1], [1560, 1110, 2], [1120, 790, 0], [680, 792, 2],
  ];
  interiorTrees.forEach(([x, y, variant]) => addTree(scene, x, y, solids, 0.72 + (variant % 2) * 0.12, variant));

  // Short decorative runs frame the buildings without putting the NPCs behind
  // a continuous barrier.
  drawFence(scene, 270, 505, 92, "horizontal", solids);
  drawFence(scene, 548, 505, 82, "horizontal", solids);
  drawFence(scene, 1210, 505, 92, "horizontal", solids);
  drawFence(scene, 1470, 505, 92, "horizontal", solids);
  drawFence(scene, 270, 1090, 180, "horizontal", solids);
  drawFence(scene, 1370, 1090, 180, "horizontal", solids);
  drawFence(scene, 170, 965, 160, "vertical", solids);
}

function drawTownGate(scene: Phaser.Scene, solids: Phaser.Geom.Rectangle[]): void {
  const g = scene.add.graphics().setDepth(5);
  const x = 900;
  const y = 104;

  g.fillStyle(COLORS.shadow, 0.55);
  g.fillRect(x - 126, y + 70, 252, 8);
  drawGatePillar(g, x - 98, y + 2);
  drawGatePillar(g, x + 98, y + 2);

  g.fillStyle(COLORS.labRoofDark, 1);
  g.fillRect(x - 88, y + 6, 176, 32);
  g.fillStyle(COLORS.labRoof, 1);
  g.fillRect(x - 76, y - 1, 152, 20);
  g.fillStyle(COLORS.labRoofLight, 1);
  g.fillRect(x - 62, y + 3, 124, 5);
  g.fillStyle(COLORS.paper, 1);
  g.fillRect(x - 70, y + 20, 140, 36);
  g.fillStyle(COLORS.ink, 1);
  g.fillRect(x - 70, y + 20, 140, 4);
  g.fillRect(x - 70, y + 52, 140, 4);

  const label = scene.add.text(x, y + 38, "012S WORLD", {
    fontFamily: "monospace",
    fontSize: "16px",
    color: "#24324a",
    fontStyle: "bold",
    letterSpacing: 2,
  });
  label.setOrigin(0.5).setDepth(6);
  solids.push(new Phaser.Geom.Rectangle(x - 118, y + 4, 42, 82));
  solids.push(new Phaser.Geom.Rectangle(x + 76, y + 4, 42, 82));
}

function drawGatePillar(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(COLORS.ink, 1);
  g.fillRect(x - 26, y, 52, 82);
  g.fillStyle(0x89949b, 1);
  g.fillRect(x - 20, y + 7, 40, 70);
  g.fillStyle(0xc9d1c9, 1);
  g.fillRect(x - 12, y + 17, 18, 55);
  g.fillStyle(0xa8b3b2, 1);
  g.fillRect(x + 7, y + 17, 6, 55);
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x - 27, y - 5, 54, 11);
}

function drawCentralPlaza(scene: Phaser.Scene): void {
  const plaza = scene.add.graphics().setDepth(1);
  drawStoneRoad(plaza, 650, 390, 500, 325);
  drawPlazaGrassIsland(plaza, 690, 414, 78, 62, 0);
  drawPlazaGrassIsland(plaza, 1032, 414, 78, 62, 1);
  drawPlazaGrassIsland(plaza, 838, 603, 92, 34, 2);
  drawGardenBed(scene, 706, 640, 120, 22);
  drawGardenBed(scene, 973, 640, 120, 22);
}

function drawPlazaGrassIsland(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  variant: number,
): void {
  // Small stepped islands break up the plaza without turning it into another
  // large rectangle. Their stone edge also makes the transition readable.
  g.fillStyle(COLORS.shadow, 0.26);
  g.fillRect(x + 5, y + height - 2, width - 8, 5);
  g.fillStyle(COLORS.roadShadow, 0.55);
  g.fillRect(x + 8, y - 3, width - 16, 3);
  g.fillRect(x + 3, y + 5, 3, height - 12);
  g.fillRect(x + width - 6, y + 5, 3, height - 12);
  g.fillStyle(COLORS.grassDark, 1);
  g.fillPoints([
    { x: x + 10, y: y + 4 },
    { x: x + width - 18, y: y + 4 },
    { x: x + width - 7, y: y + 15 },
    { x: x + width - 10, y: y + height - 10 },
    { x: x + 15, y: y + height - 5 },
    { x: x + 4, y: y + height - 17 },
    { x: x + 5, y: y + 15 },
  ], true);
  g.fillStyle(variant === 1 ? COLORS.grassLight : COLORS.grassMid, 1);
  g.fillPoints([
    { x: x + 18, y: y + 10 },
    { x: x + width - 24, y: y + 10 },
    { x: x + width - 14, y: y + 19 },
    { x: x + width - 17, y: y + height - 15 },
    { x: x + 20, y: y + height - 11 },
    { x: x + 11, y: y + height - 20 },
  ], true);
  g.fillStyle(COLORS.grassHighlight, 0.7);
  g.fillRect(x + 18, y + 12, 5, 3);
  g.fillRect(x + width - 25, y + height - 16, 4, 2);
  if (variant !== 2) {
    g.fillStyle(variant === 1 ? 0xffd66e : 0xfff4dc, 1);
    g.fillRect(x + 30, y + 17, 5, 5);
    g.fillRect(x + width - 34, y + 25, 5, 5);
    g.fillStyle(COLORS.grassDeep, 1);
    g.fillRect(x + 31, y + 22, 2, 8);
    g.fillRect(x + width - 32, y + 30, 2, 7);
  }
}

function drawLabBuilding(scene: Phaser.Scene, solids: Phaser.Geom.Rectangle[]): void {
  drawBuilding(scene, {
    assetId: "building.lab",
    x: 250,
    y: 185,
    width: 400,
    height: 275,
    label: "LAB",
    roof: COLORS.labRoof,
    roofDark: COLORS.labRoofDark,
    roofLight: COLORS.labRoofLight,
    wall: COLORS.labWall,
    wallDark: COLORS.labWallDark,
    trim: 0x78c9d5,
    window: 0x5bb8d2,
  }, solids);
  drawPixelSign(scene, 450, 225, 108, "LAB", COLORS.labRoof, "flask");
  drawPlant(scene, 290, 438, 0.82);
  drawPlant(scene, 610, 438, 0.72);
}

function drawLiveBuilding(scene: Phaser.Scene, solids: Phaser.Geom.Rectangle[]): void {
  drawBuilding(scene, {
    assetId: "building.live",
    x: 1190,
    y: 185,
    width: 390,
    height: 275,
    label: "LIVE",
    roof: COLORS.liveRoof,
    roofDark: COLORS.liveRoofDark,
    roofLight: COLORS.liveRoofLight,
    wall: COLORS.liveWall,
    wallDark: COLORS.liveWallDark,
    trim: 0xffaa97,
    window: 0xf0a2ac,
  }, solids);
  drawPixelSign(scene, 1390, 225, 122, "LIVE", COLORS.liveRoof, "mic");
  drawOnAirSign(scene, 1556, 298);
  drawLargeGlassWindow(scene, 1490, 337, 116, 58, COLORS.liveRoofLight);
  drawPlant(scene, 1225, 438, 0.78);
  drawPlant(scene, 1545, 438, 0.76);
}

function drawInfoBooth(scene: Phaser.Scene, solids: Phaser.Geom.Rectangle[]): void {
  drawBuilding(scene, {
    assetId: "building.info",
    x: 1340,
    y: 570,
    width: 320,
    height: 215,
    label: "INFO",
    roof: COLORS.infoRoof,
    roofDark: COLORS.infoRoofDark,
    roofLight: COLORS.infoRoofLight,
    wall: COLORS.infoWall,
    wallDark: COLORS.infoWallDark,
    trim: 0xb7adf0,
    window: 0xc6d8df,
    compact: true,
  }, solids);
  drawPixelSign(scene, 1500, 614, 118, "INFO", COLORS.infoRoof, "info");
  drawServiceWindow(scene, 1500, 690);
  drawDesk(scene, 1500, 750, 150, solids);
  drawPlant(scene, 1365, 760, 0.58);
  drawPlant(scene, 1635, 760, 0.58);
}

function drawArcadeCenter(scene: Phaser.Scene, solids: Phaser.Geom.Rectangle[]): void {
  const x = 430;
  const y = 850;
  const width = 970;
  const height = 246;
  const formalArt = addRegisteredWorldImage(scene, "building.arcade", {
    x: x + width / 2,
    y: y + height / 2,
    width,
    height,
    depth: 2,
  });

  if (!formalArt) {
    const g = scene.add.graphics().setDepth(2);

    g.fillStyle(COLORS.shadow, 0.7);
    g.fillRect(x + 16, y + 18, width, height);
    g.fillStyle(COLORS.arcadeWallDark, 1);
    g.fillRect(x + 18, y + 64, width - 36, height - 64);
    g.fillStyle(COLORS.arcadeWall, 1);
    g.fillRect(x + 28, y + 78, width - 56, height - 92);
    for (let panelX = x + 38; panelX < x + width - 38; panelX += TILE_SIZE) {
      g.fillStyle(panelX % 64 === 0 ? 0xe6eeee : COLORS.arcadeWallDark, 0.28);
      g.fillRect(panelX, y + 84, 2, 106);
    }

    g.fillStyle(COLORS.ink, 1);
    g.fillRect(x + 8, y + 22, width - 16, 58);
    g.fillStyle(COLORS.arcadeRoofDark, 1);
    g.fillRect(x, y + 18, width, 58);
    g.fillStyle(COLORS.arcadeRoof, 1);
    g.fillRect(x + 18, y + 7, width - 36, 20);
    g.fillStyle(COLORS.arcadeRoofLight, 1);
    g.fillRect(x + 38, y + 10, width - 76, 6);
    for (let roofX = x + 12; roofX < x + width - 12; roofX += TILE_SIZE) {
      g.fillStyle(COLORS.arcadeRoofDark, 0.85);
      g.fillRect(roofX, y + 31, 4, 37);
      g.fillStyle(COLORS.arcadeRoofLight, 0.55);
      g.fillRect(roofX + 6, y + 27, 3, 30);
    }

    g.fillStyle(COLORS.paper, 1);
    g.fillRect(x + width / 2 - 130, y + 20, 260, 46);
    g.fillStyle(COLORS.ink, 1);
    g.fillRect(x + width / 2 - 130, y + 20, 260, 4);
    g.fillRect(x + width / 2 - 130, y + 62, 260, 4);
    const sign = scene.add.text(x + width / 2, y + 44, "ARCADE", {
      fontFamily: "monospace",
      fontSize: "23px",
      color: "#24324a",
      fontStyle: "bold",
      letterSpacing: 4,
    });
    sign.setOrigin(0.5).setDepth(5);

    // Open front, columns and a central doorway give the game center a real facade.
    g.fillStyle(COLORS.arcadeWallDark, 1);
    g.fillRect(x + 25, y + 75, 22, height - 82);
    g.fillRect(x + width - 47, y + 75, 22, height - 82);
    g.fillStyle(COLORS.inkSoft, 1);
    g.fillRect(x + 31, y + 79, 5, height - 90);
    g.fillRect(x + width - 36, y + 79, 5, height - 90);
    g.fillStyle(0xf0dcae, 1);
    g.fillRect(x + width / 2 - 54, y + 91, 108, 98);
    g.fillStyle(0x5ea9c4, 1);
    g.fillRect(x + width / 2 - 40, y + 103, 80, 65);
    g.fillStyle(COLORS.inkSoft, 1);
    g.fillRect(x + width / 2 - 8, y + 132, 16, 36);
    g.fillStyle(COLORS.roadHighlight, 1);
    g.fillRect(x + width / 2 - 4, y + 145, 4, 4);
    g.fillStyle(COLORS.ink, 1);
    g.fillRect(x + 52, y + 196, width - 104, 9);
    for (let lightX = x + 124; lightX < x + width - 90; lightX += 178) {
      g.fillStyle(COLORS.ink, 1);
      g.fillRect(lightX, y + 77, 8, 24);
      g.fillStyle(0xffdf79, 1);
      g.fillRect(lightX - 4, y + 96, 16, 9);
      g.fillStyle(0xfff2aa, 1);
      g.fillRect(lightX, y + 98, 6, 4);
    }
  }
  // The arcade is an open-front game center. Keep the side columns solid, but
  // leave the machine row reachable so the interaction radius is usable.
  solids.push(new Phaser.Geom.Rectangle(x + 18, y + 74, 26, 100));
  solids.push(new Phaser.Geom.Rectangle(x + width - 44, y + 74, 26, 100));
  drawFence(scene, x + 100, y + 1100, width - 200, "horizontal", solids);
  drawPlant(scene, x + 82, y + 1056, 0.65);
  drawPlant(scene, x + width - 82, y + 1056, 0.65);
}

function drawEventBoard(scene: Phaser.Scene, solids: Phaser.Geom.Rectangle[]): void {
  const x = 900;
  const y = 480;
  const boardWidth = 132;
  const formalArt = addRegisteredWorldImage(scene, "event.board", {
    x,
    y,
    depth: y + 76,
  });
  if (formalArt) {
    solids.push(new Phaser.Geom.Rectangle(x - 66, y - 40, boardWidth, 60));
    return;
  }
  const g = scene.add.graphics().setDepth(y + 76);

  // Smaller than Phase 1.1: it reads as a world prop, while the Modal carries details.
  g.fillStyle(COLORS.shadow, 0.65);
  g.fillRect(x - 62, y - 34, boardWidth + 14, 84);
  g.fillStyle(COLORS.woodDeep, 1);
  g.fillRect(x - 66, y - 40, boardWidth, 60);
  g.fillStyle(COLORS.woodMid, 1);
  g.fillRect(x - 58, y - 32, boardWidth - 16, 44);
  g.fillStyle(COLORS.woodLight, 1);
  g.fillRect(x - 70, y - 45, boardWidth + 8, 8);
  g.fillStyle(COLORS.woodHighlight, 1);
  g.fillRect(x - 58, y - 28, boardWidth - 16, 5);

  drawPinnedNotice(g, x - 38, y - 16, 25, 20, COLORS.paper);
  drawPinnedNotice(g, x - 8, y - 18, 34, 25, 0xffdba6);
  drawPinnedNotice(g, x + 30, y - 14, 22, 18, 0xf3c3cc);
  g.fillStyle(COLORS.liveRoof, 1);
  g.fillRect(x - 1, y - 12, 10, 8);
  g.fillStyle(COLORS.ink, 1);
  g.fillRect(x - 42, y + 24, 8, 68);
  g.fillRect(x + 34, y + 24, 8, 68);
  g.fillStyle(COLORS.woodLight, 1);
  g.fillRect(x - 70, y + 15, boardWidth + 8, 5);

  const title = scene.add.text(x, y - 28, "EVENT", {
    fontFamily: "monospace",
    fontSize: "10px",
    color: "#24324a",
    fontStyle: "bold",
    letterSpacing: 1,
  });
  title.setOrigin(0.5).setDepth(y + 77);
  const poster = scene.add.text(x, y + 31, announcements[0]?.placeholderTitle ?? "PPT+1", {
    fontFamily: "monospace",
    fontSize: "9px",
    color: "#fff2d0",
    backgroundColor: "#24324a",
    padding: { left: 4, right: 4, top: 2, bottom: 2 },
    fontStyle: "bold",
  });
  poster.setOrigin(0.5).setDepth(y + 77);
  solids.push(new Phaser.Geom.Rectangle(x - 66, y - 40, boardWidth, 60));
}

function drawPinnedNotice(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  paper: number,
): void {
  g.fillStyle(COLORS.inkSoft, 0.8);
  g.fillRect(x + 3, y + 3, width, height);
  g.fillStyle(paper, 1);
  g.fillRect(x, y, width, height);
  g.fillStyle(COLORS.inkSoft, 0.7);
  g.fillRect(x + 5, y + 8, Math.max(5, width - 10), 2);
  g.fillRect(x + 5, y + 13, Math.max(4, width - 14), 2);
}

function drawBuilding(
  scene: Phaser.Scene,
  config: {
    assetId: PixelAssetId;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    roof: number;
    roofDark: number;
    roofLight: number;
    wall: number;
    wallDark: number;
    trim: number;
    window: number;
    compact?: boolean;
  },
  solids: Phaser.Geom.Rectangle[],
): void {
  const formalArt = addRegisteredWorldImage(scene, config.assetId, {
    x: config.x + config.width / 2,
    y: config.y + config.height / 2,
    width: config.width,
    height: config.height,
    depth: 2,
  });
  if (!formalArt) {
    drawBuildingFallback(scene, config);
  }
  addBuildingCollision(config, solids);
}

function drawBuildingFallback(
  scene: Phaser.Scene,
  config: {
    assetId: PixelAssetId;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    roof: number;
    roofDark: number;
    roofLight: number;
    wall: number;
    wallDark: number;
    trim: number;
    window: number;
    compact?: boolean;
  },
): void {
  const g = scene.add.graphics().setDepth(2);
  const { x, y, width, height } = config;
  const roofHeight = config.compact ? 54 : 68;
  const bodyTop = y + roofHeight + 18;
  const bodyBottom = y + height - 12;
  const bodyWidth = width - 42;
  const bodyHeight = bodyBottom - bodyTop;

  // Hard-edged ground shadow and a dark foundation separate the building from the grass.
  g.fillStyle(COLORS.shadow, 0.5);
  g.fillRect(x + 22, bodyBottom + 4, width - 42, 8);
  g.fillRect(x + width - 3, bodyTop + 12, 6, bodyBottom - bodyTop);
  g.fillStyle(config.wallDark, 1);
  g.fillRect(x + 16, bodyTop - 3, width - 32, bodyHeight + 10);
  g.fillStyle(config.wall, 1);
  g.fillRect(x + 21, bodyTop, bodyWidth, bodyHeight - 7);

  // A few quiet facade seams suggest construction without making the wall a
  // second tile map or a heavy outlined rectangle.
  for (let wallX = x + 42; wallX < x + width - 32; wallX += 48) {
    g.fillStyle(config.wallDark, 0.12);
    g.fillRect(wallX, bodyTop + 18, 2, Math.max(10, bodyHeight - 34));
  }
  g.fillStyle(config.trim, 1);
  g.fillRect(x + 21, bodyTop, bodyWidth, 7);
  g.fillStyle(config.wallDark, 0.72);
  g.fillRect(x + 21, bodyBottom - 12, bodyWidth, 6);

  // Layered roof: dark underside, panel body, light top trim and restrained tile seams.
  g.fillStyle(COLORS.shadow, 0.58);
  g.fillRect(x + 12, y + 27, width - 24, roofHeight + 9);
  g.fillStyle(config.roofDark, 1);
  g.fillRect(x + 8, y + 28, width - 16, roofHeight - 2);
  g.fillStyle(config.roof, 1);
  g.fillRect(x, y + 22, width, roofHeight - 7);
  g.fillRect(x + 18, y + 10, width - 36, 18);
  g.fillStyle(config.roofLight, 1);
  g.fillRect(x + 30, y + 5, width - 60, 6);
  g.fillStyle(config.roofDark, 0.85);
  g.fillRect(x + 16, y + roofHeight + 22, width - 32, 5);
  for (let roofX = x + 22; roofX < x + width - 22; roofX += 48) {
    g.fillStyle(config.roofDark, 0.58);
    g.fillRect(roofX, y + 36, 2, roofHeight - 23);
    if (roofX % 96 === 0) {
      g.fillStyle(config.roofLight, 0.5);
      g.fillRect(roofX + 5, y + 31, 2, roofHeight - 30);
    }
  }

  drawWindow(g, x + 72, bodyTop + 37, config.window);
  drawWindow(g, x + width - 124, bodyTop + 37, config.window);
  drawDoor(g, x + width / 2, bodyBottom - 68, config.trim);
}

function addBuildingCollision(
  config: {
    x: number;
    y: number;
    width: number;
    height: number;
    compact?: boolean;
  },
  solids: Phaser.Geom.Rectangle[],
): void {
  const roofHeight = config.compact ? 54 : 68;
  const bodyTop = config.y + roofHeight + 18;
  const bodyBottom = config.y + config.height - 12;
  const bodyHeight = bodyBottom - bodyTop;
  solids.push(new Phaser.Geom.Rectangle(
    config.x + 23,
    bodyTop + 5,
    config.width - 46,
    Math.max(52, bodyHeight - 86),
  ));
}

function drawWindow(g: Phaser.GameObjects.Graphics, x: number, y: number, glass: number): void {
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x - 28, y - 22, 56, 44);
  g.fillStyle(0x203b58, 1);
  g.fillRect(x - 23, y - 17, 46, 34);
  g.fillStyle(glass, 1);
  g.fillRect(x - 19, y - 13, 38, 26);
  g.fillStyle(0xe9f4df, 0.82);
  g.fillRect(x - 14, y - 9, 12, 4);
  g.fillRect(x - 10, y - 5, 5, 3);
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x - 2, y - 18, 4, 36);
  g.fillRect(x - 24, y - 2, 48, 4);
  g.fillStyle(COLORS.roadLight, 1);
  g.fillRect(x - 27, y + 20, 54, 4);
}

function drawLargeGlassWindow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  glass: number,
): void {
  const g = scene.add.graphics().setDepth(y + 20);
  g.fillStyle(COLORS.shadow, 0.5);
  g.fillRect(x - width / 2 + 4, y - height / 2 + 5, width, height);
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x - width / 2, y - height / 2, width, height);
  g.fillStyle(0x203b58, 1);
  g.fillRect(x - width / 2 + 6, y - height / 2 + 6, width - 12, height - 12);
  g.fillStyle(glass, 1);
  g.fillRect(x - width / 2 + 10, y - height / 2 + 10, width - 20, height - 20);
  g.fillStyle(0xfff0bd, 0.68);
  g.fillRect(x - width / 2 + 15, y - height / 2 + 14, 24, 4);
  g.fillRect(x - width / 2 + 42, y - height / 2 + 18, 10, 3);
  g.fillStyle(COLORS.inkSoft, 0.72);
  g.fillRect(x - 2, y - height / 2 + 6, 4, height - 12);
  g.fillRect(x - width / 2 + 6, y + 1, width - 12, 4);
}

function drawDoor(g: Phaser.GameObjects.Graphics, x: number, y: number, trim: number): void {
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x - 28, y - 3, 56, 74);
  g.fillStyle(trim, 1);
  g.fillRect(x - 22, y + 4, 44, 67);
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x - 16, y + 10, 32, 27);
  g.fillStyle(0x6092ab, 1);
  g.fillRect(x - 12, y + 14, 24, 19);
  g.fillStyle(0xd8f0df, 0.75);
  g.fillRect(x - 9, y + 16, 9, 3);
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x + 9, y + 48, 5, 5);
  g.fillStyle(COLORS.roadHighlight, 1);
  g.fillRect(x - 30, y + 68, 60, 5);
}

function drawPixelSign(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  text: string,
  accent: number,
  icon: "flask" | "mic" | "info",
): void {
  const signDepth = y + 28;
  const g = scene.add.graphics().setDepth(signDepth);
  g.fillStyle(COLORS.shadow, 0.8);
  g.fillRect(x - width / 2 + 5, y - 2, width, 32);
  g.fillStyle(COLORS.paper, 1);
  g.fillRect(x - width / 2, y - 8, width, 29);
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x - width / 2, y - 8, width, 3);
  g.fillRect(x - width / 2, y + 18, width, 3);
  g.fillStyle(accent, 1);
  g.fillRect(x - width / 2 + 7, y - 2, 19, 17);
  if (icon === "flask") {
    g.fillStyle(COLORS.paper, 1);
    g.fillRect(x - width / 2 + 14, y, 5, 6);
    g.fillRect(x - width / 2 + 10, y + 6, 13, 8);
  } else if (icon === "mic") {
    g.fillStyle(COLORS.paper, 1);
    g.fillRect(x - width / 2 + 14, y - 2, 7, 11);
    g.fillRect(x - width / 2 + 11, y + 8, 13, 3);
  } else {
    g.fillStyle(COLORS.paper, 1);
    g.fillRect(x - width / 2 + 14, y - 1, 6, 12);
    g.fillRect(x - width / 2 + 11, y + 3, 12, 5);
  }
  const label = scene.add.text(x + 9, y + 7, text, {
    fontFamily: "monospace",
    fontSize: text === "INFO" ? "13px" : "14px",
    color: "#24324a",
    fontStyle: "bold",
    letterSpacing: 1,
  });
  label.setOrigin(0.5).setDepth(signDepth + 1);
}

function drawOnAirSign(scene: Phaser.Scene, x: number, y: number): void {
  const signDepth = y + 30;
  const g = scene.add.graphics().setDepth(signDepth);
  g.fillStyle(COLORS.shadow, 1);
  g.fillRect(x - 30, y - 33, 60, 62);
  g.fillStyle(COLORS.liveRoofDark, 1);
  g.fillRect(x - 24, y - 27, 48, 50);
  g.fillStyle(COLORS.paper, 1);
  g.fillRect(x - 17, y - 19, 34, 35);
  g.fillStyle(COLORS.liveRoof, 1);
  g.fillRect(x - 20, y - 23, 8, 8);
  const label = scene.add.text(x, y - 1, "ON\nAIR", {
    fontFamily: "monospace",
    fontSize: "9px",
    color: "#8e3657",
    fontStyle: "bold",
    align: "center",
    lineSpacing: -2,
  });
  label.setOrigin(0.5).setDepth(signDepth + 1);
}

function drawServiceWindow(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(y + 20);
  g.fillStyle(COLORS.shadow, 0.8);
  g.fillRect(x - 58, y - 7, 116, 48);
  g.fillStyle(COLORS.infoRoofDark, 1);
  g.fillRect(x - 52, y - 2, 104, 34);
  g.fillStyle(0x6fb3c0, 1);
  g.fillRect(x - 43, y + 5, 86, 19);
  g.fillStyle(COLORS.waterHighlight, 0.82);
  g.fillRect(x - 35, y + 9, 23, 4);
  g.fillRect(x + 9, y + 9, 24, 4);
  g.fillStyle(COLORS.paper, 1);
  g.fillRect(x - 49, y - 9, 98, 7);
  g.fillStyle(COLORS.infoRoofLight, 1);
  g.fillRect(x - 37, y - 15, 74, 5);
  g.fillStyle(COLORS.woodDark, 1);
  g.fillRect(x - 62, y + 29, 124, 7);
  g.fillStyle(COLORS.woodLight, 1);
  g.fillRect(x - 54, y + 29, 108, 3);
}

function drawDesk(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  solids?: Phaser.Geom.Rectangle[],
): void {
  const g = scene.add.graphics().setDepth(y + 18);
  g.fillStyle(COLORS.shadow, 0.5);
  g.fillRect(x - width / 2 + 8, y + 34, width - 4, 7);
  g.fillStyle(COLORS.woodDark, 1);
  g.fillRect(x - width / 2, y, width, 12);
  g.fillStyle(COLORS.woodHighlight, 1);
  g.fillRect(x - width / 2 + 5, y - 6, width - 10, 7);
  g.fillStyle(COLORS.woodDark, 1);
  g.fillRect(x - width / 2 + 13, y + 12, 9, 31);
  g.fillRect(x + width / 2 - 22, y + 12, 9, 31);
  g.fillStyle(COLORS.woodLight, 1);
  g.fillRect(x - width / 2 + 17, y + 15, 3, 24);
  if (solids) {
    solids.push(new Phaser.Geom.Rectangle(x - width / 2, y - 8, width, 52));
  }
}

function drawTownProps(scene: Phaser.Scene, solids: Phaser.Geom.Rectangle[]): void {
  drawBench(scene, 665, 697, solids);
  drawBench(scene, 1140, 697, solids);
  drawLamp(scene, 610, 508, solids);
  drawLamp(scene, 1190, 508, solids);
  drawLamp(scene, 1260, 625, solids);
  drawSignpost(scene, 1235, 746);
  drawMailBox(scene, 310, 520, solids);
}

function drawBench(scene: Phaser.Scene, x: number, y: number, solids: Phaser.Geom.Rectangle[]): void {
  const formalArt = addRegisteredWorldImage(scene, "prop.bench", {
    x,
    y,
    depth: y + 20,
  });
  if (formalArt) {
    solids.push(new Phaser.Geom.Rectangle(x - 39, y - 29, 78, 46));
    return;
  }
  const g = scene.add.graphics().setDepth(y + 20);
  g.fillStyle(COLORS.shadow, 0.45);
  g.fillRect(x - 42, y + 13, 84, 7);
  g.fillStyle(COLORS.woodDeep, 1);
  g.fillRect(x - 38, y - 18, 76, 10);
  g.fillStyle(COLORS.woodDark, 1);
  g.fillRect(x - 34, y - 29, 68, 10);
  g.fillStyle(COLORS.woodHighlight, 1);
  g.fillRect(x - 31, y - 26, 62, 4);
  g.fillStyle(COLORS.woodDark, 1);
  g.fillRect(x - 28, y - 8, 8, 25);
  g.fillRect(x + 20, y - 8, 8, 25);
  g.fillStyle(COLORS.woodLight, 1);
  g.fillRect(x - 25, y - 5, 3, 20);
  g.fillRect(x + 23, y - 5, 3, 20);
  solids.push(new Phaser.Geom.Rectangle(x - 39, y - 29, 78, 46));
}

function drawLamp(scene: Phaser.Scene, x: number, y: number, solids: Phaser.Geom.Rectangle[]): void {
  const formalArt = addRegisteredWorldImage(scene, "prop.lamp", {
    x,
    y,
    depth: y + 24,
  });
  if (formalArt) {
    solids.push(new Phaser.Geom.Rectangle(x - 8, y - 1, 16, 17));
    return;
  }
  const g = scene.add.graphics().setDepth(y + 24);
  g.fillStyle(COLORS.shadow, 0.42);
  g.fillRect(x - 14, y + 8, 28, 6);
  g.fillStyle(COLORS.ink, 1);
  g.fillRect(x - 4, y - 35, 8, 42);
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x - 1, y - 31, 3, 35);
  g.fillRect(x - 13, y + 5, 26, 6);
  g.fillRect(x - 11, y - 42, 22, 9);
  g.fillStyle(0xffd86f, 1);
  g.fillRect(x - 7, y - 36, 14, 9);
  g.fillStyle(0xfff2a5, 1);
  g.fillRect(x - 3, y - 34, 6, 5);
  solids.push(new Phaser.Geom.Rectangle(x - 8, y - 1, 16, 17));
}

function drawSignpost(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(y + 20);
  g.fillStyle(COLORS.shadow, 0.4);
  g.fillRect(x - 15, y + 39, 30, 6);
  g.fillStyle(COLORS.woodDark, 1);
  g.fillRect(x - 4, y - 2, 8, 46);
  g.fillStyle(COLORS.woodLight, 1);
  g.fillRect(x - 38, y - 30, 76, 28);
  g.fillStyle(COLORS.woodHighlight, 1);
  g.fillRect(x - 31, y - 27, 62, 4);
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x - 30, y - 18, 48, 4);
  g.fillRect(x - 25, y - 9, 38, 3);
  g.fillRect(x + 17, y - 24, 8, 4);
}

function drawMailBox(scene: Phaser.Scene, x: number, y: number, solids: Phaser.Geom.Rectangle[]): void {
  const g = scene.add.graphics().setDepth(y + 20);
  g.fillStyle(COLORS.shadow, 0.4);
  g.fillRect(x - 16, y + 22, 32, 6);
  g.fillStyle(COLORS.ink, 1);
  g.fillRect(x - 13, y - 21, 26, 24);
  g.fillStyle(0x4eb9d2, 1);
  g.fillRect(x - 8, y - 16, 16, 13);
  g.fillStyle(COLORS.waterHighlight, 1);
  g.fillRect(x - 5, y - 13, 7, 3);
  g.fillStyle(COLORS.ink, 1);
  g.fillRect(x - 3, y + 3, 6, 22);
  g.fillStyle(COLORS.liveRoof, 1);
  g.fillRect(x + 10, y - 27, 4, 10);
  solids.push(new Phaser.Geom.Rectangle(x - 15, y - 24, 30, 50));
}

function drawGardenBed(scene: Phaser.Scene, x: number, y: number, width: number, height: number): void {
  const g = scene.add.graphics().setDepth(y + 4);
  g.fillStyle(COLORS.shadow, 0.42);
  g.fillRect(x + 5, y + 5, width, height);
  g.fillStyle(COLORS.woodDark, 1);
  g.fillRect(x, y, width, height);
  g.fillStyle(COLORS.woodLight, 1);
  g.fillRect(x + 3, y, width - 6, 4);
  g.fillStyle(COLORS.grassDeep, 1);
  g.fillRect(x + 6, y + 5, width - 12, height - 8);
  for (let flowerX = x + 18; flowerX < x + width - 8; flowerX += 26) {
    g.fillStyle(flowerX % 3 === 0 ? 0xd75b7a : 0xffdc78, 1);
    g.fillRect(flowerX, y - 5, 7, 7);
    g.fillStyle(COLORS.grassLight, 1);
    g.fillRect(flowerX + 2, y + 2, 3, 8);
  }
}

function drawPlant(scene: Phaser.Scene, x: number, y: number, scale: number): void {
  const g = scene.add.graphics().setDepth(y + 18);
  const p = (value: number) => Math.round(value * scale);
  g.fillStyle(COLORS.shadow, 0.4);
  g.fillRect(x - p(14), y + p(15), p(28), p(6));
  g.fillStyle(COLORS.woodDark, 1);
  g.fillRect(x - p(12), y + p(4), p(24), p(15));
  g.fillStyle(COLORS.woodLight, 1);
  g.fillRect(x - p(9), y + p(6), p(18), p(10));
  g.fillStyle(COLORS.grassDeep, 1);
  g.fillRect(x - p(4), y - p(27), p(8), p(35));
  g.fillRect(x - p(19), y - p(17), p(17), p(8));
  g.fillRect(x + p(2), y - p(23), p(18), p(8));
  g.fillRect(x - p(15), y - p(30), p(10), p(9));
  g.fillStyle(COLORS.grassDark, 1);
  g.fillRect(x - p(12), y - p(20), p(15), p(8));
  g.fillStyle(COLORS.grassLight, 1);
  g.fillRect(x - p(1), y - p(24), p(4), p(13));
  g.fillStyle(COLORS.grassHighlight, 0.8);
  g.fillRect(x + p(8), y - p(21), p(5), p(3));
}

function drawFlowersAndShrubs(scene: Phaser.Scene): void {
  const flowers: Array<[number, number, number]> = [
    [260, 126, 0], [612, 112, 1], [730, 286, 3], [1085, 292, 2], [1140, 520, 1],
    [1250, 510, 0], [1510, 515, 3], [550, 770, 2], [1220, 780, 1], [1480, 820, 0],
    [220, 1100, 3], [1515, 1100, 2],
  ];
  flowers.forEach(([x, y, variant]) => drawFlower(scene, x, y, variant));
  const shrubs: Array<[number, number, TreeVariant]> = [
    [320, 518, 0], [585, 519, 1], [1175, 518, 2], [1580, 520, 0], [565, 800, 1], [1235, 805, 2],
  ];
  shrubs.forEach(([x, y, variant]) => drawShrub(scene, x, y, variant));
}

function drawFlower(scene: Phaser.Scene, x: number, y: number, variant: number): void {
  const g = scene.add.graphics().setDepth(y + 7);
  const petalColors = [0xfff4dc, 0xffd66e, 0xd75b7a, 0x9d8fe7];
  const petal = petalColors[variant] ?? petalColors[0];
  g.fillStyle(COLORS.grassDeep, 1);
  g.fillRect(x - 2, y, 4, 13);
  g.fillRect(x + 3, y + 6, 5, 3);
  g.fillStyle(petal, 1);
  g.fillRect(x - 7, y - 4, 6, 6);
  g.fillRect(x + 1, y - 4, 6, 6);
  g.fillRect(x - 3, y - 8, 6, 6);
  g.fillRect(x - 3, y + 1, 6, 4);
  g.fillStyle(0xffc766, 1);
  g.fillRect(x - 2, y - 3, 4, 4);
}

function drawShrub(scene: Phaser.Scene, x: number, y: number, variant: TreeVariant): void {
  const g = scene.add.graphics().setDepth(y + 19);
  const mid = variant === 1 ? 0x629f68 : variant === 2 ? 0x568d69 : COLORS.grassDark;
  g.fillStyle(COLORS.shadow, 0.4);
  g.fillRect(x - 23, y + 6, 46, 7);
  g.fillStyle(COLORS.grassDeep, 1);
  g.fillRect(x - 21, y - 6, 42, 17);
  g.fillRect(x - 14, y - 15, 28, 14);
  g.fillRect(x - 5, y - 21, 16, 9);
  g.fillStyle(mid, 1);
  g.fillRect(x - 15, y - 7, 27, 12);
  g.fillRect(x - 6, y - 15, 14, 9);
  g.fillStyle(COLORS.grassLight, 1);
  g.fillRect(x - 9, y - 11, 7, 5);
  g.fillRect(x + 7, y - 4, 6, 4);
}

function addTree(
  scene: Phaser.Scene,
  x: number,
  y: number,
  solids: Phaser.Geom.Rectangle[],
  scale: number,
  variant: TreeVariant = 0,
): void {
  const formalArt = addRegisteredWorldImage(scene, "prop.tree", {
    x,
    y,
    width: Math.round(64 * scale),
    height: Math.round(88 * scale),
    depth: y + 48,
  });
  if (formalArt) {
    solids.push(new Phaser.Geom.Rectangle(x - 21 * scale, y - 3 * scale, 42 * scale, 43 * scale));
    return;
  }

  const trunk = scene.add.graphics().setDepth(y + 30);
  const canopy = scene.add.graphics().setDepth(y + 48);
  let g = trunk;
  const p = (value: number) => Math.round(value * scale);
  const mid = variant === 1 ? 0x5f9f68 : variant === 2 ? 0x57936d : COLORS.grassDark;
  const highlight = variant === 1 ? 0xa0d185 : variant === 2 ? 0x8ac47d : COLORS.grassLight;

  // Trunk/body stays behind the player; canopy/front can pass in front of it.
  g.fillStyle(COLORS.shadow, 0.46);
  g.fillRect(x - p(25), y + p(26), p(50), p(8));
  g.fillRect(x - p(16), y + p(33), p(32), p(4));
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x - p(9), y + p(4), p(18), p(34));
  g.fillStyle(0x79503e, 1);
  g.fillRect(x - p(6), y + p(7), p(12), p(29));
  g.fillStyle(0xa96d4c, 1);
  g.fillRect(x - p(3), y + p(9), p(5), p(24));

  g = canopy;
  g.fillStyle(COLORS.grassDeep, 1);
  g.fillRect(x - p(28), y - p(18), p(56), p(43));
  g.fillRect(x - p(22), y - p(30), p(44), p(18));
  g.fillRect(x - p(13), y - p(39), p(26), p(12));
  g.fillStyle(mid, 1);
  g.fillRect(x - p(21), y - p(16), p(20), p(22));
  g.fillRect(x + p(2), y - p(11), p(18), p(20));
  g.fillRect(x - p(15), y - p(28), p(24), p(14));
  g.fillStyle(highlight, 1);
  g.fillRect(x - p(11), y - p(28), p(13), p(8));
  g.fillRect(x - p(21), y - p(7), p(8), p(7));
  g.fillRect(x + p(7), y - p(5), p(8), p(7));
  g.fillStyle(COLORS.grassLight, 0.72);
  g.fillRect(x - p(3), y - p(37), p(6), p(4));
  g.fillStyle(COLORS.grassDeep, 0.9);
  g.fillRect(x + p(17), y + p(2), p(7), p(7));
  g.fillRect(x - p(27), y + p(8), p(6), p(8));

  if (variant === 1) {
    g.fillStyle(mid, 1);
    g.fillRect(x - p(31), y - p(5), p(9), p(13));
    g.fillRect(x + p(19), y - p(22), p(11), p(13));
  } else if (variant === 2) {
    g.fillStyle(mid, 1);
    g.fillRect(x - p(24), y - p(25), p(10), p(12));
    g.fillRect(x + p(15), y - p(1), p(13), p(12));
  }

  solids.push(new Phaser.Geom.Rectangle(x - p(21), y - p(3), p(42), p(43)));
}

function drawFence(
  scene: Phaser.Scene,
  x: number,
  y: number,
  length: number,
  direction: "horizontal" | "vertical",
  solids: Phaser.Geom.Rectangle[],
): void {
  const g = scene.add.graphics().setDepth(y + 25);
  const count = Math.floor(length / TILE_SIZE);
  for (let index = 0; index <= count; index += 1) {
    const px = direction === "horizontal" ? x + index * TILE_SIZE : x;
    const py = direction === "horizontal" ? y : y + index * TILE_SIZE;
    g.fillStyle(COLORS.shadow, 0.5);
    g.fillRect(px - 7, py + 18, 14, 6);
    g.fillStyle(COLORS.woodDeep, 1);
    g.fillRect(px - 5, py - 22, 10, 44);
    g.fillStyle(COLORS.woodLight, 1);
    g.fillRect(px - 2, py - 19, 5, 35);
    g.fillStyle(COLORS.woodHighlight, 0.9);
    g.fillRect(px - 1, py - 16, 2, 25);
    solids.push(new Phaser.Geom.Rectangle(px - 7, py - 22, 14, 44));
  }
  g.fillStyle(COLORS.woodDeep, 1);
  if (direction === "horizontal") {
    g.fillRect(x, y - 14, length, 7);
    g.fillRect(x, y + 7, length, 7);
    g.fillStyle(COLORS.woodLight, 0.85);
    g.fillRect(x + 3, y - 12, Math.max(1, length - 6), 3);
    g.fillRect(x + 3, y + 9, Math.max(1, length - 6), 3);
  } else {
    g.fillRect(x - 14, y, 7, length);
    g.fillRect(x + 7, y, 7, length);
    g.fillStyle(COLORS.woodLight, 0.85);
    g.fillRect(x - 12, y + 3, 3, Math.max(1, length - 6));
    g.fillRect(x + 9, y + 3, 3, Math.max(1, length - 6));
  }
}

function drawBridge(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(y + 18);
  g.fillStyle(COLORS.shadow, 0.65);
  g.fillRect(x + 7, y + 9, 220, 56);
  g.fillStyle(COLORS.woodDeep, 1);
  g.fillRect(x, y, 220, 55);
  g.fillStyle(COLORS.woodMid, 1);
  g.fillRect(x + 6, y + 5, 208, 45);
  for (let boardX = x + 8; boardX < x + 214; boardX += 24) {
    g.fillStyle(boardX % 3 === 0 ? COLORS.woodLight : COLORS.woodMid, 1);
    g.fillRect(boardX, y + 5, 17, 43);
    g.fillStyle(COLORS.woodDeep, 0.7);
    g.fillRect(boardX + 17, y + 5, 3, 43);
    g.fillStyle(COLORS.woodHighlight, 0.75);
    g.fillRect(boardX + 3, y + 8, 8, 3);
  }
  g.fillStyle(COLORS.woodDeep, 1);
  g.fillRect(x - 7, y - 9, 9, 73);
  g.fillRect(x + 218, y - 9, 9, 73);
  g.fillRect(x - 5, y - 7, 220, 7);
  g.fillRect(x - 5, y + 55, 220, 7);
  g.fillStyle(COLORS.woodLight, 1);
  g.fillRect(x, y - 5, 210, 3);
  g.fillRect(x, y + 55, 210, 3);
}

function drawReeds(scene: Phaser.Scene, x: number, y: number, direction: "vertical" | "horizontal"): void {
  const g = scene.add.graphics().setDepth(y + 9);
  g.fillStyle(COLORS.grassDeep, 1);
  if (direction === "vertical") {
    g.fillRect(x, y, 3, 28);
    g.fillRect(x + 7, y - 7, 3, 35);
    g.fillRect(x + 14, y + 4, 3, 24);
    g.fillStyle(COLORS.grassLight, 1);
    g.fillRect(x + 3, y + 2, 3, 16);
    g.fillRect(x + 10, y - 3, 3, 19);
  } else {
    g.fillRect(x, y, 28, 3);
    g.fillRect(x + 5, y + 7, 35, 3);
    g.fillRect(x + 12, y + 14, 24, 3);
    g.fillStyle(COLORS.grassLight, 1);
    g.fillRect(x + 4, y + 3, 16, 3);
    g.fillRect(x + 10, y + 10, 19, 3);
  }
}

function drawLilyPad(g: Phaser.GameObjects.Graphics, x: number, y: number, variant: number): void {
  g.fillStyle(COLORS.waterDeep, 0.8);
  g.fillRect(x - 18, y + 8, 36, 5);
  g.fillStyle(variant === 1 ? 0x4eaa73 : 0x3f966e, 1);
  g.fillRect(x - 15, y - 6, 28, 13);
  g.fillRect(x - 8, y - 10, 14, 5);
  g.fillStyle(0x79c879, 1);
  g.fillRect(x - 8, y - 7, 12, 5);
  g.fillStyle(COLORS.waterMid, 1);
  g.fillRect(x - 1, y - 5, 10, 6);
}

function drawRock(scene: Phaser.Scene, x: number, y: number, scale: number): void {
  const g = scene.add.graphics().setDepth(y + 8);
  const p = (value: number) => Math.round(value * scale);
  g.fillStyle(COLORS.shadow, 0.42);
  g.fillRect(x - p(17), y + p(9), p(34), p(8));
  g.fillStyle(COLORS.inkSoft, 1);
  g.fillRect(x - p(13), y - p(8), p(26), p(18));
  g.fillRect(x - p(7), y - p(13), p(14), p(7));
  g.fillStyle(0x87938f, 1);
  g.fillRect(x - p(9), y - p(7), p(18), p(13));
  g.fillStyle(0xb4c0b6, 1);
  g.fillRect(x - p(8), y - p(7), p(9), p(5));
}
