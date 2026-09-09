import Phaser from "phaser";
import { createPixelVisual } from "../assets/assetPipeline";
import { createPlayerJellyFallback } from "../assets/fallbackArt";

export class PlayerJelly extends Phaser.GameObjects.Container {
  public readonly collisionWidth = 34;
  public readonly collisionHeight = 38;

  private readonly visual: Phaser.GameObjects.Container;
  private readonly shadow: Phaser.GameObjects.Graphics;
  private moving = false;
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

    this.visual = createPixelVisual(scene, "character.player", createPlayerJellyFallback);
    this.add(this.visual);

    scene.add.existing(this);
  }

  public setMoving(moving: boolean): void {
    this.moving = moving;
  }

  public tick(time: number): void {
    const delta = this.lastUpdate === 0 ? 16 : Math.min(time - this.lastUpdate, 50);
    this.lastUpdate = time;
    const amplitude = this.moving ? 2.5 : 4;
    const speed = this.moving ? 0.014 : 0.0035;
    const bob = Math.sin(time * speed) * amplitude;
    this.visual.y = bob;
    this.shadow.alpha = 0.34 - Math.abs(bob) * 0.02;
    this.setDepth(this.y + 34);
    if (delta < 0) {
      this.lastUpdate = time;
    }
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
