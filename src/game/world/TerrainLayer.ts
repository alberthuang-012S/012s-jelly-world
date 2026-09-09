import Phaser from "phaser";
import { addRegisteredWorldImage } from "./WorldAssetBindings";
import { isPixelAssetReady } from "../assets/assetPipeline";

export interface TerrainLayer {
  root: Phaser.GameObjects.Container;
  detail: Phaser.GameObjects.Graphics;
}

/**
 * Provides one seam for the future grass tileset. The road and shoreline
 * overlays remain independent, so replacing the base tile never changes
 * collision or world coordinates.
 */
export function createTerrainLayer(
  scene: Phaser.Scene,
  width: number,
  height: number,
  fallback: (graphics: Phaser.GameObjects.Graphics) => void,
): TerrainLayer {
  const root = new Phaser.GameObjects.Container(scene, 0, 0).setDepth(0);
  scene.add.existing(root);

  if (isPixelAssetReady(scene, "terrain.grass")) {
    const base = addRegisteredWorldImage(scene, "terrain.grass", {
      x: 0,
      y: 0,
      width,
      height,
      depth: 0,
      originX: 0,
      originY: 0,
    });
    if (base) {
      root.add(base);
    }
  }

  const detail = new Phaser.GameObjects.Graphics(scene);
  detail.setDepth(1);
  root.add(detail);
  if (!isPixelAssetReady(scene, "terrain.grass")) {
    fallback(detail);
  }
  return { root, detail };
}
