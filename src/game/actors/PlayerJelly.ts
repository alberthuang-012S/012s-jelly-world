import Phaser from "phaser";

export class PlayerJelly extends Phaser.GameObjects.Container {
  public readonly collisionWidth = 34;
  public readonly collisionHeight = 38;

  private readonly visual: Phaser.GameObjects.Graphics;
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

    this.visual = new Phaser.GameObjects.Graphics(scene);
    this.drawJelly();
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

  private drawJelly(): void {
    const g = this.visual;
    g.clear();

    // Stepped dome, soft highlights and separated tentacles make the sprite read as jelly.
    g.fillStyle(0x24324a, 1);
    g.fillRect(-9, -32, 18, 4);
    g.fillRect(-16, -28, 32, 5);
    g.fillRect(-21, -23, 42, 8);
    g.fillRect(-23, -15, 46, 18);
    g.fillRect(-20, 3, 40, 7);

    g.fillStyle(0x4aaac5, 1);
    g.fillRect(-9, -28, 18, 3);
    g.fillRect(-15, -24, 30, 6);
    g.fillRect(-18, -17, 36, 18);
    g.fillRect(-15, 1, 30, 7);
    g.fillStyle(0x79d3dc, 1);
    g.fillRect(-12, -21, 24, 9);
    g.fillRect(-15, -12, 30, 12);
    g.fillStyle(0x9ae3e1, 0.9);
    g.fillRect(-8, -20, 9, 6);
    g.fillRect(-12, -12, 5, 5);
    g.fillStyle(0xc9f1dc, 0.85);
    g.fillRect(-8, -24, 6, 3);

    g.fillStyle(0x24324a, 1);
    g.fillRect(-10, -5, 5, 6);
    g.fillRect(5, -5, 5, 6);
    g.fillStyle(0xd36579, 1);
    g.fillRect(-4, 4, 8, 3);
    g.fillStyle(0x3c8fae, 1);
    g.fillRect(-17, 8, 7, 14);
    g.fillRect(-5, 8, 8, 20);
    g.fillRect(10, 8, 7, 15);
    g.fillStyle(0x67c5d3, 1);
    g.fillRect(-14, 10, 3, 10);
    g.fillRect(-2, 10, 3, 16);
    g.fillRect(12, 10, 3, 11);
    g.fillStyle(0x2f718c, 1);
    g.fillRect(-17, 19, 7, 4);
    g.fillRect(-5, 25, 8, 4);
    g.fillRect(10, 20, 7, 4);
  }
}
