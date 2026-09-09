import type { PixelColor } from "./terrainPalette.ts";

function rgba(hex: string): PixelColor {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid player jelly palette colour: ${hex}`);
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
    255,
  ];
}

/**
 * The master Player Jelly palette is intentionally compact and warm. Deep
 * blue-grey carries the outline and eyes so the character never relies on
 * pure black or the old mechanical aqua fallback colours.
 */
export const PLAYER_JELLY_PALETTE = {
  transparent: [0, 0, 0, 0] as PixelColor,

  outline: rgba("#34465f"),
  outlineShadow: rgba("#26384f"),
  bodyShadow: rgba("#e2dfcf"),
  bodyBase: rgba("#fff6de"),
  bodyHighlight: rgba("#fffdf0"),

  crownShadow: rgba("#d99e3e"),
  crownBase: rgba("#f2c65e"),
  crownHighlight: rgba("#ffe69a"),

  eye: rgba("#30445e"),
} as const;

export type PlayerJellyPaletteName = keyof typeof PLAYER_JELLY_PALETTE;
