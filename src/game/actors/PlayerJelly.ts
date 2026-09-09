import Phaser from "phaser";
import { createPixelVisual, isPixelAssetReady, setPixelVisualAnimation } from "../assets/assetPipeline";
import { createPlayerJellyFallback } from "../assets/fallbackArt";
import {
  getPlayerJellyAnimationKey,
  PLAYER_JELLY_ASSET_ID,
  resolvePlayerJellyFacing,
  type PlayerJellyFacing,
} from "../assets/playerJellyRuntime";

export class PlayerJelly extends Phaser.GameObjects.Container {
  public readonly collisionWidth = 34;
  public readonly collisionHeight = 38;

  private readonly visual: Phaser.GameObjects.Container;
  private readonly shadow: Phaser.GameObjects.Graphics;
  private readonly usesFormalSprite: boolean;
  private readonly visualBaseY: number;
  private moving = false;
  private facing: PlayerJellyFacing = "down";
  private lastUpdate = 0;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.setSize(56, 68);
    this.setDepth(y + 34);

    this.shadow = new Phaser.GameObjects.Graphics(scene);
    this.shadow.fillStyle(0x29394c, 0.34);
    this.shadow.fillRect(-16, 28, 32, 5);
    this.shadow.fillRect(-10, 33, 20, 2);
    this.add(this.shadow);

    this.usesFormalSprite = isPixelAssetReady(scene, PLAYER_JELLY_ASSET_ID);
    this.visualBaseY = this.usesFormalSprite ? 32 : 0;
    this.visual = createPixelVisual(
      scene,
      PLAYER_JELLY_ASSET_ID,
      createPlayerJellyFallback,
      getPlayerJellyAnimationKey(this.facing, this.moving),
    );
    this.add(this.visual);

    scene.add.existing(this);
  }

  public setMoving(moving: boolean, movementX = 0, movementY = 0): void {
    const nextFacing = moving
      ? resolvePlayerJellyFacing(movementX, movementY, this.facing)
      : this.facing;
    const changed = this.moving !== moving || this.facing !== nextFacing;
    this.moving = moving;
    this.facing = nextFacing;
    if (changed) {
      this.updateFormalAnimation();
    }
  }

  public tick(time: number): void {
    const delta = this.lastUpdate === 0 ? 16 : Math.min(time - this.lastUpdate, 50);
    this.lastUpdate = time;
    const amplitude = this.usesFormalSprite ? 1 : (this.moving ? 2.5 : 4);
    const speed = this.moving ? 0.014 : 0.0035;
    const bob = this.usesFormalSprite
      ? Math.round(Math.sin(time * speed) * amplitude)
      : Math.sin(time * speed) * amplitude;
    this.visual.y = this.visualBaseY + bob;
    this.shadow.alpha = 0.34 - Math.abs(bob) * 0.02;
    this.setDepth(this.y + 34);
    if (delta < 0) {
      this.lastUpdate = time;
    }
  }

  private updateFormalAnimation(): void {
    if (!this.usesFormalSprite) {
      return;
    }
    setPixelVisualAnimation(
      this.scene,
      this.visual,
      PLAYER_JELLY_ASSET_ID,
      getPlayerJellyAnimationKey(this.facing, this.moving),
    );
  }

  public getCollisionBoxAt(x: number, y: number): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      x - this.collisionWidth / 2,
      y - this.collisionHeight / 2,
      this.collisionWidth,
      this.collisionHeight,
    );
  }

}
