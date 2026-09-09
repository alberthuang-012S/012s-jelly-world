export const TERRAIN_TILE_SIZE = 16;
export const TERRAIN_GRID_COLUMNS = 16;
export const TERRAIN_GRID_ROWS = 16;

export type TerrainTileCategory = "grass" | "road" | "water" | "bridge";

export interface TerrainTileDefinition {
  readonly name: string;
  readonly index: number;
  readonly column: number;
  readonly row: number;
  readonly category: TerrainTileCategory;
}

function define(
  name: string,
  row: number,
  column: number,
  category: TerrainTileCategory,
): TerrainTileDefinition {
  return {
    name,
    index: row * TERRAIN_GRID_COLUMNS + column,
    column,
    row,
    category,
  };
}

/**
 * Stable terrain IDs. This file is intentionally data-only so runtime systems
 * can adopt the IDs in a later integration phase without magic numbers.
 */
export const TERRAIN_TILE_MAP = {
  GRASS_BASE: define("GRASS_BASE", 0, 0, "grass"),
  GRASS_VARIANT_01: define("GRASS_VARIANT_01", 0, 1, "grass"),
  GRASS_VARIANT_02: define("GRASS_VARIANT_02", 0, 2, "grass"),
  GRASS_VARIANT_03: define("GRASS_VARIANT_03", 0, 3, "grass"),
  GRASS_WEED_01: define("GRASS_WEED_01", 0, 4, "grass"),
  GRASS_WEED_02: define("GRASS_WEED_02", 0, 5, "grass"),
  FLOWER_WHITE: define("FLOWER_WHITE", 0, 6, "grass"),
  FLOWER_PINK: define("FLOWER_PINK", 0, 7, "grass"),
  FLOWER_YELLOW: define("FLOWER_YELLOW", 0, 8, "grass"),
  FLOWER_PURPLE: define("FLOWER_PURPLE", 0, 9, "grass"),
  SHRUB_SMALL: define("SHRUB_SMALL", 0, 10, "grass"),
  SHRUB_BLOOM: define("SHRUB_BLOOM", 0, 11, "grass"),
  GRASS_PEBBLE_01: define("GRASS_PEBBLE_01", 0, 12, "grass"),
  GRASS_PEBBLE_02: define("GRASS_PEBBLE_02", 0, 13, "grass"),
  FLOWER_MIX: define("FLOWER_MIX", 0, 14, "grass"),
  GRASS_SPECKLE: define("GRASS_SPECKLE", 0, 15, "grass"),

  GRASS_PATCH_01: define("GRASS_PATCH_01", 1, 0, "grass"),
  GRASS_PATCH_02: define("GRASS_PATCH_02", 1, 1, "grass"),
  GRASS_PATCH_03: define("GRASS_PATCH_03", 1, 2, "grass"),
  GRASS_EDGE_TOP: define("GRASS_EDGE_TOP", 1, 3, "grass"),
  GRASS_EDGE_BOTTOM: define("GRASS_EDGE_BOTTOM", 1, 4, "grass"),
  GRASS_EDGE_LEFT: define("GRASS_EDGE_LEFT", 1, 5, "grass"),
  GRASS_EDGE_RIGHT: define("GRASS_EDGE_RIGHT", 1, 6, "grass"),
  FLOWER_CLUSTER_WHITE: define("FLOWER_CLUSTER_WHITE", 1, 7, "grass"),
  FLOWER_CLUSTER_PINK: define("FLOWER_CLUSTER_PINK", 1, 8, "grass"),
  FLOWER_CLUSTER_YELLOW: define("FLOWER_CLUSTER_YELLOW", 1, 9, "grass"),
  FLOWER_CLUSTER_PURPLE: define("FLOWER_CLUSTER_PURPLE", 1, 10, "grass"),
  SHRUB_ROUND: define("SHRUB_ROUND", 1, 11, "grass"),
  SHRUB_ROUND_DARK: define("SHRUB_ROUND_DARK", 1, 12, "grass"),
  GRASS_ROCK_DETAIL: define("GRASS_ROCK_DETAIL", 1, 13, "grass"),
  WEED_CLUSTER: define("WEED_CLUSTER", 1, 14, "grass"),
  FLOWER_DAISY: define("FLOWER_DAISY", 1, 15, "grass"),

  FLOWER_ORANGE: define("FLOWER_ORANGE", 2, 0, "grass"),
  FLOWER_BLUE: define("FLOWER_BLUE", 2, 1, "grass"),
  FLOWER_TRIO: define("FLOWER_TRIO", 2, 2, "grass"),
  SHRUB_TALL: define("SHRUB_TALL", 2, 3, "grass"),
  SHRUB_TALL_FLOWER: define("SHRUB_TALL_FLOWER", 2, 4, "grass"),
  GRASS_SPARSE: define("GRASS_SPARSE", 2, 5, "grass"),

  ROAD_CENTER: define("ROAD_CENTER", 3, 0, "road"),
  ROAD_VARIANT: define("ROAD_VARIANT", 3, 1, "road"),
  ROAD_HORIZONTAL: define("ROAD_HORIZONTAL", 3, 2, "road"),
  ROAD_VERTICAL: define("ROAD_VERTICAL", 3, 3, "road"),
  ROAD_EDGE_TOP: define("ROAD_EDGE_TOP", 3, 4, "road"),
  ROAD_EDGE_BOTTOM: define("ROAD_EDGE_BOTTOM", 3, 5, "road"),
  ROAD_EDGE_LEFT: define("ROAD_EDGE_LEFT", 3, 6, "road"),
  ROAD_EDGE_RIGHT: define("ROAD_EDGE_RIGHT", 3, 7, "road"),
  ROAD_OUTER_TL: define("ROAD_OUTER_TL", 3, 8, "road"),
  ROAD_OUTER_TR: define("ROAD_OUTER_TR", 3, 9, "road"),
  ROAD_OUTER_BL: define("ROAD_OUTER_BL", 3, 10, "road"),
  ROAD_OUTER_BR: define("ROAD_OUTER_BR", 3, 11, "road"),
  ROAD_INNER_TL: define("ROAD_INNER_TL", 3, 12, "road"),
  ROAD_INNER_TR: define("ROAD_INNER_TR", 3, 13, "road"),
  ROAD_INNER_BL: define("ROAD_INNER_BL", 3, 14, "road"),
  ROAD_INNER_BR: define("ROAD_INNER_BR", 3, 15, "road"),

  ROAD_T_TOP: define("ROAD_T_TOP", 4, 0, "road"),
  ROAD_T_BOTTOM: define("ROAD_T_BOTTOM", 4, 1, "road"),
  ROAD_T_LEFT: define("ROAD_T_LEFT", 4, 2, "road"),
  ROAD_T_RIGHT: define("ROAD_T_RIGHT", 4, 3, "road"),
  ROAD_CROSS: define("ROAD_CROSS", 4, 4, "road"),
  ROAD_STONE_VARIANT: define("ROAD_STONE_VARIANT", 4, 5, "road"),
  ROAD_SOFT_EDGE_TOP: define("ROAD_SOFT_EDGE_TOP", 4, 6, "road"),
  ROAD_SOFT_EDGE_BOTTOM: define("ROAD_SOFT_EDGE_BOTTOM", 4, 7, "road"),
  ROAD_SOFT_EDGE_LEFT: define("ROAD_SOFT_EDGE_LEFT", 4, 8, "road"),
  ROAD_SOFT_EDGE_RIGHT: define("ROAD_SOFT_EDGE_RIGHT", 4, 9, "road"),

  WATER_BASE: define("WATER_BASE", 7, 0, "water"),
  WATER_VARIANT_01: define("WATER_VARIANT_01", 7, 1, "water"),
  WATER_VARIANT_02: define("WATER_VARIANT_02", 7, 2, "water"),
  WATER_RIPPLE_HORIZONTAL: define("WATER_RIPPLE_HORIZONTAL", 7, 3, "water"),
  WATER_RIPPLE_VERTICAL: define("WATER_RIPPLE_VERTICAL", 7, 4, "water"),
  SHORE_TOP: define("SHORE_TOP", 7, 5, "water"),
  SHORE_BOTTOM: define("SHORE_BOTTOM", 7, 6, "water"),
  SHORE_LEFT: define("SHORE_LEFT", 7, 7, "water"),
  SHORE_RIGHT: define("SHORE_RIGHT", 7, 8, "water"),
  SHORE_OUTER_TL: define("SHORE_OUTER_TL", 7, 9, "water"),
  SHORE_OUTER_TR: define("SHORE_OUTER_TR", 7, 10, "water"),
  SHORE_OUTER_BL: define("SHORE_OUTER_BL", 7, 11, "water"),
  SHORE_OUTER_BR: define("SHORE_OUTER_BR", 7, 12, "water"),
  SHORE_INNER_TL: define("SHORE_INNER_TL", 7, 13, "water"),
  SHORE_INNER_TR: define("SHORE_INNER_TR", 7, 14, "water"),
  SHORE_INNER_BL: define("SHORE_INNER_BL", 7, 15, "water"),

  SHORE_INNER_BR: define("SHORE_INNER_BR", 8, 0, "water"),
  WATER_REED: define("WATER_REED", 8, 1, "water"),
  WATER_REED_MIRROR: define("WATER_REED_MIRROR", 8, 2, "water"),
  WATER_HIGHLIGHT: define("WATER_HIGHLIGHT", 8, 3, "water"),
  SHORE_TOP_STONE: define("SHORE_TOP_STONE", 8, 4, "water"),
  SHORE_BOTTOM_STONE: define("SHORE_BOTTOM_STONE", 8, 5, "water"),
  SHORE_LEFT_STONE: define("SHORE_LEFT_STONE", 8, 6, "water"),
  SHORE_RIGHT_STONE: define("SHORE_RIGHT_STONE", 8, 7, "water"),
  WATER_VARIANT_03: define("WATER_VARIANT_03", 8, 8, "water"),

  BRIDGE_HORIZONTAL_START: define("BRIDGE_HORIZONTAL_START", 11, 0, "bridge"),
  BRIDGE_HORIZONTAL_MIDDLE: define("BRIDGE_HORIZONTAL_MIDDLE", 11, 1, "bridge"),
  BRIDGE_HORIZONTAL_END: define("BRIDGE_HORIZONTAL_END", 11, 2, "bridge"),
  BRIDGE_VERTICAL_START: define("BRIDGE_VERTICAL_START", 11, 3, "bridge"),
  BRIDGE_VERTICAL_MIDDLE: define("BRIDGE_VERTICAL_MIDDLE", 11, 4, "bridge"),
  BRIDGE_VERTICAL_END: define("BRIDGE_VERTICAL_END", 11, 5, "bridge"),
  BRIDGE_HORIZONTAL_RAIL_TOP: define("BRIDGE_HORIZONTAL_RAIL_TOP", 11, 6, "bridge"),
  BRIDGE_HORIZONTAL_RAIL_BOTTOM: define("BRIDGE_HORIZONTAL_RAIL_BOTTOM", 11, 7, "bridge"),
  BRIDGE_VERTICAL_RAIL_LEFT: define("BRIDGE_VERTICAL_RAIL_LEFT", 11, 8, "bridge"),
  BRIDGE_VERTICAL_RAIL_RIGHT: define("BRIDGE_VERTICAL_RAIL_RIGHT", 11, 9, "bridge"),
  BRIDGE_POST: define("BRIDGE_POST", 11, 10, "bridge"),
  BRIDGE_POST_CAP: define("BRIDGE_POST_CAP", 11, 11, "bridge"),
  BRIDGE_PLANK_HORIZONTAL: define("BRIDGE_PLANK_HORIZONTAL", 12, 0, "bridge"),
  BRIDGE_PLANK_VERTICAL: define("BRIDGE_PLANK_VERTICAL", 12, 1, "bridge"),
  BRIDGE_SHADOW: define("BRIDGE_SHADOW", 12, 2, "bridge"),
  BRIDGE_RAIL_DETAIL: define("BRIDGE_RAIL_DETAIL", 12, 3, "bridge"),
} as const;

export type TerrainTileId = keyof typeof TERRAIN_TILE_MAP;

export const TERRAIN_TILE_DEFINITIONS: readonly TerrainTileDefinition[] = Object.values(TERRAIN_TILE_MAP);

export function terrainTileIndex(tileId: TerrainTileId): number {
  return TERRAIN_TILE_MAP[tileId].index;
}
