import Phaser from "phaser";
import { getPixelAsset, type PixelAssetId } from "../assets/assetRegistry";
import { isPixelAssetReady } from "../assets/assetPipeline";

export interface WorldImageOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  depth: number;
  originX?: number;
  originY?: number;
}

/**
 * Adds formal world art only when its registry entry is enabled and loaded.
 * Collision rectangles stay with world data and never depend on alpha.
 */
export function addRegisteredWorldImage(
  scene: Phaser.Scene,
  id: PixelAssetId,
  options: WorldImageOptions,
): Phaser.GameObjects.Image | undefined {
  if (!isPixelAssetReady(scene, id)) {
    return undefined;
  }

  const asset = getPixelAsset(id);
  const image = scene.add.image(options.x, options.y, asset.id);
  image.setOrigin(options.originX ?? asset.visual?.originX ?? 0.5, options.originY ?? asset.visual?.originY ?? 0.5);
  if (options.width && options.height) {
    image.setDisplaySize(options.width, options.height);
  } else if (asset.visual) {
    image.setDisplaySize(asset.visual.width, asset.visual.height);
  }
  image.setDepth(options.depth);
  return image;
}
