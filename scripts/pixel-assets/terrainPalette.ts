export type PixelColor = readonly [number, number, number, number];

function rgba(hex: string): PixelColor {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid terrain palette colour: ${hex}`);
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
    255,
  ];
}

/**
 * The formal terrain sheet uses a deliberately small, opaque palette.
 * Transparent is the only non-255 alpha value used by the authoring script.
 */
export const TERRAIN_PALETTE = {
  transparent: [0, 0, 0, 0] as PixelColor,

  grassDeep: rgba("#277642"),
  grassShadow: rgba("#369b4b"),
  grassBase: rgba("#5cbc55"),
  grassLight: rgba("#83d55c"),
  grassHighlight: rgba("#b5e873"),
  grassDetail: rgba("#1f6a43"),

  soilShadow: rgba("#a7774a"),
  soilEdge: rgba("#bd8b55"),
  roadBase: rgba("#dfb878"),
  roadLight: rgba("#f0cf91"),
  roadHighlight: rgba("#f6dda7"),
  stoneShadow: rgba("#5d6c71"),
  stone: rgba("#7a8b8d"),
  stoneLight: rgba("#aeb8b0"),

  waterDeep: rgba("#176caa"),
  waterShadow: rgba("#1f83cf"),
  waterBase: rgba("#2c9fe5"),
  waterLight: rgba("#58c9ef"),
  waterReflection: rgba("#a5e6f0"),

  woodOutline: rgba("#613a29"),
  woodShadow: rgba("#81502f"),
  woodBase: rgba("#a96635"),
  woodLight: rgba("#cf8742"),
  woodHighlight: rgba("#edb060"),

  flowerWhite: rgba("#f7f3d5"),
  flowerPink: rgba("#f16c8a"),
  flowerPinkLight: rgba("#ff9eaa"),
  flowerYellow: rgba("#f0bf3d"),
  flowerOrange: rgba("#f18e32"),
  flowerPurple: rgba("#8e70dc"),
  flowerPurpleLight: rgba("#b49bea"),
  flowerBlue: rgba("#70b9e8"),
  flowerCenter: rgba("#f4d257"),
} as const;

export type TerrainPaletteName = keyof typeof TERRAIN_PALETTE;
