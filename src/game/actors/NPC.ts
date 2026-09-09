import Phaser from "phaser";
import type { CharacterId } from "../../data/dialogues";

export type NPCVariant = "manager" | "streamer" | "bot";

export interface NPCConfig {
  id: CharacterId;
  name: string;
  role: string;
  x: number;
  y: number;
  variant: NPCVariant;
  accent: number;
}

export class NPC extends Phaser.GameObjects.Container {
  public readonly id: CharacterId;
  public readonly name: string;
  public readonly role: string;
  public readonly collisionBox: Phaser.Geom.Rectangle;

  public constructor(scene: Phaser.Scene, config: NPCConfig) {
    super(scene, config.x, config.y);
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.collisionBox = new Phaser.Geom.Rectangle(config.x - 21, config.y - 20, 42, 42);
    this.setSize(60, 84);
    this.setDepth(config.y + 34);

    const art = new Phaser.GameObjects.Graphics(scene);
    if (config.variant === "manager") {
      this.drawManager(art);
    } else if (config.variant === "streamer") {
      this.drawStreamer(art);
    } else {
      this.drawBot(art);
    }
    this.add(art);

    scene.add.existing(this);
  }

  public getCollisionRect(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.collisionBox.x,
      this.collisionBox.y,
      this.collisionBox.width,
      this.collisionBox.height,
    );
  }

  private drawManager(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x29394c, 0.42);
    g.fillRect(-21, 30, 42, 6);
    g.fillRect(-13, 36, 26, 3);
    g.fillStyle(0x24324a, 1);
    g.fillRect(-20, -2, 40, 34);
    g.fillRect(-24, 4, 8, 20);
    g.fillRect(16, 4, 8, 20);
    g.fillStyle(0x33465e, 1);
    g.fillRect(-16, 2, 32, 26);
    g.fillStyle(0x4a5e78, 1);
    g.fillRect(-14, 4, 5, 20);
    g.fillStyle(0xfff3db, 1);
    g.fillRect(-10, 0, 20, 23);
    g.fillStyle(0xd75b7a, 1);
    g.fillRect(-3, 1, 6, 15);
    g.fillStyle(0xffd16e, 1);
    g.fillRect(-1, 3, 3, 5);
    g.fillStyle(0x24324a, 1);
    g.fillRect(-16, 28, 12, 8);
    g.fillRect(4, 28, 12, 8);
    g.fillStyle(0xf0c49c, 1);
    g.fillRect(-15, -31, 30, 26);
    g.fillRect(-11, -35, 22, 5);
    g.fillStyle(0x18243d, 1);
    g.fillRect(-17, -39, 34, 9);
    g.fillRect(-21, -33, 7, 10);
    g.fillRect(14, -35, 7, 9);
    g.fillStyle(0x3c4960, 1);
    g.fillRect(-10, -34, 12, 3);
    g.fillStyle(0x2d3851, 1);
    g.fillRect(-10, -20, 4, 5);
    g.fillRect(6, -20, 4, 5);
    g.fillStyle(0x9d4b55, 1);
    g.fillRect(-4, -10, 8, 3);
  }

  private drawStreamer(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x29394c, 0.42);
    g.fillRect(-22, 31, 44, 6);
    g.fillRect(-14, 37, 28, 3);
    g.fillStyle(0xd75b7a, 1);
    g.fillRect(-20, 2, 40, 30);
    g.fillRect(-27, 17, 7, 12);
    g.fillRect(20, 17, 7, 12);
    g.fillStyle(0xef7e91, 1);
    g.fillRect(-15, 5, 30, 22);
    g.fillStyle(0xc85d78, 1);
    g.fillRect(-14, 20, 28, 7);
    g.fillStyle(0xffd1ad, 1);
    g.fillRect(-14, -30, 28, 26);
    g.fillStyle(0x75483e, 1);
    g.fillRect(-19, -37, 38, 10);
    g.fillRect(-22, -31, 8, 32);
    g.fillRect(14, -31, 8, 36);
    g.fillRect(-16, -41, 30, 6);
    g.fillStyle(0x9b6552, 1);
    g.fillRect(-11, -35, 13, 3);
    g.fillStyle(0x2d3851, 1);
    g.fillRect(-9, -18, 4, 5);
    g.fillRect(5, -18, 4, 5);
    g.fillStyle(0xb84f68, 1);
    g.fillRect(-5, -9, 10, 3);
    g.fillStyle(0xfff3db, 1);
    g.fillRect(-5, 7, 10, 8);
    g.fillStyle(0xf0b3bd, 1);
    g.fillRect(-14, 27, 28, 5);
    g.fillStyle(0x24324a, 1);
    g.fillRect(-8, 31, 6, 6);
    g.fillRect(2, 31, 6, 6);

    // A tiny microphone makes the LIVE character easy to identify.
    g.fillStyle(0x24324a, 1);
    g.fillRect(24, -2, 4, 17);
    g.fillRect(21, 14, 10, 3);
    g.fillStyle(0xffd36e, 1);
    g.fillRect(22, -7, 8, 7);
  }

  private drawBot(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x29394c, 0.42);
    g.fillRect(-23, 29, 46, 7);
    g.fillStyle(0x24324a, 1);
    g.fillRect(-23, -22, 46, 49);
    g.fillRect(-18, -28, 36, 6);
    g.fillStyle(0x6dc9d3, 1);
    g.fillRect(-18, -17, 36, 39);
    g.fillStyle(0xf0f3df, 1);
    g.fillRect(-14, -13, 28, 21);
    g.fillStyle(0x24324a, 1);
    g.fillRect(-10, -8, 5, 5);
    g.fillRect(5, -8, 5, 5);
    g.fillRect(-7, 1, 14, 3);
    g.fillStyle(0x6d62c8, 1);
    g.fillRect(-29, -9, 6, 18);
    g.fillRect(23, -9, 6, 18);
    g.fillStyle(0xffd66e, 1);
    g.fillRect(-3, -37, 6, 9);
    g.fillRect(-6, -41, 12, 4);
    g.fillStyle(0x24324a, 1);
    g.fillRect(-16, 26, 11, 7);
    g.fillRect(5, 26, 11, 7);
    g.fillStyle(0xb1e8df, 1);
    g.fillRect(-11, -12, 8, 3);
  }
}
