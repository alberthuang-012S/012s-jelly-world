import Phaser from "phaser";
import {
  getPixelAsset,
  PIXEL_ASSET_LIST,
  type PixelAssetDefinition,
  type PixelAssetId,
} from "./assetRegistry";

type PixelFallbackFactory = (scene: Phaser.Scene) => Phaser.GameObjects.GameObject;

const failedAssets = new WeakMap<Phaser.Scene, Set<string>>();

/**
 * The only place where formal Pixel Art files enter Phaser's loader.
 * Missing files are isolated to the asset and never become a scene failure.
 */
export function preloadPixelAssets(scene: Phaser.Scene): void {
  const failed = new Set<string>();
  failedAssets.set(scene, failed);

  scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: { key: string }) => {
    const asset = PIXEL_ASSET_LIST.find((candidate) => candidate.id === file.key);
    if (!asset || failed.has(asset.id)) {
      return;
    }
    failed.add(asset.id);
    console.warn(`[PixelAsset] ${asset.id} could not be loaded; using ${asset.fallback} fallback.`);
  });

  for (const asset of PIXEL_ASSET_LIST) {
    if (!asset.enabled || scene.textures.exists(asset.id)) {
      continue;
    }
    queuePixelAsset(scene, asset);
  }
}

export function registerPixelAnimations(scene: Phaser.Scene): void {
  for (const asset of PIXEL_ASSET_LIST) {
    if (!asset.enabled || asset.type !== "spritesheet" || !asset.animations || !scene.textures.exists(asset.id)) {
      continue;
    }

    const columns = asset.columns ?? 1;
    for (const animation of asset.animations) {
      if (scene.anims.exists(animation.key)) {
        continue;
      }
      const start = animation.row * columns;
      scene.anims.create({
        key: animation.key,
        frames: scene.anims.generateFrameNumbers(asset.id, {
          start,
          end: start + animation.frames - 1,
        }),
        frameRate: animation.frameRate,
        repeat: animation.repeat,
      });
    }
  }
}

export function isPixelAssetReady(scene: Phaser.Scene, id: PixelAssetId): boolean {
  const asset = getPixelAsset(id);
  return asset.enabled && scene.textures.exists(asset.id) && !failedAssets.get(scene)?.has(asset.id);
}

/**
 * Returns a stable Container so actor logic can animate one visual root while
 * the formal image and the current procedural art share the same interface.
 */
export function createPixelVisual(
  scene: Phaser.Scene,
  id: PixelAssetId,
  fallback: PixelFallbackFactory,
  animationKey?: string,
): Phaser.GameObjects.Container {
  const visual = new Phaser.GameObjects.Container(scene, 0, 0);
  const asset = getPixelAsset(id);

  if (isPixelAssetReady(scene, id)) {
    const sprite = asset.type === "spritesheet"
      ? new Phaser.GameObjects.Sprite(scene, 0, 0, asset.id, 0)
      : new Phaser.GameObjects.Image(scene, 0, 0, asset.id);
    if (asset.visual) {
      sprite.setOrigin(asset.visual.originX, asset.visual.originY);
      sprite.setDisplaySize(asset.visual.width, asset.visual.height);
    }
    if (animationKey && sprite instanceof Phaser.GameObjects.Sprite && scene.anims.exists(animationKey)) {
      sprite.play(animationKey);
    }
    visual.add(sprite);
  } else {
    visual.add(fallback(scene));
  }

  return visual;
}

function queuePixelAsset(scene: Phaser.Scene, asset: PixelAssetDefinition): void {
  if (asset.type === "spritesheet") {
    if (!asset.frameWidth || !asset.frameHeight) {
      console.warn(`[PixelAsset] ${asset.id} has no spritesheet frame size; using fallback.`);
      return;
    }
    scene.load.spritesheet(asset.id, asset.url, {
      frameWidth: asset.frameWidth,
      frameHeight: asset.frameHeight,
    });
    return;
  }
  scene.load.image(asset.id, asset.url);
}
