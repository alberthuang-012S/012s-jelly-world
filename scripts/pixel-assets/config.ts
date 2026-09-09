export type AssetValidationKind = "terrain" | "character" | "building" | "prop";

export interface AssetValidationSpec {
  kind: AssetValidationKind;
  expectedWidth?: number;
  expectedHeight?: number;
  frameWidth?: number;
  frameHeight?: number;
  columns?: number;
  rows?: number;
  margin: number;
  spacing: number;
}

export interface TerrainManifest {
  type: "terrain";
  tileWidth: number;
  tileHeight: number;
  columns: number;
  rows: number;
  margin: number;
  spacing: number;
  expectedWidth: number;
  expectedHeight: number;
}

export const DEFAULT_VALIDATION_SPECS: Record<AssetValidationKind, AssetValidationSpec> = {
  terrain: {
    kind: "terrain",
    expectedWidth: 256,
    expectedHeight: 256,
    frameWidth: 16,
    frameHeight: 16,
    columns: 16,
    rows: 16,
    margin: 0,
    spacing: 0,
  },
  character: {
    kind: "character",
    frameWidth: 24,
    frameHeight: 32,
    margin: 0,
    spacing: 0,
  },
  building: {
    kind: "building",
    margin: 0,
    spacing: 0,
  },
  prop: {
    kind: "prop",
    margin: 0,
    spacing: 0,
  },
};

export function validationSpecFromTerrainManifest(manifest: TerrainManifest): AssetValidationSpec {
  return {
    kind: "terrain",
    expectedWidth: manifest.expectedWidth,
    expectedHeight: manifest.expectedHeight,
    frameWidth: manifest.tileWidth,
    frameHeight: manifest.tileHeight,
    columns: manifest.columns,
    rows: manifest.rows,
    margin: manifest.margin,
    spacing: manifest.spacing,
  };
}
