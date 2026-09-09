import Phaser from "phaser";
import type { ArcadeGame } from "../../data/games";

export class ArcadeMachine extends Phaser.GameObjects.Container {
  public readonly gameData: ArcadeGame;
  private readonly collisionBox: Phaser.Geom.Rectangle;

  public constructor(scene: Phaser.Scene, gameData: ArcadeGame, x: number, y: number) {
    super(scene, x, y);
    this.gameData = gameData;
    this.collisionBox = new Phaser.Geom.Rectangle(x - 42, y - 42, 84, 88);
    this.setSize(88, 102);
    this.setDepth(y + 32);

    const g = new Phaser.GameObjects.Graphics(scene);
    g.fillStyle(0x29394c, 0.42);
    g.fillRect(-43, 45, 86, 7);
    g.fillStyle(0x24324a, 1);
    g.fillRect(-41, -44, 82, 89);
    g.fillStyle(0x395774, 1);
    g.fillRect(-36, -38, 72, 78);
    g.fillStyle(gameData.accent, 1);
    g.fillRect(-36, -38, 72, 11);
    g.fillStyle(0xe8efdd, 1);
    g.fillRect(-31, -23, 62, 35);
    g.fillStyle(0x203b58, 1);
    g.fillRect(-27, -19, 54, 27);
    g.fillStyle(gameData.accent, 0.32);
    g.fillRect(-23, -16, 46, 21);
    g.fillStyle(0xb1e8df, 0.75);
    g.fillRect(-21, -14, 17, 4);
    this.drawIcon(g, gameData.icon, gameData.accent);
    g.fillStyle(0x24324a, 1);
    g.fillRect(-27, 19, 20, 5);
    g.fillRect(7, 19, 20, 5);
    g.fillStyle(0x66869a, 1);
    g.fillRect(-36, 27, 72, 13);
    g.fillStyle(0x24324a, 1);
    g.fillRect(-24, 30, 48, 5);
    g.fillStyle(gameData.accent, 1);
    g.fillRect(-16, 38, 10, 5);
    g.fillRect(6, 38, 10, 5);
    g.fillStyle(0xffd66e, 1);
    g.fillRect(-15, 31, 4, 3);
    g.fillStyle(0x24324a, 1);
    g.fillRect(-34, 39, 9, 6);
    g.fillRect(25, 39, 9, 6);
    this.add(g);

    const label = new Phaser.GameObjects.Text(scene, 0, 57, gameData.machineLabel, {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#fff2d0",
      fontStyle: "bold",
      letterSpacing: 1,
    });
    label.setOrigin(0.5);
    this.add(label);

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

  private drawIcon(g: Phaser.GameObjects.Graphics, icon: ArcadeGame["icon"], accent: number): void {
    g.lineStyle(2, accent, 1);
    if (icon === "grid") {
      g.strokeRect(-17, -11, 12, 9);
      g.strokeRect(5, -11, 12, 9);
      g.strokeRect(-17, 3, 12, 9);
      g.strokeRect(5, 3, 12, 9);
    } else if (icon === "cut") {
      g.lineBetween(-16, 11, 14, -12);
      g.fillStyle(accent, 1);
      g.fillRect(-19, 8, 7, 7);
      g.fillRect(11, -15, 7, 7);
    } else if (icon === "color") {
      g.fillStyle(0xf28b75, 1);
      g.fillRect(-17, -11, 12, 12);
      g.fillStyle(0x67c8df, 1);
      g.fillRect(5, -11, 12, 12);
      g.fillStyle(0x9b8ce9, 1);
      g.fillRect(-6, 4, 12, 12);
    } else {
      g.strokeRect(-17, -11, 17, 19);
      g.strokeRect(0, -11, 17, 19);
      g.fillStyle(accent, 1);
      g.fillRect(-3, -4, 6, 6);
    }
  }
}
