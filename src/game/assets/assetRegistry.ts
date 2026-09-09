export const PIXEL_SCALE = 1;

export type PixelAssetType = "image" | "spritesheet" | "tileset";
export type PixelAssetFallback =
  | "procedural"
  | "procedural-character"
  | "procedural-building"
  | "procedural-prop"
  | "procedural-terrain";

export interface PixelAnimationDefinition {
  key: string;
  row: number;
  frames: number;
  frameRate: number;
  repeat: number;
}

export interface PixelAssetDefinition {
  id: string;
  url: string;
  type: PixelAssetType;
  fallback: PixelAssetFallback;
  /** Formal art is opt-in until the matching file has been reviewed. */
  enabled: boolean;
  frameWidth?: number;
  frameHeight?: number;
  margin?: number;
  spacing?: number;
  columns?: number;
  animations?: readonly PixelAnimationDefinition[];
  visual?: {
    width: number;
    height: number;
    originX: number;
    originY: number;
  };
}

const pixelAsset = (path: string): string => `${import.meta.env.BASE_URL}assets/pixel/${path}`;

const characterAnimations = (prefix: string): readonly PixelAnimationDefinition[] => [
  { key: `${prefix}-idle-front`, row: 0, frames: 1, frameRate: 1, repeat: -1 },
  { key: `${prefix}-walk-front`, row: 1, frames: 4, frameRate: 8, repeat: -1 },
  { key: `${prefix}-idle-back`, row: 2, frames: 1, frameRate: 1, repeat: -1 },
  { key: `${prefix}-walk-back`, row: 3, frames: 4, frameRate: 8, repeat: -1 },
  { key: `${prefix}-idle-side`, row: 4, frames: 1, frameRate: 1, repeat: -1 },
  { key: `${prefix}-walk-side`, row: 5, frames: 4, frameRate: 8, repeat: -1 },
];

const characterAsset = (id: string, path: string, prefix: string): PixelAssetDefinition => ({
  id,
  url: pixelAsset(path),
  type: "spritesheet",
  fallback: "procedural-character",
  enabled: false,
  frameWidth: 32,
  frameHeight: 48,
  columns: 4,
  animations: characterAnimations(prefix),
  visual: { width: 32, height: 48, originX: 0.5, originY: 0.75 },
});

const playerJellyAnimations = (prefix: string): readonly PixelAnimationDefinition[] => [
  { key: `${prefix}-idle-down`, row: 0, frames: 1, frameRate: 1, repeat: -1 },
  { key: `${prefix}-walk-down`, row: 0, frames: 4, frameRate: 8, repeat: -1 },
  { key: `${prefix}-idle-left`, row: 1, frames: 1, frameRate: 1, repeat: -1 },
  { key: `${prefix}-walk-left`, row: 1, frames: 4, frameRate: 8, repeat: -1 },
  { key: `${prefix}-idle-right`, row: 2, frames: 1, frameRate: 1, repeat: -1 },
  { key: `${prefix}-walk-right`, row: 2, frames: 4, frameRate: 8, repeat: -1 },
  { key: `${prefix}-idle-up`, row: 3, frames: 1, frameRate: 1, repeat: -1 },
  { key: `${prefix}-walk-up`, row: 3, frames: 4, frameRate: 8, repeat: -1 },
];

export const PIXEL_ASSETS = {
  "terrain.grass": {
    id: "terrain.grass",
    url: pixelAsset("tiles/grass/grass.png"),
    type: "tileset",
    fallback: "procedural-terrain",
    enabled: false,
    frameWidth: 32,
    frameHeight: 32,
  },
  "terrain.road": {
    id: "terrain.road",
    url: pixelAsset("tiles/road/road.png"),
    type: "tileset",
    fallback: "procedural-terrain",
    enabled: false,
    frameWidth: 32,
    frameHeight: 32,
  },
  "terrain.water": {
    id: "terrain.water",
    url: pixelAsset("tiles/water/water.png"),
    type: "tileset",
    fallback: "procedural-terrain",
    enabled: false,
    frameWidth: 32,
    frameHeight: 32,
  },
  "terrain.main": {
    id: "terrain.main",
    url: pixelAsset("tiles/terrain/terrain.png"),
    type: "tileset",
    fallback: "procedural-terrain",
    enabled: true,
    frameWidth: 16,
    frameHeight: 16,
    margin: 0,
    spacing: 0,
    columns: 16,
  },
  "terrain.edge": {
    id: "terrain.edge",
    url: pixelAsset("tiles/terrain/terrain.png"),
    type: "tileset",
    fallback: "procedural-terrain",
    enabled: false,
    frameWidth: 16,
    frameHeight: 16,
    margin: 0,
    spacing: 0,
    columns: 16,
  },
  "character.player.jelly": {
    id: "character.player.jelly",
    url: pixelAsset("characters/player/player-jelly.png"),
    type: "spritesheet",
    fallback: "procedural-character",
    enabled: false,
    frameWidth: 24,
    frameHeight: 32,
    margin: 0,
    spacing: 0,
    columns: 4,
    animations: playerJellyAnimations("player-jelly"),
    visual: { width: 48, height: 64, originX: 0.5, originY: 1 },
  },
  "building.lab": {
    id: "building.lab",
    url: pixelAsset("buildings/lab/lab.png"),
    type: "image",
    fallback: "procedural-building",
    enabled: false,
    visual: { width: 400, height: 275, originX: 0.5, originY: 0.5 },
  },
  "building.live": {
    id: "building.live",
    url: pixelAsset("buildings/live/live.png"),
    type: "image",
    fallback: "procedural-building",
    enabled: false,
    visual: { width: 390, height: 275, originX: 0.5, originY: 0.5 },
  },
  "building.info": {
    id: "building.info",
    url: pixelAsset("buildings/info/info.png"),
    type: "image",
    fallback: "procedural-building",
    enabled: false,
    visual: { width: 320, height: 215, originX: 0.5, originY: 0.5 },
  },
  "building.arcade": {
    id: "building.arcade",
    url: pixelAsset("buildings/arcade/arcade.png"),
    type: "image",
    fallback: "procedural-building",
    enabled: false,
    visual: { width: 970, height: 246, originX: 0.5, originY: 0.5 },
  },
  "character.player": characterAsset("character.player", "characters/player/player.png", "player"),
  "character.achang": characterAsset("character.achang", "characters/achang/achang.png", "achang"),
  "character.cindy": characterAsset("character.cindy", "characters/cindy/cindy.png", "cindy"),
  "character.bot": characterAsset("character.bot", "characters/bot/bot.png", "bot"),
  "prop.tree": {
    id: "prop.tree",
    url: pixelAsset("props/trees/tree.png"),
    type: "image",
    fallback: "procedural-prop",
    enabled: false,
    visual: { width: 64, height: 88, originX: 0.5, originY: 0.8 },
  },
  "prop.tree.canopy": {
    id: "prop.tree.canopy",
    url: pixelAsset("props/trees/canopy.png"),
    type: "image",
    fallback: "procedural-prop",
    enabled: false,
    visual: { width: 64, height: 64, originX: 0.5, originY: 1 },
  },
  "prop.tree.trunk": {
    id: "prop.tree.trunk",
    url: pixelAsset("props/trees/trunk.png"),
    type: "image",
    fallback: "procedural-prop",
    enabled: false,
    visual: { width: 28, height: 48, originX: 0.5, originY: 1 },
  },
  "prop.flower": {
    id: "prop.flower",
    url: pixelAsset("props/flowers/flower.png"),
    type: "image",
    fallback: "procedural-prop",
    enabled: false,
    visual: { width: 24, height: 24, originX: 0.5, originY: 0.75 },
  },
  "prop.bench": {
    id: "prop.bench",
    url: pixelAsset("props/benches/bench.png"),
    type: "image",
    fallback: "procedural-prop",
    enabled: false,
    visual: { width: 78, height: 46, originX: 0.5, originY: 0.63 },
  },
  "prop.lamp": {
    id: "prop.lamp",
    url: pixelAsset("props/lamps/lamp.png"),
    type: "image",
    fallback: "procedural-prop",
    enabled: false,
    visual: { width: 28, height: 58, originX: 0.5, originY: 0.72 },
  },
  "prop.fence": {
    id: "prop.fence",
    url: pixelAsset("props/fences/fence.png"),
    type: "image",
    fallback: "procedural-prop",
    enabled: false,
    visual: { width: 32, height: 44, originX: 0.5, originY: 0.5 },
  },
  "prop.sign": {
    id: "prop.sign",
    url: pixelAsset("props/signs/sign.png"),
    type: "image",
    fallback: "procedural-prop",
    enabled: false,
    visual: { width: 80, height: 48, originX: 0.5, originY: 0.7 },
  },
  "arcade.machine": {
    id: "arcade.machine",
    url: pixelAsset("arcade/machine.png"),
    type: "image",
    fallback: "procedural",
    enabled: false,
    visual: { width: 84, height: 96, originX: 0.5, originY: 0.55 },
  },
  "event.board": {
    id: "event.board",
    url: pixelAsset("event/board.png"),
    type: "image",
    fallback: "procedural-prop",
    enabled: false,
    visual: { width: 132, height: 100, originX: 0.5, originY: 0.76 },
  },
} as const satisfies Record<string, PixelAssetDefinition>;

export type PixelAssetId = keyof typeof PIXEL_ASSETS;
export const PIXEL_ASSET_LIST = Object.values(PIXEL_ASSETS);

export function getPixelAsset(id: PixelAssetId): PixelAssetDefinition {
  return PIXEL_ASSETS[id];
}

export function getCharacterAssetId(variant: "player" | "manager" | "streamer" | "bot"): PixelAssetId {
  if (variant === "manager") {
    return "character.achang";
  }
  if (variant === "streamer") {
    return "character.cindy";
  }
  if (variant === "bot") {
    return "character.bot";
  }
  return "character.player";
}
