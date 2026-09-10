import Phaser from "phaser";
import { resolvePlayerJellyFacing, type PlayerJellyFacing } from "../assets/playerJellyRuntime";

export class PlayerJelly extends Phaser.GameObjects.Container {
  public readonly collisionWidth = 24;
  public readonly collisionHeight = 18;
  private readonly visual: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private moving = false;
  private phase = 0;
  private previousTime: number | undefined;
  private floatSpeed = 0.003;
  private floatHeight = 1.5;
  private facing: PlayerJellyFacing = "down";
  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.shadow = new Phaser.GameObjects.Ellipse(scene, 0, 5, 36, 10, 0x315477, 0.22);
    this.visual = new Phaser.GameObjects.Image(scene, 0, -24, "jelly-preferred", 0);
    this.add([this.shadow, this.visual]);
    this.setSize(48, 56).setDepth(y + 10);
    scene.add.existing(this);
  }
  public setMoving(moving: boolean, x = 0, y = 0): void {
    this.moving = moving;
    const facing = resolvePlayerJellyFacing(x, y, this.facing);
    if (facing !== this.facing) {
      this.facing = facing;
      const frame = { down: 0, left: 1, right: 2, up: 3 }[facing];
      this.visual.setFrame(frame);
    }
  }
  public tick(time: number): void {
    const delta = this.previousTime === undefined ? 0 : Phaser.Math.Clamp(time - this.previousTime, 0, 50);
    this.previousTime = time;
    const blend = 1 - Math.exp(-delta / 150);
    this.floatSpeed += ((this.moving ? 0.008 : 0.003) - this.floatSpeed) * blend;
    this.floatHeight += ((this.moving ? 2 : 1.5) - this.floatHeight) * blend;
    this.phase = (this.phase + delta * this.floatSpeed) % (Math.PI * 2);
    const bob = Math.sin(this.phase) * this.floatHeight;
    this.visual.y = -24 + Math.round(bob);
    this.visual.angle = 0;
    this.shadow.setScale(1 - Math.max(0, -bob) * 0.025, 1);
    this.setDepth(this.y + 10);
  }
  public getCollisionBoxAt(x: number, y: number): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(x - 12, y - 9, 24, 18);
  }
}
